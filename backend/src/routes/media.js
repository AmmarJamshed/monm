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

/** GET protected download - HTML with embedded fingerprint + content; checks API when opened, blocks if killed */
router.get('/:mediaId/protected-download', (req, res) => {
  try {
    const { mediaId } = req.params;
    const db = getDb();
    const media = db.prepare(
      'SELECT m.file_path, m.mime_type, m.message_id, m.kill_switch_active, m.owner_id, m.fingerprint_hash FROM media m WHERE m.id = ?'
    ).get(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });
    if (media.kill_switch_active === 1) return res.status(410).send('Content disabled');
    if (!media.file_path || !media.fingerprint_hash) return res.status(404).json({ error: 'File not stored or no fingerprint' });
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
    const buf = fs.readFileSync(fullPath);
    const maxSize = 8 * 1024 * 1024; // 8MB raw
    if (buf.length > maxSize) return res.status(413).json({ error: 'File too large for protected download (max 8MB)' });
    const base64 = buf.toString('base64');
    const fp = media.fingerprint_hash.toLowerCase();
    const apiBase = process.env.API_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
    const mime = (media.mime_type || 'application/octet-stream').toLowerCase();
    const isImage = mime.startsWith('image/');
    const isPdf = mime.includes('pdf');
    const ext = path.extname(media.file_path) || '.bin';
    const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MonM Protected File</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;min-height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column;padding:1rem}
.killed{color:#f87171;text-align:center;max-width:24rem}
.content img{max-width:100%;max-height:90vh;object-fit:contain}
.content embed{width:100%;height:90vh}
.dl{display:inline-block;margin-top:1rem;padding:.5rem 1rem;background:#3b82f6;color:#fff;border-radius:.5rem;text-decoration:none}
.dl:hover{background:#2563eb}</style>
</head>
<body>
<div id="status" class="killed" style="display:none">
  <p style="font-size:1.25rem;font-weight:600">Content disabled</p>
  <p style="font-size:.875rem;opacity:.8">Kill switch activated. This file is no longer viewable.</p>
</div>
<div id="content" class="content" style="display:none"></div>
<script>
(function(){
var fp="${fp}";
var api="${apiBase}";
var b64="${base64}";
var mime="${mime.replace(/"/g, '\\"')}";
var isImg=${isImage};
var isPdf=${isPdf};
var ext="${ext.replace(/"/g, '\\"')}";
fetch(api+"/api/media/fingerprint/"+fp+"/killed").then(function(r){return r.json()}).then(function(d){
  if(d.killed){
    document.getElementById("status").style.display="block";
    return;
  }
  var content=document.getElementById("content");
  content.style.display="block";
  var bin=atob(b64);
  var bytes=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  var blob=new Blob([bytes],{type:mime});
  var url=URL.createObjectURL(blob);
  if(isImg){
    var img=document.createElement("img");
    img.src=url;
    img.alt="";
    content.appendChild(img);
  }else if(isPdf){
    var emb=document.createElement("embed");
    emb.src=url;
    emb.type=mime;
    content.appendChild(emb);
  }else{
    var a=document.createElement("a");
    a.href=url;
    a.download="file"+ext;
    a.className="dl";
    a.textContent="Download file";
    content.appendChild(a);
  }
}).catch(function(){document.getElementById("status").style.display="block";document.getElementById("status").innerHTML="<p>Unable to verify. Open from MonM.</p>";});
})();
</script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="monm-protected' + ext + '.html"');
    res.send(html);
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
