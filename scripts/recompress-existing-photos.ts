/**
 * ONE-TIME: recompress oversized employee photos ALREADY in production.
 *
 * HOW (safe by design):
 *  1. Downloads full store + saves a local safety copy (backups/pre-photo-recompress-<stamp>).
 *  2. Uses local puppeteer (Chrome canvas) to decode+resize each photo to
 *     max 400px JPEG q0.72 - the exact same transform the new upload path does.
 *  3. PUTs ONLY the photo field per employee via /api/employees/:id (server
 *     merge-safe path). Photos that fail to decode are LEFT UNTOUCHED.
 *  4. Before/after size report.
 *
 * Run:            npx tsx scripts/recompress-existing-photos.ts            (dry run)
 * Actual update:  npx tsx scripts/recompress-existing-photos.ts --apply
 */
import fs from 'fs';
import path from 'path';

const BASE = 'https://vetan-svn.vercel.app';
const H = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR', 'Content-Type': 'application/json' };
const APPLY = process.argv.includes('--apply');
const THRESHOLD = 60 * 1024; // only touch photos > 60 KB
const MAX_EDGE = 400;
const QUALITY = 0.72;

// Browser-side compressor, built as a string (runs inside puppeteer's page).
const COMPRESS_FN_SRC = [
  '(function(){',
  '  return async function compressPhoto(dataUrl) {',
  '    const img = await new Promise((res, rej) => {',
  '      const el = new Image();',
  '      el.onload = () => res(el);',
  '      el.onerror = () => rej(new Error("decode failed"));',
  '      el.src = dataUrl;',
  '    });',
  '    const scale = Math.min(1, ' + MAX_EDGE + ' / Math.max(img.width, img.height));',
  '    const w = Math.max(1, Math.round(img.width * scale));',
  '    const h = Math.max(1, Math.round(img.height * scale));',
  '    const c = document.createElement("canvas");',
  '    c.width = w; c.height = h;',
  '    c.getContext("2d").drawImage(img, 0, 0, w, h);',
  '    const out = c.toDataURL("image/jpeg", ' + QUALITY + ');',
  '    return out.length < dataUrl.length ? out : dataUrl;',
  '  };',
  '})'
].join('\n');

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.join('backups', 'pre-photo-recompress-' + stamp);
  fs.mkdirSync(dir, { recursive: true });

  // 1) Snapshot current production state
  const r = await fetch(BASE + '/api/backup-json', { headers: H });
  if (!r.ok) { console.error('FATAL backup fetch', r.status); process.exit(1); }
  const storeText = await r.text();
  fs.writeFileSync(path.join(dir, 'pre-recompress-store.json'), storeText);
  const store = JSON.parse(storeText).data || JSON.parse(storeText);
  console.log('[BACKUP] ' + path.join(dir, 'pre-recompress-store.json') + ' (' + (storeText.length / 1024 / 1024).toFixed(2) + ' MB)');

  // 2) Find oversized photos
  const targets: { id: string; name: string; photo: string; bytes: number }[] = [];
  let totalPhotoBytes = 0;
  for (const e of store.employees || []) {
    const p = (e as any).photo;
    if (typeof p === 'string' && p.startsWith('data:image')) {
      const bytes = Math.round((p.length - (p.indexOf(',') + 1)) * 0.75);
      totalPhotoBytes += bytes;
      if (bytes > THRESHOLD) targets.push({ id: e.id, name: e.name, photo: p, bytes });
    }
  }
  console.log('[SCAN] oversized photos (>60KB): ' + targets.length + ' | all-photo payload: ' + (totalPhotoBytes / 1024 / 1024).toFixed(2) + ' MB');
  if (targets.length === 0) { console.log('[DONE] nothing to do.'); return; }

  // 3) Set up canvas via puppeteer
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  await page.evaluate((fnSrc: string) => { (window as any).__compressFn = eval(fnSrc)(); }, COMPRESS_FN_SRC);

  // 4) Process each target
  let savedBytes = 0, okCount = 0, skipCount = 0;
  for (const t of targets.sort((a, b) => b.bytes - a.bytes)) {
    try {
      const compressed: string = await page.evaluate((d: string) => (window as any).__compressFn(d), t.photo);
      if (compressed === t.photo) {
        console.log('  SKIP ' + t.id + ' ' + t.name + ' (cannot compress further)');
        skipCount++; continue;
      }
      const newBytes = Math.round((compressed.length - (compressed.indexOf(',') + 1)) * 0.75);
      console.log('  ' + t.id + ' ' + t.name + ': ' + (t.bytes / 1024).toFixed(0) + ' KB -> ' + (newBytes / 1024).toFixed(0) + ' KB (-' + (100 - (newBytes / t.bytes) * 100).toFixed(0) + '%)');
      if (!APPLY) { savedBytes += (t.bytes - newBytes); okCount++; continue; }

      // Update ONLY the photo via the merge-safe API path
      const res = await fetch(BASE + '/api/employees/' + encodeURIComponent(t.id), {
        method: 'PUT', headers: H, body: JSON.stringify({ photo: compressed })
      });
      if (res.ok) { savedBytes += (t.bytes - newBytes); okCount++; }
      else { console.log('    !! HTTP ' + res.status + ' - left untouched'); skipCount++; }
      await new Promise(rr => setTimeout(rr, 800)); // gentle pace, avoid OCC stampede
    } catch (e: any) {
      console.log('  SKIP ' + t.id + ' ' + t.name + ': ' + (e?.message || e));
      skipCount++;
    }
  }
  await browser.close();

  console.log('\n=== RESULT (' + (APPLY ? 'APPLIED' : 'DRY RUN') + ') ===');
  console.log('processed OK: ' + okCount + ' | skipped: ' + skipCount);
  console.log('photo payload saved: ' + (savedBytes / 1024 / 1024).toFixed(2) + ' MB');
  if (!APPLY) console.log('Re-run with --apply to write changes.');
  else console.log('Next persist cycle will carry the smaller store automatically.');
}
main().catch(e => { console.error('FATAL', e?.message || e); process.exit(1); });
