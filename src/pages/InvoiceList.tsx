import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/app';
import type { Invoice, SortField, SortRule } from '../types';
import { grandTotal } from '../utils/calc';
import { formatFaMoney, splitHighlight, toEnDigits, toFaDigits } from '../utils/persian';
import { jalaliStringToISO, longFaDate, parseJalali } from '../utils/jalali';
import { Btn, Card, Empty, Txt } from '../components/ui';

const PAGE_SIZES = [10, 25, 50];
const SORT_FIELDS: { value: SortField; label: string }[] = [
  { value: 'date', label: 'تاریخ' },
  { value: 'number', label: 'شماره فاکتور' },
  { value: 'total', label: 'مبلغ کل' },
  { value: 'buyerName', label: 'نام خریدار' },
  { value: 'createdAt', label: 'زمان ایجاد' },
  { value: 'updatedAt', label: 'آخرین ویرایش' },
  { value: 'itemCount', label: 'تعداد قلم' },
];

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

function compareBy(rule: SortRule) {
  return (a: Invoice, b: Invoice): number => {
    let r = 0;
    if (rule.field === 'date') r = jalaliStringToISO(a.date).localeCompare(jalaliStringToISO(b.date));
    else if (rule.field === 'number') r = toEnDigits(a.number).localeCompare(toEnDigits(b.number), 'en', { numeric: true });
    else if (rule.field === 'total') r = grandTotal(a) - grandTotal(b);
    else if (rule.field === 'buyerName') r = a.buyerName.localeCompare(b.buyerName, 'fa');
    else if (rule.field === 'createdAt') r = a.createdAt.localeCompare(b.createdAt);
    else if (rule.field === 'updatedAt') r = a.updatedAt.localeCompare(b.updatedAt);
    else if (rule.field === 'itemCount') r = a.items.length - b.items.length;
    return rule.dir === 'asc' ? r : -r;
  };
}

