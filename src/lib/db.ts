import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/** Server-only Prisma singleton. Never import this from a client component.
 *
 *  Runtime uses the POOLED connection string (Neon pooler) when available —
 *  serverless functions open short-lived connections, so pooling matters.
 *  Migrations use DIRECT_URL instead (see prisma.config.ts).
 *
 *  connectionTimeoutMillis keeps a dead/unreachable DB from hanging page
 *  renders and builds indefinitely — it fails fast into our null-fallbacks.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL,
  connectionTimeoutMillis: 8000,
  max: 5,
});
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
