import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { categoryUpdateSchema } from "@/lib/validation"
import { ZodError } from "zod"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const user = await authService.getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (user.role !== "admin" && user.role !== "instructor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = categoryUpdateSchema.parse(body)
    const db = getDB()
    const existing = (await db.getCategories()).find(
      (c: any) => c.name.toLowerCase() === validated.name.toLowerCase() && c.id !== id
    )
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }

    const updated = await db.updateCategory(id, validated.name.trim())
    if (!updated) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }
    return NextResponse.json({ category: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Update category error:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
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

    const db = getDB()
    const categories = await db.getCategories()
    const category = categories.find((c: any) => c.id === id)
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    const courses = await db.getAllCourses()
    const assignedCourses = courses.filter(
      (c: any) => c.category && c.category.toLowerCase() === category.name.toLowerCase(),
    )

    if (assignedCourses.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category "${category.name}" because ${assignedCourses.length} course(s) are assigned to it. Reassign or remove these courses first.`,
        },
        { status: 400 },
      )
    }

    const deleted = await db.deleteCategory(id)
    if (!deleted) {
      return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Category "${category.name}" deleted successfully`,
    })
  } catch (error) {
    console.error("Delete category error:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
