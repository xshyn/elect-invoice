/** Password hashing with stdlib scrypt (NIST-approved KDF, no native deps).
 *  Server-only: imports node:crypto — never import from client components
 *  or middleware (edge). Pure functions → unit tested.
 */

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const N = 16384;
const R = 8;
const P = 1;
const KEY_LEN = 32;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt}$${hash.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split('$');
    if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
    const [, Ns, Rs, Ps, salt, hex] = parts;
    const expected = Buffer.from(hex, 'hex');
    if (expected.length !== KEY_LEN) return false;
    const actual = scryptSync(password, salt, KEY_LEN, {
      N: Number(Ns),
      r: Number(Rs),
      p: Number(Ps),
      maxmem: 64 * 1024 * 1024,
    });
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
