'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { messages as msgApi, conversations, media as mediaApi } from '@/lib/api';
import { encrypt, decrypt, deriveConversationKey } from '@/lib/crypto';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useCallContext } from '@/contexts/CallContext';
import { showMessageNotification } from '@/lib/notifications';
import MessageBubble from '@/components/MessageBubble';
import { formatDateSeparator, getDateKey, formatFullTime } from '@/lib/format';

type Message = {
  id: string;
  sender_id: string;
  payload_encrypted: string;
  iv: string;
  auth_tag: string;
  created_at: string;
  decrypted?: string;
  mediaRef?: string;
  mediaType?: 'image' | 'file';
  mime?: string;
  media_id?: string | null;
  fingerprint_hash?: string | null;
  kill_switch_active?: boolean;
  wrap?: boolean;
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
  const [convList, setConvList] = useState<Array<{ id: string; type: string; participants: { id: string; name: string }[] }>>([]);
  const [otherParticipant, setOtherParticipant] = useState<{ id: string; name: string } | null>(null);
  const convKeyRef = useRef<CryptoKey | null>(null);
  const participantsRef = useRef<Map<string, string>>(new Map());
  const { subscribe } = useWebSocket();
  const { startCall } = useCallContext();
  const bottomRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [secureWrapMode, setSecureWrapMode] = useState(false);

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
        const [list, convs] = await Promise.all([msgApi.list(id), conversations.list()]);
        setConvList(convs);
        const conv = convs.find(c => c.id === id);
        const other = conv?.participants?.find((p: { id: string }) => p.id !== user.id);
        setOtherParticipant(other ? { id: other.id, name: other.name } : null);
        participantsRef.current = new Map(conv?.participants?.map((p: { id: string; name: string }) => [p.id, p.name]) ?? []);
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
              let parsed: { t?: string; d?: string; m?: string; media_id?: string; wrap?: boolean };
              try {
                parsed = JSON.parse(raw);
              } catch {
                return { ...m, decrypted: raw, mediaType: undefined };
              }
              if (parsed.t === 'image') {
                const base = { ...m, mediaType: 'image' as const, mime: parsed.m || 'image/jpeg', media_id: parsed.media_id || m.media_id, fingerprint_hash: m.fingerprint_hash, kill_switch_active: m.kill_switch_active, wrap: !!parsed.wrap };
                return parsed.d ? { ...base, decrypted: parsed.d } : { ...base, decrypted: undefined, mediaRef: parsed.media_id };
              }
              if (parsed.t === 'file') {
                const base = { ...m, mediaType: 'file' as const, mime: parsed.m, media_id: parsed.media_id || m.media_id, fingerprint_hash: m.fingerprint_hash, kill_switch_active: m.kill_switch_active, wrap: !!parsed.wrap };
                return parsed.d ? { ...base, decrypted: parsed.d } : { ...base, decrypted: undefined, mediaRef: parsed.media_id };
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

    const unsub = subscribe(async (data) => {
      if ((data as { type?: string; conversationId?: string }).type !== 'new_message' || (data as { conversationId?: string }).conversationId !== id) return;
      const key = convKeyRef.current;
      if (!key) return;
      const m = (data as unknown as { message: Message }).message;
      const senderName = participantsRef.current.get(m.sender_id) ?? 'Someone';
      try {
        const raw = await decrypt(m.payload_encrypted, m.iv, m.auth_tag, key);
        let parsed: { t?: string; d?: string; m?: string; media_id?: string; wrap?: boolean };
        try {
          parsed = JSON.parse(raw);
        } catch {
          setMsgs(prev => {
            setNewMsgIds(prevIds => new Set(Array.from(prevIds).concat(m.id)));
            return [...prev, { ...m, decrypted: raw }];
          });
          if (typeof document !== 'undefined' && document.hidden) showMessageNotification(senderName, raw?.slice?.(0, 50) || 'New message');
          return;
        }
        let msg: Message;
        if (parsed.t === 'image') {
          const base = { ...m, mediaType: 'image' as const, mime: parsed.m || 'image/jpeg', media_id: parsed.media_id || m.media_id, fingerprint_hash: m.fingerprint_hash, kill_switch_active: m.kill_switch_active, wrap: !!parsed.wrap };
          msg = parsed.d ? { ...base, decrypted: parsed.d } : { ...base, decrypted: undefined, mediaRef: parsed.media_id };
        } else if (parsed.t === 'file') {
          const base = { ...m, mediaType: 'file' as const, mime: parsed.m, media_id: parsed.media_id || m.media_id, fingerprint_hash: m.fingerprint_hash, kill_switch_active: m.kill_switch_active, wrap: !!parsed.wrap };
          msg = parsed.d ? { ...base, decrypted: parsed.d } : { ...base, decrypted: undefined, mediaRef: parsed.media_id };
        } else {
          msg = { ...m, decrypted: parsed.d ?? raw };
        }
        setMsgs(prev => {
          setNewMsgIds(prevIds => new Set(Array.from(prevIds).concat(m.id)));
          return [...prev, msg];
        });
        if (typeof document !== 'undefined' && document.hidden) showMessageNotification(senderName, parsed.t ? '[Media]' : (parsed.d ?? raw)?.slice?.(0, 80) || 'New message');
      } catch {
        setMsgs(prev => [...prev, { ...m, decrypted: '[Unable to decrypt]' }]);
      }
    });
    return unsub;
  }, [id, router, subscribe]);

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

  const sendMedia = async (file: File) => {
    if (!userId || !convKey || sending) return;
    if (file.size > 24 * 1024 * 1024) { alert('File too large (max 24MB)'); return; }
    setSending(true);
    try {
      const { media_id, fingerprint_hash, mime_type, media_type } = await mediaApi.upload(id, file);
      const payload = JSON.stringify({ t: media_type as 'image' | 'file', media_id, m: mime_type, wrap: secureWrapMode });
      const { ciphertext, iv, authTag } = await encrypt(payload, convKey);
      const m = await msgApi.send(id, ciphertext, iv, authTag, {
        mediaId: media_id,
        mediaType: media_type,
        mimeType: mime_type,
      });
      const newM: Message = {
        ...m,
        decrypted: undefined,
        mediaRef: media_id,
        mediaType: media_type as 'image' | 'file',
        mime: mime_type,
        sender_id: userId,
        media_id,
        fingerprint_hash,
        kill_switch_active: false,
        wrap: secureWrapMode,
      };
      setMsgs(prev => [...prev, newM]);
      setNewMsgIds(prev => new Set(Array.from(prev).concat(m.id)));
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSending(false);
    }
  };

  const handleForward = async (messageId: string) => {
    try {
      const { allowed } = await mediaApi.canForward(messageId);
      if (!allowed) {
        await mediaApi.requestForward(messageId);
        alert('Forward permission requested. The sender must approve.');
        return;
      }
      const otherConvs = convList.filter(c => c.id !== id);
      if (otherConvs.length === 0) {
        alert('No other conversations to forward to.');
        return;
      }
      const names = otherConvs.map(c => c.participants?.map(p => p.name).filter(Boolean).join(', ') || c.id);
      const choice = prompt(`Forward to:\n${otherConvs.map((c, i) => `${i + 1}. ${names[i] || c.id}`).join('\n')}\n\nEnter number (1-${otherConvs.length}):`);
      const idx = parseInt(choice ?? '', 10);
      if (idx >= 1 && idx <= otherConvs.length) {
        const target = otherConvs[idx - 1];
        await mediaApi.forward(messageId, target.id);
        alert(`Forwarded to ${names[idx - 1] || target.id}`);
      }
    } catch (e) {
      alert((e as Error).message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="font-medium animate-pulse" style={{ color: 'var(--inbox-blue)' }}>Loading…</div>
      </div>
    );
  }

  // Group messages by date for separators
  const msgsWithDates = msgs.map((m, i) => {
    const dateKey = getDateKey(m.created_at);
    const prevKey = i > 0 ? getDateKey(msgs[i - 1].created_at) : '';
    return { msg: m, showDate: dateKey !== prevKey };
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="px-4 py-3 flex items-center gap-3 border-b shrink-0" style={{ background: 'var(--inbox-bg)', borderColor: 'var(--inbox-border)' }}>
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 font-bold" style={{ color: 'var(--inbox-text)' }} aria-label="Back">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0" style={{ background: 'var(--inbox-blue-bg)', color: 'var(--inbox-blue)' }}>
          {(otherParticipant?.name ?? '?')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold truncate" style={{ color: 'var(--inbox-text)' }}>{otherParticipant?.name ?? 'Chat'}</h1>
          <p className="text-xs truncate" style={{ color: 'var(--inbox-text-muted)' }}>Tap for info</p>
        </div>
        {otherParticipant && (
          <div className="flex items-center gap-1">
            <button onClick={() => startCall(otherParticipant.id, otherParticipant.name, false)} className="p-2.5 rounded-full hover:bg-slate-100" style={{ color: 'var(--inbox-text)' }} title="Voice call" aria-label="Voice call">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </button>
            <button onClick={() => startCall(otherParticipant.id, otherParticipant.name, true)} className="p-2.5 rounded-full hover:bg-slate-100" style={{ color: 'var(--inbox-text)' }} title="Video call" aria-label="Video call">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </button>
          </div>
        )}
      </header>
      <main className="flex-1 overflow-auto p-4 space-y-2" style={{ background: 'var(--inbox-bg-secondary)' }}>
        {msgs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--inbox-blue-bg)' }}>
              <span className="text-3xl" style={{ color: 'var(--inbox-blue)' }}>👋</span>
            </div>
            <p className="font-medium mb-1" style={{ color: 'var(--inbox-text)' }}>Say hi to {otherParticipant?.name ?? 'them'}</p>
            <p className="text-sm mb-6" style={{ color: 'var(--inbox-text-muted)' }}>Send a message to start the conversation</p>
          </div>
        )}
        {msgsWithDates.map(({ msg: m, showDate }) => (
            <div key={m.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="px-3 py-1 text-xs font-medium rounded-full" style={{ background: 'var(--inbox-blue-bg)', color: 'var(--inbox-text-muted)' }}>
                    {formatDateSeparator(m.created_at)}
                  </span>
                </div>
              )}
              <MessageBubble
                text={m.decrypted}
                isMe={m.sender_id === userId}
                label={m.sender_id === userId ? 'You' : 'Them'}
                time={new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                fullTime={formatFullTime(m.created_at)}
                isNew={newMsgIds.has(m.id)}
                mediaType={m.mediaType}
                mime={m.mime}
                messageId={m.id}
                mediaId={m.media_id ?? undefined}
                mediaRef={m.mediaRef}
                isKilled={m.kill_switch_active === true}
                wrap={m.wrap}
                onForward={handleForward}
              />
            </div>
        ))}
        <div ref={bottomRef} />
      </main>
      <footer className="p-3 border-t shrink-0 pb-safe" style={{ borderColor: 'var(--inbox-border)', background: 'var(--inbox-bg)' }}>
        <div className="flex gap-2 items-end min-w-0">
          <div className="flex items-center gap-0.5 shrink-0">
            <input type="file" ref={cameraInputRef} accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { sendMedia(f); e.target.value = ''; } }} />
            <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={sending} className="p-2.5 rounded-full hover:bg-slate-100 disabled:opacity-50" style={{ color: 'var(--inbox-text-muted)' }} title="Camera" aria-label="Camera">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
            </button>
            <input type="file" accept="image/*" className="hidden" id="gallery-picker" onChange={e => { const f = e.target.files?.[0]; if (f) { sendMedia(f); e.target.value = ''; } }} />
            <button type="button" onClick={() => document.getElementById('gallery-picker')?.click()} disabled={sending} className="p-2.5 rounded-full hover:bg-slate-100 disabled:opacity-50" style={{ color: 'var(--inbox-text-muted)' }} title="Gallery" aria-label="Gallery">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
            </button>
            <input type="file" accept="*/*" className="hidden" id="file-picker" onChange={e => { const f = e.target.files?.[0]; if (f) { sendMedia(f); e.target.value = ''; } }} />
            <button type="button" onClick={() => document.getElementById('file-picker')?.click()} disabled={sending} className="p-2.5 rounded-full hover:bg-slate-100 disabled:opacity-50" style={{ color: 'var(--inbox-text-muted)' }} title="Attachment" aria-label="Attachment">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
          </div>
          <div className="flex-1 flex items-center gap-2 min-w-0 rounded-2xl px-4 py-2" style={{ background: 'var(--inbox-bg-secondary)', border: '1px solid var(--inbox-border)' }}>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer shrink-0" style={{ color: 'var(--inbox-text-muted)' }} title="Secured download">
              <input type="checkbox" checked={secureWrapMode} onChange={e => setSecureWrapMode(e.target.checked)} className="rounded" />
              <span>🔒</span>
            </label>
            <input
              type="text"
              placeholder="Message"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              className="flex-1 min-w-0 py-1.5 bg-transparent outline-none text-sm"
              style={{ color: 'var(--inbox-text)' }}
            />
          </div>
          <button onClick={send} disabled={sending || !input.trim()} className="p-2.5 rounded-full shrink-0 disabled:opacity-50 inbox-btn-primary" title="Send" aria-label="Send">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
