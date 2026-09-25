import { describe, expect, it } from 'vitest';
import { signSession, verifySession } from './session-token';

const SECRET = 'test-secret-0123456789';

describe('session token', () => {
  it('sign → verify round-trips', async () => {
    const token = await signSession(SECRET, { sid: 's1', uid: 'u1', exp: Date.now() + 1000 });
    expect(await verifySession(SECRET, token)).toMatchObject({ sid: 's1', uid: 'u1' });
  });
  it('rejects tampering, wrong secret, expiry, and garbage', async () => {
    const token = await signSession(SECRET, { sid: 's1', uid: 'u1', exp: Date.now() + 1000 });
    const [body] = token.split('.');
    expect(await verifySession('other-secret-xxxxxxxx', token)).toBeNull();
    expect(await verifySession(SECRET, `${body}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`)).toBeNull();
    expect(await verifySession(SECRET, 'garbage')).toBeNull();
    const expired = await signSession(SECRET, { sid: 's1', uid: 'u1', exp: Date.now() - 1000 });
    expect(await verifySession(SECRET, expired)).toBeNull();
  });
});
