"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileText,
  PlayCircle,
  Award,
  FolderGit2,
  BookOpen,
  StickyNote,
  Plus,
  Trash2,
  Menu,
  X,
  Code2,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react"
import { useAuthStore } from "@/lib/store"
import type { Course, Enrollment, Lesson, LearningNote } from "@/lib/types"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { QuizRunner } from "@/components/academic/QuizRunner"
import { AssignmentSubmissionPanel } from "@/components/academic/AssignmentSubmissionPanel"
import { CapstoneProjectPanel } from "@/components/academic/CapstoneProjectPanel"
import { TechnicalContentRenderer } from "@/components/learning/TechnicalContentRenderer"
import { WriteToInstructorModal } from "@/components/student/write-to-instructor-modal"

export default function LearnPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuthStore()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [viewMode, setViewMode] = useState<"lesson" | "capstone">("lesson")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<"content" | "notes">("content")
  const [instructorModalOpen, setInstructorModalOpen] = useState(false)

  // Notes state
  const [notes, setNotes] = useState<LearningNote[]>([])
  const [noteContent, setNoteContent] = useState("")
  const [notesLoading, setNotesLoading] = useState(false)
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const loadData = async () => {
      try {
        const [courseRes, enrollmentsRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token || ""}` },
          }),
          fetch(`/api/enrollments?userId=${user.id}`, {
            headers: { Authorization: `Bearer ${token || ""}` },
          }),
        ])

        if (!courseRes.ok || !enrollmentsRes.ok) {
          router.push("/dashboard/courses")
          return
        }

        const courseData = await courseRes.json()
        const enrollmentsData = await enrollmentsRes.json()
        const foundCourse = courseData.course as Course
        const foundEnrollment = (enrollmentsData.enrollments || []).find(
          (e: Enrollment) => e.courseId === courseId,
        )

        if (!foundCourse || !foundEnrollment) {
          router.push("/dashboard/courses")
          return
        }

        setCourse(foundCourse)
        setEnrollment(foundEnrollment)

        if (foundCourse.modules.length > 0) {
          const firstModule = foundCourse.modules[0]
          if (firstModule && firstModule.lessons.length > 0) {
            setCurrentLesson(firstModule.lessons[0] as Lesson)
          }
        }
      } catch (error) {
        console.error("Failed to load course data:", error)
        router.push("/dashboard/courses")
      }
    }

    void loadData()
  }, [user, courseId, router, token])

  // Load course-specific notes
  useEffect(() => {
    if (!user || !token || !courseId) return

    const loadNotes = async () => {
      setNotesLoading(true)
      try {
        const res = await fetch(`/api/notes?userId=${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return
        const data = await res.json()
        const allNotes: LearningNote[] = data.notes || []
        // Filter notes for this course or general
        const courseNotes = allNotes.filter(
          (n) => n.courseId === courseId || !n.courseId,
        )
        setNotes(courseNotes)
      } catch (err) {
        console.error("Failed to load notes:", err)
      } finally {
        setNotesLoading(false)
      }
    }

    void loadNotes()
  }, [user, token, courseId])

  const handleSaveNote = async () => {
    if (!noteContent.trim() || !user || !token) return
    setNoteSaving(true)
    setNoteError(null)

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: noteContent.trim(),
          courseId,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to save note")
      }

      const data = await res.json()
      setNotes((prev) => [data.note as LearningNote, ...prev])
      setNoteContent("")
    } catch (err: any) {
      setNoteError(err.message || "Failed to save note")
    } finally {
      setNoteSaving(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!user || !token) return
    try {
      const res = await fetch(`/api/notes?id=${encodeURIComponent(noteId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
    } catch (err) {
      console.error("Failed to delete note:", err)
    }
  }

  const markLessonComplete = () => {
    if (!currentLesson || !enrollment) return

    const isCompleted = enrollment.completedLessons.includes(currentLesson.id)
    if (isCompleted) return

    const updatedLessons = [...enrollment.completedLessons, currentLesson.id]
    const totalLessons =
      course?.modules.reduce((sum, module) => sum + module.lessons.length, 0) || 1
    const progress = Math.round((updatedLessons.length / totalLessons) * 100)

    fetch(`/api/enrollments/${enrollment.id}/progress`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
      },
      body: JSON.stringify({ completedLessons: updatedLessons, progress }),
    }).catch((error) => console.error("Failed to update progress:", error))

    setEnrollment({ ...enrollment, completedLessons: updatedLessons, progress })
  }

  const currentModule = useMemo(() => {
    if (!course || !currentLesson) return null
    return course.modules.find((m) =>
      m.lessons.some((l) => l.id === currentLesson.id),
    )
  }, [course, currentLesson])

  const goToNextLesson = () => {
    if (!course || !currentLesson) return

    let found = false
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (found) {
          setCurrentLesson(lesson as Lesson)
          setViewMode("lesson")
          return
        }
        if (lesson.id === currentLesson.id) {
          found = true
        }
      }
    }
  }

  const goToPreviousLesson = () => {
    if (!course || !currentLesson) return

    let previousLesson: Lesson | null = null
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (lesson.id === currentLesson.id && previousLesson) {
          setCurrentLesson(previousLesson)
          setViewMode("lesson")
          return
        }
        previousLesson = lesson as Lesson
      }
    }
  }

  if (!course || !enrollment || !currentLesson) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Preparing technical learning environment...</span>
        </div>
      </div>
    )
  }

  const isCurrentLessonCompleted = enrollment.completedLessons.includes(
    currentLesson.id,
  )
  const isQuizLesson =
    currentLesson.type === "quiz" || Boolean(currentLesson.content?.quizId)
  const isAssignmentLesson =
    currentLesson.type === "assignment" ||
    Boolean(currentLesson.content?.assignmentId) ||
    Boolean(currentLesson.content?.assignment)

  const lessonAssignment = currentLesson.content?.assignment
  const lessonResources = currentLesson.content?.resources || []

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Top Learning Navigation Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-card px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Link href="/dashboard/courses">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">My Courses</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {course.title}
            </p>
            {currentModule ? (
              <p className="hidden text-xs text-muted-foreground sm:block truncate">
                {currentModule.title}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {enrollment.progress}% complete
            </span>
            <Progress value={enrollment.progress} className="h-2 w-24" />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setInstructorModalOpen(true)}
            className="gap-1.5 text-xs text-[#231651] border-[#231651]/20 hover:bg-[#231651]/5"
            title="Ask instructor a question"
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#613399]" />
            <span className="hidden md:inline">Write to Instructor</span>
          </Button>

          <Button
            variant={viewMode === "capstone" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode(viewMode === "capstone" ? "lesson" : "capstone")}
            className="gap-1.5 text-xs"
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Capstone</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-foreground"
            title={sidebarOpen ? "Hide syllabus" : "Show syllabus"}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {/* Main Learning Canvas */}
      <div className="flex flex-1 overflow-hidden">
        {/* Workspace Central Content */}
        <main className="flex-1 overflow-y-auto">
          {viewMode === "capstone" ? (
            <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col gap-2 border-b border-border/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      Applied Software Engineering
                    </Badge>
                  </div>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                    Capstone Project Deliverable
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Submit your real-world software architecture, repository code, and live deployment for instructor evaluation.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("lesson")}
                  className="w-full sm:w-auto"
                >
                  Return to Lessons
                </Button>
              </div>

              <CapstoneProjectPanel courseId={courseId} token={token} />
            </div>
          ) : (
            <div className="flex flex-col min-h-full">
              {/* Media Player Area (Video or Visual Banner) */}
              {currentLesson.type === "video" && currentLesson.content?.videoUrl ? (
                <div className="aspect-video max-h-[500px] w-full bg-slate-950 flex items-center justify-center border-b border-slate-800">
                  {(() => {
                    const url = currentLesson.content.videoUrl as string
                    const ytMatch = url.match(
                      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([A-Za-z0-9_-]{11})/,
                    )
                    if (ytMatch && ytMatch[1]) {
                      return (
                        <iframe
                          title={currentLesson.title}
                          src={`https://www.youtube-nocookie.com/embed/${ytMatch[1]}`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      )
                    }
                    if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
                      return (
                        <video
                          src={url}
                          controls
                          className="h-full w-full object-contain"
                        />
                      )
                    }
                    return (
                      <div className="text-center text-slate-200 p-6">
                        <PlayCircle className="mx-auto mb-3 h-16 w-16 text-sky-400 opacity-80" />
                        <p className="text-base font-semibold">{currentLesson.title}</p>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs text-sky-300 underline hover:text-sky-200"
                        >
                          Open external video stream <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )
                  })()}
                </div>
              ) : null}

              {/* Lesson Body */}
              <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-4 sm:p-6 lg:p-8">
                {/* Meta & Status Bar */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {currentLesson.type === "article"
                        ? "Technical Guide"
                        : currentLesson.type}
                    </Badge>
                    {isQuizLesson ? (
                      <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        Evaluated Assessment
                      </Badge>
                    ) : null}
                    {isAssignmentLesson ? (
                      <Badge variant="secondary">Practical Assignment</Badge>
                    ) : null}
                    {isCurrentLessonCompleted ? (
                      <Badge className="bg-emerald-600/90 text-white gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Completed
                      </Badge>
                    ) : null}
                    {currentLesson.duration ? (
                      <span className="text-xs text-muted-foreground ml-auto">
                        Est. {currentLesson.duration} mins
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">
                      {currentLesson.title}
                    </h1>
                    {currentModule ? (
                      <p className="mt-1 text-xs text-muted-foreground font-mono">
                        Module: {currentModule.title}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Tabs for Technical Reading vs Notes */}
                <div className="flex border-b border-border/70 gap-4 text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveTab("content")}
                    className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                      activeTab === "content"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileText className="h-4 w-4" /> Lesson Content
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("notes")}
                    className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                      activeTab === "notes"
                        ? "border-primary text-primary font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <StickyNote className="h-4 w-4" />
                    My Course Notes
                    {notes.length > 0 && (
                      <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.2 text-[11px] font-semibold text-primary">
                        {notes.length}
                      </span>
                    )}
                  </button>
                </div>

                {activeTab === "content" ? (
                  <div className="space-y-6">
                    {/* Technical Article / Guide Content */}
                    {currentLesson.type === "article" &&
                    currentLesson.content.articleContent ? (
                      <Card className="border-border/80 bg-card/60 shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/50">
                          <CardTitle className="flex items-center gap-2 text-base font-semibold">
                            <Code2 className="h-4 w-4 text-primary" />
                            Technical Implementation & Walkthrough
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <TechnicalContentRenderer
                            content={currentLesson.content.articleContent}
                          />
                        </CardContent>
                      </Card>
                    ) : null}

                    {/* Graded Quiz Assessment */}
                    {isQuizLesson ? (
                      <div className="space-y-2">
                        <QuizRunner
                          courseId={courseId}
                          quizId={currentLesson.content?.quizId || currentLesson.id}
                          lessonId={currentLesson.id}
                          token={token}
                          onComplete={markLessonComplete}
                        />
                      </div>
                    ) : null}

                    {/* Practical Assignment Submission */}
                    {isAssignmentLesson ? (
                      <div className="space-y-4">
                        {lessonAssignment ? (
                          <Card className="border-border/80 bg-card/60 shadow-sm">
                            <CardHeader className="pb-3 border-b border-border/50">
                              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <ClipboardList className="h-4 w-4 text-primary" />
                                {lessonAssignment.title || "Assignment Specifications"}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4 text-sm">
                              <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                                {lessonAssignment.instructions ||
                                  "Complete the code exercise or project task and submit your artifact URLs."}
                              </p>
                              <div className="flex flex-wrap gap-2 text-xs pt-2">
                                <Badge variant="outline">
                                  {lessonAssignment.submissionType} deliverable
                                </Badge>
                                <Badge variant="outline">
                                  Max: {lessonAssignment.maxScore} pts
                                </Badge>
                                {lessonAssignment.estimatedMinutes ? (
                                  <Badge variant="outline">
                                    Est. {lessonAssignment.estimatedMinutes} mins
                                  </Badge>
                                ) : null}
                              </div>
                            </CardContent>
                          </Card>
                        ) : null}

                        <AssignmentSubmissionPanel
                          courseId={courseId}
                          assignmentId={
                            currentLesson.content?.assignmentId || currentLesson.id
                          }
                          lessonId={currentLesson.id}
                          token={token}
                          maxScore={lessonAssignment?.maxScore || 100}
                          onSubmitted={markLessonComplete}
                        />
                      </div>
                    ) : null}

                    {/* Lesson Resources */}
                    {lessonResources.length > 0 ? (
                      <Card className="border-border/80 bg-card/50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Lesson References & Resources
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {lessonResources.map((resource, index) => (
                            <a
                              key={`${resource.url}-${index}`}
                              href={resource.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between rounded-lg border border-border/70 bg-background/50 px-3.5 py-2.5 text-sm hover:border-primary transition-colors group"
                            >
                              <span className="font-medium text-foreground group-hover:text-primary">
                                {resource.title || resource.url}
                              </span>
                              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                            </a>
                          ))}
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                ) : (
                  /* Course Notes Tab with real persistence */
                  <div className="space-y-6">
                    <Card className="border-border/80 shadow-sm">
                      <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                          <StickyNote className="h-4 w-4 text-primary" />
                          Add Note for {course.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-4">
                        <Textarea
                          placeholder="Record key technical takeaways, code snippets, or architecture reminders..."
                          rows={4}
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                        />
                        {noteError && (
                          <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 p-2.5 rounded-md">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{noteError}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-xs text-muted-foreground">
                            Notes are securely saved to your student learning hub.
                          </span>
                          <Button
                            size="sm"
                            onClick={handleSaveNote}
                            disabled={noteSaving || !noteContent.trim()}
                            className="gap-1.5"
                          >
                            {noteSaving ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" /> Save Note
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Saved Notes List */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        Your Saved Notes ({notes.length})
                      </h3>
                      {notesLoading ? (
                        <p className="text-xs text-muted-foreground animate-pulse">
                          Loading course notes...
                        </p>
                      ) : notes.length > 0 ? (
                        <div className="space-y-2.5">
                          {notes.map((note) => (
                            <div
                              key={note.id}
                              className="rounded-xl border border-border/80 bg-card p-4 space-y-2 text-sm"
                            >
                              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
                                {note.content}
                              </p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-2">
                                <span>
                                  {new Date(note.createdAt).toLocaleDateString()} at{" "}
                                  {new Date(note.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No notes recorded for this course yet. Use the field above to capture your thoughts.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Sticky Lesson Navigation Footer */}
              <div className="mt-auto border-t border-border/80 bg-card/90 backdrop-blur-sm p-4">
                <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousLesson}
                    className="gap-1.5 text-xs sm:text-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Previous Lesson</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>

                  <Button
                    size="sm"
                    variant={isCurrentLessonCompleted ? "outline" : "default"}
                    onClick={markLessonComplete}
                    disabled={isCurrentLessonCompleted}
                    className="gap-1.5 text-xs sm:text-sm"
                  >
                    <CheckCircle2
                      className={`h-4 w-4 ${isCurrentLessonCompleted ? "text-emerald-500" : ""}`}
                    />
                    {isCurrentLessonCompleted ? "Lesson Completed" : "Mark Complete"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextLesson}
                    className="gap-1.5 text-xs sm:text-sm"
                  >
                    <span className="hidden sm:inline">Next Lesson</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Collapsible Syllabus Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 shrink-0 border-l border-border/80 bg-card/95 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="border-b border-border/70 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    Course Curriculum
                  </h2>
                  <span className="text-xs font-mono font-medium text-primary">
                    {enrollment.progress}%
                  </span>
                </div>
                <Progress value={enrollment.progress} className="h-1.5" />
              </div>

              <Accordion
                type="multiple"
                defaultValue={course.modules.map((m) => m.id)}
                className="px-2 py-2"
              >
                {course.modules.map((module, index) => (
                  <AccordionItem
                    key={module.id}
                    value={module.id}
                    className="border-b-0 mb-1"
                  >
                    <AccordionTrigger className="rounded-lg px-2.5 py-2 text-xs font-semibold hover:bg-muted/40 hover:no-underline">
                      <div className="text-left">
                        <span className="text-[11px] text-muted-foreground block font-mono">
                          Module {index + 1}
                        </span>
                        <span className="truncate">{module.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-1 pb-2">
                      <div className="space-y-1">
                        {module.lessons.map((lesson) => {
                          const isCompleted = enrollment.completedLessons.includes(
                            lesson.id,
                          )
                          const isCurrent =
                            currentLesson.id === lesson.id &&
                            viewMode === "lesson"

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => {
                                setCurrentLesson(lesson as Lesson)
                                setViewMode("lesson")
                              }}
                              className={`w-full rounded-lg px-3 py-2 text-left text-xs transition-colors flex items-center gap-2.5 ${
                                isCurrent
                                  ? "bg-primary text-primary-foreground font-medium shadow-sm"
                                  : "hover:bg-muted/50 text-foreground"
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle2
                                  className={`h-3.5 w-3.5 shrink-0 ${
                                    isCurrent ? "text-primary-foreground" : "text-emerald-500"
                                  }`}
                                />
                              ) : (
                                <div
                                  className={`h-3.5 w-3.5 rounded-full border shrink-0 ${
                                    isCurrent
                                      ? "border-primary-foreground/70"
                                      : "border-muted-foreground/40"
                                  }`}
                                />
                              )}
                              <span className="flex-1 truncate">{lesson.title}</span>
                              <span
                                className={`text-[10px] shrink-0 font-mono ${
                                  isCurrent
                                    ? "text-primary-foreground/80"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {lesson.duration}m
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Capstone Section Switcher in Sidebar Footer */}
            <div className="border-t border-border/70 p-3 bg-muted/20">
              <Button
                variant={viewMode === "capstone" ? "default" : "outline"}
                size="sm"
                className="w-full gap-2 text-xs font-medium"
                onClick={() => setViewMode("capstone")}
              >
                <FolderGit2 className="h-3.5 w-3.5" />
                Course Capstone Project
              </Button>
            </div>
          </aside>
        )}
      </div>

      <WriteToInstructorModal
        isOpen={instructorModalOpen}
        onClose={() => setInstructorModalOpen(false)}
        defaultCourseId={course.id}
        courseTitle={course.title}
      />
    </div>
  )
}
