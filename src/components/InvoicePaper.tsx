'use client';

import { forwardRef } from 'react';
import { Zap } from 'lucide-react';
import type { BusinessProfile, Invoice, PaperTheme } from '../types';
import { grandTotal, lineTotal, subtotal, taxAmount } from '../utils/calc';
import { formatFaMoney, formatFaQty, toFaDigits } from '../utils/persian';
import { longFaDate } from '../utils/jalali';
import { totalInWords } from '../utils/words';

const THEME_BAR: Record<PaperTheme, string> = {
  amber: 'bg-amber-400',
  teal: 'bg-teal-500',
  navy: 'bg-slate-800',
  rose: 'bg-rose-500',
};

const ROW_BADGE: Record<PaperTheme, string> = {
  amber: 'bg-amber-100 text-amber-900',
  teal: 'bg-teal-100 text-teal-900',
  navy: 'bg-slate-200 text-slate-900',
  rose: 'bg-rose-100 text-rose-900',
};

interface Props {
  invoice: Invoice;
  business: BusinessProfile;
  /** در حالت پیش‌نمایش وبی سایه می‌گیرد؛ در چاپ سایه حذف می‌شود */
  shadow?: boolean;
}

/** کاغذ فاکتور — هم نمای روی صفحه، هم خروجی چاپ/PDF.
 *  ساختار عین فرم کاغذی مرجع: سربرگ، مشخصات، جدول اقلام، جمع، امضا، پانوشت.
 */
