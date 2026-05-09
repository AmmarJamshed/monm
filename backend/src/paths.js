import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monmRoot = path.resolve(__dirname, '..', '..');

function canCreateWritableDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Data root (SQLite, uploads, logs). On Render, /var/data/... is only valid with a
 * mounted disk; otherwise we use a directory under the service working directory.
 */
export function resolveDataRoot() {
  const fromEnv = process.env.DATA_ROOT?.trim();
  const renderAppLocal = path.join(process.cwd(), 'data', 'monm');

  if (process.env.RENDER === 'true') {
    if (fromEnv) {
      if (fromEnv.startsWith('/var/data')) {
        if (canCreateWritableDir(path.join(fromEnv, 'db'))) {
          return fromEnv;
        }
        return renderAppLocal;
      }
      return fromEnv;
    }
    return renderAppLocal;
  }

  if (fromEnv) return fromEnv;

  if (process.platform === 'win32') {
    return 'D:\\monm';
  }

  return path.join(monmRoot, 'data', 'monm');
}

export function resolveDbPath(dataRoot) {
  const explicit = process.env.DB_PATH?.trim();
  if (explicit) {
    const dir = path.dirname(explicit);
    if (canCreateWritableDir(dir)) {
      return path.normalize(explicit);
    }
  }
  return path.join(dataRoot, 'db', 'monm.db');
}

export function envDirOrFallback(envKey, fallbackDir) {
  const v = process.env[envKey]?.trim();
  if (!v) return fallbackDir;
  if (canCreateWritableDir(v)) return path.normalize(v);
  return fallbackDir;
}
