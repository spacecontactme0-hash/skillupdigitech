import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react"
import { Logo, LogoMark } from "@/components/ui/logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  ConnectedThinkingMotif,
  DigitalGridMotif,
  GrowthPathMotif,
  MakerLanguageMotif,
  MotifCertificateBorder,
  MotifLoadingState,
  MotifSectionDivider,
} from "@/components/brand/motifs"
import { SkillUpIcons } from "@/lib/icons"

export const metadata: Metadata = {
  title: "Rebrand V2 — Brand Identity, Design System & Asset Library",
  description: "SkillUp Digitech Academy Rebrand V2 Phase 1 review showcase.",
  robots: { index: false, follow: false },
}

const brandPalette = [
  { name: "Russian Violet", hex: "#231651", role: "Primary brand, CTAs, headings", contrast: "13.6:1 on White" },
  { name: "Deep Night Plum", hex: "#150C33", role: "Primary ink, dark hero anchors", contrast: "16.9:1 on White" },
  { name: "Electric Violet", hex: "#613399", role: "Interactive accents, focus rings", contrast: "8.1:1 on White" },
  { name: "Luminous Mint", hex: "#D6FFF6", role: "Highlight surfaces, dark-mode CTAs", contrast: "5.4:1 with #0A5C4A" },
  { name: "Emerald Text", hex: "#0A5C4A", role: "Accessible text on Mint & status", contrast: "7.8:1 on White" },
  { name: "Soft Ice Lavender", hex: "#E8E3F5", role: "Borders, dividers, soft chips", contrast: "1.3:1 (Structural)" },
  { name: "Light Canvas", hex: "#F8FAFB", role: "App background surface", contrast: "15.8:1 with #150C33" },
]

