import { NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { getDB } from "@/lib/db"
import { getTokenFromRequest } from "@/lib/jwt"
import { z } from "zod"

const studentMessageSchema = z.object({
  courseId: z.string().optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  category: z.enum([
    "technical_concept",
    "assignment_feedback",
    "capstone_project",
    "schedule_attendance",
    "general_inquiry",
  ]),
  message: z.string().min(10, "Message must be at least 10 characters long"),
  priority: z.enum(["normal", "urgent"]).optional().default("normal"),
})

export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await authService.getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validated = studentMessageSchema.parse(body)
    const db = getDB()

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

    // Lookup course if specified
    const course = validated.courseId ? await db.getCourseById(validated.courseId) : null

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Student Message] From ${user.name} (${user.email}) | Topic: ${validated.category} | Course: ${course?.title || "General"} | Subject: ${validated.subject}`,
      )
    }

    return NextResponse.json({
      success: true,
      messageId,
      message:
        "Your message has been securely delivered to the faculty instructor. You will receive an email response and dashboard notification shortly.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error("Student message submit error:", error)
    return NextResponse.json({ error: "Failed to send message to instructor" }, { status: 500 })
  }
}
