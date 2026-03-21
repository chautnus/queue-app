-- Run this in Neon Console SQL Editor (https://console.neon.tech)
-- Go to: Your Project > SQL Editor > paste and run

-- Step 1: Grant CREATE on public schema
GRANT CREATE ON SCHEMA public TO neondb_owner;
GRANT USAGE ON SCHEMA public TO neondb_owner;

-- Step 2: Create enum
DO $$ BEGIN
  CREATE TYPE "StreamAssignMode" AS ENUM ('CUSTOMER_CHOICE', 'STAFF_ASSIGN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Add column to Queue
ALTER TABLE "Queue" ADD COLUMN IF NOT EXISTS "streamAssignMode" "StreamAssignMode" NOT NULL DEFAULT 'CUSTOMER_CHOICE';

-- Step 4: Make Ticket.streamId nullable
ALTER TABLE "Ticket" ALTER COLUMN "streamId" DROP NOT NULL;

-- Verify
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'Queue' AND column_name = 'streamAssignMode'
UNION ALL
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'Ticket' AND column_name = 'streamId';
