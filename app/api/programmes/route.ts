import { NextResponse } from "next/server"
import { programmesDb } from "@/lib/programmes-db"

export async function GET() {
  try {
    const programmes = await programmesDb.getProgrammes()
    const programmesWithDetails = await Promise.all(
      programmes.map(async (prog) => {
        const pathways = await programmesDb.getPathways(prog.id)
        const curriculum = await programmesDb.getProgrammeCourses(prog.id)
        return {
          ...prog,
          pathways,
          curriculum,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      programmes: programmesWithDetails,
    })
  } catch (error) {
    console.error("[API][PROGRAMMES] Error retrieving programmes:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load academic programmes" },
      { status: 500 },
    )
  }
}
