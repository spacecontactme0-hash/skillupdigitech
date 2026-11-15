import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core"
import { users, courses } from "./core"

// ---------------------------------------------------------------------------
// 1. Academic Programmes & Pathways
// ---------------------------------------------------------------------------

export const academicProgrammes = pgTable(
  "academic_programmes",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull().unique(), // 'CAREER_READINESS', 'SKILL_ACQUISITION'
    name: text("name").notNull(),
    type: text("type").notNull(), // 'career_readiness', 'skill_acquisition'
    description: text("description"),
    allowedDeliveryModes: jsonb("allowed_delivery_modes").notNull().default(["online"]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: uniqueIndex("uniq_academic_programmes_code").on(table.code),
  }),
)

export const programmePathways = pgTable(
  "programme_pathways",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    programmeId: text("programme_id")
      .notNull()
      .references(() => academicProgrammes.id),
    code: text("code").notNull().unique(), // 'AI_ENGINEER', 'SOFTWARE_ENGINEER', 'SOCIAL_MEDIA_MANAGEMENT'
    name: text("name").notNull(),
    description: text("description"),
    targetOutcomes: jsonb("target_outcomes").default([]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: uniqueIndex("uniq_programme_pathways_code").on(table.code),
    programmeIdx: index("idx_programme_pathways_programme").on(table.programmeId),
  }),
)

export const programmeCourses = pgTable(
  "programme_courses",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    programmeId: text("programme_id")
      .notNull()
      .references(() => academicProgrammes.id),
    pathwayId: text("pathway_id").references(() => programmePathways.id),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
    courseRole: text("course_role").notNull().default("core"), // 'foundation', 'core', 'supporting', 'elective'
    displayOrder: integer("display_order").notNull().default(1),
    isMandatory: boolean("is_mandatory").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqProgCourse: uniqueIndex("uniq_programme_course").on(
      table.programmeId,
      table.pathwayId,
      table.courseId,
    ),
    programmeCourseIdx: index("idx_programme_courses_prog").on(table.programmeId),
  }),
)

// ---------------------------------------------------------------------------
// 2. Physical Campus, Classrooms & Cohorts
// ---------------------------------------------------------------------------

export const campuses = pgTable(
  "campuses",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(), // e.g. "Enugu Main Learning Centre"
    slug: text("slug").notNull().unique(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    facilities: jsonb("facilities").default([
      "electricity_backup",
      "student_wifi",
      "air_conditioning",
    ]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("uniq_campuses_slug").on(table.slug),
  }),
)

export const classrooms = pgTable(
  "classrooms",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    campusId: text("campus_id")
      .notNull()
      .references(() => campuses.id),
    name: text("name").notNull(), // e.g. "Lab 1 - Turing Room"
    roomNumber: text("room_number"),
    safeCapacity: integer("safe_capacity").notNull().default(30),
    powerOutletsCount: integer("power_outlets_count").notNull().default(30),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    campusIdx: index("idx_classrooms_campus").on(table.campusId),
  }),
)

export const cohorts = pgTable(
  "cohorts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    programmeId: text("programme_id")
      .notNull()
      .references(() => academicProgrammes.id),
    pathwayId: text("pathway_id").references(() => programmePathways.id),
    code: text("code").notNull().unique(), // e.g. 'SE-2026-Q1-HYB'
    name: text("name").notNull(),
    deliveryArrangement: text("delivery_arrangement").notNull(), // 'online', 'hybrid'
    campusId: text("campus_id").references(() => campuses.id),
    defaultClassroomId: text("default_classroom_id").references(() => classrooms.id),
    maxCapacity: integer("max_capacity").notNull().default(30),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    status: text("status").notNull().default("enrolling"), // 'upcoming', 'enrolling', 'active', 'completed', 'archived'
    fixedTimetableSummary: text("fixed_timetable_summary"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    codeIdx: uniqueIndex("uniq_cohorts_code").on(table.code),
    progArrangementIdx: index("idx_cohorts_prog_arr").on(
      table.programmeId,
      table.deliveryArrangement,
    ),
  }),
)

// ---------------------------------------------------------------------------
// 3. Programme Enrolments & Cohort Memberships
// ---------------------------------------------------------------------------

