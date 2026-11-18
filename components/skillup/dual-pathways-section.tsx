"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Laptop,
  Zap,
  Wifi,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Brain,
  Code2,
  Share2,
  BookOpen,
  Building2,
  ShieldCheck,
  Gift,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionShell } from "@/components/skillup/section-shell"
import { fadeUp } from "@/components/skillup/motion-presets"
import { ConnectedThinkingMotif } from "@/components/brand/motifs"

interface DualPathwaysSectionProps {
  className?: string
}

export function DualPathwaysSection({ className }: DualPathwaysSectionProps) {
  const [selectedProgramme, setSelectedProgramme] = useState<"career" | "skill">("career")
  const [activePathway, setActivePathway] = useState<"ai" | "software" | "social">("software")

  const pathwaysData = {
    ai: {
      title: "AI Engineer",
      badge: "High-Demand Track",
      icon: Brain,
      image: "/images/courses/ai-101.png",
      imageAlt: "Young African learners collaborating on AI workflows at SkillUp Digitech Academy",
      tagline: "Build, Fine-Tune & Deploy Applied AI Systems",
      description:
        "Master applied artificial intelligence from first principles. Learn prompt engineering, Large Language Models (LLMs), Retrieval-Augmented Generation (RAG), workflow automation, and practical model deployment.",
      courses: [
        { name: "Basic AI 101", tag: "Free Foundation Bonus", free: true },
        { name: "Basic Digital Literacy", tag: "Free Foundation Bonus", free: true },
        { name: "AI Engineering & LLM Architecture", tag: "Core Specialization" },
        { name: "AI Automation & Multi-Agent Workflows", tag: "Applied Lab" },
        { name: "AI Capstone Evaluation Project", tag: "Graduation Deliverable" },
      ],
      careers: ["AI Engineer", "Prompt Engineer", "Automation Specialist", "Applied ML Analyst"],
    },
    software: {
      title: "Software Engineer",
      badge: "Flagship Engineering",
      icon: Code2,
      image: "/images/students/adults-software-collab.jpg",
      imageAlt: "African software engineering learners pair programming on laptops",
      tagline: "Full-Stack Web, Relational Databases & Cloud Services",
      description:
        "Develop production-grade software systems. Master TypeScript, modern React, Next.js, PostgreSQL relational modeling, Drizzle ORM, secure APIs, automated testing, and cloud deployment.",
      courses: [
        { name: "Basic Digital Literacy", tag: "Free Foundation Bonus", free: true },
        { name: "Basic AI 101", tag: "Free Foundation Bonus", free: true },
        { name: "Frontend Development (React & Next.js)", tag: "Core Specialization" },
        { name: "Backend Development & Relational Architecture", tag: "Core Specialization" },
        { name: "Full-Stack Production Capstone", tag: "Graduation Deliverable" },
      ],
      careers: ["Full-Stack Developer", "Frontend Engineer", "Backend Developer", "TypeScript Specialist"],
    },
    social: {
      title: "Social Media Management",
      badge: "High Growth",
      icon: Share2,
      image: "/images/courses/social-media.png",
      imageAlt: "African digital creator managing social media analytics on phone and laptop",
      tagline: "Brand Growth, Creative Production & Performance Advertising",
      description:
        "Lead digital brand presence and measurable conversion campaigns. Master content strategy, audience growth, paid advertising across Meta and Google, visual design, and short-form video production.",
      courses: [
        { name: "Basic Digital Literacy", tag: "Free Foundation Bonus", free: true },
        { name: "Basic AI 101", tag: "Free Foundation Bonus", free: true },
        { name: "Social Media Strategy & Brand Voice", tag: "Core Specialization" },
        { name: "Digital Marketing & Performance Ads", tag: "Core Specialization" },
        { name: "Graphic Design & Video Editing Labs", tag: "Creative Labs" },
      ],
      careers: ["Social Media Manager", "Growth Marketer", "Content Strategist", "Campaign Specialist"],
    },
  }

  const skillCourses = [
    {
      title: "Frontend Development",
      code: "FED-201",
      level: "Intermediate",
      image: "/images/courses/frontend-dev.png",
      desc: "React 19, Next.js App Router, TypeScript, Tailwind CSS & responsive interfaces.",
      link: "/courses/frontend-development",
    },
    {
      title: "Backend Development",
      code: "BED-201",
      level: "Intermediate",
      image: "/images/courses/backend-dev.png",
      desc: "Node.js, PostgreSQL relational modeling, Drizzle ORM, secure APIs & authentication.",
      link: "/courses/backend-development",
    },
    {
      title: "AI Engineering",
      code: "AIE-201",
      level: "Advanced",
      image: "/images/courses/ai-engineering.png",
      desc: "LLM workflows, RAG architectures, structured evaluation & practical deployment.",
      link: "/courses/ai-engineering",
    },
    {
      title: "AI Automation",
      code: "AIA-201",
      level: "Intermediate",
      image: "/images/courses/ai-automation.png",
      desc: "Automated business workflows, API webhooks, AI agent orchestration & tooling.",
      link: "/courses/ai-automation",
    },
    {
      title: "Digital Marketing",
      code: "DM-201",
      level: "Beginner",
      image: "/images/courses/digital-marketing.png",
      desc: "SEO/SEM, conversion funnels, Meta & Google Ads campaigns & campaign analytics.",
      link: "/courses/digital-marketing",
    },
    {
      title: "Graphic Design",
      code: "GD-201",
      level: "Beginner",
      image: "/images/courses/graphic-design.png",
      desc: "Figma UI/UX, brand systems, typography, visual layouts & creative portfolios.",
      link: "/courses/graphic-design",
    },
  ]

  return (
    <SectionShell className={className} variant="immersive" id="programmes">
      <ConnectedThinkingMotif className="pointer-events-none absolute -left-10 top-6 hidden h-64 w-96 text-[#613399] opacity-20 lg:block" />
      <div className="relative space-y-10">
        {/* Header */}
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Badge variant="lavender" className="px-4 py-1.5 text-xs font-bold text-[#613399]">
            <Sparkles className="h-3.5 w-3.5" />
            Dual Academic Pathways &bull; Teens (13–18) &amp; Adults
          </Badge>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#231651] sm:text-4xl md:text-5xl">
            Choose Your Learning Journey
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">
            Structured cohorts with fixed timetables, flexible full or installment tuition, and 2 free foundation courses included on every paid track.
          </p>

          {/* Programme Switcher Tabs */}
          <div className="inline-flex flex-wrap justify-center gap-1 rounded-2xl border border-border bg-card p-1.5 shadow-[var(--shadow-soft)]">
            <button
              type="button"
              onClick={() => setSelectedProgramme("career")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                selectedProgramme === "career"
                  ? "bg-[#231651] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-[#231651]"
              }`}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Career Readiness Programme</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  selectedProgramme === "career"
                    ? "bg-[#D6FFF6] text-[#0A5C4A]"
                    : "bg-[#F3EFFA] text-[#613399]"
                }`}
              >
                Hybrid &amp; In-Person
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedProgramme("skill")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                selectedProgramme === "skill"
                  ? "bg-[#231651] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-[#231651]"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Skill Acquisition Programme</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                  selectedProgramme === "skill"
                    ? "bg-[#D6FFF6] text-[#0A5C4A]"
                    : "bg-[#D6FFF6]/70 text-[#0A5C4A]"
                }`}
              >
                100% Online
              </span>
            </button>
          </div>
        </div>

        {/* Programme Content Display */}
        <AnimatePresence mode="wait">
          {selectedProgramme === "career" ? (
            <motion.div
              key="career-readiness"
              variants={fadeUp()}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-8"
            >
              {/* Highlight Banner with Enugu Campus Photography */}
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
                <div className="grid lg:grid-cols-12">
                  <div className="space-y-5 p-6 md:p-8 lg:col-span-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default">Flagship Career Accelerator</Badge>
                      <Badge variant="mint">Physical &amp; Online Hybrid</Badge>
                    </div>
                    <h3 className="font-display text-2xl font-extrabold tracking-tight text-[#231651] md:text-3xl">
                      Career Readiness: From Beginner to Job-Ready Practitioner
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                      Combines structured recorded lessons, weekly live interactive virtual classes, and hands-on
                      physical lab workshops at our Enugu Learning Centre—backed by rubric capstone evaluations and
                      verifiable graduation credentials.
                    </p>

                    <div className="grid grid-cols-1 gap-2.5 pt-1 text-xs font-medium text-[#231651] sm:grid-cols-2">
                      <span className="flex items-center gap-2 rounded-xl bg-[#F8FAFB] px-3 py-2 border border-border/70">
                        <Building2 className="h-4 w-4 text-[#613399]" />
                        14 Garden Avenue, GRA, Enugu
                      </span>
                      <span className="flex items-center gap-2 rounded-xl bg-[#F8FAFB] px-3 py-2 border border-border/70">
                        <Zap className="h-4 w-4 text-[#0A5C4A]" />
                        Generator + Solar Power Guarantee
                      </span>
                      <span className="flex items-center gap-2 rounded-xl bg-[#F8FAFB] px-3 py-2 border border-border/70">
                        <Wifi className="h-4 w-4 text-[#613399]" />
                        High-Speed Fibre Internet
                      </span>
                      <span className="flex items-center gap-2 rounded-xl bg-[#F8FAFB] px-3 py-2 border border-border/70">
                        <Laptop className="h-4 w-4 text-[#231651]" />
                        Bring Your Own Laptop (BYOL)
                      </span>
                    </div>

                    {/* Complimentary Foundation Bundle */}
                    <div className="rounded-2xl border border-[#0A5C4A]/15 bg-[#D6FFF6]/45 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0A5C4A]">
                          <Gift className="h-4 w-4" />
                          <span>Complimentary Foundation Bundle Included Free</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="mint" className="text-[10px]">Basic AI 101</Badge>
                          <Badge variant="mint" className="text-[10px]">Basic Digital Literacy</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Campus Photo */}
                  <div className="relative min-h-[260px] lg:col-span-5">
                    <img
                      src="/images/campus/enugu-coding-lab.jpg"
                      alt="SkillUp Digitech Academy Enugu Learning Centre coding lab with learners on laptops"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#150C33]/90 via-[#150C33]/40 to-transparent p-5 text-white">
                      <p className="text-xs font-bold text-[#D6FFF6]">Enugu Main Learning Centre</p>
                      <p className="text-xs text-white/85">Dedicated studio benches, uninterrupted power &amp; live mentor support.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Tracks Sub-Tabs */}
              <div className="space-y-6">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h4 className="font-display text-xl font-bold tracking-tight text-[#231651]">
                      Select a Career Track
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Each specialization includes 2 free foundation courses, core technical labs, and a capstone.
                    </p>
                  </div>
                  <div className="inline-flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
                    {(["software", "ai", "social"] as const).map((trackKey) => {
                      const track = pathwaysData[trackKey]
                      return (
                        <button
                          key={trackKey}
                          type="button"
                          onClick={() => setActivePathway(trackKey)}
                          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                            activePathway === trackKey
                              ? "bg-[#613399] text-white shadow-sm"
                              : "text-muted-foreground hover:bg-secondary hover:text-[#231651]"
                          }`}
                        >
                          <track.icon className="h-3.5 w-3.5" />
                          <span>{track.title}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Active Track Card */}
                {(() => {
                  const track = pathwaysData[activePathway]
                  return (
                    <Card className="overflow-hidden border-border bg-card py-0 shadow-[var(--shadow-soft)]">
                      <div className="h-1.5 w-full bg-gradient-to-r from-[#231651] via-[#613399] to-[#D6FFF6]" />
                      <CardContent className="p-6 md:p-8 space-y-6">
                        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
                          <div className="space-y-3 lg:col-span-7">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="lavender">{track.badge}</Badge>
                              <span className="font-mono text-xs font-medium text-muted-foreground">
                                12–16 Weeks Intensive Track
                              </span>
                            </div>
                            <h3 className="font-display text-2xl font-extrabold text-[#231651]">
                              {track.title} Pathway
                            </h3>
                            <p className="text-sm font-semibold text-[#613399]">{track.tagline}</p>
                            <p className="text-sm leading-relaxed text-muted-foreground">{track.description}</p>
                            <div className="pt-1">
                              <Button size="lg" variant="cta" asChild>
                                <Link href="/register?programme=career-readiness">
                                  Enrol in {track.title}
                                  <ArrowRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-2xl border border-border lg:col-span-5">
                            <img
                              src={track.image}
                              alt={track.imageAlt}
                              className="aspect-[16/10] w-full object-cover"
                            />
                          </div>
                        </div>

                        <div className="grid gap-6 border-t border-border/80 pt-6 md:grid-cols-2">
                          <div className="space-y-3">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Curriculum Progression &amp; Courses Included
                            </h5>
                            <div className="space-y-2">
                              {track.courses.map((course, idx) => (
                                <div
                                  key={course.name}
                                  className="flex items-center justify-between gap-2 rounded-xl border border-border/80 bg-[#F8FAFB] p-3 text-xs"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#231651] font-mono text-[10px] font-bold text-[#D6FFF6]">
                                      0{idx + 1}
                                    </span>
                                    <span className="truncate font-semibold text-[#150C33]">{course.name}</span>
                                  </div>
                                  <Badge
                                    variant={course.free ? "mint" : "outline"}
                                    className="shrink-0 text-[10px]"
                                  >
                                    {course.tag}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-2xl border border-border bg-[#F8FAFB] p-5 space-y-3">
                              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Target Career Outcomes
                              </h5>
                              <div className="flex flex-wrap gap-2">
                                {track.careers.map((career) => (
                                  <Badge key={career} variant="lavender" className="rounded-lg px-3 py-1 text-xs">
                                    {career}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-[#F8FAFB] p-5 space-y-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2 font-bold text-[#231651]">
                                <ShieldCheck className="h-4 w-4 text-[#0A5C4A]" />
                                <span>Graduation Clearance Requirements</span>
                              </div>
                              <ul className="space-y-1.5 pl-5 list-disc">
                                <li>100% completion of course video modules and assessments</li>
                                <li>At least 75% attendance across scheduled synchronous sessions</li>
                                <li>Passing rubric grade (&ge; 70%) on final hands-on Capstone Project</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })()}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="skill-acquisition"
              variants={fadeUp()}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="space-y-8"
            >
              {/* Skill Acquisition Banner */}
              <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
                <div className="grid lg:grid-cols-12">
                  <div className="space-y-4 p-6 md:p-8 lg:col-span-7">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="mint">Self-Paced Modular Mastery</Badge>
                      <Badge variant="lavender">100% Online Flexibility</Badge>
                    </div>
                    <h3 className="font-display text-2xl font-extrabold tracking-tight text-[#231651] md:text-3xl">
                      Skill Acquisition: Targeted Courses for Teens &amp; Busy Learners
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                      Built for secondary school students (13–18), undergraduates, and working professionals who want
                      to master a specific digital skill online with direct instructor messaging and verifiable
                      certificates.
                    </p>
                    <div className="grid grid-cols-1 gap-2 pt-1 text-xs font-medium text-[#231651] sm:grid-cols-2">
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0A5C4A]" />
                        24/7 Unlimited Lesson Access
                      </span>
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0A5C4A]" />
                        Direct In-App Instructor Support
                      </span>
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0A5C4A]" />
                        2 Free Foundation Courses Included
                      </span>
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-[#0A5C4A]" />
                        Single or Installment Tuition
                      </span>
                    </div>
                  </div>
                  <div className="relative min-h-[240px] lg:col-span-5">
                    <img
                      src="/images/campus/virtual-hybrid-learning.jpg"
                      alt="African student participating in an online coding class from home with headphones"
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Modular Course Grid with Authentic Photography */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {skillCourses.map((item) => (
                  <Card
                    key={item.title}
                    className="group flex flex-col justify-between overflow-hidden border-border bg-card py-0 transition-all duration-200 hover:-translate-y-1 hover:border-[#613399]/50 hover:shadow-[var(--shadow-lifted)]"
                  >
                    <div>
                      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#150C33]">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3 flex items-center gap-2">
                          <span className="rounded-lg bg-[#150C33]/85 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#D6FFF6] backdrop-blur-sm">
                            {item.code}
                          </span>
                          <Badge variant="lavender" className="text-[10px] shadow-xs">
                            {item.level}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 p-5">
                        <h4 className="font-display text-base font-bold text-[#231651]">{item.title}</h4>
                        <p className="text-xs leading-relaxed text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/70 px-5 py-3.5">
                      <Badge variant="mint" className="text-[10px]">
                        +2 Free Bonus
                      </Badge>
                      <Button size="sm" variant="ghost" asChild className="h-8 text-xs font-bold text-[#231651]">
                        <Link href={item.link}>
                          View Course
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="pt-2 text-center">
                <Button size="lg" variant="cta" asChild>
                  <Link href="/courses">
                    Browse All Skill Acquisition Courses
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SectionShell>
  )
}
