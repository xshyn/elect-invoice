'use client';

import { useState, useTransition } from 'react';
import { safeNext } from '../lib/validators';
import { setupOrLogin } from '../lib/auth';
import { Btn, Card, Field, PasswordInput, Txt } from './ui';
import { Lock, Zap } from 'lucide-react';

export default function LoginForm({ isSetup, next }: { isSetup: boolean; next: string }) {
  const [pending, start] = useTransition();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const submit = () => {
    setErrors([]);
    const safe = safeNext(next);
    start(async () => {
      const res = isSetup
        ? await setupOrLogin({ username, displayName, password, confirm, next: safe }, true)
        : await setupOrLogin({ username, password, next: safe }, false);
      // Success redirects (server-side); only errors come back here.
      if (!res.ok) setErrors(res.errors);
    });
  };

  return (
    <div className="mx-auto w-full max-w-sm pt-6 sm:pt-12">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-slate-900 text-amber-300 shadow-xl">
          <Zap size={30} strokeWidth={2.5} />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{isSetup ? 'ساخت حساب کاربری' : 'ورود به جریان فاکتور'}</h2>
        <p className="mt-1 text-[13px] leading-5 text-slate-500 dark:text-slate-400">
          {isSetup
            ? 'این اولین اجراست؛ یک حساب مدیر بساز. بعداً با همین نام و گذرواژه وارد می‌شوی.'
            : 'نام کاربری و گذرواژه‌ات را وارد کن.'}
        </p>
      </div>

      <Card className="space-y-3 p-5">
        {errors.length > 0 ? (
          <div role="alert" className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/15 p-3 text-[13px] leading-6 text-rose-700 dark:text-rose-300">
            <ul className="list-disc pr-5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <Field label="نام کاربری">
          <Txt value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="مثلاً ostad" />
        </Field>
        {isSetup ? (
          <Field label="نام نمایشی (اختیاری)">
            <Txt value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="مثلاً استاد رضایی" />
          </Field>
        ) : null}
        <Field label={isSetup ? 'گذرواژه (حداقل ۸ حرف)' : 'گذرواژه'}>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSetup ? 'new-password' : 'current-password'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
        </Field>
        {isSetup ? (
          <Field label="تکرار گذرواژه">
            <PasswordInput
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
          </Field>
        ) : null}

        <Btn onClick={submit} loading={pending} size="lg" fullWidth>
          {isSetup ? 'ساخت حساب و ورود' : 'ورود'}
        </Btn>
      </Card>

      <p className="mt-4 text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
        <span className="inline-flex items-center justify-center gap-1"><Lock size={12} /> نشست تا ۹۰ روز باز می‌ماند و با هر فعالیت تمدید می‌شود.</span>
        <br />
        داده‌ها فقط روی سرور خودت است.
      </p>
    </div>
  );
}
