import { getPool, closePool } from "../db/client"

async function main() {
  const pool = getPool()
  try {
    console.log("=== PHASE 2 DATABASE STATE VERIFICATION ===")

    // Programmes
    const progs = await pool.query(`SELECT id, code, name, type, allowed_delivery_modes FROM academic_programmes;`)
    console.log(`\nAcademic Programmes (${progs.rows.length}):`)
    progs.rows.forEach(r => console.log(` - [${r.code}] ${r.name} (${r.type}) -> Modes: ${JSON.stringify(r.allowed_delivery_modes)}`))

    // Pathways
    const paths = await pool.query(`SELECT id, code, name FROM programme_pathways;`)
    console.log(`\nCareer Pathways (${paths.rows.length}):`)
    paths.rows.forEach(r => console.log(` - [${r.code}] ${r.name}`))

    // Campuses & Classrooms
    const camps = await pool.query(`SELECT id, name, slug, address FROM campuses;`)
    console.log(`\nCampuses (${camps.rows.length}):`)
    camps.rows.forEach(r => console.log(` - ${r.name} (${r.slug}) at ${r.address}`))

    const rooms = await pool.query(`SELECT id, name, safe_capacity, power_outlets_count FROM classrooms;`)
    console.log(`\nClassrooms (${rooms.rows.length}):`)
    rooms.rows.forEach(r => console.log(` - ${r.name} (Safe Capacity: ${r.safe_capacity}, Power Drops: ${r.power_outlets_count})`))

    // Cohorts
    const cohs = await pool.query(`SELECT id, code, name, delivery_arrangement, max_capacity, fixed_timetable_summary FROM cohorts;`)
    console.log(`\nCohorts (${cohs.rows.length}):`)
    cohs.rows.forEach(r => console.log(` - [${r.code}] ${r.name} (${r.delivery_arrangement}) Max: ${r.max_capacity} | Timetable: ${r.fixed_timetable_summary}`))

    // Mappings
    const maps = await pool.query(`
      SELECT pc.course_role, pc.display_order, c.code, c.title, ap.code as prog_code, pp.code as path_code
      FROM programme_courses pc
      JOIN courses c ON pc.course_id = c.id
      JOIN academic_programmes ap ON pc.programme_id = ap.id
      LEFT JOIN programme_pathways pp ON pc.pathway_id = pp.id
      ORDER BY ap.code, pp.code NULLS FIRST, pc.display_order;
    `)
    console.log(`\nProgramme-Course Curriculum Mappings (${maps.rows.length}):`)
    maps.rows.forEach(r => console.log(` - ${r.prog_code} ${r.path_code ? '[' + r.path_code + '] ' : ''}-> ${r.code}: ${r.title} (${r.course_role})`))

  } finally {
    await closePool()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
