import test, { describe, before, after } from "node:test"
import assert from "node:assert/strict"
import { randomUUID, createHmac } from "node:crypto"
import { getIsolatedTestDbConfig, assertIsolatedTestDatabase } from "../helpers/test-db-isolation"

const testDbConfig = getIsolatedTestDbConfig()

describe("Staging E2E Journeys (PostgreSQL)", {
  skip: !testDbConfig.isConfigured ? testDbConfig.skipReason : false,
}, () => {
  process.env.JWT_SECRET = "staging-e2e-verification-jwt-secret-key-32-chars-minimum"
  process.env.PAYSTACK_SECRET_KEY = "sk_test_staging_verification_secret_key"
  process.env.ADMIN_ACCOUNTS_EMAIL = "staging.admin.e2e@promptcareacademy.com"
  process.env.ADMIN_ACCOUNTS_PASSWORD = "StagingE2EAdminPass123!"

  const { isPostgresBackend, getDB } = require("../../lib/db")
  const { getPool, closePool, getDrizzleDb } = require("../../db/client")
  const { authService, generateToken } = require("../../lib/auth")
  const { getAcademicDb } = require("../../lib/academic-db")
  const { paystackService } = require("../../lib/paystack")
  const { getAdminSettings, updateAdminSettings } = require("../../lib/admin-settings")
  const { sql } = require("drizzle-orm")
  const jwt = require("jsonwebtoken")

  let academicDb: any
  const prefix = `e2e_${Date.now()}_`
  const testEntities: {
    userIds: string[]
    courseIds: string[]
    quizIds: string[]
    assignmentIds: string[]
    projectIds: string[]
    paymentIds: string[]
    enrollmentIds: string[]
  } = {
    userIds: [],
    courseIds: [],
    quizIds: [],
    assignmentIds: [],
    projectIds: [],
    paymentIds: [],
    enrollmentIds: [],
  }

  before(async () => {
    const pool = getPool()
    await assertIsolatedTestDatabase(pool)
    academicDb = getAcademicDb()
  })

  after(async () => {
    await closePool()
  })

  test("0. Database Readiness & Configuration Verification", async () => {
    assert.equal(isPostgresBackend(), true, "DATABASE_BACKEND must resolve to postgres")
    const pool = getPool()
    const res = await pool.query("SELECT current_database() as db;")
    assert.equal(
      res.rows[0].db,
      "learnhub_test",
      "Must connect strictly to isolated test database 'learnhub_test'",
    )
  
  // Verify expected core and academic tables exist
  const tablesRes = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';",
  )
  const existingTables = new Set(tablesRes.rows.map((r: any) => r.table_name))
  const requiredTables = [
    "users",
    "courses",
    "lessons",
    "enrollments",
    "payments",
    "payment_events",
    "quiz_attempts",
    "assignment_submissions",
    "rubrics",
    "grades",
    "grade_history",
    "projects",
    "project_submissions",
    "app_settings",
    "admin_logs",
  ]
  for (const table of requiredTables) {
    assert.ok(existingTables.has(table), `Table ${table} must exist in PostgreSQL schema`)
  }
})

test("1. Student Journey: Registration, Enrollment, Lesson Progress, Quizzes, Assignments & Capstone", async () => {
  const db = getDB()
  
  // 1.1 Student Registration & Login
  const studentEmail = `${prefix}student1@promptcareacademy.com`
  const studentPassword = "SecureStudentPass123!"
  const studentUser = await db.createUser({
    id: randomUUID(),
    email: studentEmail,
    password: studentPassword,
    name: "Alex Learner",
    role: "student",
    status: "active",
    emailVerified: true,
    enrolledCourses: [],
  })
  testEntities.userIds.push(studentUser.id)
  
  const studentToken = generateToken(studentUser)
  assert.ok(studentToken, "Generated student JWT token")

  // Create Instructor and Course for student to interact with
  const instructor = await db.createUser({
    id: randomUUID(),
    email: `${prefix}instructor1@promptcareacademy.com`,
    password: "SecureInstructorPass123!",
    name: "Prof. Sarah Connor",
    role: "instructor",
    status: "active",
    emailVerified: true,
    enrolledCourses: [],
  })
  testEntities.userIds.push(instructor.id)
  const instructorToken = generateToken(instructor)

  const course = await db.createCourse({
    id: randomUUID(),
    title: "Full-Stack Software Architecture & Cloud",
    slug: `${prefix}fullstack-cloud`,
    description: "Production architectural practices",
    price: { NGN: 75000, USD: 150, EUR: 140, GBP: 120 },
    instructorId: instructor.id,
    instructorName: instructor.name,
    category: "Software Engineering",
    level: "Pro Courses",
    thumbnail: "https://example.com/thumb.png",
    published: true,
    approved: true,
    modules: [],
    totalDuration: 120,
    enrollmentCount: 0,
    rating: 5,
  })
  testEntities.courseIds.push(course.id)

  // 1.2 Course Access & Enrollment
  const enrollment = await db.createEnrollment({
    id: randomUUID(),
    userId: studentUser.id,
    courseId: course.id,
    progress: 0,
    completedLessons: [],
    status: "active",
    enrolledAt: new Date(),
  })
  testEntities.enrollmentIds.push(enrollment.id)
  assert.equal(enrollment.userId, studentUser.id)
  assert.equal(enrollment.progress, 0)

  // 1.3 Lesson Progress Persistence via API
  const { PATCH: updateProgressRoute } = await import("../../app/api/enrollments/[id]/progress/route")
  const lessonId1 = randomUUID()
  const progressReq = new Request(`http://localhost:3000/api/enrollments/${enrollment.id}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      progress: 50,
      completedLessons: [lessonId1],
    }),
  })
  const progressRes = await updateProgressRoute(progressReq as any, { params: Promise.resolve({ id: enrollment.id }) })
  assert.equal(progressRes.status, 200, "Progress update must return HTTP 200")
  const progressJson = await progressRes.json()
  assert.equal(progressJson.enrollment.progress, 50)
  assert.deepEqual(progressJson.enrollment.completedLessons, [lessonId1])

  // Verify persistence in PostgreSQL
  const dbEnrollment = await db.getEnrollmentById(enrollment.id)
  assert.equal(dbEnrollment?.progress, 50, "Progress must persist in PostgreSQL")
  assert.deepEqual(dbEnrollment?.completedLessons, [lessonId1])

  // 1.4 Quiz Attempt Creation, Anti-Cheat Masking & Trusted Scoring
  const quizId = randomUUID()
  testEntities.quizIds.push(quizId)
  await academicDb.createQuiz({
    id: quizId,
    title: "Software Engineering Architecture Quiz",
    passingScore: 70,
    timeLimit: 30,
    questions: [
      {
        id: randomUUID(),
        question: "Which pattern provides eventual consistency?",
        options: ["Saga Pattern", "Single Point of Failure", "Monolithic Lock", "Synchronous RPC"],
        correctAnswer: 0,
        explanation: "Sagas coordinate transactions across microservices through compensating events.",
      },
      {
        id: randomUUID(),
        question: "Which isolation level prevents phantom reads in SQL standard?",
        options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
        correctAnswer: 3,
        explanation: "Serializable is the highest isolation level and prevents phantom reads.",
      },
    ],
  })

  // Start attempt via API route
  const { POST: startAttemptRoute, GET: getAttemptRoute } = await import(
    "../../app/api/courses/[id]/quizzes/[quizId]/attempt/route"
  )
  const startReq = new Request(`http://localhost:3000/api/courses/${course.id}/quizzes/${quizId}/attempt`, {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}` },
  })
  const startRes = await startAttemptRoute(startReq as any, { params: Promise.resolve({ id: course.id, quizId }) })
  assert.equal(startRes.status, 201)
  const startJson = await startRes.json()
  const attemptId = startJson.attempt.id
  assert.ok(attemptId)
  assert.equal(startJson.attempt.status, "in_progress")

  // Anti-Cheat: verify masked questions omits correctAnswer and explanation
  const questionsReq = new Request(`http://localhost:3000/api/courses/${course.id}/quizzes/${quizId}/attempt?mode=questions`, {
    method: "GET",
    headers: { Authorization: `Bearer ${studentToken}` },
  })
  const questionsRes = await getAttemptRoute(questionsReq as any, { params: Promise.resolve({ id: course.id, quizId }) })
  assert.equal(questionsRes.status, 200)
  const questionsJson = await questionsRes.json()
  assert.ok(questionsJson.quiz.questions.length === 2)
  for (const q of questionsJson.quiz.questions) {
    assert.equal(q.correctAnswer, undefined, "correctAnswer must NOT be exposed before submission")
    assert.equal(q.explanation, undefined, "explanation must NOT be exposed before submission")
  }

  // Submit attempt via API
  const { POST: submitAttemptRoute } = await import(
    "../../app/api/courses/[id]/quizzes/[quizId]/attempt/[attemptId]/route"
  )
  const submitReq = new Request(`http://localhost:3000/api/courses/${course.id}/quizzes/${quizId}/attempt/${attemptId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      answers: [
        { questionId: questionsJson.quiz.questions[0].id, selectedOption: 0 },
        { questionId: questionsJson.quiz.questions[1].id, selectedOption: 3 },
      ],
    }),
  })
  const submitRes = await submitAttemptRoute(submitReq as any, {
    params: Promise.resolve({ id: course.id, quizId, attemptId }),
  })
  assert.equal(submitRes.status, 200)
  const submitJson = await submitRes.json()
  assert.equal(submitJson.attempt.status, "completed")
  assert.equal(submitJson.attempt.score, 100)
  assert.equal(submitJson.attempt.passed, true)

  // 1.5 Assignment Submission and Resubmission
  const assignmentId = randomUUID()
  testEntities.assignmentIds.push(assignmentId)
  const { POST: submitAssignmentRoute } = await import(
    "../../app/api/courses/[id]/assignments/[assignmentId]/submissions/route"
  )
  
  // Attempt 1
  const subReq1 = new Request(`http://localhost:3000/api/courses/${course.id}/assignments/${assignmentId}/submissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: "First draft of system architecture document.",
      artifactUrls: ["https://github.com/promptcare/student-project-v1"],
    }),
  })
  const subRes1 = await submitAssignmentRoute(subReq1 as any, {
    params: Promise.resolve({ id: course.id, assignmentId }),
  })
  assert.equal(subRes1.status, 201)
  const subJson1 = await subRes1.json()
  assert.equal(subJson1.submission.attemptNumber, 1)

  // Attempt 2 (Resubmission)
  const subReq2 = new Request(`http://localhost:3000/api/courses/${course.id}/assignments/${assignmentId}/submissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: "Second refined draft incorporating feedback.",
      artifactUrls: ["https://github.com/promptcare/student-project-v2"],
    }),
  })
  const subRes2 = await submitAssignmentRoute(subReq2 as any, {
    params: Promise.resolve({ id: course.id, assignmentId }),
  })
  assert.equal(subRes2.status, 201)
  const subJson2 = await subRes2.json()
  assert.equal(subJson2.submission.attemptNumber, 2)
  assert.notEqual(subJson1.submission.id, subJson2.submission.id)

  // 1.6 Capstone Project Submission
  const createdProject = await academicDb.createProject({
    courseId: course.id,
    title: "Production Distributed Microservices Capstone",
    description: "Design, build, and deploy an event-driven architecture.",
    maxScore: 100,
  })
  const projectId = createdProject.id
  testEntities.projectIds.push(projectId)

  const { POST: submitProjectRoute } = await import(
    "../../app/api/courses/[id]/projects/route"
  )
  const projReq = new Request(`http://localhost:3000/api/courses/${course.id}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId,
      title: "Prompt Care Event Streaming Engine",
      description: "Kafka-based event consumer with PostgreSQL storage",
      repositoryUrl: "https://github.com/promptcare/capstone-repo",
      liveDemoUrl: "https://demo.promptcare.internal",
      artifacts: [{ name: "Architecture Diagram", url: "https://figma.com/file/xyz", type: "figma" }],
    }),
  })
  const projRes = await submitProjectRoute(projReq as any, {
    params: Promise.resolve({ id: course.id, projectId }),
  })
  assert.equal(projRes.status, 201)
  const projJson = await projRes.json()
  assert.equal(projJson.submission.title, "Prompt Care Event Streaming Engine")

  // 1.7 Access Restrictions: Another student cannot access or modify student1's attempt or submissions
  const student2 = await db.createUser({
    id: randomUUID(),
    email: `${prefix}student2@promptcareacademy.com`,
    password: "SecureStudentPass456!",
    name: "Eve Unauthorized",
    role: "student",
    status: "active",
    emailVerified: true,
    enrolledCourses: [],
  })
  testEntities.userIds.push(student2.id)
  const student2Token = generateToken(student2)

  // Student 2 tries to submit answers for Student 1's attempt
  const crossSubmitReq = new Request(
    `http://localhost:3000/api/courses/${course.id}/quizzes/${quizId}/attempt/${attemptId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${student2Token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers: [] }),
    },
  )
  const crossSubmitRes = await submitAttemptRoute(crossSubmitReq as any, {
    params: Promise.resolve({ id: course.id, quizId, attemptId }),
  })
  assert.equal(crossSubmitRes.status, 403, "Cross-student attempt modification must return HTTP 403 Forbidden")
})

test("2. Instructor Journey: Authorized Course Access, Rubric Creation, Grading & Grade History", async () => {
  const db = getDB()
  const instructor = await db.findUserById(testEntities.userIds[1])
  assert.ok(instructor)
  const instructorToken = generateToken(instructor)
  const courseId = testEntities.courseIds[0]
  const assignmentId = testEntities.assignmentIds[0]

  // Fetch student submission
  const submissions = await academicDb.getAssignmentSubmissionsByCourse(courseId, assignmentId)
  assert.ok(submissions.length >= 2)
  const targetSubmission = submissions[0] // latest submission

  // 2.1 Create Rubric
  const { POST: createRubricRoute } = await import("../../app/api/courses/[id]/rubrics/route")
  const rubricReq = new Request(`http://localhost:3000/api/courses/${courseId}/rubrics`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${instructorToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      assignmentId,
      title: "System Architecture Evaluation Rubric",
      criteria: [
        { id: "crit_arch", title: "Cloud Architecture Design", maxPoints: 50 },
        { id: "crit_security", title: "Security and RBAC", maxPoints: 50 },
      ],
      totalMaxPoints: 100,
    }),
  })
  const rubricRes = await createRubricRoute(rubricReq as any, { params: Promise.resolve({ id: courseId }) })
  assert.equal(rubricRes.status, 201)
  const rubricJson = await rubricRes.json()
  assert.equal(rubricJson.rubric.totalMaxPoints, 100)

  // 2.2 Grade Submission with Rubric
  const { POST: gradeRoute, GET: getGradeRoute } = await import(
    "../../app/api/courses/[id]/submissions/[submissionId]/grade/route"
  )
  const gradeReq = new Request(`http://localhost:3000/api/courses/${courseId}/submissions/${targetSubmission.id}/grade`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${instructorToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      submissionType: "assignment",
      studentId: testEntities.userIds[0],
      score: 92,
      maxScore: 100,
      feedback: "Excellent architectural breakdown with clean separation of concerns.",
      rubricScores: [
        { criterionId: "crit_arch", points: 48, comment: "High quality system diagrams" },
        { criterionId: "crit_security", points: 44, comment: "Comprehensive token auth" },
      ],
    }),
  })
  const gradeRes = await gradeRoute(gradeReq as any, {
    params: Promise.resolve({ id: courseId, submissionId: targetSubmission.id }),
  })
  assert.equal(gradeRes.status, 200)
  const gradeJson = await gradeRes.json()
  assert.equal(gradeJson.grade.score, 92)

  // 2.3 Grade Revision & Grade History Verification
  const reviseReq = new Request(`http://localhost:3000/api/courses/${courseId}/submissions/${targetSubmission.id}/grade`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${instructorToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      submissionType: "assignment",
      studentId: testEntities.userIds[0],
      score: 97,
      maxScore: 100,
      feedback: "Revised score after bonus points for Docker Compose demo.",
      reason: "Added bonus marks for live orchestration script",
    }),
  })
  const reviseRes = await gradeRoute(reviseReq as any, {
    params: Promise.resolve({ id: courseId, submissionId: targetSubmission.id }),
  })
  assert.equal(reviseRes.status, 200)

  // Verify grade history in PostgreSQL
  const history = await academicDb.getGradeHistory(gradeJson.grade.id)
  assert.ok(history.length >= 1, "Grade revision must create an immutable history record")
  assert.equal(history[0].previousScore, 92)
  assert.equal(history[0].newScore, 97)
  assert.equal(history[0].reason, "Added bonus marks for live orchestration script")
  assert.equal(history[0].changedBy, instructor.id)

  // 2.4 Student Retrieves Released Grade
  const student = await db.findUserById(testEntities.userIds[0])
  const studentToken = generateToken(student!)
  const getGradeReq = new Request(`http://localhost:3000/api/courses/${courseId}/submissions/${targetSubmission.id}/grade`, {
    method: "GET",
    headers: { Authorization: `Bearer ${studentToken}` },
  })
  const getGradeRes = await getGradeRoute(getGradeReq as any, {
    params: Promise.resolve({ id: courseId, submissionId: targetSubmission.id }),
  })
  assert.equal(getGradeRes.status, 200)
  const studentGradeJson = await getGradeRes.json()
  assert.equal(studentGradeJson.grade.score, 97)
  assert.deepEqual(studentGradeJson.history, [], "Internal revision history must remain private from students")

  // Instructor retrieves grade and sees revision history
  const getInstGradeReq = new Request(`http://localhost:3000/api/courses/${courseId}/submissions/${targetSubmission.id}/grade`, {
    method: "GET",
    headers: { Authorization: `Bearer ${instructorToken}` },
  })
  const getInstGradeRes = await getGradeRoute(getInstGradeReq as any, {
    params: Promise.resolve({ id: courseId, submissionId: targetSubmission.id }),
  })
  assert.equal(getInstGradeRes.status, 200)
  const instGradeJson = await getInstGradeRes.json()
  assert.equal(instGradeJson.grade.score, 97)
  assert.ok(instGradeJson.history.length >= 1, "Instructor must be able to view grade revision history")
})

