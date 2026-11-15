import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { getPool } from '../db/client';
import { ensureEnvironmentLoaded } from './seed-technology-catalog';
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

  console.log("Launching browser for student:", user.email);

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

  // Setup localStorage auth and preferences
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

  const targets = [
    { name: 'student_dashboard', url: 'http://localhost:3000/dashboard' },
    { name: 'student_courses', url: 'http://localhost:3000/dashboard/courses' },
    { name: 'student_onsite_training', url: 'http://localhost:3000/dashboard/onsite-training' },
    { name: 'student_certificates', url: 'http://localhost:3000/dashboard/certificates' },
    { name: 'student_profile', url: 'http://localhost:3000/dashboard/profile' },
    { name: 'student_otp', url: 'http://localhost:3000/verify-otp?email=schmidtcarmenr%40gmail.com&role=student' }
  ];

  for (const t of targets) {
    try {
      console.log(`Navigating to ${t.url}...`);
      await page.goto(t.url, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(3000);
      const filePath = path.join(outDir, `${t.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved ${t.name}.png`);
    } catch (err) {
      console.error(`Error capturing ${t.name}:`, err.message);
    }
  }

  await browser.close();
  console.log("All student page snapshots completed!");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal:", err);
  process.exit(1);
});
