'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function DeleteQueueButton({ queueId, queueName }: { queueId: string; queueName: string }) {
  const t = useTranslations('queues')
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
        <span className="text-sm text-red-700 font-medium">{t('deleteConfirmTitle', { name: queueName })}</span>
        <button onClick={handleDelete} disabled={loading} className="btn-danger text-xs py-1 px-2">
          {loading ? t('deleting') : t('deleteButton')}
        </button>
        <button onClick={() => setConfirming(false)} className="text-gray-500 hover:text-gray-700 text-sm">{t('deleteCancel')}</button>
      </div>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className="btn-danger text-sm">{t('deleteButton')}</button>
  )
}
