'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { messages as msgApi, conversations } from '@/lib/api';
import { encrypt, decrypt, deriveConversationKey } from '@/lib/crypto';
import { createWS } from '@/lib/ws';
import MessageBubble from '@/components/MessageBubble';

type Message = {
  id: string;
  sender_id: string;
  payload_encrypted: string;
  iv: string;
  auth_tag: string;
  created_at: string;
  decrypted?: string;
  mediaType?: 'image' | 'file';
  mime?: string;
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [convKey, setConvKey] = useState<CryptoKey | null>(null);
  const [newMsgIds, setNewMsgIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const convKeyRef = useRef<CryptoKey | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  convKeyRef.current = convKey;

  useEffect(() => {
    const u = localStorage.getItem('monm_user');
    const t = localStorage.getItem('monm_token');
    if (!u || !t) {
      router.replace('/');
      return;
    }
    const user = JSON.parse(u);
    setUserId(user.id);

    async function load() {
      try {
        const [list, convList] = await Promise.all([msgApi.list(id), conversations.list()]);
        const conv = convList.find(c => c.id === id);
        const participantIds = conv?.participants
          ? Array.from(new Set([...conv.participants.map((p: { id: string }) => p.id), user.id]))
          : [user.id];
        const key = await deriveConversationKey(id, participantIds);
        setConvKey(key);
        convKeyRef.current = key;
        const decrypted = await Promise.all(
          list.map(async m => {
            try {
              const raw = await decrypt(m.payload_encrypted, m.iv, m.auth_tag, key);
              let parsed: { t?: string; d?: string; m?: string };
              try {
                parsed = JSON.parse(raw);
              } catch {
                return { ...m, decrypted: raw, mediaType: undefined };
              }
              if (parsed.t === 'image' && parsed.d) {
                return { ...m, decrypted: parsed.d, mediaType: 'image' as const, mime: parsed.m || 'image/jpeg' };
              }
              if (parsed.t === 'file' && parsed.d) {
                return { ...m, decrypted: parsed.d, mediaType: 'file' as const, mime: parsed.m };
              }
              return { ...m, decrypted: parsed.d ?? raw, mediaType: undefined };
            } catch {
              return { ...m, decrypted: '[Unable to decrypt]', mediaType: undefined };
            }
          })
        );
        setMsgs(decrypted);
      } catch {
        router.replace('/chats');
      } finally {
        setLoading(false);
      }
    }
    load().catch(() => router.replace('/chats'));

    const ws = createWS(t);
    ws.onmessage = async (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'new_message' && data.conversationId === id) {
        const key = convKeyRef.current;
        if (!key) return;
        const m = data.message;
        try {
          const raw = await decrypt(m.payload_encrypted, m.iv, m.auth_tag, key);
          let parsed: { t?: string; d?: string; m?: string };
          try {
            parsed = JSON.parse(raw);
          } catch {
            setMsgs(prev => {
              setNewMsgIds(prevIds => new Set(Array.from(prevIds).concat(m.id)));
              return [...prev, { ...m, decrypted: raw }];
            });
            return;
          }
          const msg = parsed.t === 'image' && parsed.d
            ? { ...m, decrypted: parsed.d, mediaType: 'image' as const, mime: parsed.m || 'image/jpeg' }
            : parsed.t === 'file' && parsed.d
              ? { ...m, decrypted: parsed.d, mediaType: 'file' as const, mime: parsed.m }
              : { ...m, decrypted: parsed.d ?? raw };
          setMsgs(prev => {
            setNewMsgIds(prevIds => new Set(Array.from(prevIds).concat(m.id)));
            return [...prev, msg];
          });
        } catch {
          setMsgs(prev => [...prev, { ...m, decrypted: '[Unable to decrypt]' }]);
        }
      }
    };
    wsRef.current = ws;
    return () => ws.close();
  }, [id, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || !userId || !convKey || sending) return;
    setSending(true);
    setInput('');
    try {
      const { ciphertext, iv, authTag } = await encrypt(text, convKey);
      const m = await msgApi.send(id, ciphertext, iv, authTag);
      const newM = { ...m, decrypted: text, sender_id: userId };
      setMsgs(prev => [...prev, newM]);
      setNewMsgIds(prev => new Set(Array.from(prev).concat(m.id)));
    } catch (e) {
      alert((e as Error).message);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const sendMedia = async (file: File) => {
    if (!userId || !convKey || sending) return;
    if (file.size > 10 * 1024 * 1024) { alert('File too large (max 10MB)'); return; }
    setSending(true);
    try {
      let base64: string;
      if (file.type.startsWith('image/')) {
        base64 = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            const c = document.createElement('canvas');
            const MAX = 1200;
            let w = img.width, h = img.height;
            if (w > MAX || h > MAX) {
              if (w > h) { h = (h * MAX) / w; w = MAX; } else { w = (w * MAX) / h; h = MAX; }
            }
            c.width = w; c.height = h;
            c.getContext('2d')!.drawImage(img, 0, 0, w, h);
            resolve(c.toDataURL(file.type, 0.85).split(',')[1] || '');
          };
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });
      } else {
        base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve((r.result as string).split(',')[1] || '');
          r.onerror = reject;
          r.readAsDataURL(file);
        });
      }
      const payload = JSON.stringify({ t: file.type.startsWith('image/') ? 'image' : 'file', d: base64, m: file.type });
      const { ciphertext, iv, authTag } = await encrypt(payload, convKey);
      const m = await msgApi.send(id, ciphertext, iv, authTag);
      const newM = { ...m, decrypted: base64, mediaType: (file.type.startsWith('image/') ? 'image' : 'file') as 'image' | 'file', mime: file.type, sender_id: userId };
      setMsgs(prev => [...prev, newM]);
      setNewMsgIds(prev => new Set(Array.from(prev).concat(m.id)));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ar-mesh">
        <div className="text-monm-primary font-medium animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ar-mesh">
      <header className="glass-panel-strong px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <button onClick={() => router.back()} className="text-monm-primary text-xl font-bold">←</button>
        <h1 className="flex-1 font-bold text-white">Chat</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 space-y-3">
        {msgs.map(m => (
          <MessageBubble
            key={m.id}
            text={m.decrypted ?? '[Encrypted]'}
            isMe={m.sender_id === userId}
            label={m.sender_id === userId ? 'You' : 'Them'}
            time={new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            isNew={newMsgIds.has(m.id)}
            mediaType={m.mediaType}
            mime={m.mime}
          />
        ))}
        <div ref={bottomRef} />
      </main>
      <footer className="glass-panel-strong p-4 border-t border-white/5 flex flex-col gap-2">
        <div className="flex gap-2 items-center">
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { sendMedia(f); e.target.value = ''; } }}
          />
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={sending}
            className="p-3 rounded-xl glass-panel border border-white/10 text-white/80 hover:bg-white/10 transition disabled:opacity-50"
            title="Take photo or choose image"
            aria-label="Photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" /></svg>
          </button>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            id="gallery-picker"
            onChange={e => { const f = e.target.files?.[0]; if (f) { sendMedia(f); e.target.value = ''; } }}
          />
          <button
            type="button"
            onClick={() => document.getElementById('gallery-picker')?.click()}
            disabled={sending}
            className="p-3 rounded-xl glass-panel border border-white/10 text-white/80 hover:bg-white/10 transition disabled:opacity-50"
            title="Choose from gallery"
            aria-label="Gallery"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </button>
          <input
            type="file"
            accept="*/*"
            className="hidden"
            id="file-picker"
            onChange={e => { const f = e.target.files?.[0]; if (f) { sendMedia(f); e.target.value = ''; } }}
          />
          <button
            type="button"
            onClick={() => document.getElementById('file-picker')?.click()}
            disabled={sending}
            className="p-3 rounded-xl glass-panel border border-white/10 text-white/80 hover:bg-white/10 transition disabled:opacity-50"
            title="Attach file"
            aria-label="File"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            className="flex-1 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-monm-primary focus:border-transparent outline-none transition"
          />
          <button
            onClick={send}
            disabled={sending || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-monm-primary to-emerald-500 text-slate-900 font-bold rounded-2xl disabled:opacity-50 shadow-glow hover:opacity-90 transition disabled:hover:opacity-50"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
