import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { mapInvoice, mapProfile } from '../../../lib/invoices';

/** GET /api/backup → full JSON dump (invoices + settings) as a download. */
export async function GET() {
  const [invoices, profile] = await Promise.all([
    db.invoice.findMany({ orderBy: { createdAt: 'asc' }, include: { items: true } }),
    db.businessProfile.findUnique({ where: { id: 'default' } }),
  ]);

  const body = {
    app: 'jaryan-invoice',
    version: 1,
    exportedAt: new Date().toISOString(),
    invoices: invoices.map((r) => {
      const m = mapInvoice(r);
      return {
        number: m.number,
        date: m.date,
        title: m.title,
        buyerName: m.buyerName,
        buyerPhone: m.buyerPhone,
        items: m.items.map((i) => ({ desc: i.desc, qty: i.qty, unitPrice: i.unitPrice })),
        discountEnabled: m.discountEnabled,
        discount: m.discount,
        taxEnabled: m.taxEnabled,
        taxRate: m.taxRate,
        currency: m.currency,
        notes: m.notes,
      };
    }),
    settings: profile ? mapProfile(profile) : null,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return NextResponse.json(body, {
    headers: { 'Content-Disposition': `attachment; filename="jaryan-backup-${stamp}.json"` },
  });
}
