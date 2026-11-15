import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/USER/.gemini/antigravity/brain/281b4160-2fd9-493c-b617-51f93f8bbe53/screenshots';
fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('Launching Chrome via Playwright...');
  const browser = await chromium.launch({
    headless: true,
    channel: 'chrome'
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const routes = [
    { name: '01_home_hero', url: 'http://localhost:3000/' },
    { name: '02_courses_catalog', url: 'http://localhost:3000/courses' },
    { name: '03_login_page', url: 'http://localhost:3000/login' },
    { name: '04_register_page', url: 'http://localhost:3000/register' },
    { name: '05_register_online', url: 'http://localhost:3000/register-online' },
    { name: '06_register_onsite', url: 'http://localhost:3000/register-onsite' },
    { name: '07_checkout', url: 'http://localhost:3000/checkout' }
  ];

  for (const r of routes) {
    try {
      console.log(`Navigating to ${r.url}...`);
      await page.goto(r.url, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(2000);
      const filePath = path.join(outDir, `${r.name}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`Saved screenshot: ${filePath}`);
    } catch (err) {
      console.error(`Error capturing ${r.name}:`, err.message);
    }
  }

  // Also full page home
  try {
    console.log('Navigating to full home...');
    await page.goto('http://localhost:3000/', { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2000);
    const fullHomePath = path.join(outDir, '01_home_full.png');
    await page.screenshot({ path: fullHomePath, fullPage: true });
    console.log(`Saved full screenshot: ${fullHomePath}`);
  } catch (err) {
    console.error('Error capturing full home:', err.message);
  }

  await browser.close();
  console.log('Audit capture complete!');
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
