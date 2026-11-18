# SkillUp Digitech Academy — Rebrand V2 UI Remodeling Action Plan

**Document:** `rebrand-ui-actionplan.md`  
**Date:** 2026-11-18  
**Status:** Proposed Action Plan — Ready for Review & Phase-by-Phase Execution Approval  
**Source of Truth Audits:** `docs/audits/SKILLUP_REBRAND_V2_*.md`  
**Core Rule:** Remodel the UI, navigation, onboarding, and dashboards cleanly **without breaking** the existing Neon PostgreSQL database (39 tables), Paystack payments, Brevo transactional emails, or hardened HttpOnly cookie RBAC.

---

## Executive Remodeling Map (At a Glance)

| Phase | Focus Area | Key Remodeling Outcome | Priority |
| :---: | :--- | :--- | :---: |
| **Phase 1** | Brand Tokens, Fonts & Critical Blockers | Replace Tech Blue (`#2563eb`) globally with Russian Violet (`#231651`) & Mint (`#D6FFF6`); load real Google fonts; remove blocking `CurrencyModal`; decommission PromptCare caregiver page. | **Critical** |
| **Phase 2** | Public Website, Push Drawer & Homepage V2 | Build minimalist header + content-shift `Get Started` push drawer; trim homepage from 10 sections (`10,301px` mobile) to 7 crisp sections; remove duplicate methodology. | **High** |
| **Phase 3** | Fast 1-Screen Auth & Single-Box OTP | Replace 6–7 step student signup & 8-step instructor signup with 1-screen account creation -> single wide monospace OTP box -> clean unified `/login`. | **Critical** |
| **Phase 4** | Student Progressive Onboarding V2 | Fix `/welcome/student` infinite spinner; replace legacy healthcare/Abuja `/dashboard/profile/setup` with a clean 3-step post-OTP onboarding powered by live PostgreSQL programmes & courses. | **Critical** |
| **Phase 5** | State-Aware Student Dashboard & 3-Tab Profile | Fix white-on-white `"Browse Catalog"` button; remove hardcoded Tuesday Google Meet & fake `"48+ enrolled"`; cut `/dashboard/profile` from 44 cards to 3 clean tabs. | **High** |
| **Phase 6** | Instructor Onboarding & Teaching-First Dashboard | Fix `/welcome/instructor` infinite spinner; surface live Teaching Schedule & Grading Queue on `/instructor`; consolidate duplicate course routes; fix 7 unlabeled inputs & 6,522px mobile stack. | **High** |
| **Phase 7** | Admin & Finance Visual Alignment | Apply Rebrand V2 tokens across Admin & Finance consoles; retire legacy `Campaign` (PromptCare) and `Onsite Training` (Abuja) admin pages; preserve hardened cookie auth. | **Medium** |
| **Phase 8** | End-to-End QA, Accessibility & Release Readiness | Full test suite (`academic`, `security`, `email`, `payments`), TypeScript, Turbopack build, and 4-viewport Playwright visual/accessibility sign-off. | **Critical** |

---

## Phase 1 — Brand Foundation, Typography & Critical Blockers

**Why First:** Eliminates the split-brain Tech Blue vs. Russian Violet look across all 68 routes immediately, stops blocking first-time visitors, and removes the live legacy caregiver page.

### Actions to Carry Out
1. **Replace Global Design Tokens (`app/globals.css`)**
   - Update light & dark CSS custom properties from Electric Tech Blue (`#2563eb` / `#0284c7`) to the canonical SkillUp Rebrand V2 palette:
     - `--primary`: `#231651` (Russian Violet) / `--primary-foreground`: `#FFFFFF`
     - `--surface-deep`: `#150C33` (Deep Night Plum)
     - `--accent`: `#613399` (Electric Violet)
     - `--mint`: `#D6FFF6` (Mint Green) / `--mint-foreground`: `#0A5C4A` (WCAG AA Emerald Text, 5.4:1 contrast)
     - `--lavender-soft`: `#E8E3F5` (Soft Ice Lavender)
     - `--background`: `#F8FAFB` (Light Canvas) / `--card`: `#FFFFFF`
     - `--foreground`: `#141024` / `--muted-foreground`: `#524B6B`
