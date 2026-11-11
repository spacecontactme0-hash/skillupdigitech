# Legacy MongoDB-to-PostgreSQL Migration Code Retirement Audit

**Audit Date:** November 11, 2026  
**Status:** Read-Only Impact Audit (Phase 1)  
**Objective:** Identify, trace, and classify all files, dependencies, scripts, and tests associated with the obsolete MongoDB-to-PostgreSQL migration pipeline, ensuring the active Neon PostgreSQL runtime and technology academy LMS remain completely intact.

---

## 1. Primary Target Identification

The specific file identified from the prompt's architectural characteristics is:

**[`scripts/migration-executor.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/scripts/migration-executor.ts)** (1,018 lines)

### Verification of Characteristics:
- **`mongodb` and `ObjectId` imports:** Line 2 (`import { ObjectId } from "mongodb"`) and dynamic import on line 1002 (`const { MongoClient } = await import("mongodb")`).
- **`MIGRATION_TABLE_ORDER`:** Defined on lines 11–28 listing 16 legacy source tables (`users`, `categories`, `courses`, `course_modules`, `lessons`, `quizzes`, `quiz_questions`, `assignments`, `enrollments`, `payments`, `payment_events`, `certificates`, `learning_notes`, `admin_logs`, `onboarding_events`, `pending_registrations`).
- **`JSONB_COLUMNS` & `LEGACY_PAYLOAD_FIELDS`:** Defined on lines 30–52 mapping MongoDB unmodeled attributes into PostgreSQL JSONB columns.
- **Conversion and Mapping Functions:** `buildMigrationRows()`, `toUserRow()`, `toPaymentRow()`, `documentIds()`, `sourceId()`, etc.
- **Source Snapshot Loader:** `loadMongoSourceSnapshot()` on lines 998–1018.
- **Transaction Executor:** `executeMigrationTransaction()` on lines 810–960.
- **Staging Identity Checks:** `approvedExecutionIdentity()` enforcing database `learnhub` on `localhost:5432` with source `learnhub_migration_staging`.
- **Imports:** Imports `MIGRATION_OWNED_TABLES` from `./migration-schema` (line 4) and type `CollectionInventory` from `./migrate-mongodb-to-postgres` (line 5).

---

## 2. Dependency & Caller Trace

```
+-------------------------------------------------------------+
|               scripts/migration-schema.ts                   |
+------------------------------+------------------------------+
                               | exports MIGRATION_OWNED_TABLES
                               v
+-------------------------------------------------------------+
|               scripts/migration-executor.ts                 |
| (buildMigrationRows, executeMigrationTransaction, etc.)      |
+---------------+------------------------------+--------------+
                ^                              ^
   imports from |                              | imports from
                |                              |
+---------------+--------------+  +------------+--------------+
| scripts/                     |  | tests/                    |
| migrate-mongodb-to-postgres  |  | migration.test.ts         |
+---------------+--------------+  +---------------------------+
                ^
   imports from |
+---------------+--------------+
| tests/database/              |
| migration.test.ts            |
+------------------------------+
```

### Complete Inbound Dependency Graph

1. **`scripts/migration-executor.ts` is imported by:**
   - [`scripts/migrate-mongodb-to-postgres.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/scripts/migrate-mongodb-to-postgres.ts#L5-L12): Imports `approvedExecutionIdentity`, `buildMigrationRows`, `executeMigrationTransaction`, `loadMongoSourceSnapshot`, `sourceCountMismatches`, `type MigrationTableReport`.
   - [`tests/migration.test.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/tests/migration.test.ts#L5): Imports `buildMigrationRows`.
   - [`TECH_ACADEMY_POSTGRES_RUNTIME_HARDENING.md`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/TECH_ACADEMY_POSTGRES_RUNTIME_HARDENING.md): Mentioned in archival documentation.

2. **`scripts/migrate-mongodb-to-postgres.ts` is imported/executed by:**
   - [`package.json`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/package.json):
     - `"db:legacy-mongo-check": "tsx --env-file .env.local scripts/migrate-mongodb-to-postgres.ts --dry-run"`
     - `"db:legacy-mongo-migrate": "tsx --env-file .env.local scripts/migrate-mongodb-to-postgres.ts"`
   - [`tests/database/migration.test.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/tests/database/migration.test.ts#L4-L12): Imports `buildMigrationInventory`, `buildMigrationPlan`, `classifyCollectionState`, `parseMigrationMode`, `resolveMigrationConfig`, `validateCounts`, `validateMigrationReadiness`.
   - [`tests/migration.test.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/tests/migration.test.ts#L6-L17): Imports `buildMigrationInventory`, `isMigrationExecutionReady`, `inspectPostgresTarget`, `MIGRATION_OWNED_TABLES`, `resolveMigrationConfig`, `validateCounts`, `validateMigrationReadiness`, `validatePreExecutionReconciliation`.

3. **`scripts/migration-schema.ts` is imported by:**
   - [`scripts/migration-executor.ts`](file:///c:/Users/USER/Desktop/v0-lms-with-mongo-db/scripts/migration-executor.ts#L4): Imports `MIGRATION_OWNED_TABLES`.

---

## 3. Verification of Active PostgreSQL Runtime Independence

The active PostgreSQL application runtime was checked for dependencies on the migration system:

1. **`scripts/migrate-postgres-schema.ts` (Active Drizzle Migration Runner):**
   - Imports: `migrate` from `drizzle-orm/node-postgres/migrator`, `getDrizzleDb`, `closePool`, `getPostgresUrl` from `../db/client`.
   - **Zero dependencies** on `migration-executor.ts`, `migrate-mongodb-to-postgres.ts`, or `migration-schema.ts`.
2. **`scripts/seed-technology-catalog.ts` (Active Category Seeder):**
   - Imports: `getDB`, `isPostgresBackend` from `@/lib/db`.
   - **Zero dependencies** on the legacy migration tooling.
3. **`db/client.ts` & `lib/postgres-db.ts` (Active PostgreSQL Database Layer):**
   - **Zero dependencies** on the legacy migration tooling.
4. **`app/api/` (All 40+ Active API Routes):**
   - All routes consume `getDB()` from `@/lib/db`. Zero routes import or invoke any file in `scripts/`.
5. **`.github/workflows/vercel-deploy.yml` (CI/CD Deployment):**
   - Does not invoke or reference any MongoDB migration script.

---

## 4. File Classification Matrix

### Category 1: SAFE TO REMOVE (Exclusively Obsolete Migration Code & Tests)

These files exist strictly for the legacy MongoDB-to-PostgreSQL ETL process. They are not imported by the Next.js runtime, active API routes, or production workflows.

| File Path | Description & Removal Justification |
| :--- | :--- |
| `scripts/migration-executor.ts` | The core MongoDB document transformation and ETL transactional insertion engine. 100% obsolete since no MongoDB data will be migrated. |
| `scripts/migrate-mongodb-to-postgres.ts` | The CLI entry point for dry-run and execution of the MongoDB-to-PostgreSQL migration. Completely unused by fresh setup. |
| `scripts/migration-schema.ts` | Extracts table and column manifests exclusively consumed by `migration-executor.ts`. Obsolete. |
| `tests/migration.test.ts` | Unit tests exclusively testing `buildMigrationRows` from `migration-executor.ts`. Obsolete. |
| `tests/database/migration.test.ts` | Unit tests exclusively testing inventory and reconciliation functions in `migrate-mongodb-to-postgres.ts`. Obsolete. |

### Category 2: KEEP (Required by Active Neon PostgreSQL LMS)

These files power the production technology academy and must be preserved:

| File Path | Function & Retention Justification |
| :--- | :--- |
| `scripts/migrate-postgres-schema.ts` | **MANDATORY:** Applies Drizzle SQL migrations (`0000`–`0003`) to the Neon database. |
| `scripts/seed-technology-catalog.ts` | **MANDATORY:** Seeds technology academy disciplines into the `categories` table. |
| `scripts/seed-db.ts` | **MANDATORY:** Standard npm script wrapper for `seed-technology-catalog.ts`. |
| `db/client.ts` | **MANDATORY:** Connection pool (`pg.Pool`) and Drizzle database instance factory. |
| `db/schema/index.ts` | **MANDATORY:** Barrel exporter for the PostgreSQL schema. |
| `db/schema/core.ts` | **MANDATORY:** 19 core tables (`users`, `courses`, `lessons`, `payments`, etc.). |
| `db/schema/academic.ts` | **MANDATORY:** 7 academic tables (`quizzes`, `assignments`, `grades`, `rubrics`, etc.). |
| `db/migrations/*` | **MANDATORY:** The 4 SQL DDL migration files and journal metadata. |
| `lib/db.ts` | **MANDATORY:** Central database abstraction and routing layer. |
| `lib/postgres-db.ts` | **MANDATORY:** Concrete PostgreSQL LMS operations implementation. |
| `lib/academic-db.ts` | **MANDATORY:** Academic evaluation and submission handling. |
| `drizzle.config.ts` | **MANDATORY:** Configuration for Drizzle Kit CLI. |
| All test suites in `tests/academic/`, `tests/payments/`, `tests/security/`, and `tests/database/staging-*` | **MANDATORY:** Core regression and verification suites. |

### Category 3: REVIEW (Files Requiring Targeted Cleanup)

| File Path | Current Status & Recommended Action |
| :--- | :--- |
| `package.json` | Contains `"db:legacy-mongo-check"` and `"db:legacy-mongo-migrate"`. **Action:** Safely remove both scripts. |
| `.env.example` | Still documents `MONGODB_URI` and `MONGODB_DB`. **Action:** Replace with clear PostgreSQL/Neon template. |
| `lib/db.ts` | Contains a dynamic `require("./mongodb-db")` inside `getMongoDatabase()`. **Action:** Remove MongoDB fallback branch and fail closed immediately if `DATABASE_BACKEND !== "postgres"`. |
| `lib/mongodb-db.ts` & `lib/mongodb.ts` | Standalone legacy MongoDB drivers. **Action:** Once `lib/db.ts`, `lib/admin-settings.ts`, `lib/campaign-config.ts`, and `lib/onsite-training-config.ts` are decoupled, these two files can be safely removed. |
| `scripts/create-admin-finance.ts` | Standalone script using `MongoClient` to write directly to MongoDB. **Action:** Candidate for retirement as admin provisioning is now handled via PostgreSQL bootstrap. |
| `tests/database/staging-runtime-verification.test.ts` & other test files | Contain hardcoded localhost PostgreSQL connection strings. **Action:** Refactor to require `TEST_POSTGRES_URL` or use `DATABASE_URL`. |

---

## 5. Phase 1 Conclusion & Safety Confirmation

- **No source files or tests were modified or deleted during Phase 1.**
- **No database connections were initiated.**
- The retirement plan cleanly separates obsolete ETL files (`scripts/migration-executor.ts`, `scripts/migrate-mongodb-to-postgres.ts`, `scripts/migration-schema.ts`, and their dedicated unit tests) from the active Neon PostgreSQL runtime.
- We are ready to proceed with Phase 2 (Safe Retirement).

