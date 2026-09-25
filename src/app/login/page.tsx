import { redirect } from 'next/navigation';
import { db } from '../../lib/db';
import { getSessionUser } from '../../lib/auth';
import { getSessionSecret } from '../../lib/session-token';
import { safeNext } from '../../lib/validators';
import LoginForm from '../../components/LoginForm';
import { Card } from '../../components/ui';
import { TriangleAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Already logged in (e.g. DB-valid but edge-cookie edge case): go home.
  const user = await getSessionUser().catch(() => null);
  if (user) redirect('/');

  // Fail LOUD on misconfiguration instead of showing misleading auth errors.
  try {
    getSessionSecret();
  } catch {
    return (
      <div className="mx-auto w-full max-w-sm pt-12">
        <Card className="border-rose-200 bg-rose-50 p-5 text-center text-sm leading-7 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
          <p className="flex items-center justify-center gap-1.5 font-extrabold"><TriangleAlert size={16} /> پیکربندی ناقص سرور</p>
          <p dir="ltr" className="mt-1 font-mono text-xs">SESSION_SECRET is not set</p>
          <p className="mt-1 text-xs">در Vercel یک متغیر محیطی به همین نام بساز و دوباره دیپلوی کن.</p>
        </Card>
      </div>
    );
  }

  let userCount: number | null = null;
  try {
    userCount = await db.user.count();
  } catch {
    return (
      <div className="mx-auto w-full max-w-sm pt-12">
        <Card className="border-rose-200 bg-rose-50 p-5 text-center text-sm leading-7 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
          <p className="flex items-center justify-center gap-1.5 font-extrabold"><TriangleAlert size={16} /> دیتابیس در دسترس نیست</p>
          <p className="mt-1 text-xs">جدول کاربران پیدا نشد — مایگریشن‌ها اجرا نشده‌اند یا اتصال قطع است. لاگ سرور را بررسی کن.</p>
        </Card>
      </div>
    );
  }

  const sp = await searchParams;
  const nextRaw = Array.isArray(sp.next) ? sp.next[0] : sp.next;

  return <LoginForm isSetup={userCount === 0} next={safeNext(nextRaw)} />;
}
