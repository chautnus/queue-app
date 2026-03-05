import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTodayString } from '@/lib/utils'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const today = getTodayString()

  const entries = await prisma.queueEntry.findMany({
    where: { queueId: id, date: today },
    orderBy: { ticketNumber: 'asc' },
  })

  return NextResponse.json(entries)
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { entryId, status } = await req.json()

  try {
    const entry = await prisma.queueEntry.update({
      where: { id: entryId, queueId: id },
      data: { status },
    })
    return NextResponse.json(entry)
  } catch {
    return NextResponse.json({ error: 'Lỗi cập nhật' }, { status: 500 })
  }
}
