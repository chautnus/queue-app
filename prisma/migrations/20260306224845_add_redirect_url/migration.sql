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
    "maxQueueSize" INTEGER NOT NULL DEFAULT 0,
    "allowRequeue" BOOLEAN NOT NULL DEFAULT false,
    "redirectUrl" TEXT NOT NULL DEFAULT '',
    "adminId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Queue_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Queue" ("adminId", "allowRequeue", "avgProcessingTime", "createdAt", "endTime", "id", "isActive", "maxQueueSize", "name", "numberOfCounters", "qrType", "startTime", "updatedAt", "waitCheckDepth", "waitThreshold", "workingHours") SELECT "adminId", "allowRequeue", "avgProcessingTime", "createdAt", "endTime", "id", "isActive", "maxQueueSize", "name", "numberOfCounters", "qrType", "startTime", "updatedAt", "waitCheckDepth", "waitThreshold", "workingHours" FROM "Queue";
DROP TABLE "Queue";
ALTER TABLE "new_Queue" RENAME TO "Queue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
