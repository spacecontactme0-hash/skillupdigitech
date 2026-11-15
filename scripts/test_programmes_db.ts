import { programmesDb } from "../lib/programmes-db"
import { closePool } from "../db/client"

async function main() {
  console.log("Testing programmesDb client...")

  const progs = await programmesDb.getProgrammes()
  console.log(`✓ Fetched ${progs.length} programmes:`, progs.map(p => p.code).join(", "))

  const pathways = await programmesDb.getPathways()
  console.log(`✓ Fetched ${pathways.length} pathways:`, pathways.map(p => p.code).join(", "))

  const campuses = await programmesDb.getCampuses()
  console.log(`✓ Fetched ${campuses.length} campuses:`, campuses.map(c => c.name).join(", "))

  const cohorts = await programmesDb.getCohorts()
  console.log(`✓ Fetched ${cohorts.length} cohorts:`, cohorts.map(c => c.code).join(", "))

  const foundations = await programmesDb.getFoundationCourses()
  console.log(`✓ Fetched ${foundations.length} foundation courses:`, foundations.map(f => f.code).join(", "))

  const sePathway = pathways.find(p => p.code === "SOFTWARE_ENGINEER")
  if (sePathway) {
    const seCourses = await programmesDb.getProgrammeCourses(sePathway.programmeId, sePathway.id)
    console.log(`✓ Software Engineer curriculum (${seCourses.length} courses):`, seCourses.map(c => `${c.course.code} (${c.courseRole})`).join(", "))
  }

  await closePool()
  console.log("All programmesDb queries succeeded.")
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
