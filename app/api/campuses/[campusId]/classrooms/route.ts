import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campusId: string }> },
) {
  try {
    const { campusId } = await params
    const academicDb = getAcademicDb()
    const classrooms = await academicDb.getClassrooms(campusId)

    return NextResponse.json({ classrooms })
  } catch (error: any) {
    console.error("Get classrooms error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve classrooms" },
      { status: 500 },
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ campusId: string }> },
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
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 })
    }

    const { campusId } = await params
    const body = await request.json()
    if (!body.name) {
      return NextResponse.json({ error: "Classroom name is required" }, { status: 400 })
    }

    const academicDb = getAcademicDb()
    const classroom = await academicDb.createClassroom({
      campusId,
      name: body.name.trim(),
      roomNumber: body.roomNumber?.trim(),
      safeCapacity: body.safeCapacity ? parseInt(body.safeCapacity, 10) : 30,
      powerOutletsCount: body.powerOutletsCount ? parseInt(body.powerOutletsCount, 10) : 30,
    })

    return NextResponse.json({ classroom }, { status: 201 })
  } catch (error: any) {
    console.error("Create classroom error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to create classroom" },
      { status: 500 },
    )
  }
}
