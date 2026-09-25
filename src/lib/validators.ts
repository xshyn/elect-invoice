import { z } from 'zod';

/** Server-side input contracts. Every mutation goes through these —
 *  client-side checks are UX only, these are the real gate.
 */

export const lineItemSchema = z.object({
  desc: z.string().trim().min(1, 'شرح قلم الزامی است').max(500),
  qty: z.number().positive('تعداد باید بیشتر از صفر باشد'),
  unitPrice: z.number().min(0, 'قیمت واحد نمی‌تواند منفی باشد'),
});

export const invoiceInputSchema = z.object({
  number: z.string().trim().max(50).optional().default(''),
  date: z
    .string()
    .trim()
    .regex(/^\d{4}\/\d{2}\/\d{2}$/, 'قالب تاریخ باید YYYY/MM/DD باشد'),
  buyerName: z.string().trim().max(200).default(''),
  buyerPhone: z.string().trim().max(50).default(''),
  items: z.array(lineItemSchema).min(1, 'حداقل یک قلم لازم است').max(200),
  discountEnabled: z.boolean().default(false),
  discount: z.number().min(0).default(0),
  taxEnabled: z.boolean().default(false),
  taxRate: z.number().min(0).max(100).default(0),
  notes: z.string().max(2000).default(''),
});

export type InvoiceInput = z.infer<typeof invoiceInputSchema>;

export const settingsSchema = z.object({
  name: z.string().trim().min(1, 'نام کسب‌وکار الزامی است').max(100),
  tagline: z.string().trim().max(300).default(''),
  phones: z.array(z.string().trim().max(50)).min(1).max(5),
  address: z.string().trim().max(500).default(''),
  website: z.string().trim().max(200).default(''),
  logoDataUrl: z.string().max(700_000).default(''),
  invoiceTitle: z.enum(['صورتحساب', 'فاکتور']),
  currency: z.enum(['تومان', 'ریال']),
  wordsUnit: z.enum(['تومان', 'ریال']),
  numberPrefix: z.string().trim().max(20).default(''),
  nextNumber: z.number().int().min(1),
  theme: z.enum(['amber', 'teal', 'navy', 'rose']),
});

export type SettingsInput = z.infer<typeof settingsSchema>;

const SORT_FIELDS = ['date', 'number', 'total', 'buyerName', 'createdAt', 'updatedAt', 'itemCount'] as const;
export type SortFieldName = (typeof SORT_FIELDS)[number];

/** Parses `?sort=date:desc,total:asc` — unknown fields/dirs are dropped. */
export function parseSortParam(raw: string | undefined, fallback: { field: SortFieldName; dir: 'asc' | 'desc' }): { field: SortFieldName; dir: 'asc' | 'desc' }[] {
  if (!raw) return [fallback];
  const out: { field: SortFieldName; dir: 'asc' | 'desc' }[] = [];
  for (const part of raw.split(',')) {
    const [f, d] = part.split(':');
    if ((SORT_FIELDS as readonly string[]).includes(f)) {
      out.push({ field: f as SortFieldName, dir: d === 'asc' ? 'asc' : 'desc' });
    }
  }
  return out.length ? out : [fallback];
}
