/*
  Warnings:

  - You are about to drop the column `logo` on the `Queue` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "QueueEntry_verificationCode_key";

-- AlterTable
ALTER TABLE "Admin" ADD COLUMN "logo" TEXT;

-- AlterTable
ALTER TABLE "QueueEntry" ADD COLUMN "calledBySessionId" TEXT;
ALTER TABLE "QueueEntry" ADD COLUMN "counterNumber" INTEGER;

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StaffSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "staffId" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "counterNumber" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "date" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StaffSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StaffSession_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Queue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "avgProcessingTime" INTEGER NOT NULL,
    "numberOfCounters" INTEGER NOT NULL DEFAULT 1,
    "workingHours" TEXT,
    "qrType" TEXT NOT NULL DEFAULT 'fixed',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "adminId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Queue_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Queue" ("adminId", "avgProcessingTime", "createdAt", "endTime", "id", "isActive", "name", "numberOfCounters", "qrType", "startTime", "updatedAt", "workingHours") SELECT "adminId", "avgProcessingTime", "createdAt", "endTime", "id", "isActive", "name", "numberOfCounters", "qrType", "startTime", "updatedAt", "workingHours" FROM "Queue";
DROP TABLE "Queue";
ALTER TABLE "new_Queue" RENAME TO "Queue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");
