import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = { params: Promise<{ queueId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { queueId } = await params

  const queue = await prisma.queue.findUnique({
    where: { id: queueId },
    include: { admin: { select: { logo: true } } },
  })

  if (!queue) return NextResponse.json({ error: 'Hàng đợi không tồn tại' }, { status: 404 })

  return NextResponse.json({
    queue: {
      id: queue.id,
      name: queue.name,
      numberOfCounters: queue.numberOfCounters,
      isActive: queue.isActive,
      adminLogo: queue.admin.logo,
    },
  })
}
