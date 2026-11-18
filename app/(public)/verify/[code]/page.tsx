"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Award, CheckCircle2, ShieldCheck, Download, ExternalLink, Printer, Building2, Calendar, FileCode, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface CredentialData {
  verificationCode: string
  issuedAt: string
  studentName: string
  courseTitle: string
  courseCode: string
  category: string
  institution: string
  learningCentre: string
  verificationUrl: string
  status: string
}

export default function CertificateVerificationPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  const [loading, setLoading] = useState(true)
  const [credential, setCredential] = useState<CredentialData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCredential = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/certificates/verify/${encodeURIComponent(code)}`)
        const data = await res.json()
        if (!res.ok || !data.verified) {
          throw new Error(data.error || "Certificate verification failed.")
        }
        setCredential(data.credential)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (code) {
      void fetchCredential()
    }
  }, [code])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#231651] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-[#231651]">
            Validating cryptographic credential against SkillUp Registry...
          </p>
        </div>
      </div>
    )
  }

  if (error || !credential) {
    return (
      <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border/80 shadow-md text-center p-8 space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl text-[#231651]">Invalid Credential</CardTitle>
          <CardDescription className="text-xs">
            {error || "The requested verification code could not be found in our official academic database."}
          </CardDescription>
          <div className="p-3 bg-slate-100 rounded-lg text-xs font-mono select-all">
            Code: {code}
          </div>
          <Button asChild className="w-full bg-[#231651] hover:bg-[#150C33] text-white">
            <Link href="/">Return to SkillUp Academy</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFB] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Verification Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-emerald-900 tracking-wide uppercase">
                  Authentic Academic Credential
                </span>
                <Badge className="bg-emerald-600 text-white border-none text-[10px]">
                  Verified
                </Badge>
              </div>
              <p className="text-xs text-emerald-700">
                This credential was officially conferred by SkillUp Digitech Academy.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              size="sm"
              variant="outline"
              className="bg-white border-emerald-300 text-emerald-900 text-xs h-8"
              onClick={handlePrint}
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Certificate
            </Button>
          </div>
        </div>

        {/* Certificate Display Diploma Card */}
        <Card className="border-4 border-[#231651]/20 bg-white shadow-xl overflow-hidden relative print:border-none print:shadow-none">
          {/* Top Decorative Border */}
          <div className="h-3 bg-gradient-to-r from-[#231651] via-[#613399] to-[#D6FFF6]" />

          <CardContent className="p-8 sm:p-12 text-center space-y-8">
            {/* Academy Branding */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8E3F5] text-[#231651] text-xs font-bold tracking-wider uppercase mb-1">
                <ShieldCheck className="w-4 h-4 text-[#613399]" />
                Official Certificate of Technical Completion
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#231651] tracking-tight">
                SkillUp Digitech Academy
              </h2>
              <p className="text-xs text-muted-foreground font-mono tracking-widest uppercase">
                Enugu Main Learning Centre &bull; 14 Garden Avenue, GRA, Enugu
              </p>
            </div>

            {/* Recipient Details */}
            <div className="space-y-3 py-4 border-y border-border/60">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                This is to certify that
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#231651] tracking-tight font-serif">
                {credential.studentName}
              </h1>
              <p className="text-xs text-muted-foreground max-w-lg mx-auto leading-relaxed">
                has successfully fulfilled all curriculum requirements, continuous hands-on laboratory checkpoints, and instructor-evaluated capstone project assessments in
              </p>
              <div className="pt-2">
                <span className="inline-block text-xl sm:text-2xl font-bold text-[#613399] bg-[#E8E3F5]/60 px-4 py-1.5 rounded-lg border border-[#613399]/20">
                  {credential.courseTitle}
                </span>
              </div>
            </div>

            {/* Credential Attributes Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left pt-2 text-xs">
              <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-border/50">
                <span className="font-semibold text-muted-foreground block text-[11px] uppercase tracking-wider">
                  Issue Date
                </span>
                <span className="font-bold text-[#231651] block">
                  {new Date(credential.issuedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              <div className="space-y-1 p-3 rounded-lg bg-slate-50 border border-border/50">
                <span className="font-semibold text-muted-foreground block text-[11px] uppercase tracking-wider">
                  Verification Code
                </span>
                <span className="font-mono font-bold text-[#231651] block select-all">
                  {credential.verificationCode}
                </span>
              </div>

              <div className="col-span-2 sm:col-span-1 space-y-1 p-3 rounded-lg bg-slate-50 border border-border/50">
                <span className="font-semibold text-muted-foreground block text-[11px] uppercase tracking-wider">
                  Accreditation Body
                </span>
                <span className="font-bold text-[#231651] block">
                  Academic Board
                </span>
              </div>
            </div>

            {/* Bottom Institutional Signature / Seal */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-border/60">
              <div className="text-center sm:text-left space-y-1">
                <div className="font-serif italic text-lg text-[#231651]">SkillUp Faculty Board</div>
                <div className="text-[11px] text-muted-foreground">Dean of Academic Programmes</div>
              </div>

              <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#231651]/40 flex items-center justify-center text-center p-1">
                <div className="w-12 h-12 rounded-full bg-[#D6FFF6] text-[#0A5C4A] flex items-center justify-center font-bold text-[9px] uppercase tracking-tighter text-center">
                  SEALED
                </div>
              </div>

              <div className="text-center sm:text-right space-y-1">
                <div className="font-serif italic text-lg text-[#231651]">Director of Studies</div>
                <div className="text-[11px] text-muted-foreground">SkillUp Digitech Academy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Button asChild variant="link" className="text-xs text-[#231651]">
            <Link href="/dashboard/certificates">&larr; Return to Student Certificates</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
