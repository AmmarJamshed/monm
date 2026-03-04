'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { conversations } from '@/lib/api';
import { formatMessageTime } from '@/lib/format';

type Chat = {
  id: string;
  type: string;
  participants: { id: string; name: string }[];
  last_message_at: string | null;
  last_message_type: 'message' | 'photo' | 'document';
};

export default function ChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('monm_token');
    const u = localStorage.getItem('monm_user');
    if (!t || !u) {
      router.replace('/');
      return;
    }
    setUser(JSON.parse(u));
    conversations.list()
      .then(setChats)
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false));
  }, [router]);

  const filteredChats = search.trim()
    ? chats.filter(c => c.participants.some((p: { name: string }) => p.name.toLowerCase().includes(search.toLowerCase())))
    : chats;

  if (loading || !user) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="font-medium animate-pulse text-[var(--wa-accent)]">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <header className="shrink-0 p-3 md:p-4 border-b flex flex-col gap-3" style={{ borderColor: 'var(--wa-border)', background: 'var(--wa-header)' }}>
        <div className="flex items-center justify-between gap-2 min-h-[44px]">
          <h1 className="font-semibold text-lg md:text-xl text-white truncate">Chats</h1>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => router.push('/chats/kill-file')}
              className="px-3 py-2 rounded-lg font-semibold text-sm text-white bg-red-600 hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm border border-red-700/50"
              title="Kill shared file"
            >
              <span className="hidden sm:inline">Kill file</span>
              <span className="sm:hidden">Kill</span>
            </button>
            <button
              onClick={() => router.push('/chats/new')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white"
              title="New chat"
              aria-label="New chat"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--wa-text-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 outline-none rounded-lg bg-white/95 text-[var(--wa-text)] placeholder-[var(--wa-text-muted)]"
          />
        </div>
      </header>
      <div className="flex-1 overflow-auto bg-chat-pattern min-h-0">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-8 text-[var(--wa-text-muted)]">
            <p className="mb-6 text-lg text-[var(--wa-text)]">No conversations yet.</p>
            <p className="mb-6 text-sm">Start a chat with someone 💬</p>
            <button
              onClick={() => router.push('/chats/new')}
              className="px-6 py-3 font-semibold rounded-lg transition-colors inbox-btn-primary"
            >
              + New Chat
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--wa-border)]">
            {filteredChats.map((c) => (
              <li
                key={c.id}
                onClick={() => router.push(`/chats/${c.id}`)}
                className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-white/50 active:bg-white/70 bg-white"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 bg-[var(--wa-accent)]/15 text-[var(--wa-accent)]">
                  {(c.participants[0]?.name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-medium truncate text-[var(--wa-text)]">
                      {c.participants.map((p: { name: string }) => p.name).join(', ')}
                    </p>
                    {c.last_message_at && (
                      <span className="text-xs shrink-0 text-[var(--wa-text-muted)]">
                        {formatMessageTime(c.last_message_at)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm truncate mt-0.5 text-[var(--wa-text-muted)]">
                    {c.last_message_type === 'photo' && '📷 Photo'}
                    {c.last_message_type === 'document' && '📎 Document'}
                    {c.last_message_type === 'message' && 'Message'}
                  </p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 text-[var(--wa-text-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
