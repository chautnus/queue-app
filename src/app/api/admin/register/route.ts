import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
    }

    const existing = await prisma.admin.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email đã được sử dụng' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const admin = await prisma.admin.create({
      data: { name, email, password: hashed },
    })

    return NextResponse.json({ id: admin.id, name: admin.name, email: admin.email }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
