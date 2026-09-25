# Contributing

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL 16 (or Docker — `docker compose up -d db` runs one for you)

## Setup

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

## Conventions

- The **user-facing UI is Persian** (RTL, Jalali dates, Persian digits). Code, comments, and commit messages may be English or Persian — pick what reads best.
- Display formatting lives in `src/utils/persian.ts`; invoice math only in `src/utils/calc.ts` (pure, tested). Don't put formulas in components.
- Changing `src/types.ts` changes the UI contract — explain it in the PR.
- Database access goes through `src/lib/` (queries in `invoices.ts`, mutations as server actions in `actions.ts`). Client components must never import `src/lib/db.ts`.
- Every mutation is validated by the Zod schemas in `src/lib/validators.ts` — add tests in `validators.test.ts` when you change them.
- Migrations are checked in (`prisma/migrations/`). Never edit an applied migration; add a new one via `npm run db:migrate`.
- Keep components under ~200 lines; split when they grow.

## PR checklist

- [ ] `npm run lint` — 0 errors
- [ ] `npm test` — all green
- [ ] `npm run build` — succeeds
- [ ] Checked at 360px width and desktop
- [ ] Print preview checked (invoice paper only, no app chrome)
