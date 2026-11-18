# SKILLUP DIGITECH ACADEMY — REBRAND V2 IMPLEMENTATION BASELINE (PHASE 0)

**Date:** 2026-11-18  
**Phase:** Phase 0 — Repository Baseline, Asset Inspection & Audit Reconciliation  
**Status:** Verified Baseline Established — Awaiting Approval to Begin Phase 1  
**Mode:** Strictly Read-Only Baseline (Zero application code modified during Phase 0)

---

## 1. Verified Technical Health Baseline (Before Any Phase 1 Edits)

| Gate / System | Verified Status | Exact Evidence |
| :--- | :---: | :--- |
| **Framework & Runtime** | Healthy | Next.js `16.1.6` (App Router, Turbopack), React `19.2.0`, TypeScript `5`, `npm` |
| **ESLint (`npm run lint`)** | **PASS (0 errors)** | Exited with code 0 on 2026-11-18 |
| **TypeScript (`npx tsc --noEmit`)** | **PASS (0 errors)** | Verified clean with `typescript.ignoreBuildErrors: false` in `next.config.mjs` |
| **Production Build (`npm run build`)** | **PASS (108 routes)** | Clean Turbopack compilation |
| **Academic Test Suite (`npm run test:academic`)** | **PASS (22/22)** | Registration, BYOL, safeguarding, atomic seat booking, attendance, clearance, installments |
| **Security Test Suite (`npm run test:security`)** | **PASS (19/19)** | RBAC isolation, hardened `getTokenFromRequest` cookie+Bearer extraction, dry-run safety |
| **Brevo Email Suite (`npm run test:email`)** | **PASS (45/45)** | Sole Brevo provider (`@getbrevo/brevo`), zero Resend imports, durable idempotency |
| **Paystack Payment Suite (`npm run test:payments`)** | **PASS (6/6)** | Amount, currency, and customer email verification + manual review escalation |
| **Database Backend** | **Neon PostgreSQL** | `DATABASE_BACKEND=postgres`, 39 tables, 5 authentic users, 10 seeded master technology courses, 2 programmes, 3 career pathways, 1 campus (Enugu Main Learning Centre), 2 labs (Turing & Lovelace), 5 cohorts, 20,000ms pool timeout |
| **Legacy MongoDB** | Untouched / Disconnected | Zero reads, zero migrations, zero modifications |

---

## 2. Verified Brand, Asset & Media Baseline (`public/` & `app/`)

### 2.1 Existing Logo & Icon Assets (To Be Replaced with SkillUp Growth Mark)
- `components/ui/logo.tsx` (`LogoMark`), `public/tech-academy-icon.svg`, `app/icon.svg`, `public/icon.png`, `public/apple-icon.png`:
  - All currently render a generic Tech Blue (`#1E3A8A -> #2563EB -> #0284C7`) terminal prompt `>_` squircle.
  - **No approved custom SkillUp Growth Mark exists yet** and `public/brand/` does not exist.
  - Replacing this generic blue terminal icon with a custom **SkillUp Growth Mark** in Russian Violet (`#231651`) + Mint (`#D6FFF6`) + Electric Violet (`#613399`) is fully justified and documented.

### 2.2 Critical Discovery: Missing Seeded Course Thumbnails (`public/images/` Does Not Exist!)
- Inspection of `public/` revealed **46 total files** and **zero `public/images/` directory**.
- However, the 10 seeded master technology courses in PostgreSQL (`scripts/seed-technology-catalog.ts`) reference **10 image paths under `/images/courses/`**:
  1. `/images/courses/digital-literacy.png` (`BDL-101`)
  2. `/images/courses/ai-101.png` (`AI-101`)
  3. `/images/courses/ai-engineering.png` (`AIE-201`)
  4. `/images/courses/ai-automation.png` (`AIA-201`)
  5. `/images/courses/frontend-dev.png` (`FED-201`)
  6. `/images/courses/backend-dev.png` (`BED-201`)
  7. `/images/courses/digital-marketing.png` (`DM-201`)
  8. `/images/courses/graphic-design.png` (`GD-201`)
  9. `/images/courses/video-editing.png` (`VE-201`)
  10. `/images/courses/social-media.png` (`SMM-201`)
- Because `public/images/courses/` does not exist yet, every course card displaying `course.thumbnail` falls back or fails to resolve its dedicated artwork! Creating crisp, cohesive, optimized assets at those exact paths in Phase 1 will immediately fix all 10 master course visuals without touching the database!

