import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { config } from '../config/index.js';
import { sha256 } from '../crypto/index.js';

const router = Router();

function norm(s) {
  return (s || '').trim().toLowerCase();
}
function normPhone(p) {
  return (String(p || '').replace(/\D/g, '')).slice(-15) || '';
}

router.post('/signup', (req, res) => {
  try {
    const { name, phone, username } = req.body;
    if (!name || (!phone && !username)) {
      return res.status(400).json({ error: 'Name and either phone or username required' });
    }

    const db = getDb();
    const id = uuidv4();

    if (phone) {
      const phoneNorm = normPhone(phone);
      if (phoneNorm.length < 10) return res.status(400).json({ error: 'Valid phone number required (10+ digits)' });
      const phoneHash = sha256(phoneNorm);
      const existing = db.prepare('SELECT 1 FROM users WHERE phone_hash IN (?, ?)').get(phoneHash, sha256(norm(phone)));
      if (existing) return res.status(409).json({ error: 'Phone already registered' });
      const nameTrim = name.trim();
      db.prepare(`
        INSERT INTO users (id, name, phone, phone_hash) VALUES (?, ?, ?, ?)
      `).run(id, nameTrim, phoneNorm, phoneHash);
      const token = jwt.sign({ userId: id }, config.jwtSecret, { expiresIn: '7d' });
      return res.json({ token, user: { id, name: nameTrim, phone: phoneNorm, username: null } });
    }

    const userTrim = norm(username);
    if (userTrim.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (!/^[a-z0-9_-]+$/.test(userTrim)) {
      return res.status(400).json({ error: 'Username: letters, numbers, underscore, hyphen only' });
    }
    const usernameHash = sha256(userTrim);
    const nameTrim = name.trim();
    const phonePlaceholder = '';
    const phoneHashPlaceholder = sha256('username:' + userTrim);
    db.prepare(`
      INSERT INTO users (id, name, phone, phone_hash, username, username_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, nameTrim, phonePlaceholder, phoneHashPlaceholder, userTrim, usernameHash);
    const token = jwt.sign({ userId: id }, config.jwtSecret, { expiresIn: '7d' });
    return res.json({ token, user: { id, name: nameTrim, phone: null, username: userTrim } });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT') {
      if (e.message.includes('phone_hash')) return res.status(409).json({ error: 'Phone already registered' });
      if (e.message.includes('username_hash')) return res.status(409).json({ error: 'Username already taken' });
    }
    return res.status(500).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { phone, username } = req.body;
    if (!phone && !username) return res.status(400).json({ error: 'Phone or username required' });

    const db = getDb();
    let user;

    if (phone) {
      const phoneNorm = normPhone(phone);
      if (phoneNorm.length < 10) return res.status(400).json({ error: 'Valid phone number required' });
      const phoneHashNorm = sha256(phoneNorm);
      const phoneHashLegacy = sha256(norm(phone));
      user = db.prepare('SELECT id, name, phone, username FROM users WHERE phone_hash = ?').get(phoneHashNorm)
        || db.prepare('SELECT id, name, phone, username FROM users WHERE phone_hash = ?').get(phoneHashLegacy);
    } else {
      const usernameHash = sha256(norm(username));
      user = db.prepare('SELECT id, name, phone, username FROM users WHERE username_hash = ?').get(usernameHash);
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = jwt.sign({ userId: user.id }, config.jwtSecret, { expiresIn: '7d' });
    const out = {
      id: user.id,
      name: user.name,
      phone: user.phone || null,
      username: user.username || null,
    };
    return res.json({ token, user: out });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
