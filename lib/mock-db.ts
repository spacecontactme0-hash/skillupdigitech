// Mock database with seeded data
import type {
  User,
  PendingRegistration,
  Course,
  Enrollment,
  Payment,
  Certificate,
  Quiz,
  Assignment,
  AdminLog,
  Category,
  LearningNote,
  PaymentEvent,
  OnboardingEvent,
} from "./types"

// Seeded Users
export const mockUsers: User[] = []

// Seeded Courses
export const mockCourses: Course[] = [
  {
    id: "course-1",
    title: "Complete Web Development Bootcamp",
    slug: "complete-web-development-bootcamp",
    description:
      "Master modern web development with HTML, CSS, JavaScript, React, Node.js, and more. Build real-world projects and launch your career as a full-stack developer.",
    category: "The Foundation Pillar",
    level: "Beginner Courses",
    instructorId: "user-3",
    price: {
      NGN: 45000,
      USD: 99,
      EUR: 89,
      GBP: 79,
    },
    thumbnail: "/web-development-course.png",
    published: true,
    approved: true,
    totalDuration: 1200,
    enrollmentCount: 1247,
    rating: 4.8,
    modules: [
      {
        id: "module-1",
        title: "Getting Started",
        order: 1,
        lessons: [
          {
            id: "lesson-1",
            title: "Welcome to the Course",
            type: "video",
            order: 1,
            duration: 10,
            content: {
              videoUrl: "https://example.com/video1",
            },
            isFree: true,
          },
          {
            id: "lesson-2",
            title: "Setting Up Your Development Environment",
            type: "video",
            order: 2,
            duration: 25,
            content: {
              videoUrl: "https://example.com/video2",
            },
            isFree: true,
          },
        ],
      },
      {
        id: "module-2",
        title: "HTML Fundamentals",
        order: 2,
        lessons: [
          {
            id: "lesson-3",
            title: "Introduction to HTML",
            type: "video",
            order: 1,
            duration: 30,
            content: {
              videoUrl: "https://example.com/video3",
            },
            isFree: false,
          },
          {
            id: "lesson-4",
            title: "HTML Elements and Structure",
            type: "article",
            order: 2,
            duration: 15,
            content: {
              articleContent: "HTML content goes here...",
            },
            isFree: false,
          },
          {
            id: "lesson-5",
            title: "HTML Quiz",
            type: "quiz",
            order: 3,
            content: {
              quizId: "quiz-1",
            },
            isFree: false,
          },
        ],
      },
    ],
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "course-2",
    title: "UI/UX Design Masterclass",
    slug: "ui-ux-design-masterclass",
    description:
      "Learn the principles of great design. Master Figma, create stunning interfaces, and build a professional design portfolio.",
    category: "The Clinical Pillar",
    level: "Intermediate Courses",
    instructorId: "user-3",
    price: {
      NGN: 38000,
      USD: 79,
      EUR: 71,
      GBP: 65,
    },
    thumbnail: "/ui-ux-design-course.png",
    published: true,
    approved: true,
    totalDuration: 900,
    enrollmentCount: 892,
    rating: 4.9,
    modules: [
      {
        id: "module-3",
        title: "Design Fundamentals",
        order: 1,
        lessons: [
          {
            id: "lesson-6",
            title: "Introduction to UI/UX",
            type: "video",
            order: 1,
            duration: 20,
            content: {
              videoUrl: "https://example.com/video4",
            },
            isFree: true,
          },
        ],
      },
    ],
    createdAt: new Date("2024-01-12"),
    updatedAt: new Date("2024-01-12"),
  },
  {
    id: "course-3",
    title: "Digital Marketing Strategy",
    slug: "digital-marketing-strategy",
    description:
      "Master SEO, social media marketing, content marketing, and analytics. Grow any business online with proven strategies.",
    category: "The Leadership Pillar",
    level: "Beginner Courses",
    instructorId: "user-3",
    price: {
      NGN: 32000,
      USD: 69,
      EUR: 62,
      GBP: 55,
    },
    thumbnail: "/digital-marketing-course.png",
    published: true,
    approved: true,
    totalDuration: 750,
    enrollmentCount: 654,
    rating: 4.7,
    modules: [],
    createdAt: new Date("2024-01-14"),
    updatedAt: new Date("2024-01-14"),
  },
  {
    id: "course-4",
    title: "Business Analytics with Python",
    slug: "business-analytics-python",
    description:
      "Learn data analysis, visualization, and business intelligence using Python, Pandas, and industry-standard tools.",
    category: "The Family Pillar",
    level: "Intermediate Courses",
    instructorId: "user-3",
    price: {
      NGN: 42000,
      USD: 89,
      EUR: 80,
      GBP: 72,
    },
    thumbnail: "/python-analytics-course.jpg",
    published: true,
    approved: true,
    totalDuration: 1050,
    enrollmentCount: 423,
    rating: 4.6,
    modules: [],
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
  },
]

