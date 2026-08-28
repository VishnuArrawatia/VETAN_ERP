import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const pdfPath = 'D:\\c drive\\Downloads\\SVN GROUP OF COMPANY PROFILE.pdf';
const outputDir = path.join(process.cwd(), 'public', 'images');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function extractPages() {
  console.log('Starting PDF extraction with file protocol...');
  const browser = await puppeteer.launch({ 
    headless: true, 
    args: ['--no-sandbox', '--allow-file-access-from-files'] 
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 900 });

  const pdfUrl = 'file:///' + pdfPath.replace(/\\/g, '/');
  console.log('Loading:', pdfUrl);
  
  // Use page.goto with the PDF file
  const response = await page.goto(pdfUrl, { waitUntil: 'load', timeout: 120000 });
  console.log('PDF loaded, status:', response.status());
  
  // Wait for Chrome PDF viewer
  await new Promise(r => setTimeout(r, 5000));
  
  // Get page content to understand what's rendering
  const title = await page.title();
  console.log('Page title:', title);
  
  // Take a screenshot of whatever is showing
  await page.screenshot({ path: path.join(outputDir, 'pdf_viewer.png'), fullPage: false });
  console.log('Saved viewer screenshot');

  // Try to get the page count from Chrome PDF viewer
  const pageInfo = await page.evaluate(() => {
    const embed = document.querySelector('embed');
    const input = document.querySelector('#pageNumber');
    return {
      embedExists: !!embed,
      inputExists: !!input,
      inputValue: input?.value,
      inputMax: input?.getAttribute('max'),
      bodyHTML: document.body?.innerHTML?.substring(0, 500)
    };
  });
  console.log('Page info:', JSON.stringify(pageInfo, null, 2));

  // Navigate to specific pages and screenshot
  for (let i = 1; i <= 20; i++) {
    try {
      // Set page number
      const navigated = await page.evaluate(async (num) => {
        const input = document.querySelector('#pageNumber');
        if (input) {
          // Clear and type new value
          input.value = '';
          input.focus();
          input.value = String(num);
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13 }));
          input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13 }));
          return true;
        }
        return false;
      }, i);
      
      if (!navigated) {
        console.log('No page input found, breaking');
        break;
      }
      
      await new Promise(r => setTimeout(r, 2000));
      
      const filename = `page_${String(i).padStart(2, '0')}.png`;
      await page.screenshot({ path: path.join(outputDir, filename) });
      
      // Check file size to see if page actually changed
      const stats = fs.statSync(path.join(outputDir, filename));
      console.log(`Page ${i}: ${filename} (${(stats.size/1024).toFixed(0)}KB)`);
    } catch (e) {
      console.log(`Page ${i} error:`, e.message);
    }
  }

  await browser.close();
  console.log('Done!');
}

extractPages().catch(e => console.error('FATAL:', e.message));