const InvoicePaper = forwardRef<HTMLDivElement, Props>(function InvoicePaper({ invoice, business, shadow = true }, ref) {
  const sub = subtotal(invoice);
  const tax = taxAmount(invoice);
  const total = grandTotal(invoice);
  const disc = invoice.discountEnabled ? Math.min(invoice.discount || 0, sub) : 0;
  const bar = THEME_BAR[business.theme] ?? THEME_BAR.amber;
  const badge = ROW_BADGE[business.theme] ?? ROW_BADGE.amber;

  // سطرهای خالی برای شبیه‌ماندن به فرم کاغذی (حداقل ۵ سطر نمایشی)
  const displayRows = [...invoice.items];
  const minRows = Math.max(5, invoice.items.length);
  while (displayRows.length < minRows) displayRows.push({ id: `blank-${displayRows.length}`, desc: '', qty: 0, unit: '', unitPrice: 0 });

  return (
    <div
      ref={ref}
      id="invoice-print-area"
      className={`invoice-paper overflow-hidden rounded-xl ${shadow ? 'shadow-xl shadow-slate-900/10 ring-1 ring-slate-200' : ''}`}
    >
      {/* نوار بالای فرم */}
      <div className={`h-2.5 ${bar}`} />

      {/* ===== سربرگ ===== */}
      <div className="flex items-start justify-between gap-3 border-b-2 border-slate-900 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {business.logoDataUrl ? (
            <img src={business.logoDataUrl} alt="لوگوی کسب‌وکار" className="h-16 w-16 shrink-0 rounded-xl border border-slate-200 object-contain" />
          ) : (
            <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl text-white ${business.theme === 'amber' ? 'bg-slate-900' : bar}`}>
              <Zap size={30} strokeWidth={2.5} />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-2xl font-black leading-8 text-slate-900">{business.name}</div>
            <div className="mt-0.5 text-xs leading-5 text-slate-600">{business.tagline}</div>
            {business.website ? <div className="mt-0.5 text-[11px] text-slate-500" dir="ltr">{business.website}</div> : null}
          </div>
        </div>
        <div className="shrink-0 text-left text-[11px] leading-5 text-slate-700">
          {business.phones.map((p) => (
            <div key={p} className="font-bold" dir="ltr">
              {toFaDigits(p)}
            </div>
          ))}
          <div className="mt-1 max-w-[180px] text-slate-500">{business.address}</div>
        </div>
      </div>

      {/* ===== عنوان + مشخصات ===== */}
      <div className="px-4 pt-3 sm:px-6">
        <div className="mb-3 flex items-center justify-center gap-3">
          <span className="h-px flex-1 bg-slate-300" />
          <h2 className="rounded-full border-2 border-slate-900 px-8 py-1 text-xl font-black">{invoice.title}</h2>
          <span className="h-px flex-1 bg-slate-300" />
        </div>

        <div className="invoice-grid grid grid-cols-2 overflow-hidden rounded-lg text-[13px] sm:grid-cols-4">
          <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2">
            <span className="font-bold text-slate-500">شماره:</span>
            <span className="font-black">{toFaDigits(invoice.number)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="font-bold text-slate-500">تاریخ:</span>
            <span className="font-black">{toFaDigits(invoice.date)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2">
            <span className="font-bold text-slate-500">خریدار:</span>
            <span className="truncate font-black">{invoice.buyerName || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <span className="font-bold text-slate-500">تماس:</span>
            <span className="font-black">{invoice.buyerPhone ? toFaDigits(invoice.buyerPhone) : '—'}</span>
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">تاریخ کامل: {longFaDate(invoice.date)}</p>
      </div>

      {/* ===== جدول اقلام ===== */}
      <div className="px-4 pt-3 sm:px-6">
        <table className="invoice-grid w-full border-collapse text-center text-[13px]">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="w-12 px-2 py-2.5">ردیف</th>
              <th className="px-2 py-2.5">شرح کالا یا خدمات</th>
              <th className="w-20 px-2 py-2.5">تعداد</th>
              <th className="w-28 px-2 py-2.5">قیمت واحد</th>
              <th className="w-32 px-2 py-2.5">قیمت کل</th>
            </tr>
          </thead>
          <tbody>
            {displayRows.map((it, i) => {
              const isBlank = !it.desc && !it.qty && !it.unitPrice;
              const lt = lineTotal(it.qty, it.unitPrice);
              return (
                <tr key={it.id} className={i % 2 === 1 ? 'bg-slate-50/70' : ''}>
                  <td className="px-1 py-2">
                    <span className={`inline-grid h-7 w-7 place-items-center rounded-full text-[13px] font-black ${badge}`}>
                      {toFaDigits(i + 1)}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-right font-medium">{it.desc || (isBlank ? '\u00A0' : '')}</td>
                  <td className="px-2 py-2">{isBlank ? '' : <>{formatFaQty(it.qty)}{it.unit ? <span className="text-slate-500"> {it.unit}</span> : null}</>}</td>
                  <td className="px-2 py-2">{isBlank ? '' : formatFaMoney(it.unitPrice)}</td>
                  <td className="px-2 py-2 font-bold">{isBlank ? '' : formatFaMoney(lt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===== جمع ===== */}
      <div className="px-4 pt-3 sm:px-6">
        <div className="invoice-grid overflow-hidden rounded-lg text-[13px]">
          <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
            <span className="font-bold text-slate-600">جمع اقلام</span>
            <span className="font-black">
              {formatFaMoney(sub)} {invoice.currency}
            </span>
          </div>
          {invoice.discountEnabled && disc > 0 ? (
            <div className="flex items-center justify-between px-4 py-2">
              <span className="font-bold text-slate-600">تخفیف</span>
              <span className="font-black text-rose-600">
                {formatFaMoney(disc)} {invoice.currency}
              </span>
            </div>
          ) : null}
          {invoice.taxEnabled && tax > 0 ? (
            <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
              <span className="font-bold text-slate-600">ارزش افزوده ({toFaDigits(invoice.taxRate)}٪)</span>
              <span className="font-black">
                {formatFaMoney(tax)} {invoice.currency}
              </span>
            </div>
          ) : null}
          <div className={`flex items-center justify-between px-4 py-2.5 text-[15px] ${bar} bg-opacity-15`}>
            <span className="font-black">جمع کل (به عدد)</span>
            <span className="font-black">
              {formatFaMoney(total)} {invoice.currency}
            </span>
          </div>
          <div className="border-t border-slate-900 px-4 py-2.5 leading-7">
            <span className="font-bold text-slate-600">جمع کل به حروف: </span>
            <span className="font-bold">{totalInWords(total, business.wordsUnit || invoice.currency)}</span>
          </div>
          {invoice.notes ? (
            <div className="border-t border-slate-200 px-4 py-2 text-xs leading-6 text-slate-600">
              <span className="font-bold">توضیحات: </span>
              {invoice.notes}
            </div>
          ) : null}
        </div>
      </div>

      {/* ===== امضا و مهر ===== */}
      <div className="grid grid-cols-2 gap-3 px-4 pt-4 sm:px-6">
        <div className="rounded-lg border border-slate-900 px-3 pb-10 pt-2 text-center text-[13px]">
          <div className="font-black">امضاء خریدار</div>
        </div>
        <div className="rounded-lg border border-slate-900 px-3 pb-10 pt-2 text-center text-[13px]">
          <div className="font-black">مهر و امضاء فروشنده</div>
        </div>
      </div>

      {/* ===== پانوشت ===== */}
      <div className="mt-4 border-t-2 border-slate-900 bg-slate-50 px-4 py-3 text-center text-[11px] leading-5 text-slate-600 sm:px-6">
        <div className="font-bold">{business.address}</div>
        <div className="mt-0.5" dir="ltr">
          {business.phones.map((p) => toFaDigits(p)).join(' • ')}
        </div>
      </div>
      <div className={`h-2.5 ${bar}`} />
    </div>
  );
});

export default InvoicePaper;
