'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { CallProvider } from '@/contexts/CallContext';
import NotificationPrompt from '@/components/NotificationPrompt';
import PermissionsOnboarding from '@/components/PermissionsOnboarding';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('monm_token');
    const u = localStorage.getItem('monm_user');
    if (!t || !u) {
      router.replace('/');
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--inbox-bg-secondary)' }}>
        <div className="font-medium animate-pulse" style={{ color: 'var(--inbox-blue)' }}>Loading…</div>
      </div>
    );
  }

  return (
    <WebSocketProvider>
      <CallProvider>
        <AppShell>
          {children}
        </AppShell>
        <NotificationPrompt />
        <PermissionsOnboarding />
      </CallProvider>
    </WebSocketProvider>
  );
}
