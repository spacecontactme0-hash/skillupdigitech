/**
 * Centralized Brevo Transactional Email Service
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 *
 * Dispatches transactional emails via the official @getbrevo/brevo client.
 * Enforces server-only execution, secret protection, and graceful failure handling.
 */

import { getBrevoClient, getBrevoConfig } from "./client"
import { emailLogger, maskEmail } from "./logger"
import { EmailRecipient, EmailSendResult, SendEmailOptions } from "./types"

export async function sendTransactionalEmail(options: SendEmailOptions): Promise<EmailSendResult> {
  const config = getBrevoConfig()

  // Normalize recipient list
  const recipients: EmailRecipient[] = normalizeRecipients(options.to)
  if (recipients.length === 0) {
    emailLogger.warn("Attempted to send transactional email with zero valid recipients", {
      subject: options.subject,
    })
    return { success: false, error: "No valid recipient email address provided." }
  }

  // Handle unconfigured Brevo (development, CI, or staging without key)
  if (!config.isConfigured || !config.apiKey) {
    if (process.env.NODE_ENV === "production") {
      emailLogger.error(
        "CRITICAL: BREVO_API_KEY is not configured in production environment. Transactional email dispatch rejected.",
        null,
        {
          subject: options.subject,
          firstRecipient: maskEmail(recipients[0].email),
        },
      )
      return {
        success: false,
        simulated: false,
        error: "BREVO_API_KEY is required in production environment.",
        canRetry: false,
      }
    }

    emailLogger.info("BREVO_API_KEY not set — Simulating email dispatch (Development/Test Mode)", {
      subject: options.subject,
      recipients: recipients.map((r) => r.email),
      senderEmail: config.senderEmail,
      senderName: config.senderName,
    })
    return {
      success: true,
      simulated: true,
      messageId: `simulated-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      canRetry: false,
    }
  }

  const client = getBrevoClient()
  if (!client) {
    emailLogger.error("Failed to acquire Brevo client instance", null, {
      subject: options.subject,
      recipients: recipients.map((r) => r.email),
    })
    return { success: false, error: "Failed to initialize Brevo email client.", canRetry: false }
  }

  const sender = {
    email: config.senderEmail,
    name: config.senderName,
  }

  const to = recipients.map((r) => ({
    email: r.email.trim().toLowerCase(),
    name: r.name?.trim() || undefined,
  }))

  const replyTo = options.replyTo
    ? typeof options.replyTo === "string"
      ? { email: options.replyTo.trim() }
      : { email: options.replyTo.email.trim(), name: options.replyTo.name }
    : undefined

  let lastError: unknown
  const maxAttempts = 2

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await client.transactionalEmails.sendTransacEmail({
        sender,
        to,
        subject: options.subject,
        htmlContent: options.html,
        textContent: options.text,
        replyTo,
        headers: options.headers,
        tags: options.tags,
      })

      const messageId =
        response.messageId ||
        (Array.isArray(response.messageIds) ? response.messageIds[0] : undefined) ||
        `brevo-${Date.now()}`

      emailLogger.info("Transactional email delivered successfully via Brevo", {
        messageId,
        subject: options.subject,
        recipientCount: recipients.length,
        firstRecipient: maskEmail(recipients[0].email),
        attempt,
      })

      return {
        success: true,
        messageId,
        simulated: false,
        canRetry: false,
      }
    } catch (error: unknown) {
      lastError = error
      const canRetry = isRetryableError(error)

      if (canRetry && attempt < maxAttempts) {
        emailLogger.warn(`Transient Brevo delivery failure on attempt ${attempt}. Retrying...`, {
          subject: options.subject,
          attempt,
        })
        await new Promise((resolve) => setTimeout(resolve, 500))
        continue
      }
      break
    }
  }

  const errorDetails = lastError instanceof Error ? lastError.message : String(lastError)
  const canRetry = isRetryableError(lastError)

  emailLogger.error("Failed to send transactional email via Brevo", lastError, {
    subject: options.subject,
    firstRecipient: maskEmail(recipients[0].email),
    canRetry,
  })

  return {
    success: false,
    error: errorDetails,
    canRetry,
  }
}

export function isRetryableError(error: unknown): boolean {
  if (!error) return false
  const errStr = error instanceof Error ? error.message : String(error)
  const status = (error as any)?.status || (error as any)?.statusCode || (error as any)?.response?.status

  if (status === 429 || (typeof status === "number" && status >= 500 && status <= 599)) {
    return true
  }

  if (
    errStr.includes("ETIMEDOUT") ||
    errStr.includes("ECONNRESET") ||
    errStr.includes("ECONNREFUSED") ||
    errStr.includes("ENOTFOUND") ||
    errStr.toLowerCase().includes("timeout") ||
    errStr.includes("429") ||
    errStr.includes("500") ||
    errStr.includes("502") ||
    errStr.includes("503") ||
    errStr.includes("504")
  ) {
    return true
  }

  return false
}

function normalizeRecipients(
  input: string | EmailRecipient | (string | EmailRecipient)[],
): EmailRecipient[] {
  const rawList = Array.isArray(input) ? input : [input]
  const normalized: EmailRecipient[] = []

  for (const item of rawList) {
    if (typeof item === "string") {
      const email = item.trim().toLowerCase()
      if (email && email.includes("@")) {
        normalized.push({ email })
      }
    } else if (item && typeof item === "object" && item.email) {
      const email = item.email.trim().toLowerCase()
      if (email && email.includes("@")) {
        normalized.push({ email, name: item.name })
      }
    }
  }

  return normalized
}

