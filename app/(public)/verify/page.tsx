"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Building2, CheckCircle2, Lock, Search, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DigitalGridMotif, MotifCertificateBorder } from "@/components/brand/motifs"
import { getAcademyName } from "@/lib/brand-config"

export default function CertificateLookupPortalPage() {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const academyName = getAcademyName()

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setError("Please enter a valid credential verification code.")
      return
    }
    setError(null)
    router.push(`/verify/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="flex min-h-[80vh] flex-col">
      <section className="relative overflow-hidden bg-skillup-hero py-14 text-white md:py-20">
        <DigitalGridMotif className="pointer-events-none absolute left-0 top-0 h-60 w-96 text-[#D6FFF6] opacity-25" />

        <div className="container relative z-10 mx-auto max-w-3xl space-y-6 text-center">
          <Badge variant="mint" className="px-4 py-1 text-xs font-bold">
            <ShieldCheck className="h-3.5 w-3.5" />
            Official Credential Registry
          </Badge>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            Verify a SkillUp <span className="text-[#D6FFF6]">Certificate</span>
          </h1>

          <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#E8E3F5]/90 sm:text-base">
            Every diploma, Career Readiness track credential, and Skill Acquisition certificate issued by {academyName}{" "}
            is backed by graduation clearance and verifiable instantly below.
          </p>
        </div>
      </section>

      <section className="container -mt-8 pb-16 relative z-20">
        <Card className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border-border bg-card shadow-[var(--shadow-lifted)]">
          <MotifCertificateBorder />

          <CardHeader className="relative z-10 pb-3 text-left">
            <CardTitle className="font-display text-lg font-bold text-[#231651]">Enter Verification Code</CardTitle>
            <CardDescription className="text-xs">
              Printed at the bottom of the certificate or included in the graduate&apos;s verification link.
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label htmlFor="verify-code" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Certificate Verification Code
                </label>
                <div className="relative">
                  <input
                    id="verify-code"
                    type="text"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder="e.g. SKILLUP-2026-XXXX"
                    className="h-12 w-full rounded-xl border border-border bg-[#F8FAFB] px-4 pr-11 font-mono text-sm uppercase tracking-wider text-[#150C33] outline-none transition-all focus:border-[#613399] focus:ring-2 focus:ring-[#613399]/20"
                  />
                  <Search className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {error ? <p className="text-left text-xs font-medium text-destructive">{error}</p> : null}

              <Button type="submit" size="lg" variant="cta" className="w-full">
                Verify Credential Authenticity
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#613399]" />
                Tamper-Evident Registry
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#231651]" />
                Enugu Learning Centre
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0A5C4A]" />
                Instant Lookup
              </span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