### 2.3 Legacy Healthcare / PromptCare Asset Residue in `public/`
- **21 of 46 files in `public/`** belong to the retired PromptCare Caregiver healthcare LMS (`promptcare-*.jpeg/png`, `prompt-heroimg1..4.jpeg`, `ceo-promptcare.jpeg`, `clinical-situatuion-promptcare.jpeg`, `contact-medical-care-kit.svg`, `dr-amara-okoye-director.jpeg`, `eunice-tutor-promptcare.jpeg`, `fundamentals-promptcare.jpeg`, `iyabo-promptcare.jpeg`, `new-chinedu-promptcare.jpeg`, `ngozi-nworah-*.jpeg`, `practice-communication-promptcare.jpeg`, `media/promptcare-home-demo.vtt`).
- **Oversized generic PNGs in `public/`**: `modern-office-team.png` (917 KB), `student-avatar.png` (961 KB), `instructor-avatar.png` (827 KB), `professional-product-manager.png` (808 KB), `professional-woman-ceo.png` (796 KB), `admin-avatar.png` (702 KB).
- **Next.js Image Configuration (`next.config.mjs`)**: Currently sets `images: { unoptimized: true }` — images should be pre-optimized (WebP/compressed PNG) with explicit width/height/aspect-ratio attributes to prevent CLS and protect mobile bandwidth.

---

## 3. Verified App Router, Loading, Error & Empty States Baseline

- **Pages & Layouts:** 68 `page.tsx` files across 7 layouts (`app/layout.tsx`, `(public)`, `(auth)`, `dashboard`, `instructor`, `admin`, `finance`) and 66 React components in `components/`.
- **Loading States:** Only 6 `loading.tsx` files exist (`(public)/courses`, `admin/courses`, `admin/payments`, `admin/students`, `admin/users`, `checkout/success`). Zero `loading.tsx` skeletons for `/dashboard`, `/instructor`, `/admin` root, or `/courses/[slug]`.
- **Error & Not-Found States:** **Zero `error.tsx`**, **zero `global-error.tsx`**, and **zero custom `not-found.tsx`** exist across `app/`.
- **Verified Broken States (Browser Audit Reconciled):**
  - `/welcome/student` & `/welcome/instructor` -> infinite spinner on direct load (missing `credentials: "include"`).
  - `/dashboard` -> white-on-white unreadable `"Browse Catalog"` button + hardcoded Tuesday Google Meet shown to unenrolled users.
  - `/dashboard/profile` -> 44 cards, clipped `"xplore courses ->"` button, contradictory `0%` vs `Setup Complete` labels.
  - `/dashboard/profile/setup` -> double sidebars, triple progress bars, legacy `isHealthcareProfessional` & `abuja`.
  - `/campaign/promptcare-academy` -> live HTTP 200 caregiver campaign page.
  - Global `CurrencyModal` -> blocks 75% of viewport on first visit, defaults to USD, invisible `$` icon, disabled Continue button.
  - `app/globals.css` -> still Electric Tech Blue (`#2563eb`), fonts (`Plus Jakarta Sans`, `Inter`) not loaded via `next/font/google`.

---

## 4. Audit Reconciliation Notes

All claims from the Phase 0 audit suite (`docs/audits/SKILLUP_REBRAND_V2_*.md`) were cross-checked against the live repository:
- **Confirmed:** 68 pages, 66 components, 39 PostgreSQL tables, 10 seeded courses, 19/19 security tests, hardened admin cookie auth.
- **Newly Discovered in Deep Phase 0 Asset Scan (Added to Phase 1 Scope):**
  1. `public/images/courses/*.png` referenced by the 10 seeded courses does not exist yet — must be provisioned in Phase 1.
  2. `app/icon.svg` exists in addition to `public/tech-academy-icon.svg` and must also be updated to the new SkillUp Growth Mark.
  3. Zero `error.tsx` / `not-found.tsx` boundaries exist — add branded root `app/not-found.tsx` and `app/error.tsx` in Phase 1.
  4. `docs/design/` does not exist yet — will be created in Phase 1 with all 4 required design documents.

---

## 5. Proposed Phase 1 Brand, Motif, Iconography & Visual Asset Direction (For Approval)

### 5.1 SkillUp Growth Mark (`public/brand/`)
Instead of the generic blue terminal `>_` icon, we propose a geometric **SkillUp Growth Mark**:
- **Form:** An abstract modular **"S" ascending staircase / growth glyph** built from 3 interlocking geometric modules rising diagonally upward-right, crowned by a luminous **Mint (`#D6FFF6`) digital progress node** at the apex.
- **Meaning:** Upward skill progression (`Up`), modular building blocks (courses -> tracks -> capstones), and digital precision — instantly recognizable at 16px favicon scale and bold on certificates/headers.
- **Asset Deliverables (`public/brand/` + `app/icon.svg`):**
  - `skillup-mark.svg` (standalone symbol — Russian Violet squircle + white modular S + Mint apex node)
  - `skillup-mark-mono.svg` (monochrome dark/currentColor variant)
  - `skillup-logo-horizontal-light.svg` (for light backgrounds)
  - `skillup-logo-horizontal-dark.svg` (for Deep Night Plum / dark backgrounds)
  - `skillup-logo-stacked.svg` (for certificates, auth headers, social profiles)
  - `skillup-favicon.svg` + updated `app/icon.svg` + `public/apple-icon.png` / `public/brand/skillup-social-avatar.png`

