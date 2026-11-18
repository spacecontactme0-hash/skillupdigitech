# SKILLUP DIGITECH ACADEMY — REBRAND V2 MASTER UI/UX & PRODUCT AUDIT

**Document ID:** Document 1 of 5 (`SKILLUP_REBRAND_V2_MASTER_AUDIT.md`)  
**Audit Version:** Rebrand V2 (Post-Browser + Full Repository Audit)  
**Date:** 2026-11-17  
**Companion Documents:**
- `docs/audits/SKILLUP_REBRAND_V2_BROWSER_AUDIT.md` (Phase Zero live browser evidence)
- `docs/audits/SKILLUP_REBRAND_V2_USER_JOURNEYS.md` (Document 2 — End-to-end journeys & Mermaid flows)
- `docs/audits/SKILLUP_REBRAND_V2_COMPONENT_AUDIT.md` (Document 3 — 66-component inventory & design system)
- `docs/audits/SKILLUP_REBRAND_V2_IMPLEMENTATION_ROADMAP.md` (Document 4 — Phased roadmap, risks & QA)
- `docs/audits/SKILLUP_REBRAND_V2_PAGE_INVENTORY.md` (Document 5 — Complete 68-page route & layout inventory)

---

## 1. Executive Summary

SkillUp Digitech Academy has a **strong, production-verified PostgreSQL backend** (39 Neon tables, Drizzle ORM, Paystack webhooks, Brevo idempotent transactional emails, atomic physical seat locking, graduation clearance engine, and hardened HttpOnly cookie authentication). However, its **frontend user experience, visual identity, onboarding journeys, and information architecture lag severely behind the backend capabilities**.

### Overall UX Health Score: **5.4 / 10 (Functional Core, Fragmented Experience)**

| Experience Pillar | Score | Diagnosis |
| :--- | :---: | :--- |
| **Backend & Security Infrastructure** | 8.8 / 10 | Solid PostgreSQL schema, Brevo idempotency, Paystack verification, hardened RBAC & cookie auth. |
| **Visual Brand Coherence** | 4.0 / 10 | Split-brain styling: global CSS is still generic Tech Blue (`#2563eb`), while newer screens hardcode Russian Violet (`#231651`) & Mint (`#D6FFF6`). Fonts (`Inter`, `Plus Jakarta Sans`) are not actually loaded. |
| **Public Discovery & Conversion** | 4.5 / 10 | First-time visitors are blocked by a broken USD Currency Modal; homepage is 5,588px (10,301px on mobile) with 3× repeated methodology; legacy PromptCare Caregiver campaign page is still live at HTTP 200. |
| **Student Registration & Onboarding** | 4.2 / 10 | 6–7 steps before account creation, hardcoded stale/contradictory course prices, infinite spinner on `/welcome/student`, redundant 4-step `/dashboard/profile/setup` asking legacy healthcare & Abuja questions. |
| **Instructor Experience** | 5.0 / 10 | 8 micro-step registration wizard, infinite spinner on `/welcome/instructor`, duplicate course routes, 6,522px mobile dashboard without timetable overview. |
| **Admin Operations** | 6.5 / 10 | Strong new Campuses, Cohorts, and Installments consoles, but cluttered by legacy `Onsite Training` (Abuja) and `Campaign` (PromptCare) pages alongside them. |
| **Accessibility & Mobile Ergonomics** | 5.2 / 10 | Zero horizontal overflow, but unreadable white-on-white CTA on Student Dashboard, 31 unlabeled inputs, clipped buttons, generic `<h1>` on subpages, and pervasive `<44px` touch targets. |

---

## 2. Reference Research & Competitive Synthesis

