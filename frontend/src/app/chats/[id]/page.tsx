'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { messages as msgApi, conversations } from '@/lib/api';
import { encrypt, decrypt, deriveConversationKey } from '@/lib/crypto';
import { createWS } from '@/lib/ws';

type Message = {
  id: string;
  sender_id: string;
  payload_encrypted: string;
  iv: string;
  auth_tag: string;
  created_at: string;
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [convKey, setConvKey] = useState<CryptoKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        const m = data.message;
        if (!convKey) return;
        try {
          const text = await decrypt(m.payload_encrypted, m.iv, m.auth_tag, convKey);
          setMsgs(prev => [...prev, { ...m, decrypted: text }]);
        } catch {
          setMsgs(prev => [...prev, { ...m, decrypted: '[Unable to decrypt]' }]);
        }
      }
    };
    wsRef.current = ws;
    return () => ws.close();
  }, [id, router]);

  useEffect(() => {
    const k = convKey;
    if (!k) return;
    wsRef.current?.addEventListener?.('message', () => {});
  }, [convKey]);

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
      setMsgs(prev => [...prev, { ...m, decrypted: text, sender_id: userId }]);
    } catch (e) {
      alert((e as Error).message);
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-monm-dark text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white">←</button>
        <h1 className="flex-1 font-semibold">Chat</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 space-y-2 bg-monm-bg">
        {msgs.map(m => (
          <div
            key={m.id}
            className={`flex ${m.sender_id === userId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-lg ${
                m.sender_id === userId ? 'bg-monm-light ml-auto' : 'bg-white'
              }`}
            >
              <p className="text-sm text-gray-500 mb-0.5">
                {m.sender_id === userId ? 'You' : 'Them'} · {new Date(m.created_at).toLocaleTimeString()}
              </p>
              <p>{(m as Message & { decrypted?: string }).decrypted ?? '[Encrypted]'}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </main>
      <footer className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          className="flex-1 px-4 py-3 border rounded-full focus:ring-2 focus:ring-monm-primary"
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className="px-6 py-3 bg-monm-primary text-white rounded-full font-medium disabled:opacity-50"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
