import { NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { adminCreateUserSchema } from "@/lib/validation"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { sendWelcomeEmail } from "@/lib/email"
import { ZodError } from "zod"

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const session = authService.decodeToken(token)
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = adminCreateUserSchema.parse(body)

    const db = getDB()
    const existing = await db.findUserByEmail(validated.email)
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 })
    }

    const created = await authService.register(
      validated.email,
      validated.password,
      validated.name,
      validated.role
    )

    const actor = await db.findUserById(session.userId)
    await db.createAdminLog({
      actorId: session.userId,
      actorName: actor?.name || "Admin",
      actorEmail: actor?.email || session.email,
      action: "create_user",
      targetUserId: created.user.id,
      targetName: created.user.name,
      targetEmail: created.user.email,
      targetRole: created.user.role,
    })

    try {
      await sendWelcomeEmail({
        to: created.user.email,
        name: created.user.name,
        role: created.user.role,
        idempotencyKey: `welcome:${created.user.id}:${created.user.role}`,
      })
    } catch (emailError) {
      console.error("Failed to send admin-created user onboarding email:", emailError)
    }

    return NextResponse.json({ user: created.user }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}