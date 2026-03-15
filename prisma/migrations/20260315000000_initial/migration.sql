-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "QrRotationType" AS ENUM ('FIXED', 'DAILY');

-- CreateEnum
CREATE TYPE "CollectMode" AS ENUM ('HIDDEN', 'OPTIONAL', 'REQUIRED');

-- CreateEnum
CREATE TYPE "StaffSessionStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('WAITING', 'CALLED', 'SERVING', 'COMPLETED', 'ABSENT', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Queue" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "slug" TEXT NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'INACTIVE',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "qrRotationType" "QrRotationType" NOT NULL DEFAULT 'FIXED',
    "qrSecret" TEXT NOT NULL,
    "requireCustomerInfo" BOOLEAN NOT NULL DEFAULT false,
    "collectName" "CollectMode" NOT NULL DEFAULT 'HIDDEN',
    "collectPhone" "CollectMode" NOT NULL DEFAULT 'HIDDEN',
    "collectEmail" "CollectMode" NOT NULL DEFAULT 'HIDDEN',
    "customFields" JSONB,
    "redirectUrl" TEXT,
    "allowTransfer" BOOLEAN NOT NULL DEFAULT false,
    "transferQueueId" TEXT,
    "adBannerSlotId" TEXT,
    "greeting" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avgProcessingSeconds" INTEGER NOT NULL DEFAULT 300,
    "ticketPrefix" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Counter" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "schedule" JSONB,

    CONSTRAINT "Counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QueueStaff" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "QueueStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "counterId" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "status" "StaffSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "servedCount" INTEGER NOT NULL DEFAULT 0,
    "totalServiceSeconds" INTEGER NOT NULL DEFAULT 0,
    "streamIds" TEXT[],

    CONSTRAINT "StaffSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "ticketNumber" INTEGER NOT NULL,
    "displayNumber" TEXT NOT NULL,
    "verifyCode" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'WAITING',
    "deviceId" TEXT,
    "customerInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calledAt" TIMESTAMP(3),
    "servedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "ratingComment" TEXT,
    "staffSessionId" TEXT,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceRegistration" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "ticketId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyTicketCounter" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyTicketCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Queue_slug_key" ON "Queue"("slug");

-- CreateIndex
CREATE INDEX "Queue_ownerId_idx" ON "Queue"("ownerId");

-- CreateIndex
CREATE INDEX "Stream_queueId_idx" ON "Stream"("queueId");

-- CreateIndex
CREATE INDEX "Counter_streamId_idx" ON "Counter"("streamId");

-- CreateIndex
CREATE UNIQUE INDEX "QueueStaff_queueId_userId_key" ON "QueueStaff"("queueId", "userId");

-- CreateIndex
CREATE INDEX "StaffSession_counterId_idx" ON "StaffSession"("counterId");

-- CreateIndex
CREATE INDEX "StaffSession_userId_idx" ON "StaffSession"("userId");

-- CreateIndex
CREATE INDEX "StaffSession_queueId_idx" ON "StaffSession"("queueId");

-- CreateIndex
CREATE INDEX "Ticket_queueId_streamId_status_idx" ON "Ticket"("queueId", "streamId", "status");

-- CreateIndex
CREATE INDEX "Ticket_queueId_createdAt_idx" ON "Ticket"("queueId", "createdAt");

-- CreateIndex
CREATE INDEX "Ticket_displayNumber_queueId_idx" ON "Ticket"("displayNumber", "queueId");

-- CreateIndex
CREATE INDEX "DeviceRegistration_queueId_idx" ON "DeviceRegistration"("queueId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceRegistration_queueId_deviceId_key" ON "DeviceRegistration"("queueId", "deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_ticketId_idx" ON "PushSubscription"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyTicketCounter_streamId_date_key" ON "DailyTicketCounter"("streamId", "date");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queue" ADD CONSTRAINT "Queue_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stream" ADD CONSTRAINT "Stream_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Counter" ADD CONSTRAINT "Counter_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueStaff" ADD CONSTRAINT "QueueStaff_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QueueStaff" ADD CONSTRAINT "QueueStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_counterId_fkey" FOREIGN KEY ("counterId") REFERENCES "Counter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSession" ADD CONSTRAINT "StaffSession_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_staffSessionId_fkey" FOREIGN KEY ("staffSessionId") REFERENCES "StaffSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceRegistration" ADD CONSTRAINT "DeviceRegistration_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "Queue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyTicketCounter" ADD CONSTRAINT "DailyTicketCounter_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

