'use client';

import { useEffect, useState } from 'react';

type Props = {
  text: string;
  isMe: boolean;
  label: string;
  time: string;
  isNew?: boolean;
};

export default function MessageBubble({ text, isMe, label, time, isNew = false }: Props) {
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
            className="absolute inset-0 rounded-2xl border-2 border-monm-primary pointer-events-none animate-ping-ring"
            style={{ margin: '-4px' }}
            aria-hidden
          />
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isMe
              ? 'bg-gradient-to-br from-monm-primary to-emerald-500 text-slate-900 shadow-glow'
              : 'glass-panel-strong text-white border border-white/10 shadow-glow-pink'
          }`}
        >
          <p className="text-xs opacity-80 mb-1">
            {label} · {time}
          </p>
          <p className="text-sm leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}
