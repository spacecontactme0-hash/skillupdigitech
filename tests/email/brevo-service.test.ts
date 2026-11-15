import test from "node:test"
import assert from "node:assert/strict"

import {
  assertServerOnly,
  getBrevoConfig,
  resolveAppUrl,
} from "../../lib/email/client"
import { maskEmail, emailLogger } from "../../lib/email/logger"
import { sendTransactionalEmail } from "../../lib/email/service"
import {
  sendEnrollmentConfirmationEmail,
  sendLessonApprovedEmail,
  sendLessonRejectedEmail,
  sendOtpEmail,
  sendPasswordResetEmail,
  sendPaymentConfirmationEmail,
  sendPaymentManualReviewAlert,
  sendWelcomeEmail,
} from "../../lib/email/index"
import { renderVerificationEmail } from "../../lib/email/templates/verification"
import { renderWelcomeEmail } from "../../lib/email/templates/welcome"
import { renderPasswordResetEmail } from "../../lib/email/templates/password-reset"
import { renderEnrollmentConfirmationEmail } from "../../lib/email/templates/enrollment-confirmation"
import { renderPaymentConfirmationEmail } from "../../lib/email/templates/payment-confirmation"
import { renderLessonApprovedEmail, renderLessonRejectedEmail } from "../../lib/email/templates/curriculum-review"
import { renderPaymentManualReviewAlertEmail } from "../../lib/email/templates/payment-alert"
import {
  calculateExponentialBackoff,
  claimNotificationDispatch,
  DEFAULT_LEASE_DURATION_MS,
  findRecoverableDispatches,
  getNotificationDispatch,
  isReceiptAlreadyDispatched,
  markNotificationFailed,
  markNotificationSent,
  renewNotificationLease,
  MAX_NOTIFICATION_ATTEMPTS,
  notifyPaymentAndEnrollmentSuccess,
  resetNotificationIdempotencyForTesting,
} from "../../lib/email/index"
import { GET as handleRecoveryCron } from "../../app/api/cron/recover-notifications/route"
import { NextRequest } from "next/server"
import fs from "node:fs"
import path from "node:path"

// Save original environment
const originalEnv = { ...process.env }

function resetEnv() {
  process.env = { ...originalEnv }
}

test("1. getBrevoConfig reads Brevo environment variables and provides sensible defaults", () => {
  resetEnv()
  process.env.BREVO_API_KEY = "test-key-12345"
  process.env.BREVO_SENDER_EMAIL = "admissions@skillup-digitech.com.ng"
  process.env.BREVO_SENDER_NAME = "SkillUp Digitech Admissions"
  process.env.APP_URL = "https://skillup-digitech.com.ng"

  const config = getBrevoConfig()
  assert.equal(config.apiKey, "test-key-12345")
  assert.equal(config.senderEmail, "admissions@skillup-digitech.com.ng")
  assert.equal(config.senderName, "SkillUp Digitech Admissions")
  assert.equal(config.appUrl, "https://skillup-digitech.com.ng")
  assert.equal(config.isConfigured, true)
})

test("2. getBrevoConfig provides authenticated domain defaults when env vars are unset", () => {
  resetEnv()
  delete process.env.BREVO_API_KEY
  delete process.env.BREVO_SENDER_EMAIL
  delete process.env.BREVO_SENDER_NAME
  delete process.env.APP_URL
  delete process.env.NEXT_PUBLIC_APP_URL
  delete process.env.VERCEL_URL

  const config = getBrevoConfig()
  assert.equal(config.apiKey, undefined)
  assert.equal(config.senderEmail, "no-reply@skillup-digitech.com.ng")
  assert.ok(config.senderName.includes("SkillUp") || config.senderName.includes("Academy"))
  assert.equal(config.appUrl, "http://localhost:3000")
  assert.equal(config.isConfigured, false)
})

test("3. resolveAppUrl handles trailing slashes, Vercel preview URLs, and localhost fallback", () => {
  resetEnv()
  process.env.APP_URL = "https://skillup-digitech.com.ng///"
  assert.equal(resolveAppUrl(), "https://skillup-digitech.com.ng")

  delete process.env.APP_URL
  process.env.VERCEL_URL = "preview-deploy.vercel.app"
  assert.equal(resolveAppUrl(), "https://preview-deploy.vercel.app")
})

test("4. sendTransactionalEmail simulates dispatch safely when BREVO_API_KEY is missing", async () => {
  resetEnv()
  delete process.env.BREVO_API_KEY

  const result = await sendTransactionalEmail({
    to: "student@example.com",
    subject: "Test Simulation",
    html: "<p>Hello</p>",
  })

  assert.equal(result.success, true)
  assert.equal(result.simulated, true)
  assert.ok(result.messageId?.startsWith("simulated-"))
})

test("5. sendTransactionalEmail validates recipient list and rejects empty recipients", async () => {
  resetEnv()
  delete process.env.BREVO_API_KEY

  const result = await sendTransactionalEmail({
    to: [],
    subject: "No recipients",
    html: "<p>Hello</p>",
  })

  assert.equal(result.success, false)
  assert.equal(result.error, "No valid recipient email address provided.")
})

test("6. maskEmail masks user identities safely for logs", () => {
  assert.equal(maskEmail("john.doe@example.com"), "jo***e@example.com")
  assert.equal(maskEmail("a@b.com"), "a***@b.com")
  assert.equal(maskEmail("ab@b.com"), "a***@b.com")
  assert.equal(maskEmail("invalid-email"), "***")
  assert.equal(maskEmail(""), "***")
})

test("7. Verification template generates valid HTML with monospace OTP and security notice", () => {
  const { subject, html, text } = renderVerificationEmail({
    name: "Alex Johnson",
    otp: "847291",
  })

  assert.ok(subject.includes("847291"))
  assert.ok(html.includes("847291"))
  assert.ok(html.includes("Alex Johnson"))
  assert.ok(html.includes("skillup-digitech.com.ng"))
  assert.ok(html.includes("Single-use only"))
  assert.ok(text.includes("847291"))
})

