import assert from "node:assert/strict"
import test, { describe, after, before } from "node:test"
import { randomUUID } from "node:crypto"
import { getIsolatedTestDbConfig, assertIsolatedTestDatabase } from "../helpers/test-db-isolation"

const testDbConfig = getIsolatedTestDbConfig()

describe("Academic Persistence Integration Suite", {
  skip: !testDbConfig.isConfigured ? testDbConfig.skipReason : false,
}, () => {
  const { getPool, closePool, getDrizzleDb } = require("../../db/client")
  const { getAcademicDb } = require("../../lib/academic-db")
  const { getPostgresDatabase } = require("../../lib/postgres-db")
  const { sql } = require("drizzle-orm")

  let db: any
  let academicDb: any

  const testIdPrefix = `acad_${Date.now()}_`
  let studentUserId: string
  let instructorUserId: string
  let categoryId: string
  let courseId: string
  let lessonId: string
  let quizId: string
  let assignmentId: string

  before(async () => {
    const pool = getPool()
    await assertIsolatedTestDatabase(pool)
    db = getPostgresDatabase()
    academicDb = getAcademicDb()

  // Create test instructor and student users
  studentUserId = randomUUID()
  instructorUserId = randomUUID()

  await db.createUser({
    id: studentUserId,
    email: `${testIdPrefix}student@example.com`,
    password: "hashed_password",
    name: "Academic Test Student",
    role: "student",
    status: "active",
    emailVerified: true,
    enrolledCourses: [],
  })

  await db.createUser({
    id: instructorUserId,
    email: `${testIdPrefix}instructor@example.com`,
    password: "hashed_password",
    name: "Academic Test Instructor",
    role: "instructor",
    status: "active",
    emailVerified: true,
    enrolledCourses: [],
  })

  // Create course category and course
  categoryId = randomUUID()
  await db.createCategory({
    id: categoryId,
    name: "Academic Test Category",
  })

  courseId = randomUUID()
  await db.createCourse({
    id: courseId,
    title: "Full-Stack Software Architecture",
    slug: `${testIdPrefix}software-architecture`,
    description: "Technology Academy Test Course",
    price: { NGN: 50000, USD: 100, EUR: 90, GBP: 80 },
    instructorId: instructorUserId,
    instructorName: "Academic Test Instructor",
    category: "Software Engineering",
    level: "Pro Courses",
    thumbnail: "https://example.com/thumb.png",
    published: true,
    approved: true,
    totalDuration: 0,
    enrollmentCount: 0,
    rating: 0,
    modules: [],
  })

  // Create test lesson
  lessonId = randomUUID()
  const drizzle = getDrizzleDb()
  await drizzle.execute(sql`
    INSERT INTO lessons (id, course_id, title, type, "order", content, is_free, approved)
    VALUES (${lessonId}, ${courseId}, 'Architecture Patterns', 'quiz', 1, '{}'::jsonb, false, true)
  `)
})

after(async () => {
  const pool = getPool()
  await assertIsolatedTestDatabase(pool)
  const drizzle = getDrizzleDb()
  // Clean up academic test data in proper foreign key order
  await drizzle.execute(sql`DELETE FROM grade_history WHERE grade_id IN (SELECT id FROM grades WHERE course_id = ${courseId})`)
  await drizzle.execute(sql`DELETE FROM grades WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM project_submissions WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM projects WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM rubrics WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM assignment_submissions WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM assignments WHERE id = ${assignmentId || ""}`)
  await drizzle.execute(sql`DELETE FROM quiz_attempts WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM quiz_questions WHERE quiz_id = ${quizId || ""}`)
  await drizzle.execute(sql`DELETE FROM quizzes WHERE id = ${quizId || ""}`)
  await drizzle.execute(sql`DELETE FROM lessons WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM courses WHERE id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM categories WHERE id = ${categoryId}`)
  await drizzle.execute(sql`DELETE FROM users WHERE id IN (${studentUserId}, ${instructorUserId})`)

  await closePool()
})

test("1. Academic tables schema readiness in PostgreSQL", async () => {
  const pool = getPool()
  const tablesRes = await pool.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN (
        'quiz_attempts',
        'assignment_submissions',
        'rubrics',
        'grades',
        'grade_history',
        'projects',
        'project_submissions'
      )
    ORDER BY table_name;
  `)

  const tables = tablesRes.rows.map((r: any) => r.table_name)
  assert.deepEqual(
    tables.sort(),
    [
      "assignment_submissions",
      "grade_history",
      "grades",
      "project_submissions",
      "projects",
      "quiz_attempts",
      "rubrics",
    ].sort(),
    "All 7 academic tables must exist in PostgreSQL",
  )
})

test("2. Quiz authoring and student anti-cheat protection", async () => {
  quizId = randomUUID()
  const q1Id = randomUUID()
  const q2Id = randomUUID()

  const quiz = await academicDb.createQuiz({
    id: quizId,
    title: "PostgreSQL Architecture & ACID Quiz",
    passingScore: 70,
    timeLimit: 15,
    questions: [
      {
        id: q1Id,
        question: "What does the 'I' in ACID stand for?",
        options: ["Integration", "Isolation", "Inheritance", "Immutability"],
        correctAnswer: 1, // Isolation
        explanation: "Isolation ensures concurrent transactions execute without interference.",
      },
      {
        id: q2Id,
        question: "Which isolation level prevents phantom reads in PostgreSQL?",
        options: ["Read Committed", "Repeatable Read", "Serializable", "Read Uncommitted"],
        correctAnswer: 2, // Serializable
        explanation: "Serializable is the strictest isolation level preventing phantom reads.",
      },
    ],
  })

  assert.equal(quiz.id, quizId)
  assert.equal(quiz.questions.length, 2)
  assert.equal(quiz.questions[0].correctAnswer, 1)

  // Anti-cheat verification: masked quiz for students MUST NOT reveal answers or explanations
  const studentQuiz = await academicDb.getQuizForStudent(quizId)
  assert.ok(studentQuiz, "Student quiz view should exist")
  assert.equal(studentQuiz.title, "PostgreSQL Architecture & ACID Quiz")
  assert.equal(studentQuiz.questions.length, 2)

  // Verify that neither correctAnswer nor explanation are returned to the student
  for (const q of studentQuiz.questions) {
    assert.equal((q as any).correctAnswer, undefined, "correctAnswer must NOT be exposed to students")
    assert.equal((q as any).explanation, undefined, "explanation must NOT be exposed to students")
    assert.ok(q.options.length > 0, "Question options must be present")
  }
})

test("3. Quiz attempt lifecycle and trusted server-side scoring", async () => {
  // Step 1: Start an attempt
  const attempt = await academicDb.createQuizAttempt({
    quizId,
    courseId,
    lessonId,
    userId: studentUserId,
  })

  assert.ok(attempt.id, "Attempt should have an ID")
  assert.equal(attempt.status, "in_progress")
  assert.equal(attempt.userId, studentUserId)
  assert.equal(attempt.score, undefined)
  assert.equal(attempt.passed, false)

  // Step 2: Verify unauthorized submission is blocked
  await assert.rejects(
    async () => {
      await academicDb.submitQuizAttempt({
        attemptId: attempt.id,
        userId: "different_unauthorized_user",
        answers: [],
      })
    },
    /Forbidden/,
    "A different user cannot submit another student's quiz attempt",
  )

  // Step 3: Submit 1 correct and 1 wrong answer (50% score, passingScore is 70% -> fail)
  const fullQuiz = await academicDb.getQuizById(quizId)
  assert.ok(fullQuiz)
  const q1 = fullQuiz.questions[0]
  const q2 = fullQuiz.questions[1]

  const firstSubmitResult = await academicDb.submitQuizAttempt({
    attemptId: attempt.id,
    userId: studentUserId,
    answers: [
      { questionId: q1.id, selectedOption: q1.correctAnswer }, // Correct
      { questionId: q2.id, selectedOption: 0 }, // Incorrect (selected 0, correct is 2)
    ],
  })

  assert.equal(firstSubmitResult.score, 50, "1 of 2 questions correct = 50%")
  assert.equal(firstSubmitResult.passed, false, "50% is below 70% passingScore")
  assert.equal(firstSubmitResult.attempt.status, "completed")
  assert.ok(firstSubmitResult.attempt.completedAt)

  // Step 4: Verify persistence directly in PostgreSQL database
  const persistedAttempt = await academicDb.getQuizAttemptById(attempt.id)
  assert.ok(persistedAttempt)
  assert.equal(persistedAttempt.status, "completed")
  assert.equal(persistedAttempt.score, 50)
  assert.equal(persistedAttempt.passed, false)
  assert.equal(persistedAttempt.answers.length, 2)
  assert.equal(persistedAttempt.answers[0].isCorrect, true)
  assert.equal(persistedAttempt.answers[1].isCorrect, false)

  // Step 5: Start a second attempt and pass with 100%
  const secondAttempt = await academicDb.createQuizAttempt({
    quizId,
    courseId,
    lessonId,
    userId: studentUserId,
  })

  const secondSubmitResult = await academicDb.submitQuizAttempt({
    attemptId: secondAttempt.id,
    userId: studentUserId,
    answers: [
      { questionId: q1.id, selectedOption: q1.correctAnswer },
      { questionId: q2.id, selectedOption: q2.correctAnswer },
    ],
  })

  assert.equal(secondSubmitResult.score, 100)
  assert.equal(secondSubmitResult.passed, true)

  // Verify attempt history for student
  const studentAttempts = await academicDb.getQuizAttemptsByUserAndQuiz(studentUserId, quizId)
  assert.equal(studentAttempts.length, 2, "Student should have 2 recorded attempts")
  assert.equal(studentAttempts[0].id, secondAttempt.id, "Most recent attempt first")
})

test("4. Assignment submission and attempt tracking", async () => {
  assignmentId = randomUUID()
  const assignment = await academicDb.createAssignment({
    id: assignmentId,
    title: "Database Indexing & Query Optimization Lab",
    description: "Analyze slow queries and create B-Tree and GIN indexes in PostgreSQL.",
    maxScore: 100,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  })

  assert.equal(assignment.id, assignmentId)
  assert.equal(assignment.title, "Database Indexing & Query Optimization Lab")

  // First submission
  const sub1 = await academicDb.createAssignmentSubmission({
    assignmentId,
    courseId,
    lessonId,
    userId: studentUserId,
    content: "Implemented B-Tree index on tenant_id and composite index on (user_id, created_at).",
    artifactUrls: [
      "https://github.com/promptcare/academy-lab-indexes",
      "https://storage.example.com/artifacts/query_plan.svg",
    ],
  })

  assert.ok(sub1.id)
  assert.equal(sub1.attemptNumber, 1, "First submission should be attempt 1")
  assert.equal(sub1.status, "submitted")
  assert.equal(sub1.artifactUrls.length, 2)

  // Second submission (revision)
  const sub2 = await academicDb.createAssignmentSubmission({
    assignmentId,
    courseId,
    lessonId,
    userId: studentUserId,
    content: "Revised submission with EXPLAIN ANALYZE comparison metrics.",
    artifactUrls: [
      "https://github.com/promptcare/academy-lab-indexes/pull/1",
    ],
  })

  assert.equal(sub2.attemptNumber, 2, "Second submission should increment attemptNumber to 2")

  // Query submissions by student
  const userSubs = await academicDb.getAssignmentSubmissionsByUser(studentUserId, courseId)
  assert.equal(userSubs.length, 2)

  // Query submissions by course (for instructor)
  const courseSubs = await academicDb.getAssignmentSubmissionsByCourse(courseId, assignmentId)
  assert.equal(courseSubs.length, 2)
})

test("5. Rubric creation and targeting", async () => {
  const rubric = await academicDb.createRubric({
    courseId,
    assignmentId,
    title: "SQL Query Performance Rubric",
    description: "Criteria for evaluating PostgreSQL indexing and query performance.",
    criteria: [
      { id: "crit_indexes", title: "Index Selection", description: "Appropriate use of B-Tree/GIN", maxPoints: 40 },
      { id: "crit_plan", title: "Query Plan Execution", description: "Measurable speedup verified", maxPoints: 40 },
      { id: "crit_docs", title: "Technical Documentation", description: "Clear explanation of plan", maxPoints: 20 },
    ],
    totalMaxPoints: 100,
  })

  assert.ok(rubric.id)
  assert.equal(rubric.criteria.length, 3)
  assert.equal(rubric.totalMaxPoints, 100)

  // Target lookup
  const targetRubric = await academicDb.getRubricByTarget(courseId, { assignmentId })
  assert.ok(targetRubric)
  assert.equal(targetRubric.id, rubric.id)
})

test("6. Instructor grading, rubric evaluation, and immutable grade history audit trail", async () => {
  const userSubs = await academicDb.getAssignmentSubmissionsByUser(studentUserId, courseId)
  const latestSubmission = userSubs[0] // attempt 2

  // Step 1: Initial grade by instructor
  const initialGrade = await academicDb.gradeSubmission({
    submissionType: "assignment",
    submissionId: latestSubmission.id,
    courseId,
    studentId: studentUserId,
    instructorId: instructorUserId,
    score: 85,
    maxScore: 100,
    rubricScores: [
      { criterionId: "crit_indexes", points: 35, comment: "Good index selection" },
      { criterionId: "crit_plan", points: 35, comment: "Solid execution reduction" },
      { criterionId: "crit_docs", points: 15, comment: "Documentation needs more detail" },
    ],
    feedback: "Solid work on index selection. Please clarify why GIN was not used for the tag search.",
  })

  assert.ok(initialGrade.id)
  assert.equal(initialGrade.score, 85)
  assert.equal(initialGrade.instructorId, instructorUserId)
  assert.equal(initialGrade.status, "published")

  // Verify submission status changed to 'graded'
  const gradedSubmission = await academicDb.getAssignmentSubmissionById(latestSubmission.id)
  assert.equal(gradedSubmission?.status, "graded")

  // Check history initially has no entries
  const historyBefore = await academicDb.getGradeHistory(initialGrade.id)
  assert.equal(historyBefore.length, 0)

  // Step 2: Instructor updates grade with revised score and reason
  const updatedGrade = await academicDb.gradeSubmission({
    submissionType: "assignment",
    submissionId: latestSubmission.id,
    courseId,
    studentId: studentUserId,
    instructorId: instructorUserId,
    score: 95,
    maxScore: 100,
    rubricScores: [
      { criterionId: "crit_indexes", points: 40, comment: "Full points after explanation" },
      { criterionId: "crit_plan", points: 35 },
      { criterionId: "crit_docs", points: 20, comment: "Supplemental documentation received" },
    ],
    feedback: "Excellent revision! GIN index rationale clearly explained.",
    reason: "Student submitted clarification on full-text search indexing.",
  })

  assert.equal(updatedGrade.id, initialGrade.id, "Grade ID must remain consistent")
  assert.equal(updatedGrade.score, 95)
  assert.equal(updatedGrade.feedback, "Excellent revision! GIN index rationale clearly explained.")

  // Step 3: Verify immutable audit trail in grade_history
  const historyAfter = await academicDb.getGradeHistory(initialGrade.id)
  assert.equal(historyAfter.length, 1, "One history record must be created on update")
  assert.equal(historyAfter[0].previousScore, 85)
  assert.equal(historyAfter[0].newScore, 95)
  assert.equal(historyAfter[0].changedBy, instructorUserId)
  assert.equal(historyAfter[0].reason, "Student submitted clarification on full-text search indexing.")
  assert.equal(historyAfter[0].previousFeedback, "Solid work on index selection. Please clarify why GIN was not used for the tag search.")

  // Step 4: Step 3 again (second update) to verify multi-version audit chain
  await academicDb.gradeSubmission({
    submissionType: "assignment",
    submissionId: latestSubmission.id,
    courseId,
    studentId: studentUserId,
    instructorId: instructorUserId,
    score: 98,
    maxScore: 100,
    feedback: "Final score adjusted with extra credit.",
    reason: "Extra credit awarded for query benchmarking script.",
  })

  const historyMulti = await academicDb.getGradeHistory(initialGrade.id)
  assert.equal(historyMulti.length, 2, "Grade history must record all modifications")
  assert.equal(historyMulti[0].previousScore, 95)
  assert.equal(historyMulti[0].newScore, 98)
})

test("7. Capstone project authoring, submission, and evaluation", async () => {
  // Step 1: Instructor creates project
  const project = await academicDb.createProject({
    courseId,
    title: "Production LMS Platform Capstone",
    description: "Design and implement a multi-tenant PostgreSQL LMS with automated grading.",
    instructions: "Must include PostgreSQL migrations, Drizzle ORM models, and Next.js UI.",
    maxScore: 100,
  })

  assert.ok(project.id)
  assert.equal(project.title, "Production LMS Platform Capstone")

  // Step 2: Student submits capstone project
  const submission = await academicDb.createProjectSubmission({
    projectId: project.id,
    courseId,
    userId: studentUserId,
    title: "LearnHub Enterprise LMS",
    description: "Multi-tenant architecture with Drizzle ORM and PostgreSQL persistence.",
    repositoryUrl: "https://github.com/promptcare/learnhub-postgres",
    liveDemoUrl: "https://learnhub-staging.promptcare.ng",
    artifacts: [
      { name: "ER Diagram", url: "https://storage.example.com/erd.png", type: "image/png" },
    ],
  })

  assert.ok(submission.id)
  assert.equal(submission.status, "submitted")
  assert.equal(submission.repositoryUrl, "https://github.com/promptcare/learnhub-postgres")

  // Step 3: Re-submitting updates the submission idempotently
  const updatedSubmission = await academicDb.createProjectSubmission({
    projectId: project.id,
    courseId,
    userId: studentUserId,
    title: "LearnHub Enterprise LMS (v2)",
    description: "Added comprehensive automated test suite and grade history.",
    repositoryUrl: "https://github.com/promptcare/learnhub-postgres",
    liveDemoUrl: "https://learnhub-staging.promptcare.ng",
  })

  assert.equal(updatedSubmission.id, submission.id, "Submission ID must remain stable across updates")
  assert.equal(updatedSubmission.title, "LearnHub Enterprise LMS (v2)")

  // Step 4: Instructor grades capstone project
  const projectGrade = await academicDb.gradeSubmission({
    submissionType: "project",
    submissionId: submission.id,
    courseId,
    studentId: studentUserId,
    instructorId: instructorUserId,
    score: 96,
    maxScore: 100,
    feedback: "Outstanding architecture, clean separation of concerns, and rigorous tests.",
  })

  assert.equal(projectGrade.score, 96)
  assert.equal(projectGrade.submissionType, "project")

  // Verify project submission status transitioned to approved
  const finalSub = await academicDb.getProjectSubmissionById(submission.id)
  assert.equal(finalSub?.status, "approved")
})

test("8. Native PostgreSQL UUID format verification for all academic records", async () => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  // Verify all created IDs conform to native UUID standards (not 24-char hex MongoDB ObjectIds)
  const pool = getPool()
  const rowsRes = await pool.query(`
    (SELECT id, 'quiz' as type FROM quizzes WHERE id = $1)
    UNION ALL
    (SELECT id, 'attempt' as type FROM quiz_attempts WHERE course_id = $2 LIMIT 1)
    UNION ALL
    (SELECT id, 'assignment' as type FROM assignments WHERE id = $3)
    UNION ALL
    (SELECT id, 'submission' as type FROM assignment_submissions WHERE course_id = $2 LIMIT 1)
    UNION ALL
    (SELECT id, 'grade' as type FROM grades WHERE course_id = $2 LIMIT 1)
    UNION ALL
    (SELECT id, 'grade_history' as type FROM grade_history LIMIT 1)
    UNION ALL
    (SELECT id, 'project' as type FROM projects WHERE course_id = $2 LIMIT 1)
    UNION ALL
    (SELECT id, 'project_submission' as type FROM project_submissions WHERE course_id = $2 LIMIT 1)
  `, [quizId, courseId, assignmentId])

  assert.ok(rowsRes.rows.length >= 7, "All entities should be found")
  for (const row of rowsRes.rows) {
    assert.match(
      row.id,
      uuidRegex,
      `Record ID "${row.id}" for type "${row.type}" must be a native UUID, not a legacy MongoDB ObjectId`,
    )
    assert.notEqual(row.id.length, 24, "Record ID must NOT be 24 characters (MongoDB ObjectId format)")
  }
})

  after(async () => {
    const { closePool } = require("../../db/client")
    await closePool()
  })
})
