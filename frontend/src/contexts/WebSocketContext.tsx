'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { createWS } from '@/lib/ws';

type WSMessage = { type: string; [k: string]: unknown };
type MessageHandler = (data: WSMessage) => void;

const WebSocketContext = createContext<{
  ws: WebSocket | null;
  send: (msg: Record<string, unknown>) => void;
  subscribe: (handler: MessageHandler) => () => void;
}>({ ws: null, send: () => {}, subscribe: () => () => {} });

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const handlersRef = useRef<Set<MessageHandler>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('monm_token') : null;
    if (!token) return;
    const socket = createWS(token);
    wsRef.current = socket;
    socket.onopen = () => setWs(socket);
    socket.onclose = () => setWs(null);
    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WSMessage;
        handlersRef.current.forEach((h) => h(data));
      } catch {}
    };
    return () => {
      socket.close();
      wsRef.current = null;
      setWs(null);
    };
  }, []);

  const send = useCallback((msg: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const subscribe = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws, send, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