2. **Load Real Typography & Remove Blocking Modal (`app/layout.tsx`, `lib/store.ts`)**
   - Load `Plus_Jakarta_Sans` (`600, 700, 800`), `Inter` (`400, 500, 600`), and `JetBrains_Mono` (`500, 700`) via `next/font/google` and attach CSS variables to `<html>`.
   - Remove `<CurrencyModal />` from `app/layout.tsx` (and delete `components/ui/currency-modal.tsx`).
   - Change default currency in `lib/store.ts` (`usePreferencesStore`) from `"USD"` to `"NGN"` with `currencySelected: true`.
3. **Upgrade Core UI Primitives (`components/ui/`)**
   - `components/ui/logo.tsx`: Rebrand icon mark to Russian Violet (`#231651`) with Mint (`#D6FFF6`) accent dot.
   - `components/ui/button.tsx`: Add high-contrast `cta` (Russian Violet / Mint-on-Dark) and `outline-dark` (`border-white/35 text-white hover:bg-white/10`) variants; enforce `min-h-11` (`44px`) touch targets on default/mobile buttons.
   - `components/ui/badge.tsx`: Add `mint`, `lavender`, and `violet` semantic variants.
   - `components/ui/input.tsx`, `select.tsx`, `textarea.tsx`: Standardize `h-11` height and Electric Violet (`#613399`) focus rings.
4. **Upgrade Shared Dashboard Shell (`components/skillup/role-dashboard-shell.tsx`, `dashboard-nav.tsx`)**
   - Apply Rebrand V2 Russian Violet sidebar styling and increase nav links to `min-h-[44px]` for mobile ergonomics.
   - Support dynamic per-page `<h1>` titles instead of repeating `"Student Dashboard"` / `"Admin Dashboard"` on every subpage.
5. **Decommission Legacy Healthcare Campaign & Dead Components**
   - Replace `app/(public)/campaign/promptcare-academy/page.tsx` with a server-side `redirect("/courses")` and delete `campaign-page-client.tsx` + `components/campaign/shared-countdown-banner.tsx`.
   - Delete verified-unused dead components: `components/skillup/home-scroll-video-section.tsx`, `components/skillup/metric-card.tsx`, `components/auth/protected-route.tsx`, and decorative `components/ui/animated-background.tsx` (remove its imports from `app/(public)/layout.tsx`, `app/(auth)/layout.tsx`, `app/cart/page.tsx`).

### Phase 1 Verification Gate
- `npx tsc --noEmit` passes with 0 errors.
- Fresh incognito load of `/` shows zero currency modal, NGN prices, real Plus Jakarta Sans/Inter typography, and Russian Violet/Mint styling.
- `/campaign/promptcare-academy` redirects to `/courses`.

---

## Phase 2 — Public Website, Content-Shift Push Drawer & Homepage V2

**Why Second:** Turns the public site into a focused, credible technology academy landing experience tailored to Teens (13–18), Parents, and Adults—cutting mobile scroll height nearly in half.

### Actions to Carry Out
1. **Build Minimalist Public Header + Responsive Content-Shift Push Drawer**
   - Create `components/layout/get-started-drawer.tsx` and update `app/(public)/layout.tsx` + `components/layout/public-header.tsx`:
     - Clean top bar: SkillUp Logo (`Home`) + streamlined links (`Programmes`, `Courses`, `About`, `Verify`) + `Log In` + primary **`Get Started`** button.
     - Clicking **`Get Started`** opens a smooth side drawer that **shifts main page content left on desktop** (and slides cleanly on mobile) presenting:
       1. *Get Started as a Student — Career Readiness (Hybrid/Online)*
       2. *Get Started as a Student — Skill Acquisition (Online + Free AI 101 & Digital Literacy)*
       3. *Teach at SkillUp — Join as an Instructor*
       4. *Already enrolled? Sign In*
     - Ensure full keyboard accessibility (`Escape` closes, focus moves cleanly, ARIA labels).
