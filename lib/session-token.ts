import jwt from "jsonwebtoken"

export interface SessionData {
  userId: string
  email: string
  role: string
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim()
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is required")
  }
  return secret
}

export function verifyToken(token: string): SessionData | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as SessionData
    return decoded
  } catch (error) {
    return null
  }
}

export function isValidSessionToken(token: string): boolean {
  return !!token && !!verifyToken(token)
}
