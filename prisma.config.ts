import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

// Migrations must run over a DIRECT connection (PgBouncer transaction-mode
// poolers break `migrate deploy`). Runtime traffic uses the pooled URL in
// src/lib/db.ts. Locally only DATABASE_URL exists, so fall back to it.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url:
      process.env.DIRECT_URL ??
      process.env.POSTGRES_URL_NON_POOLING ??
      env('DATABASE_URL'),
  },
});
