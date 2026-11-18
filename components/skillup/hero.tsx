"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, CheckCircle2, GraduationCap, ShieldCheck, Sparkles, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useGetStartedDrawer } from "@/components/layout/get-started-drawer"
import { DigitalGridMotif, GrowthPathMotif, MakerLanguageMotif } from "@/components/brand/motifs"
import type { Course } from "@/lib/types"
import { fadeUp, sectionStagger } from "@/components/skillup/motion-presets"

interface SkillupHeroProps {
  featuredCourses?: Course[]
  currency?: "NGN" | "USD" | "EUR" | "GBP"
}

export function SkillupHero({ featuredCourses: _featuredCourses, currency: _currency }: SkillupHeroProps) {
  const reducedMotion = useReducedMotion()
  const { openDrawer } = useGetStartedDrawer()

  return (
    <section className="relative overflow-hidden bg-skillup-hero text-white">
      {/* Signature Rebrand V2 Architectural Motifs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(97,51,153,0.45)_0%,transparent_52%),radial-gradient(circle_at_88%_12%,rgba(214,255,246,0.14)_0%,transparent_44%)]"
      />
      <DigitalGridMotif className="pointer-events-none absolute left-0 top-0 h-60 w-96 text-[#D6FFF6] opacity-30" />
      <GrowthPathMotif className="pointer-events-none absolute -right-12 -bottom-6 h-72 w-[480px] text-[#B9A6E8] opacity-75" />

      <div className="container relative py-12 md:py-16 lg:py-20">
        <motion.div
          variants={sectionStagger}
          initial={reducedMotion ? false : "hidden"}
          animate="visible"
          className="grid items-center gap-10 lg:grid-cols-12"
        >
          {/* Left Narrative Column */}
          <div className="space-y-6 lg:col-span-6">
            <motion.div variants={fadeUp()} className="flex flex-wrap items-center gap-2.5">
              <Badge variant="mint" className="px-3.5 py-1 text-xs font-bold tracking-wide">
                <Sparkles className="h-3.5 w-3.5" />
                Enugu Campus &amp; Live Online Cohorts
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-[#E8E3F5]">
                <Users className="h-3.5 w-3.5 text-[#D6FFF6]" />
                Teens (13–18) &amp; Adults
              </span>
            </motion.div>

            <div className="space-y-4">
              <motion.h1
                variants={fadeUp(0.06)}
                className="font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.3rem]"
              >
                Practical Digital Tech Training for{" "}
                <span className="text-[#D6FFF6]">Teens &amp; Career Builders.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp(0.12)}
                className="max-w-xl text-sm leading-relaxed text-[#E8E3F5]/90 sm:text-base lg:text-lg"
              >
                SkillUp Digitech Academy helps secondary school students (13–18) and adults master software
                engineering, applied AI, graphic design, and digital marketing—through structured cohorts, Enugu
                in-person lab mentorship, and rubric-verified capstone projects.
              </motion.p>
            </div>

            <motion.div variants={fadeUp(0.18)} className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" variant="mint" onClick={openDrawer} className="h-12 px-7 text-sm font-bold sm:text-base">
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline-dark" asChild className="h-12 px-6 text-sm font-semibold sm:text-base">
                <Link href="#programmes">Explore Programmes</Link>
              </Button>
            </motion.div>

            {/* Concise Trust Proof Strip */}
            <motion.div
              variants={fadeUp(0.22)}
              className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs font-medium text-[#E8E3F5]/90"
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#D6FFF6]" />
                2 Free Foundation Courses
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-[#D6FFF6]" />
                14 Garden Ave, GRA, Enugu
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[#D6FFF6]" />
                Verified Certificates
              </span>
            </motion.div>
          </div>

          {/* Right Editorial Photography Stage framed with Maker Language Motif */}
          <motion.div variants={fadeUp(0.14)} className="relative lg:col-span-6">
            <MakerLanguageMotif className="pointer-events-none absolute -right-5 -top-5 hidden h-28 w-44 text-[#D6FFF6] opacity-40 sm:block" />

            <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#150C33] shadow-2xl">
              <div className="aspect-[16/10] w-full overflow-hidden">
                <img
                  src="/images/hero/hero-african-tech-learners.jpg"
                  alt="African teenagers and young adults collaborating on software engineering projects at SkillUp Digitech Academy"
                  className="h-full w-full object-cover object-center"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-[#150C33]/95 px-5 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D6FFF6]" />
                  <span className="font-semibold text-white">Structured Practical Cohorts</span>
                </div>
                <span className="font-mono text-[11px] text-[#C4BBE0]">
                  Software &bull; AI &bull; Design &bull; Marketing
                </span>
              </div>
            </div>

            {/* Teens & Adults Audience Spotlight Chips */}
            <div className="mt-3.5 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-md">
                <img
                  src="/images/students/teens-coding-lab.jpg"
                  alt="African teenagers writing Python code in a classroom"
                  className="h-11 w-14 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#D6FFF6]">Teens (13–18)</p>
                  <p className="truncate text-[11px] text-[#E8E3F5]/85">Coding, AI &amp; STEM Labs</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-2.5 backdrop-blur-md">
                <img
                  src="/images/students/adults-software-collab.jpg"
                  alt="African adult learners pair programming in a modern tech academy"
                  className="h-11 w-14 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#D6FFF6]">Adults (18+)</p>
                  <p className="truncate text-[11px] text-[#E8E3F5]/85">Career Readiness Tracks</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
