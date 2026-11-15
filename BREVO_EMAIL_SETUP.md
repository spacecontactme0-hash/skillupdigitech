# Brevo Transactional Email Integration Guide

**Platform:** SkillUp Digitech Academy  
**Authenticated Sending Domain:** `skillup-digitech.com.ng`  
**Official SDK:** `@getbrevo/brevo`  
**Service Location:** [`lib/email/`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/lib/email)  

---

## 1. Overview

SkillUp Digitech runs exclusively on **Brevo Transactional Email** via the official Node.js SDK (`@getbrevo/brevo`) to deliver secure, branded, responsive transactional emails across all technical training, authentication, and financial operations. All legacy Resend dependencies, configurations, and fallbacks have been completely retired.

### Integrated Application Workflows
1. **Email Verification (OTP):** Single-use 6-digit codes generated using cryptographically secure randomness (`crypto.randomInt`), valid for exactly **10 minutes**, bcrypt-hashed before storage in `pending_registrations.otp_hash`.
2. **Account Welcome:** Role-specific onboarding emails (Student, Instructor, Admin, Finance) dispatched upon email verification or administrative user creation.
3. **Password Recovery:** Time-limited (1-hour) reset emails featuring primary CTA buttons, direct links with canonical production domain resolution, and backup verification codes. Reset tokens are single-use and invalidated immediately upon password update.
4. **Course Enrollment Confirmation:** Dispatched when a student enrolls in a course or when auto-enrolled following payment.
5. **Payment Confirmation Receipt:** Electronic receipts containing Paystack transaction reference, currency-formatted amounts, payment channel, and item details.
6. **Curriculum Review Updates:** Automated notifications sent to faculty when lessons are approved or returned with revision notes.
7. **Payment Manual Review Alerts:** High-priority operations alerts dispatched to admins/finance when transaction discrepancies are detected.

---

## 2. Required Environment Variables

| Variable | Description | Example (Staging / Production) | Default Fallback |
| :--- | :--- | :--- | :--- |
| `BREVO_API_KEY` | Secret Brevo v3 API key (`xkeysib-...`) | `xkeysib-72c4300c...` | In dev/test: mock simulation; In prod: fails safely with critical error |
| `BREVO_SENDER_EMAIL` | Authenticated sender address | `no-reply@skillup-digitech.com.ng` | `no-reply@skillup-digitech.com.ng` |
| `BREVO_SENDER_NAME` | Sender display name | `SkillUp Digitech` | `SkillUp Digitech` |
| `APP_URL` | Canonical platform URL for email links | `https://skillup-digitech.com.ng` | In prod: canonical domain; In dev: `http://localhost:3000` |
| `OTP_EXPIRES_MINUTES` | OTP code lifetime in minutes | `10` | `10` |
| `OTP_RESEND_COOLDOWN_SECONDS` | Cooldown timer between OTP resends | `60` | `60` |

> [!IMPORTANT]
> **API Key Security:** `BREVO_API_KEY` is strictly a server-side secret guarded by `assertServerOnly()`. It is never prefixed with `NEXT_PUBLIC_` or exposed to client-side bundles.

---

## 3. Durable PostgreSQL Notification Idempotency & Abandoned Recovery Outbox

To guarantee **at-least-once dispatch with durable idempotency, duplicate mitigation, and automatic crash recovery** across Vercel serverless functions, multi-region workers, and concurrent Paystack webhook retries, SkillUp Digitech implements a durable PostgreSQL-backed outbox mechanism via the `notification_dispatches` table (migrations `0004_durable_notifications.sql`, `0005_abandoned_recovery.sql`, and `0006_claim_ownership_fencing.sql`):

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

### Key Idempotency & Recovery Mechanics
1. **Unique Business-Event Idempotency Keys:**
   - Payment receipts: `payment_receipt:${reference}` (preserves Paystack reference)
   - Course enrollments: `enrollment:${enrollment.id}` (stable enrollment ID)
   - Onsite enrollments: `enrollment:onsite:${reference}`
   - Welcome notifications: `welcome:${userId}:${role}`
   - Curriculum reviews: `lesson_approved:${courseId}:${lessonId}:${revision}` and `curriculum_review:${courseId}:${lessonId}:${revision}` (includes revision number so resubmissions are never blocked)
   - Operations alerts: `payment_alert:${reference}:${recipientEmail}` (isolated per recipient)
