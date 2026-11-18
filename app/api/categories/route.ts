import { type NextRequest, NextResponse } from "next/server"
import { getDB } from "@/lib/db"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { categoryCreateSchema } from "@/lib/validation"
import { ZodError } from "zod"

export async function GET() {
  try {
    const db = getDB()
    const categories = await db.getCategories()
    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ error: "Failed to get categories" }, { status: 500 })
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
    if (user.role !== "admin" && user.role !== "instructor") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const validated = categoryCreateSchema.parse(body)
    const db = getDB()
    const existing = (await db.getCategories()).find(
      (c: any) => c.name.toLowerCase() === validated.name.toLowerCase()
    )
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 })
    }

    const category = await db.createCategory(validated.name.trim())
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
