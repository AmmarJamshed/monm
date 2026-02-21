import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT c.id, c.type, c.created_at, 
             (SELECT json_group_array(json_object('id', u2.id, 'name', u2.name)) 
              FROM conversation_participants cp2 
              JOIN users u2 ON u2.id = cp2.user_id 
              WHERE cp2.conversation_id = c.id) as participants
      FROM conversations c
      WHERE c.id IN (
        SELECT conversation_id FROM conversation_participants WHERE user_id = ?
      )
      ORDER BY (SELECT MAX(created_at) FROM messages WHERE conversation_id = c.id) DESC
    `).all(req.userId);
    res.json(rows.map(r => ({ ...r, participants: JSON.parse(r.participants || '[]') })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/create', (req, res) => {
  try {
    const { participantIds } = req.body;
    const ids = [req.userId, ...(participantIds || [])].filter((v, i, a) => a.indexOf(v) === i);
    if (ids.length < 2) return res.status(400).json({ error: 'Need at least 2 participants' });
    const db = getDb();
    for (const uid of ids) {
      const u = db.prepare('SELECT 1 FROM users WHERE id = ?').get(uid);
      if (!u) {
        return res.status(400).json({
          error: 'That contact is no longer on MonM (database may have reset). Ask them to sign in again, then search for them again.',
        });
      }
    }
    const id = uuidv4();
    db.prepare('INSERT INTO conversations (id, type) VALUES (?, ?)').run(id, ids.length === 2 ? 'direct' : 'group');
    for (const uid of ids) {
      db.prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)').run(id, uid);
    }
    res.json({ id, type: ids.length === 2 ? 'direct' : 'group' });
  } catch (e) {
    if (e.message && e.message.includes('FOREIGN KEY')) {
      return res.status(400).json({
        error: 'That contact is no longer on MonM (database may have reset). Ask them to sign in again, then search for them again.',
      });
    }
    res.status(500).json({ error: e.message });
  }
});

export default router;
