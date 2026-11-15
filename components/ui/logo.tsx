import Link from "next/link"
import React from "react"
import { getAcademyName } from "@/lib/brand-config"

export interface LogoMarkProps extends React.SVGProps<SVGSVGElement> {
  size?: number
  className?: string
}

/**
 * Geometric SVG SkillUp Brand Mark
 * Clean, modern squircle housing terminal chevron, prompt cursor, and network compiler node.
 */
export function LogoMark({ size = 40, className = "h-10 w-10 shrink-0", ...props }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="tech-logo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E3A8A" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="tech-logo-accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#60A5FA" />
        </linearGradient>
      </defs>
      {/* Base container squircle */}
      <rect width="40" height="40" rx="10" fill="url(#tech-logo-bg)" />
      <rect x="0.5" y="0.5" width="39" height="39" rx="9.5" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

      {/* Grid line accents */}
      <path d="M7 20H33M20 7V33" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

      {/* Terminal chevron: > */}
      <path
        d="M12 13.5L19.5 20L12 26.5"
        stroke="#FFFFFF"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Terminal prompt cursor: _ */}
      <line x1="21.5" y1="26.5" x2="28.5" y2="26.5" stroke="url(#tech-logo-accent)" strokeWidth="2.75" strokeLinecap="round" />

      {/* Compiler / node accent indicator */}
      <circle cx="27" cy="14" r="2.25" fill="#38BDF8" />
    </svg>
  )
}

export interface LogoProps {
  className?: string
  variant?: "full" | "icon" | "mark" | "compact"
  href?: string | null
  showText?: boolean
  academyName?: string
}

export function Logo({
  className = "",
  variant = "full",
  href = "/",
  showText,
  academyName,
}: LogoProps) {
  const resolvedName = academyName || getAcademyName()

  // Format brand typography: split first word from remainder for modern visual weight
  const words = resolvedName.split(" ")
  let firstWord = words[0] || "SKILLUP"
  let restWords = words.slice(1).join(" ")

  // If single word like "SkillUp", split "Skill" and "Up" for clean dual-tone typography
  if (!restWords) {
    const match = resolvedName.match(/^([A-Za-z]+?)(Up)$/i)
    if (match) {
      firstWord = match[1]
      restWords = match[2]
    }
  }

  const iconElement = (
    <LogoMark
      className={
        variant === "compact"
          ? "h-7 w-7"
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

  const content = (
    <span className="flex items-center gap-2.5 sm:gap-3">
      {iconElement}
      {shouldRenderText ? (
        variant === "compact" ? (
          <span className="text-xs uppercase tracking-wider text-foreground">
            <span className="font-bold">{firstWord}</span>
            {restWords ? (
              <>
                {" "}
                <span className="font-medium text-muted-foreground">{restWords}</span>
              </>
            ) : null}
          </span>
        ) : (
          <span className="flex flex-col leading-tight">
            <span className="text-base sm:text-lg uppercase tracking-wide text-foreground">
              <span className="font-extrabold">{firstWord}</span>
              {restWords ? (
                <>
                  {" "}
                  <span className="font-medium text-muted-foreground">{restWords}</span>
                </>
              ) : null}
            </span>
          </span>
        )
      ) : null}
    </span>
  )

  if (!href) {
    return <span className={`inline-flex items-center ${className}`}>{content}</span>
  }

  return (
    <Link href={href} className={`inline-flex items-center ${className}`} aria-label={resolvedName}>
      {content}
    </Link>
  )
}
