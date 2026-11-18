import fs from "node:fs"
import path from "node:path"
import { Pool } from "pg"
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import * as schema from "./schema"

let poolInstance: Pool | null = null
let drizzleInstance: NodePgDatabase<typeof schema> | null = null

export function getPostgresUrl(): string {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL && !process.env.MIGRATION_POSTGRES_URL) {
    for (const envFile of [".env.local", ".env"]) {
      try {
        const fullPath = path.resolve(process.cwd(), envFile)
        if (fs.existsSync(fullPath) && typeof process.loadEnvFile === "function") {
          process.loadEnvFile(fullPath)
        }
      } catch {}
    }
  }

  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.MIGRATION_POSTGRES_URL

  if (!url) {
    throw new Error(
      "PostgreSQL configuration is missing. Expected DATABASE_URL or POSTGRES_URL in environment.",
    )
  }
  return url
}

export function getPool(): Pool {
  if (!poolInstance) {
    const connectionString = getPostgresUrl()
    poolInstance = new Pool({
      connectionString,
      max: Number(process.env.PG_MAX_POOL_SIZE || 20),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: Number(process.env.PG_CONNECTION_TIMEOUT_MS || 20000),
    })

    poolInstance.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client", err)
    })
  }
  return poolInstance
}

export function getDrizzleDb(): NodePgDatabase<typeof schema> {
  if (!drizzleInstance) {
    const pool = getPool()
    drizzleInstance = drizzle(pool, { schema })
  }
  return drizzleInstance
}

export async function closePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end()
    poolInstance = null
    drizzleInstance = null
  }
}
