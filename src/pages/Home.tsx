import { Link } from 'react-router-dom';
import { useApp } from '../store/app';
import { grandTotal } from '../utils/calc';
import { formatFaMoney, toFaDigits } from '../utils/persian';
import { Btn, Card, Empty } from '../components/ui';
import { longFaDate } from '../utils/jalali';

export default function Home() {
  const { invoices, settings } = useApp();
  const totals = invoices.reduce((s, inv) => s + grandTotal(inv), 0);
  const recent = [...invoices]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      {/* خوش‌آمد */}
      <section className="overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 p-5 text-white sm:p-7">
        <p className="text-xs text-amber-300">⚡ {toFaDigits(new Date().getFullYear())} — پنل برقکار</p>
        <h2 className="mt-1 text-2xl font-black leading-9">
          سلام استاد،
          <br />
          امروز چه فاکتوری می‌زنیم؟
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/new" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-extrabold text-slate-900 hover:bg-amber-300">
            ＋ صدور فاکتور جدید
          </Link>
          <Link to="/invoices" className="inline-flex min-h-[44px] items-center rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold text-white hover:bg-white/20">
            مشاهده فاکتورها
          </Link>
        </div>
      </section>

      {/* آمار */}
      <section className="grid grid-cols-3 gap-2.5 sm:gap-4" aria-label="آمار کلی">
        <Card className="p-3 text-center sm:p-5">
          <div className="text-2xl">🧾</div>
          <div className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">{toFaDigits(invoices.length)}</div>
          <div className="text-[11px] font-bold text-slate-500 sm:text-xs">تعداد فاکتورها</div>
        </Card>
        <Card className="p-3 text-center sm:p-5">
          <div className="text-2xl">💰</div>
          <div className="mt-1 text-sm font-black text-slate-900 sm:text-xl">{formatFaMoney(totals)}</div>
          <div className="text-[11px] font-bold text-slate-500 sm:text-xs">جمع کل ({settings.currency})</div>
        </Card>
        <Card className="p-3 text-center sm:p-5">
          <div className="text-2xl">🔢</div>
          <div className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">{toFaDigits(settings.nextNumber)}</div>
          <div className="text-[11px] font-bold text-slate-500 sm:text-xs">شماره بعدی</div>
        </Card>
      </section>

      {/* آخرین فاکتورها */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-800">آخرین فاکتورها</h3>
          <Link to="/invoices" className="text-[13px] font-bold text-amber-700">
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
                <Link to="/new">
                  <Btn>＋ صدور اولین فاکتور</Btn>
                </Link>
              }
            />
          </Card>
        ) : (
          <div className="space-y-2">
            {recent.map((inv) => (
              <Link key={inv.id} to={`/invoices/${inv.id}`}>
                <Card className="flex items-center gap-3 p-3.5 transition hover:border-amber-300 hover:shadow-md">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-xl">🧾</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-extrabold text-slate-800">
                      فاکتور {toFaDigits(inv.number)} • {inv.buyerName || 'بدون نام خریدار'}
                    </span>
                    <span className="block text-xs text-slate-400">{longFaDate(inv.date)}</span>
                  </span>
                  <span className="shrink-0 text-sm font-black text-slate-900">{formatFaMoney(grandTotal(inv))}</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
