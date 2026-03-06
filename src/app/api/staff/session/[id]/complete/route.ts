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

  const today = getTodayString()

  // Hoàn thành entry hiện tại
  await prisma.queueEntry.updateMany({
    where: { calledBySessionId: id, status: 'called', date: today },
    data: { status: 'completed' },
  })

  // Đưa phiên về idle
  await prisma.staffSession.update({ where: { id }, data: { status: 'idle' } })

  // Tính lại thời gian chờ cho các khách còn lại
  await recalculateWaitTimes(staffSession.queueId)

  return NextResponse.json({ ok: true })
}
