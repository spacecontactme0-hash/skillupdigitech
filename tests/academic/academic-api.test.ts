import assert from "node:assert/strict"
import test, { describe, after, before } from "node:test"
import { randomUUID } from "node:crypto"
import { NextRequest } from "next/server"
import { getIsolatedTestDbConfig, assertIsolatedTestDatabase } from "../helpers/test-db-isolation"

const testDbConfig = getIsolatedTestDbConfig()

describe("Academic API Integration Suite", {
  skip: !testDbConfig.isConfigured ? testDbConfig.skipReason : false,
}, () => {
  process.env.JWT_SECRET = "academic-api-test-jwt-secret-key-32-chars-long"

  const { getPool, closePool, getDrizzleDb } = require("../../db/client")
  const { getAcademicDb } = require("../../lib/academic-db")
  const { getPostgresDatabase } = require("../../lib/postgres-db")
  const { generateToken } = require("../../lib/auth")
  const { sql } = require("drizzle-orm")

  const { GET: getQuizAttemptRoute, POST: startQuizAttemptRoute } = require("../../app/api/courses/[id]/quizzes/[quizId]/attempt/route")
  const { GET: getAttemptDetailRoute, POST: submitQuizAttemptRoute } = require("../../app/api/courses/[id]/quizzes/[quizId]/attempt/[attemptId]/route")
  const { GET: getSubmissionsRoute, POST: createSubmissionRoute } = require("../../app/api/courses/[id]/assignments/[assignmentId]/submissions/route")
  const { GET: getGradeRoute, POST: gradeSubmissionRoute } = require("../../app/api/courses/[id]/submissions/[submissionId]/grade/route")
  const { GET: getProjectsRoute, POST: createProjectRoute } = require("../../app/api/courses/[id]/projects/route")

  let db: any
  let academicDb: any

  const prefix = `api_test_${Date.now()}_`
  let studentId: string
  let instructorId: string
  let studentToken: string
  let instructorToken: string
  let courseId: string
  let quizId: string
  let assignmentId: string
  let attemptId: string
  let submissionId: string

  before(async () => {
    const pool = getPool()
    await assertIsolatedTestDatabase(pool)
    db = getPostgresDatabase()
    academicDb = getAcademicDb()
  studentId = randomUUID()
  instructorId = randomUUID()

  await db.createUser({
    id: studentId,
    email: `${prefix}student@example.com`,
    password: "hashed_password",
    name: "API Test Student",
    role: "student",
    status: "active",
    emailVerified: true,
    enrolledCourses: [],
  })

  await db.createUser({
    id: instructorId,
    email: `${prefix}instructor@example.com`,
    password: "hashed_password",
    name: "API Test Instructor",
    role: "instructor",
    status: "active",
    emailVerified: true,
    enrolledCourses: [],
  })

  studentToken = generateToken({
    id: studentId,
    email: `${prefix}student@example.com`,
    password: "hashed_password",
    role: "student",
    name: "API Test Student",
    enrolledCourses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  instructorToken = generateToken({
    id: instructorId,
    email: `${prefix}instructor@example.com`,
    password: "hashed_password",
    role: "instructor",
    name: "API Test Instructor",
    enrolledCourses: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  courseId = randomUUID()
  await db.createCourse({
    id: courseId,
    title: "API Test Course",
    slug: `${prefix}course`,
    description: "API testing",
    price: { NGN: 10000, USD: 25, EUR: 23, GBP: 20 },
    instructorId,
    instructorName: "API Test Instructor",
    category: "Software Engineering",
    level: "Beginner Courses",
    thumbnail: "https://example.com/thumb.png",
    published: true,
    approved: true,
    totalDuration: 0,
    enrollmentCount: 0,
    rating: 0,
    modules: [],
  })

  // Create Quiz in PostgreSQL
  quizId = randomUUID()
  await academicDb.createQuiz({
    id: quizId,
    title: "API Test Quiz",
    passingScore: 70,
    questions: [
      {
        question: "What is PostgreSQL?",
        options: ["RDBMS", "Document Store", "Key-Value", "Graph Only"],
        correctAnswer: 0,
        explanation: "PostgreSQL is an advanced relational database management system.",
      },
    ],
  })

  // Create Assignment in PostgreSQL
  assignmentId = randomUUID()
  await academicDb.createAssignment({
    id: assignmentId,
    title: "API Test Assignment",
    description: "Submit your code",
    maxScore: 100,
  })
})

after(async () => {
  const pool = getPool()
  await assertIsolatedTestDatabase(pool)
  const drizzle = getDrizzleDb()
  await drizzle.execute(sql`DELETE FROM grade_history WHERE grade_id IN (SELECT id FROM grades WHERE course_id = ${courseId})`)
  await drizzle.execute(sql`DELETE FROM grades WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM project_submissions WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM projects WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM rubrics WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM assignment_submissions WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM assignments WHERE id = ${assignmentId}`)
  await drizzle.execute(sql`DELETE FROM quiz_attempts WHERE course_id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM quiz_questions WHERE quiz_id = ${quizId}`)
  await drizzle.execute(sql`DELETE FROM quizzes WHERE id = ${quizId}`)
  await drizzle.execute(sql`DELETE FROM courses WHERE id = ${courseId}`)
  await drizzle.execute(sql`DELETE FROM users WHERE id IN (${studentId}, ${instructorId})`)

  await closePool()
})

test("API: 1. Student can start quiz attempt via POST /attempt", async () => {
  const req = new NextRequest(`http://localhost:3000/api/courses/${courseId}/quizzes/${quizId}/attempt`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })

  const res = await startQuizAttemptRoute(req, {
    params: Promise.resolve({ id: courseId, quizId }),
  })

  assert.equal(res.status, 201)
  const data = await res.json()
  assert.ok(data.attempt)
  assert.equal(data.attempt.status, "in_progress")
  assert.equal(data.attempt.userId, studentId)
  attemptId = data.attempt.id
})

test("API: 2. Masked questions returned without answers via GET /attempt?mode=questions", async () => {
  const req = new NextRequest(`http://localhost:3000/api/courses/${courseId}/quizzes/${quizId}/attempt?mode=questions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${studentToken}`,
    },
  })

  const res = await getQuizAttemptRoute(req, {
    params: Promise.resolve({ id: courseId, quizId }),
  })

  assert.equal(res.status, 200)
  const data = await res.json()
  assert.ok(data.quiz)
  assert.equal(data.quiz.questions[0].correctAnswer, undefined)
  assert.equal(data.quiz.questions[0].explanation, undefined)
})

test("API: 3. Submit quiz attempt via POST /attempt/[attemptId]", async () => {
  const quiz = await academicDb.getQuizById(quizId)
  const q = quiz!.questions[0]

  const req = new NextRequest(`http://localhost:3000/api/courses/${courseId}/quizzes/${quizId}/attempt/${attemptId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      answers: [{ questionId: q.id, selectedOption: q.correctAnswer }],
    }),
  })

  const res = await submitQuizAttemptRoute(req, {
    params: Promise.resolve({ id: courseId, quizId, attemptId }),
  })

  assert.equal(res.status, 200)
  const data = await res.json()
  assert.equal(data.score, 100)
  assert.equal(data.passed, true)
  assert.equal(data.attempt.status, "completed")
})

test("API: 4. Student submits assignment via POST /assignments/[id]/submissions", async () => {
  const req = new NextRequest(`http://localhost:3000/api/courses/${courseId}/assignments/${assignmentId}/submissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: "Completed full architectural design",
      artifactUrls: ["https://github.com/promptcare/test-repo"],
    }),
  })

  const res = await createSubmissionRoute(req, {
    params: Promise.resolve({ id: courseId, assignmentId }),
  })

  assert.equal(res.status, 201)
  const data = await res.json()
  assert.ok(data.submission)
  assert.equal(data.submission.userId, studentId)
  assert.equal(data.submission.attemptNumber, 1)
  submissionId = data.submission.id
})

