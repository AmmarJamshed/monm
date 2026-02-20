const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
    throw new Error((err as { error?: string }).error || res.statusText);
  }
  return res.json();
}

export const auth = {
  signup: (name: string, phone: string) =>
    api<{ token: string; user: { id: string; name: string; phone: string } }>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, phone }),
    }),
  login: (phone: string) =>
    api<{ token: string; user: { id: string; name: string; phone: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone }),
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
  search: (q: string) => api<Array<{ id: string; name: string }>>(`/api/users/search?q=${encodeURIComponent(q)}`),
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
    }>>(`/api/messages/${conversationId}`),
  send: (conversationId: string, payloadEncrypted: string, iv: string, authTag: string) =>
    api<{
      id: string;
      sender_id: string;
      payload_encrypted: string;
      iv: string;
      auth_tag: string;
      created_at: string;
    }>('/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({ conversationId, payloadEncrypted, iv, authTag }),
    }),
};
