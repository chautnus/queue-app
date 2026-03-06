-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entryId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "QueueEntry" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "waitThreshold" INTEGER NOT NULL DEFAULT 5,
    "waitCheckDepth" INTEGER NOT NULL DEFAULT 5,
    "maxQueueSize" INTEGER NOT NULL DEFAULT 0,
    "allowRequeue" BOOLEAN NOT NULL DEFAULT false,
    "adminId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Queue_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Queue" ("adminId", "avgProcessingTime", "createdAt", "endTime", "id", "isActive", "name", "numberOfCounters", "qrType", "startTime", "updatedAt", "waitCheckDepth", "waitThreshold", "workingHours") SELECT "adminId", "avgProcessingTime", "createdAt", "endTime", "id", "isActive", "name", "numberOfCounters", "qrType", "startTime", "updatedAt", "waitCheckDepth", "waitThreshold", "workingHours" FROM "Queue";
DROP TABLE "Queue";
ALTER TABLE "new_Queue" RENAME TO "Queue";
CREATE TABLE "new_QueueEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "queueId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "ticketNumber" INTEGER NOT NULL,
    "verificationCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "date" TEXT NOT NULL,
    "counterNumber" INTEGER,
    "calledBySessionId" TEXT,
    "estimatedServedAt" DATETIME,
    "calledAt" DATETIME,
    "absentAt" DATETIME,
    "noShowCount" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QueueEntry_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_QueueEntry" ("calledAt", "calledBySessionId", "counterNumber", "date", "deviceId", "estimatedServedAt", "id", "joinedAt", "queueId", "status", "ticketNumber", "updatedAt", "verificationCode") SELECT "calledAt", "calledBySessionId", "counterNumber", "date", "deviceId", "estimatedServedAt", "id", "joinedAt", "queueId", "status", "ticketNumber", "updatedAt", "verificationCode" FROM "QueueEntry";
DROP TABLE "QueueEntry";
ALTER TABLE "new_QueueEntry" RENAME TO "QueueEntry";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_entryId_key" ON "PushSubscription"("entryId");
