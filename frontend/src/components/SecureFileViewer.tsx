'use client';

import { useEffect, useCallback, useState } from 'react';
import { media as mediaApi } from '@/lib/api';
import { useIsNative } from '@/hooks/useIsNative';

type Props = {
  url: string;
  mime?: string;
  mediaId?: string | null;
  onClose: () => void;
};

/** In-app viewer for shared files. Content stays inside the app with ScreenshotGuard.
 *  Blurs when mouse leaves to reduce accidental capture. */
export default function SecureFileViewer({ url, mime, mediaId, onClose }: Props) {
  const [blurred, setBlurred] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const isNative = useIsNative();

  const handleMouseLeave = useCallback(() => setBlurred(true), []);
  const handleMouseEnter = useCallback(() => setBlurred(false), []);

  useEffect(() => {
    const m = mime || '';
    if (m.includes('text/') || m === 'application/json' || m.endsWith('csv')) {
      fetch(url, { credentials: 'include' })
        .then((r) => r.text())
        .then(setTextContent)
        .catch(() => setTextContent('Unable to load'));
    }
  }, [url, mime]);

  const m = (mime || '').toLowerCase();
  const isPdf = m.includes('pdf');
  const isImage = m.startsWith('image/');
  const isVideo = m.includes('video');
  const isAudio = m.includes('audio');
  const isText = m.includes('text/') || m === 'application/json' || m.endsWith('csv');

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col bg-black/90"
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <div
        className="absolute inset-0 flex items-center justify-center p-4 overflow-auto transition-all duration-300"
        style={{ filter: blurred ? 'blur(12px)' : 'none' }}
      >
        {isPdf && (
          <iframe
            src={url}
            title="PDF viewer"
            className="w-full max-w-4xl h-full min-h-[80vh] rounded-lg bg-white"
            style={{ pointerEvents: blurred ? 'none' : 'auto' }}
            draggable={false}
            unselectable="on"
          />
        )}
        {isImage && (
          <img
            src={url}
            alt=""
            className="max-w-full max-h-full object-contain rounded-lg"
            draggable={false}
            style={{ pointerEvents: blurred ? 'none' : 'auto', WebkitUserSelect: 'none', userSelect: 'none' }}
            unselectable="on"
          />
        )}
        {isVideo && (
          <video
            src={url}
            controls
            className="max-w-full max-h-full rounded-lg"
            controlsList="nodownload"
            style={{ pointerEvents: blurred ? 'none' : 'auto', WebkitUserSelect: 'none', userSelect: 'none' }}
            draggable={false}
          />
        )}
        {isAudio && (
          <audio src={url} controls className="w-full max-w-md" controlsList="nodownload" />
        )}
        {isText && textContent !== null && (
          <pre
            className="p-4 rounded-lg bg-slate-900 text-slate-200 text-sm overflow-auto max-w-4xl max-h-[80vh] font-mono whitespace-pre-wrap"
            style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
          >
            {textContent}
          </pre>
        )}
        {!isPdf && !isImage && !isVideo && !isAudio && !isText && (
          <div className="text-white text-center p-8">
            <p className="mb-4">Preview not available for this file type.</p>
            {mediaId ? (
              <a
                href={mediaApi.protectedDownloadUrl(mediaId)}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-blue-300"
                title="Checks blockchain when opened; kill switch works even after download"
              >
                📎 Download
              </a>
            ) : (
              <a href={url} download target="_blank" rel="noopener noreferrer" className="underline text-blue-300">
                📎 Download
              </a>
            )}
          </div>
        )}
      </div>
      <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-black/60 gap-4">
        <span className="text-white/80 text-sm">
          {isNative ? 'Screenshot protection active' : 'Copy & right-click disabled'}
        </span>
        {mediaId && (
          <a
            href={mediaApi.protectedDownloadUrl(mediaId)}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline text-blue-300 hover:text-blue-200"
            title="Checks blockchain when opened; kill switch works even after download"
          >
            📎 Download
          </a>
        )}
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}
