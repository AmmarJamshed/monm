'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { users, conversations } from '@/lib/api';

export default function NewChatPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string }>>([]);
  const [selected, setSelected] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (query.length < 2) return;
    setLoading(true);
    try {
      const r = await users.search(query);
      setResults(r);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const add = (u: { id: string; name: string }) => {
    if (!selected.find(s => s.id === u.id)) setSelected([...selected, u]);
  };

  const remove = (id: string) => setSelected(selected.filter(s => s.id !== id));

  const create = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    try {
      const conv = await conversations.create(selected.map(s => s.id));
      router.replace(`/chats/${conv.id}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-monm-dark text-white px-4 py-3 flex justify-between items-center">
        <button onClick={() => router.back()} className="text-white">← Back</button>
        <h1 className="text-lg font-semibold">New Chat</h1>
        <div className="w-10" />
      </header>
      <main className="flex-1 p-4 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name or phone"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 px-4 py-3 border rounded-lg"
          />
          <button onClick={search} disabled={loading} className="px-4 py-3 bg-monm-primary text-white rounded-lg">
            Search
          </button>
        </div>
        {results.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Tap to add:</p>
            <ul className="space-y-1">
              {results.map(u => (
                <li
                  key={u.id}
                  onClick={() => add(u)}
                  className="px-4 py-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50"
                >
                  {u.name}
                </li>
              ))}
            </ul>
          </div>
        )}
        {selected.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Selected:</p>
            <ul className="space-y-1">
              {selected.map(u => (
                <li key={u.id} className="flex justify-between items-center px-4 py-2 bg-monm-light rounded-lg">
                  <span>{u.name}</span>
                  <button onClick={() => remove(u.id)} className="text-red-600 text-sm">Remove</button>
                </li>
              ))}
            </ul>
            <button
              onClick={create}
              disabled={loading}
              className="mt-4 w-full py-3 bg-monm-primary text-white font-semibold rounded-lg"
            >
              Start Chat
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