### 5.2 Recognizable SkillUp Design Motif System (`components/brand/motifs.tsx`)
Four disciplined, reusable low-opacity SVG motifs (never stacked together on the same block; strictly supporting content):
1. **Growth Path (`GrowthPathMotif`):** Ascending modular blocks/steps -> used for learning progress, milestones, and certificate accents.
2. **Connected Thinking (`ConnectedNodesMotif`):** Subtle geometric node-and-arc linework -> used softly (`opacity: 0.08–0.14`) in hero & pathway headers.
3. **Digital Grid (`DigitalGridMotif`):** Crisp 24px architectural micro-grid with subtle corner clusters -> used in empty states, verification portal, and certificates.
4. **Maker Language (`MakerBracketMotif`):** Minimal code bracket / cursor accents -> reserved for engineering courses and project showcases.

### 5.3 Visual Asset Library Direction (`public/images/` + `docs/design/SKILLUP_V2_VISUAL_ASSET_LIBRARY.md`)
Honest provenance rule: **Zero fabricated real students/instructors/facilities presented as real SkillUp people.** All newly generated editorial/illustrative imagery will be clearly documented in `SKILLUP_V2_VISUAL_ASSET_LIBRARY.md` with provenance (`AI-generated illustrative editorial visual — replaceable with authentic Enugu campus photography once shot`):
- `public/images/hero/`:
  - `hero-african-tech-learners.webp` (Warm, natural editorial scene of African teens & young adults collaborating with laptops in a modern sunlit Enugu-style tech studio, restrained Russian Violet & Mint lighting accents)
  - `hero-campus-workspace.webp` (Clean, modern laptop coding lab workspace with natural lighting)
- `public/images/students/` & `public/images/instructors/`:
  - `teens-coding-lab.webp` (African secondary school teens ages 13–18 learning coding & robotics with laptops)
  - `adults-career-collab.webp` (African adult professionals building software & product designs collaboratively)
  - `instructor-mentoring.webp` (African female & male technology instructors mentoring learners at a desk)
- `public/images/campus/`:
  - `enugu-centre-lab.webp` (Illustrative modern coding studio with dual-row laptop workstations, power drops, clean architectural lighting)
  - `virtual-hybrid-session.webp` (Remote & hybrid collaborative coding environment)
- `public/images/courses/` (Exact filenames matching the 10 seeded PostgreSQL courses!):
  - Cohesive bespoke technical course covers for all 10 courses (`digital-literacy.png`, `ai-101.png`, `ai-engineering.png`, `ai-automation.png`, `frontend-dev.png`, `backend-dev.png`, `digital-marketing.png`, `graphic-design.png`, `video-editing.png`, `social-media.png`) combining consistent SkillUp geometric motifs & Russian Violet/Electric Violet/Mint color harmony.
- `public/images/illustrations/`:
  - Branded SVG empty-state illustrations (`empty-courses.svg`, `empty-schedule.svg`, `empty-certificates.svg`, `empty-submissions.svg`).

### 5.4 Centralized Iconography System (`lib/icons.ts` + `docs/design/SKILLUP_V2_ICONOGRAPHY.md`)
- Standardize on **Lucide React** (`strokeWidth={1.75}` / `2`, uniform sizing `16px/20px/24px`) paired with our custom **SkillUp Growth Mark** and 4 small custom SkillUp concept icons (Growth Pathway, BYOL Laptop Check, Verified Seal, Hybrid Delivery).
- Create a single semantic mapping (`lib/icons.ts`) so `Programme`, `Course`, `Cohort`, `Class Session`, `Attendance`, `Assignment`, `Capstone`, `Certificate`, `Guardian Safeguarding`, and `Installment` use the exact same icon across public pages, Student, Instructor, Admin, and Finance consoles. Zero raw emojis in permanent UI chrome.

### 5.5 Phase 1 Documentation Deliverables
- `docs/design/SKILLUP_V2_BRAND_GUIDELINES.md`
- `docs/design/SKILLUP_V2_DESIGN_SYSTEM.md`
- `docs/design/SKILLUP_V2_VISUAL_ASSET_LIBRARY.md`
- `docs/design/SKILLUP_V2_ICONOGRAPHY.md`
- Updated `docs/audits/SKILLUP_REBRAND_V2_IMPLEMENTATION_LOG.md`
