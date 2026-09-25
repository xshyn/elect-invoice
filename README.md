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

## 🌐 Deployment

### Vercel + Neon (recommended, free)

Vercel runs both the frontend and the backend (Server Actions become serverless
functions); Neon provides the free PostgreSQL. No VPS needed.

1. **Push the repo to GitHub** (`git push -u origin main`).
2. **Create the database** at [neon.tech](https://neon.tech): new project, region
   closest to you (e.g. US East if your users are in the US, EU if in Europe).
   Copy two connection strings:
   - **Pooled** (has `-pooler` in the hostname) → Vercel `DATABASE_URL`
   - **Direct** (no `-pooler`) → Vercel `DIRECT_URL` (migrations need this)
3. **Import into Vercel** ([vercel.com/new](https://vercel.com/new)): pick
   `xshyn/elect-invoice`. Framework is auto-detected (Next.js) — leave the
   Build Command alone: Vercel automatically runs the repo's `vercel-build`
   script (`prisma generate && prisma migrate deploy && next build`), so the
   schema is applied on every deploy.
4. **Add Environment Variables** (Production + Preview + Development):
   - `DATABASE_URL` = pooled string
   - `DIRECT_URL` = direct string
5. **Deploy.** Open the `*.vercel.app` URL, create a test invoice, check the list.
6. Every future `git push` redeploys automatically (Preview deployments for PRs included).

### VPS with Docker (alternative)

1. The `docker` workflow publishes `ghcr.io/xshyn/elect-invoice:latest` on push to `main`.
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
