import { test, expect, Page } from '@playwright/test'
import { getSeedData, cleanQueue, createTestEntry } from './fixtures'

test.describe('Staff: Work Session', () => {
  let seed: ReturnType<typeof getSeedData>
  let sessionUrl: string

  test.beforeAll(() => {
    seed = getSeedData()
  })

  test.beforeEach(async () => {
    await cleanQueue(seed.queueId)
  })

  /**
   * Helper: Join queue as staff và navigate tới work page
   */
  async function joinQueueAsStaff(page: Page): Promise<void> {
    await page.goto(`/staff/join/${seed.queueId}`)
    await page.waitForLoadState('networkidle')

    // Thấy tên hàng đợi
    await expect(page.getByText(seed.queueName)).toBeVisible({ timeout: 10000 })

    // Đã đăng nhập → thấy nút bắt đầu
    await expect(page.getByText('Bắt đầu ca làm →')).toBeVisible({ timeout: 5000 })

    await page.getByText('Bắt đầu ca làm →').click()

    // Redirect tới /staff/work/[sessionId]
    await page.waitForURL(/\/staff\/work\//, { timeout: 10000 })
    sessionUrl = page.url()
  }

  test('join queue và vào work page', async ({ page }) => {
    await joinQueueAsStaff(page)
    await expect(page).toHaveURL(/\/staff\/work\//)
    // Thấy tên hàng đợi trong header
    await expect(page.getByText(seed.queueName)).toBeVisible()
  })

  test('idle: thấy giao diện sẵn sàng', async ({ page }) => {
    await joinQueueAsStaff(page)
    await expect(page.getByText('Sẵn sàng nhận khách', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('button', { name: /Gọi khách tiếp theo/ })).toBeVisible()
  })

  test('call next khi hàng đợi rỗng → thấy thông báo hết khách', async ({ page }) => {
    await joinQueueAsStaff(page)

    await page.getByRole('button', { name: /Gọi khách tiếp theo/ }).click()
    await expect(page.getByText(/Hết khách/)).toBeVisible({ timeout: 10000 })
  })

  test('call next với 1 khách → thấy số vé + mã 4 số', async ({ page }) => {
    // Tạo 1 entry trước
    await createTestEntry(seed.queueId, 'device-staff-test-1')
    await joinQueueAsStaff(page)

    // Gọi khách
    await page.getByRole('button', { name: /Gọi khách tiếp theo/ }).click()

    // Thấy số thứ tự
    await expect(page.locator('text=/^#\\d+/')).toBeVisible({ timeout: 10000 })

    // Thấy 4 ô mã xác nhận (4 chữ số riêng lẻ)
    const codeBoxes = page.locator('.font-mono')
    await expect(codeBoxes.first()).toBeVisible()
  })

  test('serving: hiển thị card khách đang phục vụ', async ({ page }) => {
    await createTestEntry(seed.queueId, 'device-serving-test')
    await joinQueueAsStaff(page)
    await page.getByRole('button', { name: /Gọi khách tiếp theo/ }).click()

    // Thấy "Đang phục vụ" badge
    await expect(page.getByText('Đang phục vụ').first()).toBeVisible({ timeout: 10000 })
    // Thấy nút "⚠️ Khách vắng mặt"
    await expect(page.getByText('Khách vắng mặt')).toBeVisible()
    // Thấy nút "✓ Hoàn thành"
    await expect(page.getByText('Hoàn thành')).toBeVisible()
  })

  test('complete → về idle', async ({ page }) => {
    await createTestEntry(seed.queueId, 'device-complete-test')
    await joinQueueAsStaff(page)
    await page.getByRole('button', { name: /Gọi khách tiếp theo/ }).click()
    await expect(page.getByText('Đang phục vụ').first()).toBeVisible({ timeout: 10000 })

    // Click hoàn thành
    await page.getByText('Hoàn thành').click()

    // Về idle
    await expect(page.getByText('Sẵn sàng nhận khách', { exact: true })).toBeVisible({ timeout: 10000 })
  })

  test('absent flow → gọi khách tiếp', async ({ page }) => {
    // Tạo 2 entries
    await createTestEntry(seed.queueId, 'device-absent-1')
    await createTestEntry(seed.queueId, 'device-absent-2')
    await joinQueueAsStaff(page)

    // Gọi khách 1
    await page.getByRole('button', { name: /Gọi khách tiếp theo/ }).click()
    await expect(page.getByText('Đang phục vụ').first()).toBeVisible({ timeout: 10000 })

    // Click vắng mặt
    await page.getByText('Khách vắng mặt').click()

    // Thấy thông báo + khách 2 được gọi
    await expect(page.getByText(/Đã gọi #/)).toBeVisible({ timeout: 10000 })
  })

  test('pause và resume', async ({ page }) => {
    await joinQueueAsStaff(page)

    // Click tạm nghỉ
    await page.getByText('Tạm nghỉ').click()
    await expect(page.getByText('Đang tạm dừng phục vụ')).toBeVisible({ timeout: 10000 })

    // Click tiếp tục
    await page.getByText('Tiếp tục phục vụ').click()
    await expect(page.getByText('Sẵn sàng nhận khách', { exact: true })).toBeVisible({ timeout: 10000 })
  })

  test('end session → thấy trang kết thúc', async ({ page }) => {
    await joinQueueAsStaff(page)

    // Click kết thúc ca (dialog confirm)
    page.on('dialog', dialog => dialog.accept())
    await page.getByText('Kết thúc ca').first().click()

    // Thấy "Ca làm đã kết thúc"
    await expect(page.getByText('Ca làm đã kết thúc')).toBeVisible({ timeout: 10000 })
  })
})
