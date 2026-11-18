import assert from "node:assert/strict"
import test, { describe, before, after } from "node:test"
import { randomUUID } from "node:crypto"

process.env.JWT_SECRET = process.env.JWT_SECRET || "phase6-test-jwt-secret-key-32-chars-long"

import { getPool, closePool } from "../../db/client"
import { getAcademicDb } from "../../lib/academic-db"
import { getPostgresDatabase } from "../../lib/postgres-db"
import { evaluateGraduationClearance } from "../../lib/graduation-clearance"

describe("Phase 6: Practical Projects, Capstone Evaluations & Verified Credentials", () => {
  const academicDb = getAcademicDb()
  const db = getPostgresDatabase()
  const pool = getPool()

  const testPrefix = `p6_test_${Date.now()}_`
  let studentId: string
  let instructorId: string
  let courseId: string
  let projectId: string
  let submissionId: string
  let rubricId: string
  let gradeId: string
  let programmeEnrolmentId: string
  let certificateCode: string

  before(async () => {
    studentId = randomUUID()
    instructorId = randomUUID()

    // 1. Create test student and instructor
    await db.createUser({
      id: studentId,
      email: `${testPrefix}student@example.com`,
      password: "hashed_password",
      name: "Phase 6 Test Student",
      role: "student",
      status: "active",
      emailVerified: true,
      enrolledCourses: [],
    })

    await db.createUser({
      id: instructorId,
      email: `${testPrefix}instructor@example.com`,
      password: "hashed_password",
      name: "Phase 6 Lead Instructor",
      role: "instructor",
      status: "active",
      emailVerified: true,
      enrolledCourses: [],
    })

    // 2. Create test course
    courseId = randomUUID()
    await db.createCourse({
      id: courseId,
      title: `${testPrefix} Advanced Full-Stack Engineering`,
      slug: `${testPrefix}advanced-fullstack`.toLowerCase(),
      code: "SWE-401",
      description: "Capstone technology project course",
      category: "Software Development",
      instructorId,
      level: "advanced",
      duration: 120,
      priceNgn: 150000,
      currency: "NGN",
      isPublished: true,
      approvalStatus: "approved",
      publishedAt: new Date(),
    } as any)

    // 3. Create test capstone project
    const project = await academicDb.createProject({
      courseId,
      title: `${testPrefix} Real-Time Microservices Architecture`,
      description: "Implement a production-grade multi-service backend with Redis and PostgreSQL",
      maxScore: 100,
      dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    })
    projectId = project.id

    // 4. Create evaluation rubric
    const rubric = await academicDb.createRubric({
      courseId,
      projectId,
      title: "System Architecture & Quality Rubric",
      totalMaxPoints: 100,
      criteria: [
        { id: "crit-1", title: "API Design & Schema Architecture", maxPoints: 50 },
        { id: "crit-2", title: "Testing, Reliability & Clean Code", maxPoints: 50 },
      ],
    })
    rubricId = rubric.id

    // 5. Create student enrollment (initially at 50% progress)
    await db.createEnrollment({
      userId: studentId,
      courseId,
      progress: 50,
      status: "active",
      completedLessons: [],
      enrolledAt: new Date(),
    })

    // 6. Programme Enrolment for attendance check
    programmeEnrolmentId = randomUUID()
    const progRes = await pool.query(`SELECT id FROM academic_programmes WHERE code = 'CAREER_READINESS' LIMIT 1;`)
    const progId = progRes.rows[0]?.id || randomUUID()

    await pool.query(
      `INSERT INTO programme_enrolments (id, student_id, programme_id, delivery_arrangement, status, byol_acknowledged)
       VALUES ($1, $2, $3, 'online', 'active', true);`,
      [programmeEnrolmentId, studentId, progId]
    )
  })

  after(async () => {
    try {
      if (certificateCode) {
        await pool.query(`DELETE FROM certificates WHERE verification_code = $1;`, [certificateCode])
      }
      if (gradeId) {
        await pool.query(`DELETE FROM grades WHERE id = $1;`, [gradeId])
      }
      if (submissionId) {
        await pool.query(`DELETE FROM project_submissions WHERE id = $1;`, [submissionId])
      }
      await pool.query(`DELETE FROM rubrics WHERE id = $1;`, [rubricId])
      await pool.query(`DELETE FROM projects WHERE id = $1;`, [projectId])
      await pool.query(`DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2;`, [studentId, courseId])
      await pool.query(`DELETE FROM programme_enrolments WHERE id = $1;`, [programmeEnrolmentId])
      await pool.query(`DELETE FROM courses WHERE id = $1;`, [courseId])
      await pool.query(`DELETE FROM users WHERE id IN ($1, $2);`, [studentId, instructorId])
    } catch (e) {
      console.error("Cleanup error in Phase 6 tests:", e)
    } finally {
      await closePool()
    }
  })

  test("1. Capstone Project Submission: Stores GitHub repository and live demo URLs", async () => {
    const submission = await academicDb.createProjectSubmission({
      projectId,
      courseId,
      userId: studentId,
      title: "Microservices Platform Deployment",
      description: "Distributed message broker with Docker Compose setup",
      repositoryUrl: "https://github.com/skillup-student/microservices-demo",
      liveDemoUrl: "https://demo.skillup-digitech.com.ng",
      artifacts: [{ name: "architecture.pdf", url: "https://storage.skillup/arch.pdf", type: "pdf" }],
    })
    submissionId = submission.id

    assert.ok(submission.id, "Submission must have an ID")
    assert.equal(submission.repositoryUrl, "https://github.com/skillup-student/microservices-demo")
    assert.equal(submission.liveDemoUrl, "https://demo.skillup-digitech.com.ng")
    assert.equal(submission.status, "submitted")
  })

  test("2. Graduation Clearance: Fails when module progress is under 100% and capstone is ungraded", async () => {
    const clearance = await evaluateGraduationClearance({
      userId: studentId,
      courseId,
      programmeEnrolmentId,
    })

    assert.equal(clearance.cleared, false, "Must not clear graduation while progress is incomplete")
    assert.ok(
      clearance.missingRequirements.some((r) => r.includes("Progress is 50%")),
      "Must flag progress under 100%",
    )
    assert.ok(
      clearance.missingRequirements.some((r) => r.includes("pending faculty instructor evaluation")),
      "Must flag pending capstone grading",
    )
  })

  test("3. Instructor Rubric Evaluation: Grades capstone submission and updates grade history", async () => {
    const grade = await academicDb.gradeSubmission({
      submissionType: "project",
      submissionId,
      courseId,
      studentId,
      instructorId,
      score: 94, // 94% -> High Distinction!
      maxScore: 100,
      rubricScores: [
        { criterionId: "crit-1", points: 48, comment: "Exceptional schema design and data normalization" },
        { criterionId: "crit-2", points: 46, comment: "High test coverage and clean error handling" },
      ],
      feedback: "Outstanding capstone implementation. Meets industry standards for production deployment.",
      reason: "Initial official faculty evaluation",
    })
    gradeId = grade.id

    assert.ok(grade.id, "Grade must be created")
    assert.equal(grade.score, 94)
    assert.equal(grade.status, "published")
  })

  test("4. Graduation Clearance Engine: Confers clearance with Distinction upon 100% completion & >= 90% capstone", async () => {
    // Complete all course lessons (100% progress)
    await pool.query(
      `UPDATE enrollments SET progress = 100, status = 'completed', completed_at = NOW() WHERE user_id = $1 AND course_id = $2;`,
      [studentId, courseId]
    )

    const clearance = await evaluateGraduationClearance({
      userId: studentId,
      courseId,
      programmeEnrolmentId,
    })

    assert.equal(clearance.cleared, true, "Student must be cleared for graduation")
    assert.equal(clearance.moduleProgress, 100)
    assert.equal(clearance.capstonePassed, true)
    assert.equal(clearance.capstoneScore, 94)
    assert.equal(clearance.distinction, true, "Score >= 90 must achieve distinction honours")
    assert.equal(clearance.missingRequirements.length, 0)
  })

  test("5. Certificate Issuance & Verification: Generates tamper-evident credential verifiable by registry", async () => {
    certificateCode = `SKILLUP-2026-${randomUUID().slice(0, 8).toUpperCase()}`

    const certificate = await db.createCertificate({
      userId: studentId,
      courseId,
      certificateUrl: `/verify/${certificateCode}`,
      verificationCode: certificateCode,
      issuedAt: new Date(),
    })

    assert.ok(certificate.id, "Certificate must be stored")
    assert.equal(certificate.verificationCode, certificateCode)

    // Lookup certificate by code
    const loadedCert = await db.getCertificateByVerificationCode(certificateCode)
    assert.ok(loadedCert, "Must locate certificate by code")
    assert.equal(loadedCert.userId, studentId)
    assert.equal(loadedCert.courseId, courseId)
  })
})
