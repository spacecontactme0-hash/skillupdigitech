# SkillUp Digitech Academy — Rebrand V2 Design System

**Source of Truth:** `app/globals.css`, `app/layout.tsx`, `components/ui/*`  
**Framework:** Next.js 16.1.6 App Router · Tailwind CSS v4 · Radix UI Primitives

---

## 1. Semantic Colour Tokens (`app/globals.css`)

Legacy Tech Blue (`#2563eb` / `#0284c7`) has been retired. Components must reference semantic CSS custom properties rather than arbitrary hex codes:

| Semantic Token | Light Mode Value | Dark Mode Value | Purpose |
|---|---|---|---|
| `--background` | `#F8FAFB` | `#110A29` | Page canvas |
| `--foreground` | `#150C33` | `#F8FAFB` | Primary ink |
| `--card` | `#FFFFFF` | `#1A103D` | Elevated panels & cards |
| `--primary` | `#231651` | `#D6FFF6` | Primary action fill |
| `--primary-foreground` | `#FFFFFF` | `#150C33` | Primary action text |
| `--accent` | `#613399` | `#8B5CF6` | Interactive highlight & active state |
| `--secondary` | `#F3EFFA` | `#261857` | Soft surface fill / subtle buttons |
| `--muted-foreground` | `#5A5373` | `#C4BBE0` | Secondary body copy (WCAG AA compliant) |
| `--border` | `#E8E3F5` | `#31216B` | Card & input borders |
| `--ring` | `#613399` | `#D6FFF6` | Focus-visible outlines |
| `--success` / `--success-surface` | `#0A5C4A` / `#D6FFF6` | `#6EE7B7` / `rgba(10,92,74,0.35)` | Completion, clearance, free foundation badges |
| `--warning` / `--warning-surface` | `#B45309` / `#FEF3C7` | `#FBBF24` / `rgba(180,83,9,0.3)` | Pending review, installment reminders |
| `--destructive` | `#DC2626` | `#F87171` | Destructive actions & validation errors |

---

## 2. Typography System (`app/layout.tsx`)

Loaded via `next/font/google` with `display: "swap"` and zero layout shift:

- **Display / Headings (`--font-plus-jakarta` / `font-display`):** Plus Jakarta Sans (weights `500, 600, 700, 800`, `-0.02em` tracking). Applied automatically to `h1–h4`.
- **Body / UI (`--font-inter` / `font-sans`):** Inter (clean optical readability at `14px–16px`, `1.5–1.6` line height).
- **Technical / Identifiers (`--font-jetbrains-mono` / `font-mono`):** JetBrains Mono (weights `400, 500, 600`) for course codes (`FED-201`), cohort codes, certificate IDs, and rubric scores.

---

## 3. Core Component Contracts

### Buttons (`components/ui/button.tsx`)
- `variant="cta"` — Primary Russian Violet (`#231651`) with hover lift (`--shadow-lifted`).
- `variant="mint"` — Luminous Mint (`#D6FFF6`) with Emerald (`#0A5C4A`) bold text for dark hero/dashboard banners.
- `variant="outline-dark"` — High-contrast translucent border + white label specifically for dark Russian Violet backgrounds (eliminates white-on-white button failures).
- `variant="brand"` — Russian Violet to Electric Violet gradient for featured brand moments.
- `variant="outline"` / `"secondary"` / `"ghost"` / `"destructive"` — Standard surface actions.
- Touch targets: default height `40px` (`h-10`), large CTA `48px` (`h-12`).

### Badges (`components/ui/badge.tsx`)
- `variant="mint"` — `#D6FFF6` fill + `#0A5C4A` text (free bonus, verified, hybrid active).
- `variant="lavender"` — `#F3EFFA` fill + `#231651` text (track tags, cohort status).
- `variant="violet"` — `#613399` fill + white text (featured emphasis).
- `variant="warning"` / `"destructive"` / `"outline"` — Operational statuses.

### Inputs & Form Controls (`components/ui/input.tsx`)
- Accessible `44px` (`h-11`) height, `rounded-xl` corners, `#E8E3F5` border, `#613399` focus ring (`ring-[3px]`).

### Resilience Boundaries
- `app/not-found.tsx` — Branded 404 screen with Growth Path motif and clear recovery links.
- `app/error.tsx` — Client error boundary preserving brand trust and safe retry recovery.
