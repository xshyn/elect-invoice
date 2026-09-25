import { useRef, useState } from 'react';
import { useApp } from '../store/app';
import { localStorageAdapter } from '../store/db';
import type { CurrencyUnit, InvoiceTitle, PaperTheme } from '../types';
import { toFaDigits } from '../utils/persian';
import { Btn, Card, Field, Txt } from '../components/ui';

const THEMES: { value: PaperTheme; label: string; swatch: string }[] = [
  { value: 'amber', label: 'کهربایی', swatch: 'bg-amber-400' },
  { value: 'teal', label: 'فیروزه‌ای', swatch: 'bg-teal-500' },
  { value: 'navy', label: 'سرمه‌ای', swatch: 'bg-slate-800' },
  { value: 'rose', label: 'گلی', swatch: 'bg-rose-500' },
];

export default function Settings() {
  const { settings, updateSettings, reload, invoices } = useApp();
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3000);
  };

  const setPhones = (i: number, v: string) => {
    const next = [...settings.phones];
    next[i] = v;
    updateSettings({ phones: next });
  };

  const handleLogo = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 500 * 1024) {
      flash('حجم لوگو باید کمتر از ۵۰۰ کیلوبایت باشد.');
      return;
    }
    const r = new FileReader();
    r.onload = () => updateSettings({ logoDataUrl: String(r.result ?? '') });
    r.readAsDataURL(f);
  };

  const handleExport = () => {
    const blob = new Blob([localStorageAdapter.exportAll()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jaryan-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    flash('فایل پشتیبان دانلود شد ✅');
  };

  const handleImport = async (f: File | undefined) => {
    if (!f) return;
    try {
      const text = await f.text();
      const { invoices: count } = localStorageAdapter.importAll(text);
      reload();
      flash(`${toFaDigits(count.length)} فاکتور بازیابی شد ✅`);
    } catch {
      flash('فایل پشتیبان معتبر نیست ❌');
    }
  };

  const handleReset = () => {
    if (!confirm('همه فاکتورها و تنظیمات پاک شود؟ این کار برگشت‌پذیر نیست!')) return;
    localStorage.removeItem('jaryan:invoices:v1');
    localStorage.removeItem('jaryan:settings:v1');
    localStorage.removeItem('jaryan:draft:v1');
    reload();
    flash('همه داده‌ها پاک شد.');
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-black text-slate-900">تنظیمات کسب‌وکار</h2>
      {msg ? (
        <div role="status" className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-amber-300">
          {msg}
        </div>
      ) : null}

      {/* پروفایل */}
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-extrabold text-slate-800">🏪 سربرگ فاکتور</h3>
        <Field label="نام کسب‌وکار">
          <Txt value={settings.name} onChange={(e) => updateSettings({ name: e.target.value })} />
        </Field>
        <Field label="توضیح / شعار">
          <Txt value={settings.tagline} onChange={(e) => updateSettings({ tagline: e.target.value })} />
        </Field>
        <div className="space-y-2">
          <span className="block text-[13px] font-bold text-slate-600">شماره‌های تماس</span>
          {settings.phones.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Txt value={p} onChange={(e) => setPhones(i, e.target.value)} inputMode="tel" aria-label={`تلفن ${i + 1}`} />
              {settings.phones.length > 1 ? (
                <button
                  onClick={() => updateSettings({ phones: settings.phones.filter((_, j) => j !== i) })}
                  aria-label={`حذف تلفن ${i + 1}`}
                  className="grid w-12 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-500"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}
          <button
            onClick={() => updateSettings({ phones: [...settings.phones, ''] })}
            className="w-full rounded-xl border-2 border-dashed border-slate-200 py-2.5 text-[13px] font-bold text-slate-500"
          >
            ＋ افزودن شماره
          </button>
        </div>
        <Field label="آدرس">
          <textarea
            value={settings.address}
            onChange={(e) => updateSettings({ address: e.target.value })}
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-[15px] outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
          />
        </Field>
        <Field label="وب‌سایت (اختیاری)">
          <Txt value={settings.website} onChange={(e) => updateSettings({ website: e.target.value })} dir="ltr" placeholder="www.example.ir" />
        </Field>
        <div>
          <span className="mb-1.5 block text-[13px] font-bold text-slate-600">لوگو (اختیاری)</span>
          <div className="flex items-center gap-3">
            {settings.logoDataUrl ? (
              <img src={settings.logoDataUrl} alt="لوگو" className="h-14 w-14 rounded-xl border object-contain" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-slate-100 text-2xl">🖼</div>
            )}
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0])} />
            <div className="flex gap-2">
              <button onClick={() => logoRef.current?.click()} className="rounded-xl bg-slate-100 px-4 py-2.5 text-[13px] font-bold">
                انتخاب تصویر
              </button>
              {settings.logoDataUrl ? (
                <button onClick={() => updateSettings({ logoDataUrl: '' })} className="rounded-xl bg-rose-50 px-4 py-2.5 text-[13px] font-bold text-rose-600">
                  حذف
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {/* شماره‌گذاری و ارز */}
      <Card className="space-y-3 p-4">
        <h3 className="text-sm font-extrabold text-slate-800">🔢 شماره‌گذاری و واحد پول</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="عنوان فرم">
            <select
              value={settings.invoiceTitle}
              onChange={(e) => updateSettings({ invoiceTitle: e.target.value as InvoiceTitle })}
              className="min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] font-bold"
            >
              <option value="صورتحساب">صورتحساب</option>
              <option value="فاکتور">فاکتور</option>
            </select>
          </Field>
          <Field label="واحد پول">
            <select
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value as CurrencyUnit })}
              className="min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] font-bold"
            >
              <option value="تومان">تومان</option>
              <option value="ریال">ریال</option>
            </select>
          </Field>
          <Field label="واحد «جمع به حروف»">
            <select
              value={settings.wordsUnit}
              onChange={(e) => updateSettings({ wordsUnit: e.target.value as CurrencyUnit })}
              className="min-h-[46px] w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] font-bold"
            >
              <option value="تومان">تومان</option>
              <option value="ریال">ریال</option>
            </select>
          </Field>
          <Field label="شماره بعدی">
            <Txt value={String(settings.nextNumber)} onChange={(e) => updateSettings({ nextNumber: Number(e.target.value.replace(/[^0-9]/g, '')) || 1 })} inputMode="numeric" className="num-input" />
          </Field>
        </div>
        <Field label="پیشوند شماره (اختیاری)" hint="مثلاً «جریان-» — می‌شود: جریان-۱۰۱">
          <Txt value={settings.numberPrefix} onChange={(e) => updateSettings({ numberPrefix: e.target.value })} placeholder="جریان-" />
        </Field>
      </Card>

      {/* تم */}
      <Card className="p-4">
        <h3 className="mb-2 text-sm font-extrabold text-slate-800">🎨 رنگ‌بندی فرم چاپی</h3>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => updateSettings({ theme: t.value })}
              aria-pressed={settings.theme === t.value}
              className={`rounded-2xl border-2 p-3 text-center ${settings.theme === t.value ? 'border-slate-900' : 'border-slate-100'}`}
            >
              <span className={`mx-auto block h-8 rounded-lg ${t.swatch}`} />
              <span className="mt-1.5 block text-xs font-bold">{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* پشتیبان‌گیری */}
      <Card className="space-y-2.5 p-4">
        <h3 className="text-sm font-extrabold text-slate-800">💾 پشتیبان‌گیری</h3>
        <p className="text-xs leading-5 text-slate-500">
          همه داده‌ها فقط در مرورگر همین گوشی ذخیره می‌شود ({toFaDigits(invoices.length)} فاکتور). مرتب خروجی JSON بگیر تا با پاک‌شدن
          حافظه مرورگر چیزی از دست نرود.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Btn onClick={handleExport} variant="soft">
            ⬆ خروجی JSON
          </Btn>
          <Btn onClick={() => fileRef.current?.click()} variant="outline">
            ⬇ بازیابی JSON
          </Btn>
        </div>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0])} />
        <button onClick={handleReset} className="w-full rounded-xl py-2.5 text-[13px] font-bold text-rose-500 hover:bg-rose-50">
          پاک کردن همه داده‌ها (خطرناک)
        </button>
      </Card>

      <Card className="p-4 text-xs leading-6 text-slate-500">
        <h3 className="mb-1 text-sm font-extrabold text-slate-800">🔒 حریم خصوصی</h3>
        هیچ داده‌ای از مرورگر خارج نمی‌شود؛ مگر وقتی خودت خروجی PDF/PNG/JSON بگیری و به‌دلخواه ارسالش کنی. این نسخه بک‌اند یا همگام‌سازی
        ابری ندارد.
      </Card>
    </div>
  );
}
