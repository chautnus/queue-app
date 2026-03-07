'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useTranslations } from 'next-intl'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

async function subscribePush(entryId: string): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entryId, subscription: sub.toJSON() }),
    })
    return true
  } catch {
    return false
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const array = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    array[i] = rawData.charCodeAt(i)
  }
  return array.buffer as ArrayBuffer
}

type QueueInfo = {
  id: string; name: string; adminLogo?: string
  startTime: string; endTime: string; avgProcessingTime: number
  numberOfCounters: number; isActive: boolean; redirectUrl?: string
}
type ExistingEntry = {
  id: string; ticketNumber: number; verificationCode: string
  status: string; joinedAt: string; estimatedServedAt?: string | null
}
type PageData = {
  queue: QueueInfo; isOpen: boolean; waitingCount: number
  estimatedWait: number; existingEntry: ExistingEntry | null
}
type JoinResult = {
  entry: ExistingEntry; estimatedWait: number; queueName: string; redirectUrl?: string
}

function getDeviceId(): string {
  let id = localStorage.getItem('queue_device_id')
  if (!id) { id = uuidv4(); localStorage.setItem('queue_device_id', id) }
  return id
}

function getRemainingMins(estimatedServedAt?: string | null, now?: Date): number {
  if (!estimatedServedAt) return 0
  const target = new Date(estimatedServedAt).getTime()
  const current = (now ?? new Date()).getTime()
  return Math.max(0, Math.round((target - current) / 60000))
}

