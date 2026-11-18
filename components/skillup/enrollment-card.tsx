"use client"

import Link from "next/link"
import { Award, BadgeCheck, CheckCircle2, Gift, Lock, ShieldCheck, ShoppingCart } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Currency } from "@/lib/types"
import { formatCurrency } from "@/lib/utils/format"

interface EnrollmentCardProps {
  price: number
  currency: Currency
  isEnrolled: boolean
  isInCart: boolean
  onBuyNow: () => void
  onAddToCart: () => void
}

export function EnrollmentCard({
  price,
  currency,
  isEnrolled,
  isInCart,
  onBuyNow,
  onAddToCart,
}: EnrollmentCardProps) {
  const isFree = price <= 0

  return (
    <Card className="overflow-hidden rounded-3xl border-border bg-card py-0 shadow-[var(--shadow-lifted)]">
      <div className="h-1.5 w-full bg-gradient-to-r from-[#231651] via-[#613399] to-[#D6FFF6]" />
      <CardContent className="space-y-5 p-6">
        <div className="space-y-1.5 text-center">
          <Badge variant={isFree ? "mint" : "lavender"} className="mx-auto text-[11px]">
            {isFree ? "Free Foundation Course" : "Full or Installment Tuition"}
          </Badge>
          <p className="font-display text-4xl font-extrabold text-[#231651]">
            {isFree ? "FREE (₦0)" : formatCurrency(price, currency)}
          </p>
          <p className="text-xs text-muted-foreground">
            {isFree ? "Included free with SkillUp tracks" : "Pay in full or via structured Paystack installments"}
          </p>
        </div>

        {/* Complimentary Foundation Bundle Callout */}
        <div className="rounded-2xl border border-[#0A5C4A]/20 bg-[#D6FFF6]/45 p-3.5 text-xs text-[#0A5C4A]">
          <div className="flex items-center gap-1.5 font-bold">
            <Gift className="h-4 w-4 shrink-0" />
            <span>Includes 2 Free Foundation Courses</span>
          </div>
          <p className="mt-1 leading-relaxed">
            Basic AI 101 &amp; Basic Digital Literacy unlock automatically in your dashboard upon enrolment.
          </p>
        </div>

        {isEnrolled ? (
          <Button variant="cta" size="lg" className="w-full" asChild>
            <Link href="/dashboard">Continue Learning</Link>
          </Button>
        ) : (
          <div className="space-y-2.5">
            <Button variant="cta" size="lg" className="w-full" onClick={onBuyNow}>
              {isInCart ? "Go to Checkout" : isFree ? "Enroll Now (Free)" : "Proceed to Enrollment"}
            </Button>
            {!isInCart ? (
              <Button variant="outline" size="lg" className="w-full" onClick={onAddToCart}>
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            ) : null}
          </div>
        )}

        <div className="space-y-2 border-t border-border/70 pt-4 text-xs">
          <p className="font-bold text-[#231651]">Every SkillUp enrolment includes:</p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0A5C4A]" />
            Verifiable graduation certificate (/verify)
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0A5C4A]" />
            Direct instructor feedback &amp; rubric grading
          </p>
          <p className="flex items-center gap-2 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#0A5C4A]" />
            Lifetime access to recorded lessons &amp; updates
          </p>
        </div>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-[#F8FAFB] px-3 py-2 text-[11px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <Lock className="h-3.5 w-3.5 text-[#613399]" />
            Paystack Secure
          </span>
          <span className="flex items-center gap-1">
            <BadgeCheck className="h-3.5 w-3.5 text-[#0A5C4A]" />
            Rubric Graded
          </span>
          <span className="flex items-center gap-1">
            <Award className="h-3.5 w-3.5 text-[#231651]" />
            Verified ID
          </span>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-[#613399]" />
          Enugu Main Learning Centre &bull; Online &amp; Hybrid
        </p>
      </CardContent>
    </Card>
  )
}