export const programmeEnrolments = pgTable(
  "programme_enrolments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id),
    programmeId: text("programme_id")
      .notNull()
      .references(() => academicProgrammes.id),
    pathwayId: text("pathway_id").references(() => programmePathways.id),
    deliveryArrangement: text("delivery_arrangement").notNull(), // 'online', 'hybrid'
    cohortId: text("cohort_id").references(() => cohorts.id),
    status: text("status").notNull().default("pending_payment"), // 'pending_payment', 'active', 'completed', 'suspended', 'withdrawn'
    byolAcknowledged: boolean("byol_acknowledged").notNull().default(false),
    byolAcknowledgedAt: timestamp("byol_acknowledged_at"),
    metadata: jsonb("metadata").default({}),
    enrolledAt: timestamp("enrolled_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    studentProgIdx: index("idx_prog_enrol_student").on(table.studentId, table.status),
    cohortProgIdx: index("idx_prog_enrol_cohort").on(table.cohortId),
  }),
)

export const cohortMemberships = pgTable(
  "cohort_memberships",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    cohortId: text("cohort_id")
      .notNull()
      .references(() => cohorts.id),
    programmeEnrolmentId: text("programme_enrolment_id")
      .notNull()
      .references(() => programmeEnrolments.id),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull().default("active"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqMember: uniqueIndex("uniq_cohort_student").on(table.cohortId, table.studentId),
  }),
)

// ---------------------------------------------------------------------------
// 4. Scheduling, Bookings & Attendance
// ---------------------------------------------------------------------------

export const classSessions = pgTable(
  "class_sessions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    cohortId: text("cohort_id")
      .notNull()
      .references(() => cohorts.id),
    courseId: text("course_id").references(() => courses.id),
    title: text("title").notNull(),
    description: text("description"),
    activityType: text("activity_type").notNull(), // 'live_virtual', 'physical_class', 'physical_practical', 'virtual_workshop'
    deliveryChannel: text("delivery_channel").notNull(), // 'online', 'physical', 'simultaneous_hybrid'
    campusId: text("campus_id").references(() => campuses.id),
    classroomId: text("classroom_id").references(() => classrooms.id),
    instructorId: text("instructor_id").references(() => users.id),
    sessionDate: timestamp("session_date").notNull(),
    startTime: text("start_time").notNull(), // e.g. "10:00"
    endTime: text("end_time").notNull(), // e.g. "14:00"
    meetingUrl: text("meeting_url"),
    maxCapacity: integer("max_capacity").notNull().default(30),
    bookedSeatsCount: integer("booked_seats_count").notNull().default(0),
    status: text("status").notNull().default("scheduled"), // 'scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled'
    changeReason: text("change_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    cohortDateIdx: index("idx_class_sessions_cohort_date").on(
      table.cohortId,
      table.sessionDate,
    ),
    instructorDateIdx: index("idx_class_sessions_inst_date").on(
      table.instructorId,
      table.sessionDate,
    ),
  }),
)

export const sessionBookings = pgTable(
  "session_bookings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => classSessions.id),
    programmeEnrolmentId: text("programme_enrolment_id")
      .notNull()
      .references(() => programmeEnrolments.id),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id),
    status: text("status").notNull().default("confirmed"), // 'confirmed', 'cancelled', 'waitlisted'
    bookedAt: timestamp("booked_at").notNull().defaultNow(),
  },
  (table) => ({
    uniqBooking: uniqueIndex("uniq_session_student_booking").on(
      table.sessionId,
      table.studentId,
    ),
  }),
)

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => classSessions.id),
    studentId: text("student_id")
      .notNull()
      .references(() => users.id),
    programmeEnrolmentId: text("programme_enrolment_id")
      .notNull()
      .references(() => programmeEnrolments.id),
    attendanceStatus: text("attendance_status").notNull(), // 'present', 'absent', 'excused', 'late'
    attendanceChannel: text("attendance_channel").notNull(), // 'physical', 'virtual'
    verifiedBy: text("verified_by").references(() => users.id),
    verifiedAt: timestamp("verified_at").notNull().defaultNow(),
    notes: text("notes"),
  },
  (table) => ({
    uniqAttendance: uniqueIndex("uniq_session_student_attendance").on(
      table.sessionId,
      table.studentId,
    ),
  }),
)

// ---------------------------------------------------------------------------
// 5. Policy & BYOL Acknowledgements
// ---------------------------------------------------------------------------

export const policyAcknowledgements = pgTable(
  "policy_acknowledgements",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    programmeEnrolmentId: text("programme_enrolment_id").references(
      () => programmeEnrolments.id,
    ),
    policyType: text("policy_type").notNull(), // 'byol_policy', 'guardian_consent', 'code_of_conduct'
    policyVersion: text("policy_version").notNull().default("v1.0"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    acknowledgedAt: timestamp("acknowledged_at").notNull().defaultNow(),
    metadata: jsonb("metadata").default({}),
  },
  (table) => ({
    userPolicyIdx: index("idx_policy_ack_user").on(table.userId, table.policyType),
  }),
)
