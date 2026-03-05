import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { staffAuthOptions } from '@/lib/staffAuth'
import { prisma } from '@/lib/prisma'
import { getTodayString } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
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

  const { ticketNumber } = await req.json()
  if (!ticketNumber) return NextResponse.json({ error: 'Thiếu số thứ tự' }, { status: 400 })

  const today = getTodayString()

  // Tìm entry cần gọi
  const nextEntry = await prisma.queueEntry.findFirst({
    where: {
      queueId: staffSession.queueId,
      date: today,
      ticketNumber: Number(ticketNumber),
      status: 'waiting',
    },
  })
  if (!nextEntry) {
    return NextResponse.json({ error: `Không tìm thấy số ${ticketNumber} hoặc đã được phục vụ` }, { status: 404 })
  }

  // Hoàn thành entry hiện tại nếu có
  await prisma.queueEntry.updateMany({
    where: { calledBySessionId: id, status: 'called', date: today },
    data: { status: 'completed' },
  })

  // Gọi entry mới
  const calledEntry = await prisma.queueEntry.update({
    where: { id: nextEntry.id },
    data: {
      status: 'called',
      counterNumber: staffSession.counterNumber,
      calledBySessionId: id,
    },
  })

  // Cập nhật status phiên
  await prisma.staffSession.update({
    where: { id },
    data: { status: 'serving' },
  })

  return NextResponse.json({
    ticketNumber: calledEntry.ticketNumber,
    verificationCode: calledEntry.verificationCode,
  })
}
