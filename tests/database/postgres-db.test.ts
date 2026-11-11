import assert from "node:assert/strict"
import test, { after, before } from "node:test"
import { randomUUID } from "node:crypto"

// Set isolated test database URL before importing db clients
process.env.DATABASE_BACKEND = "postgres"
if (process.env.TEST_POSTGRES_URL) {
  process.env.DATABASE_URL = process.env.TEST_POSTGRES_URL
}

import { getPool, closePool, getDrizzleDb } from "../../db/client"
import { getPostgresDatabase } from "../../lib/postgres-db"
import { isPostgresBackend, getDB } from "../../lib/db"
import * as schema from "../../db/schema"
import { sql } from "drizzle-orm"
import type { PaymentEventType } from "../../lib/types"

const db = getPostgresDatabase()

// Track test entities for clean teardown
const testIdPrefix = `test_${Date.now()}_`

before(async () => {
  // Ensure connection works
  const pool = getPool()
  const res = await pool.query("SELECT current_database() as db;")
  assert.ok(res.rows[0]?.db, "Tests must run against an active PostgreSQL database")
})

after(async () => {
  // Clean up all test data created during the test run
  const drizzle = getDrizzleDb()
  await drizzle.execute(sql`DELETE FROM payment_events WHERE payment_id LIKE ${testIdPrefix + "%"} OR reference LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM payments WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM certificates WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM learning_notes WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM enrollments WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM lessons WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM course_modules WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM courses WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM categories WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM onboarding_events WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM admin_logs WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM pending_registrations WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM users WHERE id LIKE ${testIdPrefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM app_settings WHERE id LIKE ${testIdPrefix + "%"}`)

  await closePool()
})

test("1. Database connection and schema readiness", async () => {
  assert.equal(isPostgresBackend(), true, "isPostgresBackend should be true")
  const activeDb = getDB()
  assert.ok(activeDb, "getDB() should return database instance")
  assert.equal(activeDb, db, "getDB() should return PostgresDatabase singleton")

  // Verify all 19 schema tables exist in the database
  const pool = getPool()
  const tablesRes = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;",
  )
  const existingTables = new Set(tablesRes.rows.map((r) => r.table_name))
  const expectedTables = [
    "users",
    "pending_registrations",
    "categories",
    "courses",
    "course_modules",
    "lessons",
    "enrollments",
    "payments",
    "payment_events",
    "certificates",
    "quizzes",
    "quiz_questions",
    "assignments",
    "learning_notes",
    "admin_logs",
    "onboarding_events",
    "migration_audit",
    "table_relationships",
    "app_settings",
  ]

  for (const table of expectedTables) {
    assert.ok(existingTables.has(table), `Table ${table} must exist in PostgreSQL schema`)
  }
})

test("2. Empty-database startup behavior", async () => {
  // Querying on non-existent IDs or empty state should return empty lists or undefined/null without throwing
  const nonExistentId = `${testIdPrefix}non_existent_${randomUUID()}`
  const user = await db.findUserById(nonExistentId)
  assert.equal(user, undefined, "findUserById for non-existent user should return undefined")

  const course = await db.getCourseById(nonExistentId)
  assert.equal(course, undefined, "getCourseById for non-existent course should return undefined")

  const enrollments = await db.getEnrollmentsByUserId(nonExistentId)
  assert.deepEqual(enrollments, [], "getEnrollmentsByUserId for non-existent user should return empty array")

  const payments = await db.getPaymentsByUserId(nonExistentId)
  assert.deepEqual(payments, [], "getPaymentsByUserId for non-existent user should return empty array")

  const settings = await db.getAppSettings(nonExistentId)
  assert.equal(settings, null, "getAppSettings for non-existent ID should return null")
})

