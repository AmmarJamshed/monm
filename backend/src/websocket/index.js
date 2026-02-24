import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { getDb } from '../db/index.js';

let wss = null;
const connections = new Map(); // userId -> Set<WebSocket>

export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
      ws.close(1008, 'No token');
      return;
    }
    try {
      const { userId } = jwt.verify(token, config.jwtSecret);
      if (!connections.has(userId)) connections.set(userId, new Set());
      connections.get(userId).add(ws);
      ws.userId = userId;
      ws.on('close', () => {
        connections.get(userId)?.delete(ws);
        if (connections.get(userId)?.size === 0) connections.delete(userId);
      });
      ws.on('message', (data) => handleMessage(userId, ws, data));
    } catch {
      ws.close(1008, 'Invalid token');
    }
  });
  return wss;
}

function handleMessage(userId, ws, data) {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
      return;
    }
    if (msg.type === 'typing') {
      broadcastToConversation(msg.conversationId, userId, { type: 'typing', userId, conversationId: msg.conversationId });
      return;
    }
    if (msg.type === 'call_request') {
      const { to, fromName, conversationId, isVideo, offer } = msg;
      if (to && to !== userId) {
        broadcastToUser(to, { type: 'call_request', from: userId, fromName: fromName || 'Someone', to, conversationId, isVideo, offer });
      }
      return;
    }
    if (msg.type === 'call_answer' || msg.type === 'call_reject' || msg.type === 'call_hangup') {
      const { to, answer } = msg;
      if (to) broadcastToUser(to, { ...msg, from: userId });
      return;
    }
    if (msg.type === 'ice_candidate') {
      const { to, candidate } = msg;
      if (to) broadcastToUser(to, { type: 'ice_candidate', from: userId, candidate });
      return;
    }
  } catch {}
}

export function broadcastToUser(userId, payload) {
  const set = connections.get(userId);
  if (!set) return;
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  set.forEach(ws => { if (ws.readyState === 1) ws.send(str); });
}

export function broadcastToConversation(conversationId, excludeUserId, payload) {
  const db = getDb();
  const participants = db.prepare(
    'SELECT user_id FROM conversation_participants WHERE conversation_id = ?'
  ).all(conversationId);
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  for (const { user_id } of participants) {
    if (user_id === excludeUserId) continue;
    const set = connections.get(user_id);
    if (set) set.forEach(ws => { if (ws.readyState === 1) ws.send(str); });
  }
}

export function broadcastNewMessage(conversationId, message, senderId) {
  broadcastToConversation(conversationId, senderId, {
    type: 'new_message',
    conversationId,
    message: {
      ...message,
      payload_encrypted: message.payload_encrypted?.toString?.('base64') || message.payload_encrypted,
      iv: message.iv?.toString?.('base64') || message.iv,
      auth_tag: message.auth_tag?.toString?.('base64') || message.auth_tag,
    },
  });
}
