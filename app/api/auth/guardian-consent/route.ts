import { NextResponse } from "next/server"
import { verifyGuardianConsentToken } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { programmesDb } from "@/lib/programmes-db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Missing consent token" }, { status: 400 })
    }

    const payload = verifyGuardianConsentToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired parental consent link. Please ask your child to re-trigger verification." },
        { status: 400 },
      )
    }

    const db = getDB()
    const user = await db.findUserByEmail(payload.studentEmail)

    return NextResponse.json({
      valid: true,
      studentEmail: payload.studentEmail,
      studentName: user?.name || "Student",
      guardianEmail: payload.guardianEmail,
      currentStatus: user?.guardianConsentStatus || "pending",
      isAlreadyVerified: user?.guardianConsentStatus === "verified",
    })
  } catch (error) {
    console.error("Guardian consent verification GET error:", error)
    return NextResponse.json({ error: "Failed to verify consent token" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const token = body.token

    if (!token) {
      return NextResponse.json({ error: "Missing consent token" }, { status: 400 })
    }

    const payload = verifyGuardianConsentToken(token)
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired parental consent authorization link." },
        { status: 400 },
      )
    }

    const db = getDB()
    const user = await db.findUserByEmail(payload.studentEmail)

    if (user) {
      // Update student's guardian consent status to verified
      await db.updateUser(user.id, {
        guardianConsentStatus: "verified",
      })

      // Record formal policy acknowledgement in academy audit trail
      try {
        await programmesDb.recordPolicyAcknowledgement({
          userId: user.id,
          policyType: "guardian_consent",
          policyVersion: "v1.0",
          metadata: {
            guardianEmail: payload.guardianEmail,
            verifiedAt: new Date().toISOString(),
            ipAddress: request.headers.get("x-forwarded-for") || "unknown",
            userAgent: request.headers.get("user-agent") || "unknown",
          },
        })
      } catch (logErr) {
        console.error("Non-blocking policy acknowledgement logging error:", logErr)
      }

      return NextResponse.json({
        success: true,
        message: "Parental consent successfully recorded and verified. Your child is cleared for learning.",
        studentEmail: payload.studentEmail,
        studentName: user.name,
      })
    }

    // If the student has not yet verified their email OTP, acknowledge token validity
    return NextResponse.json({
      success: true,
      message: "Parental consent registered. It will become active once your child completes email verification.",
      studentEmail: payload.studentEmail,
    })
  } catch (error) {
    console.error("Guardian consent submission POST error:", error)
    return NextResponse.json({ error: "Failed to authorize student enrolment" }, { status: 500 })
  }
}
