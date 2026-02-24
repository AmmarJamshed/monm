/** Request notification permission and show in-app alerts for messages/calls */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

export function showMessageNotification(senderName: string, preview: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (!document.hidden) return;
  try {
    new Notification(`MonM: ${senderName}`, {
      body: preview,
      icon: '/icon-192.png',
      tag: 'monm-msg',
      requireInteraction: false,
    });
  } catch {}
}

export function showCallNotification(callerName: string, isVideo: boolean) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (!document.hidden) return;
  try {
    new Notification(isVideo ? `Video call from ${callerName}` : `Call from ${callerName}`, {
      body: 'Tap to answer',
      icon: '/icon-192.png',
      tag: 'monm-call',
      requireInteraction: true,
    });
  } catch {}
}
