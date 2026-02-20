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
      SELECT id, sender_id, payload_encrypted, iv, auth_tag, created_at
      FROM messages WHERE conversation_id = ? ORDER BY created_at ASC LIMIT 100
    `).all(conversationId);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/send', async (req, res) => {
  try {
    const { conversationId, payloadEncrypted, iv, authTag } = req.body;
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
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, conversationId, req.userId,
      Buffer.from(payloadEncrypted, 'base64'),
      Buffer.from(iv, 'base64'),
      Buffer.from(authTag, 'base64'),
      txHash
    );
    const row = db.prepare(
      'SELECT id, sender_id, payload_encrypted, iv, auth_tag, created_at FROM messages WHERE id = ?'
    ).get(id);
    const msg = {
      ...row,
      conversation_id: conversationId,
      payload_encrypted: row.payload_encrypted?.toString('base64'),
      iv: row.iv?.toString('base64'),
      auth_tag: row.auth_tag?.toString('base64'),
    };
    broadcastNewMessage(conversationId, msg, req.userId);
    res.json(msg);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
