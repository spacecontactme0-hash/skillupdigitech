import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const programmeId = searchParams.get("programmeId") || undefined
    const pathwayId = searchParams.get("pathwayId") || undefined
    const deliveryArrangement = searchParams.get("deliveryArrangement") || undefined
    const status = searchParams.get("status") || undefined

    const academicDb = getAcademicDb()
    const cohorts = await academicDb.getCohorts({
      programmeId,
      pathwayId,
      deliveryArrangement,
      status,
    })

    return NextResponse.json({ cohorts })
  } catch (error: any) {
    console.error("Get cohorts error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve cohorts" },
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
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
    }

    const body = await request.json()
    if (!body.programmeId || !body.code || !body.name || !body.deliveryArrangement || !body.startDate || !body.endDate) {
      return NextResponse.json(
        { error: "programmeId, code, name, deliveryArrangement, startDate, and endDate are required" },
        { status: 400 },
      )
    }

    const academicDb = getAcademicDb()
    const cohort = await academicDb.createCohort({
      programmeId: body.programmeId,
      pathwayId: body.pathwayId || undefined,
      code: body.code.trim().toUpperCase(),
      name: body.name.trim(),
      deliveryArrangement: body.deliveryArrangement,
      campusId: body.campusId || undefined,
      defaultClassroomId: body.defaultClassroomId || undefined,
      maxCapacity: body.maxCapacity ? parseInt(body.maxCapacity, 10) : 30,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      status: body.status || "enrolling",
      fixedTimetableSummary: body.fixedTimetableSummary || undefined,
    })

    return NextResponse.json({ cohort }, { status: 201 })
  } catch (error: any) {
    console.error("Create cohort error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to create cohort" },
      { status: 500 },
    )
  }
}
