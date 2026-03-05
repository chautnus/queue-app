import NextAuth from 'next-auth'
import { staffAuthOptions } from '@/lib/staffAuth'

const handler = NextAuth(staffAuthOptions)
export { handler as GET, handler as POST }
