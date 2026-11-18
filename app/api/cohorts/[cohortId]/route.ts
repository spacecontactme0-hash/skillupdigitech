import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cohortId: string }> },
) {
  try {
    const { cohortId } = await params
    const academicDb = getAcademicDb()
    const cohort = await academicDb.getCohortById(cohortId)

    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 })
    }

    const sessions = await academicDb.getClassSessions({ cohortId })

    return NextResponse.json({ cohort, sessions })
  } catch (error: any) {
    console.error("Get cohort error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve cohort" },
      { status: 500 },
    )
  }
}
