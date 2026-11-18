import { type NextRequest, NextResponse } from "next/server"
import { getPostgresDatabase } from "@/lib/postgres-db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params
    const db = getPostgresDatabase()

    const certificate = await db.getCertificateByVerificationCode(code)
    if (!certificate) {
      return NextResponse.json(
        { verified: false, error: "No credential found matching this verification code." },
        { status: 404 },
      )
    }

    const [user, course] = await Promise.all([
      db.findUserById(certificate.userId),
      db.getCourseById(certificate.courseId),
    ])

    return NextResponse.json({
      verified: true,
      credential: {
        verificationCode: certificate.verificationCode,
        issuedAt: certificate.issuedAt,
        studentName: user?.name || "SkillUp Scholar",
        courseTitle: course?.title || "Technical Course",
        courseCode: course?.code || "SKILLUP",
        category: course?.category || "Technology",
        institution: "SkillUp Digitech Academy",
        learningCentre: "14 Garden Avenue, GRA, Enugu, Nigeria",
        verificationUrl: `/verify/${certificate.verificationCode}`,
        status: "AUTHENTIC & VERIFIED",
      },
    })
  } catch (error: any) {
    console.error("Verify certificate error:", error)
    return NextResponse.json(
      { verified: false, error: error?.message || "Failed to verify certificate" },
      { status: 500 },
    )
  }
}
