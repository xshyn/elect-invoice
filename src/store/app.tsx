import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { BusinessProfile, Invoice } from '../types';
import { localStorageAdapter } from './db';

interface AppState {
  invoices: Invoice[];
  settings: BusinessProfile;
  saveInvoice(inv: Invoice): void;
  deleteInvoice(id: string): void;
  duplicateInvoice(id: string): Invoice | null;
  updateSettings(patch: Partial<BusinessProfile>): void;
  /** شماره بعدی را تخصیص می‌دهد و شمارنده را جلو می‌برد */
  allocateNumber(): string;
  reload(): void;
}

const Ctx = createContext<AppState | null>(null);

function sortByUpdatedDesc(a: Invoice, b: Invoice): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => localStorageAdapter.loadInvoices());
  const [settings, setSettings] = useState<BusinessProfile>(() => localStorageAdapter.loadSettings());

  useEffect(() => {
    localStorageAdapter.saveInvoices(invoices);
  }, [invoices]);

  useEffect(() => {
    localStorageAdapter.saveSettings(settings);
  }, [settings]);

  const saveInvoice = useCallback((inv: Invoice) => {
    setInvoices((prev) => {
      const i = prev.findIndex((x) => x.id === inv.id);
      if (i === -1) return [...prev, inv].sort(sortByUpdatedDesc);
      const next = [...prev];
      next[i] = inv;
      return next.sort(sortByUpdatedDesc);
    });
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const duplicateInvoice = useCallback(
    (id: string): Invoice | null => {
      const src = invoices.find((x) => x.id === id);
      if (!src) return null;
      return src;
    },
    [invoices],
  );

  const updateSettings = useCallback((patch: Partial<BusinessProfile>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const allocateNumber = useCallback((): string => {
    let num = '';
    setSettings((prev) => {
      num = `${prev.numberPrefix}${prev.nextNumber}`;
      return { ...prev, nextNumber: prev.nextNumber + 1 };
    });
    // به‌خاطر ماهیت ناهمگام setState، عدد را از روی حافظه هم می‌خوانیم
    const current = localStorageAdapter.loadSettings();
    if (!num) num = `${current.numberPrefix}${current.nextNumber}`;
    return num;
  }, []);

  const reload = useCallback(() => {
    setInvoices(localStorageAdapter.loadInvoices());
    setSettings(localStorageAdapter.loadSettings());
  }, []);

  const value = useMemo(
    () => ({ invoices, settings, saveInvoice, deleteInvoice, duplicateInvoice, updateSettings, allocateNumber, reload }),
    [invoices, settings, saveInvoice, deleteInvoice, duplicateInvoice, updateSettings, allocateNumber, reload],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp باید داخل AppProvider استفاده شود');
  return v;
}
