import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { sha256 } from '../crypto/index.js';
import * as blockchain from '../blockchain/index.js';
import { broadcastNewMessage } from '../websocket/index.js';

const router = Router();
router.use(authMiddleware);

router.get('/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    const db = getDb();
    const participant = db.prepare(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
    ).get(conversationId, req.userId);
    if (!participant) return res.status(403).json({ error: 'Not in conversation' });
    const rows = db.prepare(`
      SELECT m.id, m.sender_id, m.payload_encrypted, m.iv, m.auth_tag, m.created_at,
             med.id as media_id, med.fingerprint_hash, med.kill_switch_active
      FROM messages m
      LEFT JOIN media med ON med.message_id = m.id
      WHERE m.conversation_id = ? ORDER BY m.created_at ASC LIMIT 100
    `).all(conversationId);
    const out = rows.map(r => ({
      id: r.id,
      sender_id: r.sender_id,
      payload_encrypted: r.payload_encrypted?.toString?.('base64') ?? '',
      iv: r.iv?.toString?.('base64') ?? '',
      auth_tag: r.auth_tag?.toString?.('base64') ?? '',
      created_at: r.created_at,
      media_id: r.media_id ?? null,
      fingerprint_hash: r.fingerprint_hash ?? null,
      kill_switch_active: r.kill_switch_active === 1,
    }));
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { conversationId, payloadEncrypted, iv, authTag, fingerprintHash, mediaType, mimeType, mediaId: existingMediaId } = req.body;
    if (!conversationId || !payloadEncrypted || !iv || !authTag) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const db = getDb();
    const participant = db.prepare(
      'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ?'
    ).get(conversationId, req.userId);
    if (!participant) return res.status(403).json({ error: 'Not in conversation' });
    const id = uuidv4();
    const msgHash = sha256(payloadEncrypted + iv + authTag);
    const txHash = await blockchain.logMessageHash(id.replace(/-/g, ''), msgHash);
    db.prepare(`
      INSERT INTO messages (id, conversation_id, sender_id, payload_encrypted, iv, auth_tag, blockchain_tx)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id, conversationId, req.userId,
      Buffer.from(payloadEncrypted, 'base64'),
      Buffer.from(iv, 'base64'),
      Buffer.from(authTag, 'base64'),
      txHash
    );
    let mediaId = existingMediaId || null;
    if (existingMediaId) {
      db.prepare('UPDATE media SET message_id = ? WHERE id = ? AND owner_id = ?').run(id, existingMediaId, req.userId);
    } else if (fingerprintHash && (mediaType === 'image' || mediaType === 'file')) {
      mediaId = uuidv4();
      const fpTx = await blockchain.registerFingerprint(fingerprintHash, '');
      db.prepare(`
        INSERT INTO media (id, message_id, owner_id, fingerprint_hash, mime_type, blockchain_tx)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(mediaId, id, req.userId, fingerprintHash, mimeType || (mediaType === 'image' ? 'image/jpeg' : 'application/octet-stream'), fpTx);
    }
    const row = db.prepare(
      'SELECT id, sender_id, payload_encrypted, iv, auth_tag, created_at FROM messages WHERE id = ?'
    ).get(id);
    const msg = {
      ...row,
      conversation_id: conversationId,
      payload_encrypted: row.payload_encrypted?.toString('base64'),
      iv: row.iv?.toString('base64'),
      auth_tag: row.auth_tag?.toString('base64'),
      media_id: mediaId,
    };
    broadcastNewMessage(conversationId, msg, req.userId);
    res.json(msg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
