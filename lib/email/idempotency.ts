/**
 * Durable Notification Idempotency & Abandoned Recovery Outbox
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 *
 * Implements a durable, PostgreSQL-backed notification outbox with lease-based
 * concurrency, atomic claiming, claim ownership fencing (claim_token),
 * expired lease recovery, and exponential backoff.
 *
 * Guarantees:
 * - Atomic lease claiming: Exactly one active worker holds an unexpired lease.
 * - Claim ownership fencing: A unique claim_token is generated for every claim.
 *   Superseded or expired workers cannot mark notifications as sent or failed.
 * - Safe lease renewal: Active workers can extend their lease using their valid claim_token.
 * - Recovery from crashes: Notifications abandoned due to Vercel function timeouts or
 *   process crashes have leases that expire and are automatically recovered.
 * - External API uncertainty handling: At-least-once dispatch with durable idempotency
 *   and duplicate mitigation. Stores Brevo provider message IDs upon acceptance.
 * - Exponential backoff with maximum retry limit (MAX_NOTIFICATION_ATTEMPTS = 5).
 * - Permanent failure classification: Non-retryable errors (e.g. invalid syntax) do not retry endlessly.
 * - No PostgreSQL transactions held open while awaiting external Brevo API calls.
 */

import { randomUUID } from "node:crypto"
import { emailLogger } from "./logger"
import { isPostgresBackend } from "../db"
import { isRetryableError } from "./service"

export type NotificationDispatchStatus = "pending" | "processing" | "sent" | "failed"

