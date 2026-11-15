"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Eye,
  EyeOff,
  GraduationCap,
  LayoutDashboard,
  MapPinned,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserCheck,
  UserIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { buildProfileRouteQuery, parseProfileRouteState } from "@/lib/profile-route-state"
import type { ProfileRouteState, ProfileTab } from "@/lib/profile-route-state"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuthStore } from "@/lib/store"
import { useToast } from "@/hooks/use-toast"
import type { ProfileCompletionItem, ProfileCompletionTracker } from "@/lib/onboarding-state"
import { DEFAULT_ONSITE_TRAINING_CONFIG, type OnsiteTrainingConfig } from "@/lib/onsite-training-shared"
import { getTrainingLocationLabel, ONSITE_TRAINING } from "@/lib/student-registration"
import type { StudentMilestoneEffort, StudentMilestoneSummary, StudentMilestoneTone } from "@/lib/student-milestones"

type SuccessState = {
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
}



type PrimaryAction =
  | {
      kind: "link"
      href: string
      label: string
      description: string
    }
  | {
      kind: "tab"
      tab: ProfileTab
      label: string
      description: string
    }

type OnsiteLocationKey = keyof OnsiteTrainingConfig["locations"]

type StudentProfilePageState = {
  profileCompletionPercent: number
  profileCompletion: ProfileCompletionTracker
  checklist?: {
    completeProfile?: boolean
  }
  onboardingState?: {
    profileSetupStartedAt?: string | Date
  }
  milestoneSummary?: StudentMilestoneSummary
}

function getInitials(name: string | undefined) {
  const value = (name || "Student").trim()
  const parts = value.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "S"
}


const SETUP_COMPLETION_KEYS = [
  "phoneNumber",
  "whatsappNumber",
  "gender",
  "dateOfBirth",
  "currentAddress",
  "isHealthcareProfessional",
  "currentRoleOrField",
  "preferredLocation",
  "trainingInterest",
] as const

const PERSONAL_SETUP_KEYS = ["phoneNumber", "whatsappNumber", "gender", "dateOfBirth", "currentAddress"] as const
const PREFERENCES_SETUP_KEYS = ["isHealthcareProfessional", "currentRoleOrField", "preferredLocation", "trainingInterest"] as const
const OPTIONAL_SETUP_KEYS = ["bio"] as const

type SetupStepId = "personal" | "preferences" | "optional"

function getMissingItems(items: ProfileCompletionItem[], keys: readonly string[]) {
  const keySet = new Set(keys)
  return items.filter((item) => keySet.has(item.key) && !item.complete)
}

function getMissingItemLabels(items: ProfileCompletionItem[], keys: readonly string[]) {
  return getMissingItems(items, keys).map((item) => item.label)
}

function getSetupStepForKey(key: string): SetupStepId | null {
  if (PERSONAL_SETUP_KEYS.includes(key as (typeof PERSONAL_SETUP_KEYS)[number])) return "personal"
  if (PREFERENCES_SETUP_KEYS.includes(key as (typeof PREFERENCES_SETUP_KEYS)[number])) return "preferences"
  if (OPTIONAL_SETUP_KEYS.includes(key as (typeof OPTIONAL_SETUP_KEYS)[number])) return "optional"
  return null
}

function getSetupHref(step: SetupStepId) {
  return `/dashboard/profile/setup?step=${step}`
}

type SetupReturnSectionId = "identity-contact" | "training-mode" | "preferences" | "additional-info"

type SetupReturnSummaryItem = {
  id: SetupReturnSectionId
  label: string
  href: string
  missingLabels: string[]
}

type TrainingValueCardProps = {
  title: string
  value?: string | null
  missingLabels?: string[]
  actionHref?: string
  actionLabel?: string
  emptyStateLabel?: string
  className?: string
}

const DEFAULT_SETUP_RETURN_SECTION_IDS: readonly SetupReturnSectionId[] = [
  "identity-contact",
  "training-mode",
  "preferences",
  "additional-info",
]

function isSetupReturnSectionId(value: string): value is SetupReturnSectionId {
  return (DEFAULT_SETUP_RETURN_SECTION_IDS as readonly string[]).includes(value)
}

function getSetupReturnSectionMeta(id: SetupReturnSectionId) {
  switch (id) {
    case "identity-contact":
      return { label: "Identity & Contact", href: getSetupHref("personal") }
    case "training-mode":
      return { label: "Training Mode", href: getSetupHref("preferences") }
    case "preferences":
      return { label: "Preferences", href: getSetupHref("preferences") }
    case "additional-info":
      return { label: "Additional Info", href: getSetupHref("personal") }
    default:
      return { label: "Training Record", href: "/dashboard/profile/setup" }
  }
}

function CompletionStateBadge({ missingCount }: { missingCount: number }) {
  return missingCount > 0 ? (
    <Badge variant="warning" className="gap-1">
      <AlertCircle className="h-3 w-3" />
      Needs attention
    </Badge>
  ) : (
    <Badge variant="success" className="gap-1">
      <CheckCircle2 className="h-3 w-3" />
      Ready
    </Badge>
  )
}

