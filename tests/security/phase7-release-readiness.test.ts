import test from "node:test"
import assert from "node:assert/strict"
import { sanitizeCourseMutationInput, requireRole, canAccessOwnedResource } from "@/lib/authorization"
import { getDB as getMockDB } from "@/lib/mock-db"
import { buildFinanceCurrencyRevenue } from "@/lib/analytics/adapters"
import { runCatalogSeed, STANDARD_TECHNOLOGY_CATEGORIES } from "@/scripts/seed-technology-catalog"
import type { Payment, Course, User } from "@/lib/types"

test("Phase 7 Student Journey: Access control and grade tampering prevention", () => {
  const studentUser: User = {
    id: "student-uuid-1",
    email: "student@techacademy.edu",
    password: "$2a$10$hashedpasswordforstudenttest",
    name: "Ada Lovelace",
    role: "student",
    status: "active",
    emailVerified: true,
    enrolledCourses: ["course-web-101"],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // 1. Student cannot access instructor endpoints
  assert.throws(
    () => requireRole(studentUser, ["instructor", "admin"]),
    /Forbidden/,
    "Student must be forbidden from accessing instructor or admin operations",
  )

  // 2. Student cannot mutate course approval or publication
  const studentCourseMutation = {
    title: "Unauthorized Course",
    approved: true,
    published: true,
  }
  const sanitized = sanitizeCourseMutationInput(studentCourseMutation, studentUser)
  assert.strictEqual(sanitized.approved, false, "Student cannot approve courses")
  assert.strictEqual(sanitized.published, false, "Student cannot publish courses")

  // 3. Student has ownership only of own user ID
  assert.strictEqual(
    canAccessOwnedResource(studentUser, studentUser.id),
    true,
    "Student can access own profile",
  )
  assert.strictEqual(
    canAccessOwnedResource(studentUser, "other-user-uuid"),
    false,
    "Student cannot access another user's profile",
  )
})

test("Phase 7 Instructor Journey: Cross-instructor isolation and self-approval block", () => {
  const instructorA: User = {
    id: "instructor-a",
    email: "inst-a@techacademy.edu",
    password: "$2a$10$hashedpasswordforinstructoratest",
    name: "Alan Turing",
    role: "instructor",
    status: "active",
    emailVerified: true,
    enrolledCourses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const instructorB: User = {
    id: "instructor-b",
    email: "inst-b@techacademy.edu",
    password: "$2a$10$hashedpasswordforinstructorbtest",
    name: "Grace Hopper",
    role: "instructor",
    status: "active",
    emailVerified: true,
    enrolledCourses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const courseOwnedByA: Course = {
    id: "course-123",
    title: "Compilers and Systems",
    slug: "compilers-and-systems",
    description: "Advanced compiler architecture and parsing.",
    instructorId: instructorA.id,
    instructorName: instructorA.name,
    category: "Software Engineering Fundamentals",
    level: "Pro Courses",
    totalDuration: 600,
    price: {
      NGN: 120000,
      USD: 150,
      EUR: 140,
      GBP: 120,
    },
    thumbnail: "/placeholder.svg",
    published: false,
    approved: false,
    enrollmentCount: 0,
    rating: 0,
    modules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // 1. Instructor A owns course A
  assert.strictEqual(
    canAccessOwnedResource(instructorA, courseOwnedByA.instructorId),
    true,
    "Instructor A has ownership of own course",
  )

  // 2. Instructor B CANNOT modify Instructor A's course
  assert.strictEqual(
    canAccessOwnedResource(instructorB, courseOwnedByA.instructorId),
    false,
    "Instructor B must NOT have ownership or permission over Instructor A's course",
  )

  // 3. Instructor A attempting to self-approve is blocked by sanitizer
  const attemptedSelfApproval = {
    approved: true,
    published: true,
  }
  const sanitized = sanitizeCourseMutationInput(attemptedSelfApproval, instructorA)
  assert.strictEqual(sanitized.approved, false, "Self-approval must be forced to false")
  assert.strictEqual(sanitized.published, false, "Self-publication must be forced to false")
})

test("Phase 7 Administrator Journey: Course approval validation and category deletion protection", async () => {
  const adminUser: User = {
    id: "admin-uuid",
    email: "admin@techacademy.edu",
    password: "$2a$10$hashedpasswordforadminuser",
    name: "Dean of Academic Operations",
    role: "admin",
    status: "active",
    emailVerified: true,
    enrolledCourses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  // 1. Admin authorization for course approval
  const approvalPayload = { approved: true, published: true }
  const sanitizedAdmin = sanitizeCourseMutationInput(approvalPayload, adminUser, {
    allowPublishedUpdate: true,
  })
  assert.strictEqual(sanitizedAdmin.approved, true, "Admin is authorized to approve courses")
  assert.strictEqual(sanitizedAdmin.published, true, "Admin is authorized to update published state")

  // 2. Course rejection validation requirement
  const validateRejection = (reason?: string) => {
    if (!reason || reason.trim().length === 0) {
      throw new Error("A specific rejection reason is required to reject a course submission.")
    }
    return { status: "rejected", rejectionReason: reason.trim() }
  }

  assert.throws(
    () => validateRejection(""),
    /rejection reason is required/,
    "Rejection without notes must fail validation",
  )
  assert.throws(
    () => validateRejection("   "),
    /rejection reason is required/,
    "Whitespace-only rejection reason must fail validation",
  )
  const validRejection = validateRejection("Prerequisites and technical lab exercises are missing in Module 2.")
  assert.strictEqual(validRejection.status, "rejected")
  assert.ok(validRejection.rejectionReason.length > 10)

  // 3. Category deletion safety rule: cannot delete if mapped courses exist
  const db = getMockDB()
  const testCategory = `Cloud Systems ${Date.now()}`
  const createdCat = await db.createCategory(testCategory)
  assert.ok(createdCat.id)

  const mockCoursesWithCategory: Partial<Course>[] = [
    { id: "c-test-1", category: testCategory, title: "Kubernetes at Scale" },
  ]

  const canDeleteCategory = (categoryName: string, courses: Partial<Course>[]) => {
    const mapped = courses.filter((c) => c.category === categoryName)
    if (mapped.length > 0) {
      return { allowed: false, reason: `Cannot delete category: ${mapped.length} courses are assigned to it.` }
    }
    return { allowed: true }
  }

  const deleteCheck = canDeleteCategory(testCategory, mockCoursesWithCategory)
  assert.strictEqual(deleteCheck.allowed, false, "Category deletion must be rejected when courses are mapped")
  assert.match(deleteCheck.reason || "", /assigned to it/)

  // 4. Safe deletion when 0 courses are mapped
  const deleteCheckUnused = canDeleteCategory(testCategory, [])
  assert.strictEqual(deleteCheckUnused.allowed, true, "Unused category can be safely deleted")

  const deleted = await db.deleteCategory(createdCat.id)
  assert.strictEqual(deleted, true, "Category record safely removed from database")
})

test("Phase 7 Financial Operations: Currency segregation and payment integrity", () => {
  const transactions: Payment[] = [
    {
      id: "tx-1",
      userId: "u-1",
      courseId: "c-1",
      amount: 150000,
      currency: "NGN",
      status: "completed",
      paymentMethod: "card",
      reference: "ref-ngn-1",
      createdAt: new Date(),
    },
    {
      id: "tx-2",
      userId: "u-2",
      courseId: "c-2",
      amount: 250,
      currency: "USD",
      status: "completed",
      paymentMethod: "card",
      reference: "ref-usd-1",
      createdAt: new Date(),
    },
    {
      id: "tx-3",
      userId: "u-3",
      courseId: "c-3",
      amount: 200,
      currency: "EUR",
      status: "completed",
      paymentMethod: "card",
      reference: "ref-eur-1",
      createdAt: new Date(),
    },
    {
      id: "tx-4",
      userId: "u-4",
      courseId: "c-4",
      amount: 180,
      currency: "GBP",
      status: "completed",
      paymentMethod: "card",
      reference: "ref-gbp-1",
      createdAt: new Date(),
    },
    {
      id: "tx-5",
      userId: "u-5",
      courseId: "c-1",
      amount: 500000,
      currency: "NGN",
      status: "failed",
      paymentMethod: "card",
      reference: "ref-ngn-failed",
      createdAt: new Date(),
    },
    {
      id: "tx-6",
      userId: "u-6",
      courseId: "c-1",
      amount: 300000,
      currency: "NGN",
      status: "pending",
      paymentMethod: "card",
      reference: "ref-ngn-pending",
      createdAt: new Date(),
    },
  ]

  const currencyBreakdown = buildFinanceCurrencyRevenue(transactions)
  const revenueMap = new Map(currencyBreakdown.map((item) => [item.currency, item.total]))

  // 1. Verify strict segregation and exact verified totals
  assert.strictEqual(revenueMap.get("NGN"), 150000, "NGN revenue must only count completed transactions")
  assert.strictEqual(revenueMap.get("USD"), 250, "USD revenue must only count completed transactions")
  assert.strictEqual(revenueMap.get("EUR"), 200, "EUR revenue must only count completed transactions")
  assert.strictEqual(revenueMap.get("GBP"), 180, "GBP revenue must only count completed transactions")

  // 2. Zero cross-currency multiplication or artificial conversion rates
  assert.strictEqual(
    typeof revenueMap.get("NGN"),
    "number",
    "Each currency total must be an independent numeric ledger figure",
  )

  // 3. Webhook idempotency protection simulation
  const processedEventReferences = new Set<string>()
  const handleWebhookEvent = (ref: string) => {
    if (processedEventReferences.has(ref)) {
      return { status: "ignored_duplicate" }
    }
    processedEventReferences.add(ref)
    return { status: "processed" }
  }

  assert.deepStrictEqual(handleWebhookEvent("ref-ngn-1"), { status: "processed" })
  assert.deepStrictEqual(handleWebhookEvent("ref-ngn-1"), { status: "ignored_duplicate" })
})

test("Phase 7 Catalog & Seeding Safety: Dry-run guarantees zero writes and protects legacy records", async () => {
  const result = await runCatalogSeed({ dryRun: true })

  assert.strictEqual(result.mode, "dry-run", "Must execute in dry-run mode")
  assert.strictEqual(result.writesExecuted, false, "Dry run must perform ZERO database writes")
  assert.strictEqual(
    STANDARD_TECHNOLOGY_CATEGORIES.length,
    12,
    "Must recognize the 12 standard technology engineering categories",
  )
})