test("3. Registration and authentication lifecycle", async () => {
  const pendingId = `${testIdPrefix}pending_${randomUUID()}`
  const pendingEmail = `pending_${randomUUID()}@example.com`
  const pendingOtp = "123456"
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  // Create pending registration
  await db.createPendingRegistration({
    id: pendingId,
    email: pendingEmail,
    password: "$2a$10$hashedpasswordplaceholder",
    name: "Pending Student",
    role: "student",
    otpHash: pendingOtp,
    otpExpiresAt: expiresAt,
  })

  // Find pending registration
  const foundPending = await db.findPendingRegistrationByEmail(pendingEmail)
  assert.ok(foundPending, "Pending registration should be found")
  assert.equal(foundPending?.id, pendingId)
  assert.equal(foundPending?.email, pendingEmail)
  assert.equal(foundPending?.otpHash, pendingOtp)

  // Clean pending registration
  await db.deletePendingRegistration(pendingEmail)
  const afterDeletePending = await db.findPendingRegistrationByEmail(pendingEmail)
  assert.equal(afterDeletePending, undefined, "Pending registration should be deleted")

  // Create real user
  const userId = `${testIdPrefix}user_${randomUUID()}`
  const userEmail = `student_${randomUUID()}@example.com`
  const createdUser = await db.createUser({
    id: userId,
    email: userEmail,
    password: "$2a$10$realhashedpassword",
    name: "John Doe",
    role: "student",
    emailVerified: true,
    enrolledCourses: [],
  })

  assert.equal(createdUser.id, userId)
  assert.equal(createdUser.email, userEmail)
  assert.equal(createdUser.role, "student")
  assert.equal(createdUser.status, "active")

  // Find user by ID
  const fetchedUser = await db.findUserById(userId)
  assert.ok(fetchedUser, "User should be found by ID")
  assert.equal(fetchedUser?.email, userEmail)

  // Find user by email (case-insensitive)
  const fetchedByEmail = await db.findUserByEmail(userEmail.toUpperCase())
  assert.ok(fetchedByEmail, "User should be found by upper-cased email")
  assert.equal(fetchedByEmail?.id, userId)

  // Prevent duplicate user with same email
  await assert.rejects(
    async () => {
      await db.createUser({
        id: `${testIdPrefix}dup_${randomUUID()}`,
        email: userEmail,
        password: "hash",
        name: "Duplicate User",
        role: "student",
        enrolledCourses: [],
      })
    },
    (err: any) => {
      const isUniqueError =
        err.code === "23505" ||
        err.cause?.code === "23505" ||
        err.message?.includes("unique") ||
        err.message?.includes("duplicate")
      assert.ok(isUniqueError, "Should fail on unique constraint")
      return true
    },
  )
})

test("4. Role and ownership authorization persistence", async () => {
  const instructorId = `${testIdPrefix}instructor_${randomUUID()}`
  const instructorEmail = `instructor_${randomUUID()}@example.com`
  const instructor = await db.createUser({
    id: instructorId,
    email: instructorEmail,
    password: "hash",
    name: "Dr. Jane Smith",
    role: "instructor",
    enrolledCourses: [],
    instructorProfile: {
      phoneNumber: "1234567890",
      professionalHeadline: "Senior Cloud Architect",
      specialties: ["PostgreSQL", "Cloud"],
      yearsOfExperience: 10,
    },
  })

  assert.equal(instructor.role, "instructor")
  assert.equal(instructor.instructorProfile?.professionalHeadline, "Senior Cloud Architect")

  // Update user profile and role
  const updatedUser = await db.updateUser(instructorId, {
    bio: "Updated biography",
    role: "admin",
  })

  assert.ok(updatedUser, "updateUser should return updated user")
  assert.equal(updatedUser?.bio, "Updated biography")
  assert.equal(updatedUser?.role, "admin")

  const refetched = await db.findUserById(instructorId)
  assert.equal(refetched?.role, "admin")
})

