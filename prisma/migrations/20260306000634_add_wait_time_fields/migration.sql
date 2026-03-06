-- AlterTable
ALTER TABLE "QueueEntry" ADD COLUMN "calledAt" DATETIME;
ALTER TABLE "QueueEntry" ADD COLUMN "estimatedServedAt" DATETIME;

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
    "waitThreshold" INTEGER NOT NULL DEFAULT 5,
    "waitCheckDepth" INTEGER NOT NULL DEFAULT 5,
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
