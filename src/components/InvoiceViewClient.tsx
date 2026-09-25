'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BusinessProfile, Invoice } from '../types';
import { grandTotal } from '../utils/calc';
import { toFaDigits } from '../utils/persian';
import { createInvoice, deleteInvoice } from '../lib/actions';
import { Btn } from './ui';
import InvoicePaper from './InvoicePaper';

export default function InvoiceViewClient({ invoice, business }: { invoice: Invoice; business: BusinessProfile }) {
  const router = useRouter();
  const paperRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cloning, startClone] = useTransition();

  const fileBase = `invoice-${invoice.number.replace(/\s+/g, '-')}-${invoice.date.replaceAll('/', '-')}`;

  const handlePDF = async () => {
    if (!paperRef.current) return;
    setBusy('pdf');
    try {
      const mod = await import('html2pdf.js');
      await mod.default()
        .set({
          margin: 6,
          filename: `${fileBase}.pdf`,
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(paperRef.current)
        .save();
    } finally {
      setBusy(null);
    }
  };

  const handlePNG = async () => {
    if (!paperRef.current) return;
    setBusy('png');
    try {
      const mod = await import('html2canvas');
      const canvas = await mod.default(paperRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${fileBase}.png`;
      a.click();
    } finally {
      setBusy(null);
    }
  };

  const handleClone = () => {
    startClone(async () => {
      const res = await createInvoice({
        number: '',
        date: invoice.date,
        buyerName: invoice.buyerName,
        buyerPhone: invoice.buyerPhone,
        items: invoice.items.map((i) => ({ desc: i.desc, qty: i.qty, unitPrice: i.unitPrice })),
        discountEnabled: invoice.discountEnabled,
        discount: invoice.discount,
        taxEnabled: invoice.taxEnabled,
        taxRate: invoice.taxRate,
        notes: invoice.notes,
      });
      if (res.ok && res.id) router.push(`/invoices/${res.id}`);
    });
  };

  return (
    <div className="space-y-3">
      <div className="no-print flex items-center justify-between gap-2">
        <button onClick={() => router.back()} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm">
          → بازگشت
        </button>
        <div className="flex gap-1.5">
          <Link href={`/edit/${invoice.id}`} className="inline-flex min-h-[44px] items-center rounded-xl bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm">
            ✎ ویرایش
          </Link>
          <button
            onClick={handleClone}
            disabled={cloning}
            className="inline-flex min-h-[44px] items-center rounded-xl bg-amber-100 dark:bg-amber-400/15 px-4 py-2 text-sm font-bold text-amber-900 dark:text-amber-200 disabled:opacity-50"
          >
            {cloning ? '…' : '⧉ کپی'}
          </button>
        </div>
      </div>

      <InvoicePaper ref={paperRef} invoice={invoice} business={business} />

      <div className="no-print grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-3 shadow-sm sm:grid-cols-4">
        <Btn onClick={() => window.print()}>🖨 چاپ</Btn>
        <Btn onClick={handlePDF} variant="soft" disabled={busy !== null}>
          {busy === 'pdf' ? '…در حال ساخت' : '⬇ خروجی PDF'}
        </Btn>
        <Btn onClick={handlePNG} variant="outline" disabled={busy !== null}>
          {busy === 'png' ? '…در حال ساخت' : '🖼 ذخیره PNG'}
        </Btn>
        <Btn onClick={() => setConfirmDelete(true)} variant="danger">
          🗑 حذف
        </Btn>
      </div>

      <p className="no-print text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
        جمع کل: {toFaDigits(grandTotal(invoice).toLocaleString('en-US'))} {invoice.currency} • نام فایل خروجی: {fileBase}.pdf
      </p>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-label="تأیید حذف">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 text-center shadow-2xl">
            <h3 className="font-extrabold">حذف فاکتور {toFaDigits(invoice.number)}؟</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">این کار برگشت‌پذیر نیست.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmDelete(false)} className="rounded-xl bg-slate-100 dark:bg-white/10 py-3 text-sm font-bold">
                انصراف
              </button>
              <button onClick={() => deleteInvoice(invoice.id)} className="rounded-xl bg-rose-600 py-3 text-sm font-bold text-white">
                حذف کن
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
