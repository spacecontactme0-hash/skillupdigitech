# Brevo Outbox Final Reliability Audit & Production Hardening Report

**Platform:** SkillUp Digitech Academy  
**Production Domain:** `https://skillup-digitech.com.ng`  
**Sole Email Provider:** Brevo Transactional Email exclusively (`@getbrevo/brevo`)  
**Database Backend:** Neon PostgreSQL with Drizzle ORM  
**Audit Date:** 2026-11-13  
**Audit Status:** Fully Implemented, Tested, Verified, and Ready for Production

---

## 1. Existing Architecture Inspected

The repository was comprehensively inspected across database schemas, API routes, email dispatch logic, and test suites:

- **Database Schemas & Migrations:**
  - [`db/schema/core.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/db/schema/core.ts)
  - [`db/migrations/0004_durable_notifications.sql`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/db/migrations/0004_durable_notifications.sql)
  - [`db/migrations/0005_abandoned_recovery.sql`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/db/migrations/0005_abandoned_recovery.sql)
- **Centralized Email & Idempotency Services:**
  - [`lib/email/idempotency.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/lib/email/idempotency.ts)
  - [`lib/email/notifications.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/lib/email/notifications.ts)
  - [`lib/email/service.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/lib/email/service.ts)
  - [`lib/email/client.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/lib/email/client.ts)
  - [`lib/email/index.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/lib/email/index.ts)
- **Payment & Enrollment Webhook / Verification Routes:**
  - `app/api/payments/webhook/route.ts`
  - `app/api/payments/verify/route.ts`
  - `app/api/admin/payments/verify/route.ts`
  - `app/api/enrollments/route.ts`
- **Academic Review & Authentication Routes:**
  - `app/api/courses/[id]/lessons/[lessonId]/approve/route.ts`
  - `app/api/courses/[id]/lessons/[lessonId]/reject/route.ts`
  - `app/api/auth/verify-otp/route.ts`
  - `app/api/admin/create-user/route.ts`

---

## 2. Issues Discovered During Audit

Prior to this hardening cycle, five key reliability vulnerabilities and gaps were identified:

1. **Vulnerability to Stale / Superseded Workers (Missing Fencing Tokens):**
   - While `notification_dispatches` tracked `status`, `claimed_at`, and `lease_expires_at`, it lacked a `claim_token` fencing mechanism.
   - If Worker A claimed a 120s lease, experienced an execution delay or network stall exceeding 120s, and Worker B recovered the expired lease, Worker A could later wake up and execute `markNotificationSent` or `markNotificationFailed`. Because updates only matched `WHERE idempotency_key = $1`, Worker A could overwrite Worker B's active lease or state.
2. **Missing Lease Renewal Mechanism:**
   - There was no mechanism (`renewNotificationLease`) allowing an in-flight worker executing a lengthy Brevo request to extend its lease before the 120-second lease expired, creating an edge-case risk of dual execution.
3. **Absence of Scheduled Production Recovery Invocation:**
   - `findRecoverableDispatches` was implemented in the library, but no Vercel Cron or scheduled background job existed to routinely discover and reprocess abandoned records in production.
4. **Idempotency Key Collisions / Premature Suppression:**
   - **Payment Discrepancy Alerts:** The default alert idempotency key was `payment_alert:${params.reference}` without recipient email differentiation. When multi-recipient alerts were dispatched (e.g. admin, finance, and support), the first recipient claimed the lock and all subsequent recipients were skipped as duplicates.
   - **Curriculum Moderation:** Lesson approvals and rejections used static keys (`lesson_approved:${id}:${lessonId}` and `curriculum_review:${id}:${lessonId}`). If an instructor received a rejection, edited their lesson, and resubmitted, subsequent reviews were permanently suppressed by the earlier key.
5. **Legacy Provider Artifact:**
   - `lib/email/client.ts` contained an unneeded fallback to `process.env.RESEND_FROM`.

---

## 3. Changes Implemented

