import { getPool, closePool } from "../db/client"

async function main() {
  const pool = getPool()
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `)
    console.log("Current public tables in PostgreSQL (" + res.rows.length + "):")
    res.rows.forEach(r => console.log(" - " + r.table_name))
  } finally {
    await closePool()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
