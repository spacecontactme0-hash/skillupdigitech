import { Pool } from "pg"
import path from "node:path"
import fs from "node:fs"

/**
 * Result of test database target validation.
 */
export interface TargetValidationResult {
  isValid: boolean
  error?: string
  dbName?: string
  host?: string
  port?: string
  user?: string
  isTestDesignated?: boolean
}

/**
 * Known protected / production database names that MUST NEVER be targeted by tests.
 */
export const PROTECTED_DATABASE_NAMES = new Set([
  "neondb",
  "postgres", // disallowed for integration tests (only allowed for admin operations if explicitly authorized)
  "production",
  "prod",
  "main",
  "master",
  "defaultdb",
  "live",
])

/**
 * Explicitly approved local PostgreSQL hosts permitted for test execution.
 */
export const APPROVED_LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
])

/**
 * Options for validating test database targets.
 */
export interface ValidateTestDbOptions {
  isAdminOperation?: boolean
  allowedHosts?: string[]
}

/**
 * Parsed components of a PostgreSQL connection URL.
 */
export interface ParsedPgUrl {
  host: string
  port: string
  dbName: string
  user?: string
}

/**
 * Strips CIDR subnet mask (e.g. "/128" or "/32") and outer brackets from IPv6 host representations
 * and converts to lower-case trimmed string.
 */
export function normalizeHost(host: string): string {
  let h = host.toLowerCase().trim()
  if (h.includes("/")) {
    h = h.split("/")[0].trim()
  }
  if (h.startsWith("[") && h.endsWith("]")) {
    h = h.slice(1, -1).trim()
  }
  return h
}

/**
 * Resolves the dedicated test-host allowlist.
 * Combines APPROVED_LOCAL_HOSTS with any explicitly specified hostnames from
 * TEST_POSTGRES_ALLOWED_HOSTS (comma-separated) or options.
 */
export function getAllowedTestHosts(customAllowed?: string[]): Set<string> {
  const allowed = new Set<string>(APPROVED_LOCAL_HOSTS)
  if (customAllowed) {
    for (const h of customAllowed) {
      const normalized = normalizeHost(h)
      if (normalized) allowed.add(normalized)
    }
  }
  const envAllowed = process.env.TEST_POSTGRES_ALLOWED_HOSTS
  if (envAllowed) {
    for (const h of envAllowed.split(",")) {
      const normalized = normalizeHost(h)
      if (normalized) allowed.add(normalized)
    }
  }
  return allowed
}

/**
 * Determines whether a target hostname is an approved local host or explicitly allowlisted.
 */
export function isAllowedTestHost(host: string, customAllowed?: string[]): boolean {
  const normalized = normalizeHost(host)
  return getAllowedTestHosts(customAllowed).has(normalized)
}

/**
 * Determines whether a runtime server IP address (from inet_server_addr()) is approved.
 * Accepts IPv4 loopbacks (127.0.0.1, 127.0.0.0/8), IPv6 loopback (::1), localhost,
 * and any explicitly configured test host.
 */
export function isApprovedServerAddress(addr: string, customAllowed?: string[]): boolean {
  const normalized = normalizeHost(addr)
  if (APPROVED_LOCAL_HOSTS.has(normalized)) {
    return true
  }
  if (normalized.startsWith("127.")) {
    return true
  }
  return getAllowedTestHosts(customAllowed).has(normalized)
}

/**
 * Reads any application DATABASE_URL or POSTGRES_URL configured in .env.local or environment.
 * Used exclusively for conflict detection (to ensure tests NEVER connect to it).
 */
export function getApplicationDatabaseUrl(): string | undefined {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("learnhub_test")) {
    return process.env.DATABASE_URL
  }
  if (process.env.POSTGRES_URL) {
    return process.env.POSTGRES_URL
  }

  // Check .env.local without mutating process.env
  try {
    const envLocalPath = path.resolve(process.cwd(), ".env.local")
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, "utf-8")
      for (const line of content.split("\n")) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith("#")) {
          const idx = trimmed.indexOf("=")
          if (idx > 0) {
            const key = trimmed.slice(0, idx).trim()
            const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "")
            if (key === "DATABASE_URL" || key === "POSTGRES_URL") {
              return val
            }
          }
        }
      }
    }
  } catch {}

  return undefined
}

/**
 * Parses connection string into host, port, dbName, and optional user for safe comparison.
 */
