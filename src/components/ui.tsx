'use client';
import { Eye, EyeOff } from 'lucide-react';

import { useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

export function Btn({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' | 'danger' | 'outline' }) {
  const base =
    'inline-flex select-none items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-extrabold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none min-h-[46px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400';
  const styles: Record<string, string> = {
    primary:
      'bg-slate-900 text-amber-300 shadow-lg shadow-slate-900/25 hover:bg-slate-700 hover:shadow-xl hover:-translate-y-px dark:bg-amber-400 dark:text-slate-900 dark:shadow-amber-500/25 dark:hover:bg-amber-300',
    soft: 'bg-amber-100 text-amber-900 shadow-sm hover:bg-amber-200 hover:shadow hover:-translate-y-px dark:bg-amber-400/15 dark:text-amber-200 dark:hover:bg-amber-400/25 dark:shadow-none',
    ghost: 'text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10',
    danger: 'bg-rose-600 text-white shadow-lg shadow-rose-600/25 hover:bg-rose-500 hover:shadow-xl hover:-translate-y-px',
    outline:
      'border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:-translate-y-px dark:border-white/15 dark:bg-transparent dark:text-slate-200 dark:hover:bg-white/5 dark:hover:border-white/25 dark:shadow-none',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/** Compact square icon button for row actions, pagination, toggles. */
export function IconBtn({
  children,
  label,
  tone = 'ghost',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'ghost' | 'soft' | 'danger' | 'solid' }) {
  const tones: Record<string, string> = {
    ghost:
      'text-slate-500 hover:bg-slate-900/5 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100',
    soft: 'bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-400/15 dark:text-amber-200 dark:hover:bg-amber-400/25',
    danger: 'text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300',
    solid: 'bg-slate-900 text-amber-300 hover:bg-slate-700 dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300',
  };
  return (
    <button
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 shrink-0 select-none place-items-center rounded-xl transition-all duration-150 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
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
        className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-300"
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
