import { getAcademicDb } from "./academic-db"
import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { getDrizzleDb, getPool } from "@/db/client"
import * as schema from "@/db/schema"
import type {
  AdminLog,
  Assignment,
  Category,
  Certificate,
  Course,
  CourseModule,
  Enrollment,
  LearningNote,
  Lesson,
  OnboardingEvent,
  Payment,
  PaymentEvent,
  PendingRegistration,
  Quiz,
  User,
} from "./types"

// Helper to convert PostgreSQL user row to User type
function toUser(row: typeof schema.users.$inferSelect): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role as User["role"],
    avatar: row.avatar ?? undefined,
    bio: row.bio ?? undefined,
    status: (row.status as User["status"]) ?? "active",
    emailVerified: row.emailVerified ?? false,
    otpHash: row.otpHash ?? undefined,
    otpExpiresAt: row.otpExpiresAt ?? undefined,
    studentProfile: (row.studentProfile as User["studentProfile"]) ?? undefined,
    instructorProfile: (row.instructorProfile as User["instructorProfile"]) ?? undefined,
    enrolledCourses: (row.enrolledCourses as string[]) ?? [],
    onboardingState: (row.legacyPayload as any)?.onboardingState ?? undefined,
    studentMilestones: (row.legacyPayload as any)?.studentMilestones ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// Helper to convert PostgreSQL pending registration row to PendingRegistration type
