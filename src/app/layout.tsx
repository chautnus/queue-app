import type { Metadata, Viewport } from 'next'
import './globals.css'
import SessionProvider from '@/components/SessionProvider'

export const metadata: Metadata = {
  title: 'QueueApp - Quản lý hàng đợi',
  description: 'Hệ thống quản lý hàng đợi thông minh',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'QueueApp',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-152.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#4f46e5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
