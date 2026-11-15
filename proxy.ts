import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { isValidSessionToken } from "@/lib/session-token"

const PROTECTED_PREFIXES = ["/admin", "/dashboard", "/instructor", "/finance", "/checkout"]

const PUBLIC_PREFIXES = [
  "/",
  "/courses",
  "/about",
  "/contact",
  "/faq",
  "/login",
  "/login-admin",
  "/register",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
]

const PUBLIC_FILE = /\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map|txt|xml|woff|woff2)$/

function matchesPrefix(pathname: string, prefix: string) {
  if (prefix === "/") {
    return pathname === "/"
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/_next")) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  if (PUBLIC_FILE.test(pathname)) {
    return NextResponse.next()
  }

  if (PUBLIC_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    return NextResponse.next()
  }

  if (PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix))) {
    const authToken = request.cookies.get("token")?.value
    if (!authToken || !isValidSessionToken(authToken)) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}