import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"
import { programmesDb } from "@/lib/programmes-db"

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await authService.getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = getDB()
    const studentEnrolmentRows = await programmesDb.getStudentProgrammeEnrolments(user.id)
    const existingEnrollments = await db.getEnrollmentsByUserId(user.id)
    const enrollmentMap = new Map(existingEnrollments.map((e) => [e.courseId, e]))

    // Get campuses list for lookup
    const campuses = await programmesDb.getCampuses()
    const campusMap = new Map(campuses.map((c) => [c.id, c]))

    const detailedEnrolments = await Promise.all(
      studentEnrolmentRows.map(async (row) => {
        const { enrolment, programme, pathway, cohort } = row

        // Get mapped curriculum courses
        const programmeCourses = await programmesDb.getProgrammeCourses(
          enrolment.programmeId,
          enrolment.pathwayId || undefined,
        )

        // Compute courses with student progress
        let totalProgressSum = 0
        const courses = programmeCourses.map((pc) => {
          const userCourseEnrollment = enrollmentMap.get(pc.courseId)
          const progress = userCourseEnrollment?.progress || 0
          totalProgressSum += progress

          return {
            id: pc.course.id,
            code: pc.course.code,
            title: pc.course.title,
            slug: pc.course.slug,
            category: pc.course.category,
            role: pc.courseRole, // 'foundation' | 'core' | 'supporting' | 'elective'
            isFoundation: pc.course.isFoundationCourse,
            thumbnail: pc.course.thumbnail,
            progress,
            status: userCourseEnrollment?.status || "not_started",
          }
        })

        const calculatedOverallProgress =
          courses.length > 0 ? Math.round(totalProgressSum / courses.length) : 0

        // Get cohort sessions and campus if available
        let sessions: any[] = []
        let campus = null
        if (cohort?.id) {
          const sessionRows = await programmesDb.getCohortClassSessions(cohort.id)
          sessions = sessionRows.map((sr) => ({
            id: sr.session.id,
            title: sr.session.title,
            sessionType: sr.session.activityType,
            deliveryChannel: sr.session.deliveryChannel,
            sessionDate: sr.session.sessionDate,
            startTime: sr.session.startTime,
            endTime: sr.session.endTime,
            classroomName: sr.classroom?.name || null,
            roomNumber: sr.classroom?.roomNumber || null,
            meetingUrl: sr.session.meetingUrl || null,
            status: sr.session.status,
          }))

          if (cohort.campusId) {
            campus = campusMap.get(cohort.campusId) || null
          }
        }

        return {
          id: enrolment.id,
          programmeId: enrolment.programmeId,
          programmeCode: programme.code,
          programmeName: programme.name,
          programmeType: programme.type,
          pathwayId: enrolment.pathwayId,
          pathwayCode: pathway?.code || null,
          pathwayName: pathway?.name || null,
          deliveryArrangement: enrolment.deliveryArrangement, // 'hybrid' | 'online'
          byolAcknowledged: enrolment.byolAcknowledged,
          status: enrolment.status,
          enrolledAt: enrolment.enrolledAt,
          overallProgress: calculatedOverallProgress,
          cohort: cohort
            ? {
                id: cohort.id,
                code: cohort.code,
                name: cohort.name,
                startDate: cohort.startDate,
                endDate: cohort.endDate,
                deliveryArrangement: cohort.deliveryArrangement,
              }
            : null,
          campus,
          courses,
          sessions,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      enrolments: detailedEnrolments,
      studentCategory: (user as any).studentCategory || "adult",
      guardianConsentStatus: (user as any).guardianConsentStatus || "not_applicable",
      schoolName: (user as any).schoolName || null,
    })
  } catch (error) {
    console.error("Student programmes fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch student programmes" }, { status: 500 })
  }
}
