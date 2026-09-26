'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { BusinessProfile, Invoice } from '../types';
import { grandTotal } from '../utils/calc';
import { toFaDigits } from '../utils/persian';
import { createInvoice, deleteInvoice } from '../lib/actions';
import { exportInvoicePDF, exportInvoicePNG } from '../lib/export';
import { Btn, BtnLink } from './ui';
import ExportButton, { type ExportFormat } from './ExportButton';
import InvoicePaper from './InvoicePaper';
import InvoicePaperExport from './InvoicePaperExport';
import { ArrowRight, Copy, Pencil, Printer, Trash2 } from 'lucide-react';

export default function InvoiceViewClient({ invoice, business }: { invoice: Invoice; business: BusinessProfile }) {
  const router = useRouter();
  const [exportArmed, setExportArmed] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cloning, startClone] = useTransition();
  const [deleting, startDelete] = useTransition();

  const fileBase = `invoice-${invoice.number.replace(/\s+/g, '-')}-${invoice.date.replaceAll('/', '-')}`;

  const handleExport = async (format: ExportFormat) => {
    // Hidden export paper mounts with the dialog; wait a tick for layout.
    await new Promise((r) => setTimeout(r, 60));
    if (!exportRef.current) throw new Error('کاغذ فاکتور آماده نیست؛ دوباره امتحان کن.');
    if (format === 'pdf') await exportInvoicePDF(exportRef.current, `${fileBase}.pdf`);
    else await exportInvoicePNG(exportRef.current, `${fileBase}.png`);
  };

  const handleClone = () => {
    startClone(async () => {
      const res = await createInvoice({
        number: '',
        date: invoice.date,
        buyerName: invoice.buyerName,
        buyerPhone: invoice.buyerPhone,
        items: invoice.items.map((i) => ({ desc: i.desc, qty: i.qty, unit: i.unit ?? '', unitPrice: i.unitPrice })),
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
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between gap-2">
        <Btn variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowRight size={17} strokeWidth={2.5} />
          بازگشت
        </Btn>
        <div className="flex gap-1.5">
          <BtnLink href={`/edit/${invoice.id}`} variant="outline" size="sm">
            <Pencil size={16} strokeWidth={2.5} />
            ویرایش
          </BtnLink>
          <Btn variant="soft" size="sm" loading={cloning} onClick={handleClone}>
            {!cloning && <Copy size={16} strokeWidth={2.5} />}
            کپی
          </Btn>
        </div>
      </div>

      {/* اقدام‌ها بالای فاکتور: چاپ / خروجی / حذف */}
      <div className="no-print grid grid-cols-2 gap-2 rounded-2xl border border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900 p-3 shadow-sm sm:grid-cols-3">
        <Btn onClick={() => window.print()} size="md"><Printer size={17} strokeWidth={2.5} /> چاپ</Btn>
        <ExportButton onExport={handleExport} onOpenChange={setExportArmed} />
        <Btn onClick={() => setConfirmDelete(true)} variant="danger" size="md" className="col-span-2 sm:col-span-1">
          <Trash2 size={17} strokeWidth={2.5} /> حذف
        </Btn>
      </div>

      <InvoicePaper invoice={invoice} business={business} />

      {/* کاغذ مخصوص خروجی: همیشه روشن، فقط جدول/رنگ سازگار با کانوس */}
      {exportArmed ? (
        <div aria-hidden className="no-print" style={{ position: 'fixed', top: 0, left: '-10000px', width: 820, pointerEvents: 'none' }}>
          <InvoicePaperExport ref={exportRef} invoice={invoice} business={business} />
        </div>
      ) : null}

      <p className="no-print text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
        جمع کل: {toFaDigits(grandTotal(invoice).toLocaleString('en-US'))} {invoice.currency} • نام فایل خروجی: {fileBase}.pdf
      </p>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="تأیید حذف">
          <div className="anim-pop w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 text-center shadow-2xl dark:ring-1 dark:ring-white/10">
            <h3 className="font-extrabold">حذف فاکتور {toFaDigits(invoice.number)}؟</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">این کار برگشت‌پذیر نیست.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Btn variant="subtle" size="md" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                انصراف
              </Btn>
              <Btn
                variant="danger"
                size="md"
                loading={deleting}
                onClick={() => startDelete(async () => { await deleteInvoice(invoice.id); })}
              >
                {!deleting && <Trash2 size={17} strokeWidth={2.5} />}
                حذف کن
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
