'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteInvoice } from '../lib/actions';
import { Trash2 } from 'lucide-react';
import { Btn } from './ui';

export default function DeleteInvoiceButton({ id, number, compact }: { id: string; number: string; compact?: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (!confirm) {
    return (
      <Btn
        variant="dangerSoft"
        size="xs"
        onClick={() => setConfirm(true)}
        className={compact ? 'flex-1' : ''}
        aria-label={`حذف فاکتور ${number}`}
      >
        <Trash2 size={14} strokeWidth={2.5} />
        حذف
      </Btn>
    );
  }

  return (
    <span className={compact ? 'flex flex-1 gap-1.5' : 'inline-flex gap-1.5'}>
      <Btn
        variant="danger"
        size="xs"
        loading={pending}
        onClick={() => start(async () => { await deleteInvoice(id); router.refresh(); })}
        className="flex-1"
      >
        {!pending && <Trash2 size={14} strokeWidth={2.5} />}
        {pending ? 'در حال حذف…' : `حذف ${number}؟`}
      </Btn>
      <Btn variant="subtle" size="xs" onClick={() => setConfirm(false)} disabled={pending}>
        نه
      </Btn>
    </span>
  );
}
