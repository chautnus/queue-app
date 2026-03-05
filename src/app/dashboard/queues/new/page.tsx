import Link from 'next/link'
import QueueForm from '@/components/QueueForm'

export default function NewQueuePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/queues" className="text-gray-400 hover:text-gray-600 transition-colors">
          ← Hàng đợi
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-gray-900">Tạo hàng đợi mới</h1>
      </div>
      <QueueForm mode="create" />
    </div>
  )
}
