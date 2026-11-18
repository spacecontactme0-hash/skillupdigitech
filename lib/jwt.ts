// JWT helpers for API routes
import type { NextRequest } from "next/server"

function normalizeToken(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed === "null" || trimmed === "undefined" || trimmed === "Bearer") {
    return null
  }
  return trimmed
}

export function getTokenFromRequest(request: Request | NextRequest): string | null {
  const cookie = request.headers.get("cookie")
  if (cookie) {
    const match = cookie.match(/(?:^|;\s*)token=([^;]+)/)
    if (match) {
      const cookieToken = normalizeToken(decodeURIComponent(match[1]))
      if (cookieToken) {
        return cookieToken
      }
    }
  }

  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = normalizeToken(authHeader.slice(7))
    if (bearerToken) {
      return bearerToken
    }
  }

  return null
}
