"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, Code2, Cpu, GitBranch, Laptop, Layers, ShieldCheck, Sparkles, Terminal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SectionShell } from "@/components/skillup/section-shell"
import { CtaBand } from "@/components/skillup/cta-band"
import { ConnectedThinkingMotif, DigitalGridMotif, MotifSectionDivider } from "@/components/brand/motifs"
import { getAcademyName } from "@/lib/brand-config"

const coreValues = [
  {
    icon: Code2,
    title: "Active Construction",
    description:
      "Learners master digital technology by building, debugging, and shipping practical projects every week—not memorizing slides.",
  },
  {
    icon: ShieldCheck,
    title: "Academic & Engineering Rigor",
    description:
      "We teach clean architecture, type safety, relational databases, AI workflows, and professional design systems.",
  },
  {
    icon: Terminal,
    title: "Real Industry Tooling",
    description:
      "Teens and adults train with modern editors, Git, cloud deployments, Figma, and AI tools used by real product teams.",
  },
  {
    icon: CheckCircle2,
    title: "Transparent Rubrics",
    description:
      "Every assignment and capstone project is graded against clear published criteria with actionable instructor feedback.",
  },
  {
    icon: GitBranch,
    title: "Portfolio Proof",
    description:
      "Graduates leave with live capstone deliverables and cryptographically verifiable certificates employers can check at /verify.",
  },
  {
    icon: Cpu,
    title: "Inclusive Age Pathways",
    description:
      "Dedicated learning support for both teenagers (13–18) with guardian consent safeguards and adult career switchers.",
  },
]

const educationalPillars = [
  {
    title: "Hands-On Labs",
    description: "Every unit connects core theory directly to guided coding, AI, or creative studio exercises.",
    icon: Laptop,
  },
  {
    title: "Full-Stack & AI Builds",
    description: "Learners ship end-to-end applications, workflows, and creative campaigns with real feedback.",
    icon: Layers,
  },
  {
    title: "Rubric Evaluation",
    description: "Submissions are reviewed against structured academic criteria by faculty practitioners.",
    icon: ShieldCheck,
  },
  {
    title: "Verifiable Capstones",
    description: "Final projects unlock official SkillUp graduation credentials backed by our public registry.",
    icon: GitBranch,
  },
]

export default function AboutPage() {
  const academyName = getAcademyName()

  return (
    <div className="flex flex-col">
      {/* Rebrand V2 About Hero */}
      <section className="relative overflow-hidden bg-skillup-hero py-14 text-white md:py-20">
        <DigitalGridMotif className="pointer-events-none absolute left-0 top-0 h-56 w-96 text-[#D6FFF6] opacity-25" />
        <ConnectedThinkingMotif className="pointer-events-none absolute -right-10 bottom-0 h-64 w-96 text-[#B9A6E8] opacity-60" />

        <div className="container relative z-10 mx-auto max-w-4xl space-y-6 text-center">
          <Badge variant="mint" className="px-4 py-1 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            About {academyName}
          </Badge>

          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Practical Technology Education Built on{" "}
            <span className="text-[#D6FFF6]">Real Skill Construction</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#E8E3F5]/90 sm:text-base md:text-lg">
            Operating from our Enugu Main Learning Centre (14 Garden Avenue, GRA, Enugu) and online across Africa, we
            prepare teenagers (13–18) and adults to build modern software, AI systems, and digital products.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" variant="mint" asChild>
              <Link href="/courses">
                Explore Curriculum
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline-dark" asChild>
              <Link href="/contact">Speak to Admissions</Link>
            </Button>
          </div>
        </div>
      </section>

      <SectionShell id="mission" variant="split" className="py-14 md:py-18">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-6">
            <Badge variant="lavender">Our Purpose</Badge>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#231651]">
              Closing the gap between watching tutorials and building real tech.
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Passive video courses often leave learners stuck the moment they face a real problem. At {academyName},
              every programme combines structured instruction, mentor office hours, Enugu physical lab workshops, and
              graded project milestones.
            </p>

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
              <img
                src="/images/instructors/male-instructor-classroom.jpg"
                alt="SkillUp Digitech Academy instructor teaching software architecture"
                className="aspect-[16/9] w-full object-cover"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-6">
            {educationalPillars.map((pillar) => (
              <Card
                key={pillar.title}
                variant="elevated"
                className="rounded-2xl border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-[#613399]/40"
              >
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EFFA] text-[#231651]">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 font-display text-base font-bold text-[#231651]">{pillar.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{pillar.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </SectionShell>

      <MotifSectionDivider variant="orbit" />

      <SectionShell variant="split" className="py-14">
        <div className="space-y-8">
          <div className="max-w-2xl space-y-2">
            <Badge variant="lavender">Operating Principles</Badge>
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-[#231651]">Core Values</h2>
            <p className="text-sm text-muted-foreground">
              The academic and practical standards guiding every SkillUp cohort.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {coreValues.map((value) => (
              <Card key={value.title} className="h-full rounded-2xl border-border bg-card transition-all hover:border-[#613399]/40 hover:shadow-[var(--shadow-soft)]">
                <CardContent className="space-y-3 p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#D6FFF6] text-[#0A5C4A]">
                    <value.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#231651]">{value.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell variant="split" className="pb-16 pt-4">
        <CtaBand
          title="Start Building Your Technical Portfolio"
          description="Explore our Career Readiness and Skill Acquisition programmes or visit our Enugu Learning Centre."
        />
      </SectionShell>
    </div>
  )
}
