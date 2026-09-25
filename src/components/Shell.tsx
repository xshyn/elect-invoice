'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition, type ReactNode } from 'react';
import { logout } from '../lib/auth';
import type { SessionUser } from '../lib/auth';

const TABS = [
  { href: '/', label: 'خانه', icon: '⚡' },
  { href: '/invoices', label: 'فاکتورها', icon: '🧾' },
  { href: '/new', label: 'فاکتور جدید', icon: '＋' },
  { href: '/settings', label: 'تنظیمات', icon: '⚙' },
];

function isActive(path: string, href: string): boolean {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(href + '/');
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
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="app-shell mx-auto min-h-dvh w-full max-w-5xl px-3 pb-28 pt-3 sm:px-6 md:pb-10">
      <header className="no-print mb-4 overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/20">
        <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            href="/"
            aria-label="رفتن به خانه"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-400 text-2xl shadow-lg shadow-amber-500/30"
          >
            ⚡
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-extrabold leading-7">
              {businessName || 'جریان'} <span className="text-amber-300">فاکتور</span>
            </h1>
            <p className="truncate text-xs text-slate-300">
              {user ? `👤 ${user.displayName || user.username}` : tagline || 'صدور فاکتور فارسی برای برقکاران'}
            </p>
          </div>
          {user ? (
            <button
              onClick={() => start(() => logout())}
              disabled={pending}
              aria-label="خروج از حساب"
              title="خروج"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-lg hover:bg-white/20 disabled:opacity-50"
            >
              ⎋
            </button>
          ) : null}
          <Link
            href="/new"
            className="hidden shrink-0 items-center gap-1 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold text-slate-900 hover:bg-amber-300 sm:inline-flex"
          >
            ＋ فاکتور جدید
          </Link>
        </div>
        <nav aria-label="ناوبری اصلی" className="hidden gap-1 px-4 pb-3 md:flex">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={isActive(path, t.href) ? 'page' : undefined}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                isActive(path, t.href) ? 'bg-white/15 text-amber-300' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      <main>{children}</main>

      <nav
        aria-label="ناوبری موبایل"
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-4">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={isActive(path, t.href) ? 'page' : undefined}
              className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition ${
                isActive(path, t.href) ? 'text-amber-600' : 'text-slate-400'
              }`}
            >
              <span className="text-xl leading-6">{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
