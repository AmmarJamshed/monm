const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export function createWS(token: string) {
  const url = `${WS_URL}/ws?token=${encodeURIComponent(token)}`;
  return new WebSocket(url);
}

export type WSMessage = 
  | { type: 'new_message'; conversationId: string; message: Record<string, unknown> }
  | { type: 'typing'; userId: string; conversationId: string }
  | { type: 'pong' };
