# SKILLUP DIGITECH ACADEMY — REBRAND V2 COMPONENT AUDIT & SHARED DESIGN SYSTEM

**Document ID:** Document 3 of 5 (`SKILLUP_REBRAND_V2_COMPONENT_AUDIT.md`)  
**Date:** 2026-11-17  
**Total Components Audited:** 66 `.tsx` files across `components/`

---

## 1. Classification Summary

| Classification | Count | Summary |
| :--- | :---: | :--- |
| **KEEP** | 34 | Solid Shadcn UI primitives, academic submission/quiz panels, admin data tables, payment detail view, core auth bootstrap. |
| **REDESIGN** | 16 | Useful components needing Rebrand V2 Russian Violet/Mint tokens, contrast fixes, dynamic headers, or clutter reduction. |
| **MERGE** | 4 | Wrapper/duplicate auth registration forms and overlapping dashboard/nav headers that should consolidate into unified components. |
| **REMOVE** | 8 | Unused dead components, legacy PromptCare campaign banner, duplicate methodology (`testimonials.tsx`), blocking `currency-modal.tsx`, and decorative `animated-background.tsx`. |
| **REBUILD** | 3 | `guided-student-registration-form.tsx` (1,303 lines, hardcoded wrong prices), `guided-instructor-registration-form.tsx` (8 micro-steps), and `onboarding-shell.tsx` (double-sidebar clutter). |
| **INVESTIGATE** | 1 | `theme-provider.tsx` (verify whether dark mode toggle is exposed to users or light-first is canonical). |

---

## 2. Complete Component Inventory (All 66 Components)

### 2.1 Root & Layout Components (`components/` & `components/layout/`)

| Component Path | Classification | Audit Reason & Action |
| :--- | :---: | :--- |
| `components/testimonials.tsx` | **REMOVE** | **Misnamed duplicate:** Does NOT show testimonials; duplicates the 4-step methodology already directly above it on `/`. Replace with genuine Enugu Centre & Credibility section. |
| `components/theme-provider.tsx` | **INVESTIGATE** | Verify if user-facing dark mode toggle is desired; currently light-only in practice while `.dark` CSS vars still exist. |
| `components/layout/public-header.tsx` | **REDESIGN** | Replace traditional 5-link Tech Blue nav with Rebrand V2 streamlined header (`Home`/Logo, concise links, `Log In`, and **`Get Started`** content-shift push drawer trigger). |
| `components/layout/public-footer.tsx` | **REDESIGN** | Apply Deep Night Plum (`#150C33`) + Mint V2 styling; keep `/verify`, `/contact`, Enugu Main Learning Centre address, and optional subtle currency selector. |

### 2.2 Authentication & Onboarding Components (`components/auth/`)

| Component Path | Classification | Audit Reason & Action |
| :--- | :---: | :--- |
| `components/auth/auth-session-bootstrap.tsx` | **KEEP** | Clean HttpOnly cookie -> Zustand memory hydration on mount. Keep intact (critical to session persistence). |
| `components/auth/guided-student-registration-form.tsx` | **REBUILD** | **1,303-line monolith** with 6–7 steps before account creation and hardcoded stale `SPECIALIST_COURSES` charging ₦45k/₦35k for free courses. Split into 1-screen `StudentSignUpForm` + 3-step `StudentOnboardingFlow` fed by `/api/programmes` & `/api/courses`. |
| `components/auth/student-registration-form.tsx` | **MERGE** | 7-line passthrough wrapper around `GuidedStudentRegistrationForm`; merge into single clean `StudentSignUpForm`. |
| `components/auth/guided-instructor-registration-form.tsx` | **REBUILD** | **692-line 8-step micro-wizard** (one field per step, premature checkmark on Step 6). Split into 1-screen `InstructorSignUpForm` + 2-step `InstructorOnboardingFlow`. |
| `components/auth/instructor-registration-form.tsx` | **MERGE** | 7-line passthrough wrapper around `GuidedInstructorRegistrationForm`; merge into single clean `InstructorSignUpForm`. |
| `components/auth/onboarding-shell.tsx` | **REBUILD** | Forces a 320px right-hand `Progress map` sidebar (causing double-sidebar squeezing inside `/dashboard/profile/setup` and duplicating progress bars). Rebuild as a clean, centered single-column shell (`max-w-2xl`) with **one** top step indicator. |
| `components/auth/onboarding-preview.tsx` | **REMOVE** | Only existed to pad the right rail of the bloated multi-step wizards; replace with a concise inline review summary on the final step only. |
| `components/auth/protected-route.tsx` | **REMOVE** | **Verified unused (0 imports)** across the entire codebase; route protection is handled by `proxy.ts` and role layouts. |

