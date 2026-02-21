import { Router } from 'express';
import { getDb } from '../db/index.js';
import { authMiddleware } from '../middleware/auth.js';
import { sha256 } from '../crypto/index.js';

function normPhone(p) {
  return (String(p || '').replace(/\D/g, '')).slice(-15) || '';
}

// Generate hash variants for lookup (handles +92 300.. vs 0300.. vs 300..)
const COUNTRY_PREFIXES = ['1', '92', '91', '44']; // US, Pakistan, India, UK
function phoneHashVariants(p) {
  const n = normPhone(p);
  if (n.length < 10) return [];
  const hashes = [sha256(n)];
  if (n.length > 10) hashes.push(sha256(n.slice(-10)));
  if (n.length === 11 && n[0] === '0') {
    hashes.push(sha256(n.slice(1)));
    hashes.push(sha256('92' + n.slice(1)));
  }
  if (n.length === 10) {
    for (const cc of COUNTRY_PREFIXES) hashes.push(sha256(cc + n));
  }
  return [...new Set(hashes)];
}

const router = Router();
router.use(authMiddleware);

router.get('/search', (req, res) => {
  try {
    const q = (req.query.q || '').trim().replace(/^@+/, '');
    if (q.length < 1) return res.json([]);
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
    const allHashes = phones
      .map(p => normPhone(p))
      .filter(p => p.length >= 10)
      .flatMap(p => phoneHashVariants(p));
    const hashes = [...new Set(allHashes)];
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
