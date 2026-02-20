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
              const text = await decrypt(m.payload_encrypted, m.iv, m.auth_tag, key);
              return { ...m, decrypted: text };
            } catch {
              return { ...m, decrypted: '[Unable to decrypt]' };
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
          const text = await decrypt(m.payload_encrypted, m.iv, m.auth_tag, key);
          setMsgs(prev => {
            setNewMsgIds(prevIds => new Set(Array.from(prevIds).concat(m.id)));
            return [...prev, { ...m, decrypted: text }];
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
          />
        ))}
        <div ref={bottomRef} />
      </main>
      <footer className="glass-panel-strong p-4 border-t border-white/5 flex gap-3">
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
      </footer>
    </div>
  );
}
