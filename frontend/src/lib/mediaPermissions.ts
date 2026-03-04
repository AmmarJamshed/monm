/**
 * Media permission helpers for camera/microphone.
 * In the APK, shows native-specific guidance (Settings → Apps → MonM → Permissions).
 */

export type MediaStreamResult = { stream: MediaStream } | { error: string; isNative?: boolean };

export async function getMediaStreamWithFallback(
  audio: boolean,
  video: boolean
): Promise<MediaStreamResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { error: 'Microphone/camera access is not supported.' };
  }

  let isNative = false;
  try {
    const { Capacitor } = await import('@capacitor/core');
    isNative = Capacitor.isNativePlatform();
  } catch {
    // Capacitor not available (web only)
  }

  const constraints: MediaStreamConstraints = {
    audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
    video: video ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { stream };
  } catch (e) {
    const err = e as Error & { name?: string };
    const denied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
    if (denied && isNative) {
      return {
        error: 'Allow microphone and camera in device Settings → Apps → MonM → Permissions, then try again.',
        isNative: true,
      };
    }
    if (denied) {
      return {
        error: 'Please allow microphone and camera in your browser settings.',
        isNative: false,
      };
    }
    if (isNative && (err.message?.includes('web') || err.message?.toLowerCase().includes('permission'))) {
      return {
        error: 'Allow microphone and camera in device Settings → Apps → MonM → Permissions, then try again.',
        isNative: true,
      };
    }
    return { error: err.message || 'Could not access microphone or camera.' };
  }
}
