import { type NextRequest, NextResponse } from "next/server"
import { ZodError } from "zod"
import { getDB } from "@/lib/db"
import { courseUpdateSchema } from "@/lib/validation"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { getCurrentUserFromRequest, sanitizeCourseMutationInput } from "@/lib/authorization"
import { maskCourseForUser } from "@/lib/utils/course-masking"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const db = getDB()

    const course = await db.getCourseById(id)

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Mask videoUrl for unauthorized users
    const token = getTokenFromRequest(request)
    let user = null
    if (token) {
      user = await authService.getCurrentUser(token)
    }

    const safeCourse = maskCourseForUser(course, user)

    return NextResponse.json({ course: safeCourse })
  } catch (error) {
    console.error("Get course error:", error)
    return NextResponse.json({ error: "Failed to get course" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - no token" }, { status: 401 })
    }

    const canEdit = ["admin", "instructor"].includes(user.role)
    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden - only admin or instructor can edit courses" }, { status: 403 })
    }

    const db = getDB()
    const course = await db.getCourseById(id)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (user.role !== "admin" && course.instructorId !== user.id) {
      return NextResponse.json({ error: "Forbidden - you can only edit your own courses" }, { status: 403 })
    }

    const body = await request.json()
    const sanitizedBody = sanitizeCourseMutationInput(body, user, { allowPublishedUpdate: user.role === "admin" })
    const validated = courseUpdateSchema.parse(sanitizedBody)

    if (body.approved !== undefined && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - only admin can approve courses" }, { status: 403 })
    }

    const updated = await db.updateCourse(id, validated)

    if (!updated) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ course: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Update course error:", error)
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    // Get auth token from headers
    const token = getTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized - no token" }, { status: 401 })
    }

    // Verify token and get user
    const user = await authService.getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - invalid token" }, { status: 401 })
    }

    const db = getDB()
    const course = await db.getCourseById(id)
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const canDelete =
      user.role === "admin" || (user.role === "instructor" && course.instructorId === user.id)
    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden - only admin or the course instructor can delete this course" },
        { status: 403 },
      )
    }

    const success = await db.deleteCourse(id)

    if (!success) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete course error:", error)
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 })
  }
}
