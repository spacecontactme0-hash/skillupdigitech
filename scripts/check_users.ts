import { getPool } from '../db/client';
import { ensureEnvironmentLoaded } from './seed-technology-catalog';

ensureEnvironmentLoaded();
const pool = getPool();

async function main() {
  try {
    const res = await pool.query('SELECT id, email, role, name FROM users LIMIT 10');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