test("3. Administrator Journey: Settings, Audit Logs, and Privilege Restrictions", async () => {
  const db = getDB()
  const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
  const adminPassword = process.env.ADMIN_ACCOUNTS_PASSWORD!

  // Perform bootstrap login
  const loginResult = await authService.login(adminEmail, adminPassword)
  assert.ok(loginResult)
  const adminToken = loginResult.token

  // 3.1 Update and persist app settings in PostgreSQL
  const testKey = `Staging_PCA_${randomUUID().slice(0, 6)}`
  await updateAdminSettings({
    siteName: testKey,
    siteDescription: "Staging Validated Platform",
    contactEmail: "ops@promptcareacademy.com",
    supportEmail: "support@promptcareacademy.com",
    emailNotifications: true,
    courseApproval: true,
    autoEnrollment: false,
    certificateGeneration: true,
    maintenanceMode: false,
    homeIntroVideoUrl: "",
  })

  const currentSettings = await getAdminSettings()
  assert.equal(currentSettings.siteName, testKey, "Settings must persist in PostgreSQL app_settings table")

  // 3.2 Audit Log Creation & Retrieval
  const log = await db.createAdminLog({
    actorId: loginResult.user.id,
    actorName: loginResult.user.name,
    actorEmail: loginResult.user.email,
    action: "release_readiness_validation",
    details: { environment: "staging", database: "learnhub_test" },
  })
  assert.ok(log.id)

  const logs = await db.getAdminLogs(5)
  const matching = logs.find((l: any) => l.id === log.id)
  assert.ok(matching, "Audit log must persist and be retrievable from admin_logs table")

  // 3.3 Authorization Restriction: Student cannot access admin settings
  const student = await db.findUserById(testEntities.userIds[0])
  const studentToken = generateToken(student!)
  const { GET: getAdminSettingsRoute } = await import("../../app/api/admin/settings/route")
  const studentAdminReq = new Request("http://localhost:3000/api/admin/settings", {
    method: "GET",
    headers: { Authorization: `Bearer ${studentToken}` },
  })
  const studentAdminRes = await getAdminSettingsRoute(studentAdminReq as any)
  assert.equal(studentAdminRes.status, 403, "Student must be rejected from administrative route with 403")
})

