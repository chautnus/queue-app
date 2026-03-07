'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import LanguageSwitcher from './LanguageSwitcher'

export default function DashboardNav({ userName }: { userName: string }) {
  const pathname = usePathname()
  const t = useTranslations('dashboard')
  const tAuth = useTranslations('auth')
  const navItems = [
    { href: '/dashboard', label: t('nav.overview'), icon: '🏠' },
    { href: '/dashboard/queues', label: t('nav.queues'), icon: '📋' },
    { href: '/dashboard/profile', label: t('nav.profile'), icon: '👤' },
  ]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-gray-900 text-lg">
              🎫 <span>QueueApp</span>
            </Link>
            <div className="hidden sm:flex gap-1">
              {navItems.map(item => (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'}`}>
                  {item.icon} {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="text-sm text-gray-500 hidden sm:block">{userName}</span>
            <button onClick={() => signOut({ callbackUrl: '/login' })}
              className="text-sm text-gray-500 hover:text-gray-900 font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              {tAuth('logout')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
