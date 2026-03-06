import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const TEST_DB = 'file:./test.db'

export interface SeedData {
  adminEmail: string
  adminPassword: string
  staffEmail: string
  staffPassword: string
  adminId: string
  staffId: string
  queueId: string
  queueName: string
}

export function getSeedData(): SeedData {
  const seedFile = path.resolve('./tests/.seed.json')
  return JSON.parse(fs.readFileSync(seedFile, 'utf-8'))
}

/**
 * Xóa tất cả entries và sessions của queue trong test DB.
 * Gọi trong beforeEach để đảm bảo test isolation.
 */
export async function cleanQueue(queueId: string): Promise<void> {
  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DB } },
  })
  try {
    const entryIds = (await prisma.queueEntry.findMany({
      where: { queueId },
      select: { id: true },
    })).map(e => e.id)

    if (entryIds.length > 0) {
      await prisma.pushSubscription.deleteMany({ where: { entryId: { in: entryIds } } })
    }
    await prisma.queueEntry.deleteMany({ where: { queueId } })
    await prisma.staffSession.deleteMany({ where: { queueId } })
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Tạo một QueueEntry "waiting" cho test.
 * Trả về { ticketNumber, verificationCode, id }
 */
export async function createTestEntry(queueId: string, deviceId = 'test-device-001') {
  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DB } },
  })
  try {
    const today = new Date().toISOString().split('T')[0]
    const last = await prisma.queueEntry.findFirst({
      where: { queueId },
      orderBy: { ticketNumber: 'desc' },
    })
    const ticketNumber = (last?.ticketNumber ?? 0) + 1
    const verificationCode = String(1000 + Math.floor(Math.random() * 9000))
    const entry = await prisma.queueEntry.create({
      data: { queueId, deviceId, ticketNumber, verificationCode, date: today },
    })
    return entry
  } finally {
    await prisma.$disconnect()
  }
}

/**
 * Tạo StaffSession (idle) cho test.
 */
export async function createTestSession(staffId: string, queueId: string, counterNumber = 1) {
  const prisma = new PrismaClient({
    datasources: { db: { url: TEST_DB } },
  })
  try {
    const today = new Date().toISOString().split('T')[0]
    const session = await prisma.staffSession.create({
      data: { staffId, queueId, counterNumber, status: 'idle', date: today },
    })
    return session
  } finally {
    await prisma.$disconnect()
  }
}
