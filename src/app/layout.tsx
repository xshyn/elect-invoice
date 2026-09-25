import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Shell from '../components/Shell';
import { getProfile } from '../lib/invoices';

export const metadata: Metadata = {
  title: 'جریان فاکتور | صدور فاکتور برقکاری',
  description: 'وب‌اپ فارسی صدور، مدیریت، چاپ و خروجی PDF فاکتور برای برقکاران',
  manifest: './manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const profile = await getProfile().catch(() => null);
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Shell businessName={profile?.name ?? 'جریان'} tagline={profile?.tagline ?? ''}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
