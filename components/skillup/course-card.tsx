"use client"

import Link from "next/link"
import { ArrowRight, Clock, Star, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Course, Currency } from "@/lib/types"
import { formatCurrency, formatDuration } from "@/lib/utils/format"

interface CourseCardProps {
  course: Course
  currency: Currency
  showCartAction?: boolean
  isEnrolled?: boolean
  onAddToCart?: (course: Course) => void
}

function getInitials(name?: string) {
  if (!name) return "SK"
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("")
}

export function CourseCard({
  course,
  currency,
  showCartAction = false,
  isEnrolled = false,
  onAddToCart,
}: CourseCardProps) {
  const numericPrice = course.price?.[currency] ?? 0
  const isFree = numericPrice <= 0
  const coverSrc =
    course.thumbnail && !course.thumbnail.includes("placeholder")
      ? course.thumbnail
      : "/images/courses/frontend-dev.png"
  const hasAvatar = Boolean(course.instructorAvatar && !course.instructorAvatar.includes("placeholder"))

  return (
    <Card
      variant="elevated"
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border-border bg-card py-0 transition-all duration-200 hover:-translate-y-1 hover:border-[#613399]/50 hover:shadow-[var(--shadow-lifted)]"
    >
      {/* Subtle Maker corner bracket highlight on hover */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 z-10 h-3.5 w-3.5 rounded-tr-md border-r-2 border-t-2 border-[#D6FFF6] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />

      <Link href={`/courses/${course.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#150C33]">
          <img
            src={coverSrc}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#150C33]/75 via-[#150C33]/10 to-transparent"
          />
          <div className="absolute left-3.5 top-3.5 flex flex-wrap items-center gap-1.5">
            {isFree ? (
              <Badge variant="mint" className="text-[10px] font-bold uppercase tracking-wide shadow-xs">
                Free Foundation
              </Badge>
            ) : (
              <Badge variant="lavender" className="text-[10px] shadow-xs">
                {course.category}
              </Badge>
            )}
          </div>
          <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-[11px] font-medium text-white">
            {course.totalDuration > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#150C33]/75 px-2.5 py-0.5 backdrop-blur-xs">
                <Clock className="h-3 w-3 text-[#D6FFF6]" />
                {formatDuration(course.totalDuration)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#150C33]/75 px-2.5 py-0.5 backdrop-blur-xs">
                <Clock className="h-3 w-3 text-[#D6FFF6]" />
                Structured Modules
              </span>
            )}
            <span className="rounded-full bg-[#150C33]/75 px-2.5 py-0.5 font-mono text-[10px] capitalize text-[#E8E3F5] backdrop-blur-xs">
              {course.level}
            </span>
          </div>
        </div>
      </Link>

      <CardContent className="flex flex-1 flex-col gap-3.5 p-5">
        <Link href={`/courses/${course.slug}`} className="space-y-2">
          <h3 className="line-clamp-2 font-display text-base font-bold text-[#231651] transition-colors group-hover:text-[#613399]">
            {course.title}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{course.description}</p>
        </Link>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {hasAvatar ? (
            <img
              src={course.instructorAvatar}
              alt={course.instructorName || "SkillUp Instructor"}
              className="h-6 w-6 rounded-full object-cover ring-1 ring-border"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#F3EFFA] font-mono text-[10px] font-bold text-[#231651]">
              {getInitials(course.instructorName)}
            </span>
          )}
          <span className="truncate font-medium text-foreground/80">
            {course.instructorName || "SkillUp Faculty"}
          </span>
        </div>

        <div className="mt-auto space-y-3 border-t border-border/70 pt-3.5">
          <div className="flex items-center justify-between">
            <div>
              {isFree ? (
                <p className="font-display text-lg font-extrabold text-[#0A5C4A]">FREE (&#8358;0)</p>
              ) : (
                <p className="font-display text-lg font-extrabold text-[#231651]">
                  {formatCurrency(numericPrice, currency)}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {isFree ? "Included with every track" : "Full or installment tuition"}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">{course.rating.toFixed(1)}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {course.enrollmentCount}
              </span>
            </div>
          </div>

          {showCartAction && onAddToCart ? (
            <Button
              variant={isEnrolled ? "outline" : "cta"}
              size="sm"
              className="w-full"
              disabled={isEnrolled}
              onClick={(e) => {
                e.preventDefault()
                onAddToCart(course)
              }}
            >
              {isEnrolled ? "Already Enrolled" : isFree ? "Enroll Free" : "Add to Cart"}
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={`/courses/${course.slug}`}>
                View Syllabus
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
