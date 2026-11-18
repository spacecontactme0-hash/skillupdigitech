import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { getPostgresDatabase } from "@/lib/postgres-db"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { getDrizzleDb } from "@/db/client"
import * as schema from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
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

    const { sessionId } = await params
    const academicDb = getAcademicDb()
    const session = await academicDb.getClassSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const drizzle = getDrizzleDb()

    // 1. Get cohort members
    const members = await drizzle
      .select({
        membershipId: schema.cohortMemberships.id,
        studentId: schema.cohortMemberships.studentId,
        programmeEnrolmentId: schema.cohortMemberships.programmeEnrolmentId,
        studentName: schema.users.name,
        studentEmail: schema.users.email,
        studentAvatar: schema.users.avatar,
      })
      .from(schema.cohortMemberships)
      .innerJoin(schema.users, eq(schema.cohortMemberships.studentId, schema.users.id))
      .where(
        and(
          eq(schema.cohortMemberships.cohortId, session.cohortId),
          eq(schema.cohortMemberships.status, "active"),
        ),
      )

    // 2. Get existing attendance records for this session
    const attendanceRecords = await academicDb.getAttendanceBySession(sessionId)
    const attendanceMap = new Map(attendanceRecords.map((r) => [r.studentId, r]))

    // 3. Merge roster with attendance
    const roster = members.map((member) => ({
      ...member,
      attendance: attendanceMap.get(member.studentId) || null,
    }))

    return NextResponse.json({
      session,
      roster,
      summary: {
        totalEnrolled: members.length,
        markedCount: attendanceRecords.length,
        presentCount: attendanceRecords.filter((r) => r.attendanceStatus === "present").length,
        absentCount: attendanceRecords.filter((r) => r.attendanceStatus === "absent").length,
        lateCount: attendanceRecords.filter((r) => r.attendanceStatus === "late").length,
      },
    })
  } catch (error: any) {
    console.error("Get attendance error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve attendance" },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
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

    const { sessionId } = await params
    const body = await request.json()

    if (!body.studentId || !body.programmeEnrolmentId || !body.attendanceStatus || !body.attendanceChannel) {
      return NextResponse.json(
        { error: "studentId, programmeEnrolmentId, attendanceStatus, and attendanceChannel are required" },
        { status: 400 },
      )
    }

    const academicDb = getAcademicDb()
    const record = await academicDb.markAttendance({
      sessionId,
      studentId: body.studentId,
      programmeEnrolmentId: body.programmeEnrolmentId,
      attendanceStatus: body.attendanceStatus,
      attendanceChannel: body.attendanceChannel,
      verifiedBy: user.id,
      notes: body.notes?.trim(),
    })

    return NextResponse.json({ record }, { status: 200 })
  } catch (error: any) {
    console.error("Mark attendance error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to mark attendance" },
      { status: 500 },
    )
  }
}
