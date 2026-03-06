import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const queue = await prisma.queue.findUnique({
    where: { id },
    include: {
      entries: {
        where: { status: 'waiting' },
        orderBy: { ticketNumber: 'asc' },
      },
    },
  })
  if (!queue) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(queue)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    const body = await req.json()
    const {
      name, startTime, endTime, avgProcessingTime,
      numberOfCounters, workingHours, qrType, isActive, waitThreshold, waitCheckDepth,
      maxQueueSize, allowRequeue,
    } = body

    const queue = await prisma.queue.update({
      where: { id, adminId: session.user.id },
      data: {
        name,
        startTime,
        endTime,
        avgProcessingTime: parseInt(avgProcessingTime),
        numberOfCounters: parseInt(numberOfCounters) || 1,
        workingHours: workingHours ? JSON.stringify(workingHours) : null,
        qrType: qrType || 'fixed',
        isActive: isActive !== undefined ? isActive : true,
        waitThreshold: parseInt(waitThreshold) || 5,
        waitCheckDepth: parseInt(waitCheckDepth) || 5,
        maxQueueSize: parseInt(maxQueueSize) || 0,
        allowRequeue: allowRequeue === true || allowRequeue === 'true',
      },
    })
    return NextResponse.json(queue)
  } catch {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  try {
    await prisma.queueEntry.deleteMany({ where: { queueId: id } })
    await prisma.staffSession.deleteMany({ where: { queueId: id } })
    await prisma.queue.delete({ where: { id, adminId: session.user.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
