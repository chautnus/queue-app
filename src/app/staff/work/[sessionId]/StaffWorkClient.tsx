'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface CurrentEntry {
  ticketNumber: number
  verificationCode: string
  counterNumber: number
}

interface SessionData {
  id: string
  status: string // idle | serving | paused | ended
  counterNumber: number
  queue: { id: string; name: string }
  currentEntry: CurrentEntry | null
}

export default function StaffWorkClient({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [fetchError, setFetchError] = useState('')
  const [ticketInput, setTicketInput] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/staff/session/${sessionId}`)
      const data = await res.json()
      if (!res.ok) { setFetchError(data.error || 'Lỗi tải dữ liệu'); return }
      setSession(data)
    } catch {
      setFetchError('Mất kết nối mạng')
    }
  }, [sessionId])

  useEffect(() => {
    fetchSession()
    pollRef.current = setInterval(fetchSession, 15000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchSession])

  const doAction = async (url: string, body?: object) => {
    setActionLoading(true); setActionError(''); setActionMsg('')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      })
      const data = await res.json()
      if (!res.ok) { setActionError(data.error || 'Thao tác thất bại'); setActionLoading(false); return null }
      await fetchSession()
      setActionLoading(false)
      return data
    } catch {
      setActionError('Lỗi kết nối'); setActionLoading(false); return null
    }
  }

  const doPatch = async (body: object) => {
    setActionLoading(true); setActionError(''); setActionMsg('')
    try {
      const res = await fetch(`/api/staff/session/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setActionError(data.error || 'Thao tác thất bại'); setActionLoading(false); return }
      await fetchSession()
      setActionLoading(false)
    } catch {
      setActionError('Lỗi kết nối'); setActionLoading(false)
    }
  }

  const handleCallNext = async () => {
    if (!ticketInput.trim()) { setActionError('Nhập số thứ tự'); return }
    const data = await doAction(`/api/staff/session/${sessionId}/next`, { ticketNumber: Number(ticketInput) })
    if (data) { setTicketInput(''); setActionMsg(`Đã gọi #${data.ticketNumber}`) }
  }

  const handleComplete = async () => {
    await doAction(`/api/staff/session/${sessionId}/complete`)
    setActionMsg('Hoàn thành, sẵn sàng nhận khách tiếp')
  }

  const handlePause = () => doPatch({ status: 'paused' })
  const handleResume = () => doPatch({ status: 'idle' })
  const handleEnd = async () => {
    if (!confirm('Kết thúc ca làm hôm nay?')) return
    await doPatch({ status: 'ended' })
  }

  // ── Loading / Error ──────────────────────────────────────────────
  if (!session && !fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="text-gray-400 text-lg">Đang tải...</div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="card w-full max-w-sm text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-600 font-medium mb-4">{fetchError}</p>
          <button onClick={fetchSession} className="btn-primary">Thử lại</button>
        </div>
      </div>
    )
  }

  const s = session!
  const statusColor = {
    idle: 'bg-green-100 text-green-700',
    serving: 'bg-blue-100 text-blue-700',
    paused: 'bg-yellow-100 text-yellow-700',
    ended: 'bg-gray-100 text-gray-600',
  }[s.status] ?? 'bg-gray-100 text-gray-600'

  const statusLabel = { idle: 'Sẵn sàng', serving: 'Đang phục vụ', paused: 'Tạm dừng', ended: 'Đã kết thúc' }[s.status] ?? s.status

  // ── ENDED ────────────────────────────────────────────────────────
  if (s.status === 'ended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4">
        <div className="card w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Ca làm đã kết thúc</h1>
          <p className="text-gray-500 text-sm mb-6">
            Cửa {s.counterNumber} · {s.queue.name}
          </p>
          <button onClick={() => router.push('/staff/login')} className="btn-primary w-full justify-center">
            Về trang đăng nhập
          </button>
        </div>
      </div>
    )
  }

  // ── MAIN LAYOUT ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <span className="font-bold text-gray-900">Cửa {s.counterNumber}</span>
          <span className="text-gray-400 mx-2">·</span>
          <span className="text-gray-700 text-sm">{s.queue.name}</span>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor}`}>{statusLabel}</span>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Messages */}
        {actionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{actionError}</div>
        )}
        {actionMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{actionMsg}</div>
        )}

        {/* ── PAUSED ── */}
        {s.status === 'paused' && (
          <div className="card text-center space-y-4">
            <div className="text-4xl">⏸️</div>
            <p className="text-gray-600">Bạn đang tạm dừng phục vụ</p>
            <button onClick={handleResume} disabled={actionLoading} className="btn-primary w-full justify-center">
              Tiếp tục phục vụ
            </button>
            <button onClick={handleEnd} disabled={actionLoading} className="btn-secondary w-full justify-center text-red-600 border-red-200 hover:bg-red-50">
              Kết thúc ca
            </button>
          </div>
        )}

        {/* ── SERVING ── */}
        {s.status === 'serving' && s.currentEntry && (
          <>
            {/* Current customer card */}
            <div className="card bg-blue-50 border-2 border-blue-200">
              <p className="text-sm text-blue-600 font-medium mb-1">Đang phục vụ</p>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-gray-500 text-sm">Số thứ tự</span>
                <span className="text-4xl font-bold text-blue-700">#{s.currentEntry.ticketNumber}</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">Mã xác nhận</p>
              <div className="flex gap-3 justify-center">
                {s.currentEntry.verificationCode.split('').map((digit, i) => (
                  <div key={i} className="w-14 h-14 bg-white border-2 border-blue-300 rounded-xl flex items-center justify-center text-3xl font-bold text-blue-800 font-mono">
                    {digit}
                  </div>
                ))}
              </div>
            </div>

            {/* Call next */}
            <div className="card space-y-3">
              <p className="text-sm font-medium text-gray-700">Gọi khách tiếp theo</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  className="form-input flex-1"
                  placeholder="Số thứ tự"
                  value={ticketInput}
                  onChange={e => setTicketInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCallNext()}
                />
                <button
                  onClick={handleCallNext}
                  disabled={actionLoading || !ticketInput.trim()}
                  className="btn-primary whitespace-nowrap"
                >
                  {actionLoading ? '...' : 'Gọi →'}
                </button>
              </div>
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="btn-secondary w-full justify-center"
              >
                Hoàn thành (không gọi tiếp)
              </button>
            </div>
          </>
        )}

        {/* ── IDLE ── */}
        {s.status === 'idle' && (
          <div className="card space-y-4">
            <div className="text-center py-2">
              <div className="text-3xl mb-2">👋</div>
              <p className="text-gray-600">Sẵn sàng nhận khách</p>
            </div>
            <div>
              <label className="form-label">Nhập số thứ tự khách hàng</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  className="form-input flex-1 text-xl"
                  placeholder="VD: 42"
                  value={ticketInput}
                  onChange={e => setTicketInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCallNext()}
                />
                <button
                  onClick={handleCallNext}
                  disabled={actionLoading || !ticketInput.trim()}
                  className="btn-primary whitespace-nowrap"
                >
                  {actionLoading ? '...' : 'Gọi →'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons (idle + serving) */}
        {(s.status === 'idle' || s.status === 'serving') && (
          <div className="flex gap-3">
            <button
              onClick={handlePause}
              disabled={actionLoading}
              className="btn-secondary flex-1 justify-center"
            >
              Tạm dừng
            </button>
            <button
              onClick={handleEnd}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Kết thúc ca
            </button>
          </div>
        )}

        {/* Last updated */}
        <p className="text-center text-xs text-gray-400">Tự động cập nhật mỗi 15 giây</p>
      </div>
    </div>
  )
}
