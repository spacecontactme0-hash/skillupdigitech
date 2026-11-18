# SKILLUP DIGITECH ACADEMY — REBRAND V2 COMPLETE PAGE & ROUTE INVENTORY

**Document ID:** Document 5 of 5 (`SKILLUP_REBRAND_V2_PAGE_INVENTORY.md`)  
**Date:** 2026-11-17  
**Total App Router Pages Audited:** 68 `page.tsx` files + 6 Layouts (`app/layout.tsx`, `app/(public)/layout.tsx`, `app/(auth)/layout.tsx`, `app/dashboard/layout.tsx`, `app/instructor/layout.tsx`, `app/admin/layout.tsx`, `app/finance/layout.tsx`)

---

## 1. Shared Layouts Inventory

| Layout File | Scope | Recommended Action |
| :--- | :--- | :--- |
| `app/layout.tsx` | Root HTML shell | **REDESIGN:** Load `Plus Jakarta Sans`, `Inter`, `JetBrains Mono` via `next/font/google`; **remove `<CurrencyModal />`**; keep `<AuthSessionBootstrap />` & `<Toaster />`. |
| `app/(public)/layout.tsx` | Public marketing & legal pages | **REDESIGN:** Remove `<AnimatedBackground />`; integrate Rebrand V2 `PublicHeader` + content-shift `GetStartedPushDrawer` + Deep Night Plum `PublicFooter`. |
| `app/(auth)/layout.tsx` | Login, signup, OTP, password reset | **REDESIGN:** Remove `<AnimatedBackground />` and Tech Blue radial gradients; use calm Russian Violet/Light Canvas `AuthCardLayout`. |
| `app/dashboard/layout.tsx` | Student console | **REDESIGN:** Apply V2 tokens; support dynamic per-page `<h1>` titles; verify cookie session cleanly on reload. |
| `app/instructor/layout.tsx` | Instructor console | **REDESIGN:** Apply V2 tokens; dynamic per-page `<h1>`; verify cookie session cleanly on reload. |
| `app/admin/layout.tsx` | Admin console | **KEEP & ALIGN:** Preserve hardened `credentials: "include"` cookie verification; remove legacy `Campaign` & `Onsite Training` sidebar links; apply V2 tokens & dynamic `<h1>`. |
| `app/finance/layout.tsx` | Finance console | **REDESIGN:** Apply V2 tokens; add `credentials: "include"` session verification parity with `AdminLayout`. |

---

## 2. Public Routes (`app/(public)/` & Public Checkout/Cart)

| Route | File | Action | Notes / Required Changes |
| :--- | :--- | :---: | :--- |
| `/` | `app/(public)/page.tsx` | **REDESIGN** | Consolidate from 10 to 7 crisp sections; remove marquee & duplicate `Testimonials` methodology; add Enugu Centre Credibility + 5-item FAQ; apply V2 tokens. |
| `/courses` | `app/(public)/courses/page.tsx` | **REDESIGN** | Apply V2 tokens; add accessible `<Label>` to search input; show `FREE FOUNDATION` vs `CAREER TRACK` vs `SPECIALIST` filters; NGN default. |
| `/courses/[slug]` | `app/(public)/courses/[slug]/page.tsx` | **REDESIGN** | Apply V2 tokens; show bundled free courses (`AI-101`, `BDL-101`) & Full vs Installment payment clarity. |
| `/about` | `app/(public)/about/page.tsx` | **REDESIGN** | Apply V2 tokens; feature Teens (13–18) & Adults mission + Enugu Main Learning Centre (14 Garden Avenue, GRA, Enugu) labs & power/fibre guarantees. |
| `/faq` | `app/(public)/faq/page.tsx` | **REDESIGN** | Apply V2 tokens; ensure all answers reflect fixed hybrid timetables, BYOL laptop specs, guardian consent, and installments. |
| `/contact` | `app/(public)/contact/page.tsx` | **REDESIGN** | Apply V2 tokens (replace legacy `#090D16` blue hero with Deep Night Plum `#150C33`); Enugu campus map already updated — trim vertical height on mobile (`4,560px`). |
| `/verify` | `app/(public)/verify/page.tsx` | **KEEP & POLISH** | Add explicit `<Label htmlFor>` for verification code input; apply V2 tokens. |
| `/verify/[code]` | `app/(public)/verify/[code]/page.tsx` | **KEEP & POLISH** | Apply V2 Russian Violet/Mint official diploma seal styling. |
| `/guardian-consent` | `app/(public)/guardian-consent/page.tsx` | **KEEP & POLISH** | Apply V2 tokens; ensure warm, trustworthy parent-facing safeguarding copy. |
| `/privacy`, `/terms`, `/refund` | `app/(public)/{privacy,terms,refund}/page.tsx` | **KEEP & POLISH** | Inherit V2 tokens; verify zero healthcare/PromptCare references in legal copy. |
| `/campaign/promptcare-academy` | `app/(public)/campaign/promptcare-academy/page.tsx` | **REMOVE / REDIRECT** | **CRITICAL:** Legacy PromptCare Caregiver campaign page (HTTP 200!). Replace with `redirect("/courses")` and delete `campaign-page-client.tsx`. |
| `/cart` | `app/cart/page.tsx` | **REDESIGN** | Remove `<AnimatedBackground />`; apply V2 tokens; highlight free foundation courses automatically added. |
| `/checkout`, `/checkout/success`, `/checkout/failed` | `app/checkout/**/page.tsx` | **KEEP & POLISH** | Preserve Paystack flow & verification logic; align visual styling with V2 tokens. |

