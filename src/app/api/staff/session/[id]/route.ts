import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { staffAuthOptions } from '@/lib/staffAuth'
import { prisma } from '@/lib/prisma'
import { getTodayString } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getServerSession(staffAuthOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const staffSession = await prisma.staffSession.findUnique({
    where: { id },
    include: { queue: { select: { id: true, name: true } } },
  })
  if (!staffSession || staffSession.staffId !== session.user.id) {
    return NextResponse.json({ error: 'Không tìm thấy phiên làm việc' }, { status: 404 })
  }

  const today = getTodayString()
  const currentEntry = await prisma.queueEntry.findFirst({
    where: { calledBySessionId: id, status: 'called', date: today },
    select: { ticketNumber: true, verificationCode: true, counterNumber: true },
  })

  return NextResponse.json({
    id: staffSession.id,
    status: staffSession.status,
    counterNumber: staffSession.counterNumber,
    queue: { id: staffSession.queue.id, name: staffSession.queue.name },
    currentEntry: currentEntry ?? null,
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

  const updated = await prisma.staffSession.update({
    where: { id },
    data: {
      status,
      endedAt: status === 'ended' ? new Date() : undefined,
    },
  })

  return NextResponse.json({ session: updated })
}
