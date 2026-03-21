import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /dashboard/* routes — require admin auth
  if (pathname.startsWith("/dashboard")) {
    const session = await auth();
    if (!session?.user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Staff routes (/staff/join/*, /staff/work/*) are NOT protected by middleware
  // because staff uses a separate NextAuth instance (staff-auth).
  // Those pages handle their own auth checks internally.

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
