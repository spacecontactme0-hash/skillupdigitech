"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  BookOpen,
  Users,
  TrendingUp,
  Award,
  Plus,
  Eye,
  Edit,
  BarChart3,
  Clock,
  ClipboardList,
  Layers3,
  Settings,
  Sparkles,
  ClipboardCheck,
  FileCheck,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { useAuthStore } from "@/lib/store"
import { getAcademyName } from "@/lib/brand-config"
import type { Course, Enrollment } from "@/lib/types"
import { RoleAnalyticsCard } from "@/components/skillup/role-analytics-card"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { buildInstructorCourseQuality, buildInstructorEnrollmentByCourse } from "@/lib/analytics/adapters"
import { roleAnalyticsRegistry } from "@/lib/analytics/registry"

interface PendingSubmissionItem {
  id: string
  submissionType: "assignment" | "project"
  courseId: string
  courseTitle: string
  studentName: string
  title: string
  submittedAt: string | Date
}

export default function InstructorDashboard() {
  const { user, token, hydrated } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmissionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    avgRating: 0,
    totalRevenue: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalLessons: 0,
    totalAssignments: 0,
    pendingEvaluations: 0,
  })

  useEffect(() => {
    if (!hydrated || !user) return
    void loadInstructorData()
  }, [hydrated, user, token])

  const loadInstructorData = async () => {
    setLoading(true)
    try {
      const coursesRes = await fetch(`/api/courses?instructorId=${encodeURIComponent(user?.id || "")}&includeDrafts=true`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      })
      const coursesData = await coursesRes.json()
      const instructorCourses: Course[] = coursesData.courses || []
      setCourses(instructorCourses)

      const courseIds = instructorCourses.map((c: Course) => c.id)
      const courseIdQuery = courseIds.join(",")

      const [enrollmentsRes, paymentsRes] = await Promise.all([
        courseIds.length > 0
          ? fetch(`/api/enrollments?courseIds=${courseIdQuery}`, {
              headers: {
                Authorization: `Bearer ${token || ""}`,
              },
            })
          : Promise.resolve(null),
        courseIds.length > 0
          ? fetch(`/api/payments?courseIds=${courseIdQuery}`, {
              headers: {
                Authorization: `Bearer ${token || ""}`,
              },
            })
          : Promise.resolve(null),
      ])

      const enrollmentsData = enrollmentsRes ? await enrollmentsRes.json() : { enrollments: [] }
      const paymentsData = paymentsRes ? await paymentsRes.json() : { payments: [] }

      const courseEnrollments = enrollmentsData.enrollments || []
      setEnrollments(courseEnrollments)
      const enrolledStudents = new Set(courseEnrollments.map((e: Enrollment) => e.userId)).size

      const coursesWithRatings = instructorCourses.filter((c: Course) => c.rating > 0)
      const avgRating =
        coursesWithRatings.length > 0
          ? coursesWithRatings.reduce((sum: number, c: Course) => sum + c.rating, 0) /
            coursesWithRatings.length
          : 0

      const coursePayments = (paymentsData.payments || []).filter(
        (p: any) => p.status === "completed" || p.status === "success",
      )
      const totalRevenue = coursePayments.reduce((sum: number, p: any) => {
        if (p.currency === "NGN") return sum + p.amount
        if (p.currency === "USD") return sum + p.amount * 1250
        if (p.currency === "GBP") return sum + p.amount * 1580
        return sum
      }, 0)

      const publishedCourses = instructorCourses.filter((c: Course) => c.published).length
      const draftCourses = instructorCourses.filter((c: Course) => !c.published).length
      const totalLessons = instructorCourses.reduce(
        (sum: number, course: Course) =>
          sum + course.modules.reduce((moduleSum, module) => moduleSum + module.lessons.length, 0),
        0,
      )
      const totalAssignments = instructorCourses.reduce(
        (sum: number, course: Course) =>
          sum +
          course.modules.reduce(
            (moduleSum, module) =>
              moduleSum +
              module.lessons.filter((lesson) => lesson.content?.assignment || lesson.type === "assignment").length,
            0,
          ),
        0,
      )

      // Fetch pending submissions across instructor courses
      const allPending: PendingSubmissionItem[] = []
      await Promise.all(
        instructorCourses.map(async (course) => {
          try {
            const subRes = await fetch(`/api/courses/${course.id}/submissions`, {
              headers: { Authorization: `Bearer ${token || ""}` },
            })
            if (!subRes.ok) return
            const subData = await subRes.json()

            for (const asub of subData.assignmentSubmissions || []) {
              if (!asub.grade) {
                allPending.push({
                  id: asub.id,
                  submissionType: "assignment",
                  courseId: course.id,
                  courseTitle: course.title,
                  studentName: asub.student?.name || "Student",
                  title: `Assignment (${asub.assignmentId?.slice(0, 8) || "Task"})`,
                  submittedAt: asub.submittedAt,
                })
              }
            }

            for (const psub of subData.projectSubmissions || []) {
              if (!psub.grade) {
                allPending.push({
                  id: psub.id,
                  submissionType: "project",
                  courseId: course.id,
                  courseTitle: course.title,
                  studentName: psub.student?.name || "Student",
                  title: psub.title || "Capstone Project",
                  submittedAt: psub.submittedAt,
                })
              }
            }
          } catch {
            // Ignore individual course fetch errors
          }
        }),
      )

      allPending.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      setPendingSubmissions(allPending)

      setStats({
        totalCourses: instructorCourses.length,
        totalStudents: enrolledStudents,
        totalEnrollments: courseEnrollments.length,
        avgRating: Number(avgRating.toFixed(1)),
        totalRevenue,
        publishedCourses,
        draftCourses,
        totalLessons,
        totalAssignments,
        pendingEvaluations: allPending.length,
      })
    } catch (error) {
      console.error("Error loading instructor data:", error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: "Active Courses",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      subtitle: `${stats.publishedCourses} published, ${stats.draftCourses} drafts`,
    },
    {
      title: "Evaluation Queue",
      value: stats.pendingEvaluations,
      icon: ClipboardCheck,
      color: stats.pendingEvaluations > 0 ? "text-amber-600" : "text-emerald-600",
      bgColor: stats.pendingEvaluations > 0 ? "bg-amber-50 dark:bg-amber-950/40" : "bg-emerald-50 dark:bg-emerald-950/40",
      subtitle: stats.pendingEvaluations > 0 ? "Submissions awaiting your review" : "All submissions evaluated",
    },
    {
      title: "Technical Lessons",
      value: stats.totalLessons,
      icon: Layers3,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
      subtitle: "Published and draft curriculum lessons",
    },
    {
      title: "Enrolled Students",
      value: stats.totalStudents,
      icon: Users,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
      subtitle: `${stats.totalEnrollments} total course enrollments`,
    },
    {
      title: "Faculty Rating",
      value: `${stats.avgRating} / 5.0`,
      icon: Award,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      subtitle: "Based on verified student reviews",
    },
    {
      title: "Course Revenue",
      value: `NGN ${stats.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      subtitle: "From verified learner payments",
    },
  ]

  const needsAttention = useMemo(() => {
    const draftCourses = courses.filter((course) => !course.published)
    const lowRatedCourses = courses.filter((course) => course.published && course.rating > 0 && course.rating < 4)
    const zeroEnrollmentCourses = courses.filter((course) => course.published && (course.enrollmentCount || 0) === 0)

    return [
      stats.pendingEvaluations > 0
        ? {
            title: `${stats.pendingEvaluations} student submission${stats.pendingEvaluations === 1 ? "" : "s"} await evaluation`,
            description: "Review submitted code, verify deployment artifacts, and assign rubric scores.",
            href: "/instructor/evaluations",
            label: "Open Evaluation Queue",
            isUrgent: true,
          }
        : null,
      draftCourses.length > 0
        ? {
            title: `${draftCourses.length} draft course${draftCourses.length === 1 ? "" : "s"} ready for review`,
            description: "Complete modules and technical lessons before submitting for publishing.",
            href: "/instructor/courses",
            label: "Review drafts",
            isUrgent: false,
          }
        : null,
      lowRatedCourses.length > 0
        ? {
            title: `${lowRatedCourses.length} course${lowRatedCourses.length === 1 ? " needs" : "s need"} quality attention`,
            description: "One or more live courses are trending below a 4.0 average student rating.",
            href: "/instructor/analytics",
            label: "Open analytics",
            isUrgent: false,
          }
        : null,
      zeroEnrollmentCourses.length > 0
        ? {
            title: `${zeroEnrollmentCourses.length} published course${zeroEnrollmentCourses.length === 1 ? " has" : "s have"} no enrollments yet`,
            description: "Review learning outcomes, prerequisites, and pricing to improve discovery.",
            href: "/instructor/courses",
            label: "Manage courses",
            isUrgent: false,
          }
        : null,
    ].filter(Boolean) as Array<{ title: string; description: string; href: string; label: string; isUrgent?: boolean }>
  }, [courses, stats.pendingEvaluations])

  const enrollmentByCourse = buildInstructorEnrollmentByCourse(courses, enrollments)
  const qualityByCourse = buildInstructorCourseQuality(courses)
  const [enrollmentMeta, qualityMeta] = roleAnalyticsRegistry.instructor

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      {/* Welcome Banner */}
      <Card
        variant="elevated"
        className="overflow-hidden border-border/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-100 shadow-xl"
      >
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.6fr_1fr] lg:p-8">
          <div className="space-y-4">
            <Badge className="w-fit bg-blue-600 text-white hover:bg-blue-700">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              {getAcademyName()} — Engineering Faculty Workspace
            </Badge>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                Welcome back, {user?.name || "Instructor"}!
              </h1>
              <p className="mt-2 max-w-2xl text-slate-300">
                Manage your technical curriculum, author code-oriented lessons, evaluate capstone projects, and maintain high standards for your software engineering courses.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild className="bg-blue-600 text-white hover:bg-blue-700">
                <Link href="/instructor/courses/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Course
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700">
                <Link href="/instructor/evaluations">
                  <ClipboardCheck className="mr-2 h-4 w-4 text-blue-400" />
                  Evaluation Workspace
                  {stats.pendingEvaluations > 0 && (
                    <Badge className="ml-2 bg-amber-600 text-white text-[10px] h-5 px-1.5">
                      {stats.pendingEvaluations}
                    </Badge>
                  )}
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-slate-700 bg-slate-800/80 text-white hover:bg-slate-700">
                <Link href="/instructor/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Faculty Profile
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Published Courses</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.publishedCourses}</p>
              <p className="text-xs text-slate-400 mt-0.5">Live courses actively training developers</p>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Curriculum Content</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.totalLessons} lessons</p>
              <p className="text-xs text-slate-400 mt-0.5">Technical modules, videos & markdown guides</p>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Submissions Queue</p>
              <p className="mt-1 text-2xl font-bold text-white">{stats.pendingEvaluations} pending</p>
              <p className="text-xs text-slate-400 mt-0.5">Assignments & capstone projects awaiting review</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Needs Attention / Evaluation Alerts */}
      {needsAttention.length > 0 ? (
        <Card variant="elevated" className="border-amber-300/60 bg-gradient-to-br from-amber-50/50 to-background dark:border-amber-900/50 dark:from-amber-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-amber-900 dark:text-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Faculty Action Items & Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {needsAttention.map((item) => (
              <div
                key={item.title}
                className={`rounded-xl border p-4 ${
                  item.isUrgent
                    ? "border-amber-400 bg-amber-100/40 dark:border-amber-700 dark:bg-amber-950/40"
                    : "border-border/80 bg-card/80"
                }`}
              >
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                <Button asChild variant={item.isUrgent ? "default" : "outline"} size="sm" className="mt-3 text-xs">
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated" className="border-emerald-300/50 bg-gradient-to-br from-emerald-50/40 to-background dark:border-emerald-900/40 dark:from-emerald-950/20">
          <CardContent className="flex items-center gap-3 p-4">
            <Award className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">All student submissions & courses are up to date</p>
              <p className="text-xs text-muted-foreground">No pending evaluations or critical quality warnings right now.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <Card variant="elevated">
          <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
            <Clock className="h-5 w-5 animate-pulse text-blue-600" />
            <span>Loading faculty workspace metrics and course data...</span>
          </CardContent>
        </Card>
      ) : null}

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="relative overflow-hidden transition-all hover:border-blue-400/60">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                {stat.subtitle && <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Evaluation Queue Section */}
      <Card variant="elevated" className="border-border/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardCheck className="h-5 w-5 text-blue-600" />
              Academic Evaluation Queue
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Student assignments and capstone submissions requiring faculty review
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/instructor/evaluations">
              View All Evaluations
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {pendingSubmissions.length > 0 ? (
            <div className="divide-y divide-border/60 rounded-xl border border-border/80">
              {pendingSubmissions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={sub.submissionType === "project" ? "default" : "secondary"} className="text-[11px]">
                        {sub.submissionType === "project" ? "Capstone" : "Assignment"}
                      </Badge>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{sub.courseTitle}</span>
                    </div>
                    <p className="font-semibold text-sm">{sub.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Student: <strong className="text-slate-700 dark:text-slate-300">{sub.studentName}</strong> • Submitted{" "}
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-700 shrink-0">
                    <Link href="/instructor/evaluations">
                      <FileCheck className="mr-1.5 h-3.5 w-3.5" />
                      Grade Work
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <CheckCircle2 className="mb-2 h-8 w-8 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Evaluation queue is clear</p>
              <p className="text-xs">No pending student assignments or project submissions right now.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RoleAnalyticsCard title={enrollmentMeta.title} subtitle={enrollmentMeta.subtitle}>
          {enrollmentByCourse.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enrollmentByCourse}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="course" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="enrollments" fill="var(--accent)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No enrollment data.
            </div>
          )}
        </RoleAnalyticsCard>
        <RoleAnalyticsCard title={qualityMeta.title} subtitle={qualityMeta.subtitle}>
          {qualityByCourse.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qualityByCourse}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="course" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="var(--primary)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No quality data.
            </div>
          )}
        </RoleAnalyticsCard>
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Link href="/instructor/courses/new">
          <Card className="cursor-pointer transition-all hover:border-blue-500 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-blue-600" />
                Create Course
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Draft a new technology course with modules, outcomes, and pricing.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/instructor/evaluations">
          <Card className="cursor-pointer transition-all hover:border-blue-500 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-4 w-4 text-blue-600" />
                Review Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Score assignments and capstone projects against academic rubrics.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/instructor/courses">
          <Card className="cursor-pointer transition-all hover:border-blue-500 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-4 w-4 text-blue-600" />
                Manage Courses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Update content, modules, video lessons, and technical articles.</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/instructor/settings">
          <Card className="cursor-pointer transition-all hover:border-blue-500 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4 text-blue-600" />
                Faculty Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Update your engineering headline, bio, and technical specialties.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Courses Overview List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Your Courses</h2>
            <p className="text-xs text-muted-foreground">Courses you own and maintain on {getAcademyName()}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/instructor/courses">View All ({courses.length})</Link>
          </Button>
        </div>

        {courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.slice(0, 6).map((course) => (
              <Card key={course.id} className="transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="line-clamp-2 text-base font-semibold">{course.title}</CardTitle>
                    {course.published ? (
                      <Badge className="bg-emerald-600 text-white shrink-0">Published</Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">Draft</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-xs text-muted-foreground">{course.description}</p>
                  <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{course.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Level:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{course.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Enrollments:</span>
                      <span className="font-semibold">{course.enrollmentCount || 0} students</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold">
                        NGN {course.price?.NGN?.toLocaleString() ?? 0} / ${course.price?.USD ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" className="flex-1 text-xs" size="sm" asChild>
                      <Link href={`/courses/${course.slug}`}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        View
                      </Link>
                    </Button>
                    <Button variant="default" className="flex-1 bg-blue-600 text-white hover:bg-blue-700 text-xs" size="sm" asChild>
                      <Link href={`/instructor/courses/${course.id}/content`}>
                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                        Curriculum
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1 text-xs" size="sm" asChild>
                      <Link href={`/instructor/courses/${course.id}/edit`}>
                        <Settings className="mr-1.5 h-3.5 w-3.5" />
                        Details
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : loading ? null : (
          <Card>
            <CardContent className="pt-6">
              <div className="py-12 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="mb-4 text-center text-muted-foreground">
                  No courses found in your workspace. Build your first technology course now!
                </p>
                <Link href="/instructor/courses/new">
                  <Button className="bg-blue-600 text-white hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Course
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
