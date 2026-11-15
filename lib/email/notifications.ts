/**
 * High-Level Workflow Email Orchestration
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 *
 * Provides safe, non-blocking notification dispatches for complex multi-step
 * application workflows (e.g. verified payments and course auto-enrollments).
 *
 * Implements durable PostgreSQL-backed idempotency to prevent duplicate
 * notification delivery across serverless instances and concurrent webhook retries.
 */

import { emailLogger } from "./logger"
import { sendEnrollmentConfirmationEmail, sendPaymentConfirmationEmail } from "./index"
import {
  claimNotificationDispatch,
  markNotificationSent,
  markNotificationFailed,
  getNotificationDispatch,
  resetNotificationIdempotencyForTesting,
} from "./idempotency"

export interface PaymentSuccessNotificationInput {
  db: any
  userId: string
  reference: string
  amount: number
  currency: string
  paymentType?: string
  courseIds?: string[]
  channel?: string
  paidAt?: Date
}

/**
 * Backward-compatible helper for inspecting whether a payment receipt has been dispatched.
 */
export async function isReceiptAlreadyDispatched(reference: string): Promise<boolean> {
  const dispatch = await getNotificationDispatch(`payment_receipt:${reference}`)
  return dispatch?.status === "sent"
}

/**
 * Backward-compatible helper for resetting test state.
 */
export function resetDispatchedReceiptCache(): void {
  resetNotificationIdempotencyForTesting()
}

/**
 * Safely dispatches payment confirmation and enrollment confirmation emails.
 *
 * Guarantees:
 * 1. Durable idempotency: Webhook retries and concurrent verification requests cannot double-dispatch.
 * 2. Database transactions are NEVER held open during external Brevo API calls.
 * 3. Status is recorded as 'sent' (never 'delivered') upon API acceptance.
 * 4. Failed dispatches record errors and permit subsequent safe retries.
 * 5. Primary business transactions never roll back if an email gateway encounters an outage.
 */
