"use client"

import type React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Laptop,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap,
} from "lucide-react"
import { OnboardingShell, type OnboardingShellStep } from "@/components/auth/onboarding-shell"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { trackOnboardingEvent } from "@/lib/onboarding-analytics"
import { clearOnboardingDraft, loadOnboardingDraft, saveOnboardingDraft } from "@/lib/onboarding-draft"
import { buildVerifyOtpRoute } from "@/lib/onboarding-flow"
import { studentRegisterSchema } from "@/lib/validation"

const DRAFT_KEY = "onboarding:draft:student:v2"

const PATHWAYS = [
  {
    code: "SOFTWARE_ENGINEER",
    name: "Full Stack Software Engineer",
    badge: "Core Engineering",
    duration: "6 Months",
    summary: "Modern frontend (Next.js, TypeScript), scalable backends (PostgreSQL, APIs), and cloud deployments.",
    highlights: ["Next.js & TypeScript", "PostgreSQL & Database Design", "Production DevOps & APIs"],
  },
  {
    code: "AI_ENGINEER",
    name: "AI & Machine Learning Engineer",
    badge: "High Growth",
    duration: "6 Months",
    summary: "LLMs, multi-agent frameworks, prompt engineering, vector databases, and enterprise AI automation.",
    highlights: ["LLM App Development", "Autonomous Agents", "Vector Embeddings & RAG"],
  },
  {
    code: "SOCIAL_MEDIA_MANAGEMENT",
    name: "Social Media & Growth Marketing",
    badge: "Creative & Brand",
    duration: "4 Months",
    summary: "Content architecture, viral short-form video creation, brand aesthetics, and paid ad acquisition.",
    highlights: ["Viral Video Editing", "Brand Content Strategy", "Meta & Google Ads"],
  },
]

const SPECIALIST_COURSES = [
  { slug: "applied-ai-engineering", code: "AIE-201", name: "Applied AI Engineering & LLM Systems", fee: "₦95,000" },
  { slug: "ai-agents-automation", code: "AIA-201", name: "AI Agents & Autonomous Workflows", fee: "₦90,000" },
  { slug: "modern-frontend-engineering", code: "FED-201", name: "Modern Frontend (Next.js & React)", fee: "₦85,000" },
  { slug: "scalable-backend-systems", code: "BED-201", name: "Scalable Backend & Cloud Systems", fee: "₦85,000" },
  { slug: "digital-marketing-growth", code: "DM-201", name: "Growth Marketing & Customer Acquisition", fee: "₦75,000" },
  { slug: "visual-brand-design", code: "GD-201", name: "Visual Brand Design & Creative Direction", fee: "₦65,000" },
  { slug: "short-form-video-editing", code: "VE-201", name: "Short-Form Video & Motion Content", fee: "₦70,000" },
  { slug: "social-media-management", code: "SMM-201", name: "Social Media Strategy & Content Ops", fee: "₦75,000" },
  { slug: "ai-101", code: "AI-101", name: "Artificial Intelligence 101 & Prompting", fee: "₦45,000" },
  { slug: "digital-literacy-101", code: "BDL-101", name: "Basic Digital Literacy & Computing", fee: "₦35,000" },
]

type StudentRegistrationFormData = {
  registrationType: "online"
  programmeCode: "CAREER_READINESS" | "SKILL_ACQUISITION"
  pathwayCode: string
  courseSlug: string
  deliveryArrangement: "hybrid" | "online"
  byolAcknowledged: boolean
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber: string
  whatsappNumber: string
  dateOfBirth: string
  studentCategory: "adult" | "minor"
  schoolName: string
  gradeLevel: string
  guardianName: string
  guardianEmail: string
  guardianPhone: string
  acceptTerms: boolean
}