1. **Claim Ownership Fencing (`claim_token`):**
   - Added `claim_token text` column to `notification_dispatches`.
   - On every claim (fresh or recovered), a unique cryptographically uniform token is generated (`randomUUID()`) and saved atomically with the claim.
   - Updated `markNotificationSent` and `markNotificationFailed` to execute conditional SQL updates requiring matching `claim_token` and `status = 'processing'`. Superseded workers receive 0 updated rows and return `false`.
   - Clears `claim_token = NULL` upon terminal state transition (`sent` or `failed`).
2. **Safe Lease Renewal (`renewNotificationLease`):**
   - Implemented conditional atomic lease renewal:
     ```sql
     UPDATE notification_dispatches
     SET lease_expires_at = now() + ($3 || ' milliseconds')::interval, updated_at = now()
     WHERE idempotency_key = $1 AND claim_token = $2 AND status = 'processing'
     RETURNING id;
     ```
3. **Scheduled Recovery Endpoint & Vercel Cron:**
   - Created [`app/api/cron/recover-notifications/route.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/app/api/cron/recover-notifications/route.ts) with `CRON_SECRET` authorization bearer protection.
   - Created [`vercel.json`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/vercel.json) configuring a recurring 5-minute cron schedule (`*/5 * * * *`).
4. **Idempotency Key Corrections:**
   - **Payment Discrepancy Alerts:** Isolated per recipient: `payment_alert:${reference}:${recipientEmail.toLowerCase()}`.
   - **Curriculum Moderation:** Scoped with revision metadata: `lesson_approved:${id}:${lessonId}:${revisionId}` and `curriculum_review:${id}:${lessonId}:${revisionId}`.
   - **Enrollment Confirmations:** Strictly prefers stable enrollment primary key: `enrollment:${enrollment.id}`.
5. **Resend Purge:**
   - Removed `process.env.RESEND_FROM` from `lib/email/client.ts`. Zero references to Resend remain.

---

## 4. Database Schema and Migration Changes

The schema was non-destructively updated across Drizzle definitions, journal metadata, and SQL files:

### Migration Chain
1. `0000_smooth_boomerang.sql`
2. `0001_next_randall.sql`
3. `0002_wet_skin.sql`
4. `0003_equal_molly_hayes.sql`
5. `0004_durable_notifications.sql`
6. `0005_abandoned_recovery.sql`
7. [`0006_claim_ownership_fencing.sql`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/db/migrations/0006_claim_ownership_fencing.sql)

```sql
-- db/migrations/0006_claim_ownership_fencing.sql
ALTER TABLE "notification_dispatches" ADD COLUMN IF NOT EXISTS "claim_token" text;
```

Tracked in [`db/migrations/meta/_journal.json`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/db/migrations/meta/_journal.json) at entry index 6.

---

## 5. Claim Ownership and Lease Behavior

| Action | Condition Required | State Transition | Fencing Action |
| :--- | :--- | :--- | :--- |
| **Fresh Claim** | Row does not exist | `status = 'processing'`, `attempts = 1` | Generates & stores new `claim_token` |
| **Expired Lease Recovery** | `status = 'processing' AND lease_expires_at < now()` | `status = 'processing'`, `attempts = attempts + 1` | Replaces `claim_token` atomically |
| **Retry Failed Dispatch** | `status = 'failed' AND attempts < 5 AND next_attempt_at <= now()` | `status = 'processing'`, `attempts = attempts + 1` | Issues fresh `claim_token` |
| **Mark Sent** | `status = 'processing' AND claim_token = :token` | `status = 'sent'`, `sent_at = now()` | Sets `claim_token = NULL`, clears lease |
| **Mark Failed** | `status = 'processing' AND claim_token = :token` | `status = 'failed'`, `last_error = :msg` | Sets `claim_token = NULL`, clears lease |
| **Stale Worker Attempt** | `claim_token != :activeToken OR status != 'processing'` | No-op (0 rows updated) | Returns `false`, logs warning |
| **Lease Renewal** | `status = 'processing' AND claim_token = :token` | Extends `lease_expires_at` | Preserves active `claim_token` |

---

## 6. Recovery Scheduling Configuration

### Production Route
- **URL Path:** `/api/cron/recover-notifications`
- **Supported Methods:** `GET` (invoked by Vercel Cron) and `POST`
- **Security Guard:** Requires `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>`. Unauthenticated requests return `401 Unauthorized`.
- **Batch Processing:** Recovers up to 50 abandoned records per sweep, respects exponential backoff cooldowns, respects `MAX_NOTIFICATION_ATTEMPTS = 5`, and skips permanent failures.

### Vercel Cron Configuration (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/recover-notifications",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 7. Idempotency Key Corrections Registry

| Event / Notification | Canonical Idempotency Key | Business Justification |
| :--- | :--- | :--- |
| **Payment Receipt** | `payment_receipt:${reference}` | Preserves Paystack transaction reference; immune to webhook/verify race conditions. |
| **Course Enrollment** | `enrollment:${enrollment.id}` | Uses stable enrollment primary key. |
| **Onsite Registration** | `enrollment:onsite:${reference}` | Preserves Paystack onsite transaction reference. |
| **Student Welcome** | `welcome:${userId}:student` | Scoped per user ID and role. |
| **Instructor Welcome** | `welcome:${userId}:instructor` | Scoped per user ID and role. |
| **Admin Onboarding** | `welcome:${userId}:admin` | Scoped per user ID and role. |
| **Finance Onboarding** | `welcome:${userId}:finance` | Scoped per user ID and role. |
| **Lesson Approved** | `lesson_approved:${courseId}:${lessonId}:${revision}` | Scoped by moderation revision; allows subsequent resubmissions while deduplicating client retries. |
| **Curriculum Revision** | `curriculum_review:${courseId}:${lessonId}:${revision}` | Scoped by revision number; never blocks follow-up revisions. |
| **Payment Discrepancy Alert** | `payment_alert:${reference}:${recipientEmail}` | Scoped per recipient; guarantees all operations stakeholders receive discrepancy alerts. |
| **Verification OTP** | None (Ephemeral session) | Real-time unsuppressed delivery. |
| **Password Reset** | None (Ephemeral 1-hr token) | Real-time unsuppressed delivery. |

---

## 8. Delivery Guarantee and Known Limitations

### Accurate Guarantee Statement
**At-least-once dispatch with durable idempotency and duplicate mitigation.**

### Technical Explanation
1. **Meaning of `sent` State:**
   - In PostgreSQL, `status = 'sent'` indicates that Brevo's HTTP API accepted the message with HTTP 200/201 and returned a provider message ID.
   - It does **not** indicate that the recipient received, opened, or clicked the email (which requires webhook delivery tracking).
2. **Unavoidable Network Boundary Uncertainty:**
   - External Brevo HTTP REST calls and PostgreSQL database updates are non-atomic across disparate network systems.
   - If a worker crashes after Brevo accepts the dispatch but before PostgreSQL commits `status = 'sent'`, the 120-second lease will expire and the recovery worker will re-dispatch.
   - Consequently, **exactly-once delivery cannot be mathematically guaranteed** by the database outbox alone.
3. **Mitigations in Place:**
   - 120-second lease window accommodates Brevo HTTP timeouts.
   - Lease renewal is available for long-running processes.
   - Brevo message IDs are recorded upon acceptance (`provider_message_id`).
   - Claim ownership tokens prevent zombie workers from corrupting recovered state.

---

## 9. Automated Test Results

All verification suites passed with zero errors:

| Suite | Command | Tests Run | Result | Duration |
| :--- | :--- | :--- | :--- | :--- |
| **Brevo Email & Outbox** | `npm run test:email` | **45 / 45** | **45 Passed, 0 Failed** | ~11.6s |
| **Payments Integrity** | `npm run test:payments` | **6 / 6** | **6 Passed, 0 Failed** | ~1.1s |
| **Security & Roles** | `npm run test:security` | **16 / 16** | **16 Passed, 0 Failed** | ~24.3s |
| **Database Isolation** | `npm run test:isolation` | **16 / 16** | **16 Passed, 0 Failed** | ~1.2s |
| **Next.js Production Build** | `npm run build` | **93 Routes** | **93 / 93 Compiled (Exit 0)** | ~70s |

### Specific Scenarios Verified in Email Suite
- **Scenario 1 & 2:** Two concurrent workers claiming same notification; active lease preventing claim.
- **Scenario 3:** Expired lease recovery by subsequent worker.
- **Scenario 4 & 5:** Stale claim token rejection when marking notification sent.
- **Scenario 6:** Stale claim token rejection when marking notification failed.
- **Scenario 7 & 8:** Active lease renewal succeeding for owner and rejecting stale workers.
- **Scenario 9:** Crash after claiming leaving unexpired lease.
- **Scenario 10:** Crash after Brevo accepts before DB update handled via at-least-once recovery.
- **Scenario 11 & 12:** HTTP 429 rate limit backoff and HTTP 5xx transient gateway error discovery.
- **Scenario 13 & 16:** Permanent HTTP 400 failure classification and exclusion from recovery.
- **Scenario 14 & 15:** Exponential backoff window enforcement and maximum retry ceiling (5 attempts).
- **Scenario 17 & 18:** Duplicate Paystack webhook races (10 parallel requests) and duplicate payment verification deduplication.
- **Scenario 19:** Legitimate repeated curriculum submissions and reviews never suppressed.
- **Scenario 20:** Concurrency among multiple recovery workers (only 1 acquires lease).
- **Scenario 21:** Scheduled recovery endpoint authentication (`CRON_SECRET`) enforcement.
- **Scenario 22:** Multi-instance isolation sharing the same PostgreSQL database.

---

## 10. Production Deployment Requirements

1. **Environment Variables:**
   - `BREVO_API_KEY`: Secret Brevo v3 API key (`xkeysib-...`). Must be configured in Vercel project settings.
   - `BREVO_SENDER_EMAIL`: `no-reply@skillup-digitech.com.ng`.
   - `BREVO_SENDER_NAME`: `SkillUp Digitech`.
   - `APP_URL`: `https://skillup-digitech.com.ng`.
   - `CRON_SECRET`: Random 256-bit secret string configured in Vercel to secure `/api/cron/recover-notifications`.
2. **Database Migration Execution:**
   - Execute `npm run db:migrate-schema` in staging and production to apply:
     - `0004_durable_notifications.sql`
     - `0005_abandoned_recovery.sql`
     - `0006_claim_ownership_fencing.sql`
   - Migrations use non-destructive `IF NOT EXISTS` syntax and preserve all existing rows.

---

## 11. Feature Classification Matrix & Outstanding Risks

| Feature | Classification | Verification Method |
| :--- | :--- | :--- |
| **Brevo-Only Client** | **Implemented & Tested** | `npm ls resend` exits with error; zero Resend code; tests 1-6 pass |
| **PostgreSQL Outbox Table** | **Implemented & Tested** | Migrations 0004-0006 defined, journaled, and table auto-ensured |
| **Claim Ownership Fencing (`claim_token`)** | **Implemented & Tested** | Unit tests 38 & 39 confirm stale workers cannot mark sent/failed |
| **Lease Renewal (`renewNotificationLease`)** | **Implemented & Tested** | Unit test 40 confirms owner renewal and stale rejection |
| **Exponential Retry Backoff** | **Implemented & Tested** | Unit tests 30, 31, 34 confirm backoff formula and max retry limit |
| **Idempotency Key Refinement** | **Implemented & Tested** | Unit tests 42 & 45 confirm revision scoping and recipient isolation |
| **Automated Recovery Endpoint** | **Implemented & Tested** | Route created; unit test 44 verifies authentication and recovery execution |
| **Vercel Cron Scheduling** | **Configured** | `vercel.json` crons entry created; activates automatically upon Vercel deployment |
| **Delivery Guarantee Documentation** | **Implemented** | Architecture and setup markdown documents updated to at-least-once |

### Outstanding Risks
- **No In-App Inbound SMTP Webhook Parser:** Since Brevo delivery webhooks (e.g. bounce, open, click) are not ingested by the application, notification status remains strictly `'sent'` (API acceptance). This is architecturally sound and standard practice for transactional outboxes.
- **Vercel Cron Delay:** Vercel Cron triggers with minor wall-clock jitter (±30s). The 5-minute schedule with 120-second lease ensures leases have ample time to expire before subsequent sweeps.

