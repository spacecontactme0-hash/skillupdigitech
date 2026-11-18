import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"

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

    const { sessionId } = await params
    const academicDb = getAcademicDb()
    const session = await academicDb.getClassSessionById(sessionId)
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Body can specify target studentId (admin only) or defaults to user.id
    const body = await request.json().catch(() => ({}))
    const studentId = (user.role === "admin" && body.studentId) ? body.studentId : user.id
    const programmeEnrolmentId = body.programmeEnrolmentId

    if (!programmeEnrolmentId) {
      return NextResponse.json(
        { error: "programmeEnrolmentId is required for session booking" },
        { status: 400 },
      )
    }

    try {
      const booking = await academicDb.bookSessionAtomic({
        sessionId,
        studentId,
        programmeEnrolmentId,
      })

      return NextResponse.json({ booking }, { status: 201 })
    } catch (atomicError: any) {
      if (atomicError.message === "CAPACITY_EXCEEDED") {
        return NextResponse.json(
          {
            error: "Capacity exceeded. This physical session or lab workshop has reached its maximum seat limit.",
            code: "CAPACITY_EXCEEDED",
          },
          { status: 409 },
        )
      }
      if (atomicError.message === "SESSION_CANCELLED") {
        return NextResponse.json(
          { error: "This session has been cancelled by the academy", code: "SESSION_CANCELLED" },
          { status: 400 },
        )
      }
      throw atomicError
    }
  } catch (error: any) {
    console.error("Book session error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to book session" },
      { status: 500 },
    )
  }
}

export async function DELETE(
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

    const { sessionId } = await params
    const { searchParams } = new URL(request.url)
    const targetStudentId = searchParams.get("studentId")
    const studentId = (user.role === "admin" && targetStudentId) ? targetStudentId : user.id

    const academicDb = getAcademicDb()
    await academicDb.cancelSessionBooking({
      sessionId,
      studentId,
    })

    return NextResponse.json({ success: true, message: "Booking cancelled successfully" })
  } catch (error: any) {
    console.error("Cancel booking error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to cancel booking" },
      { status: 500 },
    )
  }
}