function computeAge(dobString: string): number | null {
  if (!dobString) return null
  const dob = new Date(dobString)
  if (isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

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
  const [accountExistsAlert, setAccountExistsAlert] = useState<{ email: string; message: string } | null>(null)

  const [formData, setFormData] = useState<StudentRegistrationFormData>({
    registrationType: "online",
    programmeCode: "CAREER_READINESS",
    pathwayCode: "SOFTWARE_ENGINEER",
    courseSlug: "applied-ai-engineering",
    deliveryArrangement: "hybrid",
    byolAcknowledged: false,
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    whatsappNumber: "",
    dateOfBirth: "",
    studentCategory: "adult",
    schoolName: "",
    gradeLevel: "",
    guardianName: "",
    guardianEmail: "",
    guardianPhone: "",
    acceptTerms: false,
  })

  // Restore draft if saved
  useEffect(() => {
    const draft = loadOnboardingDraft<StudentRegistrationFormData>(DRAFT_KEY)
    if (draft && draft.data) {
      setFormData(draft.data)
      if (typeof draft.step === "number") {
        setCurrentStep(draft.step)
      }
    }
  }, [])

  // Auto-save draft
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      saveOnboardingDraft(DRAFT_KEY, formData, currentStep)
    }, 400)
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    }
  }, [formData, currentStep])

  // Derive steps dynamically based on age category
  const steps = useMemo<OnboardingShellStep[]>(() => {
    const list: OnboardingShellStep[] = [
      {
        id: "programme",
        title: "Programme",
        description: "Choose Career Readiness or Skill Acquisition.",
      },
      {
        id: "specialization",
        title: "Specialization",
        description:
          formData.programmeCode === "CAREER_READINESS"
            ? "Select your 6-month career engineering pathway."
            : "Select your specialist technology course.",
      },
      {
        id: "delivery",
        title: "Delivery Mode",
        description: "Choose Hybrid (Enugu Campus) or 100% Online.",
      },
      {
        id: "schedule_byol",
        title: "Schedule & BYOL",
        description: "Review centre facilities and acknowledge laptop requirement.",
      },
      {
        id: "account",
        title: "Account Details",
        description: "Your student credentials, contact info and birth date.",
      },
    ]

    if (formData.studentCategory === "minor") {
      list.push({
        id: "safeguarding",
        title: "Minor Safeguarding",
        description: "Parent/guardian authorization and secondary school details.",
      })
    }

    list.push({
      id: "review",
      title: "Review & Launch",
      description: "Confirm enrollment summary and submit for OTP verification.",
    })

    return list
  }, [formData.programmeCode, formData.studentCategory])

  const calculatedAge = useMemo(() => computeAge(formData.dateOfBirth), [formData.dateOfBirth])

  const fullName = useMemo(() => {
    return [formData.firstName.trim(), formData.lastName.trim()].filter(Boolean).join(" ")
  }, [formData.firstName, formData.lastName])

  const selectedPathway = useMemo(() => {
    return PATHWAYS.find((p) => p.code === formData.pathwayCode) || PATHWAYS[0]
  }, [formData.pathwayCode])

  const selectedCourse = useMemo(() => {
    return SPECIALIST_COURSES.find((c) => c.slug === formData.courseSlug) || SPECIALIST_COURSES[0]
  }, [formData.courseSlug])

  // Real-time update of minor category when DOB changes
  const handleDobChange = (dob: string) => {
    const age = computeAge(dob)
    const isUnder18 = age !== null && age < 18
    setFormData((prev) => ({
      ...prev,
      dateOfBirth: dob,
      studentCategory: isUnder18 ? "minor" : "adult",
    }))
  }

  // Step Validation
  const validateStep = (stepIdx: number): boolean => {
    const activeStep = steps[stepIdx]
    if (!activeStep) return true
    setError("")

    if (activeStep.id === "programme") {
      if (!formData.programmeCode) {
        setError("Please choose an academic programme.")
        return false
      }
    }

    if (activeStep.id === "specialization") {
      if (formData.programmeCode === "CAREER_READINESS" && !formData.pathwayCode) {
        setError("Please select a career pathway.")
        return false
      }
      if (formData.programmeCode === "SKILL_ACQUISITION" && !formData.courseSlug) {
        setError("Please select a technology course.")
        return false
      }
    }

    if (activeStep.id === "delivery") {
      if (!formData.deliveryArrangement) {
        setError("Please choose a delivery mode.")
        return false
      }
    }

    if (activeStep.id === "schedule_byol") {
      if (formData.deliveryArrangement === "hybrid" && !formData.byolAcknowledged) {
        setError("You must acknowledge the Bring Your Own Laptop (BYOL) policy to attend hybrid classes.")
        return false
      }
    }

    if (activeStep.id === "account") {
      if (formData.firstName.trim().length < 2) {
        setError("First name must be at least 2 characters.")
        return false
      }
      if (formData.lastName.trim().length < 2) {
        setError("Last name must be at least 2 characters.")
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        setError("Please provide a valid email address.")
        return false
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters long.")
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.")
        return false
      }
      if (formData.phoneNumber.trim().length < 7) {
        setError("Please enter a valid phone number.")
        return false
      }
      if (!formData.dateOfBirth) {
        setError("Please provide your date of birth.")
        return false
      }
    }

    if (activeStep.id === "safeguarding") {
      if (!formData.schoolName.trim()) {
        setError("Please enter your secondary school name.")
        return false
      }
      if (!formData.guardianName.trim()) {
        setError("Parent or guardian full name is required.")
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guardianEmail.trim())) {
        setError("A valid parent or guardian email is required for authorization.")
        return false
      }
      if (formData.guardianPhone.trim().length < 7) {
        setError("Parent or guardian emergency phone number is required.")
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) return
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setError("")
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  // Handle final submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(currentStep)) return
    if (!formData.acceptTerms) {
      setError("Please accept the academy terms of service and student code of conduct.")
      return
    }

    setLoading(true)
    setError("")
    setAccountExistsAlert(null)

    const submissionPayload = {
      registrationType: "online" as const,
      name: fullName,
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      phoneNumber: formData.phoneNumber.trim(),
      whatsappNumber: formData.whatsappNumber.trim() || formData.phoneNumber.trim(),
      acceptTerms: formData.acceptTerms,
      programmeCode: formData.programmeCode,
      pathwayCode: formData.programmeCode === "CAREER_READINESS" ? formData.pathwayCode : undefined,
      courseSlug: formData.programmeCode === "SKILL_ACQUISITION" ? formData.courseSlug : undefined,
      deliveryArrangement: formData.deliveryArrangement,
      byolAcknowledged: formData.byolAcknowledged,
      studentCategory: formData.studentCategory,
      dateOfBirth: formData.dateOfBirth,
      schoolName: formData.studentCategory === "minor" ? formData.schoolName.trim() : undefined,
      gradeLevel: formData.studentCategory === "minor" ? formData.gradeLevel.trim() : undefined,
      guardianName: formData.studentCategory === "minor" ? formData.guardianName.trim() : undefined,
      guardianEmail: formData.studentCategory === "minor" ? formData.guardianEmail.trim() : undefined,
      guardianPhone: formData.studentCategory === "minor" ? formData.guardianPhone.trim() : undefined,
    }

    try {
      const validated = studentRegisterSchema.parse(submissionPayload)
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      })
      const result = await res.json()

      if (res.status === 409 || result?.code === "ACCOUNT_EXISTS") {
        setAccountExistsAlert({
          email: validated.email,
          message: result.error || "An account with this email already exists.",
        })
        setLoading(false)
        return
      }

      if (!res.ok || !result?.pendingRegistration) {
        throw new Error(result?.error || "Registration failed. Please check your information.")
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
        mode: formData.deliveryArrangement,
        programmeCode: formData.programmeCode,
        studentCategory: formData.studentCategory,
      })

      toast({
        title: "Verification Code Sent",
        description: `Check your inbox at ${validated.email} for your 6-digit activation code.`,
      })

      if (typeof window !== "undefined") {
        sessionStorage.setItem("pending-otp-email", validated.email)
      }

      router.push(nextUrl)
      setTimeout(() => {
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/verify-otp")) {
          window.location.assign(nextUrl)
        }
      }, 500)
    } catch (err: any) {
      console.error("Registration error:", err)
      const message = err?.issues?.[0]?.message || err?.message || "Registration failed. Please try again."
      setError(message)
      toast({
        title: "Registration Incomplete",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Right-rail summary card (Aside)
  const aside = (
    <div className="space-y-4">
      {/* Dynamic Selection Card */}
      <Card className="border border-[#E8E3F5] shadow-sm bg-white overflow-hidden">
        <div className="bg-[#231651] p-4 text-white">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-[#D6FFF6]">Selected Track</p>
          <h3 className="text-base font-bold mt-0.5">
            {formData.programmeCode === "CAREER_READINESS" ? selectedPathway.name : selectedCourse.name}
          </h3>
          <p className="text-xs text-[#D6FFF6]/80 mt-1">
            {formData.programmeCode === "CAREER_READINESS"
              ? "Career Readiness Programme (6-Month Cohort)"
              : "Skill Acquisition Programme (Specialist Mastery)"}
          </p>
        </div>

        <CardContent className="p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Delivery Mode:</span>
            <span className="font-semibold text-slate-800 capitalize flex items-center gap-1">
              {formData.deliveryArrangement === "hybrid" ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  Hybrid (Enugu Centre)
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-blue-600" />
                  100% Online Remote
                </>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-slate-500 font-medium">Learner Status:</span>
            <Badge variant="outline" className={formData.studentCategory === "minor" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-slate-50 text-slate-700"}>
              {formData.studentCategory === "minor" ? "Secondary School Minor" : "Adult Learner"}
            </Badge>
          </div>

          {/* Included Free Bonus Courses */}
          <div className="pt-1">
            <p className="font-semibold text-slate-700 mb-2 flex items-center gap-1.5 text-emerald-700">
              <Sparkles className="w-3.5 h-3.5" />
              Included Free Foundation Courses:
            </p>
            <div className="space-y-1.5">
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Basic Digital Literacy (BDL-101)</p>
                  <p className="text-[10px] text-slate-500">Hardware, file systems, web navigation</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase bg-white px-2 py-0.5 rounded shadow-xs">Free</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">Basic AI 101 & Prompting (AI-101)</p>
                  <p className="text-[10px] text-slate-500">LLM fundamentals & workplace prompts</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase bg-white px-2 py-0.5 rounded shadow-xs">Free</span>
              </div>
            </div>
          </div>

          {formData.deliveryArrangement === "hybrid" && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
              <strong className="text-slate-800">BYOL Policy:</strong> Academy guarantees continuous generator power & high-speed broadband at the Enugu Centre. Student brings their personal laptop.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety & Guarantee Badge */}
      <Card className="border border-[#E8E3F5] bg-[#F8FAFB]">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs font-semibold text-[#231651] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0A5C4A]" />
            Official SkillUp Digitech Guarantee
          </p>
          <p className="text-[11px] text-slate-500 leading-normal">
            OTP email verification is strictly required before account creation. No password or card charges are made during initial application.
          </p>
        </CardContent>
      </Card>
    </div>
  )

  const activeStepId = steps[currentStep]?.id

  return (
    <OnboardingShell
      badge="SkillUp Digitech Academy"
      title="Start Your Technology Journey"
      description="Join our industry-led career cohorts in Enugu or learn online with direct instructor mentorship."
      currentStep={currentStep}
      steps={steps}
      aside={aside}
      footer={
        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-[#231651] hover:underline">
            Sign In Here
          </Link>
        </p>
      }
    >
      <div className="space-y-6" id="student-registration-form-top">
        {/* Existing Account Alert if Detected */}
        {accountExistsAlert && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900 rounded-2xl p-4">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div className="ml-3">
              <h4 className="font-bold text-sm">Account Already Exists</h4>
              <AlertDescription className="text-xs mt-1 text-amber-800 leading-relaxed">
                {accountExistsAlert.message}
              </AlertDescription>
              <div className="mt-3">
                <Button asChild size="sm" className="bg-[#231651] hover:bg-[#150C33] text-[#D6FFF6] font-semibold text-xs">
                  <Link href={`/login?email=${encodeURIComponent(accountExistsAlert.email)}&redirect=${encodeURIComponent(redirectParam || "/dashboard")}`}>
                    Sign In to Add Programme &rarr;
                  </Link>
                </Button>
              </div>
            </div>
          </Alert>
        )}

        {/* Global Error Banner */}
        {error && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* ================= STEP 1: PROGRAMME SELECTION ================= */}
        {activeStepId === "programme" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#231651]">Choose Your Academic Programme</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select between our structured multi-month career track or targeted single-subject skill training.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Option A: Career Readiness */}
              <div
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    programmeCode: "CAREER_READINESS",
                    deliveryArrangement: "hybrid",
                  }))
                }
                className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all ${
                  formData.programmeCode === "CAREER_READINESS"
                    ? "border-[#231651] bg-[#231651]/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-[#231651] text-[#D6FFF6] hover:bg-[#231651]">Career Track</Badge>
                  {formData.programmeCode === "CAREER_READINESS" && (
                    <CheckCircle2 className="w-5 h-5 text-[#231651]" />
                  )}
                </div>
                <h3 className="text-base font-bold text-[#231651]">Career Readiness Programme</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Comprehensive 4–6 month pathway designed to prepare you for direct technology employment or freelance mastery. Includes hands-on capstone projects and mentor code reviews.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Hybrid or Online</span>
                  <span className="font-semibold text-emerald-600">Foundation Courses Included</span>
                </div>
              </div>

              {/* Option B: Skill Acquisition */}
              <div
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    programmeCode: "SKILL_ACQUISITION",
                    deliveryArrangement: "online",
                  }))
                }
                className={`relative cursor-pointer rounded-2xl p-5 border-2 transition-all ${
                  formData.programmeCode === "SKILL_ACQUISITION"
                    ? "border-[#231651] bg-[#231651]/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="border-slate-300 text-slate-700">Modular Skill</Badge>
                  {formData.programmeCode === "SKILL_ACQUISITION" && (
                    <CheckCircle2 className="w-5 h-5 text-[#231651]" />
                  )}
                </div>
                <h3 className="text-base font-bold text-[#231651]">Skill Acquisition Programme</h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  Fast-paced, high-impact single-course training for professionals or self-starters. Master specific tools like AI Prompting, Video Editing, or Next.js.
                </p>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>100% Online First</span>
                  <span className="font-semibold text-emerald-600">Unlocks AI 101 Free</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: SPECIALIZATION SELECTION ================= */}
        {activeStepId === "specialization" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#231651]">
                {formData.programmeCode === "CAREER_READINESS"
                  ? "Select Your Career Engineering Pathway"
                  : "Select Your Specialist Technology Course"}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {formData.programmeCode === "CAREER_READINESS"
                  ? "Choose the specialization you will commit to for your full capstone and portfolio build."
                  : "Pick your core technology course. Basic AI 101 and Basic Digital Literacy are bundled automatically for free."}
              </p>
            </div>

            {formData.programmeCode === "CAREER_READINESS" ? (
              <div className="space-y-3">
                {PATHWAYS.map((pathway) => {
                  const isSelected = formData.pathwayCode === pathway.code
                  return (
                    <div
                      key={pathway.code}
                      onClick={() => setFormData((prev) => ({ ...prev, pathwayCode: pathway.code }))}
                      className={`cursor-pointer rounded-2xl p-4 sm:p-5 border-2 transition-all ${
                        isSelected
                          ? "border-[#231651] bg-[#231651]/5 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-[#231651]">{pathway.name}</span>
                            <Badge variant="outline" className="text-[10px] bg-slate-50">
                              {pathway.duration}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{pathway.summary}</p>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {pathway.highlights.map((h) => (
                              <span key={h} className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-slate-600">
                                {h}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="shrink-0 ml-3">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected ? "border-[#231651] bg-[#231651] text-white" : "border-slate-300"
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {SPECIALIST_COURSES.map((course) => {
                  const isSelected = formData.courseSlug === course.slug
                  return (
                    <div
                      key={course.slug}
                      onClick={() => setFormData((prev) => ({ ...prev, courseSlug: course.slug }))}
                      className={`cursor-pointer rounded-2xl p-3.5 border-2 transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#231651] bg-[#231651]/5 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span className="font-mono font-semibold text-slate-700">{course.code}</span>
                          <span className="font-bold text-slate-900">{course.fee}</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#231651] leading-snug">{course.name}</h4>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-emerald-700 font-medium">+ Free Foundation</span>
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-[#231651] bg-[#231651]" : "border-slate-300"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 3: DELIVERY MODE ================= */}
        {activeStepId === "delivery" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#231651]">Choose Your Delivery Arrangement</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select whether you will attend hands-on classes at our physical centre in Enugu or learn 100% remotely.
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Hybrid at Enugu Centre (Only available for Career Readiness) */}
              <div
                onClick={() => setFormData((prev) => ({ ...prev, deliveryArrangement: "hybrid" }))}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
                  formData.deliveryArrangement === "hybrid"
                    ? "border-[#231651] bg-[#231651]/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#231651]">Hybrid (Enugu Campus & Online)</span>
                      <Badge className="bg-emerald-600 text-white hover:bg-emerald-600 text-[10px]">
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Physical weekend/weekday practical lab sessions at <strong>14 Garden Avenue, GRA, Enugu</strong> combined with live virtual tutorials and recorded lessons.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1 text-emerald-700 font-medium">
                        <Zap className="w-3.5 h-3.5" /> 100% Guaranteed Generator Power
                      </span>
                      <span className="flex items-center gap-1 text-blue-700 font-medium">
                        <Wifi className="w-3.5 h-3.5" /> High-Speed Fibre Broadband
                      </span>
                      <span className="flex items-center gap-1 text-amber-700 font-medium">
                        <Laptop className="w-3.5 h-3.5" /> Bring Your Own Laptop (BYOL)
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 ml-3">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        formData.deliveryArrangement === "hybrid" ? "border-[#231651] bg-[#231651]" : "border-slate-300"
                      }`}
                    >
                      {formData.deliveryArrangement === "hybrid" && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Option 2: 100% Online Remote */}
              <div
                onClick={() => setFormData((prev) => ({ ...prev, deliveryArrangement: "online" }))}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all ${
                  formData.deliveryArrangement === "online"
                    ? "border-[#231651] bg-[#231651]/5 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-[#231651]">100% Online Remote Learning</span>
                      <Badge variant="outline" className="text-[10px]">Anywhere in Nigeria</Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Fully remote curriculum with weekly live scheduled virtual classes, interactive code walkthroughs on Google Meet/Discord, and 24/7 access to our digital LMS.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>✓ Flexible study pace</span>
                      <span>✓ Dedicated WhatsApp cohort</span>
                      <span>✓ 1-on-1 virtual mentor reviews</span>
                    </div>
                  </div>
                  <div className="shrink-0 ml-3">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        formData.deliveryArrangement === "online" ? "border-[#231651] bg-[#231651]" : "border-slate-300"
                      }`}
                    >
                      {formData.deliveryArrangement === "online" && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: SCHEDULE & BYOL ACKNOWLEDGEMENT ================= */}
        {activeStepId === "schedule_byol" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#231651]">Centre Facilities & Laptop Policy</h2>
              <p className="text-xs text-slate-500 mt-1">
                Please review the learning schedule and confirm your hardware readiness.
              </p>
            </div>

            {formData.deliveryArrangement === "hybrid" ? (
              <div className="space-y-4">
                {/* Centre specs */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#231651]">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Enugu Learning Centre (Main Campus)
                  </div>
                  <p className="text-xs text-slate-600">
                    14 Garden Avenue, GRA, Enugu State, Nigeria.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Uninterrupted Power (Solar + Generator)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Wifi className="w-4 h-4 text-blue-500" />
                      <span>High-Speed Fibre Broadband</span>
                    </div>
                  </div>
                </div>

                {/* Mandatory BYOL Acknowledgement */}
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <Laptop className="w-5 h-5 text-amber-700" />
                    Bring Your Own Laptop (BYOL) Requirement
                  </div>
                  <p className="text-xs text-amber-950 leading-relaxed">
                    All hybrid practical workshops at SkillUp Digitech Academy require you to bring your personal laptop computer (Windows, macOS, or Linux, minimum 8GB RAM recommended).
                    The academy provides individual desks, constant electricity, and high-speed Wi-Fi, but <strong>does not lend personal laptops</strong>.
                  </p>

                  <div className="pt-2 flex items-start space-x-3">
                    <Checkbox
                      id="byolCheckbox"
                      checked={formData.byolAcknowledged}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, byolAcknowledged: Boolean(checked) }))
                      }
                      className="mt-0.5 border-amber-600 data-[state=checked]:bg-[#231651] data-[state=checked]:border-[#231651]"
                    />
                    <Label
                      htmlFor="byolCheckbox"
                      className="text-xs font-semibold text-amber-950 leading-snug cursor-pointer"
                    >
                      I confirm and acknowledge that I will bring my own functioning laptop to all in-person classes at the Enugu Learning Centre.
                    </Label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[#231651]">
                  <Laptop className="w-4 h-4 text-blue-600" />
                  Remote Study Hardware Recommendation
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For your online sessions, you will need a personal laptop or desktop computer with reliable internet access to execute programming tasks, watch video lessons, and complete capstone code reviews.
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1">
                  <p><strong>Recommended Specs:</strong> Core i3/i5 or AMD Ryzen, 8GB RAM, SSD Storage.</p>
                  <p><strong>Class Format:</strong> Self-paced modules with scheduled weekend live virtual labs.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 5: ACCOUNT DETAILS & AGE ================= */}
        {activeStepId === "account" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-[#231651]">Personal & Account Details</h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter your legal name as it should appear on your verified academy certificates.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName" className="text-xs font-semibold">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  placeholder="e.g. Chukwuma"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName" className="text-xs font-semibold">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  placeholder="e.g. Eze"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">Email Address (Login & OTP)</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="name@example.com"
                className="rounded-xl"
              />
              <p className="text-[11px] text-slate-500">
                A 6-digit one-time code will be dispatched to this address to verify your identity.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="At least 6 characters"
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Repeat password"
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber" className="text-xs font-semibold">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="08012345678"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="whatsappNumber" className="text-xs font-semibold">WhatsApp Number (Optional)</Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                  placeholder="Same as phone if blank"
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Date of Birth & Learner Category */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="dateOfBirth" className="text-xs font-semibold">Date of Birth</Label>
                {calculatedAge !== null && (
                  <Badge
                    variant="outline"
                    className={calculatedAge < 18 ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-emerald-50 text-emerald-800 border-emerald-300"}
                  >
                    Age: {calculatedAge} ({calculatedAge < 18 ? "Secondary School Minor" : "Adult"})
                  </Badge>
                )}
              </div>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleDobChange(e.target.value)}
                className="rounded-xl"
              />
              {calculatedAge !== null && calculatedAge < 18 && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-amber-700" />
                  <strong>Youth Safeguarding Policy:</strong> Because you are under 18, our next step will request your secondary school name and parental authorization email.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 6: MINOR SAFEGUARDING (CONDITIONAL) ================= */}
        {activeStepId === "safeguarding" && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-[#E8E3F5]/40 border border-[#E8E3F5] flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-[#231651] shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-[#231651]">Minor Learner Safeguarding Clearance</h3>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  SkillUp Digitech Academy requires verified parental or legal guardian consent for all secondary school students under 18.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="schoolName" className="text-xs font-semibold">Secondary School Name</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, schoolName: e.target.value }))}
                  placeholder="e.g. CIC Enugu / Queen's School"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gradeLevel" className="text-xs font-semibold">Class / Year Level</Label>
                <Input
                  id="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, gradeLevel: e.target.value }))}
                  placeholder="e.g. SS1, SS2, SS3"
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="guardianName" className="text-xs font-semibold">Parent / Legal Guardian Full Name</Label>
              <Input
                id="guardianName"
                value={formData.guardianName}
                onChange={(e) => setFormData((prev) => ({ ...prev, guardianName: e.target.value }))}
                placeholder="e.g. Mr. & Mrs. Okeke"
                className="rounded-xl"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="guardianEmail" className="text-xs font-semibold">Guardian Email (For Authorization Link)</Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  value={formData.guardianEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guardianEmail: e.target.value }))}
                  placeholder="guardian@example.com"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="guardianPhone" className="text-xs font-semibold">Guardian Emergency Mobile Phone</Label>
                <Input
                  id="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, guardianPhone: e.target.value }))}
                  placeholder="08034567890"
                  className="rounded-xl"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Upon submitting your application, an official authorization email will be sent to your parent or guardian containing details of your curriculum and attendance guidelines.
            </p>
          </div>
        )}

        {/* ================= STEP 7: REVIEW & LAUNCH ================= */}
        {activeStepId === "review" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#231651]">Review Your Enrollment Summary</h2>
              <p className="text-xs text-slate-500 mt-1">
                Please verify your selections before we dispatch your email verification OTP.
              </p>
            </div>

            {/* Bento-styled Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Programme</p>
                  <p className="text-sm font-bold text-[#231651]">
                    {formData.programmeCode === "CAREER_READINESS" ? "Career Readiness Programme" : "Skill Acquisition Programme"}
                  </p>
                </div>
                <Badge className="bg-[#231651] text-[#D6FFF6]">
                  {formData.programmeCode === "CAREER_READINESS" ? selectedPathway.name : selectedCourse.name}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Delivery Arrangement:</span>
                  <p className="font-semibold text-slate-800 capitalize mt-0.5">
                    {formData.deliveryArrangement === "hybrid" ? "Hybrid (Enugu Centre)" : "100% Online"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Student Category:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">
                    {formData.studentCategory === "minor" ? "Secondary School Minor" : "Adult Learner"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Student Name:</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{fullName || "Not provided"}</p>
                </div>
                <div>
                  <span className="text-slate-500">Email (For OTP):</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{formData.email}</p>
                </div>
              </div>

              {formData.studentCategory === "minor" && (
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p><strong>School:</strong> {formData.schoolName} ({formData.gradeLevel || "High School"})</p>
                  <p><strong>Guardian:</strong> {formData.guardianName} ({formData.guardianEmail})</p>
                </div>
              )}

              {formData.deliveryArrangement === "hybrid" && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>BYOL Confirmed: Learner brings laptop; Academy guarantees power & internet.</span>
                </div>
              )}
            </div>

            {/* Terms and Consent Checkbox */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, acceptTerms: Boolean(checked) }))
                  }
                  className="mt-0.5"
                />
                <Label htmlFor="acceptTerms" className="text-xs text-slate-600 leading-snug cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="font-semibold text-[#231651] underline">
                    Academy Terms of Service
                  </Link>
                  ,{" "}
                  <Link href="/privacy" target="_blank" className="font-semibold text-[#231651] underline">
                    Privacy Policy
                  </Link>
                  , and Student Code of Conduct.
                </Label>
              </div>
            </div>
          </div>
        )}

        {/* ================= NAVIGATION BUTTONS ================= */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {currentStep > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={loading}
              className="rounded-xl px-5 text-xs font-semibold"
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {currentStep < steps.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-[#231651] hover:bg-[#150C33] text-[#D6FFF6] font-bold rounded-xl px-6 text-xs flex items-center gap-1.5 shadow-sm"
            >
              Continue
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !formData.acceptTerms}
              className="bg-[#231651] hover:bg-[#150C33] text-[#D6FFF6] font-bold rounded-xl px-7 text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Verification Code...
                </>
              ) : (
                <>
                  Create Account & Verify OTP
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </OnboardingShell>
  )
}