test("4. Payments Journey: Initialization, Webhook Signature Verification, Idempotency & Auto-Enrollment", async () => {
  const db = getDB()
  const student = await db.findUserById(testEntities.userIds[0])
  assert.ok(student)

  // Create another course for payment testing
  const paidCourse = await db.createCourse({
    id: randomUUID(),
    title: "Advanced Microservices & DevOps",
    slug: `${prefix}devops-paid`,
    description: "Paid professional certification track",
    price: { NGN: 50000, USD: 100, EUR: 90, GBP: 80 },
    instructorId: testEntities.userIds[1],
    instructorName: "Prof. Sarah Connor",
    category: "Software Engineering",
    level: "Pro Courses",
    thumbnail: "https://example.com/thumb.png",
    published: true,
    approved: true,
    modules: [],
    totalDuration: 90,
    enrollmentCount: 0,
    rating: 5,
  })
  testEntities.courseIds.push(paidCourse.id)

  // 4.1 Initialize Payment record in PostgreSQL
  const payRef = `PC-NGN-${Date.now()}-${randomUUID().slice(0, 8)}`
  const paymentRecord = await db.createPayment({
    id: randomUUID(),
    userId: student.id,
    customerEmail: student.email,
    amount: 50000,
    currency: "NGN",
    reference: payRef,
    status: "pending",
    paymentType: "course_purchase",
    courseId: paidCourse.id,
    courseIds: [paidCourse.id],
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  testEntities.paymentIds.push(paymentRecord.id)

  // 4.2 Webhook Signature Verification: Invalid Signature Rejected
  const { POST: webhookRoute } = await import("../../app/api/payments/webhook/route")
  const webhookBody = JSON.stringify({
    event: "charge.success",
    data: {
      reference: payRef,
      amount: 5000000, // 50,000 NGN in kobo
      currency: "NGN",
      status: "success",
      customer: { email: student.email },
      paid_at: new Date().toISOString(),
    },
  })

  const badSigReq = new Request("http://localhost:3000/api/payments/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": "invalid_forged_signature",
    },
    body: webhookBody,
  })
  const badSigRes = await webhookRoute(badSigReq)
  assert.equal(badSigRes.status, 401, "Invalid webhook signature must return HTTP 401 Unauthorized")

  // 4.3 Valid Webhook Signature Accepted & Payment Completed
  const validSig = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(webhookBody)
    .digest("hex")

  const goodSigReq = new Request("http://localhost:3000/api/payments/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": validSig,
    },
    body: webhookBody,
  })
  const goodSigRes = await webhookRoute(goodSigReq)
  assert.equal(goodSigRes.status, 200, "Valid webhook signature must return HTTP 200")

  // Verify Payment transitioned to completed
  const updatedPayment = await db.getPaymentByReference(payRef)
  assert.equal(updatedPayment?.status, "completed", "Payment status must transition to completed in PostgreSQL")

  // 4.4 Automated Enrollment Activation in PostgreSQL
  const paidEnrollment = await db.getEnrollment(student.id, paidCourse.id)
  assert.ok(paidEnrollment, "Student must be automatically enrolled upon verified payment")
  assert.equal(paidEnrollment?.status, "active")

  // 4.5 Idempotency: Duplicate charge.success event is safely handled without error or duplicate enrollment
  const duplicateSigReq = new Request("http://localhost:3000/api/payments/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": validSig,
    },
    body: webhookBody,
  })
  const duplicateSigRes = await webhookRoute(duplicateSigReq)
  assert.equal(duplicateSigRes.status, 200, "Duplicate webhook must return HTTP 200 without throwing")

  // Verify only 1 enrollment exists
  const enrollmentsList = await db.getEnrollmentsByUserId(student.id)
  const courseEnrollments = enrollmentsList.filter((e: any) => e.courseId === paidCourse.id)
  assert.equal(courseEnrollments.length, 1, "Duplicate payment event must not create duplicate enrollments")
})

