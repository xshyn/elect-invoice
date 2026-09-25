import type { Invoice } from '../types';

/** منطق محاسباتی فاکتور — خالص و تست‌پذیر. هیچ وابستگی به DOM/ذخیره‌سازی ندارد. */

export function lineTotal(qty: number, unitPrice: number): number {
  if (!Number.isFinite(qty) || !Number.isFinite(unitPrice)) return 0;
  if (qty < 0 || unitPrice < 0) return 0;
  return Math.round(qty * unitPrice * 100) / 100;
}

export function subtotal(inv: Pick<Invoice, 'items'>): number {
  return inv.items.reduce((s, it) => s + lineTotal(it.qty, it.unitPrice), 0);
}

export function taxAmount(inv: Pick<Invoice, 'items' | 'taxEnabled' | 'taxRate'>): number {
  if (!inv.taxEnabled) return 0;
  const rate = Math.max(0, inv.taxRate || 0);
  return Math.round((subtotal(inv) * rate) / 100);
}

export function grandTotal(inv: Pick<Invoice, 'items' | 'discountEnabled' | 'discount' | 'taxEnabled' | 'taxRate'>): number {
  const sub = subtotal(inv);
  const disc = inv.discountEnabled ? Math.max(0, Math.min(inv.discount || 0, sub)) : 0;
  const afterDisc = sub - disc;
  const tax = inv.taxEnabled ? Math.round((afterDisc * Math.max(0, inv.taxRate || 0)) / 100) : 0;
  return Math.max(0, Math.round(afterDisc + tax));
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}
