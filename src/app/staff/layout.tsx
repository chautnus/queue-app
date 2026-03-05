import StaffSessionProvider from '@/components/StaffSessionProvider'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffSessionProvider>{children}</StaffSessionProvider>
}
