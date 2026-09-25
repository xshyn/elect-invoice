import { notFound } from 'next/navigation';
import { getInvoice, getProfile } from '../../../lib/invoices';
import InvoiceViewClient from '../../../components/InvoiceViewClient';

export const dynamic = 'force-dynamic';

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [invoice, business] = await Promise.all([getInvoice(id), getProfile()]);
  if (!invoice) notFound();
  return <InvoiceViewClient invoice={invoice} business={business} />;
}
