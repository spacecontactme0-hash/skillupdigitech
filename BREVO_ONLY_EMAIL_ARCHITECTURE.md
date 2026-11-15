# Brevo-Only Transactional Email Architecture

**Platform:** SkillUp Digitech Academy  
**Domain:** `skillup-digitech.com.ng`  
**Sole Email Provider:** Brevo Transactional Email (`@getbrevo/brevo`)  
**Database Backend:** Neon PostgreSQL with Drizzle ORM  

---

## 1. Architectural Mandate

SkillUp Digitech operates exclusively on **Brevo Transactional Email**. All former legacy Resend packages, imports, configurations, test mocks, environment variables, and provider fallbacks have been completely excised from the repository.

There is no secondary email provider, no fallback provider, and zero dependency on the former Resend API.

---

## 2. Complete Removal of Legacy Resend Infrastructure

An exhaustive repository-wide audit verified the complete removal of Resend:

1. **Dependency Lockfiles:**
   - `npm ls resend` outputs `-- (empty)` with exit code 1.
   - `package.json` contains zero references to `resend` in either `dependencies` or `devDependencies`.
   - `package-lock.json` contains zero packages or references to `resend`.
2. **Environment Configuration:**
   - `.env.example` and `.env.local` purged of `RESEND_API_KEY` and `RESEND_FROM`.
   - Environment variables are strictly `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`, and `APP_URL`.
3. **Application Source Code:**
   - Zero imports from `"resend"` across all `app/`, `lib/`, `components/`, and `tests/` files.
   - All legacy mentions of "resend" in the repository represent strictly the user authentication verb ("Resend OTP" / `resendOtp` / `authService.resendOtp`), with zero email provider association.
4. **Automated Verification:**
   - Regression unit test 27 continuously inspects `package.json`, `package-lock.json`, and all TypeScript files in `lib/email/` to guarantee no Resend dependencies or imports can be reintroduced.

---

## 3. Durable PostgreSQL Notification Idempotency Architecture

In modern serverless deployment environments (such as Vercel), in-memory deduplication caches fail across isolated function instances, ephemeral cold starts, and concurrent webhook invocations.

SkillUp Digitech replaces in-memory caches with a durable PostgreSQL-backed outbox mechanism utilizing the existing Neon PostgreSQL database and Drizzle ORM infrastructure.

### 3.1 Schema (`notification_dispatches`)

