import DisplayClient from './DisplayClient'

export default async function DisplayPage({ params }: { params: Promise<{ queueId: string }> }) {
  const { queueId } = await params
  return <DisplayClient queueId={queueId} />
}

export const metadata = {
  title: 'Màn hình hiển thị',
}
