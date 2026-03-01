'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type NavItem = { href: string; label: string; icon: React.ReactNode };

const navItems: NavItem[] = [
  { href: '/chats', label: 'Chats', icon: <ChatIcon /> },
  { href: '/call', label: 'Call', icon: <CallIcon /> },
  { href: '/video', label: 'Video Calls', icon: <VideoIcon /> },
];

function ChatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function CallIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}
function VideoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState<string>('-');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem('monm_user');
      setUserName(u ? JSON.parse(u).name : '-');
    } catch {
      setUserName('-');
    }
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = (): void => {
    localStorage.removeItem('monm_token');
    localStorage.removeItem('monm_user');
    router.replace('/');
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--inbox-bg-secondary)' }}>
      {/* Mobile: Top bar with hamburger */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 px-3 py-2 pt-safe border-b" style={{ background: 'var(--inbox-sidebar)', borderColor: 'var(--inbox-border)' }}>
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-1 rounded-lg hover:bg-slate-100" aria-label="Open menu">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-semibold text-slate-800">MonM</span>
      </header>
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setSidebarOpen(false)} aria-hidden />
      )}
      <aside
        className={`inbox-sidebar flex flex-col transition-transform duration-200 ease-out z-50
          w-64 shrink-0
          md:relative md:translate-x-0
          fixed inset-y-0 left-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: 'var(--inbox-blue)' }}>
              M
            </div>
            <div>
              <h1 className="font-semibold" style={{ color: 'var(--inbox-text)' }}>MonM</h1>
              <p className="text-xs truncate max-w-[140px]" style={{ color: 'var(--inbox-text-muted)' }}>{userName}</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 rounded-lg hover:bg-slate-100" aria-label="Close menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 p-2">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/chats' && pathname.startsWith(item.href)) || (item.href === '/chats' && (pathname === '/chats' || pathname.startsWith('/chats/')));
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition-colors ${active ? 'inbox-selected' : ''}`}
                style={active ? { backgroundColor: 'var(--inbox-blue-bg)', color: 'var(--inbox-blue)' } : { color: 'var(--inbox-text-muted)' }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-2 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--inbox-text-muted)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Exit
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 flex flex-col inbox-main md:ml-0 pt-12 md:pt-0">
        {children}
      </main>
    </div>
  );
}
