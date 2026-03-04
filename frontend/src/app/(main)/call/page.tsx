'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMediaStreamWithFallback } from '@/lib/mediaPermissions';

function CallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withId = searchParams.get('with');
  const [micStatus, setMicStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle');
  const [permissionMsg, setPermissionMsg] = useState<string>('');

  useEffect(() => {
    const t = localStorage.getItem('monm_token');
    const u = localStorage.getItem('monm_user');
    if (!t || !u) router.replace('/');
  }, [router]);

  const requestMicPermission = async () => {
    setMicStatus('requesting');
    setPermissionMsg('');
    const result = await getMediaStreamWithFallback(true, false);
    if ('stream' in result) {
      result.stream.getTracks().forEach((t) => t.stop());
      setMicStatus('granted');
      setPermissionMsg('Microphone permission granted. Voice calls will be available soon.');
    } else {
      setMicStatus('denied');
      setPermissionMsg(result.error);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <h1 className="font-display text-xl font-semibold mb-2 text-[var(--wa-text)]">
        {withId ? 'Voice Call' : 'Voice Call'}
      </h1>
      <p className="text-sm mb-6 text-[var(--wa-text-muted)]">
        {withId ? 'Prepare to call this contact. ' : ''}Allow microphone access to enable voice calls.
      </p>
      <div className="rounded-xl p-6 border max-w-md bg-white border-[var(--wa-border)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[var(--wa-accent)]/15">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[var(--wa-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-[var(--wa-text)]">Microphone</p>
            <p className="text-sm text-[var(--wa-text-muted)]">Required for voice calls</p>
          </div>
        </div>
        <button
          onClick={requestMicPermission}
          disabled={micStatus === 'requesting'}
          className="w-full py-3 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors inbox-btn-primary"
        >
          {micStatus === 'requesting' ? 'Requesting…' : micStatus === 'granted' ? 'Permission granted ✓' : 'Allow microphone access'}
        </button>
        {permissionMsg && (
          <p className={`mt-3 text-sm ${micStatus === 'granted' ? 'text-emerald-600' : micStatus === 'denied' || micStatus === 'error' ? 'text-rose-600' : 'text-[var(--wa-text-muted)]'}`}>
            {permissionMsg}
          </p>
        )}
      </div>
          <p className="mt-6 text-sm text-[var(--wa-text-muted)]">Voice calls are coming soon. WebRTC signaling will be added next.</p>
      {withId && (
        <button onClick={() => router.back()} className="mt-4 text-sm underline hover:opacity-80 text-[var(--wa-accent)]">
          ← Back to chat
        </button>
      )}
    </div>
  );
}

export default function CallPage() {
  return (
    <Suspense fallback={<div className="p-6 animate-pulse">Loading…</div>}>
      <CallContent />
    </Suspense>
  );
}
