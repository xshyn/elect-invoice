/** Instant loading state so tab switches never show a frozen screen.
 *  Shown by Next.js while the route's server components resolve.
 */
export default function Loading() {
  return (
    <div className="anim-page space-y-3" aria-busy="true" aria-label="در حال بارگذاری">
      <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-900/10 dark:bg-white/10" />
      <div className="grid grid-cols-3 gap-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-xl bg-slate-900/10 dark:bg-white/10" />
            <div className="mx-auto mt-2 h-4 w-16 animate-pulse rounded bg-slate-900/10 dark:bg-white/10" />
          </div>
        ))}
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-white/10 dark:bg-slate-900">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-900/10 dark:bg-white/10" />
          <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-900/10 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}
