# PostgreSQL + Neon Database Setup Audit: Technology Academy LMS

**Audit Date:** November 11, 2026  
**Auditor:** Automated Agentic Systems Reviewer  
**Scope:** Repository-wide read-only evaluation of PostgreSQL, Neon, Drizzle ORM, database schema, migration processes, runtime dependencies, and serverless deployment readiness.  
**Mode:** Strict Read-Only Audit (Zero database mutations, zero package modifications, zero source code alterations).

---

## 1. Executive Summary

### Project Readiness for Fresh Neon PostgreSQL Database
The project architecture has completed its primary runtime migration away from MongoDB and is **structurally capable of running entirely on a fresh Neon PostgreSQL database**. The application's core API routes, authentication flows, academic systems (quizzes, assignments, rubrics, submissions, grades), payments, and administrative subsystems communicate with PostgreSQL via Drizzle ORM using a well-defined database abstraction layer.

However, several configuration discrepancies, outdated documentation templates, dangerous legacy migration scripts, and serverless connection nuances must be addressed to ensure complete operational stability.

### Overall Status: `READY WITH FIXES`

- **Core ORM & Schema:** Fully defined for PostgreSQL across 26 tables in Drizzle ORM with comprehensive SQL migration files (`0000_smooth_boomerang.sql` through `0003_equal_molly_hayes.sql`).
- **Runtime Routing:** `lib/db.ts` and `lib/postgres-db.ts` route 100% of API database calls to PostgreSQL when `DATABASE_BACKEND=postgres` or when a valid `DATABASE_URL` is supplied.
- **Fresh Database Safety:** `npm run db:migrate-schema` is safe and idempotent for fresh schema creation. In contrast, `npm run db:migrate` and `npm run db:check` are MongoDB data migration scripts that connect to MongoDB and must **never** be executed for a fresh setup.
- **Key Blockers / Gaps:** `.env.example` contains zero PostgreSQL documentation and still instructs users to configure MongoDB; `drizzle.config.ts` does not automatically load `.env.local` without external environment passing; `pg.Pool` connection pool defaults (`max: 20`) require serverless tuning for Vercel; and several residual healthcare-specific structures remain in type definitions and JSONB schemas.

---

## 2. Database Architecture

```
                       +-----------------------------------+
                       | Next.js App Router (app/api/...)  |
                       +-----------------+-----------------+
                                         |
                                         v
                         +-------------------------------+
                         |     lib/db.ts (Router)        |
                         | - Checks DATABASE_BACKEND     |
                         | - Verifies DATABASE_URL       |
                         +---------------+---------------+
                                         |
                                         v
                       +-----------------------------------+
                       |     lib/postgres-db.ts            |
                       | - Implements LMS Database API     |
                       | - Coordinates lib/academic-db.ts  |
                       +-----------------+-----------------+
                                         |
                                         v
                       +-----------------------------------+
                       |         db/client.ts              |
                       | - pg.Pool (Node PostgreSQL)       |
                       | - drizzle(pool, { schema })       |
                       +-----------------+-----------------+
                                         | (TLS / SSL)
                                         v
                       +-----------------------------------+
                       | Neon Serverless PostgreSQL        |
                       | - PgBouncer Pooled (App traffic)  |
                       | - Direct Compute (DDL Migrations) |
                       +-----------------------------------+
```

### Runtime Database Driver & ORM
- **ORM:** Drizzle ORM (`drizzle-orm` v0.45.3) configured for PostgreSQL dialect (`drizzle-orm/node-postgres`).
- **CLI Migration Tooling:** Drizzle Kit (`drizzle-kit` v0.31.11) with `dialect: "postgresql"`, outputting to `./db/migrations`.
- **Database Driver:** `pg` (`pg.Pool` v8.23.1).
- **Target Engine:** Neon Serverless PostgreSQL (PostgreSQL 16/17 compatible).
- **Connection Model:**
  - `db/client.ts` establishes a singleton `Pool` instance using `DATABASE_URL` or `POSTGRES_URL`.
  - Application queries pass through Drizzle ORM query builders (`db.select()`, `db.insert()`, etc.) mapped to strongly-typed TypeScript schemas.
  - Transactions use Drizzle's transactional engine (`db.transaction(...)`).