---

## 3. Authentication & Onboarding Routes (`app/(auth)/`, `app/welcome/`, `app/login-admin/`)

| Route | File | Action | Notes / Required Changes |
| :--- | :--- | :---: | :--- |
| `/login` | `app/(auth)/login/page.tsx` | **REDESIGN** | Unified login for all roles; V2 tokens; clear expired-session banner when redirected from protected route. |
| `/login-admin` | `app/login-admin/page.tsx` | **CONSOLIDATE (REDIRECT)** | Keep clean server-side `redirect("/login?redirect=/admin")` so admin bookmarks work without confusion. |
| `/register` | `app/(auth)/register/page.tsx` | **REBUILD** | Replace 6–7 step monolith with fast 1-screen Student Account Creation (Name, Email, Password, Age Group `Teen 13–18`/`Adult 18+`, Terms). |
| `/register-online` | `app/(auth)/register-online/page.tsx` | **KEEP REDIRECT** | Already redirects to `/register`; update to `redirect("/register?programme=skill-acquisition")`. |
| `/register-onsite` | `app/(auth)/register-onsite/page.tsx` | **KEEP REDIRECT** | Already redirects to `/register`; update to `redirect("/register?programme=career-readiness")`. |
| `/register-instructor` | `app/(auth)/register-instructor/page.tsx` | **REBUILD** | Replace 8-step micro-wizard with clean 1-screen Instructor Account Creation -> OTP -> 2-step Faculty Onboarding. |
| `/verify-otp` | `app/(auth)/verify-otp/page.tsx` | **REDESIGN** | Single wide monospace 6-digit input box; fix dead 0-input screen when visited without `?email=`. |
| `/forgot-password`, `/reset-password` | `app/(auth)/{forgot,reset}-password/page.tsx` | **REDESIGN** | Apply V2 `AuthCardLayout` tokens; preserve Brevo reset flow. |
| `/welcome/student` | `app/welcome/student/page.tsx` | **REBUILD** | **CRITICAL:** Fix infinite loading spinner (add `credentials: "include"`) and turn into the canonical 3-step post-OTP **Student Onboarding V2** (Programme -> Delivery/BYOL/Fixed Timetable -> Adult Goal or Teen Safeguarding). |
| `/welcome/instructor` | `app/welcome/instructor/page.tsx` | **REBUILD** | **CRITICAL:** Fix infinite loading spinner (add `credentials: "include"`) and turn into a teaching-focused 2-step **Faculty Onboarding V2**. |

---

## 4. Student Console Routes (`app/dashboard/`)

