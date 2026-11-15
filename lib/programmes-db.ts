/**
 * SkillUp Digitech Academy — Academic Programmes, Pathways & Scheduling DB Client
 *
 * Implements Phase 2 foundations for querying:
 * - Academic Programmes (Career Readiness vs Skill Acquisition)
 * - Programme Pathways (AI Engineer, Software Engineer, Social Media Management)
 * - Master Courses & Curriculum Mappings (core, foundation, supporting, elective)
 * - Campuses, Classrooms, Cohorts & Timetables
 * - Multi-enrolment student querying
 */

import { eq, and, desc, asc, inArray } from "drizzle-orm"
import { getDrizzleDb } from "@/db/client"
import * as schema from "@/db/schema"

export interface AcademicProgrammeDTO {
  id: string
  code: string
  name: string
  type: string
  description: string | null
  allowedDeliveryModes: string[]
  isActive: boolean
}

export interface ProgrammePathwayDTO {
  id: string
  programmeId: string
  code: string
  name: string
  description: string | null
  targetOutcomes: string[]
  isActive: boolean
}

export interface ProgrammeCourseDTO {
  id: string
  programmeId: string
  pathwayId: string | null
  courseId: string
  courseRole: string
  displayOrder: number
  isMandatory: boolean
  course: {
    id: string
    code: string | null
    title: string
    slug: string
    category: string
    level: string
    priceNgn: number
    priceUsd: number
    priceGbp: number
    isFoundationCourse: boolean
    thumbnail: string
    description: string
  }
}

export interface CohortDTO {
  id: string
  programmeId: string
  pathwayId: string | null
  code: string
  name: string
  deliveryArrangement: string
  campusId: string | null
  defaultClassroomId: string | null
  maxCapacity: number
  startDate: Date
  endDate: Date
  status: string
  fixedTimetableSummary: string | null
}

export interface CampusDTO {
  id: string
  name: string
  slug: string
  address: string
  city: string
  state: string
  contactPhone: string | null
  contactEmail: string | null
  facilities: string[]
  isActive: boolean
}

export interface ClassroomDTO {
  id: string
  campusId: string
  name: string
  roomNumber: string | null
  safeCapacity: number
  powerOutletsCount: number
  isActive: boolean
}

