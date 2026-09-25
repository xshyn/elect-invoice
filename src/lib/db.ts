import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/** Server-only Prisma singleton. Never import this from a client component.
 *
 *  Runtime uses the POOLED connection string (Neon pooler) when available —
 *  serverless functions open short-lived connections, so pooling matters.
 *  Migrations use DIRECT_URL instead (see prisma.config.ts).
 */
const connectionString =
  process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL;

const pool = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter: pool });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
