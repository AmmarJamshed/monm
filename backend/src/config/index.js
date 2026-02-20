import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monmRoot = path.resolve(__dirname, '../../../');
dotenv.config({ path: path.join(monmRoot, '.env') });

const DATA_ROOT = process.env.DATA_ROOT || 'D:\\monm';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  wsPort: parseInt(process.env.WS_PORT || '3002', 10),
  pwaUrl: process.env.PWA_URL || 'http://localhost:3000',
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [process.env.PWA_URL || 'http://localhost:3000'],
  dbPath: process.env.DB_PATH || path.join(DATA_ROOT, 'db', 'monm.db'),
  logPath: process.env.LOG_PATH || path.join(DATA_ROOT, 'logs'),
  uploadPath: process.env.UPLOAD_PATH || path.join(DATA_ROOT, 'uploads'),
  tmpPath: process.env.TMP_PATH || path.join(DATA_ROOT, 'tmp'),
  keysPath: process.env.KEYS_PATH || path.join(DATA_ROOT, 'keys'),
  polygon: {
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://rpc-amoy.polygon.technology',
    rpcKey: process.env.POLYGON_RPC_KEY,
    chainId: parseInt(process.env.POLYGON_CHAIN_ID || '80002', 10),
  },
  web3Storage: {
    token: process.env.WEB3_STORAGE_TOKEN,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
  },
  serp: {
    apiKey: process.env.SERP_API_KEY,
  },
  jwtSecret: process.env.JWT_SECRET || 'monm-dev-secret-change-in-production',
};

// Ensure all data directories exist under D:\monm
[config.logPath, config.uploadPath, config.tmpPath, config.keysPath, path.dirname(config.dbPath)].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
