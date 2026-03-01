const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function pingApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('monm_token');
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...opts.headers,
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { error?: string }).error || res.statusText;
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('monm_token');
      localStorage.removeItem('monm_user');
    }
    throw new Error(msg);
  }
  return res.json();
}

export type User = { id: string; name: string; phone: string | null; username?: string | null };

export const auth = {
  signupWithPhone: (name: string, phone: string) =>
    api<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, phone }),
    }),
  signupWithUsername: (name: string, username: string) =>
    api<{ token: string; user: User }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, username: username.trim().toLowerCase() }),
    }),
  loginWithPhone: (phone: string) =>
    api<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  loginWithUsername: (username: string) =>
    api<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: username.trim().toLowerCase() }),
    }),
};

export const conversations = {
  list: () => api<Array<{ id: string; type: string; participants: { id: string; name: string }[] }>>('/api/conversations'),
  create: (participantIds: string[]) =>
    api<{ id: string; type: string }>('/api/conversations/create', {
      method: 'POST',
      body: JSON.stringify({ participantIds }),
    }),
};

export const users = {
  search: (q: string) =>
    api<Array<{ id: string; name: string; username?: string | null }>>(`/api/users/search?q=${encodeURIComponent(q)}`),
  findByPhones: (phones: string[]) =>
    api<Array<{ id: string; name: string }>>('/api/users/find-by-phones', {
      method: 'POST',
      body: JSON.stringify({ phones }),
    }),
};

export const messages = {
  list: (conversationId: string) =>
    api<Array<{
      id: string;
      sender_id: string;
      payload_encrypted: string;
      iv: string;
      auth_tag: string;
      created_at: string;
      media_id?: string | null;
      fingerprint_hash?: string | null;
      kill_switch_active?: boolean;
    }>>(`/api/messages/${conversationId}`),
  send: (
    conversationId: string,
    payloadEncrypted: string,
    iv: string,
    authTag: string,
    opts?: { fingerprintHash?: string; mediaType?: 'image' | 'file'; mimeType?: string; mediaId?: string }
  ) =>
    api<{
      id: string;
      sender_id: string;
      payload_encrypted: string;
      iv: string;
      auth_tag: string;
      created_at: string;
      media_id?: string | null;
    }>('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        conversationId,
        payloadEncrypted,
        iv,
        authTag,
        ...(opts?.fingerprintHash && { fingerprintHash: opts.fingerprintHash }),
        ...(opts?.mediaType && { mediaType: opts.mediaType }),
        ...(opts?.mimeType && { mimeType: opts.mimeType }),
        ...(opts?.mediaId && { mediaId: opts.mediaId }),
      }),
    }),
};

export const media = {
  upload: async (conversationId: string, file: File): Promise<{ media_id: string; fingerprint_hash: string; mime_type: string; media_type: 'image' | 'file' }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('monm_token') : null;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    const res = await fetch(`${API}/api/media/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || res.statusText);
    }
    return res.json();
  },
  blobUrl: (mediaId: string): string => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('monm_token') : null;
    return `${API}/api/media/${mediaId}/blob${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  /** URL for protected download - HTML with embedded fingerprint; checks API when opened, blocks if killed */
  protectedDownloadUrl: (mediaId: string): string => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('monm_token') : null;
    return `${API}/api/media/${mediaId}/protected-download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },
  killedFingerprints: () => api<string[]>('/api/media/killed-fingerprints'),
  canForward: (messageId: string) => api<{ allowed: boolean }>(`/api/media/can-forward/${messageId}`),
  canDownload: (mediaId: string) => api<{ allowed: boolean }>(`/api/media/can-download/${mediaId}`),
  requestForward: (messageId: string) =>
    api<{ id: string; status: string }>(`/api/media/messages/${messageId}/request-forward`, { method: 'POST' }),
  grantForward: (messageId: string, granted: boolean) =>
    api<{ status: string }>(`/api/media/messages/${messageId}/grant-forward`, {
      method: 'POST',
      body: JSON.stringify({ granted }),
    }),
  forward: (messageId: string, targetConversationId: string) =>
    api<{ id: string }>(`/api/media/messages/${messageId}/forward`, {
      method: 'POST',
      body: JSON.stringify({ targetConversationId }),
    }),
  requestDownload: (mediaId: string) =>
    api<{ id: string; status: string }>(`/api/media/${mediaId}/request-download`, { method: 'POST' }),
  grantDownload: (mediaId: string, granted: boolean) =>
    api<{ status: string }>(`/api/media/${mediaId}/grant-download`, {
      method: 'POST',
      body: JSON.stringify({ granted }),
    }),
  activateKillSwitch: (mediaId: string) =>
    api<{ activated: boolean }>(`/api/media/${mediaId}/kill`, { method: 'POST' }),
  listSharedInConversation: (conversationId: string) =>
    api<Array<{ id: string; mime_type: string; kill_switch_active: boolean; message_id: string; created_at: string }>>(
      `/api/media/shared-files?conversationId=${encodeURIComponent(conversationId)}`
    ),
};
