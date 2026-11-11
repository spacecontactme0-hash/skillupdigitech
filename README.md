# SkillUp DigiTech Academy — Learning Management System

[![Next.js 16](https://img.shields.io/badge/Next.js-16.1.6-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.2.0-blue.svg?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-336791.svg?style=flat&logo=postgresql)](https://neon.tech/)
[![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-C5F74F.svg?style=flat)](https://orm.drizzle.team/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-CSS%20v4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests Passing](https://img.shields.io/badge/Tests-64%2F64%20Passing-success.svg?style=flat)]()

**Live Website:** [https://skillup-digitech.com.ng](https://skillup-digitech.com.ng)

**SkillUp DigiTech Academy** is a full-stack, enterprise-grade Learning Management System (LMS) built with Next.js App Router, TypeScript, Neon Serverless PostgreSQL, and Drizzle ORM. Engineered specifically for technology training and practical skills acquisition, the platform provides end-to-end capabilities across course authoring, curriculum delivery, anti-cheat assessments, multi-attempt assignment workflows, capstone project evaluation, auditable grading, multi-currency commerce, and role-based administration.

---

## Table of Contents

1. [Platform Overview & Key Capabilities](#platform-overview--key-capabilities)
2. [Role-Based Features](#role-based-features)
   - [Student Experience](#1-student-experience-dashboard)
   - [Instructor Workspace](#2-instructor-workspace-instructor)
   - [Administration Console](#3-administration-console-admin)
   - [Finance & Operations](#4-finance--operations-finance)
3. [Academic Persistence & Evaluation Engine](#academic-persistence--evaluation-engine)
4. [Technology Stack](#technology-stack)
5. [Database Architecture & Schema](#database-architecture--schema)
6. [API Route Catalog](#api-route-catalog)
7. [Getting Started & Local Development](#getting-started--local-development)
8. [Automated Verification & Testing](#automated-verification--testing)
9. [Environment Variables Reference](#environment-variables-reference)
10. [Production Deployment](#production-deployment)

---

## Platform Overview & Key Capabilities

- **100% PostgreSQL-Native Architecture:** Fully backed by Neon Serverless PostgreSQL via connection-pooled Drizzle ORM. Complete zero-dependency isolation from legacy MongoDB.
- **Persistent Academic Workflows:** Quiz attempts, answer submissions, assignment deliverables, multi-dimensional rubrics, instructor grades, grade revision history, and capstone submissions are persistently stored in relational tables.
- **Server-Side Anti-Cheat Quiz Engine:** Student clients receive masked question sets without answer keys. All evaluation, score calculation, attempt limits, and passing thresholds run securely on the server.
- **Auditable Grading & Rubric System:** Instructors grade submissions using custom criterion weights. Any subsequent grade changes automatically record previous vs. new scores, feedback diffs, instructor ID, and change justification in an immutable audit table.
- **Multi-Currency Commerce & Paystack Integration:** Native support for multi-currency pricing (NGN, USD, EUR, GBP) with Paystack gateway processing, HMAC-SHA512 webhook signature verification, atomic enrollment activation, and duplicate-event idempotency.
- **Strict Role-Based Access Control (RBAC):** Server-side route handlers, edge proxies, and dashboard shells enforce separation between Student, Instructor, Admin, and Finance roles, preventing privilege escalation.
- **Email OTP & Password Security:** Transactional onboarding and verification via Resend, time-limited OTP codes, secure bcrypt password hashing (10 salt rounds), and fail-closed JWT session tokens.
- **Verifiable Digital Credentials:** Dynamic certificate generation upon course completion with cryptographically unique verification codes and public verification endpoints.

---

## Role-Based Features

### 1. Student Experience (`/dashboard`)

- **Course Discovery & Catalog:** Real-time search, multi-category taxonomy (Full-Stack, Cloud & DevOps, AI/ML, Cybersecurity, UI/UX, etc.), difficulty levels, and currency switching.
- **Interactive Course Player (`/dashboard/courses/[id]/learn`):** Unified learning console with curriculum drawer, responsive video player, markdown/HTML article reader, and automatic progress calculation.
- **Server-Side Quizzes:** In-player quiz runner with live countdown timer, persistent attempt tracking, masked answer verification, and immediate feedback upon passing.
- **Assignment Submissions:** Multi-attempt submission pipeline supporting text notes and external artifact URLs (GitHub repositories, Figma design files, live project URLs).
- **Capstone Project Hub:** Real-world final project deliverables with repository links, live deployment URLs, and architecture notes.
- **Grades & Instructor Feedback:** Student view of published numerical scores, criterion-by-criterion rubric breakdowns, and personalized instructor commentary.
- **Digital Certificates (`/dashboard/certificates`):** Automated certificate issuance upon completing all lessons and passing required assessments, downloadable with tamper-proof validation IDs.
- **Shopping Cart & Checkout (`/checkout`):** Multi-item cart, instant payment checkout via Paystack popup or redirect, and payment receipts.

### 2. Instructor Workspace (`/instructor`)

- **Course Curriculum Builder:** Dynamic creation of courses, modules, and lessons (video lectures, rich articles, quizzes, assignments).
- **Quiz Authoring Engine:** Setup questions, multiple-choice options, point weights, passing score thresholds, and time limits.
- **Rubrics & Criteria Designer:** Custom evaluation rubrics with individual criterion titles, descriptions, and point allocations.
- **Evaluation & Grading Console (`/instructor/evaluations`):** Queue of student assignment and capstone submissions with inline artifact review.
- **Grade Revision Tracking:** Automated history logging on grade edits, requiring a reason for change and preserving historical score audits.
- **Instructor Analytics:** Student enrollment figures, completion rates, and average quiz scores across published courses.

### 3. Administration Console (`/admin`)

- **Platform Analytics (`/admin/analytics`):** Real-time aggregate metrics including total revenue, active enrollments, course completions, and active users.
- **User Management (`/admin/users`):** Complete user administration with role assignments (Student, Instructor, Admin, Finance) and account activation controls.
- **Course Approvals (`/admin/courses`):** Content moderation workflow to review, approve, reject, or publish instructor-created courses and individual lessons.
- **Category & Taxonomy Management (`/admin/categories`):** Non-destructive catalog organization and technology category curation.
- **System Configuration (`/admin/settings`):** Global site settings, notification policies, contact addresses, and feature toggles persisted to PostgreSQL `app_settings`.
- **Administrative Audit Logs (`/admin/logs`):** Append-only audit trail logging administrative logins, user creations, course approvals, and settings changes.
- **Safe Bootstrap Initializer:** Idempotent bootstrap administration credentials with fail-closed protection against unauthorized elevation.

### 4. Finance & Operations (`/finance`)

- **Revenue Reports (`/finance/reports`):** Daily, weekly, and monthly revenue breakdowns across currencies.
- **Transaction Inspection (`/finance/transactions`):** Full Paystack reference history, customer email matching, payment statuses, and channel logs.
- **Payment Verification Tool (`/admin/payments/verify`):** Manual verification and reconciliation tool for offline or disputed payments.
- **Webhook Audit Logs:** Record of every `charge.success` event payload stored in PostgreSQL `payment_events` for accounting reconciliation.

---

## Academic Persistence & Evaluation Engine

The academic persistence engine guarantees that student submissions and grading records are never lost to browser refreshes or session timeouts:

```mermaid
erDiagram
    USERS ||--o{ QUIZ_ATTEMPTS : "takes"
    COURSES ||--o{ QUIZ_ATTEMPTS : "contains"
    QUIZZES ||--o{ QUIZ_ATTEMPTS : "evaluates"

    USERS ||--o{ ASSIGNMENT_SUBMISSIONS : "submits"
    COURSES ||--o{ ASSIGNMENT_SUBMISSIONS : "contains"
    ASSIGNMENTS ||--o{ ASSIGNMENT_SUBMISSIONS : "receives"

    COURSES ||--o{ RUBRICS : "defines"
    ASSIGNMENTS ||--o| RUBRICS : "guided by"
    PROJECTS ||--o| RUBRICS : "guided by"

    ASSIGNMENT_SUBMISSIONS ||--o| GRADES : "evaluated as"
    PROJECT_SUBMISSIONS ||--o| GRADES : "evaluated as"
    USERS ||--o{ GRADES : "receives / issues"

    GRADES ||--o{ GRADE_HISTORY : "tracks revisions"
    USERS ||--o{ GRADE_HISTORY : "audited by"

    COURSES ||--o{ PROJECTS : "assigns"
    USERS ||--o{ PROJECT_SUBMISSIONS : "develops"
    PROJECTS ||--o{ PROJECT_SUBMISSIONS : "contains"
```

1. **`quiz_attempts`**: Persistent record of every quiz session with start time, completion timestamp, calculated score, passing state, and submitted answer keys.
2. **`assignment_submissions`**: Multi-attempt submissions tracking text answers, external artifact URLs (GitHub, Figma, Google Drive), and attempt numbers.
3. **`rubrics`**: Structured evaluation matrices linked to assignments or capstone projects with customizable criteria and weights.
4. **`grades`**: Published evaluations containing numerical score, total possible points, rubric item breakdown, and written instructor feedback.
5. **`grade_history`**: Immutable ledger of all score adjustments, capturing previous vs. updated scores, feedback changes, instructor identity, and revision reason.
6. **`projects` & `project_submissions`**: Capstone briefs, requirements, repository links, live demo links, and artifact metadata.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework & Core** | **Next.js 16.1.6** (App Router, Turbopack), **React 19.2.0**, **TypeScript 5** |
| **Database & ORM** | **Neon Serverless PostgreSQL**, **Drizzle ORM 0.45.3**, `pg` Connection Pooler |
| **Styling & UI** | **Tailwind CSS v4**, **shadcn/ui**, **Radix UI Primitives**, **Framer Motion 12**, **Lucide Icons** |
| **State & Forms** | **Zustand 5**, **React Hook Form 7**, **Zod 3.25** validation |
| **Authentication & AuthZ** | **JWT (jsonwebtoken)**, **bcryptjs** (10 salt rounds), Role-Based Middleware |
| **Payments** | **Paystack API** (Multi-currency NGN/USD/EUR/GBP, HMAC-SHA512 Webhooks) |
| **Communications** | **Resend** transactional emails and OTP delivery |
| **Analytics & Monitoring** | **@vercel/analytics**, PostgreSQL `admin_logs` and `payment_events` |

---

## Database Architecture & Schema

The PostgreSQL database encompasses 26 relational tables managed via Drizzle migrations:

- **Core Tables:** `users`, `pending_registrations`, `categories`, `courses`, `course_modules`, `lessons`, `enrollments`, `payments`, `payment_events`, `certificates`, `learning_notes`, `admin_logs`, `app_settings`.
- **Academic Tables:** `quiz_attempts`, `assignment_submissions`, `rubrics`, `grades`, `grade_history`, `projects`, `project_submissions`.

### Running Schema Migrations

```bash
# Generate migration files from Drizzle schema
npm run db:generate

# Execute migration scripts against PostgreSQL
npm run db:migrate-schema
```

### Seeding Technology Taxonomy

The platform includes an idempotent, non-destructive catalog seed utility:

```bash
# Dry run (read-only audit without writing to the database)
npm run db:seed:dry-run

# Execute seed writes for technology categories
npm run db:seed
```

---

## API Route Catalog

```
Authentication & Accounts
  POST   /api/auth/register                   - Self-service student registration with OTP initiation
  POST   /api/auth/register-instructor        - Instructor registration request
  POST   /api/auth/verify-otp                 - Verify OTP and activate student account
  POST   /api/auth/resend-otp                 - Resend time-limited OTP
  POST   /api/auth/login                      - Authenticate user and issue signed JWT cookie/token
  POST   /api/auth/logout                     - Invalidate session
  GET    /api/auth/me                         - Retrieve authenticated profile and permissions
  POST   /api/auth/forgot-password            - Request password reset OTP
  POST   /api/auth/reset-password             - Complete password reset with verified token

Course Catalog & Learning
  GET    /api/courses                         - Search and filter published courses
  GET    /api/courses/[id]                    - Retrieve course details, curriculum, and lessons
  POST   /api/courses                         - Create course (Instructor/Admin)
  PUT    /api/courses/[id]                    - Update course metadata and curriculum
  GET    /api/categories                      - List course taxonomy categories
  GET    /api/enrollments                     - Retrieve user enrolled courses
  PATCH  /api/enrollments/[id]/progress       - Persist lesson completion and progress percentage

Persistent Academic Workflows
  POST   /api/courses/[id]/quizzes/[quizId]/attempt              - Start new quiz attempt (returns masked questions)
  GET    /api/courses/[id]/quizzes/[quizId]/attempt              - Fetch active attempt status or masked question list
  POST   /api/courses/[id]/quizzes/[quizId]/attempt/[attemptId]  - Submit quiz answers for trusted server scoring
  POST   /api/courses/[id]/assignments/[id]/submissions          - Submit assignment deliverable (multi-attempt)
  POST   /api/courses/[id]/projects                              - Author course capstone project (Instructor)
  POST   /api/courses/[id]/projects/[id]/submissions             - Submit capstone repository and demo URLs
  POST   /api/courses/[id]/rubrics                               - Create grading rubric with criteria
  POST   /api/courses/[id]/submissions/[id]/grade                - Issue or revise grade with audit history logging
  GET    /api/courses/[id]/submissions/[id]/grade                - Retrieve published grade and rubric evaluation

Payments & Commerce
  POST   /api/payments/initialize             - Initialize Paystack payment transaction
  GET    /api/payments/verify                 - Verify transaction status via Paystack reference
  POST   /api/payments/webhook                - Paystack webhook handler (HMAC-SHA512 verified)
  POST   /api/payments/reconcile              - Manual transaction reconciliation (Finance/Admin)

Administration & Operations
  GET    /api/admin/settings                  - Retrieve global application configuration
  PUT    /api/admin/settings                  - Update site name, policies, and notifications
  GET    /api/admin/logs                      - Retrieve append-only administrative audit log
  POST   /api/admin/create-user               - Provision managed user account (Admin)
  GET    /api/admin/payments/verify           - Administrative payment search and audit
  POST   /api/certificates                    - Issue verifiable completion certificate
```

---

## Getting Started & Local Development

### Prerequisites

- **Node.js**: v18.18+ or v20+
- **Package Manager**: `pnpm` (recommended, version 10.11.1) or `npm`
- **PostgreSQL Database**: A local instance or a free [Neon](https://neon.tech/) serverless PostgreSQL database

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/v0-lms-with-mongo-db.git
   cd v0-lms-with-mongo-db
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   *Edit `.env.local` to provide your PostgreSQL connection strings and API keys (see [Environment Variables Reference](#environment-variables-reference)).*

4. **Run schema migrations:**
   ```bash
   npm run db:migrate-schema
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Automated Verification & Testing

The repository maintains an automated test suite verifying database integrity, security boundaries, payment correctness, and academic persistence:

| Test Suite | Command | Scope |
| :--- | :--- | :--- |
| **Academic Persistence** | `npm run test:academic` | Verifies quiz lifecycle, anti-cheat question masking, server-side scoring, assignment attempts, rubrics, and grade revision history. |
| **Staging Runtime Verification** | `npm run test:staging-verify` | Confirms strict PostgreSQL execution, zero MongoDB routing, admin bootstrap idempotency, and audit logs. |
| **End-to-End User Journeys** | `npm run test:staging-e2e` | Simulates full Student, Instructor, Admin, and Payments lifecycle journeys against the database. |
| **Payments Integration** | `npm run test:payments` | Validates Paystack currency conversions, subunit math, email casing, and manual review triggers. |
| **Security & RBAC** | `npm run test:security` | Tests password hashing (bcrypt), privilege escalation rejection, and unauthorized route access. |
| **Type Checking** | `npx tsc --noEmit` | Strict TypeScript compiler validation across the entire codebase. |
| **Code Linting** | `npm run lint` | ESLint rules for Next.js App Router and React best practices. |
| **Production Build** | `npm run build` | Next.js production build compiling all 89 App Router routes cleanly. |

**Current Test Status:** **64 / 64 automated tests passing (100% pass rate).**

---

## Environment Variables Reference

Create a `.env.local` file with the following variables:

```bash
# Database Configuration (Neon Serverless PostgreSQL)
DATABASE_BACKEND=postgres
DATABASE_URL=postgresql://neondb_owner:password@ep-your-endpoint-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:password@ep-your-endpoint.us-east-2.aws.neon.tech/neondb?sslmode=require
PG_MAX_POOL_SIZE=10

# Application Branding & URLs
NEXT_PUBLIC_APP_NAME="SkillUp DigiTech Academy"
NEXT_PUBLIC_APP_URL="https://skillup-digitech.com.ng"

# Authentication & Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# Initial Bootstrap Administrator (Provisions admin on first login)
BOOTSTRAP_ADMIN_EMAIL=admin@skillup-digitech.com.ng
BOOTSTRAP_ADMIN_PASSWORD=your-secure-admin-password
ADMIN_ACCOUNTS_EMAIL=admin@skillup-digitech.com.ng
ADMIN_ACCOUNTS_PASSWORD=your-secure-admin-password

# Paystack Payment Gateway
PAYSTACK_SECRET_KEY=sk_test_your_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_public_key
PAYSTACK_BASE_URL=https://api.paystack.co
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key

# Email & OTP (Resend)
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM=SkillUp DigiTech Academy <no-reply@skillup-digitech.com.ng>
OTP_EXPIRES_MINUTES=15
NEXT_PUBLIC_OTP_EXPIRES_MINUTES=15
OTP_RESEND_COOLDOWN_SECONDS=60
NEXT_PUBLIC_OTP_RESEND_COOLDOWN_SECONDS=60

# Onboarding Feature Toggles
FEATURE_SHARED_OTP_EXPERIENCE=true
NEXT_PUBLIC_FEATURE_SHARED_OTP_EXPERIENCE=true
FEATURE_ONBOARDING_ANALYTICS=true
NEXT_PUBLIC_FEATURE_ONBOARDING_ANALYTICS=true
FEATURE_POST_VERIFY_WELCOME=true
NEXT_PUBLIC_FEATURE_POST_VERIFY_WELCOME=true
```

---

## Production Deployment

### Deploying to Vercel with Neon PostgreSQL

1. **Push your code to GitHub / GitLab**.
2. **Import repository into Vercel**.
3. **Configure Environment Variables in Vercel**:
   - Set `DATABASE_BACKEND=postgres`
   - Set `DATABASE_URL` (pooled connection string from Neon) and `DATABASE_URL_UNPOOLED`
   - Set `JWT_SECRET`, `PAYSTACK_SECRET_KEY`, `RESEND_API_KEY`, and remaining keys from `.env.example`.
4. **Deploy**:
   - Vercel automatically runs `next build` with Turbopack.
5. **Post-Deployment Checks**:
   - Run `npm run db:migrate-schema` against the production database.
   - Verify initial administrator login with configured bootstrap credentials.
   - Map custom domain: **`skillup-digitech.com.ng`** in Vercel project domain settings.

---

## License

Proprietary — © SkillUp DigiTech Academy. All rights reserved.
Official Website: [https://skillup-digitech.com.ng](https://skillup-digitech.com.ng)
