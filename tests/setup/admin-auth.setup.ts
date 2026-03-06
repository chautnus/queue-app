import { test as setup, expect } from '@playwright/test'
import { getSeedData } from '../fixtures'
import path from 'path'

const authFile = path.resolve('.auth/admin.json')

setup('admin: login and save auth state', async ({ page }) => {
  const seed = getSeedData()

  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  await page.fill('input[type="email"]', seed.adminEmail)
  await page.fill('input[type="password"]', seed.adminPassword)
  await page.click('button[type="submit"]')

  // Chờ redirect về dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
  await expect(page).toHaveURL(/\/dashboard/)

  // Lưu cookies + localStorage
  await page.context().storageState({ path: authFile })
})