export function parsePgUrl(rawUrl: string): ParsedPgUrl | null {
  try {
    const parsed = new URL(rawUrl)
    const dbName = parsed.pathname.replace(/^\//, "").split("?")[0].toLowerCase()
    return {
      host: normalizeHost(parsed.hostname),
      port: parsed.port || "5432",
      dbName,
      user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    }
  } catch {
    return null
  }
}

/**
 * Validates a target PostgreSQL connection string for testing.
 * Enforces:
 * 1. Must be provided explicitly via TEST_POSTGRES_URL (or TEST_POSTGRES_ADMIN_URL).
 * 2. Host MUST be an approved local host (localhost, 127.0.0.1, ::1) or explicitly listed in TEST_POSTGRES_ALLOWED_HOSTS.
 * 3. Arbitrary remote hosts (cloud providers, remote RDS, etc.) are strictly rejected.
 * 4. Applies identically to administrative operations (TEST_POSTGRES_ADMIN_URL).
 * 5. Must not match application/production DATABASE_URL or POSTGRES_URL.
 * 6. Must not target known production/protected database names (e.g. 'neondb').
 * 7. Must not target the production Neon endpoint/host.
 * 8. Must not assume safety merely because the name contains 'test'.
 */
export function validateTestDatabaseTarget(
  connectionString: string | undefined,
  options: ValidateTestDbOptions = {}
): TargetValidationResult {
  if (!connectionString || !connectionString.trim()) {
    return {
      isValid: false,
      error: "No test database connection string provided. TEST_POSTGRES_URL must be explicitly configured.",
    }
  }

  const parsed = parsePgUrl(connectionString.trim())
  if (!parsed) {
    return {
      isValid: false,
      error: "Invalid PostgreSQL connection string format.",
    }
  }

  const { host, port, dbName, user } = parsed

  // Check 1: Restrict host to explicitly approved local hosts or dedicated allowlist
  if (!isAllowedTestHost(host, options.allowedHosts)) {
    return {
      isValid: false,
      host,
      port,
      dbName,
      user,
      error: `DISALLOWED TEST HOST: Host '${host}' is not an explicitly approved local test host (localhost, 127.0.0.1, ::1) or in the dedicated test-host allowlist. Arbitrary remote PostgreSQL hosts are forbidden.`,
    }
  }

  // Check 2: Must not match application database
  const appDbUrl = getApplicationDatabaseUrl()
  if (appDbUrl) {
    const appParsed = parsePgUrl(appDbUrl)
    if (appParsed) {
      if (host === appParsed.host && dbName === appParsed.dbName) {
        return {
          isValid: false,
          host,
          port,
          dbName,
          user,
          error: `DANGEROUS CONFIGURATION: Target points to the active application database ('${dbName}' on ${host}). Automated tests must NEVER use the active application database.`,
        }
      }
      if (host === appParsed.host && host.includes("neon.tech")) {
        return {
          isValid: false,
          host,
          port,
          dbName,
          user,
          error: `DANGEROUS CONFIGURATION: Target points to the application's Neon PostgreSQL host (${host}). Integration tests are forbidden from executing against application hosting infrastructure.`,
        }
      }
    }
  }

  // Check 3: Must not target protected production database names
  if (!options.isAdminOperation && PROTECTED_DATABASE_NAMES.has(dbName)) {
    return {
      isValid: false,
      host,
      port,
      dbName,
      user,
      error: `PROTECTED DATABASE TARGET: Database '${dbName}' is a reserved/production database name and cannot be targeted by tests.`,
    }
  }

  // Check 4: If admin operation, it must not target non-postgres administrative targets or production hosts
  if (options.isAdminOperation) {
    if (appDbUrl) {
      const appParsed = parsePgUrl(appDbUrl)
      if (appParsed && host === appParsed.host) {
        return {
          isValid: false,
          host,
          port,
          dbName,
          user,
          error: `DANGEROUS CONFIGURATION: Admin operation targets the application host (${host}). Administrative test setup must run on isolated local/test infrastructure.`,
        }
      }
    }
  }

  return {
    isValid: true,
    dbName,
    host,
    port,
    user,
    isTestDesignated: true,
  }
}

/**
 * Configuration returned to integration test suites.
 */
export interface TestDbConfig {
  isConfigured: boolean
  skipReason?: string
  url?: string
}

/**
 * Evaluates TEST_POSTGRES_URL.
 * If unset or invalid, returns { isConfigured: false, skipReason: ... }.
 * If valid, returns { isConfigured: true, url: ... } and sets up process.env for isolated execution.
 */
export function getIsolatedTestDbConfig(options: ValidateTestDbOptions = {}): TestDbConfig {
  const testUrl = process.env.TEST_POSTGRES_URL?.trim()

  if (!testUrl) {
    return {
      isConfigured: false,
      skipReason:
        "TEST_POSTGRES_URL is not set. Skipping integration test suite to prevent accidental connection to the application database.",
    }
  }

  const validation = validateTestDatabaseTarget(testUrl, options)
  if (!validation.isValid) {
    return {
      isConfigured: false,
      skipReason: `TEST_POSTGRES_URL rejected: ${validation.error}`,
    }
  }

  // Configure environment strictly for this test execution
  process.env.DATABASE_BACKEND = "postgres"
  process.env.DATABASE_URL = testUrl
  ;(process.env as Record<string, string | undefined>)["NODE_ENV"] = "test"
  delete process.env.POSTGRES_URL
  delete process.env.MIGRATION_POSTGRES_URL

  return {
    isConfigured: true,
    url: testUrl,
  }
}

/**
 * Runtime connection identity inspected from the live PostgreSQL connection.
 */
export interface RuntimeConnectionIdentity {
  db: string
  user: string
  serverAddr: string | null
  serverPort: number | null
}

/**
 * Options for runtime connection assertion.
 */
export interface AssertIsolatedDbOptions {
  target?: string
  isAdminOperation?: boolean
  expectedDb?: string
  expectedUser?: string
  expectedHost?: string
  expectedPort?: string | number
  allowedHosts?: string[]
}

/**
 * Minimal queryable interface for Pool or Client.
 */
export type QueryablePool = {
  query: (sql: string, params?: any[]) => Promise<{ rows: any[] }>
}

/**
 * Runtime assertion: connects to the pool and verifies that the live connected database
 * is genuinely an isolated test database and not the application/production database.
 * Inspects:
 * - current_database()
 * - current_user
 * - inet_server_addr()
 * - inet_server_port()
 * Compares against approved test configuration before setup, write, or teardown operations.
 */
export async function assertIsolatedTestDatabase(
  pool: QueryablePool,
  options: AssertIsolatedDbOptions = {}
): Promise<RuntimeConnectionIdentity & { toString: () => string }> {
  const res = await pool.query(
    "SELECT current_database() as db, current_user as usr, inet_server_addr()::text as server_addr, inet_server_port() as server_port;"
  )
  const row = res.rows[0] || {}
  const liveDb = (row.db || "").toLowerCase().trim()
  const liveUser = (row.usr || "").toLowerCase().trim()
  const serverAddr = row.server_addr ? String(row.server_addr).trim() : null
  const serverPort = row.server_port !== null && row.server_port !== undefined ? Number(row.server_port) : null

  if (!liveDb) {
    throw new Error("Unable to determine current database name from PostgreSQL connection.")
  }

  // Check 1: Reject known protected / production databases
  if (
    liveDb === "neondb" ||
    liveDb === "production" ||
    liveDb === "prod" ||
    liveDb === "main" ||
    liveDb === "master" ||
    liveDb === "defaultdb" ||
    liveDb === "live"
  ) {
    throw new Error(
      `CRITICAL SAFETY VIOLATION: Connected to protected database '${liveDb}'. Aborting test execution immediately.`
    )
  }
  if (!options.isAdminOperation && liveDb === "postgres") {
    throw new Error(
      `CRITICAL SAFETY VIOLATION: Connected to protected database '${liveDb}'. Aborting test execution immediately.`
    )
  }

  // Check 2: Reject active application database
  const appDbUrl = getApplicationDatabaseUrl()
  if (appDbUrl) {
    const appParsed = parsePgUrl(appDbUrl)
    if (appParsed && liveDb === appParsed.dbName) {
      throw new Error(
        `CRITICAL SAFETY VIOLATION: Connected to application database '${liveDb}'. Tests are strictly isolated.`
      )
    }
  }

  // Check 3: Resolve approved configuration to compare against
  const targetUrl =
    options.target ||
    process.env.TEST_POSTGRES_URL ||
    (options.isAdminOperation ? process.env.TEST_POSTGRES_ADMIN_URL : undefined) ||
    process.env.DATABASE_URL
  const parsedTarget = targetUrl ? parsePgUrl(targetUrl) : null

  const expectedDb = (options.expectedDb || parsedTarget?.dbName)?.toLowerCase().trim()
  const expectedUser = (options.expectedUser || parsedTarget?.user)?.toLowerCase().trim()
  const expectedPort =
    options.expectedPort !== undefined
      ? Number(options.expectedPort)
      : parsedTarget?.port
      ? Number(parsedTarget.port)
      : undefined

  // Compare actual database name against approved configuration
  if (expectedDb && liveDb !== expectedDb) {
    throw new Error(
      `CRITICAL SAFETY VIOLATION: Live database name '${liveDb}' does not match approved test database '${expectedDb}'. Aborting test execution immediately.`
    )
  }

  // Compare actual user against approved configuration
  if (expectedUser && liveUser !== expectedUser) {
    throw new Error(
      `CRITICAL SAFETY VIOLATION: Live database user '${liveUser}' does not match approved test user '${expectedUser}'. Aborting test execution immediately.`
    )
  }

  // Compare actual port against approved configuration
  if (expectedPort !== undefined && serverPort !== null && serverPort !== expectedPort) {
    throw new Error(
      `CRITICAL SAFETY VIOLATION: Live database server port '${serverPort}' does not match approved test port '${expectedPort}'. Aborting test execution immediately.`
    )
  }

  // Check 4: Inspect live server address (inet_server_addr())
  if (serverAddr !== null) {
    if (!isApprovedServerAddress(serverAddr, options.allowedHosts)) {
      throw new Error(
        `CRITICAL SAFETY VIOLATION: Live database server address '${serverAddr}' is not an approved local test host (localhost, 127.0.0.1, ::1) or in the dedicated test-host allowlist. Aborting test execution immediately.`
      )
    }
  }

  return {
    db: liveDb,
    user: liveUser,
    serverAddr,
    serverPort,
    toString() {
      return liveDb
    },
  }
}
