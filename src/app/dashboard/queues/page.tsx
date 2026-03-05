import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTodayString } from '@/lib/utils'
import Link from 'next/link'

export default async function QueuesPage() {
  const session = await getServerSession(authOptions)
  const today = getTodayString()

  const queues = await prisma.queue.findMany({
    where: { adminId: session!.user.id },
    include: {
      entries: { where: { date: today, status: 'waiting' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hàng đợi</h1>
          <p className="text-gray-500 mt-1">{queues.length} hàng đợi</p>
        </div>
        <Link href="/dashboard/queues/new" className="btn-primary">+ Tạo hàng đợi</Link>
      </div>

      {queues.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-6xl mb-4">📭</div>
          <p className="font-medium text-lg">Chưa có hàng đợi nào</p>
          <Link href="/dashboard/queues/new" className="btn-primary mt-4 inline-flex">Tạo hàng đợi đầu tiên</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {queues.map(q => (
            <div key={q.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {q.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-lg truncate">{q.name}</h3>
                    <span className={`badge ${q.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {q.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">{q.startTime} – {q.endTime} · {q.numberOfCounters} cửa</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                <div className="bg-blue-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-blue-600">{q.entries.length}</div>
                  <div className="text-xs text-gray-500">Đang chờ</div>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <div className="text-xl font-bold text-green-600">{q.avgProcessingTime}</div>
                  <div className="text-xs text-gray-500">Phút/lượt</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-2">
                  <div className="text-sm font-bold text-purple-600 uppercase">{q.qrType === 'fixed' ? 'Cố định' : 'Hàng ngày'}</div>
                  <div className="text-xs text-gray-500">QR Code</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/queues/${q.id}`} className="btn-primary flex-1 justify-center text-sm py-2">
                  Quản lý
                </Link>
                <Link href={`/dashboard/queues/${q.id}/edit`} className="btn-secondary flex-1 justify-center text-sm py-2">
                  Chỉnh sửa
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