2. **Remodel the Homepage (`app/(public)/page.tsx`) from 10 Sections down to 7 Crisp Sections**
   - **Section 1 — Hero (`components/skillup/hero.tsx`):** Rewrite headline and subcopy to answer *"What is SkillUp & who is it for (Teens 13–18 & Adults)?"* immediately; primary CTA **`Get Started`** (triggers drawer), secondary CTA **`Explore Programmes`**; remove the 4 repetitive mini-cards below the CTA.
   - **Remove** the decorative skills marquee (`technicalCompetencies`) and **remove** `components/testimonials.tsx` (which is a duplicate 4-step methodology).
   - **Section 2 — Dual Academic Pathways (`components/skillup/dual-pathways-section.tsx`):** Rebrand with Russian Violet/Mint tokens; explicitly display **Teens (13–18) & Adults (18+)** eligibility, **Enugu Main Learning Centre (14 Garden Avenue, GRA, Enugu)**, **100% Generator + Solar Power & Fibre**, **Mandatory BYOL**, **Fixed Cohort Timetables**, **Installment Plans**, and **Free Foundation Bundle (`AI-101` + `BDL-101`)**.
   - **Section 3 — How SkillUp Works (Merged 4-Step Flow):** Consolidate `"Why Choose SkillUp?"` + `"The Engineering Journey"` into one clean 4-step timeline (Choose Pathway -> Learn Online & In-Centre -> Build Practical Projects & Capstone -> Earn Verified Certificate).
   - **Section 4 — Featured Courses (`components/skillup/course-card.tsx`):** Live cards from `/api/courses` with clear `FREE FOUNDATION` vs paid badges and NGN default pricing.
   - **Section 5 — Learning Environment & Institutional Credibility:** Genuine Enugu Main Learning Centre lab highlights (Lab 1 Turing Room, Lab 2 Lovelace Room, 30-seat safe capacity, BYOL standards, official `/verify` certificate registry — zero fake testimonials).
   - **Section 6 — Compact FAQ (5 High-Intent Questions):** Teen eligibility & guardian consent, BYOL laptop specs, fixed hybrid timetables, free foundation courses, and installment payments + link to `/faq`.
   - **Section 7 — Final CTA Band & Deep Night Plum Footer (`components/skillup/cta-band.tsx`, `components/layout/public-footer.tsx`):** Rebrand footer in `#150C33`, include compact optional currency selector (`NGN`/`USD`/`EUR`/`GBP`), `/verify`, `/contact`, and Enugu campus address.
3. **Polish Supporting Public Pages**
   - `app/(public)/courses/page.tsx` & `components/skillup/filter-panel.tsx`: Add explicit accessible `<Label>`/`aria-label` to search/filter controls and V2 styling.
   - `app/(public)/courses/[slug]/page.tsx` & `components/skillup/enrollment-card.tsx`: Highlight free bundled foundation courses and Full vs. Installment payment clarity.
   - `app/(public)/about/page.tsx`, `contact/page.tsx`, `faq/page.tsx`, `verify/page.tsx`: Replace legacy blue gradients with Deep Night Plum/Russian Violet tokens, add `<Label>` to `/verify` input, and trim vertical padding on mobile `/contact`.

### Phase 2 Verification Gate
- Mobile 390px homepage scroll height drops from `10,301px` to `<= 5,800px` with zero horizontal overflow.
- Push drawer shifts content smoothly on desktop (1440px/1280px) and works cleanly on tablet (768px) and mobile (390px).
- Zero duplicate methodology sections and zero unlabeled public inputs.

---

## Phase 3 — Unified Authentication & Fast 1-Screen Registration

**Why Third:** Cuts pre-account signup drop-off dramatically (from 6–8 steps down to 1 screen) while keeping HttpOnly cookie security and OTP verification rock-solid.

### Actions to Carry Out
1. **Build Unified `AuthCardLayout` (`app/(auth)/layout.tsx`)**
   - Clean, centered, distraction-free auth shell on Light Canvas (`#F8FAFB`) with SkillUp V2 logo, minimal header switcher (`Login`, `Student Signup`, `Instructor Signup`), and no background blur animations.