test("5. Course, Module, and Lesson CRUD with relational joins", async () => {
  // Create Category
  const catId = `${testIdPrefix}cat_${randomUUID()}`
  const category = await db.createCategory({
    id: catId,
    name: "DevOps & Cloud",
  })
  assert.equal(category.id, catId)
  assert.equal(category.name, "DevOps & Cloud")

  // Create Instructor User
  const instructorId = `${testIdPrefix}inst_${randomUUID()}`
  await db.createUser({
    id: instructorId,
    email: `inst_${randomUUID()}@example.com`,
    password: "hash",
    name: "Course Creator",
    role: "instructor",
    enrolledCourses: [],
  })

  // Create Course
  const courseId = `${testIdPrefix}course_${randomUUID()}`
  const courseSlug = `postgres-mastery-${randomUUID()}`
  const moduleId = `${testIdPrefix}mod_${randomUUID()}`
  const lessonId1 = `${testIdPrefix}les1_${randomUUID()}`
  const lessonId2 = `${testIdPrefix}les2_${randomUUID()}`

  const createdCourse = await db.createCourse({
    id: courseId,
    title: "PostgreSQL Production Mastery",
    slug: courseSlug,
    description: "Deep dive into PostgreSQL",
    instructorId,
    instructorName: "Course Creator",
    category: "DevOps & Cloud",
    level: "Beginner Courses",
    price: { NGN: 50, USD: 10, EUR: 8, GBP: 7 },
    thumbnail: "https://example.com/thumb.jpg",
    published: true,
    approved: true,
    totalDuration: 35,
    enrollmentCount: 0,
    rating: 0,
    modules: [
      {
        id: moduleId,
        title: "Module 1: Architecture",
        order: 1,
        lessons: [
          {
            id: lessonId1,
            title: "Lesson 1: MVCC Deep Dive",
            type: "video",
            order: 1,
            duration: 15,
            isFree: true,
            content: {},
          },
          {
            id: lessonId2,
            title: "Lesson 2: Query Optimization",
            type: "article",
            order: 2,
            duration: 20,
            isFree: false,
            content: {},
          },
        ],
      },
    ],
  })

  assert.equal(createdCourse.id, courseId)
  assert.equal(createdCourse.modules?.length, 1)
  assert.equal(createdCourse.modules?.[0]?.lessons?.length, 2)

  // Verify relational query loads modules and lessons correctly
  const fetchedCourse = await db.getCourseById(courseId)
  assert.ok(fetchedCourse, "Course should be found by ID")
  assert.equal(fetchedCourse?.modules?.length, 1)
  assert.equal(fetchedCourse?.modules?.[0]?.title, "Module 1: Architecture")
  assert.equal(fetchedCourse?.modules?.[0]?.lessons?.length, 2)
  assert.equal(fetchedCourse?.modules?.[0]?.lessons?.[0]?.title, "Lesson 1: MVCC Deep Dive")

  // Update course
  const updatedCourse = await db.updateCourse(courseId, {
    title: "PostgreSQL Production Mastery (Updated)",
    price: { NGN: 60, USD: 12, EUR: 10, GBP: 9 },
  })
  assert.equal(updatedCourse?.title, "PostgreSQL Production Mastery (Updated)")
  assert.equal(updatedCourse?.price.NGN, 60)
})

