/**
 * Integration test: Luồng end-to-end
 * Customer join → Staff call → Kiosk shows ticket → Staff complete
 */
import { test, expect, Browser } from '@playwright/test'
import { getSeedData, cleanQueue } from './fixtures'

test.describe('Integration: Full Queue Flow', () => {
  let seed: ReturnType<typeof getSeedData>

  test.beforeAll(() => {
    seed = getSeedData()
  })

  test.beforeEach(async () => {
    await cleanQueue(seed.queueId)
  })

  test('customer joins → staff calls → kiosk shows → staff completes', async ({
    page,      // staff page (dùng auth state staff)
    browser,
  }: {
    page: import('@playwright/test').Page
    browser: Browser
  }) => {
    // ── Bước 1: Customer tham gia hàng đợi ──────────────
    const customerCtx = await browser.newContext()
    const customerPage = await customerCtx.newPage()
    await customerPage.goto(`/q/${seed.queueId}`)
    await customerPage.waitForLoadState('networkidle')
    await customerPage.getByRole('button', { name: /Tham gia hàng đợi/ }).click()
    await expect(customerPage.locator('.text-7xl')).toBeVisible({ timeout: 10000 })

    // Lấy số thứ tự của khách
    const ticketText = await customerPage.locator('.text-7xl').textContent()
    const ticketNumber = ticketText?.trim()
    expect(ticketNumber).toMatch(/^\d+$/)

    // ── Bước 2: Staff bắt đầu ca và gọi khách ──────────
    await page.goto(`/staff/join/${seed.queueId}`)
    await page.waitForLoadState('networkidle')
    await page.getByText('Bắt đầu ca làm →').click()
    await page.waitForURL(/\/staff\/work\//, { timeout: 10000 })

    // Gọi khách tiếp theo
    await page.getByRole('button', { name: /Gọi khách tiếp theo/ }).click()

    // Thấy số vé của customer (exact để tránh match với message "✅ Đã gọi số #X")
    await expect(page.getByText(`#${ticketNumber}`, { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Đang phục vụ').first()).toBeVisible()

    // ── Bước 3: Kiosk hiển thị số vé ──────────────────
    const kioskCtx = await browser.newContext()
    const kioskPage = await kioskCtx.newPage()
    await kioskPage.goto(`/display/${seed.queueId}`)
    await kioskPage.waitForLoadState('networkidle')

    // Kiosk phải thấy số vé (dùng .text-9xl để tránh nhầm với clock/stats)
    await expect(kioskPage.locator('.text-9xl').filter({ hasText: ticketNumber! })).toBeVisible({ timeout: 10000 })
    await expect(kioskPage.getByText('Cửa 1')).toBeVisible()

    // ── Bước 4: Customer thấy trạng thái "called" ──────
    await customerPage.reload()
    await customerPage.waitForLoadState('networkidle')
    // Sau 10s polling hoặc reload, customer thấy "Đến lượt bạn"
    // (có thể cần wait một chút vì polling 10s)
    await expect(customerPage.getByText(/Đến lượt bạn|đến lượt/i).first()).toBeVisible({ timeout: 15000 })

    // ── Bước 5: Staff hoàn thành phục vụ ───────────────
    await page.getByText('Hoàn thành').click()
    await expect(page.getByText('Sẵn sàng nhận khách', { exact: true })).toBeVisible({ timeout: 10000 })

    // Cleanup
    await customerCtx.close()
    await kioskCtx.close()
  })

  test('rate limiting: join quá 10 lần → thấy lỗi 429', async ({ request }) => {
    // Gọi API join 11 lần với cùng 1 IP
    const requests = []
    for (let i = 0; i < 11; i++) {
      requests.push(
        request.post('/api/join', {
          data: { queueId: seed.queueId, deviceId: `rate-limit-device-${i}` },
        })
      )
    }
    const responses = await Promise.all(requests)
    const statuses = responses.map(r => r.status())

    // Ít nhất 1 request phải bị 429
    expect(statuses).toContain(429)
  })
})
