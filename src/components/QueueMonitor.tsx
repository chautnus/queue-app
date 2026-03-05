'use client'
import { useState, useEffect, useCallback } from 'react'

type Entry = {
  id: string
  ticketNumber: number
  deviceId: string
  verificationCode: string
  status: string
  joinedAt: string
}

const STATUS_LABELS: Record<string, string> = {
  waiting: 'Đang chờ',
  called: 'Đang phục vụ',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
}
const STATUS_BADGE: Record<string, string> = {
  waiting: 'badge-yellow',
  called: 'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

export default function QueueMonitor({ queueId }: { queueId: string }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [filter, setFilter] = useState('waiting')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/queues/${queueId}/entries`)
    if (res.ok) setEntries(await res.json())
    setLoading(false)
  }, [queueId])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  const updateStatus = async (entryId: string, status: string) => {
    setUpdating(entryId)
    await fetch(`/api/queues/${queueId}/entries`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId, status }),
    })
    await load()
    setUpdating(null)
  }

  const displayed = entries.filter(e => filter === 'all' || e.status === filter)
  const counts = {
    waiting: entries.filter(e => e.status === 'waiting').length,
    called: entries.filter(e => e.status === 'called').length,
    completed: entries.filter(e => e.status === 'completed').length,
    cancelled: entries.filter(e => e.status === 'cancelled').length,
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Danh sách hôm nay</h3>
        <button onClick={load} className="text-sm text-blue-600 hover:underline font-medium">↻ Làm mới</button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { key: 'waiting', label: 'Đang chờ', color: 'bg-yellow-50 text-yellow-700' },
          { key: 'called', label: 'Đang phục vụ', color: 'bg-blue-50 text-blue-700' },
          { key: 'completed', label: 'Hoàn thành', color: 'bg-green-50 text-green-700' },
          { key: 'cancelled', label: 'Đã hủy', color: 'bg-red-50 text-red-700' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={`rounded-lg p-2 text-center transition-all border-2 ${filter === s.key ? 'border-blue-400 ' + s.color : 'border-transparent ' + s.color} hover:opacity-90`}>
            <div className="text-xl font-bold">{counts[s.key as keyof typeof counts]}</div>
            <div className="text-xs">{s.label}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Đang tải...</div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">📭</div>
          <p>Không có dữ liệu</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">STT</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Mã xác nhận</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Trạng thái</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Thời gian</th>
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map(e => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <span className="font-bold text-lg text-gray-900">#{e.ticketNumber}</span>
                  </td>
                  <td className="py-3 px-3">
                    <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono tracking-wider">
                      {e.verificationCode}
                    </code>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`badge ${STATUS_BADGE[e.status] ?? 'badge-gray'}`}>
                      {STATUS_LABELS[e.status] ?? e.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-400">
                    {new Date(e.joinedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      {e.status === 'waiting' && (
                        <button disabled={updating === e.id}
                          onClick={() => updateStatus(e.id, 'called')}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 font-medium disabled:opacity-50">
                          Gọi
                        </button>
                      )}
                      {e.status === 'called' && (
                        <button disabled={updating === e.id}
                          onClick={() => updateStatus(e.id, 'completed')}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 font-medium disabled:opacity-50">
                          Hoàn thành
                        </button>
                      )}
                      {(e.status === 'waiting' || e.status === 'called') && (
                        <button disabled={updating === e.id}
                          onClick={() => updateStatus(e.id, 'cancelled')}
                          className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 font-medium disabled:opacity-50">
                          Hủy
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
