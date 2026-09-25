import { db } from '../../lib/db';
import { getProfile } from '../../lib/invoices';
import SettingsForm from '../../components/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const [profile, invoiceCount] = await Promise.all([
    getProfile(),
    db.invoice.count(),
  ]);
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-black text-slate-900">تنظیمات کسب‌وکار</h2>
      <SettingsForm initial={profile} invoiceCount={invoiceCount} />
    </div>
  );
}
