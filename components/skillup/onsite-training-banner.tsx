"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, ShieldCheck, Users, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useAuthStore } from "@/lib/store"
import { DEFAULT_ONSITE_TRAINING_CONFIG } from "@/lib/onsite-training-shared"

function getNextCohortLabel() {
  const now = new Date()
  const cohorts = Object.values(DEFAULT_ONSITE_TRAINING_CONFIG.locations)
    .map((location) => ({
      label: location.label,
      startsOn: location.startsOn,
      startsAt: new Date(`${location.startsOn} 00:00:00`),
    }))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())

  return cohorts.find((cohort) => cohort.startsAt.getTime() >= now.getTime()) || cohorts[cohorts.length - 1]
}

export function OnsiteTrainingBanner() {
  const { user } = useAuthStore()
  const [dismissed, setDismissed] = useState(false)

  const isOnsitePaid = Boolean(user?.studentProfile?.paymentStatus === "yes")
  const isStudent = user?.role === "student"
  const nextCohort = useMemo(() => getNextCohortLabel(), [])

  const handleDismiss = () => {
    setDismissed(true)
  }

  if (!isStudent || isOnsitePaid || dismissed) {
    return null
  }

  return (
    <Card variant="elevated" className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/15 via-background to-accent/10">
      <CardContent className="relative flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Premium Onsite Upgrade</p>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold md:text-2xl">Join Hybrid Hands-On Practical Labs at our Enugu Learning Centre</h2>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Attend in-person coding workshops at 14 Garden Avenue, GRA, Enugu with 100% guaranteed generator power, enterprise fibre Wi-Fi, and 1-on-1 mentor guidance.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" /> Next cohort: {nextCohort.label} {nextCohort.startsOn}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5">
              <Users className="h-3.5 w-3.5 text-primary" /> Limited slots remaining
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Paystack checkout
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2 self-start md:self-center">
          <Button asChild variant="cta">
            <Link href="/dashboard/onsite-training">
              View onsite training
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={handleDismiss} aria-label="Dismiss onsite banner">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

