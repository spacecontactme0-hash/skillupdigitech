import { getAcademicDb } from "@/lib/academic-db"
import { getPostgresDatabase } from "@/lib/postgres-db"
import { getDrizzleDb } from "@/db/client"
import * as schema from "@/db/schema"
import { eq, and } from "drizzle-orm"

export interface GraduationClearanceResult {
  cleared: boolean
  courseId: string
  userId: string
  moduleProgress: number
  attendancePercentage: number
  capstoneScore: number | null
  capstonePassed: boolean
  missingRequirements: string[]
  distinction: boolean
}

/**
 * SkillUp Digitech Academy Graduation Clearance Rule Engine:
 * 1. Module Progress: 100% of recorded lessons/modules completed.
 * 2. Live & Physical Practical Attendance: >= 75% for scheduled cohort sessions (or waived if 0 scheduled).
 * 3. Capstone Project: Evaluated by faculty instructor with score >= 70%.
 */
export async function evaluateGraduationClearance(params: {
  userId: string
  courseId: string
  programmeEnrolmentId?: string
}): Promise<GraduationClearanceResult> {
  const { userId, courseId, programmeEnrolmentId } = params
  const db = getPostgresDatabase()
  const academicDb = getAcademicDb()
  const drizzle = getDrizzleDb()

  const missingRequirements: string[] = []

  // 1. Verify Course Enrolment & Progress
  const enrollments = await db.getEnrollmentsByUserId(userId)
  const courseEnrollment = enrollments.find((e) => e.courseId === courseId)

  const moduleProgress = courseEnrollment?.progress ?? 0
  if (moduleProgress < 100) {
    missingRequirements.push(
      `Course lessons incomplete: Progress is ${moduleProgress}% (100% required).`,
    )
  }

  // 2. Verify Attendance Rate
  let attendancePercentage = 100
  if (programmeEnrolmentId) {
    const stats = await academicDb.calculateStudentAttendanceStats(userId, programmeEnrolmentId)
    if (stats.totalSessions > 0) {
      attendancePercentage = stats.attendancePercentage
      if (attendancePercentage < 75) {
        missingRequirements.push(
          `Live workshop attendance is ${attendancePercentage}% (minimum 75% required).`,
        )
      }
    }
  }

  // 3. Verify Capstone Project Submission & Rubric Evaluation
  const projects = await drizzle
    .select()
    .from(schema.projects)
    .where(eq(schema.projects.courseId, courseId))

  let capstoneScore: number | null = null
  let capstonePassed = false

  if (projects.length > 0) {
    const project = projects[0]
    const submission = await academicDb.getProjectSubmissionByUserAndProject(userId, project.id)

    if (!submission) {
      missingRequirements.push(
        `Capstone project "${project.title}" has not been submitted.`,
      )
    } else {
      // Find grade
      const grades = await drizzle
        .select()
        .from(schema.grades)
        .where(
          and(
            eq(schema.grades.submissionId, submission.id),
            eq(schema.grades.submissionType, "project"),
            eq(schema.grades.status, "published"),
          ),
        )

      if (grades.length === 0) {
        missingRequirements.push(
          `Capstone project is currently pending faculty instructor evaluation.`,
        )
      } else {
        const grade = grades[0]
        const percentage = Math.round((grade.score / grade.maxScore) * 100)
        capstoneScore = percentage

        if (percentage >= 70) {
          capstonePassed = true
        } else {
          missingRequirements.push(
            `Capstone project score is ${percentage}% (minimum 70% required to graduate).`,
          )
        }
      }
    }
  } else {
    // If course has no separate capstone project requirement, capstone is marked satisfied
    capstonePassed = true
    capstoneScore = 100
  }

  const cleared = missingRequirements.length === 0
  const distinction = cleared && (capstoneScore ?? 0) >= 90

  return {
    cleared,
    courseId,
    userId,
    moduleProgress,
    attendancePercentage,
    capstoneScore,
    capstonePassed,
    missingRequirements,
    distinction,
  }
}
