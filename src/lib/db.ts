import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/** Server-only Prisma singleton. Never import this from a client component. */

const pool = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter: pool });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
