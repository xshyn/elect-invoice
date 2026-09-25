'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useTransition, type ReactNode } from 'react';
import {
  House,
  LogOut,
  Menu,
  Moon,
  Plus,
  ReceiptText,
  Settings as SettingsIcon,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { logout } from '../lib/auth';
import type { SessionUser } from '../lib/auth';

const TABS = [
  { href: '/', label: 'خانه', desc: 'نمای کلی و دسترسی سریع', icon: House },
  { href: '/invoices', label: 'فاکتورها', desc: 'جست‌وجو، فیلتر و مدیریت', icon: ReceiptText },
  { href: '/new', label: 'فاکتور جدید', desc: 'صدور در کمتر از یک دقیقه', icon: Plus },
  { href: '/settings', label: 'تنظیمات', desc: 'کسب‌وکار، واحدها و پشتیبان', icon: SettingsIcon },
];

function isActive(path: string, href: string): boolean {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(href + '/');
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains('theme-dark'));
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('theme-dark', next);
    try {
      localStorage.setItem('jaryan-theme', next ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  };
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'روشنایی: حالت روشن' : 'روشنایی: حالت تیره'}
      title={dark ? 'حالت روشن' : 'حالت تیره'}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-amber-300 transition-all duration-150 hover:bg-white/20 active:scale-95"
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}

export default function Shell({
  children,
  businessName,
  tagline,
  user,
}: {
  children: ReactNode;
  businessName: string;
  tagline: string;
  user: SessionUser | null;
}) {
  const path = usePathname();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  // Close drawer on route change; lock scroll + ESC while open.
  useEffect(() => {
    setOpen(false);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open ]);

  // Login screen renders without app chrome.
  if (path === '/login') {
    return (
      <div className="app-shell mx-auto min-h-dvh w-full max-w-5xl px-3 pt-3 sm:px-6">
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="app-shell mx-auto min-h-dvh w-full max-w-5xl px-3 pb-32 pt-3 sm:px-6 md:pb-10">
      {/* Slim glass app bar */}
      <header className="no-print sticky top-3 z-40 mb-4 overflow-hidden rounded-3xl bg-slate-900/90 text-white shadow-xl shadow-slate-900/20 backdrop-blur-xl dark:bg-slate-950/85 dark:ring-1 dark:ring-white/10 dark:shadow-none">
        <div className="flex items-center gap-2.5 px-3 py-3 sm:px-4">
          <button
            onClick={() => setOpen(true)}
            aria-label="باز کردن منو"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 transition-all duration-150 hover:bg-white/20 active:scale-95"
          >
            <Menu size={20} />
          </button>
          <Link href="/" aria-label="رفتن به خانه" className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/30">
            <Zap size={22} strokeWidth={2.5} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[17px] font-extrabold leading-6">
              {businessName || 'جریان'} <span className="text-amber-300">فاکتور</span>
            </h1>
            <p className="truncate text-[11px] text-slate-300">
              {user ? `${user.displayName || user.username}` : tagline || 'صدور فاکتور فارسی برای برقکاران'}
            </p>
          </div>
          <ThemeToggle />
          {user ? (
            <button
              onClick={() => start(() => logout())}
              disabled={pending}
              aria-label="خروج از حساب"
              title="خروج"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 transition-all duration-150 hover:bg-white/20 active:scale-95 disabled:opacity-50"
            >
              <LogOut size={19} />
            </button>
          ) : null}
        </div>
      </header>

      {/* Drawer */}
      <div
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="منوی اصلی"
        className={`fixed inset-y-0 right-0 z-50 flex w-[300px] max-w-[85vw] flex-col bg-white/90 shadow-2xl backdrop-blur-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-slate-950/90 dark:ring-1 dark:ring-white/10 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-slate-900/5 p-4 dark:border-white/10">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-400 text-slate-900">
            <Zap size={22} strokeWidth={2.5} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-slate-900 dark:text-slate-100">{businessName}</p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {user ? `${user.displayName || user.username}` : 'پنل برقکار'}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="بستن منو"
            className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-900/5 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-200"
          >
            <X size={19} />
          </button>
        </div>

        <nav aria-label="ناوبری اصلی" className="flex-1 space-y-1.5 overflow-y-auto p-3">
          {TABS.map((t) => {
            const active = isActive(path, t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-150 active:scale-[0.98] ${
                  active
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-amber-400 dark:text-slate-900 dark:shadow-amber-500/20'
                    : 'text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/5'
                }`}
              >
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition ${
                    active
                      ? 'bg-amber-400 text-slate-900 dark:bg-slate-900 dark:text-amber-300'
                      : 'bg-slate-900/5 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-800 dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-amber-400/15 dark:group-hover:text-amber-200'
                  }`}
                >
                  <Icon size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold">{t.label}</span>
                  <span className={`block truncate text-[11px] ${active ? 'opacity-70' : 'text-slate-400 dark:text-slate-500'}`}>
                    {t.desc}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-900/5 p-3 dark:border-white/10">
          {user ? (
            <button
              onClick={() => {
                setOpen(false);
                start(() => logout());
              }}
              disabled={pending}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-400"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-rose-500/10">
                <LogOut size={19} />
              </span>
              خروج از حساب
            </button>
          ) : (
            <p className="px-3 py-2 text-center text-[11px] text-slate-400 dark:text-slate-500">جریان فاکتور • نسخه ۲</p>
          )}
        </div>
      </aside>

      <main key={path} className="anim-page">
        {children}
      </main>

      {/* Floating glass bottom nav (mobile) */}
      <nav
        aria-label="ناوبری موبایل"
        className="no-print fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-white/40 bg-white/75 pb-[env(safe-area-inset-bottom)] shadow-xl shadow-slate-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-black/40 md:hidden"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-4 px-2 py-2">
          {TABS.map((t) => {
            const active = isActive(path, t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-extrabold transition-all duration-150 active:scale-95 ${
                  active ? 'bg-slate-900 text-amber-300 shadow-lg shadow-slate-900/20 dark:bg-amber-400 dark:text-slate-900' : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
