import type { Metadata } from 'next';
import './globals.css';
import PWAInstall from '@/components/PWAInstall';
import ScreenshotGuard from '@/components/ScreenshotGuard';
import NativePrivacyScreen from '@/components/NativePrivacyScreen';
import AdminGate from '@/components/AdminGate';

export const metadata: Metadata = {
  title: 'MonM — Private. Encrypted. Elite.',
  description: 'Secure messaging for the discerning. Send with confidence. Stay untouchable.',
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover' as const,
  themeColor: '#0d2137',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,500&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[var(--wa-bg)] text-[var(--wa-text)] min-h-screen font-sans antialiased">
        <NativePrivacyScreen />
        <AdminGate>
          <ScreenshotGuard>
            {children}
            <PWAInstall />
          </ScreenshotGuard>
        </AdminGate>
      </body>
    </html>
  );
}
