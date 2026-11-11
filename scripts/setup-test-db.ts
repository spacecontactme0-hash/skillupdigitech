import { Pool } from 'pg'
import { validateTestDatabaseTarget, assertIsolatedTestDatabase } from '../tests/helpers/test-db-isolation'

async function main() {
  const adminUrl = process.env.TEST_POSTGRES_ADMIN_URL?.trim()
  if (!adminUrl) {
    console.error('CRITICAL: TEST_POSTGRES_ADMIN_URL environment variable is required to create or configure the test database.')
    console.error('Automatic fallbacks to default connections are disabled to prevent accidental connection to production.')
    process.exit(1)
  }

  const validation = validateTestDatabaseTarget(adminUrl, { isAdminOperation: true })
  if (!validation.isValid) {
    console.error('CRITICAL: TEST_POSTGRES_ADMIN_URL target was rejected for safety:', validation.error)
    process.exit(1)
  }

  const pool = new Pool({ connectionString: adminUrl })
  try {
    // Verify runtime connection identity matches approved administrative target before executing setup
    await assertIsolatedTestDatabase(pool, { target: adminUrl, isAdminOperation: true })

    const res = await pool.query('SELECT datname FROM pg_database;')
    console.log('Available databases on test instance:', res.rows.map(r => r.datname))
    
    if (!res.rows.some(r => r.datname === 'learnhub_test')) {
      await pool.query('CREATE DATABASE learnhub_test;')
      console.log('Successfully created isolated test database: learnhub_test')
    } else {
      console.log('Isolated test database learnhub_test already exists.')
    }
  } catch (err) {
    console.error('Error configuring test database:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
