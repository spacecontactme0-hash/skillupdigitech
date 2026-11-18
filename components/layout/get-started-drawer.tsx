"use client"

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, BookOpen, GraduationCap, LogIn, Sparkles, Users, X } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConnectedThinkingMotif, DigitalGridMotif } from "@/components/brand/motifs"
import { cn } from "@/lib/utils"

interface GetStartedDrawerContextValue {
  isOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
  toggleDrawer: () => void
}

const GetStartedDrawerContext = createContext<GetStartedDrawerContextValue>({
  isOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
})

export function useGetStartedDrawer() {
  return useContext(GetStartedDrawerContext)
}

export function PublicDrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  const openDrawer = useCallback(() => setIsOpen(true), [])
  const closeDrawer = useCallback(() => setIsOpen(false), [])
  const toggleDrawer = useCallback(() => setIsOpen((prev) => !prev), [])

  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  const entryPaths = [
    {
      title: "Career Readiness Programme",
      badge: "Hybrid · Enugu & Online",
      badgeVariant: "mint" as const,
      description:
        "12–16 week mentor-led cohorts in Software Engineering, AI Engineering, or Social Media Management. Includes Enugu lab workshops & 2 free foundation courses.",
      href: "/register?programme=career-readiness",
      icon: GraduationCap,
      cta: "Apply for Career Track",
    },
    {
      title: "Skill Acquisition Programme",
      badge: "100% Online · Self-Paced",
      badgeVariant: "lavender" as const,
      description:
        "Flexible modular courses for teenagers (13–18), undergraduates, and working adults. Every enrollment includes Basic AI 101 & Basic Digital Literacy free.",
      href: "/register?programme=skill-acquisition",
      icon: BookOpen,
      cta: "Start Skill Acquisition",
    },
    {
      title: "Teach at SkillUp Academy",
      badge: "Faculty & Mentors",
      badgeVariant: "outline" as const,
      description:
        "Join our teaching faculty to mentor cohorts, review practical capstone rubrics, and publish technical courses.",
      href: "/register-instructor",
      icon: Users,
      cta: "Join as an Instructor",
    },
  ]

  return (
    <GetStartedDrawerContext.Provider value={{ isOpen, openDrawer, closeDrawer, toggleDrawer }}>
      <div className="relative min-h-screen overflow-x-clip bg-background">
        {/* Main Public Shell — Shifts smoothly left on desktop when drawer opens */}
        <div
          className={cn(
            "flex min-h-screen flex-col transition-[margin] duration-300 ease-out",
            isOpen ? "lg:mr-[416px]" : "lg:mr-0",
          )}
        >
          {children}
        </div>

        {/* Mobile/Tablet Backdrop */}
        <div
          aria-hidden="true"
          onClick={closeDrawer}
          className={cn(
            "fixed inset-0 z-50 bg-[#150C33]/55 backdrop-blur-xs transition-opacity duration-300 lg:hidden",
            isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          )}
        />

        {/* Content-Shift Push Drawer Panel */}
        <aside
          role="dialog"
          aria-modal="false"
          aria-label="Get Started with SkillUp Digitech Academy"
          aria-hidden={!isOpen}
          className={cn(
            "fixed right-0 top-0 z-50 flex h-full w-full max-w-[416px] flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out",
            isOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          {/* Drawer Header with Signature Motif */}
          <div className="relative overflow-hidden bg-skillup-hero px-6 py-5 text-white">
            <ConnectedThinkingMotif className="pointer-events-none absolute -right-12 -top-8 h-44 w-64 text-[#D6FFF6] opacity-40" />
            <DigitalGridMotif className="pointer-events-none absolute left-0 top-0 h-32 w-48 text-[#D6FFF6] opacity-20" />

            <div className="relative z-10 flex items-center justify-between">
              <Logo variant="compact" tone="dark" href={null} />
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeDrawer}
                aria-label="Close Get Started drawer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D6FFF6] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative z-10 mt-5 space-y-1.5">
              <Badge variant="mint" className="text-[10px]">
                <Sparkles className="h-3 w-3" />
                Teens (13–18) &amp; Adults
              </Badge>
              <h2 className="font-display text-xl font-extrabold tracking-tight text-white">
                Choose how you want to start
              </h2>
              <p className="text-xs leading-relaxed text-[#E8E3F5]/85">
                Pick a learning track or faculty path—account setup takes less than a minute.
              </p>
            </div>
          </div>

          {/* Drawer Body — 3 Clear Entry Cards */}
          <div className="flex-1 space-y-3.5 overflow-y-auto bg-background p-5">
            {entryPaths.map((path) => (
              <Link
                key={path.href}
                href={path.href}
                onClick={closeDrawer}
                tabIndex={isOpen ? 0 : -1}
                className="group block rounded-2xl border border-border bg-card p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#613399]/60 hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F3EFFA] text-[#231651] transition-colors group-hover:bg-[#231651] group-hover:text-[#D6FFF6]">
                    <path.icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <Badge variant={path.badgeVariant} className="text-[10px]">
                    {path.badge}
                  </Badge>
                </div>

                <h3 className="mt-3 font-display text-sm font-bold text-[#231651] group-hover:text-[#613399]">
                  {path.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{path.description}</p>

                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#231651] group-hover:text-[#613399]">
                  <span>{path.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>

          {/* Drawer Footer — Sign In Shortcut */}
          <div className="border-t border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-[#F8FAFB] px-4 py-3">
              <div>
                <p className="text-xs font-bold text-[#231651]">Already enrolled?</p>
                <p className="text-[11px] text-muted-foreground">Continue your lessons &amp; timetable.</p>
              </div>
              <Button variant="cta" size="sm" asChild onClick={closeDrawer}>
                <Link href="/login" tabIndex={isOpen ? 0 : -1}>
                  <LogIn className="h-3.5 w-3.5" />
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </GetStartedDrawerContext.Provider>
  )
}