2. **Rebuild Student Registration to 1 Fast Screen (`app/(auth)/register/page.tsx`, `components/auth/student-signup-form.tsx`)**
   - Replace the 1,303-line `guided-student-registration-form.tsx` + 7-line wrapper with a crisp 1-screen account creation form collecting ONLY:
     - Full Name
     - Email Address
     - Password (+ visibility toggle & strength indicator)
     - Age Group toggle: **Teen Learner (Ages 13–18)** vs **Adult Learner (18+)**
     - Terms & Privacy acceptance checkbox
   - Update `app/(auth)/register-online/page.tsx` -> `redirect("/register?programme=skill-acquisition")` and `app/(auth)/register-onsite/page.tsx` -> `redirect("/register?programme=career-readiness")` so query intent carries into onboarding.
   - Update `app/api/auth/register/route.ts` & `lib/validation.ts` to support fast account creation while preserving strict server-side BYOL & Minor Safeguarding validation during Phase 4 onboarding/enrollment activation.
3. **Rebuild Instructor Registration to 1 Fast Screen (`app/(auth)/register-instructor/page.tsx`, `components/auth/instructor-signup-form.tsx`)**
   - Replace the 8-step `guided-instructor-registration-form.tsx` + wrapper with 1 clean screen: Full Name, Email, Password, Phone Number, Terms -> triggers OTP -> redirects to `/welcome/instructor` (Faculty Onboarding).
4. **Upgrade Email OTP Verification (`app/(auth)/verify-otp/verify-otp-client.tsx`)**
   - Single wide monospace 6-digit input (`tracking-[0.5em]`, autofocus, full paste support, numeric keyboard on mobile).
   - Fix dead 0-input screen when visited without `?email=` by allowing manual email entry or clean link back to `/login` / `/register`.
5. **Polish Unified Login & Password Recovery (`app/(auth)/login/page.tsx`, `forgot-password/page.tsx`, `reset-password/page.tsx`)**
   - Apply V2 tokens, show calm `"Session expired — sign in to continue"` notice when redirected from protected routes, and ensure `/login-admin` cleanly redirects server-side to `/login?redirect=/admin`.

### Phase 3 Verification Gate
- Student and Instructor registration complete in 1 screen (<60s) with immediate duplicate-email recovery feedback.
- `npm run test:security` and `npm run test:email` pass 100%; HttpOnly cookie auth & `proxy.ts` remain untouched and verified.

---

## Phase 4 — Student Progressive Onboarding V2 (Live Catalog, BYOL & Safeguarding)

**Why Fourth:** Fixes the critical infinite-spinner bug on `/welcome/student`, eliminates hardcoded wrong course prices, and retires the legacy healthcare/Abuja profile setup wizard.

### Actions to Carry Out
1. **Rebuild `components/auth/onboarding-shell.tsx` (Delete `onboarding-preview.tsx`)**
   - Replace the double-sidebar layout with a calm, centered single-column shell (`max-w-2xl`) and **exactly one** clean top step progress bar (`Step X of N`).
