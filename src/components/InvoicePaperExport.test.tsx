import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import InvoicePaperExport from './InvoicePaperExport';
import { DEFAULT_BUSINESS, type Invoice } from '../types';

const invoice: Invoice = {
  id: 'test-1',
  number: '۱۰۱',
  date: '1404/07/03',
  gregorianISO: '2025-09-25',
  title: 'صورتحساب',
  buyerName: 'آقای رضایی',
  buyerPhone: '0912000000',
  items: [
    { id: 'a', desc: 'سیم افشان', qty: 2, unit: 'متر', unitPrice: 50000 },
    { id: 'b', desc: 'کلید مینیاتوری', qty: 1, unit: 'عدد', unitPrice: 25000 },
  ],
  discountEnabled: false,
  discount: 0,
  taxEnabled: false,
  taxRate: 0,
  currency: 'تومان',
  notes: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('InvoicePaperExport', () => {
  const html = renderToStaticMarkup(<InvoicePaperExport invoice={invoice} business={DEFAULT_BUSINESS} />);

  it('contains all key data', () => {
    expect(html).toContain('آقای رضایی');
    expect(html).toContain('سیم افشان');
    expect(html).toContain('متر');
    expect(html).toContain('۱۲۵٬۰۰۰'); // 2*50000 + 25000
    expect(html).toContain('یکصد و بیست و پنج هزار تومان');
    expect(html).toContain('۱۴۰۴/۰۷/۰۳');
    expect(html).toContain('امضاء خریدار');
    expect(html).toContain('مهر و امضاء فروشنده');
  });

  it('uses only canvas-safe layout (no grid/gap/modern colors)', () => {
    expect(html).not.toMatch(/display:\s*grid/i);
    expect(html).not.toContain('oklch');
    expect(html).not.toContain('color-mix');
    expect(html).not.toContain('dark:');
    expect(html).toContain('<table');
  });
});
