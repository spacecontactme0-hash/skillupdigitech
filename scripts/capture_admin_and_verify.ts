import { chromium } from 'playwright';
import fs from 'fs';
import { getPool } from '../db/client';
import { ensureEnvironmentLoaded } from './seed-technology-catalog';
import jwt from 'jsonwebtoken';

ensureEnvironmentLoaded();

const outDir = 'C:/Users/USER/.gemini/antigravity/brain/281b4160-2fd9-493c-b617-51f93f8bbe53/screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function main() {
  const pool = getPool();
  const resAdmin = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
  const adminUser = resAdmin.rows[0];
  if (!adminUser) {
    console.error("Admin user not found!");
    process.exit(1);
  }

  const resInstructor = await pool.query("SELECT * FROM users WHERE role = 'instructor' LIMIT 1");
  const instructorUser = resInstructor.rows[0] || adminUser;

  const adminToken = jwt.sign(
    { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  const instructorToken = jwt.sign(
    { userId: instructorUser.id, email: instructorUser.email, role: instructorUser.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  console.log("Launching browser for visual audit captures...");

  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome'
  });

  // 1. Capture Public Pages (Home with Dual Pathways & Verify Portal)
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    // Initial load to set localStorage
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.setItem('preferences-storage', JSON.stringify({
        state: { currency: 'NGN', currencySelected: true },
        version: 0
      }));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Scroll to Dual Pathways section
    await page.evaluate(() => {
      const el = document.getElementById('programmes');
      if (el) el.scrollIntoView({ behavior: 'instant' });
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${outDir}/10_skillup_home_dual_pathways.png`, fullPage: false });
    console.log("Captured 10_skillup_home_dual_pathways.png");

    await page.goto('http://localhost:3000/verify', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Verify a Certificate', { timeout: 30000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${outDir}/11_certificate_verify_portal.png`, fullPage: false });
    console.log("Captured 11_certificate_verify_portal.png");

    await context.close();
  }

  // 2. Capture Admin Console Pages
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([
      {
        name: 'token',
        value: adminToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax'
      }
    ]);

    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    await page.goto('http://localhost:3000/admin', { waitUntil: 'domcontentloaded' });
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
        state: { currency: 'NGN', currencySelected: true },
        version: 0
      }));
    }, { user: adminUser, token: adminToken });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Admin Dashboard', { timeout: 30000 });
    await page.waitForTimeout(1500);

    // Navigate to Campuses & Labs via sidebar click
    console.log("Clicking Campuses & Labs...");
    await page.click('a[href="/admin/campuses"]');
    await page.waitForSelector('text=Enugu Main Learning Centre', { timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${outDir}/12_admin_campuses_labs.png`, fullPage: false });
    console.log("Captured 12_admin_campuses_labs.png");

    // Navigate to Cohorts & Timetables via sidebar click
    console.log("Clicking Cohorts & Timetables...");
    await page.click('a[href="/admin/cohorts"]');
    await page.waitForSelector('text=Fixed Timetable', { timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${outDir}/13_admin_cohorts_timetables.png`, fullPage: false });
    console.log("Captured 13_admin_cohorts_timetables.png");

    // Navigate to Tuition Installments via Payments link
    console.log("Navigating to Payments and clicking Tuition Installments...");
    await page.click('a[href="/admin/payments"]');
    await page.waitForSelector('text=Tuition Installments', { timeout: 30000 });
    await page.click('a[href="/admin/payments/installments"]');
    await page.waitForSelector('text=Tuition Installment Tracking', { timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${outDir}/14_admin_tuition_installments.png`, fullPage: false });
    console.log("Captured 14_admin_tuition_installments.png");

    await context.close();
  }

  // 3. Capture Instructor Attendance Console
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addCookies([
      {
        name: 'token',
        value: instructorToken,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax'
      }
    ]);

    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    await page.goto('http://localhost:3000/instructor', { waitUntil: 'domcontentloaded' });
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
        state: { currency: 'NGN', currencySelected: true },
        version: 0
      }));
    }, { user: instructorUser, token: instructorToken });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    console.log("Navigating to Instructor Attendance Console...");
    await page.goto('http://localhost:3000/instructor/attendance', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Class Attendance Console', { timeout: 30000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${outDir}/15_instructor_attendance_roster.png`, fullPage: false });
    console.log("Captured 15_instructor_attendance_roster.png");

    await context.close();
  }

  console.log("All visual audit snapshots captured successfully!");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Error capturing snapshots:", err);
  process.exit(1);
});
