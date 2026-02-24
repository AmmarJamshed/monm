'use client';

import { useEffect, useState } from 'react';
import { requestNotificationPermission } from '@/lib/notifications';

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (asked) return;
    const dismissed = localStorage.getItem('monm_notification_asked');
    if (dismissed) return;
    if (Notification.permission === 'default') {
      setShow(true);
    }
  }, [asked]);

  const handleAllow = async () => {
    await requestNotificationPermission();
    setAsked(true);
    setShow(false);
    localStorage.setItem('monm_notification_asked', '1');
  };

  const handleDismiss = () => {
    setShow(false);
    setAsked(true);
    localStorage.setItem('monm_notification_asked', '1');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50 pb-safe">
      <p className="font-semibold text-slate-800">Enable notifications</p>
      <p className="text-sm text-slate-600 mt-1">Get alerts for new messages, calls, and video calls</p>
      <div className="flex gap-2 mt-3">
        <button onClick={handleAllow} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">Allow</button>
        <button onClick={handleDismiss} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Not now</button>
      </div>
    </div>
  );
}
