/** Server-safe button style helpers (NO 'use client').
 *
 *  `ui.tsx` is a client module. Any plain function imported from it can only
 *  be *rendered* by the server (as a client reference) — *calling* it during
 *  server render throws ("Attempted to call ... from the server", React #441
 *  in production). Pagination links in `app/invoices/page.tsx` need the class
 *  string on the server, so the pure helpers live here and `ui.tsx`
 *  re-exports them for client consumers.
 */

export type BtnVariant =
  | 'primary'
  | 'accent'
  | 'soft'
  | 'subtle'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'dangerSoft'
  | 'glass';

export type BtnSize = 'xs' | 'sm' | 'md' | 'lg';
export type IconBtnTone = 'ghost' | 'soft' | 'subtle' | 'danger' | 'solid' | 'outline' | 'glass';
export type IconBtnSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap font-extrabold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:transform-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 [&_svg]:shrink-0';

const SIZES: Record<BtnSize, string> = {
  xs: 'min-h-[32px] rounded-lg px-3 py-1.5 text-xs gap-1.5',
  sm: 'min-h-[40px] rounded-xl px-4 py-2 text-[13px] gap-1.5',
  md: 'min-h-[44px] rounded-xl px-5 py-2.5 text-sm gap-2',
  lg: 'min-h-[52px] rounded-2xl px-6 py-3 text-[15px] gap-2',
};

const VARIANTS: Record<BtnVariant, string> = {
  primary:
    'bg-slate-900 text-amber-300 shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-px active:translate-y-0 dark:bg-amber-400 dark:text-slate-950 dark:shadow-amber-500/20 dark:hover:bg-amber-300',
  accent:
    'bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 hover:bg-amber-300 hover:shadow-xl hover:-translate-y-px active:translate-y-0',
  soft: 'bg-amber-100 text-amber-900 shadow-sm ring-1 ring-inset ring-amber-200/60 hover:bg-amber-200 hover:shadow hover:-translate-y-px active:translate-y-0 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/20 dark:hover:bg-amber-400/25 dark:shadow-none',
  subtle:
    'bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200 hover:text-slate-900 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15 dark:shadow-none',
  outline:
    'border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:-translate-y-px active:translate-y-0 dark:border-white/15 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5 dark:hover:border-white/25 dark:shadow-none',
  ghost:
    'text-slate-600 shadow-none hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white dark:shadow-none',
  danger:
    'bg-rose-600 text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500 hover:shadow-xl hover:-translate-y-px active:translate-y-0',
  dangerSoft:
    'bg-rose-50 text-rose-700 shadow-sm ring-1 ring-inset ring-rose-200/60 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20 dark:hover:bg-rose-500/20 dark:shadow-none',
  glass:
    'border border-white/10 bg-white/10 text-white shadow-sm backdrop-blur hover:bg-white/20 active:bg-white/20',
};

export function btnClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
}: {
  variant?: BtnVariant;
  size?: BtnSize;
  fullWidth?: boolean;
  loading?: boolean;
} = {}): string {
  return `${BASE} ${SIZES[size]} ${VARIANTS[variant]}${fullWidth ? ' w-full' : ''}${loading ? ' pointer-events-none' : ''}`;
}

export const ICON_SIZES: Record<IconBtnSize, string> = {
  sm: 'h-8 w-8 rounded-lg [&_svg]:h-4 [&_svg]:w-4',
  md: 'h-10 w-10 rounded-xl [&_svg]:h-[18px] [&_svg]:w-[18px]',
  lg: 'h-11 w-11 rounded-2xl [&_svg]:h-5 [&_svg]:w-5',
};

export const ICON_TONES: Record<IconBtnTone, string> = {
  ghost:
    'text-slate-500 hover:bg-slate-900/5 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100',
  soft: 'bg-amber-100 text-amber-900 ring-1 ring-inset ring-amber-200/60 hover:bg-amber-200 dark:bg-amber-400/15 dark:text-amber-200 dark:ring-amber-400/20 dark:hover:bg-amber-400/25',
  subtle: 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15 dark:hover:text-white',
  danger: 'text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300',
  solid: 'bg-slate-900 text-amber-300 shadow-lg shadow-slate-900/20 hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:shadow-amber-500/20 dark:hover:bg-amber-300',
  outline:
    'border border-slate-300 bg-white text-slate-600 shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900 dark:border-white/15 dark:bg-transparent dark:text-slate-300 dark:hover:bg-white/5',
  glass: 'bg-white/10 text-white backdrop-blur hover:bg-white/20',
};
