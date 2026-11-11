import test from "node:test"
import assert from "node:assert/strict"
import {
  validateTestDatabaseTarget,
  PROTECTED_DATABASE_NAMES,
  APPROVED_LOCAL_HOSTS,
  parsePgUrl,
  normalizeHost,
  isAllowedTestHost,
  isApprovedServerAddress,
  assertIsolatedTestDatabase,
} from "../helpers/test-db-isolation"

test("1. validateTestDatabaseTarget rejects missing or empty connection string", () => {
  const resultEmpty = validateTestDatabaseTarget("")
  assert.equal(resultEmpty.isValid, false)
  assert.match(resultEmpty.error || "", /No test database connection string provided/)

  const resultUndefined = validateTestDatabaseTarget(undefined)
  assert.equal(resultUndefined.isValid, false)
})

test("2. validateTestDatabaseTarget rejects malformed connection strings", () => {
  const result = validateTestDatabaseTarget("not-a-valid-url")
  assert.equal(result.isValid, false)
  assert.match(result.error || "", /Invalid PostgreSQL connection string format/)
})

test("3. validateTestDatabaseTarget rejects protected production database names (neondb, postgres, prod, etc.)", () => {
  for (const name of PROTECTED_DATABASE_NAMES) {
    const result = validateTestDatabaseTarget(`postgresql://user:pass@localhost:5432/${name}`)
    assert.equal(result.isValid, false, `Database name '${name}' must be rejected`)
    assert.match(result.error || "", /PROTECTED DATABASE TARGET/)
  }
})

test("4. validateTestDatabaseTarget accepts valid isolated test database on localhost", () => {
  const result = validateTestDatabaseTarget("postgresql://learnhub_superadmin:enjay4l@localhost:5432/learnhub_test")
  assert.equal(result.isValid, true)
  assert.equal(result.dbName, "learnhub_test")
  assert.equal(result.host, "localhost")
  assert.equal(result.port, "5432")
  assert.equal(result.user, "learnhub_superadmin")
  assert.equal(result.isTestDesignated, true)
})

test("5. parsePgUrl extracts host, port, dbName, and user cleanly", () => {
  const parsed = parsePgUrl("postgresql://test_user:secret@127.0.0.1:5433/isolated_test_db?sslmode=disable")
  assert.ok(parsed)
  assert.equal(parsed.host, "127.0.0.1")
  assert.equal(parsed.port, "5433")
  assert.equal(parsed.dbName, "isolated_test_db")
  assert.equal(parsed.user, "test_user")
})

test("6. validateTestDatabaseTarget restricts test database to approved local PostgreSQL hosts (localhost, 127.0.0.1, ::1)", () => {
  const validHosts = ["localhost", "127.0.0.1", "::1", "[::1]"]
  for (const h of validHosts) {
    const hostFormatted = h.includes(":") && !h.startsWith("[") ? `[${h}]` : h
    const result = validateTestDatabaseTarget(`postgresql://user:pass@${hostFormatted}:5432/my_test_db`)
    assert.equal(result.isValid, true, `Host '${h}' should be an approved local test host`)
  }
})

test("7. validateTestDatabaseTarget rejects arbitrary remote PostgreSQL hosts (cloud providers, remote RDS, non-Neon cloud)", () => {
  const disallowedHosts = [
    "ep-quiet-grass-123456.us-east-2.aws.neon.tech",
    "db.supabase.co",
    "my-production-db.c9ak43m1.us-east-1.rds.amazonaws.com",
    "postgres.render.com",
    "db.cloud.digitalocean.com",
    "192.168.1.100",
    "10.0.0.50",
    "54.214.23.11",
  ]

  for (const host of disallowedHosts) {
    const result = validateTestDatabaseTarget(`postgresql://user:pass@${host}:5432/my_test_db`)
    assert.equal(result.isValid, false, `Remote host '${host}' must be rejected`)
    assert.match(result.error || "", /DISALLOWED TEST HOST/)
    assert.match(result.error || "", /Arbitrary remote PostgreSQL hosts are forbidden/)
  }
})

test("8. validateTestDatabaseTarget accepts remote host when explicitly included in dedicated test-host allowlist", () => {
  const customHost = "dedicated-ci-postgres.internal"
  
  // Without allowlist -> rejected
  const rejected = validateTestDatabaseTarget(`postgresql://user:pass@${customHost}:5432/ci_test_db`)
  assert.equal(rejected.isValid, false)
  assert.match(rejected.error || "", /DISALLOWED TEST HOST/)

  // With options.allowedHosts -> accepted
  const acceptedViaOptions = validateTestDatabaseTarget(
    `postgresql://user:pass@${customHost}:5432/ci_test_db`,
    { allowedHosts: [customHost] }
  )
  assert.equal(acceptedViaOptions.isValid, true)
  assert.equal(acceptedViaOptions.host, customHost)

  // With TEST_POSTGRES_ALLOWED_HOSTS environment variable -> accepted
  const prevEnv = process.env.TEST_POSTGRES_ALLOWED_HOSTS
  try {
    process.env.TEST_POSTGRES_ALLOWED_HOSTS = `some-host.test,${customHost}`
    const acceptedViaEnv = validateTestDatabaseTarget(`postgresql://user:pass@${customHost}:5432/ci_test_db`)
    assert.equal(acceptedViaEnv.isValid, true)
  } finally {
    process.env.TEST_POSTGRES_ALLOWED_HOSTS = prevEnv
  }
})

