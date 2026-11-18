"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  GraduationCap,
  Laptop,
  MapPin,
  MessageSquare,
  Play,
  Plus,
  ShieldCheck,
  StickyNote,
  Trash2,
  TrendingUp,
  Wifi,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { GrowthPathMotif } from "@/components/brand/motifs"
import { WriteToInstructorModal } from "@/components/student/write-to-instructor-modal"
import { useAuthStore } from "@/lib/store"
import type { Course, Enrollment, LearningNote } from "@/lib/types"
import { formatDuration } from "@/lib/utils/format"

interface StudentProgrammeEnrolment {
  id: string
  programmeId: string
  programmeCode: string
  programmeName: string
  programmeType: string
  pathwayId: string | null
  pathwayCode: string | null
  pathwayName: string | null
  deliveryArrangement: "hybrid" | "online"
  byolAcknowledged: boolean
  status: string
  enrolledAt: string
  overallProgress: number
  cohort: {
    id: string
    code: string
    name: string
    startDate: string
    endDate: string
    delivery: string
  } | null
  campus: {
    id: string
    name: string
    address: string
    city: string
  } | null
  courses: Array<{
    id: string
    code: string | null
    title: string
    slug: string
    category: string
    role: string
    isFoundation: boolean
    thumbnail: string
    progress: number
    status: string
  }>
  sessions: Array<{
    id: string
    title: string
    sessionType: string
    sessionDate: string
    startTime: string
    endTime: string
    classroomName: string | null
    roomNumber: string | null
    meetingUrl: string | null
    isCancelled: boolean
  }>
}