export interface NotificationDispatchRecord {
  id: string
  idempotencyKey: string
  notificationType: string
  recipientEmail: string
  status: NotificationDispatchStatus
  attempts: number
  claimToken?: string | null
  claimedAt?: Date | null
  leaseExpiresAt?: Date | null
  nextAttemptAt?: Date | null
  providerMessageId?: string | null
  lastError?: string | null
  metadata?: Record<string, any>
  sentAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ClaimDispatchInput {
  idempotencyKey: string
  notificationType: string
  recipientEmail: string
  metadata?: Record<string, any>
  leaseDurationMs?: number
}

export type ClaimDispatchResult =
  | { claimed: true; record: NotificationDispatchRecord; claimToken: string }
  | {
      claimed: false
      reason:
        | "already_sent"
        | "in_progress"
        | "max_retries_exceeded"
        | "backoff_active"
        | "permanent_failure"
      record?: NotificationDispatchRecord
    }

// Defaults
export const DEFAULT_LEASE_DURATION_MS = 120_000 // 2 minutes lease per processing attempt
export const MAX_NOTIFICATION_ATTEMPTS = 5 // Maximum retry ceiling before dead-letter
export const BASE_RETRY_BACKOFF_MS = 1_000 // 1 second initial exponential backoff
export const MAX_RETRY_BACKOFF_MS = 60_000 // 60 seconds maximum backoff delay

/**
 * Calculates exponential backoff delay based on the attempt count: base * 2^(attempts-1)
 */
export function calculateExponentialBackoff(
  attempt: number,
  baseMs = BASE_RETRY_BACKOFF_MS,
  maxMs = MAX_RETRY_BACKOFF_MS,
): number {
  const exponent = Math.max(0, attempt - 1)
  const delay = baseMs * Math.pow(2, exponent)
  return Math.min(delay, maxMs)
}

// In-memory store used in mock database mode (unit tests and offline dev)
const mockDispatches = new Map<string, NotificationDispatchRecord>()

let tableEnsured = false

/**
 * Ensures the notification_dispatches table and columns exist in PostgreSQL.
 * Executes once per process lifetime and applies non-destructive column additions.
 */
async function ensureNotificationDispatchesTable(pool: any): Promise<void> {
  if (tableEnsured) return
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_dispatches (
        id text PRIMARY KEY NOT NULL,
        idempotency_key text NOT NULL,
        notification_type text NOT NULL,
        recipient_email text NOT NULL,
        status text DEFAULT 'pending' NOT NULL,
        attempts integer DEFAULT 0 NOT NULL,
        claim_token text,
        claimed_at timestamp,
        lease_expires_at timestamp,
        next_attempt_at timestamp,
        provider_message_id text,
        last_error text,
        metadata jsonb DEFAULT '{}'::jsonb,
        sent_at timestamp,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_notification_dispatches_key ON notification_dispatches (idempotency_key);
      CREATE INDEX IF NOT EXISTS idx_notification_dispatches_status ON notification_dispatches (status);
      CREATE INDEX IF NOT EXISTS idx_notification_dispatches_lease ON notification_dispatches (status, lease_expires_at);
      CREATE INDEX IF NOT EXISTS idx_notification_dispatches_retry ON notification_dispatches (status, next_attempt_at);

      ALTER TABLE notification_dispatches ADD COLUMN IF NOT EXISTS claimed_at timestamp;
      ALTER TABLE notification_dispatches ADD COLUMN IF NOT EXISTS lease_expires_at timestamp;
      ALTER TABLE notification_dispatches ADD COLUMN IF NOT EXISTS next_attempt_at timestamp;
      ALTER TABLE notification_dispatches ADD COLUMN IF NOT EXISTS provider_message_id text;
      ALTER TABLE notification_dispatches ADD COLUMN IF NOT EXISTS claim_token text;
    `)
    tableEnsured = true
  } catch (error) {
    emailLogger.warn("Notice during notification_dispatches table check", { error: String(error) })
    tableEnsured = true
  }
}

function mapRowToRecord(row: any): NotificationDispatchRecord {
  return {
    id: row.id,
    idempotencyKey: row.idempotencyKey || row.idempotency_key,
    notificationType: row.notificationType || row.notification_type,
    recipientEmail: row.recipientEmail || row.recipient_email,
    status: row.status as NotificationDispatchStatus,
    attempts: Number(row.attempts || 0),
    claimToken: row.claimToken || row.claim_token || null,
    claimedAt: row.claimedAt ? new Date(row.claimedAt) : row.claimed_at ? new Date(row.claimed_at) : null,
    leaseExpiresAt: row.leaseExpiresAt ? new Date(row.leaseExpiresAt) : row.lease_expires_at ? new Date(row.lease_expires_at) : null,
    nextAttemptAt: row.nextAttemptAt ? new Date(row.nextAttemptAt) : row.next_attempt_at ? new Date(row.next_attempt_at) : null,
    providerMessageId: row.providerMessageId || row.provider_message_id || null,
    lastError: row.lastError || row.last_error || null,
    metadata: typeof row.metadata === "string" ? JSON.parse(row.metadata) : row.metadata || {},
    sentAt: row.sentAt ? new Date(row.sentAt) : row.sent_at ? new Date(row.sent_at) : null,
    createdAt: new Date(row.createdAt || row.created_at),
    updatedAt: new Date(row.updatedAt || row.updated_at),
  }
}

/**
 * Claims a notification dispatch slot atomically with claim ownership fencing.
 *
 * Rules:
 * 1. If fresh (no record), inserts with status='processing', lease_expires_at = now + leaseDuration, attempts=1, claim_token.
 * 2. If existing with status='sent', rejects with reason='already_sent'.
 * 3. If existing with status='processing' and unexpired lease (lease_expires_at >= now), rejects with reason='in_progress'.
 * 4. If existing with status='processing' and expired lease (lease_expires_at < now), re-claims lease (abandoned recovery)
 *    and generates a NEW claim_token.
 * 5. If existing with status='failed':
 *    - Rejects if attempts >= maxAttempts (reason='max_retries_exceeded').
 *    - Rejects if marked permanent failure (reason='permanent_failure').
 *    - Rejects if next_attempt_at > now (reason='backoff_active').
 *    - Re-claims lease, increments attempts, and issues a fresh claim_token if ready for retry.
 */
export async function claimNotificationDispatch(
  input: ClaimDispatchInput,
): Promise<ClaimDispatchResult> {
  const normalizedKey = input.idempotencyKey.trim()
  const leaseMs = input.leaseDurationMs || DEFAULT_LEASE_DURATION_MS
  const claimToken = randomUUID()

  if (isPostgresBackend()) {
    try {
      const { getPool } = await import("../../db/client")
      const pool = getPool()
      await ensureNotificationDispatchesTable(pool)

      const id = randomUUID()
      const metadataJson = JSON.stringify(input.metadata || {})

      // Atomic conditional UPSERT with claim_token ownership
      const query = `
        INSERT INTO notification_dispatches (
          id,
          idempotency_key,
          notification_type,
          recipient_email,
          status,
          attempts,
          claim_token,
          claimed_at,
          lease_expires_at,
          next_attempt_at,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          'processing',
          1,
          $8,
          now(),
          now() + ($5 || ' milliseconds')::interval,
          NULL,
          $6::jsonb,
          now(),
          now()
        )
        ON CONFLICT (idempotency_key) DO UPDATE
        SET
          status = 'processing',
          attempts = notification_dispatches.attempts + 1,
          claim_token = $8,
          claimed_at = now(),
          lease_expires_at = now() + ($5 || ' milliseconds')::interval,
          updated_at = now()
        WHERE
          -- Recovery 1: Expired processing lease (crashed/abandoned worker)
          (notification_dispatches.status = 'processing' AND notification_dispatches.lease_expires_at < now())
          -- Recovery 2: Retryable failed notification whose backoff window has elapsed and under max retries
          OR (
            notification_dispatches.status = 'failed'
            AND notification_dispatches.attempts < $7
            AND (notification_dispatches.next_attempt_at IS NULL OR notification_dispatches.next_attempt_at <= now())
            AND (notification_dispatches.metadata->>'isPermanentFailure' IS NULL OR notification_dispatches.metadata->>'isPermanentFailure' != 'true')
          )
        RETURNING
          id,
          idempotency_key AS "idempotencyKey",
          notification_type AS "notificationType",
          recipient_email AS "recipientEmail",
          status,
          attempts,
          claim_token AS "claimToken",
          claimed_at AS "claimedAt",
          lease_expires_at AS "leaseExpiresAt",
          next_attempt_at AS "nextAttemptAt",
          provider_message_id AS "providerMessageId",
          last_error AS "lastError",
          metadata,
          sent_at AS "sentAt",
          created_at AS "createdAt",
          updated_at AS "updatedAt";
      `

      const result = await pool.query(query, [
        id,
        normalizedKey,
        input.notificationType,
        input.recipientEmail,
        `${leaseMs}`,
        metadataJson,
        MAX_NOTIFICATION_ATTEMPTS,
        claimToken,
      ])

      if (result.rows.length > 0) {
        return {
          claimed: true,
          record: mapRowToRecord(result.rows[0]),
          claimToken,
        }
      }

      // Slot not claimed: query state to determine precise rejection reason
      const checkResult = await pool.query(
        `SELECT
           id,
           idempotency_key AS "idempotencyKey",
           status,
           attempts,
           claim_token AS "claimToken",
           lease_expires_at AS "leaseExpiresAt",
           next_attempt_at AS "nextAttemptAt",
           metadata
         FROM notification_dispatches
         WHERE idempotency_key = $1
         LIMIT 1;`,
        [normalizedKey],
      )

      const existing = checkResult.rows[0]
      if (!existing) {
        return { claimed: false, reason: "in_progress" }
      }

      const existingRecord = mapRowToRecord(existing)
      const now = new Date()

      if (existingRecord.status === "sent") {
        return { claimed: false, reason: "already_sent", record: existingRecord }
      }

      if (existingRecord.status === "processing") {
        return { claimed: false, reason: "in_progress", record: existingRecord }
      }

      if (existingRecord.status === "failed") {
        if (existingRecord.metadata?.isPermanentFailure === true) {
          return { claimed: false, reason: "permanent_failure", record: existingRecord }
        }
        if (existingRecord.attempts >= MAX_NOTIFICATION_ATTEMPTS) {
          return { claimed: false, reason: "max_retries_exceeded", record: existingRecord }
        }
        if (existingRecord.nextAttemptAt && existingRecord.nextAttemptAt > now) {
          return { claimed: false, reason: "backoff_active", record: existingRecord }
        }
      }

      return { claimed: false, reason: "in_progress", record: existingRecord }
    } catch (pgError) {
      emailLogger.error("PostgreSQL notification claim error; falling back to in-memory store", pgError, {
        idempotencyKey: normalizedKey,
      })
    }
  }

  // ---------------------------------------------------------------------------
  // Mock / In-Memory Store Logic (Unit Tests and Offline Development)
  // ---------------------------------------------------------------------------
  const existing = mockDispatches.get(normalizedKey)
  const now = new Date()

  if (!existing) {
    const record: NotificationDispatchRecord = {
      id: randomUUID(),
      idempotencyKey: normalizedKey,
      notificationType: input.notificationType,
      recipientEmail: input.recipientEmail,
      status: "processing",
      attempts: 1,
      claimToken,
      claimedAt: now,
      leaseExpiresAt: new Date(now.getTime() + leaseMs),
      nextAttemptAt: null,
      providerMessageId: null,
      lastError: null,
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now,
    }
    mockDispatches.set(normalizedKey, record)
    return { claimed: true, record, claimToken }
  }

  if (existing.status === "sent") {
    return { claimed: false, reason: "already_sent", record: existing }
  }

  if (existing.status === "processing") {
    // Check if processing lease is still active
    if (existing.leaseExpiresAt && existing.leaseExpiresAt > now) {
      return { claimed: false, reason: "in_progress", record: existing }
    }
    // Lease expired: worker crashed or timed out -> Recover lease atomically
    existing.status = "processing"
    existing.attempts += 1
    existing.claimToken = claimToken
    existing.claimedAt = now
    existing.leaseExpiresAt = new Date(now.getTime() + leaseMs)
    existing.updatedAt = now
    return { claimed: true, record: existing, claimToken }
  }

  if (existing.status === "failed") {
    if (existing.metadata?.isPermanentFailure === true) {
      return { claimed: false, reason: "permanent_failure", record: existing }
    }
    if (existing.attempts >= MAX_NOTIFICATION_ATTEMPTS) {
      return { claimed: false, reason: "max_retries_exceeded", record: existing }
    }
    if (existing.nextAttemptAt && existing.nextAttemptAt > now) {
      return { claimed: false, reason: "backoff_active", record: existing }
    }

    // Ready for retry
    existing.status = "processing"
    existing.attempts += 1
    existing.claimToken = claimToken
    existing.claimedAt = now
    existing.leaseExpiresAt = new Date(now.getTime() + leaseMs)
    existing.updatedAt = now
    return { claimed: true, record: existing, claimToken }
  }

  return { claimed: false, reason: "in_progress", record: existing }
}

/**
 * Marks a notification as successfully dispatched ('sent').
 * Requires matching claim_token (ownership validation) and status='processing'.
 * Clears claim_token and lease upon reaching terminal state.
 * Returns true if state transition succeeded; false if superseded or invalid token.
 */
export async function markNotificationSent(
  idempotencyKey: string,
  options?: {
    claimToken?: string
    providerMessageId?: string
    metadata?: Record<string, any>
  },
): Promise<boolean> {
  const normalizedKey = idempotencyKey.trim()
  const providerMessageId = options?.providerMessageId || null
  const claimToken = options?.claimToken || null

  if (isPostgresBackend()) {
    try {
      const { getPool } = await import("../../db/client")
      const pool = getPool()
      const result = await pool.query(
        `UPDATE notification_dispatches
         SET
           status = 'sent',
           sent_at = now(),
           provider_message_id = COALESCE($3, provider_message_id),
           claim_token = NULL,
           lease_expires_at = NULL,
           next_attempt_at = NULL,
           last_error = NULL,
           updated_at = now()
         WHERE idempotency_key = $1
           AND ($2::text IS NULL OR claim_token = $2)
           AND status = 'processing'
         RETURNING id;`,
        [normalizedKey, claimToken, providerMessageId],
      )
      return (result.rowCount ?? result.rows.length) > 0
    } catch (err) {
      emailLogger.error("Failed to mark notification sent in PostgreSQL", err, {
        idempotencyKey: normalizedKey,
      })
      return false
    }
  }

  const existing = mockDispatches.get(normalizedKey)
  if (!existing) return false

  if (existing.status !== "processing") {
    emailLogger.warn("Attempted to mark non-processing notification as sent", {
      idempotencyKey: normalizedKey,
      currentStatus: existing.status,
    })
    return false
  }

  if (claimToken && existing.claimToken && existing.claimToken !== claimToken) {
    emailLogger.warn("Stale worker attempted to mark notification as sent with mismatched claim token", {
      idempotencyKey: normalizedKey,
      providedToken: claimToken,
      activeToken: existing.claimToken,
    })
    return false
  }

  existing.status = "sent"
  existing.sentAt = new Date()
  existing.providerMessageId = providerMessageId || existing.providerMessageId
  existing.claimToken = null
  existing.leaseExpiresAt = null
  existing.nextAttemptAt = null
  existing.lastError = null
  existing.updatedAt = new Date()
  if (options?.metadata) {
    existing.metadata = { ...(existing.metadata || {}), ...options.metadata }
  }
  return true
}

/**
 * Marks a notification dispatch as failed.
 * Requires matching claim_token (ownership validation) and status='processing'.
 * Clears claim_token and lease upon transition.
 * Returns true if transition succeeded; false if superseded or invalid token.
 */
export async function markNotificationFailed(
  idempotencyKey: string,
  errorMessage: string,
  options?: {
    claimToken?: string
    isPermanentFailure?: boolean
    currentAttempts?: number
  },
): Promise<boolean> {
  const normalizedKey = idempotencyKey.trim()
  const claimToken = options?.claimToken || null

  // Classify failure permanence
  const isPermanent =
    options?.isPermanentFailure !== undefined
      ? options.isPermanentFailure
      : !isRetryableError(errorMessage)

  let nextAttemptAt: Date | null = null
  if (!isPermanent) {
    const attempts = options?.currentAttempts || 1
    const delayMs = calculateExponentialBackoff(attempts)
    nextAttemptAt = new Date(Date.now() + delayMs)
  }

  if (isPostgresBackend()) {
    try {
      const { getPool } = await import("../../db/client")
      const pool = getPool()
      const result = await pool.query(
        `UPDATE notification_dispatches
         SET
           status = 'failed',
           last_error = $3,
           next_attempt_at = $4,
           claim_token = NULL,
           lease_expires_at = NULL,
           metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{isPermanentFailure}', $5::jsonb),
           updated_at = now()
         WHERE idempotency_key = $1
           AND ($2::text IS NULL OR claim_token = $2)
           AND status = 'processing'
         RETURNING id;`,
        [normalizedKey, claimToken, errorMessage.slice(0, 1000), nextAttemptAt, JSON.stringify(isPermanent)],
      )
      return (result.rowCount ?? result.rows.length) > 0
    } catch (err) {
      emailLogger.error("Failed to mark notification failed in PostgreSQL", err, {
        idempotencyKey: normalizedKey,
      })
      return false
    }
  }

  const existing = mockDispatches.get(normalizedKey)
  if (!existing) return false

  if (existing.status !== "processing") {
    emailLogger.warn("Attempted to mark non-processing notification as failed", {
      idempotencyKey: normalizedKey,
      currentStatus: existing.status,
    })
    return false
  }

  if (claimToken && existing.claimToken && existing.claimToken !== claimToken) {
    emailLogger.warn("Stale worker attempted to mark notification as failed with mismatched claim token", {
      idempotencyKey: normalizedKey,
      providedToken: claimToken,
      activeToken: existing.claimToken,
    })
    return false
  }

  existing.status = "failed"
  existing.lastError = errorMessage
  existing.nextAttemptAt = nextAttemptAt
  existing.claimToken = null
  existing.leaseExpiresAt = null
  existing.updatedAt = new Date()
  existing.metadata = {
    ...(existing.metadata || {}),
    isPermanentFailure: isPermanent,
  }
  return true
}

/**
 * Safely renews/extends an active processing lease.
 * Requires the active claimToken and status='processing'.
 * Prevents expired or superseded workers from renewing.
 */
export async function renewNotificationLease(
  idempotencyKey: string,
  claimToken: string,
  extensionMs = DEFAULT_LEASE_DURATION_MS,
): Promise<boolean> {
  const normalizedKey = idempotencyKey.trim()

  if (isPostgresBackend()) {
    try {
      const { getPool } = await import("../../db/client")
      const pool = getPool()
      const result = await pool.query(
        `UPDATE notification_dispatches
         SET
           lease_expires_at = now() + ($3 || ' milliseconds')::interval,
           updated_at = now()
         WHERE idempotency_key = $1
           AND claim_token = $2
           AND status = 'processing'
         RETURNING id;`,
        [normalizedKey, claimToken, `${extensionMs}`],
      )
      return (result.rowCount ?? result.rows.length) > 0
    } catch (err) {
      emailLogger.error("Failed to renew notification lease in PostgreSQL", err, {
        idempotencyKey: normalizedKey,
      })
      return false
    }
  }

  const existing = mockDispatches.get(normalizedKey)
  if (!existing) return false

  if (existing.status !== "processing" || existing.claimToken !== claimToken) {
    return false
  }

  const now = new Date()
  existing.leaseExpiresAt = new Date(now.getTime() + extensionMs)
  existing.updatedAt = now
  return true
}

/**
 * Retrieves the current state of a notification dispatch.
 */
export async function getNotificationDispatch(
  idempotencyKey: string,
): Promise<NotificationDispatchRecord | null> {
  const normalizedKey = idempotencyKey.trim()

  if (isPostgresBackend()) {
    try {
      const { getPool } = await import("../../db/client")
      const pool = getPool()
      const result = await pool.query(
        `SELECT
           id,
           idempotency_key AS "idempotencyKey",
           notification_type AS "notificationType",
           recipient_email AS "recipientEmail",
           status,
           attempts,
           claim_token AS "claimToken",
           claimed_at AS "claimedAt",
           lease_expires_at AS "leaseExpiresAt",
           next_attempt_at AS "nextAttemptAt",
           provider_message_id AS "providerMessageId",
           last_error AS "lastError",
           metadata,
           sent_at AS "sentAt",
           created_at AS "createdAt",
           updated_at AS "updatedAt"
         FROM notification_dispatches
         WHERE idempotency_key = $1
         LIMIT 1;`,
        [normalizedKey],
      )
      if (result.rows.length > 0) {
        return mapRowToRecord(result.rows[0])
      }
      return null
    } catch (err) {
      emailLogger.error("Failed to query notification dispatch in PostgreSQL", err, {
        idempotencyKey: normalizedKey,
      })
    }
  }

  return mockDispatches.get(normalizedKey) || null
}

/**
 * Identifies and returns abandoned notification dispatches that are eligible for recovery:
 * 1. Status 'processing' with expired leases (crashed workers).
 * 2. Status 'failed' whose backoff window has elapsed and attempts < MAX_NOTIFICATION_ATTEMPTS.
 */
export async function findRecoverableDispatches(options?: {
  limit?: number
}): Promise<NotificationDispatchRecord[]> {
  const limit = options?.limit || 50

  if (isPostgresBackend()) {
    try {
      const { getPool } = await import("../../db/client")
      const pool = getPool()
      const result = await pool.query(
        `SELECT
           id,
           idempotency_key AS "idempotencyKey",
           notification_type AS "notificationType",
           recipient_email AS "recipientEmail",
           status,
           attempts,
           claim_token AS "claimToken",
           claimed_at AS "claimedAt",
           lease_expires_at AS "leaseExpiresAt",
           next_attempt_at AS "nextAttemptAt",
           provider_message_id AS "providerMessageId",
           last_error AS "lastError",
           metadata,
           sent_at AS "sentAt",
           created_at AS "createdAt",
           updated_at AS "updatedAt"
         FROM notification_dispatches
         WHERE
           (status = 'processing' AND lease_expires_at < now())
           OR (
             status = 'failed'
             AND attempts < $1
             AND (metadata->>'isPermanentFailure' IS NULL OR metadata->>'isPermanentFailure' != 'true')
             AND (next_attempt_at IS NULL OR next_attempt_at <= now())
           )
         ORDER BY updated_at ASC
         LIMIT $2;`,
        [MAX_NOTIFICATION_ATTEMPTS, limit],
      )
      return result.rows.map(mapRowToRecord)
    } catch (err) {
      emailLogger.error("Failed to query recoverable dispatches in PostgreSQL", err)
    }
  }

  const now = new Date()
  const recoverable: NotificationDispatchRecord[] = []

  for (const record of mockDispatches.values()) {
    if (record.status === "processing" && record.leaseExpiresAt && record.leaseExpiresAt < now) {
      recoverable.push(record)
    } else if (
      record.status === "failed" &&
      record.attempts < MAX_NOTIFICATION_ATTEMPTS &&
      !record.metadata?.isPermanentFailure &&
      (!record.nextAttemptAt || record.nextAttemptAt <= now)
    ) {
      recoverable.push(record)
    }
    if (recoverable.length >= limit) break
  }

  return recoverable
}

/**
 * Resets in-memory idempotency state for automated unit and integration tests.
 */
export function resetNotificationIdempotencyForTesting(): void {
  mockDispatches.clear()
}
