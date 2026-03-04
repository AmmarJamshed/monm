'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; name: string; phone?: string | null; username?: string | null } | null>(null);
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [signupMode, setSignupMode] = useState<'phone' | 'username'>('phone');
  const [loginMode, setLoginMode] = useState<'phone' | 'username'>('phone');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
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
      const res = signupMode === 'phone'
        ? await auth.signupWithPhone(name.trim(), phone.trim())
        : await auth.signupWithUsername(name.trim(), username.trim());
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
      const res = loginMode === 'phone'
        ? await auth.loginWithPhone(phone.trim())
        : await auth.loginWithUsername(username.trim());
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--wa-bg)]">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <img src="/icon-192.png" alt="MonM" className="h-20 w-auto object-contain" width={80} height={80} />
        </div>
        <h1 className="font-display text-5xl font-bold text-center mb-2 tracking-tight text-[var(--wa-header)]">
          MonM
        </h1>
        <p className="text-center text-[var(--wa-text-muted)] text-sm mb-8 font-medium">Private · Encrypted · Elite</p>

        <div className="flex gap-2 mb-1">
          <button
            className={`flex-1 py-3 rounded-t-2xl font-semibold transition-all duration-300 ${
              view === 'login' ? 'bg-white border-2 border-[var(--wa-accent)] text-[var(--wa-accent)] shadow' : 'text-[var(--wa-text-muted)] hover:text-[var(--wa-text)]'
            }`}
            onClick={() => { setView('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-3 rounded-t-2xl font-semibold transition-all duration-300 ${
              view === 'signup' ? 'bg-white border-2 border-[var(--wa-accent)] text-[var(--wa-accent)] shadow' : 'text-[var(--wa-text-muted)] hover:text-[var(--wa-text)]'
            }`}
            onClick={() => { setView('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        <div className="bg-white p-6 rounded-b-2xl rounded-tl-2xl shadow-lg border border-[var(--wa-border)]">
          {view === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--luxury-bg-elevated)] border border-[var(--luxury-border)] text-[var(--luxury-text)] placeholder-[var(--luxury-text-light)] focus:ring-2 focus:ring-[var(--luxury-gold)] focus:border-[var(--luxury-gold)]/50 outline-none transition"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setSignupMode('phone'); setError(''); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    signupMode === 'phone' ? 'border-2' : 'bg-gray-50 text-[var(--wa-text-muted)] border border-[var(--wa-border)]'
                  }`}
                  style={signupMode === 'phone' ? { background: 'rgba(26,54,93,0.1)', color: 'var(--wa-accent)', borderColor: 'var(--wa-accent)' } : {}}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => { setSignupMode('username'); setError(''); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    signupMode === 'username' ? 'border-2' : 'bg-gray-50 text-[var(--wa-text-muted)] border border-[var(--wa-border)]'
                  }`}
                  style={signupMode === 'username' ? { background: 'rgba(26,54,93,0.1)', color: 'var(--wa-accent)', borderColor: 'var(--wa-accent)' } : {}}
                >
                  Username
                </button>
              </div>
              {signupMode === 'phone' ? (
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-[var(--wa-border)] text-[var(--wa-text)] placeholder-[var(--wa-text-muted)] focus:ring-2 focus:ring-[var(--wa-accent)]/30 outline-none transition"
                  required
                />
              ) : (
                <input
                  type="text"
                  placeholder="Username (letters, numbers, _ -)"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-[var(--wa-border)] text-[var(--wa-text)] placeholder-[var(--wa-text-muted)] focus:ring-2 focus:ring-[var(--wa-accent)]/30 outline-none transition"
                  minLength={3}
                  required
                />
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 font-bold rounded-xl hover:opacity-95 disabled:opacity-50 transition-all duration-300 inbox-btn-primary"
              >
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setLoginMode('phone'); setError(''); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    loginMode === 'phone' ? 'border-2' : 'bg-gray-50 text-[var(--wa-text-muted)] border border-[var(--wa-border)]'
                  }`}
                  style={loginMode === 'phone' ? { background: 'rgba(26,54,93,0.1)', color: 'var(--wa-accent)', borderColor: 'var(--wa-accent)' } : {}}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('username'); setError(''); }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    loginMode === 'username' ? 'border-2' : 'bg-gray-50 text-[var(--wa-text-muted)] border border-[var(--wa-border)]'
                  }`}
                  style={loginMode === 'username' ? { background: 'rgba(26,54,93,0.1)', color: 'var(--wa-accent)', borderColor: 'var(--wa-accent)' } : {}}
                >
                  Username
                </button>
              </div>
              {loginMode === 'phone' ? (
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-[var(--wa-border)] text-[var(--wa-text)] placeholder-[var(--wa-text-muted)] focus:ring-2 focus:ring-[var(--wa-accent)]/30 outline-none transition"
                  required
                />
              ) : (
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-[var(--wa-border)] text-[var(--wa-text)] placeholder-[var(--wa-text-muted)] focus:ring-2 focus:ring-[var(--wa-accent)]/30 outline-none transition"
                  required
                />
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 font-bold rounded-xl hover:opacity-95 disabled:opacity-50 transition-all duration-300 inbox-btn-primary"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}
          {error && <p className="mt-3 text-rose-400 text-sm font-medium">{error}</p>}
        </div>
      </div>
    </div>
  );
}
