import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_ROOT = process.env.DATA_ROOT || process.env.DB_PATH?.replace(/[\\/]monm\.db.*$/, '') || 'D:\\monm';
const DB_PATH = path.join(DATA_ROOT, 'db', 'monm.db');

// Ensure directory exists
import fs from 'fs';
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    phone_hash TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    rsa_public TEXT
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'direct',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversation_participants (
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    role TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (conversation_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id),
    sender_id TEXT NOT NULL REFERENCES users(id),
    payload_encrypted BLOB,
    iv BLOB,
    auth_tag BLOB,
    blockchain_tx TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    message_id TEXT REFERENCES messages(id),
    owner_id TEXT NOT NULL REFERENCES users(id),
    ipfs_cid TEXT,
    fingerprint_hash TEXT NOT NULL,
    mime_type TEXT,
    blockchain_tx TEXT,
    kill_switch_active INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS permission_requests (
    id TEXT PRIMARY KEY,
    message_id TEXT NOT NULL REFERENCES messages(id),
    media_id TEXT REFERENCES media(id),
    requester_id TEXT NOT NULL REFERENCES users(id),
    owner_id TEXT NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS forward_traces (
    id TEXT PRIMARY KEY,
    original_message_id TEXT NOT NULL REFERENCES messages(id),
    forwarded_by TEXT NOT NULL REFERENCES users(id),
    target_conversation_id TEXT NOT NULL REFERENCES conversations(id),
    permission_granted INTEGER DEFAULT 0,
    blockchain_tx TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leak_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    media_id TEXT REFERENCES media(id),
    source_url TEXT,
    confidence REAL,
    blockchain_tx TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scheduled_scans (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    query_hash TEXT,
    last_run DATETIME,
    next_run DATETIME,
    interval_hours INTEGER DEFAULT 24
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users(phone_hash);
  CREATE INDEX IF NOT EXISTS idx_media_message ON media(message_id);
  CREATE INDEX IF NOT EXISTS idx_media_fingerprint ON media(fingerprint_hash);
  CREATE INDEX IF NOT EXISTS idx_permission_requests_message ON permission_requests(message_id);
  CREATE INDEX IF NOT EXISTS idx_permission_requests_media ON permission_requests(media_id);
`);

console.log('Database initialized at', DB_PATH);

// Run migrations
let mediaCols = [];
try {
  mediaCols = db.prepare('PRAGMA table_info(media)').all();
} catch {}
if (mediaCols.length && !mediaCols.some(c => c.name === 'owner_id')) {
  db.exec('ALTER TABLE media ADD COLUMN owner_id TEXT REFERENCES users(id)');
}
if (mediaCols.length && !mediaCols.some(c => c.name === 'blockchain_tx')) {
  db.exec('ALTER TABLE media ADD COLUMN blockchain_tx TEXT');
}
if (mediaCols.length && !mediaCols.some(c => c.name === 'kill_switch_active')) {
  db.exec('ALTER TABLE media ADD COLUMN kill_switch_active INTEGER DEFAULT 0');
}
if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='permission_requests'").get()) {
  db.exec(`
    CREATE TABLE permission_requests (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL REFERENCES messages(id),
      media_id TEXT REFERENCES media(id),
      requester_id TEXT NOT NULL REFERENCES users(id),
      owner_id TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_permission_requests_message ON permission_requests(message_id);
    CREATE INDEX IF NOT EXISTS idx_permission_requests_media ON permission_requests(media_id);
  `);
}

const cols = db.prepare('PRAGMA table_info(users)').all();
if (!cols.some(c => c.name === 'username')) {
  db.exec('ALTER TABLE users ADD COLUMN username TEXT');
}
if (!cols.some(c => c.name === 'username_hash')) {
  db.exec('ALTER TABLE users ADD COLUMN username_hash TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_hash ON users(username_hash) WHERE username_hash IS NOT NULL');
}

db.close();
