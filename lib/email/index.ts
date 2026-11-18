/**
 * Centralized Transactional Email Service Entry Point
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 *
 * Provides typed convenience functions for application workflows, fully integrated
 * with Brevo transactional email delivery and branded responsive templates.
 */

export * from "./types"
export * from "./client"
export * from "./logger"
export * from "./service"
export * from "./notifications"
export * from "./idempotency"

import { sendTransactionalEmail } from "./service"
import {
  claimNotificationDispatch,
  markNotificationSent,
  markNotificationFailed,
} from "./idempotency"
import { emailLogger } from "./logger"
import {
  EmailSendResult,
  EnrollmentConfirmationParams,
  LessonReviewApprovedParams,
  LessonReviewRejectedParams,
  OtpEmailParams,
  PaymentConfirmationParams,
  PaymentManualReviewAlertParams,
  PasswordResetEmailParams,
  WelcomeEmailParams,
} from "./types"
import { renderWelcomeEmail } from "./templates/welcome"
import { renderVerificationEmail } from "./templates/verification"
import { renderPasswordResetEmail } from "./templates/password-reset"
import { renderEnrollmentConfirmationEmail } from "./templates/enrollment-confirmation"
import { renderPaymentConfirmationEmail } from "./templates/payment-confirmation"
import { renderLessonApprovedEmail, renderLessonRejectedEmail } from "./templates/curriculum-review"
import { renderPaymentManualReviewAlertEmail } from "./templates/payment-alert"
import {
  renderGuardianConsentEmail,
  GuardianConsentEmailParams,
} from "./templates/guardian-consent"
import {
  renderInstallmentReminderEmail,
  InstallmentReminderEmailParams,
} from "./templates/installment-reminder"

/**
 * Internal helper to dispatch transactional emails with optional durable idempotency.
 */
async function dispatchWithOptionalIdempotency(options: {
  idempotencyKey?: string
  notificationType: string
  recipientEmail: string
  send: () => Promise<EmailSendResult>
  metadata?: Record<string, any>
}): Promise<EmailSendResult> {
  if (!options.idempotencyKey) {
    return options.send()
  }

  const claim = await claimNotificationDispatch({
    idempotencyKey: options.idempotencyKey,
    notificationType: options.notificationType,
    recipientEmail: options.recipientEmail,
    metadata: options.metadata,
  })

  if (!claim.claimed) {
    emailLogger.info(
      `Notification already dispatched or in progress; skipping duplicate [${options.notificationType}]`,
      {
        idempotencyKey: options.idempotencyKey,
        reason: claim.reason,
      },
    )
    return {
      success: true,
      simulated: false,
      skipped: true,
      messageId: claim.record?.providerMessageId || undefined,
    }
  }

  try {
    const result = await options.send()
    if (result.success) {
      await markNotificationSent(options.idempotencyKey, {
        claimToken: claim.claimToken,
        providerMessageId: result.messageId,
        metadata: { simulated: result.simulated },
      })
    } else {
      await markNotificationFailed(options.idempotencyKey, result.error || "Send failed", {
        claimToken: claim.claimToken,
        currentAttempts: claim.record?.attempts,
      })
    }
    return result
  } catch (err: any) {
    await markNotificationFailed(options.idempotencyKey, String(err?.message || err), {
      claimToken: claim.claimToken,
      currentAttempts: claim.record?.attempts,
    })
    throw err
  }
}

/**
 * Sends a single-use OTP verification code to a user during registration or resend.
 * Does NOT suppress legitimate new OTP requests.
 */
export async function sendOtpEmail(params: OtpEmailParams) {
  const { subject, html, text } = renderVerificationEmail(params)
  return sendTransactionalEmail({
    to: { email: params.to, name: params.name },
    subject,
    html,
    text,
    tags: ["auth", "otp-verification"],
  })
}

/**
 * Sends a role-specific onboarding welcome email upon account verification or admin creation.
 * Supports durable idempotency via params.idempotencyKey (e.g. welcome:userId:role).
 */
export async function sendWelcomeEmail(params: WelcomeEmailParams) {
  const { subject, html, text } = renderWelcomeEmail({ name: params.name, role: params.role })
  return dispatchWithOptionalIdempotency({
    idempotencyKey: params.idempotencyKey,
    notificationType: "welcome",
    recipientEmail: params.to,
    metadata: { role: params.role },
    send: () =>
      sendTransactionalEmail({
        to: { email: params.to, name: params.name },
        subject,
        html,
        text,
        tags: ["auth", "welcome", params.role || "student"],
      }),
  })
}

/**
 * Sends a password reset email containing a reset link and verification token.
 * Does NOT suppress legitimate new password reset requests.
 */
export async function sendPasswordResetEmail(params: PasswordResetEmailParams) {
  const { subject, html, text } = renderPasswordResetEmail(params)
  return sendTransactionalEmail({
    to: { email: params.to, name: params.name },
    subject,
    html,
    text,
    tags: ["auth", "password-reset"],
  })
}

/**
 * Sends a course enrollment confirmation email to the student upon successful enrollment.
 * Supports durable idempotency via params.idempotencyKey.
 */
