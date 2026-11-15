import { NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { paystackService } from "@/lib/paystack"
import { notifyManualReviewAlert } from "@/lib/payment-alerts"
import { logPaymentEvent } from "@/lib/payments/runtime"
import { evaluateVerification } from "@/lib/payments/verification"
import { notifyPaymentAndEnrollmentSuccess } from "@/lib/email"

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature")

  if (!paystackService.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const reference = event?.data?.reference
  if (!reference) {
    return NextResponse.json({ received: true })
  }

  const db = getDB()
  const payment = await db.getPaymentByReference(reference)
  if (!payment) {
    return NextResponse.json({ received: true })
  }

  const updatePayment = async (updates: Record<string, unknown>) => {
    await db.updatePaymentByReference(reference, updates)
  }

  try {
    switch (event?.event) {
      case "charge.success": {
        const currentPayment = (await db.getPaymentByReference(reference)) || payment
        if (currentPayment.status === "completed" || currentPayment.status === "success") {
          await logPaymentEvent(db, {
            reference,
            paymentId: currentPayment.id,
            type: "webhook",
            source: "api/payments/webhook",
            status: currentPayment.status,
            message: "Duplicate charge.success webhook ignored.",
          })
          break
        }

        let lockedPayment: any = undefined
        if (typeof db.acquirePaymentVerificationLock === "function") {
          lockedPayment = await db.acquirePaymentVerificationLock(reference, 5)
        } else if (!currentPayment.verificationLocked) {
          lockedPayment = await db.updatePaymentByReference(reference, {
            verificationLocked: true,
            verificationAttempts: (currentPayment.verificationAttempts || 0) + 1,
            lastVerificationAt: new Date(),
            status: currentPayment.status === "pending" ? "processing" : currentPayment.status,
          })
        }

        if (!lockedPayment) {
          const latest = await db.getPaymentByReference(reference)
          if (latest && (latest.verificationAttempts || 0) >= 5 && latest.status !== "manual_review") {
            const reason = "Verification attempts exceeded safe limit."
            await db.updatePaymentByReference(reference, {
              status: "manual_review",
              verificationLocked: false,
              verificationLockToken: undefined,
              verificationLockExpiresAt: undefined,
              manualReviewReason: reason,
              manualReviewSource: "webhook",
              manualReviewCreatedAt: latest.manualReviewCreatedAt || new Date(),
              manualReviewUpdatedAt: new Date(),
              reviewedAt: new Date(),
              gatewayMessage: reason,
            })
            await logPaymentEvent(db, {
              reference,
              paymentId: latest.id,
              type: "manual_review",
              source: "api/payments/webhook",
              status: "manual_review",
              message: reason,
            })
          }
          await logPaymentEvent(db, {
            reference,
            paymentId: currentPayment.id,
            type: "webhook",
            source: "api/payments/webhook",
            status: "skipped",
            message: "Webhook skipped due to active verification lock or attempt threshold.",
          })
          break
        }

        const amount = event?.data?.amount
        const currency = event?.data?.currency || currentPayment.currency
        const paidAt = event?.data?.paid_at || event?.data?.paidAt
        const gatewayMessage = event?.data?.gateway_response || "Payment successful"
        const transactionId = event?.data?.id ? String(event.data.id) : undefined
        const channel = event?.data?.channel
        const gatewayFee = typeof event?.data?.fees === "number" ? paystackService.fromSubunit(event.data.fees, currency) : undefined
        const customerCode = event?.data?.customer?.customer_code
        const amountInMajorUnit =
          typeof amount === "number" ? paystackService.fromSubunit(amount, currency) : currentPayment.amount

        const paystackEmail = event?.data?.customer?.email
        const user = await db.findUserById(currentPayment.userId)
        const expectedCustomerEmail = user?.email || currentPayment.customerEmail
        const evaluation = evaluateVerification({
          verification: {
            status: "success",
            amount: amountInMajorUnit,
            currency,
            customerEmail: paystackEmail ? String(paystackEmail) : undefined,
          },
          payment: {
            amount: currentPayment.amount,
            currency: currentPayment.currency,
          },
          userEmail: expectedCustomerEmail,
          source: "webhook",
        })

        if (evaluation.targetStatus === "manual_review") {
          const reason = evaluation.reason || "Webhook mismatch."
          await updatePayment({
            status: "manual_review",
            verificationLocked: false,
            verificationLockToken: undefined,
            verificationLockExpiresAt: undefined,
            gatewayStatus: "success",
            gatewayMessage: reason,
            transactionId,
            gatewayChannel: channel,
            gatewayFee,
            customerEmail: paystackEmail ? String(paystackEmail) : undefined,
            customerCode: customerCode ? String(customerCode) : undefined,
            manualReviewReason: reason,
            manualReviewSource: "webhook",
            manualReviewCreatedAt: currentPayment.manualReviewCreatedAt || new Date(),
            manualReviewUpdatedAt: new Date(),
            reviewedAt: new Date(),
          })
          await notifyManualReviewAlert({
            reference,
            paymentType: currentPayment.paymentType,
            amount: currentPayment.amount,
            currency: currentPayment.currency,
            userEmail: expectedCustomerEmail,
            source: "webhook",
            reason,
          })
          await logPaymentEvent(db, {
            reference,
            paymentId: currentPayment.id,
            type: "manual_review",
            source: "api/payments/webhook",
            status: "manual_review",
            message: reason,
            metadata: { mismatches: evaluation.mismatches },
          })
          break
        }

        await updatePayment({
          status: "completed",
          completedAt: paidAt ? new Date(paidAt) : new Date(),
          amount: amountInMajorUnit,
          currency,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
          gatewayStatus: "success",
          gatewayMessage,
          transactionId,
          gatewayChannel: channel,
          gatewayFee,
          customerEmail: paystackEmail ? String(paystackEmail) : undefined,
          customerCode: customerCode ? String(customerCode) : undefined,
          verificationLocked: false,
          verificationLockToken: undefined,
          verificationLockExpiresAt: undefined,
        })

        const isOnsiteRegistration = currentPayment.paymentType === "onsite_registration"
        let courseIds =
          currentPayment.courseIds && currentPayment.courseIds.length > 0
            ? currentPayment.courseIds
            : [currentPayment.courseId]
        if (isOnsiteRegistration) {
          const allCourses = await db.getAllCourses()
          courseIds = (allCourses || []).map((course: any) => course.id)
        }
        const currentUser = await db.findUserById(currentPayment.userId)
        if (currentUser) {
          for (const courseId of courseIds) {
            const existing = await db.getEnrollment(currentPayment.userId, courseId)
            if (!existing) {
              await db.createEnrollment({
                userId: currentPayment.userId,
                courseId,
                progress: 0,
                completedLessons: [],
                status: "active",
                enrolledAt: new Date(),
              })
            }
          }

          const updatedCourses = Array.from(new Set([...(currentUser.enrolledCourses || []), ...courseIds]))
          const profile = currentUser.studentProfile
          await db.updateUser(currentPayment.userId, {
            enrolledCourses: updatedCourses,
            ...(isOnsiteRegistration && profile
              ? {
                  studentProfile: {
                    ...profile,
                    paymentStatus: "yes",
                    paymentReference: reference,
                  },
                }
              : {}),
          })
        }

        await logPaymentEvent(db, {
          reference,
          paymentId: currentPayment.id,
          type: "webhook",
          source: "api/payments/webhook",
          status: "completed",
          message: "Webhook charge.success processed.",
          metadata: { transactionId, channel },
        })

        await notifyPaymentAndEnrollmentSuccess({
          db,
          userId: currentPayment.userId,
          reference,
          amount: amountInMajorUnit,
          currency,
          paymentType: currentPayment.paymentType,
          courseIds,
          channel,
          paidAt: paidAt ? new Date(paidAt) : new Date(),
        })
        break
      }
      case "charge.failed": {
        if (payment.status === "completed" || payment.status === "success") break
        await updatePayment({
          status: "failed",
          gatewayStatus: "failed",
          gatewayMessage: event?.data?.gateway_response || "Payment failed",
          transactionId: event?.data?.id ? String(event.data.id) : undefined,
          gatewayChannel: event?.data?.channel,
          gatewayFee:
            typeof event?.data?.fees === "number"
              ? paystackService.fromSubunit(event.data.fees, event?.data?.currency || payment.currency)
              : undefined,
          customerEmail: event?.data?.customer?.email ? String(event.data.customer.email) : undefined,
          customerCode: event?.data?.customer?.customer_code ? String(event.data.customer.customer_code) : undefined,
          verificationLocked: false,
          verificationLockToken: undefined,
          verificationLockExpiresAt: undefined,
        })
        await logPaymentEvent(db, {
          reference,
          paymentId: payment.id,
          type: "webhook",
          source: "api/payments/webhook",
          status: "failed",
          message: event?.data?.gateway_response || "Payment failed",
        })
        break
      }
      case "refund.processed": {
        await updatePayment({
          status: "refunded",
          refundedAt: new Date(),
          gatewayMessage: "Refund processed by Paystack.",
          verificationLocked: false,
          verificationLockToken: undefined,
          verificationLockExpiresAt: undefined,
        })
        await logPaymentEvent(db, {
          reference,
          paymentId: payment.id,
          type: "webhook",
          source: "api/payments/webhook",
          status: "refunded",
          message: "Refund processed webhook received.",
        })
        break
      }
      case "refund.failed": {
        break
      }
      default:
        break
    }
  } catch (error) {
    console.error("Webhook processing error:", error)
    if (typeof db.releasePaymentVerificationLock === "function") {
      await db.releasePaymentVerificationLock(reference)
    } else {
      await db.updatePaymentByReference(reference, {
        verificationLocked: false,
        verificationLockToken: undefined,
        verificationLockExpiresAt: undefined,
      })
    }
    await logPaymentEvent(db, {
      reference,
      paymentId: payment.id,
      type: "webhook",
      source: "api/payments/webhook",
      status: "error",
      message: "Webhook processing error encountered.",
    })
  }

  // Paystack expects 200 acknowledgements for authenticated webhooks.
  return NextResponse.json({ received: true }, { status: 200 })
}