| Route | File | Action | Notes / Required Changes |
| :--- | :--- | :---: | :--- |
| `/dashboard` | `app/dashboard/page.tsx` | **REDESIGN** | Fix white-on-white `"Browse Catalog"` button; remove hardcoded Tuesday Google Meet link; implement 5 lifecycle states; reduce from 27 cards to max 4 focused blocks. |
| `/dashboard/courses` | `app/dashboard/courses/page.tsx` | **REDESIGN** | Separate `Career Track / Specialist Courses` from `Free Foundation Courses`; clear progress bars & `"Resume Lesson"` CTAs. |
| `/dashboard/courses/[courseId]/learn` | `app/dashboard/courses/[courseId]/learn/page.tsx` | **KEEP & POLISH** | Preserve video player, notes, quiz, assignment, capstone, and `WriteToInstructorModal`; apply V2 tokens & label note input. |
| `/dashboard/onsite-training` | `app/dashboard/onsite-training/page.tsx` | **REBUILD / RENAME** | Remove fake `"48+ learners"`, past `"March 7, 2026"` date, and `"abuja"` option; convert into **Campus & Schedule** showing real Enugu Lab sessions, attendance %, and BYOL checklist (keep route or redirect from `/dashboard/schedule`). |
| `/dashboard/onsite-training/success` | `app/dashboard/onsite-training/success/page.tsx` | **KEEP & POLISH** | Apply V2 tokens; confirm real cohort & Enugu Centre venue details. |
| `/dashboard/certificates` | `app/dashboard/certificates/page.tsx` | **KEEP & POLISH** | Preserve graduation clearance check & `/verify/[code]` links; apply V2 tokens & clean empty state. |
| `/dashboard/payments` | `app/dashboard/payments/page.tsx` | **KEEP & POLISH** | Show multi-enrolment installment balances clearly alongside receipt list; apply V2 tokens. |
| `/dashboard/payments/[paymentId]` | `app/dashboard/payments/[paymentId]/page.tsx` | **KEEP** | Clean transaction detail view; inherits V2 tokens. |
| `/dashboard/profile` | `app/dashboard/profile/page.tsx` | **REBUILD** | Reduce from **44 cards** to 3 clean tabs (`Account`, `Academic & Safeguarding`, `Security`); fix clipped `"xplore courses"` button; remove contradictory `0%` vs `Setup Complete` copy & onsite ads. |
| `/dashboard/profile/setup` | `app/dashboard/profile/setup/page.tsx` | **CONSOLIDATE (REDIRECT)** | Retire redundant legacy wizard containing `isHealthcareProfessional` & `abuja`; redirect to `/welcome/student` (if onboarding incomplete) or `/dashboard/profile`. |

---

## 5. Instructor Console Routes (`app/instructor/`)

| Route | File | Action | Notes / Required Changes |
| :--- | :--- | :---: | :--- |
| `/instructor` | `app/instructor/page.tsx` | **REDESIGN** | Teaching-first hierarchy: Upcoming Sessions (`Take Attendance`) -> Pending Grading Queue -> Assigned Courses/Cohorts; reduce mobile height from `6,522px`; V2 tokens. |
| `/instructor/courses` | `app/instructor/courses/page.tsx` | **REDESIGN** | Apply V2 tokens; label search input; show clear `Pending Admin Approval` vs `Published` badges. |
| `/instructor/courses/new` | `app/instructor/courses/new/page.tsx` | **REDESIGN** | Add explicit `<Label>` to all 7 unlabeled inputs; apply V2 tokens. |
| `/instructor/create-course` | `app/instructor/create-course/page.tsx` | **REMOVE / REDIRECT** | Duplicate of `/instructor/courses/new` -> replace with `redirect("/instructor/courses/new")`. |
| `/instructor/courses/[courseId]/edit` | `app/instructor/courses/[courseId]/edit/page.tsx` | **KEEP & POLISH** | Canonical course metadata editor; apply V2 tokens. |
| `/instructor/edit-course/[courseId]` | `app/instructor/edit-course/[courseId]/page.tsx` | **REMOVE / REDIRECT** | Duplicate of `/instructor/courses/[courseId]/edit` -> replace with `redirect("/instructor/courses/${courseId}/edit")`. |
| `/instructor/courses/[courseId]/content` | `app/instructor/courses/[courseId]/content/page.tsx` | **KEEP & POLISH** | Module/lesson/quiz/assignment builder; inherits V2 tokens. |
| `/instructor/attendance` | `app/instructor/attendance/page.tsx` | **KEEP & POLISH** | Already uses V2 Russian Violet/Mint accents; ensure ≥44px check-in buttons on mobile. |
| `/instructor/evaluations` | `app/instructor/evaluations/page.tsx` | **KEEP & POLISH** | Add label to filter input; apply V2 tokens. |
| `/instructor/analytics`, `/instructor/settings`, `/instructor/upload` | `app/instructor/{analytics,settings,upload}/page.tsx` | **KEEP & POLISH** | Align chart & form styling with V2 tokens; ensure instructor bio/specialties/availability are cleanly editable in `/instructor/settings`. |