export async function sendEnrollmentConfirmationEmail(params: EnrollmentConfirmationParams) {
  const { subject, html, text } = renderEnrollmentConfirmationEmail(params)
  return dispatchWithOptionalIdempotency({
    idempotencyKey: params.idempotencyKey,
    notificationType: "enrollment_confirmation",
    recipientEmail: params.to,
    metadata: { courseTitle: params.courseTitle, trackName: params.trackName },
    send: () =>
      sendTransactionalEmail({
        to: { email: params.to, name: params.name },
        subject,
        html,
        text,
        tags: ["lms", "enrollment-confirmation"],
      }),
  })
}

/**
 * Sends an electronic receipt to the customer upon successful payment verification.
 * Supports durable idempotency via params.idempotencyKey.
 */
export async function sendPaymentConfirmationEmail(params: PaymentConfirmationParams) {
  const { subject, html, text } = renderPaymentConfirmationEmail(params)
  return dispatchWithOptionalIdempotency({
    idempotencyKey: params.idempotencyKey,
    notificationType: "payment_receipt",
    recipientEmail: params.to,
    metadata: { reference: params.reference, amount: params.amount, currency: params.currency },
    send: () =>
      sendTransactionalEmail({
        to: { email: params.to, name: params.name },
        subject,
        html,
        text,
        tags: ["finance", "payment-confirmation"],
      }),
  })
}

/**
 * Notifies an instructor that their lesson has been approved by the academic committee.
 * Supports durable idempotency via params.idempotencyKey.
 */
export async function sendLessonApprovedEmail(params: LessonReviewApprovedParams) {
  const { subject, html, text } = renderLessonApprovedEmail(params)
  return dispatchWithOptionalIdempotency({
    idempotencyKey: params.idempotencyKey,
    notificationType: "lesson_approved",
    recipientEmail: params.to,
    metadata: { courseTitle: params.courseTitle, lessonTitle: params.lessonTitle },
    send: () =>
      sendTransactionalEmail({
        to: { email: params.to, name: params.name },
        subject,
        html,
        text,
        tags: ["curriculum", "lesson-approved"],
      }),
  })
}

/**
 * Notifies an instructor that revisions were requested on their lesson.
 * Supports durable idempotency via params.idempotencyKey.
 */
export async function sendLessonRejectedEmail(params: LessonReviewRejectedParams) {
  const { subject, html, text } = renderLessonRejectedEmail(params)
  return dispatchWithOptionalIdempotency({
    idempotencyKey: params.idempotencyKey,
    notificationType: "lesson_rejected",
    recipientEmail: params.to,
    metadata: { courseTitle: params.courseTitle, lessonTitle: params.lessonTitle },
    send: () =>
      sendTransactionalEmail({
        to: { email: params.to, name: params.name },
        subject,
        html,
        text,
        tags: ["curriculum", "lesson-rejected"],
      }),
  })
}

/**
 * Alerts administrators and finance staff when a payment requires manual review.
 * Deduplicates automatically via payment_alert:reference.
 */
export async function sendPaymentManualReviewAlert(params: PaymentManualReviewAlertParams) {
  const { subject, html, text } = renderPaymentManualReviewAlertEmail(params)
  const alertKey = params.idempotencyKey || `payment_alert:${params.reference}:${params.to.trim().toLowerCase()}`

  return dispatchWithOptionalIdempotency({
    idempotencyKey: alertKey,
    notificationType: "payment_manual_review_alert",
    recipientEmail: params.to,
    metadata: { reference: params.reference, amount: params.amount, reason: params.reason },
    send: () =>
      sendTransactionalEmail({
        to: { email: params.to },
        subject,
        html,
        text,
        tags: ["finance", "manual-review-alert"],
      }),
  })
}

/**
 * Dispatches an official parental / guardian consent request for minor learners (aged 13-17).
 */
export async function sendGuardianConsentEmail(
  params: GuardianConsentEmailParams & { idempotencyKey?: string },
) {
  const { subject, html, text } = renderGuardianConsentEmail(params)
  const alertKey = params.idempotencyKey || `guardian_consent:${params.consentToken}`

  return dispatchWithOptionalIdempotency({
    idempotencyKey: alertKey,
    notificationType: "guardian_consent_request",
    recipientEmail: params.guardianEmail,
    metadata: {
      studentName: params.studentName,
      programmeName: params.programmeName,
      pathwayOrCourseName: params.pathwayOrCourseName,
    },
    send: () =>
      sendTransactionalEmail({
        to: { email: params.guardianEmail, name: params.guardianName },
        subject,
        html,
        text,
        tags: ["safeguarding", "guardian-consent"],
      }),
  })
}

/**
 * Dispatches an automated tuition installment reminder via Brevo.
 */
export async function sendInstallmentReminderEmail(
  params: InstallmentReminderEmailParams & { idempotencyKey?: string },
) {
  const { subject, html, text } = renderInstallmentReminderEmail(params)
  const alertKey = params.idempotencyKey || `installment_reminder:${params.studentEmail}:${params.dueDate}`

  return dispatchWithOptionalIdempotency({
    idempotencyKey: alertKey,
    notificationType: "installment_reminder",
    recipientEmail: params.studentEmail,
    metadata: {
      programmeName: params.programmeName,
      installmentAmountNgn: params.installmentAmountNgn,
      isOverdue: params.isOverdue,
    },
    send: () =>
      sendTransactionalEmail({
        to: { email: params.studentEmail, name: params.studentName },
        subject,
        html,
        text,
        tags: ["finance", "installment-reminder"],
      }),
  })
}


