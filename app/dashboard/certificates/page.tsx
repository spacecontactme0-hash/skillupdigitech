"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Award, BookOpen, Download, ExternalLink, ShieldCheck, CheckCircle2, Clock, Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getAcademyName } from "@/lib/brand-config"
import { useAuthStore } from "@/lib/store"
import type { Certificate, Enrollment } from "@/lib/types"

type CertificateWithCourse = Certificate & {
  course?: {
    id: string
    title: string
    slug: string
    thumbnail?: string
    level?: string
  }
}

export default function CertificatesPage() {
  const { user, token } = useAuthStore()
  const [certificates, setCertificates] = useState<CertificateWithCourse[]>([])
  const [enrollments, setEnrollments] = useState<(Enrollment & { course?: { id: string; title: string; slug: string } })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      setLoading(true)
      try {
        const [certificatesRes, enrollmentsRes] = await Promise.all([
          fetch("/api/certificates", { headers: { Authorization: `Bearer ${token || ""}` } }),
          fetch(`/api/enrollments?userId=${user.id}`, { headers: { Authorization: `Bearer ${token || ""}` } }),
        ])

        const certificatesData = certificatesRes.ok ? await certificatesRes.json() : { certificates: [] }
        const enrollmentsData = enrollmentsRes.ok ? await enrollmentsRes.json() : { enrollments: [] }

        setCertificates(certificatesData.certificates || [])
        setEnrollments(enrollmentsData.enrollments || [])
      } catch (error) {
        console.error("Failed to load certificates page:", error)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [token, user])

  const completedWithoutCertificate = useMemo(() => {
    const certificateCourseIds = new Set(certificates.map((certificate) => certificate.courseId))
    return enrollments.filter(
      (enrollment) => enrollment.status === "completed" && !certificateCourseIds.has(enrollment.courseId),
    )
  }, [certificates, enrollments])

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/40 text-primary">
            Academic Credentials
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-balance text-foreground">
          Verified Certificates
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Review your earned technology credentials, verify cryptographic certification codes, and download diplomas for your professional portfolio.
        </p>
      </div>

      {/* Summary KPI Strip */}
      <Card variant="elevated" className="overflow-hidden border-border/80 bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Certificates Earned
            </p>
            <p className="text-3xl font-bold text-foreground">
              {loading ? "..." : certificates.length}
            </p>
            <p className="text-xs text-muted-foreground">
              Issued by {getAcademyName()}
            </p>
          </div>

          <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-border/60 pt-3 sm:pt-0 sm:pl-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Awaiting Certification
            </p>
            <p className="text-3xl font-bold text-foreground">
              {loading ? "..." : completedWithoutCertificate.length}
            </p>
            <p className="text-xs text-muted-foreground">
              Completed courses pending final evaluation
            </p>
          </div>

          <div className="space-y-1 border-t sm:border-t-0 sm:border-l border-border/60 pt-3 sm:pt-0 sm:pl-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Verification Engine
            </p>
            <p className="text-3xl font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="h-7 w-7 text-primary" />
              Active
            </p>
            <p className="text-xs text-muted-foreground">
              Tamper-evident verification keys
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading ? (
        <Card variant="elevated">
          <CardContent className="flex items-center gap-3 p-8 text-muted-foreground">
            <Clock className="h-5 w-5 animate-pulse text-primary" />
            <span className="text-sm">Retrieving your verified certificates from PostgreSQL...</span>
          </CardContent>
        </Card>
      ) : null}

      {/* Certificates List */}
      {!loading && certificates.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2">
          {certificates.map((certificate) => (
            <Card
              key={certificate.id}
              variant="elevated"
              className="flex flex-col justify-between border-border/80 bg-card hover:border-primary/50 transition-colors shadow-sm"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <Badge variant="outline" className="border-primary/30 text-primary text-[11px] font-mono mb-1">
                      Certificate
                    </Badge>
                    <CardTitle className="text-lg font-bold truncate text-foreground">
                      {certificate.course?.title || "Technical Engineering Certificate"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Issued {new Date(certificate.issuedAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="rounded-full bg-primary/10 p-2.5 shrink-0 text-primary">
                    <Award className="h-6 w-6" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-sm pt-0">
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Verification Code:</span>
                    <span className="font-semibold text-foreground select-all">
                      {certificate.verificationCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span>Cryptographically verified outcome</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button asChild size="sm" className="gap-1.5">
                    <a href={certificate.certificateUrl} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4" />
                      Download Credential
                    </a>
                  </Button>
                  {certificate.course?.slug ? (
                    <Button asChild variant="outline" size="sm" className="gap-1.5">
                      <Link href={`/courses/${certificate.course.slug}`}>
                        <ExternalLink className="h-4 w-4" />
                        View Course
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !loading ? (
        <Card variant="elevated">
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Award className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">No certificates earned yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Complete all modules, graded quizzes, and capstone requirements in your enrolled courses to receive verified certificates of completion.
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/dashboard/courses">
                <BookOpen className="h-4 w-4" />
                Go to My Courses
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Completed courses awaiting certificate */}
      {!loading && completedWithoutCertificate.length > 0 ? (
        <Card variant="elevated" className="border-border/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Completed Courses Awaiting Final Accreditation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedWithoutCertificate.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-foreground">{enrollment.course?.title || enrollment.courseId}</p>
                  <p className="text-xs text-muted-foreground">All lessons finished (100% progress)</p>
                </div>
                <Badge variant="outline" className="border-amber-300 text-amber-600 dark:text-amber-400">
                  Pending Review
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
