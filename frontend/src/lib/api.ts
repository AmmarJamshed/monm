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
    throw new Error((err as { error?: string }).error || res.statusText);
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