---

## 3. File-by-File Audit

| File Path | Configured Purpose | Evaluation & Status |
| :--- | :--- | :--- |
| `drizzle.config.ts` | Configures Drizzle Kit CLI for migrations and schema introspection. | **CORRECT WITH NOTE:** Specifies `dialect: "postgresql"`, `schema: "./db/schema/index.ts"`, `out: "./db/migrations"`, `casing: "snake_case"`. **Note:** It reads `process.env.DATABASE_URL ?? process.env.POSTGRES_URL` but does not invoke `dotenv` or `process.loadEnvFile`, meaning standalone CLI commands like `npx drizzle-kit ...` require `.env` or `--env-file .env.local`. |
| `db/schema/index.ts` | Barrel exporter combining core and academic schema definitions. | **CORRECT:** Correctly exports `* from "./core"` and `* from "./academic"`. |
| `db/schema/core.ts` | Defines core LMS schema tables, enums, indexes, and constraints. | **CORRECT:** 19 tables (`users`, `courses`, `lessons`, `payments`, etc.). Contains legacy MongoDB columns (`legacy_mongo_id`, `legacy_payload`), but all are nullable and safe. |
| `db/schema/academic.ts` | Defines technology academy academic tables. | **CORRECT:** 7 tables (`quiz_attempts`, `assignment_submissions`, `rubrics`, `grades`, `grade_history`, `projects`, `project_submissions`). Clean relational design with appropriate indexes. |
| `db/client.ts` | Creates and caches the `pg.Pool` and Drizzle client instance. | **CORRECT WITH RECOMMENDATION:** Implements automatic `.env.local` fallback loading via `process.loadEnvFile`. Creates singleton `Pool`. **Recommendation:** In serverless environments, store `poolInstance` on `globalThis` to prevent connection leaks during Next.js hot-reload development. |
| `lib/db.ts` | Dynamic database router choosing PostgreSQL, MongoDB, or Mock. | **CORRECT:** Enforces `isPostgresBackend()`. Protects against ambiguous configurations. Throws explicit errors in production if PostgreSQL is not configured. |
| `lib/postgres-db.ts` | Concrete implementation of the application data layer over Drizzle. | **CORRECT:** 1,389 lines implementing full application CRUD operations with strong Drizzle typing, automatic UUID generation, and seamless integration with `lib/academic-db.ts`. |
| `lib/academic-db.ts` | Concrete academic operations handler (grading, rubrics, projects). | **CORRECT:** 904 lines of PostgreSQL/Drizzle code implementing academic evaluation pipelines. |
| `lib/mongodb.ts` | Legacy MongoDB client and index initializers. | **LEGACY (ISOLATED):** Contains runtime guard `if (process.env.DATABASE_BACKEND !== "mongodb") throw new Error(...)`. Never invoked when running on PostgreSQL. |
| `lib/mongodb-db.ts` | Legacy MongoDB CRUD data access methods. | **LEGACY (ISOLATED):** Retained for historical reference; dynamically imported only if `DATABASE_BACKEND === "mongodb"`. |
| `lib/mock-db.ts` | In-memory mock database with seeded sample courses. | **DEV FALLBACK:** Used only in non-production environments when no database URL is supplied. |
| `scripts/migrate-postgres-schema.ts` | Applies Drizzle SQL migrations to PostgreSQL. | **SAFE FOR FRESH SETUP:** Uses `drizzle-orm/node-postgres/migrator`. Connects only to PostgreSQL, executes `./db/migrations/*.sql`, and tracks migrations in `drizzle.__drizzle_migrations`. Zero MongoDB interaction. |
| `scripts/migrate-mongodb-to-postgres.ts` | ETL script that transfers records from MongoDB to PostgreSQL. | **UNSAFE FOR FRESH SETUP:** Connects to MongoDB via `MongoClient`, extracts collections, and inserts data into PostgreSQL. **Must NOT be run.** |
| `scripts/migration-executor.ts` | Helper execution engine for the MongoDB-to-PostgreSQL pipeline. | **MIGRATION ONLY:** Subordinate helper module for `migrate-mongodb-to-postgres.ts`. |
| `scripts/seed-technology-catalog.ts` | Seeds technology categories into PostgreSQL. | **SAFE & IDEMPOTENT:** Safe catalog seeder. Defaults to `--dry-run`; only performs writes when explicitly invoked with `--execute`. Operates via `getDB()`. |
| `package.json` | Dependency manifest and project execution scripts. | **CORRECT WITH WARNING:** Contains valid dependencies for Drizzle and PostgreSQL. **Warning:** Defines `db:check` and `db:migrate` which point to the MongoDB migration pipeline. |
| `.env.example` | Template documenting required environment variables for developers. | **OUTDATED / DEFECTIVE:** Only lists legacy MongoDB variables (`MONGODB_URI`, `MONGODB_DB`). Does NOT list `DATABASE_URL`, `DATABASE_BACKEND`, or Neon settings. |
| `.gitignore` | Git exclusion rules. | **CORRECT:** Properly ignores `.env*`, `.vercel`, and `.neon`. |
| `.github/workflows/vercel-deploy.yml` | GitHub Actions production deployment pipeline for Vercel. | **CORRECT:** Implements secret verification, `pnpm` installation, `vercel pull`, `vercel build`, and `vercel deploy --prebuilt`. |

