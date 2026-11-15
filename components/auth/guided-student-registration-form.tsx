"use client"

import type React from "react"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, Sparkles } from "lucide-react"
import { OnboardingPreview, type OnboardingPreviewSection } from "@/components/auth/onboarding-preview"
import { OnboardingShell, type OnboardingShellStep } from "@/components/auth/onboarding-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { trackOnboardingEvent } from "@/lib/onboarding-analytics"
import { clearOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft } from "@/lib/onboarding-draft"
import { buildVerifyOtpRoute } from "@/lib/onboarding-flow"
import { getAcademyName } from "@/lib/brand-config"
import { studentRegisterSchema } from "@/lib/validation"

const PASSWORD_STRENGTH = ["Weak", "Okay", "Strong"] as const

type PasswordStrength = (typeof PASSWORD_STRENGTH)[number]

type FormData = {
  registrationType: "online"
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  whatsappNumber: string
  acceptTerms: boolean
}

function getPasswordStrength(password: string): { score: number; label: PasswordStrength } {
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1
  const normalized = Math.min(score, PASSWORD_STRENGTH.length - 1)
  return { score: normalized, label: PASSWORD_STRENGTH[normalized] }
}

function normalizeNameInput(value: string) {
  return value
    .toLowerCase()
    .replace(/(^|[\s'-])([a-z])/g, (_, prefix: string, character: string) => `${prefix}${character.toUpperCase()}`)
}

function buildFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ")
}

const DRAFT_KEY = "onboarding:draft:student"

export function GuidedStudentRegistrationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get("redirect")
  const loginHref = redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : "/login"
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [draftPrompt, setDraftPrompt] = useState(false)
  const [draftData, setDraftData] = useState<{ data: FormData; step: number } | null>(null)
  const [draftChecked, setDraftChecked] = useState(false)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [formData, setFormData] = useState<FormData>({
    registrationType: "online",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    whatsappNumber: "",
    acceptTerms: false,
  })

  const steps = useMemo<OnboardingShellStep[]>(
    () => [
      {
        id: "email",
        title: "Email",
        description: "Add the login email you will verify next.",
      },
      {
        id: "password",
        title: "Password",
        description: "Create a secure password for your academy account.",
      },
      {
        id: "name",
        title: "Name",
        description: "Add your first and last name for your academy certificates and student records.",
      },
      {
        id: "contact",
        title: "Contact",
        description: "Share a phone number and optional WhatsApp for technical cohort updates.",
      },
      {
        id: "review",
        title: "Review",
        description: "Confirm your details and accept the terms to launch your account.",
      },
    ],
    [],
  )

  useEffect(() => {
    const draft = loadOnboardingDraft<FormData>(DRAFT_KEY)
    if (draft) {
      setDraftData({ data: draft.data, step: draft.step })
      setDraftPrompt(true)
    }
    setDraftChecked(true)
  }, [])

  useEffect(() => {
    if (!draftChecked) return

    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current)
    }

    draftTimerRef.current = setTimeout(() => {
      saveOnboardingDraft(DRAFT_KEY, formData, currentStep)
    }, 300)

    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current)
      }
    }
  }, [currentStep, draftChecked, formData])

  useEffect(() => {
    trackOnboardingEvent("signup_step_viewed", {
      role: "student",
      mode: redirectParam === "/dashboard/onsite-training" ? "onsite-intent" : "online",
      step: steps[currentStep]?.id,
      stepIndex: currentStep + 1,
    })
  }, [currentStep, redirectParam, steps])

  const fullName = useMemo(() => buildFullName(formData.firstName, formData.lastName), [formData.firstName, formData.lastName])
  const firstNameGreeting = formData.firstName.trim() || "there"
  const isReviewStep = currentStep === steps.length - 1

  const buildSubmissionData = () => ({
    registrationType: formData.registrationType,
    name: fullName,
    email: formData.email,
    password: formData.password,
    confirmPassword: formData.confirmPassword,
    phoneNumber: formData.phoneNumber,
    whatsappNumber: formData.whatsappNumber,
    acceptTerms: formData.acceptTerms,
  })

  const isEmailComplete = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
  const isPasswordComplete = formData.password.length >= 6 && formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword
  const isNameComplete = formData.firstName.trim().length >= 2 && formData.lastName.trim().length >= 2
  const isContactComplete = formData.phoneNumber.trim().length >= 7
  const isReviewComplete = formData.acceptTerms

  const completedStepIds = useMemo(
    () =>
      [
        isEmailComplete ? "email" : null,
        isPasswordComplete ? "password" : null,
        isNameComplete ? "name" : null,
        isContactComplete ? "contact" : null,
        isReviewComplete ? "review" : null,
      ].filter((value): value is string => Boolean(value)),
    [isContactComplete, isEmailComplete, isNameComplete, isPasswordComplete, isReviewComplete],
  )

  const progressValue = useMemo(() => {
    const checkpoints = [isEmailComplete, isPasswordComplete, isNameComplete, isContactComplete, isReviewComplete]
    const completed = checkpoints.filter(Boolean).length
    return (completed / checkpoints.length) * 100
  }, [isContactComplete, isEmailComplete, isNameComplete, isPasswordComplete, isReviewComplete])

  const validateStep = (stepIndex: number) => {
    const activeStepId = steps[stepIndex]?.id

    if (activeStepId === "name") {
      if (formData.firstName.trim().length < 2) {
        setError("First name must be at least 2 characters")
        return false
      }

      if (formData.lastName.trim().length < 2) {
        setError("Last name must be at least 2 characters")
        return false
      }
    }

    const result = studentRegisterSchema.safeParse(buildSubmissionData())

    if (result.success) {
      setError("")
      return true
    }

    const issueByStep: Record<string, string | undefined> = {
      email: result.error.issues.find((issue) => issue.path.includes("email"))?.message,
      password:
        result.error.issues.find((issue) => issue.path.includes("password") || issue.path.includes("confirmPassword"))?.message,
      name: result.error.issues.find((issue) => issue.path.includes("name"))?.message,
      contact:
        result.error.issues.find((issue) => issue.path.includes("phoneNumber") || issue.path.includes("whatsappNumber"))?.message,
      review: result.error.issues.find((issue) => issue.path.includes("acceptTerms"))?.message,
    }

    const relevantIssue = issueByStep[activeStepId]
    if (!relevantIssue) {
      setError("")
      return true
    }

    setError(relevantIssue)
    return false
  }

  const goToStep = (stepIndex: number) => {
    setError("")
    setCurrentStep(stepIndex)
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return
    }

    trackOnboardingEvent("signup_step_completed", {
      role: "student",
      mode: redirectParam === "/dashboard/onsite-training" ? "onsite-intent" : "online",
      step: steps[currentStep]?.id,
      stepIndex: currentStep + 1,
    })
    setCurrentStep((previous) => Math.min(previous + 1, steps.length - 1))
  }

  const handleBack = () => {
    setError("")
    setCurrentStep((previous) => Math.max(previous - 1, 0))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const validated = studentRegisterSchema.parse(buildSubmissionData())
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      const result = await res.json()

      if (!res.ok || !result?.pendingRegistration) {
        throw new Error(result?.error || "Registration failed")
      }

      clearOnboardingDraft(DRAFT_KEY)

      const nextUrl = buildVerifyOtpRoute({
        email: validated.email,
        role: "student",
        source: "signup",
        redirect: redirectParam,
      })

      trackOnboardingEvent("signup_submitted", {
        role: "student",
        mode: redirectParam === "/dashboard/onsite-training" ? "onsite-intent" : "online",
        nextRoute: nextUrl,
      })

      toast({
        title: "Verification code sent",
        description: "Check your inbox and complete the final email verification step.",
      })

      if (typeof window !== "undefined") {
        sessionStorage.setItem("pending-otp-email", validated.email)
      }

      router.push(nextUrl)
      // Safety fallback: if client router has not transitioned within 500ms, force window location
      setTimeout(() => {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/verify-otp")) {
          window.location.assign(nextUrl)
        }
      }, 500)
    } catch (submitError: any) {
      trackOnboardingEvent("signup_submit_failed", {
        role: "student",
        mode: redirectParam === "/dashboard/onsite-training" ? "onsite-intent" : "online",
      })
      const message = submitError?.issues?.[0]?.message || submitError?.message || "Please review your details and try again"
      setError(message)
      toast({
        title: "Registration incomplete",
        description: message,
        variant: "destructive",
      })
      if (typeof window !== "undefined") {
        const topEl = document.getElementById("student-registration-form-top")
        if (topEl) {
          topEl.scrollIntoView({ behavior: "smooth" })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResumeDraft = () => {
    if (!draftData) {
      setDraftPrompt(false)
      return
    }
    setFormData(draftData.data)
    setCurrentStep(Math.min(draftData.step, steps.length - 1))
    setDraftPrompt(false)
  }

  const handleDiscardDraft = () => {
    clearOnboardingDraft(DRAFT_KEY)
    setDraftData(null)
    setDraftPrompt(false)
  }

  const reviewSections = useMemo<OnboardingPreviewSection[]>(
    () => [
      {
        id: "account",
        title: "Account",
        onEdit: () => goToStep(0),
        items: [
          { label: "Email", value: formData.email },
          { label: "Password", value: formData.password ? "********" : "Not set" },
          { label: "First name", value: formData.firstName },
          { label: "Last name", value: formData.lastName },
          { label: "Display name", value: fullName },
        ],
      },
      {
        id: "Contact",
        title: "Contact",
        onEdit: () => goToStep(3),
        items: [
          { label: "Phone number", value: formData.phoneNumber },
          { label: "WhatsApp", value: formData.whatsappNumber || "Not provided" },
        ],
      },
    ],
    [formData.email, formData.firstName, formData.lastName, formData.password, formData.phoneNumber, formData.whatsappNumber, fullName],
  )

  const passwordStrength = getPasswordStrength(formData.password)
  const passwordProgress = (passwordStrength.score + 1) * 33

  const aside = isReviewStep ? (
    <>
      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle className="text-base">What happens next</CardTitle>
          <CardDescription>A streamlined signup now, your learning track setup after activation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> 1-minute entry
          </p>
          <p>We only collect the essentials here so you can verify your email and activate your account quickly.</p>
          <p>Learning track preferences, project experience, and technical interests can be finalized from your student dashboard.</p>
          {redirectParam === "/dashboard/onsite-training" ? (
            <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-foreground">
              Because you came from the campaign page, successful verification will continue you straight into the onsite training flow.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle className="text-base">Verification rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2 font-medium text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> OTP expires 5 minutes after we send it.
          </p>
          <p>Your email must receive the OTP successfully before we save the pending registration.</p>
        </CardContent>
      </Card>
    </>
  ) : null

  const footer = (
    <p className="text-center">
      Already have an account?{" "}
      <Link href={loginHref} className="font-medium text-primary hover:underline">
        Sign in
      </Link>
      {" "}or{" "}
      <Link href="/register-instructor" className="font-medium text-primary hover:underline">
        register as instructor
      </Link>
    </p>
  )

  const handleKeyDown = (event: React.KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Escape" && currentStep > 0) {
      event.preventDefault()
      handleBack()
      return
    }

    if (event.key !== "Enter") {
      return
    }

    const target = event.target as HTMLElement | null
    if (target && (target.tagName === "TEXTAREA" || target.getAttribute("data-allow-enter") === "true")) {
      return
    }

    if (currentStep < steps.length - 1) {
      event.preventDefault()
      handleNext()
    }
  }

  return (
    <OnboardingShell
      badge="Student Registration"
      title="Create your student account"
      description={`Join ${getAcademyName()} to build real-world software engineering, cloud, and modern web development skills.`}
      currentStep={currentStep}
      steps={steps}
      aside={aside}
      footer={footer}
      showSidebar
      expanded
      progressValue={progressValue}
      completedStepIds={completedStepIds}
    >
      <form id="student-registration-form-top" onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
        {draftPrompt ? (
          <Alert className="border-primary/30 bg-primary/5">
            <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>We found a saved signup draft. Would you like to continue where you left off?</span>
              <span className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleDiscardDraft}>
                  Start over
                </Button>
                <Button type="button" size="sm" onClick={handleResumeDraft}>
                  Continue
                </Button>
              </span>
            </AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {currentStep === 0 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                autoFocus
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">This will be your login email.</p>
            </div>
          </div>
        ) : null}

        {currentStep === 1 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                  onClick={() => setShowPassword((previous) => !previous)}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Strength</span>
                  <Badge variant={passwordStrength.score >= 2 ? "default" : "secondary"}>{passwordStrength.label}</Badge>
                </div>
                <Progress value={passwordProgress} aria-label="Password strength" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={loading}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                  onClick={() => setShowConfirmPassword((previous) => !previous)}
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {currentStep === 2 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                autoFocus
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: normalizeNameInput(e.target.value) })}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: normalizeNameInput(e.target.value) })}
                disabled={loading}
                required
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span>
                {fullName ? `Hi, ${firstNameGreeting}. Your profile will display as ${fullName}.` : "Your first and last name will appear on your dashboard and verification messages."}
              </span>
            </div>
          </div>
        ) : null}

        {currentStep === 3 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                autoFocus
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp Number (optional)</Label>
              <Input
                id="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">We will only use this for cohort notifications and project review reminders.</p>
            </div>
          </div>
        ) : null}

        {currentStep === 4 ? (
          <div className="space-y-5">
            <OnboardingPreview sections={reviewSections} />
            <div className={`flex flex-col gap-2 rounded-2xl border p-4 transition-colors ${!formData.acceptTerms && error ? "border-destructive/60 bg-destructive/5" : "bg-muted/30"}`}>
              <div className="flex items-start gap-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => {
                    setFormData({ ...formData, acceptTerms: checked === true })
                    if (checked) setError("")
                  }}
                />
                <Label htmlFor="acceptTerms" className="text-sm font-normal leading-relaxed cursor-pointer">
                  I agree to the <Link href="/terms" target="_blank" className="text-primary font-medium hover:underline">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="text-primary font-medium hover:underline">Privacy Policy</Link>.
                </Label>
              </div>
              {!formData.acceptTerms && error && error.toLowerCase().includes("terms") ? (
                <p className="text-xs font-semibold text-destructive flex items-center gap-1.5 pl-6">
                  <AlertCircle className="h-3.5 w-3.5" /> Please check the box above to accept the terms before continuing.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={handleBack} disabled={loading || currentStep === 0}>
            Back
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button type="button" variant="cta" onClick={handleNext} disabled={loading}>
              Continue
            </Button>
          ) : (
            <Button type="submit" variant="cta" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit and Verify Email"
              )}
            </Button>
          )}
        </div>
      </form>
    </OnboardingShell>
  )
}
