/**
 * Server-Only Brevo Client Provider
 * SkillUp Digitech Academy (skillup-digitech.com.ng)
 *
 * Configures the official @getbrevo/brevo client on the server side.
 * Never exposes API keys to client-side code.
 */

import { BrevoClient } from "@getbrevo/brevo"
import { getAcademyName } from "@/lib/brand-config"
import { emailLogger } from "./logger"

export function assertServerOnly(): void {
  if (typeof window !== "undefined") {
    throw new Error("Brevo transactional email service must only be executed in a server environment.")
  }
}

export interface BrevoConfig {
  apiKey: string | undefined
  senderEmail: string
  senderName: string
  appUrl: string
  isConfigured: boolean
}

export function getBrevoConfig(): BrevoConfig {
  assertServerOnly()

  const apiKey = process.env.BREVO_API_KEY?.trim()
  const senderEmail =
    process.env.BREVO_SENDER_EMAIL?.trim() ||
    "no-reply@skillup-digitech.com.ng"

  const senderName =
    process.env.BREVO_SENDER_NAME?.trim() ||
    process.env.NEXT_PUBLIC_APP_NAME?.trim() ||
    getAcademyName() ||
    "SkillUp Digitech"

  const appUrl = resolveAppUrl()

  return {
    apiKey: apiKey && apiKey.length > 0 ? apiKey : undefined,
    senderEmail,
    senderName,
    appUrl,
    isConfigured: Boolean(apiKey && apiKey.length > 0),
  }
}

export function resolveAppUrl(): string {
  const isProd = process.env.NODE_ENV === "production"
  const configuredAppUrl = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configuredAppUrl) {
    const cleaned = configuredAppUrl.replace(/\/+$/, "")
    // Security check: in production, reject localhost/127.0.0.1 and override with canonical domain
    if (isProd && (cleaned.includes("localhost") || cleaned.includes("127.0.0.1"))) {
      emailLogger.warn(
        "CRITICAL: APP_URL is set to localhost in production! Overriding with canonical production domain: https://skillup-digitech.com.ng"
      )
      return "https://skillup-digitech.com.ng"
    }
    return cleaned
  }

  if (process.env.VERCEL_URL?.trim()) {
    const host = process.env.VERCEL_URL.trim()
    return host.startsWith("http") ? host.replace(/\/+$/, "") : `https://${host.replace(/\/+$/, "")}`
  }

  // In production, NEVER silently fall back to localhost
  if (isProd) {
    emailLogger.warn(
      "APP_URL is unset in production. Using canonical production domain: https://skillup-digitech.com.ng"
    )
    return "https://skillup-digitech.com.ng"
  }

  return "http://localhost:3000"
}

let cachedClient: BrevoClient | null = null
let lastConfiguredKey: string | undefined = undefined

export function getBrevoClient(): BrevoClient | null {
  assertServerOnly()

  const config = getBrevoConfig()
  if (!config.isConfigured || !config.apiKey) {
    return null
  }

  // Refresh client if API key changed
  if (!cachedClient || lastConfiguredKey !== config.apiKey) {
    try {
      cachedClient = new BrevoClient({ apiKey: config.apiKey })
      lastConfiguredKey = config.apiKey
    } catch (error) {
      emailLogger.error("Failed to initialize BrevoClient instance", error)
      return null
    }
  }

  return cachedClient
}

