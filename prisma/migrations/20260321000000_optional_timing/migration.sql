-- AlterTable: make startAt and endAt optional, add default timezone
ALTER TABLE "Queue" ALTER COLUMN "startAt" DROP NOT NULL;
ALTER TABLE "Queue" ALTER COLUMN "endAt" DROP NOT NULL;
ALTER TABLE "Queue" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Ho_Chi_Minh';
