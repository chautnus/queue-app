import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { staffAuthOptions } from '@/lib/staffAuth'
import { prisma } from '@/lib/prisma'
import { getTodayString } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const session = await getServerSession(staffAuthOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  try {
    const { queueId, counterNumber } = await req.json()
    if (!queueId || !counterNumber) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
    }

    const queue = await prisma.queue.findUnique({ where: { id: queueId } })
    if (!queue) return NextResponse.json({ error: 'Hàng đợi không tồn tại' }, { status: 404 })

    if (counterNumber < 1 || counterNumber > queue.numberOfCounters) {
      return NextResponse.json({ error: 'Số cửa không hợp lệ' }, { status: 400 })
    }

    const today = getTodayString()

    // Kiểm tra đã có phiên active hôm nay chưa
    const activeSession = await prisma.staffSession.findFirst({
      where: {
        staffId: session.user.id,
        queueId,
        date: today,
        status: { not: 'ended' },
      },
    })
    if (activeSession) {
      return NextResponse.json(activeSession, { status: 200 })
    }

    const staffSession = await prisma.staffSession.create({
      data: {
        staffId: session.user.id,
        queueId,
        counterNumber,
        status: 'idle',
        date: today,
      },
    })

    return NextResponse.json(staffSession, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