### 2.3 SkillUp Domain & Marketing Components (`components/skillup/`)

| Component Path | Classification | Audit Reason & Action |
| :--- | :---: | :--- |
| `components/skillup/hero.tsx` | **REDESIGN** | Rebrand to Russian Violet/Mint; clarify Teens (13–18) & Adults immediately; primary CTA **`Get Started`**; remove 4 repetitive mini-cards below CTA to trim mobile height. |
| `components/skillup/dual-pathways-section.tsx` | **REDESIGN** | Strong structure! Upgrade from Tech Blue to Rebrand V2 Russian Violet/Mint tokens, add explicit Teen/Adult eligibility & fixed-timetable note, pull track details dynamically. |
| `components/skillup/course-card.tsx` | **REDESIGN** | Apply V2 tokens, show clear `FREE FOUNDATION` vs paid badge, NGN default price, and ensure ≥44px action buttons. |
| `components/skillup/enrollment-card.tsx` | **REDESIGN** | Rebrand V2 styling; clearly display Full Payment vs Installment option and bundled free courses (`AI-101`, `BDL-101`). |
| `components/skillup/cta-band.tsx` | **REDESIGN** | Apply Deep Night Plum (`#150C33`) + Mint CTA button styling. |
| `components/skillup/role-dashboard-shell.tsx` | **REDESIGN** | Apply Russian Violet/Mint V2 sidebar styling; pass **dynamic per-page `<h1>` titles** instead of repeating generic `"Student Dashboard"` on every subpage; ensure mobile drawer touch targets are `min-h-11`. |
| `components/skillup/dashboard-header.tsx` | **MERGE** | Consolidate header title rendering cleanly with `role-dashboard-shell.tsx` so every subpage has a semantic, accurate `<h1>`. |
| `components/skillup/dashboard-nav.tsx` | **REDESIGN** | Increase link height to `min-h-[44px]` for mobile accessibility; replace `"Onsite Training"` label with `"Campus & Timetable"` (or `"My Schedule"`). |
| `components/skillup/onsite-training-banner.tsx` | **REMOVE** | Legacy standalone onsite promotional banner; superseded by state-aware Cohort Timetable & Programme enrollment flow. |
| `components/skillup/home-scroll-video-section.tsx` | **REMOVE** | **Verified unused (0 imports)** dead component. |
| `components/skillup/metric-card.tsx` | **REMOVE** | **Verified unused (0 imports)**; superseded by `AdminStatRow` and shared KPI stat strip. |
| `components/skillup/auth-gate-modal.tsx` | **REDESIGN** | Rebrand V2 tokens; ensure clear redirect preservation (`?redirect=`) to `/login` and `/register`. |
| `components/skillup/filter-panel.tsx` | **REDESIGN** | Add accessible `<Label>`/`aria-label` to search & filter inputs (fixes unlabeled input defect on `/courses`); apply V2 tokens. |
| `components/skillup/role-analytics-card.tsx` | **REDESIGN** | Update Recharts palette to Rebrand V2 (`#231651`, `#613399`, `#0A5C4A`, `#D6FFF6`); reduce vertical height on mobile. |
| `components/skillup/section-shell.tsx` | **KEEP** | Clean section container; remove unnecessary floating parallax orbs on mobile for performance. |
| `components/skillup/legal-section.tsx` | **KEEP** | Clean legal page typography structure for `/terms`, `/privacy`, `/refund`. |
| `components/skillup/toc-nav.tsx` | **KEEP** | Useful table-of-contents navigation on legal pages. |
| `components/skillup/user-avatar.tsx` | **KEEP** | Clean avatar initials/image helper. |

