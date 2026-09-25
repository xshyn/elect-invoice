'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, Txt } from './ui';

const PAGE_SIZES = [10, 25, 50];
const SORT_FIELDS = [
  { value: 'date', label: 'تاریخ' },
  { value: 'number', label: 'شماره فاکتور' },
  { value: 'total', label: 'مبلغ کل' },
  { value: 'buyerName', label: 'نام خریدار' },
  { value: 'createdAt', label: 'زمان ایجاد' },
  { value: 'updatedAt', label: 'آخرین ویرایش' },
  { value: 'itemCount', label: 'تعداد قلم' },
] as const;

function setParam(sp: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(sp.toString());
  if (value) next.set(key, value);
  else next.delete(key);
  next.delete('page');
  return next.toString();
}

export default function InvoicesToolbar({ activeFilterCount }: { activeFilterCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get('q') ?? '');
  const [showFilters, setShowFilters] = useState(activeFilterCount > 0);
  const [sortRules, setSortRules] = useState<string[]>(() => (sp.get('sort') ?? 'date:desc').split(',').filter(Boolean));

  // Debounced free-text search → URL
  useEffect(() => {
    const current = sp.get('q') ?? '';
    if (q === current) return;
    const t = setTimeout(() => router.replace(`${pathname}?${setParam(sp, 'q', q.trim())}`, { scroll: false }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const push = (key: string, value: string) => router.replace(`${pathname}?${setParam(sp, key, value)}`, { scroll: false });

  const updateSort = (rules: string[]) => {
    setSortRules(rules);
    push('sort', rules.join(','));
  };

  const addSortRule = () => {
    const used = new Set(sortRules.map((r) => r.split(':')[0]));
    const nextField = SORT_FIELDS.find((f) => !used.has(f.value))?.value ?? 'total';
    updateSort([...sortRules, `${nextField}:desc`]);
  };

  const filterVal = (key: string) => sp.get(key) ?? '';

  return (
    <div className="space-y-3">
      <div className="relative">
        <Txt
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="جست‌وجو در شماره، خریدار، شرح کالا…"
          aria-label="جست‌وجو در فاکتورها"
          className="py-3 pr-11"
        />
        <span aria-hidden className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-300">
          ⌕
        </span>
        {q ? (
          <button
            onClick={() => setQ('')}
            aria-label="پاک کردن جست‌وجو"
            className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        ) : null}
      </div>

      <Card className="p-3 sm:p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-extrabold text-slate-700">⇅ مرتب‌سازی چندسطحی</span>
          <button onClick={addSortRule} className="text-[13px] font-bold text-amber-700" disabled={sortRules.length >= SORT_FIELDS.length}>
            ＋ افزودن سطح
          </button>
        </div>
        <div className="space-y-2">
          {sortRules.map((r, i) => {
            const [field, dir] = r.split(':');
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-xs font-black text-slate-500">
                  {(i + 1).toLocaleString('fa-IR')}
                </span>
                <select
                  value={field}
                  aria-label={`فیلد مرتب‌سازی سطح ${i + 1}`}
                  onChange={(e) => updateSort(sortRules.map((x, j) => (j === i ? `${e.target.value}:${x.split(':')[1]}` : x)))}
                  className="min-h-[42px] flex-1 rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold"
                >
                  {SORT_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <select
                  value={dir}
                  aria-label={`جهت مرتب‌سازی سطح ${i + 1}`}
                  onChange={(e) => updateSort(sortRules.map((x, j) => (j === i ? `${x.split(':')[0]}:${e.target.value}` : x)))}
                  className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold"
                >
                  <option value="desc">نزولی ↓</option>
                  <option value="asc">صعودی ↑</option>
                </select>
                {sortRules.length > 1 ? (
                  <button
                    onClick={() => updateSort(sortRules.filter((_, j) => j !== i))}
                    aria-label={`حذف سطح ${i + 1}`}
                    className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className="flex flex-1 items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] font-extrabold text-slate-600"
          >
            <span>
              ⚙ فیلترها
              {activeFilterCount > 0 ? (
                <span className="mr-2 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] text-slate-900">
                  {activeFilterCount.toLocaleString('fa-IR')}
                </span>
              ) : null}
            </span>
            <span>{showFilters ? '▴' : '▾'}</span>
          </button>
          <select
            value={filterVal('size') || '10'}
            aria-label="تعداد در هر صفحه"
            onChange={(e) => push('size', e.target.value)}
            className="min-h-[42px] rounded-xl border border-slate-200 bg-white px-2 text-sm font-bold"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s.toLocaleString('fa-IR')} در صفحه
              </option>
            ))}
          </select>
        </div>

        {showFilters ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">از تاریخ (شمسی)</span>
              <Txt defaultValue={filterVal('from')} onBlur={(e) => push('from', e.target.value.trim())} onKeyDown={(e) => { if (e.key === 'Enter') push('from', (e.target as HTMLInputElement).value.trim()); }} placeholder="۱۴۰۴/۰۱/۰۱" inputMode="numeric" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">تا تاریخ (شمسی)</span>
              <Txt defaultValue={filterVal('to')} onBlur={(e) => push('to', e.target.value.trim())} onKeyDown={(e) => { if (e.key === 'Enter') push('to', (e.target as HTMLInputElement).value.trim()); }} placeholder="۱۴۰۴/۱۲/۲۹" inputMode="numeric" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">حداقل مبلغ</span>
              <Txt defaultValue={filterVal('min')} onBlur={(e) => push('min', e.target.value.trim())} onKeyDown={(e) => { if (e.key === 'Enter') push('min', (e.target as HTMLInputElement).value.trim()); }} placeholder="۰" inputMode="numeric" className="num-input" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-slate-500">حداکثر مبلغ</span>
              <Txt defaultValue={filterVal('max')} onBlur={(e) => push('max', e.target.value.trim())} onKeyDown={(e) => { if (e.key === 'Enter') push('max', (e.target as HTMLInputElement).value.trim()); }} placeholder="۱۰٬۰۰۰٬۰۰۰" inputMode="numeric" className="num-input" />
            </label>
            <label className="col-span-2 flex cursor-pointer items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px] font-bold text-slate-600">
              <input
                type="checkbox"
                defaultChecked={sp.get('buyer') === '1'}
                onChange={(e) => push('buyer', e.target.checked ? '1' : '')}
                className="h-5 w-5 accent-amber-500"
              />
              فقط فاکتورهایی که نام خریدار دارند
            </label>
            <button
              onClick={() => router.replace(pathname, { scroll: false })}
              className="col-span-2 rounded-xl py-2 text-[13px] font-bold text-slate-400 hover:bg-slate-50"
            >
              پاک کردن همه فیلترها
            </button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