---

## 4. Schema Audit

The PostgreSQL schema consists of **26 tables** partitioned across `db/schema/core.ts` and `db/schema/academic.ts`.

### Table Inventory

```
+---------------------------------------------------------------------------------------------------+
| CORE SYSTEM (db/schema/core.ts)                                                                   |
+--------------------------+----------------------------------------------------+-------------------+
| Table Name               | Primary Key / Natural Key                          | Foreign Keys      |
+--------------------------+----------------------------------------------------+-------------------+
| users                    | id (text) / email (unique)                         | None              |
| pending_registrations    | id (text) / email (unique)                         | None              |
| categories               | id (text)                                          | None              |
| courses                  | id (text) / slug (unique)                          | instructor_id     |
| course_modules           | id (text)                                          | course_id         |
| lessons                  | id (text)                                          | course_id, module |
| enrollments              | id (text) / (user_id, course_id) (unique)          | user_id, course_id|
| payments                 | id (text) / reference (unique)                     | user_id           |
| payment_events           | id (text) / (reference, created_at) (unique)       | payment_id        |
| certificates             | id (text)                                          | user_id, course_id|
| quizzes                  | id (text)                                          | None              |
| quiz_questions           | id (text)                                          | quiz_id           |
| assignments              | id (text)                                          | None              |
| learning_notes           | id (text)                                          | user_id, course_id|
| admin_logs               | id (text)                                          | user_id           |
| onboarding_events        | id (text)                                          | user_id           |
| migration_audit          | id (text)                                          | None (ETL audit)  |
| table_relationships      | Composite (source_table, col, target_table, col)   | None (ETL audit)  |
| app_settings             | id (text)                                          | None              |
+--------------------------+----------------------------------------------------+-------------------+
| ACADEMIC EVALUATION (db/schema/academic.ts)                                                       |
+--------------------------+----------------------------------------------------+-------------------+
| quiz_attempts            | id (text)                                          | quiz, course, user|
| assignment_submissions   | id (text)                                          | course, user, less|
| rubrics                  | id (text)                                          | course_id         |
| grades                   | id (text) / (submission_type, sub_id) (unique)     | course, student,  |
|                          |                                                    | instructor        |
| grade_history            | id (text)                                          | grade_id, changed |
| projects                 | id (text)                                          | course_id         |
| project_submissions      | id (text) / (user_id, project_id) (unique)         | project, course,  |
|                          |                                                    | user              |
+--------------------------+----------------------------------------------------+-------------------+
```

