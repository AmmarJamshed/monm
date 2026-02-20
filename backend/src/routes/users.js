import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { sha256 } from '../crypto/index.js';

function normPhone(p) {
  return (String(p || '').replace(/\D/g, '')).slice(-15) || '';
}

const router = Router();
router.use(authMiddleware);

router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const db = getDb();
    const like = `%${q}%`;
    const rows = db.prepare(`
      SELECT id, name, username FROM users
      WHERE id != ? AND (name LIKE ? OR phone LIKE ? OR (username IS NOT NULL AND username LIKE ?))
      LIMIT 20
    `).all(req.userId, like, like, like);
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      username: r.username || null,
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/find-by-phones', (req, res) => {
  try {
    const { phones } = req.body;
    if (!Array.isArray(phones) || phones.length === 0) {
      return res.json([]);
    }
    if (phones.length > 200) {
      return res.status(400).json({ error: 'Max 200 phones per request' });
    }
    const db = getDb();
    const hashes = phones
      .map(p => normPhone(p))
      .filter(p => p.length >= 10)
      .map(p => sha256(p));
    if (hashes.length === 0) return res.json([]);

    const placeholders = hashes.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT id, name FROM users
      WHERE id != ? AND phone_hash IN (${placeholders})
    `).all(req.userId, ...hashes);
    res.json(rows.map(r => ({ id: r.id, name: r.name })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