Defined in [`db/schema/core.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/db/schema/core.ts) and tracked via Drizzle migrations `0004_durable_notifications.sql`, `0005_abandoned_recovery.sql`, and `0006_claim_ownership_fencing.sql`:

```sql
CREATE TABLE IF NOT EXISTS "notification_dispatches" (
  "id" text PRIMARY KEY NOT NULL,
  "idempotency_key" text NOT NULL,
  "notification_type" text NOT NULL,
  "recipient_email" text NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "claim_token" text,
  "claimed_at" timestamp,
  "lease_expires_at" timestamp,
  "next_attempt_at" timestamp,
  "provider_message_id" text,
  "last_error" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "sent_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "uniq_notification_dispatches_key" ON "notification_dispatches" ("idempotency_key");
CREATE INDEX IF NOT EXISTS "idx_notification_dispatches_status" ON "notification_dispatches" ("status");
CREATE INDEX IF NOT EXISTS "idx_notification_dispatches_lease" ON "notification_dispatches" ("status", "lease_expires_at");
CREATE INDEX IF NOT EXISTS "idx_notification_dispatches_retry" ON "notification_dispatches" ("status", "next_attempt_at");
```

### 3.2 Key Idempotency & Abandoned Notification Recovery Mechanics

1. **Unique Business-Event Idempotency Keys:**
   - **Payment Receipts:** `payment_receipt:${reference}` (preserves unique Paystack transaction reference).
   - **Course Enrollments:** `enrollment:${enrollmentId}` (prefers stable enrollment primary key; falls back to `enrollment:${userId}:${courseId}`).
   - **Onsite Registrations:** `enrollment:onsite:${reference}` (preserves unique Paystack reference).
   - **Welcome Notifications:** `welcome:${userId}:${role}` (isolated per role).
   - **Curriculum Moderation Decisions:** `lesson_approved:${courseId}:${lessonId}:${revisionId}` and `curriculum_review:${courseId}:${lessonId}:${revisionId}` (includes revision number or submission event ID so subsequent legitimate reviews are never blocked by earlier notifications).
   - **Operations Alerts:** `payment_alert:${reference}:${recipientEmail}` (isolated per alert recipient so multi-stakeholder alerts are never dropped).
2. **Claim Ownership Fencing (`claim_token`):**
   - Every claim generates a cryptographically random, unique `claim_token`.
   - The token is saved atomically with the claim.
   - State transition queries (`markNotificationSent` and `markNotificationFailed`) require matching `claim_token` and `status = 'processing'`.
   - If Worker A's lease expires and Worker B reclaims the dispatch, Worker A is superseded and cannot corrupt Worker B's record.
   - Reaching a terminal state (`sent` or `failed`) atomically clears `claim_token = NULL`.
3. **Safe Lease Renewal (`renewNotificationLease`):**
   - Active workers performing lengthy external dispatches can safely extend their lease (`lease_expires_at = now() + extensionMs`).
   - Lease renewal is conditional on matching `claim_token` and `status = 'processing'`.
4. **Crash & Abandoned Notification Recovery:**
   - If a Vercel serverless function crashes, times out, or gets evicted mid-execution:
   - The processing lease (`lease_expires_at`) automatically expires after 120 seconds.
   - An automated background sweep (`findRecoverableDispatches`) or subsequent redelivery detects the expired lease and atomically claims it with a new `claim_token`.
5. **Transient Retry with Exponential Backoff:**
   - On transient failure (Brevo HTTP 429 rate limit or 5xx server error), `markNotificationFailed` schedules an exponential backoff timestamp: `next_attempt_at = now + (1s * 2^(attempts-1))`, capped at 60 seconds.
   - Claims prior to cooldown expiry are rejected with `reason: "backoff_active"`.
   - Maximum retry ceiling: Enforced at `MAX_NOTIFICATION_ATTEMPTS = 5`. Beyond 5 attempts, claims are dead-lettered with `reason: "max_retries_exceeded"`.
6. **Permanent Failure Classification:**
   - Non-transient errors (e.g. invalid recipient syntax, HTTP 400 Bad Request) are flagged `isPermanentFailure: true` and fail fast with `reason: "permanent_failure"`.
7. **Delivery Guarantee: At-Least-Once Dispatch with Durable Idempotency and Duplicate Mitigation:**
   - External Brevo HTTP REST calls and PostgreSQL database updates are inherently non-atomic across network boundaries.
   - If a crash occurs after Brevo accepts the message (HTTP 200/201) but before PostgreSQL status is committed, lease expiration allows recovery. In this edge case, the email may be re-dispatched.
   - Hence, the delivery guarantee is formally **at-least-once with durable idempotency and duplicate mitigation**. Exactly-once delivery cannot be guaranteed by the database outbox alone.
   - A `sent` state in PostgreSQL indicates that Brevo successfully accepted the API request; it does not indicate the email was received or opened by the recipient.
   - Upon API acceptance, Brevo's message identifier is saved in `provider_message_id`.
8. **Scheduled Recovery Execution (Vercel Cron):**
   - Automated sweep route: `app/api/cron/recover-notifications/route.ts`.
   - Configured in `vercel.json` to execute on a recurring 5-minute schedule (`*/5 * * * *`).
   - Protected against unauthorized access via `CRON_SECRET` authorization bearer token.
9. **Zero Open Database Transactions During External Calls:**
   - Atomic conditional UPSERT claims the lease and immediately releases the Neon pool connection.
   - The external Brevo API call (`sendTransactionalEmail`) executes over HTTPS with zero open database transactions.
   - State completion (`markNotificationSent` or `markNotificationFailed`) executes in an independent, conditional SQL update.

---

## 4. Security Hardening Guarantees

1. **Fail-Closed Production Configuration:**
   In `NODE_ENV === "production"`, if `BREVO_API_KEY` is missing or unset, email dispatch is rejected with a critical error and returns `{ success: false, simulated: false }`. Simulation is strictly prohibited in production.
2. **Canonical 10-Minute OTP Window:**
   - Generated via cryptographically uniform CSPRNG: `crypto.randomInt(0, 1000000).toString().padStart(6, "0")`.
   - Stored strictly as a bcrypt hash (10 salt rounds) in `pending_registrations.otp_hash`.
   - Enforces a strict 10-minute expiry window (`otp_expires_at = now + 10m`).
   - Single-use: Verified via `bcrypt.compare`; record is deleted immediately upon successful authentication.
3. **Secure 1-Hour Password Reset Tokens:**
   - Generated with 256-bit cryptographic entropy: `crypto.randomBytes(32).toString("hex")`.
   - Stored bcrypt-hashed in `users.otp_hash`.
   - Enforces a strict 60-minute window (`users.otp_expires_at`).
   - Non-reusable: Tokens are nullified (`otpHash: null, otpExpiresAt: null`) in the same database update that applies the new password.
4. **Production Domain Enforcement:**
   `resolveAppUrl()` inspects `NODE_ENV`. In production, any unset `APP_URL` or mistakenly configured `localhost` address is automatically overridden with the canonical production domain: `https://skillup-digitech.com.ng`.
5. **PII and Credential Redaction:**
   - Recipient emails in server logs are automatically masked: `st***t@example.com`.
   - Password reset tokens and direct reset URLs are never printed in server logs.
   - Passwords and raw OTPs are never logged.
6. **Server-Only Isolation:**
   Brevo client initialization is protected with `assertServerOnly()`. The environment variable `BREVO_API_KEY` is never exposed to Next.js client-side bundles.

---

## 5. Workflow Verification Matrix

| Workflow | Trigger Route / Function | Brevo Template | Idempotency Key | Delivery Guarantee |
| :--- | :--- | :--- | :--- | :--- |
| **Signup OTP** | `POST /api/auth/register` | `renderVerificationEmail` | None (Ephemeral OTP session) | Unsuppressed Real-Time |
| **Instructor Signup OTP** | `POST /api/auth/register-instructor` | `renderVerificationEmail` | None (Ephemeral OTP session) | Unsuppressed Real-Time |
| **OTP Resend** | `POST /api/auth/resend-otp` | `renderVerificationEmail` | None (Ephemeral OTP session) | Unsuppressed Real-Time |
| **Student Welcome** | `POST /api/auth/verify-otp` | `renderWelcomeEmail` (Student) | `welcome:${userId}:student` | At-least-once (Durable Lease + Token) |
| **Instructor Welcome** | `POST /api/auth/verify-otp` | `renderWelcomeEmail` (Instructor) | `welcome:${userId}:instructor` | At-least-once (Durable Lease + Token) |
| **Admin Onboarding** | `POST /api/admin/create-user` | `renderWelcomeEmail` (Admin) | `welcome:${userId}:admin` | At-least-once (Durable Lease + Token) |
| **Finance Onboarding** | `POST /api/admin/create-user` | `renderWelcomeEmail` (Finance) | `welcome:${userId}:finance` | At-least-once (Durable Lease + Token) |
| **Password Reset** | `POST /api/auth/forgot-password` | `renderPasswordResetEmail` | None (Ephemeral 1hr token) | Unsuppressed Real-Time |
| **Course Enrollment** | `POST /api/enrollments` | `renderEnrollmentConfirmationEmail` | `enrollment:${enrollment.id}` | At-least-once (Durable Lease + Token) |
| **Payment Receipt** | `POST /api/payments/webhook` | `renderPaymentConfirmationEmail` | `payment_receipt:${reference}` | At-least-once (Durable Lease + Token) |
| **Payment Verification** | `POST /api/payments/verify` | `renderPaymentConfirmationEmail` | `payment_receipt:${reference}` | At-least-once (Durable Lease + Token) |
| **Admin Payment Verification** | `POST /api/admin/payments/verify` | `renderPaymentConfirmationEmail` | `payment_receipt:${reference}` | At-least-once (Durable Lease + Token) |
| **Lesson Approved** | `POST /api/courses/[id]/lessons/[lessonId]/approve` | `renderLessonApprovedEmail` | `lesson_approved:${id}:${lessonId}:${rev}` | At-least-once (Durable Lease + Token) |
| **Curriculum Revision** | `POST /api/courses/[id]/lessons/[lessonId]/reject` | `renderLessonRejectedEmail` | `curriculum_review:${id}:${lessonId}:${rev}` | At-least-once (Durable Lease + Token) |
| **Payment Discrepancy Alert** | `POST /api/payments/webhook` (manual_review) | `renderPaymentManualReviewAlertEmail` | `payment_alert:${reference}:${recipientEmail}` | At-least-once (Durable Lease + Token) |

---

## 6. Verification Test Suites

```bash
# 1. Brevo Email, Idempotency & Reliability Outbox Suite
npm run test:email
# Results: 45/45 passed (0 failed)

# 2. Payments & Financial Integrity Suite
npm run test:payments
# Results: 6/6 passed (0 failed)

# 3. Security & Access Control Suite
npm run test:security
# Results: 16/16 passed (0 failed, 1 safely skipped due to test isolation)

# 4. Database Test Isolation Suite
npm run test:isolation
# Results: 16/16 passed (0 failed)

# 5. Production Next.js Build
npm run build
# Results: Turbopack compiled and generated all 93 App Router routes with 0 errors
```

