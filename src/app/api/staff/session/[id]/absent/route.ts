import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { staffAuthOptions } from '@/lib/staffAuth'
import { prisma } from '@/lib/prisma'
import { getTodayString } from '@/lib/utils'
import { recalculateWaitTimes } from '@/lib/queueUtils'
import { sendPushNotification } from '@/lib/webpush'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getServerSession(staffAuthOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const staffSession = await prisma.staffSession.findUnique({
    where: { id },
    include: { queue: { select: { allowRequeue: true, maxQueueSize: true } } },
  })
  if (!staffSession || staffSession.staffId !== session.user.id) {
    return NextResponse.json({ error: 'Không tìm thấy phiên làm việc' }, { status: 404 })
  }
  if (staffSession.status !== 'serving') {
    return NextResponse.json({ error: 'Không có khách đang phục vụ' }, { status: 400 })
  }

  const today = getTodayString()

  // Tìm entry đang được gọi
  const currentEntry = await prisma.queueEntry.findFirst({
    where: { calledBySessionId: id, status: 'called', date: today },
  })
  if (!currentEntry) {
    return NextResponse.json({ error: 'Không tìm thấy khách đang phục vụ' }, { status: 404 })
  }

  const newNoShowCount = currentEntry.noShowCount + 1
  const allowRequeue = staffSession.queue.allowRequeue

  if (allowRequeue && newNoShowCount < 2) {
    // Cho vào lại cuối hàng đợi
    const lastEntry = await prisma.queueEntry.findFirst({
      where: { queueId: staffSession.queueId, date: today },
      orderBy: { ticketNumber: 'desc' },
    })
    const newTicketNumber = (lastEntry?.ticketNumber ?? 0) + 1

    await prisma.queueEntry.update({
      where: { id: currentEntry.id },
      data: {
        status: 'waiting',
        counterNumber: null,
        calledBySessionId: null,
        calledAt: null,
        absentAt: new Date(),
        noShowCount: newNoShowCount,
        ticketNumber: newTicketNumber,
      },
    })
  } else {
    // Đánh dấu vắng mặt vĩnh viễn
    await prisma.queueEntry.update({
      where: { id: currentEntry.id },
      data: {
        status: 'absent',
        absentAt: new Date(),
        noShowCount: newNoShowCount,
      },
    })
  }

  // Tự động gọi khách tiếp theo
  const nextEntry = await prisma.queueEntry.findFirst({
    where: { queueId: staffSession.queueId, date: today, status: 'waiting' },
    orderBy: { ticketNumber: 'asc' },
  })

  if (!nextEntry) {
    await prisma.staffSession.update({ where: { id }, data: { status: 'idle' } })
    await recalculateWaitTimes(staffSession.queueId)
    return NextResponse.json({ done: true, message: 'Hết khách trong hàng đợi' })
  }

  const calledEntry = await prisma.queueEntry.update({
    where: { id: nextEntry.id },
    data: {
      status: 'called',
      counterNumber: staffSession.counterNumber,
      calledBySessionId: id,
      calledAt: new Date(),
    },
    include: { pushSubscription: true },
  })

  await prisma.staffSession.update({ where: { id }, data: { status: 'serving' } })
  await recalculateWaitTimes(staffSession.queueId)

  // Gửi push notification
  if (calledEntry.pushSubscription) {
    sendPushNotification(calledEntry.pushSubscription, {
      title: `🔔 Đến lượt bạn! Số #${calledEntry.ticketNumber}`,
      body: `Vui lòng đến cửa số ${staffSession.counterNumber} phục vụ.`,
    }).catch(() => {})
  }

  return NextResponse.json({
    ticketNumber: calledEntry.ticketNumber,
    verificationCode: calledEntry.verificationCode,
    counterNumber: calledEntry.counterNumber,
    requeuedTicket: allowRequeue && newNoShowCount < 2 ? currentEntry.ticketNumber : null,
  })
}
