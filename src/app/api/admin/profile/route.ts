import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const admin = await prisma.admin.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, logo: true },
  })
  if (!admin) return NextResponse.json({ error: 'Không tìm thấy' }, { status: 404 })

  return NextResponse.json(admin)
}
