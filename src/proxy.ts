import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register")
  const isApiAuth = pathname.startsWith("/api/auth")
  const isPublic = pathname === "/" || isAuthRoute || isApiAuth

  // NextAuth v5 session cookie (http = authjs.session-token, https = __Secure-authjs.session-token)
  const sessionToken =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token")
  const isLoggedIn = !!sessionToken

  if (!isLoggedIn && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
