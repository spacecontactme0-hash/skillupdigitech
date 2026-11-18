import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cohortId = searchParams.get("cohortId") || undefined
    const courseId = searchParams.get("courseId") || undefined
    const instructorId = searchParams.get("instructorId") || undefined
    const activityType = searchParams.get("activityType") || undefined

    const academicDb = getAcademicDb()
    const sessions = await academicDb.getClassSessions({
      cohortId,
      courseId,
      instructorId,
      activityType,
    })

    return NextResponse.json({ sessions })
  } catch (error: any) {
    console.error("Get sessions error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve sessions" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await authService.getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (user.role !== "admin" && user.role !== "instructor") {
      return NextResponse.json(
        { error: "Forbidden: Instructor or Admin privileges required" },
        { status: 403 },
      )
    }

    const body = await request.json()
    if (!body.cohortId || !body.title || !body.activityType || !body.deliveryChannel || !body.sessionDate || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: "cohortId, title, activityType, deliveryChannel, sessionDate, startTime, and endTime are required" },
        { status: 400 },
      )
    }

    const academicDb = getAcademicDb()
    const session = await academicDb.createClassSession({
      cohortId: body.cohortId,
      courseId: body.courseId || undefined,
      title: body.title.trim(),
      description: body.description?.trim(),
      activityType: body.activityType,
      deliveryChannel: body.deliveryChannel,
      campusId: body.campusId || undefined,
      classroomId: body.classroomId || undefined,
      instructorId: user.role === "instructor" ? user.id : (body.instructorId || user.id),
      sessionDate: new Date(body.sessionDate),
      startTime: body.startTime,
      endTime: body.endTime,
      meetingUrl: body.meetingUrl?.trim(),
      maxCapacity: body.maxCapacity ? parseInt(body.maxCapacity, 10) : 30,
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error: any) {
    console.error("Create session error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to create session" },
      { status: 500 },
    )
  }
}
