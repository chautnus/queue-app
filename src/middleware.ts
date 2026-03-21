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

  // Protect /staff/work/* and /staff/join/* routes — require auth
  if (
    pathname.startsWith("/staff/work") ||
    pathname.startsWith("/staff/join")
  ) {
    const session = await auth();
    if (!session?.user) {
      const loginUrl = new URL("/staff/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/staff/work/:path*", "/staff/join/:path*"],
};
