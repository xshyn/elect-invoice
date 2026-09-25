'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { db } from './db';
import { hashPassword, verifyPassword } from './password';
import { getSessionSecret, signSession, verifySession } from './session-token';
import {
  COOKIE_NAME,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  REFRESH_THRESHOLD_DAYS,
  SESSION_DAYS,
} from './auth-config';
import { changePasswordSchema, loginSchema, safeNext, setupSchema } from './validators';

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/* ---------- Minimal login rate limiting (per server instance).
 *  Raises the bar for online guessing; NOT a substitute for WAF-level
 *  limiting on multi-instance deployments. Documented limitation. */
const attempts = new Map<string, { count: number; resetAt: number }>();

function rateLimitKey(username: string): string {
  const ip = headers().get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  return `${ip}:${username.toLowerCase()}`;
}

function checkRateLimit(username: string): boolean {
  const key = rateLimitKey(username);
  const now = Date.now();
  const cur = attempts.get(key);
  if (cur && cur.resetAt > now && cur.count >= LOGIN_MAX_ATTEMPTS) return false;
  return true;
}

function recordFailure(username: string): void {
  const key = rateLimitKey(username);
  const now = Date.now();
  const cur = attempts.get(key);
  if (!cur || cur.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  else cur.count += 1;
}

function clearAttempts(username: string): void {
  attempts.delete(rateLimitKey(username));
}

/* ---------- Session helpers ---------- */

async function issueCookie(sid: string, uid: string, expiresAt: Date): Promise<void> {
  const token = await signSession(getSessionSecret(), { sid, uid, exp: expiresAt.getTime() });
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

/** Returns the logged-in user, or null. Read-only: never extends the session
 *  (cookies can't be written during component render).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  let payload;
  try {
    payload = await verifySession(getSessionSecret(), token);
  } catch {
    return null;
  }
  if (!payload) return null;
  const session = await db.session.findUnique({
    where: { id: payload.sid },
    include: { user: true },
  });
  if (!session || session.userId !== payload.uid) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  return { id: session.user.id, username: session.user.username, displayName: session.user.displayName };
}

/** Page-level guard. Call at the top of every protected server page. */
export async function requireUser(next: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Action-level guard. Middleware already gates routes; this is the backstop. */
export async function requireUserId(): Promise<string | null> {
  const user = await getSessionUser();
  return user ? user.id : null;
}

/** Sliding refresh: called from mutating actions (allowed to set cookies).
 *  Extends the window when less than REFRESH_THRESHOLD_DAYS remain.
 */
export async function touchSession(): Promise<void> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return;
  const payload = await verifySession(getSessionSecret(), token).catch(() => null);
  if (!payload) return;
  const session = await db.session.findUnique({ where: { id: payload.sid } });
  if (!session || session.expiresAt.getTime() <= Date.now()) return;
  if (session.expiresAt.getTime() - Date.now() > REFRESH_THRESHOLD_DAYS * DAY_MS) return;
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
  await db.session.update({ where: { id: session.id }, data: { expiresAt, lastSeenAt: new Date() } });
  await issueCookie(session.id, session.userId, expiresAt);
}

/* ---------- Actions ---------- */

export type AuthResult = { ok: true } | { ok: false; errors: string[] };

async function createSession(userId: string, userAgent: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY_MS);
  const session = await db.session.create({ data: { userId, expiresAt, userAgent: userAgent.slice(0, 200) } });
  await issueCookie(session.id, userId, expiresAt);
}

/** First-run setup (zero users) or normal login. Redirects on success. */
export async function setupOrLogin(raw: unknown, isSetup: boolean): Promise<AuthResult> {
  const schema = isSetup ? setupSchema : loginSchema;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };

  const userCount = await db.user.count();
  if (isSetup && userCount > 0) return { ok: false, errors: ['حساب کاربری قبلاً ساخته شده؛ وارد شو.'] };
  if (!isSetup && userCount === 0) return { ok: false, errors: ['هنوز حسابی ساخته نشده؛ اول یک حساب بساز.'] };

  if (isSetup) {
    const input = parsed.data as { username: string; displayName: string; password: string; next: string };
    try {
      const user = await db.user.create({
        data: { username: input.username, displayName: input.displayName, passwordHash: hashPassword(input.password) },
      });
      await createSession(user.id, headers().get('user-agent') ?? '');
    } catch {
      return { ok: false, errors: ['این نام کاربری قبلاً گرفته شده.'] };
    }
    redirect(safeNext(input.next));
  }

  const input = parsed.data as { username: string; password: string; next: string };
  if (!checkRateLimit(input.username)) {
    return { ok: false, errors: ['تلاش‌های ناموفق زیاد بود؛ چند دقیقه دیگر دوباره امتحان کن.'] };
  }
  const user = await db.user.findUnique({ where: { username: input.username } });
  // Generic message either way: don't reveal whether the username exists.
  if (!user || !verifyPassword(input.password, user.passwordHash)) {
    recordFailure(input.username);
    return { ok: false, errors: ['نام کاربری یا گذرواژه درست نیست.'] };
  }
  clearAttempts(input.username);
  await createSession(user.id, headers().get('user-agent') ?? '');
  redirect(safeNext(input.next));
}

export async function logout(): Promise<void> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    const payload = await verifySession(getSessionSecret(), token).catch(() => null);
    if (payload) await db.session.deleteMany({ where: { id: payload.sid } });
  }
  cookies().delete(COOKIE_NAME);
  redirect('/login');
}

export async function changePassword(raw: unknown): Promise<AuthResult> {
  const user = await getSessionUser();
  if (!user) return { ok: false, errors: ['وارد نشده‌ای؛ دوباره وارد شو.'] };
  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((i) => i.message) };

  const row = await db.user.findUnique({ where: { id: user.id } });
  if (!row || !verifyPassword(parsed.data.current, row.passwordHash)) {
    return { ok: false, errors: ['گذرواژه فعلی درست نیست.'] };
  }
  const token = cookies().get(COOKIE_NAME)?.value;
  const payload = token ? await verifySession(getSessionSecret(), token).catch(() => null) : null;
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(parsed.data.password) } });
    // Revoke all OTHER sessions: a password change may mean compromise.
    await tx.session.deleteMany({ where: { userId: user.id, id: payload ? { not: payload.sid } : undefined } });
  });
  await touchSession();
  return { ok: true };
}
