'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface QueueInfo {
  id: string
  name: string
  numberOfCounters: number
  isActive: boolean
  adminLogo: string | null
}

export default function StaffJoinClient({ queueId }: { queueId: string }) {
  const t = useTranslations('staff')
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
      .catch(() => setQueueError(t('loadError')))
  }, [queueId, t])

  const handleJoin = async () => {
    setLoading(true); setError('')
    const res = await fetch('/api/staff/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueId, counterNumber: counter }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error || t('cannotStart')); setLoading(false); return }
    router.push(`/staff/work/${data.id}`)
  }

  if (!queue && !queueError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="text-gray-400 text-lg">{t('checkingAuth')}</div>
      </div>
    )
  }

  if (queueError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-100">
        <div className="card w-full max-w-sm text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-600 font-medium">{queueError}</p>
          <Link href="/staff" className="btn-secondary mt-4 inline-block">{t('backToLogin')}</Link>
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
          <p className="text-sm text-gray-500 mt-1">{t('joinShift')}</p>
        </div>

        {/* Not logged in */}
        {status === 'unauthenticated' && (
          <div className="text-center space-y-4">
            <p className="text-gray-600 text-sm">{t('loginRequired')}</p>
            <Link
              href={`/staff/login?redirect=/staff/join/${queueId}`}
              className="btn-primary w-full justify-center block"
            >
              {t('loginButton')}
            </Link>
            <Link
              href={`/staff/register`}
              className="btn-secondary w-full justify-center block text-sm"
            >
              {t('noAccount')}
            </Link>
          </div>
        )}

        {/* Auth loading */}
        {status === 'loading' && (
          <div className="text-center text-gray-400 py-4">{t('checkingAuth')}</div>
        )}

        {/* Logged in */}
        {status === 'authenticated' && (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-lg px-4 py-3 text-sm text-gray-700">
              {t('greeting', { name: session.user?.name ?? '' })}
            </div>

            {!queue!.isActive && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {t('queueInactive')}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            {queue!.numberOfCounters > 1 && (
              <div>
                <label className="form-label">{t('selectCounter')}</label>
                <select
                  className="form-input"
                  value={counter}
                  onChange={e => setCounter(Number(e.target.value))}
                >
                  {Array.from({ length: queue!.numberOfCounters }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{t('counter', { n })}</option>
                  ))}
                </select>
              </div>
            )}

            {queue!.numberOfCounters === 1 && (
              <p className="text-sm text-gray-500 text-center">{t('serveAtCounter1')}</p>
            )}

            <button
              onClick={handleJoin}
              disabled={loading || !queue!.isActive}
              className="btn-primary w-full justify-center"
            >
              {loading ? t('starting') : t('startShift')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
