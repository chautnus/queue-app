import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { getTodayString, isQueueOpen, formatTime } from '@/lib/utils'
import Link from 'next/link'
import QRDisplay from '@/components/QRDisplay'
import StaffQRDisplay from '@/components/StaffQRDisplay'
import QueueMonitor from '@/components/QueueMonitor'
import DeleteQueueButton from '@/components/DeleteQueueButton'

export default async function QueueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const today = getTodayString()

  const queue = await prisma.queue.findUnique({
    where: { id, adminId: session!.user.id },
    include: {
      entries: { where: { date: today } },
      admin: { select: { logo: true } },
    },
  })
  if (!queue) notFound()

  const open = isQueueOpen(queue)
  const waitingCount = queue.entries.filter(e => e.status === 'waiting').length
  const totalToday = queue.entries.length

  let workingHoursSummary = `${formatTime(queue.startTime)} – ${formatTime(queue.endTime)} hàng ngày`
  if (queue.workingHours) {
    try {
      const wh = JSON.parse(queue.workingHours)
      const days = ['mon','tue','wed','thu','fri','sat','sun']
      const dayNames = ['T2','T3','T4','T5','T6','T7','CN']
      const enabled = days.map((d, i) => wh[d]?.enabled ? dayNames[i] : null).filter(Boolean)
      workingHoursSummary = enabled.join(', ') + ` · ${formatTime(queue.startTime)}–${formatTime(queue.endTime)}`
    } catch { /* use default */ }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {queue.admin.logo ? (
            <img src={queue.admin.logo} alt="" className="w-16 h-16 rounded-xl object-cover" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl">
              {queue.name[0]}
            </div>
          )}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{queue.name}</h1>
              <span className={`badge ${open ? 'badge-green' : 'badge-red'}`}>{open ? 'Đang mở' : 'Đã đóng'}</span>
              <span className={`badge ${queue.isActive ? 'badge-blue' : 'badge-gray'}`}>
                {queue.isActive ? 'Kích hoạt' : 'Tạm dừng'}
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{workingHoursSummary}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/queues/${id}/edit`} className="btn-secondary text-sm">Chỉnh sửa</Link>
          <DeleteQueueButton queueId={id} queueName={queue.name} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Đang chờ hôm nay', value: waitingCount, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Tổng lượt hôm nay', value: totalToday, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Số cửa phục vụ', value: queue.numberOfCounters, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Phút xử lý TB', value: queue.avgProcessingTime, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(s => (
          <div key={s.label} className={`card ${s.bg}`}>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <QueueMonitor queueId={id} />
        </div>
        <div className="space-y-4">
          <QRDisplay queueId={id} qrType={queue.qrType} queueName={queue.name} logoUrl={queue.admin.logo ?? undefined} />
          <StaffQRDisplay queueId={id} queueName={queue.name} logoUrl={queue.admin.logo ?? undefined} />
        </div>
      </div>
    </div>
  )
}