function toPendingRegistration(row: typeof schema.pendingRegistrations.$inferSelect): PendingRegistration {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    name: row.name,
    role: row.role as PendingRegistration["role"],
    avatar: row.avatar ?? undefined,
    bio: row.bio ?? undefined,
    otpHash: row.otpHash,
    otpExpiresAt: row.otpExpiresAt,
    studentProfile: (row.studentProfile as PendingRegistration["studentProfile"]) ?? undefined,
    instructorProfile: (row.instructorProfile as PendingRegistration["instructorProfile"]) ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// Helper to convert PostgreSQL category row to Category type
function toCategory(row: typeof schema.categories.$inferSelect): Category {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// Helper to convert PostgreSQL enrollment row to Enrollment type
function toEnrollment(row: typeof schema.enrollments.$inferSelect): Enrollment {
  return {
    id: row.id,
    userId: row.userId,
    courseId: row.courseId,
    progress: row.progress,
    completedLessons: (row.completedLessons as string[]) ?? [],
    status: row.status as Enrollment["status"],
    currentLesson: row.currentLesson ?? undefined,
    enrolledAt: row.enrolledAt,
    completedAt: row.completedAt ?? undefined,
  }
}

// Helper to convert PostgreSQL payment row to Payment type
function toPayment(row: typeof schema.payments.$inferSelect): Payment {
  const metadata = (row.paystackMetadata as Record<string, any>) ?? {}
  const legacy = (row.legacyPayload as Record<string, any>) ?? {}
  return {
    id: row.id,
    userId: row.userId,
    courseId: row.courseId ?? "",
    courseIds: (row.courseIds as string[]) ?? (row.courseId ? [row.courseId] : []),
    paymentType: row.paymentType as Payment["paymentType"],
    amount: row.amount,
    currency: (row.currency as Payment["currency"]) ?? "NGN",
    status: row.status as Payment["status"],
    reference: row.reference,
    paymentMethod: row.method ?? "card",
    verificationLocked: row.verificationLock ?? false,
    verificationLockToken: legacy.verificationLockToken ?? undefined,
    verificationLockExpiresAt: row.verificationLockExpiresAt ?? undefined,
    verificationAttempts: legacy.verificationAttempts ?? undefined,
    lastVerificationAt: legacy.lastVerificationAt ? new Date(legacy.lastVerificationAt) : undefined,
    customerEmail: legacy.customerEmail ?? undefined,
    gatewayStatus: legacy.gatewayStatus ?? undefined,
    gatewayMessage: legacy.gatewayMessage ?? undefined,
    paidAt: legacy.paidAt ? new Date(legacy.paidAt) : undefined,
    createdAt: row.createdAt,
  }
}

// Helper to convert PostgreSQL certificate row to Certificate type
function toCertificate(row: typeof schema.certificates.$inferSelect): Certificate {
  return {
    id: row.id,
    userId: row.userId,
    courseId: row.courseId,
    certificateUrl: row.certificateUrl ?? "",
    verificationCode: row.verificationCode ?? "",
    issuedAt: row.issuedAt,
  }
}

// Helper to convert PostgreSQL admin log row to AdminLog type
function toAdminLog(row: typeof schema.adminLogs.$inferSelect): AdminLog {
  const details = (row.details as Record<string, any>) ?? {}
  const action = (row.action === "create_user" || row.action === "update_password" ? row.action : "other") as AdminLog["action"]
  return {
    id: row.id,
    actorId: row.actorId ?? "",
    actorName: details.actorName ?? "",
    actorEmail: details.actorEmail ?? "",
    action,
    targetUserId: details.targetUserId ?? undefined,
    targetName: details.targetName ?? undefined,
    targetEmail: details.targetEmail ?? undefined,
    targetRole: details.targetRole ?? undefined,
    createdAt: row.createdAt,
  }
}

// Helper to convert PostgreSQL onboarding event row to OnboardingEvent type
function toOnboardingEvent(row: typeof schema.onboardingEvents.$inferSelect): OnboardingEvent {
  const data = (row.data as Record<string, any>) ?? {}
  return {
    id: row.id,
    name: row.event,
    role: data.role ?? undefined,
    mode: data.mode ?? "self-paced",
    source: data.source ?? "",
    step: data.step ?? "",
    stepIndex: data.stepIndex ?? 0,
    status: data.status ?? "viewed",
    reference: data.reference ?? undefined,
    metadata: data.metadata ?? undefined,
    createdAt: row.createdAt,
  }
}

// Helper to convert PostgreSQL learning note row to LearningNote type
function toLearningNote(row: typeof schema.learningNotes.$inferSelect): LearningNote {
  return {
    id: row.id,
    userId: row.userId,
    courseId: row.courseId ?? undefined,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class PostgresDatabase {
  private db() {
    return getDrizzleDb()
  }

  // ==========================================
  // User Operations
  // ==========================================

  async findUserByEmail(email: string): Promise<User | undefined> {
    const normalized = email?.trim().toLowerCase()
    if (!normalized) return undefined
    const [row] = await this.db()
      .select()
      .from(schema.users)
      .where(sql`LOWER(${schema.users.email}) = ${normalized}`)
      .limit(1)
    return row ? toUser(row) : undefined
  }

  async findUserById(id: string): Promise<User | undefined> {
    if (!id) return undefined
    const [row] = await this.db()
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1)
    return row ? toUser(row) : undefined
  }

  async createUser(user: Omit<User, "id" | "createdAt" | "updatedAt"> | (Omit<User, "createdAt" | "updatedAt"> & { id?: string })): Promise<User> {
    const id = (user as any).id || randomUUID()
    const now = new Date()
    const legacyPayload: Record<string, any> = {}
    if (user.onboardingState) legacyPayload.onboardingState = user.onboardingState
    if (user.studentMilestones) legacyPayload.studentMilestones = user.studentMilestones

    const [row] = await this.db()
      .insert(schema.users)
      .values({
        id,
        email: user.email.trim().toLowerCase(),
        password: user.password,
        name: user.name,
        role: user.role,
        avatar: user.avatar ?? null,
        bio: user.bio ?? null,
        status: user.status ?? "active",
        emailVerified: user.emailVerified ?? false,
        otpHash: user.otpHash ?? null,
        otpExpiresAt: user.otpExpiresAt ?? null,
        studentProfile: user.studentProfile ?? null,
        instructorProfile: user.instructorProfile ?? null,
        enrolledCourses: user.enrolledCourses ?? [],
        legacyPayload: Object.keys(legacyPayload).length ? legacyPayload : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return toUser(row)
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const existing = await this.findUserById(id)
    if (!existing) return undefined

    const patch: Partial<typeof schema.users.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (updates.email !== undefined) patch.email = updates.email.trim().toLowerCase()
    if (updates.password !== undefined) patch.password = updates.password
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.role !== undefined) patch.role = updates.role
    if (updates.avatar !== undefined) patch.avatar = updates.avatar
    if (updates.bio !== undefined) patch.bio = updates.bio
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.emailVerified !== undefined) patch.emailVerified = updates.emailVerified
    if (updates.otpHash !== undefined) patch.otpHash = updates.otpHash
    if (updates.otpExpiresAt !== undefined) patch.otpExpiresAt = updates.otpExpiresAt
    if (updates.studentProfile !== undefined) patch.studentProfile = updates.studentProfile
    if (updates.instructorProfile !== undefined) patch.instructorProfile = updates.instructorProfile
    if (updates.enrolledCourses !== undefined) patch.enrolledCourses = updates.enrolledCourses

    if (updates.onboardingState !== undefined || updates.studentMilestones !== undefined) {
      const [currentRow] = await this.db()
        .select({ legacyPayload: schema.users.legacyPayload })
        .from(schema.users)
        .where(eq(schema.users.id, id))
      const currentPayload = (currentRow?.legacyPayload as Record<string, any>) ?? {}
      if (updates.onboardingState !== undefined) currentPayload.onboardingState = updates.onboardingState
      if (updates.studentMilestones !== undefined) currentPayload.studentMilestones = updates.studentMilestones
      patch.legacyPayload = currentPayload
    }

    const [row] = await this.db()
      .update(schema.users)
      .set(patch)
      .where(eq(schema.users.id, id))
      .returning()

    return row ? toUser(row) : undefined
  }

  async getAllUsers(): Promise<User[]> {
    const rows = await this.db().select().from(schema.users).orderBy(desc(schema.users.createdAt))
    return rows.map(toUser)
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db().delete(schema.users).where(eq(schema.users.id, id)).returning({ id: schema.users.id })
    return result.length > 0
  }

  // ==========================================
  // Pending Registrations
  // ==========================================

  async findPendingRegistrationByEmail(email: string): Promise<PendingRegistration | undefined> {
    const normalized = email?.trim().toLowerCase()
    if (!normalized) return undefined
    const [row] = await this.db()
      .select()
      .from(schema.pendingRegistrations)
      .where(sql`LOWER(${schema.pendingRegistrations.email}) = ${normalized}`)
      .limit(1)
    return row ? toPendingRegistration(row) : undefined
  }

  async findPendingRegistrationById(id: string): Promise<PendingRegistration | undefined> {
    if (!id) return undefined
    const [row] = await this.db()
      .select()
      .from(schema.pendingRegistrations)
      .where(eq(schema.pendingRegistrations.id, id))
      .limit(1)
    return row ? toPendingRegistration(row) : undefined
  }

  async createPendingRegistration(
    registration: Omit<PendingRegistration, "id" | "createdAt" | "updatedAt"> | (Omit<PendingRegistration, "createdAt" | "updatedAt"> & { id?: string }),
  ): Promise<PendingRegistration> {
    const id = (registration as any).id || randomUUID()
    const now = new Date()
    const [row] = await this.db()
      .insert(schema.pendingRegistrations)
      .values({
        id,
        email: registration.email.trim().toLowerCase(),
        password: registration.password,
        name: registration.name,
        role: registration.role,
        avatar: registration.avatar ?? null,
        bio: registration.bio ?? null,
        otpHash: registration.otpHash,
        otpExpiresAt: registration.otpExpiresAt,
        studentProfile: registration.studentProfile ?? null,
        instructorProfile: registration.instructorProfile ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return toPendingRegistration(row)
  }

  async updatePendingRegistration(
    id: string,
    updates: Partial<PendingRegistration>,
  ): Promise<PendingRegistration | undefined> {
    const patch: Partial<typeof schema.pendingRegistrations.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (updates.email !== undefined) patch.email = updates.email.trim().toLowerCase()
    if (updates.password !== undefined) patch.password = updates.password
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.role !== undefined) patch.role = updates.role
    if (updates.avatar !== undefined) patch.avatar = updates.avatar
    if (updates.bio !== undefined) patch.bio = updates.bio
    if (updates.otpHash !== undefined) patch.otpHash = updates.otpHash
    if (updates.otpExpiresAt !== undefined) patch.otpExpiresAt = updates.otpExpiresAt
    if (updates.studentProfile !== undefined) patch.studentProfile = updates.studentProfile
    if (updates.instructorProfile !== undefined) patch.instructorProfile = updates.instructorProfile

    const [row] = await this.db()
      .update(schema.pendingRegistrations)
      .set(patch)
      .where(eq(schema.pendingRegistrations.id, id))
      .returning()

    return row ? toPendingRegistration(row) : undefined
  }

  async deletePendingRegistration(idOrEmail: string): Promise<boolean> {
    const normalized = idOrEmail?.trim().toLowerCase()
    const result = await this.db()
      .delete(schema.pendingRegistrations)
      .where(
        sql`${schema.pendingRegistrations.id} = ${idOrEmail} OR LOWER(${schema.pendingRegistrations.email}) = ${normalized}`,
      )
      .returning({ id: schema.pendingRegistrations.id })
    return result.length > 0
  }

  async getExpiredPendingRegistrations(cutoff: Date): Promise<PendingRegistration[]> {
    const rows = await this.db()
      .select()
      .from(schema.pendingRegistrations)
      .where(lte(schema.pendingRegistrations.otpExpiresAt, cutoff))
      .orderBy(asc(schema.pendingRegistrations.otpExpiresAt))
    return rows.map(toPendingRegistration)
  }

  // ==========================================
  // Categories
  // ==========================================

  async getCategories(): Promise<Category[]> {
    const rows = await this.db()
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.name))
    return rows.map(toCategory)
  }

  async createCategory(categoryOrName: string | { id?: string; name: string }): Promise<Category> {
    const name = typeof categoryOrName === "string" ? categoryOrName : categoryOrName.name
    const id = (typeof categoryOrName === "object" && categoryOrName.id) || randomUUID()
    const now = new Date()
    const [row] = await this.db()
      .insert(schema.categories)
      .values({
        id,
        name,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return toCategory(row)
  }

  async updateCategory(id: string, name: string): Promise<Category | undefined> {
    const [row] = await this.db()
      .update(schema.categories)
      .set({ name, updatedAt: new Date() })
      .where(eq(schema.categories.id, id))
      .returning()
    return row ? toCategory(row) : undefined
  }

  async deleteCategory(id: string): Promise<boolean> {
    const rows = await this.db()
      .delete(schema.categories)
      .where(eq(schema.categories.id, id))
      .returning()
    return rows.length > 0
  }

  // ==========================================
  // Courses, Modules, and Lessons
  // ==========================================

  private async attachModulesToCourses(courseRows: (typeof schema.courses.$inferSelect)[]): Promise<Course[]> {
    if (courseRows.length === 0) return []
    const courseIds = courseRows.map((c) => c.id)

    const moduleRows = await this.db()
      .select()
      .from(schema.courseModules)
      .where(inArray(schema.courseModules.courseId, courseIds))
      .orderBy(asc(schema.courseModules.order))

    const lessonRows = await this.db()
      .select()
      .from(schema.lessons)
      .where(inArray(schema.lessons.courseId, courseIds))
      .orderBy(asc(schema.lessons.order))

    const lessonsByModule = new Map<string, Lesson[]>()
    for (const l of lessonRows) {
      if (!l.moduleId) continue
      const list = lessonsByModule.get(l.moduleId) ?? []
      list.push({
        id: l.id,
        title: l.title,
        type: l.type as Lesson["type"],
        order: l.order,
        duration: l.duration ?? undefined,
        content: (l.content as Lesson["content"]) ?? {},
        isFree: l.isFree,
        approved: l.approved ?? undefined,
        pendingApproval: l.pendingApproval ?? undefined,
      })
      lessonsByModule.set(l.moduleId, list)
    }

    const modulesByCourse = new Map<string, CourseModule[]>()
    for (const m of moduleRows) {
      const list = modulesByCourse.get(m.courseId) ?? []
      list.push({
        id: m.id,
        title: m.title,
        order: m.order,
        lessons: lessonsByModule.get(m.id) ?? [],
      })
      modulesByCourse.set(m.courseId, list)
    }

    return courseRows.map((c) => ({
      id: c.id,
      code: c.code ?? undefined,
      isFoundationCourse: c.isFoundationCourse ?? false,
      title: c.title,
      slug: c.slug,
      description: c.description,
      overview: (c.overview as string[]) ?? [],
      category: c.category,
      level: c.level as Course["level"],
      instructorId: c.instructorId,
      instructorName: c.instructorName ?? undefined,
      instructorAvatar: c.instructorAvatar ?? undefined,
      instructorBio: c.instructorBio ?? undefined,
      instructorHeadline: c.instructorHeadline ?? undefined,
      instructorYearsOfExperience: c.instructorYearsOfExperience ?? undefined,
      instructorSpecialties: (c.instructorSpecialties as string[]) ?? undefined,
      price: {
        NGN: c.priceNgn,
        USD: c.priceUsd,
        EUR: c.priceEur,
        GBP: c.priceGbp,
      },
      thumbnail: c.thumbnail,
      published: c.published,
      approved: c.approved,
      modules: modulesByCourse.get(c.id) ?? [],
      totalDuration: c.totalDuration,
      enrollmentCount: c.enrollmentCount,
      rating: c.rating,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }))
  }

  async getAllCourses(): Promise<Course[]> {
    const rows = await this.db()
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.approved, true))
      .orderBy(desc(schema.courses.createdAt))
    return this.attachModulesToCourses(rows)
  }

  async getAllCoursesIncludingDrafts(): Promise<Course[]> {
    const rows = await this.db().select().from(schema.courses).orderBy(desc(schema.courses.createdAt))
    return this.attachModulesToCourses(rows)
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    if (!id) return undefined
    const rows = await this.db().select().from(schema.courses).where(eq(schema.courses.id, id)).limit(1)
    if (rows.length === 0) return undefined
    const [course] = await this.attachModulesToCourses(rows)
    return course
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    if (!slug) return undefined
    const rows = await this.db().select().from(schema.courses).where(eq(schema.courses.slug, slug)).limit(1)
    if (rows.length === 0) return undefined
    const [course] = await this.attachModulesToCourses(rows)
    return course
  }

  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    const rows = await this.db()
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.instructorId, instructorId))
      .orderBy(desc(schema.courses.createdAt))
    return this.attachModulesToCourses(rows)
  }

  async createCourse(course: Omit<Course, "id" | "createdAt" | "updatedAt"> | (Omit<Course, "createdAt" | "updatedAt"> & { id?: string })): Promise<Course> {
    const courseId = (course as any).id || randomUUID()
    const now = new Date()

    const priceNgn = Math.round(typeof (course as any).price === "number" ? (course as any).price : (course as any).price?.NGN ?? (course as any).priceNgn ?? 0)
    const priceUsd = Math.round(typeof (course as any).price === "object" ? (course as any).price?.USD ?? 0 : (course as any).priceUsd ?? 0)
    const priceEur = Math.round(typeof (course as any).price === "object" ? (course as any).price?.EUR ?? 0 : (course as any).priceEur ?? 0)
    const priceGbp = Math.round(typeof (course as any).price === "object" ? (course as any).price?.GBP ?? 0 : (course as any).priceGbp ?? 0)
    const category = course.category || (course as any).categoryName || (course as any).categoryId || "General"

    const [row] = await this.db()
      .insert(schema.courses)
      .values({
        id: courseId,
        title: course.title,
        slug: course.slug,
        description: course.description,
        overview: course.overview ?? [],
        category,
        level: course.level ?? "beginner",
        instructorId: course.instructorId,
        instructorName: course.instructorName ?? null,
        instructorAvatar: course.instructorAvatar ?? null,
        instructorBio: course.instructorBio ?? null,
        instructorHeadline: course.instructorHeadline ?? null,
        instructorYearsOfExperience: course.instructorYearsOfExperience ?? null,
        instructorSpecialties: course.instructorSpecialties ?? [],
        priceNgn,
        priceUsd,
        priceEur,
        priceGbp,
        thumbnail: course.thumbnail ?? "",
        published: course.published ?? false,
        approved: course.approved ?? false,
        totalDuration: course.totalDuration ?? 0,
        enrollmentCount: course.enrollmentCount ?? 0,
        rating: course.rating ?? 0,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    if (course.modules && course.modules.length > 0) {
      for (const [mIdx, m] of course.modules.entries()) {
        const moduleId = m.id || randomUUID()
        await this.db().insert(schema.courseModules).values({
          id: moduleId,
          courseId,
          title: m.title,
          order: m.order ?? mIdx + 1,
          createdAt: now,
          updatedAt: now,
        })

        if (m.lessons && m.lessons.length > 0) {
          for (const [lIdx, l] of m.lessons.entries()) {
            const lessonId = l.id || randomUUID()
            await this.db().insert(schema.lessons).values({
              id: lessonId,
              courseId,
              moduleId,
              title: l.title,
              type: l.type,
              order: l.order ?? lIdx + 1,
              duration: l.duration ?? 0,
              content: l.content ?? {},
              isFree: l.isFree ?? false,
              approved: l.approved ?? false,
              pendingApproval: l.pendingApproval ?? false,
              createdAt: now,
              updatedAt: now,
            })
          }
        }
      }
    }

    const created = await this.getCourseById(courseId)
    return created!
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined> {
    const existing = await this.getCourseById(id)
    if (!existing) return undefined

    const patch: Partial<typeof schema.courses.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (updates.title !== undefined) patch.title = updates.title
    if (updates.slug !== undefined) patch.slug = updates.slug
    if (updates.description !== undefined) patch.description = updates.description
    if (updates.overview !== undefined) patch.overview = updates.overview
    if (updates.category !== undefined) patch.category = updates.category
    if (updates.level !== undefined) patch.level = updates.level
    if (updates.instructorId !== undefined) patch.instructorId = updates.instructorId
    if (updates.instructorName !== undefined) patch.instructorName = updates.instructorName
    if (updates.instructorAvatar !== undefined) patch.instructorAvatar = updates.instructorAvatar
    if (updates.instructorBio !== undefined) patch.instructorBio = updates.instructorBio
    if (updates.instructorHeadline !== undefined) patch.instructorHeadline = updates.instructorHeadline
    if (updates.instructorYearsOfExperience !== undefined) patch.instructorYearsOfExperience = updates.instructorYearsOfExperience
    if (updates.instructorSpecialties !== undefined) patch.instructorSpecialties = updates.instructorSpecialties
    if (updates.price !== undefined) {
      if (typeof (updates as any).price === "number") {
        patch.priceNgn = Math.round((updates as any).price)
      } else {
        patch.priceNgn = Math.round(updates.price.NGN ?? existing.price.NGN)
        patch.priceUsd = Math.round(updates.price.USD ?? existing.price.USD)
        patch.priceEur = Math.round(updates.price.EUR ?? existing.price.EUR)
        patch.priceGbp = Math.round(updates.price.GBP ?? existing.price.GBP)
      }
    }
    if (updates.thumbnail !== undefined) patch.thumbnail = updates.thumbnail
    if (updates.published !== undefined) patch.published = updates.published
    if (updates.approved !== undefined) patch.approved = updates.approved
    if (updates.totalDuration !== undefined) patch.totalDuration = updates.totalDuration
    if (updates.enrollmentCount !== undefined) patch.enrollmentCount = updates.enrollmentCount
    if (updates.rating !== undefined) patch.rating = updates.rating

    await this.db().update(schema.courses).set(patch).where(eq(schema.courses.id, id))

    if (updates.modules !== undefined) {
      // Replace existing modules and lessons
      await this.db().delete(schema.lessons).where(eq(schema.lessons.courseId, id))
      await this.db().delete(schema.courseModules).where(eq(schema.courseModules.courseId, id))

      const now = new Date()
      for (const [mIdx, m] of updates.modules.entries()) {
        const moduleId = m.id || randomUUID()
        await this.db().insert(schema.courseModules).values({
          id: moduleId,
          courseId: id,
          title: m.title,
          order: m.order ?? mIdx + 1,
          createdAt: now,
          updatedAt: now,
        })

        if (m.lessons && m.lessons.length > 0) {
          for (const [lIdx, l] of m.lessons.entries()) {
            const lessonId = l.id || randomUUID()
            await this.db().insert(schema.lessons).values({
              id: lessonId,
              courseId: id,
              moduleId,
              title: l.title,
              type: l.type,
              order: l.order ?? lIdx + 1,
              duration: l.duration ?? 0,
              content: l.content ?? {},
              isFree: l.isFree ?? false,
              approved: l.approved ?? false,
              pendingApproval: l.pendingApproval ?? false,
              createdAt: now,
              updatedAt: now,
            })
          }
        }
      }
    }

    return this.getCourseById(id)
  }

  async deleteCourse(id: string): Promise<boolean> {
    await this.db().delete(schema.lessons).where(eq(schema.lessons.courseId, id))
    await this.db().delete(schema.courseModules).where(eq(schema.courseModules.courseId, id))
    const result = await this.db().delete(schema.courses).where(eq(schema.courses.id, id)).returning({ id: schema.courses.id })
    return result.length > 0
  }

  // ==========================================
  // Enrollments
  // ==========================================

  async getEnrollmentsByUserId(userId: string): Promise<Enrollment[]> {
    const rows = await this.db()
      .select()
      .from(schema.enrollments)
      .where(eq(schema.enrollments.userId, userId))
      .orderBy(desc(schema.enrollments.enrolledAt))
    return rows.map(toEnrollment)
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const [row] = await this.db()
      .select()
      .from(schema.enrollments)
      .where(and(eq(schema.enrollments.userId, userId), eq(schema.enrollments.courseId, courseId)))
      .limit(1)
    return row ? toEnrollment(row) : undefined
  }

  async getEnrollmentById(id: string): Promise<Enrollment | undefined> {
    const [row] = await this.db().select().from(schema.enrollments).where(eq(schema.enrollments.id, id)).limit(1)
    return row ? toEnrollment(row) : undefined
  }

  async createEnrollment(enrollment: Omit<Enrollment, "id"> | (Omit<Enrollment, "id"> & { id?: string })): Promise<Enrollment> {
    const existing = await this.getEnrollment(enrollment.userId, enrollment.courseId)
    if (existing) return existing

    const id = (enrollment as any).id || randomUUID()
    const now = new Date()
    const [row] = await this.db()
      .insert(schema.enrollments)
      .values({
        id,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        progress: enrollment.progress ?? 0,
        completedLessons: enrollment.completedLessons ?? [],
        status: enrollment.status ?? "active",
        currentLesson: enrollment.currentLesson ?? null,
        enrolledAt: enrollment.enrolledAt ?? now,
        completedAt: enrollment.completedAt ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return toEnrollment(row)
  }

  async updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const patch: Partial<typeof schema.enrollments.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (updates.progress !== undefined) patch.progress = updates.progress
    if (updates.completedLessons !== undefined) patch.completedLessons = updates.completedLessons
    if (updates.status !== undefined) patch.status = updates.status
    if (updates.currentLesson !== undefined) patch.currentLesson = updates.currentLesson
    if (updates.completedAt !== undefined) patch.completedAt = updates.completedAt

    const [row] = await this.db()
      .update(schema.enrollments)
      .set(patch)
      .where(eq(schema.enrollments.id, id))
      .returning()

    return row ? toEnrollment(row) : undefined
  }

  async updateEnrollmentProgress(
    id: string,
    progress: number,
    completedLessons: string[],
    currentLesson?: string,
  ): Promise<Enrollment | undefined> {
    return this.updateEnrollment(id, {
      progress,
      completedLessons,
      currentLesson,
      completedAt: progress >= 100 ? new Date() : undefined,
    })
  }

  async getAllEnrollments(): Promise<Enrollment[]> {
    const rows = await this.db().select().from(schema.enrollments).orderBy(desc(schema.enrollments.enrolledAt))
    return rows.map(toEnrollment)
  }

  // ==========================================
  // Payments and Events
  // ==========================================

  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    const rows = await this.db()
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.userId, userId))
      .orderBy(desc(schema.payments.createdAt))
    return rows.map(toPayment)
  }

  async getPaymentByReference(reference: string): Promise<Payment | undefined> {
    const [row] = await this.db()
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.reference, reference))
      .limit(1)
    return row ? toPayment(row) : undefined
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    const [row] = await this.db().select().from(schema.payments).where(eq(schema.payments.id, id)).limit(1)
    return row ? toPayment(row) : undefined
  }

  async createPayment(payment: Omit<Payment, "id"> | (Omit<Payment, "id"> & { id?: string })): Promise<Payment> {
    const id = (payment as any).id || randomUUID()
    const now = new Date()
    const legacyPayload: Record<string, any> = {}
    if (payment.customerEmail) legacyPayload.customerEmail = payment.customerEmail
    if (payment.gatewayStatus) legacyPayload.gatewayStatus = payment.gatewayStatus
    if (payment.gatewayMessage) legacyPayload.gatewayMessage = payment.gatewayMessage
    if (payment.paidAt) legacyPayload.paidAt = payment.paidAt

    const [row] = await this.db()
      .insert(schema.payments)
      .values({
        id,
        userId: payment.userId,
        courseId: payment.courseId ?? null,
        courseIds: payment.courseIds ?? (payment.courseId ? [payment.courseId] : []),
        paymentType: payment.paymentType ?? "course_purchase",
        reference: payment.reference,
        amount: payment.amount,
        currency: payment.currency ?? "NGN",
        method: payment.paymentMethod ?? null,
        status: (payment.status as any) ?? "pending",
        reviewState: (payment as any).reviewState ?? null,
        refundState: (payment as any).refundState ?? null,
        verificationLock: payment.verificationLocked ?? false,
        verificationLockExpiresAt: payment.verificationLockExpiresAt ?? null,
        paystackMetadata: (payment as any).paystackMetadata ?? {},
        legacyPayload: Object.keys(legacyPayload).length ? legacyPayload : null,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    return toPayment(row)
  }

  async getStalePayments(params: { statuses: Payment["status"][]; cutoff: Date; limit: number }): Promise<Payment[]> {
    const rows = await this.db()
      .select()
      .from(schema.payments)
      .where(and(inArray(schema.payments.status, params.statuses as any[]), lte(schema.payments.createdAt, params.cutoff)))
      .orderBy(asc(schema.payments.createdAt))
      .limit(params.limit)
    return rows.map(toPayment)
  }

  async acquirePaymentVerificationLock(reference: string, maxAttempts = 5): Promise<Payment | undefined> {
    const now = new Date()
    const lockExpiry = new Date(now.getTime() + 2 * 60 * 1000)
    const token = randomUUID()

    const pool = getPool()
    // Atomically acquire lock using conditional update in SQL
    const query = `
      UPDATE payments
      SET
        verification_lock = true,
        verification_lock_expires_at = $1,
        status = 'processing',
        updated_at = $2,
        legacy_payload = jsonb_set(
          jsonb_set(
            jsonb_set(
              COALESCE(legacy_payload, '{}'::jsonb),
              '{verificationLockToken}', to_jsonb($3::text)
            ),
            '{lastVerificationAt}', to_jsonb($4::text)
          ),
          '{verificationAttempts}', to_jsonb(COALESCE((legacy_payload->>'verificationAttempts')::int, 0) + 1)
        )
      WHERE reference = $5
        AND status IN ('pending', 'processing')
        AND COALESCE((legacy_payload->>'verificationAttempts')::int, 0) < $6
        AND (verification_lock IS NOT TRUE OR verification_lock_expires_at IS NULL OR verification_lock_expires_at <= $2)
      RETURNING *;
    `

    const res = await pool.query(query, [lockExpiry, now, token, now.toISOString(), reference, maxAttempts])
    if (res.rows.length === 0) return undefined
    return this.getPaymentByReference(reference)
  }

  async releasePaymentVerificationLock(reference: string): Promise<Payment | undefined> {
    const [row] = await this.db()
      .update(schema.payments)
      .set({
        verificationLock: false,
        verificationLockExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.payments.reference, reference))
      .returning()
    return row ? toPayment(row) : undefined
  }

  async updatePayment(idOrReference: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const patch: Partial<typeof schema.payments.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (updates.status !== undefined) patch.status = updates.status as any
    if ((updates as any).reviewState !== undefined) patch.reviewState = (updates as any).reviewState
    if ((updates as any).refundState !== undefined) patch.refundState = (updates as any).refundState
    if (updates.verificationLocked !== undefined) patch.verificationLock = updates.verificationLocked
    if (updates.verificationLockExpiresAt !== undefined) patch.verificationLockExpiresAt = updates.verificationLockExpiresAt
    if ((updates as any).paystackMetadata !== undefined) patch.paystackMetadata = (updates as any).paystackMetadata

    const [row] = await this.db()
      .update(schema.payments)
      .set(patch)
      .where(sql`${schema.payments.id} = ${idOrReference} OR ${schema.payments.reference} = ${idOrReference}`)
      .returning()
    return row ? toPayment(row) : undefined
  }

  async updatePaymentByReference(reference: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [existing] = await this.db()
      .select({ id: schema.payments.id, legacyPayload: schema.payments.legacyPayload })
      .from(schema.payments)
      .where(eq(schema.payments.reference, reference))
      .limit(1)

    if (!existing) return undefined

    const patch: Partial<typeof schema.payments.$inferInsert> = {
      updatedAt: new Date(),
    }
    if (updates.status !== undefined) patch.status = updates.status as any
    if ((updates as any).reviewState !== undefined) patch.reviewState = (updates as any).reviewState
    if ((updates as any).refundState !== undefined) patch.refundState = (updates as any).refundState
    if (updates.verificationLocked !== undefined) patch.verificationLock = updates.verificationLocked
    if (updates.verificationLockExpiresAt !== undefined) patch.verificationLockExpiresAt = updates.verificationLockExpiresAt
    if ((updates as any).paystackMetadata !== undefined) patch.paystackMetadata = (updates as any).paystackMetadata

    const legacy = (existing.legacyPayload as Record<string, any>) ?? {}
    let legacyChanged = false
    if (updates.gatewayMessage !== undefined) {
      legacy.gatewayMessage = updates.gatewayMessage
      legacyChanged = true
    }
    if (updates.gatewayStatus !== undefined) {
      legacy.gatewayStatus = updates.gatewayStatus
      legacyChanged = true
    }
    if (updates.paidAt !== undefined) {
      legacy.paidAt = updates.paidAt
      legacyChanged = true
    }
    if (legacyChanged) patch.legacyPayload = legacy

    const [row] = await this.db()
      .update(schema.payments)
      .set(patch)
      .where(eq(schema.payments.reference, reference))
      .returning()

    return row ? toPayment(row) : undefined
  }

  async getAllPayments(): Promise<Payment[]> {
    const rows = await this.db().select().from(schema.payments).orderBy(desc(schema.payments.createdAt))
    return rows.map(toPayment)
  }

  async createPaymentEvent(event: Omit<PaymentEvent, "id" | "createdAt">): Promise<PaymentEvent> {
    const id = randomUUID()
    const now = new Date()
    const [row] = await this.db()
      .insert(schema.paymentEvents)
      .values({
        id,
        paymentId: event.paymentId ?? null,
        reference: event.reference,
        eventType: event.type,
        eventData: {
          source: event.source,
          status: event.status,
          message: event.message,
          metadata: event.metadata,
        },
        createdAt: now,
      })
      .returning()

    return {
      id: row.id,
      paymentId: row.paymentId ?? undefined,
      reference: row.reference,
      type: row.eventType as PaymentEvent["type"],
      source: event.source,
      status: event.status,
      message: event.message,
      metadata: event.metadata,
      createdAt: row.createdAt,
    }
  }

  // ==========================================
  // Certificates
  // ==========================================

  async getCertificatesByUserId(userId: string): Promise<Certificate[]> {
    const rows = await this.db()
      .select()
      .from(schema.certificates)
      .where(eq(schema.certificates.userId, userId))
      .orderBy(desc(schema.certificates.issuedAt))
    return rows.map(toCertificate)
  }

  async getCertificateByVerificationCode(code: string): Promise<Certificate | undefined> {
    const [row] = await this.db()
      .select()
      .from(schema.certificates)
      .where(eq(schema.certificates.verificationCode, code))
      .limit(1)
    return row ? toCertificate(row) : undefined
  }

  async createCertificate(certificate: Omit<Certificate, "id"> | (Omit<Certificate, "id"> & { id?: string })): Promise<Certificate> {
    const id = (certificate as any).id || randomUUID()
    const now = new Date()
    const [row] = await this.db()
      .insert(schema.certificates)
      .values({
        id,
        userId: certificate.userId,
        courseId: certificate.courseId,
        certificateUrl: certificate.certificateUrl,
        verificationCode: certificate.verificationCode,
        issuedAt: certificate.issuedAt ?? now,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return toCertificate(row)
  }

  // ==========================================
  // Assessments (Quizzes and Assignments)
  // ==========================================

  async getQuizById(id: string): Promise<Quiz | undefined> {
    const [quizRow] = await this.db().select().from(schema.quizzes).where(eq(schema.quizzes.id, id)).limit(1)
    if (!quizRow) return undefined

    const questionRows = await this.db()
      .select()
      .from(schema.quizQuestions)
      .where(eq(schema.quizQuestions.quizId, id))
      .orderBy(asc(schema.quizQuestions.createdAt))

    return {
      id: quizRow.id,
      title: quizRow.title,
      passingScore: quizRow.passingScore,
      timeLimit: quizRow.timeLimit ?? undefined,
      questions: questionRows.map((q) => ({
        id: q.id,
        question: q.question,
        options: (q.options as string[]) ?? [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ?? undefined,
      })),
    }
  }


  get academic() {
    return getAcademicDb()
  }

  async createQuiz(data: Parameters<ReturnType<typeof getAcademicDb>["createQuiz"]>[0]) {
    return getAcademicDb().createQuiz(data)
  }

  async getQuizForStudent(id: string) {
    return getAcademicDb().getQuizForStudent(id)
  }

  async createQuizAttempt(data: Parameters<ReturnType<typeof getAcademicDb>["createQuizAttempt"]>[0]) {
    return getAcademicDb().createQuizAttempt(data)
  }

  async getQuizAttemptById(id: string) {
    return getAcademicDb().getQuizAttemptById(id)
  }

  async getQuizAttemptsByUserAndQuiz(userId: string, quizId: string) {
    return getAcademicDb().getQuizAttemptsByUserAndQuiz(userId, quizId)
  }

  async submitQuizAttempt(params: Parameters<ReturnType<typeof getAcademicDb>["submitQuizAttempt"]>[0]) {
    return getAcademicDb().submitQuizAttempt(params)
  }

  async createAssignment(data: Parameters<ReturnType<typeof getAcademicDb>["createAssignment"]>[0]) {
    return getAcademicDb().createAssignment(data)
  }

  async createAssignmentSubmission(data: Parameters<ReturnType<typeof getAcademicDb>["createAssignmentSubmission"]>[0]) {
    return getAcademicDb().createAssignmentSubmission(data)
  }

  async getAssignmentSubmissionById(id: string) {
    return getAcademicDb().getAssignmentSubmissionById(id)
  }

  async getAssignmentSubmissionsByUser(userId: string, courseId?: string) {
    return getAcademicDb().getAssignmentSubmissionsByUser(userId, courseId)
  }

  async getAssignmentSubmissionsByCourse(courseId: string, assignmentId?: string) {
    return getAcademicDb().getAssignmentSubmissionsByCourse(courseId, assignmentId)
  }

  async createRubric(data: Parameters<ReturnType<typeof getAcademicDb>["createRubric"]>[0]) {
    return getAcademicDb().createRubric(data)
  }

  async getRubricById(id: string) {
    return getAcademicDb().getRubricById(id)
  }

  async getRubricByTarget(courseId: string, target: { assignmentId?: string; projectId?: string }) {
    return getAcademicDb().getRubricByTarget(courseId, target)
  }

  async gradeSubmission(data: Parameters<ReturnType<typeof getAcademicDb>["gradeSubmission"]>[0]) {
    return getAcademicDb().gradeSubmission(data)
  }

  async getGradeBySubmission(submissionType: "assignment" | "project", submissionId: string) {
    return getAcademicDb().getGradeBySubmission(submissionType, submissionId)
  }

  async getGradeHistory(gradeId: string) {
    return getAcademicDb().getGradeHistory(gradeId)
  }

  async getGradesByStudent(studentId: string, courseId?: string) {
    return getAcademicDb().getGradesByStudent(studentId, courseId)
  }

  async createProject(data: Parameters<ReturnType<typeof getAcademicDb>["createProject"]>[0]) {
    return getAcademicDb().createProject(data)
  }

  async getProjectsByCourse(courseId: string) {
    return getAcademicDb().getProjectsByCourse(courseId)
  }

  async getProjectById(id: string) {
    return getAcademicDb().getProjectById(id)
  }

  async createProjectSubmission(data: Parameters<ReturnType<typeof getAcademicDb>["createProjectSubmission"]>[0]) {
    return getAcademicDb().createProjectSubmission(data)
  }

  async getProjectSubmissionByUserAndProject(userId: string, projectId: string) {
    return getAcademicDb().getProjectSubmissionByUserAndProject(userId, projectId)
  }

  async getProjectSubmissionsByCourse(courseId: string, projectId?: string) {
    return getAcademicDb().getProjectSubmissionsByCourse(courseId, projectId)
  }

  async getProjectSubmissionById(id: string) {
    return getAcademicDb().getProjectSubmissionById(id)
  }

  async getAssignmentById(id: string): Promise<Assignment | undefined> {
    const [row] = await this.db().select().from(schema.assignments).where(eq(schema.assignments.id, id)).limit(1)
    if (!row) return undefined
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      dueDate: row.dueDate ?? undefined,
      maxScore: row.maxScore,
    }
  }

  // ==========================================
  // Learning Notes
  // ==========================================

  async getNotesByUserId(userId: string): Promise<LearningNote[]> {
    const rows = await this.db()
      .select()
      .from(schema.learningNotes)
      .where(eq(schema.learningNotes.userId, userId))
      .orderBy(desc(schema.learningNotes.updatedAt))
    return rows.map(toLearningNote)
  }

  async getLearningNotesByUserAndCourse(userId: string, courseId: string): Promise<LearningNote[]> {
    const rows = await this.db()
      .select()
      .from(schema.learningNotes)
      .where(and(eq(schema.learningNotes.userId, userId), eq(schema.learningNotes.courseId, courseId)))
      .orderBy(desc(schema.learningNotes.updatedAt))
    return rows.map(toLearningNote)
  }

  async saveLearningNote(note: Omit<LearningNote, "id" | "createdAt" | "updatedAt"> | (Omit<LearningNote, "createdAt" | "updatedAt"> & { id?: string })): Promise<LearningNote> {
    return this.createNote(note)
  }

  async createNote(note: Omit<LearningNote, "id" | "createdAt" | "updatedAt"> | (Omit<LearningNote, "createdAt" | "updatedAt"> & { id?: string })): Promise<LearningNote> {
    const id = (note as any).id || randomUUID()
    const now = new Date()
    const [row] = await this.db()
      .insert(schema.learningNotes)
      .values({
        id,
        userId: note.userId,
        courseId: note.courseId || null,
        title: (note as any).title ?? null,
        content: note.content,
        createdAt: now,
        updatedAt: now,
      })
      .returning()
    return toLearningNote(row)
  }

  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    const result = await this.db()
      .delete(schema.learningNotes)
      .where(and(eq(schema.learningNotes.id, noteId), eq(schema.learningNotes.userId, userId)))
      .returning({ id: schema.learningNotes.id })
    return result.length > 0
  }

  // ==========================================
  // Admin Logs and Onboarding Events
  // ==========================================

  async createAdminLog(log: Omit<AdminLog, "id" | "createdAt"> | (Omit<AdminLog, "createdAt"> & { id?: string })): Promise<AdminLog> {
    const id = (log as any).id || randomUUID()
    const now = new Date()
    const [row] = await this.db()
      .insert(schema.adminLogs)
      .values({
        id,
        actorId: log.actorId,
        action: log.action,
        details: {
          actorName: log.actorName,
          actorEmail: log.actorEmail,
          targetUserId: log.targetUserId,
          targetName: log.targetName,
          targetEmail: log.targetEmail,
          targetRole: log.targetRole,
          ...((log as any).details ?? {}),
        },
        createdAt: now,
      })
      .returning()
    return toAdminLog(row)
  }

  async getAdminLogs(limit = 50): Promise<AdminLog[]> {
    const rows = await this.db().select().from(schema.adminLogs).orderBy(desc(schema.adminLogs.createdAt)).limit(limit)
    return rows.map(toAdminLog)
  }

  async createOnboardingEvent(event: Omit<OnboardingEvent, "id" | "createdAt"> | (Omit<OnboardingEvent, "createdAt"> & { id?: string })): Promise<OnboardingEvent> {
    const id = (event as any).id || randomUUID()
    const now = new Date()
    const [row] = await this.db()
      .insert(schema.onboardingEvents)
      .values({
        id,
        userId: (event as any).userId || null,
        event: event.name,
        data: {
          mode: event.mode,
          source: event.source,
          step: event.step,
          stepIndex: event.stepIndex,
          status: event.status,
          reference: event.reference,
          metadata: event.metadata,
        },
        createdAt: now,
      })
      .returning()
    return toOnboardingEvent(row)
  }

  async getOnboardingEvents(limit = 500): Promise<OnboardingEvent[]> {
    const rows = await this.db()
      .select()
      .from(schema.onboardingEvents)
      .orderBy(desc(schema.onboardingEvents.createdAt))
      .limit(limit)
    return rows.map(toOnboardingEvent)
  }

  // ==========================================
  // App Settings
  // ==========================================

  async getAppSettings<T = Record<string, any>>(id: string): Promise<T | null> {
    const [row] = await this.db().select().from(schema.appSettings).where(eq(schema.appSettings.id, id)).limit(1)
    if (!row) return null
    return row.data as T
  }

  async setAppSettings(id: string, data: Record<string, any>): Promise<void> {
    const now = new Date()
    await this.db()
      .insert(schema.appSettings)
      .values({
        id,
        data,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.appSettings.id,
        set: {
          data,
          updatedAt: now,
        },
      })
  }
}

// Singleton instance
let postgresDbInstance: PostgresDatabase | null = null

export function getPostgresDatabase(): PostgresDatabase {
  if (!postgresDbInstance) {
    postgresDbInstance = new PostgresDatabase()
  }
  return postgresDbInstance
}
