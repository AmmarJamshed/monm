import Database from 'better-sqlite3';
import fs from 'fs';
import { config } from '../src/config/index.js';

if (!fs.existsSync(config.dbPath)) {
  console.log('No database found. Run db:init first.');
  process.exit(0);
}

const db = new Database(config.dbPath);

const cols = db.prepare('PRAGMA table_info(users)').all();
const hasUsername = cols.some(c => c.name === 'username');
const hasUsernameHash = cols.some(c => c.name === 'username_hash');

if (!hasUsername) {
  db.exec('ALTER TABLE users ADD COLUMN username TEXT');
  console.log('Added username column');
}
if (!hasUsernameHash) {
  db.exec('ALTER TABLE users ADD COLUMN username_hash TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_hash ON users(username_hash) WHERE username_hash IS NOT NULL');
  console.log('Added username_hash column');
}

console.log('Migration complete');
db.close();
