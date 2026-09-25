import { redirect } from 'next/navigation';
import { db } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { safeNext } from '../../lib/validators';
import LoginForm from '../../components/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Already logged in (e.g. DB-valid but edge-cookie edge case): go home.
  const user = await getSessionUser().catch(() => null);
  if (user) redirect('/');

  const sp = await searchParams;
  const nextRaw = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const userCount = await db.user.count().catch(() => 1);

  return <LoginForm isSetup={userCount === 0} next={safeNext(nextRaw)} />;
}
