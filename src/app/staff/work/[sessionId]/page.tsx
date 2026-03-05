import StaffWorkClient from './StaffWorkClient'

export default async function StaffWorkPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  return <StaffWorkClient sessionId={sessionId} />
}
