import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Btn({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'soft' | 'danger' | 'outline' }) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none min-h-[44px]';
  const styles: Record<string, string> = {
    primary: 'bg-slate-900 text-amber-300 shadow-lg shadow-slate-900/20 hover:bg-slate-800',
    soft: 'bg-amber-100 text-amber-900 hover:bg-amber-200',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    outline: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  };
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...rest}>
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
      <span className="mb-1.5 block text-[13px] font-bold text-slate-600">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function Txt({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...rest}
      className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 ${className}`}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function Empty({ icon, title, desc, action }: { icon: string; title: string; desc: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-3xl">{icon}</div>
      <h3 className="text-base font-extrabold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-xs text-sm leading-6 text-slate-500">{desc}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
