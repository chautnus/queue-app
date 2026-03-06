'use client'
import { useEffect, useState, useRef, useCallback } from 'react'

interface Counter {
  counterNumber: number
  staffName: string
  sessionStatus: string
  currentTicket: number | null
}

interface DisplayData {
  queue: { id: string; name: string; adminLogo?: string | null; adminName: string }
  counters: Counter[]
  waitingCount: number
  completedCount: number
  today: string
  serverTime: string
}

function beep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.6)
  } catch { /* ignore */ }
}

export default function DisplayClient({ queueId }: { queueId: string }) {
  const [data, setData] = useState<DisplayData | null>(null)
  const [error, setError] = useState('')
  const [clock, setClock] = useState(new Date())
  const prevTicketsRef = useRef<Record<number, number | null>>({})

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/${queueId}`)
      const json: DisplayData = await res.json()
      if (!res.ok) { setError('Không tìm thấy hàng đợi'); return }

      // Phát âm thanh khi có số mới được gọi
      const prev = prevTicketsRef.current
      json.counters.forEach(c => {
        const prevTicket = prev[c.counterNumber]
        if (c.currentTicket !== null && c.currentTicket !== prevTicket) {
          beep()
        }
      })
      // Lưu lại trạng thái hiện tại
      const next: Record<number, number | null> = {}
      json.counters.forEach(c => { next[c.counterNumber] = c.currentTicket })
      prevTicketsRef.current = next

      setData(json)
    } catch {
      setError('Mất kết nối')
    }
  }, [queueId])

  useEffect(() => {
    fetchData()
    const poll = setInterval(fetchData, 5000)
    return () => clearInterval(poll)
  }, [fetchData])

  // Đồng hồ
  useEffect(() => {
    const tick = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-2xl">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-2xl animate-pulse">Đang tải...</div>
      </div>
    )
  }

  const activeCounters = data.counters.filter(c => c.sessionStatus !== 'paused')
  const pausedCounters = data.counters.filter(c => c.sessionStatus === 'paused')

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col select-none">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {data.queue.adminLogo && (
            <img src={data.queue.adminLogo} alt="logo" className="w-12 h-12 rounded-xl object-cover" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{data.queue.name}</h1>
            <p className="text-gray-400 text-sm">{data.queue.adminName}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono font-bold text-blue-400">
            {clock.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div className="text-gray-400 text-sm">
            {clock.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Counter grid */}
      <div className="flex-1 p-8">
        {data.counters.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-6 opacity-30">🏢</div>
              <p className="text-3xl text-gray-500">Chưa có nhân viên nào bắt đầu ca làm việc</p>
            </div>
          </div>
        ) : (
          <div className={`grid gap-6 h-full ${activeCounters.length <= 2 ? 'grid-cols-2' : activeCounters.length <= 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {activeCounters.map(c => (
              <div
                key={c.counterNumber}
                className={`rounded-3xl flex flex-col items-center justify-center p-8 border-4 transition-all duration-500 ${
                  c.currentTicket !== null
                    ? 'bg-blue-900 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.4)]'
                    : 'bg-gray-800 border-gray-600'
                }`}
              >
                <div className="text-gray-400 text-xl font-medium mb-2">CỬA {c.counterNumber}</div>
                <div className={`text-9xl font-black mb-4 ${c.currentTicket !== null ? 'text-blue-300' : 'text-gray-600'}`}>
                  {c.currentTicket !== null ? c.currentTicket : '—'}
                </div>
                <div className="text-gray-400 text-lg">{c.staffName}</div>
                {c.sessionStatus === 'idle' && c.currentTicket === null && (
                  <div className="mt-3 text-green-400 text-sm font-medium">● Sẵn sàng</div>
                )}
              </div>
            ))}
          </div>
        )}

        {pausedCounters.length > 0 && (
          <div className="mt-4 flex gap-3 flex-wrap">
            {pausedCounters.map(c => (
              <div key={c.counterNumber} className="bg-yellow-900/40 border border-yellow-600 rounded-xl px-4 py-2 text-yellow-400 text-sm">
                ⏸ Cửa {c.counterNumber} đang tạm nghỉ
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="bg-gray-800 border-t border-gray-700 px-8 py-4 flex items-center justify-between">
        <div className="flex gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">{data.waitingCount}</div>
            <div className="text-gray-400 text-sm">Đang chờ</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">{data.completedCount}</div>
            <div className="text-gray-400 text-sm">Đã phục vụ hôm nay</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {data.counters.filter(c => c.currentTicket !== null).length}
            </div>
            <div className="text-gray-400 text-sm">Đang phục vụ</div>
          </div>
        </div>
        <div className="text-gray-600 text-xs">Tự cập nhật mỗi 5 giây</div>
      </div>
    </div>
  )
}
