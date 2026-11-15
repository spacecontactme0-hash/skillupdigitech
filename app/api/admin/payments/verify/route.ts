import { NextResponse } from "next/server"
import { z } from "zod"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"
import { paystackService } from "@/lib/paystack"
import { notifyManualReviewAlert } from "@/lib/payment-alerts"
import { logPaymentEvent } from "@/lib/payments/runtime"
import { evaluateVerification } from "@/lib/payments/verification"
import { notifyPaymentAndEnrollmentSuccess } from "@/lib/email"

const verifyActionSchema = z.object({
  reference: z.string().min(3),
  action: z.enum(["check", "approve", "reject", "fraudulent"]).optional().default("check"),
  note: z.string().optional(),
})

async function grantAccessForPayment(db: any, payment: any, reference: string) {
  const user = await db.findUserById(payment.userId)
  if (!user) return

  const isOnsiteRegistration = payment.paymentType === "onsite_registration"
  let courseIds = payment.courseIds && payment.courseIds.length > 0 ? payment.courseIds : [payment.courseId]
  if (isOnsiteRegistration) {
    const allCourses = await db.getAllCourses()
    courseIds = (allCourses || []).map((course: any) => course.id)
  }

  for (const courseId of courseIds) {
    const enrollment = await db.getEnrollment(payment.userId, courseId)
    if (!enrollment) {
      await db.createEnrollment({
        userId: payment.userId,
        courseId,
        progress: 0,
        completedLessons: [],
        status: "active",
        enrolledAt: new Date(),
      })
    }
  }

  const updatedCourses = Array.from(new Set([...(user.enrolledCourses || []), ...courseIds]))
  const profile = user.studentProfile
  await db.updateUser(payment.userId, {
    enrolledCourses: updatedCourses,
    ...(isOnsiteRegistration && profile
      ? {
          studentProfile: {
            ...profile,
            paymentStatus: "yes",
            paymentReference: reference,
          },
        }
      : {}),
  })
}

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const session = authService.decodeToken(token)
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = verifyActionSchema.parse(body)
    const db = getDB()

    const payment = await db.getPaymentByReference(validated.reference)
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }
    const paymentUser = await db.findUserById(payment.userId)
    const expectedCustomerEmail = paymentUser?.email || payment.customerEmail

    if (validated.action === "reject") {
      const rejected = await db.updatePaymentByReference(validated.reference, {
        status: "failed",
        verificationLocked: false,
        gatewayMessage: validated.note || "Rejected by admin review.",
        reviewedBy: session.userId,
        reviewedAt: new Date(),
        reviewNote: validated.note,
      })
      const actor = await db.findUserById(session.userId)
      await db.createAdminLog({
        actorId: session.userId,
        actorName: actor?.name || "Admin",
        actorEmail: actor?.email || session.email,
        action: "other",
        targetUserId: payment.userId,
        targetEmail: payment.reference,
        targetName: "payment_rejected",
      })
      await logPaymentEvent(db, {
        reference: validated.reference,
        paymentId: payment.id,
        type: "manual_review",
        source: "api/admin/payments/verify",
        status: "failed",
        message: validated.note || "Rejected by admin review.",
      })
      return NextResponse.json({ success: true, payment: rejected, action: validated.action })
    }

    if (validated.action === "fraudulent") {
      const reason = validated.note || "Flagged as potentially fraudulent by admin."
      const flagged = await db.updatePaymentByReference(validated.reference, {
        status: "manual_review",
        verificationLocked: false,
        gatewayMessage: reason,
        manualReviewReason: reason,
        manualReviewSource: "admin",
        manualReviewCreatedAt: payment.manualReviewCreatedAt || new Date(),
        manualReviewUpdatedAt: new Date(),
        fraudFlagged: true,
        fraudReason: reason,
        fraudFlaggedAt: new Date(),
        fraudFlaggedBy: session.userId,
        reviewedBy: session.userId,
        reviewedAt: new Date(),
        reviewNote: reason,
      })
      await notifyManualReviewAlert({
        reference: payment.reference,
        paymentType: payment.paymentType,
        amount: payment.amount,
        currency: payment.currency,
        userEmail: expectedCustomerEmail,
        source: "admin",
        reason,
      })
      const actor = await db.findUserById(session.userId)
      await db.createAdminLog({
        actorId: session.userId,
        actorName: actor?.name || "Admin",
        actorEmail: actor?.email || session.email,
        action: "other",
        targetUserId: payment.userId,
        targetEmail: payment.reference,
        targetName: "payment_flagged_fraud",
      })
      await logPaymentEvent(db, {
        reference: validated.reference,
        paymentId: payment.id,
        type: "manual_review",
        source: "api/admin/payments/verify",
        status: "manual_review",
        message: reason,
      })
      return NextResponse.json({ success: true, payment: flagged, action: validated.action })
    }

    const verification = await paystackService.verifyPayment(validated.reference)
    const evaluation = evaluateVerification({
      verification: {
        status: verification.status,
        amount: verification.amount,
        currency: verification.currency,
        customerEmail: verification.customerEmail,
      },
      payment: {
        amount: payment.amount,
        currency: payment.currency,
      },
      userEmail: expectedCustomerEmail,
      source: "admin",
    })

    if (validated.action === "check") {
      return NextResponse.json({
        success: true,
        action: validated.action,
        payment,
        verification,
        mismatches: evaluation.mismatches,
        recommendStatus:
          evaluation.targetStatus === "manual_review"
            ? "manual_review"
            : evaluation.targetStatus === "failed"
              ? "failed"
              : "completed",
      })
    }

    if (evaluation.targetStatus === "failed") {
      return NextResponse.json(
        { error: "Gateway verification status is not successful.", verification, mismatches: evaluation.mismatches },
        { status: 409 },
      )
    }
    if (evaluation.targetStatus === "manual_review") {
      return NextResponse.json(
        {
          error: "Verification mismatches found. Use manual_review/fraudulent path.",
          verification,
          mismatches: evaluation.mismatches,
        },
        { status: 409 },
      )
    }

    const completed = await db.updatePaymentByReference(validated.reference, {
      status: "completed",
      verificationLocked: false,
      completedAt: new Date(),
      amount: verification.amount,
      currency: verification.currency,
      paidAt: verification.paidAt || new Date(),
      transactionId: verification.transactionId,
      gatewayStatus: verification.gatewayStatus || "success",
      gatewayMessage: verification.gatewayMessage || "Payment approved by admin after verification.",
      gatewayChannel: verification.channel,
      reviewedBy: session.userId,
      reviewedAt: new Date(),
      reviewNote: validated.note,
    })

    if (completed) {
      await grantAccessForPayment(db, completed, validated.reference)
      await notifyPaymentAndEnrollmentSuccess({
        db,
        userId: payment.userId,
        reference: validated.reference,
        amount: verification.amount,
        currency: verification.currency,
        paymentType: payment.paymentType,
        courseIds: payment.courseIds && payment.courseIds.length > 0 ? payment.courseIds : [payment.courseId],
        channel: verification.channel,
        paidAt: verification.paidAt || new Date(),
      })
    }
    await logPaymentEvent(db, {
      reference: validated.reference,
      paymentId: payment.id,
      type: "verify",
      source: "api/admin/payments/verify",
      status: "completed",
      message: "Payment approved by admin after verification.",
    })
    const actor = await db.findUserById(session.userId)
    await db.createAdminLog({
      actorId: session.userId,
      actorName: actor?.name || "Admin",
      actorEmail: actor?.email || session.email,
      action: "other",
      targetUserId: payment.userId,
      targetEmail: payment.reference,
      targetName: "payment_approved",
    })

    return NextResponse.json({
      success: true,
      action: validated.action,
      payment: completed,
      verification,
      mismatches: evaluation.mismatches,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Admin payment verify error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