test("8. Welcome template renders role-specific highlights for student, instructor, admin, finance", () => {
  const student = renderWelcomeEmail({ name: "Alex", role: "student" })
  assert.ok(student.html.includes("Student Account Active"))
  assert.ok(student.html.includes("dashboard"))

  const instructor = renderWelcomeEmail({ name: "Dr. Smith", role: "instructor" })
  assert.ok(instructor.html.includes("Faculty Workspace"))
  assert.ok(instructor.html.includes("instructor"))

  const admin = renderWelcomeEmail({ name: "Sarah", role: "admin" })
  assert.ok(admin.html.includes("Operations Workspace"))
  assert.ok(admin.html.includes("admin"))

  const finance = renderWelcomeEmail({ name: "Michael", role: "finance" })
  assert.ok(finance.html.includes("Finance & Reconciliation"))
  assert.ok(finance.html.includes("finance"))
})

test("9. Password reset template renders reset URL, 1-hour expiry, and backup code", () => {
  const { subject, html, text } = renderPasswordResetEmail({
    name: "Alex",
    resetUrl: "https://skillup-digitech.com.ng/reset-password?token=938472&email=alex@example.com",
    token: "938472",
  })

  assert.ok(subject.includes("password"))
  assert.ok(html.includes("938472"))
  assert.ok(html.includes("https://skillup-digitech.com.ng/reset-password?token=938472"))
  assert.ok(html.includes("1 hour"))
  assert.ok(text.includes("https://skillup-digitech.com.ng/reset-password"))
})

test("10. Enrollment confirmation template renders course details and action button", () => {
  const { subject, html, text } = renderEnrollmentConfirmationEmail({
    name: "Alex",
    courseTitle: "Full-Stack Web Development Bootcamp",
    courseSlug: "full-stack-web-development",
    trackName: "Software Engineering",
    instructorName: "Sarah Connor",
  })

  assert.ok(subject.includes("Full-Stack Web Development Bootcamp"))
  assert.ok(html.includes("Full-Stack Web Development Bootcamp"))
  assert.ok(html.includes("Sarah Connor"))
  assert.ok(html.includes("Start Learning Now"))
  assert.ok(text.includes("Full-Stack Web Development Bootcamp"))
})

test("11. Payment confirmation template renders reference, amount, currency, and date", () => {
  const { subject, html, text } = renderPaymentConfirmationEmail({
    name: "Alex",
    reference: "PAY-SKILLUP-88291",
    amount: 150000,
    currency: "NGN",
    paymentType: "course_enrollment",
    courseTitle: "Cloud Architecture Masterclass",
    channel: "card",
  })

  assert.ok(subject.includes("PAY-SKILLUP-88291"))
  assert.ok(html.includes("NGN 150,000.00"))
  assert.ok(html.includes("PAY-SKILLUP-88291"))
  assert.ok(html.includes("Cloud Architecture Masterclass"))
  assert.ok(html.includes("card"))
  assert.ok(text.includes("PAY-SKILLUP-88291"))
})

test("12. Curriculum review templates render approved and revision notices", () => {
  const approved = renderLessonApprovedEmail({
    name: "Instructor Alex",
    courseTitle: "Modern React & Next.js",
    lessonTitle: "Server Components Deep Dive",
  })
  assert.ok(approved.html.includes("approved"))
  assert.ok(approved.html.includes("Server Components Deep Dive"))

  const rejected = renderLessonRejectedEmail({
    name: "Instructor Alex",
    courseTitle: "Modern React & Next.js",
    lessonTitle: "Server Components Deep Dive",
    note: "Please provide a complete code sandbox repository link.",
  })
  assert.ok(rejected.html.includes("Revisions Requested"))
  assert.ok(rejected.html.includes("Please provide a complete code sandbox repository link."))
})

test("13. Payment manual review alert template renders discrepancy reasons for operations", () => {
  const { subject, html, text } = renderPaymentManualReviewAlertEmail({
    to: "finance@skillup-digitech.com.ng",
    reference: "PAY-FLAG-19283",
    amount: 50000,
    currency: "NGN",
    userEmail: "student@example.com",
    source: "webhook",
    reason: "Currency mismatch: expected NGN but gateway reported USD.",
  })

  assert.ok(subject.includes("PAY-FLAG-19283"))
  assert.ok(html.includes("Currency mismatch: expected NGN but gateway reported USD."))
  assert.ok(html.includes("PAY-FLAG-19283"))
  assert.ok(text.includes("Currency mismatch"))
})

test("14. High-level email helper functions dispatch without throwing", async () => {
  resetEnv()
  delete process.env.BREVO_API_KEY

  const otpRes = await sendOtpEmail({ to: "test@example.com", name: "Test User", otp: "123456" })
  assert.equal(otpRes.success, true)

  const welcomeRes = await sendWelcomeEmail({ to: "test@example.com", name: "Test User", role: "student" })
  assert.equal(welcomeRes.success, true)

  const resetRes = await sendPasswordResetEmail({
    to: "test@example.com",
    name: "Test User",
    resetUrl: "https://example.com/reset",
    token: "654321",
  })
  assert.equal(resetRes.success, true)

  const enrollRes = await sendEnrollmentConfirmationEmail({
    to: "test@example.com",
    name: "Test User",
    courseTitle: "Data Engineering",
  })
  assert.equal(enrollRes.success, true)

  const payRes = await sendPaymentConfirmationEmail({
    to: "test@example.com",
    name: "Test User",
    reference: "REF-123",
    amount: 10000,
    currency: "NGN",
  })
  assert.equal(payRes.success, true)

  const approveRes = await sendLessonApprovedEmail({
    to: "test@example.com",
    name: "Instructor",
    courseTitle: "AI",
    lessonTitle: "Intro",
  })
  assert.equal(approveRes.success, true)

  const rejectRes = await sendLessonRejectedEmail({
    to: "test@example.com",
    name: "Instructor",
    courseTitle: "AI",
    lessonTitle: "Intro",
    note: "Fix typo",
  })
  assert.equal(rejectRes.success, true)

  const alertRes = await sendPaymentManualReviewAlert({
    to: "finance@example.com",
    reference: "REF-FLAG",
    amount: 1000,
    currency: "USD",
    source: "verify",
    reason: "Amount mismatch",
  })
  assert.equal(alertRes.success, true)
})

