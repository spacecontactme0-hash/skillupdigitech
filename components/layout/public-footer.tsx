"use client"

import Link from "next/link"
import { Building2, ShieldCheck } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { ConnectedThinkingMotif } from "@/components/brand/motifs"
import { getAcademyDescription, getAcademyName } from "@/lib/brand-config"
import { usePreferencesStore } from "@/lib/store"
import type { Currency } from "@/lib/types"

const CURRENCIES: Currency[] = ["NGN", "USD", "EUR", "GBP"]

export function PublicFooter() {
  const year = new Date().getFullYear()
  const academyName = getAcademyName()
  const { currency, setCurrency, setCurrencySelected } = usePreferencesStore()

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#150C33] text-white">
      <ConnectedThinkingMotif className="pointer-events-none absolute -right-12 bottom-0 h-64 w-96 text-[#613399] opacity-40" />

      <div className="container relative z-10 py-14">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-4">
            <Logo variant="horizontal" tone="dark" />
            <p className="max-w-sm text-sm leading-relaxed text-[#C4BBE0]">
              {getAcademyDescription()}
            </p>
            <div className="inline-flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs text-[#E8E3F5]">
              <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[#D6FFF6]" />
              <span>14 Garden Avenue, GRA, Enugu &bull; Generator + Solar Power &amp; Enterprise Fibre</span>
            </div>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-[#D6FFF6]">
              Programmes
            </h3>
            <ul className="space-y-2.5 text-sm text-[#C4BBE0]">
              <li>
                <Link href="/#programmes" className="transition-colors hover:text-white">
                  Career Readiness
                </Link>
              </li>
              <li>
                <Link href="/courses" className="transition-colors hover:text-white">
                  Skill Acquisition
                </Link>
              </li>
              <li>
                <Link href="/register?programme=career-readiness" className="transition-colors hover:text-white">
                  Apply for Cohort
                </Link>
              </li>
              <li>
                <Link href="/register-instructor" className="transition-colors hover:text-white">
                  Teach at SkillUp
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-wider text-[#D6FFF6]">
              Academy &amp; Verification
            </h3>
            <ul className="space-y-2.5 text-sm text-[#C4BBE0]">
              <li>
                <Link href="/about" className="transition-colors hover:text-white">
                  About SkillUp
                </Link>
              </li>
              <li>
                <Link href="/faq" className="transition-colors hover:text-white">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition-colors hover:text-white">
                  Contact &amp; Campus Visit
                </Link>
              </li>
              <li>
                <Link href="/verify" className="inline-flex items-center gap-1.5 font-semibold text-[#D6FFF6] hover:underline">
                  <ShieldCheck className="h-4 w-4" />
                  Verify Certificate
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4 lg:col-span-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-[#D6FFF6]">
              Legal &amp; Currency
            </h3>
            <ul className="space-y-2 text-sm text-[#C4BBE0]">
              <li>
                <Link href="/terms" className="transition-colors hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="transition-colors hover:text-white">
                  Refund Policy
                </Link>
              </li>
            </ul>

            <div className="pt-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#C4BBE0]">
                Tuition Display Currency
              </p>
              <div className="inline-flex rounded-xl border border-white/15 bg-white/[0.05] p-1" role="group" aria-label="Select display currency">
                {CURRENCIES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => {
                      setCurrency(code)
                      setCurrencySelected(true)
                    }}
                    className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition-colors cursor-pointer ${
                      currency === code
                        ? "bg-[#D6FFF6] text-[#0A5C4A]"
                        : "text-[#C4BBE0] hover:text-white"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[#C4BBE0]/80 sm:flex-row">
          <p>&copy; {year} {academyName}. All rights reserved.</p>
          <p className="font-mono text-[11px]">Enugu Main Learning Centre &bull; Teens (13–18) &amp; Adults</p>
        </div>
      </div>
    </footer>
  )
}