test("5. Resilience & Security: Expired Tokens, Forgery Attempts & Fail-Closed Guards", async () => {
  const db = getDB()
  
  // 5.1 Invalid/Malformed JWT rejected
  const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.payload"
  const decoded = authService.decodeToken(fakeToken)
  assert.equal(decoded, null, "Malformed JWT must decode to null")

  // 5.2 Expired Token Rejected
  const expiredToken = jwt.sign(
    {
      userId: randomUUID(),
      email: "expired@example.com",
      role: "student",
      exp: Math.floor(Date.now() / 1000) - 60, // expired 60 seconds ago
    },
    process.env.JWT_SECRET!,
  )
  const decodedExpired = authService.decodeToken(expiredToken)
  assert.equal(decodedExpired, null, "Expired token must decode to null")

  // 5.3 Student cannot grade or forge scores
  const student = await db.findUserById(testEntities.userIds[0])
  const studentToken = generateToken(student!)
  const { POST: gradeRoute } = await import(
    "../../app/api/courses/[id]/submissions/[submissionId]/grade/route"
  )
  const forgeGradeReq = new Request(
    `http://localhost:3000/api/courses/${testEntities.courseIds[0]}/submissions/sub_xyz/grade`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        submissionType: "assignment",
        studentId: student?.id,
        score: 100,
        maxScore: 100,
      }),
    },
  )
  const forgeGradeRes = await gradeRoute(forgeGradeReq as any, {
    params: Promise.resolve({ id: testEntities.courseIds[0], submissionId: "sub_xyz" }),
  })
  assert.equal(forgeGradeRes.status, 403, "Student grading attempt must be rejected with HTTP 403 Forbidden")
})