export async function notifyPaymentAndEnrollmentSuccess(
  input: PaymentSuccessNotificationInput,
): Promise<void> {
  try {
    // -------------------------------------------------------------------------
    // 1. Atomic Slot Claiming for Payment Receipt
    // -------------------------------------------------------------------------
    const receiptIdempotencyKey = `payment_receipt:${input.reference}`
    const receiptClaim = await claimNotificationDispatch({
      idempotencyKey: receiptIdempotencyKey,
      notificationType: "payment_receipt",
      recipientEmail: input.userId,
      metadata: {
        reference: input.reference,
        amount: input.amount,
        currency: input.currency,
        userId: input.userId,
        paymentType: input.paymentType,
      },
    })

    if (!receiptClaim.claimed) {
      if (receiptClaim.reason === "already_sent") {
        emailLogger.info("Payment confirmation email already dispatched for reference; skipping duplicate", {
          reference: input.reference,
        })
      } else {
        emailLogger.info("Payment confirmation email currently in progress by another worker; skipping duplicate", {
          reference: input.reference,
        })
      }
      return
    }

    const user = await input.db.findUserById(input.userId)
    if (!user || !user.email) {
      emailLogger.warn("Cannot dispatch payment confirmation: user or user email not found", {
        userId: input.userId,
        reference: input.reference,
      })
      await markNotificationFailed(receiptIdempotencyKey, "User or user email not found", {
        claimToken: receiptClaim.claimToken,
        isPermanentFailure: true,
      })
      return
    }

    const isOnsite = input.paymentType === "onsite_registration"
    let primaryCourseTitle: string | undefined = undefined
    let primaryCourseSlug: string | undefined = undefined
    let primaryTrackName: string | undefined = undefined
    let primaryEnrollmentId: string | undefined = undefined

    // Retrieve course and enrollment details if available
    const targetCourseIds = input.courseIds || []
    if (targetCourseIds.length > 0 && !isOnsite) {
      try {
        const firstCourse = await input.db.getCourseById(targetCourseIds[0])
        if (firstCourse) {
          primaryCourseTitle = firstCourse.title
          primaryCourseSlug = firstCourse.slug
          primaryTrackName = firstCourse.category
        }
        const existingEnrollment = await input.db.getEnrollment(input.userId, targetCourseIds[0])
        if (existingEnrollment) {
          primaryEnrollmentId = existingEnrollment.id
        }
      } catch (err) {
        emailLogger.warn("Failed to fetch course details for payment email receipt", {
          courseId: targetCourseIds[0],
        })
      }
    }

    // Dispatch external email outside any database transaction
    try {
      const sendResult = await sendPaymentConfirmationEmail({
        to: user.email,
        name: user.name || "Student",
        reference: input.reference,
        amount: input.amount,
        currency: input.currency,
        paymentType: input.paymentType,
        courseTitle: primaryCourseTitle,
        paymentDate: input.paidAt || new Date(),
        channel: input.channel,
      })

      if (sendResult.success) {
        await markNotificationSent(receiptIdempotencyKey, {
          claimToken: receiptClaim.claimToken,
          providerMessageId: sendResult.messageId,
          metadata: { simulated: sendResult.simulated },
        })
      } else {
        await markNotificationFailed(
          receiptIdempotencyKey,
          sendResult.error || "Brevo transactional email dispatch failed",
          {
            claimToken: receiptClaim.claimToken,
            currentAttempts: receiptClaim.record?.attempts,
          },
        )
      }
    } catch (sendError: any) {
      await markNotificationFailed(receiptIdempotencyKey, String(sendError?.message || sendError), {
        claimToken: receiptClaim.claimToken,
        currentAttempts: receiptClaim.record?.attempts,
      })
      emailLogger.error("Failed to send payment receipt confirmation", sendError, {
        reference: input.reference,
      })
    }

    // -------------------------------------------------------------------------
    // 2. Dispatch Course / Onsite Enrollment Confirmation with Stable Identifier
    // -------------------------------------------------------------------------
    if (primaryCourseTitle || isOnsite) {
      const enrollmentKey = isOnsite
        ? `enrollment:onsite:${input.reference}`
        : `enrollment:${primaryEnrollmentId || `${input.userId}:${targetCourseIds[0]}`}`

      const enrollmentClaim = await claimNotificationDispatch({
        idempotencyKey: enrollmentKey,
        notificationType: "enrollment_confirmation",
        recipientEmail: user.email,
        metadata: {
          userId: input.userId,
          courseId: targetCourseIds[0],
          reference: input.reference,
        },
      })

      if (!enrollmentClaim.claimed) {
        emailLogger.info("Enrollment confirmation email already dispatched or in progress; skipping duplicate", {
          enrollmentKey,
        })
      } else {
        try {
          let sendResult
          if (primaryCourseTitle) {
            sendResult = await sendEnrollmentConfirmationEmail({
              to: user.email,
              name: user.name || "Student",
              courseTitle: primaryCourseTitle,
              courseSlug: primaryCourseSlug,
              trackName: primaryTrackName,
            })
          } else {
            sendResult = await sendEnrollmentConfirmationEmail({
              to: user.email,
              name: user.name || "Student",
              courseTitle: "Full Technology Academy Onsite Program & Cohort Access",
              trackName: "Onsite Practical Engineering",
            })
          }

          if (sendResult.success) {
            await markNotificationSent(enrollmentKey, {
              claimToken: enrollmentClaim.claimToken,
              providerMessageId: sendResult.messageId,
              metadata: { simulated: sendResult.simulated },
            })
          } else {
            await markNotificationFailed(
              enrollmentKey,
              sendResult.error || "Brevo enrollment confirmation dispatch failed",
              {
                claimToken: enrollmentClaim.claimToken,
                currentAttempts: enrollmentClaim.record?.attempts,
              },
            )
          }
        } catch (sendError: any) {
          await markNotificationFailed(enrollmentKey, String(sendError?.message || sendError), {
            claimToken: enrollmentClaim.claimToken,
            currentAttempts: enrollmentClaim.record?.attempts,
          })
          emailLogger.error("Failed to send enrollment confirmation", sendError, {
            enrollmentKey,
          })
        }
      }
    }
  } catch (error) {
    // Non-blocking: log the error and never crash payment or enrollment processing
    emailLogger.error("Failed to execute payment/enrollment notification workflow", error, {
      reference: input.reference,
    })
  }
}