// Seeded Categories
export const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "The Foundation Pillar",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "cat-2",
    name: "The Clinical Pillar",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "cat-3",
    name: "The Leadership Pillar",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "cat-4",
    name: "The Family Pillar",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
]

// Seeded Enrollments
export const mockEnrollments: Enrollment[] = [
  {
    id: "enrollment-1",
    userId: "user-1",
    courseId: "course-1",
    progress: 45,
    completedLessons: ["lesson-1", "lesson-2", "lesson-3"],
    status: "active",
    currentLesson: "lesson-4",
    enrolledAt: new Date("2024-02-01"),
  },
  {
    id: "enrollment-2",
    userId: "user-1",
    courseId: "course-2",
    progress: 15,
    completedLessons: ["lesson-6"],
    status: "active",
    currentLesson: "lesson-6",
    enrolledAt: new Date("2024-02-15"),
  },
]

// Seeded Payments
export const mockPayments: Payment[] = [
  {
    id: "payment-1",
    userId: "user-1",
    courseId: "course-1",
    courseIds: ["course-1"],
    amount: 99,
    currency: "USD",
    status: "completed",
    reference: "PAY-2024-001",
    paymentMethod: "Paystack",
    createdAt: new Date("2024-02-01"),
    completedAt: new Date("2024-02-01"),
  },
  {
    id: "payment-2",
    userId: "user-1",
    courseId: "course-2",
    courseIds: ["course-2"],
    amount: 79,
    currency: "USD",
    status: "completed",
    reference: "PAY-2024-002",
    paymentMethod: "Paystack",
    createdAt: new Date("2024-02-15"),
    completedAt: new Date("2024-02-15"),
  },
]

// Seeded Certificates
export const mockCertificates: Certificate[] = []

// Seeded Quizzes
export const mockQuizzes: Quiz[] = [
  {
    id: "quiz-1",
    title: "HTML Fundamentals Quiz",
    passingScore: 70,
    timeLimit: 30,
    questions: [
      {
        id: "q1",
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "Home Tool Markup Language",
          "Hyperlinks and Text Markup Language",
          "Hyper Text Making Language",
        ],
        correctAnswer: 0,
        explanation:
          "HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.",
      },
      {
        id: "q2",
        question: "Which HTML element is used for the largest heading?",
        options: ["<heading>", "<h6>", "<h1>", "<head>"],
        correctAnswer: 2,
        explanation: "<h1> is used for the largest/most important heading.",
      },
    ],
  },
]

// Seeded Assignments
export const mockAssignments: Assignment[] = [
  {
    id: "assignment-1",
    title: "Build a Personal Portfolio Website",
    description:
      "Create a responsive portfolio website using HTML and CSS. Include an about section, projects, and contact form.",
    maxScore: 100,
  },
]

