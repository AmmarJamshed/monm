'use client';

import { useEffect, useState } from 'react';

export default function PWAInstall() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('serviceWorker' in navigator && !window.matchMedia('(display-mode: standalone)').matches) {
      setShow(true);
    }
  }, []);
  const registerSW = () => {
    navigator.serviceWorker?.register('/sw.js').then(() => setShow(false));
  };
  if (!show) return null;
  return (
    <div className="fixed bottom-20 left-4 right-4 bg-monm-dark text-white p-4 rounded-lg shadow-lg z-50">
      <p className="font-medium">Install MonM for faster access</p>
      <button onClick={registerSW} className="mt-2 px-4 py-2 bg-monm-primary rounded-lg text-sm font-medium">
        Install
      </button>
    </div>
  );
}
