# SKILLUP DIGITECH ACADEMY — PRODUCT REQUIREMENTS DOCUMENT (PRD)

> **Document ID:** SDA-PRD-001  
> **Version:** 1.0.0  
> **Status:** Proposed — For Architecture Review & Management Approval  
> **Date:** 15 November 2026  
> **Platform:** SkillUp Digitech Academy (`skillup-digitech.com.ng`)  
> **Target Baseline:** Next.js 16.1.6 App Router, React 19.2, TypeScript 5, Neon PostgreSQL, Drizzle ORM, Brevo, Paystack  

---

## 1. Executive Summary & Vision

SkillUp Digitech Academy is a **digital-first technology academy with a high-standard physical learning centre**. The academy provides practical, industry-aligned technology education combining:
1. Structured digital learning roadmaps and resources.
2. Instructor-led pre-recorded technical lessons.
3. Scheduled live virtual classes.
4. Structured physical classes and hands-on laboratory workshops.
5. Practical portfolio assignments and rigorous capstone evaluations.
6. Industry practitioner mentorship and academic grading.
7. Verified institutional credentials and graduation certification.

### Core Architectural Principle
> **ONE LEARNER. ONE ACCOUNT. MULTIPLE ENROLMENTS. ONE CONNECTED SKILLUP EXPERIENCE.**

A student never creates multiple accounts for online, hybrid, or physical learning. A single authenticated identity maintains multiple active programme enrolments, each with its own delivery arrangement, academic progression, payment schedule, and certification track.

---

## 2. Academic Programmes & Delivery Models

The platform strictly decouples an **Academic Programme** from its **Delivery Arrangement**.

```mermaid
flowchart TD
    subgraph Academic Programmes
        CR[Career Readiness Programme]
        SA[Skill Acquisition Programme]
    end

    subgraph Career Pathways
        AI[AI Engineer]
        SE[Software Engineer]
        SMM[Social Media Management]
    end

    subgraph Delivery Arrangements
        ONL[Online]
        HYB[Hybrid]
    end

    subgraph Physical Centre
        BYOL[BYOL: Student Brings Laptop]
        FAC[Academy Provides Power & Internet]
        CAP[Safe Seating Capacity Limit]
    end

    CR --> AI & SE & SMM
    AI & SE & SMM --> ONL & HYB
    SA --> ONL
    SA -.->|Optional Workshop Add-on| HYB
    HYB --> Physical Centre
```

### 2.1 Programme 1: Career Readiness
- **Purpose:** Full career transformation pathways preparing students for professional engineering and technology roles.
- **Available Pathways:**
  1. **AI Engineer**
  2. **Software Engineer**
  3. **Social Media Management**
- **Permitted Delivery Arrangements:**
  - **Online:** Complete remote curriculum, recorded lessons, scheduled virtual classes, online lab assignments, remote instructor feedback, capstone project, and certification.
  - **Hybrid:** Identical academic syllabus combined with **fixed physical class days** at the academy's learning centre for practical workshops, collaborative coding, and in-person mentorship.

### 2.2 Programme 2: Skill Acquisition
- **Purpose:** Targeted technology skill development for secondary school students, university students, and professionals wanting a specific competency.
- **Delivery Arrangement:** **Online-First** standard arrangement.
- **Curriculum Catalogue (10 Approved Master Courses):**
  1. *Basic Digital Literacy* (Complimentary foundation course)
  2. *Basic AI 101* (Complimentary foundation course)
  3. *AI Engineering* (Specialist / Career Track)
  4. *AI Automation* (Specialist)
  5. *Frontend Development* (Specialist / Career Track)
  6. *Backend Development* (Specialist / Career Track)
  7. *Digital Marketing* (Specialist)
  8. *Graphic Design* (Specialist)
  9. *Video Editing* (Specialist)
  10. *Social Media Management* (Specialist / Career Track)
- **Automatic Complimentary Bundling:** Every paid Skill Acquisition course automatically includes complimentary access to **Basic AI 101** and **Basic Digital Literacy**.
- **Optional Physical Workshop Add-on:** Online Skill Acquisition learners can book scheduled physical weekend workshops or practical labs without converting their programme into a hybrid enrolment.

---

## 3. Physical Centre Operating Model

### 3.1 Single Physical Centre Operation
The platform initially configures and operates a **single physical learning centre**, with schema abstractions (`campuses`, `classrooms`) designed to scale to multi-campus operations without future database restructuring.

### 3.2 Bring Your Own Laptop (BYOL) Policy
- **Student Obligation:** All students attending physical classes or workshops **must bring their own suitable laptop**. The academy does not supply or rent individual laptops.
- **Academy Facility Obligation:** The academy guarantees **uninterrupted electricity** (grid + backup inverter/generator) and **high-speed internet connectivity**.
- **Mandatory Registration Acknowledgement:** Students enrolling in any arrangement with physical attendance must review and check an explicit legal acknowledgement before proceeding to checkout:
  > *"I understand that I am required to bring my own suitable laptop for physical classes at SkillUp Digitech Academy. I understand that the academy provides electricity and internet connectivity at its physical learning centre but does not guarantee a laptop for my use."*
