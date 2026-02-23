/**
 * Client-side AES-256-GCM encryption for MonM
 * MVP: Deterministic key derivation so both participants can decrypt without key exchange.
 * Production would use proper E2E key agreement.
 */
const ALGORITHM = 'AES-GCM';
const KEY_LEN = 256;
const IV_LEN = 12;

/** Derive a conversation key that both participants can compute (MVP) */
export async function deriveConversationKey(conversationId: string, participantIds: string[]): Promise<CryptoKey> {
  const sorted = [...participantIds].sort();
  const salt = new TextEncoder().encode(`monm_${conversationId}_${sorted.join('_')}`);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', salt),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LEN },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: ALGORITHM, length: KEY_LEN }, true, ['encrypt', 'decrypt']);
}

export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key);
  const arr = new Uint8Array(raw);
  return btoa(String.fromCharCode.apply(null, Array.from(arr)));
}

export async function importKey(base64: string): Promise<CryptoKey> {
  const raw = new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
  return crypto.subtle.importKey('raw', raw, { name: ALGORITHM, length: KEY_LEN }, true, ['encrypt', 'decrypt']);
}

export async function encrypt(plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string; authTag: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: 128 },
    key,
    encoded
  );
  const combined = new Uint8Array(cipher);
  const authTag = combined.slice(-16);
  const ciphertext = combined.slice(0, -16);
  return {
    ciphertext: btoa(String.fromCharCode.apply(null, Array.from(ciphertext))),
    iv: btoa(String.fromCharCode.apply(null, Array.from(iv))),
    authTag: btoa(String.fromCharCode.apply(null, Array.from(authTag))),
  };
}

/** SHA-256 hash of string (for media fingerprint / base64) */
export async function sha256Hash(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex;
}

export async function decrypt(ciphertext: string, iv: string, authTag: string, key: CryptoKey): Promise<string> {
  const ivArr = new Uint8Array(atob(iv).split('').map(c => c.charCodeAt(0)));
  const tagArr = new Uint8Array(atob(authTag).split('').map(c => c.charCodeAt(0)));
  const ctArr = new Uint8Array(atob(ciphertext).split('').map(c => c.charCodeAt(0)));
  const combined = new Uint8Array(ctArr.length + tagArr.length);
  combined.set(ctArr);
  combined.set(tagArr, ctArr.length);
  const dec = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivArr, tagLength: 128 },
    key,
    combined
  );
  return new TextDecoder().decode(dec);
}
