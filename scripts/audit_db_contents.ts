import { getPool } from '../db/client';
import { ensureEnvironmentLoaded } from './seed-technology-catalog';

ensureEnvironmentLoaded();
const pool = getPool();

async function main() {
  try {
    const coursesRes = await pool.query('SELECT id, title, slug, category, published, approved FROM courses');
    console.log('Courses count:', coursesRes.rows.length);
    console.log('Courses:', JSON.stringify(coursesRes.rows, null, 2));

    const usersRes = await pool.query('SELECT id, email, role, name, email_verified FROM users');
    console.log('Users count:', usersRes.rows.length);
    console.log('Users:', JSON.stringify(usersRes.rows, null, 2));

    const enrollRes = await pool.query('SELECT id, user_id, course_id, status FROM enrollments');
    console.log('Enrollments count:', enrollRes.rows.length);

    const paymentsRes = await pool.query('SELECT id, user_id, course_id, amount, status, reference FROM payments LIMIT 5');
    console.log('Payments count:', paymentsRes.rows.length);

    const categoriesRes = await pool.query('SELECT id, name FROM categories');
    console.log('Categories count:', categoriesRes.rows.length);

    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err);
    process.exit(1);
  }
}

main();
