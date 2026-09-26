'use client';
import Link from 'next/link';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import {
  useState,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

import {
  btnClasses,
  ICON_SIZES,
  ICON_TONES,
  type BtnSize,
  type BtnVariant,
  type IconBtnSize,
  type IconBtnTone,
} from './btn-styles';

export { btnClasses };
export type { BtnSize, BtnVariant, IconBtnSize, IconBtnTone };

type BtnProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  variant?: BtnVariant;
  size?: BtnSize;
  fullWidth?: boolean;
  loading?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
};

export function Btn({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: BtnProps) {
  const busy = loading || undefined;
  return (
    <button
      type={type}
      aria-busy={busy}
      disabled={disabled || loading}
      className={`${btnClasses({ variant, size, fullWidth, loading })} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

type BtnLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string;
  variant?: BtnVariant;
  size?: BtnSize;
  fullWidth?: boolean;
  prefetch?: boolean;
};

/** Anchor styled exactly like Btn — use for every link that looks like a button. */
export function BtnLink({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...rest
}: BtnLinkProps) {
  return (
    <Link href={href} className={`${btnClasses({ variant, size, fullWidth })} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

/** Compact square icon button for row actions, pagination, toggles. */
export function IconBtn({
  children,
  label,
  tone = 'ghost',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  type = 'button',
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  label: string;
  tone?: IconBtnTone;
  size?: IconBtnSize;
  loading?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
}) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={`grid shrink-0 cursor-pointer select-none place-items-center transition-all duration-150 active:scale-95 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${ICON_SIZES[size]} ${ICON_TONES[tone]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-slate-600 dark:text-slate-300">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400 dark:text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Txt({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:ring-amber-400/20 ${className}`}
    />
  );
}

export function PasswordInput({
  className = '',
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative block">
      <input
        {...rest}
        type={show ? 'text' : 'password'}
        className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-12 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:ring-amber-400/20 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? 'پنهان کردن گذرواژه' : 'نمایش گذرواژه'}
        aria-pressed={show}
        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300"
      >
        {show ? <EyeOff size={19} /> : <Eye size={19} />}
      </button>
    </span>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900 dark:shadow-none ${className}`}>
      {children}
    </div>
  );
}

export function Empty({ icon, title, desc, action }: { icon: ReactNode; title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300">
        {icon}
      </div>
      <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400">{desc}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

/** Consistent page heading: title + optional description + optional actions.
 *  Gives every screen the same rhythm (replaces scattered h2 rows). */
export function PageHeader({
  title,
  desc,
  actions,
}: {
  title: ReactNode;
  desc?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-1 flex flex-wrap items-end justify-between gap-2">
      <div className="min-w-0">
        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        {desc ? <p className="mt-0.5 text-[13px] leading-5 text-slate-500 dark:text-slate-400">{desc}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
