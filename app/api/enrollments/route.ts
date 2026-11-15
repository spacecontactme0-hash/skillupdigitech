import { type NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"
import { authService } from "@/lib/auth"
import { syncStudentMilestones } from "@/lib/student-milestones"
import { enrollmentCreateSchema } from "@/lib/validation"
import { maskCourseForUser } from "@/lib/utils/course-masking"
import { getCurrentUserFromRequest, resolveAuthorizedUserId, requireRole } from "@/lib/authorization"
import {
  sendEnrollmentConfirmationEmail,
  claimNotificationDispatch,
  markNotificationSent,
  markNotificationFailed,
} from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const courseId = searchParams.get("courseId")
    const courseIds = searchParams.get("courseIds")
    const all = searchParams.get("all") === "true"

    const actingUser = await getCurrentUserFromRequest(request)
    if (!actingUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDB()
    let enrollments: any[] = []

    if (all) {
      try {
        requireRole(actingUser, "admin")
      } catch {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      enrollments = await db.getAllEnrollments()
    } else if (userId) {
      const authorizedUserId = (() => {
        try {
          return resolveAuthorizedUserId(actingUser, userId)
        } catch {
          return null
        }
      })()

      if (!authorizedUserId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      enrollments = await db.getEnrollmentsByUserId(authorizedUserId)
      const user = await db.findUserById(userId)
      if (
        user?.role === "student" &&
        user.studentProfile &&
        (user.studentProfile.trainingMode === "onsite" ||
          (!user.studentProfile.trainingMode && (user.studentProfile.registrationFeeNgn || 0) > 0))
      ) {
        const payments = await db.getPaymentsByUserId(userId)
        const hasCompletedOnsitePayment = (payments || []).some(
          (payment: any) =>
            payment.paymentType === "onsite_registration" &&
            (payment.status === "completed" || payment.status === "success"),
        )
        if (hasCompletedOnsitePayment) {
          const allCourses = await db.getAllCourses()
          const existingCourseIds = new Set(enrollments.map((item: any) => item.courseId))
          let created = false

          for (const course of allCourses || []) {
            if (existingCourseIds.has(course.id)) continue
            const enrollment = await db.createEnrollment({
              userId,
              courseId: course.id,
              progress: 0,
              completedLessons: [],
              status: "active",
              enrolledAt: new Date(),
            })
            enrollments.push(enrollment)
            existingCourseIds.add(course.id)
            created = true
          }

          if (created) {
            const updatedUser = await db.updateUser(userId, {
              enrolledCourses: Array.from(existingCourseIds),
            })
            if (updatedUser?.role === "student") {
              await syncStudentMilestones(db, updatedUser)
            }
          }
        }
      }
    } else if (courseId || courseIds) {
      const ids = courseIds ? courseIds.split(",") : [courseId as string]
      const allEnrollments = await db.getAllEnrollments()
      enrollments = allEnrollments.filter((e: any) => ids.includes(e.courseId))
    } else {
      return NextResponse.json({ error: "Query parameters are required" }, { status: 400 })
    }

    const token = getTokenFromRequest(request)
    let user = null
    if (token) {
      try {
        user = await authService.getCurrentUser(token)
      } catch {
        user = null
      }
    }

    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment: any) => {
        const course = await db.getCourseById(enrollment.courseId)
        if (!course) return { ...enrollment, course }

        const safeCourse = maskCourseForUser(course, user)

        return { ...enrollment, course: safeCourse }
      })
    )

    return NextResponse.json({ enrollments: enrichedEnrollments })
  } catch (error) {
    console.error("Get enrollments error:", error)
    return NextResponse.json({ error: "Failed to get enrollments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const actingUser = await getCurrentUserFromRequest(request)
    if (!actingUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, courseId } = enrollmentCreateSchema.parse(body)
    const authorizedUserId = (() => {
      try {
        return resolveAuthorizedUserId(actingUser, userId)
      } catch {
        return null
      }
    })()

    if (!authorizedUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const db = getDB()
    const existing = await db.getEnrollment(authorizedUserId, courseId)

    if (existing) {
      return NextResponse.json({ error: "Already enrolled in this course" }, { status: 400 })
    }

    const enrollment = await db.createEnrollment({
      userId: authorizedUserId,
      courseId,
      progress: 0,
      completedLessons: [],
      status: "active",
      enrolledAt: new Date(),
    })

    const user = await db.findUserById(authorizedUserId)
    if (user) {
      const updatedCourses = Array.from(new Set([...(user.enrolledCourses || []), courseId]))
      const updatedUser = await db.updateUser(authorizedUserId, { enrolledCourses: updatedCourses })
      if (updatedUser?.role === "student") {
        await syncStudentMilestones(db, updatedUser)
      }
      try {
        const course = await db.getCourseById(courseId)
        if (user.email && course) {
          const enrollmentKey = `enrollment:${enrollment.id}`
          const claim = await claimNotificationDispatch({
            idempotencyKey: enrollmentKey,
            notificationType: "enrollment_confirmation",
            recipientEmail: user.email,
            metadata: { enrollmentId: enrollment.id, courseId, userId: authorizedUserId },
          })
          if (claim.claimed) {
            const sendResult = await sendEnrollmentConfirmationEmail({
              to: user.email,
              name: user.name || "Student",
              courseTitle: course.title,
              courseSlug: course.slug,
              trackName: course.category,
            })
            if (sendResult.success) {
              await markNotificationSent(enrollmentKey, {
                claimToken: claim.claimToken,
                providerMessageId: sendResult.messageId,
              })
            } else {
              await markNotificationFailed(enrollmentKey, sendResult.error || "Email send failed", {
                claimToken: claim.claimToken,
                currentAttempts: claim.record?.attempts,
              })
            }
          }
        }
      } catch (emailErr) {
        console.error("Failed to send direct enrollment confirmation email:", emailErr)
      }
    }

    return NextResponse.json({ enrollment }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Create enrollment error:", error)
    return NextResponse.json({ error: "Failed to create enrollment" }, { status: 500 })
  }
}