### 2.1 Primary Reference: Genesys Tech Hub & Genesys Academy (`genesystechhub.com`)
Operating in the **exact same geographic market (Enugu, Nigeria)**, Genesys Tech Hub / Genesys Academy provides directly applicable operational and UX patterns:
- **Dual-Product Clarity:** Clearly separates its flagship structured institute (**Genesys Academy** — Software Engineering, Product Design, Data Science) from its internship/cohort stream (**Learnable**) with distinct entry points and unambiguous track pages.
- **Transparent Installment UX ("Pay Small Small"):** Explains exact deposit thresholds (e.g., minimum upfront deposit before cohort start + structured balance payments) directly in plain language before registration begins — removing payment anxiety.
- **Cohort Start Visibility:** Explicitly displays cohort intake windows rather than vague "enroll anytime" messaging.
- **What SkillUp Should NOT Copy Blindly:** Genesys splits portals across separate subdomains (`genesystechhub.com`, `academy.genesystechhub.com`, `learnable.genesystechhub.com`), which fragments student accounts. SkillUp's **single unified account supporting multiple programme enrolments and delivery modes** is architecturally superior and should be preserved.

### 2.2 Secondary References: AltSchool Africa, Decagon Institute, ALX Africa, Coursera & Udemy Business

| Reference | Pattern Worth Adopting for SkillUp | Pattern to Avoid |
| :--- | :--- | :--- |
| **AltSchool Africa** | Bold mission-driven hero; clean track preview cards showing curriculum outcomes before sign-up; progressive disclosure on mobile. | Heavy marketing bloat across long landing pages. |
| **ALX Africa** | Low-barrier account creation BEFORE heavy profiling; explicit physical-hub onboarding checklist (laptop, power, internet, location); community activation rituals ("Welcome hub"). | Multi-site portal fragmentation and excessive mandatory orientation videos before dashboard entry. |
| **Decagon Institute** | Upfront hardware/commitment transparency (laptop specs, attendance discipline, capstone rigor) to filter serious learners and build institutional credibility. | Overly corporate enterprise-first tone that alienates 13–18 teen learners and their parents. |
| **Coursera / Udemy Business** | Single dominant **"Next Action / Resume Learning"** hero anchor on the student dashboard; dual-layer progress (macro certificate % + micro module checklist); time-to-complete estimates. | Generic 30,000-course marketplace clutter and endless promotional carousels. |

---

## 3. Top 10 Verified UX, Visual & Structural Problems

1. **Blocking, Broken `CurrencyModal` on First Visit (Critical — Conversion)**
   - Mounted globally in `app/layout.tsx`, immediately hiding 75% of the page on first load, defaulting to USD instead of NGN, rendering an invisible blue-on-blue `$` icon, and disabling its own `"Continue with USD"` CTA.
2. **Broken Post-OTP Welcome Screens (`/welcome/student` & `/welcome/instructor`) (Critical — Onboarding)**
   - Both routes hang indefinitely on a loading spinner when loaded via HttpOnly cookie without an in-memory Zustand token (missing `credentials: "include"` on `/api/onboarding/state`).
3. **Live Legacy Healthcare/PromptCare Pages & Fields (Critical — Trust & Brand)**
   - `/campaign/promptcare-academy` is still live at HTTP 200 advertising *"Prompt Home Health — Become a World-Class Certified Caregiver in 21 Days"* (scrubs, Abuja, Google Form).
   - `app/dashboard/profile/setup/page.tsx` still tracks `isHealthcareProfessional` and offers `"abuja"`; `lib/student-registration.ts:4` still carries `"Become a World-Class Certified Caregiver in 21 Days"`; `app/admin/onsite-training/page.tsx` still manages a fictional Abuja hub.
4. **Unreadable White-on-White CTA on Student Dashboard Hero (Critical — Accessibility)**
   - On `/dashboard`, the `"Browse Catalog"` button inside the Russian Violet hero renders white text on a white background (~1:1 contrast ratio).
5. **Split-Brain Visual Identity & Unloaded Typography (High — Brand)**
   - `app/globals.css` still defines Electric Tech Blue (`#2563eb` / `#0284c7`) as `--primary` / `--accent`, while newer pages hardcode `#231651` and `#D6FFF6`. Plus Jakarta Sans and Inter are never loaded via `next/font/google`.
6. **Bloated, Contradictory Student Registration & Double-Onboarding (High — Conversion)**
   - `/register` forces 6–7 steps BEFORE creating an account and displays hardcoded stale course prices (charging ₦45k/₦35k for Basic AI 101 and Basic Digital Literacy even though they are FREE). Then `/dashboard/profile/setup` asks for Phone, WhatsApp, and DOB a *second* time!
