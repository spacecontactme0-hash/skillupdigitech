import { getSafeRedirectForRole } from "@/lib/role-routing"
import type { UserRole } from "@/lib/types"

export type RegistrationMode = "onsite" | "online"
export type OnboardingSource = "signup" | "login" | "resend"

const TRUE_VALUES = new Set(["1", "true", "yes", "on"])

function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value === "") {
    return defaultValue
  }
  return TRUE_VALUES.has(value.toLowerCase())
}

function readFlagValue(serverKey: string, clientKey: string): string | undefined {
  return process.env[clientKey] ?? process.env[serverKey]
}

function readNumberValue(serverKey: string, clientKey: string, defaultValue: number): number {
  const rawValue = process.env[clientKey] ?? process.env[serverKey]
  const parsed = Number(rawValue)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue
}

export type OnboardingFeatureFlags = {
  sharedOtpExperience: boolean
  onboardingAnalytics: boolean
  postVerifyWelcome: boolean
}

export function getOnboardingFeatureFlags(): OnboardingFeatureFlags {
  return {
    sharedOtpExperience: parseBooleanFlag(
      readFlagValue("FEATURE_SHARED_OTP_EXPERIENCE", "NEXT_PUBLIC_FEATURE_SHARED_OTP_EXPERIENCE"),
      true,
    ),
    onboardingAnalytics: parseBooleanFlag(
      readFlagValue("FEATURE_ONBOARDING_ANALYTICS", "NEXT_PUBLIC_FEATURE_ONBOARDING_ANALYTICS"),
      true,
    ),
    postVerifyWelcome: parseBooleanFlag(
      readFlagValue("FEATURE_POST_VERIFY_WELCOME", "NEXT_PUBLIC_FEATURE_POST_VERIFY_WELCOME"),
      true,
    ),
  }
}

export function getOtpExpiryMinutes(): number {
  return readNumberValue("OTP_EXPIRES_MINUTES", "NEXT_PUBLIC_OTP_EXPIRES_MINUTES", 10)
}

export function getOtpResendCooldownSeconds(): number {
  return readNumberValue("OTP_RESEND_COOLDOWN_SECONDS", "NEXT_PUBLIC_OTP_RESEND_COOLDOWN_SECONDS", 60)
}

export function maskEmailAddress(email: string): string {
  const normalizedEmail = email.trim().toLowerCase()
  const [localPart, domain] = normalizedEmail.split("@")

  if (!localPart || !domain) {
    return normalizedEmail
  }

  const visibleLocalPart = localPart.slice(0, Math.min(localPart.length, 2))
  const hiddenLength = Math.max(localPart.length - visibleLocalPart.length, 2)
  return `${visibleLocalPart}${"*".repeat(hiddenLength)}@${domain}`
}

type BuildVerifyOtpRouteOptions = {
  email?: string | null
  role?: UserRole | string | null
  mode?: RegistrationMode | string | null
  source?: OnboardingSource | string | null
  redirect?: string | null
  cooldownSeconds?: number | null
}

export function buildVerifyOtpRoute(options: BuildVerifyOtpRouteOptions): string {
  const params = new URLSearchParams()

  if (options.email?.trim()) {
    params.set("email", options.email.trim().toLowerCase())
  }

  if (options.role) {
    params.set("role", options.role)
  }

  if (options.mode) {
    params.set("mode", options.mode)
  }

  if (options.source) {
    params.set("source", options.source)
  }

  if (options.redirect) {
    params.set("redirect", options.redirect)
  }

  if (options.cooldownSeconds && options.cooldownSeconds > 0) {
    params.set("cooldown", String(options.cooldownSeconds))
  }

  const query = params.toString()
  return query ? `/verify-otp?${query}` : "/verify-otp"
}

export function getOtpChangeEmailRoute({
  role,
  source,
}: {
  role?: string | null
  mode?: string | null
  source?: string | null
}): string {
  if (source === "login") {
    return "/login"
  }

  if (role === "instructor") {
    return "/register-instructor"
  }

  return "/register"
}

export function getPostVerificationRoute(role: string | undefined, requestedRedirect?: string | null): string {
  const normalizedRole = (role || "student") as UserRole
  const flags = getOnboardingFeatureFlags()
  const safeRequestedRedirect = getSafeRedirectForRole(normalizedRole, requestedRedirect)

  if (requestedRedirect && safeRequestedRedirect !== getSafeRedirectForRole(normalizedRole)) {
    return safeRequestedRedirect
  }

  if (flags.postVerifyWelcome) {
    if (normalizedRole === "student") {
      return "/welcome/student"
    }

    if (normalizedRole === "instructor") {
      return "/welcome/instructor"
    }
  }

  return safeRequestedRedirect
}
