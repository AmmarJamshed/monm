'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const STORAGE_KEY = 'monm_admin_gate';
const PUBLIC_PATHS = ['/privacy'];
const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER || 'ammarjamshed';
const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASS || 'JacktheRipper1997!';

/**
 * Admin gate: browser-only. When visiting the site via browser (not APK),
 * requires admin credentials before showing the app. APK bypasses this.
 */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [passed, setPassed] = useState<boolean | null>(null);
  const [isNative, setIsNative] = useState<boolean | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isPublicPath = pathname && PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    if (typeof window === 'undefined' || isPublicPath) return;
    const check = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        const native = Capacitor.isNativePlatform();
        setIsNative(native);
        if (native) {
          setPassed(true);
          return;
        }
      } catch {
        setIsNative(false);
      }
      const stored = sessionStorage.getItem(STORAGE_KEY);
      setPassed(stored === '1');
    };
    check();
  }, [isPublicPath]);

  if (isPublicPath) {
    return <>{children}</>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (username.trim() === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem(STORAGE_KEY, '1');
      setPassed(true);
    } else {
      setError('Invalid credentials');
    }
  };

  if (passed === null || isNative === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--wa-bg)]">
        <p className="animate-pulse text-[var(--wa-text-muted)]">Loading…</p>
      </div>
    );
  }

  if (passed) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--wa-bg)]">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold text-center mb-2 text-[var(--wa-header)]">
          Admin Access
        </h1>
        <p className="text-center text-sm mb-6 text-[var(--wa-text-muted)]">
          Enter credentials to continue
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-lg border border-[var(--wa-border)]">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none bg-gray-50 border border-[var(--wa-border)] text-[var(--wa-text)]"
            autoComplete="username"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl outline-none bg-gray-50 border border-[var(--wa-border)] text-[var(--wa-text)]"
            autoComplete="current-password"
            required
          />
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button type="submit" className="w-full py-3 font-semibold rounded-xl inbox-btn-primary">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
