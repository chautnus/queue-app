import { test, expect } from '@playwright/test'
import { getSeedData, cleanQueue, createTestEntry, createTestSession } from './fixtures'

test.describe('Kiosk Display', () => {
  let seed: ReturnType<typeof getSeedData>

  test.beforeAll(() => {
    seed = getSeedData()
  })

  test.beforeEach(async () => {
    await cleanQueue(seed.queueId)
  })

  test('load trang kiosk → thấy tên queue và clock', async ({ page }) => {
    await page.goto(`/display/${seed.queueId}`)
    await page.waitForLoadState('networkidle')

    // Thấy tên hàng đợi
    await expect(page.getByText(seed.queueName)).toBeVisible({ timeout: 10000 })
    // Thấy đồng hồ (giờ:phút)
    const clock = page.locator('text=/\\d{2}:\\d{2}/')
    await expect(clock.first()).toBeVisible()
  })

  test('không có staff session → thấy thông báo chưa hoạt động', async ({ page }) => {
    await page.goto(`/display/${seed.queueId}`)
    await page.waitForLoadState('networkidle')

    // Khi chưa có staff session nào active, thấy thông báo
    await expect(page.getByText(/Chưa có nhân viên nào bắt đầu ca làm việc/)).toBeVisible({ timeout: 10000 })
  })

  test('có staff session đang idle → thấy grid cửa', async ({ page }) => {
    // Tạo session (idle, chưa gọi khách nào)
    await createTestSession(seed.staffId, seed.queueId, 1)

    await page.goto(`/display/${seed.queueId}`)
    await page.waitForLoadState('networkidle')

    // Thấy cửa 1 xuất hiện trong grid
    await expect(page.getByText('Cửa 1')).toBeVisible({ timeout: 10000 })
    // Trạng thái idle: dấu gạch ngang hoặc "Chờ"
    await expect(page.getByText(/—|Chờ/)).toBeVisible()
  })

  test('staff đang gọi khách → kiosk hiển thị số vé', async ({ page }) => {
    // Tạo entry và session, gán vào nhau giả lập trạng thái "called"
    const entry = await createTestEntry(seed.queueId, 'kiosk-test-device')
    const session = await createTestSession(seed.staffId, seed.queueId, 1)

    // Cập nhật entry thành "called" và gán vào session
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient({ datasources: { db: { url: 'file:./test.db' } } })
    await prisma.queueEntry.update({
      where: { id: entry.id },
      data: { status: 'called', calledBySessionId: session.id, counterNumber: 1, calledAt: new Date() },
    })
    await prisma.staffSession.update({
      where: { id: session.id },
      data: { status: 'serving' },
    })
    await prisma.$disconnect()

    // Load kiosk
    await page.goto(`/display/${seed.queueId}`)
    await page.waitForLoadState('networkidle')

    // Thấy số thứ tự của khách (text-9xl là class duy nhất của ô vé lớn)
    await expect(page.locator('.text-9xl').filter({ hasText: String(entry.ticketNumber) })).toBeVisible({ timeout: 10000 })
    // Thấy cửa 1
    await expect(page.getByText('Cửa 1')).toBeVisible()
  })

  test('invalid queue ID → trang lỗi', async ({ page }) => {
    await page.goto('/display/totally-invalid-queue-xyz')
    await page.waitForLoadState('networkidle')
    await expect(page.getByText(/Không tìm thấy|Hàng đợi không tồn tại/i)).toBeVisible({ timeout: 10000 })
  })
})
