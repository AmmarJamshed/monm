'use client';

import { useEffect, useState } from 'react';
import { media as mediaApi } from '@/lib/api';
import SecureFileViewer from './SecureFileViewer';

type Props = {
  text?: string;
  isMe: boolean;
  label: string;
  time: string;
  isNew?: boolean;
  mediaType?: 'image' | 'file';
  mime?: string;
  messageId?: string;
  mediaId?: string | null;
  mediaRef?: string;
  isKilled?: boolean;
  onForward?: (messageId: string) => void;
};

export default function MessageBubble({
  text,
  isMe,
  label,
  time,
  isNew = false,
  mediaType,
  mime,
  messageId,
  mediaId,
  mediaRef,
  isKilled = false,
  onForward,
}: Props) {
  const [showPing, setShowPing] = useState(isNew && !isMe);
  const [downloadRequested, setDownloadRequested] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!showPing) return;
    const t = setTimeout(() => setShowPing(false), 900);
    return () => clearTimeout(t);
  }, [showPing]);

  const blobUrl = (mediaId && (mediaRef || !text)) ? mediaApi.blobUrl(mediaId) : null;
  const imgSrc = mediaType === 'image' && (text ? `data:${mime || 'image/jpeg'};base64,${text}` : blobUrl);
  const fileHref = mediaType === 'file' && (text ? `data:${mime || 'application/octet-stream'};base64,${text}` : blobUrl);

  const handleFileDownload = async () => {
    if (!mediaId || isMe) return;
    try {
      const { allowed } = await mediaApi.canDownload(mediaId);
      if (allowed && fileHref) {
        const a = document.createElement('a');
        a.href = fileHref;
        a.download = 'file';
        a.target = '_blank';
        a.click();
      } else {
        await mediaApi.requestDownload(mediaId);
        setDownloadRequested(true);
      }
    } catch {
      setDownloadRequested(true);
    }
  };

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isNew ? 'animate-msg-pop' : ''}`}>
      <div className={`relative max-w-[80%] ${isMe ? 'ml-auto' : ''}`}>
        {showPing && (
          <div
            className="absolute inset-0 rounded-xl border-2 pointer-events-none animate-ping-ring"
            style={{ borderColor: 'var(--inbox-blue)', margin: '-4px' }}
            aria-hidden
          />
        )}
        <div
          className={`px-4 py-2.5 rounded-xl ${
            isMe ? 'font-medium' : 'glass-panel-strong border'
          }`}
          style={isMe ? { background: 'var(--inbox-blue)', color: '#fff' } : { color: 'var(--inbox-text)', borderColor: 'var(--inbox-border)' }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <p className={`text-xs ${isMe ? 'opacity-90' : 'text-slate-500'}`}>
              {label} · {time}
            </p>
            {messageId && onForward && (
              <button
                type="button"
                onClick={() => onForward(messageId)}
                className="text-xs opacity-70 hover:opacity-100 p-1 rounded"
                title="Forward"
                aria-label="Forward"
              >
                ↪
              </button>
            )}
          </div>
          {isKilled ? (
            <div className="py-4 px-3 rounded-lg bg-slate-100 text-slate-500 text-sm mt-1">
              Content disabled — leaked. Kill switch activated.
            </div>
          ) : mediaType === 'image' && imgSrc ? (
            <button
              type="button"
              onClick={() => setViewerOpen(true)}
              className="block w-full text-left mt-1 rounded-lg overflow-hidden focus:outline-none"
            >
              <img
                src={imgSrc}
                alt="Shared"
                className="max-w-full max-h-64 rounded-lg object-contain w-full"
                draggable={false}
                style={{ WebkitUserSelect: 'none', userSelect: 'none', pointerEvents: 'none' }}
              />
            </button>
          ) : mediaType === 'file' ? (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <button
                type="button"
                onClick={() => fileHref && setViewerOpen(true)}
                disabled={!fileHref}
                className="text-sm underline hover:opacity-80 disabled:opacity-50"
              >
                View
              </button>
              {isMe && fileHref ? (
                <a href={fileHref} download target="_blank" rel="noopener noreferrer" className="text-sm underline flex items-center gap-2">
                  <span>📎 Download</span>
                </a>
              ) : downloadRequested ? (
                <span className="text-sm text-slate-500">Download requested</span>
              ) : (
                <button type="button" onClick={handleFileDownload} className="text-sm underline flex items-center gap-2 hover:opacity-80">
                  <span>📎 Download</span>
                </button>
              )}
            </div>
          ) : (
            <p className="text-sm leading-relaxed">{text ?? '[Encrypted]'}</p>
          )}
        </div>
      </div>
      {viewerOpen && (
        <SecureFileViewer
          url={(mediaType === 'image' ? imgSrc : fileHref) || ''}
          mime={mime}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </div>
  );
}
