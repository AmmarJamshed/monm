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
    <div className="min-h-screen flex flex-col bg-ar-mesh">
      <header className="glass-panel-strong px-4 py-3 flex justify-between items-center border-b border-slate-200">
        <button onClick={() => router.back()} className="text-monm-primary font-bold hover:opacity-80">← Back</button>
        <h1 className="text-xl font-bold bg-gradient-to-r from-monm-primary to-monm-accent bg-clip-text text-transparent">New Chat</h1>
        <div className="w-14" />
      </header>
      <main className="flex-1 p-4 space-y-5 overflow-auto">
        {serverReachable === false && (
          <p className="text-monm-accent text-sm font-medium px-4 py-3 rounded-xl bg-rose-50 border border-monm-accent/40">
            Can&apos;t reach server. Check that NEXT_PUBLIC_API_URL is set in Netlify and points to your Render backend.
          </p>
        )}
        {/* Find from contacts */}
        <div className="space-y-2">
          <p className="text-sm text-slate-600 font-medium">Find contacts on MonM</p>
          {contactError && (
            <p className="text-monm-primary/90 text-sm font-medium px-3 py-2 rounded-lg bg-monm-primary/10 border border-monm-primary/30">
              {contactError}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {hasContactPicker && (
              <button
                onClick={pickContacts}
                disabled={contactLoading}
                className="w-full py-3 rounded-xl glass-panel border-2 border-monm-primary/50 text-monm-primary font-bold hover:bg-monm-primary/15 hover:shadow-glow transition-all disabled:opacity-50"
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
                className="flex-1 px-4 py-3 rounded-xl glass-panel border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-monm-primary focus:border-monm-primary/50 outline-none transition"
              />
              <button
                onClick={findFromPastedNumbers}
                disabled={contactLoading}
                className="px-5 py-3 bg-gradient-to-r from-monm-secondary to-monm-accent text-white font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50"
              >
                Check
              </button>
            </div>
          </div>
          {/* Always show phone check result */}
          {contactLoading && (
            <div className="mt-2 px-4 py-3 rounded-xl glass-panel border border-slate-200">
              <p className="text-monm-primary font-medium">Checking…</p>
            </div>
          )}
          {!contactLoading && contactSearched && (
            <div className="mt-2 px-4 py-3 rounded-xl glass-panel border border-slate-200">
              {contactError ? (
                <p className="text-monm-accent font-medium">{contactError}</p>
              ) : contactResults.length > 0 ? (
                <>
                  <p className="text-emerald-400 font-semibold mb-2">✓ User found on MonM</p>
                  <ul className="space-y-2">
                    {contactResults.map(u => (
                      <li
                        key={u.id}
                        className="glass-panel px-4 py-3 rounded-xl border border-monm-primary/30 flex items-center justify-between gap-2"
                      >
                        <span className="text-slate-800 font-medium">{u.name}</span>
                        <button
                          onClick={() => startChatWith(u)}
                          disabled={loading}
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-monm-primary via-emerald-400 to-cyan-400 text-slate-900 font-bold text-sm shadow-glow hover:scale-105 transition-all disabled:opacity-50"
                        >
                          Message
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-amber-400 font-medium">✗ No user found with this number. They must sign up first on MonM.</p>
              )}
            </div>
          )}
        </div>

        {/* Search by name or username */}
        <div className="space-y-2">
            <p className="text-sm text-slate-600 font-medium">Search by name, phone, or @username</p>
          {searchError && (
            <p className="text-monm-accent text-sm font-medium px-3 py-2 rounded-lg bg-rose-50 border border-monm-accent/40">
              {searchError}
            </p>
          )}
          <div className="flex gap-2">
            <input
                type="text"
                placeholder="e.g. dad, @dad, or 3001234567"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="flex-1 px-4 py-3 rounded-xl glass-panel border border-slate-200 bg-slate-50 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-monm-primary focus:border-monm-primary/50 outline-none transition"
            />
            <button
              onClick={search}
              disabled={loading}
                className="px-5 py-3 bg-gradient-to-r from-monm-primary via-emerald-400 to-cyan-400 text-slate-900 font-bold rounded-xl shadow-glow disabled:opacity-50 hover:scale-105 transition-all"
            >
              Search
            </button>
          </div>
          {!loading && query.trim().replace(/^@+/, '').length >= 1 && results.length === 0 && (
            <p className="text-slate-500 text-sm mt-2">No one found. Try name, @username, or phone number.</p>
          )}
          {results.length > 0 && (
            <ul className="space-y-2 mt-2">
              {results.map(u => (
                <li
                  key={u.id}
                  className="glass-panel px-4 py-3 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                >
                  <span className="text-slate-800 font-medium">
                    {u.name}
                    {u.username && <span className="text-slate-500 ml-2">@{u.username}</span>}
                  </span>
                  <button
                    onClick={() => startChatWith(u)}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-monm-primary via-emerald-400 to-cyan-400 text-slate-900 font-bold text-sm shadow-glow hover:scale-105 transition-all disabled:opacity-50"
                  >
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
                <li
                  key={u.id}
                  className="flex justify-between items-center px-4 py-3 glass-panel rounded-xl border border-monm-primary/30"
                >
                  <span className="text-slate-800 font-medium">
                    {u.name}
                    {u.username && <span className="text-slate-500 ml-2">@{u.username}</span>}
                  </span>
                  <button
                    onClick={() => remove(u.id)}
                    className="text-monm-accent text-sm font-semibold hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={create}
              disabled={loading}
              className="mt-5 w-full py-3.5 bg-gradient-to-r from-monm-primary via-emerald-400 to-cyan-400 text-slate-900 font-bold rounded-xl shadow-glow disabled:opacity-50 hover:scale-[1.02] transition-all"
            >
              Start Chat
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
