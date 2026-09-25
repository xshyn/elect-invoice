import { getProfile } from '../../lib/invoices';
import { getDraft } from '../../lib/actions';
import { requireUser } from '../../lib/auth';
import EditorForm from '../../components/EditorForm';

export const dynamic = 'force-dynamic';

export default async function NewInvoicePage() {
  await requireUser('/new');
  const [profile, draft] = await Promise.all([getProfile(), getDraft()]);
  return (
    <EditorForm
      mode="new"
      initial={null}
      profile={profile}
      suggestedNumber={`${profile.numberPrefix}${profile.nextNumber}`}
      initialDraft={draft}
    />
  );
}
