"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, CheckCircle2, Clock3, Loader2, MailCheck, ShieldCheck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { trackOnboardingEvent } from "@/lib/onboarding-analytics"
import {
  buildVerifyOtpRoute,
  getOnboardingFeatureFlags,
  getOtpChangeEmailRoute,
  getOtpExpiryMinutes,
  getOtpResendCooldownSeconds,
  getPostVerificationRoute,
  maskEmailAddress,
} from "@/lib/onboarding-flow"
import { useAuthStore } from "@/lib/store"
import { getAcademyName } from "@/lib/brand-config"

export default function VerifyOtpClient() {
  const academyName = getAcademyName()
  const router = useRouter()
  const searchParams = useSearchParams()
  const flags = getOnboardingFeatureFlags()
  const role = searchParams.get("role") || "student"
  const mode = searchParams.get("mode")
  const source = searchParams.get("source")
  const redirectParam = searchParams.get("redirect")
  const initialCooldown = Number(searchParams.get("cooldown") || 0)
  const [email, setEmail] = useState(searchParams.get("email") || "")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(Number.isFinite(initialCooldown) ? initialCooldown : 0)
  const { setAuth } = useAuthStore()
  const { toast } = useToast()

  useEffect(() => {
    trackOnboardingEvent("otp_screen_viewed", {
      role,
      mode: mode || "none",
      source: source || "signup",
      hasEmail: Boolean(email),
    })
  }, [email, mode, role, source])

  useEffect(() => {
    if (email) return
    if (typeof window === "undefined") return

    const storedEmail = sessionStorage.getItem("pending-otp-email") || ""
    if (!storedEmail) {
      return
    }

    setEmail(storedEmail)

    if (!searchParams.get("email")) {
      router.replace(
        buildVerifyOtpRoute({
          email: storedEmail,
          role,
          mode,
          source,
          redirect: redirectParam,
          cooldownSeconds: cooldown || undefined,
        }),
      )
    }
  }, [cooldown, email, mode, redirectParam, role, router, searchParams, source])

  useEffect(() => {
    if (cooldown <= 0) {
      return
    }

    const timer = window.setTimeout(() => {
      setCooldown((previous) => Math.max(previous - 1, 0))
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [cooldown])

  const content = useMemo(() => {
    if (role === "instructor") {
      return {
        badge: "Instructor verification",
        title: "Verify your instructor account",
        intro:
          source === "login"
            ? "Your instructor account exists, but email verification is still required before you can continue."
            : "We have sent a 6-digit code to your email to finish creating your instructor account.",
        nextTitle: "What happens after verification",
        nextBody: "Your instructor workspace will unlock and you can continue building your teaching profile from there.",
      }
    }

    if (mode === "onsite") {
      return {
        badge: "Onsite registration verification",
        title: "Verify your registration",
        intro:
          source === "login"
            ? "Your student account is waiting for email verification before we can continue your onsite training flow."
            : "We have sent a 6-digit code to your email to complete your registration and protect your onsite payment handoff.",
        nextTitle: "What happens after verification",
        nextBody:
          "Your account becomes active. If your onsite payment is already confirmed, the rest of your access can sync immediately after login.",
      }
    }

    return {
      badge: "Student verification",
      title: "Verify your email",
      intro:
        source === "login"
          ? "Your student account exists, but email verification is still required before you can continue."
          : "We have sent a 6-digit code to your email to complete your registration.",
      nextTitle: "What happens after verification",
      nextBody: "Your account becomes active and you can continue into your learning dashboard.",
    }
  }, [mode, role, source])

  const changeEmailRoute = getOtpChangeEmailRoute({ role, mode, source })
  const maskedEmail = email ? maskEmailAddress(email) : "your email"
  const resendDisabled = resending || (flags.sharedOtpExperience && cooldown > 0)

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    trackOnboardingEvent("otp_verify_started", {
      role,
      mode: mode || "none",
      source: source || "signup",
    })

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          throw new Error(data.error || "This email is already verified. Sign in instead.")
        }
        if (res.status === 410) {
          setCooldown(0)
          throw new Error(data.error || "This OTP has expired. Request a new code.")
        }
        throw new Error(data.error || "Invalid OTP")
      }
      setAuth(data.user, data.token)
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("pending-otp-email")
      }
      trackOnboardingEvent("otp_verify_succeeded", {
        role: data.user?.role || role,
        mode: mode || "none",
        source: source || "signup",
      })
      toast({
        title: "Email verified",
        description: "Your account is now active.",
      })
      const destination = data.nextRoute || getPostVerificationRoute(data.user?.role || role, redirectParam)
      router.replace(destination)
      router.refresh()
    } catch (err: any) {
      trackOnboardingEvent("otp_verify_failed", {
        role,
        mode: mode || "none",
        source: source || "signup",
      })
      setOtp("")
      setError(err.message || "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email || resendDisabled) return
    setResending(true)
    setError("")

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend OTP")
      }

      if (typeof data?.message === "string" && /already verified/i.test(data.message)) {
        toast({
          title: "Email already verified",
          description: data.message,
        })
        router.push("/login")
        return
      }

      const nextCooldown = Number(data.otpResendCooldownSeconds) || getOtpResendCooldownSeconds()
      setCooldown(nextCooldown)
      trackOnboardingEvent("otp_resend_requested", {
        role,
        mode: mode || "none",
        source: source || "signup",
      })
      toast({
        title: data.message === "OTP resent" ? "OTP resent" : "Verification status checked",
        description:
          data.message === "OTP resent"
            ? `Check ${data.maskedDestination || maskedEmail} for the new code.`
            : data.message,
      })
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP")
    } finally {
      setResending(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted) {
      setOtp(pasted)
    }
  }

  const handleChangeEmail = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("pending-otp-email")
    }
    trackOnboardingEvent("otp_change_email_clicked", {
      role,
      mode: mode || "none",
      source: source || "signup",
    })
    router.push(changeEmailRoute)
  }

  if (!email) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Verification email missing</CardTitle>
            <CardDescription>We could not determine which email address should receive or verify the OTP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Return to the previous step, confirm the email address, and request a fresh verification code.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleChangeEmail}>Go back</Button>
              <Button variant="outline" onClick={() => router.push("/login")}>
                Open login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!flags.sharedOtpExperience) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
            <CardDescription>Enter the 6-digit code sent to {email}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onPaste={handlePaste}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="text-center font-mono text-2xl font-bold tracking-[0.4em] h-14 rounded-xl border-2 border-primary/20"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Email
              </Button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Didn&apos;t receive a code?</span>
              <Button variant="ghost" size="sm" onClick={handleResend} disabled={resending}>
                {resending ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Resending
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-3 w-3" />
                    Resend
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <Card className="w-full max-w-xl border-primary/15 shadow-xl">
        <CardHeader className="space-y-4 border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="space-y-2">
            <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {content.badge}
            </p>
            <CardTitle className="text-2xl md:text-3xl">{content.title}</CardTitle>
            <CardDescription className="text-sm md:text-base">
              {content.intro} The code was sent to <span className="font-medium text-foreground">{maskedEmail}</span>.
            </CardDescription>
          </div>

          <div className="rounded-2xl border bg-background/80 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">After verification, your account will be activated.</p>
                <p className="mt-1">Codes expire after about {getOtpExpiryMinutes()} minutes. If the code fails or expires, request a fresh one here.</p>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6 md:p-8">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="otp" className="text-sm font-semibold text-foreground">
                  6-Digit Verification Code
                </Label>
                <span className="text-xs text-muted-foreground">Numbers only</span>
              </div>
              <Input
                id="otp"
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onPaste={handlePaste}
                maxLength={6}
                className="text-center font-mono text-2xl sm:text-3xl font-bold tracking-[0.4em] sm:tracking-[0.5em] h-14 sm:h-16 rounded-2xl border-2 border-primary/20 focus-visible:border-primary focus-visible:ring-primary/20 bg-background"
              />
            </div>

            <Button type="submit" variant="cta" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify and continue"
              )}
            </Button>
          </form>

          <div className="flex flex-col gap-3 rounded-2xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Clock3 className="mt-0.5 h-4 w-4 text-primary" />
              <div>
                <p className="font-medium text-foreground">Need another code?</p>
                <p>
                  {cooldown > 0
                    ? `You can resend in ${cooldown}s.`
                    : "You can request a new OTP now if the current one has expired or was not delivered."}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" onClick={handleResend} disabled={resendDisabled}>
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending
                </>
              ) : (
                "Resend code"
              )}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-base">{content.nextTitle}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{content.nextBody}</CardContent>
            </Card>

            <Card className="border-primary/10">
              <CardHeader>
                <CardTitle className="text-base">Wrong email?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Use the same signup or login entry point to change the email and request a new verification code safely.</p>
                <Button type="button" variant="ghost" className="px-0 text-primary hover:text-primary" onClick={handleChangeEmail}>
                  Change email
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-2xl border bg-primary/5 p-4 text-sm text-muted-foreground">
            <p className="inline-flex items-center gap-2 font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> OTP-first registration protection
            </p>
            <p className="mt-2">{academyName} only creates your account after OTP verification succeeds. If verification fails, you can safely restart with the same email and details.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
