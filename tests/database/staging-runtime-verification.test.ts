import test, { describe, before, after } from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { getIsolatedTestDbConfig, assertIsolatedTestDatabase } from "../helpers/test-db-isolation"

const testDbConfig = getIsolatedTestDbConfig()

describe("Staging Runtime Verification (PostgreSQL)", {
  skip: !testDbConfig.isConfigured ? testDbConfig.skipReason : false,
}, () => {
  process.env.JWT_SECRET = "staging-verification-jwt-secret-key-32-chars-long"
  process.env.ADMIN_ACCOUNTS_EMAIL = "staging.admin@promptcareacademy.com"
  process.env.ADMIN_ACCOUNTS_PASSWORD = "StagingAdminPass456!"

  const { isPostgresBackend, getDB } = require("../../lib/db")
  const { PostgresDatabase } = require("../../lib/postgres-db")
  const { authService } = require("../../lib/auth")
  const { getAdminSettings, updateAdminSettings } = require("../../lib/admin-settings")
  const { getPool, closePool } = require("../../db/client")

  before(async () => {
    const pool = getPool()
    await assertIsolatedTestDatabase(pool)
  })

  after(async () => {
    await closePool()
  })

  test("1. Runtime verifies end-to-end PostgreSQL routing and zero MongoDB execution", async () => {
    assert.equal(isPostgresBackend(), true, "DATABASE_BACKEND=postgres must activate isPostgresBackend()")
    
    const db = getDB()
    assert.ok(db instanceof PostgresDatabase, "getDB() must return an instance of PostgresDatabase")

    // Ensure global Mongo promise was never initialized
    const globalWithMongo = global as any
    assert.equal(globalWithMongo._mongoClientPromise, undefined, "MongoDB client promise must remain uninitialized")
  })

  test("2. Initial administrator bootstrap flow provisions admin in PostgreSQL on first login", async () => {
    const db = getDB()
    const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
    const adminPassword = process.env.ADMIN_ACCOUNTS_PASSWORD!

    // Clean any previous test admin user from test database
    const existing = await db.findUserByEmail(adminEmail)
    if (existing) {
      const pool = getPool()
      await pool.query("DELETE FROM users WHERE email = $1", [adminEmail])
    }

    // Precondition: user does not exist
    const beforeUser = await db.findUserByEmail(adminEmail)
    assert.equal(beforeUser, undefined, "Admin user must not exist before first bootstrap login")

    // Perform initial administrator login
    const loginResult = await authService.login(adminEmail, adminPassword)
    assert.ok(loginResult, "authService.login must succeed for bootstrap admin credentials")
    assert.ok(loginResult.token, "authService.login must return a JWT token")
    assert.equal(loginResult.user.email, adminEmail)
    assert.equal(loginResult.user.role, "admin")

    // Verify the admin record was actually created in PostgreSQL
    const dbUser = await db.findUserByEmail(adminEmail)
    assert.ok(dbUser, "Admin user must exist in PostgreSQL users table")
    assert.equal(dbUser.email, adminEmail)
    assert.equal(dbUser.role, "admin")
    assert.equal(dbUser.status, "active")
    assert.equal(dbUser.emailVerified, true)
    assert.ok(dbUser.password.startsWith("$2a$") || dbUser.password.startsWith("$2b$"), "Password in DB must be bcrypt hashed")

    // Decode the token and verify claims
    const decoded = authService.decodeToken(loginResult.token)
    assert.ok(decoded, "Token must decode successfully")
    assert.equal(decoded.userId, dbUser.id)
    assert.equal(decoded.email, adminEmail)
    assert.equal(decoded.role, "admin")
  })

  test("3. Subsequent administrator login is idempotent and preserves admin status", async () => {
    const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
    const adminPassword = process.env.ADMIN_ACCOUNTS_PASSWORD!

    const secondLogin = await authService.login(adminEmail, adminPassword)
    assert.ok(secondLogin, "Second login must succeed")
    assert.equal(secondLogin.user.role, "admin")

    const decoded = authService.decodeToken(secondLogin.token)
    assert.ok(decoded)
    assert.equal(decoded.role, "admin")
  })

  test("4. Authenticated admin operations persist across PostgreSQL audit logs and app settings", async () => {
    const db = getDB()
    const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
    const adminUser = await db.findUserByEmail(adminEmail)
    assert.ok(adminUser)

    // 1. Create a user as admin and write to admin_logs
    const targetEmail = `instructor_${randomUUID()}@promptcareacademy.com`
    const targetUser = await db.createUser({
      email: targetEmail,
      password: "TempPassword123!",
      name: "Dr. Staging Instructor",
      role: "instructor",
      status: "active",
      emailVerified: true,
      enrolledCourses: [],
    })
    assert.ok(targetUser)

    const logEntry = await db.createAdminLog({
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorEmail: adminUser.email,
      action: "create_user",
      targetUserId: targetUser.id,
      targetName: targetUser.name,
      targetEmail: targetUser.email,
      targetRole: targetUser.role,
    })
    assert.ok(logEntry.id, "Admin log must be created with ID")
    assert.equal(logEntry.action, "create_user")
    assert.equal(logEntry.actorId, adminUser.id)

    // Verify admin logs query returns the created log from PostgreSQL
    const logs = await db.getAdminLogs(10)
    const matchingLog = logs.find((l: any) => l.id === logEntry.id)
    assert.ok(matchingLog, "Created admin log must be found in PostgreSQL admin_logs table")
    assert.equal(matchingLog.targetEmail, targetEmail)

    // 2. Update dynamic site settings and verify persistence in app_settings table
    const testSiteName = `Prompt Care Academy Staging ${randomUUID().slice(0, 6)}`
    await updateAdminSettings({
      siteName: testSiteName,
      siteDescription: "Verified Staging Platform",
      contactEmail: "admin@promptcareacademy.com",
      supportEmail: "support@promptcareacademy.com",
      emailNotifications: true,
      courseApproval: true,
      autoEnrollment: false,
      certificateGeneration: true,
      maintenanceMode: false,
      homeIntroVideoUrl: "",
    })

    const retrievedSettings = await getAdminSettings()
    assert.equal(retrievedSettings.siteName, testSiteName, "Updated settings must persist in PostgreSQL app_settings")
    assert.equal(retrievedSettings.courseApproval, true)
    assert.equal(retrievedSettings.autoEnrollment, false)
  })

  test("5. End-to-end Next.js API routes verify administrator login and operations against PostgreSQL", async () => {
    const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
    const adminPassword = process.env.ADMIN_ACCOUNTS_PASSWORD!

    // 1. Test POST /api/auth/login route handler
    const { POST: loginApiRoute } = await import("../../app/api/auth/login/route")
    const loginRequest = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    })

    const loginResponse = await loginApiRoute(loginRequest)
    assert.equal(loginResponse.status, 200, "API login route must return HTTP 200")
    
    const loginJson = await loginResponse.json()
    assert.equal(loginJson.success, true)
    assert.equal(loginJson.user.email, adminEmail)
    assert.equal(loginJson.user.role, "admin")
    assert.ok(loginJson.token, "Login response must provide valid JWT")

    // Check Set-Cookie header contains the auth token
    const setCookie = loginResponse.headers.get("set-cookie")
    assert.ok(setCookie && setCookie.includes("token="), "Login response must set auth cookie")

    // 2. Test GET /api/admin/settings route handler using the token
    const { GET: getAdminSettingsRoute, PUT: putAdminSettingsRoute } = await import("../../app/api/admin/settings/route")
    const getSettingsReq = new Request("http://localhost:3000/api/admin/settings", {
      method: "GET",
      headers: { Authorization: `Bearer ${loginJson.token}` },
    })
    const getSettingsRes = await getAdminSettingsRoute(getSettingsReq)
    assert.equal(getSettingsRes.status, 200, "GET /api/admin/settings must return 200 for authenticated admin")
    const settingsJson = await getSettingsRes.json()
    assert.ok(settingsJson.settings, "Response must return settings object from PostgreSQL")

    // 3. Test PUT /api/admin/settings route handler
    const updatedSiteName = `PCA Route Verified ${randomUUID().slice(0, 4)}`
    const putSettingsReq = new Request("http://localhost:3000/api/admin/settings", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${loginJson.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...settingsJson.settings,
        siteName: updatedSiteName,
      }),
    })
    const putSettingsRes = await putAdminSettingsRoute(putSettingsReq)
    assert.equal(putSettingsRes.status, 200, "PUT /api/admin/settings must return 200")
    const updatedSettingsJson = await putSettingsRes.json()
    assert.equal(updatedSettingsJson.settings.siteName, updatedSiteName)

    // 4. Test GET /api/admin/logs route handler
    const { GET: getAdminLogsRoute } = await import("../../app/api/admin/logs/route")
    const getLogsReq = new Request("http://localhost:3000/api/admin/logs?limit=5", {
      method: "GET",
      headers: { Authorization: `Bearer ${loginJson.token}` },
    })
    const getLogsRes = await getAdminLogsRoute(getLogsReq)
    assert.equal(getLogsRes.status, 200, "GET /api/admin/logs must return 200")
    const logsJson = await getLogsRes.json()
    assert.ok(Array.isArray(logsJson.logs), "Logs response must be an array from PostgreSQL")

    // Verify MongoDB promise remains uninitialized throughout the entire route cycle
    const globalWithMongo = global as any
    assert.equal(globalWithMongo._mongoClientPromise, undefined, "MongoDB client promise must remain uninitialized throughout all API route executions")
  })

  test("6. Cleanup test artifacts from PostgreSQL test database", async () => {
    const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
    const pool = getPool()
    await assertIsolatedTestDatabase(pool)
    await pool.query("DELETE FROM users WHERE email = $1", [adminEmail])
  })
})
