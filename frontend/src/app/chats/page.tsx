'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { conversations } from '@/lib/api';

export default function ChatsPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Array<{ id: string; type: string; participants: { id: string; name: string }[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string } | null>(null);

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

  const handleLogout = () => {
    localStorage.removeItem('monm_token');
    localStorage.removeItem('monm_user');
    router.replace('/');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ar-mesh">
        <div className="text-monm-primary font-medium animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-ar-mesh">
      <header className="glass-panel-strong px-4 py-3 flex justify-between items-center border-b border-white/5">
        <h1 className="text-xl font-bold bg-gradient-to-r from-monm-primary to-monm-accent bg-clip-text text-transparent">
          MonM
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white/70">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-lg glass-panel text-white/90 hover:bg-white/10 border border-white/10 transition"
          >
            Exit
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-white/50 p-8">
            <p className="mb-4">No conversations yet.</p>
            <button
              onClick={() => router.push('/chats/new')}
              className="px-6 py-3 bg-gradient-to-r from-monm-primary to-emerald-500 text-slate-900 font-bold rounded-xl shadow-glow hover:opacity-90 transition"
            >
              New Chat
            </button>
          </div>
        ) : (
          <ul className="p-3 space-y-2">
            {chats.map((c, i) => (
              <li
                key={c.id}
                onClick={() => router.push(`/chats/${c.id}`)}
                className="glass-panel px-4 py-3 flex items-center gap-4 rounded-2xl cursor-pointer hover:bg-white/10 border border-white/5 transition active:scale-[0.99]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-monm-primary/30 to-monm-secondary/30 flex items-center justify-center text-monm-primary font-bold text-lg shrink-0 border border-white/10">
                  {(c.participants[0]?.name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">
                    {c.participants.map((p: { name: string }) => p.name).join(', ')}
                  </p>
                  <p className="text-xs text-white/40">Tap to open</p>
                </div>
                <span className="text-monm-primary">→</span>
              </li>
            ))}
          </ul>
        )}
      </main>
      <nav className="glass-panel border-t border-white/5 px-4 py-3">
        <button
          onClick={() => router.push('/chats/new')}
          className="w-full py-3 rounded-xl font-semibold text-monm-primary border border-monm-primary/40 hover:bg-monm-primary/10 transition"
        >
          + New Chat
        </button>
      </nav>
    </div>
  );
}