### 2.4 Campaign, Academic, Learning, Student, Payment & Admin Components

| Component Path | Classification | Audit Reason & Action |
| :--- | :---: | :--- |
| `components/campaign/shared-countdown-banner.tsx` | **REMOVE** | Only used by legacy PromptCare Caregiver campaign page (`/campaign/promptcare-academy`). |
| `components/academic/AssignmentSubmissionPanel.tsx` | **KEEP** | Functional assignment submission UI; inherits V2 tokens automatically once `globals.css` updates. |
| `components/academic/CapstoneProjectPanel.tsx` | **KEEP** | Functional GitHub + live demo capstone panel; inherits V2 tokens. |
| `components/academic/QuizRunner.tsx` | **KEEP** | Functional interactive quiz engine; inherits V2 tokens. |
| `components/learning/TechnicalContentRenderer.tsx` | **KEEP** | Clean markdown/code lesson renderer. |
| `components/student/write-to-instructor-modal.tsx` | **KEEP** | Clean structured academic inquiry modal with topic categories and minor safeguarding awareness. |
| `components/payments/transaction-detail-view.tsx` | **KEEP** | Clear payment receipt & Paystack verification detail view. |
| `components/admin/AdminActionDialog.tsx` | **KEEP** | Reusable confirmation/action dialog for admin console. |
| `components/admin/AdminDataTable.tsx` | **KEEP** | Reusable sortable/searchable table; ensure mobile horizontal scroll wrapper. |
| `components/admin/AdminFilterBar.tsx` | **KEEP** | Clean filter bar; ensure every input has an explicit label/aria-label. |
| `components/admin/AdminStatRow.tsx` | **KEEP** | Clean 4-card KPI strip; align colors with V2 tokens. |

### 2.5 UI Primitives (`components/ui/`)

| Component Path | Classification | Audit Reason & Action |
| :--- | :---: | :--- |
| `components/ui/currency-modal.tsx` | **REMOVE** | **Critical conversion blocker** mounted in `app/layout.tsx`; defaults to USD, invisible `$` icon, disabled button. |
| `components/ui/currency-selector.tsx` | **MERGE** | Currently unused; integrate as a compact, non-blocking currency selector pill inside `PublicFooter` / `/courses` filter bar (defaulting to `NGN`). |
| `components/ui/animated-background.tsx` | **REMOVE** | Decorative background blur animation adding paint cost on low-end mobile devices across auth & public layouts. |
| `components/ui/logo.tsx` | **REDESIGN** | Update mark from Tech Blue `#2563eb` to Russian Violet `#231651` + Mint `#D6FFF6` dot. |
| `components/ui/button.tsx` | **REDESIGN** | Add explicit high-contrast `cta` (Russian Violet or Mint-on-Dark), `outline-dark` (fixes white-on-white bug on `/dashboard`), and enforce `min-h-11` (`44px`) on default/mobile buttons. |
| `components/ui/badge.tsx` | **REDESIGN** | Add semantic V2 variants: `mint` (`bg-[#D6FFF6] text-[#0A5C4A]`), `lavender` (`bg-[#E8E3F5] text-[#231651]`), `violet` (`bg-[#231651] text-white`). |
| `components/ui/input.tsx`, `select.tsx`, `textarea.tsx` | **REDESIGN** | Standardize `h-11` (`44px`) touch height, crisp `#E2E8F0` border, and Electric Violet (`#613399`) focus ring. |
| Remaining 17 Shadcn primitives (`accordion`, `alert`, `avatar`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `label`, `progress`, `separator`, `sheet`, `switch`, `tabs`, `toast`, `toaster`) | **KEEP** | Well-structured Radix/Shadcn primitives; inherit Rebrand V2 tokens cleanly from `app/globals.css`. |

---

## 3. Onboarding & Dashboard Clutter Audit

