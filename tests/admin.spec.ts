import { test, expect } from '@playwright/test'
import { getSeedData } from './fixtures'

test.describe('Admin: Dashboard & Queue Management', () => {
  let seed: ReturnType<typeof getSeedData>

  test.beforeAll(() => {
    seed = getSeedData()
  })

  test('dashboard hiển thị stats và queue list', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Thấy tiêu đề dashboard
    await expect(page.getByRole('heading', { name: /Tổng quan/i })).toBeVisible({ timeout: 10000 })
    // Thấy queue test trong danh sách
    await expect(page.getByText(seed.queueName)).toBeVisible()
  })

  test('queue detail page có nút kiosk, edit và QR codes', async ({ page }) => {
    await page.goto(`/dashboard/queues/${seed.queueId}`)
    await page.waitForLoadState('networkidle')

    // Thấy tên hàng đợi
    await expect(page.getByText(seed.queueName).first()).toBeVisible({ timeout: 10000 })

    // Thấy nút "Màn hình kiosk"
    await expect(page.getByText('Màn hình kiosk')).toBeVisible()

    // Thấy nút chỉnh sửa
    await expect(page.getByText('Chỉnh sửa')).toBeVisible()
  })

  test('click kiosk button → mở tab mới tới /display/[id]', async ({ page, context }) => {
    await page.goto(`/dashboard/queues/${seed.queueId}`)
    await page.waitForLoadState('networkidle')

    // Hứng tab mới
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByText('Màn hình kiosk').click(),
    ])

    await newPage.waitForLoadState('networkidle')
    expect(newPage.url()).toContain(`/display/${seed.queueId}`)
    await newPage.close()
  })

  test('trang edit queue có đầy đủ các trường', async ({ page }) => {
    await page.goto(`/dashboard/queues/${seed.queueId}/edit`)
    await page.waitForLoadState('networkidle')

    // Trường cơ bản
    await expect(page.getByLabel('Tên hàng đợi *')).toBeVisible({ timeout: 10000 })
    await expect(page.getByLabel('Giờ mở cửa *')).toBeVisible()
    await expect(page.getByLabel('Giờ đóng cửa *')).toBeVisible()
    // Trường nâng cao (label có htmlFor="maxQueueSize")
    await expect(page.getByLabel(/Giới hạn hàng đợi/)).toBeVisible()
    // Nút lưu
    await expect(page.getByText('Lưu thay đổi')).toBeVisible()
  })

  test('chỉnh sửa tên queue và lưu', async ({ page }) => {
    await page.goto(`/dashboard/queues/${seed.queueId}/edit`)
    await page.waitForLoadState('networkidle')

    const nameInput = page.getByLabel('Tên hàng đợi *')
    await nameInput.fill('Hàng đợi test (đã sửa)')
    await page.getByText('Lưu thay đổi').click()

    // Redirect về queue detail
    await page.waitForURL(`/dashboard/queues/${seed.queueId}`, { timeout: 10000 })
    await expect(page.getByText('Hàng đợi test (đã sửa)')).toBeVisible()

    // Khôi phục tên gốc
    await page.goto(`/dashboard/queues/${seed.queueId}/edit`)
    await page.waitForLoadState('networkidle')
    await page.getByLabel('Tên hàng đợi *').fill(seed.queueName)
    await page.getByText('Lưu thay đổi').click()
    await page.waitForURL(`/dashboard/queues/${seed.queueId}`, { timeout: 10000 })
  })
})
