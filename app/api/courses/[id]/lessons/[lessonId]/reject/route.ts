import { type NextRequest, NextResponse } from "next/server"
import { authService } from "@/lib/auth"
import { getTokenFromRequest } from "@/lib/jwt"
import { getDB } from "@/lib/db"
import { sendLessonRejectedEmail } from "@/lib/email"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  try {
    const resolvedParams = await params
    const { id, lessonId } = resolvedParams
    const body = await request.json()
    const note = (body.note || "").toString()

    const token = getTokenFromRequest(request)
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await authService.getCurrentUser(token)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - admin only" }, { status: 403 })
    }

    const db = getDB()
    const course = await db.getCourseById(id)
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    let changed = false
    let lessonTitle = ""
    let moderationEventId = ""
    for (const mod of course.modules || []) {
      for (const lesson of mod.lessons || []) {
        if (lesson.id === lessonId) {
          lesson.pendingApproval = false
          lesson.approved = false
          lesson.content = lesson.content || {}
          lesson.content.rejectionNote = note
          lesson.content.moderationCount = (lesson.content.moderationCount || 0) + 1
          lesson.content.lastModeratedAt = new Date().toISOString()
          moderationEventId =
            body?.moderationId ||
            body?.revisionId ||
            lesson.content?.revisionId ||
            `rev-${lesson.content.moderationCount}`
          lessonTitle = lesson.title
          changed = true
        }
      }
    }

    if (!changed) return NextResponse.json({ error: "Lesson not found" }, { status: 404 })

    const updated = await db.updateCourse(id, { modules: course.modules })
    if (!updated) return NextResponse.json({ error: "Failed to update course" }, { status: 500 })

    const instructor = await db.findUserById(course.instructorId)
    if (instructor?.email) {
      try {
        await sendLessonRejectedEmail({
          to: instructor.email,
          name: instructor.name || "Instructor",
          courseTitle: course.title,
          lessonTitle: lessonTitle || "Lesson",
          note,
          idempotencyKey: `curriculum_review:${id}:${lessonId}:${moderationEventId}`,
        })
      } catch (emailError) {
        console.error("Failed to send lesson rejection email:", emailError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reject lesson error:", error)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
