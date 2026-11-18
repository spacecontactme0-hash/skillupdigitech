# SkillUp Digitech Academy — Rebrand V2 Browser & Visual Experience Audit (Phase Zero)

**Audit Date:** 2026-11-17  
**Environment Audited:** Live local Next.js 16.1.6 (Turbopack) server at `http://localhost:3000` backed by Neon PostgreSQL (`DATABASE_BACKEND=postgres`)  
**Method:** Automated + interactive Chromium headless inspection across 4 viewports (`1440×900`, `1280×800`, `768×1024`, `390×844`) with DOM telemetry, live screenshot capture, and read-only session verification against authentic accounts.  
**Data Integrity Guarantee:** Zero fake users created, zero emails sent, zero paid enrollments triggered, zero production records modified.

---

## 1. Routes Visited & Screens Inspected

### 1.1 Public Website Routes (`1440×900` Baseline)

| Route | HTTP | Words | Scroll Height | Cards | Legacy Terms Detected | Screenshot Evidence |
| :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| `/` (First Visit, Fresh Context) | 200 | 917 | 5,588px | — | None (blocked by CurrencyModal) | `audit_v2/01_first_visit_home_modal.png` |
| `/` (Currency Dismissed) | 200 | 917 | 5,588px | 35+ | None | `audit_v2/02_public_home_1440.png` |
| `/courses` | 200 | 156 | 1,608px | — | None | `audit_v2/03_public_courses_1440.png` |
| `/courses/frontend-development` | 200 | 88 | 911px | — | None | `audit_v2/04_public_course_detail_1440.png` |
| `/about` | 200 | 456 | 2,889px | — | None | `audit_v2/05_public_about_1440.png` |
| `/faq` | 200 | 309 | 3,734px | — | None | `audit_v2/06_public_faq_1440.png` |
| `/contact` | 200 | 346 | 2,997px | — | None | `audit_v2/07_public_contact_1440.png` |
| `/verify` | 200 | 140 | 1,119px | — | None | `audit_v2/08_public_verify_1440.png` |
| `/cart` | 200 | 104 | 900px | — | None | `audit_v2/09_public_cart_1440.png` |
| `/campaign/promptcare-academy` | **200** | 389 | 2,787px | — | **`caregiver, scrubs, cpr, abuja`** | `audit_v2/10_legacy_campaign_1440.png` |

### 1.2 Authentication & Registration Routes

| Route | HTTP | Visible Inputs (Step 1) | Visible Buttons | Words | Screenshot Evidence |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `/register` | 200 | 0 (card selection) | 1 | 307 | `audit_v2/13_auth_register.png` |
| `/register-online` | 307 -> `/register` | 0 | 1 | 307 | `audit_v2/13_auth_register-online.png` |
| `/register-onsite` | 307 -> `/register` | 0 | 1 | 307 | `audit_v2/13_auth_register-onsite.png` |
| `/verify-otp` (no query email) | 200 | 0 | 2 | 53 | `audit_v2/13_auth_verify-otp.png` |
| `/register-instructor` | 200 | 1 (Email only — 1 of 8 steps) | 2 | 156 | `audit_v2/13_auth_register-instructor.png` |
| `/forgot-password` | 200 | 1 | 1 | 42 | `audit_v2/13_auth_forgot-password.png` |
| `/reset-password` | 200 | 4 | 3 | 46 | `audit_v2/13_auth_reset-password.png` |

### 1.3 Authenticated Role Console Routes (Read-Only Existing Accounts)

