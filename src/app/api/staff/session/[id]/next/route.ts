import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { staffAuthOptions } from '@/lib/staffAuth'
import { prisma } from '@/lib/prisma'
import { getTodayString } from '@/lib/utils'
import { recalculateWaitTimes } from '@/lib/queueUtils'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getServerSession(staffAuthOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const staffSession = await prisma.staffSession.findUnique({ where: { id } })
  if (!staffSession || staffSession.staffId !== session.user.id) {
    return NextResponse.json({ error: 'Không tìm thấy phiên làm việc' }, { status: 404 })
  }
  if (staffSession.status === 'ended' || staffSession.status === 'paused') {
    return NextResponse.json({ error: 'Phiên đang tạm dừng hoặc đã kết thúc' }, { status: 400 })
  }

  const today = getTodayString()

  // Hoàn thành entry hiện tại nếu có (nhân viên gọi tiếp trong khi đang phục vụ)
  await prisma.queueEntry.updateMany({
    where: { calledBySessionId: id, status: 'called', date: today },
    data: { status: 'completed' },
  })

  // Tự động tìm khách hàng tiếp theo (số vé nhỏ nhất đang chờ)
  const nextEntry = await prisma.queueEntry.findFirst({
    where: { queueId: staffSession.queueId, date: today, status: 'waiting' },
    orderBy: { ticketNumber: 'asc' },
  })

  if (!nextEntry) {
    // Không còn khách → về idle
    await prisma.staffSession.update({ where: { id }, data: { status: 'idle' } })
    return NextResponse.json({ done: true, message: 'Hết khách trong hàng đợi' })
  }

  // Gọi khách tiếp theo
  const calledEntry = await prisma.queueEntry.update({
    where: { id: nextEntry.id },
    data: {
      status: 'called',
      counterNumber: staffSession.counterNumber,
      calledBySessionId: id,
      calledAt: new Date(),
    },
  })

  // Cập nhật trạng thái phiên
  await prisma.staffSession.update({ where: { id }, data: { status: 'serving' } })

  // Tính lại thời gian chờ cho các khách còn lại
  await recalculateWaitTimes(staffSession.queueId)

  return NextResponse.json({
    ticketNumber: calledEntry.ticketNumber,
    verificationCode: calledEntry.verificationCode,
    counterNumber: calledEntry.counterNumber,
  })
}
