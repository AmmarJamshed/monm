'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIsNative } from '@/hooks/useIsNative';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Displays protected content IN-APP via iframe (stays on our domain).
 * FLAG_SECURE applies — screenshots blocked in APK.
 * No download/save — view only.
 */
export default function ProtectedViewPage() {
  const params = useParams();
  const router = useRouter();
  const isNative = useIsNative();
  const mediaId = params.mediaId as string;
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'error'>('loading');

  useEffect(() => {
    if (!isNative) return;
    let cancelled = false;
    const enable = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform() || cancelled) return;
        const { PrivacyScreen } = await import('@capacitor-community/privacy-screen');
        await PrivacyScreen.enable();
      } catch {
        // Plugin unavailable
      }
    };
    enable();
    return () => { cancelled = true; };
  }, [isNative]);

  useEffect(() => {
    if (!mediaId) {
      setStatus('error');
      return;
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('monm_token') : null;
    if (!token) {
      setStatus('error');
      return;
    }
    setIframeUrl(`${API}/api/media/${mediaId}/protected-download?token=${encodeURIComponent(token)}&inline=1`);
  }, [mediaId]);

  if (status === 'loading' && !iframeUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (status === 'error' || !iframeUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-8">
        <p className="text-xl font-medium text-red-400 mb-2">Unable to load</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-slate-700 text-white">
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-black">
      <header className="shrink-0 flex items-center gap-3 p-3 bg-black/80 border-b border-slate-700">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-white/10 text-white" aria-label="Back">
          ←
        </button>
        <span className="text-slate-400 text-sm">
          {isNative ? 'Screenshot protection active' : 'View only'}
        </span>
      </header>
      <iframe
        src={iframeUrl}
        title="Protected content"
        className="flex-1 w-full border-0"
        style={{ background: '#0f172a' }}
      />
    </div>
  );
}
