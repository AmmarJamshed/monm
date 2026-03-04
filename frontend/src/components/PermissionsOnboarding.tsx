'use client';

import { useEffect, useState } from 'react';
import { requestNotificationPermission } from '@/lib/notifications';
import { useIsNative } from '@/hooks/useIsNative';

const STORAGE_KEY = 'monm_permissions_onboarded';

export default function PermissionsOnboarding() {
  const [show, setShow] = useState(false);
  const [preparingMedia, setPreparingMedia] = useState(false);
  const isNative = useIsNative();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const token = localStorage.getItem('monm_token');
    const user = localStorage.getItem('monm_user');
    if (!token || !user) return;
    setShow(true);
  }, []);

  const handleNotify = async () => {
    await requestNotificationPermission();
  };

  const handleCameraMic = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return;
    setPreparingMedia(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      // User denied or error - that's ok
    } finally {
      setPreparingMedia(false);
    }
  };

  const handleDone = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-[var(--wa-border)]">
        <h2 className="font-display text-lg font-semibold mb-2 text-[var(--wa-header)]">Set up MonM</h2>
        <p className="text-sm mb-6 text-[var(--wa-text-muted)]">
          Enable these permissions now so calls and notifications work when you need them.
        </p>
        <div className="space-y-3">
          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
            <button
              onClick={handleNotify}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--wa-border)] text-left hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">🔔</span>
              <div className="flex-1">
                <div className="font-medium text-[var(--wa-text)]">Notifications</div>
                <div className="text-xs text-[var(--wa-text-muted)]">Alerts for messages and calls</div>
              </div>
            </button>
          )}
          {!isNative && typeof navigator !== 'undefined' && !!navigator.mediaDevices && (
            <button
              onClick={handleCameraMic}
              disabled={preparingMedia}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--wa-border)] text-left hover:bg-gray-50 transition-colors disabled:opacity-60"
            >
              <span className="text-2xl">📷</span>
              <div className="flex-1">
                <div className="font-medium text-[var(--wa-text)]">Camera & Microphone</div>
                <div className="text-xs text-[var(--wa-text-muted)]">Required for voice and video calls</div>
              </div>
              {preparingMedia && <span className="text-xs text-[var(--wa-text-muted)]">Preparing…</span>}
            </button>
          )}
        </div>
        <button onClick={handleDone} className="mt-6 w-full py-3 px-4 font-medium rounded-lg inbox-btn-primary">
          Continue
        </button>
        <button onClick={handleDone} className="mt-2 w-full py-2 text-sm text-[var(--wa-text-muted)] hover:text-[var(--wa-text)]">
          Skip for now
        </button>
      </div>
    </div>
  );
}
