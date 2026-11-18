import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { getDrizzleDb } from "@/db/client"
import * as schema from "@/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { sendInstallmentReminderEmail } from "@/lib/email"

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await authService.getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
    }

    const drizzle = getDrizzleDb()

    // 1. Fetch programme enrolments joined with students and programmes
    const enrolments = await drizzle
      .select({
        enrolmentId: schema.programmeEnrolments.id,
        studentId: schema.programmeEnrolments.studentId,
        studentName: schema.users.name,
        studentEmail: schema.users.email,
        programmeId: schema.programmeEnrolments.programmeId,
        programmeName: schema.academicProgrammes.name,
        pathwayId: schema.programmeEnrolments.pathwayId,
        deliveryArrangement: schema.programmeEnrolments.deliveryArrangement,
        enrolmentStatus: schema.programmeEnrolments.status,
        metadata: schema.programmeEnrolments.metadata,
        enrolledAt: schema.programmeEnrolments.enrolledAt,
        createdAt: schema.programmeEnrolments.createdAt,
      })
      .from(schema.programmeEnrolments)
      .innerJoin(schema.users, eq(schema.programmeEnrolments.studentId, schema.users.id))
      .innerJoin(schema.academicProgrammes, eq(schema.programmeEnrolments.programmeId, schema.academicProgrammes.id))
      .orderBy(desc(schema.programmeEnrolments.createdAt))

    // 2. Fetch payments linked to programme enrolments
    const allPayments = await drizzle
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.status, "completed"))

    const paymentsByEnrolment = new Map<string, typeof allPayments>()
    for (const payment of allPayments) {
      if (payment.programmeEnrolmentId) {
        const list = paymentsByEnrolment.get(payment.programmeEnrolmentId) || []
        list.push(payment)
        paymentsByEnrolment.set(payment.programmeEnrolmentId, list)
      }
    }

    // 3. Compute installment status for each enrolment
    const now = new Date()
    const records = enrolments.map((enr) => {
      const enrPayments = paymentsByEnrolment.get(enr.enrolmentId) || []
      const totalPaid = enrPayments.reduce((sum, p) => sum + Number(p.amount), 0)

      const meta = (enr.metadata as Record<string, any>) || {}
      const tuitionFeeNgn = meta.tuitionFeeNgn || 150000 // Standard Career Readiness is ₦150,000
      const paymentPlan = meta.paymentPlan || (totalPaid >= tuitionFeeNgn ? "full" : "installment")
      const balanceNgn = Math.max(0, tuitionFeeNgn - totalPaid)

      // Due date is 30 days after enrolment
      const enrolledDate = enr.enrolledAt || enr.createdAt
      const dueDate = new Date(enrolledDate.getTime() + 30 * 24 * 3600 * 1000)
      const isOverdue = balanceNgn > 0 && now > dueDate

      let installmentStatus = "fully_paid"
      if (balanceNgn > 0) {
        installmentStatus = isOverdue ? "overdue" : "deposit_paid"
      }

      return {
        enrolmentId: enr.enrolmentId,
        studentId: enr.studentId,
        studentName: enr.studentName,
        studentEmail: enr.studentEmail,
        studentPhone: meta.phoneNumber || null,
        programmeName: enr.programmeName,
        deliveryArrangement: enr.deliveryArrangement,
        tuitionFeeNgn,
        totalPaidNgn: totalPaid,
        balanceNgn,
        paymentPlan,
        installmentStatus,
        dueDate: dueDate.toISOString(),
        isOverdue,
        enrolledAt: enr.enrolledAt,
        paymentCount: enrPayments.length,
      }
    })

    const summary = {
      totalInstallmentRevenue: records.reduce((sum, r) => sum + r.totalPaidNgn, 0),
      totalOutstandingReceivables: records.reduce((sum, r) => sum + r.balanceNgn, 0),
      overdueCount: records.filter((r) => r.installmentStatus === "overdue").length,
      totalStudents: records.length,
    }

    return NextResponse.json({ records, summary })
  } catch (error: any) {
    console.error("Get installments error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve installments" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await authService.getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
    }

    const body = await request.json()
    const { studentEmail, studentName, programmeName, installmentAmountNgn, dueDate, isOverdue } = body

    if (!studentEmail || !programmeName || !installmentAmountNgn) {
      return NextResponse.json(
        { error: "studentEmail, programmeName, and installmentAmountNgn are required" },
        { status: 400 },
      )
    }

    const paymentLink = `https://skillup-digitech.com.ng/dashboard/payments?programme=${encodeURIComponent(programmeName)}`

    const result = await sendInstallmentReminderEmail({
      studentName: studentName || "Scholar",
      studentEmail,
      programmeName,
      installmentAmountNgn: Number(installmentAmountNgn),
      dueDate: dueDate ? new Date(dueDate).toLocaleDateString() : "Immediately",
      isOverdue: Boolean(isOverdue),
      paymentLink,
    })

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error("Send installment reminder error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to send installment reminder" },
      { status: 500 },
    )
  }
}
