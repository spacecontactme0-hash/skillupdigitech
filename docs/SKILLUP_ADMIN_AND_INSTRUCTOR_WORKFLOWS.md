# SKILLUP DIGITECH ACADEMY — ADMINISTRATIVE & INSTRUCTOR WORKFLOWS

> **Document ID:** SDA-AIW-007  
> **Version:** 1.0.0  
> **Status:** Proposed — For Architecture Review & Management Approval  
> **Date:** 15 November 2026  
> **Platform:** SkillUp Digitech Academy (`skillup-digitech.com.ng`)  

---

## 1. Role-Based Access Control (RBAC) Matrix

SkillUp Digitech Academy enforces strict authorization boundaries across four administrative and operational roles:

| Action / Capability | Student | Instructor | Admin | Finance |
| :--- | :---: | :---: | :---: | :---: |
| View Enrolled Courses & Submit Work | ✅ | ❌ | ✅ (Audit) | ❌ |
| Create / Edit Master Courses & Lessons | ❌ | ✅ (Authored) | ✅ (All) | ❌ |
| Create / Manage Academic Programmes & Cohorts | ❌ | ❌ | ✅ | ❌ |
| Configure Physical Campus & Classrooms | ❌ | ❌ | ✅ | ❌ |
| Modify Cohort Timetable & Reschedule Sessions | ❌ | ❌ | ✅ | ❌ |
| Take Physical / Virtual Class Attendance | ❌ | ✅ (Assigned) | ✅ | ❌ |
| Grade Assignments & Capstone Projects | ❌ | ✅ (Assigned) | ✅ | ❌ |
| Approve Graduation & Issue Verified Certificates | ❌ | ❌ | ✅ | ❌ |
| View Financial Ledgers & Reconcile Payments | ❌ | ❌ | ✅ | ✅ |
| Configure Pricing Packages & Payment Plans | ❌ | ❌ | ✅ | ✅ |
| Modify Academic Grades or Attendance Records | ❌ | ✅ (Audited) | ✅ (Audited) | ❌ (Strictly Denied)|

---

## 2. Administrative Workflows (`/admin`)

### 2.1 Academic Programme & Pathway Management (`/admin/programmes`)
- **Create / Edit Programmes:** Administrators define programme title, type (`career_readiness` vs `skill_acquisition`), permitted delivery modes, and graduation rules.
- **Manage Career Pathways:** Define pathways under Career Readiness (AI Engineer, Software Engineer, Social Media Management).
- **Map Course Bundles:** Associate master courses with programmes/pathways, assigning course roles (`foundation`, `core`, `supporting`, `elective`).

### 2.2 Physical Centre & Classroom Management (`/admin/campuses`)
- **Campus Setup:** Manage campus details (Enugu Campus), physical address, contact telephone, and facility emergency notes.
- **Classroom / Lab Configuration:** Define laboratory rooms (e.g., *Lab 1 - Turing Room*), maximum safe seating capacity, power drop outlets, and equipment.
- **Centre Closure Dates:** Configure public holidays or maintenance closures, automatically blocking physical session scheduling on those dates.

### 2.3 Cohort & Timetable Management (`/admin/cohorts`)
- **Cohort Creation:** Associate cohort with a programme and delivery arrangement (e.g., `SE-2026-Q1-HYB`). Assign start/end dates, max seating limit, and assigned instructors.
- **Timetable Configuration:** Set recurring weekly session rules (e.g., Wednesday Virtual 17:00–19:00, Saturday Physical 10:00–14:00).
- **Session Rescheduling & Cancellation:** Move sessions, record reason, and trigger automated Brevo notification dispatch.

### 2.4 Student Registry & Safeguarding Oversight (`/admin/students`)
- **Student Dossier:** View complete academic history across all enrolments, attendance percentage, assignment grades, and payment status.
- **Guardian Consent Audit:** Review pending parental consent requests for minor learners (13–18), with options to resend verification or manually verify after phone contact.

---

## 3. Instructor Workflows (`/instructor`)

### 3.1 Cohort Rosters & Class Session Console (`/instructor/courses`)
- Instructors view only their assigned cohorts and master courses.
- Access lesson materials, student submission queues, and scheduled upcoming live virtual and physical sessions.

### 3.2 Live & Physical Attendance Recording (`/instructor/attendance`)
- Open the session attendance roster for the scheduled date.
- One-click status toggling: `Present`, `Absent`, `Excused`, `Late`.
- For physical classes: verifies physical presence in the lab.
- Saves attendance atomically; immediately updates student dashboard attendance progress.

### 3.3 Assignment & Capstone Grading Queue (`/instructor/evaluations`)
- Reviews student project submissions (GitHub repository URL, deployed demo URL, video walkthrough).
- Evaluates against the configured **Rubric Matrix** (e.g., Code Quality 30%, Functionality 40%, Documentation 15%, UI/UX 15%).
- Provides inline feedback and formal grade. If grade < 70%, permits requesting a revision.

### 3.4 Student Support & Inquiry Helpdesk (`/instructor/support`)
- Safe, moderated messaging channel for student academic questions.
- Minor student communications are logged and accessible to academic administrators for safeguarding compliance.

---

## 4. Finance Workflows (`/finance`)

### 4.1 Payment Ledger & Plan Monitoring (`/finance/transactions`)
- Real-time ledger of verified Paystack transactions across full payments and installment deposits.
- Filter by programme, cohort, delivery arrangement, or student.

### 4.2 Installment Arrears & Alert Triggering (`/finance/installments`)
- View upcoming and overdue installment balances.
- Trigger automated Brevo reminder emails for pending balances.

### 4.3 Paystack Reconciliation & Webhook Audit (`/finance/reconciliation`)
- Audit webhook event delivery, inspect signature validation logs, and manually reconcile any unconfirmed payments against the Paystack transaction API.