### Constraints, Indexes & Relationships
1. **Referential Integrity:**
   - Cascade rules are not explicitly defined on Drizzle foreign keys; deletes default to RESTRICT in PostgreSQL.
   - `courses.instructor_id` references `users.id` with an explicit btree index `idx_courses_instructor_id`.
   - `enrollments` enforces a compound unique index `uniq_enrollments_user_course` on `(user_id, course_id)`, preventing duplicate course registrations.
   - `grades` enforces a compound unique index `uniq_grades_submission` on `(submission_type, submission_id)`.
2. **Missing / Unenforced Foreign Keys:**
   - In `db/schema/academic.ts`, `assignment_submissions.assignment_id` is defined as `text("assignment_id").notNull()` without `.references(() => assignments.id)`.
   - `rubrics.assignment_id` and `rubrics.project_id` lack direct foreign key constraints to `assignments.id` and `projects.id`.
   - `grades.submission_id` is a polymorphic reference pairing with `submission_type` ("assignment" | "project"); relational integrity is maintained at the application layer rather than the database constraint layer.
3. **Legacy Migration Artifacts in Fresh Tables:**
   - All 16 primary core tables contain a `legacy_mongo_id` column.
   - `users`, `payments`, `payment_events`, `admin_logs`, and `onboarding_events` contain a `legacy_payload` JSONB column.
   - **Impact on Fresh Database:** Harmless. In migration `0002_wet_skin.sql`, `legacy_mongo_id` was explicitly altered to `DROP NOT NULL`. In a fresh database, these columns will simply remain `NULL` or empty for newly created technology academy records.
   - `migration_audit` and `table_relationships` are utility tables created exclusively for the MongoDB migration process; in a fresh database, they will remain completely empty.
4. **Healthcare Terminology & Structures:**
   - `payment_type` enum (`db/schema/core.ts:25`) includes `'onsite_registration'` alongside `'course_purchase'`, originating from the previous onsite caregiver healthcare training cohorts.
   - `student_profile` (stored in JSONB in `users` and `pending_registrations`) utilizes TypeScript interface `StudentRegistrationProfile` (`lib/types.ts`), which contains:
     - `isHealthcareProfessional: boolean`
     - `preferredLocation: "enugu" | "abuja"`
   - In recent frontend refactoring, the UI has adapted `isHealthcareProfessional` to represent "Cross-Industry / Domain Transition" (e.g., students transitioning from healthcare/science into software engineering). However, the underlying attribute key remains a direct artifact of the former healthcare platform.

---

## 5. Migration Command Safety

| npm Script | Underlying Command Line | Operation Performed | Safe for Fresh Neon DB? |
| :--- | :--- | :--- | :--- |
| `npm run db:generate` | `drizzle-kit generate --config drizzle.config.ts` | Reads `./db/schema/index.ts`, calculates diff against `./db/migrations/meta`, and writes new `.sql` migration files. Does not touch any database. | **SAFE** (Development tool for generating migration files) |
| `npm run db:migrate-schema` | `tsx scripts/migrate-postgres-schema.ts` | Connects to PostgreSQL via `DATABASE_URL` and executes unapplied migrations from `./db/migrations`. Tracks applied files in `drizzle.__drizzle_migrations`. Zero MongoDB interaction. | **SAFE (PRIMARY INITIALIZER)** (The ONLY command that should be used to initialize the fresh database schema) |
| `npm run db:check` | `tsx --env-file .env.local scripts/migrate-mongodb-to-postgres.ts --dry-run` | Connects to MongoDB via `MONGODB_URI`, discovers collections, maps legacy ObjectIds, and produces a migration dry-run plan. | **DO NOT RUN** (Connects to MongoDB; irrelevant and unwanted for a fresh setup) |
| `npm run db:migrate` | `tsx --env-file .env.local scripts/migrate-mongodb-to-postgres.ts` | Connects to MongoDB, reads documents, and executes bulk transactional inserts into PostgreSQL. | **STRICTLY PROHIBITED** (Violates fresh database requirement; attempts to import old MongoDB data) |

