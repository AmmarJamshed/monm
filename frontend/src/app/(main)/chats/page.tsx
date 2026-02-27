'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { conversations } from '@/lib/api';

export default function ChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Array<{ id: string; type: string; participants: { id: string; name: string }[] }>>([]);
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
        <div className="font-medium animate-pulse" style={{ color: 'var(--inbox-blue)' }}>Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="p-4 border-b flex flex-col gap-3" style={{ borderColor: 'var(--inbox-border)' }}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold" style={{ color: 'var(--inbox-text)' }}>Messages</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push('/chats/kill-file')}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-sm font-medium"
              style={{ color: 'var(--inbox-text-muted)' }}
              title="Kill shared file"
            >
              Kill shared file
            </button>
            <button
              onClick={() => router.push('/chats/new')}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              style={{ color: 'var(--inbox-text-muted)' }}
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--inbox-text-light)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 outline-none transition"
            style={{ background: 'var(--inbox-bg-secondary)', border: '1px solid var(--inbox-border)', borderRadius: 'var(--inbox-radius)', color: 'var(--inbox-text)' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <select className="text-sm py-1.5 px-2 rounded outline-none" style={{ border: '1px solid var(--inbox-border)', color: 'var(--inbox-text-muted)', background: 'var(--inbox-bg)' }}>
            <option>↓↑ Newest</option>
          </select>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 p-8" style={{ color: 'var(--inbox-text-muted)' }}>
            <p className="mb-6 text-lg" style={{ color: 'var(--inbox-text)' }}>No conversations yet.</p>
            <p className="mb-6 text-sm">Start a chat with someone 💬</p>
            <button
              onClick={() => router.push('/chats/new')}
              className="px-6 py-3 font-semibold rounded-lg transition-colors inbox-btn-primary"
            >
              + New Chat
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredChats.map((c, i) => (
              <li
                key={c.id}
                onClick={() => router.push(`/chats/${c.id}`)}
                className="flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50"
                style={i === 0 ? { background: 'var(--inbox-blue-bg-strong)' } : {}}
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0" style={{ background: 'var(--inbox-blue-bg)', color: 'var(--inbox-blue)' }}>
                  {(c.participants[0]?.name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--inbox-text)' }}>
                    {c.participants.map((p: { name: string }) => p.name).join(', ')}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--inbox-text-muted)' }}>Tap to open</p>
                </div>
                <span style={{ color: 'var(--inbox-text-light)' }}>→</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