| Worst Cluttered Screen | Measured Clutter | What to Consolidate, Move, Simplify, or Remove |
| :--- | :--- | :--- |
| `/dashboard/profile` | **44 cards**, 2 progress trackers, 2 onsite promo banners, clipped button, contradictory `0%` vs `Setup Complete` | **Consolidate** into 3 clean tabs (`Account`, `Academic & Safeguarding`, `Security`); **remove** onsite marketing promos & duplicate completion rings; fix button layout. |
| `/dashboard/onsite-training` | **38 cards**, static fake `"48+ enrolled"`, past `"March 7, 2026"` date | **Replace** with lean `"Campus & Schedule"` view displaying the student's actual PostgreSQL cohort timetable, Enugu Lab room, BYOL checklist, and real seat counts. |
| `/dashboard` | **27 cards**, unreadable `"Browse Catalog"` button, hardcoded Tuesday Google Meet for unenrolled users | **Simplify** to max 4 top-level blocks: State-aware Next-Action Hero -> Active Programme/Courses -> Real Timetable (hybrid only) -> Pending Work/Support. |
| `/dashboard/profile/setup` | **21 cards**, 2 sidebars (left + right), 3 simultaneous progress bars, legacy healthcare & Abuja fields | **Retire** as a duplicate post-login wizard; fold essential onboarding into the single post-OTP `/onboarding/student` flow (max 1 progress bar, 0 right sidebars). |
| `/register` & `/register-instructor` | 6–7 steps (student) / 8 micro-steps (instructor) + right `Progress map` + `OnboardingPreview` | **Rebuild** into 1-screen registration (`max-w-lg`) -> single-box OTP -> lean 2–3 step post-OTP onboarding. |

---

## 4. Proposed Shared Rebrand V2 Component System

Avoid creating page-specific variants. Build on **12 canonical shared patterns** (reusing existing primitives where possible):

1. **`PublicHeader` + `GetStartedPushDrawer`**: Minimalist public bar + smooth content-shift drawer offering *Student* vs *Instructor* entry points + *Sign In*.
2. **`AuthCardLayout`**: Single centered, calm authentication frame (`max-w-md` / `max-w-lg`) with brand mark, crisp heading, inline error alert, and footer switcher (replaces scattered auth shells).
3. **`StepProgressHeader`**: Single clean horizontal step bar (`Step X of N` + step title) — **never** paired with a second sidebar progress map.
4. **`SingleOtpInput`**: Wide-spaced monospace 6-digit numeric box with full paste support, autofocus, and countdown resend trigger.
5. **`RoleDashboardShell` + `PageHeader`**: Unified left rail (collapsible on mobile with ≥44px touch targets) + dynamic per-page `<h1>`, subtitle, and up to 2 primary/secondary action buttons.
6. **`NextActionHero`**: High-contrast Russian Violet (`#231651`) banner with Mint (`#D6FFF6`) primary CTA and verified high-contrast dark-outline secondary CTA (`border-white/30 text-white`).
7. **`ProgrammeCard` & `CourseCard`**: Unified curriculum cards showing live PostgreSQL data, `FREE FOUNDATION` / `CAREER TRACK` badges, delivery mode pill, and NGN pricing.
8. **`CohortTimetableCard`**: Reusable schedule widget for both Students (upcoming classes + room/Meet link + attendance %) and Instructors (upcoming teaching sessions + one-click `Take Attendance`).
9. **`ProgressChecklistCard`**: Compact 3–4 item activation or graduation-clearance progress indicator (Modules %, Attendance %, Capstone Status).
10. **`SubmissionQueueCard`**: Reusable list for Student pending assignments/capstones and Instructor grading queue.
11. **`EmptyStatePanel`**: Consistent zero-state pattern (icon + clear 1-line explanation + single unambiguous next-action button — zero fake placeholder data).
12. **`InlineErrorBanner` & `ConfirmDialog`**: Standardized error recovery banner (distinguishing 401/403 vs transient 503 retry) and confirmation modal (`AdminActionDialog` generalized).
