'use client';

import { useEffect, useState } from 'react';

type Props = {
  text: string;
  isMe: boolean;
  label: string;
  time: string;
  isNew?: boolean;
  mediaType?: 'image' | 'file';
  mime?: string;
};

export default function MessageBubble({ text, isMe, label, time, isNew = false, mediaType, mime }: Props) {
  const [showPing, setShowPing] = useState(isNew && !isMe);

  useEffect(() => {
    if (!showPing) return;
    const t = setTimeout(() => setShowPing(false), 900);
    return () => clearTimeout(t);
  }, [showPing]);

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isNew ? 'animate-msg-pop' : ''}`}>
      <div className={`relative max-w-[80%] ${isMe ? 'ml-auto' : ''}`}>
        {/* Ping ring for incoming messages */}
        {showPing && (
          <div
            className="absolute inset-0 rounded-xl border-2 pointer-events-none animate-ping-ring"
            style={{ borderColor: 'var(--inbox-blue)', margin: '-4px' }}
            aria-hidden
          />
        )}
        <div
          className={`px-4 py-2.5 rounded-xl ${
            isMe
              ? 'font-medium'
              : 'glass-panel-strong border'
          }`}
          style={isMe ? { background: 'var(--inbox-blue)', color: '#fff' } : { color: 'var(--inbox-text)', borderColor: 'var(--inbox-border)' }}
        >
          <p className={`text-xs mb-1 ${isMe ? 'opacity-90' : 'text-slate-500'}`}>
            {label} · {time}
          </p>
          {mediaType === 'image' && text ? (
            <img src={`data:${mime || 'image/jpeg'};base64,${text}`} alt="Shared" className="max-w-full max-h-64 rounded-lg object-contain mt-1" />
          ) : mediaType === 'file' ? (
            <a href={`data:${mime || 'application/octet-stream'};base64,${text}`} download className="text-sm underline flex items-center gap-2">
              <span>📎 File</span>
            </a>
          ) : (
            <p className="text-sm leading-relaxed">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
