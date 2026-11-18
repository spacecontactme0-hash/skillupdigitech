"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Laptop,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionShell } from "@/components/skillup/section-shell"
import { SkillupHero } from "@/components/skillup/hero"
import { DualPathwaysSection } from "@/components/skillup/dual-pathways-section"
import { CourseCard } from "@/components/skillup/course-card"
import { CtaBand } from "@/components/skillup/cta-band"
import {
  DigitalGridMotif,
  GrowthPathMotif,
  MakerLanguageMotif,
  MotifLoadingState,
  MotifSectionDivider,
} from "@/components/brand/motifs"
import { usePreferencesStore } from "@/lib/store"
import type { Course } from "@/lib/types"

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    tag: "Pathway Selection",
    title: "Choose Your Learning Track",
    text: "Select Career Readiness (Hybrid Enugu + Online) or modular Skill Acquisition (100% Online) tailored for teens (13–18) or adults.",
  },
  {
    step: "02",
    tag: "Guided Mastery",
    title: "Learn Online & In-Centre",
    text: "Follow structured video lessons, weekly live virtual sessions, and physical lab workshops with uninterrupted power and fibre.",
  },
  {
    step: "03",
    tag: "Applied Craft",
    title: "Build Projects & Capstone",
    text: "Submit practical assignments and a final capstone deliverable graded against clear, published instructor rubrics.",
  },
  {
    step: "04",
    tag: "Verified Proof",
    title: "Earn a Verifiable Certificate",
    text: "Meet graduation clearance criteria to unlock a cryptographically verifiable SkillUp credential anyone can validate at /verify.",
  },
]

const HIGH_INTENT_FAQS = [
  {
    q: "Can teenagers aged 13–18 enroll at SkillUp Digitech Academy?",
    a: "Yes. Secondary school students aged 13–18 are warmly welcomed across our Skill Acquisition and foundational tracks. During onboarding, teen learners provide parent/guardian contact details so we can send an instant digital Guardian Consent approval link before active cohort sessions begin.",
  },
  {
    q: "What laptop specifications do I need for the Enugu Learning Centre (BYOL)?",
    a: "Physical hybrid cohorts operate on a mandatory Bring Your Own Laptop (BYOL) standard so learners build directly in their own development environment. We recommend at least an Intel Core i5 / Ryzen 5 (or Apple M-series), 8GB RAM, and 256GB SSD. SkillUp provides dedicated studio desks, 100% solar + generator power, and high-speed fibre internet.",
  },
  {
    q: "How do hybrid cohort timetables work?",
    a: "Career Readiness cohorts follow fixed, academy-published timetables (for example, midweek live virtual classes combined with scheduled Enugu physical lab days). Fixed scheduling keeps cohort peers, lab seat capacity, and instructors synchronized.",
  },
  {
    q: "Are Basic AI 101 and Basic Digital Literacy really free?",
    a: "Yes. Every paid enrolment in either the Career Readiness Programme or Skill Acquisition Programme automatically unlocks Basic AI 101 (AI-101) and Basic Digital Literacy (BDL-101) at zero extra tuition cost.",
  },
  {
    q: "Can I pay my tuition in installments?",
    a: "Yes. Eligible programmes support both single-payment and structured installment plans powered securely via Paystack, with transparent receipt tracking inside your student dashboard.",
  },
]

