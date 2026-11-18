import { type NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { getDB } from "@/lib/db"
import { courseCreateSchema } from "@/lib/validation"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { getCurrentUserFromRequest, sanitizeCourseMutationInput } from "@/lib/authorization"
import { maskCourseForUser } from "@/lib/utils/course-masking"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get("category")
    const level = searchParams.get("level")
    const search = searchParams.get("search")
    const instructorId = searchParams.get("instructorId")
    const instructorName = searchParams.get("instructorName")
    const includeDrafts = searchParams.get("includeDrafts") === "true"

    const db = getDB()
    let courses: any[] = []
    if (instructorName) {
      const users = await db.getAllUsers()
      const match = users.find(
        (u: any) => u.role === "instructor" && u.name?.toLowerCase() === instructorName.toLowerCase(),
      )
      courses = match ? await db.getCoursesByInstructor(match.id) : []
    } else if (instructorId) {
      courses = await db.getCoursesByInstructor(instructorId)
    } else if (includeDrafts && typeof db.getAllCoursesIncludingDrafts === "function") {
      courses = await db.getAllCoursesIncludingDrafts()
    } else {
      courses = await db.getAllCourses()
    }

    if (!includeDrafts) {
      // Only expose approved courses to public queries
      courses = courses.filter((c: any) => c.approved === true)
    }

    if (category && category !== "all") {
      courses = courses.filter((c: any) => c.category.toLowerCase() === category.toLowerCase())
    }

    if (level && level !== "all") {
      courses = courses.filter((c: any) => c.level.toLowerCase() === level.toLowerCase())
    }

    if (search) {
      const query = search.toLowerCase()
      courses = courses.filter(
        (c: any) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query),
      )
    }

    // Mask video URLs for unauthenticated/non-privileged users
    const token = getTokenFromRequest(request)
    let user = null
    if (token) {
      user = await authService.getCurrentUser(token)
    }

    const instructorIds = Array.from(new Set((courses || []).map((course: any) => course.instructorId).filter(Boolean)))
    const instructors = await Promise.all(instructorIds.map((id: string) => db.findUserById(id)))
    const instructorById = new Map(
      instructors
        .filter(Boolean)
        .map((instructor: any) => [
          instructor.id,
          {
            name: instructor.name || "Instructor",
            avatar: instructor.avatar || "/placeholder.svg",
            bio: instructor.bio || "",
            headline: instructor.instructorProfile?.professionalHeadline || "",
            yearsOfExperience: instructor.instructorProfile?.yearsOfExperience || 0,
            specialties: instructor.instructorProfile?.specialties || [],
          },
        ]),
    )

    const safeCourses = courses.map((c: any) => {
      const safe = maskCourseForUser(c, user)
      const instructor = instructorById.get(c.instructorId)
      return {
        ...safe,
        instructorName: instructor?.name,
        instructorAvatar: instructor?.avatar,
        instructorBio: instructor?.bio,
        instructorHeadline: instructor?.headline,
        instructorYearsOfExperience: instructor?.yearsOfExperience,
        instructorSpecialties: instructor?.specialties,
      }
    })

    return NextResponse.json({ courses: safeCourses })
  } catch (error) {
    console.error("Get courses error:", error)
    return NextResponse.json({ error: "Failed to get courses" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (!user.role || !["instructor", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const sanitizedBody = sanitizeCourseMutationInput(body, user)
    const validated = courseCreateSchema.parse(sanitizedBody)

    const db = getDB()

    // Generate slug from title
    const slug = validated.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    // Check if slug already exists
    const existingCourse = await db.getCourseBySlug(slug)
    if (existingCourse) {
      return NextResponse.json(
        { error: "A course with this title already exists" },
        { status: 409 }
      )
    }

    const instructorId = user.role === "admin" ? (validated.instructorId || user.id) : user.id
    const isAdminApproval = user.role === "admin"

    const course = await db.createCourse({
      ...validated,
      instructorId,
      slug,
      thumbnail: validated.thumbnail || "/placeholder.jpg",
      published: false,
      approved: isAdminApproval ? (validated.approved ?? false) : false,
      modules: validated.modules ?? [],
      totalDuration: validated.totalDuration ?? 0,
      enrollmentCount: validated.enrollmentCount ?? 0,
      rating: validated.rating ?? 0,
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Create course error:", error)
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
  }
}