### Migration Execution Safety Analysis
- `db/migrations/0000_smooth_boomerang.sql` creates types and initial core tables.
- `db/migrations/0001_next_randall.sql` adds `legacy_payload` columns.
- `db/migrations/0002_wet_skin.sql` creates `app_settings` and executes `DROP NOT NULL` on `legacy_mongo_id` across all tables.
- `db/migrations/0003_equal_molly_hayes.sql` creates all 7 academic evaluation tables.
- Because `db:migrate-schema` runs these 4 migration files in sequence inside a transaction, running `npm run db:migrate-schema` on an empty Neon database creates the complete, valid, 26-table schema with nullable legacy fields, ready for fresh application writes.

---

## 6. MongoDB Dependency Audit

| File Path | MongoDB / Mongoose Reference | Classification | Safety & Behavior |
| :--- | :--- | :--- | :--- |
| `lib/mongodb.ts` | Imports `MongoClient` from `mongodb`. Initializes connection promise. | **Legacy code not used by the new application** | Guarded by `if (process.env.DATABASE_BACKEND !== "mongodb") throw new Error(...)`. Never called when PostgreSQL is active. |
| `lib/mongodb-db.ts` | Imports `getCollection`, `ObjectId`. Implements MongoDB queries. | **Legacy code not used by the new application** | Only required dynamically if `DATABASE_BACKEND === "mongodb"`. Dormant in PostgreSQL mode. |
| `scripts/create-admin-finance.ts` | Imports `MongoClient`. Direct script to seed MongoDB admin. | **Legacy code not used by the new application** | Standalone script. Never executed by the Next.js runtime or build. |
| `scripts/migrate-mongodb-to-postgres.ts` | Imports `MongoClient`. Core MongoDB-to-PostgreSQL ETL orchestrator. | **Old migration-only code** | Only executed via `db:check` or `db:migrate`. Must not be run. |
| `scripts/migration-executor.ts` | Imports `ObjectId`, `MongoClient`. Implements ETL transformation logic. | **Old migration-only code** | Subordinate to `migrate-mongodb-to-postgres.ts`. |
| `scripts/migration-schema.ts` | Inspects core table configs for ETL verification. | **Old migration-only code** | Subordinate to `migrate-mongodb-to-postgres.ts`. |
| `lib/admin-settings.ts` | Dynamic fallback `const { getCollection } = await import("@/lib/mongodb")`. | **Legacy fallback (isolated)** | Guarded by `if (process.env.DATABASE_BACKEND !== "mongodb" || !process.env.MONGODB_URI) return`. In PostgreSQL mode, uses `getDB().getAppSettings()` and `getDB().setAppSettings()`. |
| `lib/campaign-config.ts` | Dynamic fallback `const { getCollection } = await import("@/lib/mongodb")`. | **Legacy fallback (isolated)** | Same guard as `admin-settings.ts`. Safe in PostgreSQL mode. |
| `lib/onsite-training-config.ts` | Dynamic fallback `const { getCollection } = await import("@/lib/mongodb")`. | **Legacy fallback (isolated)** | Same guard as `admin-settings.ts`. Safe in PostgreSQL mode. |
| `lib/db.ts` | Dynamic `require("./mongodb-db")` inside `getMongoDatabase()`. | **Router component** | Only evaluated if `DATABASE_BACKEND === "mongodb"`. In PostgreSQL mode, `isPostgresBackend()` returns `true` and routes directly to `getPostgresDatabase()`. |
| `package.json` | Dependency entry `"mongodb": "^7.0.0"`. | **Package dependency** | Unused at runtime in PostgreSQL mode, but required to avoid TypeScript compilation errors in legacy scripts unless those scripts are removed. |

