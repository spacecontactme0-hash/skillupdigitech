"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application boundary error:", error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="mx-auto max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)] sm:p-10">
        <div className="mb-6 flex justify-center">
          <Logo variant="horizontal" />
        </div>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#231651]">
          Something unexpected happened
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          A temporary error interrupted this screen. Your account and learning progress remain safe. Try reloading this
          view or return home.
        </p>

        {error?.digest ? (
          <p className="mt-3 font-mono text-[11px] text-muted-foreground">Reference: {error.digest}</p>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="cta" size="lg" onClick={() => reset()}>
            <RotateCcw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
