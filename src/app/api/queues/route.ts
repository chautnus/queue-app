import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const queues = await prisma.queue.findMany({
    where: { adminId: session.user.id },
    include: { _count: { select: { entries: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(queues)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      name, startTime, endTime, avgProcessingTime,
      numberOfCounters, workingHours, qrType, waitThreshold, waitCheckDepth,
      maxQueueSize, allowRequeue, redirectUrl,
    } = body

    if (!name || !startTime || !endTime || !avgProcessingTime) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    const queue = await prisma.queue.create({
      data: {
        name,
        startTime,
        endTime,
        avgProcessingTime: parseInt(avgProcessingTime),
        numberOfCounters: parseInt(numberOfCounters) || 1,
        workingHours: workingHours ? JSON.stringify(workingHours) : null,
        qrType: qrType || 'fixed',
        waitThreshold: parseInt(waitThreshold) || 5,
        waitCheckDepth: parseInt(waitCheckDepth) || 5,
        maxQueueSize: parseInt(maxQueueSize) || 0,
        allowRequeue: allowRequeue === true || allowRequeue === 'true',
        redirectUrl: redirectUrl || '',
        adminId: session.user.id,
      },
    })

    return NextResponse.json(queue, { status: 201 })
  } catch (e) {
    console.error('[POST /api/queues]', e)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