- **Parental Acknowledgment:** For secondary school learners (<18), the parent/guardian must also acknowledge the BYOL requirement during consent intake.

### 3.3 Safe Physical Capacity & Overbooking Prevention
- Physical capacity is governed strictly by **classroom seating capacity**, power station outlets, and instructor-to-student safety ratios.
- **Online volume must never inflate physical capacity.**
- Database transactions enforce seat allocation using PostgreSQL row-level locks (`SELECT ... FOR UPDATE`) during booking and checkout.

---

## 4. Hybrid Timetable Policy

1. **Fixed Academy-Published Timetable:**
   - Hybrid students **do not choose arbitrary physical attendance days**.
   - The academy assigns fixed class days to each cohort (e.g., Wednesdays 17:00–19:00 Virtual; Saturdays 10:00–14:00 Physical Lab).
2. **Administrator Timetable Modifications:**
   - Future term schedules can be modified by authorized administrators.
   - Timetable changes preserve historical session records and automatically dispatch Brevo email notifications to affected students and instructors.
3. **Activity-Level Separation:**
   - Watching recorded instructor videos is an asynchronous learning activity and **never constitutes live class attendance**.
   - Live virtual attendance and physical attendance are recorded through distinct channels.

---

## 5. Controlled Learning Activity Classifications

| Activity Type | Channel | Tracking & Attendance Treatment |
| :--- | :--- | :--- |
| **Recorded Instructor Video** | Asynchronous Web/App | Track playback duration, progress percentage, completion timestamp. |
| **Live Virtual Class** | Synchronous Video Room | Track live virtual join, duration, participation log. |
| **Physical Class** | In-Person Learning Centre | Instructor marks physical attendance roster / QR check-in. |
| **Physical Practical Workshop** | In-Person Lab | Physical attendance verified against laboratory seat booking. |
| **Virtual Workshop** | Synchronous Lab | Virtual attendance verified against workshop registration. |
| **Simultaneous Hybrid Session** | In-Person + Remote | Bi-channel attendance recording (indicates physical vs virtual channel). |
| **Assignment** | LMS Submission | Tracked via file/repo submission, rubric grading, instructor feedback. |
| **Project / Capstone Milestone** | LMS Submission | Evaluated against formal rubrics; required for graduation eligibility. |

---

## 6. Functional Requirements Matrix

| ID | Domain | Functional Requirement |
| :--- | :--- | :--- |
| **FR-01** | Identity | Maintain one persistent user account across multiple simultaneous or sequential enrolments. |
| **FR-02** | Registration | Offer guided selection: Programme -> Pathway/Course -> Delivery Mode -> Cohort -> BYOL Check -> Account. |
| **FR-03** | Safeguarding | Identify minor learners (13–18), collect guardian details, and dispatch verification email before full account enablement. |
| **FR-04** | Bundling | Automatically provision complimentary Basic AI 101 and Basic Digital Literacy upon paid Skill Acquisition enrollment. |
| **FR-05** | Scheduling | Display unified calendar combining asynchronous video, live virtual links, and physical centre timetables. |
| **FR-06** | Capacity | Block registration or session bookings when classroom seating limits are reached. |
| **FR-07** | Payments | Process Paystack payments (Full or Installment plans) isolated to specific programme enrolments. |
| **FR-08** | Email | Dispatch all transactional emails via Brevo with idempotent queue workers and retry schedules. |
| **FR-09** | Academic | Support rubric-based evaluation for assignments and capstones with revision cycles. |
| **FR-10** | Certification | Issue tamper-evident certificates with public cryptographic verification hashes upon academic clearance. |

---

## 7. Business Rules & Guardrails

1. **BR-01 (Delivery Validity):** Skill Acquisition standard delivery is strictly `online`. Physical activities are limited to optional `session_bookings`. Career Readiness allows `online` or `hybrid`.
2. **BR-02 (BYOL Lock):** No student may complete registration for a hybrid cohort without `byolAcknowledged: true`.
3. **BR-03 (Payment Isolation):** Payments made against Programme Enrolment A cannot reduce the outstanding balance of Programme Enrolment B.
4. **BR-04 (Graduation Gate):** Certificate issuance requires: (a) 100% core module completion, (b) passing grades on all required assignments, (c) passing score on Capstone Project, (d) min 75% attendance on compulsory physical/hybrid sessions.
5. **BR-05 (Minor Safeguards):** Minor accounts cannot participate in unmoderated 1-to-1 direct messaging with adult students or external parties.
