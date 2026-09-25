import { getProfile } from '../../lib/invoices';
import EditorForm from '../../components/EditorForm';
import { requireUser } from '../../lib/auth';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  await requireUser('/new');
  const profile = await getProfile();
  return (
    <EditorForm
      mode="new"
      initial={null}
      profile={profile}
      suggestedNumber={`${profile.numberPrefix}${profile.nextNumber}`}
    />
  );
}
