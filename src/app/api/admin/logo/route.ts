import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const MAX_SIZE_MB = 2
const VALID_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('logo') as File | null
    if (!file) return NextResponse.json({ error: 'Thiếu file ảnh' }, { status: 400 })

    if (!VALID_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Chỉ chấp nhận file ảnh (jpg, png, gif, webp)' }, { status: 400 })
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Ảnh tối đa ${MAX_SIZE_MB}MB` }, { status: 400 })
    }

    // Lưu trực tiếp vào DB dạng base64 data URL (không cần filesystem)
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    await prisma.admin.update({ where: { id: session.user.id }, data: { logo: dataUrl } })

    return NextResponse.json({ logo: dataUrl })
  } catch {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
