import express from 'express';
import { createServer } from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { getDb } from './db/index.js';
import { initBlockchain } from './blockchain/index.js';
import authRoutes from './routes/auth.js';
import conversationRoutes from './routes/conversations.js';
import userRoutes from './routes/users.js';
import messageRoutes from './routes/messages.js';
import mediaRoutes from './routes/media.js';
import debugRoutes from './routes/debug.js';
import { initWebSocket, broadcastNewMessage } from './websocket/index.js';

const app = express();
const server = createServer(app);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (o, cb) => {
    if (!o) return cb(null, true);
    const allowed = config.corsOrigins.some((a) => o === a || o.startsWith(a));
    cb(null, allowed ? o : false);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
// Public: for embedded macros/viewers to check if a fingerprint is killed (no auth)
app.get('/api/media/fingerprint/:hash/killed', (req, res) => {
  try {
    const { hash } = req.params;
    if (!hash || !/^[a-fA-F0-9]{64}$/.test(hash)) return res.status(400).json({ error: 'Invalid fingerprint hash' });
    const db = getDb();
    const row = db.prepare(
      'SELECT 1 FROM media WHERE fingerprint_hash = ? AND kill_switch_active = 1 LIMIT 1'
    ).get(hash.toLowerCase());
    res.json({ killed: !!row });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
app.use('/api/media', mediaRoutes);
app.use('/api/debug', debugRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// WebSocket
initWebSocket(server);

// Ensure DB is ready
getDb();

server.listen(config.port, async () => {
  await initBlockchain();
  console.log(`MonM API running at http://localhost:${config.port}`);
  console.log(`WebSocket at ws://localhost:${config.port}/ws`);
});

export { broadcastNewMessage };