test("99. Cleanup Test Entities from PostgreSQL Test Database", async () => {
  const drizzle = getDrizzleDb()
  const pool = getPool()
  await assertIsolatedTestDatabase(pool)

  // Clean up all test entities created during E2E runs
  await drizzle.execute(sql`DELETE FROM payment_events WHERE reference LIKE ${prefix + "%"} OR reference LIKE 'PC-%'`)
  await drizzle.execute(sql`DELETE FROM payments WHERE reference LIKE ${prefix + "%"} OR reference LIKE 'PC-%'`)
  await drizzle.execute(sql`DELETE FROM grade_history WHERE id LIKE ${prefix + "%"} OR reason LIKE '%bonus%'`)
  await drizzle.execute(sql`DELETE FROM grades WHERE course_id IN (SELECT id FROM courses WHERE slug LIKE ${prefix + "%"})`)
  await drizzle.execute(sql`DELETE FROM project_submissions WHERE course_id IN (SELECT id FROM courses WHERE slug LIKE ${prefix + "%"})`)
  await drizzle.execute(sql`DELETE FROM projects WHERE course_id IN (SELECT id FROM courses WHERE slug LIKE ${prefix + "%"})`)
  await drizzle.execute(sql`DELETE FROM assignment_submissions WHERE course_id IN (SELECT id FROM courses WHERE slug LIKE ${prefix + "%"})`)
  await drizzle.execute(sql`DELETE FROM rubrics WHERE course_id IN (SELECT id FROM courses WHERE slug LIKE ${prefix + "%"})`)
  await drizzle.execute(sql`DELETE FROM quiz_attempts WHERE course_id IN (SELECT id FROM courses WHERE slug LIKE ${prefix + "%"})`)
  if (testEntities.quizIds.length > 0) {
    for (const qid of testEntities.quizIds) {
      await drizzle.execute(sql`DELETE FROM quiz_questions WHERE quiz_id = ${qid}`)
      await drizzle.execute(sql`DELETE FROM quizzes WHERE id = ${qid}`)
    }
  }
  await drizzle.execute(sql`DELETE FROM enrollments WHERE course_id IN (SELECT id FROM courses WHERE slug LIKE ${prefix + "%"})`)
  await drizzle.execute(sql`DELETE FROM courses WHERE slug LIKE ${prefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM users WHERE email LIKE ${prefix + "%"}`)
  await drizzle.execute(sql`DELETE FROM admin_logs WHERE action = 'release_readiness_validation'`)

  const adminEmail = process.env.ADMIN_ACCOUNTS_EMAIL!.toLowerCase()
  await pool.query("DELETE FROM users WHERE email = $1", [adminEmail])

  await closePool()
})
})
