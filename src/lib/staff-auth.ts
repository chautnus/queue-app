import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Separate NextAuth instance for staff portal
// Staff can log in via Google or credentials, but land on /staff/* routes only

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const providers: any[] = [
  Credentials({
    id: "staff-credentials",
    name: "Staff Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      });

      if (!user || !user.passwordHash) return null;
      if (user.role !== "STAFF" && user.role !== "ADMIN") return null;

      const isValid = await bcrypt.compare(
        credentials.password as string,
        user.passwordHash
      );

      if (!isValid) return null;

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
      };
    },
  }),
];

// Conditionally add Google OAuth — only if both env vars are present
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const {
  handlers: staffHandlers,
  auth: staffAuth,
  signIn: staffSignIn,
  signOut: staffSignOut,
} = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "STAFF";
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/staff/login",
    error: "/staff/login",
  },
  secret: process.env.STAFF_AUTH_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  basePath: "/api/staff-auth",
});