7. **Severe Dashboard & Profile Card Clutter + Clipped UI (High — Usability)**
   - `/dashboard/profile` renders **44 card containers**, contradictory `"Setup Complete"` vs `"0% COMPLETE"` badges, internal engineering copy (`"Guided setup owns structured learner details"`), and a clipped `"xplore courses ->"` button. `/dashboard` shows a hardcoded Tuesday Google Meet link to students with `0` active enrollments, and `/dashboard/onsite-training` displays fabricated `"48+ learners enrolled"` and a past `"March 7, 2026"` date.
8. **Fragmented 8-Step Instructor Registration & Duplicate Course Routes (High — Instructor UX)**
   - `/register-instructor` forces 8 single-field steps (with Step 6 prematurely checked on Step 1). Duplicate routes exist (`/instructor/courses/new` vs `/instructor/create-course`, `/instructor/courses/[courseId]/edit` vs `/instructor/edit-course/[courseId]`).
9. **Bloated, Repetitive Public Homepage (Medium — Conversion & Mobile)**
   - 5,588px on desktop / **10,301px (12.2 screens) on mobile 390px**. `components/testimonials.tsx` does not contain testimonials—it duplicates the 4-step methodology right above it.
10. **Accessibility & Mobile Ergonomics Gaps (Medium — WCAG)**
    - 31 unlabeled form inputs across `/courses`, `/verify`, `/dashboard`, `/instructor/courses/new` (7), and `/admin/onsite-training` (20); generic `<h1>` (`"Student Dashboard"`) repeated on every subpage; 11–28 small touch targets (`<44px`) per page.

---

## 4. SkillUp Rebrand V2 Design System Direction

Building strictly on the approved Rebrand V2 decisions in `SKILLUP_REBRAND_V2_IMPLEMENTATION_AUDIT.md` and `planned-ui-editv2.md` — refined for institutional credibility (appealing to both 13–18 teens/parents and adult professionals without childish graphics or generic AI SaaS clutter):

### 4.1 Semantic Color Tokens (To Replace Tech Blue in `app/globals.css`)

| Semantic Token | Light Mode Value | Dark Mode Value | Usage & WCAG Contrast Rule |
| :--- | :--- | :--- | :--- |
| `--primary` (Russian Violet) | `#231651` | `#D6FFF6` | Primary CTAs, active nav pills, major headings, institutional brand anchor (`15.6:1` on `#FFFFFF`). |
| `--primary-foreground` | `#FFFFFF` | `#150C33` | Text/icons on `--primary` surfaces. |
| `--surface-deep` (Deep Night Plum) | `#150C33` | `#0B071C` | Hero dark panels, brand footer, dark mode canvas. |
| `--accent` (Electric Violet) | `#613399` | `#9E77ED` | Interactive links, focus rings, step progress fill, secondary highlights (`7.4:1` on `#FFFFFF`). |
| `--mint` (Mint Green) | `#D6FFF6` | `#D6FFF6` | Positive highlights, active cohort badges, hero dark-surface accents (`14.8:1` on `#231651`). |
| `--mint-foreground` (Emerald Text) | `#0A5C4A` | `#0A5C4A` | Mandatory text color on `--mint` backgrounds (`5.4:1` WCAG AA compliant). |
| `--lavender-soft` (Soft Ice Lavender) | `#E8E3F5` | `#2A1D54` | Subtle tinted cards, pill borders, secondary badges, active row tint. |
| `--background` (Light Canvas) | `#F8FAFB` | `#0E0922` | Page background canvas. |
| `--card` | `#FFFFFF` | `#171033` | Elevated content cards with crisp `1px solid #E2E8F0` (or `#E8E3F5`) borders. |
| `--foreground` / `--muted-foreground` | `#141024` / `#524B6B` | `#F8FAFB` / `#B8B0D4` | Body copy & metadata (always `>= 4.5:1`). |

