/** لایه دسترسی به داده — قرارداد ذخیره‌سازی.
 *
 *  نسخه ۱ روی localStorage سوار است (کافی برای چند هزار فاکتور).
 *  اگر روزی به IndexedDB مهاجرت کردیم، فقط همین فایل عوض می‌شود؛
 *  امضای توابع ثابت می‌ماند (قرارداد پایدار).
 *
 *  همه داده‌ها فقط در مرورگر کاربر می‌ماند و هیچ‌چیز به سرور ارسال نمی‌شود.
 */
import { DEFAULT_BUSINESS, type BusinessProfile, type Invoice } from '../types';

const K_INVOICES = 'jaryan:invoices:v1';
const K_SETTINGS = 'jaryan:settings:v1';
const K_DRAFT = 'jaryan:draft:v1';

export interface StorageAdapter {
  loadInvoices(): Invoice[];
  saveInvoices(list: Invoice[]): void;
  loadSettings(): BusinessProfile;
  saveSettings(s: BusinessProfile): void;
  loadDraft(): Partial<Invoice> | null;
  saveDraft(d: Partial<Invoice> | null): void;
  exportAll(): string;
  importAll(json: string): { invoices: Invoice[]; settings: BusinessProfile };
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // حافظه پر یا حالت ناشناس — خطا را قورت می‌دهیم تا اپ نترکد
  }
}

function sanitizeInvoice(inv: Invoice): Invoice {
  return {
    ...inv,
    items: Array.isArray(inv.items) ? inv.items : [],
    discountEnabled: !!inv.discountEnabled,
    taxEnabled: !!inv.taxEnabled,
    discount: Number(inv.discount) || 0,
    taxRate: Number(inv.taxRate) || 0,
  };
}

export const localStorageAdapter: StorageAdapter = {
  loadInvoices() {
    const list = readJSON<Invoice[]>(K_INVOICES, []);
    return Array.isArray(list) ? list.map(sanitizeInvoice) : [];
  },
  saveInvoices(list: Invoice[]) {
    writeJSON(K_INVOICES, list);
  },
  loadSettings() {
    const s = readJSON<Partial<BusinessProfile>>(K_SETTINGS, {});
    return { ...DEFAULT_BUSINESS, ...s, phones: Array.isArray(s.phones) && s.phones.length ? s.phones : DEFAULT_BUSINESS.phones };
  },
  saveSettings(s: BusinessProfile) {
    writeJSON(K_SETTINGS, s);
  },
  loadDraft() {
    return readJSON<Partial<Invoice> | null>(K_DRAFT, null);
  },
  saveDraft(d: Partial<Invoice> | null) {
    if (!d) localStorage.removeItem(K_DRAFT);
    else writeJSON(K_DRAFT, d);
  },
  exportAll() {
    return JSON.stringify(
      { app: 'jaryan-invoice', version: 1, exportedAt: new Date().toISOString(), invoices: this.loadInvoices(), settings: this.loadSettings() },
      null,
      2,
    );
  },
  importAll(json: string) {
    const data = JSON.parse(json) as { invoices?: Invoice[]; settings?: BusinessProfile };
    if (!data || !Array.isArray(data.invoices)) throw new Error('ساختار فایل پشتیبان معتبر نیست');
    const invoices = data.invoices.map(sanitizeInvoice);
    const settings = { ...DEFAULT_BUSINESS, ...(data.settings ?? {}) };
    this.saveInvoices(invoices);
    this.saveSettings(settings);
    return { invoices, settings };
  },
};
