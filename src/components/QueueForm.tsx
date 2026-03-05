'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DAYS = [
  { key: 'mon', label: 'Thứ 2' }, { key: 'tue', label: 'Thứ 3' },
  { key: 'wed', label: 'Thứ 4' }, { key: 'thu', label: 'Thứ 5' },
  { key: 'fri', label: 'Thứ 6' }, { key: 'sat', label: 'Thứ 7' },
  { key: 'sun', label: 'CN' },
]

type WorkingHours = Record<string, { enabled: boolean; open: string; close: string }>

const defaultWH = (): WorkingHours =>
  Object.fromEntries(DAYS.map(d => [d.key, { enabled: true, open: '08:00', close: '17:00' }]))

interface QueueFormProps {
  initial?: {
    id?: string; name?: string; startTime?: string; endTime?: string;
    avgProcessingTime?: number; numberOfCounters?: number; workingHours?: string | null;
    qrType?: string; isActive?: boolean;
  }
  mode: 'create' | 'edit'
}

export default function QueueForm({ initial, mode }: QueueFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    startTime: initial?.startTime ?? '08:00',
    endTime: initial?.endTime ?? '17:00',
    avgProcessingTime: initial?.avgProcessingTime ?? 10,
    numberOfCounters: initial?.numberOfCounters ?? 1,
    qrType: initial?.qrType ?? 'fixed',
    isActive: initial?.isActive ?? true,
  })
  const [wh, setWh] = useState<WorkingHours>(
    initial?.workingHours ? JSON.parse(initial.workingHours) : defaultWH()
  )
  const [useAdvanced, setUseAdvanced] = useState(!!initial?.workingHours)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const payload = { ...form, workingHours: useAdvanced ? wh : null }

    const url = mode === 'create' ? '/api/queues' : `/api/queues/${initial?.id}`
    const method = mode === 'create' ? 'POST' : 'PUT'

    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || 'Lỗi lưu dữ liệu'); setLoading(false); return }
    router.push(`/dashboard/queues/${data.id}`)
    router.refresh()
  }

  const updateWh = (day: string, field: string, value: string | boolean) =>
    setWh(w => ({ ...w, [day]: { ...w[day], [field]: value } }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">Thông tin cơ bản</h2>
        <div>
          <label className="form-label">Tên hàng đợi *</label>
          <input className="form-input" placeholder="VD: Hàng đợi khám bệnh"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Giờ mở cửa *</label>
            <input type="time" className="form-input"
              value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Giờ đóng cửa *</label>
            <input type="time" className="form-input"
              value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Thời gian xử lý TB (phút) *</label>
            <input type="number" min="1" max="120" className="form-input"
              value={form.avgProcessingTime} onChange={e => setForm(f => ({ ...f, avgProcessingTime: Number(e.target.value) }))} required />
          </div>
          <div>
            <label className="form-label">Số cửa phục vụ</label>
            <input type="number" min="1" max="50" className="form-input"
              value={form.numberOfCounters} onChange={e => setForm(f => ({ ...f, numberOfCounters: Number(e.target.value) }))} />
          </div>
        </div>
        <div>
          <label className="form-label">Loại QR Code</label>
          <select className="form-input" value={form.qrType} onChange={e => setForm(f => ({ ...f, qrType: e.target.value }))}>
            <option value="fixed">Cố định (không thay đổi)</option>
            <option value="daily">Hàng ngày (thay đổi mỗi ngày)</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {form.qrType === 'fixed' ? 'QR code không đổi, người dùng có thể lưu lại.' : 'QR code thay đổi mỗi ngày để tăng bảo mật.'}
          </p>
        </div>
        {mode === 'edit' && (
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <label htmlFor="isActive" className="form-label mb-0 cursor-pointer">Đang hoạt động</label>
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-lg">Lịch làm việc chi tiết</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useAdvanced} onChange={e => setUseAdvanced(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Bật lịch chi tiết</span>
          </label>
        </div>
        {useAdvanced ? (
          <div className="space-y-2">
            {DAYS.map(d => (
              <div key={d.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" checked={wh[d.key]?.enabled ?? true}
                  onChange={e => updateWh(d.key, 'enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="w-14 text-sm font-medium text-gray-700">{d.label}</span>
                {wh[d.key]?.enabled ? (
                  <>
                    <input type="time" className="form-input py-1 text-sm" value={wh[d.key]?.open ?? '08:00'}
                      onChange={e => updateWh(d.key, 'open', e.target.value)} />
                    <span className="text-gray-400 text-sm">–</span>
                    <input type="time" className="form-input py-1 text-sm" value={wh[d.key]?.close ?? '17:00'}
                      onChange={e => updateWh(d.key, 'close', e.target.value)} />
                  </>
                ) : (
                  <span className="text-sm text-gray-400 italic">Nghỉ</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Sử dụng giờ mở/đóng cửa chung cho tất cả các ngày.</p>
        )}
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Đang lưu...' : mode === 'create' ? 'Tạo hàng đợi' : 'Lưu thay đổi'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>Hủy</button>
      </div>
    </form>
  )
}
