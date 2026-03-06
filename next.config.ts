import type { NextConfig } from 'next'
import withPWAInit from '@ducanh2912/next-pwa'

const withPWA = withPWAInit({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  customWorkerSrc: 'worker',
  workboxOptions: {
    disableDevLogs: true,
  },
})

const nextConfig: NextConfig = {
  // output: 'standalone' bị bỏ vì Railway dùng Railpack (không cần standalone)
  // standalone thiếu Prisma native binary cho Linux → Prisma crash ở runtime
  turbopack: {}, // Tắt lỗi conflict giữa next-pwa (webpack) và Turbopack
}

export default withPWA(nextConfig)