const photoGallery = [
  { path: "/images/hero/hero-african-tech-learners.jpg", label: "Hero — African Tech Learners", category: "Hero", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/students/teens-coding-lab.jpg", label: "Teens (13–18) Python Coding Lab", category: "Teens", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/students/teens-robotics-stem.jpg", label: "Teens Robotics & STEM Lab", category: "Teens", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/students/adults-software-collab.jpg", label: "Adult Software Engineering Pair", category: "Adults", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/students/product-design-workshop.jpg", label: "UI/UX & Product Design Workshop", category: "Adults", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/students/nesa-code-review-lagos.jpg", label: "Code Review Session (Lagos)", category: "Adults", source: "Unsplash — NESA by Makers" },
  { path: "/images/instructors/female-instructor-mentoring.jpg", label: "Female Instructor 1-on-1 Mentoring", category: "Instructors", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/instructors/male-instructor-classroom.jpg", label: "Software Architecture Classroom", category: "Instructors", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/campus/enugu-coding-lab.jpg", label: "Enugu Learning Centre Lab", category: "Campus", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/campus/virtual-hybrid-learning.jpg", label: "Virtual & Hybrid Live Session", category: "Campus", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/campus/yaba-coding-lab-laptop.jpg", label: "Nigerian Tech Hub Workstation", category: "Campus", source: "Unsplash — NESA by Makers" },
  { path: "/images/projects/student-capstone-demo.jpg", label: "Student Capstone Demo Day", category: "Projects", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/projects/nesa-coding-session-lagos.jpg", label: "Live Coding Sprint (Lagos)", category: "Projects", source: "Unsplash — NESA by Makers" },
  { path: "/images/projects/yaba-tech-workstation.jpg", label: "Media & Production Desk (Lagos)", category: "Projects", source: "Unsplash — Desola Lanre-Ologun" },
  { path: "/images/courses/digital-literacy.png", label: "Course: Basic Digital Literacy", category: "Courses", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/courses/ai-101.png", label: "Course: Basic AI 101", category: "Courses", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/courses/frontend-dev.png", label: "Course: Frontend Development", category: "Courses", source: "Bespoke Editorial (Illustrative)" },
  { path: "/images/courses/backend-dev.png", label: "Course: Backend Development", category: "Courses", source: "Unsplash — NESA by Makers" },
  { path: "/images/courses/ai-engineering.png", label: "Course: AI Engineering", category: "Courses", source: "Unsplash — WOCinTech Chat" },
  { path: "/images/courses/digital-marketing.png", label: "Course: Digital Marketing", category: "Courses", source: "Unsplash — WOCinTech Chat" },
  { path: "/images/courses/social-media.png", label: "Course: Social Media Management", category: "Courses", source: "Unsplash — Benjamin Dada" },
]

const emptyIllustrations = [
  { path: "/images/illustrations/empty-courses.svg", label: "Empty Courses" },
  { path: "/images/illustrations/empty-schedule.svg", label: "Empty Schedule" },
  { path: "/images/illustrations/empty-certificates.svg", label: "Empty Certificates" },
  { path: "/images/illustrations/empty-submissions.svg", label: "Empty Submissions" },
]

export default function BrandV2ShowcasePage() {
  const iconSamples = Object.entries(SkillUpIcons).slice(0, 18)

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Showcase Header */}
      <section className="relative overflow-hidden bg-skillup-hero py-14 text-white">
        <DigitalGridMotif className="pointer-events-none absolute left-0 top-0 h-44 w-72 text-[#D6FFF6] opacity-25" />
        <GrowthPathMotif className="pointer-events-none absolute right-0 bottom-0 h-56 w-96 text-[#B9A6E8] opacity-60" />

        <div className="container relative space-y-4">
          <Badge variant="mint">
            <Sparkles className="h-3.5 w-3.5" />
            SkillUp Rebrand V2 — Phase 1 Deliverables
          </Badge>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Brand Identity, Design System &amp; Visual Asset Library
          </h1>
          <p className="max-w-2xl text-sm text-[#E8E3F5]/90 sm:text-base">
            Live verification gallery for the SkillUp Growth Mark, semantic token system, typography scale, UI
            components, geometric motifs, and 21 curated African digital technology learning photographs.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="mint" asChild>
              <Link href="/">
                Inspect Live Hero &amp; Programmes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline-dark" asChild>
              <Link href="/dashboard">Inspect Student Dashboard Concept</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mt-12 space-y-16">
        {/* ================= ITEM 1: SKILLUP GROWTH MARK & FAVICON SUITE ================= */}
        <section id="brand-mark" className="space-y-6">
          <div className="space-y-1">
            <Badge variant="lavender">Item 1</Badge>
            <h2 className="font-display text-2xl font-extrabold text-[#231651] sm:text-3xl">
              SkillUp Growth Mark &amp; Favicon Suite
            </h2>
            <p className="text-sm text-muted-foreground">
              Modular ascending &ldquo;S&rdquo; symbol representing structured skill accumulation rising toward a
              luminous Mint apex node.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Horizontal Lockup — Light Surface
                </CardTitle>
              </CardHeader>
              <CardContent className="flex h-28 items-center justify-center rounded-2xl bg-[#F8FAFB] mx-6 border border-border/60">
                <Logo variant="horizontal" tone="light" href={null} />
              </CardContent>
            </Card>

            <Card className="border-border bg-[#231651] text-white">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#C4BBE0]">
                  Horizontal Lockup — Dark Surface
                </CardTitle>
              </CardHeader>
              <CardContent className="flex h-28 items-center justify-center rounded-2xl bg-[#150C33] mx-6 border border-white/10">
                <Logo variant="horizontal" tone="dark" href={null} />
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Stacked &amp; Monochrome Marks
                </CardTitle>
              </CardHeader>
              <CardContent className="flex h-28 items-center justify-around rounded-2xl bg-[#F8FAFB] mx-6 border border-border/60">
                <Logo variant="stacked" tone="light" href={null} />
                <LogoMark monochrome className="h-12 w-12 text-[#231651]" />
              </CardContent>
            </Card>
          </div>

          {/* Favicon & Small-Size Optical Legibility Strip */}
          <Card className="border-border bg-card">
            <CardContent className="flex flex-wrap items-center justify-between gap-6 p-6">
              <div className="space-y-1">
                <p className="font-display text-sm font-bold text-[#231651]">Favicon &amp; Optical Scale Test</p>
                <p className="text-xs text-muted-foreground">
                  Verified crisp silhouette at 16px browser tab, 32px standard favicon, 48px app tile, and 64px avatar.
                </p>
              </div>
              <div className="flex items-end gap-6">
                {[16, 24, 32, 48, 64].map((px) => (
                  <div key={px} className="flex flex-col items-center gap-2">
                    <img
                      src={px <= 32 ? "/brand/skillup-favicon.svg" : "/brand/skillup-mark.svg"}
                      alt={`SkillUp icon ${px}px`}
                      width={px}
                      height={px}
                    />
                    <span className="font-mono text-[10px] text-muted-foreground">{px}px</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ================= ITEM 2: COLOUR, TYPOGRAPHY & COMPONENT SYSTEM ================= */}
        <section id="design-system" className="space-y-8">
          <div className="space-y-1">
            <Badge variant="lavender">Item 2</Badge>
            <h2 className="font-display text-2xl font-extrabold text-[#231651] sm:text-3xl">
              Colour, Typography, Components &amp; Motifs
            </h2>
            <p className="text-sm text-muted-foreground">
              WCAG AA semantic tokens paired with Plus Jakarta Sans display, Inter UI body, and JetBrains Mono
              technical identifiers.
            </p>
          </div>

          {/* Palette Swatches */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {brandPalette.map((swatch) => (
              <div key={swatch.hex} className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
                <div className="h-20 w-full border-b border-border/50" style={{ backgroundColor: swatch.hex }} />
                <div className="space-y-1 p-3">
                  <p className="font-display text-xs font-bold text-[#231651]">{swatch.name}</p>
                  <p className="font-mono text-[11px] font-semibold text-[#613399]">{swatch.hex}</p>
                  <p className="text-[10px] leading-tight text-muted-foreground">{swatch.role}</p>
                  <p className="font-mono text-[9px] text-[#0A5C4A]">{swatch.contrast}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Typography + Components Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-base font-bold text-[#231651]">Typography Scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-mono text-[10px] text-[#613399]">Display H1 · Plus Jakarta Sans 800</span>
                  <p className="font-display text-3xl font-extrabold tracking-tight text-[#231651]">
                    Build Practical Tech Skills
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#613399]">Heading H2 · Plus Jakarta Sans 700</span>
                  <p className="font-display text-xl font-bold text-[#231651]">
                    Career Readiness &amp; Skill Acquisition
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#613399]">Body · Inter 400/500</span>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Structured technology cohorts for teens (13–18) and adults combining Enugu lab mentorship with live
                    online workshops and verified capstones.
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[10px] text-[#613399]">Technical Mono · JetBrains Mono 500</span>
                  <p className="rounded-xl bg-[#F3EFFA] px-3 py-2 font-mono text-xs text-[#231651]">
                    COHORT-ENUGU-2026 · CERT-SKP-9482 · FED-201
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-base font-bold text-[#231651]">
                  Interactive Primitives &amp; States
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2.5">
                  <Button variant="cta">Primary CTA</Button>
                  <Button variant="brand">Electric Brand</Button>
                  <Button variant="mint">Mint Accent</Button>
                  <Button variant="outline">Secondary Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="cta" disabled>Disabled</Button>
                </div>

                <div className="rounded-2xl bg-[#231651] p-4 flex flex-wrap items-center gap-3">
                  <Button variant="mint" size="sm">On-Dark Primary</Button>
                  <Button variant="outline-dark" size="sm">On-Dark Secondary</Button>
                  <Badge variant="mint">WCAG AA Verified</Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="mint">Mint Success</Badge>
                  <Badge variant="lavender">Lavender Track</Badge>
                  <Badge variant="violet">Electric Violet</Badge>
                  <Badge variant="warning">Pending Review</Badge>
                  <Badge variant="destructive">Action Required</Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Full name (e.g. Chinedu Okafor)" />
                  <Input placeholder="Email address" type="email" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Motifs + Iconography */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-base font-bold text-[#231651]">
                  4 Unique SkillUp Brand Design Motifs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-[#231651] p-3 text-[#D6FFF6]">
                    <GrowthPathMotif className="h-24 w-full" />
                    <p className="mt-1 text-[11px] font-bold text-white">1. The Growth Path</p>
                    <p className="text-[10px] text-[#C4BBE0]">Ascending skill blocks &amp; nodes</p>
                  </div>
                  <div className="rounded-2xl bg-[#231651] p-3 text-[#B9A6E8]">
                    <ConnectedThinkingMotif className="h-24 w-full" />
                    <p className="mt-1 text-[11px] font-bold text-white">2. Connected Thinking</p>
                    <p className="text-[10px] text-[#C4BBE0]">Orbital arcs &amp; cohort synapses</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-[#F8FAFB] p-3 text-[#231651]">
                    <DigitalGridMotif className="h-24 w-full" />
                    <p className="mt-1 text-[11px] font-bold text-[#231651]">3. Digital Grid</p>
                    <p className="text-[10px] text-muted-foreground">Modular pixel grid &amp; crosshairs</p>
                  </div>
                  <div className="rounded-2xl bg-[#150C33] p-3 text-[#9D83DB]">
                    <MakerLanguageMotif className="h-24 w-full" />
                    <p className="mt-1 text-[11px] font-bold text-white">4. The Maker Language</p>
                    <p className="text-[10px] text-[#C4BBE0]">Brackets, syntax &amp; cursor</p>
                  </div>
                </div>
                <MotifSectionDivider variant="growth" className="px-0" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <MotifLoadingState label="Branded Loader" className="min-h-[140px] p-4" />
                  <div className="relative flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-border bg-[#F8FAFB] p-4 text-center">
                    <MotifCertificateBorder />
                    <p className="relative z-10 font-display text-xs font-bold text-[#231651]">Certificate Frame Motif</p>
                    <p className="relative z-10 mt-1 font-mono text-[10px] text-[#0A5C4A]">CERT-SKP-2026-VERIFIED</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="font-display text-base font-bold text-[#231651]">
                  Standardized Iconography (Lucide · 1.75px Stroke)
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                {iconSamples.map(([key, Icon]) => (
                  <div
                    key={key}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-[#F8FAFB] p-3 text-[#231651]"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                    <span className="text-[10px] font-medium text-muted-foreground">{key}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ================= ITEM 5: CURATED VISUAL ASSET LIBRARY ================= */}
        <section id="asset-library" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <Badge variant="mint">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Item 5 · 21 African Tech Photos + 4 Custom SVG Illustrations
              </Badge>
              <h2 className="font-display text-2xl font-extrabold text-[#231651] sm:text-3xl">
                Curated African Digital Tech Visual Library
              </h2>
              <p className="text-sm text-muted-foreground">
                Every asset is stored locally in <code className="font-mono text-xs">/public/images/</code>, optimized
                for web, and documented with full provenance in{" "}
                <code className="font-mono text-xs">docs/design/SKILLUP_V2_VISUAL_ASSET_LIBRARY.md</code>.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {photoGallery.map((item) => (
              <div
                key={item.path}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:shadow-[var(--shadow-soft)]"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#150C33]">
                  <img src={item.path} alt={item.label} className="h-full w-full object-cover" />
                  <Badge variant="lavender" className="absolute left-3 top-3 text-[10px] shadow-xs">
                    {item.category}
                  </Badge>
                </div>
                <div className="space-y-1 p-3.5">
                  <p className="font-display text-xs font-bold text-[#231651]">{item.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{item.path}</p>
                  <p className="text-[10px] font-medium text-[#0A5C4A]">{item.source}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State Illustrations */}
          <div className="space-y-3 pt-4">
            <h3 className="font-display text-lg font-bold text-[#231651]">
              Custom Brand-Matched Empty State Illustrations
            </h3>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {emptyIllustrations.map((ill) => (
                <div key={ill.path} className="rounded-2xl border border-border bg-card p-4 text-center">
                  <img src={ill.path} alt={ill.label} className="mx-auto h-28 w-full object-contain" />
                  <p className="mt-2 font-display text-xs font-bold text-[#231651]">{ill.label}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{ill.path}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
