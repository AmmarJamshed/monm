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
      <header className="p-4 border-b flex items-center gap-3 bg-[var(--wa-header)]">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-white/10 font-medium text-white">← Back</button>
        <h1 className="font-display text-lg font-semibold text-white">New Chat</h1>
      </header>
      <main className="flex-1 p-4 space-y-5 overflow-auto bg-[var(--wa-bg)]">
        {serverReachable === false && (
          <p className="text-rose-600 text-sm font-medium px-4 py-3 rounded-lg bg-rose-50 border border-rose-200">
            Can&apos;t reach server. Check that NEXT_PUBLIC_API_URL is set in Netlify and points to your Render backend.
          </p>
        )}
        <div className="space-y-2">
          <p className="text-sm font-medium" style={{ color: 'var(--luxury-text-muted)' }}>Find contacts on MonM</p>
          {contactError && (
            <p className="text-blue-700 text-sm font-medium px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">{contactError}</p>
          )}
          <div className="flex flex-col gap-2">
            {hasContactPicker && (
              <button
                onClick={pickContacts}
                disabled={contactLoading}
                className="w-full py-3 rounded-lg font-bold transition-all disabled:opacity-50"
                style={{ background: 'var(--luxury-bg-card)', border: '2px solid var(--luxury-gold)', color: 'var(--luxury-gold)' }}
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
                className="flex-1 px-4 py-3 rounded-lg outline-none transition"
                style={{ background: 'var(--luxury-bg-card)', border: '1px solid var(--luxury-border)', color: 'var(--luxury-text)' }}
              />
              <button
                onClick={findFromPastedNumbers}
                disabled={contactLoading}
                className="px-5 py-3 font-bold rounded-lg transition disabled:opacity-50 inbox-btn-primary"
              >
                Check
              </button>
            </div>
          </div>
          {contactLoading && (
            <div className="px-4 py-3 rounded-lg border" style={{ background: 'var(--luxury-bg-card)', borderColor: 'var(--luxury-border)' }}>
              <p className="font-medium" style={{ color: 'var(--luxury-gold)' }}>Checking…</p>
            </div>
          )}
          {!contactLoading && contactSearched && (
            <div className="px-4 py-3 rounded-lg border" style={{ background: 'var(--luxury-bg-card)', borderColor: 'var(--luxury-border)' }}>
              {contactError ? (
                <p className="text-rose-600 font-medium">{contactError}</p>
              ) : contactResults.length > 0 ? (
                <>
                  <p className="text-emerald-600 font-semibold mb-2">✓ User found on MonM</p>
                  <ul className="space-y-2">
                    {contactResults.map(u => (
                      <li key={u.id} className="px-4 py-3 rounded-lg flex items-center justify-between gap-2" style={{ background: 'var(--luxury-bg-elevated)', border: '1px solid var(--luxury-border)' }}>
                        <span className="font-medium" style={{ color: 'var(--luxury-text)' }}>{u.name}</span>
                        <button onClick={() => startChatWith(u)} disabled={loading} className="px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 inbox-btn-primary">
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
          <p className="text-sm font-medium" style={{ color: 'var(--luxury-text-muted)' }}>Search by name, phone, or @username</p>
          {searchError && <p className="text-rose-600 text-sm font-medium px-3 py-2 rounded-lg bg-rose-50 border border-rose-200">{searchError}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. dad, @dad, or 3001234567"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()}
              className="flex-1 px-4 py-3 rounded-lg outline-none transition"
              style={{ background: 'var(--luxury-bg-card)', border: '1px solid var(--luxury-border)', color: 'var(--luxury-text)' }}
            />
            <button onClick={search} disabled={loading} className="px-5 py-3 font-bold rounded-lg disabled:opacity-50 inbox-btn-primary">
              Search
            </button>
          </div>
          {!loading && query.trim().replace(/^@+/, '').length >= 1 && results.length === 0 && (
            <p className="text-sm mt-2" style={{ color: 'var(--luxury-text-muted)' }}>No one found. Try name, @username, or phone number.</p>
          )}
          {results.length > 0 && (
            <ul className="space-y-2 mt-2">
              {results.map(u => (
                <li key={u.id} className="px-4 py-3 rounded-lg flex items-center justify-between gap-2" style={{ background: 'var(--luxury-bg-card)', border: '1px solid var(--luxury-border)' }}>
                  <span className="font-medium" style={{ color: 'var(--luxury-text)' }}>{u.name}{u.username && <span className="ml-2" style={{ color: 'var(--luxury-text-muted)' }}>@{u.username}</span>}</span>
                  <button onClick={() => startChatWith(u)} disabled={loading} className="px-4 py-2 rounded-lg font-bold text-sm disabled:opacity-50 inbox-btn-primary">
                    Message
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selected.length > 0 && (
          <div>
            <p className="text-sm mb-2 font-medium" style={{ color: 'var(--luxury-text-muted)' }}>Selected</p>
            <ul className="space-y-2">
              {selected.map(u => (
                <li key={u.id} className="flex justify-between items-center px-4 py-3 rounded-lg border" style={{ background: 'var(--luxury-bg-card)', borderColor: 'var(--luxury-border)' }}>
                  <span className="font-medium" style={{ color: 'var(--luxury-text)' }}>{u.name}{u.username && <span className="ml-2" style={{ color: 'var(--luxury-text-muted)' }}>@{u.username}</span>}</span>
                  <button onClick={() => remove(u.id)} className="text-sm font-semibold hover:underline" style={{ color: 'var(--luxury-gold)' }}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={create} disabled={loading} className="mt-5 w-full py-3.5 font-bold rounded-lg disabled:opacity-50 inbox-btn-primary">
              Start Chat
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
