# SkillUp Digitech Academy — Implementation & Architecture Log

**Platform:** SkillUp Digitech Academy  
**Version:** 2.0  
**Date:** 15 November 2026  
**Primary Learning Centre:** 14 Garden Avenue, GRA, Enugu, Nigeria  

---

## 1. Architectural Highlights & Changes

### 1.1 Dual Learning Pathways
- **Career Readiness Programme (`career-readiness`)**:
  - Focuses on comprehensive career transformation with structured cohorts, live virtual masterclasses, recorded lesson modules, and in-person practical lab workshops.
  - Three distinct career tracks:
    1. **AI Engineer**: Machine Learning, LLMs, Vector Databases, PyTorch deployment.
    2. **Software Engineer**: Full-Stack TypeScript, React 19, Node.js, PostgreSQL relational modeling, Docker.
    3. **Social Media Management**: Content strategy, brand voice, paid advertising (Meta/Google), video production.
  - Includes complimentary foundation bundle (`AI-101` and `BDL-101`) added automatically.
- **Skill Acquisition Programme (`skill-acquisition`)**:
  - Modular, self-paced, online-first courses.
  - Complimentary access to Basic AI 101 and Basic Digital Literacy bundled with every course.

### 1.2 Physical Learning Centre Infrastructure
- **Campus Location**: Enugu Main Learning Centre, 14 Garden Avenue, GRA, Enugu, Enugu State, Nigeria.
- **Computer Labs**:
  - Lab 1 — Turing Room (30 safe workstation capacity, 30 power drops)
  - Lab 2 — Lovelace Room (30 safe workstation capacity, 30 power drops)
- **Infrastructure Guarantees**:
  - 100% Guaranteed Dual-Source Power (Industrial generator + Solar/Inverter backup)
  - Enterprise High-Speed Fibre Broadband Wi-Fi
  - Mandatory Bring Your Own Laptop (BYOL) policy with minimum hardware specifications (Core i5 / Ryzen 5, 8GB RAM, 256GB SSD)

### 1.3 Database Architecture (Neon PostgreSQL + Drizzle ORM)
- Database schema managed in `db/schema/` across 39 tables:
  - `academic_programmes`: Programme definitions and allowed delivery modes.
  - `programme_pathways`: Track specializations (AI Engineer, Software Engineer, Social Media Management).
  - `programme_courses`: Mappings linking courses to programmes/pathways with roles (`foundation`, `core`, `supporting`, `elective`).
  - `campuses` & `classrooms`: Physical facilities, capacity limits, power outlets.
  - `cohorts` & `cohort_memberships`: Cohort metadata, fixed timetables, student enrollments.
  - `class_sessions` & `session_bookings`: Synchronous virtual/physical class schedules, atomic seat reservation locking.
  - `attendance_records`: Compliance tracking distinguishing physical vs virtual attendance.
  - `project_submissions` & `grades`: Capstone project repository links, demo URLs, and rubric evaluations.
  - `certificates`: Official tamper-evident credentials with codes (`SKILLUP-2026-XXXX`).
  - `payments` & `notification_dispatches`: Multi-enrolment payment reconciliation and durable Brevo idempotency outbox.

### 1.4 API Endpoints Created / Extended
- `/api/programmes`: Public academic programmes, tracks, and curriculum listings.
- `/api/campuses`: Campus and classroom capacity management.
- `/api/campuses/[campusId]/classrooms`: Classroom inventory management.
- `/api/cohorts`: Cohort creation and fixed timetable summaries.
- `/api/sessions`: Class scheduling and calendar retrieval.
- `/api/sessions/[sessionId]/book`: Atomic seat reservation using PostgreSQL row locks (`SELECT FOR UPDATE`).
- `/api/sessions/[sessionId]/attendance`: Roster generation and one-click attendance check-in.
- `/api/certificates/issue`: Graduation clearance evaluation and certificate generation.
- `/api/certificates/verify/[code]`: Public credential verification API.
- `/api/admin/installments`: Tuition installment schedule tracking and Brevo reminder dispatch.
- `/api/auth/guardian-consent`: Minor student parent consent verification and dispatch.
- `/api/student/messages`: In-player direct academic messaging to instructors.
- `/api/student/programmes`: Multi-enrolment student querying.

### 1.5 Frontend Views & Components Created / Enhanced
- `components/skillup/dual-pathways-section.tsx`: Interactive dual-pathway discovery section on the Home page.
- `app/(public)/verify/page.tsx`: Public certificate verification lookup portal.
- `app/(public)/verify/[code]/page.tsx`: Official verified diploma certificate view.
- `app/admin/campuses/page.tsx`: Admin campus & computer lab management console.
- `app/admin/cohorts/page.tsx`: Admin cohort & fixed timetable scheduling console.
- `app/admin/payments/installments/page.tsx`: Admin tuition installment finance console.
- `app/instructor/attendance/page.tsx`: Faculty instructor live attendance & roster check-in console.
- `app/dashboard/courses/[courseId]/learn/page.tsx`: Enhanced lesson player with in-player academic inquiry drawer.
- `components/auth/guided-student-registration-form.tsx`: Rebranded multi-step registration with BYOL acknowledgement and minor safeguarding.

---

## 2. Brand Identity & Design Tokens

- **Russian Violet**: `#231651` (Primary headings, high-contrast dark accents)
- **Deep Night Plum**: `#150C33` (Console sidebars, deep dark backgrounds)
- **Electric Violet**: `#613399` (Brand accents, badges, primary CTA highlights)
- **Mint Green**: `#D6FFF6` (Secondary pills, highlight badges, success badges)
- **Emerald Text**: `#0A5C4A` (High-contrast text on mint surfaces, exceeding WCAG AA 4.5:1)
- **Soft Ice Lavender**: `#E8E3F5` (Card borders, subtle tint backgrounds)
- **White**: `#FFFFFF` (Surface cards, readable text on dark backgrounds)
- **Light Canvas**: `#F8FAFB` (Main page backgrounds)

---

## 3. Maintenance & Runbook Commands

```bash
# Start development server
npm run dev

# Run comprehensive academic test suite (Phases 3–7)
npm run test:academic

# Run Brevo transactional email & idempotency test suite
npm run test:email

# Run RBAC security and catalog safety tests
npm run test:security

# Run Paystack payment verification tests
npm run test:payments

# Run Turbopack production build check
npm run build
```
