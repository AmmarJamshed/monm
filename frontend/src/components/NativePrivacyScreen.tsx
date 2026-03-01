'use client';

import { useEffect } from 'react';

/**
 * When running inside Capacitor (Android APK), enables native FLAG_SECURE
 * to prevent screenshots. No-op in browser.
 */
export default function NativePrivacyScreen() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const enable = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;
        const { PrivacyScreen } = await import('@capacitor-community/privacy-screen');
        await PrivacyScreen.enable();
      } catch {
        // Not in Capacitor or plugin unavailable
      }
    };
    enable();
  }, []);
  return null;
}
