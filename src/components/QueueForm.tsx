'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

const DAYS = [
  { key: 'mon' }, { key: 'tue' }, { key: 'wed' }, { key: 'thu' },
  { key: 'fri' }, { key: 'sat' }, { key: 'sun' },
]

type WorkingHours = Record<string, { enabled: boolean; open: string; close: string }>

const defaultWH = (): WorkingHours =>
  Object.fromEntries(DAYS.map(d => [d.key, { enabled: true, open: '08:00', close: '17:00' }]))

interface QueueFormProps {
  initial?: {
    id?: string; name?: string; startTime?: string; endTime?: string;
    avgProcessingTime?: number; numberOfCounters?: number; workingHours?: string | null;
    qrType?: string; isActive?: boolean; waitThreshold?: number; waitCheckDepth?: number;
    maxQueueSize?: number; allowRequeue?: boolean; redirectUrl?: string;
  }
  mode: 'create' | 'edit'
}

export default function QueueForm({ initial, mode }: QueueFormProps) {
  const router = useRouter()
  const t = useTranslations('queueForm')
  const [form, setForm] = useState({
    name: initial?.name ?? '',
    startTime: initial?.startTime ?? '08:00',
    endTime: initial?.endTime ?? '17:00',
    avgProcessingTime: initial?.avgProcessingTime ?? 10,
    numberOfCounters: initial?.numberOfCounters ?? 1,
    qrType: initial?.qrType ?? 'fixed',
    isActive: initial?.isActive ?? true,
    waitThreshold: initial?.waitThreshold ?? 5,
    waitCheckDepth: initial?.waitCheckDepth ?? 5,
    maxQueueSize: initial?.maxQueueSize ?? 0,
    allowRequeue: initial?.allowRequeue ?? false,
    redirectUrl: initial?.redirectUrl ?? '',
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
    if (!res.ok) { setError(data.error || t('saveError')); setLoading(false); return }
    router.push(`/dashboard/queues/${data.id}`)
    router.refresh()
  }

  const updateWh = (day: string, field: string, value: string | boolean) =>
    setWh(w => ({ ...w, [day]: { ...w[day], [field]: value } }))

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">{t('basicInfo')}</h2>
        <div>
          <label htmlFor="queue-name" className="form-label">{t('queueName')}</label>
          <input id="queue-name" className="form-input" placeholder={t('queueNamePlaceholder')}
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="form-label">{t('openTime')}</label>
            <input id="startTime" type="time" className="form-input"
              value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} required />
          </div>
          <div>
            <label htmlFor="endTime" className="form-label">{t('closeTime')}</label>
            <input id="endTime" type="time" className="form-input"
              value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} required />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t('avgProcessingTime')}</label>
            <input type="number" min="1" max="120" className="form-input"
              value={form.avgProcessingTime} onChange={e => setForm(f => ({ ...f, avgProcessingTime: Number(e.target.value) }))} required />
          </div>
          <div>
            <label className="form-label">{t('numberOfCounters')}</label>
            <input type="number" min="1" max="50" className="form-input"
              value={form.numberOfCounters} onChange={e => setForm(f => ({ ...f, numberOfCounters: Number(e.target.value) }))} />
          </div>
        </div>
        <div>
          <label className="form-label">{t('qrType')}</label>
          <select className="form-input" value={form.qrType} onChange={e => setForm(f => ({ ...f, qrType: e.target.value }))}>
            <option value="fixed">{t('qrFixed')}</option>
            <option value="daily">{t('qrDaily')}</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {form.qrType === 'fixed' ? t('qrFixedHint') : t('qrDailyHint')}
          </p>
        </div>
        {mode === 'edit' && (
          <div className="flex items-center gap-3">
            <input type="checkbox" id="isActive" checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <label htmlFor="isActive" className="form-label mb-0 cursor-pointer">{t('isActive')}</label>
          </div>
        )}
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-lg">{t('workingHoursTitle')}</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={useAdvanced} onChange={e => setUseAdvanced(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">{t('enableSchedule')}</span>
          </label>
        </div>
        {useAdvanced ? (
          <div className="space-y-2">
            {DAYS.map(d => (
              <div key={d.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input type="checkbox" checked={wh[d.key]?.enabled ?? true}
                  onChange={e => updateWh(d.key, 'enabled', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <span className="w-14 text-sm font-medium text-gray-700">{t(`days.${d.key}`)}</span>
                {wh[d.key]?.enabled ? (
                  <>
                    <input type="time" className="form-input py-1 text-sm" value={wh[d.key]?.open ?? '08:00'}
                      onChange={e => updateWh(d.key, 'open', e.target.value)} />
                    <span className="text-gray-400 text-sm">–</span>
                    <input type="time" className="form-input py-1 text-sm" value={wh[d.key]?.close ?? '17:00'}
                      onChange={e => updateWh(d.key, 'close', e.target.value)} />
                  </>
                ) : (
                  <span className="text-sm text-gray-400 italic">{t('rest')}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">{t('useGeneralHours')}</p>
        )}
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">{t('waitSettingsTitle')}</h2>
        <p className="text-sm text-gray-500">{t('waitSettingsDesc')}</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">{t('waitThreshold')}</label>
            <input type="number" min="1" max="60" className="form-input"
              value={form.waitThreshold}
              onChange={e => setForm(f => ({ ...f, waitThreshold: Number(e.target.value) }))} />
            <p className="text-xs text-gray-400 mt-1">{t('waitThresholdHint')}</p>
          </div>
          <div>
            <label className="form-label">{t('waitCheckDepth')}</label>
            <input type="number" min="1" max="20" className="form-input"
              value={form.waitCheckDepth}
              onChange={e => setForm(f => ({ ...f, waitCheckDepth: Number(e.target.value) }))} />
            <p className="text-xs text-gray-400 mt-1">{t('waitCheckDepthHint')}</p>
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900 text-lg">{t('advancedTitle')}</h2>
        <div>
          <label htmlFor="maxQueueSize" className="form-label">{t('maxQueueSize')}</label>
          <input id="maxQueueSize" type="number" min="0" max="500" className="form-input"
            value={form.maxQueueSize}
            onChange={e => setForm(f => ({ ...f, maxQueueSize: Number(e.target.value) }))} />
          <p className="text-xs text-gray-400 mt-1">{t('maxQueueSizeHint')}</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="allowRequeue" checked={form.allowRequeue}
            onChange={e => setForm(f => ({ ...f, allowRequeue: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-blue-600" />
          <div>
            <label htmlFor="allowRequeue" className="form-label mb-0 cursor-pointer">{t('allowRequeue')}</label>
            <p className="text-xs text-gray-400 mt-0.5">{t('allowRequeueHint')}</p>
          </div>
        </div>
        <div>
          <label htmlFor="redirectUrl" className="form-label">{t('redirectUrl')}</label>
          <input id="redirectUrl" type="url" className="form-input" placeholder={t('redirectUrlPlaceholder')}
            value={form.redirectUrl} onChange={e => setForm(f => ({ ...f, redirectUrl: e.target.value }))} />
          <p className="text-xs text-gray-400 mt-1">
            {t('redirectUrlHint')} <code className="bg-gray-100 px-1 rounded">{'{ticket}'}</code> <code className="bg-gray-100 px-1 rounded">{'{code}'}</code>
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? t('saving') : mode === 'create' ? t('createButton') : t('saveButton')}
        </button>
        <button type="button" className="btn-secondary" onClick={() => router.back()}>{t('cancel')}</button>
      </div>
    </form>
  )
}