2. **Rebuild `/welcome/student` (`app/welcome/student/page.tsx`) as Canonical 3-Step Student Onboarding V2**
   - Fix infinite spinner immediately by sending `credentials: "include"` on all `/api/onboarding/state` requests and falling back gracefully if state is fresh.
   - **Step 1 — Choose Programme & Track (Live DB Data):** Fetch live programmes/pathways/courses from `GET /api/programmes` & `GET /api/courses` (eliminating stale hardcoded `SPECIALIST_COURSES`). Explicitly show **Basic AI 101** and **Basic Digital Literacy** as **`FREE (₦0)`** bundled automatically.
   - **Step 2 — Delivery Mode, Fixed Timetable & BYOL Rules:**
     - Choose **Online** or **Hybrid (Enugu Main Learning Centre — 14 Garden Avenue, GRA, Enugu)**.
     - Display real cohort capacity (preventing selection of full physical cohorts) and clear **Fixed Timetable Notice** (academy assigns physical days, e.g., Wed Virtual / Sat Physical Lab; students cannot pick arbitrary days; academy may revise schedule).
     - Display academy-provided **100% Dual-Source Power & Enterprise Fibre** and require **Mandatory BYOL Laptop Acknowledgement** (Core i5/Ryzen 5+, 8GB RAM, 256GB SSD) before hybrid submission.
   - **Step 3 — Age-Aware Completion:**
     - **Adult (18+):** Phone/WhatsApp + primary learning goal -> `"Proceed to Payment"` (`/checkout`) OR `"Start Free Foundation Courses"` (`/dashboard`).
     - **Teen (13–18):** Date of Birth, School Name, Grade/Class + Parent/Guardian Name, Email & Phone -> dispatches existing **Brevo Guardian Consent Email** (`/guardian-consent`) -> enters `/dashboard` with clear consent-status banner.
3. **Retire Legacy Healthcare Profile Setup (`app/dashboard/profile/setup/page.tsx`, `lib/student-registration.ts`, `lib/types.ts`)**
   - Replace `/dashboard/profile/setup` with a redirect to `/welcome/student` (if onboarding incomplete) or `/dashboard/profile` (if complete).
   - Remove `isHealthcareProfessional`, `"Become a World-Class Certified Caregiver in 21 Days"`, and `"abuja"` location defaults from student onboarding/profile types and forms.

### Phase 4 Verification Gate
- `/welcome/student` loads reliably even on hard browser refresh (zero infinite spinner).
- Live PostgreSQL prices and free foundation badges match `/api/programmes` 100%.
- `npm run test:academic` passes all BYOL and minor safeguarding assertions.

---

## Phase 5 — State-Aware Student Dashboard & 3-Tab Profile V2

**Why Fifth:** Replaces the 27-card dashboard and 44-card profile with a focused, learning-first workspace that adapts to every student's exact enrollment state.

### Actions to Carry Out
1. **Remodel Student Dashboard (`app/dashboard/page.tsx`)**
   - **Fix Critical Contrast Bug:** Update `"Browse Catalog"` button in the Russian Violet hero to the new high-contrast `outline-dark` variant (`border-white/35 text-white hover:bg-white/10`).
   - **Remove Hardcoded Fake Workshop Card:** Never display `"Virtual Live Workshop — Tuesdays 17:00"` to unenrolled learners; bind schedule strictly to real PostgreSQL `class_sessions` for the student's active cohort.
   - **Implement All 5 Lifecycle States (Max 4 Clean Top-Level Blocks):**
     1. *Newly Registered:* Dominant CTA to complete onboarding / start Free `Basic AI 101` & `Basic Digital Literacy`.
     2. *Awaiting Deposit / Guardian Consent:* Compact 3-item activation checklist + one-click `"Complete Payment"` or `"Resend Guardian Consent"`.
     3. *Active Online Student:* **`Resume Next Lesson`** hero + active courses grid + pending quizzes/assignments + `"Ask Instructor"`.
     4. *Active Hybrid Student:* **`Next Scheduled Class`** + **`Resume Lesson`** hero + live Enugu Lab timetable + attendance rate (target ≥75%) + BYOL reminder + Capstone progress.
     5. *Graduated Student:* **`Download & Verify Certificate`** hero + Capstone summary + next recommended track.
   - Add accessible `<Label>` to the quick learning note input.
2. **Remodel `/dashboard/onsite-training` -> Campus & Schedule (`app/dashboard/onsite-training/page.tsx`, `components/skillup/dashboard-nav.tsx`)**
   - Rename sidebar link from `"Onsite Training"` to `"Campus & Schedule"`.
   - Remove fabricated `"48+ learners enrolled"`, past `"March 7, 2026"` date, `"abuja"` dropdown, and static `₦120,000` single-payment claim.
   - Render real Enugu Main Learning Centre details, live cohort timetables, real seat availability, and BYOL hardware checklist.