function TrainingValueCard({
  title,
  value,
  missingLabels = [],
  actionHref,
  actionLabel = "Open setup step",
  emptyStateLabel = "This detail has not been added yet.",
  className = "",
}: TrainingValueCardProps) {
  const normalizedValue = value?.trim() || ""
  const needsAttention = missingLabels.length > 0
  const hasValue = normalizedValue.length > 0

  return (
    <div
      className={`rounded-2xl border p-4 ${needsAttention ? "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/20" : "bg-background"} ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground">{title}</p>
        {needsAttention ? (
          <Badge variant="warning" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Needs attention
          </Badge>
        ) : null}
      </div>

      {needsAttention ? (
        <div className="mt-3 space-y-2">
          <p className="font-medium text-foreground">{missingLabels.join(" and ")} still need attention.</p>
          <p className="text-sm text-muted-foreground">Complete this detail to keep your learner record accurate and easier to verify.</p>
          {actionHref ? (
            <Link href={actionHref} className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
              {actionLabel}
            </Link>
          ) : null}
        </div>
      ) : hasValue ? (
        <p className="mt-1 font-medium">{normalizedValue}</p>
      ) : (
        <div className="mt-3 space-y-2">
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Awaiting update
          </Badge>
          <p className="text-sm text-muted-foreground">{emptyStateLabel}</p>
          {actionHref ? (
            <Link href={actionHref} className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
              {actionLabel}
            </Link>
          ) : null}
        </div>
      )}
    </div>
  )
}

function getMilestoneToneClasses(tone?: StudentMilestoneTone) {
  switch (tone) {
    case "sky":
      return {
        icon: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
        chip: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300",
        surface: "border-sky-200/80 bg-sky-50/70 dark:border-sky-900 dark:bg-sky-950/15",
        progress: "[&_[data-slot=progress-indicator]]:bg-sky-500",
      }
    case "emerald":
      return {
        icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
        chip: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
        surface: "border-emerald-200/80 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/15",
        progress: "[&_[data-slot=progress-indicator]]:bg-emerald-500",
      }
    case "amber":
      return {
        icon: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
        chip: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300",
        surface: "border-amber-200/80 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/15",
        progress: "[&_[data-slot=progress-indicator]]:bg-amber-500",
      }
    case "violet":
      return {
        icon: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
        chip: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300",
        surface: "border-violet-200/80 bg-violet-50/70 dark:border-violet-900 dark:bg-violet-950/15",
        progress: "[&_[data-slot=progress-indicator]]:bg-violet-500",
      }
    case "rose":
      return {
        icon: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
        chip: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300",
        surface: "border-rose-200/80 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/15",
        progress: "[&_[data-slot=progress-indicator]]:bg-rose-500",
      }
    case "indigo":
      return {
        icon: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
        chip: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-300",
        surface: "border-indigo-200/80 bg-indigo-50/70 dark:border-indigo-900 dark:bg-indigo-950/15",
        progress: "[&_[data-slot=progress-indicator]]:bg-indigo-500",
      }
    default:
      return {
        icon: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
        chip: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-950/30 dark:text-slate-300",
        surface: "border-slate-200/80 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/15",
        progress: "[&_[data-slot=progress-indicator]]:bg-slate-500",
      }
  }
}

function shouldShowMilestoneEffort(effortLabel?: StudentMilestoneEffort) {
  return Boolean(effortLabel)
}

function getMilestoneCategoryLabel(category: string) {
  return category
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function getMilestoneEffortCopy(effortLabel?: StudentMilestoneEffort) {
  switch (effortLabel) {
    case "Quick win":
      return "Short path"
    case "In reach":
      return "Building"
    case "Longer arc":
      return "Longer arc"
    default:
      return null
  }
}

function getMilestoneIcon(icon: string) {
  switch (icon) {
    case "user-check":
      return UserCheck
    case "sparkles":
      return Sparkles
    case "clipboard-list":
      return ClipboardList
    case "badge-check":
      return BadgeCheck
    case "layout-dashboard":
      return LayoutDashboard
    case "map-pinned":
      return MapPinned
    case "graduation-cap":
      return GraduationCap
    case "target":
      return Target
    case "trophy":
      return Trophy
    default:
      return BookOpen
  }
}

function getStatusCardClassName(hasMissing: boolean, isHighlighted = false) {
  if (isHighlighted) {
    return "rounded-2xl border border-primary/40 bg-primary/5 p-4 shadow-sm transition-colors"
  }

  if (hasMissing) {
    return "rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm transition-colors dark:border-amber-900 dark:bg-amber-950/20"
  }

  return "rounded-2xl border bg-background p-4 shadow-sm transition-colors"
}

function getProgressRingStrokeOffset(percent: number, radius: number) {
  const circumference = 2 * Math.PI * radius
  const safePercent = Math.min(100, Math.max(0, percent))
  return circumference - (safePercent / 100) * circumference
}

export default function ProfilePage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, token, setAuth } = useAuthStore()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("training")
  const [savingProfile, setSavingProfile] = useState(false)
  const [showTrainingModal, setShowTrainingModal] = useState(false)
  const [successState, setSuccessState] = useState<SuccessState | null>(null)
  const [pageState, setPageState] = useState<StudentProfilePageState | null>(null)
  const [onsiteConfig, setOnsiteConfig] = useState<OnsiteTrainingConfig>(DEFAULT_ONSITE_TRAINING_CONFIG)
  const [stateLoading, setStateLoading] = useState(false)
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null)
  const trainingTabRef = useRef<HTMLDivElement | null>(null)
  const milestonesSectionRef = useRef<HTMLDivElement | null>(null)
  const [animatedCompletionPercent, setAnimatedCompletionPercent] = useState(0)
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const updateProfileRoute = (updates: Partial<ProfileRouteState>) => {
    const query = buildProfileRouteQuery(searchParams, updates)
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const dismissSuccessState = () => {
    setSuccessState(null)
    updateProfileRoute({ success: null, setup: null, updated: null, highlight: null })
  }

  const routeState = useMemo(() => parseProfileRouteState(searchParams), [searchParams])

  useEffect(() => {
    const defaultTab = routeState.tab || "training"

    if (routeState.setup === "complete" || routeState.success === "setup-complete") {
      setActiveTab(defaultTab)
      setHighlightedSection(routeState.highlight || "training-profile")
      setSuccessState({
        title: "Profile setup completed",
        description:
          "Your guided setup is saved and your learner record has been refreshed below. Review the updated training record or move back into your dashboard when you are ready.",
        ctaLabel: "Open learner dashboard",
        ctaHref: "/dashboard",
      })
      return
    }

    if (routeState.success === "profile-saved") {
      setActiveTab(routeState.tab || "general")
      setHighlightedSection(routeState.highlight ?? null)
      setSuccessState({
        title: "Profile saved",
        description:
          "Your account details are updated in your learner hub. You can keep refining your profile or move back into your dashboard.",
        ctaLabel: "Open learner dashboard",
        ctaHref: "/dashboard",
      })
      return
    }

    if (routeState.success === "password-updated") {
      setActiveTab(routeState.tab || "security")
      setHighlightedSection(routeState.highlight ?? null)
      setSuccessState({
        title: "Password updated",
        description: "Your new password is active and your learner hub is still ready to use. Keep it somewhere safe and continue normally.",
        ctaLabel: "Return to learner dashboard",
        ctaHref: "/dashboard",
      })
      return
    }

    setActiveTab(defaultTab)
    setHighlightedSection(routeState.highlight ?? null)
    setSuccessState(null)
  }, [routeState])



  useEffect(() => {
    if (activeTab !== "training" || highlightedSection !== "training-profile") return

    const timeout = window.setTimeout(() => {
      trainingTabRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 180)

    return () => window.clearTimeout(timeout)
  }, [activeTab, highlightedSection])

  const scrollToMilestones = () => {
    milestonesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  useEffect(() => {
    if (!token || !user || user.role !== "student") return

    const loadState = async () => {
      setStateLoading(true)
      try {
        const res = await fetch("/api/onboarding/state", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        setPageState(data as StudentProfilePageState)
      } catch {
        // Keep the page usable even if the summary fetch fails.
      } finally {
        setStateLoading(false)
      }
    }

    void loadState()
  }, [token, user?.id, user?.role])

  useEffect(() => {
    const loadOnsiteConfig = async () => {
      try {
        const res = await fetch("/api/onsite-training")
        const data = await res.json()
        if (res.ok && data?.config) {
          setOnsiteConfig(data.config)
        }
      } catch {
        // keep fallback config for the learner hub
      }
    }

    void loadOnsiteConfig()
  }, [])

  const studentProfile = user?.studentProfile
  const isOnsiteProfile = Boolean(
    studentProfile &&
      (studentProfile.trainingMode === "onsite" ||
        (!studentProfile.trainingMode && (studentProfile.registrationFeeNgn || 0) > 0)),
  )
  const learnerBadgeLabel = isOnsiteProfile ? "Onsite Learner" : "Online Learner"
  const preferredOnsiteLocationKey: OnsiteLocationKey = studentProfile?.preferredLocation === "abuja" ? "abuja" : "enugu"
  const activeOnsiteLocation = onsiteConfig.locations[preferredOnsiteLocationKey]
  const onsiteCohortLabel = `${activeOnsiteLocation.label} Cohort`
  const onsiteSeatSignal = isOnsiteProfile
    ? studentProfile?.paymentStatus === "yes"
      ? "Seat reserved"
      : `${activeOnsiteLocation.slotsLeft} seats currently open`
    : `${activeOnsiteLocation.slotsLeft} seats currently open`
  const onsiteTimingLabel = `${activeOnsiteLocation.label} - ${activeOnsiteLocation.startsOn}`
  const onsiteVenueLabel = activeOnsiteLocation.venue
  const completionTracker = pageState?.profileCompletion
  const completionItems = completionTracker?.items || []
  const completionPercent = pageState?.profileCompletionPercent ?? completionTracker?.percent ?? 0
  const remainingLabels = completionTracker?.remainingLabels || []
  const remainingCount = Math.max((completionTracker?.totalCount || 0) - (completionTracker?.completedCount || 0), 0)
  const setupRemainingItems = getMissingItems(completionItems, SETUP_COMPLETION_KEYS)
  const setupRemainingLabels = setupRemainingItems.map((item) => item.label)
  const generalRemainingLabels = getMissingItemLabels(completionItems, ["name", "bio"])
  const personalStepMissingItems = getMissingItems(completionItems, PERSONAL_SETUP_KEYS)
  const identityContactMissingLabels = personalStepMissingItems.map((item) => item.label)
  const preferencesStepMissingItems = getMissingItems(completionItems, PREFERENCES_SETUP_KEYS)
  const preferencesMissingLabels = preferencesStepMissingItems.map((item) => item.label)
  const additionalInfoMissingItems = getMissingItems(completionItems, ["currentAddress", "currentRoleOrField", "trainingInterest"])
  const additionalInfoMissingLabels = additionalInfoMissingItems.map((item) => item.label)
  const isSetupComplete = setupRemainingLabels.length === 0
  const isProfileComplete = Boolean(pageState?.checklist?.completeProfile) || completionPercent >= 100
  const milestoneSummary = pageState?.milestoneSummary
  const onsiteMilestoneSpotlight = useMemo(() => {
    if (milestoneSummary?.featured?.key === "onsite_learner") {
      return milestoneSummary.featured
    }

    const unlockedOnsiteLearner = (milestoneSummary?.recent || []).find((milestone) => milestone.key === "onsite_learner")
    if (unlockedOnsiteLearner) {
      return unlockedOnsiteLearner
    }

    if (milestoneSummary?.featured?.key === "onsite_interested") {
      return milestoneSummary.featured
    }

    return (milestoneSummary?.recent || []).find((milestone) => milestone.key === "onsite_interested") || null
  }, [milestoneSummary])
  const onsiteStatusHeadline = isOnsiteProfile
    ? studentProfile?.paymentStatus === "yes"
      ? "Premium onsite track active"
      : "Onsite track pending payment"
    : "Premium onsite track available"
  const onsiteStatusCopy = isOnsiteProfile
    ? studentProfile?.paymentStatus === "yes"
      ? "Your learner identity now includes the premium onsite pathway, verified payment status, and training-location tracking."
      : "Your onsite route is already attached to this learner profile. Complete payment whenever you are ready to activate the premium track."
    : "You can stay on the online path and still return anytime to compare locations, pricing, and cohort details before upgrading."
  const onsiteStatusMeta = isOnsiteProfile
    ? studentProfile?.paymentStatus === "yes"
      ? `Seat reserved for ${onsiteCohortLabel}. ${studentProfile.paymentReference ? `Reference: ${studentProfile.paymentReference}` : "Payment verified in your onsite record."}`
      : `Next cohort: ${getTrainingLocationLabel(studentProfile?.preferredLocation || "enugu")} - ${studentProfile?.preferredLocationStartDate || activeOnsiteLocation.startsOn}`
    : `Compare ${onsiteCohortLabel} while ${activeOnsiteLocation.slotsLeft} seats remain.`
  const progressRingSize = 108
  const progressRingCenter = progressRingSize / 2
  const progressRingRadius = 39
  const progressRingCircumference = 2 * Math.PI * progressRingRadius
  const progressRingOffset = getProgressRingStrokeOffset(animatedCompletionPercent, progressRingRadius)
  const learnerRecordUpdatedLabel = studentProfile?.submittedAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(studentProfile.submittedAt))
    : "Awaiting first learner submission"
  const firstSetupStepForIncomplete = setupRemainingItems[0] ? getSetupStepForKey(setupRemainingItems[0].key) : null
  const missingLabelsByKey = useMemo(() => {
    const map = new Map<string, string>()
    completionItems.forEach((item) => {
      if (!item.complete) {
        map.set(item.key, item.label)
      }
    })
    return map
  }, [completionItems])
  const getFieldMissingLabels = (keys: string[]) =>
    keys.flatMap((key) => {
      const label = missingLabelsByKey.get(key)
      return label ? [label] : []
    })
  const setupReturnSummary = useMemo<SetupReturnSummaryItem[]>(() => {
    if (!(routeState.setup === "complete" || routeState.success === "setup-complete")) {
      return []
    }

    const requestedSections = routeState.updated
    const sectionIds = requestedSections
      ? requestedSections
          .split(',')
          .map((value) => value.trim())
          .filter(isSetupReturnSectionId)
      : [...DEFAULT_SETUP_RETURN_SECTION_IDS]

    return sectionIds.map((id) => {
      const meta = getSetupReturnSectionMeta(id)
      const missingLabels =
        id === "identity-contact"
          ? identityContactMissingLabels
          : id === "training-mode"
            ? preferencesMissingLabels
            : id === "preferences"
              ? preferencesMissingLabels
              : additionalInfoMissingLabels

      return {
        id,
        label: meta.label,
        href: meta.href,
        missingLabels,
      }
    })
  }, [
    additionalInfoMissingLabels,
    identityContactMissingLabels,
    preferencesMissingLabels,
    routeState.setup,
    routeState.success,
    routeState.updated,
  ])
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setAnimatedCompletionPercent(completionPercent)
    }, 40)

    return () => window.clearTimeout(timeout)
  }, [completionPercent])

  useEffect(() => {
    if (!user?.id || !milestoneSummary?.recent?.length) return

    const latestMilestone = milestoneSummary.recent[0]
    const milestoneStorageKey = `student-profile:last-milestone:${user.id}`
    const milestoneSignature = `${latestMilestone.key}:${latestMilestone.unlockedAt ? new Date(latestMilestone.unlockedAt).getTime() : 0}`
    const previousSignature = window.localStorage.getItem(milestoneStorageKey)

    if (!previousSignature) {
      window.localStorage.setItem(milestoneStorageKey, milestoneSignature)
      return
    }

    if (previousSignature !== milestoneSignature) {
      toast({
        title: "Milestone unlocked",
        description: `${latestMilestone.title} has been added to your achievements.`,
      })
      window.localStorage.setItem(milestoneStorageKey, milestoneSignature)
    }
  }, [milestoneSummary?.recent, toast, user?.id])

  const primaryAction = useMemo<PrimaryAction>(() => {
    if (!isSetupComplete) {
      return {
        kind: "link",
        href: "/dashboard/profile/setup",
        label: "Continue setup",
        description: `${setupRemainingLabels.length || 1} guided setup item${setupRemainingLabels.length === 1 ? "" : "s"} still need attention.`,
      }
    }

    if (generalRemainingLabels.length > 0) {
      return {
        kind: "tab",
        tab: "general",
        label: "Finish general profile",
        description: `Complete ${generalRemainingLabels.join(" and ")} in the General tab to reach 100%.`,
      }
    }

    if (isOnsiteProfile && studentProfile?.paymentStatus !== "yes") {
      return {
        kind: "link",
        href: "/dashboard/onsite-training",
        label: "Open onsite training",
        description: "Review your premium onsite pathway and complete payment when you are ready.",
      }
    }

    return {
      kind: "link",
      href: "/courses",
      label: "Explore courses",
      description: "Your profile is ready. Move into course discovery and begin your next learning step.",
    }
  }, [generalRemainingLabels, isOnsiteProfile, isSetupComplete, setupRemainingLabels.length, studentProfile?.paymentStatus])

  const handleSave = async () => {
    if (!user || !token) return
    setSavingProfile(true)
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name.trim(),
          bio: profile.bio.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data?.user) {
        throw new Error(data?.error || "Failed to update profile")
      }

      setAuth(data.user, token)
      updateProfileRoute({ success: "profile-saved", tab: "general" })
      setActiveTab("general")

      const stateRes = await fetch("/api/onboarding/state", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (stateRes.ok) {
        const stateData = await stateRes.json()
        setPageState(stateData as StudentProfilePageState)
      }
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordUpdate = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New passwords do not match.",
        variant: "destructive",
      })
      return
    }

    try {
      const res = await fetch("/api/users/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password")
      }

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      updateProfileRoute({ success: "password-updated", tab: "security" })
      setActiveTab("security")
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update password",
        variant: "destructive",
      })
    }
  }

  return (
    <motion.div
      className="w-full space-y-8 p-4 md:p-6 lg:p-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-balance md:text-4xl">Student Profile</h1>
        <p className="max-w-3xl text-muted-foreground">
          Your learner hub brings together identity, progress, training records, onsite status, and the next best action in one place.
        </p>
      </div>

      {successState ? (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <CheckCircle2 className="h-4 w-4" /> Success state
              </p>
              <h2 className="text-xl font-semibold">{successState.title}</h2>
              <p className="text-sm text-muted-foreground">{successState.description}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild variant="cta" className="h-auto whitespace-normal px-4 py-3 text-center leading-snug">
                <Link href={successState.ctaHref}>{successState.ctaLabel}</Link>
              </Button>
              <Button variant="outline" onClick={dismissSuccessState}>
                Stay here
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {setupReturnSummary.length > 0 ? (
        <Card className="border-primary/20 bg-background/95 shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" /> Latest setup refresh
              </p>
              <p className="text-sm text-muted-foreground">
                Your latest guided setup save refreshed these learner-record sections. Review anything still marked for attention before moving on.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {setupReturnSummary.map((section) => (
                <div
                  key={section.id}
                  className={`rounded-2xl border p-4 ${section.missingLabels.length > 0 ? "border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/20" : "bg-muted/20"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-foreground">{section.label}</p>
                    <CompletionStateBadge missingCount={section.missingLabels.length} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {section.missingLabels.length > 0
                      ? `${section.missingLabels.slice(0, 2).join(" and ")} still need attention.`
                      : "Updated in your latest setup save and now reflected in the learner record below."}
                  </p>
                  <Link
                    href={section.href}
                    className="mt-3 inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Open {section.label.toLowerCase()}
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <Card className={`overflow-hidden shadow-sm transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-lg ${
          isOnsiteProfile && studentProfile?.paymentStatus === "yes"
            ? "border-amber-300/70 bg-gradient-to-br from-amber-100/80 via-background to-orange-100/70 dark:border-amber-800/70 dark:from-amber-950/35 dark:via-background dark:to-orange-950/25"
            : "border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:border-primary/25 dark:from-primary/15 dark:via-background dark:to-accent/15"
        }`}>
          <CardContent className="flex h-full flex-col gap-6 p-6 lg:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-primary/15 text-2xl font-semibold text-primary">
                  {getInitials(user?.name)}
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold text-balance">{user?.name || "Student"}</h2>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {studentProfile?.formTitle || "Learner account"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={isOnsiteProfile ? "success" : "info"}>{learnerBadgeLabel}</Badge>
                    {isOnsiteProfile ? (
                      <Badge variant={studentProfile?.paymentStatus === "yes" ? "success" : "outline"}>{onsiteCohortLabel}</Badge>
                    ) : null}
                    <Badge variant={completionPercent >= 100 ? "success" : "outline"}>
                      {isProfileComplete ? "Profile Complete" : isSetupComplete ? "Setup Complete" : `${completionPercent}% complete`}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex min-w-[220px] flex-col gap-3 sm:items-end">
                <div className="w-full rounded-3xl border bg-background/80 p-4 shadow-sm sm:max-w-[280px]">
                  <div className="flex items-center gap-4">
                    <div className="relative inline-flex h-28 w-28 shrink-0 items-center justify-center">
                      <svg className="h-28 w-28 -rotate-90" viewBox={`0 0 ${progressRingSize} ${progressRingSize}`} aria-hidden="true">
                        <circle cx={progressRingCenter} cy={progressRingCenter} r={progressRingRadius} className="fill-none stroke-primary/10" strokeWidth="8" />
                        <circle
                          cx={progressRingCenter}
                          cy={progressRingCenter}
                          r={progressRingRadius}
                          className="fill-none stroke-primary transition-all duration-500 ease-out"
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={progressRingCircumference}
                          strokeDashoffset={progressRingOffset}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="px-1 text-[1.55rem] font-bold leading-none text-foreground">{animatedCompletionPercent}%</span>
                        <span className="mt-1 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Complete</span>
                      </div>
                    </div>
                    <div className="min-w-0 space-y-1 text-left">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Completion ring</p>
                      <p className="text-sm font-medium text-foreground">
                        {isProfileComplete ? "Fully aligned learner hub" : isSetupComplete ? "Setup complete, final polish left" : "Guided setup still in motion"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {completionTracker ? `${completionTracker.completedCount}/${completionTracker.totalCount} profile items complete` : "Loading progress"}
                      </p>
                    </div>
                  </div>
                </div>
                {isProfileComplete ? (
                  <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={scrollToMilestones}>
                    Review achievements
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Learner status</p>
                <p className="mt-2 text-base font-semibold">{learnerBadgeLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isOnsiteProfile
                    ? studentProfile?.paymentStatus === "yes"
                      ? "Your premium onsite training path is active."
                      : "Your onsite pathway is visible here even before payment is completed."
                    : "Your online learner path is active and ready for course purchases."}
                </p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Completion status</p>
                <p className="mt-2 text-base font-semibold">
                  {isProfileComplete
                    ? "Profile Complete"
                    : isSetupComplete
                      ? "Setup Complete - Profile still in progress"
                      : setupRemainingLabels.length > 0
                        ? "Guided setup still needs attention"
                        : "Profile still in progress"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isProfileComplete
                    ? "Your setup and account details are aligned across the learner profile."
                    : generalRemainingLabels.length > 0
                      ? `Finish ${generalRemainingLabels.join(" and ")} in General to reach 100%.`
                      : `Complete ${setupRemainingLabels.slice(0, 2).join(" and ")} in guided setup.`}
                </p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Edit guidance</p>
                <p className="mt-2 text-base font-semibold">
                  {generalRemainingLabels.length > 0 ? "General tab needs attention" : "Guided setup owns structured learner details"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {generalRemainingLabels.length > 0
                    ? "Use the General tab for your account name and short bio."
                    : isOnsiteProfile
                      ? "Use guided setup for learner fields and the onsite page for payment and seat status."
                      : "Use guided setup for learner fields and the General tab for account-level edits."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
              <div className={`rounded-3xl border p-5 shadow-sm ${
                isOnsiteProfile && studentProfile?.paymentStatus === "yes"
                  ? "border-amber-300/70 bg-amber-50/80 dark:border-amber-800/70 dark:bg-amber-950/20"
                  : "border-primary/20 bg-background/85 dark:border-primary/25 dark:bg-background/90"
              }`}>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={isOnsiteProfile && studentProfile?.paymentStatus === "yes" ? "success" : "outline"}>{onsiteCohortLabel}</Badge>
                  <Badge variant={isOnsiteProfile && studentProfile?.paymentStatus === "yes" ? "success" : "outline"}>{onsiteSeatSignal}</Badge>
                  <Badge variant="outline">{onsiteVenueLabel}</Badge>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Onsite identity layer</p>
                <p className="mt-3 text-lg font-semibold text-foreground">{onsiteStatusHeadline}</p>
                <p className="mt-2 text-sm text-muted-foreground">{onsiteStatusCopy}</p>
                <p className="mt-3 text-sm text-foreground">{onsiteStatusMeta}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border bg-background/80 p-3 dark:bg-background/70">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Cohort signal</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{onsiteTimingLabel}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Venue: {onsiteVenueLabel}</p>
                  </div>
                  <div className="rounded-2xl border bg-background/80 p-3 dark:bg-background/70">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Seat signal</p>
                    <p className="mt-2 text-sm font-medium text-foreground">{onsiteSeatSignal}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{activeOnsiteLocation.enrolledCount}+ learners already in this location pipeline.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant={isOnsiteProfile ? "cta" : "outline"}>
                    <Link href="/dashboard/onsite-training">
                      {isOnsiteProfile ? "Open onsite record" : "Explore onsite pathway"}
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={isOnsiteProfile ? "/dashboard/payments" : "/dashboard/profile/setup"}>
                      {isOnsiteProfile ? "View payment history" : "Finish learner record"}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className={`rounded-3xl border p-5 shadow-sm ${
                isOnsiteProfile && studentProfile?.paymentStatus === "yes"
                  ? "border-amber-300/60 bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:border-amber-800/60 dark:from-amber-950/20 dark:via-background dark:to-orange-950/10"
                  : "border-primary/20 bg-primary/5 dark:border-primary/25 dark:bg-primary/10"
              }`}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Onsite milestone spotlight</p>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {onsiteMilestoneSpotlight?.title || "Premium pathway ready"}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {onsiteMilestoneSpotlight?.description ||
                    "When you explore or activate onsite training, the learner hub will turn that step into a visible milestone rather than leaving it as a hidden payment event."}
                </p>
                {onsiteMilestoneSpotlight?.unlockedAt ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Recorded on {new Date(onsiteMilestoneSpotlight.unlockedAt).toLocaleDateString()}
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Dynamic completion</CardTitle>
              {stateLoading ? <span className="text-xs text-muted-foreground">Updating...</span> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {isProfileComplete
                ? "Your learner profile is fully complete."
                : isSetupComplete
                  ? `Guided setup is complete, but your overall profile is still ${completionPercent}% complete.`
                  : `Guided setup is still in progress and your overall profile is ${completionPercent}% complete.`}
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-3 rounded-2xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-foreground">
                  {isProfileComplete ? "Profile Complete" : isSetupComplete ? "Setup Complete - Profile Incomplete" : `Profile ${completionPercent}% complete`}
                </span>
                <span className="font-semibold text-primary">{animatedCompletionPercent}%</span>
              </div>
              <Progress value={animatedCompletionPercent} aria-label={`Profile completion ${completionPercent}%`} className="[&_[data-slot=progress-indicator]]:duration-700 [&_[data-slot=progress-indicator]]:ease-out" />
              <p className="text-xs text-muted-foreground">
                {completionTracker
                  ? `${completionTracker.completedCount} of ${completionTracker.totalCount} profile items complete.`
                  : "Loading your profile progress..."}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p className="inline-flex items-center gap-2 font-medium text-foreground">
                <Target className="h-4 w-4 text-primary" /> {isProfileComplete ? "Ready for review" : "Missing right now"}
              </p>
              {isProfileComplete ? (
                <div className="rounded-2xl border bg-background p-4 text-muted-foreground">
                  Your setup and account essentials are complete. Review your training details below or continue into courses and onsite training.
                </div>
              ) : (
                completionItems.filter((item) => !item.complete).slice(0, 5).map((item) => {
                  const setupStep = getSetupStepForKey(item.key)
                  return (
                    <div key={item.key} className="flex flex-col gap-3 rounded-2xl border bg-background p-4 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                      <span>{item.label}</span>
                      {setupStep ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={getSetupHref(setupStep)}>Open {setupStep} step</Link>
                        </Button>
                      ) : item.key === "name" || item.key === "bio" ? (
                        <Button size="sm" variant="outline" onClick={() => setActiveTab("general")}>Open General tab</Button>
                      ) : null}
                    </div>
                  )
                })
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {primaryAction.kind === "link" ? (
                <Button asChild variant="cta">
                  <Link href={primaryAction.href}>
                    {primaryAction.label}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="cta" className="h-auto whitespace-normal px-4 py-3 text-center leading-snug" onClick={() => setActiveTab(primaryAction.tab)}>
                  {primaryAction.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {!isSetupComplete ? (
                <Button asChild variant="outline" className="h-auto whitespace-normal px-4 py-3 text-center leading-snug">
                  <Link href="/dashboard/profile/setup">Open guided setup</Link>
                </Button>
              ) : (
                <Button variant="outline" className="h-auto whitespace-normal px-4 py-3 text-center leading-snug" onClick={() => setActiveTab("training")}>
                  Review training details
                </Button>
              )}
              {generalRemainingLabels.length > 0 ? (
                <Button variant="outline" className="h-auto whitespace-normal px-4 py-3 text-center leading-snug" onClick={() => setActiveTab("general")}>
                  Open General tab
                </Button>
              ) : isOnsiteProfile ? (
                <Button asChild variant="outline" className="h-auto whitespace-normal px-4 py-3 text-center leading-snug">
                  <Link href="/dashboard/onsite-training">Open onsite training</Link>
                </Button>
              ) : (
                <Button variant="outline" className="h-auto whitespace-normal px-4 py-3 text-center leading-snug" onClick={() => setActiveTab("training")}>
                  Jump to training details
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-primary/15">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-foreground">Edit in guided setup</p>
            <p className="mt-1 text-muted-foreground">Use setup for learner details like gender, address, role, preferences, and training interest.</p>
          </CardContent>
        </Card>
        <Card className="border-primary/15">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-foreground">Edit in General</p>
            <p className="mt-1 text-muted-foreground">Use the General tab for your full name and short bio when the profile still needs account-level polish.</p>
          </CardContent>
        </Card>
        <Card className="border-primary/15">
          <CardContent className="p-4 text-sm">
            <p className="font-medium text-foreground">Manage onsite training</p>
            <p className="mt-1 text-muted-foreground">Use the onsite page for premium training status, payment reference, and seat confirmation.</p>
          </CardContent>
        </Card>
      </div>

      <div ref={milestonesSectionRef} className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Achievements and Milestones</h2>
            <p className="text-sm text-muted-foreground">
              Keep this section folded when you want a lighter profile view, then open only the roadmap area you need.
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            {milestoneSummary?.totalUnlocked ?? 0} unlocked
          </Badge>
        </div>

        <Accordion type="multiple" defaultValue={["overview"]} className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.95fr)]">
          <Card className="border-primary/15">
            <AccordionItem value="overview" className="border-b-0">
              <CardHeader className="pb-0">
                <AccordionTrigger className="py-0 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <CardTitle>Milestones Overview</CardTitle>
                    <p className="text-sm font-normal text-muted-foreground">
                      Total progress, featured milestone, and category breakdown.
                    </p>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-4 pt-4">
                  <div className="rounded-2xl border bg-muted/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Unlocked</p>
                        <p className="mt-2 text-3xl font-bold">
                          {milestoneSummary?.totalUnlocked ?? 0}
                          <span className="text-base font-medium text-muted-foreground"> / {milestoneSummary?.totalAvailable ?? 20}</span>
                        </p>
                      </div>
                      <div className="rounded-2xl border bg-background px-3 py-2 text-right text-sm">
                        <p className="font-medium text-foreground">Remaining</p>
                        <p className="text-muted-foreground">{milestoneSummary?.remainingCount ?? 20}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {milestoneSummary?.featured
                        ? `${milestoneSummary.featured.title} is your latest visible milestone.`
                        : "Milestones will appear here as you move through onboarding, study, and completion."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">Milestone roadmap</span>
                      <span className="font-semibold text-primary">{milestoneSummary?.progressPercent ?? 0}%</span>
                    </div>
                    <Progress value={milestoneSummary?.progressPercent ?? 0} aria-label="Milestone progress" className="[&_[data-slot=progress-indicator]]:duration-700 [&_[data-slot=progress-indicator]]:ease-out" />
                  </div>
                  {milestoneSummary?.featured ? (
                    <div className="rounded-2xl border bg-primary/5 p-4 text-sm">
                      <p className="font-medium text-foreground">Featured</p>
                      <p className="mt-1 text-muted-foreground">{milestoneSummary.featured.description}</p>
                    </div>
                  ) : null}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground">Category progress</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {(milestoneSummary?.categories || []).map((category) => {
                        const tone = getMilestoneToneClasses(category.tone)
                        return (
                          <div key={category.category} className={`rounded-2xl border p-4 text-sm ${tone.surface}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-medium text-foreground">{category.label}</span>
                                  <Badge variant="outline" className={`text-[10px] ${tone.chip}`}>
                                    {category.unlocked}/{category.total}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">{category.summary}</p>
                              </div>
                            </div>
                            <Progress
                              className={`mt-3 [&_[data-slot=progress-indicator]]:duration-700 [&_[data-slot=progress-indicator]]:ease-out ${tone.progress}`}
                              value={category.total ? Math.round((category.unlocked / category.total) * 100) : 0}
                              aria-label={`${category.label} milestone progress`}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Milestones mix guided setup, study activity, and certificate signals. Adjust those sources via guided setup or your enrolled courses to move this roadmap.</p>
                    <div className="flex flex-wrap gap-2">

                      <Button asChild size="sm" variant="outline">
                        <Link href="/courses">Visit courses</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </AccordionItem>
          </Card>

          <Card className="border-primary/15">
            <AccordionItem value="recent" className="border-b-0">
              <CardHeader className="pb-0">
                <AccordionTrigger className="py-0 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <CardTitle>Recent Achievements</CardTitle>
                    <p className="text-sm font-normal text-muted-foreground">
                      Your newest unlocked milestones and visible progress moments.
                    </p>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
                  {(milestoneSummary?.recent || []).length > 0 ? (
                    (milestoneSummary?.recent || []).slice(0, 6).map((milestone, index) => {
                      const Icon = getMilestoneIcon(milestone.icon)
                      const tone = getMilestoneToneClasses(milestone.tone)
                      return (
                        <motion.div
                          key={milestone.key}
                          initial={index === 0 ? { opacity: 0, y: 10, scale: 0.98 } : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: index === 0 ? 0.35 : 0.28, delay: index * 0.04 }}
                          className={`rounded-2xl border p-4 text-sm transition-colors ${
                            index === 0 ? `shadow-sm ${tone.surface}` : `bg-background ${tone.surface}`
                          }`}
                        >
                          <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${tone.icon}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">{milestone.title}</p>
                            <Badge variant="outline" className={`text-[10px] ${tone.chip}`}>
                              {getMilestoneCategoryLabel(milestone.category)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">{milestone.description}</p>
                          {milestone.unlockedAt ? (
                            <p className="mt-3 text-xs text-muted-foreground">
                              Unlocked {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(milestone.unlockedAt))}
                            </p>
                          ) : null}
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground sm:col-span-2">
                      Your first achievements will appear here as you verify your account, complete setup, study lessons, and earn certificates.
                    </div>
                  )}
                </CardContent>
              </AccordionContent>
            </AccordionItem>
          </Card>

          <Card className="border-primary/15">
            <AccordionItem value="next-up" className="border-b-0">
              <CardHeader className="pb-0">
                <AccordionTrigger className="py-0 hover:no-underline">
                  <div className="space-y-1 text-left">
                    <CardTitle>Next Up</CardTitle>
                    <p className="text-sm font-normal text-muted-foreground">
                      Fold this away until you want milestone guidance and next-step nudges.
                    </p>
                  </div>
                </AccordionTrigger>
              </CardHeader>
              <AccordionContent>
                <CardContent className="space-y-3 pt-4">
                  <div className="rounded-2xl border bg-muted/30 p-4 text-sm">
                    <p className="font-medium text-foreground">Roadmap focus</p>
                    <p className="mt-1 text-muted-foreground">
                      {milestoneSummary?.remainingCount
                        ? `${milestoneSummary.remainingCount} milestone${milestoneSummary.remainingCount === 1 ? "" : "s"} still ahead on your learner journey.`
                        : "You have unlocked every currently defined student milestone."}
                    </p>
                  </div>
                  {(milestoneSummary?.nextUp || []).length > 0 ? (
                    (milestoneSummary?.nextUp || []).map((milestone) => {
                      const Icon = getMilestoneIcon(milestone.icon)
                      const tone = getMilestoneToneClasses(milestone.tone)
                      const effortCopy = getMilestoneEffortCopy(milestone.effortLabel)
                      return (
                        <div key={milestone.key} className={`rounded-2xl border p-4 text-sm ${tone.surface}`}>
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${tone.icon}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-foreground">{milestone.title}</p>
                                    <Badge variant="outline" className={`text-[10px] ${tone.chip}`}>
                                      {getMilestoneCategoryLabel(milestone.category)}
                                    </Badge>
                                    {shouldShowMilestoneEffort(milestone.effortLabel) && effortCopy ? (
                                      <Badge variant="outline" className="text-[10px]">
                                        {effortCopy}
                                      </Badge>
                                    ) : null}
                                  </div>
                                </div>
                                {typeof milestone.progressPercent === "number" ? (
                                  <span className="text-xs font-semibold text-primary">{milestone.progressPercent}%</span>
                                ) : null}
                              </div>
                              <p className="mt-1 text-muted-foreground">{milestone.description}</p>
                              {typeof milestone.progressValue === "number" && typeof milestone.targetValue === "number" ? (
                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                    <span>{milestone.progressLabel}</span>
                                    <span>{milestone.progressValue}/{milestone.targetValue}</span>
                                  </div>
                                  <Progress
                                    value={milestone.progressPercent ?? 0}
                                    aria-label={`${milestone.title} progress`}
                                    className={`h-1.5 [&_[data-slot=progress-indicator]]:duration-700 [&_[data-slot=progress-indicator]]:ease-out ${tone.progress}`}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                      Your current roadmap is fully complete. New milestone groups can build on this foundation later.
                    </div>
                  )}
                  <div className="rounded-2xl border border-muted/30 bg-muted/5 p-3 text-xs text-muted-foreground">
                    <p>Next-up prompts respond to guided setup input, consecutive study streaks, and note activity. Edit those sources via guided setup or your enrolled courses to keep progress moving.</p>
                    <div className="mt-2 flex flex-wrap gap-2">

                      <Button asChild size="sm" variant="outline">
                        <Link href="/courses">Track courses</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </AccordionContent>
            </AccordionItem>
          </Card>
        </Accordion>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="training">Training Profile</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="training">
          <Card className="border-primary/20">
            <CardHeader className="space-y-3">
              <CardTitle>{studentProfile?.formTitle || "Training Profile"}</CardTitle>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Your training profile is organized here as a learner record. Guided setup manages structured learner details, while the onsite page manages premium onsite status and payment actions. When you return from setup, the updated area is highlighted here for easy review.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              {studentProfile ? (
                <>
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                    <div className="rounded-2xl border bg-primary/5 p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Identity & Status</p>
                          <div>
                            <h3 className="text-xl font-semibold">{user?.name}</h3>
                            <p className="text-muted-foreground">{user?.email}</p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={isOnsiteProfile ? "success" : "info"}>{learnerBadgeLabel}</Badge>
                            <Badge variant={studentProfile.paymentStatus === "yes" ? "success" : "outline"}>
                              {studentProfile.paymentStatus === "yes" ? "Payment Verified" : "Payment Pending"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                          <Button asChild variant="outline">
                            <Link href={getSetupHref("personal")}>Edit learner details</Link>
                          </Button>
                          <Button asChild variant={isOnsiteProfile ? "cta" : "outline"}>
                            <Link href={isOnsiteProfile ? "/dashboard/onsite-training" : "/courses"}>
                              {isOnsiteProfile ? "Manage onsite training" : "Explore courses"}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border bg-background p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Quick Routing</p>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-2xl border bg-muted/30 p-4">
                          <p className="font-medium text-foreground">Structured learner fields</p>
                          <p className="mt-1 text-muted-foreground">Edit in guided setup for identity, preferences, address, healthcare background, and training goals.</p>
                        </div>
                        <div className="rounded-2xl border bg-muted/30 p-4">
                          <p className="font-medium text-foreground">Onsite status and payment</p>
                          <p className="mt-1 text-muted-foreground">Manage on the onsite page for payment history, seat status, and premium pathway verification.</p>
                        </div>
                        <div className="rounded-2xl border bg-muted/30 p-4">
                          <p className="font-medium text-foreground">Basic account info</p>
                          <p className="mt-1 text-muted-foreground">Edit in the General tab when you want to update your name or short bio.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-3">
                    <div className={getStatusCardClassName(identityContactMissingLabels.length > 0)}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Identity check</p>
                            <CompletionStateBadge missingCount={identityContactMissingLabels.length} />
                          </div>
                          <p className="mt-2 font-medium text-foreground">
                            {identityContactMissingLabels.length > 0 ? "Update in guided setup" : "Identity details complete"}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {identityContactMissingLabels.length > 0
                              ? `Missing: ${identityContactMissingLabels.join(", ")}.`
                              : "Phone and WhatsApp details are present in your learner record."}
                          </p>
                          <p className="mt-3 text-xs text-muted-foreground">Managed in guided setup | Last learner update {learnerRecordUpdatedLabel}</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={getSetupHref("personal")}>Open personal step</Link>
                        </Button>
                      </div>
                    </div>
                    <div className={getStatusCardClassName(preferencesMissingLabels.length > 0)}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Preferences check</p>
                            <CompletionStateBadge missingCount={preferencesMissingLabels.length} />
                          </div>
                          <p className="mt-2 font-medium text-foreground">
                            {preferencesMissingLabels.length > 0 ? "Preferences need attention" : "Preferences complete"}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {preferencesMissingLabels.length > 0
                              ? `Missing: ${preferencesMissingLabels.join(", ")}.`
                              : "Location, background, and learner preferences are complete."}
                          </p>
                          <p className="mt-3 text-xs text-muted-foreground">Managed in guided setup | Last learner update {learnerRecordUpdatedLabel}</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={getSetupHref("preferences")}>Open preferences step</Link>
                        </Button>
                      </div>
                    </div>
                    <div className={getStatusCardClassName(additionalInfoMissingLabels.length > 0)}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Additional info</p>
                            <CompletionStateBadge missingCount={additionalInfoMissingLabels.length} />
                          </div>
                          <p className="mt-2 font-medium text-foreground">
                            {additionalInfoMissingLabels.length > 0 ? "Profile story still incomplete" : "Additional learner context complete"}
                          </p>
                          <p className="mt-1 text-muted-foreground">
                            {additionalInfoMissingLabels.length > 0
                              ? `Missing: ${additionalInfoMissingLabels.join(", ")}.`
                              : "Your current role, address, and training interest are all saved."}
                          </p>
                          <p className="mt-3 text-xs text-muted-foreground">Managed in guided setup | Last learner update {learnerRecordUpdatedLabel}</p>
                        </div>
                        <Button asChild size="sm" variant="outline">
                          <Link href={getSetupHref(additionalInfoMissingItems.some((item) => item.key === "currentAddress") ? "personal" : "preferences")}>
                            Open {additionalInfoMissingItems.some((item) => item.key === "currentAddress") ? "personal" : "preferences"} step
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>


                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <UserIcon className="h-4 w-4 text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Identity & Contact</p>
                      <CompletionStateBadge missingCount={identityContactMissingLabels.length} />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <TrainingValueCard title="Full Name" value={user?.name || ""} emptyStateLabel="Update your account name in the General tab."  />
                      <TrainingValueCard title="Email" value={user?.email || ""} emptyStateLabel="Your login email appears here once your account identity is available." />
                      <TrainingValueCard
                        title="Phone Number"
                        value={studentProfile.phoneNumber}
                        missingLabels={getFieldMissingLabels(["phoneNumber"])}
                        
                      />
                      <TrainingValueCard
                        title="WhatsApp Number"
                        value={studentProfile.whatsappNumber}
                        missingLabels={getFieldMissingLabels(["whatsappNumber"])}
                        
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Training Summary</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      <TrainingValueCard title="Program" value={studentProfile.formTitle} />
                      <TrainingValueCard title="Preferred Location" value={studentProfile.preferredLocation ? `${getTrainingLocationLabel(studentProfile.preferredLocation)} - ${studentProfile.preferredLocationStartDate}` : ""} missingLabels={getFieldMissingLabels(["preferredLocation"])} />
                      <TrainingValueCard title="Domain Transition" value={studentProfile.isHealthcareProfessional ? "Yes (Healthcare / Domain Switcher)" : "No (Direct Tech Focus)"} missingLabels={getFieldMissingLabels(["isHealthcareProfessional"])} />
                      <TrainingValueCard title="Current Role or Field" value={studentProfile.currentRoleOrField} missingLabels={getFieldMissingLabels(["currentRoleOrField"])} />
                      <TrainingValueCard title="Current Address" value={studentProfile.currentAddress} missingLabels={getFieldMissingLabels(["currentAddress"])} />
                      <TrainingValueCard title="Training Interest" value={studentProfile.trainingInterest} missingLabels={getFieldMissingLabels(["trainingInterest"])} className="xl:col-span-3" />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t pt-4">
                    <Button onClick={() => setShowTrainingModal(true)} variant="outline">
                      <CalendarDays className="mr-2 h-4 w-4" />
                      View Program Summary
                    </Button>
                    <Button asChild variant={isOnsiteProfile ? "cta" : "outline"}>
                      <Link href={isOnsiteProfile ? "/dashboard/onsite-training" : "/dashboard/profile/setup"}>
                        {isOnsiteProfile ? (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {studentProfile.paymentStatus === "yes" ? "View Onsite Status" : "Manage Onsite Training"}
                          </>
                        ) : (
                          "Complete Learner Setup"
                        )}
                      </Link>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4 rounded-2xl border bg-muted/30 p-5 text-muted-foreground">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">No learner record submitted yet</p>
                    <p>Guided setup is the next real step here. Once you submit your learner details, this area will turn into your training record and status view.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="cta">
                      <Link href="/dashboard/profile/setup">Continue setup</Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/dashboard">Return to dashboard</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader className="space-y-3">
              <CardTitle>Profile Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Edit your account identity here. Guided setup still owns structured learner details, while the onsite page owns premium track payment and status updates.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-2 flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <UserIcon className="h-10 w-10 text-primary" />
                </div>
                <div className="text-sm text-muted-foreground">
                  {generalRemainingLabels.length > 0
                    ? `General still needs: ${generalRemainingLabels.join(" and ")}.`
                    : "Your account-level profile details are complete here."}
                </div>
              </div>

              <div className={getStatusCardClassName(generalRemainingLabels.length > 0)}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">General tab status</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {generalRemainingLabels.length > 0
                        ? `Finish ${generalRemainingLabels.join(" and ")} here to move your total profile closer to 100%.`
                        : "Your account identity is complete. Use guided setup or onsite training for the rest of your learner profile."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setActiveTab("training")}>
                      Review training tab
                    </Button>

                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name">Full Name</Label>
                  <Badge variant="outline" className="text-[10px] px-2">Edited here</Badge>
                </div>
                <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile.email} disabled />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio">Bio</Label>
                  <Badge variant="outline" className="text-[10px] px-2">Edited here</Badge>
                </div>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <Button onClick={handleSave} className="w-full" disabled={savingProfile}>
                <Save className="mr-2 h-4 w-4" />
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button onClick={handlePasswordUpdate} className="w-full">
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showTrainingModal} onOpenChange={setShowTrainingModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Program Summary</DialogTitle>
            <DialogDescription>
              Your submitted registration details for SkillUp.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 px-6 pb-2 text-sm">
            <p>{ONSITE_TRAINING.durationDays} Days Intensive Training</p>
            <p>{ONSITE_TRAINING.hours}+ Hours (Theory & Practical)</p>
            <p>International Certification</p>
            <p>Internship Support</p>
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" />
              Support: {ONSITE_TRAINING.supportPhone}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowTrainingModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}