test("15. notifyPaymentAndEnrollmentSuccess dispatches safely without failing callers on DB errors", async () => {
  resetEnv()
  delete process.env.BREVO_API_KEY

  const mockDb = {
    findUserById: async (id: string) => ({
      id,
      name: "Enrolled Student",
      email: "student@example.com",
    }),
    getCourseById: async (id: string) => ({
      id,
      title: "Cybersecurity Defense",
      slug: "cybersecurity-defense",
      category: "Security",
    }),
  }

  // Should execute cleanly without throwing
  await notifyPaymentAndEnrollmentSuccess({
    db: mockDb,
    userId: "user-123",
    reference: "REF-SUCCESS-001",
    amount: 75000,
    currency: "NGN",
    courseIds: ["course-cyber"],
    channel: "bank_transfer",
  })

  // Test with user without email: should not throw
  const mockDbNoEmail = {
    findUserById: async () => ({ id: "123", name: "No Email User" }),
  }
  await notifyPaymentAndEnrollmentSuccess({
    db: mockDbNoEmail,
    userId: "user-no-email",
    reference: "REF-SUCCESS-002",
    amount: 75000,
    currency: "NGN",
  })
})

test("16. assertServerOnly rejects execution in simulated browser environment", () => {
  // Simulate window object
  ;(globalThis as any).window = {}
  try {
    assert.throws(
      () => assertServerOnly(),
      /Brevo transactional email service must only be executed in a server environment/,
    )
  } finally {
    delete (globalThis as any).window
  }
})

test("17. sendTransactionalEmail catches Brevo client API failures and returns safe error result", async () => {
  resetEnv()
  process.env.BREVO_API_KEY = "xkeysib-invalid-mock-key-intended-to-fail"

  const result = await sendTransactionalEmail({
    to: "student@example.com",
    subject: "Test Invalid Key",
    html: "<p>Hello</p>",
  })

  // Should return success: false with error details and NOT throw an unhandled promise rejection
  assert.equal(result.success, false)
  assert.ok(typeof result.error === "string")
  assert.equal(result.canRetry, false)
})

test("18. In production, missing BREVO_API_KEY fails safely and NEVER enters simulated mode", async () => {
  resetEnv()
  ;(process.env as Record<string, string | undefined>).NODE_ENV = "production"
  delete process.env.BREVO_API_KEY

  const result = await sendTransactionalEmail({
    to: "student@example.com",
    subject: "Production Test",
    html: "<p>Hello</p>",
  })

  assert.equal(result.success, false)
  assert.equal(result.simulated, false)
  assert.ok(result.error?.includes("BREVO_API_KEY is required in production environment"))
  assert.equal(result.canRetry, false)
})

test("19. In production, resolveAppUrl NEVER silently falls back to localhost", () => {
  resetEnv()
  ;(process.env as Record<string, string | undefined>).NODE_ENV = "production"
  delete process.env.APP_URL
  delete process.env.NEXT_PUBLIC_APP_URL
  delete process.env.VERCEL_URL

  const resolved = resolveAppUrl()
  assert.equal(resolved, "https://skillup-digitech.com.ng")
  assert.equal(resolved.includes("localhost"), false)
})

test("20. In production, resolveAppUrl overrides mistakenly configured localhost URL", () => {
  resetEnv()
  ;(process.env as Record<string, string | undefined>).NODE_ENV = "production"
  process.env.APP_URL = "http://localhost:3000"

  const resolved = resolveAppUrl()
  assert.equal(resolved, "https://skillup-digitech.com.ng")
  assert.equal(resolved.includes("localhost"), false)
})

test("21. notifyPaymentAndEnrollmentSuccess deduplicates by payment reference", async () => {
  resetEnv()
  delete process.env.BREVO_API_KEY

  let dispatchCount = 0
  const mockDb = {
    findUserById: async (id: string) => ({
      id,
      name: "Enrolled Student",
      email: "student@example.com",
    }),
    getCourseById: async (id: string) => {
      dispatchCount++
      return {
        id,
        title: "Cloud Engineering",
        slug: "cloud-engineering",
        category: "Cloud",
      }
    },
  }

  const testRef = `DEDUP-TEST-${Date.now()}`

  // First call: should process
  await notifyPaymentAndEnrollmentSuccess({
    db: mockDb,
    userId: "user-dedup",
    reference: testRef,
    amount: 150000,
    currency: "NGN",
    courseIds: ["course-1"],
  })
  assert.equal(dispatchCount, 1)

  // Second call with same reference (e.g. webhook retry): should be skipped
  await notifyPaymentAndEnrollmentSuccess({
    db: mockDb,
    userId: "user-dedup",
    reference: testRef,
    amount: 150000,
    currency: "NGN",
    courseIds: ["course-1"],
  })
  // Course detail fetch count must NOT increment because it returned early on deduplication check
  assert.equal(dispatchCount, 1)
})

test("22. Persistent notification idempotency generates unique keys and tracks state", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const idempotencyKey = `payment_receipt:TST-IDEMP-${Date.now()}`
  const claimResult = await claimNotificationDispatch({
    idempotencyKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
    metadata: { reference: "TST-IDEMP-01" },
  })

  assert.equal(claimResult.claimed, true)
  assert.ok(claimResult.record)
  assert.equal(claimResult.record.status, "processing")
  assert.equal(claimResult.record.attempts, 1)

  // Status transitions to 'sent' (never 'delivered') upon completion
  await markNotificationSent(idempotencyKey, { messageId: "msg-123" })
  const saved = await getNotificationDispatch(idempotencyKey)
  assert.ok(saved)
  assert.equal(saved.status, "sent")
  assert.notEqual(saved.status, "delivered")
  assert.ok(saved.sentAt instanceof Date)

  // Subsequent claim is rejected as already sent
  const secondClaim = await claimNotificationDispatch({
    idempotencyKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
  })
  assert.equal(secondClaim.claimed, false)
  assert.equal(secondClaim.reason, "already_sent")
})

