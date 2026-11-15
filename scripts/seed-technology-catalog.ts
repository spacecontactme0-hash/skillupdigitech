/**
 * SkillUp Digitech Academy — Master Technology & Academic Catalog Seeder
 *
 * Implements Phase 2 Requirements:
 * 1. Safe, non-destructive, idempotent execution with --dry-run support.
 * 2. Seeds the 10 Approved Master Courses with course codes and foundation flags.
 * 3. Seeds Academic Programmes (Career Readiness & Skill Acquisition).
 * 4. Seeds Career Pathways (AI Engineer, Software Engineer, Social Media Management).
 * 5. Seeds Physical Campus (Enugu Main Centre) and Classrooms (Lab 1 & Lab 2).
 * 6. Seeds Initial Technology Cohorts (Hybrid & Online).
 * 7. Seeds Programme-to-Course Mappings (foundation, core, supporting, elective).
 * 8. Preserves all existing user records, categories, and past data.
 */

import fs from "fs"
import path from "path"
import { getPool, closePool } from "../db/client"

function loadEnvFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      const lines = fs.readFileSync(filePath, "utf-8").split("\n")
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith("#")) {
          const idx = trimmed.indexOf("=")
          if (idx > 0) {
            const key = trimmed.slice(0, idx).trim()
            const val = trimmed.slice(idx + 1).trim()
            if (!process.env[key]) {
              process.env[key] = val.replace(/^["']|["']$/g, "")
            }
          }
        }
      }
    }
  } catch {}
}

export function ensureEnvironmentLoaded() {
  loadEnvFile(path.resolve(".env.local"))
  loadEnvFile(path.resolve(".env"))
}

