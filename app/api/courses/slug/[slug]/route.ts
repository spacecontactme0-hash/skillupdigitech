import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { maskCourseForUser } from "@/lib/utils/course-masking"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const db = getDB()
    const course = await db.getCourseBySlug(slug)

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const token = getTokenFromRequest(request)
    const user = token ? await authService.getCurrentUser(token) : null

    if (course.approved !== true && (!user || user.role === "student")) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }
    const safeCourse = maskCourseForUser(course, user)

    const instructor = await db.findUserById(course.instructorId)
    const { password: _password, otpHash: _otpHash, otpExpiresAt: _otpExpiresAt, ...safeInstructor } = instructor || {}

    return NextResponse.json({ course: safeCourse, instructor: instructor ? safeInstructor : null })
  } catch (error) {
    console.error("Get course by slug error:", error)
    return NextResponse.json({ error: "Failed to get course" }, { status: 500 })
  }
}
