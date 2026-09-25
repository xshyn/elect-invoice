/** تبدیل عدد به حروف فارسی (پشتیبانی تا هزار میلیارد).
 *  مثال: 125000 → «یکصد و بیست و پنج هزار»
 *  واحد پول (تومان/ریال) را فراخواننده اضافه می‌کند تا تابع خالص بماند.
 */

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'هزار میلیارد'];

function threeDigitsToWords(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h > 0) parts.push(HUNDREDS[h]);
  if (rest > 0) {
    if (rest < 10) parts.push(ONES[rest]);
    else if (rest < 20) parts.push(TEENS[rest - 10]);
    else {
      const t = Math.floor(rest / 10);
      const o = rest % 10;
      parts.push(o === 0 ? TENS[t] : `${TENS[t]} و ${ONES[o]}`);
    }
  }
  return parts.join(' و ');
}

export function numberToPersianWords(input: number): string {
  if (!Number.isFinite(input)) return 'صفر';
  const n = Math.round(Math.abs(input));
  if (n === 0) return 'صفر';
  const groups: string[] = [];
  let rest = n;
  let scale = 0;
  while (rest > 0 && scale < SCALES.length) {
    const chunk = rest % 1000;
    if (chunk > 0) {
      const words = threeDigitsToWords(chunk);
      groups.unshift(SCALES[scale] ? `${words} ${SCALES[scale]}`.trim() : words);
    }
    rest = Math.floor(rest / 1000);
    scale += 1;
  }
  // اگر عدد از ظرفیت مقیاس‌ها بزرگ‌تر بود، باقیمانده را هم لحاظ کن
  if (rest > 0) groups.unshift(threeDigitsToWords(rest % 1000));
  const result = groups.join(' و ');
  return input < 0 ? `منفی ${result}` : result;
}

/** جمع کل به حروف + واحد پول، آماده نمایش در فاکتور */
export function totalInWords(total: number, unit: string): string {
  return `${numberToPersianWords(total)} ${unit}`;
}
