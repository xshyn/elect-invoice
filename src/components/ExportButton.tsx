'use client';

import { useState } from 'react';
import { Btn } from './ui';

export type ExportFormat = 'pdf' | 'png';

/** Single "Export" entry point: asks for the format, then runs the handler.
 *  Errors from rendering/saving are shown inline (never swallowed).
 */
export default function ExportButton({
  onExport,
  onOpenChange,
  label = '⬇ خروجی',
  className = '',
}: {
  onExport: (format: ExportFormat) => Promise<void>;
  /** Fires on dialog open/close (lets callers mount an off-screen paper). */
  onOpenChange?: (open: boolean) => void;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const [error, setError] = useState('');

  const setOpenState = (v: boolean) => {
    setOpen(v);
    onOpenChange?.(v);
  };

  const choose = async (format: ExportFormat) => {
    setBusy(format);
    setError('');
    try {
      await onExport(format);
      setOpenState(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خروجی ناموفق بود؛ دوباره امتحان کن.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Btn
        variant="soft"
        onClick={() => {
          setError('');
          setOpenState(true);
        }}
        className={className}
      >
        {label}
      </Btn>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="انتخاب قالب خروجی"
          onClick={() => (busy ? null : setOpenState(false))}
        >
          <div
            className="anim-pop w-full max-w-xs rounded-3xl bg-white p-5 text-center shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100">قالب خروجی</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">فاکتور ذخیره می‌شود، بعد فایل ساخته می‌شود.</p>
            {error ? (
              <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
                {error}
              </p>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => choose('pdf')}
                disabled={busy !== null}
                className="rounded-2xl border-2 border-slate-900 bg-slate-900 py-3.5 text-sm font-extrabold text-amber-300 disabled:opacity-50 dark:border-amber-400 dark:bg-amber-400 dark:text-slate-900"
              >
                {busy === 'pdf' ? '…' : '📄 PDF'}
              </button>
              <button
                onClick={() => choose('png')}
                disabled={busy !== null}
                className="rounded-2xl border-2 border-slate-200 bg-white py-3.5 text-sm font-extrabold text-slate-700 disabled:opacity-50 dark:border-white/15 dark:bg-transparent dark:text-slate-200"
              >
                {busy === 'png' ? '…' : '🖼 PNG'}
              </button>
            </div>
            <button
              onClick={() => setOpenState(false)}
              disabled={busy !== null}
              className="mt-2 w-full rounded-xl py-2.5 text-[13px] font-bold text-slate-400 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-white/5"
            >
              انصراف
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