// Mock Database Class
class MockDatabase {
  users: User[] = [...mockUsers]
  pendingRegistrations: PendingRegistration[] = []
  categories: Category[] = [...mockCategories]
  courses: Course[] = [...mockCourses]
  enrollments: Enrollment[] = [...mockEnrollments]
  payments: Payment[] = [...mockPayments]
  certificates: Certificate[] = [...mockCertificates]
  quizzes: Quiz[] = [...mockQuizzes]
  assignments: Assignment[] = [...mockAssignments]
  adminLogs: AdminLog[] = []
  notes: LearningNote[] = []
  paymentEvents: PaymentEvent[] = []
  onboardingEvents: OnboardingEvent[] = []

  // User methods
  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email === email)
  }

  async findUserById(id: string): Promise<User | undefined> {
    return this.users.find((u) => u.id === id)
  }

  async getAllUsers(): Promise<User[]> {
    return this.users
  }

  async getCategories(): Promise<Category[]> {
    return this.categories
  }

  async createCategory(name: string): Promise<Category> {
    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.categories.push(newCategory)
    return newCategory
  }

  async updateCategory(id: string, name: string): Promise<Category | undefined> {
    const idx = this.categories.findIndex((c) => c.id === id)
    if (idx === -1) return undefined
    this.categories[idx] = { ...this.categories[idx], name, updatedAt: new Date() }
    return this.categories[idx]
  }

  async deleteCategory(id: string): Promise<boolean> {
    const idx = this.categories.findIndex((c) => c.id === id)
    if (idx === -1) return false
    this.categories.splice(idx, 1)
    return true
  }

  async createAdminLog(log: Omit<AdminLog, "id" | "createdAt">): Promise<AdminLog> {
    const newLog: AdminLog = {
      ...log,
      id: `admin-log-${Date.now()}`,
      createdAt: new Date(),
    }
    this.adminLogs.unshift(newLog)
    return newLog
  }

  async getAdminLogs(limit = 50): Promise<AdminLog[]> {
    return this.adminLogs.slice(0, limit)
  }

  async createUser(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    const newUser: User = {
      ...user,
      id: `user-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.users.push(newUser)
    return newUser
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const userIndex = this.users.findIndex((u) => u.id === id)
    if (userIndex === -1) return undefined

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date(),
    }
    return this.users[userIndex]
  }

  async deleteUser(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex((u) => u.id === id)
    if (userIndex === -1) return false
    this.users.splice(userIndex, 1)
    return true
  }

  async findPendingRegistrationByEmail(email: string): Promise<PendingRegistration | undefined> {
    return this.pendingRegistrations.find((item) => item.email === email)
  }

  async findPendingRegistrationById(id: string): Promise<PendingRegistration | undefined> {
    return this.pendingRegistrations.find((item) => item.id === id)
  }

  async createPendingRegistration(
    registration: Omit<PendingRegistration, "id" | "createdAt" | "updatedAt">
  ): Promise<PendingRegistration> {
    const newRegistration: PendingRegistration = {
      ...registration,
      id: `pending-registration-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.pendingRegistrations.push(newRegistration)
    return newRegistration
  }

  async updatePendingRegistration(
    id: string,
    updates: Partial<PendingRegistration>
  ): Promise<PendingRegistration | undefined> {
    const index = this.pendingRegistrations.findIndex((item) => item.id === id)
    if (index === -1) return undefined
    this.pendingRegistrations[index] = {
      ...this.pendingRegistrations[index],
      ...updates,
      updatedAt: new Date(),
    }
    return this.pendingRegistrations[index]
  }

  async deletePendingRegistration(id: string): Promise<boolean> {
    const index = this.pendingRegistrations.findIndex((item) => item.id === id)
    if (index === -1) return false
    this.pendingRegistrations.splice(index, 1)
    return true
  }

  async getExpiredPendingRegistrations(cutoff: Date): Promise<PendingRegistration[]> {
    return this.pendingRegistrations
      .filter((item) => new Date(item.otpExpiresAt).getTime() <= cutoff.getTime())
      .sort((a, b) => new Date(a.otpExpiresAt).getTime() - new Date(b.otpExpiresAt).getTime())
  }

  // Course methods
  async getAllCourses(): Promise<Course[]> {
    return this.courses.filter((c) => c.approved === true)
  }

  async getAllCoursesIncludingDrafts(): Promise<Course[]> {
    return this.courses
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    return this.courses.find((c) => c.id === id)
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    return this.courses.find((c) => c.slug === slug)
  }

  async createCourse(course: Omit<Course, "id" | "createdAt" | "updatedAt">): Promise<Course> {
    const newCourse: Course = {
      ...course,
      id: `course-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.courses.push(newCourse)
    return newCourse
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined> {
    const courseIndex = this.courses.findIndex((c) => c.id === id)
    if (courseIndex === -1) return undefined

    this.courses[courseIndex] = {
      ...this.courses[courseIndex],
      ...updates,
      updatedAt: new Date(),
    }
    return this.courses[courseIndex]
  }

  async deleteCourse(id: string): Promise<boolean> {
    const idx = this.courses.findIndex((c) => c.id === id)
    if (idx === -1) return false
    this.courses.splice(idx, 1)
    return true
  }

  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    return this.courses.filter((c) => c.instructorId === instructorId)
  }

  // Enrollment methods
  async getEnrollmentsByUserId(userId: string): Promise<Enrollment[]> {
    return this.enrollments.filter((e) => e.userId === userId)
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    return this.enrollments.find((e) => e.userId === userId && e.courseId === courseId)
  }

  async getEnrollmentById(id: string): Promise<Enrollment | undefined> {
    return this.enrollments.find((e) => e.id === id)
  }

  async getAllEnrollments(): Promise<Enrollment[]> {
    return this.enrollments
  }

  async createEnrollment(enrollment: Omit<Enrollment, "id">): Promise<Enrollment> {
    const existing = this.enrollments.find(
      (item) => item.userId === enrollment.userId && item.courseId === enrollment.courseId,
    )
    if (existing) return existing

    const newEnrollment: Enrollment = {
      ...enrollment,
      id: `enrollment-${Date.now()}`,
    }
    this.enrollments.push(newEnrollment)
    return newEnrollment
  }

  async updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const enrollmentIndex = this.enrollments.findIndex((e) => e.id === id)
    if (enrollmentIndex === -1) return undefined

    this.enrollments[enrollmentIndex] = {
      ...this.enrollments[enrollmentIndex],
      ...updates,
    }
    return this.enrollments[enrollmentIndex]
  }

  // Payment methods
  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    return this.payments.filter((p) => p.userId === userId)
  }

  async getAllPayments(): Promise<Payment[]> {
    return this.payments
  }

  async getPaymentByReference(reference: string): Promise<Payment | undefined> {
    return this.payments.find((p) => p.reference === reference)
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    return this.payments.find((p) => p.id === id)
  }

  async updatePaymentByReference(reference: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const paymentIndex = this.payments.findIndex((p) => p.reference === reference)
    if (paymentIndex === -1) return undefined
    this.payments[paymentIndex] = {
      ...this.payments[paymentIndex],
      ...updates,
    }
    return this.payments[paymentIndex]
  }

  async createPayment(payment: Omit<Payment, "id">): Promise<Payment> {
    const duplicate = this.payments.find((item) => item.reference === payment.reference)
    if (duplicate) return duplicate

    const newPayment: Payment = {
      ...payment,
      id: `payment-${Date.now()}`,
    }
    this.payments.push(newPayment)
    return newPayment
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const paymentIndex = this.payments.findIndex((p) => p.id === id)
    if (paymentIndex === -1) return undefined

    this.payments[paymentIndex] = {
      ...this.payments[paymentIndex],
      ...updates,
    }
    return this.payments[paymentIndex]
  }

  async getStalePayments(params: { statuses: string[]; cutoff: Date; limit: number }): Promise<Payment[]> {
    return this.payments
      .filter((payment) => params.statuses.includes(payment.status))
      .filter((payment) => new Date(payment.createdAt).getTime() <= params.cutoff.getTime())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, params.limit)
  }

  async acquirePaymentVerificationLock(reference: string, maxAttempts = 5): Promise<Payment | undefined> {
    const payment = this.payments.find((item) => item.reference === reference)
    if (!payment) return undefined
    if (!["pending", "processing"].includes(payment.status)) return undefined
    if ((payment.verificationAttempts || 0) >= maxAttempts) return undefined

    const now = new Date()
    const lockExpiry = payment.verificationLockExpiresAt ? new Date(payment.verificationLockExpiresAt) : undefined
    const lockExpired = lockExpiry ? lockExpiry.getTime() <= now.getTime() : true
    if (payment.verificationLocked && !lockExpired) return undefined

    payment.verificationLocked = true
    payment.verificationAttempts = (payment.verificationAttempts || 0) + 1
    payment.lastVerificationAt = now
    payment.verificationLockToken = `lock-${Date.now()}`
    payment.verificationLockExpiresAt = new Date(now.getTime() + 2 * 60 * 1000)
    payment.status = "processing"
    return payment
  }

  async releasePaymentVerificationLock(reference: string): Promise<Payment | undefined> {
    const payment = this.payments.find((item) => item.reference === reference)
    if (!payment) return undefined
    payment.verificationLocked = false
    delete payment.verificationLockToken
    delete payment.verificationLockExpiresAt
    return payment
  }

  async createPaymentEvent(event: Omit<PaymentEvent, "id" | "createdAt">): Promise<PaymentEvent> {
    const newEvent: PaymentEvent = {
      ...event,
      id: `payment-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(),
    }
    this.paymentEvents.unshift(newEvent)
    return newEvent
  }

  async createOnboardingEvent(event: Omit<OnboardingEvent, "id" | "createdAt">): Promise<OnboardingEvent> {
    const newEvent: OnboardingEvent = {
      ...event,
      id: `onboarding-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(),
    }
    this.onboardingEvents.unshift(newEvent)
    return newEvent
  }

  async getOnboardingEvents(limit = 500): Promise<OnboardingEvent[]> {
    return this.onboardingEvents.slice(0, limit)
  }

  // Certificate methods
  async getCertificatesByUserId(userId: string): Promise<Certificate[]> {
    return this.certificates.filter((c) => c.userId === userId)
  }

  async createCertificate(certificate: Omit<Certificate, "id">): Promise<Certificate> {
    const newCertificate: Certificate = {
      ...certificate,
      id: `certificate-${Date.now()}`,
    }
    this.certificates.push(newCertificate)
    return newCertificate
  }

  // Quiz methods
  async getQuizById(id: string): Promise<Quiz | undefined> {
    return this.quizzes.find((q) => q.id === id)
  }

  // Assignment methods
  async getAssignmentById(id: string): Promise<Assignment | undefined> {
    return this.assignments.find((a) => a.id === id)
  }

  // Learning note methods
  async getNotesByUserId(userId: string): Promise<LearningNote[]> {
    return this.notes
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  async createNote(note: Omit<LearningNote, "id" | "createdAt" | "updatedAt">): Promise<LearningNote> {
    const newNote: LearningNote = {
      ...note,
      id: `note-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.notes.unshift(newNote)
    return newNote
  }

  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    const idx = this.notes.findIndex((n) => n.id === noteId && n.userId === userId)
    if (idx === -1) return false
    this.notes.splice(idx, 1)
    return true
  }
}

// In-memory mock database singleton
let dbInstance: MockDatabase | null = null

export function getDB(): MockDatabase {
  if (!dbInstance) {
    dbInstance = new MockDatabase()
  }
  return dbInstance
}

export const db = getDB()
export const mockDB = db







