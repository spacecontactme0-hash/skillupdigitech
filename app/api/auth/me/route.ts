import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await authService.getCurrentUser(token)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ user, token })
  } catch (error) {
    console.error("Auth session verification error (/api/auth/me):", error)
    return NextResponse.json(
      { error: "Temporary database connection error while verifying session. Please retry." },
      { status: 503 },
    )
  }
}
