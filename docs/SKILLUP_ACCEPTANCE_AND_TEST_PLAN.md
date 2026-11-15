# SKILLUP DIGITECH ACADEMY — ACCEPTANCE CRITERIA & COMPREHENSIVE TEST PLAN

> **Document ID:** SDA-ATP-008  
> **Version:** 1.0.0  
> **Status:** Proposed — For Architecture Review & Management Approval  
> **Date:** 15 November 2026  
> **Platform:** SkillUp Digitech Academy (`skillup-digitech.com.ng`)  

---

## 1. Acceptance Criteria Verification Matrix (AC01 – AC25)

Every acceptance criterion defined in the Master PRD is mapped to specific verification mechanisms and test suites:

| Criterion ID | Requirement Statement | Verification Method | Automated Test Suite |
| :--- | :--- | :--- | :--- |
| **AC01** | One student account for multiple programme enrolments. | Automated API test verifying multiple `programme_enrolments` link to identical `user.id`. | `tests/academic/multi-enrolment.test.ts` |
| **AC02** | Independent delivery arrangements across enrolments. | API test asserting online and hybrid enrolments maintain separate schedules and statuses. | `tests/academic/multi-enrolment.test.ts` |
| **AC03** | Skill Acquisition standard arrangement is online-first. | UI & API validation ensuring standard registration defaults to online. | `tests/academic/registration-rules.test.ts` |
| **AC04** | Career Readiness pathway selection constrained to active modes. | API test verifying hybrid selection is rejected if cohort is online-only. | `tests/academic/registration-rules.test.ts` |
| **AC05** | Mandatory BYOL acknowledgement for physical/hybrid classes. | API test verifying registration fails if `byolAcknowledged = false`. | `tests/academic/byol-verification.test.ts` |
| **AC06** | Clear disclosure that academy provides power and internet. | UI visual audit asserting presence of guarantee text on physical checkout. | `tests/academic/byol-verification.test.ts` |
| **AC07** | Students cannot select arbitrary hybrid physical days. | API test ensuring submission of custom class days is rejected. | `tests/academic/cohort-scheduling.test.ts` |
| **AC08** | Timetable modifications preserve history & notify students. | Integration test verifying schedule updates dispatch Brevo email & log audit. | `tests/academic/timetable-updates.test.ts` |
| **AC09** | Video watching does not record live/physical attendance. | Unit test verifying video completion increments progress but leaves attendance empty. | `tests/academic/attendance-logic.test.ts` |
| **AC10** | Live virtual attendance recorded against session & enrolment. | API test recording virtual join and asserting attendance record creation. | `tests/academic/attendance-logic.test.ts` |
| **AC11** | Physical session capacity blocks overbooking. | API test asserting error returned when booking session with 0 seats remaining. | `tests/academic/capacity-limits.test.ts` |
| **AC12** | Concurrent booking race condition protection. | Concurrency test with 5 parallel requests competing for 1 remaining seat. | `tests/academic/concurrency-booking.test.ts` |
| **AC13** | Physical attendance linked to session, student, and enrolment. | Database assertion on `attendance_records` foreign keys. | `tests/academic/attendance-logic.test.ts` |
| **AC14** | Optional workshop booked without changing programme to hybrid. | API test verifying workshop booking links to online enrolment without changing its mode. | `tests/academic/workshop-booking.test.ts` |
| **AC15** | Unified student dashboard displaying all active enrolments. | Component render test asserting multiple programme cards on dashboard. | `tests/academic/dashboard-render.test.ts` |
| **AC16** | Payment isolation across separate programme enrolments. | Payment API test verifying payment to Enrolment A does not reduce Enrolment B balance. | `tests/payments/payment-isolation.test.ts` |
| **AC17** | Paystack webhook idempotency prevents duplicate activations. | Integration test replaying identical Paystack webhook event 3 times. | `tests/payments/webhook-idempotency.test.ts` |
| **AC18** | Academic submissions & grades isolated per enrolment. | API test asserting project submission belongs to designated programme enrolment. | `tests/academic/academic-isolation.test.ts` |
| **AC19** | Certificate eligibility evaluation enforces all graduation rules.| Business logic test verifying certificate is blocked if capstone is failing. | `tests/academic/graduation-rules.test.ts` |
| **AC20** | Historical preservation on cohort transfer or schedule changes. | Migration test asserting historical attendance preserved after cohort change. | `tests/database/staging-e2e-journeys.test.ts` |
| **AC21** | Strict RBAC enforcement across student, instructor, admin, finance.| Security test asserting unauthorized roles receive 403 Forbidden. | `tests/security/auth-security.test.ts` |
| **AC22** | Minor student safeguarding & guardian consent workflows. | Integration test asserting minor account staged until guardian token verified. | `tests/security/safeguarding-minor.test.ts` |
| **AC23** | Accurate activity-specific notifications via Brevo. | Email mock test verifying physical reminders only go to physical attendees. | `tests/email/brevo-service.test.ts` |
| **AC24** | Registration draft recovery surviving browser refresh or error. | State test verifying draft recovery via email lookup in `pendingRegistrations`. | `tests/academic/registration-draft.test.ts` |
| **AC25** | Zero regression or data loss on existing database records. | Database assertion confirming all 5 existing user records remain unaltered. | `tests/database/staging-runtime-verification.test.ts` |

---

## 2. Detailed End-to-End Test Scenarios

### Scenario 1: Dual Enrolment & Dashboard Unification (AC01, AC02, AC15)
1. Register student `student.test@example.com` in *Software Engineer (Hybrid)*.
2. Verify enrolment status is `active`, cohort assigned, BYOL confirmed.
3. Authenticate as same user and enroll in *Graphic Design (Online)*.
4. Verify `users` count remains unchanged.
5. Fetch student dashboard data: Assert response contains 2 programmes, with separate schedules, progress meters, and payment plans.

### Scenario 2: Concurrent Seat Reservation Stress Test (AC11, AC12)
1. Seed a physical laboratory session with `max_capacity = 20` and `booked_seats_count = 19` (1 seat left).
2. Spawn 5 simultaneous asynchronous HTTP booking requests from distinct student accounts.
3. Assert:
   - Exactly 1 request receives HTTP 200 (Confirmed).
   - Exactly 4 requests receive HTTP 409 (Conflict: Session Full).
   - Final `booked_seats_count` in database equals 20 (no overbooking).

### Scenario 3: Paystack Webhook Replay & Idempotency (AC16, AC17)
1. Dispatch Paystack webhook payload for `charge.success` with reference `PSK_TEST_REPLAY_001`.
2. Verify payment recorded in `payments` and enrollment activated.
3. Immediately replay identical webhook payload 2 additional times.
4. Assert:
   - Webhook handler returns HTTP 200.
   - `payments` table contains exactly 1 record for reference `PSK_TEST_REPLAY_001`.
   - Zero duplicate email notifications generated.

---

## 3. Test Execution Commands

```bash
# Run complete academic suite
npm run test:academic

# Run payment isolation & verification tests
npm run test:payments

# Run RBAC & security tests
npm run test:security

# Run Brevo email integration tests
npm run test:email

# Run staging database verification & data preservation test
npm run test:staging-verify
```
