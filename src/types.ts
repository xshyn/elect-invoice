/** مدل‌های دامنه — قرارداد بین لایه ذخیره‌سازی و UI.
 *  تغییر این تایپ‌ها = تغییر قرارداد؛ با احتیاط و مستند انجام شود.
 */

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface LineItem {
  id: string;
  /** شرح کالا یا خدمات */
  desc: string;
  /** تعداد — اعشاری هم مجاز است (متر سیم و...) */
  qty: number;
  /** واحد اختیاری (متر، عدد، …) — متن آزاد */
  unit: string;
  /** قیمت واحد به واحد ارز جاری */
  unitPrice: number;
}

export type CurrencyUnit = 'تومان' | 'ریال';
export type InvoiceTitle = 'صورتحساب' | 'فاکتور';
export type PaperTheme = 'amber' | 'teal' | 'navy' | 'rose';

export interface Invoice {
  id: string;
  /** شماره/سریال فاکتور (نمایشی، یکتا) */
  number: string;
  /** تاریخ شمسی به قالب YYYY/MM/DD */
  date: string;
  /** تاریخ میلادی معادل برای مرتب‌سازی مطمئن (ISO) */
  gregorianISO: string;
  title: InvoiceTitle;
  buyerName: string;
  buyerPhone: string;
  items: LineItem[];
  /** تخفیف کلی (مبلغ ثابت) — پیش‌فرض خاموش */
  discountEnabled: boolean;
  discount: number;
  /** مالیات/ارزش افزوده درصدی — پیش‌فرض خاموش */
  taxEnabled: boolean;
  taxRate: number;
  currency: CurrencyUnit;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  phones: string[];
  address: string;
  website: string;
  logoDataUrl: string;
  invoiceTitle: InvoiceTitle;
  currency: CurrencyUnit;
  /** واحد به‌کاررفته در «جمع به حروف» */
  wordsUnit: CurrencyUnit;
  /** پیشوند شماره فاکتور، مثلاً «جریان-» */
  numberPrefix: string;
  /** شماره بعدی که به فاکتور جدید تخصیص می‌یابد */
  nextNumber: number;
  theme: PaperTheme;
  /** فهرست واحدهای پیشنهادی اقلام؛ قابل ویرایش در تنظیمات */
  units: string[];
}

/** واحدهای پیش‌فرض برقکاری — کاربر می‌تواند در تنظیمات تغییرشان دهد. */
export const DEFAULT_UNITS: string[] = ['عدد', 'متر', 'حلقه', 'بسته', 'دستگاه', 'متر مربع', 'کیلوگرم', 'ساعت'];

export const DEFAULT_BUSINESS: BusinessProfile = {
  name: 'جریان',
  tagline: 'تعمیر و فروش سیم‌کشی ساختمان • تجهیزات برق صنعتی و خانگی',
  phones: ['۰۹۱۲-۰۰۰۰۰۰۰'],
  address: 'تهران، خیابان نمونه، پلاک ۱۲',
  website: 'www.example.ir',
  logoDataUrl: '',
  invoiceTitle: 'صورتحساب',
  currency: 'تومان',
  wordsUnit: 'تومان',
  numberPrefix: '',
  nextNumber: 101,
  theme: 'amber',
  units: [...DEFAULT_UNITS],
};

export type SortField =
  | 'date'
  | 'number'
  | 'total'
  | 'buyerName'
  | 'createdAt'
  | 'updatedAt'
  | 'itemCount';

export interface SortRule {
  field: SortField;
  dir: 'asc' | 'desc';
}
