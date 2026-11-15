import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { getPool } from './db/client.js';
import { ensureEnvironmentLoaded } from './scripts/seed-technology-catalog.js';
import jwt from 'jsonwebtoken';

ensureEnvironmentLoaded();

const outDir = 'C:/Users/USER/.gemini/antigravity/brain/281b4160-2fd9-493c-b617-51f93f8bbe53/screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const pool = getPool();
  const res = await pool.query("SELECT * FROM users WHERE email = 'schmidtcarmenr@gmail.com' LIMIT 1");
  const user = res.rows[0];
  if (!user) {
    console.error("Student user not found!");
    process.exit(1);
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  console.log("Generated token for student:", user.email);

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome'
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  // Set auth cookie
  await context.addCookies([
    {
      name: 'token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax'
    }
  ]);

  const page = await context.newPage();

  // Initialize localStorage with auth and preference state
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ user, token }) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: true
        },
        token: token,
        hydrated: true,
        lastLogin: { email: user.email, name: user.name, role: user.role }
      },
      version: 0
    }));
    localStorage.setItem('preferences-storage', JSON.stringify({
      state: {
        currency: 'USD',
        currencySelected: true
      },
      version: 0
    }));
  }, { user, token });

  console.log("Injected localStorage auth state");

  // Capture student welcome page
  try {
    console.log("Navigating to /welcome/student...");
    await page.goto('http://localhost:3000/welcome/student', { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, '08_student_welcome.png'), fullPage: false });
    console.log("Saved 08_student_welcome.png");
  } catch (err) {
    console.error("Error capturing /welcome/student:", err.message);
  }

  // Capture dashboard
  try {
    console.log("Navigating to /dashboard...");
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, '09_student_dashboard.png'), fullPage: false });
    console.log("Saved 09_student_dashboard.png");
  } catch (err) {
    console.error("Error capturing /dashboard:", err.message);
  }

  // Capture clean home without currency modal
  try {
    console.log("Navigating to clean home...");
    await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '01_clean_home.png'), fullPage: false });
    console.log("Saved 01_clean_home.png");
  } catch (err) {
    console.error("Error capturing clean home:", err.message);
  }

  // Capture clean courses without currency modal
  try {
    console.log("Navigating to clean courses...");
    await page.goto('http://localhost:3000/courses', { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '02_clean_courses.png'), fullPage: false });
    console.log("Saved 02_clean_courses.png");
  } catch (err) {
    console.error("Error capturing clean courses:", err.message);
  }

  await browser.close();
  console.log("All student screenshots captured!");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
