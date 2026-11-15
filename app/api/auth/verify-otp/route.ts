import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { sendWelcomeEmail } from "@/lib/email"
import { getPostVerificationRoute } from "@/lib/onboarding-flow"
import { recordOnboardingEvent } from "@/lib/onboarding-event-log"
import { syncStudentMilestones } from "@/lib/student-milestones"
import { otpVerifySchema } from "@/lib/validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = otpVerifySchema.parse(body)
    const normalizedEmail = validated.email.trim().toLowerCase()
    const db = getDB() as any

    const pendingRegistration = typeof db.findPendingRegistrationByEmail === "function"
      ? await db.findPendingRegistrationByEmail(normalizedEmail)
      : undefined
    const existingUser = typeof db.findUserByEmail === "function" ? await db.findUserByEmail(normalizedEmail) : undefined
    const otpOwner = pendingRegistration || existingUser

    if (!otpOwner) {
      return NextResponse.json(
        { error: "No pending verification was found for this email. Start again or request a fresh code." },
        { status: 404 },
      )
    }

    if (existingUser?.emailVerified) {
      return NextResponse.json(
        { error: "This email is already verified. Sign in instead of requesting another OTP." },
        { status: 409 },
      )
    }

    if (!otpOwner.otpExpiresAt || new Date(otpOwner.otpExpiresAt).getTime() < Date.now()) {
      await recordOnboardingEvent({
        name: "otp_verify_failed",
        role: otpOwner.role,
        source: "signup",
        status: "expired",
        metadata: { email: normalizedEmail },
      })
      return NextResponse.json(
        { error: "This verification code has expired. Request a new OTP and try again." },
        { status: 410 },
      )
    }

    const result = await authService.verifyOtp(normalizedEmail, validated.otp)

    if (!result) {
      await recordOnboardingEvent({
        name: "otp_verify_failed",
        role: otpOwner.role,
        source: "signup",
        status: "invalid",
        metadata: { email: normalizedEmail },
      })
      return NextResponse.json({ error: "Invalid OTP. Check the code and try again." }, { status: 400 })
    }

    try {
      await sendWelcomeEmail({
        to: result.user.email,
        name: result.user.name,
        role: result.user.role,
        idempotencyKey: `welcome:${result.user.id}:${result.user.role}`,
      })
    } catch (err) {
      console.error("Failed to send welcome email:", err)
    }

    let responseUser = result.user.role === "student" ? await syncStudentMilestones(db, result.user) : result.user
    const isOnsiteProfile =
      responseUser.role === "student" &&
      responseUser.studentProfile &&
      (responseUser.studentProfile.trainingMode === "onsite" ||
        (!responseUser.studentProfile.trainingMode && (responseUser.studentProfile.registrationFeeNgn || 0) > 0))

    if (isOnsiteProfile) {
      try {
        const payments = await db.getPaymentsByUserId(responseUser.id)
        const hasCompletedOnsitePayment = (payments || []).some(
          (payment: any) =>
            payment.paymentType === "onsite_registration" &&
            (payment.status === "completed" || payment.status === "success"),
        )

        if (!hasCompletedOnsitePayment) {
          await recordOnboardingEvent({
            name: "otp_verify_succeeded",
            role: responseUser.role,
            mode: "onsite",
            source: "signup",
            status: "verified_pending_payment",
          })
          return NextResponse.json({
            success: true,
            user: responseUser,
            token: result.token,
            role: responseUser.role,
            nextRoute: getPostVerificationRoute(responseUser.role),
            isFirstLogin: true,
          })
        }

        const [allCourses, existingEnrollments] = await Promise.all([
          db.getAllCourses(),
          db.getEnrollmentsByUserId(responseUser.id),
        ])

        const enrolledCourseIds = new Set((existingEnrollments || []).map((item: any) => item.courseId))
        for (const course of allCourses || []) {
          if (enrolledCourseIds.has(course.id)) continue
          await db.createEnrollment({
            userId: responseUser.id,
            courseId: course.id,
            progress: 0,
            completedLessons: [],
            status: "active",
            enrolledAt: new Date(),
          })
          enrolledCourseIds.add(course.id)
        }

        const updatedUser = await db.updateUser(responseUser.id, {
          enrolledCourses: Array.from(enrolledCourseIds),
        })
        if (updatedUser) {
          const syncedUser = await syncStudentMilestones(db, updatedUser)
          const { password: _password, ...safeUser } = syncedUser as any
          responseUser = safeUser
        }
      } catch (enrollmentError) {
        console.error("Failed to auto-enroll onsite student:", enrollmentError)
      }
    }

    await recordOnboardingEvent({
      name: "otp_verify_succeeded",
      role: responseUser.role,
      mode: isOnsiteProfile ? "onsite" : "online",
      source: "signup",
      status: "verified",
    })

    return NextResponse.json({
      success: true,
      user: responseUser,
      token: result.token,
      role: responseUser.role,
      nextRoute: getPostVerificationRoute(responseUser.role),
      isFirstLogin: true,
    })
  } catch (error) {
    console.error("Verify OTP error:", error)
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}