test("API: 5. Student forbidden from grading submissions", async () => {
  const req = new NextRequest(`http://localhost:3000/api/courses/${courseId}/submissions/${submissionId}/grade`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`, // Student token!
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      submissionType: "assignment",
      studentId,
      score: 100,
    }),
  })

  const res = await gradeSubmissionRoute(req, {
    params: Promise.resolve({ id: courseId, submissionId }),
  })

  assert.equal(res.status, 403, "Student must not be allowed to grade submissions")
})

test("API: 6. Instructor grades submission via POST /submissions/[id]/grade", async () => {
  const req = new NextRequest(`http://localhost:3000/api/courses/${courseId}/submissions/${submissionId}/grade`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${instructorToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      submissionType: "assignment",
      studentId,
      score: 92,
      maxScore: 100,
      feedback: "Great implementation of the API routes and schema models.",
    }),
  })

  const res = await gradeSubmissionRoute(req, {
    params: Promise.resolve({ id: courseId, submissionId }),
  })

  assert.equal(res.status, 200)
  const data = await res.json()
  assert.ok(data.grade)
  assert.equal(data.grade.score, 92)
  assert.equal(data.grade.instructorId, instructorId)
})

test("API: 7. Student retrieves published grade via GET /submissions/[id]/grade", async () => {
  const req = new NextRequest(`http://localhost:3000/api/courses/${courseId}/submissions/${submissionId}/grade?type=assignment`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${studentToken}`,
    },
  })

  const res = await getGradeRoute(req, {
    params: Promise.resolve({ id: courseId, submissionId }),
  })

  assert.equal(res.status, 200)
  const data = await res.json()
  assert.ok(data.grade)
  assert.equal(data.grade.score, 92)
  assert.equal(data.grade.feedback, "Great implementation of the API routes and schema models.")
})

test("API: 8. Capstone project creation and student submission", async () => {
  // Step 1: Instructor creates project
  const createProjReq = new NextRequest(`http://localhost:3000/api/courses/${courseId}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${instructorToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: "Full Capstone Project",
      description: "Build an enterprise application",
      maxScore: 100,
    }),
  })

  const createProjRes = await createProjectRoute(createProjReq, {
    params: Promise.resolve({ id: courseId }),
  })

  assert.equal(createProjRes.status, 201)
  const projData = await createProjRes.json()
  const projectId = projData.project.id

  // Step 2: Student submits capstone project
  const submitProjReq = new NextRequest(`http://localhost:3000/api/courses/${courseId}/projects`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${studentToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId,
      title: "My Enterprise Project",
      description: "Live app and repository",
      repositoryUrl: "https://github.com/promptcare/student-project",
      liveDemoUrl: "https://demo.promptcare.ng",
    }),
  })

  const submitProjRes = await createProjectRoute(submitProjReq, {
    params: Promise.resolve({ id: courseId }),
  })

  assert.equal(submitProjRes.status, 201)
  const subData = await submitProjRes.json()
  assert.ok(subData.submission)
  assert.equal(subData.submission.userId, studentId)
  assert.equal(subData.submission.repositoryUrl, "https://github.com/promptcare/student-project")
})

  after(async () => {
    const { closePool } = require("../../db/client")
    await closePool()
  })
})
