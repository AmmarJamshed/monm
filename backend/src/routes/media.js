import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { config } from '../config/index.js';
import { sha256Buffer } from '../crypto/index.js';
import * as blockchain from '../blockchain/index.js';

const router = Router();
router.use(authMiddleware);

const uploadDir = config.uploadPath;
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = (file.originalname?.match(/\.[^.]+$/) || ['.bin'])[0];
    cb(null, `${uuidv4()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, true),
});

/** POST upload file - returns media_id for use in send message */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { conversationId } = req.body || {};
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
    const db = getDb();
    const participant = db.prepare(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
    ).get(conversationId, req.userId);
    if (!participant) return res.status(403).json({ error: 'Not in conversation' });
    const mediaId = uuidv4();
    const buf = fs.readFileSync(req.file.path);
    const fingerprintHash = sha256Buffer(buf).toString('hex');
    const fpTx = await blockchain.registerFingerprint(fingerprintHash, '');
    const ext = path.extname(req.file.originalname || req.file.filename) || '.bin';
    const storedName = `${mediaId}${ext}`;
    const filePath = path.join(uploadDir, storedName);
    fs.renameSync(req.file.path, filePath);
    const mime = req.file.mimetype || 'application/octet-stream';
    const mediaType = mime.startsWith('image/') ? 'image' : 'file';
    db.prepare(`
      INSERT INTO media (id, owner_id, fingerprint_hash, mime_type, file_path, blockchain_tx)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(mediaId, req.userId, fingerprintHash, mime, storedName, fpTx);
    res.json({ media_id: mediaId, fingerprint_hash: fingerprintHash, mime_type: mime, media_type: mediaType });
  } catch (e) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: e.message });
  }
});

