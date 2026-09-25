'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteInvoice } from '../lib/actions';

export default function DeleteInvoiceButton({ id, number, compact }: { id: string; number: string; compact?: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className={
          compact
            ? 'flex-1 rounded-lg bg-rose-50 py-2 text-xs font-bold text-rose-600'
            : 'rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50'
        }
      >
        🗑 حذف
      </button>
    );
  }

  return (
    <span className={compact ? 'flex flex-1 gap-1' : 'inline-flex gap-1'}>
      <button
        disabled={pending}
        onClick={() => start(async () => { await deleteInvoice(id); router.refresh(); })}
        className="flex-1 rounded-lg bg-rose-600 px-2 py-1.5 text-xs font-bold text-white disabled:opacity-50"
      >
        {pending ? '…' : `حذف ${number}؟`}
      </button>
      <button onClick={() => setConfirm(false)} className="rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-bold">
        نه
      </button>
    </span>
  );
}