3. **Rebuild Student Profile (`app/dashboard/profile/page.tsx`)**
   - Cut from **44 card containers** down to **3 clean tabs** (`Account & Contact`, `Academic & Safeguarding`, `Security & Password`).
   - Fix the clipped `"xplore courses ->"` button, delete contradictory `"Setup Complete"` vs `"0% COMPLETE"` widgets, remove internal jargon (`"Guided setup owns structured learner details"`), and remove onsite promo banners.
4. **Align Supporting Student Subpages**
   - Polish `app/dashboard/courses/page.tsx`, `certificates/page.tsx`, `payments/page.tsx`, and `courses/[courseId]/learn/page.tsx` with V2 tokens, dynamic `<h1>` headings, and clear `EmptyStatePanel` components.

### Phase 5 Verification Gate
- Zero contrast failures on `/dashboard` hero; zero hardcoded fake schedules; zero clipped buttons on `/dashboard/profile`.
- Card count drops from 27 -> `<= 8` on `/dashboard` and from 44 -> `<= 6` on `/dashboard/profile`.

---

## Phase 6 — Instructor Onboarding & Teaching-First Dashboard V2

**Why Sixth:** Gives instructors a distinct faculty workspace centered on classes, attendance, and grading instead of a cloned student experience.

### Actions to Carry Out
1. **Fix & Rebuild `/welcome/instructor` (`app/welcome/instructor/page.tsx`)**
   - Add `credentials: "include"` to eliminate the infinite loading spinner.
   - Convert into a 2-step **Faculty Onboarding V2**:
     - Step 1: Teaching Profile (Professional Headline, Bio, Technical Specialties, Years of Experience, Availability).
     - Step 2: Academic Standards (Course Admin-Approval Policy, Rubric Grading, Live Attendance Expectations) -> enter `/instructor`.
2. **Remodel Instructor Dashboard (`app/instructor/page.tsx`)**
   - Rebrand dark Slate Navy hero to Rebrand V2 Russian Violet (`#231651`) + Mint (`#D6FFF6`) accents.
   - Reorganize around **teaching priorities**:
     1. Action Header (`+ Create Course`, `Take Attendance`, `Grade Submissions`)
     2. **Upcoming Teaching Sessions** (live `class_sessions` with Enugu Lab / Meet link & one-click `Take Attendance`)
     3. **Pending Evaluation Queue** (assignments & capstone projects awaiting rubric grading)
     4. **Assigned Courses & Cohorts** (clear `Published`, `Pending Admin Approval`, `Draft` pills)
   - Move heavy analytics charts to `/instructor/analytics`, cutting mobile height from `6,522px` down to `< 2,800px`.
3. **Consolidate Duplicate Routes & Fix Accessibility**
   - Replace `app/instructor/create-course/page.tsx` with `redirect("/instructor/courses/new")`.
   - Replace `app/instructor/edit-course/[courseId]/page.tsx` with `redirect("/instructor/courses/${courseId}/edit")`.
   - Add explicit `<Label htmlFor>` to all 7 unlabeled inputs in `app/instructor/courses/new/page.tsx` and filter inputs in `courses/page.tsx` and `evaluations/page.tsx`.
   - Ensure touch targets on `/instructor/attendance` and `/instructor` meet `min-h-11` (`44px`).

### Phase 6 Verification Gate
- `/welcome/instructor` loads cleanly on hard refresh; instructor dashboard highlights teaching schedule + grading queue; zero unlabeled inputs; `npm run test:security` confirms zero admin privilege leakage.

---

## Phase 7 — Admin & Finance Experience Alignment

**Why Seventh:** Unifies institutional operations under Rebrand V2 and removes legacy healthcare/Abuja admin menus while keeping every operational console intact.

### Actions to Carry Out
1. **Clean Up Admin Sidebar & Retire Legacy Config Pages (`app/admin/layout.tsx`, `app/admin/campaign/page.tsx`, `app/admin/onsite-training/page.tsx`)**
   - Remove `"Campaign"` (PromptCare caregiver offer) and `"Onsite Training"` (legacy Abuja static form with 20 unlabeled inputs) from `adminNavItems`.
   - Redirect `/admin/onsite-training` -> `/admin/campuses` and `/admin/campaign` -> `/admin/courses`.
   - **Preserve** the hardened `credentials: "include"` cookie verification and `503` resilience in `app/admin/layout.tsx`.
