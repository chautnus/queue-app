import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import QueueForm from '@/components/QueueForm'

export default async function EditQueuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const queue = await prisma.queue.findUnique({ where: { id, adminId: session!.user.id } })
  if (!queue) notFound()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/dashboard/queues/${id}`} className="text-gray-400 hover:text-gray-600 transition-colors">
          ← {queue.name}
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa</h1>
      </div>
      <QueueForm mode="edit" initial={{
        id: queue.id,
        name: queue.name,
        startTime: queue.startTime,
        endTime: queue.endTime,
        avgProcessingTime: queue.avgProcessingTime,
        numberOfCounters: queue.numberOfCounters,
        workingHours: queue.workingHours,
        qrType: queue.qrType,
        isActive: queue.isActive,
        waitThreshold: queue.waitThreshold,
        waitCheckDepth: queue.waitCheckDepth,
        maxQueueSize: queue.maxQueueSize,
        allowRequeue: queue.allowRequeue,
      }} />
    </div>
  )
}
