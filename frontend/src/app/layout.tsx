import type { Metadata } from 'next';
import './globals.css';
import PWAInstall from '@/components/PWAInstall';

export const metadata: Metadata = {
  title: 'MonM — Secure Messaging',
  description: 'Privacy-first, traceable messaging. People say MonM me.',
  manifest: '/manifest.json',
  themeColor: '#075E54',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-monm-bg min-h-screen font-sans antialiased">
        {children}
        <PWAInstall />
      </body>
    </html>
  );
}
