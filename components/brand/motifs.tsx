import React, { useId } from "react"
import { LogoMark } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

interface MotifProps extends React.SVGProps<SVGSVGElement> {
  className?: string
}

/**
 * MOTIF 1 — THE GROWTH PATH
 * Unique SkillUp signature: ascending modular skill-blocks, stepped geometric risers,
 * and luminous Mint milestone nodes echoing the ascending "S" Growth Mark.
 */
export function GrowthPathMotif({ className = "pointer-events-none select-none", ...props }: MotifProps) {
  const uid = useId().replace(/:/g, "")
  const railGrad = `skp-growth-rail-${uid}`
  const blockGrad = `skp-growth-block-${uid}`

  return (
    <svg viewBox="0 0 520 300" fill="none" aria-hidden="true" className={className} {...props}>
      <defs>
        <linearGradient id={railGrad} x1="24" y1="264" x2="486" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="55%" stopColor="#613399" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#D6FFF6" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={blockGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#613399" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#231651" stopOpacity="0.06" />
        </linearGradient>
      </defs>

      {/* Stepped Modular Skill Blocks */}
      <rect x="36" y="218" width="94" height="30" rx="9" fill={`url(#${blockGrad})`} stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.25" />
      <rect x="148" y="168" width="106" height="30" rx="9" fill={`url(#${blockGrad})`} stroke="currentColor" strokeOpacity="0.22" strokeWidth="1.25" />
      <rect x="272" y="114" width="114" height="30" rx="9" fill={`url(#${blockGrad})`} stroke="#D6FFF6" strokeOpacity="0.28" strokeWidth="1.25" />
      <rect x="398" y="60" width="84" height="30" rx="9" fill="#D6FFF6" fillOpacity="0.16" stroke="#D6FFF6" strokeOpacity="0.55" strokeWidth="1.5" />

      {/* Ascending Primary Progression Rail */}
      <path
        d="M24 256H118L164 210H236L288 158H368L428 98H486"
        stroke={`url(#${railGrad})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Secondary Dashed Rhythm Trail */}
      <path
        d="M66 276H148L194 230H268L320 178H402L462 118"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeDasharray="5 8"
        strokeLinecap="round"
        strokeOpacity="0.2"
      />

      {/* Vertical Alignment Ticks */}
      <path d="M164 198V210M288 144V158M428 90V98" stroke="#D6FFF6" strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />

      {/* Milestone Nodes */}
      <circle cx="118" cy="256" r="4.5" fill="currentColor" fillOpacity="0.35" />
      <circle cx="164" cy="210" r="5.5" fill="#613399" fillOpacity="0.7" stroke="#D6FFF6" strokeOpacity="0.4" strokeWidth="1.5" />
      <circle cx="288" cy="158" r="6" fill="#613399" fillOpacity="0.85" stroke="#D6FFF6" strokeOpacity="0.65" strokeWidth="1.75" />

      {/* Luminous Mint Summit Pulse */}
      <circle cx="486" cy="98" r="15" fill="#D6FFF6" fillOpacity="0.14" />
      <circle cx="486" cy="98" r="8.5" fill="#D6FFF6" fillOpacity="0.35" />
      <circle cx="486" cy="98" r="4.5" fill="#D6FFF6" />
    </svg>
  )
}

/**
 * MOTIF 2 — CONNECTED THINKING
 * Concentric orbital arcs, constellation intersections, and luminous Mint relays
 * representing cohort collaboration, mentorship, and Enugu-to-global digital reach.
 */
export function ConnectedThinkingMotif({ className = "pointer-events-none select-none", ...props }: MotifProps) {
  const uid = useId().replace(/:/g, "")
  const orbitGrad = `skp-orbit-${uid}`

  return (
    <svg viewBox="0 0 420 280" fill="none" aria-hidden="true" className={className} {...props}>
      <defs>
        <linearGradient id={orbitGrad} x1="40" y1="240" x2="380" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.12" />
          <stop offset="50%" stopColor="#613399" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#D6FFF6" stopOpacity="0.75" />
        </linearGradient>
      </defs>

      {/* Concentric Orbital Curves */}
      <ellipse cx="220" cy="146" rx="176" ry="88" transform="rotate(-14 220 146)" stroke={`url(#${orbitGrad})`} strokeWidth="1.4" />
      <ellipse cx="220" cy="146" rx="122" ry="58" transform="rotate(-14 220 146)" stroke="currentColor" strokeOpacity="0.18" strokeDasharray="4 7" strokeWidth="1.2" />
      <ellipse cx="220" cy="146" rx="68" ry="32" transform="rotate(-14 220 146)" stroke="#D6FFF6" strokeOpacity="0.28" strokeWidth="1.2" />

      {/* Constellation Synapse Vectors */}
      <path
        d="M66 196L146 116L228 156L318 76L368 134M146 116L224 54L318 76M228 156L266 220"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Hub & Relay Nodes */}
      <circle cx="66" cy="196" r="5" fill="currentColor" fillOpacity="0.3" />
      <circle cx="146" cy="116" r="7" fill="#613399" fillOpacity="0.65" stroke="#D6FFF6" strokeOpacity="0.5" strokeWidth="1.5" />
      <circle cx="224" cy="54" r="5" fill="currentColor" fillOpacity="0.32" />
      <circle cx="228" cy="156" r="6" fill="currentColor" fillOpacity="0.25" />
      <circle cx="266" cy="220" r="4.5" fill="currentColor" fillOpacity="0.28" />
      <circle cx="368" cy="134" r="5" fill="#D6FFF6" fillOpacity="0.55" />

      {/* Primary Focal Node */}
      <circle cx="318" cy="76" r="16" fill="#D6FFF6" fillOpacity="0.15" />
      <circle cx="318" cy="76" r="7" fill="#D6FFF6" />
      <circle cx="318" cy="76" r="2.8" fill="#0A5C4A" />
    </svg>
  )
}

/** Backwards-compatible alias */
export const ConnectedNodesMotif = ConnectedThinkingMotif

/**
 * MOTIF 3 — DIGITAL GRID
 * Architectural blueprint micro-grid with selective illuminated modular squares,
 * precision crosshairs, and radial fade mask.
 */
export function DigitalGridMotif({ className = "pointer-events-none select-none", ...props }: MotifProps) {
  const uid = useId().replace(/:/g, "")
  const gridId = `skp-grid-${uid}`
  const maskGrad = `skp-grid-fade-${uid}`
  const maskId = `skp-grid-mask-${uid}`

  return (
    <svg viewBox="0 0 400 240" fill="none" aria-hidden="true" className={className} {...props}>
      <defs>
        <pattern id={gridId} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" stroke="currentColor" strokeOpacity="0.14" strokeWidth="1" />
          <circle cx="0" cy="0" r="1.4" fill="currentColor" fillOpacity="0.28" />
        </pattern>
        <radialGradient id={maskGrad} cx="42%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <mask id={maskId}>
          <rect width="400" height="240" fill={`url(#${maskGrad})`} />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`}>
        <rect width="400" height="240" fill={`url(#${gridId})`} />

        {/* Selective Illuminated Modular Pixel Cells */}
        <rect x="64" y="32" width="32" height="32" rx="4" fill="#613399" fillOpacity="0.2" />
        <rect x="160" y="64" width="32" height="32" rx="4" fill="#D6FFF6" fillOpacity="0.22" />
        <rect x="192" y="64" width="32" height="32" rx="4" fill="#613399" fillOpacity="0.16" />
        <rect x="256" y="128" width="32" height="32" rx="4" fill="#D6FFF6" fillOpacity="0.26" />
        <rect x="96" y="128" width="32" height="32" rx="4" fill="currentColor" fillOpacity="0.08" />

        {/* Coordinate Registration Crosshairs */}
        <path d="M160 56V72M152 64H168" stroke="#D6FFF6" strokeOpacity="0.7" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M288 120V136M280 128H296" stroke="#D6FFF6" strokeOpacity="0.65" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  )
}

/**
 * MOTIF 4 — THE MAKER LANGUAGE
 * Precision engineering brackets, modular syntax chips, cursor accent, and
 * studio corner frame marks representing hands-on software & AI building.
 */
export function MakerLanguageMotif({ className = "pointer-events-none select-none", ...props }: MotifProps) {
  return (
    <svg viewBox="0 0 300 180" fill="none" aria-hidden="true" className={className} {...props}>
      {/* Corner Studio Registration Brackets */}
      <path d="M16 46V16H46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.35" />
      <path d="M254 16H284V46" stroke="#D6FFF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.75" />
      <path d="M16 134V164H46" stroke="#D6FFF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.75" />
      <path d="M254 164H284V134" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.35" />

      {/* Abstract Code Chevrons < / > */}
      <path d="M68 68L48 88L68 108" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45" />
      <path d="M104 60L84 116" stroke="#D6FFF6" strokeWidth="2.6" strokeLinecap="round" strokeOpacity="0.8" />
      <path d="M120 68L140 88L120 108" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.45" />

      {/* Modular Syntax Fragments & Terminal Cursor */}
      <rect x="164" y="62" width="62" height="10" rx="5" fill="currentColor" fillOpacity="0.28" />
      <rect x="234" y="62" width="24" height="10" rx="5" fill="#D6FFF6" fillOpacity="0.65" />

      <rect x="164" y="84" width="40" height="10" rx="5" fill="#613399" fillOpacity="0.55" />
      <rect x="212" y="84" width="46" height="10" rx="5" fill="currentColor" fillOpacity="0.2" />

      <rect x="164" y="106" width="76" height="10" rx="5" fill="currentColor" fillOpacity="0.24" />
      <rect x="248" y="103" width="8" height="16" rx="2.5" fill="#D6FFF6" />
    </svg>
  )
}

/** Backwards-compatible alias */
export const MakerBracketMotif = MakerLanguageMotif

/**
 * REUSABLE SECTION DIVIDER
 * Selective architectural divider weaving SkillUp's 4 motifs between page sections.
 */
export function MotifSectionDivider({
  variant = "growth",
  className,
}: {
  variant?: "growth" | "orbit" | "grid" | "maker"
  className?: string
}) {
  return (
    <div aria-hidden="true" className={cn("container flex items-center justify-center py-2", className)}>
      <div className="flex w-full items-center gap-4">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-[#613399]/30" />
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 shadow-xs">
          {variant === "growth" ? (
            <>
              <span className="h-1.5 w-3 rounded-full bg-[#B9A6E8]" />
              <span className="h-1.5 w-4 rounded-full bg-[#613399]" />
              <span className="h-2 w-2 rounded-full bg-[#0A5C4A] ring-2 ring-[#D6FFF6]" />
            </>
          ) : variant === "orbit" ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-[#613399]/50" />
              <span className="h-px w-4 bg-[#613399]/40" />
              <span className="h-2 w-2 rounded-full bg-[#231651]" />
              <span className="h-px w-4 bg-[#613399]/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#0A5C4A]" />
            </>
          ) : variant === "grid" ? (
            <span className="grid grid-cols-3 gap-1">
              <span className="h-1.5 w-1.5 rounded-[2px] bg-[#E8E3F5]" />
              <span className="h-1.5 w-1.5 rounded-[2px] bg-[#613399]" />
              <span className="h-1.5 w-1.5 rounded-[2px] bg-[#0A5C4A]" />
            </span>
          ) : (
            <span className="font-mono text-[10px] font-bold tracking-widest text-[#613399]">&lt;/&gt;</span>
          )}
        </div>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-[#613399]/30" />
      </div>
    </div>
  )
}

/**
 * REUSABLE BRANDED LOADING STATE
 * Combines the SkillUp Growth Mark with Connected Thinking orbital ring and Maker monospace cue.
 */
export function MotifLoadingState({
  label = "Loading SkillUp workspace...",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative flex min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <DigitalGridMotif className="pointer-events-none absolute inset-0 h-full w-full text-[#231651] opacity-40" />
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-[#E8E3F5] border-t-[#613399]" />
        <LogoMark size={36} className="h-9 w-9" />
      </div>
      <p className="relative mt-4 font-display text-sm font-bold text-[#231651]">{label}</p>
      <p className="relative mt-1 font-mono text-[11px] text-muted-foreground">syncing_academy_runtime_</p>
    </div>
  )
}

/**
 * REUSABLE CERTIFICATE & CREDENTIAL FRAME MOTIF
 * Precision corner Maker brackets and subtle Growth Path watermark for diplomas and /verify cards.
 */
export function MotifCertificateBorder({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)}>
      <span className="absolute left-3 top-3 h-5 w-5 rounded-tl-md border-l-2 border-t-2 border-[#613399]/40" />
      <span className="absolute right-3 top-3 h-5 w-5 rounded-tr-md border-r-2 border-t-2 border-[#0A5C4A]/45" />
      <span className="absolute bottom-3 left-3 h-5 w-5 rounded-bl-md border-b-2 border-l-2 border-[#0A5C4A]/45" />
      <span className="absolute bottom-3 right-3 h-5 w-5 rounded-br-md border-b-2 border-r-2 border-[#613399]/40" />
      <GrowthPathMotif className="absolute -bottom-8 -right-8 h-36 w-56 text-[#613399] opacity-25" />
    </div>
  )
}
