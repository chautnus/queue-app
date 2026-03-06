import { test as setup, expect } from '@playwright/test'
import { getSeedData } from '../fixtures'
import path from 'path'

const authFile = path.resolve('.auth/staff.json')

setup('staff: login and save auth state', async ({ page }) => {
  const seed = getSeedData()

  await page.goto('/staff/login')
  await page.waitForLoadState('networkidle')

  await page.fill('input[type="email"]', seed.staffEmail)
  await page.fill('input[type="password"]', seed.staffPassword)
  await page.click('button[type="submit"]')

  // Staff login dùng window.location.href nên chờ navigation cứng
  await page.waitForURL(/\/staff$/, { timeout: 15000 })
  await expect(page).toHaveURL(/\/staff$/)

  await page.context().storageState({ path: authFile })
})