### 4.2 Typography, Spacing, Radius & Motion Rules
- **Font Loading:** Load `Plus Jakarta Sans` (weights `600, 700, 800` for headings via `next/font/google`) and `Inter` (weights `400, 500, 600` for UI/body) + `JetBrains Mono` (course codes, OTP input, verification codes) in `app/layout.tsx`.
- **Type Scale:** `H1` `36px–56px` (public) / `24px–28px` (dashboards, dynamic per page); `H2` `24px–32px`; `H3` `18px–20px`; `Body` `15px–16px` (`leading-relaxed`); `Meta/Label` `12px–13px`.
- **Border Radius Discipline:** `16px` (`rounded-2xl`) for major page cards/panels, `12px` (`rounded-xl`) for buttons/inputs/sub-cards, `9999px` (`rounded-full`) only for compact status pills. Eliminate nested cards inside cards inside cards (max 1 level of card nesting).
- **Motion Discipline:** Subtle, purposeful transitions (`150ms–220ms ease-out`). Remove background floating blur orbs (`AnimatedBackground`) from authentication and dashboard shells to improve low-end mobile performance. Strictly honor `prefers-reduced-motion`.
- **Touch & Accessibility Floor:** All interactive buttons, nav links, and form inputs must meet `min-h-[44px]` (`h-11`) on mobile/tablet; every input must have an explicit associated `<Label htmlFor>` or `aria-label`.

---

## 5. Content & Terminology Standardization System

To eliminate inconsistency across public pages, forms, dashboards, and Brevo emails, adopt one canonical vocabulary:

| Concept | Canonical Term (Use Everywhere) | Retired / Prohibited Terms |
| :--- | :--- | :--- |
| **Institution** | **SkillUp Digitech Academy** (short: **SkillUp**) | PromptCare, Prompt Home Health, Technology Academy |
| **Two Academic Offerings** | **Career Readiness Programme** & **Skill Acquisition Programme** | Onsite Training Offer, Caregiver Track, Premium Pathway |
| **Career Specializations** | **AI Engineer**, **Software Engineer**, **Social Media Management** | Full-Stack Web Track (when referring to pathway), Digital Growth |
| **Free Bonus Courses** | **Foundation Courses** (`Basic AI 101`, `Basic Digital Literacy`) | Starter Pack, Freebies |
| **Delivery Modalities** | **Online**, **Hybrid** (scheduled physical + virtual), **Physical** (in-person) | Onsite-only, Remote Class |
| **Physical Facility** | **Enugu Main Learning Centre** (`14 Garden Avenue, GRA, Enugu`) | Abuja Hub, Suite B16 Garki Abuja, Training Venue |
| **Scheduled Intake Group** | **Cohort** (with **Fixed Timetable**) | Batch, Intake Slot, Session Group |
| **Live Class Event** | **Class Session** (Physical Lab / Live Virtual Class) | Onsite Day, Live Workshop (when referring to scheduled cohort session) |
| **Self-Paced Content** | **Module** -> **Lesson** | Unit, Chapter |
| **Evaluated Work** | **Quiz**, **Assignment**, **Capstone Project** | Homework, Exam, Test |
| **Credentials** | **Verified Certificate** (with Verification Code `SKILLUP-YYYY-XXXX`) | Diploma (unless referencing Career Readiness completion), Badge |
| **Learner Age Categories** | **Teen Learner (Ages 13–18)** & **Adult Learner (18+)** | Minor (use only in legal/safeguarding disclosures, not primary UI headers) |

---

## 6. Public Homepage Redesign Strategy (Phase Six Audit)

### Current vs. Recommended Homepage Section Architecture

