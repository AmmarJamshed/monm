import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/index.js';
import { config } from '../config/index.js';
import { sha256 } from '../crypto/index.js';

const router = Router();

router.post('/signup', (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone required' });
    }
    const id = uuidv4();
    const phoneHash = sha256(phone.trim().toLowerCase());
    const db = getDb();
    db.prepare(`
      INSERT INTO users (id, name, phone, phone_hash) VALUES (?, ?, ?, ?)
    `).run(id, name.trim(), phone.trim(), phoneHash);
    const token = jwt.sign(
      { userId: id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id, name: name.trim(), phone: phone.trim() } });
  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT' && e.message.includes('phone_hash')) {
      return res.status(409).json({ error: 'Phone already registered' });
    }
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    const phoneHash = sha256(phone.trim().toLowerCase());
    const db = getDb();
    const user = db.prepare('SELECT id, name, phone FROM users WHERE phone_hash = ?').get(phoneHash);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = jwt.sign(
      { userId: user.id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
    res.json({ token, user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
