"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, ShieldCheck, AlertCircle, Laptop, BookOpen, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConsentDetails {
  valid: boolean
  studentEmail: string
  studentName: string
  guardianEmail: string
  currentStatus: string
  isAlreadyVerified: boolean
}

export function GuardianConsentClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState<ConsentDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setError("No consent token was provided in the authorization link.")
      setLoading(false)
      return
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/guardian-consent?token=${encodeURIComponent(token!)}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Failed to validate consent link.")
        } else {
          setDetails(data)
          if (data.isAlreadyVerified) {
            setSuccess(true)
            setSuccessMessage("This consent has already been officially verified and recorded.")
          }
        }
      } catch {
        setError("Network connection issue while verifying consent token.")
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [token])

  async function handleAuthorize() {
    if (!token) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/guardian-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to authorize enrolment.")
      } else {
        setSuccess(true)
        setSuccessMessage(data.message || "Enrolment consent confirmed.")
      }
    } catch {
      setError("An error occurred while confirming consent. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-white border border-[#E8E3F5] shadow-sm text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#231651] mb-4" />
        <h2 className="text-xl font-bold text-[#231651]">Validating Guardian Authorization Link...</h2>
        <p className="text-sm text-slate-500 mt-2">Checking student safety verification records.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto p-8 rounded-2xl bg-white border border-rose-200 shadow-sm text-center">
        <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#231651]">Authorization Link Notice</h2>
        <p className="text-slate-600 mt-3 text-sm leading-relaxed">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">Return to Home</Link>
          </Button>
          <Button asChild className="bg-[#231651] hover:bg-[#150C33] text-[#D6FFF6]">
            <Link href="/contact">Contact Academic Support</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#E8E3F5] shadow-lg overflow-hidden">
      {/* Header Banner */}
      <div className="bg-[#231651] p-6 sm:p-8 text-white relative">
        <div className="flex items-center gap-2 text-[#D6FFF6] text-xs uppercase tracking-wider font-semibold mb-2">
          <ShieldCheck className="w-4 h-4" />
          Minor Safeguarding & Parental Authorization
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold">SkillUp Digitech Academy</h1>
        <p className="text-[#D6FFF6]/80 text-sm mt-1">
          Official enrollment authorization for secondary school learners (ages 13–17).
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-6">
        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-[#231651]">Authorization Confirmed</h2>
            <p className="text-slate-600 text-sm max-w-md mx-auto">{successMessage}</p>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1">
              <div>
                <strong>Student:</strong> {details?.studentName} ({details?.studentEmail})
              </div>
              <div>
                <strong>Authorized by:</strong> {details?.guardianEmail}
              </div>
              <div>
                <strong>Status:</strong> Active & Safeguarded
              </div>
            </div>
            <div className="pt-4">
              <Button asChild className="bg-[#231651] hover:bg-[#150C33] text-[#D6FFF6] px-8">
                <Link href="/">Visit SkillUp Academy</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-2xl bg-[#F8FAFB] border border-[#E8E3F5] flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-medium text-slate-500">Applicant Details</p>
                <p className="text-base font-bold text-[#231651] mt-0.5">{details?.studentName}</p>
                <p className="text-xs text-slate-500">{details?.studentEmail}</p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                <Clock className="w-3.5 h-3.5 mr-1" />
                Awaiting Authorization
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#231651] uppercase tracking-wide">
                Key Academy Guidelines You Are Consenting To:
              </h3>

              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="w-8 h-8 rounded-lg bg-[#E8E3F5] text-[#231651] flex items-center justify-center shrink-0">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Bring Your Own Laptop (BYOL):</strong> For practical classes, students bring their own working laptops. The academy guarantees dedicated power and high-speed broadband at the physical learning centre.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="w-8 h-8 rounded-lg bg-[#D6FFF6] text-[#0A5C4A] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Child Safeguarding Protocols:</strong> All minor learner interactions are supervised. Unmoderated peer-to-peer adult chat is disabled, and instructors undergo strict identity and academic compliance verification.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 bg-white">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-800">Curriculum & Attendance:</strong> Classes focus on industry-ready technology skills (programming, AI, digital literacy). Regular attendance and completion of capstone assignments are required for graduation.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Authorizing as: <span className="font-semibold text-slate-700">{details?.guardianEmail}</span>
              </p>
              <Button
                onClick={handleAuthorize}
                disabled={submitting}
                className="w-full sm:w-auto bg-[#231651] hover:bg-[#150C33] text-[#D6FFF6] font-bold px-8 py-2.5 shadow-md hover:shadow-lg transition-all"
              >
                {submitting ? "Confirming Consent..." : "Authorize Student Enrolment"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