test("23. Concurrent webhook processing prevents duplicate notification dispatch", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const concurrentKey = `payment_receipt:CONCURRENT-${Date.now()}`

  // Simulate 5 concurrent webhook calls hitting the notification engine at the exact same moment
  const claims = await Promise.all([
    claimNotificationDispatch({
      idempotencyKey: concurrentKey,
      notificationType: "payment_receipt",
      recipientEmail: "concurrent@example.com",
    }),
    claimNotificationDispatch({
      idempotencyKey: concurrentKey,
      notificationType: "payment_receipt",
      recipientEmail: "concurrent@example.com",
    }),
    claimNotificationDispatch({
      idempotencyKey: concurrentKey,
      notificationType: "payment_receipt",
      recipientEmail: "concurrent@example.com",
    }),
    claimNotificationDispatch({
      idempotencyKey: concurrentKey,
      notificationType: "payment_receipt",
      recipientEmail: "concurrent@example.com",
    }),
    claimNotificationDispatch({
      idempotencyKey: concurrentKey,
      notificationType: "payment_receipt",
      recipientEmail: "concurrent@example.com",
    }),
  ])

  // Exactly ONE worker must win the claim
  const winners = claims.filter((c) => c.claimed === true)
  const losers = claims.filter((c) => c.claimed === false)

  assert.equal(winners.length, 1, "Exactly one concurrent worker must claim the dispatch lock")
  assert.equal(losers.length, 4, "Remaining workers must be safely rejected")
  for (const loser of losers) {
    assert.equal(loser.reason, "in_progress")
  }
})

test("24. Duplicate notification prevention across independent service instances", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const instanceKey = `enrollment:ENROLL-STABLE-999`

  // Instance A claims and completes notification dispatch
  const claimA = await claimNotificationDispatch({
    idempotencyKey: instanceKey,
    notificationType: "enrollment_confirmation",
    recipientEmail: "student@example.com",
  })
  assert.equal(claimA.claimed, true)
  await markNotificationSent(instanceKey, { instance: "instance-A" })

  // Instance B running on another serverless invocation attempts the same notification
  const claimB = await claimNotificationDispatch({
    idempotencyKey: instanceKey,
    notificationType: "enrollment_confirmation",
    recipientEmail: "student@example.com",
  })
  assert.equal(claimB.claimed, false)
  assert.equal(claimB.reason, "already_sent")
})

test("25. Failed notification retry transitions from 'failed' to 'processing'", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const retryKey = `payment_receipt:FAIL-RETRY-${Date.now()}`

  // Initial attempt claims and fails
  const attempt1 = await claimNotificationDispatch({
    idempotencyKey: retryKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
  })
  assert.equal(attempt1.claimed, true)
  assert.equal(attempt1.record?.attempts, 1)

  await markNotificationFailed(retryKey, "Brevo HTTP 503 Service Unavailable")

  const failedRecord = await getNotificationDispatch(retryKey)
  assert.equal(failedRecord?.status, "failed")
  assert.equal(failedRecord?.lastError, "Brevo HTTP 503 Service Unavailable")

  // Simulate backoff cooldown having elapsed
  if (failedRecord) {
    failedRecord.nextAttemptAt = new Date(Date.now() - 1000)
  }

  // Retry attempt (e.g. webhook redelivery or admin retry): MUST be permitted
  const attempt2 = await claimNotificationDispatch({
    idempotencyKey: retryKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
  })
  assert.equal(attempt2.claimed, true)
  assert.equal(attempt2.record?.status, "processing")
  assert.equal(attempt2.record?.attempts, 2, "Attempts count must increment on retry")

  // Successful send on retry
  await markNotificationSent(retryKey, { messageId: "retry-success-msg" })
  const finalRecord = await getNotificationDispatch(retryKey)
  assert.equal(finalRecord?.status, "sent")
})

test("26. Brevo API failure records failure state and returns safe error result", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  // Set an invalid key to provoke an authentic Brevo rejection
  process.env.BREVO_API_KEY = "xkeysib-invalid-test-key-triggering-failure"
  ;(process.env as Record<string, string | undefined>).NODE_ENV = "test"

  const failKey = `payment_receipt:BREVO-FAIL-${Date.now()}`
  const claim = await claimNotificationDispatch({
    idempotencyKey: failKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
  })
  assert.equal(claim.claimed, true)

  const result = await sendTransactionalEmail({
    to: "student@example.com",
    subject: "Failing Brevo Call",
    html: "<p>Test</p>",
  })

  assert.equal(result.success, false)
  assert.ok(result.error)

  await markNotificationFailed(failKey, result.error || "Unknown error")
  const recorded = await getNotificationDispatch(failKey)
  assert.equal(recorded?.status, "failed")
})

test("27. Repository verification: zero Resend imports or dependencies across entire codebase", () => {
  const rootDir = path.resolve(__dirname, "../..")

  // Check package.json
  const pkgPath = path.join(rootDir, "package.json")
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"))
  assert.equal(pkg.dependencies?.resend, undefined, "resend must NOT be in dependencies")
  assert.equal(pkg.devDependencies?.resend, undefined, "resend must NOT be in devDependencies")

  // Check package-lock.json if present
  const lockPath = path.join(rootDir, "package-lock.json")
  if (fs.existsSync(lockPath)) {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf-8"))
    assert.equal(lock.packages?.["node_modules/resend"], undefined, "resend package must NOT be in package-lock.json")
  }

  // Check source files in lib/email for any resend imports
  const emailDir = path.join(rootDir, "lib/email")
  const files = fs.readdirSync(emailDir)
  for (const file of files) {
    if (file.endsWith(".ts")) {
      const content = fs.readFileSync(path.join(emailDir, file), "utf-8")
      assert.equal(content.includes('from "resend"'), false, `${file} must not import from resend`)
      assert.equal(content.includes("from 'resend'"), false, `${file} must not import from resend`)
      assert.equal(content.includes("RESEND_API_KEY"), false, `${file} must not reference RESEND_API_KEY`)
    }
  }
})

test("28. Function crash after notification claim leaves unexpired lease blocking concurrent workers", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const crashKey = `payment_receipt:CRASH-${Date.now()}`

  // Worker 1 claims lease with 500ms duration
  const worker1Claim = await claimNotificationDispatch({
    idempotencyKey: crashKey,
    notificationType: "payment_receipt",
    recipientEmail: "worker1@example.com",
    leaseDurationMs: 500,
  })
  assert.equal(worker1Claim.claimed, true)
  assert.equal(worker1Claim.record?.status, "processing")
  assert.ok(worker1Claim.record?.leaseExpiresAt)

  // Worker 2 attempts to claim while Worker 1's lease is still active -> REJECTED
  const worker2Claim = await claimNotificationDispatch({
    idempotencyKey: crashKey,
    notificationType: "payment_receipt",
    recipientEmail: "worker2@example.com",
  })
  assert.equal(worker2Claim.claimed, false)
  assert.equal(worker2Claim.reason, "in_progress")
})

