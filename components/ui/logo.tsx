import Link from "next/link"
import React, { useId } from "react"
import { getAcademyName } from "@/lib/brand-config"

export interface LogoMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  className?: string
  monochrome?: boolean
  tone?: "default" | "on-dark"
}

/**
 * SkillUp Growth Mark (Rebrand V2)
 * Abstract modular ascending "S" built from interlocking digital skill blocks
 * rising upward-right into a luminous Mint (#D6FFF6) apex node.
 */
export function LogoMark({
  size = 40,
  className = "h-10 w-10 shrink-0",
  monochrome = false,
  tone = "default",
  ...props
}: LogoMarkProps) {
  const uid = useId().replace(/:/g, "")
  const bgId = `skillup-bg-${uid}`
  const midId = `skillup-mid-${uid}`

  if (monochrome) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        aria-hidden="true"
        className={className}
        {...props}
      >
        <rect x="2.5" y="2.5" width="59" height="59" rx="15.5" stroke="currentColor" strokeWidth="3" />
        <rect x="14" y="41" width="26" height="8.5" rx="4.25" fill="currentColor" fillOpacity="0.55" />
        <path
          d="M35 41L41.5 34.5C43.2 32.8 42 29.8 39.6 29.8H24.4C22 29.8 20.8 26.8 22.5 25.1L29 18.6"
          stroke="currentColor"
          strokeWidth="8.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="24" y="14.5" width="20" height="8.5" rx="4.25" fill="currentColor" />
        <circle cx="48.5" cy="18.75" r="5" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id={bgId} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          {tone === "on-dark" ? (
            <>
              <stop offset="0%" stopColor="#3B2380" />
              <stop offset="100%" stopColor="#231651" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="#2D1B69" />
              <stop offset="55%" stopColor="#231651" />
              <stop offset="100%" stopColor="#150C33" />
            </>
          )}
        </linearGradient>
        <linearGradient id={midId} x1="16" y1="36" x2="48" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#B9A6E8" />
          <stop offset="100%" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>

      <rect x="2" y="2" width="60" height="60" rx="16" fill={`url(#${bgId})`} />
      <rect
        x="2.75"
        y="2.75"
        width="58.5"
        height="58.5"
        rx="15.25"
        stroke={tone === "on-dark" ? "#D6FFF6" : "#613399"}
        strokeOpacity={tone === "on-dark" ? 0.35 : 0.55}
        strokeWidth="1.5"
      />
      <path d="M16 48L48 16" stroke="#613399" strokeOpacity="0.28" strokeWidth="1.5" strokeLinecap="round" />

      <rect x="14" y="41" width="26" height="8.5" rx="4.25" fill={tone === "on-dark" ? "#B9A6E8" : "#9D83DB"} />
      <path
        d="M35 41L41.5 34.5C43.2 32.8 42 29.8 39.6 29.8H24.4C22 29.8 20.8 26.8 22.5 25.1L29 18.6"
        stroke={`url(#${midId})`}
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="24" y="14.5" width="20" height="8.5" rx="4.25" fill="#FFFFFF" />
      <circle cx="48.5" cy="18.75" r="5" fill="#D6FFF6" />
      <circle cx="48.5" cy="18.75" r="2.1" fill="#0A5C4A" />
    </svg>
  )
}

export interface LogoProps {
  className?: string
  variant?: "full" | "horizontal" | "stacked" | "icon" | "mark" | "compact"
  tone?: "light" | "dark"
  href?: string | null
  showText?: boolean
  academyName?: string
}

export function Logo({
  className = "",
  variant = "full",
  tone = "light",
  href = "/",
  showText,
  academyName,
}: LogoProps) {
  const resolvedName = academyName || getAcademyName()

  const isDarkSurface = tone === "dark"
  const markTone = isDarkSurface ? "on-dark" : "default"

  const iconElement = (
    <LogoMark
      tone={markTone}
      className={
        variant === "compact"
          ? "h-8 w-8"
          : variant === "stacked"
            ? "h-12 w-12"
            : variant === "icon" || variant === "mark"
              ? "h-9 w-9"
              : "h-9 w-9 sm:h-10 sm:w-10"
      }
    />
  )

  if (variant === "icon" || variant === "mark") {
    if (!href) {
      return (
        <span className={`inline-flex items-center ${className}`} aria-label={resolvedName}>
          {iconElement}
        </span>
      )
    }
    return (
      <Link href={href} className={`inline-flex items-center ${className}`} aria-label={resolvedName}>
        {iconElement}
      </Link>
    )
  }

  const shouldRenderText = showText ?? true
  const primaryWordClass = isDarkSurface ? "text-white" : "text-[#231651] dark:text-white"
  const accentWordClass = isDarkSurface ? "text-[#D6FFF6]" : "text-[#613399] dark:text-[#D6FFF6]"
  const subtitleClass = isDarkSurface ? "text-[#C4BBE0]" : "text-muted-foreground"

  const wordmark = (
    <span className={variant === "stacked" ? "flex flex-col items-center text-center" : "flex flex-col leading-none"}>
      <span
        className={`font-display font-extrabold tracking-tight ${
          variant === "compact" ? "text-base" : variant === "stacked" ? "text-xl" : "text-lg sm:text-xl"
        }`}
      >
        <span className={primaryWordClass}>Skill</span>
        <span className={accentWordClass}>Up</span>
      </span>
      <span
        className={`font-sans font-bold uppercase tracking-[0.16em] ${subtitleClass} ${
          variant === "compact" ? "text-[9px] mt-0.5" : "text-[10px] mt-0.5"
        }`}
      >
        Digitech Academy
      </span>
    </span>
  )

  const content = (
    <span
      className={
        variant === "stacked"
          ? "inline-flex flex-col items-center gap-2.5"
          : "inline-flex items-center gap-2.5 sm:gap-3"
      }
    >
      {iconElement}
      {shouldRenderText ? wordmark : null}
    </span>
  )

  if (!href) {
    return <span className={`inline-flex items-center ${className}`}>{content}</span>
  }

  return (
    <Link href={href} className={`inline-flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl ${className}`} aria-label={resolvedName}>
      {content}
    </Link>
  )
}
