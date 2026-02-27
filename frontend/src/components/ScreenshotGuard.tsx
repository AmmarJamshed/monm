'use client';

import { useEffect, useCallback } from 'react';

/**
 * Reduces content extraction and detects screenshot attempts:
 * - Disables text/media selection, right-click, and copy
 * - Intercepts PrintScreen, Win+Shift+S, Cmd+Shift+3/4/5, and similar shortcuts
 * - Note: Browsers cannot truly prevent OS-level screenshots; this blocks in-page copy and shows a warning on detected shortcuts.
 */
export default function ScreenshotGuard({ children }: { children: React.ReactNode }) {
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  const showBlockedToast = useCallback(() => {
    if (typeof window === 'undefined' || !window.document?.body) return;
    const existing = document.getElementById('monm-screenshot-toast');
    if (existing) return;
    const toast = document.createElement('div');
    toast.id = 'monm-screenshot-toast';
    toast.textContent = 'Screenshots are not allowed in this app';
    toast.style.cssText =
      'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1e293b;color:#fff;padding:10px 20px;border-radius:8px;font-size:14px;z-index:999999;opacity:0.95;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = (e.key || '').toLowerCase();
    const keyCode = (e as KeyboardEvent & { keyCode?: number }).keyCode;
    // PrintScreen / SysRq (44)
    const isPrintScreen = key === 'printscreen' || keyCode === 44;
    // macOS: Cmd+Shift+3/4/5
    const isMacScreenshot = (e.metaKey || e.ctrlKey) && e.shiftKey && ['3', '4', '5'].includes(key);
    // Windows: Win+Shift+S (Snipping Tool) - metaKey may be set for Win key on some browsers
    const isWinSnippet = key === 's' && e.shiftKey && e.metaKey;
    // Ctrl+Shift+S (some browsers/tools)
    const isCtrlShiftS = e.ctrlKey && e.shiftKey && key === 's';
    // Alt+PrintScreen
    const isAltPrintScreen = e.altKey && (key === 'printscreen' || keyCode === 44);

    if (isPrintScreen || isMacScreenshot || isWinSnippet || isCtrlShiftS || isAltPrintScreen) {
      e.preventDefault();
      e.stopPropagation();
      showBlockedToast();
    }
  }, [showBlockedToast]);

  const handleCopy = useCallback((e: ClipboardEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    // Use capture phase so we get the event before other handlers
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('copy', handleCopy, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('copy', handleCopy, true);
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
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      {children}
    </div>
  );
}