| Role | Route | Final URL | Primary `<h1>` | Card Containers | Legacy Terms | Screenshot |
| :--- | :--- | :--- | :--- | :---: | :--- | :--- |
| Student | `/dashboard` | `/dashboard` | `"Student Dashboard"` | **27** | None | `audit_v2/14_student_dashboard.png` |
| Student | `/welcome/student` | `/welcome/student` | **`(none)` (Infinite Spinner!)** | **0** | None | `audit_v2/15_student_welcome.png` |
| Student | `/dashboard/courses` | `/dashboard/courses` | `"Student Dashboard"` | 10 | None | `audit_v2/16_student_courses.png` |
| Student | `/dashboard/onsite-training` | `/dashboard/onsite-training` | `"Student Dashboard"` | **38** | Static fake social proof | `audit_v2/17_student_onsite.png` |
| Student | `/dashboard/certificates` | `/dashboard/certificates` | `"Student Dashboard"` | 11 | None | `audit_v2/18_student_certs.png` |
| Student | `/dashboard/payments` | `/dashboard/payments` | `"Student Dashboard"` | 10 | None | `audit_v2/19_student_payments.png` |
| Student | `/dashboard/profile` | `/dashboard/profile` | `"Student Dashboard"` | **44** | None | `audit_v2/20_student_profile.png` |
| Student | `/dashboard/profile/setup` | `/dashboard/profile/setup` | `"Student Dashboard"` | **21** | `isHealthcareProfessional`, `abuja` in code | `audit_v2/21_student_profile_setup.png` |
| Instructor | `/instructor` | `/instructor` | `"Instructor Dashboard"` | **29** | None | `audit_v2/22_instructor_dashboard.png` |
| Instructor | `/welcome/instructor` | `/welcome/instructor` | **`(none)` (Infinite Spinner!)** | **0** | None | `audit_v2/23_instructor_welcome.png` |
| Instructor | `/instructor/courses` | `/instructor/courses` | `"Instructor Dashboard"` | **31** | None | `audit_v2/24_instructor_courses.png` |
| Instructor | `/instructor/courses/new` | `/instructor/courses/new` | `"Instructor Dashboard"` | 16 | 7 unlabeled inputs | `audit_v2/25_instructor_new_course.png` |
| Instructor | `/instructor/attendance` | `/instructor/attendance` | `"Instructor Dashboard"` | 10 | None | `audit_v2/26_instructor_attendance.png` |
| Instructor | `/instructor/evaluations` | `/instructor/evaluations` | `"Instructor Dashboard"` | 15 | None | `audit_v2/27_instructor_evaluations.png` |
| Admin | `/admin` | `/admin` | `"Admin Dashboard"` | **31** | None | `audit_v2/28_admin_dashboard.png` |
| Admin | `/admin/campuses` | `/admin/campuses` | `"Admin Dashboard"` | 15 | None | `audit_v2/30_admin_campuses.png` |
| Admin | `/admin/cohorts` | `/admin/cohorts` | `"Admin Dashboard"` | 15 | None | `audit_v2/31_admin_cohorts.png` |
| Admin | `/admin/onsite-training` | `/admin/onsite-training` | `"Admin Dashboard"` | **24** | **`abuja`** + 20 unlabeled inputs | `audit_v2/32_admin_onsite_legacy.png` |

---

## 2. Actual User Journeys Tested & Observed Friction

### 2.1 Public Discovery & First-Visit Journey
- **Verified Blocker:** Landing on `/` as a new visitor immediately opens a full-bottom `CurrencyModal` (`Select Your Currency`) that obscures 75% of the viewport before the visitor reads a single headline. Worse: it defaults to **USD** (for an Enugu, Nigeria academy), its `$` icon renders invisible blue-on-blue, and its `"Continue with USD"` button is **disabled** (`disabled={!currencySelected && currency === "USD"}`).
- **Verified Content Duplication:** The homepage spans **5,588px on desktop** and **10,301px (12.2 phone screens) on mobile 390px**. Three distinct sections repeat the exact same "hands-on labs + capstone projects" pitch (`Why Choose SkillUp`, `The Engineering Journey`, and `Testimonials` — which does not even contain testimonials, but a duplicate 4-step methodology!).
- **Verified Legacy Leak:** Navigating to `/campaign/promptcare-academy` returns HTTP 200 with a green countdown banner and giant **"PROMPT HOME HEALTH — BECOME A WORLD-CLASS CERTIFIED CAREGIVER IN 21 DAYS"** poster (`₦150,000`, scrubs, Abuja venue, external Google Form link).

