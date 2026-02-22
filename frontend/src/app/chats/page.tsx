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
      <header className="glass-panel-strong px-4 py-3 flex justify-between items-center border-b border-slate-200">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-monm-primary via-monm-accent to-monm-secondary bg-clip-text text-transparent">
          MonM
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 font-medium">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-xl glass-panel text-slate-700 hover:bg-monm-accent/20 border border-slate-200 hover:border-monm-accent/40 transition-all"
          >
            Exit
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-600 p-8">
            <p className="mb-6 text-lg text-slate-800">No conversations yet.</p>
            <p className="mb-6 text-slate-500 text-sm">Start a chat with someone special 💬</p>
            <button
              onClick={() => router.push('/chats/new')}
              className="px-8 py-4 bg-gradient-to-r from-monm-primary via-emerald-400 to-cyan-400 text-slate-900 font-bold rounded-2xl shadow-glow hover:scale-105 hover:opacity-95 transition-all"
            >
              + New Chat
            </button>
          </div>
        ) : (
          <ul className="p-3 space-y-2">
            {chats.map((c, i) => (
              <li
                key={c.id}
                onClick={() => router.push(`/chats/${c.id}`)}
                className="glass-panel px-4 py-3 flex items-center gap-4 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-monm-primary/30 border border-slate-200 transition-all active:scale-[0.99]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-monm-primary/50 via-monm-secondary/50 to-monm-accent/50 flex items-center justify-center text-white font-bold text-lg shrink-0 border border-slate-200 shadow-glow">
                  {(c.participants[0]?.name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">
                    {c.participants.map((p: { name: string }) => p.name).join(', ')}
                  </p>
                  <p className="text-xs text-slate-500">Tap to open</p>
                </div>
                <span className="text-monm-primary text-xl">→</span>
              </li>
            ))}
          </ul>
        )}
      </main>
      <nav className="glass-panel border-t border-slate-200 px-4 py-3">
        <button
          onClick={() => router.push('/chats/new')}
          className="w-full py-3.5 rounded-xl font-bold text-monm-primary border-2 border-monm-primary/50 hover:bg-monm-primary/15 hover:shadow-glow transition-all"
        >
          + New Chat
        </button>
      </nav>
    </div>
  );
}
