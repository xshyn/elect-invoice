/** کمک‌های تاریخ شمسی بر پایه jalaali-js.
 *  قالب استاندارد ذخیره‌سازی: «YYYY/MM/DD» با ارقام لاتین (مرتب‌سازی رشته‌ای امن).
 *  نمایش به کاربر همیشه با ارقام فارسی انجام می‌شود (persian.ts).
 */
import { isValidJalaaliDate, toGregorian, toJalaali } from 'jalaali-js';
import { toFaDigits } from './persian';

export interface JDate {
  jy: number;
  jm: number;
  jd: number;
}

export function todayJalali(): JDate {
  const now = new Date();
  const { jy, jm, jd } = toJalaali(now);
  return { jy, jm, jd };
}

export function todayJalaliString(): string {
  const { jy, jm, jd } = todayJalali();
  return formatJalali({ jy, jm, jd });
}

export function formatJalali(d: JDate): string {
  const m = String(d.jm).padStart(2, '0');
  const day = String(d.jd).padStart(2, '0');
  return `${d.jy}/${m}/${day}`;
}

export function formatJalaliFa(d: JDate): string {
  return toFaDigits(formatJalali(d));
}

export function parseJalali(input: string): JDate | null {
  const m = input.trim().match(/^(\d{4})\s*[/\-.]\s*(\d{1,2})\s*[/\-.]\s*(\d{1,2})$/);
  if (!m) return null;
  const jy = Number(m[1]);
  const jm = Number(m[2]);
  const jd = Number(m[3]);
  if (!isValidJalaaliDate(jy, jm, jd)) return null;
  return { jy, jm, jd };
}

export function jalaliToISO(d: JDate): string {
  const g = toGregorian(d.jy, d.jm, d.jd);
  const mm = String(g.gm).padStart(2, '0');
  const dd = String(g.gd).padStart(2, '0');
  return `${g.gy}-${mm}-${dd}`;
}

export function jalaliStringToISO(s: string): string {
  const d = parseJalali(s);
  if (!d) return '';
  return jalaliToISO(d);
}

export function isoToJalaliString(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return todayJalaliString();
  const j = toJalaali(Number(m[1]), Number(m[2]), Number(m[3]));
  return formatJalali(j);
}

const JALALI_MONTHS = [
  '',
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export function jalaliMonthName(jm: number): string {
  return JALALI_MONTHS[jm] ?? '';
}

/** «۱۲ مهر ۱۴۰۴» — نمای انسانی تاریخ */
export function longFaDate(jalaliStr: string): string {
  const d = parseJalali(jalaliStr);
  if (!d) return toFaDigits(jalaliStr);
  return `${toFaDigits(String(d.jd))} ${jalaliMonthName(d.jm)} ${toFaDigits(String(d.jy))}`;
}
