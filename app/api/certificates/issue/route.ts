import { type NextRequest, NextResponse } from "next/server"
import { randomBytes } from "node:crypto"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { getPostgresDatabase } from "@/lib/postgres-db"
import { evaluateGraduationClearance } from "@/lib/graduation-clearance"

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const currentUser = await authService.getCurrentUser(token)
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, programmeEnrolmentId } = body

    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 })
    }

    const targetUserId =
      currentUser.role === "admin" && body.studentId ? body.studentId : currentUser.id

    const db = getPostgresDatabase()
    const course = await db.getCourseById(courseId)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // 1. Check if certificate already exists
    const existingCerts = await db.getCertificatesByUserId(targetUserId)
    const existing = existingCerts.find((c) => c.courseId === courseId)
    if (existing) {
      return NextResponse.json({
        cleared: true,
        alreadyIssued: true,
        certificate: existing,
      })
    }

    // 2. Run graduation clearance rule engine
    const clearance = await evaluateGraduationClearance({
      userId: targetUserId,
      courseId,
      programmeEnrolmentId,
    })

    if (!clearance.cleared) {
      return NextResponse.json(
        {
          cleared: false,
          error: "Graduation clearance requirements not satisfied",
          missingRequirements: clearance.missingRequirements,
          details: clearance,
        },
        { status: 400 },
      )
    }

    // 3. Mint cryptographic verification code
    const randomHex = randomBytes(4).toString("hex").toUpperCase()
    const verificationCode = `SKILLUP-2026-${randomHex}`
    const certificateUrl = `/verify/${verificationCode}`

    const certificate = await db.createCertificate({
      userId: targetUserId,
      courseId,
      certificateUrl,
      verificationCode,
      issuedAt: new Date(),
    })

    return NextResponse.json(
      {
        cleared: true,
        distinction: clearance.distinction,
        certificate,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Issue certificate error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to evaluate clearance or issue certificate" },
      { status: 500 },
    )
  }
}