test("6. Enrollment relationships and learning progress", async () => {
  // Create student and instructor users
  const studentId = `${testIdPrefix}student_${randomUUID()}`
  await db.createUser({
    id: studentId,
    email: `student_enroll_${randomUUID()}@example.com`,
    password: "hash",
    name: "Enrolled Student",
    role: "student",
    enrolledCourses: [],
  })

  const instructorId = `${testIdPrefix}inst_enroll_${randomUUID()}`
  await db.createUser({
    id: instructorId,
    email: `inst_enroll_${randomUUID()}@example.com`,
    password: "hash",
    name: "Instructor User",
    role: "instructor",
    enrolledCourses: [],
  })

  const courseId = `${testIdPrefix}course_enroll_${randomUUID()}`
  await db.createCourse({
    id: courseId,
    title: "Enrollment Test Course",
    slug: `enroll-test-${randomUUID()}`,
    description: "Testing enrollments",
    instructorId,
    instructorName: "Instructor User",
    category: "General",
    level: "Beginner Courses",
    price: { NGN: 0, USD: 0, EUR: 0, GBP: 0 },
    thumbnail: "",
    published: true,
    approved: true,
    totalDuration: 0,
    enrollmentCount: 0,
    rating: 0,
    modules: [],
  })

  // Create enrollment
  const enrollmentId = `${testIdPrefix}enroll_${randomUUID()}`
  const enrollment = await db.createEnrollment({
    id: enrollmentId,
    userId: studentId,
    courseId,
    progress: 0,
    completedLessons: [],
    status: "active",
    enrolledAt: new Date(),
  })

  assert.equal(enrollment.id, enrollmentId)
  assert.equal(enrollment.progress, 0)

  // Verify enrollment lookup
  const userEnrollments = await db.getEnrollmentsByUserId(studentId)
  assert.equal(userEnrollments.length, 1)
  assert.equal(userEnrollments[0].courseId, courseId)

  // Update progress
  const updatedEnrollment = await db.updateEnrollmentProgress(enrollmentId, 50, ["lesson_1"])
  assert.equal(updatedEnrollment?.progress, 50)
  assert.deepEqual(updatedEnrollment?.completedLessons, ["lesson_1"])

  // Enrollment duplicate key rejection
  await assert.rejects(
    async () => {
      // Direct insert or create without the getEnrollment check to test db constraint
      const drizzle = getDrizzleDb()
      await drizzle.insert(schema.enrollments).values({
        id: `${testIdPrefix}enroll_dup_${randomUUID()}`,
        userId: studentId,
        courseId,
        progress: 0,
      })
    },
    (err: any) => {
      const isUniqueError =
        err.code === "23505" ||
        err.cause?.code === "23505" ||
        err.message?.includes("unique") ||
        err.message?.includes("duplicate")
      assert.ok(isUniqueError, "Should enforce uniq_enrollments_user_course")
      return true
    },
  )
})

test("7. Payment verification and atomic idempotency locking", async () => {
  const userId = `${testIdPrefix}pay_user_${randomUUID()}`
  await db.createUser({
    id: userId,
    email: `pay_user_${randomUUID()}@example.com`,
    password: "hash",
    name: "Payment Tester",
    role: "student",
    enrolledCourses: [],
  })

  const instructorId = `${testIdPrefix}pay_inst_${randomUUID()}`
  await db.createUser({
    id: instructorId,
    email: `pay_inst_${randomUUID()}@example.com`,
    password: "hash",
    name: "Payment Instructor",
    role: "instructor",
    enrolledCourses: [],
  })

  const courseId = `${testIdPrefix}pay_course_${randomUUID()}`
  await db.createCourse({
    id: courseId,
    title: "Pay Course",
    slug: `pay-course-${randomUUID()}`,
    description: "Paid course",
    instructorId,
    category: "General",
    level: "Beginner Courses",
    price: { NGN: 15000, USD: 10, EUR: 8, GBP: 7 },
    thumbnail: "",
    published: true,
    approved: true,
    totalDuration: 0,
    enrollmentCount: 0,
    rating: 0,
    modules: [],
  })

  const paymentId = `${testIdPrefix}pay_${randomUUID()}`
  const reference = `REF_${randomUUID()}`

  // Create payment
  const payment = await db.createPayment({
    id: paymentId,
    reference,
    userId,
    courseId,
    paymentType: "course_purchase",
    paymentMethod: "card",
    amount: 15000,
    currency: "NGN",
    status: "pending",
    createdAt: new Date(),
  })

  assert.equal(payment.id, paymentId)
  assert.equal(payment.status, "pending")
  assert.equal(payment.reference, reference)

  // Lookup by reference
  const fetchedPayment = await db.getPaymentByReference(reference)
  assert.ok(fetchedPayment, "Payment should be found by reference")
  assert.equal(fetchedPayment?.id, paymentId)

  // 1st atomic lock acquisition should succeed
  const lock1 = await db.acquirePaymentVerificationLock(reference, 30)
  assert.ok(lock1, "First lock acquisition should succeed")
  assert.equal(lock1?.reference, reference)

  // 2nd atomic lock acquisition immediately after should fail (idempotency protection)
  const lock2 = await db.acquirePaymentVerificationLock(reference, 30)
  assert.equal(lock2, undefined, "Second immediate lock acquisition must return undefined")

  // Release lock
  await db.releasePaymentVerificationLock(reference)

  // Lock acquisition after release should succeed again
  const lock3 = await db.acquirePaymentVerificationLock(reference, 30)
  assert.ok(lock3, "Lock acquisition after release should succeed")

  // Complete payment and log event
  const completedPayment = await db.updatePayment(reference, {
    status: "completed",
    gatewayStatus: "success",
  })
  assert.equal(completedPayment?.status, "completed")

  // Log payment event
  const eventId = `${testIdPrefix}pay_event_${randomUUID()}`
  const loggedEvent = await db.createPaymentEvent({
    paymentId,
    reference,
    type: "verify" as PaymentEventType,
    source: "paystack",
    status: "success",
    message: "Payment confirmed",
  })
  assert.equal(loggedEvent.reference, reference)
  assert.equal(loggedEvent.type, "verify")
})

