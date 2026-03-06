import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateVerificationCode, getTodayString, calculateEstimatedWait, isQueueOpen } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const queueId = searchParams.get('queueId')
  const deviceId = searchParams.get('deviceId')

  if (!queueId || !deviceId) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
  }

  const today = getTodayString()

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: { admin: { select: { logo: true } } },
  })
  if (!queue) return NextResponse.json({ error: 'Hàng đợi không tồn tại' }, { status: 404 })

  const existing = await prisma.queueEntry.findFirst({
    where: { queueId, deviceId, date: today, status: { in: ['waiting', 'called'] } },
  })

  const waitingCount = await prisma.queueEntry.count({
    where: { queueId, date: today, status: 'waiting' },
  })

  const estimatedWait = calculateEstimatedWait(waitingCount, queue.avgProcessingTime, queue.numberOfCounters)
  const open = isQueueOpen(queue)

  return NextResponse.json({
    queue: {
      id: queue.id,
      name: queue.name,
      adminLogo: queue.admin.logo,
      startTime: queue.startTime,
      endTime: queue.endTime,
      avgProcessingTime: queue.avgProcessingTime,
      numberOfCounters: queue.numberOfCounters,
      isActive: queue.isActive,
    },
    isOpen: open,
    waitingCount,
    estimatedWait,
    existingEntry: existing ? {
      id: existing.id,
      ticketNumber: existing.ticketNumber,
      verificationCode: existing.verificationCode,
      status: existing.status,
      joinedAt: existing.joinedAt.toISOString(),
      estimatedServedAt: existing.estimatedServedAt?.toISOString() ?? null,
    } : null,
  })
}

export async function POST(req: NextRequest) {
  try {
    const { queueId, deviceId } = await req.json()

    if (!queueId || !deviceId) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
    }

    const today = getTodayString()

    const queue = await prisma.queue.findUnique({ where: { id: queueId } })
    if (!queue) return NextResponse.json({ error: 'Hàng đợi không tồn tại' }, { status: 404 })
    if (!isQueueOpen(queue)) return NextResponse.json({ error: 'Hàng đợi đã đóng' }, { status: 400 })

    const existing = await prisma.queueEntry.findFirst({
      where: { queueId, deviceId, date: today, status: { in: ['waiting', 'called'] } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Bạn đã có số thứ tự', entry: existing }, { status: 409 })
    }

    const lastEntry = await prisma.queueEntry.findFirst({
      where: { queueId, date: today },
      orderBy: { ticketNumber: 'desc' },
    })

    const ticketNumber = (lastEntry?.ticketNumber ?? 0) + 1
    const verificationCode = generateVerificationCode()

    // Tính thời gian chờ dự kiến
    const waitingAhead = await prisma.queueEntry.count({
      where: { queueId, date: today, status: 'waiting' },
    })
    const estimatedWaitMins = calculateEstimatedWait(waitingAhead, queue.avgProcessingTime, queue.numberOfCounters)
    const estimatedServedAt = new Date(Date.now() + estimatedWaitMins * 60 * 1000)

    const entry = await prisma.queueEntry.create({
      data: {
        queueId, deviceId, ticketNumber, verificationCode, date: today,
        estimatedServedAt,
      },
    })

    return NextResponse.json({
      entry: {
        id: entry.id,
        ticketNumber: entry.ticketNumber,
        verificationCode: entry.verificationCode,
        status: entry.status,
        joinedAt: entry.joinedAt.toISOString(),
        estimatedServedAt: entry.estimatedServedAt?.toISOString() ?? null,
      },
      estimatedWait: estimatedWaitMins,
      queueName: queue.name,
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
