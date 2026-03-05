import QueueJoinClient from './QueueJoinClient'

export default async function QueueJoinPage({ params }: { params: Promise<{ queueId: string }> }) {
  const { queueId } = await params
  return <QueueJoinClient queueId={queueId} />
}