function formatWaitMins(mins: number): string {
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
  const t = useTranslations('join')
  const [stage, setStage] = useState<Stage>('loading')
  const [data, setData] = useState<PageData | null>(null)
  const [result, setResult] = useState<JoinResult | null>(null)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(new Date())
  const [pushStatus, setPushStatus] = useState<'idle' | 'subscribing' | 'subscribed' | 'denied' | 'unsupported'>('idle')
  const [countdown, setCountdown] = useState<number | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(new Date()), 1000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  const fetchData = async (): Promise<PageData | null> => {
    const deviceId = getDeviceId()
    try {
      const res = await fetch(`/api/join?queueId=${queueId}&deviceId=${encodeURIComponent(deviceId)}`)
      return await res.json()
    } catch { return null }
  }

  useEffect(() => {
    fetchData().then(d => {
      if (!d) { setStage('error'); return }
      setData(d)
      if (!d.queue) { setStage('error'); return }
      if (!d.isOpen) { setStage('closed'); return }
      if (d.existingEntry) { setStage('existing'); return }
      setStage('info')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueId])

  useEffect(() => {
    if (stage !== 'existing' && stage !== 'joined') return
    pollRef.current = setInterval(async () => {
      const d = await fetchData()
      if (!d) return
      setData(d)
      if (stage === 'joined' && result && d.existingEntry) {
        setResult(r => r ? { ...r, entry: { ...r.entry, estimatedServedAt: d.existingEntry!.estimatedServedAt } } : r)
      }
    }, 10000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, queueId])

  useEffect(() => {
    if (stage !== 'joined' || !result?.redirectUrl) return
    const url = result.redirectUrl
      .replace('{ticket}', String(result.entry.ticketNumber))
      .replace('{code}', result.entry.verificationCode)
    setCountdown(3)
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c === null || c <= 1) { clearInterval(interval); window.location.href = url; return null }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [stage, result])

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
    else { setError(json.error ?? t('joinError')); setJoining(false) }
  }

  const handleSubscribePush = useCallback(async (entryId: string) => {
    if (!VAPID_PUBLIC_KEY) { setPushStatus('unsupported'); return }
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { setPushStatus('unsupported'); return }
    setPushStatus('subscribing')
    const ok = await subscribePush(entryId)
    if (ok) setPushStatus('subscribed')
    else setPushStatus('denied')
  }, [])

  if (stage === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🎫</div>
          <p className="text-gray-500 font-medium">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (stage === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
        <div className="card text-center max-w-sm">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('notFound')}</h2>
          <p className="text-gray-500 text-sm">{t('invalidLink')}</p>
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
          <p className="text-gray-500 text-sm mb-4">{t('closed')}</p>
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
            {t('openHours')}: <span className="font-semibold">{data?.queue.startTime} – {data?.queue.endTime}</span>
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'existing' && data?.existingEntry) {
    const entry = data.existingEntry
    const isCalled = entry.status === 'called'
    const remainingMins = getRemainingMins(entry.estimatedServedAt, now)

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="card max-w-sm w-full text-center">
          <QueueLogo logo={data.queue.adminLogo} name={data.queue.name} />
          <h2 className="text-xl font-bold text-gray-900 mb-1">{data.queue.name}</h2>
          <p className="text-gray-500 text-sm mb-6">{t('alreadyJoined')}</p>

          <div className={`rounded-2xl p-6 mb-4 text-white ${isCalled ? 'bg-gradient-to-br from-green-500 to-emerald-600 animate-pulse' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
            <div className="text-sm opacity-80 mb-1">{t('yourTicket')}</div>
            <div className="text-7xl font-black">{entry.ticketNumber}</div>
            {isCalled ? (
              <div className="text-sm font-bold mt-2">🔔 {t('yourTurn')}</div>
            ) : (
              <div className="text-sm opacity-80 mt-2">
                {data.waitingCount > 1 ? t('peopleAhead', { count: data.waitingCount - 1 }) : t('almostYourTurn')}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{t('confirmCode')}</span>
              <code className="font-mono font-bold text-xl text-gray-900 tracking-widest">{entry.verificationCode}</code>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{t('joinedAt')}</span>
              <span className="text-gray-700">{new Date(entry.joinedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {!isCalled && entry.estimatedServedAt && (
              <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                <span className="text-gray-500">{t('remainingWait')}</span>
                <span className={`font-bold text-base ${remainingMins <= 5 ? 'text-orange-600 animate-pulse' : 'text-blue-600'}`}>
                  {remainingMins <= 0 ? t('waitNow') : formatWaitMins(remainingMins)}
                </span>
              </div>
            )}
          </div>

          {isCalled && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 font-medium animate-pulse">
              {t('yourTurnNotice')}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-4">{t('autoRefresh')}</p>
        </div>
      </div>
    )
  }

  if (stage === 'joined' && result) {
    const remainingMins = getRemainingMins(result.entry.estimatedServedAt, now)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="card max-w-sm w-full text-center">
          <div className="text-5xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">{result.queueName}</h2>
          <p className="text-gray-500 text-sm mb-6">{t('joinSuccess')}</p>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-2xl p-6 mb-4">
            <div className="text-sm opacity-80 mb-1">{t('yourTicket')}</div>
            <div className="text-7xl font-black">{result.entry.ticketNumber}</div>
            <div className="text-sm opacity-80 mt-2">
              {t('waitTime')}: {result.entry.estimatedServedAt ? remainingMins <= 0 ? t('waitNow') : formatWaitMins(remainingMins) : result.estimatedWait <= 0 ? t('waitNow') : formatWaitMins(result.estimatedWait)}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{t('confirmCode')}</span>
              <code className="font-mono font-bold text-2xl text-gray-900 tracking-widest bg-white px-3 py-1 rounded-lg border">
                {result.entry.verificationCode}
              </code>
            </div>
            <p className="text-xs text-gray-400 text-center">{t('keepCode')}</p>
          </div>

          {pushStatus === 'idle' && VAPID_PUBLIC_KEY && (
            <button
              onClick={() => handleSubscribePush(result.entry.id)}
              className="mt-4 w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
            >
              {t('notifyButton')}
            </button>
          )}
          {pushStatus === 'subscribing' && (
            <p className="mt-4 text-sm text-gray-500 text-center">{t('subscribing')}</p>
          )}
          {pushStatus === 'subscribed' && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-3 text-green-700 text-sm text-center">
              {t('subscribed')}
            </div>
          )}
          {pushStatus === 'denied' && (
            <p className="mt-4 text-xs text-gray-400 text-center">{t('notifyDenied')}</p>
          )}

          {countdown !== null ? (
            <div className="mt-4 text-sm text-white bg-blue-500 rounded-xl p-3 animate-pulse">
              {t('redirecting', { n: countdown })}
            </div>
          ) : (
            <div className="mt-4 text-sm text-gray-500 bg-blue-50 rounded-xl p-3">
              {t('tip')}
            </div>
          )}
        </div>
      </div>
    )
  }

  // stage === 'info'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="card max-w-sm w-full">
        <div className="text-center mb-6">
          {data?.queue && <QueueLogo logo={data.queue.adminLogo} name={data.queue.name} />}
          <h1 className="text-2xl font-bold text-gray-900">{data?.queue.name}</h1>
          <span className="badge badge-green mt-2">{t('open')}</span>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('openHoursLabel')}</span>
            <span className="font-medium text-gray-800">{data?.queue.startTime} – {data?.queue.endTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('waitingCount')}</span>
            <span className="font-bold text-gray-900 text-base">{t('people', { count: data?.waitingCount ?? 0 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('counters')}</span>
            <span className="font-medium text-gray-800">{t('countersValue', { count: data?.queue.numberOfCounters ?? 0 })}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('estimatedWait')}</span>
            <span className="font-bold text-blue-600 text-base">{(data?.estimatedWait ?? 0) <= 0 ? t('waitNow') : formatWaitMins(data?.estimatedWait ?? 0)}</span>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">{error}</div>}

        <div className="space-y-3">
          <p className="text-center text-sm text-gray-500">{t('question')}</p>
          <button onClick={handleJoin} disabled={joining} className="btn-primary w-full justify-center text-base py-3">
            {joining ? t('joining') : t('joinButton')}
          </button>
          <button onClick={() => setStage('error')} className="btn-secondary w-full justify-center text-base py-3">
            {t('cancelButton')}
          </button>
        </div>
      </div>
    </div>
  )
}
