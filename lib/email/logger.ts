/**
 * Secure Email Logger
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 *
 * Implements structured logging with strict redaction of sensitive tokens,
 * passwords, and credentials. Never logs API keys, OTP codes, or reset tokens.
 */

export function maskEmail(email: string): string {
  if (!email || typeof email !== "string") return "***"
  const parts = email.trim().split("@")
  if (parts.length !== 2) return "***"
  const [local, domain] = parts
  if (local.length <= 2) {
    return `${local[0] || "*"}***@${domain}`
  }
  return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`
}

export const emailLogger = {
  info(message: string, context?: Record<string, unknown>) {
    const payload = context ? ` ${JSON.stringify(sanitizeLogContext(context))}` : ""
    console.log(`[EMAIL][INFO] ${message}${payload}`)
  },

  warn(message: string, context?: Record<string, unknown>) {
    const payload = context ? ` ${JSON.stringify(sanitizeLogContext(context))}` : ""
    console.warn(`[EMAIL][WARN] ${message}${payload}`)
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const errorDetails = error instanceof Error ? error.message : String(error || "Unknown error")
    const payload = context ? ` | Context: ${JSON.stringify(sanitizeLogContext(context))}` : ""
    console.error(`[EMAIL][ERROR] ${message} - ${errorDetails}${payload}`)
  },
}

function sanitizeLogContext(context: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase()
    // Explicitly redact sensitive tokens and keys
    if (
      lowerKey.includes("key") ||
      lowerKey.includes("token") ||
      lowerKey.includes("otp") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("password") ||
      lowerKey.includes("hash")
    ) {
      sanitized[key] = "[REDACTED]"
    } else if (lowerKey.includes("email") && typeof value === "string") {
      sanitized[key] = maskEmail(value)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string" && item.includes("@") ? maskEmail(item) : item,
      )
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