2. **Align Admin & Finance Pages to V2 Tokens**
   - Update `app/admin/page.tsx`, `courses/page.tsx`, `users/page.tsx`, `students/page.tsx`, `payments/page.tsx`, `categories/page.tsx`, `settings/page.tsx` to use Rebrand V2 tokens and dynamic `<h1>` headers.
   - Add quick links on `/admin` to **Campuses & Labs**, **Cohorts & Timetables**, and **Tuition Installments**.
   - Update `app/finance/layout.tsx` to match `AdminLayout`'s `credentials: "include"` session hydration and align `/finance`, `/finance/reports`, `/finance/transactions` to V2 tokens.
   - Ensure all admin tables wrap cleanly with horizontal scroll on mobile without overflowing the viewport.

### Phase 7 Verification Gate
- Admin can create/edit campuses, classrooms, cohorts, sessions, courses, users, and track tuition installments seamlessly after hard refreshes; zero legacy Abuja/PromptCare UI remains.

---

## Phase 8 — End-to-End QA, Accessibility & Release Readiness

**Why Final:** Proves zero regressions across every security, academic, email, payment, responsive, and accessibility gate before launch.

### Actions to Carry Out
1. **Run Complete Automated Test Suite**
   - `npm run test:academic` (BYOL, minor safeguarding, atomic seat capacity, attendance, capstone clearance, certificates, installments)
   - `npm run test:security` (RBAC boundaries, cookie/Bearer auth hardening, catalog dry-run safety)
   - `npm run test:email` (Brevo exclusivity, templates, durable idempotency)
   - `npm run test:payments` (Paystack reconciliation & manual review alerts)
2. **Run Full TypeScript & Production Build Check**
   - `npx tsc --noEmit` (0 errors)
   - `npm run build` (clean Turbopack build across all routes)
3. **Run Automated 4-Viewport Playwright Visual & A11y Sweep (`1440px`, `1280px`, `768px`, `390px`)**
   - Verify:
     - 0 horizontal overflow across all public, auth, student, instructor, admin, and finance pages
     - 0 broken images (`naturalWidth === 0`)
     - 0 unlabeled form inputs
     - 0 `<44px` primary mobile touch targets
     - 0 WCAG AA contrast failures
     - 0 legacy healthcare (`promptcare`, `caregiver`, `scrubs`, `cpr`, `abuja`, `isHealthcareProfessional`) occurrences in rendered HTML
     - Clean hard-refresh persistence across Student, Instructor, Admin, and Finance consoles
4. **Publish Final Release Readiness Report**
   - Document final before/after screenshots and test pass metrics in `docs/audits/SKILLUP_REBRAND_V2_RELEASE_READINESS.md`.

---

## Protected Systems (Never Broken During Remodeling)
- **Neon PostgreSQL (39 tables)** & Drizzle ORM schemas (`db/schema/*`)
- **20,000ms Neon connection pool timeout** (`db/client.ts`)
- **HttpOnly `token` cookie authentication & `getTokenFromRequest`** (`lib/jwt.ts`, `proxy.ts`, `lib/auth.ts`)
- **Paystack checkout, webhook SHA-512 verification & reconciliation** (`lib/paystack.ts`, `app/api/payments/*`)
- **Brevo transactional email engine & durable idempotency outbox** (`lib/email/*`)
- **Atomic seat locking (`SELECT ... FOR UPDATE`), graduation clearance & `/verify/[code]`** (`lib/academic-db.ts`, `lib/graduation-clearance.ts`)

---

## How to Proceed
Review this action plan and reply with:
- **"Start Phase 1"** to execute Phase 1 (Brand Foundation, Fonts & Critical Blockers) first for review, or
- **"Execute Phases 1 and 2"** (or any specific phase range) to remodel step by step with visual verification at every gate.
