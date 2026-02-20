import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);
    const db = getDb();
    const rows = db.prepare(`
      SELECT id, name, phone FROM users
      WHERE id != ? AND (name LIKE ? OR phone LIKE ?)
      LIMIT 20
    `).all(req.userId, `%${q}%`, `%${q}%`);
    res.json(rows.map(r => ({ id: r.id, name: r.name })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
