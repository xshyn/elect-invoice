'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, useTransition, type ReactNode } from 'react';
import {
  House,
  LogOut,
  Moon,
  Plus,
  ReceiptText,
  Settings as SettingsIcon,
  Sun,
  Zap,
} from 'lucide-react';
import { logout } from '../lib/auth';
import type { SessionUser } from '../lib/auth';
import { BtnLink, IconBtn } from './ui';

const TABS = [
  { href: '/', label: 'خانه', desc: 'نمای کلی و دسترسی سریع', icon: House },
  { href: '/invoices', label: 'فاکتورها', desc: 'جست‌وجو، فیلتر و مدیریت', icon: ReceiptText },
  { href: '/new', label: 'فاکتور جدید', desc: 'صدور در کمتر از یک دقیقه', icon: Plus },
  { href: '/settings', label: 'تنظیمات', desc: 'کسب‌وکار، واحدها و پشتیبان', icon: SettingsIcon },
] as const;

function isActive(path: string, href: string): boolean {
  if (href === '/') return path === '/';
  if (href === '/invoices') {
    return (
      path === '/invoices' ||
      path.startsWith('/invoices/') ||
      path.startsWith('/edit/') ||
      path.startsWith('/clone/')
    );
  }
  return path === href || path.startsWith(href + '/');
}

function ThemeToggle({ tone = 'subtle' }: { tone?: 'subtle' | 'ghost' }) {
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
    <IconBtn
      label={dark ? 'حالت روشن' : 'حالت تیره'}
      tone={tone}
      size="md"
      onClick={toggle}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </IconBtn>
  );
}

function Brand({ businessName, subtitle }: { businessName: string; subtitle: string }) {
  return (
    <Link
      href="/"
      aria-label="رفتن به خانه"
      className="flex min-w-0 items-center gap-2.5 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400 text-slate-900 shadow-md shadow-amber-500/25">
        <Zap size={21} strokeWidth={2.5} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-black leading-5 text-slate-900 dark:text-slate-100">
          {businessName || 'جریان'} <span className="text-amber-600 dark:text-amber-300">فاکتور</span>
        </span>
        <span className="block truncate text-[11px] font-bold text-slate-400 dark:text-slate-500">
          {subtitle}
        </span>
      </span>
    </Link>
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

  // Login screen renders without app chrome.
  if (path === '/login') {
    return (
      <div className="app-shell mx-auto min-h-dvh w-full max-w-5xl px-3 pt-3 sm:px-6">
        <main id="main">{children}</main>
      </div>
    );
  }

  const subtitle = user
    ? `${user.displayName || user.username}`
    : tagline || 'صدور فاکتور فارسی برای برقکاران';

  return (
    <div className="app-shell min-h-dvh lg:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:right-3 focus:top-3 focus:z-[60] focus:rounded-xl focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-amber-300"
      >
        پرش به محتوا
      </a>

      {/* ── Desktop: permanent accessible sidebar (no hamburger, no drawer) ── */}
      <aside className="no-print hidden w-[280px] shrink-0 flex-col border-l border-slate-200/80 bg-white dark:border-white/10 dark:bg-slate-950 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <div className="p-4 pb-2">
          <Brand businessName={businessName} subtitle={subtitle} />
        </div>

        <div className="px-4 py-2">
          <BtnLink
            href="/new"
            variant="primary"
            size="md"
            fullWidth
            aria-current={isActive(path, '/new') ? 'page' : undefined}
          >
            <Plus size={18} strokeWidth={2.5} />
            فاکتور جدید
          </BtnLink>
        </div>

        <nav aria-label="ناوبری اصلی" className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {TABS.filter((t) => t.href !== '/new').map((t) => {
            const active = isActive(path, t.href);
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? 'page' : undefined}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-[0.98] ${
                  active
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 dark:bg-amber-400 dark:text-slate-950 dark:shadow-amber-500/20'
                    : 'text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/5'
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition ${
                    active
                      ? 'bg-amber-400 text-slate-900 dark:bg-slate-950 dark:text-amber-300'
                      : 'bg-slate-900/5 text-slate-500 group-hover:bg-amber-100 group-hover:text-amber-800 dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-amber-400/15 dark:group-hover:text-amber-200'
                  }`}
                >
                  <Icon size={19} />
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

        <div className="space-y-2 border-t border-slate-200/80 p-3 dark:border-white/10">
          {user ? (
            <div className="flex items-center gap-2.5 rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-white/5">
              <span
                aria-hidden
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-900 text-sm font-black text-amber-300 dark:bg-amber-400 dark:text-slate-950"
              >
                {(user.displayName || user.username || 'ک').slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-extrabold text-slate-800 dark:text-slate-100">
                  {user.displayName || user.username}
                </span>
                <span className="block text-[11px] text-slate-400 dark:text-slate-500">حساب فعال</span>
              </span>
              <ThemeToggle />
              <IconBtn
                label="خروج از حساب"
                tone="danger"
                size="md"
                loading={pending}
                onClick={() => start(() => logout())}
              >
                {!pending && <LogOut size={18} />}
              </IconBtn>
            </div>
          ) : (
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">جریان فاکتور • نسخه ۲</p>
              <ThemeToggle />
            </div>
          )}
        </div>
      </aside>

      {/* ── Content column ── */}
      <div className="min-w-0 flex-1">
        {/* Mobile top bar: brand + actions only (no hamburger — bottom nav is the nav) */}
        <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 lg:hidden">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-3 py-2.5 sm:px-6">
            <div className="min-w-0 flex-1">
              <Brand businessName={businessName} subtitle={subtitle} />
            </div>
            <ThemeToggle tone="ghost" />
            {user ? (
              <IconBtn
                label="خروج از حساب"
                tone="ghost"
                size="md"
                loading={pending}
                onClick={() => start(() => logout())}
              >
                {!pending && <LogOut size={18} />}
              </IconBtn>
            ) : null}
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl px-3 pb-32 pt-4 sm:px-6 lg:pb-12 lg:pt-6">
          <main id="main" key={path} className="anim-page">
            {children}
          </main>
        </div>

        {/* Mobile bottom navigation: the only nav on small screens */}
        <nav
          aria-label="ناوبری موبایل"
          className="no-print fixed inset-x-3 bottom-3 z-40 rounded-3xl border border-slate-200/70 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-xl shadow-slate-900/10 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-black/40 lg:hidden"
        >
          <div className="mx-auto grid max-w-5xl grid-cols-4 gap-1 px-2 py-2">
            {TABS.map((t) => {
              const active = isActive(path, t.href);
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-extrabold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 active:scale-95 ${
                    active
                      ? 'bg-slate-900 text-amber-300 shadow-lg shadow-slate-900/20 dark:bg-amber-400 dark:text-slate-950'
                      : 'text-slate-400 hover:bg-slate-900/5 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-slate-300'
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
    </div>
  );
}
