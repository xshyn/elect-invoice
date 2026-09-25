import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../store/app';

const TABS = [
  { to: '/', label: 'خانه', icon: '⚡', end: true },
  { to: '/invoices', label: 'فاکتورها', icon: '🧾', end: false },
  { to: '/new', label: 'فاکتور جدید', icon: '＋', end: true },
  { to: '/settings', label: 'تنظیمات', icon: '⚙', end: true },
];

export default function Layout() {
  const { settings } = useApp();
  const nav = useNavigate();

  return (
    <div className="app-shell mx-auto min-h-dvh w-full max-w-5xl px-3 pb-28 pt-3 sm:px-6 md:pb-10">
      {/* سربرگ اپ */}
      <header className="no-print mb-4 overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/20">
        <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
          <button
            onClick={() => nav('/')}
            aria-label="رفتن به خانه"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-400 text-2xl shadow-lg shadow-amber-500/30"
          >
            ⚡
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-extrabold leading-7">
              {settings.name || 'جریان'} <span className="text-amber-300">فاکتور</span>
            </h1>
            <p className="truncate text-xs text-slate-300">{settings.tagline || 'صدور فاکتور فارسی برای برقکاران'}</p>
          </div>
          <button
            onClick={() => nav('/new')}
            className="hidden shrink-0 items-center gap-1 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold text-slate-900 hover:bg-amber-300 sm:inline-flex"
          >
            ＋ فاکتور جدید
          </button>
        </div>
        {/* ناوبری دسکتاپ */}
        <nav aria-label="ناوبری اصلی" className="hidden gap-1 px-4 pb-3 md:flex">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `rounded-xl px-4 py-2 text-sm font-bold transition ${isActive ? 'bg-white/15 text-amber-300' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main>
        <Outlet />
      </main>

      {/* ناوبری پایینی موبایل */}
      <nav
        aria-label="ناوبری موبایل"
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-4">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition ${
                  isActive ? 'text-amber-600' : 'text-slate-400'
                }`
              }
            >
              <span className="text-xl leading-6">{t.icon}</span>
              {t.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