export default function StudentDashboardPage() {
  const { user, token } = useAuthStore()
  const [programmes, setProgrammes] = useState<StudentProgrammeEnrolment[]>([])
  const [enrollments, setEnrollments] = useState<(Enrollment & { course: Course | undefined })[]>([])
  const [notes, setNotes] = useState<LearningNote[]>([])
  const [newNoteContent, setNewNoteContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [writeModalOpen, setWriteModalOpen] = useState(false)
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<{ id?: string; title?: string }>({})

  const authHeaders = useMemo(() => {
    return token ? { Authorization: `Bearer ${token}` } : undefined
  }, [token])

  useEffect(() => {
    if (!user) return

    async function loadDashboardData() {
      setLoading(true)
      try {
        const [progRes, enrRes, notesRes] = await Promise.all([
          fetch("/api/student/programmes", { headers: authHeaders, credentials: "include" }),
          fetch(`/api/enrollments?userId=${user?.id}`, { headers: authHeaders, credentials: "include" }),
          fetch("/api/notes", { headers: authHeaders, credentials: "include" }),
        ])

        if (progRes.ok) {
          const progData = await progRes.json()
          setProgrammes(progData.enrolments || [])
        }

        if (enrRes.ok) {
          const enrData = await enrRes.json()
          setEnrollments(enrData.enrollments || [])
        }

        if (notesRes.ok) {
          const notesData = await notesRes.json()
          setNotes(notesData.notes || [])
        }
      } catch (err) {
        console.error("Dashboard data load error:", err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [user, authHeaders])

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteContent.trim()) return

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(authHeaders || {}),
        },
        body: JSON.stringify({ content: newNoteContent.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setNotes((prev) => [data.note, ...prev].slice(0, 10))
        setNewNoteContent("")
      }
    } catch (err) {
      console.error("Failed to add note:", err)
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
        headers: authHeaders,
      })
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id))
      }
    } catch (err) {
      console.error("Failed to delete note:", err)
    }
  }

  const activeCourse = useMemo(() => {
    if (enrollments.length === 0) return null
    return enrollments.slice().sort((a, b) => (b.progress || 0) - (a.progress || 0))[0]
  }, [enrollments])

  const totalCoursesEnrolled = enrollments.length
  const completedCourses = enrollments.filter((e) => e.progress === 100).length
  const averageProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) / enrollments.length)
      : 0

  const primaryProgramme = programmes[0] || null
  const isHybrid = primaryProgramme?.deliveryArrangement === "hybrid"
  const upcomingSessions = useMemo(() => {
    return (primaryProgramme?.sessions || []).filter((s) => !s.isCancelled).slice(0, 3)
  }, [primaryProgramme])
  const isMinor = (user as { studentCategory?: string } | null)?.studentCategory === "minor"

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-6 lg:p-8">
      {/* ================= REBRAND V2 HERO GREETING & NEXT ACTION BANNER ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-skillup-hero p-6 text-white shadow-[var(--shadow-lifted)] sm:p-8 md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#613399]/35 blur-3xl" />
        <GrowthPathMotif className="pointer-events-none absolute right-2 bottom-0 h-48 w-80 text-[#D6FFF6] opacity-40" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="mint" className="text-xs font-bold uppercase tracking-wider">
                Student Learning Hub
              </Badge>
              {isMinor ? (
                <Badge variant="outline" className="border-[#D6FFF6]/40 bg-white/10 text-[#D6FFF6] text-xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Teen Scholar {(user as { schoolName?: string } | null)?.schoolName ? `(${(user as { schoolName?: string }).schoolName})` : "(13–18)"}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-[#D6FFF6]/40 bg-white/10 text-[#D6FFF6] text-xs">
                  <GraduationCap className="h-3.5 w-3.5" />
                  SkillUp Academy Learner
                </Badge>
              )}
            </div>

            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
              Welcome back, <span className="text-[#D6FFF6]">{user?.name || "Learner"}</span>
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-[#E8E3F5]/90 md:text-base">
              {activeCourse
                ? `Continue "${activeCourse.course?.title}" (${activeCourse.progress}% complete), review your upcoming sessions, or message an instructor.`
                : "Track your enrolled tracks, join scheduled Enugu Centre or live online sessions, and build verified portfolio projects."}
            </p>
          </div>

          {/* High-Contrast Action Group (Fixes legacy white-on-white button defect) */}
          <div className="flex flex-wrap gap-3 shrink-0 sm:flex-nowrap">
            {activeCourse ? (
              <Button variant="mint" size="lg" asChild className="rounded-2xl text-xs sm:text-sm">
                <Link href={`/dashboard/courses/${activeCourse.courseId}/learn`}>
                  <Play className="h-4 w-4 fill-current" />
                  Resume Lesson
                </Link>
              </Button>
            ) : (
              <Button variant="mint" size="lg" asChild className="rounded-2xl text-xs sm:text-sm">
                <Link href="/courses">
                  Explore Programmes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button
              variant="outline-dark"
              size="lg"
              onClick={() => {
                setSelectedCourseForModal({})
                setWriteModalOpen(true)
              }}
              className="rounded-2xl text-xs sm:text-sm"
            >
              <MessageSquare className="h-4 w-4" />
              Message Instructor
            </Button>
          </div>
        </div>
      </div>

      {/* ================= KPI SUMMARY STRIP ================= */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold text-muted-foreground">Enrolled Courses</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#231651]">{totalCoursesEnrolled}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold text-muted-foreground">Average Progress</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#613399]">{averageProgress}%</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold text-muted-foreground">Completed Units</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-[#0A5C4A]">{completedCourses}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
          <p className="text-xs font-semibold text-muted-foreground">Certificates Ready</p>
          <div className="mt-1 flex items-center justify-between">
            <p className="font-display text-2xl font-extrabold text-[#231651]">{completedCourses}</p>
            <Award className="h-5 w-5 text-[#613399]" />
          </div>
        </div>
      </div>

      {/* ================= BENTO GRID DASHBOARD ================= */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* BENTO TILE 1: MY PROGRAMMES & TRACKS */}
        <Card className="flex flex-col justify-between overflow-hidden rounded-3xl border-border bg-card py-0 shadow-[var(--shadow-soft)] lg:col-span-2">
          <CardHeader className="border-b border-border/70 bg-[#F8FAFB] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#613399]">Enrolled Curriculum</p>
                <CardTitle className="mt-0.5 font-display text-xl font-bold text-[#231651]">
                  My Academic Programmes
                </CardTitle>
              </div>
              <Badge variant="lavender">
                {programmes.length} Active {programmes.length === 1 ? "Track" : "Tracks"}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {loading ? (
              <div className="space-y-3 py-6">
                <div className="h-24 animate-pulse rounded-2xl bg-muted" />
                <div className="h-20 animate-pulse rounded-2xl bg-muted" />
              </div>
            ) : programmes.length > 0 ? (
              programmes.map((prog) => (
                <div
                  key={prog.id}
                  className="space-y-4 rounded-2xl border border-border bg-card p-5 transition-all hover:border-[#613399]/50"
                >
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-[#231651]">
                          {prog.pathwayName || prog.programmeName}
                        </h3>
                        <span className="rounded-md bg-[#F3EFFA] px-2 py-0.5 font-mono text-xs font-semibold text-[#613399]">
                          {prog.cohort?.code || "ACTIVE"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {prog.programmeName} &bull; Cohort: {prog.cohort?.name || "Standard Schedule"}
                      </p>
                    </div>

                    <Badge variant={prog.deliveryArrangement === "hybrid" ? "mint" : "lavender"}>
                      {prog.deliveryArrangement === "hybrid" ? "Hybrid (Enugu Centre)" : "100% Online"}
                    </Badge>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Overall Track Progress</span>
                      <span className="font-mono text-[#231651]">{prog.overallProgress}%</span>
                    </div>
                    <Progress value={prog.overallProgress} className="h-2 rounded-full" />
                  </div>

                  <div className="pt-1">
                    <p className="mb-2 text-xs font-bold text-[#231651]">Curriculum Units</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {prog.courses.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between rounded-xl border border-border/70 bg-[#F8FAFB] p-2.5 text-xs"
                        >
                          <div className="mr-2 truncate">
                            <p className="truncate font-semibold text-[#150C33]">{c.title}</p>
                            <span className="text-[10px] capitalize text-muted-foreground">{c.role} unit</span>
                          </div>
                          {c.isFoundation ? (
                            <Badge variant="mint" className="shrink-0 text-[10px]">
                              Free
                            </Badge>
                          ) : (
                            <span className="shrink-0 font-mono text-[11px] font-semibold text-[#613399]">
                              {c.progress}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/70 pt-3">
                    <span className="text-xs text-muted-foreground">
                      {prog.deliveryArrangement === "hybrid" && prog.byolAcknowledged
                        ? "BYOL Acknowledged (Power & Fibre Ready)"
                        : "Online Access Active"}
                    </span>
                    <Button asChild size="sm" variant="cta" className="text-xs">
                      <Link href="/dashboard/courses">
                        Continue Track
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <img
                  src="/images/illustrations/empty-courses.svg"
                  alt="No programmes enrolled yet"
                  className="mb-4 h-32 w-48 object-contain"
                />
                <h4 className="font-display text-base font-bold text-[#231651]">
                  No Academic Programmes Enrolled Yet
                </h4>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  Choose a Career Readiness Pathway or Skill Acquisition Course to unlock your curriculum, live mentor
                  sessions, and 2 complimentary foundation courses.
                </p>
                <Button asChild variant="cta" className="mt-4">
                  <Link href="/courses">
                    Explore Programmes Catalog
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* BENTO TILE 2: CAMPUS & LIVE SCHEDULE (Honest state-aware rendering) */}
        <Card className="flex flex-col justify-between overflow-hidden rounded-3xl border-border bg-card py-0 shadow-[var(--shadow-soft)]">
          <CardHeader className="border-b border-border/70 bg-[#F8FAFB] p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#0A5C4A]" />
              <CardTitle className="font-display text-base font-bold text-[#231651]">
                {isHybrid ? "Enugu Centre Schedule" : "Upcoming Sessions"}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {isHybrid
                ? "Hands-on workshops at 14 Garden Ave, GRA, Enugu."
                : "Your cohort and live workshop timetable."}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-6">
            {upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="space-y-2 rounded-2xl border border-border bg-[#F8FAFB] p-4 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-[#231651]">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-[#613399]" />
                        {session.title}
                      </span>
                      <Badge variant="mint" className="text-[10px]">
                        {session.startTime}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      {session.classroomName
                        ? `${session.classroomName}${session.roomNumber ? ` · Room ${session.roomNumber}` : ""}`
                        : "Live Online Session"}
                    </p>
                    {session.meetingUrl ? (
                      <Button asChild size="sm" variant="outline" className="w-full text-xs">
                        <a href={session.meetingUrl} target="_blank" rel="noopener noreferrer">
                          Join Virtual Session
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : isHybrid ? (
              <div className="space-y-3">
                <div className="space-y-2 rounded-2xl border border-[#0A5C4A]/20 bg-[#D6FFF6]/45 p-4 text-xs text-[#0A5C4A]">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Laptop className="h-4 w-4" />
                    Enugu Centre Facilities Active
                  </div>
                  <p className="leading-relaxed">
                    Bring your laptop to 14 Garden Avenue, GRA, Enugu. Your cohort timetable appears here once your
                    next lab session is published.
                  </p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] font-semibold">
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Uninterrupted Power</span>
                    <span className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Fibre Wi-Fi</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <img
                  src="/images/illustrations/empty-schedule.svg"
                  alt="No live sessions scheduled yet"
                  className="mb-3 h-28 w-44 object-contain"
                />
                <p className="font-display text-sm font-bold text-[#231651]">No Upcoming Sessions Yet</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Once you enrol in a cohort or book an onsite lab seat at our Enugu Centre, your live schedule will
                  appear right here.
                </p>
              </div>
            )}

            <Button asChild variant="outline" size="sm" className="w-full text-xs">
              <Link href="/dashboard/onsite-training">View Enugu Campus &amp; Seating</Link>
            </Button>
          </CardContent>
        </Card>

        {/* BENTO TILE 3: RESUME ACTIVE LEARNING */}
        {activeCourse ? (
          <Card className="flex flex-col justify-between overflow-hidden rounded-3xl border-border bg-card py-0 shadow-[var(--shadow-soft)]">
            <CardHeader className="border-b border-border/70 bg-[#F8FAFB] p-6">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-[#0A5C4A]">Active Course</p>
                <span className="font-mono text-xs font-semibold text-[#613399]">{activeCourse.progress}% Done</span>
              </div>
              <CardTitle className="mt-1 truncate font-display text-base font-bold text-[#231651]">
                {activeCourse.course?.title}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-6">
              <div className="group relative aspect-video overflow-hidden rounded-2xl bg-[#150C33]">
                <img
                  src={activeCourse.course?.thumbnail || "/images/courses/frontend-dev.png"}
                  alt={activeCourse.course?.title || "Active course cover"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-[#150C33]/35">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D6FFF6] text-[#0A5C4A] shadow-lg transition-transform group-hover:scale-110">
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDuration(activeCourse.course?.totalDuration || 0)}
                  </span>
                  <span>Interactive Labs</span>
                </div>
                <Progress value={activeCourse.progress} className="h-1.5 rounded-full" />
              </div>

              <Button asChild variant="cta" className="w-full text-xs">
                <Link href={`/dashboard/courses/${activeCourse.courseId}/learn`}>
                  Resume Course Player
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex flex-col justify-between overflow-hidden rounded-3xl border-border bg-card py-0 shadow-[var(--shadow-soft)]">
            <div className="aspect-[16/9] w-full overflow-hidden">
              <img
                src="/images/instructors/female-instructor-mentoring.jpg"
                alt="SkillUp instructor mentoring a learner on software projects"
                className="h-full w-full object-cover"
              />
            </div>
            <CardContent className="space-y-3 p-6">
              <Badge variant="lavender">Recommended First Step</Badge>
              <h4 className="font-display text-base font-bold text-[#231651]">Ready to Start Building?</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Pick a track or modular course to unlock video lectures, practical labs, and instructor rubric reviews.
              </p>
              <Button asChild size="sm" variant="cta" className="w-full text-xs">
                <Link href="/courses">
                  Browse Programmes
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* BENTO TILE 4: ACADEMIC CREDENTIALS & MILESTONES */}
        <Card className="flex flex-col justify-between overflow-hidden rounded-3xl border-border bg-card py-0 shadow-[var(--shadow-soft)]">
          <CardHeader className="border-b border-border/70 bg-[#F8FAFB] p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#613399]" />
              <CardTitle className="font-display text-base font-bold text-[#231651]">
                Credentials &amp; Clearance
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Track quizzes, rubric submissions, and verifiable certificates.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col justify-between space-y-4 p-6">
            {completedCourses > 0 ? (
              <div className="rounded-2xl border border-[#0A5C4A]/20 bg-[#D6FFF6]/45 p-4 text-xs text-[#0A5C4A]">
                <p className="font-bold">{completedCourses} Credential(s) Earned</p>
                <p className="mt-1">View and share your verifiable SkillUp certificates.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-2 text-center">
                <img
                  src="/images/illustrations/empty-certificates.svg"
                  alt="Certificates unlock on graduation clearance"
                  className="mb-2 h-24 w-40 object-contain"
                />
                <p className="text-xs text-muted-foreground">
                  Complete your course modules and capstone evaluation to unlock verifiable credentials.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href="/dashboard/certificates">Certificates</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link href="/verify">Verify ID</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* BENTO TILE 5: STUDY SCRATCHPAD */}
        <Card className="flex flex-col overflow-hidden rounded-3xl border-border bg-card py-0 shadow-[var(--shadow-soft)]">
          <CardHeader className="border-b border-border/70 bg-[#F8FAFB] p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-[#231651]" />
                <CardTitle className="font-display text-base font-bold text-[#231651]">Study Scratchpad</CardTitle>
              </div>
              <Badge variant="lavender" className="text-[10px]">Synced</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Save a key concept or code reminder..."
                className="h-10 flex-1 rounded-xl border border-border bg-[#F8FAFB] px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-[#613399] focus:outline-none focus:ring-2 focus:ring-[#613399]/20"
              />
              <Button type="submit" size="sm" variant="cta" aria-label="Add study note" className="h-10 px-3 shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            <div className="max-h-44 space-y-2 overflow-y-auto pr-1">
              {notes.length > 0 ? (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-start justify-between rounded-xl border border-border/70 bg-[#F8FAFB] p-3 text-xs text-foreground"
                  >
                    <p className="pr-2 leading-snug">{note.content}</p>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      aria-label="Delete note"
                      className="shrink-0 text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  <BookOpen className="mx-auto mb-1.5 h-4 w-4 text-[#613399]" />
                  No personal study notes yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================= WRITE TO INSTRUCTOR MODAL ================= */}
      <WriteToInstructorModal
        isOpen={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
        defaultCourseId={selectedCourseForModal.id}
        courseTitle={selectedCourseForModal.title}
      />
    </div>
  )
}
