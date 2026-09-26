import { listInvoices } from '../../lib/invoices';
import { parseSortParam } from '../../lib/validators';
import { toEnDigits } from '../../utils/persian';
import { BtnLink, Card, Empty, PageHeader } from '../../components/ui';
import InvoicesToolbar from '../../components/InvoicesToolbar';
import InvoiceListClient, { type ListFilters } from '../../components/InvoiceListClient';
import { requireUser } from '../../lib/auth';
import { Plus, SearchX } from 'lucide-react';

export const dynamic = 'force-dynamic';

type SP = Record<string, string | string[] | undefined>;

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

function numOrNull(v: string): number | null {
  const t = toEnDigits(v.trim()).replace(/[^0-9.]/g, '');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const FIRST_PAGE_SIZE_FALLBACK = 10;

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser('/invoices');
  const sp = await searchParams;
  const q = first(sp.q);
  const from = first(sp.from);
  const to = first(sp.to);
  const min = numOrNull(first(sp.min));
  const max = numOrNull(first(sp.max));
  const buyerOnly = first(sp.buyer) === '1';
  const pageSize = [10, 25, 50].includes(Number(first(sp.size))) ? Number(first(sp.size)) : FIRST_PAGE_SIZE_FALLBACK;
  const sort = parseSortParam(first(sp.sort) || undefined, { field: 'date', dir: 'desc' });

  const { items, totalCount } = await listInvoices({
    q,
    from,
    to,
    min,
    max,
    buyerOnly,
    sort,
    page: 1,
    pageSize,
  });

  const activeFilterCount =
    (from ? 1 : 0) + (to ? 1 : 0) + (first(sp.min) ? 1 : 0) + (first(sp.max) ? 1 : 0) + (buyerOnly ? 1 : 0);

  const filters: ListFilters = { q, from, to, min, max, buyerOnly, sort, pageSize };
  const listKey = JSON.stringify([q, from, to, first(sp.min), first(sp.max), buyerOnly, first(sp.sort), pageSize]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`فاکتورها`}
        desc="جست‌وجو، مرتب‌سازی چندسطحی و فیلتر — برای مدیریت سریع."
        actions={
          <BtnLink href="/new" variant="primary" size="sm">
            <Plus size={16} strokeWidth={2.5} />
            جدید
          </BtnLink>
        }
      />

      <InvoicesToolbar activeFilterCount={activeFilterCount} />

      {items.length === 0 ? (
        <Card>
          <Empty
            icon={<SearchX size={30} />}
            title="چیزی پیدا نشد"
            desc={totalCount === 0 && !q ? 'هنوز فاکتوری ثبت نشده؛ اولین فاکتور را صادر کن.' : 'عبارت یا فیلتر دیگری را امتحان کن، یا فیلترها را پاک کن.'}
            action={
              totalCount === 0 && !q ? (
                <BtnLink href="/new" variant="primary" size="md"><Plus size={17} strokeWidth={2.5} /> صدور فاکتور</BtnLink>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <InvoiceListClient key={listKey} initialItems={items} totalCount={totalCount} filters={filters} query={q} />
      )}
    </div>
  );
}