export const APPROVED_MASTER_COURSES = [
  {
    code: "BDL-101",
    title: "Basic Digital Literacy",
    slug: "basic-digital-literacy",
    category: "Software Engineering Fundamentals",
    level: "beginner",
    priceNgn: 0,
    priceUsd: 0,
    priceGbp: 0,
    isFoundationCourse: true,
    description:
      "Essential digital fundamentals: modern operating systems, cloud storage, file organization, online collaboration tools, and cybersecurity hygiene for modern digital learners.",
    thumbnail: "/images/courses/digital-literacy.png",
  },
  {
    code: "AI-101",
    title: "Basic AI 101",
    slug: "basic-ai-101",
    category: "Artificial Intelligence & Machine Learning",
    level: "beginner",
    priceNgn: 0,
    priceUsd: 0,
    priceGbp: 0,
    isFoundationCourse: true,
    description:
      "Practical introduction to generative artificial intelligence, prompt engineering, AI safety, ethical AI practices, and leveraging modern AI assistants for productivity and technical work.",
    thumbnail: "/images/courses/ai-101.png",
  },
  {
    code: "AIE-201",
    title: "AI Engineering",
    slug: "ai-engineering",
    category: "Artificial Intelligence & Machine Learning",
    level: "advanced",
    priceNgn: 150000,
    priceUsd: 150,
    priceGbp: 120,
    isFoundationCourse: false,
    description:
      "Build and deploy production-ready AI applications: Large Language Model (LLM) fine-tuning, Retrieval-Augmented Generation (RAG), vector databases, PyTorch fundamentals, and model serving.",
    thumbnail: "/images/courses/ai-engineering.png",
  },
  {
    code: "AIA-201",
    title: "AI Automation",
    slug: "ai-automation",
    category: "Artificial Intelligence & Machine Learning",
    level: "intermediate",
    priceNgn: 120000,
    priceUsd: 120,
    priceGbp: 95,
    isFoundationCourse: false,
    description:
      "Design intelligent automated business workflows, multi-agent autonomous systems, webhook integrations, Zapier/n8n pipelines, and AI-driven API orchestrations.",
    thumbnail: "/images/courses/ai-automation.png",
  },
  {
    code: "FED-201",
    title: "Frontend Development",
    slug: "frontend-development",
    category: "Frontend Engineering",
    level: "intermediate",
    priceNgn: 120000,
    priceUsd: 120,
    priceGbp: 95,
    isFoundationCourse: false,
    description:
      "Modern client-side web engineering: HTML5, CSS3, modern JavaScript (ESNext), TypeScript, React 19, Next.js App Router, responsive layouts, Tailwind CSS, and web accessibility (a11y).",
    thumbnail: "/images/courses/frontend-dev.png",
  },
  {
    code: "BED-201",
    title: "Backend Development",
    slug: "backend-development",
    category: "Backend Engineering",
    level: "intermediate",
    priceNgn: 120000,
    priceUsd: 120,
    priceGbp: 95,
    isFoundationCourse: false,
    description:
      "Server-side systems architecture: Node.js, Express, RESTful and GraphQL APIs, PostgreSQL relational database modeling, Drizzle ORM, authentication, Redis caching, and Docker containers.",
    thumbnail: "/images/courses/backend-dev.png",
  },
  {
    code: "DM-201",
    title: "Digital Marketing",
    slug: "digital-marketing",
    category: "Digital Marketing & Analytics",
    level: "beginner",
    priceNgn: 90000,
    priceUsd: 90,
    priceGbp: 75,
    isFoundationCourse: false,
    description:
      "Strategic digital growth: search engine optimization (SEO), search engine marketing (SEM), performance ad campaigns (Meta & Google Ads), conversion funnel optimization, and Google Analytics 4.",
    thumbnail: "/images/courses/digital-marketing.png",
  },
  {
    code: "GD-201",
    title: "Graphic Design",
    slug: "graphic-design",
    category: "UI/UX & Product Design",
    level: "beginner",
    priceNgn: 90000,
    priceUsd: 90,
    priceGbp: 75,
    isFoundationCourse: false,
    description:
      "Visual identity and brand design: design principles, color theory, typography, Figma mastery, Adobe Photoshop, brand asset creation, and presentation graphics.",
    thumbnail: "/images/courses/graphic-design.png",
  },
  {
    code: "VE-201",
    title: "Video Editing",
    slug: "video-editing",
    category: "Creative Media & Production",
    level: "intermediate",
    priceNgn: 90000,
    priceUsd: 90,
    priceGbp: 75,
    isFoundationCourse: false,
    description:
      "Professional digital video editing and motion graphics: Adobe Premiere Pro, DaVinci Resolve, color grading, sound design, transitions, visual effects, and storytelling for modern digital platforms.",
    thumbnail: "/images/courses/video-editing.png",
  },
  {
    code: "SMM-201",
    title: "Social Media Management",
    slug: "social-media-management",
    category: "Digital Marketing & Analytics",
    level: "intermediate",
    priceNgn: 100000,
    priceUsd: 100,
    priceGbp: 80,
    isFoundationCourse: false,
    description:
      "Multi-channel audience building and brand stewardship: content calendaring, community engagement, brand voice, influencer collaboration, viral short-form video strategy, and ROI analytics.",
    thumbnail: "/images/courses/social-media.png",
  },
]

