import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="min-h-screen" style={{ background: '#f8fafc' }}>
      <DashboardNav userName={session.user.name ?? ''} />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
