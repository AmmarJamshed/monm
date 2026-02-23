'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionMsg('Camera and microphone access are not supported in this browser.');
      setPermStatus('error');
      return;
    }
    setPermStatus('requesting');
    setPermissionMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach(track => track.stop());
      setPermStatus('granted');
      setPermissionMsg('Camera and microphone permissions granted. Video calls will be available soon.');
    } catch (e: unknown) {
      const err = e as Error & { name?: string };
      setPermStatus('denied');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionMsg('Camera/microphone access was denied. Please allow in your browser settings to use video calls.');
      } else {
        setPermissionMsg(err.message || 'Could not access camera or microphone.');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6">
      <h1 className="text-xl font-semibold text-slate-800 mb-2">Video Call</h1>
      <p className="text-slate-600 text-sm mb-6">
        {withId ? 'Prepare to video call this contact. ' : ''}Allow camera and microphone access to enable video calls.
      </p>
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 max-w-md">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-slate-800">Camera & Microphone</p>
            <p className="text-sm text-slate-500">Required for video calls</p>
          </div>
        </div>
        <button
          onClick={requestPermissions}
          disabled={permStatus === 'requesting'}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {permStatus === 'requesting' ? 'Requesting…' : permStatus === 'granted' ? 'Permissions granted ✓' : 'Allow camera & microphone'}
        </button>
        {permissionMsg && (
          <p className={`mt-3 text-sm ${permStatus === 'granted' ? 'text-emerald-600' : permStatus === 'denied' || permStatus === 'error' ? 'text-rose-600' : 'text-slate-600'}`}>
            {permissionMsg}
          </p>
        )}
      </div>
      <p className="mt-6 text-slate-500 text-sm">Video calls are coming soon. WebRTC signaling will be added next.</p>
      {withId && (
        <button onClick={() => router.back()} className="mt-4 text-sm text-slate-600 hover:text-slate-800 underline">
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