export default function InvoiceList() {
  const { invoices, deleteInvoice } = useApp();
  const nav = useNavigate();

  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [buyerOnly, setBuyerOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortRules, setSortRules] = useState<SortRule[]>([{ field: 'date', dir: 'desc' }]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = toEnDigits(query.trim()).toLowerCase();
    const min = minAmount.trim() ? Number(toEnDigits(minAmount).replace(/[^0-9.]/g, '')) : null;
    const max = maxAmount.trim() ? Number(toEnDigits(maxAmount).replace(/[^0-9.]/g, '')) : null;
    const fromISO = dateFrom && parseJalali(dateFrom) ? jalaliStringToISO(dateFrom) : null;
    const toISO = dateTo && parseJalali(dateTo) ? jalaliStringToISO(dateTo) : null;

    let list = invoices.filter((inv) => {
      if (buyerOnly && !inv.buyerName.trim()) return false;
      const total = grandTotal(inv);
      if (min !== null && Number.isFinite(min) && total < min) return false;
      if (max !== null && Number.isFinite(max) && total > max) return false;
      const iso = jalaliStringToISO(inv.date);
      if (fromISO && iso < fromISO) return false;
      if (toISO && iso > toISO) return false;
      if (q) {
        const hay = toEnDigits(
          `${inv.number} ${inv.buyerName} ${inv.buyerPhone} ${inv.items.map((i) => i.desc).join(' ')}`,
        ).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const comparators = sortRules.map(compareBy);
    list = [...list].sort((a, b) => {
      for (const c of comparators) {
        const r = c(a, b);
        if (r !== 0) return r;
      }
      return 0;
    });
    return list;
  }, [invoices, query, dateFrom, dateTo, minAmount, maxAmount, buyerOnly, sortRules]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const resetPage = () => setPage(1);

  const addSortRule = () => {
    const used = new Set(sortRules.map((r) => r.field));
    const next = SORT_FIELDS.find((f) => !used.has(f.value))?.value ?? 'total';
    setSortRules((p) => [...p, { field: next, dir: 'desc' }]);
  };

  const activeFilterCount =
    (dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (minAmount ? 1 : 0) + (maxAmount ? 1 : 0) + (buyerOnly ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900">فاکتورها ({toFaDigits(filtered.length)})</h2>
        <button onClick={() => nav('/new')} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-amber-300">
          ＋ جدید
        </button>
      </div>

      {/* جست‌وجو */}
      <div className="relative">
        <Txt
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            resetPage();
          }}
          placeholder="جست‌وجو در شماره، خریدار، شرح کالا…"
          aria-label="جست‌وجو در فاکتورها"
          className="py-3 pr-11"
        />
        <span aria-hidden className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-300">
          ⌕
        </span>
        {query ? (
          <button
            onClick={() => {
              setQuery('');
              resetPage();
            }}
            aria-label="پاک کردن جست‌وجو"
            className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        ) : null}
      </div>

      {/* مرتب‌سازی چندسطحی */}
      <Card className="p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-extrabold text-slate-700">⇅ مرتب‌سازی چندسطحی</span>
          <button onClick={addSortRule} className="text-[13px] font-bold text-amber-700" disabled={sortRules.length >= SORT_FIELDS.length}>
            ＋ افزودن سطح
          </button>
        </div>
        <div className="space-y-2">
          {sortRules.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">
                {toFaDigits(i + 1)}
              </span>
              <select
                value={r.field}
                aria-label={`فیلد مرتب‌سازی سطح ${i + 1}`}
                onChange={(e) => setSortRules((p) => p.map((x, j) => (j === i ? { ...x, field: e.target.value as SortField } : x)))}
                className="min-h-[42px] flex-1 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold"
              >
                {SORT_FIELDS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <select
                value={r.dir}
                aria-label={`جهت مرتب‌سازی سطح ${i + 1}`}
                onChange={(e) => setSortRules((p) => p.map((x, j) => (j === i ? { ...x, dir: e.target.value as 'asc' | 'desc' } : x)))}
                className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold"
              >
                <option value="desc">نزولی ↓</option>
                <option value="asc">صعودی ↑</option>
              </select>
              {sortRules.length > 1 ? (
                <button
                  onClick={() => setSortRules((p) => p.filter((_, j) => j !== i))}
                  aria-label={`حذف سطح ${i + 1}`}
                  className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {/* فیلترها */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] font-extrabold text-slate-600"
        >
          <span>
            ⚙ فیلترها
            {activeFilterCount > 0 ? <span className="mr-2 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] text-slate-900">{toFaDigits(activeFilterCount)}</span> : null}
          </span>
          <span>{showFilters ? '▴' : '▾'}</span>
        </button>
        {showFilters ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">از تاریخ (شمسی)</span>
              <Txt value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); resetPage(); }} placeholder="۱۴۰۴/۰۱/۰۱" inputMode="numeric" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">تا تاریخ (شمسی)</span>
              <Txt value={dateTo} onChange={(e) => { setDateTo(e.target.value); resetPage(); }} placeholder="۱۴۰۴/۱۲/۲۹" inputMode="numeric" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">حداقل مبلغ</span>
              <Txt value={minAmount} onChange={(e) => { setMinAmount(e.target.value); resetPage(); }} placeholder="۰" inputMode="numeric" className="num-input" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">حداکثر مبلغ</span>
              <Txt value={maxAmount} onChange={(e) => { setMaxAmount(e.target.value); resetPage(); }} placeholder="۱۰٬۰۰۰٬۰۰۰" inputMode="numeric" className="num-input" />
            </label>
            <label className="col-span-2 flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] font-bold text-slate-600">
              <input type="checkbox" checked={buyerOnly} onChange={(e) => { setBuyerOnly(e.target.checked); resetPage(); }} className="h-5 w-5 accent-amber-500" />
              فقط فاکتورهایی که نام خریدار دارند
            </label>
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setMinAmount('');
                setMaxAmount('');
                setBuyerOnly(false);
                resetPage();
              }}
              className="col-span-2 rounded-xl py-2 text-[13px] font-bold text-slate-400 hover:bg-slate-50"
            >
              پاک کردن همه فیلترها
            </button>
          </div>
        ) : null}
      </Card>

      {/* نتیجه */}
      {pageItems.length === 0 ? (
        <Card>
          <Empty
            icon="🔍"
            title="چیزی پیدا نشد"
            desc={invoices.length === 0 ? 'هنوز فاکتوری ثبت نشده؛ اولین فاکتور را صادر کن.' : 'عبارت یا فیلتر دیگری را امتحان کن، یا فیلترها را پاک کن.'}
            action={
              invoices.length === 0 ? (
                <Link to="/new">
                  <Btn>＋ صدور فاکتور</Btn>
                </Link>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          {/* موبایل: کارت‌ها */}
          <div className="space-y-2 md:hidden">
            {pageItems.map((inv) => (
              <Card key={inv.id} className="p-3.5">
                <Link to={`/invoices/${inv.id}`} className="block">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-extrabold text-slate-800">
                      <Hl text={`فاکتور ${toFaDigits(inv.number)}`} query={query} />
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-black text-amber-900">
                      {formatFaMoney(grandTotal(inv))} {inv.currency}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      <Hl text={inv.buyerName || 'بدون نام خریدار'} query={query} /> • {toFaDigits(inv.items.length)} قلم
                    </span>
                    <span>{longFaDate(inv.date)}</span>
                  </div>
                </Link>
                <div className="mt-2.5 flex gap-1.5 border-t border-slate-100 pt-2.5">
                  <button onClick={() => nav(`/invoices/${inv.id}`)} className="flex-1 rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-700">👁 مشاهده</button>
                  <button onClick={() => nav(`/edit/${inv.id}`)} className="flex-1 rounded-lg bg-slate-100 py-2 text-xs font-bold text-slate-700">✎ ویرایش</button>
                  <button onClick={() => setConfirmDelete(inv.id)} className="flex-1 rounded-lg bg-rose-50 py-2 text-xs font-bold text-rose-600">🗑 حذف</button>
                </div>
              </Card>
            ))}
          </div>

          {/* دسکتاپ: جدول */}
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
                  {pageItems.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50 transition last:border-0 hover:bg-amber-50/50">
                      <td className="px-4 py-3 font-black">
                        <Link to={`/invoices/${inv.id}`} className="hover:text-amber-700">
                          <Hl text={toFaDigits(inv.number)} query={query} />
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{longFaDate(inv.date)}</td>
                      <td className="px-4 py-3">
                        <Hl text={inv.buyerName || '—'} query={query} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{toFaDigits(inv.items.length)} قلم</td>
                      <td className="whitespace-nowrap px-4 py-3 font-black">{formatFaMoney(grandTotal(inv))}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => nav(`/invoices/${inv.id}`)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">مشاهده</button>
                          <button onClick={() => nav(`/edit/${inv.id}`)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100">ویرایش</button>
                          <button onClick={() => setConfirmDelete(inv.id)} className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50">حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* صفحه‌بندی */}
          <Card className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="flex items-center gap-2 text-[13px] font-bold text-slate-600">
              <span>در هر صفحه:</span>
              <select
                value={pageSize}
                aria-label="تعداد در هر صفحه"
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-200 px-2 py-1.5"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {toFaDigits(s)}
                  </option>
                ))}
              </select>
              <span className="text-slate-400">
                صفحه {toFaDigits(safePage)} از {toFaDigits(totalPages)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(1)}
                disabled={safePage <= 1}
                aria-label="صفحه اول"
                className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 font-black disabled:opacity-40"
              >
                ⇥
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                aria-label="صفحه قبلی"
                className="h-10 rounded-xl bg-slate-100 px-4 text-sm font-bold disabled:opacity-40"
              >
                قبلی
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                aria-label="صفحه بعدی"
                className="h-10 rounded-xl bg-slate-900 px-4 text-sm font-bold text-amber-300 disabled:opacity-40"
              >
                بعدی
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={safePage >= totalPages}
                aria-label="صفحه آخر"
                className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 font-black disabled:opacity-40"
              >
                ⇤
              </button>
            </div>
          </Card>
        </>
      )}

      {/* دیالوگ حذف */}
      {confirmDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-label="تأیید حذف">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-rose-100 text-2xl">🗑</div>
            <h3 className="font-extrabold text-slate-900">این فاکتور حذف شود؟</h3>
            <p className="mt-1 text-sm text-slate-500">این کار برگشت‌پذیر نیست. مطمئنی؟</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmDelete(null)} className="rounded-xl bg-slate-100 py-3 text-sm font-bold">
                انصراف
              </button>
              <button
                onClick={() => {
                  deleteInvoice(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="rounded-xl bg-rose-600 py-3 text-sm font-bold text-white"
              >
                بله، حذف کن
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