| Current Section on `/` | Verdict | Reason & Target Replacement |
| :--- | :---: | :--- |
| `CurrencyModal` (global blocker) | **REMOVE** | Kills first-impression conversion; default to `NGN` with subtle footer/header selector. |
| `PublicHeader` (5 links + Cart + Login + Sign Up) | **REDESIGN** | Streamline to Rebrand V2 clean navigation: Brand Logo + concise links (`Programmes`, `Courses`, `About`, `Verify`) + `Log In` + primary **`Get Started`** push-drawer trigger (presenting *Student* vs *Instructor* pathways cleanly without obscuring content). |
| `SkillupHero` (generic software copy + 4 cards) | **REDESIGN** | Answer *"What is SkillUp & Who is it for (Teens 13–18 & Adults)?"* immediately; primary CTA **`Get Started`**, secondary CTA **`Explore Programmes`**; remove the 4 repetitive mini-cards below CTA to keep above-the-fold crisp on mobile. |
| Marquee (`technicalCompetencies`) | **REMOVE** | Decorative noise that competes with the primary pathways directly below. |
| `DualPathwaysSection` | **KEEP & REFINE** | Strongest section on current homepage! Refine with Rebrand V2 Russian Violet/Mint tokens, explicit Teen (13–18) & Adult eligibility callout, fixed-timetable clarity, and BYOL + Enugu Centre power/fibre highlights. |
| `"Why Choose SkillUp?"` (3 cards) | **MERGE** | Merge unique physical-centre & mentor proof points into `"How Learning Works"` — eliminate standalone repetition. |
| `"The Engineering Journey"` (4 steps) | **KEEP & SIMPLIFY** | Single authoritative 4-step `"How SkillUp Works"` flow (Choose Pathway -> Learn Online & In-Centre -> Build Projects & Capstone -> Earn Verified Certificate). |
| `"Featured Courses"` (3 cards) | **KEEP & REFINE** | Pull live from `/api/courses` with clear `FREE Foundation` vs paid specialist tags and NGN pricing. |
| `Testimonials` (fake name—actually duplicate 4-step methodology!) | **REMOVE / REPLACE** | Remove duplicate methodology immediately. Replace with **Credibility & Learning Environment** block (Enugu Main Learning Centre lab specs, 100% power/fibre, BYOL expectations, official `/verify` certificate registry — zero fabricated testimonials). |
| FAQ Accordion (currently hidden on `/faq` only) | **INTRODUCE (COMPACT)** | Add 5 concise high-intent FAQs (Teen eligibility & guardian consent, BYOL laptop requirement, Hybrid fixed timetable, Free foundation courses, Installment payments) with link to full `/faq`. |
| `CtaBand` + `PublicFooter` | **KEEP & REFINE** | Rebrand in Deep Night Plum (`#150C33`) + Mint CTA; keep `/verify`, `/contact`, and Enugu campus address prominent. |

**Projected Impact:** Reduces homepage from **10 sections / 5,588px desktop (10,301px mobile)** down to **7 focused sections / ~3,400px desktop (~5,200px mobile)** while answering all 5 visitor questions above and immediately below the fold.

---

## 7. Overall Redesign Strategy (Summary)

1. **Preserve What Works:** Do NOT touch PostgreSQL tables, Drizzle queries, Paystack payment/webhook logic, Brevo transactional email engine, or the newly hardened HttpOnly cookie RBAC middleware.
2. **Unify Visual Tokens First (Phase 1):** Replace Tech Blue CSS variables in `app/globals.css` with Rebrand V2 Russian Violet & Mint tokens, load `Plus Jakarta Sans` + `Inter`, and fix contrast & touch-target tokens globally so every page benefits at once.
3. **Separate Account Creation from Onboarding (Phases 3–4):** Shrink initial `/register` to a fast, high-converting 1-screen account creation (Name, Email, Password, Age Group: Teen 13–18 vs Adult, Policy acceptance) -> Single-box OTP Verification -> Clean 3-step Guided Student Onboarding (Programme & Track -> Delivery Mode + BYOL/Centre Fixed Schedule -> Guardian Consent if Teen / Profile confirmation) -> Role Dashboard.
4. **Build Purpose-Driven Dashboards (Phases 5–7):** Replace card-heavy cluttered dashboards with state-aware, single-next-action dashboards for Students (differentiated across Newly Registered / Awaiting Enrollment / Active / Completed), Instructors (Teaching-first: Assigned Cohorts, Upcoming Sessions, Attendance, Grading Queue), and Admins (retiring legacy PromptCare Campaign & Abuja Onsite panels).
