# SkillUp Digitech Academy — Rebrand V2 Brand Guidelines

**Version:** 2.0 (Phase 1 Foundation)  
**Status:** Active Implementation Standard  
**Owner:** Product Design & Frontend Architecture

---

## 1. Brand Positioning & Voice

SkillUp Digitech Academy is a structured, practical technology education institution operating in Enugu (14 Garden Avenue, GRA, Enugu) and online across Nigeria and Africa. It serves:

- **Teenagers (aged 13–18):** Secondary school learners building coding, AI literacy, robotics, and creative technology foundations.
- **Adults (18+):** Career switchers, undergraduates, and professionals pursuing job-ready tracks and modular upskilling.

### Brand Personality Pillars
- **Structured & Credible:** Real academic cohorts, rubric evaluations, and verifiable certificates.
- **Modern & Energetic:** Forward-looking digital craftsmanship without looking childish or gimmicky.
- **Warm & Accessible:** Approachable to teens, parents, and career learners alike.

### What We Avoid
- Generic graduation-cap or `>_` terminal icons as our primary brand symbol.
- Unrelated caregiver/medical photography (retired PromptCare assets are prohibited).
- Fabricated testimonials, inflated graduate counters, or hardcoded placeholder meeting links.

---

## 2. The SkillUp Growth Mark

The **SkillUp Growth Mark** is an abstract geometric ascending **"S"** constructed from modular interlocking skill blocks moving upward-right into a luminous **Mint (`#D6FFF6`) apex growth node**.

### Symbol Meaning
1. **Foundation Block (Bottom, Lavender `#9D83DB`):** Digital literacy and core foundational skills.
2. **Ascending Modular Bridge (Center, White Gradient):** Structured cohort progression and hands-on projects.
3. **Summit Bar + Mint Apex Node (`#D6FFF6` / `#0A5C4A`):** Career readiness, verified mastery, and upward trajectory.

### Official Brand Asset Files (`public/brand/`)
| Asset | File Path | Usage |
|---|---|---|
| Standalone Mark | `/brand/skillup-mark.svg` | App headers, portal badges, certificates |
| Monochrome Mark | `/brand/skillup-mark-mono.svg` | Print stamps, watermark overlays, single-ink usage |
| Horizontal Logo (Light) | `/brand/skillup-logo-horizontal-light.svg` | Light navigation bars, invoices, emails |
| Horizontal Logo (Dark) | `/brand/skillup-logo-horizontal-dark.svg` | Dark Russian Violet heroes, footers, dark mode |
| Stacked Logo | `/brand/skillup-logo-stacked.svg` | Auth cards, splash screens, certificates |
| Favicon (32px Optical) | `/brand/skillup-favicon.svg` & `app/icon.svg` | Browser tabs, bookmarks |
| Social Avatar (512px) | `/brand/skillup-social-avatar.svg` | Social profiles, OpenGraph icon, Apple touch icon |

### Clearspace & Minimum Sizing
- Maintain minimum clearspace equal to **25% of the mark's width** on all sides.
- Minimum rendered mark size: **24px** in UI chrome (`16px` exclusively for the optically simplified favicon SVG).
- Never stretch, skew, outline-stroke the wordmark, or recolor the Mint apex node into legacy Tech Blue (`#2563EB`).

---

## 3. Core Brand Colour Palette

| Name | Hex | Role | Accessibility Guidance |
|---|---|---|---|
| **Russian Violet** | `#231651` | Primary brand identity, main CTAs, display headings | 13.6:1 contrast on `#FFFFFF` / `#F8FAFB` |
| **Deep Night Plum** | `#150C33` | Primary body ink, deep hero anchor, dark hover | 16.9:1 contrast on `#FFFFFF` |
| **Electric Violet** | `#613399` | Interactive highlights, active sub-tabs, focus rings | 8.1:1 contrast on `#FFFFFF` |
| **Luminous Mint** | `#D6FFF6` | High-energy dark-surface CTA fill, highlight badges | **NEVER use as text on white!** Pair with `#0A5C4A` or `#150C33` text (5.4:1+ AA) |
| **Emerald Ink** | `#0A5C4A` | Text/icons on Mint badges & success status text | 7.8:1 contrast on `#FFFFFF`; 5.4:1 on `#D6FFF6` |
| **Soft Ice Lavender** | `#E8E3F5` | Card borders, structural dividers, secondary surface tint | Structural use only — never use for body text |
| **Light Canvas** | `#F8FAFB` | Primary application page background | Clean editorial neutrality |

---

## 4. Unique Brand Design Motifs (`components/brand/motifs.tsx` & `public/brand/motifs/`)

Four signature architectural motifs—built exclusively from SkillUp's ascending modular geometry and Russian Violet / Electric Violet / Mint tokens—appear selectively across heroes, section dividers, cards, empty states, certificate frames, loading screens, and dashboard banners:

1. **The Growth Path (`GrowthPathMotif` · `/brand/motifs/growth-path.svg`)** — Stepped modular skill blocks, ascending progression rail, and luminous Mint summit pulse representing cohort learning progression.
2. **Connected Thinking (`ConnectedThinkingMotif` · `/brand/motifs/connected-thinking.svg`)** — Concentric orbital curves and constellation relay nodes representing collaboration, mentorship, and Enugu-to-online reach.
3. **Digital Grid (`DigitalGridMotif` · `/brand/motifs/digital-grid.svg`)** — Blueprint micro-grid with selective illuminated modular squares, registration crosshairs, and radial fade mask.
4. **The Maker Language (`MakerLanguageMotif` · `/brand/motifs/maker-language.svg`)** — Studio corner framing brackets, abstract `< />` chevrons, modular syntax pills, and terminal cursor accent representing hands-on building.

### Compositional Motif Components
- `MotifSectionDivider` (`growth`, `orbit`, `grid`, `maker`) — Architectural dividers between sections.
- `MotifLoadingState` — Branded loading panel combining the SkillUp Growth Mark, orbital spinner, and Maker monospace status.
- `MotifCertificateBorder` — Corner framing brackets and subtle Growth Path watermark for diplomas and `/verify` credential cards.
