'use client'
import { SessionProvider } from 'next-auth/react'

export default function StaffSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/staff-auth">
      {children}
    </SessionProvider>
  )
}