**Summary:** There are **zero active MongoDB dependencies** in the runtime request path when `DATABASE_BACKEND=postgres` and `DATABASE_URL` are configured.

---

## 7. Environment Variables

### Required Variables for Fresh Neon PostgreSQL Setup

| Variable Name | Required At | Purpose / Destination | Usage Details |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Local & Vercel Runtime, Migrations | Neon Pooled Connection String | Read by `db/client.ts`, `drizzle.config.ts`, `lib/db.ts`. In production on Vercel, must use the Neon pooled endpoint (`*-pooler.*.neon.tech`). |
| `DATABASE_BACKEND` | Local & Vercel Runtime | Backend Engine Selector | Must be explicitly set to `"postgres"`. Prevents ambiguity errors in `lib/db.ts`. |
| `DATABASE_URL_UNPOOLED` | Local / CI (Optional) | Neon Direct Connection String | Direct connection to Neon compute. Ideal for heavy DDL operations or migration scripts. |
| `POSTGRES_URL` | Optional Alias | Alternative connection URL | Supported as a fallback by `db/client.ts` and `lib/db.ts`. |
| `PG_MAX_POOL_SIZE` | Optional | Connection Pool Concurrency Cap | Read by `db/client.ts`. Defaults to `20`. In Vercel serverless functions, should be configured to `1` or `2`. |
| `JWT_SECRET` | Local & Vercel Runtime | Authentication Token Signing | Required for user sessions and API authentication. |
| `BOOTSTRAP_ADMIN_EMAIL` | Local & Vercel Runtime | Initial Administrator Provisioning | Automatically bootstrapped as administrator upon first login. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Local & Vercel Runtime | Initial Administrator Credentials | Password used for initial administrator login. |

### Configuration Comparison: Local vs. Vercel Production

| Aspect | Local Development | Vercel Production Deployment |
| :--- | :--- | :--- |
| **File Location** | `.env.local` (ignored by Git) | Vercel Project Settings > Environment Variables |
| **Connection Pooling** | Works with either pooled or unpooled Neon URLs | **MUST use Pooled Connection String (`DATABASE_URL`)** to avoid exhausting connection limits under serverless concurrency |
| **CI / Build Pipeline** | Reads `.env.local` automatically via `process.loadEnvFile` | `vercel-deploy.yml` pulls environment variables via `npx vercel pull --environment=production` |
| **Backend Flag** | `DATABASE_BACKEND=postgres` | `DATABASE_BACKEND=postgres` (must be added to Vercel Project Settings) |
| **Client Exposure** | Verified safe; zero database connection strings exposed to `NEXT_PUBLIC_*` | Verified safe; zero database connection strings exposed to `NEXT_PUBLIC_*` |

---

## 8. Issues Found

### High Severity

