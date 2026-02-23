'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { users, conversations, pingApi } from '@/lib/api';

type UserResult = { id: string; name: string; username?: string | null };

export default function NewChatPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserResult[]>([]);
  const [selected, setSelected] = useState<UserResult[]>([]);
  const [contactResults, setContactResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [contactSearched, setContactSearched] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [serverReachable, setServerReachable] = useState<boolean | null>(null);

  useEffect(() => {
    pingApi().then(setServerReachable);
  }, []);

  const search = async () => {
    const q = query.trim().replace(/^@+/, '');
    if (q.length < 1) return;
    setLoading(true);
    setSearchError('');
    try {
      const r = await users.search(q);
      setResults(r);
    } catch (e) {
      setSearchError((e as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const add = (u: UserResult) => {
    if (!selected.find(s => s.id === u.id)) setSelected([...selected, u]);
  };

  const remove = (id: string) => setSelected(selected.filter(s => s.id !== id));

  const findFromPhones = async (phones: string[]): Promise<UserResult[]> => {
    if (phones.length === 0) return [];
    setContactLoading(true);
    setContactError('');
    setContactSearched(true);
    try {
      const r = await users.findByPhones(phones);
      setContactResults(r);
      return r;
    } catch (e) {
      setContactError((e as Error).message);
      setContactResults([]);
      return [];
    } finally {
      setContactLoading(false);
    }
  };

  const pickContacts = async () => {
    if (!('contacts' in navigator) || !('ContactsManager' in window)) {
      setContactError('Contact picker not supported. Paste numbers below.');
      return;
    }
    try {
      const props: ('name' | 'email' | 'tel' | 'address' | 'icon')[] = ['tel'];
      const contacts = await navigator.contacts!.select(props, { multiple: true });
      const phones = contacts.flatMap(c => c.tel || []).filter(Boolean);
      await findFromPhones(phones);
    } catch (e) {
      if ((e as Error).name !== 'NotFoundError') {
        setContactError("Can't access contacts on this device. Paste his number below (e.g. 923001234567) and tap Check.");
      }
      setContactResults([]);
    }
  };

  const findFromPastedNumbers = async () => {
    const phones = phoneInput
      .split(/[,;]/)
      .map(seg => seg.replace(/\D/g, ''))
      .filter(p => p.length >= 10);
    if (phones.length === 0) {
      setContactError('Enter a valid number (at least 10 digits, e.g. 923001234567)');
      setContactSearched(false);
      return;
    }
    setContactError('');
    const found = await findFromPhones(phones);
    if (found.length > 0) setPhoneInput('');
  };

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

  const startChatWith = async (u: UserResult) => {
    add(u);
    setLoading(true);
    try {
      const conv = await conversations.create([u.id]);
      router.replace(`/chats/${conv.id}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const hasContactPicker = typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <header className="p-4 border-b border-slate-200 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-600 font-medium">← Back</button>
        <h1 className="text-lg font-semibold text-slate-800">New Chat</h1>
      </header>
      <main className="flex-1 p-4 space-y-5 overflow-auto bg-slate-50">
        {serverReachable === false && (
          <p className="text-rose-600 text-sm font-medium px-4 py-3 rounded-lg bg-rose-50 border border-rose-200">
            Can&apos;t reach server. Check that NEXT_PUBLIC_API_URL is set in Netlify and points to your Render backend.
          </p>
        )}
        <div className="space-y-2">
          <p className="text-sm text-slate-600 font-medium">Find contacts on MonM</p>
          {contactError && (
            <p className="text-blue-700 text-sm font-medium px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">{contactError}</p>
          )}
          <div className="flex flex-col gap-2">
            {hasContactPicker && (
              <button
                onClick={pickContacts}
                disabled={contactLoading}
                className="w-full py-3 rounded-lg bg-white border-2 border-blue-200 text-blue-600 font-bold hover:bg-blue-50 transition-all disabled:opacity-50"
              >
                {contactLoading ? 'Checking…' : 'Pick from phone contacts'}
              </button>
            )}
            <div className="flex gap-2">
              <input
                type="tel"
                inputMode="numeric"
                placeholder="e.g. 923001234567 or 3001234567"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && findFromPastedNumbers()}
                className="flex-1 px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
              />
              <button
                onClick={findFromPastedNumbers}
                disabled={contactLoading}
                className="px-5 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                Check
              </button>
            </div>
          </div>
          {contactLoading && (
            <div className="px-4 py-3 rounded-lg bg-white border border-slate-200">
              <p className="text-blue-600 font-medium">Checking…</p>
            </div>
          )}
          {!contactLoading && contactSearched && (
            <div className="px-4 py-3 rounded-lg bg-white border border-slate-200">
              {contactError ? (
                <p className="text-rose-600 font-medium">{contactError}</p>
              ) : contactResults.length > 0 ? (
                <>
                  <p className="text-emerald-600 font-semibold mb-2">✓ User found on MonM</p>
                  <ul className="space-y-2">
                    {contactResults.map(u => (
                      <li key={u.id} className="px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                        <span className="text-slate-800 font-medium">{u.name}</span>
                        <button onClick={() => startChatWith(u)} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
                          Message
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-amber-600 font-medium">✗ No user found with this number. They must sign up first on MonM.</p>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm text-slate-600 font-medium">Search by name, phone, or @username</p>
          {searchError && <p className="text-rose-600 text-sm font-medium px-3 py-2 rounded-lg bg-rose-50 border border-rose-200">{searchError}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. dad, @dad, or 3001234567"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="flex-1 px-4 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/30 outline-none transition"
            />
            <button onClick={search} disabled={loading} className="px-5 py-3 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-blue-700">
              Search
            </button>
          </div>
          {!loading && query.trim().replace(/^@+/, '').length >= 1 && results.length === 0 && (
            <p className="text-slate-500 text-sm mt-2">No one found. Try name, @username, or phone number.</p>
          )}
          {results.length > 0 && (
            <ul className="space-y-2 mt-2">
              {results.map(u => (
                <li key={u.id} className="px-4 py-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-slate-800 font-medium">{u.name}{u.username && <span className="text-slate-500 ml-2">@{u.username}</span>}</span>
                  <button onClick={() => startChatWith(u)} disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
                    Message
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selected.length > 0 && (
          <div>
            <p className="text-sm text-slate-500 mb-2 font-medium">Selected</p>
            <ul className="space-y-2">
              {selected.map(u => (
                <li key={u.id} className="flex justify-between items-center px-4 py-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-800 font-medium">{u.name}{u.username && <span className="text-slate-500 ml-2">@{u.username}</span>}</span>
                  <button onClick={() => remove(u.id)} className="text-blue-600 text-sm font-semibold hover:underline">
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={create} disabled={loading} className="mt-5 w-full py-3.5 bg-blue-600 text-white font-bold rounded-lg disabled:opacity-50 hover:bg-blue-700">
              Start Chat
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
