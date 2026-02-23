import type { Metadata } from 'next';
import './globals.css';
import PWAInstall from '@/components/PWAInstall';
import ScreenshotGuard from '@/components/ScreenshotGuard';

export const metadata: Metadata = {
  title: 'MonM — Secure Messaging',
  description: 'Privacy-first, traceable messaging. People say MonM me.',
  manifest: '/manifest.json',
  themeColor: '#f8fafc',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-monm-bg text-monm-dark min-h-screen font-sans antialiased">
        <ScreenshotGuard>
          {children}
          <PWAInstall />
        </ScreenshotGuard>
      </body>
    </html>
  );
}
