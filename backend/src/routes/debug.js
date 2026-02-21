import { Router } from 'express';
import { getDb } from '../db/index.js';
import { sha256 } from '../crypto/index.js';

function normPhone(p) {
  return (String(p || '').replace(/\D/g, '')).slice(-15) || '';
}

const COUNTRY_PREFIXES = ['1', '92', '91', '44'];
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

// GET /api/debug/check-phones?phones=03008296335,03392003473
// Returns which numbers exist (for debugging only)
router.get('/check-phones', (req, res) => {
  try {
    const phones = (req.query.phones || '').split(',').map(p => p.trim()).filter(Boolean);
    if (phones.length === 0) return res.json({});
    const db = getDb();
    const result = {};
    for (const p of phones) {
      const norm = normPhone(p);
      if (norm.length < 10) {
        result[p] = { exists: false, reason: 'too short' };
        continue;
      }
      const variants = phoneHashVariants(p);
      const placeholders = variants.map(() => '?').join(',');
      const row = db.prepare(
        `SELECT id, name FROM users WHERE phone_hash IN (${placeholders})`
      ).get(...variants);
      result[p] = row ? { exists: true, name: row.name } : { exists: false };
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