test("9. Applies identical host restrictions to administrative operations (TEST_POSTGRES_ADMIN_URL)", () => {
  // Remote host rejected even when isAdminOperation is true
  const remoteAdmin = validateTestDatabaseTarget(
    "postgresql://postgres:pass@remote-postgres.cloud.com:5432/postgres",
    { isAdminOperation: true }
  )
  assert.equal(remoteAdmin.isValid, false)
  assert.match(remoteAdmin.error || "", /DISALLOWED TEST HOST/)

  // Local host allowed for admin operations
  const localAdmin = validateTestDatabaseTarget(
    "postgresql://postgres:pass@localhost:5432/postgres",
    { isAdminOperation: true }
  )
  assert.equal(localAdmin.isValid, true)
  assert.equal(localAdmin.dbName, "postgres")
})

test("10. assertIsolatedTestDatabase inspects runtime identity (current_database, current_user, inet_server_addr, inet_server_port)", async () => {
  const mockPool = {
    query: async (sql: string) => {
      if (sql.includes("current_database()")) {
        return {
          rows: [
            {
              db: "learnhub_test",
              usr: "learnhub_superadmin",
              server_addr: "127.0.0.1",
              server_port: 5432,
            },
          ],
        }
      }
      return { rows: [] }
    },
  }

  const identity = await assertIsolatedTestDatabase(mockPool, {
    target: "postgresql://learnhub_superadmin:pass@127.0.0.1:5432/learnhub_test",
  })

  assert.equal(identity.db, "learnhub_test")
  assert.equal(identity.user, "learnhub_superadmin")
  assert.equal(identity.serverAddr, "127.0.0.1")
  assert.equal(identity.serverPort, 5432)
  assert.equal(String(identity), "learnhub_test")
})

test("11. assertIsolatedTestDatabase rejects live protected databases (neondb, production, etc.)", async () => {
  for (const protectedDb of ["neondb", "production", "main", "postgres"]) {
    const mockPool = {
      query: async () => ({
        rows: [{ db: protectedDb, usr: "test_user", server_addr: "127.0.0.1", server_port: 5432 }],
      }),
    }

    await assert.rejects(
      async () => {
        await assertIsolatedTestDatabase(mockPool, {
          target: `postgresql://test_user:pass@127.0.0.1:5432/${protectedDb}`,
        })
      },
      /CRITICAL SAFETY VIOLATION: Connected to protected database/
    )
  }
})

test("12. assertIsolatedTestDatabase rejects live connection when actual database name differs from approved configuration", async () => {
  const mockPool = {
    query: async () => ({
      rows: [{ db: "other_database", usr: "learnhub_superadmin", server_addr: "127.0.0.1", server_port: 5432 }],
    }),
  }

  await assert.rejects(
    async () => {
      await assertIsolatedTestDatabase(mockPool, {
        target: "postgresql://learnhub_superadmin:pass@127.0.0.1:5432/learnhub_test",
      })
    },
    /CRITICAL SAFETY VIOLATION: Live database name 'other_database' does not match approved test database 'learnhub_test'/
  )
})

test("13. assertIsolatedTestDatabase rejects live connection when actual user differs from approved configuration", async () => {
  const mockPool = {
    query: async () => ({
      rows: [{ db: "learnhub_test", usr: "unauthorized_user", server_addr: "127.0.0.1", server_port: 5432 }],
    }),
  }

  await assert.rejects(
    async () => {
      await assertIsolatedTestDatabase(mockPool, {
        target: "postgresql://learnhub_superadmin:pass@127.0.0.1:5432/learnhub_test",
      })
    },
    /CRITICAL SAFETY VIOLATION: Live database user 'unauthorized_user' does not match approved test user 'learnhub_superadmin'/
  )
})

test("14. assertIsolatedTestDatabase rejects live connection when actual port differs from approved configuration", async () => {
  const mockPool = {
    query: async () => ({
      rows: [{ db: "learnhub_test", usr: "learnhub_superadmin", server_addr: "127.0.0.1", server_port: 5433 }],
    }),
  }

  await assert.rejects(
    async () => {
      await assertIsolatedTestDatabase(mockPool, {
        target: "postgresql://learnhub_superadmin:pass@127.0.0.1:5432/learnhub_test",
      })
    },
    /CRITICAL SAFETY VIOLATION: Live database server port '5433' does not match approved test port '5432'/
  )
})

test("15. assertIsolatedTestDatabase rejects live connection when server address is an unapproved remote address", async () => {
  const mockPool = {
    query: async () => ({
      rows: [{ db: "learnhub_test", usr: "learnhub_superadmin", server_addr: "54.214.23.11", server_port: 5432 }],
    }),
  }

  await assert.rejects(
    async () => {
      await assertIsolatedTestDatabase(mockPool, {
        target: "postgresql://learnhub_superadmin:pass@localhost:5432/learnhub_test",
      })
    },
    /CRITICAL SAFETY VIOLATION: Live database server address '54.214.23.11' is not an approved local test host/
  )
})

test("16. isApprovedServerAddress recognizes local addresses, CIDR masks, and allowlist additions", () => {
  assert.equal(isApprovedServerAddress("localhost"), true)
  assert.equal(isApprovedServerAddress("127.0.0.1"), true)
  assert.equal(isApprovedServerAddress("127.0.0.1/32"), true)
  assert.equal(isApprovedServerAddress("127.0.0.2"), true)
  assert.equal(isApprovedServerAddress("::1"), true)
  assert.equal(isApprovedServerAddress("::1/128"), true)
  assert.equal(isApprovedServerAddress("[::1]"), true)
  assert.equal(isApprovedServerAddress("192.168.1.1"), false)
  assert.equal(isApprovedServerAddress("54.21.32.11"), false)

  // With custom allowlist
  assert.equal(isApprovedServerAddress("10.0.0.5", ["10.0.0.5"]), true)
})
