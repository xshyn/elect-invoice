-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "units" TEXT[] DEFAULT ARRAY['عدد', 'متر', 'حلقه', 'بسته', 'دستگاه', 'متر مربع', 'کیلوگرم', 'ساعت']::TEXT[];

-- AlterTable
ALTER TABLE "LineItem" ADD COLUMN     "unit" TEXT NOT NULL DEFAULT '';
