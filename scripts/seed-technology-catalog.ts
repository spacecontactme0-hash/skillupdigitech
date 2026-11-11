/**
 * Technology Academy — Non-Destructive Catalog Seed Readiness Utility
 *
 * Implements Phase 6G requirements:
 * 1. Safe, non-destructive, idempotent execution.
 * 2. Strict --dry-run support (default mode).
 * 3. Zero deletion, rename, or reassignment of legacy healthcare course records.
 * 4. Duplicate protection for standard technology categories.
 * 5. Requires explicit --execute flag to perform any database writes.
 */

import fs from "fs"
import path from "path"

function loadEnvFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      const lines = fs.readFileSync(filePath, "utf-8").split("\n")
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith("#")) {
          const idx = trimmed.indexOf("=")
          if (idx > 0) {
            const key = trimmed.slice(0, idx).trim()
            const val = trimmed.slice(idx + 1).trim()
            if (!process.env[key]) {
              process.env[key] = val.replace(/^["']|["']$/g, "")
            }
          }
        }
      }
    }
  } catch {}
}

export function ensureEnvironmentLoaded() {
  loadEnvFile(path.resolve(".env.local"))
  loadEnvFile(path.resolve(".env"))
}

import { getDB, isPostgresBackend } from "@/lib/db"

export const STANDARD_TECHNOLOGY_CATEGORIES = [
  "Full-Stack Web Development",
  "Frontend Engineering",
  "Backend Engineering",
  "Mobile Application Development",
  "Cloud Computing & DevOps",
  "Data Engineering",
  "Artificial Intelligence & Machine Learning",
  "Cybersecurity",
  "UI/UX & Product Design",
  "Blockchain & Web3",
  "Software Engineering Fundamentals",
  "Programming Languages",
]

export interface SeedReport {
  mode: "dry-run" | "execute"
  databaseBackend: string
  existingCategoriesCount: number
  existingCoursesCount: number
  categoriesToInsert: string[]
  categoriesAlreadyPresent: string[]
  coursesPreservedCount: number
  writesExecuted: boolean
}

export async function runCatalogSeed(options: { dryRun?: boolean } = {}): Promise<SeedReport> {
  const isDryRun = options.dryRun ?? true
  const isPostgres = isPostgresBackend()

  console.log("=".repeat(65))
  console.log(`Technology Academy Catalog Seed Utility`)
  console.log(`Mode: ${isDryRun ? "DRY RUN (Read-Only Simulation)" : "EXECUTE (Writes Enabled)"}`)
  console.log(`Database Backend: ${isPostgres ? "PostgreSQL" : "Mock / Local"}`)
  console.log("=".repeat(65))

  const db = getDB()
  const existingCategories = await db.getCategories()
  const existingCourses = await db.getAllCourses()

  const existingCatNamesLower = new Set(
    existingCategories.map((c: any) => c.name.trim().toLowerCase()),
  )

  const categoriesToInsert: string[] = []
  const categoriesAlreadyPresent: string[] = []

  for (const catName of STANDARD_TECHNOLOGY_CATEGORIES) {
    if (existingCatNamesLower.has(catName.toLowerCase())) {
      categoriesAlreadyPresent.push(catName)
    } else {
      categoriesToInsert.push(catName)
    }
  }

  console.log(`\nTaxonomy Audit:`)
  console.log(`- Existing categories in database: ${existingCategories.length}`)
  console.log(`- Existing course records preserved untouched: ${existingCourses.length}`)
  console.log(`- Standard tech categories already provisioned: ${categoriesAlreadyPresent.length}`)
  console.log(`- Standard tech categories to provision: ${categoriesToInsert.length}`)

  let writesExecuted = false

  if (isDryRun) {
    console.log(`\n[DRY RUN] Categories that would be inserted:`)
    if (categoriesToInsert.length === 0) {
      console.log(`  (None — all 12 standard disciplines are already present in taxonomy)`)
    } else {
      categoriesToInsert.forEach((c) => console.log(`  + ${c}`))
    }
    console.log(`\n[DRY RUN] No database writes were performed. Pass --execute to write.`)
  } else {
    console.log(`\n[EXECUTE] Inserting missing standard categories...`)
    for (const catName of categoriesToInsert) {
      await db.createCategory(catName)
      console.log(`  Inserted category: "${catName}"`)
    }
    writesExecuted = categoriesToInsert.length > 0
    console.log(`[EXECUTE] Complete. ${categoriesToInsert.length} categories added.`)
  }

  console.log(`\nCourse Catalog Readiness:`)
  console.log(`- Authentic technology courses: Pending faculty curriculum submission.`)
  console.log(`- Legacy healthcare course records: 100% preserved untouched.`)
  console.log("=".repeat(65))

  return {
    mode: isDryRun ? "dry-run" : "execute",
    databaseBackend: isPostgres ? "PostgreSQL" : "Mock",
    existingCategoriesCount: existingCategories.length,
    existingCoursesCount: existingCourses.length,
    categoriesToInsert,
    categoriesAlreadyPresent,
    coursesPreservedCount: existingCourses.length,
    writesExecuted,
  }
}

if (require.main === module) {
  ensureEnvironmentLoaded()
  const args = process.argv.slice(2)
  const isExecute = args.includes("--execute")
  const isDryRun = !isExecute || args.includes("--dry-run")

  runCatalogSeed({ dryRun: isDryRun })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed execution failed:", err)
      process.exit(1)
    })
}
