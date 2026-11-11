import test, { describe, before, after } from "node:test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { getIsolatedTestDbConfig, assertIsolatedTestDatabase } from "../helpers/test-db-isolation"

const testDbConfig = getIsolatedTestDbConfig()

describe("Admin Bootstrap Security (PostgreSQL)", {
  skip: !testDbConfig.isConfigured ? testDbConfig.skipReason : false,
}, () => {
  process.env.JWT_SECRET = "staging-verification-jwt-secret-key-32-chars-long"
  process.env.ADMIN_ACCOUNTS_EMAIL = "bootstrap.admin@promptcareacademy.test"
  process.env.ADMIN_ACCOUNTS_PASSWORD = "BootstrapAdminPassword123!"

  const { authService, generateToken } = require("../../lib/auth")
  const { getDB } = require("../../lib/db")
  const { getPool, closePool } = require("../../db/client")
  const { POST: loginRoute } = require("../../app/api/auth/login/route")
  const { POST: createUserRoute } = require("../../app/api/admin/create-user/route")
  const { GET: getSettingsRoute, PUT: putSettingsRoute } = require("../../app/api/admin/settings/route")
  const { GET: getLogsRoute } = require("../../app/api/admin/logs/route")

  before(async () => {
    const pool = getPool()
    await assertIsolatedTestDatabase(pool)
  })

  after(async () => {
    await closePool()
  })

  test("1. Ordinary registrant cannot select administrator or finance role via self-service signup", async () => {
    const testStudentEmail = `intruder_${randomUUID()}@example.test`

    // Attempt role escalation via registerWithOtp with admin role
    await assert.rejects(
      async () => {
        await authService.registerWithOtp(
          testStudentEmail,
          "ValidPass123!",
          "Intruder Admin Attempt",
          "admin" as any,
        )
      },
      /Administrative roles cannot be registered via self-service signup/
    )

    // Attempt role escalation via registerWithOtp with finance role
    await assert.rejects(
      async () => {
        await authService.registerWithOtp(
          testStudentEmail,
          "ValidPass123!",
          "Intruder Finance Attempt",
          "finance" as any,
        )
      },
      /Administrative roles cannot be registered via self-service signup/
    )

    // Verify no user or pending registration was inserted
    const db = getDB()
    const user = await db.findUserByEmail(testStudentEmail)
    assert.equal(user, undefined, "Attacker must not exist in PostgreSQL users table")
  })

  test("2. Bootstrap login rejects incorrect password without privilege escalation", async () => {
    const db = getDB()
    const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()

    // Clean any previous test user
    const pool = getPool()
    await pool.query("DELETE FROM users WHERE email = $1", [adminEmail])

    // Try to log in with wrong password
    const failedLogin = await authService.login(adminEmail, "WrongPassword!")
    assert.equal(failedLogin, null, "Bootstrap login must fail for invalid credentials")

    // Ensure no admin account was created
    const user = await db.findUserByEmail(adminEmail)
    assert.equal(user, undefined, "Admin user must not be created on failed login attempt")
  })

  test("3. Pre-existing user with admin email cannot hijack bootstrap without the exact configured password", async () => {
    const db = getDB()
    const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
    const pool = getPool()
    await pool.query("DELETE FROM users WHERE email = $1", [adminEmail])

    // Create an existing student user with the admin's email and a student password
    const studentUser = await db.createUser({
      email: adminEmail,
      password: "$2a$10$FakeHashedStudentPasswordForTestOnly",
      name: "Pre-existing Student",
      role: "student",
      status: "active",
      emailVerified: true,
      enrolledCourses: [],
    })
    assert.equal(studentUser.role, "student")

    // Attacker tries to log in using their student password or wrong password
    const unauthorizedLogin = await authService.login(adminEmail, "StudentPassword123!")
    assert.equal(unauthorizedLogin, null, "Attacker cannot login as admin")

    // User in database must still be a student
    const refreshedUser = await db.findUserByEmail(adminEmail)
    assert.equal(refreshedUser?.role, "student", "Role must not be escalated")

    // Clean up
    await pool.query("DELETE FROM users WHERE email = $1", [adminEmail])
  })

  test("4. Missing JWT_SECRET fails securely and prevents token issuance", async () => {
    const originalSecret = process.env.JWT_SECRET
    const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
    const adminPassword = process.env.ADMIN_ACCOUNTS_PASSWORD!

    try {
      delete process.env.JWT_SECRET

      await assert.rejects(
        async () => {
          await authService.login(adminEmail, adminPassword)
        },
        /JWT_SECRET environment variable is required/
      )
    } finally {
      process.env.JWT_SECRET = originalSecret
    }
  })

  test("5. Passwords in PostgreSQL are always securely bcrypt hashed, never plaintext", async () => {
    const db = getDB()
    const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
    const adminPassword = process.env.ADMIN_ACCOUNTS_PASSWORD!

    // Perform successful bootstrap login
    const loginRes = await authService.login(adminEmail, adminPassword)
    assert.ok(loginRes?.token)

    const dbUser = await db.findUserByEmail(adminEmail)
    assert.ok(dbUser)
    assert.notEqual(dbUser.password, adminPassword, "Password must not be stored in plaintext")
    assert.ok(
      dbUser.password.startsWith("$2a$") || dbUser.password.startsWith("$2b$"),
      "Password hash in PostgreSQL must be a valid bcrypt salt"
    )
  })

  test("6. Concurrent bootstrap login attempts are idempotent and produce a single consistent admin user", async () => {
    const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
    const adminPassword = process.env.ADMIN_ACCOUNTS_PASSWORD!
    const pool = getPool()
    await pool.query("DELETE FROM users WHERE email = $1", [adminEmail])

    // Execute 3 concurrent bootstrap logins simultaneously
    const results = await Promise.all([
      authService.login(adminEmail, adminPassword),
      authService.login(adminEmail, adminPassword),
      authService.login(adminEmail, adminPassword),
    ])

    for (const res of results) {
      assert.ok(res?.token)
      assert.equal(res.user.role, "admin")
    }

    // Verify only 1 user record exists in PostgreSQL users table
    const queryRes = await pool.query("SELECT id, email, role FROM users WHERE email = $1", [adminEmail])
    assert.equal(queryRes.rows.length, 1, "Exactly one user record must exist in PostgreSQL")
    assert.equal(queryRes.rows[0].role, "admin")
  })

  test("7. Administrative API routes reject unauthorized and unauthenticated requests with HTTP 401/403", async () => {
    // 1. Unauthenticated requests to /api/admin/create-user
    const unauthReq = new Request("http://localhost:3000/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", name: "Test", role: "admin", password: "Password123!" }),
    })
    const unauthRes = await createUserRoute(unauthReq)
    assert.equal(unauthRes.status, 401, "Unauthenticated request must return HTTP 401")

    // 2. Student user attempting to access /api/admin/settings
    const studentToken = generateToken({
      id: "student_id_123",
      email: "student@example.com",
      role: "student",
      name: "Student User",
      password: "hashed_dummy_password",
      status: "active",
      emailVerified: true,
      enrolledCourses: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const studentGetSettingsReq = new Request("http://localhost:3000/api/admin/settings", {
      method: "GET",
      headers: { Authorization: `Bearer ${studentToken}` },
    })
    const studentGetSettingsRes = await getSettingsRoute(studentGetSettingsReq)
    assert.equal(studentGetSettingsRes.status, 403, "Student must be rejected with HTTP 403 Forbidden")

    // 3. Student user attempting to modify /api/admin/settings
    const studentPutSettingsReq = new Request("http://localhost:3000/api/admin/settings", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ siteName: "Hacked Title" }),
    })
    const studentPutSettingsRes = await putSettingsRoute(studentPutSettingsReq)
    assert.equal(studentPutSettingsRes.status, 403, "Student modification must return HTTP 403 Forbidden")

    // 4. Student user attempting to read /api/admin/logs
    const studentLogsReq = new Request("http://localhost:3000/api/admin/logs", {
      method: "GET",
      headers: { Authorization: `Bearer ${studentToken}` },
    })
    const studentLogsRes = await getLogsRoute(studentLogsReq)
    assert.equal(studentLogsRes.status, 403, "Student cannot read admin audit logs")
  })

  test("8. Cleanup security test artifacts from PostgreSQL test database", async () => {
    const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
    const pool = getPool()
    await assertIsolatedTestDatabase(pool)
    await pool.query("DELETE FROM users WHERE email = $1", [adminEmail])
  })
})