test("8. Certificates, Notes, Admin Logs, and App Settings", async () => {
  const userId = `${testIdPrefix}cert_user_${randomUUID()}`
  await db.createUser({
    id: userId,
    email: `cert_user_${randomUUID()}@example.com`,
    password: "hash",
    name: "Cert Student",
    role: "student",
    enrolledCourses: [],
  })

  const instructorId = `${testIdPrefix}cert_inst_${randomUUID()}`
  await db.createUser({
    id: instructorId,
    email: `cert_inst_${randomUUID()}@example.com`,
    password: "hash",
    name: "Cert Instructor",
    role: "instructor",
    enrolledCourses: [],
  })

  const courseId = `${testIdPrefix}cert_course_${randomUUID()}`
  await db.createCourse({
    id: courseId,
    title: "Cloud Engineering",
    slug: `cloud-eng-${randomUUID()}`,
    description: "Cloud Engineering Course",
    instructorId,
    category: "General",
    level: "Beginner Courses",
    price: { NGN: 100, USD: 1, EUR: 1, GBP: 1 },
    thumbnail: "",
    published: true,
    approved: true,
    totalDuration: 0,
    enrollmentCount: 0,
    rating: 0,
    modules: [],
  })

  // Certificates
  const certId = `${testIdPrefix}cert_${randomUUID()}`
  const certCode = `CERT-${randomUUID().slice(0, 8).toUpperCase()}`
  const certificate = await db.createCertificate({
    id: certId,
    verificationCode: certCode,
    userId,
    courseId,
    certificateUrl: `https://learnhub.test/certs/${certCode}`,
    issuedAt: new Date(),
  })
  assert.equal(certificate.id, certId)
  assert.equal(certificate.verificationCode, certCode)

  const verifiedCert = await db.getCertificateByVerificationCode(certCode)
  assert.ok(verifiedCert, "Certificate must be verifiable by verification code")
  assert.equal(verifiedCert?.userId, userId)

  // Learning notes
  const noteId = `${testIdPrefix}note_${randomUUID()}`
  const note = await db.createNote({
    id: noteId,
    userId,
    courseId,
    content: "Important insight on PostgreSQL MVCC",
  })
  assert.equal(note.id, noteId)
  const notes = await db.getLearningNotesByUserAndCourse(userId, courseId)
  assert.equal(notes.length, 1)
  assert.equal(notes[0].content, "Important insight on PostgreSQL MVCC")

  // Admin logs
  const logId = `${testIdPrefix}admin_log_${randomUUID()}`
  const adminLog = await db.createAdminLog({
    id: logId,
    actorId: userId,
    actorName: "Cert Student",
    actorEmail: "cert_user@example.com",
    action: "other",
  })
  assert.equal(adminLog.id, logId)

  // App Settings
  const settingsKey = `${testIdPrefix}app_config`
  await db.setAppSettings(settingsKey, { siteName: "Technology Academy", active: true })
  const savedSettings = await db.getAppSettings<{ siteName: string; active: boolean }>(settingsKey)
  assert.deepEqual(savedSettings, { siteName: "Technology Academy", active: true })

  // Update existing app settings
  await db.setAppSettings(settingsKey, { siteName: "Technology Academy Pro", active: false })
  const updatedSettings = await db.getAppSettings<{ siteName: string; active: boolean }>(settingsKey)
  assert.deepEqual(updatedSettings, { siteName: "Technology Academy Pro", active: false })
})