/** GET files shared by current user in a conversation (must be before :mediaId) */
router.get('/shared-files', (req, res) => {
  try {
    const { conversationId } = req.query;
    if (!conversationId) return res.status(400).json({ error: 'conversationId required' });
    const db = getDb();
    const participant = db.prepare(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
    ).get(conversationId, req.userId);
    if (!participant) return res.status(403).json({ error: 'Not in conversation' });
    const rows = db.prepare(`
      SELECT m.id, m.mime_type, m.kill_switch_active, m.message_id, msg.created_at
      FROM media m
      JOIN messages msg ON msg.id = m.message_id
      WHERE msg.conversation_id = ? AND m.owner_id = ? AND m.message_id IS NOT NULL
      ORDER BY msg.created_at DESC
    `).all(conversationId, req.userId);
    res.json(rows.map(r => ({
      id: r.id,
      mime_type: r.mime_type,
      kill_switch_active: r.kill_switch_active === 1,
      message_id: r.message_id,
      created_at: r.created_at,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET serve media file - user must be owner or in the conversation */
router.get('/:mediaId/blob', (req, res) => {
  try {
    const { mediaId } = req.params;
    const db = getDb();
    const media = db.prepare('SELECT m.file_path, m.mime_type, m.message_id, m.kill_switch_active, m.owner_id FROM media m WHERE m.id = ?').get(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    if (media.kill_switch_active === 1) return res.status(410).send('Content disabled');
    if (!media.file_path) return res.status(404).json({ error: 'File not stored' });
    if (media.owner_id === req.userId) {
      // Owner can always access
    } else if (media.message_id) {
      const msg = db.prepare('SELECT conversation_id FROM messages WHERE id = ?').get(media.message_id);
      const participant = msg ? db.prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?').get(msg.conversation_id, req.userId) : null;
      if (!participant) return res.status(403).json({ error: 'Access denied' });
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }
    const fullPath = path.join(uploadDir, media.file_path);
    if (!fs.existsSync(fullPath)) return res.status(404).json({ error: 'File not found' });
    res.setHeader('Content-Type', media.mime_type || 'application/octet-stream');
    res.sendFile(path.resolve(fullPath));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET killed fingerprint hashes - client checks before rendering media */
router.get('/killed-fingerprints', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      'SELECT fingerprint_hash FROM media WHERE kill_switch_active = 1'
    ).all();
    res.json(rows.map(r => r.fingerprint_hash));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET check if user has forward permission for message (must be before :mediaId) */
router.get('/can-forward/:messageId', (req, res) => {
  try {
    const { messageId } = req.params;
    const db = getDb();
    const msg = db.prepare('SELECT sender_id FROM messages WHERE id = ?').get(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.sender_id === req.userId) return res.json({ allowed: true });
    const pr = db.prepare(
      'SELECT status FROM permission_requests WHERE message_id = ? AND requester_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1'
    ).get(messageId, req.userId, 'forward');
    res.json({ allowed: pr?.status === 'granted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST request forward permission for a message */
router.post('/messages/:messageId/request-forward', (req, res) => {
  try {
    const { messageId } = req.params;
    const db = getDb();
    const msg = db.prepare(
      'SELECT id, sender_id FROM messages WHERE id = ?'
    ).get(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.sender_id === req.userId) return res.status(400).json({ error: 'Cannot request forward of your own message' });
    const existing = db.prepare(
      'SELECT id FROM permission_requests WHERE message_id = ? AND requester_id = ? AND type = ? AND status = ?'
    ).get(messageId, req.userId, 'forward', 'pending');
    if (existing) return res.status(400).json({ error: 'Request already pending' });
    const id = uuidv4();
    db.prepare(`
      INSERT INTO permission_requests (id, message_id, requester_id, owner_id, type, status)
      VALUES (?, ?, ?, ?, 'forward', 'pending')
    `).run(id, messageId, req.userId, msg.sender_id);
    res.json({ id, status: 'pending' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST grant/deny forward permission (called by message owner) */
router.post('/messages/:messageId/grant-forward', (req, res) => {
  try {
    const { messageId } = req.params;
    const { granted } = req.body;
    const db = getDb();
    const msg = db.prepare(
      'SELECT id, sender_id FROM messages WHERE id = ?'
    ).get(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.sender_id !== req.userId) return res.status(403).json({ error: 'Only the sender can grant permission' });
    db.prepare(
      'UPDATE permission_requests SET status = ? WHERE message_id = ? AND type = ? AND status = ?'
    ).run(granted ? 'granted' : 'denied', messageId, 'forward', 'pending');
    res.json({ status: granted ? 'granted' : 'denied' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST request download permission for media */
router.post('/:mediaId/request-download', (req, res) => {
  try {
    const { mediaId } = req.params;
    const db = getDb();
    const media = db.prepare(
      'SELECT id, owner_id, message_id FROM media WHERE id = ?'
    ).get(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    if (media.owner_id === req.userId) return res.status(400).json({ error: 'You own this media' });
    const existing = db.prepare(
      'SELECT id FROM permission_requests WHERE media_id = ? AND requester_id = ? AND type = ? AND status = ?'
    ).get(mediaId, req.userId, 'download', 'pending');
    if (existing) return res.status(400).json({ error: 'Request already pending' });
    const id = uuidv4();
    db.prepare(`
      INSERT INTO permission_requests (id, message_id, media_id, requester_id, owner_id, type, status)
      VALUES (?, ?, ?, ?, ?, 'download', 'pending')
    `).run(id, media.message_id, mediaId, req.userId, media.owner_id);
    res.json({ id, status: 'pending' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST grant/deny download permission (called by media owner) */
router.post('/:mediaId/grant-download', (req, res) => {
  try {
    const { mediaId } = req.params;
    const { granted } = req.body;
    const db = getDb();
    const media = db.prepare(
      'SELECT id, owner_id FROM media WHERE id = ?'
    ).get(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    if (media.owner_id !== req.userId) return res.status(403).json({ error: 'Only the owner can grant permission' });
    db.prepare(
      'UPDATE permission_requests SET status = ? WHERE media_id = ? AND type = ? AND status = ?'
    ).run(granted ? 'granted' : 'denied', mediaId, 'download', 'pending');
    res.json({ status: granted ? 'granted' : 'denied' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST activate kill switch (owner or leak detection) */
router.post('/:mediaId/kill', async (req, res) => {
  try {
    const { mediaId } = req.params;
    const db = getDb();
    const media = db.prepare(
      'SELECT id, owner_id, fingerprint_hash FROM media WHERE id = ?'
    ).get(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    if (media.owner_id !== req.userId) return res.status(403).json({ error: 'Only the owner can activate kill switch' });
    db.prepare('UPDATE media SET kill_switch_active = 1 WHERE id = ?').run(mediaId);
    if (media.fingerprint_hash) {
      await blockchain.killFingerprint(media.fingerprint_hash);
    }
    res.json({ activated: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** POST perform forward (only if permission granted) */
router.post('/messages/:messageId/forward', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { targetConversationId } = req.body;
    if (!targetConversationId) return res.status(400).json({ error: 'targetConversationId required' });
    const db = getDb();
    const msg = db.prepare(
      'SELECT id, conversation_id, sender_id, payload_encrypted, iv, auth_tag FROM messages WHERE id = ?'
    ).get(messageId);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    const participant = db.prepare(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
    ).get(targetConversationId, req.userId);
    if (!participant) return res.status(403).json({ error: 'Not in target conversation' });
    if (msg.sender_id === req.userId) {
      // Owner can always forward
    } else {
      const pr = db.prepare(
        'SELECT status FROM permission_requests WHERE message_id = ? AND requester_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1'
      ).get(messageId, req.userId, 'forward');
      if (pr?.status !== 'granted') return res.status(403).json({ error: 'Forward permission not granted' });
    }
    const id = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, payload_encrypted, iv, auth_tag)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      targetConversationId,
      req.userId,
      msg.payload_encrypted,
      msg.iv,
      msg.auth_tag
    );
    const traceTx = await blockchain.traceForward(
      messageId.replace(/-/g, ''),
      id.replace(/-/g, ''),
      true
    );
    res.json({ id, blockchain_tx: traceTx });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/** GET check if user has download permission for media (must be before :mediaId) */
router.get('/can-download/:mediaId', (req, res) => {
  try {
    const { mediaId } = req.params;
    const db = getDb();
    const media = db.prepare('SELECT owner_id FROM media WHERE id = ?').get(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    if (media.owner_id === req.userId) return res.json({ allowed: true });
    const pr = db.prepare(
      'SELECT status FROM permission_requests WHERE media_id = ? AND requester_id = ? AND type = ? ORDER BY created_at DESC LIMIT 1'
    ).get(mediaId, req.userId, 'download');
    res.json({ allowed: pr?.status === 'granted' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