1. **Defective `.env.example` Documentation**  
   - **Issue:** `.env.example` still specifies `MONGODB_URI` and `MONGODB_DB=learnhub`, with zero mention of `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, or `DATABASE_BACKEND`.  
   - **Impact:** New developers or CI/CD systems configuring environment variables from the template will incorrectly attempt to configure MongoDB, leading to runtime boot failures.

2. **Ambiguous Backend Exception if Legacy Variables Persist**  
   - **Issue:** In `lib/db.ts` (lines 31–35), if both `DATABASE_URL` (or `POSTGRES_URL`) and `MONGODB_URI` exist in the environment while `DATABASE_BACKEND` is not explicitly set, `isPostgresBackend()` throws:  
     `"Ambiguous database configuration: both PostgreSQL and MongoDB connection strings are present, but DATABASE_BACKEND is not set."`  
   - **Impact:** If a hosting environment or developer has an old `MONGODB_URI` in their configuration, the entire application will crash on startup unless `DATABASE_BACKEND=postgres` is explicitly declared.

3. **Serverless Connection Sizing on Vercel**  
   - **Issue:** `db/client.ts` defaults `max` pool size to `20` (`Number(process.env.PG_MAX_POOL_SIZE || 20)`).  
   - **Impact:** If multiple Vercel serverless functions spin up concurrently to handle spikes, each function instance attempts to create a pool of up to 20 connections. Without connecting to the Neon PgBouncer pooler (`-pooler`), this will rapidly exhaust Postgres connection limits.

### Medium Severity

4. **Accidental Legacy Migration Scripts Present in `package.json`**  
   - **Issue:** `package.json` publishes `db:check` and `db:migrate`, which invoke `scripts/migrate-mongodb-to-postgres.ts`.  
   - **Impact:** Developers running `npm run db:migrate` expecting to run database migrations will accidentally initiate an extraction against MongoDB, potentially polluting the fresh database with legacy records or failing due to missing MongoDB credentials.

5. **Test Runner Hardcoded Localhost Fallback**  
   - **Issue:** `tests/database/staging-runtime-verification.test.ts` lines 6–7 hardcodes:  
     `process.env.DATABASE_URL = process.env.TEST_POSTGRES_URL || "postgresql://learnhub_superadmin:enjay4l@localhost:5432/learnhub_test"`  
   - **Impact:** Running tests locally or in CI will fail with connection refused unless a local PostgreSQL instance is running on port 5432 or `TEST_POSTGRES_URL` is explicitly defined.

6. **Unenforced Foreign Key Constraints on Academic Submissions**  
   - **Issue:** In `db/schema/academic.ts`, `assignment_submissions.assignment_id` is plain text without an explicit `.references(() => assignments.id)` clause; similarly, `rubrics.assignment_id` and `rubrics.project_id` lack foreign key constraints.  
   - **Impact:** Deletions or updates to assignments/projects will not cascade or be blocked by the PostgreSQL engine, requiring application-level integrity enforcement.

### Low Severity

7. **`drizzle.config.ts` Environment Auto-Loading**  
   - **Issue:** `drizzle.config.ts` relies on `process.env.DATABASE_URL` without importing `dotenv/config` or invoking `process.loadEnvFile`.  
   - **Impact:** Direct CLI usage of `npx drizzle-kit` commands without `--env-file .env.local` fails to locate the database connection string.

8. **Residual Healthcare Terminology & Fields**  
   - **Issue:** `isHealthcareProfessional` exists in `lib/types.ts` and student profile schemas, and `payment_type` enum contains `onsite_registration`.  
   - **Impact:** Minor domain modeling friction during the ongoing transformation into a technology academy.

---

## 9. Recommended Fresh Database Setup

Follow this exact procedure to initialize and deploy a completely fresh Neon PostgreSQL database without touching or migrating legacy MongoDB data:

### Step 1: Provision Neon Database & Retrieve Credentials
1. In the Neon Console, verify or create the project (e.g. `crimson-forest-20352774`).
2. Copy the **Pooled connection string** (ends with `-pooler.region.neon.tech`) and the **Unpooled connection string**.

### Step 2: Configure Local Environment (`.env.local`)
Add the following entries to `.env.local` (ensure `.env.local` remains in `.gitignore`):
```bash
# PostgreSQL & Neon Backend Configuration
DATABASE_BACKEND=postgres
DATABASE_URL=postgresql://[user]:[password]@[neon-host]-pooler.[region].neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://[user]:[password]@[neon-host].[region].neon.tech/neondb?sslmode=require
PG_MAX_POOL_SIZE=10

