'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionMsg('Microphone access is not supported in this browser.');
      setMicStatus('error');
      return;
    }
    setMicStatus('requesting');
    setPermissionMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicStatus('granted');
      setPermissionMsg('Microphone permission granted. Voice calls will be available soon.');
    } catch (e: unknown) {
      const err = e as Error & { name?: string };
      setMicStatus('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionMsg('Microphone access was denied. Please allow microphone in your browser settings to use voice calls.');
      } else {
        setPermissionMsg(err.message || 'Could not access microphone.');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <h1 className="text-xl font-semibold text-slate-800 mb-2">
        {withId ? 'Voice Call' : 'Voice Call'}
      </h1>
      <p className="text-slate-600 text-sm mb-6">
        {withId ? 'Prepare to call this contact. ' : ''}Allow microphone access to enable voice calls.
      </p>
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 max-w-md">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-slate-800">Microphone</p>
            <p className="text-sm text-slate-500">Required for voice calls</p>
          </div>
        </div>
        <button
          onClick={requestMicPermission}
          disabled={micStatus === 'requesting'}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {micStatus === 'requesting' ? 'Requesting…' : micStatus === 'granted' ? 'Permission granted ✓' : 'Allow microphone access'}
        </button>
        {permissionMsg && (
          <p className={`mt-3 text-sm ${micStatus === 'granted' ? 'text-emerald-600' : micStatus === 'denied' || micStatus === 'error' ? 'text-rose-600' : 'text-slate-600'}`}>
            {permissionMsg}
          </p>
        )}
      </div>
      <p className="mt-6 text-slate-500 text-sm">Voice calls are coming soon. WebRTC signaling will be added next.</p>
      {withId && (
        <button onClick={() => router.back()} className="mt-4 text-sm text-slate-600 hover:text-slate-800 underline">
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
