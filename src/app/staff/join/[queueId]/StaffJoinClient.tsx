'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface QueueInfo {
  id: string
  name: string
  numberOfCounters: number
  isActive: boolean
  adminLogo: string | null
}

export default function StaffJoinClient({ queueId }: { queueId: string }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [queue, setQueue] = useState<QueueInfo | null>(null)
  const [queueError, setQueueError] = useState('')
  const [counter, setCounter] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/staff/join/${queueId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setQueueError(d.error)
        else setQueue(d)
      })
      .catch(() => setQueueError('Không thể tải thông tin hàng đợi'))
  }, [queueId])

  const handleJoin = async () => {
    setLoading(true); setError('')
    const res = await fetch('/api/staff/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId, counterNumber: counter }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Không thể bắt đầu ca'); setLoading(false); return }
    router.push(`/staff/work/${data.id}`)
  }

  // Loading queue info
  if (!queue && !queueError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="text-gray-400 text-lg">Đang tải...</div>
      </div>
    )
  }

  if (queueError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="card w-full max-w-sm text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-600 font-medium">{queueError}</p>
          <Link href="/staff" className="btn-secondary mt-4 inline-block">Về trang chủ</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
      <div className="card w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          {queue!.adminLogo ? (
            <img src={queue!.adminLogo} alt="" className="w-16 h-16 rounded-xl object-cover mx-auto mb-3" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
              {queue!.name[0]}
            </div>
          )}
          <h1 className="text-xl font-bold text-gray-900">{queue!.name}</h1>
          <p className="text-sm text-gray-500 mt-1">Tham gia ca làm việc</p>
        </div>

        {/* Not logged in */}
        {status === 'unauthenticated' && (
          <div className="text-center space-y-4">
            <p className="text-gray-600 text-sm">Bạn cần đăng nhập để bắt đầu ca làm</p>
            <Link
              href={`/staff/login?redirect=/staff/join/${queueId}`}
              className="btn-primary w-full justify-center block"
            >
              Đăng nhập
            </Link>
            <Link
              href={`/staff/register`}
              className="btn-secondary w-full justify-center block text-sm"
            >
              Chưa có tài khoản? Đăng ký
            </Link>
          </div>
        )}

        {/* Auth loading */}
        {status === 'loading' && (
          <div className="text-center text-gray-400 py-4">Đang kiểm tra đăng nhập...</div>
        )}

        {/* Logged in */}
        {status === 'authenticated' && (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-lg px-4 py-3 text-sm text-gray-700">
              Xin chào, <span className="font-semibold">{session.user?.name}</span>
            </div>

            {!queue!.isActive && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                Hàng đợi này hiện không hoạt động
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            {queue!.numberOfCounters > 1 && (
              <div>
                <label className="form-label">Chọn cửa phục vụ</label>
                <select
                  className="form-input"
                  value={counter}
                  onChange={e => setCounter(Number(e.target.value))}
                >
                  {Array.from({ length: queue!.numberOfCounters }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>Cửa {n}</option>
                  ))}
                </select>
              </div>
            )}

            {queue!.numberOfCounters === 1 && (
              <p className="text-sm text-gray-500 text-center">Bạn sẽ phục vụ tại <strong>Cửa 1</strong></p>
            )}

            <button
              onClick={handleJoin}
              disabled={loading || !queue!.isActive}
              className="btn-primary w-full justify-center"
            >
              {loading ? 'Đang bắt đầu...' : 'Bắt đầu ca làm →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
