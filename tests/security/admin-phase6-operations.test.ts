import test from "node:test"
import assert from "node:assert/strict"
import { sanitizeCourseMutationInput } from "@/lib/authorization"
import { getDB as getMockDB } from "@/lib/mock-db"
import { runCatalogSeed, STANDARD_TECHNOLOGY_CATEGORIES } from "@/scripts/seed-technology-catalog"
import { buildFinanceCurrencyRevenue } from "@/lib/analytics/adapters"
import type { Payment } from "@/lib/types"

test("Phase 6 Security: Instructor cannot self-approve or self-publish courses", () => {
  const instructorUser = { id: "inst-1", role: "instructor" as const }

  const untrustedInput = {
    title: "Advanced Distributed Systems",
    approved: true,
    published: true,
    instructorId: "some-other-instructor",
  }

  const sanitized = sanitizeCourseMutationInput(untrustedInput, instructorUser)

  assert.strictEqual(
    sanitized.approved,
    false,
    "Instructor input must have approved forced to false",
  )
  assert.strictEqual(
    sanitized.published,
    false,
    "Instructor input must have published forced to false",
  )
  assert.strictEqual(
    sanitized.instructorId,
    "inst-1",
    "InstructorId must be locked to acting instructor",
  )
})

test("Phase 6 Security: Administrator is allowed to authorize course approval", () => {
  const adminUser = { id: "admin-1", role: "admin" as const }

  const approvalInput = {
    title: "Cloud Infrastructure Engineering",
    approved: true,
    published: false,
  }

  const sanitized = sanitizeCourseMutationInput(approvalInput, adminUser, {
    allowPublishedUpdate: true,
  })

  assert.strictEqual(sanitized.approved, true, "Admin should be able to set approved to true")
  assert.strictEqual(sanitized.published, false, "Admin should be able to set published state")
})

test("Phase 6 Category Architecture: Category deletion integrity and mock database support", async () => {
  const db = getMockDB()

  // 1. Create a category
  const testCatName = `DevOps Engineering ${Date.now()}`
  const created = await db.createCategory(testCatName)
  assert.ok(created.id, "Category should have an ID")
  assert.strictEqual(created.name, testCatName)

  // 2. Fetch categories
  const allCats = await db.getCategories()
  assert.ok(
    allCats.some((c: any) => c.id === created.id),
    "Created category should appear in category list",
  )

  // 3. Update category name
  const updatedName = `${testCatName} Renamed`
  const updated = await db.updateCategory(created.id, updatedName)
  assert.ok(updated, "Update should succeed")
  assert.strictEqual(updated?.name, updatedName)

  // 4. Delete category
  const deleted = await db.deleteCategory(created.id)
  assert.strictEqual(deleted, true, "Category deletion should succeed")

  const afterDelete = await db.getCategories()
  assert.ok(
    !afterDelete.some((c: any) => c.id === created.id),
    "Deleted category must no longer exist in category list",
  )
})

test("Phase 6 Financial Integrity: Currency revenues must remain segregated by ledger currency", () => {
  const samplePayments: Payment[] = [
    {
      id: "p1",
      userId: "u1",
      courseId: "c1",
      amount: 150000,
      currency: "NGN",
      status: "completed",
      paymentMethod: "card",
      reference: "ref-1",
      createdAt: new Date(),
    },
    {
      id: "p2",
      userId: "u2",
      courseId: "c1",
      amount: 250,
      currency: "USD",
      status: "completed",
      paymentMethod: "card",
      reference: "ref-2",
      createdAt: new Date(),
    },
    {
      id: "p3",
      userId: "u3",
      courseId: "c1",
      amount: 180,
      currency: "GBP",
      status: "completed",
      paymentMethod: "card",
      reference: "ref-3",
      createdAt: new Date(),
    },
    {
      id: "p4",
      userId: "u4",
      courseId: "c1",
      amount: 500,
      currency: "USD",
      status: "failed", // Should NOT be counted as revenue!
      paymentMethod: "card",
      reference: "ref-4",
      createdAt: new Date(),
    },
    {
      id: "p5",
      userId: "u5",
      courseId: "c1",
      amount: 100000,
      currency: "NGN",
      status: "pending", // Should NOT be counted as revenue!
      paymentMethod: "card",
      reference: "ref-5",
      createdAt: new Date(),
    },
  ]

  const segregated = buildFinanceCurrencyRevenue(samplePayments)

  const ngnRevenue = segregated.find((s) => s.currency === "NGN")?.total
  const usdRevenue = segregated.find((s) => s.currency === "USD")?.total
  const gbpRevenue = segregated.find((s) => s.currency === "GBP")?.total

  assert.strictEqual(ngnRevenue, 150000, "NGN revenue must strictly match completed NGN payments")
  assert.strictEqual(usdRevenue, 250, "USD revenue must strictly match completed USD payments")
  assert.strictEqual(gbpRevenue, 180, "GBP revenue must strictly match completed GBP payments")

  // Ensure currencies were not added together into one fake total
  assert.strictEqual(
    segregated.length,
    3,
    "Each currency must be reported independently without cross-currency mixing",
  )
})

test("Phase 6 Catalog Seed Readiness: Dry run performs zero database writes", async () => {
  const report = await runCatalogSeed({ dryRun: true })

  assert.strictEqual(report.mode, "dry-run", "Must execute in dry-run mode")
  assert.strictEqual(report.writesExecuted, false, "Dry run must perform zero database writes")
  assert.strictEqual(
    STANDARD_TECHNOLOGY_CATEGORIES.length,
    12,
    "Must have 12 standard technology engineering categories",
  )
})
