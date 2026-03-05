import { NextRequest, NextResponse } from 'next/server'
import QRCode from 'qrcode'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const qrType = searchParams.get('type') ?? 'fixed'

  const origin = req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'
  const today = new Date().toISOString().split('T')[0]
  const suffix = qrType === 'daily' ? `?date=${today}` : ''
  const joinUrl = `${origin}/q/${id}${suffix}`

  try {
    const qr = await QRCode.toDataURL(joinUrl, {
      width: 400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: '#1e293b', light: '#ffffff' },
    })
    return NextResponse.json({ qr, url: joinUrl })
  } catch {
    return NextResponse.json({ error: 'Lỗi tạo QR' }, { status: 500 })
  }
}
