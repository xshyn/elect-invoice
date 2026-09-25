import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/app';
import { grandTotal } from '../utils/calc';
import { toFaDigits } from '../utils/persian';
import { Btn, Card } from '../components/ui';
import InvoicePaper from '../components/InvoicePaper';

export default function InvoiceView() {
  const { id } = useParams();
  const { invoices, settings, deleteInvoice } = useApp();
  const nav = useNavigate();
  const paperRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invoice = invoices.find((x) => x.id === id);
  if (!invoice) {
    return (
      <Card className="p-8 text-center">
        <p className="text-2xl">🧾</p>
        <p className="mt-2 font-extrabold text-slate-700">فاکتور پیدا نشد</p>
        <p className="mt-1 text-sm text-slate-400">شاید حذف شده باشد.</p>
        <div className="mt-4">
          <Link to="/invoices">
            <Btn>بازگشت به لیست</Btn>
          </Link>
        </div>
      </Card>
    );
  }

  const fileBase = `invoice-${invoice.number.replace(/\s+/g, '-')}-${invoice.date.replaceAll('/', '-')}`;

  const handlePrint = () => window.print();

  const handlePDF = async () => {
    if (!paperRef.current) return;
    setBusy('pdf');
    try {
      const mod = await import('html2pdf.js');
      const html2pdf = mod.default;
      await html2pdf()
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
      const html2canvas = mod.default;
      const canvas = await html2canvas(paperRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${fileBase}.png`;
      a.click();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* نوار اقدام — در چاپ مخفی */}
      <div className="no-print flex items-center justify-between gap-2">
        <button onClick={() => nav(-1)} className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
          → بازگشت
        </button>
        <div className="flex gap-1.5">
          <button onClick={() => nav(`/edit/${invoice.id}`)} className="inline-flex min-h-[44px] items-center rounded-xl bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm">
            ✎ ویرایش
          </button>
          <button onClick={() => nav(`/clone/${invoice.id}`)} className="inline-flex min-h-[44px] items-center rounded-xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-900">
            ⧉ کپی
          </button>
        </div>
      </div>

      <InvoicePaper ref={paperRef} invoice={invoice} business={settings} />

      {/* اقدام‌های خروجی — در چاپ مخفی */}
      <Card className="no-print grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
        <Btn onClick={handlePrint}>🖨 چاپ</Btn>
        <Btn onClick={handlePDF} variant="soft" disabled={busy !== null}>
          {busy === 'pdf' ? '…در حال ساخت' : '⬇ خروجی PDF'}
        </Btn>
        <Btn onClick={handlePNG} variant="outline" disabled={busy !== null}>
          {busy === 'png' ? '…در حال ساخت' : '🖼 ذخیره PNG'}
        </Btn>
        <Btn onClick={() => setConfirmDelete(true)} variant="danger">
          🗑 حذف
        </Btn>
      </Card>

      <p className="no-print text-center text-xs leading-5 text-slate-400">
        جمع کل: {toFaDigits(grandTotal(invoice).toLocaleString('en-US'))} {invoice.currency} • نام فایل خروجی: {fileBase}.pdf
      </p>

      {confirmDelete ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4" role="dialog" aria-modal="true" aria-label="تأیید حذف">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
            <h3 className="font-extrabold">حذف فاکتور {toFaDigits(invoice.number)}؟</h3>
            <p className="mt-1 text-sm text-slate-500">این کار برگشت‌پذیر نیست.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={() => setConfirmDelete(false)} className="rounded-xl bg-slate-100 py-3 text-sm font-bold">
                انصراف
              </button>
              <button
                onClick={() => {
                  deleteInvoice(invoice.id);
                  nav('/invoices');
                }}
                className="rounded-xl bg-rose-600 py-3 text-sm font-bold text-white"
              >
                حذف کن
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
