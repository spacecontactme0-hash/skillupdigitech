import Link from "next/link"
import { ArrowLeft, Compass } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { GrowthPathMotif } from "@/components/brand/motifs"

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-16">
      <GrowthPathMotif className="pointer-events-none absolute right-0 top-0 h-80 w-96 text-[#613399] opacity-60" />

      <div className="relative z-10 mx-auto max-w-lg rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)] sm:p-10">
        <div className="mb-6 flex justify-center">
          <Logo variant="horizontal" />
        </div>

        <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-[#F3EFFA] px-3.5 py-1 font-mono text-xs font-semibold text-[#613399]">
          ERROR 404
        </div>

        <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#231651]">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The route may have moved as part of our platform updates, or the link might be mistyped. Explore our active
          programmes or return to the homepage.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="cta" size="lg" asChild>
            <Link href="/courses">
              <Compass className="h-4 w-4" />
              Browse Programmes
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
