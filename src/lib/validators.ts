import { z } from 'zod';

/** Server-side input contracts. Every mutation goes through these —
 *  client-side checks are UX only, these are the real gate.
 */

export const lineItemSchema = z.object({
  desc: z.string().trim().min(1, 'شرح قلم الزامی است').max(500),
  qty: z.number().positive('تعداد باید بیشتر از صفر باشد'),
  unit: z.string().trim().max(20).default(''),
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
  units: z.array(z.string().trim().min(1).max(20)).max(30).default([]),
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

/* ---------- Auth input contracts ---------- */

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase() // 'Ostad' و 'ostad' یک حساب‌اند؛ از قفل‌شدن پشت حروف بزرگ جلوگیری می‌کند
  .min(2, 'نام کاربری حداقل ۲ حرف باشد')
  .max(40, 'نام کاربری طولانی است');

export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'گذرواژه را وارد کن'),
  next: z.string().default('/'),
});

export const setupSchema = z
  .object({
    username: usernameSchema,
    displayName: z.string().trim().max(60).default(''),
    password: z.string().min(8, 'گذرواژه حداقل ۸ حرف باشد').max(200),
    confirm: z.string(),
    next: z.string().default('/'),
  })
  .refine((v) => v.password === v.confirm, { message: 'تکرار گذرواژه یکسان نیست', path: ['confirm'] });

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, 'گذرواژه فعلی را وارد کن'),
    password: z.string().min(8, 'گذرواژه جدید حداقل ۸ حرف باشد').max(200),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: 'تکرار گذرواژه یکسان نیست', path: ['confirm'] });

/** Open-redirect guard: only same-origin absolute paths. */
export function safeNext(raw: string | undefined): string {
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/';
}

/* ---------- Draft payload (autosave). Permissive by design: half-filled
 *  forms must be storable. Unknown keys are stripped. */
export const draftSchema = z.object({
  number: z.string().max(50).default(''),
  date: z.string().max(20).default(''),
  buyerName: z.string().max(200).default(''),
  buyerPhone: z.string().max(50).default(''),
  items: z
    .array(
      z.object({
        id: z.string().max(50).default(''),
        desc: z.string().max(500).default(''),
        qty: z.number().default(1),
        unit: z.string().max(20).default(''),
        unitPrice: z.number().default(0),
      }),
    )
    .max(200)
    .default([]),
  discountEnabled: z.boolean().default(false),
  discount: z.number().default(0),
  taxEnabled: z.boolean().default(false),
  taxRate: z.number().default(0),
  notes: z.string().max(2000).default(''),
});

export type DraftPayload = z.infer<typeof draftSchema>;