### 2.2 Student Registration & Onboarding Journey (Verified Non-Destructively)
- **Registration Funnel (`/register`):** `GuidedStudentRegistrationForm` (1,303 lines) forces **6 steps for adults / 7 steps for minors** (Programme -> Specialization -> Delivery Mode -> Schedule & BYOL -> Account Details -> Minor Safeguarding -> Review) **before** creating an account.
  - **Verified Data Mismatch:** Hardcoded `SPECIALIST_COURSES` inside `guided-student-registration-form.tsx` lists stale slugs and **incorrectly prices Basic AI 101 at ₦45,000 and Basic Digital Literacy at ₦35,000**, contradicting the live PostgreSQL catalog where both are `₦0` (FREE) and contradicting the homepage promise!
  - **Verified Visual Clash:** Mixes Electric Blue (`#2563eb` logo, progress bar, step indicators) with Russian Violet (`#231651` badges and Continue button).
- **Post-OTP Welcome Screen (`/welcome/student`):** **CRITICAL BUG VERIFIED** — Renders an **infinite loading spinner** when accessed with cookie auth after page reload, because `app/welcome/student/page.tsx:56` calls `/api/onboarding/state` without `credentials: "include"` while `token` is not persisted in `localStorage`.
- **Profile Setup (`/dashboard/profile/setup`):** Duplicates questions already asked during registration (phone, WhatsApp, DOB), asks legacy healthcare questions (`isHealthcareProfessional`, `"abuja"` location), squeezes the form between TWO sidebars (left dashboard rail + right 320px `OnboardingShell` rail), displays **three competing progress indicators simultaneously**, and exposes internal developer jargon (`"Profile Setup Funnel — We kept these heavier questions out of signup..."`).
- **Student Profile (`/dashboard/profile`):** **44 card containers**, contradictory status badges (`"Setup Complete"` next to `"0% COMPLETE"` and `"Setup Complete - Profile Incomplete"`), two redundant completion trackers, and a **clipped button** (`"xplore courses ->"`) in the right rail.
- **Student Dashboard (`/dashboard`):**
  - **CRITICAL ACCESSIBILITY BUG:** The `"Browse Catalog"` button in the dark Russian Violet hero renders **white text on a white background** (completely unreadable!).
  - **Misleading Empty State:** Shows a hardcoded `"Virtual Live Workshop — Tuesdays 17:00 — Google Meet — Join Virtual Classroom"` card even when the student has **`0 Active Tracks`**.
  - **Unsubstantiated Marketing Copy on `/dashboard/onsite-training`:** Shows static `"48+ learners enrolled"`, `"12 seats left"`, `"March 7, 2026"` (past date!), and `"One secure payment NGN 120,000"` contradicting actual DB state and installment plans.

### 2.3 Instructor Registration & Onboarding Journey
- **Registration (`/register-instructor`):** Forces an overly fragmented **8-step micro-wizard** (one input per screen: Email -> Password -> Full Name -> Phone -> Headline -> Experience -> Specialties -> Review). Step 6 (`Experience`) prematurely displays a blue completed checkmark on Step 1 because `yearsOfExperience` defaults to `"0"`.
- **Approval Model Verified:** Instructor self-registration activates an `instructor` role immediately after email OTP verification (`app/api/auth/register-instructor/route.ts`). There is **no admin instructor approval gate** in the current codebase; only course publishing requires admin approval.
- **Welcome Screen (`/welcome/instructor`):** **CRITICAL BUG VERIFIED** — Same infinite loading spinner as `/welcome/student` when navigated to directly without in-memory `token`. Also nearly identical in layout to the student welcome screen rather than teaching-focused.
- **Instructor Dashboard (`/instructor`):** Still styled in legacy Slate Navy + Tech Blue (`#2563eb`), spans **6,522px on mobile 390px** with **26 small touch targets (<44px)**, and lacks a Cohort Timetable / Upcoming Sessions widget on the dashboard home. `/instructor/courses/new` has **7 unlabeled inputs**.