test("29. Expired processing lease is atomically recovered by subsequent worker", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const recoveryKey = `payment_receipt:RECOVER-${Date.now()}`

  // Worker 1 claims lease with short duration (50ms) and simulated crash (never finishes)
  const worker1Claim = await claimNotificationDispatch({
    idempotencyKey: recoveryKey,
    notificationType: "payment_receipt",
    recipientEmail: "crashed@example.com",
    leaseDurationMs: 50,
  })
  assert.equal(worker1Claim.claimed, true)

  // Wait for Worker 1's lease to expire
  await new Promise((resolve) => setTimeout(resolve, 75))

  // Worker 2 recovers the abandoned dispatch
  const worker2Claim = await claimNotificationDispatch({
    idempotencyKey: recoveryKey,
    notificationType: "payment_receipt",
    recipientEmail: "crashed@example.com",
  })

  assert.equal(worker2Claim.claimed, true, "Worker 2 must successfully recover the expired lease")
  assert.equal(worker2Claim.record?.attempts, 2, "Attempt count must increment on recovery")
  assert.equal(worker2Claim.record?.status, "processing")

  // Worker 2 finishes successfully
  await markNotificationSent(recoveryKey, { providerMessageId: "recovered-brevo-id-123" })
  const finalRecord = await getNotificationDispatch(recoveryKey)
  assert.equal(finalRecord?.status, "sent")
  assert.equal(finalRecord?.providerMessageId, "recovered-brevo-id-123")
  assert.equal(finalRecord?.leaseExpiresAt, null)
})

test("30. Retry after transient Brevo HTTP 429 enforces exponential backoff window", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const rateLimitKey = `payment_receipt:RATELIMIT-${Date.now()}`

  // Initial attempt
  const claim = await claimNotificationDispatch({
    idempotencyKey: rateLimitKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
  })
  assert.equal(claim.claimed, true)

  // Mark failed with HTTP 429 error
  await markNotificationFailed(rateLimitKey, "Brevo API rate limit exceeded (HTTP 429)", {
    currentAttempts: 1,
  })

  const failedRecord = await getNotificationDispatch(rateLimitKey)
  assert.equal(failedRecord?.status, "failed")
  assert.ok(failedRecord?.nextAttemptAt instanceof Date)
  assert.equal(failedRecord?.metadata?.isPermanentFailure, false)

  // Immediate retry attempt: MUST be rejected with 'backoff_active' because cooldown has not elapsed
  const earlyClaim = await claimNotificationDispatch({
    idempotencyKey: rateLimitKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
  })
  assert.equal(earlyClaim.claimed, false)
  assert.equal(earlyClaim.reason, "backoff_active")

  // Simulate cooldown expiry
  if (failedRecord) {
    failedRecord.nextAttemptAt = new Date(Date.now() - 1000)
  }

  // Now retry is permitted
  const readyClaim = await claimNotificationDispatch({
    idempotencyKey: rateLimitKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
  })
  assert.equal(readyClaim.claimed, true)
  assert.equal(readyClaim.record?.attempts, 2)
})

test("31. Retry after transient Brevo HTTP 5xx gateway error is discovered for recovery", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const gatewayErrorKey = `payment_receipt:GATEWAY504-${Date.now()}`

  const claim = await claimNotificationDispatch({
    idempotencyKey: gatewayErrorKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
  })
  assert.equal(claim.claimed, true)

  await markNotificationFailed(gatewayErrorKey, "Brevo HTTP 504 Gateway Timeout", {
    currentAttempts: 1,
  })

  const record = await getNotificationDispatch(gatewayErrorKey)
  assert.equal(record?.status, "failed")

  // Simulate backoff window passed
  if (record) {
    record.nextAttemptAt = new Date(Date.now() - 500)
  }

  const recoverable = await findRecoverableDispatches()
  const found = recoverable.find((r) => r.idempotencyKey === gatewayErrorKey)
  assert.ok(found, "5xx failed notification must be discovered in recoverable dispatches")
})

test("32. Permanent API errors are marked permanent and do NOT retry endlessly", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const permKey = `payment_receipt:PERM-FAIL-${Date.now()}`

  const claim = await claimNotificationDispatch({
    idempotencyKey: permKey,
    notificationType: "payment_receipt",
    recipientEmail: "invalid-syntax@bad",
  })
  assert.equal(claim.claimed, true)

  // Mark failed with permanent failure
  await markNotificationFailed(permKey, "400 Bad Request: Invalid email recipient syntax", {
    isPermanentFailure: true,
  })

  const record = await getNotificationDispatch(permKey)
  assert.equal(record?.status, "failed")
  assert.equal(record?.metadata?.isPermanentFailure, true)
  assert.equal(record?.nextAttemptAt, null)

  // Attempt to re-claim must be rejected as permanent_failure
  const retryClaim = await claimNotificationDispatch({
    idempotencyKey: permKey,
    notificationType: "payment_receipt",
    recipientEmail: "invalid-syntax@bad",
  })
  assert.equal(retryClaim.claimed, false)
  assert.equal(retryClaim.reason, "permanent_failure")

  // Must NOT appear in recoverable dispatches
  const recoverable = await findRecoverableDispatches()
  const found = recoverable.find((r) => r.idempotencyKey === permKey)
  assert.equal(found, undefined, "Permanent failures must never be scheduled for automated recovery")
})

