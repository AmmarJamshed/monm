'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketContext';
import { useCall } from '@/hooks/useCall';

type CallContextValue = {
  startCall: (targetId: string, targetName: string, video: boolean) => void;
};

const CallContext = createContext<CallContextValue | null>(null);

function getInitialUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('monm_user');
    return u ? JSON.parse(u).id : null;
  } catch {
    return null;
  }
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(getInitialUserId);
  const { subscribe, send: wsSend } = useWebSocket();
  const { startCall, CallModalComponent } = useCall(userId, wsSend, subscribe);

  useEffect(() => {
    try {
      const u = localStorage.getItem('monm_user');
      setUserId(u ? JSON.parse(u).id : null);
    } catch {
      setUserId(null);
    }
  }, []);

  return (
    <CallContext.Provider value={{ startCall }}>
      {children}
      {CallModalComponent}
    </CallContext.Provider>
  );
}

export function useCallContext() {
  const ctx = useContext(CallContext);
  return ctx ?? { startCall: () => {} };
}