# Security & Initial Admin Provisioning
JWT_SECRET=[generate-strong-32-char-secret]
BOOTSTRAP_ADMIN_EMAIL=admin@technologyacademy.com
BOOTSTRAP_ADMIN_PASSWORD=[generate-strong-password]
```
*(Ensure `MONGODB_URI` is either completely removed or commented out).*

### Step 3: Run Drizzle Schema Migration
Apply the PostgreSQL DDL migrations to create all 26 schema tables:
```bash
npm run db:migrate-schema
```
*(Verify console output: `Applying PostgreSQL Drizzle migrations to target... Migrations applied successfully.`)*

### Step 4: Provision Standard Technology Taxonomy (Safe & Non-Destructive)
Seed the official technology academy disciplines into the `categories` table:
```bash
# Optional pre-check simulation:
npx tsx scripts/seed-technology-catalog.ts --dry-run

# Execute writes:
npx tsx scripts/seed-technology-catalog.ts --execute
```

### Step 5: Configure Vercel Project Environment Variables
In the Vercel Dashboard (**Settings > Environment Variables**), configure the following for **Production** and **Preview**:
- `DATABASE_BACKEND` = `postgres`
- `DATABASE_URL` = `[Your Neon Pooled Connection String]`
- `PG_MAX_POOL_SIZE` = `2`
- `JWT_SECRET` = `[Your Production JWT Secret]`
- `BOOTSTRAP_ADMIN_EMAIL` = `[Your Admin Email]`
- `BOOTSTRAP_ADMIN_PASSWORD` = `[Your Admin Password]`
- Ensure GitHub Secrets (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) are configured in the GitHub repository.

### Step 6: Trigger Production Deployment
Push to `main` branch to trigger the GitHub Actions workflow (`.github/workflows/vercel-deploy.yml`), which pulls production configuration, compiles with `pnpm`, and deploys the prebuilt artifact to Vercel.

### Step 7: Bootstrap Initial Administrator
Navigate to your deployed domain at `/login` and sign in using `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD`. The application automatically detects the bootstrap credentials, initializes the first administrator record in the PostgreSQL `users` table, and logs the action in `admin_logs`.

---

## 10. Questions Requiring Human Confirmation

1. **Legacy Migration Scripts Deprecation:**  
   Should `scripts/migrate-mongodb-to-postgres.ts`, `scripts/migration-executor.ts`, and `scripts/migration-schema.ts` be archived or removed from `package.json` (`db:check` and `db:migrate`) to prevent accidental execution?
2. **Onsite Training & Caregiver Campaign Pages:**  
   The application still contains pages like `/campaign/promptcare-academy` and onsite registration flows referencing caregiver training in Abuja and Enugu. Should these routes be retired, redirected, or rewritten for technology bootcamps?
3. **Student Profile Schema Cleaning:**  
   Should the `isHealthcareProfessional` JSONB property and `onsite_registration` enum value be formally migrated to technology-first terms (e.g. `careerTransitionBackground` and `cohort_bootcamp_registration`) in a future schema migration?
4. **Driver Preference for Serverless:**  
   Do you plan to deploy any Next.js routes using the Vercel Edge Runtime? If so, the driver should transition from `pg` (`drizzle-orm/node-postgres`) to `@neondatabase/serverless` (`drizzle-orm/neon-serverless`).

---

## 11. Final Verdict

### Can you safely proceed with fresh Neon database initialization?
### **YES.**

The application's PostgreSQL implementation and schema are fully operational, syntactically and structurally sound, and 100% capable of powering the LMS on a fresh Neon database without importing legacy MongoDB records.

### Action Items Prior to Production Deployment:
1. Ensure `DATABASE_BACKEND=postgres` and `DATABASE_URL` (using the **pooled** host) are added to Vercel Environment Variables.
2. Update `.env.example` to document the PostgreSQL variables for your development team.
3. Treat `npm run db:migrate-schema` as the **sole** schema creation script, and avoid executing `npm run db:migrate` or `npm run db:check`.
4. Run `npx tsx scripts/seed-technology-catalog.ts --execute` after schema creation to populate your technology categories.