test("33. Brevo acceptance followed by database update failure is handled via at-least-once recovery", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const uncertaintyKey = `payment_receipt:UNCERTAINTY-${Date.now()}`

  // Initial claim
  const claim1 = await claimNotificationDispatch({
    idempotencyKey: uncertaintyKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
    leaseDurationMs: 50,
  })
  assert.equal(claim1.claimed, true)

  // External Brevo API accepts and yields message ID
  const brevoAcceptedMessageId = "brevo-accepted-uuid-999"

  // Simulate: app crashes or DB connection drops before markNotificationSent can execute.
  // The row remains in status='processing'.
  await new Promise((resolve) => setTimeout(resolve, 75)) // lease expires

  // Outbox recovery claims the expired lease (at-least-once delivery recovery)
  const recoveryClaim = await claimNotificationDispatch({
    idempotencyKey: uncertaintyKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
  })
  assert.equal(recoveryClaim.claimed, true)
  assert.equal(recoveryClaim.record?.attempts, 2)

  // Second attempt successfully writes to DB
  await markNotificationSent(uncertaintyKey, {
    providerMessageId: brevoAcceptedMessageId,
  })

  const finalRecord = await getNotificationDispatch(uncertaintyKey)
  assert.equal(finalRecord?.status, "sent")
  assert.equal(finalRecord?.providerMessageId, brevoAcceptedMessageId)
})

test("34. Maximum retry enforcement rejects claims after MAX_NOTIFICATION_ATTEMPTS", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const maxRetryKey = `payment_receipt:MAX-RETRY-${Date.now()}`

  // Simulate 5 successive failures
  for (let attempt = 1; attempt <= MAX_NOTIFICATION_ATTEMPTS; attempt++) {
    const claim = await claimNotificationDispatch({
      idempotencyKey: maxRetryKey,
      notificationType: "payment_receipt",
      recipientEmail: "student@example.com",
    })
    assert.equal(claim.claimed, true)
    assert.equal(claim.record?.attempts, attempt)

    await markNotificationFailed(maxRetryKey, `Transient failure on attempt ${attempt}`, {
      currentAttempts: attempt,
      isPermanentFailure: false,
    })

    // Advance time past backoff
    const rec = await getNotificationDispatch(maxRetryKey)
    if (rec) rec.nextAttemptAt = new Date(Date.now() - 100)
  }

  // Attempt 6: MUST be rejected with max_retries_exceeded
  const excessiveClaim = await claimNotificationDispatch({
    idempotencyKey: maxRetryKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
  })

  assert.equal(excessiveClaim.claimed, false)
  assert.equal(excessiveClaim.reason, "max_retries_exceeded")
})

test("35. Duplicate Paystack webhook requests with concurrent races dispatch exactly once", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()
  delete process.env.BREVO_API_KEY

  const reference = `RACE-WEBHOOK-${Date.now()}`
  let emailDispatchCount = 0

  const mockDb = {
    findUserById: async (id: string) => ({ id, name: "Student", email: "student@example.com" }),
    getCourseById: async (id: string) => {
      emailDispatchCount++
      return { id, title: "DevOps Course", slug: "devops", category: "DevOps" }
    },
    getEnrollment: async () => ({ id: "enroll-race-1" }),
  }

  // Simulate 10 duplicate concurrent webhook deliveries
  await Promise.all(
    Array.from({ length: 10 }).map(() =>
      notifyPaymentAndEnrollmentSuccess({
        db: mockDb,
        userId: "user-race",
        reference,
        amount: 85000,
        currency: "NGN",
        courseIds: ["course-devops"],
      }),
    ),
  )

  // Exactly 1 initial fetch + dispatch must have occurred
  assert.equal(emailDispatchCount, 1)

  // Verify status is recorded as 'sent'
  const receiptRecord = await getNotificationDispatch(`payment_receipt:${reference}`)
  assert.equal(receiptRecord?.status, "sent")
})

test("36. Independent service instances sharing the same database prevent duplicate delivery", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()
  delete process.env.BREVO_API_KEY

  const sharedReference = `INSTANCE-SHARED-${Date.now()}`

  // Instance A dispatches payment notification
  const claimA = await claimNotificationDispatch({
    idempotencyKey: `payment_receipt:${sharedReference}`,
    notificationType: "payment_receipt",
    recipientEmail: "shared@example.com",
  })
  assert.equal(claimA.claimed, true)
  await markNotificationSent(`payment_receipt:${sharedReference}`, {
    providerMessageId: "brevo-instance-A-msg",
  })

  // Instance B in an isolated serverless process checks before dispatching
  const isDispatched = await isReceiptAlreadyDispatched(sharedReference)
  assert.equal(isDispatched, true)

  const claimB = await claimNotificationDispatch({
    idempotencyKey: `payment_receipt:${sharedReference}`,
    notificationType: "payment_receipt",
    recipientEmail: "shared@example.com",
  })
  assert.equal(claimB.claimed, false)
  assert.equal(claimB.reason, "already_sent")
})

test("37. Non-suppression: Legitimate new OTP and Password Reset requests are never suppressed", async () => {
  resetEnv()
  delete process.env.BREVO_API_KEY

  // 1. Multiple OTP requests (e.g. signup, then click Resend OTP)
  const otpResult1 = await sendOtpEmail({
    to: "student@example.com",
    name: "Student",
    otp: "111111",
  })
  const otpResult2 = await sendOtpEmail({
    to: "student@example.com",
    name: "Student",
    otp: "222222",
  })

  assert.equal(otpResult1.success, true)
  assert.equal(otpResult2.success, true)
  assert.equal(otpResult1.skipped, undefined, "Legitimate OTP requests must never be skipped")
  assert.equal(otpResult2.skipped, undefined, "Legitimate OTP requests must never be skipped")

  // 2. Multiple Password Reset requests over time
  const resetResult1 = await sendPasswordResetEmail({
    to: "student@example.com",
    name: "Student",
    resetUrl: "https://skillup-digitech.com.ng/reset?token=tok1",
    token: "tok1",
  })
  const resetResult2 = await sendPasswordResetEmail({
    to: "student@example.com",
    name: "Student",
    resetUrl: "https://skillup-digitech.com.ng/reset?token=tok2",
    token: "tok2",
  })

  assert.equal(resetResult1.success, true)
  assert.equal(resetResult2.success, true)
  assert.equal(resetResult1.skipped, undefined, "Legitimate password resets must never be skipped")
  assert.equal(resetResult2.skipped, undefined, "Legitimate password resets must never be skipped")
})

