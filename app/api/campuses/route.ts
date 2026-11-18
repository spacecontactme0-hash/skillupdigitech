import { type NextRequest, NextResponse } from "next/server"
import { getAcademicDb } from "@/lib/academic-db"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"

export async function GET() {
  try {
    const academicDb = getAcademicDb()
    const campuses = await academicDb.getCampuses()
    
    // Fetch classrooms for each campus
    const campusesWithClassrooms = await Promise.all(
      campuses.map(async (campus) => {
        const classrooms = await academicDb.getClassrooms(campus.id)
        return {
          ...campus,
          classrooms,
        }
      }),
    )

    return NextResponse.json({ campuses: campusesWithClassrooms })
  } catch (error: any) {
    console.error("Get campuses error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve campuses" },
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
    if (!body.name || !body.slug || !body.address || !body.city || !body.state) {
      return NextResponse.json(
        { error: "name, slug, address, city, and state are required" },
        { status: 400 },
      )
    }

    const academicDb = getAcademicDb()
    const campus = await academicDb.createCampus({
      name: body.name.trim(),
      slug: body.slug.trim().toLowerCase(),
      address: body.address.trim(),
      city: body.city.trim(),
      state: body.state.trim(),
      contactPhone: body.contactPhone?.trim(),
      contactEmail: body.contactEmail?.trim(),
      facilities: body.facilities,
    })

    return NextResponse.json({ campus }, { status: 201 })
  } catch (error: any) {
    console.error("Create campus error:", error)
    return NextResponse.json(
      { error: error?.message || "Failed to create campus" },
      { status: 500 },
    )
  }
}
