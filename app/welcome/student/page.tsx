"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, CheckCircle2, Code2, Compass, Layers, Loader2, Sparkles, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { getRoleHomePath } from "@/lib/role-routing"
import { getAcademyName } from "@/lib/brand-config"
import { useAuthStore } from "@/lib/store"

type StudentOnboardingState = {
  welcomeSeen: boolean
  profileCompletionPercent: number
  profileCompletion?: {
    percent: number
    completedCount: number
    totalCount: number
    remainingLabels: string[]
  }
  checklist: {
    completeProfile: boolean
    exploreCourses: boolean
    viewOnsiteTraining: boolean
  }
}

type CategoryItem = {
  id: string
  name: string
}

export default function StudentWelcomePage() {
  const router = useRouter()
  const { user, token, hydrated } = useAuthStore()
  const [state, setState] = useState<StudentOnboardingState | null>(null)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      router.replace("/login?redirect=/welcome/student")
      return
    }
    if (user.role !== "student") {
      router.replace(getRoleHomePath(user.role))
      return
    }

    const load = async () => {
      try {
        const [stateRes, patchRes, catRes] = await Promise.all([
          fetch("/api/onboarding/state", {
            headers: { Authorization: `Bearer ${token || ""}` },
          }),
          fetch("/api/onboarding/state", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token || ""}`,
            },
            body: JSON.stringify({ markWelcomeSeen: true }),
          }),
          fetch("/api/categories"),
        ])

        const patched = patchRes.ok ? await patchRes.json() : null
        const current = stateRes.ok ? await stateRes.json() : null
        const catData = catRes.ok ? await catRes.json() : null

        setState((patched || current) as StudentOnboardingState)
        if (catData?.categories && Array.isArray(catData.categories)) {
          setCategories(catData.categories)
        }
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [hydrated, router, token, user])

  if (!hydrated || !user || user.role !== "student") {
    return null
  }

  if (loading || !state) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center px-4 py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const remainingLabels = state.profileCompletion?.remainingLabels || []
  const isProfileComplete = state.checklist.completeProfile

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-primary/15 shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl">
          <CardHeader className="space-y-4 border-b bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <p className="inline-flex w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {getAcademyName()} Onboarding
            </p>
            <div className="space-y-2">
              <CardTitle className="text-3xl">Welcome to the Academy, {user.name}</CardTitle>
              <CardDescription className="max-w-2xl text-base">
                Your email is verified and your account is active. Learn through practical, project-based engineering tracks, complete your learner profile, and begin building real-world software.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6 md:p-8">
            {/* Practical Learning Approach Banner */}
            <div className="rounded-2xl border bg-gradient-to-r from-primary/5 via-background to-accent/5 p-4">
              <div className="flex items-start gap-3">
                <Code2 className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Project-Driven Software Education</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Every curriculum module is focused on writing production code, understanding system architecture, and deploying real projects. No filler theory—everything you build connects directly to software industry practices.
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Completion Progress */}
            <div className="rounded-2xl border bg-muted/30 p-4">
              <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Learner profile completion</p>
                  <p className="text-sm text-muted-foreground">
                    {isProfileComplete
                      ? "Your learner profile is complete and aligned with your dashboard."
                      : "Complete your technical background details to receive personalized course recommendations."}
                  </p>
                </div>
                <p className="text-sm font-semibold text-primary">{state.profileCompletionPercent}%</p>
              </div>
              <Progress value={state.profileCompletionPercent} aria-label={`Profile completion ${state.profileCompletionPercent}%`} />
              <p className="mt-3 text-xs text-muted-foreground">
                {state.profileCompletion?.completedCount ?? 0} of {state.profileCompletion?.totalCount ?? 0} profile items complete.
              </p>
              {!isProfileComplete && remainingLabels.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {remainingLabels.slice(0, 4).map((label) => (
                    <span key={label} className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            {/* Genuine Course Track Exploration if available */}
            {categories.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold text-foreground">Explore Available Learning Tracks</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <Button key={cat.id} asChild variant="outline" size="sm" className="rounded-full bg-background hover:bg-primary/10 hover:text-primary">
                      <Link href={`/courses?category=${encodeURIComponent(cat.name)}`}>
                        <Layers className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        {cat.name}
                      </Link>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Action Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-primary/10 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><UserRound className="h-4 w-4 text-primary" /> Complete profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>{isProfileComplete ? "Review and update your learner details anytime." : "Set your technical background and experience level."}</p>
                  <Button asChild variant="cta" className="h-auto w-full whitespace-normal px-4 py-3 text-center leading-snug">
                    <Link href={isProfileComplete ? "/dashboard/profile" : "/dashboard/profile/setup"}>
                      {isProfileComplete ? "Open learner hub" : "Continue guided setup"}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/10 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-primary" /> Explore courses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Browse full curriculum offerings, syllabi, and technical prerequisites.</p>
                  <Button asChild variant="outline" className="h-auto w-full whitespace-normal bg-transparent px-4 py-3 text-center leading-snug">
                    <Link href="/courses">Browse courses</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary/10 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Onsite pathway</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Optional in-person training pathway that remains accessible from your dashboard.</p>
                  <Button asChild variant="outline" className="h-auto w-full whitespace-normal bg-transparent px-4 py-3 text-center leading-snug">
                    <Link href="/dashboard/onsite-training">View onsite pathway</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-primary/15">
            <CardHeader>
              <CardTitle className="text-base">Learner journey</CardTitle>
              <CardDescription>Your progression checklist as a new student.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">1. Email verified</p>
                  <p className="text-muted-foreground">Your academy account is authenticated and active.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CheckCircle2 className={`mt-0.5 h-4 w-4 ${state.checklist.completeProfile ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="font-medium">2. Profile &amp; Experience</p>
                  <p className="text-muted-foreground">Completion: {state.profileCompletionPercent}%.</p>
                </div>
              </div>
              {!state.checklist.completeProfile && remainingLabels.length > 0 ? (
                <div className="rounded-2xl border bg-muted/30 p-3 text-xs text-muted-foreground">
                  Recommended: {remainingLabels.slice(0, 3).join(", ")}.
                </div>
              ) : null}
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">3. Explore Curriculum</p>
                  <p className="text-muted-foreground">Choose your software engineering courses and tracks.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">4. Build Projects</p>
                  <p className="text-muted-foreground">Submit capstones and track your academic progress.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button asChild variant="cta" className="h-auto w-full whitespace-normal px-4 py-3 text-center leading-snug">
            <Link href="/dashboard">Go to Student Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