### 2.4 Login, Session & Access-Control Verification

| Test Case | Observed Outcome | Status |
| :--- | :--- | :---: |
| Invalid credentials on `/login` | Stays on `/login`, displays clear error message | **PASS** |
| Direct unauthenticated `/dashboard` | Redirects to `/login?redirect=%2Fdashboard` | **PASS** |
| Direct unauthenticated `/instructor` | Redirects to `/login?redirect=%2Finstructor` | **PASS** |
| Direct unauthenticated `/admin` | Redirects to `/login?redirect=%2Fadmin` | **PASS** |
| Direct unauthenticated `/finance` | Redirects to `/login?redirect=%2Ffinance` | **PASS** |
| `/login-admin` | Remains on `/login-admin` (client redirect to `/login`) | **INVESTIGATE** |
| Hard browser refresh on `/dashboard` (authenticated) | Stays on `/dashboard` (no redirect loop) | **PASS** |
| Hard browser refresh on `/instructor` (authenticated) | Stays on `/instructor` (no redirect loop) | **PASS** |
| Hard browser refresh on `/admin` (authenticated) | Stays on `/admin` (verified admin auth fix intact!) | **PASS** |
| Direct navigation to `/welcome/student` & `/welcome/instructor` | Stuck on infinite loading spinner | **FAIL (CRITICAL)** |

---

## 3. Responsive Visual Audit Matrix (`1440px`, `1280px`, `768px`, `390px`)

| Viewport | Route | Horizontal Overflow | Scroll Height | Viewport Multiples | Small Touch Targets (<44px) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| Desktop `1440×900` | `/` | No (`1440px`) | 5,588px | 6.21× | 27 |
| Desktop `1440×900` | `/courses` | No | 1,608px | 1.79× | 28 |
| Desktop `1440×900` | `/register` | No | 1,722px | 1.91× | 9 |
| Desktop `1440×900` | `/login` | No | 1,000px | 1.11× | 15 |
| Laptop `1280×800` | `/` | No (`1280px`) | 5,588px | 6.99× | 27 |
| Tablet `768×1024` | `/` | No (`768px`) | 7,567px | 7.39× | 20 |
| Tablet `768×1024` | `/register` | No | 2,400px | 2.34× | 9 |
| Mobile `390×844` | `/` | No (`390px`) | **10,301px** | **12.20×** | 16 |
| Mobile `390×844` | `/register` | No | **2,830px** | **3.35×** | 6 |
| Mobile `390×844` | `/contact` | No | **4,560px** | **5.40×** | 17 |
| Mobile `390×844` | `/dashboard` | No | 2,512px | 2.98× | 11 |
| Mobile `390×844` | `/instructor` | No | **6,522px** | **7.73×** | **26** |
| Mobile `390×844` | `/admin` | No | 4,077px | 4.83× | 12 |

**Key Responsive Findings:**
- **Positive:** Zero horizontal overflow (`scrollWidth === viewportWidth`) across all 23 tested viewport/route combinations and zero broken images (`naturalWidth === 0`).
- **Negative:** Excessive vertical scroll on mobile (`10,301px` on `/`, `6,522px` on `/instructor`, `4,560px` on `/contact`), pervasive `<44px` touch targets (header icons, pill buttons, table links, sidebar links at `py-2` = 36px height), and **31 unlabeled inputs** across `/courses` (1), `/verify` (1), `/dashboard` (1), `/instructor/courses` (1), `/instructor/courses/new` (7), `/instructor/evaluations` (1), and `/admin/onsite-training` (20).

---

## 4. Prioritized Defect Register (Browser-Verified)

