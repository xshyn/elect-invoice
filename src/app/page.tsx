import Link from 'next/link';
import { dashboardStats, getProfile, recentInvoices } from '../lib/invoices';
import { formatFaMoney, toFaDigits } from '../utils/persian';
import { longFaDate } from '../utils/jalali';
import { grandTotal } from '../utils/calc';
import { Btn, Card, Empty } from '../components/ui';
import { requireUser } from '../lib/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await requireUser('/');
  const [stats, recent, profile] = await Promise.all([
    dashboardStats(),
    recentInvoices(5),
    getProfile(),
  ]);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 p-5 text-white sm:p-7">
        <p className="text-xs text-amber-300">⚡ پنل برقکار</p>
        <h2 className="mt-1 text-2xl font-black leading-9">
          سلام استاد،
          <br />
          امروز چه فاکتوری می‌زنیم؟
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/new"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-slate-900 dark:text-slate-100 hover:bg-amber-300"
          >
            ＋ صدور فاکتور جدید
          </Link>
          <Link
            href="/invoices"
            className="inline-flex min-h-[44px] items-center rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20"
          >
            مشاهده فاکتورها
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2.5 sm:gap-4" aria-label="آمار کلی">
        <Card className="p-3 text-center sm:p-5">
          <div className="text-2xl">🧾</div>
          <div className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100 sm:text-2xl">{toFaDigits(stats.count)}</div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 sm:text-xs">تعداد فاکتورها</div>
        </Card>
        <Card className="p-3 text-center sm:p-5">
          <div className="text-2xl">💰</div>
          <div className="mt-1 text-sm font-black text-slate-900 dark:text-slate-100 sm:text-xl">{formatFaMoney(stats.total)}</div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 sm:text-xs">جمع کل ({profile.currency})</div>
        </Card>
        <Card className="p-3 text-center sm:p-5">
          <div className="text-2xl">🔢</div>
          <div className="mt-1 text-xl font-black text-slate-900 dark:text-slate-100 sm:text-2xl">{toFaDigits(stats.nextNumber)}</div>
          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 sm:text-xs">شماره بعدی</div>
        </Card>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">آخرین فاکتورها</h3>
          <Link href="/invoices" className="text-[13px] font-bold text-amber-700 dark:text-amber-300">
            مشاهده همه ←
          </Link>
        </div>
        {recent.length === 0 ? (
          <Card>
            <Empty
              icon="🧾"
              title="هنوز فاکتوری نداری"
              desc="اولین فاکتورت را در کمتر از یک دقیقه صادر کن؛ شماره و تاریخ خودکار پر می‌شود."
              action={
                <Link href="/new">
                  <Btn>＋ صدور اولین فاکتور</Btn>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((inv) => (
              <Link key={inv.id} href={`/invoices/${inv.id}`}>
                <Card className="flex items-center gap-3 p-3.5 transition hover:border-amber-300 hover:shadow-md">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 dark:bg-amber-400/15 text-xl">🧾</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-slate-800 dark:text-slate-100">
                      فاکتور {toFaDigits(inv.number)} • {inv.buyerName || 'بدون نام خریدار'}
                    </span>
                    <span className="block text-xs text-slate-400 dark:text-slate-500">{longFaDate(inv.date)}</span>
                  </span>
                  <span className="shrink-0 text-sm font-black text-slate-900 dark:text-slate-100">{formatFaMoney(grandTotal(inv))}</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
