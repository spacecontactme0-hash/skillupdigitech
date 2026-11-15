// Core type definitions for the SkillUp platform

export type UserRole = "student" | "instructor" | "admin" | "finance"
export type StudentGender = "male" | "female" | "other" | "prefer_not_to_say"
export type TrainingLocation = "enugu" | "abuja"

export type StudentMilestoneKey =
  | "student_activated"
  | "welcome_aboard"
  | "profile_starter"
  | "profile_complete"
  | "first_dashboard_visit"
  | "onsite_interested"
  | "onsite_learner"
  | "first_enrollment"
  | "course_finisher"
  | "identity_confirmed"
  | "course_explorer"
  | "lesson_starter"
  | "steady_learner"
  | "focused_learner"
  | "learning_streak"
  | "note_taker"
  | "progress_builder"
  | "halfway_there"
  | "almost_done"
  | "certified_learner"

export type StudentMilestoneCategory =
  | "onboarding"
  | "profile"
  | "learning"
  | "onsite"
  | "completion"
  | "consistency"
  | "progress"

export interface StudentMilestone {
  key: StudentMilestoneKey
  title: string
  description?: string
  category?: StudentMilestoneCategory
  unlockedAt: Date
}

export interface InstructorProfile {
  phoneNumber: string
  professionalHeadline: string
  specialties: string[]
  yearsOfExperience: number
}

export interface StudentRegistrationProfile {
  trainingMode: "onsite" | "online"
  formTitle: string
  phoneNumber: string
  whatsappNumber: string
  gender: StudentGender
  dateOfBirth: string
  currentAddress: string
  isHealthcareProfessional: boolean
  currentRoleOrField: string
  preferredLocation: TrainingLocation
  preferredLocationStartDate: string
  trainingInterest: string
  registrationFeeNgn: number
  paymentStatus: "yes" | "no"
  paymentReference?: string
  paymentLink: string
  agreedSlotSecured: boolean
  agreedDetailsCorrect: boolean
  submittedAt: Date
}

export interface UserOnboardingState {
  welcomeSeenAt?: Date
  dismissedOnsiteBannerAt?: Date
  viewedOnsiteTrainingAt?: Date
  startedOnsiteCheckoutAt?: Date
  dashboardVisitedAt?: Date
  profileSetupStartedAt?: Date
  reviewedPublishingGuidelinesAt?: Date
  updatedAt?: Date
}

export interface User {
  id: string
  email: string
  password: string // In production, this would be hashed
  name: string
  role: UserRole
  avatar?: string
  bio?: string
  status?: "active" | "suspended"
  emailVerified?: boolean
  onboardingState?: UserOnboardingState
  studentMilestones?: StudentMilestone[]
  otpHash?: string
  otpExpiresAt?: Date
  studentProfile?: StudentRegistrationProfile
  instructorProfile?: InstructorProfile
  enrolledCourses: string[] // Course IDs
  createdAt: Date
  updatedAt: Date
}

export interface PendingRegistration {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  avatar?: string
  bio?: string
  otpHash: string
  otpExpiresAt: Date
  studentProfile?: StudentRegistrationProfile
  instructorProfile?: InstructorProfile
  createdAt: Date
  updatedAt: Date
}

export type CourseCategory = string

export type CourseLevel = "Beginner Courses" | "Intermediate Courses" | "Pro Courses"

