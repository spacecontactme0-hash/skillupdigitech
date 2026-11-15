import fs from "fs"
import path from "path"

const migrationPath = path.resolve("db/migrations/0007_violet_scrambler.sql")
let sql = fs.readFileSync(migrationPath, "utf-8")

// 1. Replace CREATE TABLE "..." with CREATE TABLE IF NOT EXISTS "..."
sql = sql.replace(/CREATE TABLE ("[^"]+")/g, 'CREATE TABLE IF NOT EXISTS $1')

// 2. Replace CREATE UNIQUE INDEX "..." with CREATE UNIQUE INDEX IF NOT EXISTS "..."
sql = sql.replace(/CREATE UNIQUE INDEX ("[^"]+")/g, 'CREATE UNIQUE INDEX IF NOT EXISTS $1')

// 3. Replace CREATE INDEX "..." with CREATE INDEX IF NOT EXISTS "..."
sql = sql.replace(/CREATE INDEX ("[^"]+")/g, 'CREATE INDEX IF NOT EXISTS $1')

// 4. Replace ADD COLUMN "..." with ADD COLUMN IF NOT EXISTS "..."
sql = sql.replace(/ADD COLUMN ("[^"]+")/g, 'ADD COLUMN IF NOT EXISTS $1')

fs.writeFileSync(migrationPath, sql, "utf-8")
console.log("Updated 0007_violet_scrambler.sql with IF NOT EXISTS safeguards.")
