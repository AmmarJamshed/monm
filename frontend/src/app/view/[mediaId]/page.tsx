'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function SecuredWrapperContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const mediaId = params.mediaId as string;
  const token = searchParams.get('token') || (typeof window !== 'undefined' ? localStorage.getItem('monm_token') : null);
  const [status, setStatus] = useState<'loading' | 'killed' | 'ready' | 'error'>('loading');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mime, setMime] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  const buildBlobUrl = useCallback(() => {
    if (!mediaId) return null;
    const t = token || (typeof window !== 'undefined' ? localStorage.getItem('monm_token') : null);
    return `${API}/api/media/${mediaId}/blob${t ? `?token=${encodeURIComponent(t)}` : ''}`;
  }, [mediaId, token]);

  useEffect(() => {
    if (!mediaId || !token) {
      setStatus('error');
      return;
    }
    const url = buildBlobUrl();
    if (!url) {
      setStatus('error');
      return;
    }
    fetch(url, { credentials: 'include', method: 'HEAD' })
      .then((r) => {
        if (r.status === 410) {
          setStatus('killed');
          return;
        }
        if (!r.ok) {
          setStatus('error');
          return;
        }
        const mt = r.headers.get('content-type') || '';
        setMime(mt);
        setBlobUrl(url);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, [mediaId, token, buildBlobUrl]);

  useEffect(() => {
    if (status !== 'ready' || !blobUrl) return;
    const m = (mime || '').toLowerCase();
    if (m.includes('text/') || m === 'application/json' || m.endsWith('csv')) {
      fetch(blobUrl, { credentials: 'include' })
        .then((r) => (r.ok ? r.text() : Promise.reject()))
        .then(setTextContent)
        .catch(() => setTextContent('Unable to load'));
    }
  }, [status, blobUrl, mime]);

  const m = (mime || '').toLowerCase();
  const isPdf = m.includes('pdf');
  const isImage = m.startsWith('image/');
  const isVideo = m.includes('video');
  const isAudio = m.includes('audio');
  const isText = m.includes('text/') || m === 'application/json' || m.endsWith('csv');

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400 animate-pulse">Loading…</p>
      </div>
    );
  }

  if (status === 'killed') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-8">
        <div className="text-center max-w-md">
          <p className="text-xl font-medium text-red-400 mb-2">Content disabled</p>
          <p className="text-slate-400 text-sm">Kill switch activated. This file is no longer viewable.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 p-8">
        <div className="text-center max-w-md">
          <p className="text-xl font-medium text-red-400 mb-2">Unable to load</p>
          <p className="text-slate-400 text-sm">Invalid link or access denied. Open from MonM to view.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <header className="shrink-0 flex justify-between items-center p-3 bg-black/80 border-b border-slate-700 gap-4">
        <span className="text-slate-400 text-sm">Secured viewer — no screenshots</span>
        {token && (
          <a
            href={`${API}/api/media/${mediaId}/protected-download?token=${encodeURIComponent(token)}`}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline text-blue-400 hover:text-blue-300"
            title="Checks blockchain when opened; kill switch works even after download"
          >
            📎 Download
          </a>
        )}
        <a
          href="/"
          className="text-sm px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-600"
        >
          Open MonM
        </a>
      </header>
      <main className="flex-1 flex items-center justify-center p-4 overflow-auto">
        {blobUrl && isPdf && (
          <iframe
            src={blobUrl}
            title="PDF"
            className="w-full max-w-4xl h-[calc(100vh-60px)] rounded bg-white"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
          />
        )}
        {blobUrl && isImage && (
          <img
            src={blobUrl}
            alt=""
            className="max-w-full max-h-[calc(100vh-80px)] object-contain rounded"
            draggable={false}
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
          />
        )}
        {blobUrl && isVideo && (
          <video
            src={blobUrl}
            controls
            className="max-w-full max-h-[calc(100vh-80px)] rounded"
            controlsList="nodownload"
            draggable={false}
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
          />
        )}
        {blobUrl && isAudio && (
          <audio src={blobUrl} controls className="w-full max-w-md" controlsList="nodownload" />
        )}
        {blobUrl && isText && textContent !== null && (
          <pre className="p-4 rounded bg-slate-900 text-slate-200 text-sm overflow-auto max-w-4xl max-h-[calc(100vh-80px)] font-mono whitespace-pre-wrap">
            {textContent}
          </pre>
        )}
        {blobUrl && !isPdf && !isImage && !isVideo && !isAudio && !isText && (
          <div className="text-slate-400 text-center">
            <p className="mb-4">Preview not available for this file type.</p>
            {token && (
              <a
                href={`${API}/api/media/${mediaId}/protected-download?token=${encodeURIComponent(token)}`}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-400"
                title="Checks blockchain when opened; kill switch works even after download"
              >
                📎 Download
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function SecuredWrapperPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-slate-400 animate-pulse">Loading…</p>
      </div>
    }>
      <SecuredWrapperContent />
    </Suspense>
  );
}
