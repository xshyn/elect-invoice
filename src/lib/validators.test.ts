import { describe, expect, it } from 'vitest';
import { draftSchema, invoiceInputSchema, lineItemSchema, parseSortParam, safeNext, settingsSchema, setupSchema } from './validators';

describe('invoice input validation', () => {
  const base = {
    number: '101',
    date: '1404/07/03',
    buyerName: 'آقای رضایی',
    buyerPhone: '0912',
    items: [{ desc: 'سیم', qty: 2, unitPrice: 50000 }],
    discountEnabled: false,
    discount: 0,
    taxEnabled: false,
    taxRate: 0,
    notes: '',
  };

  it('accepts a valid invoice', () => {
    expect(invoiceInputSchema.safeParse(base).success).toBe(true);
  });
  it('rejects empty items and bad dates', () => {
    expect(invoiceInputSchema.safeParse({ ...base, items: [] }).success).toBe(false);
    expect(invoiceInputSchema.safeParse({ ...base, date: 'not-a-date' }).success).toBe(false);
    expect(invoiceInputSchema.safeParse({ ...base, items: [{ desc: 'x', qty: 0, unitPrice: 1 }] }).success).toBe(false);
    expect(invoiceInputSchema.safeParse({ ...base, items: [{ desc: 'x', qty: 1, unitPrice: -5 }] }).success).toBe(false);
  });
});

describe('settings validation', () => {
  it('rejects empty business name and bad theme', () => {
    const good = {
      name: 'جریان', tagline: '', phones: ['0912'], address: '', website: '',
      logoDataUrl: '', invoiceTitle: 'صورتحساب', currency: 'تومان',
      wordsUnit: 'تومان', numberPrefix: '', nextNumber: 101, theme: 'amber',
    };
    expect(settingsSchema.safeParse(good).success).toBe(true);
    expect(settingsSchema.safeParse({ ...good, name: '' }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...good, theme: 'purple' }).success).toBe(false);
  });
});

describe('sort param parsing', () => {
  it('parses multi-field sort and drops unknown fields', () => {
    expect(parseSortParam('date:desc,total:asc', { field: 'date', dir: 'desc' })).toEqual([
      { field: 'date', dir: 'desc' },
      { field: 'total', dir: 'asc' },
    ]);
    expect(parseSortParam('evil:desc', { field: 'date', dir: 'desc' })).toEqual([{ field: 'date', dir: 'desc' }]);
    expect(parseSortParam(undefined, { field: 'date', dir: 'desc' })).toEqual([{ field: 'date', dir: 'desc' }]);
  });
});

describe('auth validation', () => {
  it('setup requires matching passwords of min length', () => {
    const good = { username: 'ostad', displayName: '', password: 'long-enough-1', confirm: 'long-enough-1', next: '/' };
    expect(setupSchema.safeParse(good).success).toBe(true);
    expect(setupSchema.safeParse({ ...good, confirm: 'different' }).success).toBe(false);
    expect(setupSchema.safeParse({ ...good, password: 'short', confirm: 'short' }).success).toBe(false);
    expect(setupSchema.safeParse({ ...good, username: 'x' }).success).toBe(false);
  });
  it('safeNext blocks open redirects', () => {
    expect(safeNext('/invoices')).toBe('/invoices');
    expect(safeNext('https://evil.example')).toBe('/');
    expect(safeNext('//evil.example')).toBe('/');
    expect(safeNext(undefined)).toBe('/');
  });
});

describe('line item units', () => {
  it('unit is optional and trims', () => {
    expect(lineItemSchema.safeParse({ desc: 'سیم', qty: 2, unitPrice: 5 }).success).toBe(true);
    const r = lineItemSchema.safeParse({ desc: 'سیم', qty: 2, unit: '  متر ', unitPrice: 5 });
    expect(r.success && r.data.unit).toBe('متر');
    expect(lineItemSchema.safeParse({ desc: 'x', qty: 1, unit: 'a'.repeat(21), unitPrice: 1 }).success).toBe(false);
  });
  it('drafts keep units', () => {
    const r = draftSchema.safeParse({ items: [{ desc: 'x', qty: 1, unit: 'حلقه', unitPrice: 2 }] });
    expect(r.success && r.data.items[0].unit).toBe('حلقه');
  });
});