| ID | Severity | Route(s) | Observed Problem (Verified) | Suggested Improvement |
| :---: | :---: | :--- | :--- | :--- |
| **BA-01** | **Critical** | `/welcome/student`, `/welcome/instructor` | Infinite loading spinner on direct load/reload due to missing `credentials: "include"` when in-memory `token` is null. | Add `credentials: "include"` to onboarding fetches and simplify welcome flow into streamlined role onboarding. |
| **BA-02** | **Critical** | `/dashboard` | `"Browse Catalog"` button renders white text on white background in hero banner (unreadable, ~1:1 contrast). | Replace with explicit high-contrast outline/ghost dark-surface button token (`border-white/30 text-white hover:bg-white/10`). |
| **BA-03** | **Critical** | `/campaign/promptcare-academy` | Live HTTP 200 legacy PromptCare Caregiver page with scrubs, CPR, Abuja venue, and Google Form link. | Decommission route immediately and redirect `/campaign/*` to `/courses` or `/` (`#programmes`). |
| **BA-04** | **Critical** | `/` (all public pages on first visit) | `CurrencyModal` blocks 75% of screen on first arrival, defaults to USD, invisible `$` icon, disabled Continue button. | Remove blocking modal completely; default to `NGN` (Nigeria academy) with a subtle optional header/footer currency switcher. |
| **BA-05** | **High** | `/register` (`guided-student-registration-form.tsx`) | Hardcoded `SPECIALIST_COURSES` shows wrong slugs and charges ₦45k / ₦35k for free foundation courses; 6–7 steps before account creation. | Split into lightweight account creation (Step 1) + guided onboarding using live `/api/programmes` & `/api/courses` data. |
| **BA-06** | **High** | Global (`app/globals.css` vs dashboards) | Split-brain design system: global CSS tokens are Tech Blue (`#2563eb`) while newer pages hardcode Russian Violet (`#231651`) & Mint (`#D6FFF6`); Plus Jakarta Sans font is never loaded. | Centralize Rebrand V2 tokens in `app/globals.css` and load fonts via `next/font/google` in `app/layout.tsx`. |
| **BA-07** | **High** | `/dashboard/profile`, `/dashboard/profile/setup` | 44 cards on Profile, clipped `"xplore courses ->"` button, contradictory `0%` vs `Setup Complete` badges, legacy `isHealthcareProfessional` & `abuja` fields, triple progress bars. | Rebuild Profile into clean tabbed settings (Account, Academic Record, Billing) and remove legacy healthcare fields. |
| **BA-08** | **High** | `/register-instructor` | 8 single-field micro-steps; Step 6 prematurely checked on Step 1; duplicates student `OnboardingShell`. | Consolidate into a clean 3-step instructor onboarding (Credentials -> Teaching Profile -> Review). |
| **BA-09** | **High** | `/dashboard`, `/dashboard/onsite-training`, `/admin/onsite-training` | Hardcoded Tuesday Google Meet card shown to unenrolled students; fabricated `"48+ learners enrolled"` / past `"March 7, 2026"` date; legacy Abuja onsite admin panel clashes with new Campuses/Cohorts console. | Show real cohort/session state per student status; retire legacy static onsite marketing panels in favor of live PostgreSQL cohorts. |
| **BA-10** | **Medium** | `/`, `/instructor`, `/contact` | Homepage repeats methodology 3× (`Testimonials` is a duplicate 4-step methodology!), creating 10,301px mobile scroll; 31 unlabeled inputs across dashboards; `<h1>` says generic `"Student Dashboard"` on every subpage. | Consolidate homepage to 6 crisp sections; add proper `<label>`/`aria-label` to all inputs; render dynamic per-page `<h1>` titles. |

---

## 5. Verified vs. Unverified Boundaries

- **Verified live in Chromium:** Public pages, responsive layouts (1440/1280/768/390), currency modal blocking, legacy PromptCare campaign page, registration step 1 UI, invalid login error handling, unauthenticated redirects, authenticated Student/Instructor/Admin dashboards, hard-refresh session stability, broken welcome screens, clipped buttons, contrast failures.
- **Not executed destructively (by directive):** End-to-end live Brevo OTP email dispatch for a newly created test user, live Paystack payment submission, and live guardian consent email click-through — these were inspected via source code and previously verified via automated test suites (`npm run test:academic`, `npm run test:email`, `npm run test:payments`) without mutating production data.
