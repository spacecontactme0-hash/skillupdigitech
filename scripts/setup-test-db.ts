import { Pool } from 'pg'

async function main() {
  const connectionString = process.env.TEST_POSTGRES_ADMIN_URL || 'postgresql://postgres:postgres@localhost:5432/postgres'
  const pool = new Pool({ connectionString })
  try {
    const res = await pool.query('SELECT datname FROM pg_database;')
    console.log('Databases:', res.rows.map(r => r.datname))
    
    if (!res.rows.some(r => r.datname === 'learnhub_test')) {
      await pool.query('CREATE DATABASE learnhub_test;')
      console.log('Created learnhub_test database!')
    } else {
      console.log('learnhub_test already exists.')
    }
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await pool.end()
  }
}

main()
