"use client"

import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useGetStartedDrawer } from "@/components/layout/get-started-drawer"
import { DigitalGridMotif, GrowthPathMotif } from "@/components/brand/motifs"

interface CtaBandProps {
  title: string
  description: string
  imageUrl?: string
  backgroundImageUrl?: string
}

export function CtaBand({ title, description, imageUrl, backgroundImageUrl }: CtaBandProps) {
  const { openDrawer } = useGetStartedDrawer()

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/15 bg-skillup-hero p-7 text-white shadow-[var(--shadow-lifted)] md:p-12">
      {backgroundImageUrl || imageUrl ? (
        <img
          src={backgroundImageUrl || imageUrl}
          alt="SkillUp Digitech Academy learners"
          className="absolute inset-0 h-full w-full object-cover opacity-15"
          loading="lazy"
          decoding="async"
        />
      ) : null}

      <DigitalGridMotif className="pointer-events-none absolute left-0 top-0 h-56 w-80 text-[#D6FFF6] opacity-25" />
      <GrowthPathMotif className="pointer-events-none absolute -right-8 bottom-0 h-64 w-[440px] text-[#B9A6E8] opacity-65" />

      <div className="relative z-10 max-w-2xl space-y-5">
        <Badge variant="mint" className="text-xs font-bold">
          <Sparkles className="h-3.5 w-3.5" />
          Next Cohort Admissions Open
        </Badge>

        <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-[#E8E3F5]/90 sm:text-base">{description}</p>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <Button size="lg" variant="mint" onClick={openDrawer} className="h-12 px-7">
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline-dark" asChild className="h-12 px-6">
            <Link href="/courses">Explore Courses</Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            asChild
            className="h-12 text-[#E8E3F5] hover:bg-white/10 hover:text-white"
          >
            <Link href="/contact">Visit Enugu Centre</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
