const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const screenshotsDir = path.join(__dirname, 'docs', 'screenshots');

async function captureScreenshots() {
    // Create screenshots directory
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1400, height: 900 }
    });

    const page = await browser.newPage();

    console.log('1. Capturing Login Page...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '01-login-page.png'), fullPage: false });

    console.log('2. Clicking Admin/HR Desk...');
    // Click on Admin/HR Desk button
    const hrButton = await page.$('button:has-text("Admin / HR Desk")') || 
                     await page.$('[class*="gold"]') ||
                     await page.$$('button');
    
    // Try to find and click the HR/Admin button
    const buttons = await page.$$('button');
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Admin')) {
            await btn.click();
            break;
        }
    }
    await page.waitForTimeout(1000);

    console.log('3. Capturing HR Login Form...');
    await page.screenshot({ path: path.join(screenshotsDir, '02-hr-login-form.png'), fullPage: false });

    // Login as HR
    console.log('4. Logging in as HR...');
    const inputs = await page.$$('input');
    if (inputs.length >= 2) {
        await inputs[0].type('vishnu');
        await inputs[1].type('admin123');
    }
    
    // Click login button
    const loginBtns = await page.$$('button');
    for (const btn of loginBtns) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && (text.includes('Sign In') || text.includes('Login'))) {
            await btn.click();
            break;
        }
    }
    await page.waitForTimeout(3000);

    console.log('5. Capturing Dashboard...');
    await page.screenshot({ path: path.join(screenshotsDir, '03-dashboard.png'), fullPage: false });

    console.log('6. Navigating to Employee Master...');
    const navButtons = await page.$$('button');
    for (const btn of navButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Employee Master')) {
            await btn.click();
            break;
        }
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '04-employee-master.png'), fullPage: false });

    console.log('7. Navigating to Attendance Register...');
    const navButtons2 = await page.$$('button');
    for (const btn of navButtons2) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Attendance')) {
            await btn.click();
            break;
        }
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '05-attendance.png'), fullPage: false });

    console.log('8. Navigating to Leave Management...');
    const navButtons3 = await page.$$('button');
    for (const btn of navButtons3) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Leave')) {
            await btn.click();
            break;
        }
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '06-leave-management.png'), fullPage: false });

    console.log('9. Navigating to Payroll Processor...');
    const navButtons4 = await page.$$('button');
    for (const btn of navButtons4) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Payroll')) {
            await btn.click();
            break;
        }
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '07-payroll.png'), fullPage: false });

    console.log('10. Navigating to Salary Revision...');
    const navButtons5 = await page.$$('button');
    for (const btn of navButtons5) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Salary')) {
            await btn.click();
            break;
        }
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '08-salary-revision.png'), fullPage: false });

    console.log('11. Navigating to Loan Management...');
    const navButtons6 = await page.$$('button');
    for (const btn of navButtons6) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Loan')) {
            await btn.click();
            break;
        }
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '09-loan-management.png'), fullPage: false });

    console.log('12. Capturing Employee ESS Login...');
    // Open new page for ESS login
    const essPage = await browser.newPage();
    await essPage.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await essPage.waitForTimeout(2000);
    
    // Click Employee ESS Portal button
    const essButtons = await essPage.$$('button');
    for (const btn of essButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Employee')) {
            await btn.click();
            break;
        }
    }
    await essPage.waitForTimeout(1000);
    await essPage.screenshot({ path: path.join(screenshotsDir, '10-ess-login.png'), fullPage: false });

    console.log('\n✅ All screenshots captured!');
    console.log('Location:', screenshotsDir);

    await browser.close();
}

captureScreenshots().catch(console.error);
