import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { staffAuthOptions } from '@/lib/staffAuth'
import { prisma } from '@/lib/prisma'
import { getTodayString } from '@/lib/utils'
import { recalculateWaitTimes } from '@/lib/queueUtils'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getServerSession(staffAuthOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const staffSession = await prisma.staffSession.findUnique({
    where: { id },
    include: { queue: { select: { id: true, name: true, avgProcessingTime: true } } },
  })
  if (!staffSession || staffSession.staffId !== session.user.id) {
    return NextResponse.json({ error: 'Không tìm thấy phiên làm việc' }, { status: 404 })
  }

  const today = getTodayString()
  const currentEntry = await prisma.queueEntry.findFirst({
    where: { calledBySessionId: id, status: 'called', date: today },
    select: { id: true, ticketNumber: true, verificationCode: true, counterNumber: true, calledAt: true },
  })

  // Auto-timeout: nếu phục vụ quá 2x thời gian TB mà không bấm gì → tự động hoàn thành
  if (staffSession.status === 'serving' && currentEntry?.calledAt) {
    const elapsedMins = (Date.now() - currentEntry.calledAt.getTime()) / 60000
    const timeoutMins = 2 * staffSession.queue.avgProcessingTime

    if (elapsedMins > timeoutMins) {
      await prisma.queueEntry.update({ where: { id: currentEntry.id }, data: { status: 'completed' } })
      await prisma.staffSession.update({ where: { id }, data: { status: 'idle' } })
      await recalculateWaitTimes(staffSession.queueId)

      return NextResponse.json({
        id: staffSession.id,
        status: 'idle',
        counterNumber: staffSession.counterNumber,
        queue: { id: staffSession.queue.id, name: staffSession.queue.name },
        currentEntry: null,
        autoTimedOut: true,
      })
    }
  }

  return NextResponse.json({
    id: staffSession.id,
    status: staffSession.status,
    counterNumber: staffSession.counterNumber,
    queue: { id: staffSession.queue.id, name: staffSession.queue.name },
    currentEntry: currentEntry ? {
      ticketNumber: currentEntry.ticketNumber,
      verificationCode: currentEntry.verificationCode,
      counterNumber: currentEntry.counterNumber,
    } : null,
  })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getServerSession(staffAuthOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const staffSession = await prisma.staffSession.findUnique({ where: { id } })
  if (!staffSession || staffSession.staffId !== session.user.id) {
    return NextResponse.json({ error: 'Không tìm thấy phiên làm việc' }, { status: 404 })
  }

  const { status } = await req.json()
  const validStatuses = ['idle', 'paused', 'ended']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Trạng thái không hợp lệ' }, { status: 400 })
  }

  // Khi kết thúc ca: hoàn thành khách đang phục vụ và tính lại
  if (status === 'ended') {
    const today = getTodayString()
    await prisma.queueEntry.updateMany({
      where: { calledBySessionId: id, status: 'called', date: today },
      data: { status: 'completed' },
    })
    await recalculateWaitTimes(staffSession.queueId)
  }

  const updated = await prisma.staffSession.update({
    where: { id },
    data: { status, endedAt: status === 'ended' ? new Date() : undefined },
  })

  return NextResponse.json({ session: updated })
}
