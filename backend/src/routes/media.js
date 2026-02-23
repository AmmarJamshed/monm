import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import * as blockchain from '../blockchain/index.js';

const router = Router();
router.use(authMiddleware);

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
router.post('/:mediaId/kill', (req, res) => {
  try {
    const { mediaId } = req.params;
    const db = getDb();
    const media = db.prepare(
      'SELECT id, owner_id, fingerprint_hash FROM media WHERE id = ?'
    ).get(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    if (media.owner_id !== req.userId) return res.status(403).json({ error: 'Only the owner can activate kill switch' });
    db.prepare('UPDATE media SET kill_switch_active = 1 WHERE id = ?').run(mediaId);
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
