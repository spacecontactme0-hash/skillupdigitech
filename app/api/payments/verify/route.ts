import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { recordOnboardingEvent } from "@/lib/onboarding-event-log"
import { notifyManualReviewAlert } from "@/lib/payment-alerts"
import { expirePaymentIfStale, logPaymentEvent } from "@/lib/payments/runtime"
import { evaluateVerification } from "@/lib/payments/verification"
import { paystackService } from "@/lib/paystack"
import { getCurrentUserFromRequest, requireRole } from "@/lib/authorization"
import { notifyPaymentAndEnrollmentSuccess } from "@/lib/email"

const MAX_VERIFICATION_ATTEMPTS = 5

async function recordOnsitePaymentOutcome(reference: string, status: "completed" | "failed" | "manual_review") {
  await recordOnboardingEvent({
    name: "onsite_payment_outcome",
    role: "student",
    mode: "onsite",
    source: "payment_verify",
    status,
    reference,
  })
}

export async function GET(request: NextRequest) {
  try {
    const actingUser = await getCurrentUserFromRequest(request)
    if (!actingUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      requireRole(actingUser, ["admin", "finance"])
    } catch {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const reference = searchParams.get("reference")

    if (!reference) {
      return NextResponse.json({ error: "Payment reference is required" }, { status: 400 })
    }

    const db = getDB()
    let payment = await db.getPaymentByReference(reference)

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    payment = await expirePaymentIfStale(db, payment, "verify")
    if (payment.status === "expired") {
      await logPaymentEvent(db, {
        reference,
        paymentId: payment.id,
        type: "verify",
        source: "api/payments/verify",
        status: "expired",
        message: "Verification skipped because payment is expired.",
      })
      return NextResponse.json({
        success: true,
        verified: false,
        paystackMessage: payment.gatewayMessage,
        payment,
      })
    }

    if (payment.status === "completed" || payment.status === "success") {
      await logPaymentEvent(db, {
        reference,
        paymentId: payment.id,
        type: "verify",
        source: "api/payments/verify",
        status: payment.status,
        message: "Verification skipped because payment is already completed.",
      })
      return NextResponse.json({
        success: true,
        verified: true,
        paystackMessage: payment.gatewayMessage,
        payment,
      })
    }

    if ((payment.verificationAttempts || 0) >= MAX_VERIFICATION_ATTEMPTS) {
      const reason = "Verification attempts exceeded safe limit."
      const flagged = await db.updatePaymentByReference(reference, {
        status: "manual_review",
        verificationLocked: false,
        gatewayMessage: reason,
        manualReviewReason: reason,
        manualReviewSource: "verify",
        manualReviewCreatedAt: payment.manualReviewCreatedAt || new Date(),
        manualReviewUpdatedAt: new Date(),
        reviewedAt: new Date(),
      })
      await logPaymentEvent(db, {
        reference,
        paymentId: payment.id,
        type: "manual_review",
        source: "api/payments/verify",
        status: "manual_review",
        message: reason,
      })
      if (payment.paymentType === "onsite_registration") {
        await recordOnsitePaymentOutcome(reference, "manual_review")
      }
      return NextResponse.json(
        {
          success: true,
          verified: false,
          paystackMessage: "Payment flagged for manual review.",
          payment: flagged || payment,
        },
        { status: 409 },
      )
    }

    let lockedPayment: any = undefined
    if (typeof db.acquirePaymentVerificationLock === "function") {
      lockedPayment = await db.acquirePaymentVerificationLock(reference, MAX_VERIFICATION_ATTEMPTS)
    } else {
      if (payment.verificationLocked) {
        lockedPayment = undefined
      } else {
        lockedPayment = await db.updatePaymentByReference(reference, {
          verificationLocked: true,
          verificationAttempts: (payment.verificationAttempts || 0) + 1,
          lastVerificationAt: new Date(),
          status: payment.status === "pending" ? "processing" : payment.status,
        })
      }
    }

    if (!lockedPayment) {
      const latest = await db.getPaymentByReference(reference)
      if (latest && (latest.status === "completed" || latest.status === "success")) {
        return NextResponse.json({
          success: true,
          verified: true,
          paystackMessage: latest.gatewayMessage,
          payment: latest,
        })
      }
      if (latest && (latest.verificationAttempts || 0) >= MAX_VERIFICATION_ATTEMPTS) {
        const reason = "Verification attempts exceeded safe limit."
        const flagged = await db.updatePaymentByReference(reference, {
          status: "manual_review",
          verificationLocked: false,
          gatewayMessage: reason,
          manualReviewReason: reason,
          manualReviewSource: "verify",
          manualReviewCreatedAt: latest.manualReviewCreatedAt || new Date(),
          manualReviewUpdatedAt: new Date(),
          reviewedAt: new Date(),
        })
        await logPaymentEvent(db, {
          reference,
          paymentId: latest.id,
          type: "manual_review",
          source: "api/payments/verify",
          status: "manual_review",
          message: reason,
        })
        if (latest.paymentType === "onsite_registration") {
          await recordOnsitePaymentOutcome(reference, "manual_review")
        }
        return NextResponse.json(
          {
            success: true,
            verified: false,
            paystackMessage: "Payment flagged for manual review.",
            payment: flagged || latest,
          },
          { status: 409 },
        )
      }
      return NextResponse.json(
        {
          success: true,
          verified: false,
          message: "Payment verification is already in progress.",
          payment: latest || payment,
        },
        { status: 202 },
      )
    }

    const verification = await paystackService.verifyPayment(reference)

    const paymentUser = await db.findUserById(payment.userId)
    const expectedCustomerEmail = paymentUser?.email || payment.customerEmail
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
      source: "verify",
    })

    if (evaluation.targetStatus === "manual_review") {
      const reason = evaluation.reason || "Verification mismatch."
      await db.updatePaymentByReference(reference, {
        status: "manual_review",
        verificationLocked: false,
        verificationLockToken: undefined,
        verificationLockExpiresAt: undefined,
        gatewayStatus: verification.gatewayStatus || "success",
        gatewayMessage: reason,
        transactionId: verification.transactionId,
        gatewayChannel: verification.channel,
        gatewayFee: verification.gatewayFee,
        customerEmail: verification.customerEmail,
        customerCode: verification.customerCode,
        manualReviewReason: reason,
        manualReviewSource: "verify",
        manualReviewCreatedAt: payment.manualReviewCreatedAt || new Date(),
        manualReviewUpdatedAt: new Date(),
        reviewedAt: new Date(),
      })
      await notifyManualReviewAlert({
        reference,
        paymentType: payment.paymentType,
        amount: payment.amount,
        currency: payment.currency,
        userEmail: expectedCustomerEmail,
        source: "verify",
        reason,
      })
      await logPaymentEvent(db, {
        reference,
        paymentId: payment.id,
        type: "manual_review",
        source: "api/payments/verify",
        status: "manual_review",
        message: reason,
        metadata: { mismatches: evaluation.mismatches },
      })
      if (payment.paymentType === "onsite_registration") {
        await recordOnsitePaymentOutcome(reference, "manual_review")
      }

      const flaggedPayment = await db.getPaymentByReference(reference)
      return NextResponse.json(
        {
          success: true,
          verified: false,
          paystackMessage: "Payment flagged for manual review.",
          payment: flaggedPayment,
        },
        { status: 409 },
      )
    }

    if (evaluation.targetStatus === "completed") {
      await db.updatePaymentByReference(reference, {
        status: "completed",
        verificationLocked: false,
        verificationLockToken: undefined,
        verificationLockExpiresAt: undefined,
        completedAt: new Date(),
        amount: verification.amount,
        currency: verification.currency,
        paidAt: verification.paidAt || new Date(),
        transactionId: verification.transactionId,
        gatewayStatus: verification.gatewayStatus || "success",
        gatewayMessage: verification.gatewayMessage || "Payment verified successfully.",
        gatewayChannel: verification.channel,
        gatewayFee: verification.gatewayFee,
        customerEmail: verification.customerEmail,
        customerCode: verification.customerCode,
      })

      const isOnsiteRegistration = payment.paymentType === "onsite_registration"
      let courseIds = payment.courseIds && payment.courseIds.length > 0 ? payment.courseIds : [payment.courseId]
      if (isOnsiteRegistration) {
        const allCourses = await db.getAllCourses()
        courseIds = (allCourses || []).map((course: any) => course.id)
      }

      const enrolledUser = paymentUser || (await db.findUserById(payment.userId))
      if (enrolledUser) {
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

        const updatedCourses = Array.from(new Set([...(enrolledUser.enrolledCourses || []), ...courseIds]))
        const profile = enrolledUser.studentProfile
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
      await logPaymentEvent(db, {
        reference,
        paymentId: payment.id,
        type: "verify",
        source: "api/payments/verify",
        status: "completed",
        message: "Payment verified and completed successfully.",
      })
      if (payment.paymentType === "onsite_registration") {
        await recordOnsitePaymentOutcome(reference, "completed")
      }
      await notifyPaymentAndEnrollmentSuccess({
        db,
        userId: payment.userId,
        reference,
        amount: verification.amount,
        currency: verification.currency,
        paymentType: payment.paymentType,
        courseIds,
        channel: verification.channel,
        paidAt: verification.paidAt || new Date(),
      })
    } else {
      await db.updatePaymentByReference(reference, {
        status: "failed",
        verificationLocked: false,
        verificationLockToken: undefined,
        verificationLockExpiresAt: undefined,
        gatewayStatus: verification.gatewayStatus || "failed",
        gatewayMessage: verification.gatewayMessage || "Payment verification failed.",
        transactionId: verification.transactionId,
        gatewayChannel: verification.channel,
        gatewayFee: verification.gatewayFee,
        customerEmail: verification.customerEmail,
        customerCode: verification.customerCode,
      })
      await logPaymentEvent(db, {
        reference,
        paymentId: payment.id,
        type: "verify",
        source: "api/payments/verify",
        status: "failed",
        message: verification.gatewayMessage || "Payment verification failed.",
      })
      if (payment.paymentType === "onsite_registration") {
        await recordOnsitePaymentOutcome(reference, "failed")
      }
    }

    const updatedPayment = await db.getPaymentByReference(reference)

    return NextResponse.json({
      success: true,
      verified: verification.status === "success",
      paystackMessage: verification.gatewayMessage,
      payment: updatedPayment,
    })
  } catch (error) {
    try {
      const reference = request.nextUrl.searchParams.get("reference")
      if (reference) {
        const db = getDB()
        if (typeof db.releasePaymentVerificationLock === "function") {
          await db.releasePaymentVerificationLock(reference)
        } else {
          await db.updatePaymentByReference(reference, {
            verificationLocked: false,
            verificationLockToken: undefined,
            verificationLockExpiresAt: undefined,
            status: "pending",
            gatewayMessage: "Verification failed unexpectedly. Please retry.",
          })
        }
        await logPaymentEvent(db, {
          reference,
          type: "verify",
          source: "api/payments/verify",
          status: "error",
          message: "Verification failed unexpectedly.",
        })
      }
    } catch {
      // no-op
    }
    console.error("Payment verification error:", error)
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 })
  }
}
