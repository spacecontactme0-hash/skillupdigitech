import { getPostgresDatabase } from "./postgres-db"
import { getDB as getMockDB } from "./mock-db"

export function isPostgresBackend(): boolean {
  const backend = process.env.DATABASE_BACKEND?.trim()

  if (backend) {
    if (backend === "postgres") return true
    if (backend === "mongodb") {
      throw new Error(
        'DATABASE_BACKEND "mongodb" is deprecated and retired. The application runs exclusively on PostgreSQL.',
      )
    }
    throw new Error(
      `Invalid DATABASE_BACKEND "${backend}". Supported value is "postgres".`,
    )
  }

  const hasPgUrl = Boolean(
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.MIGRATION_POSTGRES_URL,
  )
  const hasMongoUri = Boolean(process.env.MONGODB_URI)

  if (hasPgUrl && hasMongoUri) {
    throw new Error(
      "Ambiguous database configuration: MONGODB_URI is obsolete and retired. Explicitly set DATABASE_BACKEND=postgres.",
    )
  }

  if (hasPgUrl) {
    return true
  }

  if (hasMongoUri) {
    throw new Error(
      "MONGODB_URI is present but MongoDB is retired. The application runs exclusively on PostgreSQL. Set DATABASE_BACKEND=postgres and provide DATABASE_URL.",
    )
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "No database configured in production environment. Explicit PostgreSQL configuration is required (DATABASE_BACKEND=postgres, DATABASE_URL=...).",
    )
  }

  return false
}

export function getDB() {
  if (isPostgresBackend()) {
    const url =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.MIGRATION_POSTGRES_URL
    if (!url) {
      throw new Error(
        "PostgreSQL backend selected, but no connection string was found. Expected DATABASE_URL or POSTGRES_URL.",
      )
    }
    return getPostgresDatabase()
  }

  const backend = process.env.DATABASE_BACKEND?.trim()
  if (backend === "mongodb") {
    throw new Error("DATABASE_BACKEND 'mongodb' is retired. MongoDB is no longer supported.")
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Production environment requires PostgreSQL. Configure DATABASE_BACKEND=postgres and DATABASE_URL.",
    )
  }

  return getMockDB()
}
