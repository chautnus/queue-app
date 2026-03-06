import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const TEST_DB = 'file:./test.db'
const SEED_FILE = path.resolve('./tests/.seed.json')

export const TEST_QUEUE_ID = 'test-queue-id-fixed'
export const ADMIN_EMAIL = 'test-admin@queue.local'
export const ADMIN_PASSWORD = 'Admin1234!'
export const STAFF_EMAIL = 'test-staff@queue.local'
export const STAFF_PASSWORD = 'Staff1234!'

export default async function globalSetup() {
  console.log('\n[Setup] Migrating test database...')
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DB },
    stdio: 'pipe',
  })

  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DB } },
  })

  try {
    console.log('[Setup] Seeding test data...')

    // ── Admin ──────────────────────────────────────────
    const admin = await prisma.admin.upsert({
      where: { email: ADMIN_EMAIL },
      create: {
        email: ADMIN_EMAIL,
        password: await bcrypt.hash(ADMIN_PASSWORD, 10),
        name: 'Test Admin',
      },
      update: {},
    })

    // ── Queue (id cố định để tests dùng dễ) ──────────
    const queue = await prisma.queue.upsert({
      where: { id: TEST_QUEUE_ID },
      create: {
        id: TEST_QUEUE_ID,
        name: 'Hàng đợi test',
        startTime: '00:00',
        endTime: '23:59',
        avgProcessingTime: 5,
        numberOfCounters: 2,
        isActive: true,
        adminId: admin.id,
      },
      update: {
        startTime: '00:00',
        endTime: '23:59',
        isActive: true,
        maxQueueSize: 0, // không giới hạn (default)
        allowRequeue: false,
      },
    })

    // ── Staff ──────────────────────────────────────────
    const staff = await prisma.staff.upsert({
      where: { email: STAFF_EMAIL },
      create: {
        email: STAFF_EMAIL,
        password: await bcrypt.hash(STAFF_PASSWORD, 10),
        name: 'Test Staff',
      },
      update: {},
    })

    // ── Xóa entries + sessions cũ ─────────────────────
    const entryIds = (await prisma.queueEntry.findMany({
      where: { queueId: queue.id },
      select: { id: true },
    })).map(e => e.id)

    if (entryIds.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { entryId: { in: entryIds } },
      })
    }
    await prisma.queueEntry.deleteMany({ where: { queueId: queue.id } })
    await prisma.staffSession.deleteMany({ where: { queueId: queue.id } })

    // ── Lưu seed info ─────────────────────────────────
    const seedData = {
      adminEmail: ADMIN_EMAIL,
      adminPassword: ADMIN_PASSWORD,
      staffEmail: STAFF_EMAIL,
      staffPassword: STAFF_PASSWORD,
      adminId: admin.id,
      staffId: staff.id,
      queueId: queue.id,
      queueName: queue.name,
    }
    fs.writeFileSync(SEED_FILE, JSON.stringify(seedData, null, 2))
    console.log('[Setup] Done. Queue ID:', queue.id)
  } finally {
    await prisma.$disconnect()
  }
}
