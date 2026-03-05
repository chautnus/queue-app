import StaffJoinClient from './StaffJoinClient'

export default async function StaffJoinPage({ params }: { params: Promise<{ queueId: string }> }) {
  const { queueId } = await params
  return <StaffJoinClient queueId={queueId} />
}
