import { defineConfig, devices } from '@playwright/test'

const TEST_ENV = {
  DATABASE_URL: 'file:./test.db',
  NEXTAUTH_URL: 'http://localhost:3001',
  NEXTAUTH_SECRET: 'test-secret-for-playwright-only-32chars',
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: '',
  VAPID_PRIVATE_KEY: '',
  VAPID_EMAIL: 'mailto:test@test.com',
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // SQLite: chỉ 1 writer tại 1 thời điểm
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'html' : 'list',

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    // ── Auth setup (chạy trước) ──────────────────────
    {
      name: 'setup-admin',
      testMatch: /admin-auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'setup-staff',
      testMatch: /staff-auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Test specs ────────────────────────────────────
    {
      name: 'customer',
      testMatch: /customer\.spec\.ts/,
      use: { ...devices['Pixel 5'] }, // mobile vì khách dùng điện thoại
    },
    {
      name: 'staff',
      testMatch: /staff\.spec\.ts/,
      use: {
        ...devices['Pixel 5'],
        storageState: '.auth/staff.json',
      },
      dependencies: ['setup-staff'],
    },
    {
      name: 'admin',
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['setup-admin'],
    },
    {
      name: 'kiosk',
      testMatch: /kiosk\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'integration',
      testMatch: /integration\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/staff.json',
      },
      dependencies: ['setup-staff'],
    },
  ],

  globalSetup: './tests/global-setup.ts',
  globalTeardown: './tests/global-teardown.ts',

  webServer: {
    command: 'npx next dev --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    env: TEST_ENV,
    timeout: 120000,
  },
})
