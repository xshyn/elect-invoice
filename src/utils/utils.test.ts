import { describe, expect, it } from 'vitest';
import { formatFaMoney, parseFaNumber, toEnDigits, toFaDigits } from './persian';
import { numberToPersianWords } from './words';
import { grandTotal, lineTotal } from './calc';
import { jalaliStringToISO, parseJalali, todayJalaliString } from './jalali';

describe('persian utils', () => {
  it('ارقام لاتین را به فارسی تبدیل می‌کند', () => {
    expect(toFaDigits('123')).toBe('۱۲۳');
    expect(toFaDigits(101)).toBe('۱۰۱');
  });
  it('ارقام فارسی را برمی‌گرداند و ورودی کاربر را پارس می‌کند', () => {
    expect(toEnDigits('۱۲۳')).toBe('123');
    expect(parseFaNumber('۱۲۵٬۰۰۰')).toBe(125000);
    expect(parseFaNumber('125,000')).toBe(125000);
    expect(parseFaNumber('۲.۵')).toBe(2.5);
  });
  it('مبلغ را با جداکننده فارسی قالب‌بندی می‌کند', () => {
    expect(formatFaMoney(125000)).toBe('۱۲۵٬۰۰۰');
    expect(formatFaMoney(0)).toBe('۰');
  });
});

describe('number to words', () => {
  it('صفر و اعداد ساده', () => {
    expect(numberToPersianWords(0)).toBe('صفر');
    expect(numberToPersianWords(5)).toBe('پنج');
    expect(numberToPersianWords(12)).toBe('دوازده');
    expect(numberToPersianWords(20)).toBe('بیست');
  });
  it('صدگان و هزارگان', () => {
    expect(numberToPersianWords(100)).toBe('یکصد');
    expect(numberToPersianWords(125)).toBe('یکصد و بیست و پنج');
    expect(numberToPersianWords(1000)).toBe('یک هزار');
    expect(numberToPersianWords(125000)).toBe('یکصد و بیست و پنج هزار');
  });
});

describe('calc', () => {
  it('جمع سطر و جمع کل', () => {
    expect(lineTotal(2, 50000)).toBe(100000);
    expect(lineTotal(2.5, 40000)).toBe(100000);
    expect(lineTotal(-1, 5)).toBe(0);
    const inv = {
      items: [
        { id: 'a', desc: 'سیم', qty: 2, unitPrice: 50000 },
        { id: 'b', desc: 'کلید', qty: 1, unitPrice: 25000 },
      ],
      discountEnabled: false,
      discount: 0,
      taxEnabled: false,
      taxRate: 0,
    };
    expect(grandTotal(inv)).toBe(125000);
    expect(grandTotal({ ...inv, discountEnabled: true, discount: 25000 })).toBe(100000);
    expect(grandTotal({ ...inv, taxEnabled: true, taxRate: 10 })).toBe(137500);
  });
});

describe('jalali', () => {
  it('امروز معتبر است و رفت‌وبرگشت تبدیل درست کار می‌کند', () => {
    const t = todayJalaliString();
    expect(parseJalali(t)).not.toBeNull();
    expect(parseJalali('1404/07/03')).toMatchObject({ jy: 1404, jm: 7, jd: 3 });
    expect(jalaliStringToISO('1404/07/03')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
