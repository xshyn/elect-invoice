'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Prisma } from '../generated/prisma/client';
import { db } from './db';
import { computeTotals } from './invoices';
import { invoiceInputSchema, settingsSchema, type InvoiceInput, type SettingsInput } from './validators';
import { jalaliStringToISO, parseJalali, todayJalaliString } from '../utils/jalali';
import { requireUserId, touchSession } from './auth';

export type ActionResult = { ok: true; id?: string } | { ok: false; errors: string[] };

function zodErrors(e: { issues: { message: string }[] }): string[] {
  return e.issues.map((i) => i.message);
}

const NOT_AUTHED: ActionResult = { ok: false, errors: ['وارد نشده‌ای؛ دوباره وارد شو.'] };

/** Creates an invoice inside one transaction: number allocation (counter bump)
 *  and row insert are atomic, so two concurrent submits can't share a number —
 *  the UNIQUE constraint on `number` is the backstop.
 */
export async function createInvoice(raw: unknown): Promise<ActionResult> {
  if (!(await requireUserId())) return NOT_AUTHED;
  const parsed = invoiceInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const input: InvoiceInput = parsed.data;

  const date = parseJalali(input.date) ? input.date : todayJalaliString();
  const { total, itemCount, subtotal } = computeTotals(input);
  const discount = input.discountEnabled ? Math.min(input.discount, subtotal) : 0;

  try {
    const id = await db.$transaction(async (tx) => {
      const profile = await tx.businessProfile.findUnique({ where: { id: 'default' } });
      const prefix = profile?.numberPrefix ?? '';
      const next = profile?.nextNumber ?? 101;
      const number = input.number || `${prefix}${next}`;

      const created = await tx.invoice.create({
        data: {
          number,
          date,
          gregorianISO: jalaliStringToISO(date),
          title: profile?.invoiceTitle ?? 'صورتحساب',
          buyerName: input.buyerName,
          buyerPhone: input.buyerPhone,
          discountEnabled: input.discountEnabled,
          discount,
          taxEnabled: input.taxEnabled,
          taxRate: input.taxRate,
          currency: profile?.currency ?? 'تومان',
          notes: input.notes,
          total,
          itemCount,
          items: {
            create: input.items.map((it, i) => ({
              position: i,
              desc: it.desc,
              qty: it.qty,
              unitPrice: it.unitPrice,
            })),
          },
        },
      });

      await tx.businessProfile.upsert({
        where: { id: 'default' },
        update: { nextNumber: next + 1 },
        create: { id: 'default', nextNumber: next + 1 },
      });
      return created.id;
    });

    revalidatePath('/');
    revalidatePath('/invoices');
    await touchSession();
    return { ok: true, id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { ok: false, errors: ['این شماره فاکتور قبلاً ثبت شده؛ شماره دیگری وارد کن.'] };
    }
    throw e;
  }
}

