'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; phone: string } | null>(null);
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('monm_token');
    const u = localStorage.getItem('monm_user');
    if (t && u) {
      setUser(JSON.parse(u));
      router.replace('/chats');
      return;
    }
    setUser(null);
  }, [router]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await auth.signup(name.trim(), phone.trim());
      localStorage.setItem('monm_token', res.token);
      localStorage.setItem('monm_user', JSON.stringify(res.user));
      router.replace('/chats');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await auth.login(phone.trim());
      localStorage.setItem('monm_token', res.token);
      localStorage.setItem('monm_user', JSON.stringify(res.user));
      router.replace('/chats');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-monm-bg">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-monm-dark text-center mb-2">MonM</h1>
        <p className="text-center text-gray-600 mb-8">Privacy-first secure messaging</p>

        <div className="flex gap-2 mb-6">
          <button
            className={`flex-1 py-2 rounded-t-lg font-medium ${view === 'login' ? 'bg-white shadow' : 'bg-gray-200'}`}
            onClick={() => { setView('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-2 rounded-t-lg font-medium ${view === 'signup' ? 'bg-white shadow' : 'bg-gray-200'}`}
            onClick={() => { setView('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        <div className="bg-white p-6 rounded-b-lg rounded-tr-lg shadow">
          {view === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-monm-primary"
                required
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-monm-primary"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-monm-primary text-white font-semibold rounded-lg hover:bg-green-500 disabled:opacity-50"
              >
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="tel"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-monm-primary"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-monm-primary text-white font-semibold rounded-lg hover:bg-green-500 disabled:opacity-50"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}
          {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}
