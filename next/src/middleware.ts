import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge Middleware (Route Protection & Session Guard)
 * Executes at the server/edge layer before any component or HTML is rendered.
 * Prevents Flash of Unauthenticated Content (FOUC).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has("mac_session");

  // 1. Guard all /admin routes against unauthenticated visitors
  if (pathname.startsWith("/admin")) {
    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Prevent already-authenticated users from revisiting /login
  if (pathname === "/login") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
