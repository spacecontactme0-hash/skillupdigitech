import assert from "node:assert/strict"
import test, { describe, before, after } from "node:test"
import { randomUUID } from "node:crypto"

process.env.JWT_SECRET = process.env.JWT_SECRET || "phase7-test-jwt-secret-key-32-chars-long"

import { getPool, closePool } from "../../db/client"
import { getPostgresDatabase } from "../../lib/postgres-db"
import { renderInstallmentReminderEmail } from "../../lib/email/templates/installment-reminder"
import { sendInstallmentReminderEmail } from "../../lib/email"

describe("Phase 7: Finance Operations, Multi-Enrolment & Installments", () => {
  const db = getPostgresDatabase()
  const pool = getPool()

  const testPrefix = `p7_test_${Date.now()}_`
  let studentId: string
  let programmeId: string
  let enrolment1Id: string
  let enrolment2Id: string
  let payment1Id: string
  let payment2Id: string

  before(async () => {
    studentId = randomUUID()

    // 1. Create test student
    await db.createUser({
      id: studentId,
      email: `${testPrefix}scholar@example.com`,
      password: "hashed_password",
      name: "Phase 7 Finance Scholar",
      role: "student",
      status: "active",
      emailVerified: true,
      enrolledCourses: [],
    })

    // 2. Resolve academic programme
    const progRes = await pool.query(`SELECT id FROM academic_programmes WHERE code = 'CAREER_READINESS' LIMIT 1;`)
    programmeId = progRes.rows[0]?.id || randomUUID()
    if (!progRes.rows[0]) {
      await pool.query(
        `INSERT INTO academic_programmes (id, code, name, type, is_active) VALUES ($1, $2, $3, $4, true);`,
        [programmeId, `PROG_${Date.now()}`, "Career Readiness Programme", "career_readiness"]
      )
    }

    // 3. Create 2 distinct programme enrolments for the same student (multi-enrolment isolation)
    enrolment1Id = randomUUID()
    enrolment2Id = randomUUID()

    await pool.query(
      `INSERT INTO programme_enrolments (id, student_id, programme_id, delivery_arrangement, status, metadata)
       VALUES 
        ($1, $2, $3, 'hybrid', 'active', $4),
        ($5, $2, $3, 'online', 'active', $6);`,
      [
        enrolment1Id,
        studentId,
        programmeId,
        JSON.stringify({ tuitionFeeNgn: 150000, paymentPlan: "installment" }),
        enrolment2Id,
        JSON.stringify({ tuitionFeeNgn: 100000, paymentPlan: "full" }),
      ]
    )
  })

  after(async () => {
    try {
      if (payment1Id || payment2Id) {
        await pool.query(`DELETE FROM payments WHERE id IN ($1, $2);`, [payment1Id, payment2Id])
      }
      await pool.query(`DELETE FROM programme_enrolments WHERE id IN ($1, $2);`, [enrolment1Id, enrolment2Id])
      await pool.query(`DELETE FROM users WHERE id = $1;`, [studentId])
    } catch (e) {
      console.error("Cleanup error in Phase 7 tests:", e)
    } finally {
      await closePool()
    }
  })

  test("1. Multi-Enrolment Payment Isolation: Links payments strictly to distinct programme enrolments", async () => {
    payment1Id = randomUUID()
    payment2Id = randomUUID()

    // Deposit of ₦75,000 for enrolment 1
    await pool.query(
      `INSERT INTO payments (id, user_id, amount, currency, status, reference, programme_enrolment_id, payment_type, created_at)
       VALUES ($1, $2, 75000, 'NGN', 'completed', $3, $4, 'course_purchase', NOW());`,
      [payment1Id, studentId, `${testPrefix}ref1`, enrolment1Id]
    )

    // Full payment of ₦100,000 for enrolment 2
    await pool.query(
      `INSERT INTO payments (id, user_id, amount, currency, status, reference, programme_enrolment_id, payment_type, created_at)
       VALUES ($1, $2, 100000, 'NGN', 'completed', $3, $4, 'course_purchase', NOW());`,
      [payment2Id, studentId, `${testPrefix}ref2`, enrolment2Id]
    )

    // Verify payments are segregated by programme enrolment
    const res1 = await pool.query(
      `SELECT SUM(amount)::numeric as total FROM payments WHERE programme_enrolment_id = $1 AND status = 'completed';`,
      [enrolment1Id]
    )
    const res2 = await pool.query(
      `SELECT SUM(amount)::numeric as total FROM payments WHERE programme_enrolment_id = $1 AND status = 'completed';`,
      [enrolment2Id]
    )

    assert.equal(Number(res1.rows[0].total), 75000, "Enrolment 1 must have exactly ₦75,000 paid")
    assert.equal(Number(res2.rows[0].total), 100000, "Enrolment 2 must have exactly ₦100,000 paid")
  })

  test("2. Installment Schedule Reconciliation: Computes remaining balance and status correctly", async () => {
    const enr1Res = await pool.query(`SELECT metadata FROM programme_enrolments WHERE id = $1;`, [enrolment1Id])
    const meta = enr1Res.rows[0].metadata
    const tuitionFee = meta.tuitionFeeNgn || 150000

    const payRes = await pool.query(
      `SELECT SUM(amount)::numeric as total FROM payments WHERE programme_enrolment_id = $1 AND status = 'completed';`,
      [enrolment1Id]
    )
    const totalPaid = Number(payRes.rows[0].total)
    const balance = tuitionFee - totalPaid

    assert.equal(balance, 75000, "Remaining balance on installment plan must be ₦75,000")
    assert.equal(totalPaid < tuitionFee, true, "Must flag remaining installment due")
  })

  test("3. Brevo Installment Reminder Email: Renders branded notification with correct amount and link", async () => {
    const { subject, html, text } = renderInstallmentReminderEmail({
      studentName: "Ada Lovelace",
      studentEmail: "ada@example.com",
      programmeName: "Career Readiness — Software Engineer",
      installmentAmountNgn: 75000,
      dueDate: "30 December 2026",
      isOverdue: false,
      paymentLink: "https://skillup-digitech.com.ng/dashboard/payments?enrolment=123",
    })

    assert.match(subject, /Tuition Installment Reminder/)
    assert.match(html, /75,000/)
    assert.match(html, /14 Garden Avenue, GRA/)
    assert.match(html, /Pay Installment Now via Paystack/)
    assert.match(text, /75,000/)
  })

  test("4. Brevo Email Dispatch: Successfully dispatches installment reminder with idempotency", async () => {
    const key = `p7_idem_${Date.now()}_${randomUUID()}`
    const result = await sendInstallmentReminderEmail({
      studentName: "Ada Lovelace",
      studentEmail: "ada@example.com",
      programmeName: "Career Readiness — Software Engineer",
      installmentAmountNgn: 75000,
      dueDate: "30 December 2026",
      paymentLink: "https://skillup-digitech.com.ng/dashboard/payments?enrolment=123",
      idempotencyKey: key,
    })

    assert.equal(result.success, true, "Email dispatch must succeed")
    assert.ok(result.messageId, "Must return message ID")

    // Duplicate call with same idempotency key must skip duplicate send
    const duplicate = await sendInstallmentReminderEmail({
      studentName: "Ada Lovelace",
      studentEmail: "ada@example.com",
      programmeName: "Career Readiness — Software Engineer",
      installmentAmountNgn: 75000,
      dueDate: "30 December 2026",
      paymentLink: "https://skillup-digitech.com.ng/dashboard/payments?enrolment=123",
      idempotencyKey: key,
    })

    assert.equal(duplicate.success, true)
    assert.equal(duplicate.skipped, true, "Duplicate send must be safely skipped")

    await pool.query(`DELETE FROM notification_dispatches WHERE idempotency_key = $1;`, [key])
  })
})
