'use client';

import { useEffect, useState } from 'react';
import { requestNotificationPermission } from '@/lib/notifications';

const STORAGE_KEY = 'monm_permissions_onboarded';

export default function PermissionsOnboarding() {
  const [show, setShow] = useState(false);
  const [preparingMedia, setPreparingMedia] = useState(false);

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Set up MonM</h2>
        <p className="text-sm text-slate-600 mb-6">
          Enable these permissions now so calls and notifications work when you need them.
        </p>
        <div className="space-y-3">
          {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
            <button
              onClick={handleNotify}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left"
            >
              <span className="text-2xl">🔔</span>
              <div className="flex-1">
                <div className="font-medium text-slate-800">Notifications</div>
                <div className="text-xs text-slate-500">Alerts for messages and calls</div>
              </div>
            </button>
          )}
          {typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia && (
            <button
              onClick={handleCameraMic}
              disabled={preparingMedia}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-left disabled:opacity-60"
            >
              <span className="text-2xl">📷</span>
              <div className="flex-1">
                <div className="font-medium text-slate-800">Camera & Microphone</div>
                <div className="text-xs text-slate-500">Required for voice and video calls</div>
              </div>
              {preparingMedia && <span className="text-xs text-slate-500">Preparing…</span>}
            </button>
          )}
        </div>
        <button
          onClick={handleDone}
          className="mt-6 w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          Continue
        </button>
        <button onClick={handleDone} className="mt-2 w-full py-2 text-sm text-slate-500 hover:text-slate-700">
          Skip for now
        </button>
      </div>
    </div>
  );
}
