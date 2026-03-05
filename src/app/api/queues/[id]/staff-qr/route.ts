import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import QRCode from 'qrcode'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const { id } = await params
  const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'
  const staffJoinUrl = `${origin}/staff/join/${id}`

  try {
    const qr = await QRCode.toDataURL(staffJoinUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#1e293b', light: '#ffffff' },
    })
    return NextResponse.json({ qr, url: staffJoinUrl })
  } catch {
    return NextResponse.json({ error: 'Lỗi tạo QR' }, { status: 500 })
  }
}