export async function runCatalogSeed(options: { dryRun?: boolean } = {}) {
  const isDryRun = options.dryRun ?? true
  const pool = getPool()

  console.log("=".repeat(70))
  console.log("SkillUp Digitech Academy — Academic & Technology Catalog Seeder")
  console.log(`Execution Mode: ${isDryRun ? "DRY RUN (Read-Only Simulation)" : "EXECUTE (Live Database Writes)"}`)
  console.log("=".repeat(70))

  try {
    // 1. Resolve an active instructor for course ownership
    const instructorRes = await pool.query(`
      SELECT id, name, email FROM users WHERE role = 'instructor' LIMIT 1;
    `)
    let instructorId: string
    let instructorName = "SkillUp Faculty Lead"

    if (instructorRes.rows.length > 0) {
      instructorId = instructorRes.rows[0].id
      instructorName = instructorRes.rows[0].name || instructorName
      console.log(`✓ Resolved faculty instructor: ${instructorName} (${instructorRes.rows[0].email})`)
    } else {
      // Fallback to admin if no instructor exists
      const adminRes = await pool.query(`SELECT id, name, email FROM users WHERE role = 'admin' LIMIT 1;`)
      if (adminRes.rows.length === 0) {
        throw new Error("No user records found to associate with master courses.")
      }
      instructorId = adminRes.rows[0].id
      instructorName = adminRes.rows[0].name || "Academy Administrator"
      console.log(`! No instructor found, defaulting course ownership to admin: ${instructorName}`)
    }

    // 2. Audit & Prepare Categories
    const categoriesSet = new Set(APPROVED_MASTER_COURSES.map(c => c.category))
    const existingCatsRes = await pool.query(`SELECT id, name FROM categories;`)
    const existingCatNames = new Set(existingCatsRes.rows.map(r => r.name.toLowerCase().trim()))

    const catsToInsert = Array.from(categoriesSet).filter(c => !existingCatNames.has(c.toLowerCase().trim()))
    console.log(`\n1. Category Taxonomy:`)
    console.log(`   - Existing in DB: ${existingCatsRes.rows.length}`)
    console.log(`   - To Provision: ${catsToInsert.length}`)

    // 3. Audit Master Courses
    const existingCoursesRes = await pool.query(`SELECT id, slug, code, title FROM courses;`)
    const existingCourseSlugs = new Set(existingCoursesRes.rows.map(r => r.slug))
    const coursesToInsert = APPROVED_MASTER_COURSES.filter(c => !existingCourseSlugs.has(c.slug))

    console.log(`\n2. Master Technology Courses:`)
    console.log(`   - Total Approved: ${APPROVED_MASTER_COURSES.length}`)
    console.log(`   - Already Present: ${APPROVED_MASTER_COURSES.length - coursesToInsert.length}`)
    console.log(`   - To Provision: ${coursesToInsert.length}`)

    // 4. Audit Academic Programmes
    const existingProgRes = await pool.query(`SELECT id, code FROM academic_programmes;`)
    const existingProgCodes = new Set(existingProgRes.rows.map(r => r.code))

    // 5. Audit Pathways
    const existingPathwaysRes = await pool.query(`SELECT id, code FROM programme_pathways;`)
    const existingPathwayCodes = new Set(existingPathwaysRes.rows.map(r => r.code))

    // 6. Audit Campus & Classrooms
    const existingCampusesRes = await pool.query(`SELECT id, slug FROM campuses;`)
    const existingCampusSlugs = new Set(existingCampusesRes.rows.map(r => r.slug))

    if (isDryRun) {
      console.log("\n[DRY RUN] Summary of Pending Operations:")
      console.log(` + ${catsToInsert.length} categories would be inserted`)
      console.log(` + ${coursesToInsert.length} technology master courses would be seeded`)
      console.log(` + Academic Programmes (CAREER_READINESS, SKILL_ACQUISITION) would be provisioned`)
      console.log(` + Career Pathways (AI_ENGINEER, SOFTWARE_ENGINEER, SOCIAL_MEDIA_MANAGEMENT) would be provisioned`)
      console.log(` + Enugu Main Learning Centre & Lab Classrooms would be provisioned`)
      console.log(` + Initial Hybrid & Online Cohorts would be provisioned`)
      console.log(` + Foundation course bundling mappings would be linked`)
      console.log("\nPass --execute to commit these changes to PostgreSQL.")
      return
    }

    // =========================================================================
    // EXECUTION PHASE (Transactional)
    // =========================================================================
    await pool.query("BEGIN;")

    // A. Insert missing categories
    for (const cat of catsToInsert) {
      const catId = crypto.randomUUID()
      await pool.query(
        `INSERT INTO categories (id, name, created_at, updated_at) VALUES ($1, $2, NOW(), NOW());`,
        [catId, cat]
      )
      console.log(`   ✓ Created category: "${cat}"`)
    }

    // B. Insert 10 Master Courses
    const courseIdMap: Record<string, string> = {}
    // First map existing courses
    existingCoursesRes.rows.forEach(r => {
      courseIdMap[r.slug] = r.id
    })

    for (const course of APPROVED_MASTER_COURSES) {
      if (courseIdMap[course.slug]) {
        // Course exists, update code and isFoundationCourse
        await pool.query(
          `UPDATE courses SET code = $1, is_foundation_course = $2, price_ngn = $3, price_usd = $4, price_gbp = $5 WHERE slug = $6;`,
          [course.code, course.isFoundationCourse, course.priceNgn, course.priceUsd, course.priceGbp, course.slug]
        )
        console.log(`   ↻ Updated master course attributes: ${course.code} — ${course.title}`)
      } else {
        const courseId = crypto.randomUUID()
        courseIdMap[course.slug] = courseId
        await pool.query(
          `INSERT INTO courses (
            id, title, slug, code, is_foundation_course, description, overview, category, level,
            instructor_id, instructor_name, price_ngn, price_usd, price_gbp, thumbnail,
            published, approved, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW());`,
          [
            courseId,
            course.title,
            course.slug,
            course.code,
            course.isFoundationCourse,
            course.description,
            JSON.stringify([
              "Comprehensive industry-standard syllabus",
              "Hands-on practical coding / creative exercises",
              "Instructor feedback and portfolio development",
              "Verifiable institutional certificate of completion",
            ]),
            course.category,
            course.level,
            instructorId,
            instructorName,
            course.priceNgn,
            course.priceUsd,
            course.priceGbp,
            course.thumbnail,
            true, // published
            true, // approved
          ]
        )
        console.log(`   ✓ Created master course: ${course.code} — ${course.title}`)
      }
    }

    // C. Insert Academic Programmes
    let careerProgId = ""
    let skillProgId = ""

    if (!existingProgCodes.has("CAREER_READINESS")) {
      careerProgId = crypto.randomUUID()
      await pool.query(
        `INSERT INTO academic_programmes (id, code, name, type, description, allowed_delivery_modes, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW());`,
        [
          careerProgId,
          "CAREER_READINESS",
          "Career Readiness Programme",
          "career_readiness",
          "Full professional career transformation pathways in Engineering and Digital Media, combining foundational courses, intensive specializations, and a final capstone.",
          JSON.stringify(["online", "hybrid"]),
          true,
        ]
      )
      console.log(`   ✓ Provisioned Programme: Career Readiness`)
    } else {
      const r = await pool.query(`SELECT id FROM academic_programmes WHERE code = 'CAREER_READINESS';`)
      careerProgId = r.rows[0].id
    }

    if (!existingProgCodes.has("SKILL_ACQUISITION")) {
      skillProgId = crypto.randomUUID()
      await pool.query(
        `INSERT INTO academic_programmes (id, code, name, type, description, allowed_delivery_modes, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW());`,
        [
          skillProgId,
          "SKILL_ACQUISITION",
          "Skill Acquisition Programme",
          "skill_acquisition",
          "Focused individual technology courses with complimentary Basic AI 101 and Basic Digital Literacy bundling. Online-first delivery with optional physical practical workshops.",
          JSON.stringify(["online"]),
          true,
        ]
      )
      console.log(`   ✓ Provisioned Programme: Skill Acquisition`)
    } else {
      const r = await pool.query(`SELECT id FROM academic_programmes WHERE code = 'SKILL_ACQUISITION';`)
      skillProgId = r.rows[0].id
    }

    // D. Insert Programme Pathways
    const pathwayMap: Record<string, string> = {}
    const pathways = [
      {
        code: "AI_ENGINEER",
        name: "AI Engineer",
        description: "Specialized pathway covering Machine Learning, LLMs, Vector Databases, and PyTorch deployment.",
      },
      {
        code: "SOFTWARE_ENGINEER",
        name: "Software Engineer",
        description: "Full-Stack Software Engineering pathway covering Frontend, Backend, Relational Architecture, and DevOps.",
      },
      {
        code: "SOCIAL_MEDIA_MANAGEMENT",
        name: "Social Media Management",
        description: "Comprehensive pathway covering Brand Strategy, Content Creation, Paid Ads, and Digital Analytics.",
      },
    ]

    for (const pw of pathways) {
      if (!existingPathwayCodes.has(pw.code)) {
        const pwId = crypto.randomUUID()
        pathwayMap[pw.code] = pwId
        await pool.query(
          `INSERT INTO programme_pathways (id, programme_id, code, name, description, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW());`,
          [pwId, careerProgId, pw.code, pw.name, pw.description]
        )
        console.log(`   ✓ Provisioned Career Pathway: ${pw.name}`)
      } else {
        const r = await pool.query(`SELECT id FROM programme_pathways WHERE code = $1;`, [pw.code])
        pathwayMap[pw.code] = r.rows[0].id
      }
    }

    // E. Insert Physical Campus & Classrooms
    let campusId = ""
    let lab1Id = ""
    let lab2Id = ""

    if (!existingCampusSlugs.has("enugu-main")) {
      campusId = crypto.randomUUID()
      await pool.query(
        `INSERT INTO campuses (id, name, slug, address, city, state, contact_phone, contact_email, facilities, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW());`,
        [
          campusId,
          "SkillUp Digitech Academy — Enugu Main Learning Centre",
          "enugu-main",
          "14 Garden Avenue, GRA, Enugu",
          "Enugu",
          "Enugu State",
          "09030910091",
          "enugu@skillup-digitech.com.ng",
          JSON.stringify(["electricity_backup", "solar_inverter", "student_wifi", "air_conditioning"]),
        ]
      )
      console.log(`   ✓ Provisioned Campus: Enugu Main Learning Centre`)

      // Classrooms
      lab1Id = crypto.randomUUID()
      await pool.query(
        `INSERT INTO classrooms (id, campus_id, name, room_number, safe_capacity, power_outlets_count, is_active, created_at)
         VALUES ($1, $2, 'Lab 1 - Turing Room', 'A-101', 30, 30, true, NOW());`,
        [lab1Id, campusId]
      )
      lab2Id = crypto.randomUUID()
      await pool.query(
        `INSERT INTO classrooms (id, campus_id, name, room_number, safe_capacity, power_outlets_count, is_active, created_at)
         VALUES ($1, $2, 'Lab 2 - Lovelace Room', 'B-102', 30, 30, true, NOW());`,
        [lab2Id, campusId]
      )
      console.log(`   ✓ Provisioned Classrooms: Lab 1 (30 seats) & Lab 2 (30 seats)`)
    } else {
      const r = await pool.query(`SELECT id FROM campuses WHERE slug = 'enugu-main';`)
      campusId = r.rows[0].id
      const cr = await pool.query(`SELECT id, name FROM classrooms WHERE campus_id = $1 LIMIT 2;`, [campusId])
      lab1Id = cr.rows[0]?.id || ""
      lab2Id = cr.rows[1]?.id || lab1Id
    }

    // F. Insert Initial Cohorts
    const cohortsToSeed = [
      {
        code: "SE-2026-Q1-HYB",
        name: "Software Engineer — Cohort 2026-Q1 (Hybrid)",
        programmeId: careerProgId,
        pathwayId: pathwayMap["SOFTWARE_ENGINEER"],
        delivery: "hybrid",
        campusId,
        classroomId: lab1Id,
        maxCapacity: 30,
        summary: "Wednesdays 17:00-19:00 Virtual, Saturdays 10:00-14:00 Physical Lab",
      },
      {
        code: "SE-2026-Q1-ONL",
        name: "Software Engineer — Cohort 2026-Q1 (Online)",
        programmeId: careerProgId,
        pathwayId: pathwayMap["SOFTWARE_ENGINEER"],
        delivery: "online",
        campusId: null,
        classroomId: null,
        maxCapacity: 100,
        summary: "Wednesdays 17:00-19:00 Virtual, Saturdays 10:00-12:00 Virtual Workshop",
      },
      {
        code: "AIE-2026-Q1-HYB",
        name: "AI Engineer — Cohort 2026-Q1 (Hybrid)",
        programmeId: careerProgId,
        pathwayId: pathwayMap["AI_ENGINEER"],
        delivery: "hybrid",
        campusId,
        classroomId: lab2Id,
        maxCapacity: 30,
        summary: "Tuesdays 17:00-19:00 Virtual, Saturdays 14:30-18:30 Physical Lab",
      },
      {
        code: "AIE-2026-Q1-ONL",
        name: "AI Engineer — Cohort 2026-Q1 (Online)",
        programmeId: careerProgId,
        pathwayId: pathwayMap["AI_ENGINEER"],
        delivery: "online",
        campusId: null,
        classroomId: null,
        maxCapacity: 100,
        summary: "Tuesdays 17:00-19:00 Virtual, Saturdays 14:30-16:30 Virtual Workshop",
      },
      {
        code: "SMM-2026-Q1-HYB",
        name: "Social Media Management — Cohort 2026-Q1 (Hybrid)",
        programmeId: careerProgId,
        pathwayId: pathwayMap["SOCIAL_MEDIA_MANAGEMENT"],
        delivery: "hybrid",
        campusId,
        classroomId: lab1Id,
        maxCapacity: 30,
        summary: "Thursdays 17:00-19:00 Virtual, Saturdays 10:00-14:00 Physical Lab",
      },
    ]

    for (const c of cohortsToSeed) {
      const existingCohort = await pool.query(`SELECT id FROM cohorts WHERE code = $1;`, [c.code])
      if (existingCohort.rows.length === 0) {
        await pool.query(
          `INSERT INTO cohorts (
            id, programme_id, pathway_id, code, name, delivery_arrangement, campus_id, default_classroom_id,
            max_capacity, start_date, end_date, status, fixed_timetable_summary, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '2026-03-01', '2026-06-30', 'enrolling', $10, NOW(), NOW());`,
          [
            crypto.randomUUID(),
            c.programmeId,
            c.pathwayId,
            c.code,
            c.name,
            c.delivery,
            c.campusId,
            c.classroomId,
            c.maxCapacity,
            c.summary,
          ]
        )
        console.log(`   ✓ Provisioned Cohort: ${c.code}`)
      }
    }

    // G. Map Programme Courses (Bundling logic)
    const bdlId = courseIdMap["basic-digital-literacy"]
    const ai101Id = courseIdMap["basic-ai-101"]

    // Mappings: [programmeId, pathwayId, courseId, role, displayOrder]
    const mappings: Array<{ progId: string; pathId: string | null; slug: string; role: string; order: number }> = [
      // Software Engineer Track
      { progId: careerProgId, pathId: pathwayMap["SOFTWARE_ENGINEER"], slug: "basic-digital-literacy", role: "foundation", order: 1 },
      { progId: careerProgId, pathId: pathwayMap["SOFTWARE_ENGINEER"], slug: "basic-ai-101", role: "foundation", order: 2 },
      { progId: careerProgId, pathId: pathwayMap["SOFTWARE_ENGINEER"], slug: "frontend-development", role: "core", order: 3 },
      { progId: careerProgId, pathId: pathwayMap["SOFTWARE_ENGINEER"], slug: "backend-development", role: "core", order: 4 },

      // AI Engineer Track
      { progId: careerProgId, pathId: pathwayMap["AI_ENGINEER"], slug: "basic-digital-literacy", role: "foundation", order: 1 },
      { progId: careerProgId, pathId: pathwayMap["AI_ENGINEER"], slug: "basic-ai-101", role: "foundation", order: 2 },
      { progId: careerProgId, pathId: pathwayMap["AI_ENGINEER"], slug: "ai-engineering", role: "core", order: 3 },
      { progId: careerProgId, pathId: pathwayMap["AI_ENGINEER"], slug: "ai-automation", role: "supporting", order: 4 },

      // Social Media Management Track
      { progId: careerProgId, pathId: pathwayMap["SOCIAL_MEDIA_MANAGEMENT"], slug: "basic-digital-literacy", role: "foundation", order: 1 },
      { progId: careerProgId, pathId: pathwayMap["SOCIAL_MEDIA_MANAGEMENT"], slug: "basic-ai-101", role: "foundation", order: 2 },
      { progId: careerProgId, pathId: pathwayMap["SOCIAL_MEDIA_MANAGEMENT"], slug: "social-media-management", role: "core", order: 3 },
      { progId: careerProgId, pathId: pathwayMap["SOCIAL_MEDIA_MANAGEMENT"], slug: "digital-marketing", role: "core", order: 4 },
      { progId: careerProgId, pathId: pathwayMap["SOCIAL_MEDIA_MANAGEMENT"], slug: "graphic-design", role: "supporting", order: 5 },
      { progId: careerProgId, pathId: pathwayMap["SOCIAL_MEDIA_MANAGEMENT"], slug: "video-editing", role: "supporting", order: 6 },

      // Skill Acquisition (Foundation courses linked + all electives)
      { progId: skillProgId, pathId: null, slug: "basic-digital-literacy", role: "foundation", order: 1 },
      { progId: skillProgId, pathId: null, slug: "basic-ai-101", role: "foundation", order: 2 },
      { progId: skillProgId, pathId: null, slug: "frontend-development", role: "elective", order: 3 },
      { progId: skillProgId, pathId: null, slug: "backend-development", role: "elective", order: 4 },
      { progId: skillProgId, pathId: null, slug: "ai-engineering", role: "elective", order: 5 },
      { progId: skillProgId, pathId: null, slug: "ai-automation", role: "elective", order: 6 },
      { progId: skillProgId, pathId: null, slug: "digital-marketing", role: "elective", order: 7 },
      { progId: skillProgId, pathId: null, slug: "graphic-design", role: "elective", order: 8 },
      { progId: skillProgId, pathId: null, slug: "video-editing", role: "elective", order: 9 },
      { progId: skillProgId, pathId: null, slug: "social-media-management", role: "elective", order: 10 },
    ]

    for (const m of mappings) {
      const cId = courseIdMap[m.slug]
      if (!cId) continue

      await pool.query(
        `INSERT INTO programme_courses (id, programme_id, pathway_id, course_id, course_role, display_order, is_mandatory, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
         ON CONFLICT (programme_id, pathway_id, course_id) DO NOTHING;`,
        [crypto.randomUUID(), m.progId, m.pathId, cId, m.role, m.order]
      )
    }
    console.log(`   ✓ Established ${mappings.length} Programme-Course curriculum mappings`)

    await pool.query("COMMIT;")
    console.log("\n" + "=".repeat(70))
    console.log("✓ PHASE 2 SEEDING COMPLETED SUCCESSFULLY IN POSTGRESQL")
    console.log("=".repeat(70))
  } catch (err) {
    await pool.query("ROLLBACK;")
    console.error("Seed execution failed, rolled back:", err)
    throw err
  } finally {
    await closePool()
  }
}

if (require.main === module) {
  ensureEnvironmentLoaded()
  const args = process.argv.slice(2)
  const isExecute = args.includes("--execute")
  const isDryRun = !isExecute || args.includes("--dry-run")

  runCatalogSeed({ dryRun: isDryRun })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
