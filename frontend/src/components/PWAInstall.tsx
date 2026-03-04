'use client';

import { useEffect, useState } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const inStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone
      || document.referrer.includes('android-app://');

    if (inStandalone) {
      setIsInstalled(true);
      return;
    }

    // Register service worker on load (required for install eligibility)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    const handleAppInstalled = () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);


    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Fallback: just hide and let user use browser install (Chrome address bar, etc.)
      setShowBanner(false);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => setShowBanner(false);

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-white p-4 rounded-2xl shadow-xl z-50 border border-[var(--wa-border)]">
      <p className="font-display font-semibold text-[var(--wa-text)]">Install MonM</p>
      <p className="text-sm mt-0.5 text-[var(--wa-text-muted)]">Add to home screen for faster access</p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={handleInstall}
          className="px-4 py-2 font-bold rounded-xl hover:opacity-90 inbox-btn-primary"
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 py-2 rounded-xl font-medium hover:bg-gray-100 text-[var(--wa-text-muted)]"
        >
          Later
        </button>
      </div>
    </div>
  );
}
