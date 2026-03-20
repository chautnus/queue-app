-- AlterTable: add category, collectAge, collectAddress to Queue
ALTER TABLE "Queue" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "Queue" ADD COLUMN IF NOT EXISTS "collectAge" "CollectMode" NOT NULL DEFAULT 'HIDDEN';
ALTER TABLE "Queue" ADD COLUMN IF NOT EXISTS "collectAddress" "CollectMode" NOT NULL DEFAULT 'HIDDEN';

-- AlterTable: add plannedEndAt to StaffSession
ALTER TABLE "StaffSession" ADD COLUMN IF NOT EXISTS "plannedEndAt" TIMESTAMP(3);
