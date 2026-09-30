import puppeteer from 'puppeteer';
const BASE = 'https://vetan-svn.vercel.app';
const H = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR' };
const r = await fetch(BASE + '/api/backup-json', { headers: H });
const _j = await r.json();
const store = _j.data || _j;
const photos = (store.employees || []).filter(e => typeof e.photo === 'string' && e.photo.startsWith('data:image'));
console.log('photos found:', photos.length);
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
let good = 0, bad = 0;
for (const e of photos) {
  try {
    const kb = Math.round((e.photo.length - e.photo.indexOf(',') - 1) * 0.75 / 1024);
    const dims = await page.evaluate(async (src) => {
      const img = await new Promise((res, rej) => {
        const el = new Image();
        el.onload = () => res({ w: el.naturalWidth, h: el.naturalHeight });
        el.onerror = () => rej(new Error('decode failed'));
        el.src = src;
      });
      return dims => dims; // noop
    }, e.photo).then(() => null).catch(err => err.message);
    // simpler: decode with dims
    const d = await page.evaluate(async (src) => {
      return await new Promise((res, rej) => {
        const el = new Image();
        el.onload = () => res({ w: el.naturalWidth, h: el.naturalHeight });
        el.onerror = () => rej(new Error('DECODE-FAILED'));
        el.src = src;
      });
    }, e.photo).catch(err => ({ err: err.message }));
    if (d && d.w) { good++; console.log(`  OK ${e.id} ${e.name} (${kb}KB, ${d.w}x${d.h})`); }
    else { bad++; console.log(`  FAIL ${e.id} ${e.name} (${kb}KB) -> ${d?.err || 'unknown'}`); }
  } catch (err) { bad++; console.log(`  FAIL ${e.id}: ${err.message}`); }
}
await browser.close();
console.log(`\nRESULT: ${good} OK, ${bad} FAILED`);
process.exit(bad === 0 ? 0 : 1);
