'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteQueueButton({ queueId, queueName }: { queueId: string; queueName: string }) {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)
    await fetch(`/api/queues/${queueId}`, { method: 'DELETE' })
    router.push('/dashboard/queues')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <span className="text-sm text-red-700 font-medium">Xóa &ldquo;{queueName}&rdquo;?</span>
        <button onClick={handleDelete} disabled={loading} className="btn-danger text-xs py-1 px-2">
          {loading ? '...' : 'Xóa'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-gray-500 hover:text-gray-700 text-sm">Hủy</button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="btn-danger text-sm">Xóa</button>
  )
}
