import { db } from '../../lib/db';
import { getProfile } from '../../lib/invoices';
import SettingsForm from '../../components/SettingsForm';
import { PageHeader } from '../../components/ui';
import { requireUser } from '../../lib/auth';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  await requireUser('/settings');
  const [profile, invoiceCount] = await Promise.all([
    getProfile(),
    db.invoice.count(),
  ]);
  return (
    <div className="space-y-4">
      <PageHeader
        title="تنظیمات کسب‌وکار"
        desc="سربرگ فاکتور، شماره‌گذاری، واحدها، ظاهر چاپی و پشتیبان‌گیری."
      />
      <SettingsForm initial={profile} invoiceCount={invoiceCount} />
    </div>
  );
}
