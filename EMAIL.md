# Email Services Overview — SkillUp Digitech

This document describes all email-related behavior across the SkillUp Digitech Technology Academy codebase.

## Provider

- Provider: **Brevo Transactional Email API** (`@getbrevo/brevo`)
- Central implementation module: [`lib/email/index.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/lib/email/index.ts)
- Authenticated Domain: `skillup-digitech.com.ng`

## Required Environment Variables

- `BREVO_API_KEY`
  - Required in production environments.
  - If unset in production, email dispatch is rejected with a fail-safe critical error (never silently simulated).
  - In development and test environments without an API key, safe mock simulation is logged.
- `BREVO_SENDER_EMAIL`
  - Sender address (default: `no-reply@skillup-digitech.com.ng`). Must belong to the authenticated sending domain.
- `BREVO_SENDER_NAME`
  - Sender display name (default: `SkillUp Digitech`).
- `APP_URL`
  - Canonical application URL for reset links and action buttons. In production, resolves strictly to `https://skillup-digitech.com.ng`.
- `OTP_EXPIRES_MINUTES`
  - OTP validity window: canonical **10 minutes** (`crypto.randomInt` 6-digit CSPRNG).

## OTP and Auth Email Flows

### 1) Signup OTP
- Trigger: `POST /api/auth/register` and `POST /api/auth/register-instructor`
- Dispatches: `sendOtpEmail({ to, name, code })`
- Storage: 6-digit code is generated via CSPRNG (`crypto.randomInt`), bcrypt-hashed, and stored in `pending_registrations.otp_hash` with a strict 10-minute expiry (`otp_expires_at`).

### 2) Verify OTP
- Trigger: `POST /api/auth/verify-otp`
- Behavior:
  - Verifies OTP against stored bcrypt hash and expiry.
  - Deletes pending registration immediately to enforce single-use.
  - Provisions authenticated user record and issues JWT session token.
  - Sends role-tailored Welcome Email asynchronously: `sendWelcomeEmail({ to, name, role })`.

### 3) Resend OTP
- Trigger: `POST /api/auth/resend-otp`
- Behavior:
  - Generates fresh 6-digit CSPRNG OTP, resets 10-minute window, updates bcrypt hash, and dispatches new verification email.

### 4) Password Reset Email Flow
- Trigger: `POST /api/auth/forgot-password`
- Dispatches: `sendPasswordResetEmail({ to, name, resetUrl, token })`
- Behavior:
  - Generates 256-bit cryptographically secure reset token (`crypto.randomBytes(32)`).
  - Stores bcrypt hash in `users.otp_hash` with exactly 1-hour expiry.
  - Consumes token upon password update by clearing `otp_hash` and `otp_expires_at` immediately, preventing token reuse.

## Transactional Notifications

- **Course Enrollment**: `sendEnrollmentConfirmationEmail(...)`
- **Payment Receipts**: `sendPaymentConfirmationEmail(...)` (durable notification idempotency prevents duplicates)
- **Curriculum Moderation**: `sendLessonApprovedEmail(...)` and `sendCurriculumReviewEmail(...)`
- **Finance Operations**: `sendPaymentManualReviewAlertEmail(...)`

## Security and Production Safeguards

1. **Server-Only Boundary:** Brevo SDK initialization is guarded with `assertServerOnly()`; zero client-side bundle exposure.
2. **Identity Masking:** Recipient email addresses are automatically masked in logs (e.g., `st***t@example.com`).
3. **No Credential Leaks:** No API keys, passwords, OTPs, or reset tokens appear in server logs.
4. **Durable Idempotency & Delivery Guarantee:** Webhook and payment notifications use unique idempotency keys and atomic claim tokens to guarantee at-least-once dispatch with duplicate mitigation. Exactly-once delivery cannot be guaranteed by the database outbox alone.
