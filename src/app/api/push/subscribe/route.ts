import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { entryId, subscription } = await req.json()
    if (!entryId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
    }

    // Kiểm tra entry tồn tại
    const entry = await prisma.queueEntry.findUnique({ where: { id: entryId } })
    if (!entry) return NextResponse.json({ error: 'Không tìm thấy phiên xếp hàng' }, { status: 404 })

    // Lưu hoặc cập nhật subscription
    await prisma.pushSubscription.upsert({
      where: { entryId },
      create: {
        entryId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[push/subscribe]', err)
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { entryId } = await req.json()
    if (!entryId) return NextResponse.json({ error: 'Thiếu entryId' }, { status: 400 })
    await prisma.pushSubscription.deleteMany({ where: { entryId } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 })
  }
}
