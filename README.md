# ⚡ Elect Invoice — Persian invoicing app for electricians

![CI](https://github.com/xshyn/elect-invoice/actions/workflows/ci.yml/badge.svg)
![Docker](https://github.com/xshyn/elect-invoice/actions/workflows/docker.yml/badge.svg)

A **fully Persian (RTL)** web app for creating, managing, printing, and exporting invoices
(فاکتور / صورتحساب). Mobile-first, with Jalali dates, Persian digits, automatic
amount-in-words, server-side search/filter/multi-sort/pagination, print-ready invoice paper,
client-side PDF/PNG export, and JSON backup/restore.

> **Stack:** Next.js 16 (App Router, Server Actions) · React 19 · Prisma 7 ORM ·
> PostgreSQL 16 · Tailwind CSS v4 · Zod validation · Docker.
> The UI language is Persian; this README is in English for developers.

## ✨ Features

- 🧾 Invoice editor matching the classic Iranian paper form (brandable header, items table, numeric + written totals, signature blocks)
- 🔢 Auto-incrementing invoice numbers (transaction-safe), Jalali date handling, Persian-digit formatting, automatic total-in-Persian-words
- ➕ Dynamic line items with auto line totals; optional overall discount and VAT (off by default)
- 💾 Draft autosave while typing (browser) + Persian validation messages, server-side Zod enforcement
- 🔍 Invoice list: debounced full-text search with match highlighting, date-range / amount-range / buyer filters, **multi-level sorting**, pagination (10/25/50) — all executed in SQL
- 🖨 Clean A4 print stylesheet + client-side **PDF** and **PNG** export (`invoice-{number}-{date}.pdf`)
- 🏪 Business profile (name, tagline, logo, phones, address, currency, print theme) applied to every invoice
- 💾 PostgreSQL storage with JSON backup export (`/api/backup`) and restore
- 📱 Mobile-first: bottom navigation, touch-friendly cards on phones, full data table on desktop

## 🚀 Quickstart (Docker — recommended)

```bash
cp .env.example .env        # adjust passwords for production
docker compose up --build   # app + Postgres
```

Open **http://localhost:3000**. The container applies Prisma migrations on startup
(`docker-entrypoint.sh`) and seeds the default business profile.

## 🛠 Local development (without Docker)

You need Node.js 20+ and a reachable PostgreSQL 16.

```bash
npm install
cp .env.example .env        # point DATABASE_URL at your DB
npm run db:migrate          # prisma migrate dev
npm run db:seed             # default business profile
npm run dev                 # http://localhost:3000
```

| Command            | What it does                              |
|--------------------|-------------------------------------------|
| `npm run dev`      | Next.js dev server                        |
| `npm run build`    | `prisma generate && next build`           |
| `npm start`        | Run the production build                  |
| `npm test`         | Unit tests (vitest: calculations, validators) |
| `npm run lint`     | Lint (oxlint, 0 errors required)          |
| `npm run db:studio`| Prisma Studio database GUI                |
| `npm run up`       | `docker compose up --build`               |

## 🗂 Project structure

```
prisma/
  schema.prisma     # BusinessProfile / Invoice / LineItem (+ cached totals for SQL sorting)
  migrations/       # checked-in SQL migrations (applied by CI + container entrypoint)
  seed.ts           # default business profile
src/
  app/              # Next.js routes: / /invoices /invoices/[id] /new /edit/[id] /clone/[id] /settings /api/backup
  components/       # Shell, InvoicePaper (print form), EditorForm, toolbars, UI primitives
  lib/              # db (Prisma singleton), invoices (queries + mappers), actions (mutations), validators (zod)
  utils/            # persian digits, number-to-Persian-words, jalali dates, invoice math (+ tests)
Dockerfile          # multi-stage standalone build → GHCR image
docker-compose.yml  # app + postgres:16-alpine with healthchecks
.github/workflows/ # ci.yml (lint/test/migrate/build) · docker.yml (publish image)
```

## 🧠 Key design decisions

- **Postgres, not localStorage.** Invoices live in PostgreSQL; the list page paginates/sorts/filters in SQL. Cached `total`/`itemCount` columns keep ordering and range filters index-friendly.
- **Number allocation is transactional.** The profile counter bump and the invoice insert happen in one transaction, with a `UNIQUE` constraint on `number` as the backstop.
- **Validation on the server.** Zod schemas in `src/lib/validators.ts` gate every mutation; client-side checks are UX only.
- **PDF/PNG are lazy-loaded** (`html2pdf.js`/`html2canvas` via dynamic `import()`) so the first load stays light on mobile networks.
- **No GitHub Pages.** Pages is static-only and cannot run Next.js server code or Postgres — deployment is Docker (any VPS) via the GHCR image. See below.

## 🌐 Deployment (VPS)

1. On push to `main`, CI lints, tests, migrates a scratch DB, and builds; then the Docker workflow publishes `ghcr.io/xshyn/elect-invoice:latest`.
2. On the server:
   ```bash
   # docker-compose.yml pointing at the published image, or build locally:
   docker compose up -d --build
   ```
   Set a strong `POSTGRES_PASSWORD` (via `.env`) and put a reverse proxy (Caddy/nginx) with TLS in front of `:3000`.
3. Backups: scheduled `GET /api/backup` downloads + Postgres volume snapshots (`pgdata`).

For managed Postgres (Neon/Supabase/RDS), set `DATABASE_URL` accordingly and run only the `app` service; migrations still apply automatically at startup.

## 🔒 Data & privacy

Self-hosted: all data lives in **your** PostgreSQL. Nothing is sent to third parties. The JSON backup exists for migration between servers.

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PR checklist: `npm run lint`, `npm test`, and `npm run build` must all pass; verify at 360px width and in print preview (no app chrome visible).
