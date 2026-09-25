'use client';

import { useRef, useState, useTransition } from 'react';
import { Database, Download, Hash, ImagePlus, KeyRound, Palette, Plus, Ruler, Save, Store, Upload, X } from 'lucide-react';
import type { BusinessProfile } from '../types';
import { toFaDigits } from '../utils/persian';
import { importBackup, updateSettings } from '../lib/actions';
import { changePassword } from '../lib/auth';
import { Btn, Card, Field, PasswordInput, Txt } from './ui';

const THEMES = [
  { value: 'amber', label: 'کهربایی', swatch: 'bg-amber-400' },
  { value: 'teal', label: 'فیروزه‌ای', swatch: 'bg-teal-500' },
  { value: 'navy', label: 'سرمه‌ای', swatch: 'bg-slate-800' },
  { value: 'rose', label: 'گلی', swatch: 'bg-rose-500' },
] as const;

export default function SettingsForm({ initial, invoiceCount }: { initial: BusinessProfile; invoiceCount: number }) {
  const [s, setS] = useState<BusinessProfile>(initial);
  const [msg, setMsg] = useState('');
  const [pending, start] = useTransition();
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [unitDraft, setUnitDraft] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof BusinessProfile>(k: K, v: BusinessProfile[K]) => setS((p) => ({ ...p, [k]: v }));

  const addUnit = () => {
    const v = unitDraft.trim();
    if (!v) return;
    if (s.units.includes(v)) {
      setUnitDraft('');
      return;
    }
    set('units', [...s.units, v].slice(0, 30));
    setUnitDraft('');
  };

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(''), 3500);
  };

  const handleSave = () => {
    start(async () => {
      const res = await updateSettings({
        ...s,
        phones: s.phones.map((p) => p.trim()).filter(Boolean).length ? s.phones.map((p) => p.trim()).filter(Boolean) : [''],
      });
      flash(res.ok ? 'تنظیمات ذخیره شد.' : res.errors.join('، '));
    });
  };

  const handleLogo = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 500 * 1024) {
      flash('حجم لوگو باید کمتر از ۵۰۰ کیلوبایت باشد.');
      return;
    }
    const r = new FileReader();
    r.onload = () => set('logoDataUrl', String(r.result ?? ''));
    r.readAsDataURL(f);
  };

  const handleImport = (f: File | undefined) => {
    if (!f) return;
    if (!confirm('بازیابی جایگزین همه فاکتورهای فعلی می‌شود. ادامه می‌دهی؟')) return;
    start(async () => {
      const text = await f.text();
      const res = await importBackup(text);
      flash(res.ok ? `${toFaDigits(res.count)} فاکتور بازیابی شد.` : res.errors.join('، '));
    });
  };

  return (
    <div className="space-y-3">
      {msg ? (
        <div role="status" className="rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-amber-300">
          {msg}
        </div>
      ) : null}

      <Card className="space-y-3 p-4">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100"><Store size={16} className="text-amber-600 dark:text-amber-300" /> سربرگ فاکتور</h3>
        <Field label="نام کسب‌وکار">
          <Txt value={s.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="توضیح / شعار">
          <Txt value={s.tagline} onChange={(e) => set('tagline', e.target.value)} />
        </Field>
        <div className="space-y-2">
          <span className="block text-[13px] font-bold text-slate-600 dark:text-slate-300">شماره‌های تماس</span>
          {s.phones.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Txt value={p} onChange={(e) => set('phones', s.phones.map((x, j) => (j === i ? e.target.value : x)))} inputMode="tel" aria-label={`تلفن ${i + 1}`} />
              {s.phones.length > 1 ? (
                <button
                  onClick={() => set('phones', s.phones.filter((_, j) => j !== i))}
                  aria-label={`حذف تلفن ${i + 1}`}
                  className="grid w-12 shrink-0 place-items-center rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-500 dark:text-rose-400"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
          ))}
          <button
            onClick={() => set('phones', [...s.phones, ''])}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 py-2.5 text-[13px] font-bold text-slate-500 dark:text-slate-400"
          >
            <Plus size={15} strokeWidth={2.5} />
            افزودن شماره
          </button>
        </div>
        <Field label="آدرس">
          <textarea
            value={s.address}
            onChange={(e) => set('address', e.target.value)}
            rows={2}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 px-3.5 py-2.5 text-[15px] outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-400/20"
          />
        </Field>
        <Field label="وب‌سایت (اختیاری)">
          <Txt value={s.website} onChange={(e) => set('website', e.target.value)} dir="ltr" placeholder="www.example.ir" />
        </Field>
        <div>
          <span className="mb-1.5 block text-[13px] font-bold text-slate-600 dark:text-slate-300">لوگو (اختیاری)</span>
          <div className="flex items-center gap-3">
            {s.logoDataUrl ? (
              <img src={s.logoDataUrl} alt="لوگو" className="h-14 w-14 rounded-xl border object-contain" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-white/10 dark:text-slate-500"><ImagePlus size={24} /></div>
            )}
            <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleLogo(e.target.files?.[0])} />
            <div className="flex gap-2">
              <button onClick={() => logoRef.current?.click()} className="rounded-xl bg-slate-100 dark:bg-white/10 px-4 py-2.5 text-[13px] font-bold">
                انتخاب تصویر
              </button>
              {s.logoDataUrl ? (
                <button onClick={() => set('logoDataUrl', '')} className="rounded-xl bg-rose-50 dark:bg-rose-500/15 px-4 py-2.5 text-[13px] font-bold text-rose-600 dark:text-rose-400">
                  حذف
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100"><Hash size={16} className="text-amber-600 dark:text-amber-300" /> شماره‌گذاری و واحد پول</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="عنوان فرم">
            <select value={s.invoiceTitle} onChange={(e) => set('invoiceTitle', e.target.value as BusinessProfile['invoiceTitle'])} className="min-h-[46px] w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-[15px] font-bold">
              <option value="صورتحساب">صورتحساب</option>
              <option value="فاکتور">فاکتور</option>
            </select>
          </Field>
          <Field label="واحد پول">
            <select value={s.currency} onChange={(e) => set('currency', e.target.value as BusinessProfile['currency'])} className="min-h-[46px] w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-[15px] font-bold">
              <option value="تومان">تومان</option>
              <option value="ریال">ریال</option>
            </select>
          </Field>
          <Field label="واحد «جمع به حروف»">
            <select value={s.wordsUnit} onChange={(e) => set('wordsUnit', e.target.value as BusinessProfile['wordsUnit'])} className="min-h-[46px] w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 text-[15px] font-bold">
              <option value="تومان">تومان</option>
              <option value="ریال">ریال</option>
            </select>
          </Field>
          <Field label="شماره بعدی">
            <Txt value={String(s.nextNumber)} onChange={(e) => set('nextNumber', Number(e.target.value.replace(/[^0-9]/g, '')) || 1)} inputMode="numeric" className="num-input" />
          </Field>
        </div>
        <Field label="پیشوند شماره (اختیاری)" hint="مثلاً «جریان-» — می‌شود: جریان-۱۰۱">
          <Txt value={s.numberPrefix} onChange={(e) => set('numberPrefix', e.target.value)} placeholder="جریان-" />
        </Field>
      </Card>

      <Card className="space-y-3 p-4">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100">
          <Ruler size={16} className="text-amber-600 dark:text-amber-300" />
          واحدهای اقلام
        </h3>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          این واحدها هنگام تایپ در هر ردیف پیشنهاد می‌شوند؛ متن آزاد هم همیشه مجاز است.
        </p>
        <div className="flex flex-wrap gap-1.5">
          {s.units.map((u) => (
            <span
              key={u}
              className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 py-1.5 pr-3 pl-1.5 text-[13px] font-bold text-slate-700 dark:bg-white/5 dark:text-slate-200"
            >
              {u}
              <button
                onClick={() => set('units', s.units.filter((x) => x !== u))}
                aria-label={`حذف واحد ${u}`}
                className="grid h-6 w-6 place-items-center rounded-full text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-600 dark:text-slate-500 dark:hover:text-rose-300"
              >
                <X size={13} />
              </button>
            </span>
          ))}
          {s.units.length === 0 ? <span className="text-xs text-slate-400">واحدی تعریف نشده.</span> : null}
        </div>
        <div className="flex gap-2">
          <Txt
            value={unitDraft}
            onChange={(e) => setUnitDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addUnit();
              }
            }}
            placeholder="مثلاً قرقره"
            aria-label="واحد جدید"
          />
          <Btn variant="soft" onClick={addUnit} className="shrink-0">
            <Plus size={16} strokeWidth={2.5} />
            افزودن
          </Btn>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100">
          <Palette size={16} className="text-amber-600 dark:text-amber-300" />
          رنگ‌بندی فرم چاپی
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.value}
              onClick={() => set('theme', t.value)}
              aria-pressed={s.theme === t.value}
              className={`rounded-2xl border-2 p-3 text-center ${s.theme === t.value ? 'border-slate-900 dark:border-white' : 'border-slate-100 dark:border-white/10'}`}
            >
              <span className={`mx-auto block h-8 rounded-lg ${t.swatch}`} />
              <span className="mt-1.5 block text-xs font-bold">{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Btn onClick={handleSave} disabled={pending} className="w-full">
        {pending ? '…در حال ذخیره' : <><Save size={17} strokeWidth={2.5} /> ذخیره تنظیمات</>}
      </Btn>

      <Card className="space-y-3 p-4">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100"><KeyRound size={16} className="text-amber-600 dark:text-amber-300" /> تغییر گذرواژه</h3>
        <Field label="گذرواژه فعلی">
          <PasswordInput value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="گذرواژه جدید (حداقل ۸ حرف)">
            <PasswordInput value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="تکرار گذرواژه جدید">
            <PasswordInput value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
          </Field>
        </div>
        <Btn
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await changePassword({ current: cur, password: pw, confirm: pw2 });
              if (res.ok) {
                setCur('');
                setPw('');
                setPw2('');
              }
              flash(res.ok ? 'گذرواژه تغییر کرد (نشست‌های دیگر بسته شد).' : res.errors.join('، '));
            })
          }
        >
          تغییر گذرواژه
        </Btn>
      </Card>

      <Card className="space-y-2.5 p-4">
        <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100"><Database size={16} className="text-amber-600 dark:text-amber-300" /> پشتیبان‌گیری</h3>
        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
          داده‌ها در دیتابیس PostgreSQL خودت نگه داشته می‌شود ({toFaDigits(invoiceCount)} فاکتور). برای جابه‌جایی بین سرورها خروجی JSON بگیر.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <a href="/api/backup" download className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-amber-100 dark:bg-amber-400/15 px-4 py-2.5 text-sm font-bold text-amber-900 dark:text-amber-200 hover:bg-amber-200">
            <Upload size={16} />
            خروجی JSON
          </a>
          <Btn onClick={() => fileRef.current?.click()} variant="outline" disabled={pending}>
            <Download size={16} />
            بازیابی JSON
          </Btn>
        </div>
        <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0])} />
      </Card>
    </div>
  );
}