---

## 6. Admin & Finance Console Routes (`app/admin/`, `app/finance/`)

| Route | File | Action | Notes / Required Changes |
| :--- | :--- | :---: | :--- |
| `/admin` | `app/admin/page.tsx` | **REDESIGN** | Apply V2 tokens; add quick-links to Campuses, Cohorts, and Tuition Installments; reduce mobile height (`4,077px`). |
| `/admin/campuses`, `/admin/cohorts`, `/admin/payments/installments` | `app/admin/{campuses,cohorts,payments/installments}/page.tsx` | **KEEP** | Already aligned with Rebrand V2 Russian Violet/Mint aesthetic and newly hardened cookie auth. |
| `/admin/courses`, `/admin/courses/[courseId]/edit`, `/admin/courses/[courseId]/content` | `app/admin/courses/**/page.tsx` | **KEEP & POLISH** | Preserve course approval & content moderation workflows; align with V2 tokens. |
| `/admin/categories`, `/admin/users`, `/admin/students`, `/admin/analytics`, `/admin/settings` | `app/admin/{categories,users,students,analytics,settings}/page.tsx` | **KEEP & POLISH** | Inherit V2 tokens; ensure mobile table horizontal scroll wrappers & input labels. |
| `/admin/payments`, `/admin/payments/verify`, `/admin/payments/[paymentId]` | `app/admin/payments/**/page.tsx` | **KEEP & POLISH** | Preserve Paystack reconciliation & manual verification; align with V2 tokens. |
| `/admin/onsite-training` | `app/admin/onsite-training/page.tsx` | **REMOVE / ARCHIVE** | Legacy Abuja/Enugu static marketing config with 20 unlabeled inputs; superseded by `/admin/campuses` + `/admin/cohorts`. Remove from Admin sidebar. |
| `/admin/campaign` | `app/admin/campaign/page.tsx` | **REMOVE / ARCHIVE** | Legacy PromptCare Caregiver campaign editor. Remove from Admin sidebar. |
| `/finance`, `/finance/reports`, `/finance/transactions`, `/finance/transactions/[paymentId]` | `app/finance/**/page.tsx` | **KEEP & POLISH** | Preserve Finance RBAC isolation (`payment:read`, `payment:verify`, `admin:read`); align with V2 tokens and add link to Tuition Installments. |

---

## 7. Consolidation & Removal Summary

- **Routes to Decommission / Redirect (7):**
  1. `/campaign/promptcare-academy` -> redirect to `/courses` (remove caregiver page)
  2. `/admin/campaign` -> remove from sidebar / archive
  3. `/admin/onsite-training` -> remove from sidebar / redirect to `/admin/campuses`
  4. `/dashboard/profile/setup` -> redirect to `/welcome/student` (or `/dashboard/profile`)
  5. `/instructor/create-course` -> redirect to `/instructor/courses/new`
  6. `/instructor/edit-course/[courseId]` -> redirect to `/instructor/courses/[courseId]/edit`
  7. `/login-admin` -> preserve clean server redirect to `/login?redirect=/admin`
