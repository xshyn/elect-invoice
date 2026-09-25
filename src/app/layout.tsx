import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Shell from '../components/Shell';
import { getProfile } from '../lib/invoices';
import { getSessionUser, type SessionUser } from '../lib/auth';

export const metadata: Metadata = {
  title: 'جریان فاکتور | صدور فاکتور برقکاری',
  description: 'وب‌اپ فارسی صدور، مدیریت، چاپ و خروجی PDF فاکتور برای برقکاران',
  manifest: './manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [profile, user] = await Promise.all([
    getProfile().catch(() => null),
    getSessionUser().catch((): SessionUser | null => null),
  ]);
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        {/* تم ذخیره‌شده (یا ترجیح سیستمی) قبل از اولین رندر تا صفحه چشمک نزند */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('jaryan-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('theme-dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <Shell businessName={profile?.name ?? 'جریان'} tagline={profile?.tagline ?? ''} user={user}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
