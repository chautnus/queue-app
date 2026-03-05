import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const staffAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'staff-credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const staff = await prisma.staff.findUnique({
          where: { email: credentials.email },
        })
        if (!staff) return null

        const isValid = await bcrypt.compare(credentials.password, staff.password)
        if (!isValid) return null

        return { id: staff.id, email: staff.email, name: staff.name }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/staff/login' },
  cookies: {
    sessionToken: {
      name: 'staff-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
