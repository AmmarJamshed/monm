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

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading…</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-monm-dark text-white px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold">MonM</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-90">{user.name}</span>
          <button onClick={handleLogout} className="text-sm px-3 py-1 rounded bg-white/20 hover:bg-white/30">
            Exit
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-500 p-6">
            <p>No conversations yet.</p>
            <button
              onClick={() => router.push('/chats/new')}
              className="mt-4 px-6 py-2 bg-monm-primary text-white rounded-lg font-medium"
            >
              New Chat
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {chats.map(c => (
              <li
                key={c.id}
                onClick={() => router.push(`/chats/${c.id}`)}
                className="px-4 py-3 flex items-center gap-3 bg-white cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="w-12 h-12 rounded-full bg-monm-dark flex items-center justify-center text-white font-semibold shrink-0">
                  {(c.participants[0]?.name || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.participants.map((p: { name: string }) => p.name).join(', ')}</p>
                  <p className="text-sm text-gray-500">Tap to open</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <nav className="border-t bg-white px-4 py-2 flex justify-around">
        <button
          onClick={() => router.push('/chats/new')}
          className="px-4 py-2 text-monm-dark font-medium"
        >
          + New Chat
        </button>
      </nav>
    </div>
  );
}
