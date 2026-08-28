import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const SERVER = 'http://localhost:3001';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  console.log('Starting browser...');
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1400, height: 900 } });
  const page = await browser.newPage();

  // 1. Login Screen
  console.log('1. Capturing Login Screen...');
  await page.goto(SERVER, { waitUntil: 'networkidle0' });
  await sleep(1000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-login-screen.png'), fullPage: false });
  console.log('   ✅ Login screen captured');

  // 2. Login as Admin
  console.log('2. Logging in as admin...');
  await page.type('input[placeholder="Enter username"]', 'admin');
  await page.type('input[placeholder="Enter password"]', 'admin123');
  await page.click('button:has-text("Login")');
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-dashboard-admin.png'), fullPage: false });
  console.log('   ✅ Admin dashboard captured');

  // 3. Worker Master
  console.log('3. Opening Worker Master...');
  const workerBtn = await page.$$('button');
  for (const btn of workerBtn) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Worker Master')) { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-worker-master.png'), fullPage: false });
  console.log('   ✅ Worker Master captured');

  // 4. Search a worker
  console.log('4. Searching a worker...');
  const inputs = await page.$$('input[type="text"]');
  for (const inp of inputs) {
    const ph = await inp.evaluate(el => el.placeholder || '');
    if (ph.includes('Search')) { await inp.type('SV2PBHA001'); break; }
  }
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-worker-search.png'), fullPage: false });
  console.log('   ✅ Worker search captured');

  // 5. Attendance
  console.log('5. Opening Attendance...');
  const allBtns2 = await page.$$('button');
  for (const btn of allBtns2) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Attendance')) { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-attendance.png'), fullPage: false });
  console.log('   ✅ Attendance captured');

  // 6. Leave Control
  console.log('6. Opening Leave Control...');
  const allBtns3 = await page.$$('button');
  for (const btn of allBtns3) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Leave Control')) { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-leave-control.png'), fullPage: false });
  console.log('   ✅ Leave Control captured');

  // 7. Wage History
  console.log('7. Opening Wage History...');
  const allBtns4 = await page.$$('button');
  for (const btn of allBtns4) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Wage History')) { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-wage-history-empty.png'), fullPage: false });
  console.log('   ✅ Wage History (empty) captured');

  // Search worker in wage history
  console.log('7b. Searching worker in wage history...');
  const wageInputs = await page.$$('input[type="text"]');
  for (const inp of wageInputs) {
    const ph = await inp.evaluate(el => el.placeholder || '');
    if (ph.includes('SV2PBHA')) { await inp.type('SV2PBHA001'); break; }
  }
  const searchBtns = await page.$$('button');
  for (const btn of searchBtns) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.trim() === 'Search') { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-wage-history-data.png'), fullPage: false });
  console.log('   ✅ Wage History (with data) captured');

  // 8. Increments
  console.log('8. Opening Increments...');
  const allBtns5 = await page.$$('button');
  for (const btn of allBtns5) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Increments')) { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-increments.png'), fullPage: false });
  console.log('   ✅ Increments captured');

  // 9. Attrition Report
  console.log('9. Opening Attrition Report...');
  const allBtns6 = await page.$$('button');
  for (const btn of allBtns6) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Attrition')) { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-attrition-report.png'), fullPage: false });
  console.log('   ✅ Attrition Report captured');

  // 10. Reports
  console.log('10. Opening Reports...');
  const allBtns7 = await page.$$('button');
  for (const btn of allBtns7) {
    const text = await btn.evaluate(el => el.textContent);
    if (text === 'Reports') { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-reports.png'), fullPage: false });
  console.log('   ✅ Reports captured');

  // 11. Leave Control - Apply Leave Modal
  console.log('11. Opening Leave Control for apply...');
  const allBtns8 = await page.$$('button');
  for (const btn of allBtns8) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Leave Control')) { await btn.click(); break; }
  }
  await sleep(2000);

  // Click Apply Leave button for first worker
  const applyBtns = await page.$$('button');
  for (const btn of applyBtns) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Apply Leave')) { await btn.click(); break; }
  }
  await sleep(1500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-leave-apply-modal.png'), fullPage: false });
  console.log('   ✅ Leave Apply Modal captured');

  // Close modal
  const closeBtns = await page.$$('button');
  for (const btn of closeBtns) {
    const ariaLabel = await btn.evaluate(el => el.getAttribute('aria-label') || '');
    const text = await btn.evaluate(el => el.textContent);
    if (text.trim() === '' || ariaLabel === 'Close') { await btn.click(); break; }
  }
  await sleep(1000);

  // 12. User Management (Admin only)
  console.log('12. Opening User Management...');
  const allBtns9 = await page.$$('button');
  for (const btn of allBtns9) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('User Management')) { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-user-management.png'), fullPage: false });
  console.log('   ✅ User Management captured');

  // 13. Import Data
  console.log('13. Opening Import Data...');
  const allBtns10 = await page.$$('button');
  for (const btn of allBtns10) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Import')) { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-import-data.png'), fullPage: false });
  console.log('   ✅ Import Data captured');

  // Now logout and login as HR to show HR view
  console.log('14. Logging out and login as HR...');
  const logoutBtns = await page.$$('button[title="Logout"]');
  if (logoutBtns.length > 0) { await logoutBtns[0].click(); }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '15-logout-login.png'), fullPage: false });

  // Login as HR
  await page.type('input[placeholder="Enter username"]', 'hr_svn2');
  await page.type('input[placeholder="Enter password"]', 'Work@2026');
  const loginBtns = await page.$$('button');
  for (const btn of loginBtns) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Login')) { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '16-hr-dashboard.png'), fullPage: false });
  console.log('   ✅ HR Dashboard captured');

  // HR Worker Master
  console.log('15. HR Worker Master view...');
  const hrBtns = await page.$$('button');
  for (const btn of hrBtns) {
    const text = await btn.evaluate(el => el.textContent);
    if (text.includes('Worker Master')) { await btn.click(); break; }
  }
  await sleep(2000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '17-hr-worker-master.png'), fullPage: false });
  console.log('   ✅ HR Worker Master captured');

  await browser.close();
  console.log('\n✅ All screenshots captured in:', SCREENSHOTS_DIR);
}

main().catch(console.error);
