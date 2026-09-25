import Link from 'next/link';
import { listInvoices } from '../../lib/invoices';
import { parseSortParam } from '../../lib/validators';
import { grandTotal } from '../../utils/calc';
import { formatFaMoney, splitHighlight, toEnDigits, toFaDigits } from '../../utils/persian';
import { longFaDate } from '../../utils/jalali';
import { Btn, Card, Empty } from '../../components/ui';
import InvoicesToolbar from '../../components/InvoicesToolbar';
import DeleteInvoiceButton from '../../components/DeleteInvoiceButton';
import { requireUser } from '../../lib/auth';

export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

function numOrNull(v: string): number | null {
  const t = toEnDigits(v.trim()).replace(/[^0-9.]/g, '');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function pageUrl(sp: SP, page: number): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (Array.isArray(v)) v.forEach((x) => p.append(k, x));
    else if (v !== undefined) p.set(k, v);
  }
  p.set('page', String(page));
  const s = p.toString();
  return s ? `/invoices?${s}` : '/invoices';
}

function Hl({ text, query }: { text: string; query: string }) {
  const parts = splitHighlight(text, query);
  return (
    <>
      {parts.map((p, i) =>
        p.hit ? (
          <mark key={i} className="hl">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser('/invoices');
  const sp = await searchParams;
  const q = first(sp.q);
  const from = first(sp.from);
  const to = first(sp.to);
  const page = Math.max(1, Number(first(sp.page)) || 1);
  const pageSize = [10, 25, 50].includes(Number(first(sp.size))) ? Number(first(sp.size)) : 10;
  const sort = parseSortParam(first(sp.sort) || undefined, { field: 'date', dir: 'desc' });

  const { items, totalCount } = await listInvoices({
    q,
    from,
    to,
    min: numOrNull(first(sp.min)),
    max: numOrNull(first(sp.max)),
    buyerOnly: first(sp.buyer) === '1',
    sort,
    page,
    pageSize,
  });

  const activeFilterCount =
    (from ? 1 : 0) + (to ? 1 : 0) + (first(sp.min) ? 1 : 0) + (first(sp.max) ? 1 : 0) + (first(sp.buyer) === '1' ? 1 : 0);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900">فاکتورها ({toFaDigits(totalCount)})</h2>
        <Link href="/new" className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-amber-300">
          ＋ جدید
        </Link>
      </div>

      <InvoicesToolbar activeFilterCount={activeFilterCount} />

      {items.length === 0 ? (
        <Card>
          <Empty
            icon="🔍"
            title="چیزی پیدا نشد"
            desc={totalCount === 0 && !q ? 'هنوز فاکتوری ثبت نشده؛ اولین فاکتور را صادر کن.' : 'عبارت یا فیلتر دیگری را امتحان کن، یا فیلترها را پاک کن.'}
            action={
              totalCount === 0 && !q ? (
                <Link href="/new">
                  <Btn>＋ صدور فاکتور</Btn>
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {items.map((inv) => (
              <Card key={inv.id} className="p-3.5">
                <Link href={`/invoices/${inv.id}`} className="block">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-slate-800">
                      <Hl text={`فاکتور ${toFaDigits(inv.number)}`} query={q} />
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-900">
                      {formatFaMoney(grandTotal(inv))} {inv.currency}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      <Hl text={inv.buyerName || 'بدون نام خریدار'} query={q} /> • {toFaDigits(inv.items.length)} قلم
                    </span>
                    <span>{longFaDate(inv.date)}</span>
                  </div>
                </Link>
                <div className="mt-2.5 flex gap-1.5 border-t border-slate-100 pt-2.5">
                  <Link href={`/invoices/${inv.id}`} className="flex-1 rounded-lg bg-slate-100 py-2 text-center text-xs font-bold text-slate-700">👁 مشاهده</Link>
                  <Link href={`/edit/${inv.id}`} className="flex-1 rounded-lg bg-slate-100 py-2 text-center text-xs font-bold text-slate-700">✎ ویرایش</Link>
                  <DeleteInvoiceButton id={inv.id} number={toFaDigits(inv.number)} compact />
                </div>
              </Card>
            ))}
          </div>

          <Card className="hidden overflow-hidden md:block">
            <div className="thin-scroll overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500">
                    <th className="px-4 py-3 font-bold">شماره</th>
                    <th className="px-4 py-3 font-bold">تاریخ</th>
                    <th className="px-4 py-3 font-bold">خریدار</th>
                    <th className="px-4 py-3 font-bold">اقلام</th>
                    <th className="px-4 py-3 font-bold">جمع کل</th>
                    <th className="px-4 py-3 font-bold">اقدامات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50 transition last:border-0 hover:bg-amber-50/50">
                      <td className="px-4 py-3 font-black">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-amber-700">
                          <Hl text={toFaDigits(inv.number)} query={q} />
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{longFaDate(inv.date)}</td>
                      <td className="px-4 py-3">
                        <Hl text={inv.buyerName || '—'} query={q} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{toFaDigits(inv.items.length)} قلم</td>
                      <td className="whitespace-nowrap px-4 py-3 font-black">{formatFaMoney(grandTotal(inv))}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link href={`/invoices/${inv.id}`} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">مشاهده</Link>
                          <Link href={`/edit/${inv.id}`} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">ویرایش</Link>
                          <DeleteInvoiceButton id={inv.id} number={toFaDigits(inv.number)} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="flex flex-wrap items-center justify-between gap-2 p-3">
            <span className="text-[13px] font-bold text-slate-500">
              صفحه {toFaDigits(safePage)} از {toFaDigits(totalPages)} • {toFaDigits(totalCount)} فاکتور
            </span>
            <div className="flex items-center gap-1.5">
              <Link href={pageUrl(sp, 1)} aria-label="صفحه اول" className={`grid h-10 w-10 place-items-center rounded-xl bg-slate-100 font-black ${safePage <= 1 ? 'pointer-events-none opacity-40' : ''}`}>⇥</Link>
              <Link href={pageUrl(sp, Math.max(1, safePage - 1))} aria-label="صفحه قبلی" className={`h-10 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold ${safePage <= 1 ? 'pointer-events-none opacity-40' : ''}`}>قبلی</Link>
              <Link href={pageUrl(sp, Math.min(totalPages, safePage + 1))} aria-label="صفحه بعدی" className={`h-10 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-amber-300 ${safePage >= totalPages ? 'pointer-events-none opacity-40' : ''}`}>بعدی</Link>
              <Link href={pageUrl(sp, totalPages)} aria-label="صفحه آخر" className={`grid h-10 w-10 place-items-center rounded-xl bg-slate-100 font-black ${safePage >= totalPages ? 'pointer-events-none opacity-40' : ''}`}>⇤</Link>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