2. **Claim Ownership Fencing (`claim_token`):** Every claim generates a cryptographically random `claim_token`. Completing (`markNotificationSent`) or failing (`markNotificationFailed`) requires matching the active token. Stale or superseded workers cannot corrupt state.
3. **Safe Lease Renewal:** Active workers can extend their lease via `renewNotificationLease` while dispatches are in progress.
4. **Abandoned Crash Recovery & Vercel Cron:** If a serverless function crashes, the 120-second lease expires. The automated recovery endpoint (`/api/cron/recover-notifications`), scheduled via `vercel.json` every 5 minutes and protected by `CRON_SECRET`, recovers expired leases and retries transient failures.
5. **Exponential Backoff & Safe Retries:** Transient Brevo failures (HTTP 429 / 5xx) trigger exponential backoff (`next_attempt_at = now + 1s * 2^(attempts-1)`, max 60s) up to `MAX_NOTIFICATION_ATTEMPTS = 5`.
6. **Permanent Error Fast-Fail:** Non-retryable errors (e.g. invalid recipient syntax, HTTP 400) are marked `isPermanentFailure: true` and never retried endlessly.
7. **No Open Transactions During External Calls:** Slot claiming occurs in an isolated, immediate query. The external Brevo HTTP API call runs outside of any database transaction. Completion state is committed in a separate atomic query.
8. **Sent vs. Delivered Distinction & Message IDs:** Notifications are marked `'sent'` upon Brevo API acceptance and store Brevo's message identifier in `provider_message_id`. They are never prematurely marked `'delivered'`.
9. **Ephemeral OTP & Password Reset Preservation:** OTP codes and password reset emails remain ephemeral real-time dispatches with zero suppression.

---

## 4. Local Development Testing

### 4.1 Simulated Mode (Zero Configuration)
If `BREVO_API_KEY` is not present in `.env.local` during development:
- The service automatically runs in **Simulated Mode**.
- No external HTTP requests are made to Brevo.
- Structured dispatch metadata is logged to the console with recipient emails masked:
  ```text
  [EMAIL][INFO] BREVO_API_KEY not set — Simulating email dispatch (Development/Test Mode) {"subject":"Your SkillUp Digitech verification code: 849201","recipients":["st***t@example.com"]}
  ```
- Functions return `{ success: true, simulated: true, messageId: "simulated-..." }`.
- In `NODE_ENV === "production"`, simulation is strictly blocked and rejected with an explicit error.

### 4.2 Live Testing with Brevo API Key
To send real test emails during development:
1. Ensure your sender domain (`skillup-digitech.com.ng`) is authenticated in your [Brevo Dashboard](https://app.brevo.com/).
2. Add your Brevo API key to `.env.local`:
   ```bash
   BREVO_API_KEY="xkeysib-your-real-key"
   BREVO_SENDER_EMAIL="no-reply@skillup-digitech.com.ng"
   BREVO_SENDER_NAME="SkillUp Digitech"
   APP_URL="http://localhost:3000"
   ```
3. Start the dev server: `npm run dev`

---

## 5. Production Vercel Configuration

1. Open your project on the [Vercel Dashboard](https://vercel.com).
2. Navigate to **Settings &rarr; Environment Variables**.
3. Add the following variables:
   - `BREVO_API_KEY`: Your production Brevo API Key (`xkeysib-...`).
   - `BREVO_SENDER_EMAIL`: `no-reply@skillup-digitech.com.ng`.
   - `BREVO_SENDER_NAME`: `SkillUp Digitech`.
   - `APP_URL`: `https://skillup-digitech.com.ng`.
   - `OTP_EXPIRES_MINUTES`: `10`.
   - `OTP_RESEND_COOLDOWN_SECONDS`: `60`.
4. Deploy the application.

---

## 6. Architecture & Code Structure

The Brevo integration is modularized under [`lib/email/`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/lib/email):

```
lib/email/
├── index.ts                     # Public API and high-level workflow functions
├── client.ts                    # BrevoClient initialization and server-only protection
├── service.ts                   # Core sendTransactionalEmail implementation & backoff retries
├── idempotency.ts               # PostgreSQL-backed durable notification outbox & atomic locking
├── logger.ts                    # Email masking and token redaction logging
├── types.ts                     # TypeScript definitions for requests, results, and params
├── notifications.ts             # Orchestration for payment + enrollment workflows
└── templates/
    ├── base.ts                  # Responsive HTML container layout & CTA button
    ├── welcome.ts               # Student, Instructor, Admin, Finance onboarding
    ├── verification.ts          # Large monospace OTP verification code (10-min expiry)
    ├── password-reset.ts        # Secure reset button & fallback link (1-hr expiry)
    ├── enrollment-confirmation.ts # Course enrollment details and direct course link
    ├── payment-confirmation.ts  # Electronic payment receipt & reference
    ├── curriculum-review.ts     # Lesson approved / revisions requested notices
    └── payment-alert.ts         # High-priority payment discrepancy operations alert
```
