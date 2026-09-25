/** Seed: ensures the singleton business profile exists. Idempotent. */
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.businessProfile.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      name: 'جریان',
      tagline: 'تعمیر و فروش سیم‌کشی ساختمان • تجهیزات برق صنعتی و خانگی',
      phones: ['۰۹۱۲-۰۰۰۰۰۰۰'],
      address: 'تهران، خیابان نمونه، پلاک ۱۲',
      website: 'www.example.ir',
      invoiceTitle: 'صورتحساب',
      currency: 'تومان',
      wordsUnit: 'تومان',
      numberPrefix: '',
      nextNumber: 101,
      theme: 'amber',
      units: ['عدد', 'متر', 'حلقه', 'بسته', 'دستگاه', 'متر مربع', 'کیلوگرم', 'ساعت'],
    },
  });
  console.log('seed: business profile ensured');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
