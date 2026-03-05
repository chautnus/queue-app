'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function StaffHomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/staff/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="text-gray-400">Đang tải...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <div className="card w-full max-w-sm text-center space-y-4">
        <div className="text-4xl">👷</div>
        <h1 className="text-xl font-bold text-gray-900">Xin chào, {session?.user?.name}</h1>
        <p className="text-gray-500 text-sm">
          Quét mã QR nhân viên tại quầy để bắt đầu ca làm việc.
        </p>
        <div className="pt-2 border-t border-gray-100">
          <Link href="/staff/login" className="text-sm text-orange-600 hover:underline">
            Đăng xuất / Đổi tài khoản
          </Link>
        </div>
      </div>
    </div>
  )
}
