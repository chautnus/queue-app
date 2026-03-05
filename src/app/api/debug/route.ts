import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Endpoint tạm để debug Railway - XÓA sau khi xong
export async function GET() {
  const info: Record<string, unknown> = {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL
      ? process.env.DATABASE_URL.replace(/(:\/\/).*/, '://***') // mask nhưng giữ protocol
      : 'NOT SET',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT SET',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
  }

  try {
    // Thử query đơn giản nhất
    const count = await prisma.admin.count()
    info.prisma = 'OK'
    info.adminCount = count
  } catch (e) {
    info.prisma = 'ERROR'
    info.prismaError = String(e)
    info.prismaErrorDetail = e instanceof Error ? e.stack : undefined
  }

  return NextResponse.json(info)
}
