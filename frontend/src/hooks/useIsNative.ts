'use client';

import { useState, useEffect } from 'react';

/** True when running in Capacitor (Android APK) where FLAG_SECURE blocks screenshots. */
export function useIsNative(): boolean {
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    import('@capacitor/core')
      .then(({ Capacitor }) => setIsNative(Capacitor.isNativePlatform()))
      .catch(() => setIsNative(false));
  }, []);
  return isNative;
}
