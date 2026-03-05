'use client'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

type QueueInfo = {
  id: string; name: string; adminLogo?: string
  startTime: string; endTime: string; avgProcessingTime: number
  numberOfCounters: number; isActive: boolean
}
type ExistingEntry = {
  id: string; ticketNumber: number; verificationCode: string; status: string; joinedAt: string
}
type PageData = {
  queue: QueueInfo; isOpen: boolean; waitingCount: number
  estimatedWait: number; existingEntry: ExistingEntry | null
}
type JoinResult = {
  entry: ExistingEntry; estimatedWait: number; queueName: string
}

function getDeviceId(): string {
  let id = localStorage.getItem('queue_device_id')
  if (!id) { id = uuidv4(); localStorage.setItem('queue_device_id', id) }
  return id
}

function formatWait(mins: number): string {
  if (mins < 1) return 'Ngay bây giờ'
  if (mins < 60) return `~${mins} phút`
  return `~${Math.floor(mins / 60)} giờ ${mins % 60} phút`
}

function QueueLogo({ logo, name }: { logo?: string; name: string }) {
  if (logo) return <img src={logo} alt={name} className="w-20 h-20 rounded-2xl mx-auto mb-3 object-cover shadow" />
  return (
    <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-black text-3xl shadow">
      {name[0]}
    </div>
  )
}

type Stage = 'loading' | 'info' | 'confirming' | 'joined' | 'existing' | 'closed' | 'error'

export default function QueueJoinClient({ queueId }: { queueId: string }) {
  const [stage, setStage] = useState<Stage>('loading')
  const [data, setData] = useState<PageData | null>(null)
  const [result, setResult] = useState<JoinResult | null>(null)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const deviceId = getDeviceId()
    fetch(`/api/join?queueId=${queueId}&deviceId=${encodeURIComponent(deviceId)}`)
      .then(r => r.json())
      .then((d: PageData) => {
        setData(d)
        if (!d.queue) { setStage('error'); return }
        if (!d.isOpen) { setStage('closed'); return }
        if (d.existingEntry) { setStage('existing'); return }
        setStage('info')
      })
      .catch(() => setStage('error'))
  }, [queueId])

  const handleJoin = async () => {
    setJoining(true)
    const deviceId = getDeviceId()
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId, deviceId }),
    })
    const json = await res.json()
    if (res.ok) { setResult(json); setStage('joined') }
    else { setError(json.error ?? 'Lỗi tham gia'); setJoining(false) }
  }

  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎫</div>
          <p className="text-gray-500 font-medium">Đang tải thông tin hàng đợi...</p>
        </div>
      </div>
    )
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <div className="card text-center max-w-sm">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy hàng đợi</h2>
          <p className="text-gray-500 text-sm">Liên kết QR này không hợp lệ hoặc đã hết hạn.</p>
        </div>
      </div>
    )
  }

  if (stage === 'closed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
        <div className="card text-center max-w-sm">
          {data?.queue && <QueueLogo logo={data.queue.adminLogo} name={data.queue.name} />}
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{data?.queue.name}</h2>
          <p className="text-gray-500 text-sm mb-4">Hàng đợi hiện đang đóng cửa.</p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            Giờ mở cửa: <span className="font-semibold">{data?.queue.startTime} – {data?.queue.endTime}</span>
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'existing' && data?.existingEntry) {
    const entry = data.existingEntry
    const isActive = entry.status === 'waiting' || entry.status === 'called'
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="card max-w-sm w-full text-center">
          <QueueLogo logo={data.queue.adminLogo} name={data.queue.name} />
          <h2 className="text-xl font-bold text-gray-900 mb-1">{data.queue.name}</h2>
          <p className="text-gray-500 text-sm mb-6">Bạn đã có số thứ tự hôm nay</p>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl p-6 mb-4">
            <div className="text-sm opacity-80 mb-1">Số thứ tự của bạn</div>
            <div className="text-7xl font-black">{entry.ticketNumber}</div>
            <div className="text-sm opacity-80 mt-2">
              {entry.status === 'waiting' ? `Còn ${data.waitingCount - 1 < 0 ? 0 : data.waitingCount - 1} người trước` :
               entry.status === 'called' ? '🔔 Đến lượt bạn!' : '✓ Đã hoàn thành'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Mã xác nhận</span>
              <code className="font-mono font-bold text-xl text-gray-900 tracking-widest">{entry.verificationCode}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tham gia lúc</span>
              <span className="text-gray-700">{new Date(entry.joinedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {isActive && (
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian chờ dự kiến</span>
                <span className="font-semibold text-blue-600">{formatWait(data.estimatedWait)}</span>
              </div>
            )}
          </div>
          {entry.status === 'called' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 font-medium animate-pulse">
              🔔 Đến lượt bạn! Vui lòng đến quầy phục vụ.
            </div>
          )}
        </div>
      </div>
    )
  }

  if (stage === 'joined' && result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="card max-w-sm w-full text-center">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{result.queueName}</h2>
          <p className="text-gray-500 text-sm mb-6">Bạn đã tham gia hàng đợi thành công!</p>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6 mb-4">
            <div className="text-sm opacity-80 mb-1">Số thứ tự của bạn</div>
            <div className="text-7xl font-black">{result.entry.ticketNumber}</div>
            <div className="text-sm opacity-80 mt-2">Thời gian chờ dự kiến: {formatWait(result.estimatedWait)}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Mã xác nhận</span>
              <code className="font-mono font-bold text-2xl text-gray-900 tracking-widest bg-white px-3 py-1 rounded-lg border">{result.entry.verificationCode}</code>
            </div>
            <p className="text-xs text-gray-400 text-center">Giữ mã này để nhân viên xác nhận</p>
          </div>
          <div className="mt-4 text-sm text-gray-500 bg-blue-50 rounded-xl p-3">
            💡 Quét lại QR code để xem số thứ tự của bạn bất cứ lúc nào.
          </div>
        </div>
      </div>
    )
  }

  // stage === 'info' — show queue info and confirm
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="card max-w-sm w-full">
        <div className="text-center mb-6">
          {data?.queue && <QueueLogo logo={data.queue.adminLogo} name={data.queue.name} />}
          <h1 className="text-2xl font-bold text-gray-900">{data?.queue.name}</h1>
          <span className="badge badge-green mt-2">Đang mở cửa</span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Giờ hoạt động</span>
            <span className="font-medium text-gray-800">{data?.queue.startTime} – {data?.queue.endTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Số người đang chờ</span>
            <span className="font-bold text-gray-900 text-base">{data?.waitingCount} người</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Số cửa phục vụ</span>
            <span className="font-medium text-gray-800">{data?.queue.numberOfCounters} cửa</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Thời gian chờ dự kiến</span>
            <span className="font-bold text-blue-600 text-base">{formatWait(data?.estimatedWait ?? 0)}</span>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

        {stage === 'info' && (
          <div className="space-y-3">
            <p className="text-center text-sm text-gray-500">Bạn có muốn tham gia hàng đợi không?</p>
            <button onClick={handleJoin} disabled={joining} className="btn-primary w-full justify-center text-base py-3">
              {joining ? 'Đang đăng ký...' : '✓ Tham gia hàng đợi'}
            </button>
            <button onClick={() => setStage('error')} className="btn-secondary w-full justify-center text-base py-3">
              ✕ Không tham gia
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
