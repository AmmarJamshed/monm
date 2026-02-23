'use client';

import { useEffect, useCallback } from 'react';

/**
 * Prevents screenshots and content extraction:
 * - Disables text/media selection and right-click
 * - Detects PrintScreen and common screenshot shortcuts
 * - Note: Full screenshot blocking is not possible in browser; this reduces casual capture.
 */
export default function ScreenshotGuard({ children }: { children: React.ReactNode }) {
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // PrintScreen (44), Meta+Shift+3/4 (macOS), Ctrl+Shift+S (some tools)
    const key = e.key?.toLowerCase();
    const isPrintScreen = key === 'printscreen' || (e as KeyboardEvent & { keyCode?: number }).keyCode === 44;
    const isMacScreenshot = (e.metaKey || e.ctrlKey) && (e.shiftKey && (key === '3' || key === '4' || key === '5'));
    const isWinScreenshot = e.key === 'PrintScreen';
    if (isPrintScreen || isMacScreenshot || isWinScreenshot) {
      e.preventDefault();
      // Show brief feedback that capture is blocked
      if (typeof window !== 'undefined' && window.document?.body) {
        const toast = document.createElement('div');
        toast.textContent = 'Screenshots are not allowed on this app';
        toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:8px 16px;border-radius:8px;font-size:13px;z-index:99999;opacity:0.95;pointer-events:none;';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }
    }
  }, []);

  const handleCopy = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, [handleKeyDown, handleCopy]);

  return (
    <div
      className="monm-no-capture"
      onContextMenu={handleContextMenu}
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      {children}
    </div>
  );
}
