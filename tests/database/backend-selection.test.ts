import test from "node:test"
import assert from "node:assert/strict"
import { isPostgresBackend, getDB } from "../../lib/db"
import { PostgresDatabase } from "../../lib/postgres-db"

// Helper to run in isolated env
function withEnv(env: Record<string, string | undefined>, fn: () => void | Promise<void>) {
  const originalEnv = { ...process.env }
  try {
    for (const [k, v] of Object.entries(env)) {
      if (v === undefined) {
        delete process.env[k]
      } else {
        process.env[k] = v
      }
    }
    return fn()
  } finally {
    process.env = originalEnv
  }
}

test("1. Explicit DATABASE_BACKEND=postgres selects PostgreSQL with DATABASE_URL", () => {
  withEnv({
    DATABASE_BACKEND: "postgres",
    DATABASE_URL: "postgresql://user:pass@localhost:5432/testdb",
    MONGODB_URI: "mongodb://localhost:27017/testdb", // Even if obsolete MONGODB_URI is present
  }, () => {
    assert.equal(isPostgresBackend(), true)
    const db = getDB()
    assert.ok(db instanceof PostgresDatabase)
  })
})

test("2. Explicit DATABASE_BACKEND=postgres throws clear error when connection string is missing", () => {
  withEnv({
    DATABASE_BACKEND: "postgres",
    DATABASE_URL: undefined,
    POSTGRES_URL: undefined,
    MIGRATION_POSTGRES_URL: undefined,
  }, () => {
    assert.equal(isPostgresBackend(), true)
    assert.throws(
      () => getDB(),
      /PostgreSQL backend selected, but no connection string was found/
    )
  })
})

test("3. Invalid DATABASE_BACKEND fails closed and throws actionable error", () => {
  withEnv({
    DATABASE_BACKEND: "sqlite",
  }, () => {
    assert.throws(
      () => isPostgresBackend(),
      /Invalid DATABASE_BACKEND "sqlite"/
    )
  })
})

test("4. Conflicting config (both PostgreSQL and MongoDB URLs) without DATABASE_BACKEND throws ambiguous config error", () => {
  withEnv({
    DATABASE_BACKEND: undefined,
    DATABASE_URL: "postgresql://localhost:5432/testdb",
    MONGODB_URI: "mongodb://localhost:27017/testdb",
  }, () => {
    assert.throws(
      () => isPostgresBackend(),
      /Ambiguous database configuration: MONGODB_URI is obsolete and retired/
    )
  })
})

test("5. Missing DATABASE_BACKEND with only MONGODB_URI fails closed and indicates MongoDB is retired", () => {
  withEnv({
    DATABASE_BACKEND: undefined,
    DATABASE_URL: undefined,
    POSTGRES_URL: undefined,
    MIGRATION_POSTGRES_URL: undefined,
    MONGODB_URI: "mongodb://localhost:27017/testdb",
  }, () => {
    assert.throws(
      () => isPostgresBackend(),
      /MONGODB_URI is present but MongoDB is retired/
    )
  })
})

test("6. Production requires explicit PostgreSQL configuration", () => {
  withEnv({
    NODE_ENV: "production",
    DATABASE_BACKEND: undefined,
    DATABASE_URL: undefined,
    POSTGRES_URL: undefined,
    MONGODB_URI: undefined,
  }, () => {
    assert.throws(
      () => isPostgresBackend(),
      /No database configured in production environment/
    )
  })
})

test("7. Explicit DATABASE_BACKEND=mongodb throws deprecation error indicating retirement", () => {
  withEnv({
    DATABASE_BACKEND: "mongodb",
  }, () => {
    assert.throws(
      () => isPostgresBackend(),
      /DATABASE_BACKEND "mongodb" is deprecated and retired/
    )
  })
})
