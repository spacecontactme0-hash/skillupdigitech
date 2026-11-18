export interface QuizAttemptAnswer {
  questionId: string
  selectedOption: number
  isCorrect?: boolean
  score?: number
}

export interface QuizAttempt {
  id: string
  quizId: string
  courseId: string
  lessonId?: string
  userId: string
  status: "in_progress" | "completed" | "abandoned"
  score?: number
  maxScore: number
  passed?: boolean
  answers: QuizAttemptAnswer[]
  startedAt: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  courseId: string
  lessonId?: string
  userId: string
  attemptNumber: number
  content?: string
  artifactUrls: string[]
  status: "draft" | "submitted" | "graded" | "resubmission_requested"
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface RubricCriterion {
  id: string
  title: string
  description?: string
  maxPoints: number
}

export interface Rubric {
  id: string
  courseId: string
  assignmentId?: string
  projectId?: string
  title: string
  description?: string
  criteria: RubricCriterion[]
  totalMaxPoints: number
  createdAt: Date
  updatedAt: Date
}

export interface RubricScoreItem {
  criterionId: string
  points: number
  comment?: string
}

export interface Grade {
  id: string
  submissionType: "assignment" | "project"
  submissionId: string
  courseId: string
  studentId: string
  instructorId: string
  score: number
  maxScore: number
  rubricScores: RubricScoreItem[]
  feedback?: string
  status: "draft" | "published"
  releasedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface GradeHistoryEntry {
  id: string
  gradeId: string
  changedBy: string
  previousScore: number
  newScore: number
  previousFeedback?: string
  newFeedback?: string
  reason?: string
  createdAt: Date
}

export interface Project {
  id: string
  courseId: string
  title: string
  description: string
  instructions?: string
  maxScore: number
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ProjectArtifactItem {
  name: string
  url: string
  type: string
  sizeBytes?: number
}

export interface ProjectSubmission {
  id: string
  projectId: string
  courseId: string
  userId: string
  title: string
  description?: string
  repositoryUrl?: string
  liveDemoUrl?: string
  artifacts: ProjectArtifactItem[]
  status: "submitted" | "under_review" | "approved" | "changes_requested"
  submittedAt: Date
  createdAt: Date
  updatedAt: Date
}

// ---------------------------------------------------------------------------
// Phase 5 Scheduling, Campus & Attendance Types
// ---------------------------------------------------------------------------

export interface Campus {
  id: string
  name: string
  slug: string
  address: string
  city: string
  state: string
  contactPhone?: string
  contactEmail?: string
  facilities: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Classroom {
  id: string
  campusId: string
  name: string
  roomNumber?: string
  safeCapacity: number
  powerOutletsCount: number
  isActive: boolean
  createdAt: Date
}

export interface Cohort {
  id: string
  programmeId: string
  pathwayId?: string
  code: string
  name: string
  deliveryArrangement: "online" | "hybrid"
  campusId?: string
  defaultClassroomId?: string
  maxCapacity: number
  startDate: Date
  endDate: Date
  status: "upcoming" | "enrolling" | "active" | "completed" | "archived"
  fixedTimetableSummary?: string
  createdAt: Date
  updatedAt: Date
}

export interface ClassSession {
  id: string
  cohortId: string
  courseId?: string
  title: string
  description?: string
  activityType: "live_virtual" | "physical_class" | "physical_practical" | "virtual_workshop"
  deliveryChannel: "online" | "physical" | "simultaneous_hybrid"
  campusId?: string
  classroomId?: string
  instructorId?: string
  sessionDate: Date
  startTime: string
  endTime: string
  meetingUrl?: string
  maxCapacity: number
  bookedSeatsCount: number
  status: "scheduled" | "in_progress" | "completed" | "cancelled" | "rescheduled"
  changeReason?: string
  createdAt: Date
  updatedAt: Date
}

export interface SessionBooking {
  id: string
  sessionId: string
  programmeEnrolmentId: string
  studentId: string
  status: "confirmed" | "cancelled" | "waitlisted"
  bookedAt: Date
}

export interface AttendanceRecord {
  id: string
  sessionId: string
  studentId: string
  programmeEnrolmentId: string
  attendanceStatus: "present" | "absent" | "excused" | "late"
  attendanceChannel: "physical" | "virtual"
  verifiedBy?: string
  verifiedAt: Date
  notes?: string
}

