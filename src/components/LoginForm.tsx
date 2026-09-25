'use client';

import { useState, useTransition } from 'react';
import { safeNext } from '../../lib/validators';
import { setupOrLogin } from '../../lib/auth';
import { Btn, Card, Field, Txt } from '../../components/ui';

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
        <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-3xl bg-slate-900 text-3xl shadow-xl">
          ⚡
        </div>
        <h2 className="text-xl font-black text-slate-900">{isSetup ? 'ساخت حساب کاربری' : 'ورود به جریان فاکتور'}</h2>
        <p className="mt-1 text-[13px] leading-5 text-slate-500">
          {isSetup
            ? 'این اولین اجراست؛ یک حساب مدیر بساز. بعداً با همین نام و گذرواژه وارد می‌شوی.'
            : 'نام کاربری و گذرواژه‌ات را وارد کن.'}
        </p>
      </div>

      <Card className="space-y-3 p-5">
        {errors.length > 0 ? (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[13px] leading-6 text-rose-700">
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
          <Txt
            type="password"
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
            <Txt
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
          </Field>
        ) : null}

        <Btn onClick={submit} disabled={pending} className="w-full">
          {pending ? '…' : isSetup ? 'ساخت حساب و ورود' : 'ورود'}
        </Btn>
      </Card>

      <p className="mt-4 text-center text-xs leading-5 text-slate-400">
        🔒 نشست تا ۹۰ روز باز می‌ماند و با هر فعالیت تمدید می‌شود.
        <br />
        داده‌ها فقط روی سرور خودت است.
      </p>
    </div>
  );
}
