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

const PING_INTERVAL_MS = 25000; // Keep connection alive (many proxies timeout at 30–60s)
const RECONNECT_DELAYS = [500, 1500, 3000, 5000, 10000]; // Exponential backoff

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const handlersRef = useRef<Set<MessageHandler>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('monm_token') : null;
    if (!token) return;

    let socket: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const clearPing = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };

    const connect = () => {
      socket = createWS(token);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!mountedRef.current) return;
        reconnectAttemptRef.current = 0;
        setWs(socket);
        clearPing();
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL_MS);
      };

      socket.onclose = () => {
        wsRef.current = null;
        setWs(null);
        clearPing();
        if (!mountedRef.current) return;
        const delay = RECONNECT_DELAYS[Math.min(reconnectAttemptRef.current, RECONNECT_DELAYS.length - 1)];
        reconnectAttemptRef.current += 1;
        reconnectTimeout = setTimeout(connect, delay);
      };

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as WSMessage;
          handlersRef.current.forEach((h) => h(data));
        } catch {}
      };

      socket.onerror = () => {}; // Close will fire after error
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      clearPing();
      socket?.close();
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