export default function HomePage() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const { currency } = usePreferencesStore()

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/courses")
        const data = await res.json()
        setFeaturedCourses((data.courses || []).slice(0, 3))
      } catch (error) {
        console.error("Failed to load courses:", error)
        setFeaturedCourses([])
      } finally {
        setLoadingCourses(false)
      }
    }
    void loadCourses()
  }, [])

  return (
    <div className="flex flex-col">
      {/* SECTION 1 — HERO */}
      <SkillupHero featuredCourses={featuredCourses} currency={currency} />

      {/* SECTION 2 — DUAL ACADEMIC PATHWAYS */}
      <DualPathwaysSection className="py-12 md:py-16" />

      <MotifSectionDivider variant="growth" />

      {/* SECTION 3 — HOW SKILLUP WORKS (MERGED 4-STEP PROGRESSION) */}
      <SectionShell variant="split" className="relative py-12 md:py-16" id="how-it-works">
        <GrowthPathMotif className="pointer-events-none absolute -right-12 top-6 hidden h-64 w-[420px] text-[#613399] opacity-20 lg:block" />

        <div className="relative space-y-8">
          <div className="max-w-2xl space-y-3">
            <Badge variant="lavender">
              <Sparkles className="h-3.5 w-3.5 text-[#613399]" />
              How SkillUp Works
            </Badge>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#231651] md:text-4xl">
              From First Lesson to Verified Tech Portfolio
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              One clear, milestone-driven path from foundations to rubric-evaluated projects—no passive video
              playlists or guesswork.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((item) => (
              <article
                key={item.step}
                className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-all duration-200 hover:-translate-y-1 hover:border-[#613399]/50 hover:shadow-[var(--shadow-lifted)]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#231651] font-mono text-xs font-bold text-[#D6FFF6]">
                      {item.step}
                    </span>
                    <Badge variant="lavender" className="text-[10px]">
                      {item.tag}
                    </Badge>
                  </div>
                  <h3 className="font-display text-base font-bold text-[#231651]">{item.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.text}</p>
                </div>

                <div className="mt-5 flex items-center gap-1.5 border-t border-border/70 pt-3 text-[11px] font-semibold text-[#0A5C4A]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Structured Cohort Standard</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      <MotifSectionDivider variant="grid" />

      {/* SECTION 4 — FEATURED COURSES (LIVE POSTGRESQL CATALOG) */}
      <SectionShell variant="split" className="py-12 md:py-16">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Badge variant="lavender">Live Course Catalog</Badge>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#231651] md:text-4xl">
              Featured Programmes &amp; Courses
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Transparent NGN tuition with 2 complimentary foundation courses included on every paid track.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/courses">
              Browse Full Catalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loadingCourses ? (
          <MotifLoadingState label="Loading live academy courses..." />
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {featuredCourses.map((course) => (
              <CourseCard key={course.id} course={course} currency={currency} />
            ))}
          </div>
        )}
      </SectionShell>

      <MotifSectionDivider variant="maker" />

      {/* SECTION 5 — ENUGU LEARNING ENVIRONMENT & INSTITUTIONAL CREDIBILITY */}
      <SectionShell variant="split" className="relative bg-[#F3EFFA]/55 py-12 md:py-16">
        <DigitalGridMotif className="pointer-events-none absolute left-0 top-0 h-56 w-80 text-[#231651] opacity-30" />

        <div className="relative grid items-center gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-5">
            <Badge variant="mint">Enugu Main Learning Centre</Badge>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#231651]">
              A Real Campus Built for Focused Practical Work
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Located at <strong>14 Garden Avenue, GRA, Enugu</strong>, our physical centre features dedicated coding
              studios—<strong>Lab 1 (Turing Room)</strong> and <strong>Lab 2 (Lovelace Room)</strong>—capped at 30
              learners per room for hands-on instructor attention.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-3.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#231651]">
                  <Zap className="h-4 w-4 text-[#0A5C4A]" />
                  100% Power Uptime
                </div>
                <p className="mt-1 text-muted-foreground">Solar + standby generator guarantee during every lab.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#231651]">
                  <Wifi className="h-4 w-4 text-[#613399]" />
                  Enterprise Fibre
                </div>
                <p className="mt-1 text-muted-foreground">High-speed broadband for Git, cloud deploys &amp; AI tools.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#231651]">
                  <Laptop className="h-4 w-4 text-[#231651]" />
                  BYOL Standard
                </div>
                <p className="mt-1 text-muted-foreground">Learners bring personal laptops to keep work portable.</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-3.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-[#231651]">
                  <ClipboardCheck className="h-4 w-4 text-[#0A5C4A]" />
                  Public Verification
                </div>
                <p className="mt-1 text-muted-foreground">Every graduate credential is verifiable at /verify.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <Button variant="cta" asChild>
                <Link href="/verify">
                  <ShieldCheck className="h-4 w-4" />
                  Verify a Credential
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">
                  <Building2 className="h-4 w-4" />
                  Visit Enugu Centre
                </Link>
              </Button>
            </div>
          </div>

          {/* Curated Campus, Mentor & Capstone Photo Collage */}
          <div className="relative grid grid-cols-12 gap-3.5 lg:col-span-7">
            <MakerLanguageMotif className="pointer-events-none absolute -bottom-4 -right-4 hidden h-24 w-40 text-[#613399] opacity-35 sm:block" />

            <div className="col-span-12 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
              <img
                src="/images/campus/enugu-coding-lab.jpg"
                alt="SkillUp Digitech Academy Enugu Learning Centre computer lab"
                className="aspect-[16/9] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="col-span-6 overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
              <img
                src="/images/instructors/female-instructor-mentoring.jpg"
                alt="SkillUp instructor mentoring a learner 1-on-1"
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="col-span-6 overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
              <img
                src="/images/projects/student-capstone-demo.jpg"
                alt="SkillUp learner presenting a capstone project to peers"
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </SectionShell>

      {/* SECTION 6 — COMPACT HIGH-INTENT FAQ */}
      <SectionShell variant="split" className="py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="space-y-2 text-center">
            <Badge variant="lavender">Admissions &amp; Practical Questions</Badge>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#231651]">
              Quick Answers Before You Apply
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {HIGH_INTENT_FAQS.map((item, idx) => (
              <AccordionItem
                key={item.q}
                value={`faq-${idx}`}
                className="rounded-2xl border border-border bg-card px-5 shadow-xs"
              >
                <AccordionTrigger className="py-4 text-left font-display text-sm font-bold text-[#231651] hover:no-underline sm:text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="pt-1 text-center">
            <Button variant="outline" asChild>
              <Link href="/faq">
                View All Frequently Asked Questions
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </SectionShell>

      {/* SECTION 7 — FINAL CTA BAND */}
      <SectionShell variant="split" className="pb-16 pt-2">
        <CtaBand
          title="Ready to Build Real Digital Skills?"
          description="Join our next Enugu hybrid cohort or start an online track today—every paid enrolment includes Basic AI 101 and Basic Digital Literacy at zero extra cost."
        />
      </SectionShell>
    </div>
  )
}
