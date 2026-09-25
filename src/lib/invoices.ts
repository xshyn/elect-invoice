import { db } from './db';
import type { BusinessProfile, Invoice, LineItem } from '../types';
import { grandTotal, subtotal } from '../utils/calc';
import { toEnDigits } from '../utils/persian';
import { jalaliStringToISO, parseJalali } from '../utils/jalali';
import type { Prisma } from '../generated/prisma/client';

/* ---------- Mappers: Prisma rows → UI contract (src/types.ts) ---------- */

type InvoiceWithItems = Prisma.InvoiceGetPayload<{ include: { items: true } }>;

function mapItems(rows: { id: string; desc: string; qty: number; unitPrice: number }[]): LineItem[] {
  return rows.map((r) => ({ id: r.id, desc: r.desc, qty: r.qty, unitPrice: r.unitPrice }));
}

export function mapInvoice(row: InvoiceWithItems): Invoice {
  const items = [...row.items].sort((a, b) => a.position - b.position);
  return {
    id: row.id,
    number: row.number,
    date: row.date,
    gregorianISO: row.gregorianISO,
    title: row.title as Invoice['title'],
    buyerName: row.buyerName,
    buyerPhone: row.buyerPhone,
    items: mapItems(items),
    discountEnabled: row.discountEnabled,
    discount: row.discount,
    taxEnabled: row.taxEnabled,
    taxRate: row.taxRate,
    currency: row.currency as Invoice['currency'],
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function mapProfile(row: {
  name: string; tagline: string; phones: string[]; address: string; website: string;
  logoDataUrl: string; invoiceTitle: string; currency: string; wordsUnit: string;
  numberPrefix: string; nextNumber: number; theme: string;
}): BusinessProfile {
  return {
    name: row.name,
    tagline: row.tagline,
    phones: row.phones.length ? row.phones : [''],
    address: row.address,
    website: row.website,
    logoDataUrl: row.logoDataUrl,
    invoiceTitle: (row.invoiceTitle === 'فاکتور' ? 'فاکتور' : 'صورتحساب'),
    currency: (row.currency === 'ریال' ? 'ریال' : 'تومان'),
    wordsUnit: (row.wordsUnit === 'ریال' ? 'ریال' : 'تومان'),
    numberPrefix: row.numberPrefix,
    nextNumber: row.nextNumber,
    theme: (['amber', 'teal', 'navy', 'rose'] as const).includes(row.theme as BusinessProfile['theme'])
      ? (row.theme as BusinessProfile['theme'])
      : 'amber',
  };
}

/* ---------- Cached totals (single source of the formula) ---------- */

export function computeTotals(input: { items: { qty: number; unitPrice: number }[]; discountEnabled: boolean; discount: number; taxEnabled: boolean; taxRate: number }) {
  const inv = {
    items: input.items.map((i, n) => ({ id: String(n), desc: 'x', qty: i.qty, unitPrice: i.unitPrice })),
    discountEnabled: input.discountEnabled,
    discount: input.discount,
    taxEnabled: input.taxEnabled,
    taxRate: input.taxRate,
  };
  return { total: grandTotal(inv), itemCount: input.items.length, subtotal: subtotal(inv) };
}

/* ---------- Reads ---------- */

export async function getProfile(): Promise<BusinessProfile> {
  const row = await db.businessProfile.findUnique({ where: { id: 'default' } });
  if (!row) {
    return mapProfile({
      name: 'جریان', tagline: '', phones: [''], address: '', website: '',
      logoDataUrl: '', invoiceTitle: 'صورتحساب', currency: 'تومان',
      wordsUnit: 'تومان', numberPrefix: '', nextNumber: 101, theme: 'amber',
    });
  }
  return mapProfile(row);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const row = await db.invoice.findUnique({ where: { id }, include: { items: true } });
  return row ? mapInvoice(row) : null;
}

export interface ListFilter {
  q: string;
  from: string; // jalali or ''
  to: string; // jalali or ''
  min: number | null;
  max: number | null;
  buyerOnly: boolean;
  sort: { field: 'date' | 'number' | 'total' | 'buyerName' | 'createdAt' | 'updatedAt' | 'itemCount'; dir: 'asc' | 'desc' }[];
  page: number;
  pageSize: number;
}

const SORT_COLUMN = {
  date: 'gregorianISO',
  number: 'number',
  total: 'total',
  buyerName: 'buyerName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  itemCount: 'itemCount',
} as const;

export async function listInvoices(f: ListFilter): Promise<{ items: Invoice[]; totalCount: number }> {
  const and: Prisma.InvoiceWhereInput[] = [];

  const q = f.q.trim();
  if (q) {
    const qEn = toEnDigits(q);
    const ors: Prisma.InvoiceWhereInput[] = [
      { number: { contains: q, mode: 'insensitive' } },
      { buyerName: { contains: q, mode: 'insensitive' } },
      { buyerPhone: { contains: qEn } },
      { items: { some: { desc: { contains: q, mode: 'insensitive' } } } },
    ];
    if (qEn !== q) {
      ors.push(
        { number: { contains: qEn, mode: 'insensitive' } },
        { buyerPhone: { contains: q } },
      );
    }
    and.push({ OR: ors });
  }

  if (f.from && parseJalali(f.from)) and.push({ gregorianISO: { gte: jalaliStringToISO(f.from) } });
  if (f.to && parseJalali(f.to)) and.push({ gregorianISO: { lte: jalaliStringToISO(f.to) } });
  if (f.min !== null) and.push({ total: { gte: f.min } });
  if (f.max !== null) and.push({ total: { lte: f.max } });
  if (f.buyerOnly) and.push({ buyerName: { not: '' } });

  const where: Prisma.InvoiceWhereInput = and.length ? { AND: and } : {};
  const orderBy: Prisma.InvoiceOrderByWithRelationInput[] = f.sort.map((s) => ({ [SORT_COLUMN[s.field]]: s.dir }));
  const page = Math.max(1, f.page);
  const pageSize = [10, 25, 50].includes(f.pageSize) ? f.pageSize : 10;

  const [rows, totalCount] = await db.$transaction([
    db.invoice.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { items: true },
    }),
    db.invoice.count({ where }),
  ]);

  return { items: rows.map(mapInvoice), totalCount };
}

export async function dashboardStats(): Promise<{ count: number; total: number; nextNumber: number }> {
  const [count, agg, profile] = await db.$transaction([
    db.invoice.count(),
    db.invoice.aggregate({ _sum: { total: true } }),
    db.businessProfile.findUnique({ where: { id: 'default' } }),
  ]);
  return { count, total: agg._sum.total ?? 0, nextNumber: profile?.nextNumber ?? 101 };
}

export async function recentInvoices(limit = 5): Promise<Invoice[]> {
  const rows = await db.invoice.findMany({
    orderBy: { updatedAt: 'desc' },
    take: limit,
    include: { items: true },
  });
  return rows.map(mapInvoice);
}
