'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMediaStreamWithFallback } from '@/lib/mediaPermissions';

function VideoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withId = searchParams.get('with');
  const [permStatus, setPermStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied' | 'error'>('idle');
  const [permissionMsg, setPermissionMsg] = useState<string>('');

  useEffect(() => {
    const t = localStorage.getItem('monm_token');
    const u = localStorage.getItem('monm_user');
    if (!t || !u) router.replace('/');
  }, [router]);

  const requestPermissions = async () => {
    setPermStatus('requesting');
    setPermissionMsg('');
    const result = await getMediaStreamWithFallback(true, true);
    if ('stream' in result) {
      result.stream.getTracks().forEach((t) => t.stop());
      setPermStatus('granted');
      setPermissionMsg('Camera and microphone permissions granted. Video calls will be available soon.');
    } else {
      setPermStatus('denied');
      setPermissionMsg(result.error);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <h1 className="font-display text-xl font-semibold mb-2 text-[var(--wa-text)]">Video Call</h1>
      <p className="text-sm mb-6 text-[var(--wa-text-muted)]">
        {withId ? 'Prepare to video call this contact. ' : ''}Allow camera and microphone access to enable video calls.
      </p>
      <div className="rounded-xl p-6 border max-w-md bg-white border-[var(--wa-border)]">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[var(--wa-accent)]/15">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[var(--wa-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-[var(--wa-text)]">Camera & Microphone</p>
            <p className="text-sm text-[var(--wa-text-muted)]">Required for video calls</p>
          </div>
        </div>
        <button
          onClick={requestPermissions}
          disabled={permStatus === 'requesting'}
          className="w-full py-3 font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors inbox-btn-primary"
        >
          {permStatus === 'requesting' ? 'Requesting…' : permStatus === 'granted' ? 'Permissions granted ✓' : 'Allow camera & microphone'}
        </button>
        {permissionMsg && (
          <p className={`mt-3 text-sm ${permStatus === 'granted' ? 'text-emerald-600' : permStatus === 'denied' || permStatus === 'error' ? 'text-rose-600' : 'text-[var(--wa-text-muted)]'}`}>
            {permissionMsg}
          </p>
        )}
      </div>
      <p className="mt-6 text-sm text-[var(--wa-text-muted)]">Video calls are coming soon. WebRTC signaling will be added next.</p>
      {withId && (
        <button onClick={() => router.back()} className="mt-4 text-sm underline hover:opacity-80 text-[var(--wa-accent)]">
          ← Back to chat
        </button>
      )}
    </div>
  );
}

export default function VideoPage() {
  return (
    <Suspense fallback={<div className="p-6 animate-pulse">Loading…</div>}>
      <VideoContent />
    </Suspense>
  );
}