test("38. Stale claim token is rejected when marking a notification as sent", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const staleKey = `payment_receipt:STALE-SENT-${Date.now()}`

  // Worker 1 claims with very short lease (30ms)
  const worker1 = await claimNotificationDispatch({
    idempotencyKey: staleKey,
    notificationType: "payment_receipt",
    recipientEmail: "worker1@example.com",
    leaseDurationMs: 30,
  })
  assert.equal(worker1.claimed, true)
  const token1 = worker1.claimToken
  assert.ok(token1, "claimToken must be present on claim result")

  // Wait for Worker 1's lease to expire
  await new Promise((resolve) => setTimeout(resolve, 50))

  // Worker 2 recovers the expired lease and acquires a fresh claimToken
  const worker2 = await claimNotificationDispatch({
    idempotencyKey: staleKey,
    notificationType: "payment_receipt",
    recipientEmail: "worker2@example.com",
  })
  assert.equal(worker2.claimed, true)
  const token2 = worker2.claimToken
  assert.ok(token2)
  assert.notEqual(token1, token2, "Worker 2 must receive a new unique claimToken")

  // Stale Worker 1 wakes up and attempts to mark as sent with its expired token
  const staleSuccess = await markNotificationSent(staleKey, {
    claimToken: token1,
    providerMessageId: "stale-worker1-id",
  })
  assert.equal(staleSuccess, false, "Stale worker marking sent must be rejected")

  // Verify record is still processing under Worker 2
  const currentRecord = await getNotificationDispatch(staleKey)
  assert.equal(currentRecord?.status, "processing")
  assert.equal(currentRecord?.claimToken, token2)

  // Legitimate Worker 2 marks as sent with its valid token
  const validSuccess = await markNotificationSent(staleKey, {
    claimToken: token2,
    providerMessageId: "valid-worker2-id",
  })
  assert.equal(validSuccess, true, "Valid worker marking sent must succeed")

  const finalRecord = await getNotificationDispatch(staleKey)
  assert.equal(finalRecord?.status, "sent")
  assert.equal(finalRecord?.providerMessageId, "valid-worker2-id")
  assert.equal(finalRecord?.claimToken, null, "claimToken must be cleared upon terminal sent state")
})

test("39. Stale claim token is rejected when marking a notification as failed", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const staleFailKey = `payment_receipt:STALE-FAIL-${Date.now()}`

  // Worker 1 claims with 30ms lease
  const worker1 = await claimNotificationDispatch({
    idempotencyKey: staleFailKey,
    notificationType: "payment_receipt",
    recipientEmail: "worker1@example.com",
    leaseDurationMs: 30,
  })
  assert.equal(worker1.claimed, true)
  const token1 = worker1.claimToken

  // Wait for lease to expire
  await new Promise((resolve) => setTimeout(resolve, 50))

  // Worker 2 recovers lease
  const worker2 = await claimNotificationDispatch({
    idempotencyKey: staleFailKey,
    notificationType: "payment_receipt",
    recipientEmail: "worker2@example.com",
  })
  assert.equal(worker2.claimed, true)
  const token2 = worker2.claimToken

  // Stale Worker 1 attempts to mark failed with its old token
  const staleFailResult = await markNotificationFailed(staleFailKey, "Stale network timeout", {
    claimToken: token1,
  })
  assert.equal(staleFailResult, false, "Stale worker marking failed must be rejected")

  // Verify Worker 2's lease is undisturbed
  const currentRecord = await getNotificationDispatch(staleFailKey)
  assert.equal(currentRecord?.status, "processing")
  assert.equal(currentRecord?.claimToken, token2)

  // Worker 2 completes cleanly
  await markNotificationSent(staleFailKey, {
    claimToken: token2,
    providerMessageId: "worker2-clean-msg",
  })
  const finalRecord = await getNotificationDispatch(staleFailKey)
  assert.equal(finalRecord?.status, "sent")
})

test("40. Active lease renewal succeeds for owner and is rejected for stale workers", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const renewKey = `payment_receipt:RENEW-${Date.now()}`

  // Worker claims with 100ms lease
  const claim = await claimNotificationDispatch({
    idempotencyKey: renewKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
    leaseDurationMs: 100,
  })
  assert.equal(claim.claimed, true)
  const ownerToken = claim.claimToken

  // Stale/unauthorized worker attempts renewal -> REJECTED
  const invalidRenew = await renewNotificationLease(renewKey, "wrong-token-abc", 60000)
  assert.equal(invalidRenew, false, "Renewal with wrong claimToken must be rejected")

  // Legitimate owner extends lease by 30 seconds
  const validRenew = await renewNotificationLease(renewKey, ownerToken, 30000)
  assert.equal(validRenew, true, "Owner renewal with matching claimToken must succeed")

  const record = await getNotificationDispatch(renewKey)
  assert.ok(record?.leaseExpiresAt)
  assert.ok(record.leaseExpiresAt.getTime() > Date.now() + 20000)
})

test("41. Duplicate payment verification processing deduplicates safely", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()
  delete process.env.BREVO_API_KEY

  const reference = `VERIFY-DUP-${Date.now()}`
  let sendCount = 0

  const mockDb = {
    findUserById: async (id: string) => ({ id, name: "Student", email: "student@example.com" }),
    getCourseById: async (id: string) => {
      sendCount++
      return { id, title: "Cloud Architecture", slug: "cloud-arch", category: "Cloud" }
    },
    getEnrollment: async () => ({ id: "enroll-verify-1" }),
  }

  // 1. Initial verification trigger (e.g. from customer verify route)
  await notifyPaymentAndEnrollmentSuccess({
    db: mockDb,
    userId: "user-verify",
    reference,
    amount: 120000,
    currency: "NGN",
    courseIds: ["course-cloud"],
  })

  // 2. Duplicate verification trigger (e.g. from admin verify route or webhook arriving later)
  await notifyPaymentAndEnrollmentSuccess({
    db: mockDb,
    userId: "user-verify",
    reference,
    amount: 120000,
    currency: "NGN",
    courseIds: ["course-cloud"],
  })

  assert.equal(sendCount, 1, "Duplicate payment verification must not double-dispatch")
})

