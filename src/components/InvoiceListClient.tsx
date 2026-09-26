'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Check, Eye, Pencil, Trash2, X } from 'lucide-react';
import type { Invoice, SortRule } from '../types';
import { grandTotal } from '../utils/calc';
import { formatFaMoney, splitHighlight, toFaDigits } from '../utils/persian';
import { longFaDate } from '../utils/jalali';
import { deleteInvoices, fetchInvoicesPage } from '../lib/actions';
import { Btn, Card, IconBtn, IconLink } from './ui';

export interface ListFilters {
  q: string;
  from: string;
  to: string;
  min: number | null;
  max: number | null;
  buyerOnly: boolean;
  sort: SortRule[];
  pageSize: number;
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

function RowDelete({
  id,
  number,
  onDeleted,
}: {
  id: string;
  number: string;
  onDeleted: (id: string) => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');

  if (!confirm) {
    return (
      <IconBtn label={`حذف فاکتور ${number}`} tone="danger" size="md" onClick={(e) => { e.stopPropagation(); setConfirm(true); }}>
        <Trash2 size={17} />
      </IconBtn>
    );
  }
  return (
    <span className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <IconBtn
        label={`تأیید حذف فاکتور ${number}`}
        tone="danger"
        size="md"
        loading={pending}
        className="!bg-rose-600 !text-white hover:!bg-rose-500"
        onClick={() =>
          start(async () => {
            const res = await deleteInvoices([id]);
            if (res.ok) {
              onDeleted(id);
            } else {
              setError(res.errors.join('، '));
              setConfirm(false);
            }
          })
        }
      >
        {!pending && <Check size={17} strokeWidth={2.5} />}
      </IconBtn>
      <IconBtn label="انصراف از حذف" size="md" disabled={pending} onClick={() => setConfirm(false)}>
        <X size={17} />
      </IconBtn>
      {error ? <span className="sr-only" role="alert">{error}</span> : null}
    </span>
  );
}

export default function InvoiceListClient({
  initialItems,
  totalCount,
  filters,
  query,
}: {
  initialItems: Invoice[];
  totalCount: number;
  filters: ListFilters;
  query: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Invoice[]>(initialItems);
  const [total, setTotal] = useState(totalCount);
  const [page, setPage] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkPending, startBulk] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const selectAllRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);

  const hasMore = items.length < total;

  const removeIds = useCallback((ids: string[]) => {
    const gone = new Set(ids);
    setItems((prev) => prev.filter((it) => !gone.has(it.id)));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of gone) next.delete(id);
      return next;
    });
    setTotal((t) => Math.max(0, t - ids.length));
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);
    try {
      const res = await fetchInvoicesPage({ ...filters, page });
      if (res.ok) {
        setItems((prev) => {
          const seen = new Set(prev.map((it) => it.id));
          return [...prev, ...res.items.filter((it) => !seen.has(it.id))];
        });
        setTotal(res.totalCount);
        setPage((p) => p + 1);
      }
    } finally {
      loadingRef.current = false;
      setLoadingMore(false);
    }
  }, [filters, page]);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { rootMargin: '700px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  const allSelected = items.length > 0 && items.every((it) => selected.has(it.id));
  const someSelected = selected.size > 0 && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected, allSelected]);

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(items.map((it) => it.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    setBulkError('');
    startBulk(async () => {
      const res = await deleteInvoices([...selected]);
      if (res.ok) {
        removeIds([...selected]);
        setConfirmBulk(false);
        router.refresh();
      } else {
        setBulkError(res.errors.join('، '));
        setConfirmBulk(false);
      }
    });
  };

  const openDetail = (id: string) => router.push(`/invoices/${id}`);

  return (
    <div className="space-y-2">
      {/* Selection + bulk action bar */}
      <div className="no-print sticky top-[70px] z-20 lg:top-3">
        <Card className={`flex items-center gap-2 px-3 py-2 shadow-md transition ${selected.size > 0 ? 'border-amber-300 dark:border-amber-400/40' : ''}`}>
          <input
            ref={selectAllRef}
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="انتخاب همه فاکتورهای نمایش داده شده"
            className="h-5 w-5 shrink-0 cursor-pointer accent-amber-500"
          />
          <span className="min-w-0 flex-1 text-[13px] font-bold text-slate-600 dark:text-slate-300">
            {selected.size > 0 ? (
              <>{toFaDigits(selected.size)} انتخاب شده</>
            ) : (
              <>انتخاب همه</>
            )}
          </span>
          {selected.size > 0 && !confirmBulk ? (
            <>
              <Btn variant="danger" size="xs" loading={bulkPending} onClick={() => setConfirmBulk(true)}>
                {!bulkPending && <Trash2 size={14} strokeWidth={2.5} />}
                حذف ({toFaDigits(selected.size)})
              </Btn>
              <Btn variant="ghost" size="xs" disabled={bulkPending} onClick={() => setSelected(new Set())}>
                لغو
              </Btn>
            </>
          ) : null}
          {selected.size > 0 && confirmBulk ? (
            <>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-300">مطمئنی؟</span>
              <Btn variant="danger" size="xs" loading={bulkPending} onClick={handleBulkDelete}>
                {!bulkPending && <Check size={14} strokeWidth={2.5} />}
                بله، حذف کن
              </Btn>
              <Btn variant="subtle" size="xs" disabled={bulkPending} onClick={() => setConfirmBulk(false)}>
                نه
              </Btn>
            </>
          ) : null}
        </Card>
        {bulkError ? (
          <p role="alert" className="mt-1.5 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
            {bulkError}
          </p>
        ) : null}
      </div>

      {/* Mobile cards */}
      <div className="space-y-2 md:hidden">
        {items.map((inv) => (
          <Card key={inv.id} className="p-3.5">
            <div className="flex gap-2.5">
              <input
                type="checkbox"
                checked={selected.has(inv.id)}
                onChange={() => toggleOne(inv.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`انتخاب فاکتور ${toFaDigits(inv.number)}`}
                className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-amber-500"
              />
              <Link
                href={`/invoices/${inv.id}`}
                aria-label={`مشاهده فاکتور ${toFaDigits(inv.number)}`}
                className="block min-w-0 flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    <Hl text={`فاکتور ${toFaDigits(inv.number)}`} query={query} />
                  </span>
                  <span className="rounded-full bg-amber-100 dark:bg-amber-400/15 px-2.5 py-1 text-[11px] font-black text-amber-900 dark:text-amber-200">
                    {formatFaMoney(grandTotal(inv))} {inv.currency}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    <Hl text={inv.buyerName || 'بدون نام خریدار'} query={query} /> • {toFaDigits(inv.items.length)} قلم
                  </span>
                  <span>{longFaDate(inv.date)}</span>
                </div>
              </Link>
            </div>
            <div className="mt-2.5 flex items-center justify-end gap-1 border-t border-slate-100 dark:border-white/10 pt-2.5">
              <IconLink href={`/invoices/${inv.id}`} label={`مشاهده فاکتور ${toFaDigits(inv.number)}`} tone="subtle">
                <Eye size={17} />
              </IconLink>
              <IconLink href={`/edit/${inv.id}`} label={`ویرایش فاکتور ${toFaDigits(inv.number)}`} tone="subtle">
                <Pencil size={17} />
              </IconLink>
              <RowDelete id={inv.id} number={toFaDigits(inv.number)} onDeleted={(id) => { removeIds([id]); router.refresh(); }} />
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop table — entire row opens the detail */}
      <Card className="hidden overflow-hidden md:block">
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs text-slate-500 dark:text-slate-400">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="انتخاب همه فاکتورهای نمایش داده شده"
                    className="block h-5 w-5 cursor-pointer accent-amber-500"
                  />
                </th>
                <th className="px-4 py-3 font-bold">شماره</th>
                <th className="px-4 py-3 font-bold">تاریخ</th>
                <th className="px-4 py-3 font-bold">خریدار</th>
                <th className="px-4 py-3 font-bold">اقلام</th>
                <th className="px-4 py-3 font-bold">جمع کل</th>
                <th className="px-4 py-3 font-bold"><span className="sr-only">اقدامات</span></th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => (
                <tr
                  key={inv.id}
                  onClick={() => openDetail(inv.id)}
                  className="cursor-pointer border-b border-slate-50 transition last:border-0 hover:bg-amber-50/50 dark:border-white/5 dark:hover:bg-amber-400/10"
                >
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(inv.id)}
                      onChange={() => toggleOne(inv.id)}
                      aria-label={`انتخاب فاکتور ${toFaDigits(inv.number)}`}
                      className="block h-5 w-5 cursor-pointer accent-amber-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-black text-slate-900 dark:text-slate-100">
                    <Hl text={toFaDigits(inv.number)} query={query} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{longFaDate(inv.date)}</td>
                  <td className="px-4 py-3">
                    <Hl text={inv.buyerName || '—'} query={query} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{toFaDigits(inv.items.length)} قلم</td>
                  <td className="whitespace-nowrap px-4 py-3 font-black">{formatFaMoney(grandTotal(inv))}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <IconLink href={`/invoices/${inv.id}`} label={`مشاهده فاکتور ${toFaDigits(inv.number)}`}>
                        <Eye size={17} />
                      </IconLink>
                      <IconLink href={`/edit/${inv.id}`} label={`ویرایش فاکتور ${toFaDigits(inv.number)}`}>
                        <Pencil size={17} />
                      </IconLink>
                      <RowDelete id={inv.id} number={toFaDigits(inv.number)} onDeleted={(id) => { removeIds([id]); router.refresh(); }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Infinite scroll sentinel + status */}
      <div ref={sentinelRef} aria-hidden className="h-1" />
      <p className="pb-2 text-center text-[13px] font-bold text-slate-500 dark:text-slate-400" role="status">
        {loadingMore ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" aria-hidden />
            در حال بارگذاری…
          </span>
        ) : hasMore ? (
          <>نمایش {toFaDigits(items.length)} از {toFaDigits(total)} فاکتور</>
        ) : items.length > 0 ? (
          <>همه {toFaDigits(total)} فاکتور نمایش داده شد</>
        ) : (
          <>فاکتوری باقی نماند؛ <button type="button" onClick={() => router.refresh()} className="cursor-pointer font-extrabold text-amber-700 underline underline-offset-4 dark:text-amber-300">بارگذاری مجدد</button></>
        )}
      </p>
    </div>
  );
}
