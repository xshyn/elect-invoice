import { notFound } from 'next/navigation';
import { getInvoice, getProfile } from '../../../lib/invoices';
import EditorForm from '../../../components/EditorForm';
import { requireUser } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser(`/edit/${id}`);
  const [invoice, profile] = await Promise.all([getInvoice(id), getProfile()]);
  if (!invoice) notFound();
  return <EditorForm mode="edit" initial={invoice} profile={profile} suggestedNumber={invoice.number} />;
}