test("42. Legitimate repeated curriculum submissions and reviews are never suppressed", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()
  delete process.env.BREVO_API_KEY

  const courseId = "course-ai"
  const lessonId = "lesson-nlp"

  // 1. First submission rejection: revision 1
  const rev1Result = await sendLessonRejectedEmail({
    to: "instructor@example.com",
    name: "Instructor Jane",
    courseTitle: "AI & ML",
    lessonTitle: "Natural Language Processing",
    note: "Please expand section 2 with transformer examples.",
    idempotencyKey: `curriculum_review:${courseId}:${lessonId}:rev-1`,
  })
  assert.equal(rev1Result.success, true)
  assert.equal(rev1Result.skipped, undefined, "First revision rejection must not be skipped")

  // 2. Second submission rejection: revision 2 (after instructor updates content)
  const rev2Result = await sendLessonRejectedEmail({
    to: "instructor@example.com",
    name: "Instructor Jane",
    courseTitle: "AI & ML",
    lessonTitle: "Natural Language Processing",
    note: "Please fix audio sync in video asset.",
    idempotencyKey: `curriculum_review:${courseId}:${lessonId}:rev-2`,
  })
  assert.equal(rev2Result.success, true)
  assert.equal(rev2Result.skipped, undefined, "Second revision rejection must NOT be suppressed by earlier key")

  // 3. Final submission approval: revision 3
  const rev3Result = await sendLessonApprovedEmail({
    to: "instructor@example.com",
    name: "Instructor Jane",
    courseTitle: "AI & ML",
    lessonTitle: "Natural Language Processing",
    idempotencyKey: `lesson_approved:${courseId}:${lessonId}:rev-3`,
  })
  assert.equal(rev3Result.success, true)
  assert.equal(rev3Result.skipped, undefined, "Final approval must not be suppressed")

  // 4. Duplicate retry of revision 3 approval (e.g. double click) MUST be skipped
  const rev3Duplicate = await sendLessonApprovedEmail({
    to: "instructor@example.com",
    name: "Instructor Jane",
    courseTitle: "AI & ML",
    lessonTitle: "Natural Language Processing",
    idempotencyKey: `lesson_approved:${courseId}:${lessonId}:rev-3`,
  })
  assert.equal(rev3Duplicate.skipped, true, "Duplicate retry of the exact same moderation action must be deduplicated")
})

test("43. Recovery worker concurrency: Only one recovery worker claims an abandoned dispatch", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()

  const abandonKey = `payment_receipt:CONCURRENT-RECOVER-${Date.now()}`

  // Initial claim expires
  const initial = await claimNotificationDispatch({
    idempotencyKey: abandonKey,
    notificationType: "payment_receipt",
    recipientEmail: "student@example.com",
    leaseDurationMs: 20,
  })
  assert.equal(initial.claimed, true)

  await new Promise((resolve) => setTimeout(resolve, 40))

  // 5 recovery workers race to claim the expired lease
  const recoveryAttempts = await Promise.all(
    Array.from({ length: 5 }).map(() =>
      claimNotificationDispatch({
        idempotencyKey: abandonKey,
        notificationType: "payment_receipt",
        recipientEmail: "student@example.com",
      }),
    ),
  )

  const successfulClaims = recoveryAttempts.filter((res) => res.claimed)
  const rejectedClaims = recoveryAttempts.filter((res) => !res.claimed)

  assert.equal(successfulClaims.length, 1, "Exactly one recovery worker must acquire the claim")
  assert.equal(rejectedClaims.length, 4, "Remaining recovery workers must be rejected")
  for (const rejected of rejectedClaims) {
    assert.equal(rejected.reason, "in_progress")
  }
})

test("44. Scheduled recovery endpoint authentication guards access", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()
  process.env.CRON_SECRET = "super-secret-cron-token-xyz"
  ;(process.env as Record<string, string | undefined>).NODE_ENV = "test"

  // 1. Unauthenticated request -> 401 Unauthorized
  const unauthReq = new NextRequest("https://skillup-digitech.com.ng/api/cron/recover-notifications", {
    method: "GET",
  })
  const unauthRes = await handleRecoveryCron(unauthReq)
  assert.equal(unauthRes.status, 401)

  // 2. Request with invalid token -> 401
  const badReq = new NextRequest("https://skillup-digitech.com.ng/api/cron/recover-notifications", {
    method: "GET",
    headers: { authorization: "Bearer wrong-token" },
  })
  const badRes = await handleRecoveryCron(badReq)
  assert.equal(badRes.status, 401)

  // 3. Request with valid token -> 200 OK
  const validReq = new NextRequest("https://skillup-digitech.com.ng/api/cron/recover-notifications", {
    method: "GET",
    headers: { authorization: "Bearer super-secret-cron-token-xyz" },
  })
  const validRes = await handleRecoveryCron(validReq)
  assert.equal(validRes.status, 200)

  const body = await validRes.json()
  assert.equal(body.success, true)
  assert.equal(typeof body.discovered, "number")
  assert.equal(typeof body.reclaimed, "number")
})

test("45. Payment discrepancy alert isolates keys per recipient email", async () => {
  resetEnv()
  resetNotificationIdempotencyForTesting()
  delete process.env.BREVO_API_KEY

  const reference = `REF-ALERT-MULTI-${Date.now()}`

  // Admin recipient
  const res1 = await sendPaymentManualReviewAlert({
    to: "admin@skillup-digitech.com.ng",
    reference,
    amount: 50000,
    currency: "NGN",
    reason: "Currency mismatch detected",
    source: "webhook",
  })
  assert.equal(res1.success, true)
  assert.equal(res1.skipped, undefined, "First recipient must be dispatched")

  // Finance recipient for the same payment reference
  const res2 = await sendPaymentManualReviewAlert({
    to: "finance@skillup-digitech.com.ng",
    reference,
    amount: 50000,
    currency: "NGN",
    reason: "Currency mismatch detected",
    source: "webhook",
  })
  assert.equal(res2.success, true)
  assert.equal(res2.skipped, undefined, "Second recipient must NOT be dropped or skipped as duplicate")

  // Duplicate retry for admin recipient MUST be skipped
  const res1Duplicate = await sendPaymentManualReviewAlert({
    to: "admin@skillup-digitech.com.ng",
    reference,
    amount: 50000,
    currency: "NGN",
    reason: "Currency mismatch detected",
    source: "webhook",
  })
  assert.equal(res1Duplicate.skipped, true, "Duplicate retry to same recipient must be skipped")
})




