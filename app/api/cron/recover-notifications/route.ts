/**
 * Scheduled Abandoned Notification Recovery Worker
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 *
 * Discovers and safely recovers abandoned notification dispatches whose processing
 * leases expired (due to serverless function crashes/timeouts) or whose exponential
 * retry backoff cooldown has elapsed.
 *
 * Compatible with Vercel Cron and external schedulers.
 * Protected via CRON_SECRET authorization header.
 */

import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import {
  findRecoverableDispatches,
  claimNotificationDispatch,
  emailLogger,
  notifyPaymentAndEnrollmentSuccess,
} from "@/lib/email"

export async function GET(request: NextRequest) {
  return handleRecovery(request)
}

export async function POST(request: NextRequest) {
  return handleRecovery(request)
}

async function handleRecovery(request: NextRequest) {
  // 1. Authenticate scheduler request
  const cronSecret = process.env.CRON_SECRET?.trim()
  const authHeader = request.headers.get("authorization")?.trim()
  const xCronHeader = request.headers.get("x-cron-secret")?.trim()

  const isAuthorized =
    Boolean(cronSecret && (authHeader === `Bearer ${cronSecret}` || xCronHeader === cronSecret)) ||
    (process.env.NODE_ENV !== "production" && !cronSecret)

  if (!isAuthorized) {
    emailLogger.warn("Unauthorized attempt to access notification recovery endpoint", {
      hasCronSecret: Boolean(cronSecret),
      ip: request.headers.get("x-forwarded-for") || "unknown",
    })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 2. Discover abandoned records with expired leases or elapsed retry backoff
    const recoverableRecords = await findRecoverableDispatches({ limit: 50 })
    emailLogger.info("Notification recovery sweep discovered candidate records", {
      count: recoverableRecords.length,
    })

    const results: Array<{
      idempotencyKey: string
      status: string
      claimed: boolean
      attempts?: number
      reason?: string
    }> = []

    for (const record of recoverableRecords) {
      // 3. Atomically attempt to claim the lease with a fresh claim_token
      const claim = await claimNotificationDispatch({
        idempotencyKey: record.idempotencyKey,
        notificationType: record.notificationType,
        recipientEmail: record.recipientEmail,
        metadata: record.metadata,
      })

      if (!claim.claimed) {
        results.push({
          idempotencyKey: record.idempotencyKey,
          status: record.status,
          claimed: false,
          reason: claim.reason,
        })
        continue
      }

      results.push({
        idempotencyKey: record.idempotencyKey,
        status: "reclaimed",
        claimed: true,
        attempts: claim.record?.attempts,
      })

      // 4. If notification is a payment receipt with reference metadata, trigger safe dispatch
      if (
        record.notificationType === "payment_receipt" &&
        record.metadata?.reference &&
        record.metadata?.userId
      ) {
        try {
          const db = getDB()
          await notifyPaymentAndEnrollmentSuccess({
            db,
            userId: record.metadata.userId,
            reference: record.metadata.reference,
            amount: record.metadata.amount || 0,
            currency: record.metadata.currency || "NGN",
            paymentType: record.metadata.paymentType,
            courseIds: record.metadata.courseIds,
          })
        } catch (dispatchErr) {
          emailLogger.error("Failed to re-dispatch recovered payment receipt", dispatchErr, {
            reference: record.metadata.reference,
          })
        }
      }
    }

    const reclaimedCount = results.filter((r) => r.claimed).length

    return NextResponse.json({
      success: true,
      discovered: recoverableRecords.length,
      reclaimed: reclaimedCount,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    emailLogger.error("Notification recovery sweep encountered an unexpected error", error)
    return NextResponse.json(
      { error: "Recovery process encountered an internal error", message: error?.message },
      { status: 500 },
    )
  }
}