export async function updateInvoice(id: string, raw: unknown): Promise<ActionResult> {
  if (!(await requireUserId())) return NOT_AUTHED;
  const parsed = invoiceInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const input: InvoiceInput = parsed.data;

  const exists = await db.invoice.findUnique({ where: { id }, select: { id: true, number: true } });
  if (!exists) return { ok: false, errors: ['فاکتور پیدا نشد.'] };

  const date = parseJalali(input.date) ? input.date : todayJalaliString();
  const { total, itemCount, subtotal } = computeTotals(input);
  const discount = input.discountEnabled ? Math.min(input.discount, subtotal) : 0;

  try {
    await db.$transaction(async (tx) => {
      await tx.lineItem.deleteMany({ where: { invoiceId: id } });
      await tx.invoice.update({
        where: { id },
        data: {
          number: input.number || exists.number,
          date,
          gregorianISO: jalaliStringToISO(date),
          buyerName: input.buyerName,
          buyerPhone: input.buyerPhone,
          discountEnabled: input.discountEnabled,
          discount,
          taxEnabled: input.taxEnabled,
          taxRate: input.taxRate,
          notes: input.notes,
          total,
          itemCount,
          items: {
            create: input.items.map((it, i) => ({
              position: i,
              desc: it.desc,
              qty: it.qty,
              unitPrice: it.unitPrice,
            })),
          },
        },
      });
    });
    revalidatePath('/');
    revalidatePath('/invoices');
    revalidatePath(`/invoices/${id}`);
    await touchSession();
    return { ok: true, id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { ok: false, errors: ['این شماره فاکتور متعلق به فاکتور دیگری است.'] };
    }
    throw e;
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  if (!(await requireUserId())) redirect('/login');
  await db.invoice.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/invoices');
  redirect('/invoices');
}

export async function updateSettings(raw: unknown): Promise<ActionResult> {
  if (!(await requireUserId())) return NOT_AUTHED;
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: zodErrors(parsed.error) };
  const s: SettingsInput = parsed.data;
  await db.businessProfile.upsert({
    where: { id: 'default' },
    update: { ...s },
    create: { id: 'default', ...s },
  });
  revalidatePath('/');
  revalidatePath('/settings');
  await touchSession();
  return { ok: true };
}

/** Full replace from a backup JSON file. Destructive by design — the client
 *  must confirm before calling.
 */
export async function importBackup(rawJson: string): Promise<{ ok: true; count: number } | { ok: false; errors: string[] }> {
  if (!(await requireUserId())) return { ok: false, errors: ['وارد نشده‌ای؛ دوباره وارد شو.'] };
  let data: unknown;
  try {
    data = JSON.parse(rawJson);
  } catch {
    return { ok: false, errors: ['فایل JSON معتبر نیست.'] };
  }
  const parsed = invoiceInputSchema
    .extend({ title: zTitle(), currency: zCurrency() })
    .array()
    .safeParse((data as { invoices?: unknown })?.invoices);
  if (!parsed.success) return { ok: false, errors: ['ساختار فایل پشتیبان معتبر نیست.'] };

  const rows = parsed.data;
  await db.$transaction(async (tx) => {
    await tx.lineItem.deleteMany({});
    await tx.invoice.deleteMany({});
    const profile = await tx.businessProfile.findUnique({ where: { id: 'default' } });
    let next = profile?.nextNumber ?? 101;
    for (const input of rows) {
      const date = parseJalali(input.date) ? input.date : todayJalaliString();
      const { total, itemCount, subtotal } = computeTotals(input);
      const discount = input.discountEnabled ? Math.min(input.discount, subtotal) : 0;
      const number = input.number || `${profile?.numberPrefix ?? ''}${next++}`;
      await tx.invoice.create({
        data: {
          number,
          date,
          gregorianISO: jalaliStringToISO(date),
          title: input.title,
          buyerName: input.buyerName,
          buyerPhone: input.buyerPhone,
          discountEnabled: input.discountEnabled,
          discount,
          taxEnabled: input.taxEnabled,
          taxRate: input.taxRate,
          currency: input.currency,
          notes: input.notes,
          total,
          itemCount,
          items: {
            create: input.items.map((it, i) => ({ position: i, desc: it.desc, qty: it.qty, unitPrice: it.unitPrice })),
          },
        },
      });
    }
    await tx.businessProfile.upsert({
      where: { id: 'default' },
      update: { nextNumber: next },
      create: { id: 'default', nextNumber: next },
    });
  });
  revalidatePath('/');
  revalidatePath('/invoices');
  await touchSession();
  return { ok: true, count: rows.length };
}

// Helpers for the extended backup schema (title/currency travel with the row).
import { z } from 'zod';
function zTitle() {
  return z.enum(['صورتحساب', 'فاکتور']).default('صورتحساب');
}
function zCurrency() {
  return z.enum(['تومان', 'ریال']).default('تومان');
}