export const programmesDb = {
  /**
   * Get all active academic programmes
   */
  async getProgrammes(): Promise<AcademicProgrammeDTO[]> {
    const db = getDrizzleDb()
    const rows = await db
      .select()
      .from(schema.academicProgrammes)
      .where(eq(schema.academicProgrammes.isActive, true))
      .orderBy(asc(schema.academicProgrammes.name))

    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      type: r.type,
      description: r.description,
      allowedDeliveryModes: (r.allowedDeliveryModes as string[]) || ["online"],
      isActive: r.isActive,
    }))
  },

  /**
   * Get an academic programme by unique code
   */
  async getProgrammeByCode(code: string): Promise<AcademicProgrammeDTO | null> {
    const db = getDrizzleDb()
    const rows = await db
      .select()
      .from(schema.academicProgrammes)
      .where(eq(schema.academicProgrammes.code, code))
      .limit(1)

    if (rows.length === 0) return null
    const r = rows[0]
    return {
      id: r.id,
      code: r.code,
      name: r.name,
      type: r.type,
      description: r.description,
      allowedDeliveryModes: (r.allowedDeliveryModes as string[]) || ["online"],
      isActive: r.isActive,
    }
  },

  /**
   * Get all active pathways for a programme
   */
  async getPathways(programmeId?: string): Promise<ProgrammePathwayDTO[]> {
    const db = getDrizzleDb()
    const query = db
      .select()
      .from(schema.programmePathways)
      .where(
        programmeId
          ? and(
              eq(schema.programmePathways.programmeId, programmeId),
              eq(schema.programmePathways.isActive, true),
            )
          : eq(schema.programmePathways.isActive, true),
      )
      .orderBy(asc(schema.programmePathways.name))

    const rows = await query
    return rows.map((r) => ({
      id: r.id,
      programmeId: r.programmeId,
      code: r.code,
      name: r.name,
      description: r.description,
      targetOutcomes: (r.targetOutcomes as string[]) || [],
      isActive: r.isActive,
    }))
  },

  /**
   * Get mapped curriculum courses for a programme or pathway
   */
  async getProgrammeCourses(
    programmeId: string,
    pathwayId?: string,
  ): Promise<ProgrammeCourseDTO[]> {
    const db = getDrizzleDb()
    const conditions = [eq(schema.programmeCourses.programmeId, programmeId)]
    if (pathwayId) {
      conditions.push(eq(schema.programmeCourses.pathwayId, pathwayId))
    }

    const rows = await db
      .select({
        id: schema.programmeCourses.id,
        programmeId: schema.programmeCourses.programmeId,
        pathwayId: schema.programmeCourses.pathwayId,
        courseId: schema.programmeCourses.courseId,
        courseRole: schema.programmeCourses.courseRole,
        displayOrder: schema.programmeCourses.displayOrder,
        isMandatory: schema.programmeCourses.isMandatory,
        course: schema.courses,
      })
      .from(schema.programmeCourses)
      .innerJoin(
        schema.courses,
        eq(schema.programmeCourses.courseId, schema.courses.id),
      )
      .where(and(...conditions))
      .orderBy(asc(schema.programmeCourses.displayOrder))

    return rows.map((r) => ({
      id: r.id,
      programmeId: r.programmeId,
      pathwayId: r.pathwayId,
      courseId: r.courseId,
      courseRole: r.courseRole,
      displayOrder: r.displayOrder,
      isMandatory: r.isMandatory,
      course: {
        id: r.course.id,
        code: r.course.code,
        title: r.course.title,
        slug: r.course.slug,
        category: r.course.category,
        level: r.course.level,
        priceNgn: r.course.priceNgn,
        priceUsd: r.course.priceUsd,
        priceGbp: r.course.priceGbp,
        isFoundationCourse: r.course.isFoundationCourse,
        thumbnail: r.course.thumbnail,
        description: r.course.description,
      },
    }))
  },

  /**
   * Get the two mandatory foundation courses (Basic Digital Literacy & Basic AI 101)
   */
  async getFoundationCourses() {
    const db = getDrizzleDb()
    return db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.isFoundationCourse, true))
      .orderBy(asc(schema.courses.code))
  },

  /**
   * Get active cohorts
   */
  async getCohorts(filters?: {
    programmeId?: string
    pathwayId?: string
    deliveryArrangement?: string
  }): Promise<CohortDTO[]> {
    const db = getDrizzleDb()
    const conditions = [eq(schema.cohorts.status, "enrolling")]

    if (filters?.programmeId) {
      conditions.push(eq(schema.cohorts.programmeId, filters.programmeId))
    }
    if (filters?.pathwayId) {
      conditions.push(eq(schema.cohorts.pathwayId, filters.pathwayId))
    }
    if (filters?.deliveryArrangement) {
      conditions.push(
        eq(schema.cohorts.deliveryArrangement, filters.deliveryArrangement),
      )
    }

    const rows = await db
      .select()
      .from(schema.cohorts)
      .where(and(...conditions))
      .orderBy(asc(schema.cohorts.startDate))

    return rows.map((r) => ({
      id: r.id,
      programmeId: r.programmeId,
      pathwayId: r.pathwayId,
      code: r.code,
      name: r.name,
      deliveryArrangement: r.deliveryArrangement,
      campusId: r.campusId,
      defaultClassroomId: r.defaultClassroomId,
      maxCapacity: r.maxCapacity,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      fixedTimetableSummary: r.fixedTimetableSummary,
    }))
  },

  /**
   * Get active campuses
   */
  async getCampuses(): Promise<CampusDTO[]> {
    const db = getDrizzleDb()
    const rows = await db
      .select()
      .from(schema.campuses)
      .where(eq(schema.campuses.isActive, true))

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      address: r.address,
      city: r.city,
      state: r.state,
      contactPhone: r.contactPhone,
      contactEmail: r.contactEmail,
      facilities: (r.facilities as string[]) || [],
      isActive: r.isActive,
    }))
  },

  /**
   * Get classrooms for a campus
   */
  async getClassrooms(campusId: string): Promise<ClassroomDTO[]> {
    const db = getDrizzleDb()
    const rows = await db
      .select()
      .from(schema.classrooms)
      .where(
        and(
          eq(schema.classrooms.campusId, campusId),
          eq(schema.classrooms.isActive, true),
        ),
      )
      .orderBy(asc(schema.classrooms.name))

    return rows.map((r) => ({
      id: r.id,
      campusId: r.campusId,
      name: r.name,
      roomNumber: r.roomNumber,
      safeCapacity: r.safeCapacity,
      powerOutletsCount: r.powerOutletsCount,
      isActive: r.isActive,
    }))
  },

  /**
   * Get all active programme enrolments for a student
   */
  async getStudentProgrammeEnrolments(studentId: string) {
    const db = getDrizzleDb()
    return db
      .select({
        enrolment: schema.programmeEnrolments,
        programme: schema.academicProgrammes,
        pathway: schema.programmePathways,
        cohort: schema.cohorts,
      })
      .from(schema.programmeEnrolments)
      .innerJoin(
        schema.academicProgrammes,
        eq(schema.programmeEnrolments.programmeId, schema.academicProgrammes.id),
      )
      .leftJoin(
        schema.programmePathways,
        eq(schema.programmeEnrolments.pathwayId, schema.programmePathways.id),
      )
      .leftJoin(
        schema.cohorts,
        eq(schema.programmeEnrolments.cohortId, schema.cohorts.id),
      )
      .where(eq(schema.programmeEnrolments.studentId, studentId))
      .orderBy(desc(schema.programmeEnrolments.createdAt))
  },
}
