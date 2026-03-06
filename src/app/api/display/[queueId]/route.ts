import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTodayString } from '@/lib/utils'

type Params = { params: Promise<{ queueId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { queueId } = await params
  const today = getTodayString()

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: { admin: { select: { logo: true, name: true } } },
  })
  if (!queue) return NextResponse.json({ error: 'Không tìm thấy hàng đợi' }, { status: 404 })

  // Các phiên nhân viên đang hoạt động hôm nay (không phải ended)
  const activeSessions = await prisma.staffSession.findMany({
    where: { queueId, date: today, status: { not: 'ended' } },
    include: {
      staff: { select: { name: true } },
    },
    orderBy: { counterNumber: 'asc' },
  })

  // Khách đang được phục vụ tại từng cửa
  const counters = await Promise.all(
    activeSessions.map(async (s) => {
      const current = await prisma.queueEntry.findFirst({
        where: { calledBySessionId: s.id, status: 'called', date: today },
        select: { ticketNumber: true },
      })
      return {
        counterNumber: s.counterNumber,
        staffName: s.staff.name,
        sessionStatus: s.status,
        currentTicket: current?.ticketNumber ?? null,
      }
    })
  )

  // Thống kê chung
  const waitingCount = await prisma.queueEntry.count({
    where: { queueId, date: today, status: 'waiting' },
  })
  const completedCount = await prisma.queueEntry.count({
    where: { queueId, date: today, status: 'completed' },
  })

  return NextResponse.json({
    queue: {
      id: queue.id,
      name: queue.name,
      adminLogo: queue.admin.logo,
      adminName: queue.admin.name,
    },
    counters,
    waitingCount,
    completedCount,
    today,
    serverTime: new Date().toISOString(),
  })
}
