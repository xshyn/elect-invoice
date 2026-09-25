/** ابزارهای فارسی‌سازی اعداد و ارقام.
 *  رفتار یکدست: همه اعداد نمایشی با ارقام فارسی و جداکننده هزارگان «٬».
 */

const FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const FA_GROUP_SEP = '٬';
const FA_DECIMAL_SEP = '٫';

/** لاتین → فارسی (۰۱۲۳۴۵۶۷۸۹) */
export function toFaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => FA_DIGITS[Number(d)]);
}

/** فارسی/عربی → لاتین؛ جداکننده‌ها و حروف اضافی را هم پاک می‌کند */
export function toEnDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

/** پارس ورودی کاربر (فارسی/لاتین، با یا بدون جداکننده) به عدد */
export function parseFaNumber(input: string | number): number {
  if (typeof input === 'number') return Number.isFinite(input) ? input : 0;
  const en = toEnDigits(input)
    .replace(/[٬,\s]/g, '')
    .replace(/[٫.]/g, '.')
    .replace(/[^0-9.\-]/g, '');
  if (!en || en === '-' || en === '.') return 0;
  const n = Number(en);
  return Number.isFinite(n) ? n : 0;
}

/** قالب‌بندی مبلغ با جداکننده هزارگان و ارقام فارسی.
 *  مثال: 125000 → «۱۲۵٬۰۰۰» */
export function formatFaMoney(n: number, decimals = 0): string {
  if (!Number.isFinite(n)) n = 0;
  const fixed = n.toFixed(decimals);
  const [int, frac] = fixed.split('.');
  const grouped = Number(int).toLocaleString('en-US').replace(/,/g, FA_GROUP_SEP);
  const fa = toFaDigits(grouped);
  if (decimals === 0) return fa;
  return fa + FA_DECIMAL_SEP + toFaDigits(frac ?? '');
}

/** قالب‌بندی تعداد (حفظ اعشار معنادار تا ۲ رقم) */
export function formatFaQty(n: number): string {
  if (!Number.isFinite(n)) return toFaDigits('0');
  const rounded = Math.round(n * 100) / 100;
  const parts = String(rounded).split('.');
  const intFa = toFaDigits(Number(parts[0]).toLocaleString('en-US').replace(/,/g, FA_GROUP_SEP));
  if (!parts[1]) return intFa;
  return intFa + FA_DECIMAL_SEP + toFaDigits(parts[1]);
}

/** تاریخ شمسی YYYY/MM/DD را با ارقام فارسی برمی‌گرداند */
export function formatFaDate(jalali: string): string {
  return toFaDigits(jalali);
}

/** برجسته‌سازی عبارت جست‌وجو در متن (خروجی: آرایه‌ای از رشته/فلگ) */
export function splitHighlight(text: string, query: string): { text: string; hit: boolean }[] {
  const q = query.trim();
  if (!q) return [{ text, hit: false }];
  const needle = toEnDigits(q).toLowerCase();
  const hayLow = toEnDigits(text).toLowerCase();
  const out: { text: string; hit: boolean }[] = [];
  let i = 0;
  while (i < text.length) {
    const idx = hayLow.indexOf(needle, i);
    if (idx === -1) {
      out.push({ text: text.slice(i), hit: false });
      break;
    }
    if (idx > i) out.push({ text: text.slice(i, idx), hit: false });
    out.push({ text: text.slice(idx, idx + needle.length), hit: true });
    i = idx + needle.length;
  }
  return out;
}
