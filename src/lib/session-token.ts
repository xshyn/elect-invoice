/** Session cookie token: HMAC-SHA256 signed payload, edge-safe (WebCrypto only).
 *  Used by middleware (fast signature check, no DB) AND server code.
 *  Revocation/expiry enforcement against the DB happens in lib/auth.ts.
 */

const enc = new TextEncoder();

export interface SessionPayload {
  /** Session row id */
  sid: string;
  /** User id */
  uid: string;
  /** Expiry as epoch ms (mirrors the DB row) */
  exp: number;
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array<ArrayBuffer> {
  const b64 = s.replaceAll('-', '+').replaceAll('_', '/');
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
}

export async function signSession(secret: string, payload: SessionPayload): Promise<string> {
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(body)));
  return `${body}.${b64urlEncode(sig)}`;
}

/** Returns the payload iff signature is valid AND exp is in the future. */
export async function verifySession(secret: string, token: string): Promise<SessionPayload | null> {
  try {
    const dot = token.indexOf('.');
    if (dot === -1) return null;
    const body = token.slice(0, dot);
    const sig = b64urlDecode(token.slice(dot + 1));
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(secret), sig, enc.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body))) as SessionPayload;
    if (typeof payload.sid !== 'string' || typeof payload.uid !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Production requires a real secret. Dev falls back (sessions die if changed). */
export function getSessionSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set (min 16 chars). Generate with: openssl rand -base64 32');
  }
  return 'dev-only-insecure-secret-change-me';
}
