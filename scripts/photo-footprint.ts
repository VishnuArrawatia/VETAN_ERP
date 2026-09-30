/** PHOTO FOOTPRINT ANALYSIS (local backup only — read-only, no production calls). */
import fs from 'fs';

const raw = fs.readFileSync('backups/pre-retention-deploy-2026-09-27T19-12-46/full-store.json', 'utf-8');
const parsed = JSON.parse(raw);
const store = parsed.data || parsed;
const totalBytes = Buffer.byteLength(raw);

// find photo-ish fields across employees
const photoKeys = new Set<string>();
for (const e of store.employees || []) {
  for (const [k, v] of Object.entries(e || {})) {
    if (typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('data:application'))) {
      photoKeys.add(k);
    }
  }
}

let photoBytes = 0;
let photoCount = 0;
const sizes: number[] = [];
for (const e of store.employees || []) {
  for (const k of photoKeys) {
    const v = (e as any)[k];
    if (typeof v === 'string' && v.startsWith('data:image')) {
      const approx = Buffer.byteLength(v);
      photoBytes += approx;
      photoCount++;
      sizes.push(approx);
    }
  }
}
sizes.sort((a, b) => b - a);
const mb = (b: number) => (b / 1024 / 1024).toFixed(2) + ' MB';

console.log('=== PHOTO FOOTPRINT (local full-store backup) ===');
console.log(`store total: ${mb(totalBytes)}`);
console.log(`photo fields found: ${[...photoKeys].join(', ') || 'NONE'}`);
console.log(`employees with photo: ${photoCount} / ${(store.employees || []).length}`);
console.log(`total photo payload: ${mb(photoBytes)} (${((photoBytes / totalBytes) * 100).toFixed(1)}% of store)`);
if (sizes.length) {
  console.log(`largest photo: ${mb(sizes[0])} | median: ${mb(sizes[Math.floor(sizes.length / 2)])}`);
}

// what if ALL 107 employees upload a typical webcam/mobile photo?
const avg = sizes.length ? photoBytes / sizes.length : 0;
const typicalMobileKb = 120 * 1024; // ~120 KB compressed JPEG, 300x300
const scenarios = [
  ['avg current photo', avg || typicalMobileKb],
  ['compressed 300px (~120KB)', typicalMobileKb],
  ['uncompressed 2MB mobile click', 2 * 1024 * 1024]
];
console.log('\n=== SCENARIOS (all 107 employees) ===');
for (const [label, per] of scenarios as [string, number][]) {
  const total = per * 107;
  console.log(`${label}: ${mb(total)} (${((total / (500 * 1024 * 1024)) * 100).toFixed(1)}% of 500MB limit)`);
}

// payslips/attendance/other collections size share (for context)
console.log('\n=== STORE SIZE BREAKDOWN ===');
for (const [k, v] of Object.entries(store)) {
  if (Array.isArray(v)) {
    const b = Buffer.byteLength(JSON.stringify(v));
    if (b > 100 * 1024) console.log(`  ${k}: ${b} rows=${v.length} -> ${mb(b)}`);
  }
}
