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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-ar-mesh">
      <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-monm-primary via-monm-accent to-monm-secondary bg-clip-text text-transparent">
          MonM
        </h1>
        <p className="text-center text-white/60 text-sm mb-8 font-medium">Privacy-first · Encrypted · AR vibes</p>

        <div className="flex gap-2 mb-1">
          <button
            className={`flex-1 py-3 rounded-t-xl font-semibold transition-all ${
              view === 'login'
                ? 'glass-panel-strong text-monm-primary border border-monm-primary/40 shadow-glow'
                : 'text-white/50 hover:text-white/70'
            }`}
            onClick={() => { setView('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            className={`flex-1 py-3 rounded-t-xl font-semibold transition-all ${
              view === 'signup'
                ? 'glass-panel-strong text-monm-primary border border-monm-primary/40 shadow-glow'
                : 'text-white/50 hover:text-white/70'
            }`}
            onClick={() => { setView('signup'); setError(''); }}
          >
            Sign Up
          </button>
        </div>

        <div className="glass-panel-strong p-6 rounded-b-xl rounded-tl-xl border border-white/10">
          {view === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-monm-primary focus:border-transparent outline-none transition"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setSignupMode('phone'); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    signupMode === 'phone'
                      ? 'bg-monm-primary/20 text-monm-primary border border-monm-primary/40'
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => { setSignupMode('username'); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    signupMode === 'username'
                      ? 'bg-monm-primary/20 text-monm-primary border border-monm-primary/40'
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
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
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-monm-primary focus:border-transparent outline-none transition"
                  required
                />
              ) : (
                <input
                  type="text"
                  placeholder="Username (letters, numbers, _ -)"
                  value={username}
                  onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-monm-primary focus:border-transparent outline-none transition"
                  minLength={3}
                  required
                />
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-monm-primary to-emerald-500 text-slate-900 font-bold rounded-xl hover:opacity-90 disabled:opacity-50 shadow-glow transition"
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
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    loginMode === 'phone'
                      ? 'bg-monm-primary/20 text-monm-primary border border-monm-primary/40'
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
                >
                  Phone
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMode('username'); setError(''); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                    loginMode === 'username'
                      ? 'bg-monm-primary/20 text-monm-primary border border-monm-primary/40'
                      : 'bg-white/5 text-white/60 border border-white/10'
                  }`}
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
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-monm-primary focus:border-transparent outline-none transition"
                  required
                />
              ) : (
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-monm-primary focus:border-transparent outline-none transition"
                  required
                />
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-monm-primary to-emerald-500 text-slate-900 font-bold rounded-xl hover:opacity-90 disabled:opacity-50 shadow-glow transition"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}
          {error && <p className="mt-3 text-monm-accent text-sm font-medium">{error}</p>}
        </div>
      </div>
    </div>
  );
}
