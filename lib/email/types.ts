/**
 * Centralized Brevo Transactional Email Service — Type Definitions
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 */

export interface EmailRecipient {
  email: string
  name?: string
}

export interface SendEmailOptions {
  to: string | EmailRecipient | (string | EmailRecipient)[]
  subject: string
  html: string
  text?: string
  replyTo?: string | EmailRecipient
  tags?: string[]
  headers?: Record<string, string>
}

export interface EmailSendResult {
  success: boolean
  messageId?: string
  simulated?: boolean
  error?: string
  canRetry?: boolean
  skipped?: boolean
}

export type WelcomeEmailRole = "student" | "instructor" | "admin" | "finance"

export interface WelcomeEmailParams {
  to: string
  name: string
  role?: string
  idempotencyKey?: string
}

export interface OtpEmailParams {
  to: string
  name: string
  otp: string
}

export interface PasswordResetEmailParams {
  to: string
  name: string
  resetUrl: string
  token: string
}

export interface EnrollmentConfirmationParams {
  to: string
  name: string
  courseTitle: string
  courseSlug?: string
  trackName?: string
  instructorName?: string
  idempotencyKey?: string
}

export interface PaymentConfirmationParams {
  to: string
  name: string
  reference: string
  amount: number
  currency: string
  paymentType?: string
  courseTitle?: string
  paymentDate?: Date
  channel?: string
  idempotencyKey?: string
}

export interface LessonReviewApprovedParams {
  to: string
  name: string
  courseTitle: string
  lessonTitle: string
  idempotencyKey?: string
}

export interface LessonReviewRejectedParams {
  to: string
  name: string
  courseTitle: string
  lessonTitle: string
  note?: string
  idempotencyKey?: string
}

export interface PaymentManualReviewAlertParams {
  to: string
  reference: string
  paymentType?: string
  amount: number
  currency: string
  userEmail?: string
  source: string
  reason: string
  idempotencyKey?: string
}

