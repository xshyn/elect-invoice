'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import type { BusinessProfile, Invoice, LineItem } from '../types';
import { grandTotal, lineTotal, subtotal, uid } from '../utils/calc';
import { parseFaNumber, toFaDigits } from '../utils/persian';
import { jalaliStringToISO, parseJalali, todayJalaliString } from '../utils/jalali';
import { createInvoice, discardDraft, saveDraft, updateInvoice } from '../lib/actions';
import type { DraftPayload } from '../lib/validators';
import { exportInvoicePDF, exportInvoicePNG } from '../lib/export';
import { Btn, Card, Field, Txt } from './ui';
import ExportButton, { type ExportFormat } from './ExportButton';
import InvoicePaper from './InvoicePaper';
import InvoicePaperExport from './InvoicePaperExport';
import { Eye, Pencil, Save } from 'lucide-react';

function emptyItem(): LineItem {
  return { id: uid(), desc: '', qty: 1, unit: '', unitPrice: 0 };
}

export type EditorMode = 'new' | 'edit' | 'clone';

export default function EditorForm({
  mode,
  initial,
  profile,
  suggestedNumber,
  initialDraft = null,
}: {
  mode: EditorMode;
  initial: Invoice | null;
  profile: BusinessProfile;
  suggestedNumber: string;
  initialDraft?: DraftPayload | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const draftSeed = mode === 'new' && !initial ? initialDraft : null;

  const [number, setNumber] = useState(
    initial && mode === 'edit' ? initial.number : (draftSeed?.number || suggestedNumber),
  );
  const [date, setDate] = useState(initial?.date ?? draftSeed?.date ?? todayJalaliString());
  const [buyerName, setBuyerName] = useState(initial?.buyerName ?? draftSeed?.buyerName ?? '');
  const [buyerPhone, setBuyerPhone] = useState(initial?.buyerPhone ?? draftSeed?.buyerPhone ?? '');
  const [items, setItems] = useState<LineItem[]>(() => {
    if (initial && initial.items.length) return initial.items.map((i) => ({ ...i, id: uid() }));
    if (draftSeed && draftSeed.items.length)
      return draftSeed.items.map((i) => ({ id: i.id || uid(), desc: i.desc, qty: i.qty, unit: i.unit ?? '', unitPrice: i.unitPrice }));
    // No default rows: the user adds what they need.
    return [];
  });
  const [discountEnabled, setDiscountEnabled] = useState(initial?.discountEnabled ?? draftSeed?.discountEnabled ?? false);
  const [discount, setDiscount] = useState(
    initial?.discount ? String(initial.discount) : draftSeed?.discount ? String(draftSeed.discount) : '',
  );
  const [taxEnabled, setTaxEnabled] = useState(initial?.taxEnabled ?? draftSeed?.taxEnabled ?? false);
  const [taxRate, setTaxRate] = useState(String(initial?.taxRate ?? draftSeed?.taxRate ?? 10));
  const [notes, setNotes] = useState(initial?.notes ?? draftSeed?.notes ?? '');
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [draftState, setDraftState] = useState<'idle' | 'saving' | 'saved'>(draftSeed ? 'saved' : 'idle');
  const [draftSavedAt, setDraftSavedAt] = useState('');
  // Export flow (no saving involved)
  const [exportArmed, setExportArmed] = useState(false);
  const hiddenPaperRef = useRef<HTMLDivElement>(null);

  // Autosave draft to the DATABASE (debounced). Empty form cleans the draft.
  useEffect(() => {
    if (mode !== 'new') return;
    setDraftState('saving');
    const t = setTimeout(() => {
      saveDraft({
        number, date, buyerName, buyerPhone,
        items: items.map((it) => ({ id: it.id, desc: it.desc, qty: it.qty, unit: it.unit ?? '', unitPrice: it.unitPrice })),
        discountEnabled, discount: parseFaNumber(discount),
        taxEnabled, taxRate: parseFaNumber(taxRate), notes,
      }).then((r) => {
        if (r.ok) {
          setDraftState('saved');
          setDraftSavedAt(new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }));
        } else {
          setDraftState('idle');
        }
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [mode, number, date, buyerName, buyerPhone, items, notes, discount, discountEnabled, taxRate, taxEnabled]);

  const discardDraftNow = () => {
    start(async () => {
      await discardDraft();
      setDraftState('idle');
      setDraftSavedAt('');
    });
  };

  const draftInv: Invoice = useMemo(
    () => ({
      id: initial?.id ?? 'preview',
      number: number || '…',
      date: parseJalali(date) ? date : todayJalaliString(),
      gregorianISO: jalaliStringToISO(parseJalali(date) ? date : todayJalaliString()),
      title: profile.invoiceTitle,
      buyerName,
      buyerPhone,
      items,
      discountEnabled,
      discount: parseFaNumber(discount),
      taxEnabled,
      taxRate: parseFaNumber(taxRate),
      currency: profile.currency,
      notes,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [initial, number, date, buyerName, buyerPhone, items, discountEnabled, discount, taxEnabled, taxRate, profile, notes],
  );

  const updateItem = (itemId: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, ...patch } : it)));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!number.trim()) errs.push('شماره فاکتور الزامی است.');
    if (!parseJalali(date)) errs.push('تاریخ معتبر نیست؛ قالب درست: ۱۴۰۴/۰۷/۰۳');
    const filled = items.filter((it) => it.desc.trim());
    if (filled.length === 0) errs.push('حداقل یک قلم با شرح وارد کن.');
    for (const it of filled) {
      if (!(it.qty > 0)) errs.push(`تعداد «${it.desc}» باید بیشتر از صفر باشد.`);
      if (!(it.unitPrice >= 0)) errs.push(`قیمت واحد «${it.desc}» نمی‌تواند منفی باشد.`);
    }
    const disc = parseFaNumber(discount);
    if (discountEnabled && disc > subtotal(draftInv)) errs.push('تخفیف نمی‌تواند از جمع اقلام بیشتر باشد.');
    return errs;
  };

  /** Shared persist used by Save AND Export (export always saves first). */
  const persist = async (): Promise<{ ok: true; id: string } | { ok: false; errors: string[] }> => {
    const payload = {
      number: number.trim(),
      date,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      items: items.filter((it) => it.desc.trim()).map((it) => ({ desc: it.desc.trim(), qty: it.qty, unit: (it.unit ?? '').trim(), unitPrice: it.unitPrice })),
      discountEnabled,
      discount: parseFaNumber(discount),
      taxEnabled,
      taxRate: parseFaNumber(taxRate),
      notes: notes.trim(),
    };
    const res = mode === 'edit' && initial ? await updateInvoice(initial.id, payload) : await createInvoice(payload);
    if (!res.ok) return res;
    if (!res.id) return { ok: false, errors: ['ذخیره انجام شد ولی شناسه برنگشت؛ از لیست ادامه بده.'] };
    if (mode === 'new') await discardDraft();
    return { ok: true, id: res.id };
  };

  const handleSave = () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    start(async () => {
      const res = await persist();
      if (!res.ok) {
        setErrors(res.errors);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      router.push(`/invoices/${res.id}`);
    });
  };

  /** Export flow: exports the CURRENT form state as-is — no saving involved.
   *  Saving stays an explicit, separate action (the Save button). */
  const handleExportDraft = async (format: ExportFormat) => {
    const fb = `invoice-${(number.trim() || '…').replace(/\s+/g, '-')}-${(parseJalali(date) ? date : todayJalaliString()).replaceAll('/', '-')}`;
    // Hidden export paper mounts with the dialog; wait a tick for layout.
    await new Promise((r) => setTimeout(r, 60));
    if (!hiddenPaperRef.current) throw new Error('کاغذ فاکتور آماده نیست؛ دوباره امتحان کن.');
    if (format === 'pdf') await exportInvoicePDF(hiddenPaperRef.current, `${fb}.pdf`);
    else await exportInvoicePNG(hiddenPaperRef.current, `${fb}.png`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
          {mode === 'edit' ? 'ویرایش فاکتور' : mode === 'clone' ? 'کپی از فاکتور' : 'فاکتور جدید'}
        </h2>
        <div className="flex rounded-xl bg-slate-200/70 dark:bg-white/10 p-1 text-[13px] font-bold" role="tablist" aria-label="حالت نمایش">
          <button role="tab" aria-selected={!preview} onClick={() => setPreview(false)} className={`rounded-lg px-4 py-2 ${!preview ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-500 dark:text-slate-400'}`}>
            <Pencil size={14} /> فرم
          </button>
          <button role="tab" aria-selected={preview} onClick={() => setPreview(true)} className={`rounded-lg px-4 py-2 ${preview ? 'bg-white dark:bg-slate-900 shadow' : 'text-slate-500 dark:text-slate-400'}`}>
            <Eye size={14} /> پیش‌نمایش
          </button>
        </div>
      </div>

      {errors.length > 0 ? (
        <div role="alert" className="rounded-2xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 p-4 text-[13px] leading-6 text-rose-700 dark:text-rose-300">
          <p className="font-extrabold">لطفاً این موارد را اصلاح کن:</p>
          <ul className="mt-1 list-disc pr-5">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {preview ? (
        <div className="space-y-3">
          <InvoicePaper invoice={draftInv} business={profile} />
          <div className="no-print flex gap-2">
            <Btn onClick={() => setPreview(false)} variant="outline" className="flex-1">
              بازگشت به فرم
            </Btn>
            <ExportButton
              onExport={handleExportDraft}
              onOpenChange={setExportArmed}
              note="خروجی از وضعیت فعلی فرم؛ برای ثبت، جداگانه ذخیره کن."
              label="خروجی"
              className="flex-1"
            />
            <Btn onClick={handleSave} disabled={pending} className="flex-1">
              {pending ? '…در حال ذخیره' : <><Save size={17} strokeWidth={2.5} /> ذخیره فاکتور</>}
            </Btn>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Card className="space-y-3 p-4">
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="شماره فاکتور">
                <Txt value={number} onChange={(e) => setNumber(e.target.value)} inputMode="numeric" aria-label="شماره فاکتور" />
              </Field>
              <Field label="تاریخ (شمسی)" hint="قالب: ۱۴۰۴/۰۷/۰۳">
                <Txt value={date} onChange={(e) => setDate(e.target.value)} inputMode="numeric" dir="ltr" className="text-center" aria-label="تاریخ فاکتور" />
              </Field>
              <Field label="نام خریدار (اختیاری)">
                <Txt value={buyerName} onChange={(e) => setBuyerName(e.target.value)} placeholder="مثلاً آقای رضایی" />
              </Field>
              <Field label="شماره تماس خریدار (اختیاری)">
                <Txt value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} inputMode="tel" placeholder="۰۹۱۲…" />
              </Field>
            </div>
            {mode === 'new' ? (
              <div className="flex items-center justify-between gap-2 rounded-xl bg-amber-50 dark:bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-800 dark:text-amber-200">
                <span>
                  پیش‌نویس در دیتابیس ذخیره می‌شود
                  {draftState === 'saving' ? '…' : draftState === 'saved' ? ` (ذخیره شد${draftSavedAt ? ` ${draftSavedAt}` : ''})` : ''}
                  ؛ با هر دستگاهی ادامه بده.
                </span>
                {draftState === 'saved' ? (
                  <button onClick={discardDraftNow} className="shrink-0 font-bold underline underline-offset-4">
                    دور بریز
                  </button>
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">اقلام ({toFaDigits(items.length)})</h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">جمع: {toFaDigits(subtotal(draftInv).toLocaleString('en-US'))}</span>
            </div>
            {items.length === 0 ? (
              <button
                onClick={() => setItems([emptyItem()])}
                className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/60 px-4 py-8 text-amber-800 transition hover:bg-amber-100 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/20"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/30">
                  <Plus size={24} strokeWidth={2.5} />
                </span>
                <span className="text-sm font-extrabold">افزودن اولین قلم</span>
                <span className="text-xs opacity-70">شرح، تعداد، واحد و قیمت را وارد کن</span>
              </button>
            ) : null}
            <div className="space-y-2.5">
              {items.map((it, idx) => (
                <div key={it.id} className="rounded-2xl border border-slate-100 dark:border-white/10 bg-slate-50/60 dark:bg-white/5 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-black text-amber-300">
                      {toFaDigits(idx + 1)}
                    </span>
                    <button
                      onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}
                      aria-label={`حذف ردیف ${idx + 1}`}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/20"
                    >
                      <Trash2 size={14} />
                      حذف
                    </button>
                  </div>
                  <Field label="شرح کالا یا خدمات">
                    <Txt value={it.desc} onChange={(e) => updateItem(it.id, { desc: e.target.value })} placeholder="مثلاً سیم‌ افشان ۲/۵ متری…" />
                  </Field>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <Field label="تعداد">
                      <Txt
                        value={it.qty === 0 && !it.desc ? '' : String(it.qty)}
                        onChange={(e) => updateItem(it.id, { qty: parseFaNumber(e.target.value) })}
                        inputMode="decimal"
                        className="num-input text-center"
                        aria-label={`تعداد ردیف ${idx + 1}`}
                      />
                    </Field>
                    <Field label="واحد (اختیاری)">
                      <Txt
                        value={it.unit ?? ''}
                        onChange={(e) => updateItem(it.id, { unit: e.target.value })}
                        placeholder="عدد"
                        list="jaryan-units"
                        aria-label={`واحد ردیف ${idx + 1}`}
                      />
                    </Field>
                    <Field label="قیمت واحد">
                      <Txt
                        value={it.unitPrice === 0 && !it.desc ? '' : String(it.unitPrice)}
                        onChange={(e) => updateItem(it.id, { unitPrice: parseFaNumber(e.target.value) })}
                        inputMode="numeric"
                        className="num-input text-center"
                        aria-label={`قیمت واحد ردیف ${idx + 1}`}
                      />
                    </Field>
                  </div>
                  <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-sm font-black text-amber-300">
                    <span className="text-xs font-bold opacity-80">قیمت کل</span>
                    <span>{toFaDigits(lineTotal(it.qty, it.unitPrice).toLocaleString('en-US'))}</span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setItems((p) => [...p, emptyItem()])}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-400/40 bg-amber-50 dark:bg-amber-400/10 py-3 text-sm font-extrabold text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-400/20"
            >
              <Plus size={17} strokeWidth={2.5} />
              افزودن ردیف
            </button>
            <datalist id="jaryan-units">
              {profile.units.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </Card>

          <Card className="space-y-3 p-4">
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm font-bold">
              <span>تخفیف کلی</span>
              <input type="checkbox" checked={discountEnabled} onChange={(e) => setDiscountEnabled(e.target.checked)} className="h-5 w-5 accent-amber-500" />
            </label>
            {discountEnabled ? (
              <Field label={`مبلغ تخفیف (${profile.currency})`}>
                <Txt value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="numeric" className="num-input" />
              </Field>
            ) : null}
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-sm font-bold">
              <span>مالیات / ارزش افزوده (٪)</span>
              <input type="checkbox" checked={taxEnabled} onChange={(e) => setTaxEnabled(e.target.checked)} className="h-5 w-5 accent-amber-500" />
            </label>
            {taxEnabled ? (
              <Field label="درصد مالیات">
                <Txt value={taxRate} onChange={(e) => setTaxRate(e.target.value)} inputMode="decimal" className="num-input" />
              </Field>
            ) : null}
            <Field label="توضیحات (اختیاری)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="شرایط پرداخت، گارانتی و…"
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-[15px] outline-none placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:focus:ring-amber-400/20"
              />
            </Field>
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-amber-300">
              <span className="text-sm font-bold">جمع کل</span>
              <span className="text-lg font-black">{toFaDigits(grandTotal(draftInv).toLocaleString('en-US'))}</span>
            </div>
          </Card>

          <div className="no-print sticky bottom-20 flex gap-2 md:static">
            <Btn onClick={() => router.back()} variant="outline" className="flex-1" disabled={pending}>
              انصراف
            </Btn>
            <ExportButton
              onExport={handleExportDraft}
              onOpenChange={setExportArmed}
              note="خروجی از وضعیت فعلی فرم؛ برای ثبت، جداگانه ذخیره کن."
              label="خروجی"
              className="flex-1"
            />
            <Btn onClick={handleSave} disabled={pending} className="flex-[2]">
              {pending ? '…در حال ذخیره' : <><Save size={17} strokeWidth={2.5} /> ذخیره فاکتور</>}
            </Btn>
          </div>

          {/* کاغذ مخصوص خروجی: همیشه روشن، فقط جدول/رنگ سازگار با کانوس */}
          {exportArmed ? (
            <div aria-hidden className="no-print" style={{ position: 'fixed', top: 0, left: '-10000px', width: 820, pointerEvents: 'none' }}>
              <InvoicePaperExport ref={hiddenPaperRef} invoice={draftInv} business={profile} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