export interface Category {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Course {
  id: string
  code?: string
  isFoundationCourse?: boolean
  title: string
  slug: string
  description: string
  overview?: string[]
  category: CourseCategory
  level: CourseLevel
  instructorId: string
  instructorName?: string
  instructorAvatar?: string
  instructorBio?: string
  instructorHeadline?: string
  instructorYearsOfExperience?: number
  instructorSpecialties?: string[]
  price: {
    NGN: number
    USD: number
    EUR: number
    GBP: number
  }
  thumbnail: string
  published: boolean
  approved: boolean
  modules: CourseModule[]
  totalDuration: number // in minutes
  enrollmentCount: number
  rating: number
  createdAt: Date
  updatedAt: Date
}

export interface CourseModule {
  id: string
  title: string
  order: number
  lessons: Lesson[]
}

export type LessonType = "video" | "article" | "quiz" | "assignment"

export interface LessonAssignmentResource {
  title: string
  url: string
}

export interface LessonAssignmentDetails {
  title: string
  instructions: string
  dueDate?: string
  maxScore: number
  submissionType: "text" | "file" | "link"
  attachTo: "lesson" | "video"
  estimatedMinutes?: number
  resources?: LessonAssignmentResource[]
}

export interface Lesson {
  id: string
  title: string
  type: LessonType
  order: number
  duration?: number // in minutes
  content: {
    videoUrl?: string
    // Optional server-side note when a lesson is rejected
    rejectionNote?: string
    articleContent?: string
    quizId?: string
    assignmentId?: string
    assignment?: LessonAssignmentDetails
    resources?: LessonAssignmentResource[]
    moderationCount?: number
    lastModeratedAt?: string
    revisionId?: string
  }
  isFree: boolean
  // Approval workflow for individual lessons
  approved?: boolean
  pendingApproval?: boolean
}

export interface Quiz {
  id: string
  title: string
  questions: QuizQuestion[]
  passingScore: number
  timeLimit?: number // in minutes
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface Assignment {
  id: string
  title: string
  description: string
  dueDate?: Date
  maxScore: number
}

export interface Enrollment {
  id: string
  userId: string
  courseId: string
  progress: number // 0-100
  completedLessons: string[] // Lesson IDs
  status: "active" | "completed" | "expired"
  currentLesson?: string // Lesson ID
  enrolledAt: Date
  completedAt?: Date
}

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "expired"
  | "manual_review"
  | "success"
export type Currency = "NGN" | "USD" | "EUR" | "GBP"
export type PaymentType = "course_purchase" | "onsite_registration"
export type PaymentReviewSource = "verify" | "webhook" | "reconcile" | "admin"

export interface Payment {
  id: string
  userId: string
  paymentType?: PaymentType
  courseId: string
  courseIds?: string[]
  invoiceNumber?: string
  amount: number
  currency: Currency
  status: PaymentStatus
  reference: string
  paymentMethod: string
  transactionId?: string
  gatewayStatus?: string
  gatewayMessage?: string
  gatewayChannel?: string
  gatewayFee?: number
  customerEmail?: string
  customerCode?: string
  verificationAttempts?: number
  verificationLocked?: boolean
  verificationLockToken?: string
  verificationLockExpiresAt?: Date
  lastVerificationAt?: Date
  manualReviewReason?: string
  manualReviewSource?: PaymentReviewSource
  manualReviewCreatedAt?: Date
  manualReviewUpdatedAt?: Date
  fraudFlagged?: boolean
  fraudReason?: string
  fraudFlaggedAt?: Date
  fraudFlaggedBy?: string
  reviewedBy?: string
  reviewedAt?: Date
  reviewNote?: string
  paidAt?: Date
  refundReason?: string
  refundedBy?: string
  refundedAt?: Date
  createdAt: Date
  completedAt?: Date
}

export type PaymentEventType = "initialize" | "webhook" | "verify" | "reconcile" | "manual_review"

export interface PaymentEvent {
  id: string
  reference: string
  paymentId?: string
  type: PaymentEventType
  source: string
  status?: string
  message?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface OnboardingEvent {
  id: string
  name: string
  role?: UserRole
  mode?: string
  source?: string
  step?: string
  stepIndex?: number
  status?: string
  reference?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface Certificate {
  id: string
  userId: string
  courseId: string
  certificateUrl: string
  issuedAt: Date
  verificationCode: string
}

export interface CartItem {
  courseId: string
  course: Course
}

export interface AdminLog {
  id: string
  actorId: string
  actorName: string
  actorEmail: string
  action: "create_user" | "update_password" | "other"
  targetUserId?: string
  targetName?: string
  targetEmail?: string
  targetRole?: UserRole
  createdAt: Date
}

export interface LearningNote {
  id: string
  userId: string
  content: string
  courseId?: string
  createdAt: Date
  updatedAt: Date
}













export * from './academic-types'

