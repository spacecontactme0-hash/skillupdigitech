"use client"

import type React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Sparkles, User } from "lucide-react"
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
import { instructorRegisterSchema } from "@/lib/validation"

const PASSWORD_STRENGTH = ["Weak", "Okay", "Strong"] as const

type PasswordStrength = (typeof PASSWORD_STRENGTH)[number]

type FormData = {
  name: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  professionalHeadline: string
  specialties: string
  yearsOfExperience: string
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

const DRAFT_KEY = "onboarding:draft:instructor"

export function GuidedInstructorRegistrationForm() {
  const router = useRouter()
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
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    professionalHeadline: "",
    specialties: "",
    yearsOfExperience: "0",
    acceptTerms: false,
  })

  const steps = useMemo<OnboardingShellStep[]>(
    () => [
      { id: "email", title: "Email", description: "Add the email you will verify next." },
      { id: "password", title: "Password", description: "Create a secure password for your instructor account." },
      { id: "name", title: "Full name", description: "Tell students who you are." },
      { id: "phone", title: "Phone", description: "Add a direct contact number." },
      { id: "headline", title: "Headline", description: "Summarize your engineering and teaching specialty." },
      { id: "experience", title: "Experience", description: "How many years have you been engineering or teaching technical topics?" },
      { id: "specialties", title: "Specialties", description: "List your core technical teaching topics." },
      { id: "review", title: "Review", description: "Confirm details and accept the terms." },
    ],
    [],
  )

  const stepFields = useMemo<Record<string, string[]>>(
    () => ({
      email: ["email"],
      password: ["password", "confirmPassword"],
      name: ["name"],
      phone: ["phoneNumber"],
      headline: ["professionalHeadline"],
      experience: ["yearsOfExperience"],
      specialties: ["specialties"],
      review: ["acceptTerms"],
    }),
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
      role: "instructor",
      mode: "online",
      step: steps[currentStep]?.id,
      stepIndex: currentStep + 1,
    })
  }, [currentStep, steps])

  const isReviewStep = currentStep === steps.length - 1
  const yearsOfExperienceNumber = Number(formData.yearsOfExperience)

  const isEmailComplete = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
  const isPasswordComplete = formData.password.length >= 6 && formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword
  const isNameComplete = formData.name.trim().length >= 2
  const isPhoneComplete = formData.phoneNumber.trim().length >= 7
  const isHeadlineComplete = formData.professionalHeadline.trim().length >= 5
  const isExperienceComplete = !Number.isNaN(yearsOfExperienceNumber) && yearsOfExperienceNumber >= 0 && yearsOfExperienceNumber <= 60
  const isSpecialtiesComplete = formData.specialties.trim().length >= 2
  const isReviewComplete = formData.acceptTerms

  const completedStepIds = useMemo(
    () =>
      [
        isEmailComplete ? "email" : null,
        isPasswordComplete ? "password" : null,
        isNameComplete ? "name" : null,
        isPhoneComplete ? "phone" : null,
        isHeadlineComplete ? "headline" : null,
        isExperienceComplete ? "experience" : null,
        isSpecialtiesComplete ? "specialties" : null,
        isReviewComplete ? "review" : null,
      ].filter((value): value is string => Boolean(value)),
    [
      isEmailComplete,
      isExperienceComplete,
      isHeadlineComplete,
      isNameComplete,
      isPasswordComplete,
      isPhoneComplete,
      isReviewComplete,
      isSpecialtiesComplete,
    ],
  )

  const progressValue = useMemo(() => {
    const checkpoints = [
      isEmailComplete,
      isPasswordComplete,
      isNameComplete,
      isPhoneComplete,
      isHeadlineComplete,
      isExperienceComplete,
      isSpecialtiesComplete,
      isReviewComplete,
    ]
    const completed = checkpoints.filter(Boolean).length
    return (completed / checkpoints.length) * 100
  }, [
    isEmailComplete,
    isExperienceComplete,
    isHeadlineComplete,
    isNameComplete,
    isPasswordComplete,
    isPhoneComplete,
    isReviewComplete,
    isSpecialtiesComplete,
  ])

  const validateStep = (stepIndex: number) => {
    const result = instructorRegisterSchema.safeParse({
      ...formData,
      yearsOfExperience: yearsOfExperienceNumber,
    })

    if (result.success) {
      setError("")
      return true
    }

    const fields = new Set(stepFields[steps[stepIndex].id] || [])
    const relevantIssue = result.error.issues.find((issue) => issue.path.some((pathPart) => fields.has(String(pathPart))))

    if (!relevantIssue) {
      setError("")
      return true
    }

    setError(relevantIssue.message)
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
      role: "instructor",
      mode: "online",
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
      const validated = instructorRegisterSchema.parse({
        ...formData,
        yearsOfExperience: yearsOfExperienceNumber,
      })

      const res = await fetch("/api/auth/register-instructor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      const result = await res.json()

      if (!res.ok || !result?.pendingRegistration) {
        throw new Error(result?.error || "Registration failed")
      }

      clearOnboardingDraft(DRAFT_KEY)

      const nextUrl =
        result?.nextRoute ||
        buildVerifyOtpRoute({
          email: validated.email,
          role: "instructor",
          source: "signup",
        })

      trackOnboardingEvent("signup_submitted", {
        role: "instructor",
        mode: "online",
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
        role: "instructor",
        mode: "online",
      })
      const message = submitError?.issues?.[0]?.message || submitError?.message || "Please review your details and try again"
      setError(message)
      toast({
        title: "Registration incomplete",
        description: message,
        variant: "destructive",
      })
      if (typeof window !== "undefined") {
        const topEl = document.getElementById("instructor-registration-form-top")
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
          { label: "Full name", value: formData.name },
        ],
      },
      {
        id: "teaching",
        title: "Teaching basics",
        onEdit: () => goToStep(3),
        items: [
          { label: "Phone number", value: formData.phoneNumber },
          { label: "Professional headline", value: formData.professionalHeadline },
          { label: "Years of experience", value: formData.yearsOfExperience },
          { label: "Specialties", value: formData.specialties },
        ],
      },
    ],
    [formData.email, formData.name, formData.password, formData.phoneNumber, formData.professionalHeadline, formData.specialties, formData.yearsOfExperience],
  )

  const passwordStrength = getPasswordStrength(formData.password)
  const passwordProgress = (passwordStrength.score + 1) * 33

  const aside = isReviewStep ? (
    <>
      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle className="text-base">Engineering instructor preview</CardTitle>
          <CardDescription>Start with your core technical background now, then complete the rest after verification.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2 font-medium text-foreground">
            <User className="h-4 w-4 text-primary" /> Technical Instructor Profile
          </p>
          <p>Technical portfolio, bio, avatar, and public profile polish can be completed inside instructor settings.</p>
        </CardContent>
      </Card>

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle className="text-base">What happens next</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-2 font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Verify your email, then activate your workspace.
          </p>
          <p>Once verified, you can complete your instructor profile and begin structuring your first technical course.</p>
        </CardContent>
      </Card>
    </>
  ) : null

  const footer = (
    <p className="text-center">
      Already have an account?{" "}
      <Link href="/login" className="font-medium text-primary hover:underline">
        Sign in
      </Link>
      {" "}or{" "}
      <Link href="/register" className="font-medium text-primary hover:underline">
        create a student account
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
      badge="Instructor Registration"
      title="Join as an Academy Instructor"
      description="Share your engineering expertise with students building practical, modern software systems."
      currentStep={currentStep}
      steps={steps}
      aside={aside}
      footer={footer}
      showSidebar
      expanded
      progressValue={progressValue}
      completedStepIds={completedStepIds}
    >
      <form id="instructor-registration-form-top" onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
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
              <p className="text-xs text-muted-foreground">This will be the login email for your instructor account.</p>
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
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                autoFocus
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={loading}
                required
              />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-primary" />
                <span>{formData.name ? `Hi, ${formData.name}` : "This appears on your public instructor profile."}</span>
              </div>
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
              <p className="text-xs text-muted-foreground">We use this for instructor support and course updates.</p>
            </div>
          </div>
        ) : null}

        {currentStep === 4 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="professionalHeadline">Professional Headline</Label>
              <Input
                id="professionalHeadline"
                autoFocus
                value={formData.professionalHeadline}
                onChange={(e) => setFormData({ ...formData, professionalHeadline: e.target.value })}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">Example: Senior Cloud Architect &amp; Backend Engineer</p>
            </div>
          </div>
        ) : null}

        {currentStep === 5 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="yearsOfExperience">Years of Experience</Label>
              <Input
                id="yearsOfExperience"
                type="number"
                min={0}
                max={60}
                autoFocus
                value={formData.yearsOfExperience}
                onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">Use 0 if you are just getting started.</p>
            </div>
          </div>
        ) : null}

        {currentStep === 6 ? (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties (comma separated)</Label>
              <Input
                id="specialties"
                autoFocus
                value={formData.specialties}
                onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground">Example: Full-Stack Web Development, Cloud Architecture, Databases</p>
            </div>
          </div>
        ) : null}

        {currentStep === 7 ? (
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

