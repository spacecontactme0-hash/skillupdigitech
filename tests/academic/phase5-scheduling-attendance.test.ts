import assert from "node:assert/strict"
import test, { describe, before, after } from "node:test"
import { randomUUID } from "node:crypto"

process.env.JWT_SECRET = process.env.JWT_SECRET || "phase5-test-jwt-secret-key-32-chars-long"

import { getPool, closePool } from "../../db/client"
import { getAcademicDb } from "../../lib/academic-db"
import { getPostgresDatabase } from "../../lib/postgres-db"
import * as schema from "../../db/schema"
import { eq } from "drizzle-orm"

describe("Phase 5: Scheduling, Centres & Attendance Workflows", () => {
  const academicDb = getAcademicDb()
  const db = getPostgresDatabase()
  const pool = getPool()

  const testPrefix = `p5_test_${Date.now()}_`
  let campusId: string
  let classroomId: string
  let programmeId: string
  let cohortId: string
  let student1Id: string
  let student2Id: string
  let student3Id: string
  let enrolment1Id: string
  let enrolment2Id: string
  let enrolment3Id: string
  let sessionId: string

  before(async () => {
    // 1. Resolve or create programme
    const programmes = await pool.query(`SELECT id FROM academic_programmes WHERE code = 'CAREER_READINESS' LIMIT 1;`)
    if (programmes.rows.length > 0) {
      programmeId = programmes.rows[0].id
    } else {
      programmeId = randomUUID()
      await pool.query(
        `INSERT INTO academic_programmes (id, code, name, type, is_active) VALUES ($1, $2, $3, $4, true);`,
        [programmeId, `PROG_${Date.now()}`, "Phase 5 Test Programme", "career_readiness"]
      )
    }

    // 2. Create test campus and classroom
    const campus = await academicDb.createCampus({
      name: `${testPrefix}Enugu Campus`,
      slug: `${testPrefix}enugu-campus`.toLowerCase(),
      address: "14 Garden Avenue, GRA",
      city: "Enugu",
      state: "Enugu State",
      facilities: ["generator_power", "solar_inverter", "fibre_wifi"],
    })
    campusId = campus.id

    const classroom = await academicDb.createClassroom({
      campusId,
      name: `${testPrefix}Turing Lab`,
      roomNumber: "Lab-101",
      safeCapacity: 30,
      powerOutletsCount: 30,
    })
    classroomId = classroom.id

    // 3. Create test cohort with fixed timetable
    const cohort = await academicDb.createCohort({
      programmeId,
      code: `${testPrefix}COHORT`.toUpperCase(),
      name: `${testPrefix} Hybrid Cohort`,
      deliveryArrangement: "hybrid",
      campusId,
      defaultClassroomId: classroomId,
      maxCapacity: 30,
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 3600 * 1000),
      fixedTimetableSummary: "Wednesday (17:00–19:00 UTC+1) Virtual | Saturday (10:00–14:00 UTC+1) Physical Lab",
    })
    cohortId = cohort.id

    // 4. Create 3 test students & enrolments
    student1Id = randomUUID()
    student2Id = randomUUID()
    student3Id = randomUUID()

    for (const [id, idx] of [[student1Id, 1], [student2Id, 2], [student3Id, 3]] as const) {
      await db.createUser({
        id,
        email: `${testPrefix}student${idx}@example.com`,
        password: "hashed_password",
        name: `Phase 5 Student ${idx}`,
        role: "student",
        status: "active",
        emailVerified: true,
        enrolledCourses: [],
      })
    }

    enrolment1Id = randomUUID()
    enrolment2Id = randomUUID()
    enrolment3Id = randomUUID()

    await pool.query(
      `INSERT INTO programme_enrolments (id, student_id, programme_id, delivery_arrangement, cohort_id, status, byol_acknowledged)
       VALUES 
        ($1, $2, $3, 'hybrid', $4, 'active', true),
        ($5, $6, $3, 'hybrid', $4, 'active', true),
        ($7, $8, $3, 'hybrid', $4, 'active', true);`,
      [enrolment1Id, student1Id, programmeId, cohortId, enrolment2Id, student2Id, enrolment3Id, student3Id]
    )
  })

  after(async () => {
    try {
      // Clean up test records
      if (sessionId) {
        await pool.query(`DELETE FROM attendance_records WHERE session_id = $1;`, [sessionId])
        await pool.query(`DELETE FROM session_bookings WHERE session_id = $1;`, [sessionId])
        await pool.query(`DELETE FROM class_sessions WHERE id = $1;`, [sessionId])
      }
      await pool.query(`DELETE FROM cohort_memberships WHERE cohort_id = $1;`, [cohortId])
      await pool.query(`DELETE FROM programme_enrolments WHERE id IN ($1, $2, $3);`, [enrolment1Id, enrolment2Id, enrolment3Id])
      await pool.query(`DELETE FROM cohorts WHERE id = $1;`, [cohortId])
      await pool.query(`DELETE FROM classrooms WHERE id = $1;`, [classroomId])
      await pool.query(`DELETE FROM campuses WHERE id = $1;`, [campusId])
      await pool.query(`DELETE FROM users WHERE id IN ($1, $2, $3);`, [student1Id, student2Id, student3Id])
    } catch (e) {
      console.error("Cleanup error in Phase 5 tests:", e)
    } finally {
      await closePool()
    }
  })

  test("1. Campus & Classroom Management: Stores physical infrastructure and safe capacity", async () => {
    const loadedCampus = await academicDb.getCampusById(campusId)
    assert.ok(loadedCampus, "Campus must exist")
    assert.equal(loadedCampus.city, "Enugu")
    assert.deepEqual(loadedCampus.facilities, ["generator_power", "solar_inverter", "fibre_wifi"])

    const classrooms = await academicDb.getClassrooms(campusId)
    assert.ok(classrooms.length >= 1, "Classroom must be retrieved")
    const turingLab = classrooms.find((c) => c.id === classroomId)
    assert.ok(turingLab, "Turing lab must exist")
    assert.equal(turingLab.safeCapacity, 30)
    assert.equal(turingLab.powerOutletsCount, 30)
  })

  test("2. Fixed Cohort Timetable: Preserves synchronous schedule definition", async () => {
    const loadedCohort = await academicDb.getCohortById(cohortId)
    assert.ok(loadedCohort, "Cohort must exist")
    assert.equal(loadedCohort.deliveryArrangement, "hybrid")
    assert.match(loadedCohort.fixedTimetableSummary || "", /Saturday \(10:00–14:00 UTC\+1\) Physical Lab/)
  })

  test("3. Atomic Concurrency Seat Booking: Strictly enforces max safe seating capacity", async () => {
    // Create a constrained session with maxCapacity = 2
    const session = await academicDb.createClassSession({
      cohortId,
      title: `${testPrefix}Microservices Lab`,
      activityType: "physical_practical",
      deliveryChannel: "physical",
      campusId,
      classroomId,
      sessionDate: new Date(),
      startTime: "10:00",
      endTime: "14:00",
      maxCapacity: 2, // Only 2 seats!
    })
    sessionId = session.id

    // Student 1 books seat -> SUCCESS (1/2)
    const booking1 = await academicDb.bookSessionAtomic({
      sessionId,
      studentId: student1Id,
      programmeEnrolmentId: enrolment1Id,
    })
    assert.ok(booking1.id, "Booking 1 must be created")
    assert.equal(booking1.status, "confirmed")

    // Student 2 books seat -> SUCCESS (2/2)
    const booking2 = await academicDb.bookSessionAtomic({
      sessionId,
      studentId: student2Id,
      programmeEnrolmentId: enrolment2Id,
    })
    assert.ok(booking2.id, "Booking 2 must be created")
    assert.equal(booking2.status, "confirmed")

    // Check updated session state
    const intermediateSession = await academicDb.getClassSessionById(sessionId)
    assert.equal(intermediateSession?.bookedSeatsCount, 2)

    // Student 3 attempts booking when full -> MUST FAIL with CAPACITY_EXCEEDED
    await assert.rejects(
      async () => {
        await academicDb.bookSessionAtomic({
          sessionId,
          studentId: student3Id,
          programmeEnrolmentId: enrolment3Id,
        })
      },
      /CAPACITY_EXCEEDED/,
      "Must reject overbooking when max capacity is reached",
    )

    // Student 2 cancels their booking -> frees up 1 seat
    await academicDb.cancelSessionBooking({
      sessionId,
      studentId: student2Id,
    })

    const afterCancelSession = await academicDb.getClassSessionById(sessionId)
    assert.equal(afterCancelSession?.bookedSeatsCount, 1, "Booked seats count must decrement to 1")

    // Student 3 retries booking -> SUCCESS (2/2)
    const booking3 = await academicDb.bookSessionAtomic({
      sessionId,
      studentId: student3Id,
      programmeEnrolmentId: enrolment3Id,
    })
    assert.ok(booking3.id, "Booking 3 must succeed after seat is freed")
    assert.equal(booking3.status, "confirmed")
  })

  test("4. Attendance Recording & Compliance Metrics: Accurately tracks attendance and physical credits", async () => {
    // Record student 1 as Present (Physical)
    const record1 = await academicDb.markAttendance({
      sessionId,
      studentId: student1Id,
      programmeEnrolmentId: enrolment1Id,
      attendanceStatus: "present",
      attendanceChannel: "physical",
      notes: "Arrived on time with laptop charged",
    })
    assert.equal(record1.attendanceStatus, "present")
    assert.equal(record1.attendanceChannel, "physical")

    // Record student 3 as Late (Physical)
    const record3 = await academicDb.markAttendance({
      sessionId,
      studentId: student3Id,
      programmeEnrolmentId: enrolment3Id,
      attendanceStatus: "late",
      attendanceChannel: "physical",
      notes: "Arrived 15 minutes late",
    })
    assert.equal(record3.attendanceStatus, "late")

    // Check attendance for session
    const sessionRecords = await academicDb.getAttendanceBySession(sessionId)
    assert.equal(sessionRecords.length, 2, "Must have 2 attendance records")

    // Check compliance stats for student 1
    const stats1 = await academicDb.calculateStudentAttendanceStats(student1Id, enrolment1Id)
    assert.equal(stats1.totalSessions, 1)
    assert.equal(stats1.attendedSessions, 1)
    assert.equal(stats1.physicalAttended, 1)
    assert.equal(stats1.attendancePercentage, 100)

    // Update student 3 attendance to absent
    const updatedRecord3 = await academicDb.markAttendance({
      sessionId,
      studentId: student3Id,
      programmeEnrolmentId: enrolment3Id,
      attendanceStatus: "absent",
      attendanceChannel: "physical",
      notes: "Left early before workshop commenced",
    })
    assert.equal(updatedRecord3.attendanceStatus, "absent")

    // Check compliance stats for student 3 after update
    const stats3 = await academicDb.calculateStudentAttendanceStats(student3Id, enrolment3Id)
    assert.equal(stats3.totalSessions, 1)
    assert.equal(stats3.attendedSessions, 0)
    assert.equal(stats3.attendancePercentage, 0)
  })
})
