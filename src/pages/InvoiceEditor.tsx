import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../store/app';
import type { Invoice, LineItem } from '../types';
import { localStorageAdapter } from '../store/db';
import { grandTotal, lineTotal, subtotal, uid } from '../utils/calc';
import { parseFaNumber, toFaDigits } from '../utils/persian';
import { jalaliStringToISO, parseJalali, todayJalaliString } from '../utils/jalali';
import { Btn, Card, Field, Txt } from '../components/ui';
import InvoicePaper from '../components/InvoicePaper';

function emptyItem(): LineItem {
  return { id: uid(), desc: '', qty: 1, unitPrice: 0 };
}

interface Draft extends Partial<Invoice> {
  __editId?: string;
}

export default function InvoiceEditor({ mode }: { mode: 'new' | 'edit' | 'clone' }) {
  const { invoices, settings, saveInvoice, allocateNumber } = useApp();
  const nav = useNavigate();
  const { id } = useParams();
  const allocated = useRef(false);

  const source: Invoice | undefined = useMemo(() => {
    if ((mode === 'edit' || mode === 'clone') && id) return invoices.find((x) => x.id === id);
    return undefined;
  }, [mode, id, invoices]);

  const [number, setNumber] = useState('');
  const [date, setDate] = useState(todayJalaliString());
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [items, setItems] = useState<LineItem[]>(() => Array.from({ length: 5 }, emptyItem));
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discount, setDiscount] = useState('');
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState('۱۰');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [restored, setRestored] = useState(false);

  // مقداردهی اولیه
  useEffect(() => {
    if (mode === 'edit' && source) {
      setNumber(source.number);
      setDate(source.date);
      setBuyerName(source.buyerName);
      setBuyerPhone(source.buyerPhone);
      setItems(source.items.length ? source.items.map((i) => ({ ...i })) : [emptyItem()]);
      setDiscountEnabled(source.discountEnabled);
      setDiscount(source.discount ? String(source.discount) : '');
      setTaxEnabled(source.taxEnabled);
      setTaxRate(String(source.taxRate || 10));
      setNotes(source.notes);
      return;
    }
    if (mode === 'clone' && source) {
      setNumber('');
      setDate(todayJalaliString());
      setBuyerName(source.buyerName);
      setBuyerPhone(source.buyerPhone);
      setItems(source.items.map((i) => ({ ...i, id: uid() })));
      setDiscountEnabled(source.discountEnabled);
      setDiscount(source.discount ? String(source.discount) : '');
      setTaxEnabled(source.taxEnabled);
      setTaxRate(String(source.taxRate || 10));
      setNotes(source.notes);
      return;
    }
    // حالت جدید: بازیابی پیش‌نویس خودکار
    if (mode === 'new' && !restored) {
      const draft = localStorageAdapter.loadDraft() as Draft | null;
      if (draft && (draft.items?.length || draft.buyerName || draft.number)) {
        setNumber(draft.number ?? '');
        setDate(draft.date ?? todayJalaliString());
        setBuyerName(draft.buyerName ?? '');
        setBuyerPhone(draft.buyerPhone ?? '');
        if (draft.items?.length) setItems(draft.items as LineItem[]);
        setNotes(draft.notes ?? '');
      }
      setRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, source?.id]);

  // تخصیص شماره خودکار برای فاکتور جدید
  useEffect(() => {
    if (mode === 'new' && !number && !allocated.current) {
      allocated.current = true;
      setNumber(allocateNumber());
    }
  }, [mode, number, allocateNumber]);

  // پیش‌نویس خودکار (debounce نیم‌ثانیه‌ای)
  useEffect(() => {
    if (mode !== 'new') return;
    const t = setTimeout(() => {
      localStorageAdapter.saveDraft({ number, date, buyerName, buyerPhone, items, notes });
    }, 500);
    return () => clearTimeout(t);
  }, [mode, number, date, buyerName, buyerPhone, items, notes]);

  const draftInv: Invoice = useMemo(
    () => ({
      id: source?.id ?? 'preview',
      number: number || '…',
      date: parseJalali(date) ? date : todayJalaliString(),
      gregorianISO: jalaliStringToISO(parseJalali(date) ? date : todayJalaliString()),
      title: settings.invoiceTitle,
      buyerName,
      buyerPhone,
      items,
      discountEnabled,
      discount: parseFaNumber(discount),
      taxEnabled,
      taxRate: parseFaNumber(taxRate),
      currency: settings.currency,
      notes,
      createdAt: source?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    [source, number, date, buyerName, buyerPhone, items, discountEnabled, discount, taxEnabled, taxRate, settings, notes],
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

  const handleSave = () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const now = new Date().toISOString();
    const filled = items.filter((it) => it.desc.trim());
    if (mode === 'edit' && source) {
      saveInvoice({ ...draftInv, id: source.id, items: filled, createdAt: source.createdAt, updatedAt: now });
      nav(`/invoices/${source.id}`);
    } else {
      const inv: Invoice = { ...draftInv, id: uid(), items: filled, createdAt: now, updatedAt: now };
      saveInvoice(inv);
      if (mode === 'new') localStorageAdapter.saveDraft(null);
      nav(`/invoices/${inv.id}`);
    }
  };

  if ((mode === 'edit' || mode === 'clone') && !source) {
    return (
      <Card className="p-8 text-center">
        <p className="font-bold text-slate-600">فاکتور پیدا نشد.</p>
        <div className="mt-4">
          <Btn onClick={() => nav('/invoices')}>بازگشت به لیست</Btn>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-black text-slate-900">
          {mode === 'edit' ? 'ویرایش فاکتور' : mode === 'clone' ? 'کپی از فاکتور' : 'فاکتور جدید'}
        </h2>
        <div className="flex rounded-xl bg-slate-200/70 p-1 text-[13px] font-bold" role="tablist" aria-label="حالت نمایش">
          <button
            role="tab"
            aria-selected={!preview}
            onClick={() => setPreview(false)}
            className={`rounded-lg px-4 py-2 ${!preview ? 'bg-white shadow' : 'text-slate-500'}`}
          >
            ✎ فرم
          </button>
          <button
            role="tab"
            aria-selected={preview}
            onClick={() => setPreview(true)}
            className={`rounded-lg px-4 py-2 ${preview ? 'bg-white shadow' : 'text-slate-500'}`}
          >
            👁 پیش‌نمایش
          </button>
        </div>
      </div>

      {errors.length > 0 ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-[13px] leading-6 text-rose-700">
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
          <InvoicePaper invoice={draftInv} business={settings} />
          <div className="no-print flex gap-2">
            <Btn onClick={() => setPreview(false)} variant="outline" className="flex-1">
              بازگشت به فرم
            </Btn>
            <Btn onClick={handleSave} className="flex-1">
              💾 ذخیره فاکتور
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
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
              💾 پیش‌نویس به‌صورت خودکار ذخیره می‌شود؛ اگر مرورگر بسته شود اطلاعات از دست نمی‌رود.
            </p>
          </Card>

          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-800">اقلام ({toFaDigits(items.length)})</h3>
              <span className="text-xs text-slate-400">جمع: {toFaDigits(subtotal(draftInv).toLocaleString('en-US'))}</span>
            </div>
            <div className="space-y-2.5">
              {items.map((it, idx) => (
                <div key={it.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-900 text-xs font-black text-amber-300">
                      {toFaDigits(idx + 1)}
                    </span>
                    {items.length > 1 ? (
                      <button
                        onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))}
                        aria-label={`حذف ردیف ${idx + 1}`}
                        className="rounded-lg px-2.5 py-1 text-xs font-bold text-rose-500 hover:bg-rose-50"
                      >
                        حذف ✕
                      </button>
                    ) : null}
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
                    <Field label="قیمت واحد">
                      <Txt
                        value={it.unitPrice === 0 && !it.desc ? '' : String(it.unitPrice)}
                        onChange={(e) => updateItem(it.id, { unitPrice: parseFaNumber(e.target.value) })}
                        inputMode="numeric"
                        className="num-input text-center"
                        aria-label={`قیمت واحد ردیف ${idx + 1}`}
                      />
                    </Field>
                    <div>
                      <span className="mb-1.5 block text-[13px] font-bold text-slate-600">قیمت کل</span>
                      <div className="rounded-xl bg-slate-900 px-2 py-2.5 text-center text-sm font-black text-amber-300">
                        {toFaDigits(lineTotal(it.qty, it.unitPrice).toLocaleString('en-US'))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setItems((p) => [...p, emptyItem()])}
              className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 py-3 text-sm font-extrabold text-amber-800 hover:bg-amber-100"
            >
              ＋ افزودن ردیف
            </button>
          </Card>

          <Card className="space-y-3 p-4">
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-bold">
              <span>تخفیف کلی</span>
              <input type="checkbox" checked={discountEnabled} onChange={(e) => setDiscountEnabled(e.target.checked)} className="h-5 w-5 accent-amber-500" />
            </label>
            {discountEnabled ? (
              <Field label={`مبلغ تخفیف (${settings.currency})`}>
                <Txt value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="numeric" className="num-input" />
              </Field>
            ) : null}
            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-bold">
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
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] outline-none placeholder:text-slate-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-100"
              />
            </Field>
            <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-3 text-amber-300">
              <span className="text-sm font-bold">جمع کل</span>
              <span className="text-lg font-black">{toFaDigits(grandTotal(draftInv).toLocaleString('en-US'))}</span>
            </div>
          </Card>

          <div className="no-print sticky bottom-20 flex gap-2 md:static">
            <Btn onClick={() => nav(-1)} variant="outline" className="flex-1">
              انصراف
            </Btn>
            <Btn onClick={handleSave} className="flex-[2]">
              💾 ذخیره فاکتور
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
