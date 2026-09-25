import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('round-trips and rejects wrong passwords', () => {
    const h = hashPassword('correct-horse-123');
    expect(verifyPassword('correct-horse-123', h)).toBe(true);
    expect(verifyPassword('wrong-password', h)).toBe(false);
    expect(verifyPassword('', h)).toBe(false);
  });
  it('salts uniquely and rejects garbage', () => {
    expect(hashPassword('same')).not.toBe(hashPassword('same'));
    expect(verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(verifyPassword('x', '')).toBe(false);
  });
});
