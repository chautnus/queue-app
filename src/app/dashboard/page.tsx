import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTodayString } from '@/lib/utils'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const today = getTodayString()
  const t = await getTranslations('dashboard')

  const queues = await prisma.queue.findMany({
    where: { adminId: session!.user.id },
    include: {
      _count: { select: { entries: true } },
      entries: { where: { date: today, status: 'waiting' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalWaiting = queues.reduce((s, q) => s + q.entries.length, 0)
  const totalQueues = queues.length
  const activeQueues = queues.filter(q => q.isActive).length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('greeting', { name: session?.user.name ?? '' })}</p>
        </div>
        <Link href="/dashboard/queues/new" className="btn-primary">
          {t('createQueue')}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">📋</div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalQueues}</div>
              <div className="text-sm text-gray-500">{t('totalQueues')}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">✅</div>
            <div>
              <div className="text-2xl font-bold text-green-600">{activeQueues}</div>
              <div className="text-sm text-gray-500">{t('activeQueues')}</div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="text-3xl">👥</div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalWaiting}</div>
              <div className="text-sm text-gray-500">{t('waitingToday')}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('queueList')}</h2>
          <Link href="/dashboard/queues" className="text-blue-600 text-sm font-medium hover:underline">{t('viewAll')}</Link>
        </div>
        {queues.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p className="font-medium">{t('noQueues')}</p>
            <p className="text-sm mt-1">{t('createFirst')}</p>
            <Link href="/dashboard/queues/new" className="btn-primary mt-4 inline-flex">{t('createNow')}</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {queues.slice(0, 5).map(q => (
              <Link key={q.id} href={`/dashboard/queues/${q.id}`}
                className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                    {q.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{q.name}</div>
                    <div className="text-sm text-gray-400">{q.startTime} – {q.endTime}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{t('waiting', { count: q.entries.length })}</span>
                  <span className={`badge ${q.isActive ? 'badge-green' : 'badge-gray'}`}>
                    {q.isActive ? t('active') : t('paused')}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
