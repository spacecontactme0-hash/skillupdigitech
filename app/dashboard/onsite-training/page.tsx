"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
  TimerReset,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { trackOnboardingEvent } from "@/lib/onboarding-analytics"
import { DEFAULT_ONSITE_TRAINING_CONFIG, type OnsiteTrainingConfig } from "@/lib/onsite-training-shared"
import { useAuthStore } from "@/lib/store"

function getCountdownCopy(startDate: string) {
  const start = new Date(`${startDate} 00:00:00`)
  const today = new Date()
  const msPerDay = 24 * 60 * 60 * 1000
  const days = Math.ceil((start.getTime() - today.getTime()) / msPerDay)

  if (days > 1) return `${days} days left to join this cohort`
  if (days === 1) return "Starts tomorrow"
  if (days === 0) return "Cohort starts today"
  return "Enrollment remains open while slots last"
}

export default function DashboardOnsiteTrainingPage() {
  const { user, token } = useAuthStore()
  const [config, setConfig] = useState<OnsiteTrainingConfig>(DEFAULT_ONSITE_TRAINING_CONFIG)
  const [preferredLocation, setPreferredLocation] = useState<"enugu" | "abuja">(
    user?.studentProfile?.preferredLocation || "enugu",
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const isPaid = user?.studentProfile?.paymentStatus === "yes"

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/onsite-training")
        const data = await res.json()
        if (res.ok && data?.config) {
          setConfig(data.config)
        }
      } catch {
        // keep fallback config
      }
    }

    void loadConfig()
  }, [])

  useEffect(() => {
    if (!token) return
    trackOnboardingEvent("onsite_offer_viewed", {
      role: "student",
      mode: "onsite",
      source: "dashboard",
      step: "offer_page",
    })
    void fetch("/api/onboarding/state", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ markOnsiteViewed: true }),
    })
  }, [token])

  const selectedLocation = config.locations[preferredLocation]
  const locationSummary = useMemo(() => `${selectedLocation.label} - ${selectedLocation.startsOn}`, [selectedLocation])
  const countdownCopy = useMemo(() => getCountdownCopy(selectedLocation.startsOn), [selectedLocation])
  const cohortStatusLabel = isPaid ? "Seat reserved" : `${selectedLocation.slotsLeft} seats left`
  const learnerHubStatusCopy = isPaid
    ? "Your learner hub now reflects a paid onsite path with cohort, seat, and payment visibility."
    : "When you pay, your learner hub will reflect this cohort, your payment reference, and your onsite identity."

  const handleCheckout = async () => {
    if (!token) return
    setLoading(true)
    setError("")

    try {
      trackOnboardingEvent("onsite_checkout_started", {
        role: "student",
        mode: "onsite",
        source: "dashboard",
        step: preferredLocation,
      })

      await fetch("/api/onboarding/state", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markOnsiteCheckoutStarted: true }),
      })

      const res = await fetch("/api/payments/initialize-onsite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferredLocation }),
      })
      const data = await res.json()
      if (!res.ok || !data?.authorization_url) {
        throw new Error(data?.error || "Unable to start onsite payment")
      }
      window.location.href = data.authorization_url
    } catch (checkoutError: any) {
      trackOnboardingEvent("onsite_checkout_failed", {
        role: "student",
        mode: "onsite",
        source: "dashboard",
      })
      setError(checkoutError?.message || "Unable to start onsite payment")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 p-4 md:p-6 lg:p-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold md:text-4xl">Onsite Training</h1>
        <p className="max-w-3xl text-muted-foreground">
          Upgrade from your student dashboard, complete payment with Paystack, and move into a premium hands-on training track that also updates your learner hub with onsite status, payment reference, and cohort details.
        </p>
      </div>

      <Card variant="elevated" className={`overflow-hidden transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-lg ${
        isPaid
          ? "border-amber-300/70 bg-gradient-to-br from-amber-100/80 via-background to-orange-100/70 dark:border-amber-800/70 dark:from-amber-950/35 dark:via-background dark:to-orange-950/20"
          : "border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:border-primary/25 dark:from-primary/15 dark:via-background dark:to-accent/15"
      }`}>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              <span className="rounded-full border border-primary/20 bg-background/80 px-3 py-1.5 dark:border-primary/25 dark:bg-background/90">Premium cohort</span>
              <span className="rounded-full border border-primary/20 bg-background/80 px-3 py-1.5 dark:border-primary/25 dark:bg-background/90">{countdownCopy}</span>
              <span className="rounded-full border border-primary/20 bg-background/80 px-3 py-1.5 dark:border-primary/25 dark:bg-background/90">{cohortStatusLabel}</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl">Become an industry-ready technology engineer with immersive, in-person training.</h2>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                {config.formDescription} The onsite pathway combines theory, practice, internship support, and certification in one guided intensive.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Cohort starts</p>
                <p className="mt-2 text-base font-semibold">{locationSummary}</p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Limited slots</p>
                <p className="mt-2 text-base font-semibold">{selectedLocation.slotsLeft} seats left</p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Social proof</p>
                <p className="mt-2 text-base font-semibold">{selectedLocation.enrolledCount}+ learners enrolled</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="cta" onClick={handleCheckout} disabled={loading || isPaid}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Preparing checkout...
                  </>
                ) : isPaid ? (
                  "Onsite Training Active"
                ) : (
                  <>
                    Register and pay
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/payments">View payments</Link>
              </Button>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <Card className="border-primary/15 bg-background/80 dark:border-primary/25 dark:bg-background/90">
            <CardHeader>
              <CardTitle className="text-base">At a glance</CardTitle>
              <CardDescription>Everything that becomes visible in your learner record when you switch to the onsite pathway.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{config.durationDays} days intensive</p>
                  <p>{config.hours}+ hours across theory and practical sessions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Certification and support</p>
                  <p>{config.paymentProviderHint}, internship support, and recommendation guidance.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border bg-background p-3">
                <CreditCard className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">One secure payment</p>
                  <p>NGN {config.registrationFeeNgn.toLocaleString("en-NG")} via Paystack.</p>
                </div>
              </div>
              <div className="rounded-2xl border bg-primary/5 p-4 dark:bg-primary/10">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Support line</p>
                <p className="mt-2 font-medium text-foreground">{config.supportPhone}</p>
              </div>
              <div className="rounded-2xl border bg-background p-4 dark:bg-background/80">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Learner hub status</p>
                <p className="mt-2 font-medium text-foreground">{isPaid ? "Premium onsite identity active" : "Learner hub will update after payment"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{learnerHubStatusCopy}</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Card variant="elevated" className="border-primary/20 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-lg">
            <CardHeader>
              <CardTitle>{config.formTitle}</CardTitle>
              <CardDescription>Choose a location and see why the onsite path is positioned as a premium upgrade inside the student journey.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Duration</p>
                  <p className="mt-2 text-lg font-semibold">{config.durationDays} Days</p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Hours</p>
                  <p className="mt-2 text-lg font-semibold">{config.hours}+ Hours</p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Price</p>
                  <p className="mt-2 text-lg font-semibold">NGN {config.registrationFeeNgn.toLocaleString("en-NG")}</p>
                </div>
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Urgency</p>
                  <p className="mt-2 text-lg font-semibold">{selectedLocation.slotsLeft} slots left</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">What you get</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    {config.benefits.map((benefit) => (
                      <div key={benefit} className="inline-flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Choose location</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="preferredLocation">Training location</Label>
                      <Select value={preferredLocation} onValueChange={(value) => setPreferredLocation(value as "enugu" | "abuja")}>
                        <SelectTrigger id="preferredLocation">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="enugu">{config.locations.enugu.label}</SelectItem>
                          <SelectItem value="abuja">{config.locations.abuja.label}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                      <p className="inline-flex items-center gap-2 font-medium text-foreground"><MapPin className="h-4 w-4 text-primary" /> {selectedLocation.label} - {selectedLocation.venue}</p>
                      <p className="mt-2 inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Starts {selectedLocation.startsOn}</p>
                      <p className="mt-2 inline-flex items-center gap-2"><TimerReset className="h-4 w-4 text-primary" /> {countdownCopy}</p>
                      <p className="mt-2 inline-flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> {selectedLocation.enrolledCount}+ learners have already chosen this route.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-primary/15 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Why learners upgrade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Onsite hybrid students get immersive hands-on lab practice, mentor code reviews, and direct preparation for technology industry careers.</p>
                <p>The curriculum is built for practical execution, portfolio building, and job-readiness rather than passive tutorial watching alone.</p>
              </CardContent>
            </Card>
            <Card className="border-primary/15 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Online vs onsite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-2xl border bg-background p-3">
                  <p className="font-medium text-foreground">Online student</p>
                  <p className="text-muted-foreground">Buy courses individually and learn at your own pace.</p>
                </div>
                <div className="rounded-2xl border bg-primary/5 p-3">
                  <p className="font-medium text-foreground">Onsite student</p>
                  <p className="text-muted-foreground">Join a guided cohort with practical sessions, certification, and internship support.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/15 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Learner testimonials</CardTitle>
              <CardDescription>Proof points to support the upgrade decision.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {config.testimonials.map((testimonial) => (
                <div key={`${testimonial.name}-${testimonial.role}`} className="rounded-2xl border bg-background p-4 text-sm text-muted-foreground">
                  <div className="mb-3 inline-flex gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={`${testimonial.name}-${index}`} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p>"{testimonial.quote}"</p>
                  <div className="mt-4">
                    <p className="font-medium text-foreground">{testimonial.name}</p>
                    <p>{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-primary/15 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Access model</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2 font-medium text-foreground"><CheckCircle2 className="h-4 w-4 text-primary" /> Onsite paid</p>
              <p>All courses unlock after payment verification succeeds.</p>
              <p className="inline-flex items-center gap-2 font-medium text-foreground"><CreditCard className="h-4 w-4 text-primary" /> Regular student</p>
              <p>Buy courses individually when you want access to paid content.</p>
            </CardContent>
          </Card>

          <Card className="border-primary/15 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-base">Current status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Training mode: <span className="font-medium text-foreground capitalize">{user?.studentProfile?.trainingMode || "online"}</span></p>
              <p>Payment status: <span className="font-medium text-foreground">{isPaid ? "Paid" : "Not yet paid"}</span></p>
              <p>Selected location: <span className="font-medium text-foreground">{user?.studentProfile?.preferredLocation ? config.locations[user.studentProfile.preferredLocation].label : selectedLocation.label}</span></p>
              <p>Reference: <span className="font-medium text-foreground">{user?.studentProfile?.paymentReference || "Not yet created"}</span></p>
              <p>Support: <span className="font-medium text-foreground">{config.supportPhone}</span></p>
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-primary/5 dark:border-primary/25 dark:bg-primary/10">
            <CardHeader>
              <CardTitle className="text-base">Ready to secure your seat?</CardTitle>
              <CardDescription>The checkout flow sends you to Paystack and returns you to your dashboard context, where your learner hub can reflect the new onsite state.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="cta" className="w-full" onClick={handleCheckout} disabled={loading || isPaid}>
                {loading ? "Preparing checkout..." : isPaid ? "Onsite Training Active" : "Proceed to secure payment"}
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/dashboard/profile">Review student profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

