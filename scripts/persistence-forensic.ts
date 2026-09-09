/**
 * READ-ONLY FORENSIC: pre-ESS backup vs LIVE PRODUCTION employee field comparison.
 * Detects fields that had values in the backup but are empty/missing in production
 * (actual field-loss evidence). Values are MASKED (never printed in full).
 * Run: npx tsx scripts/persistence-forensic.ts
 */
import fs from 'fs';

const MASK = (v: any) => {
  if (v === undefined || v === null) return '∅';
  const s = String(v);
  if (!s.trim()) return '∅';
  return s.slice(0, 2) + '…(' + s.length + 'ch)';
};

const FIELDS = ['aadhaar_number', 'uan', 'bank_account', 'ifsc', 'qualification', 'total_experience', 'marital_status', 'blood_group', 'dob', 'esic_number', 'emergency_contact', 'gender', 'prev_company_name', 'vehicle_detail', 'shift_timing', 'location', 'pan', 'email', 'phone', 'bank_name', 'photo'];

const isEmpty = (v: any) => v === undefined || v === null || String(v).trim() === '';

async function main() {
  const backup = JSON.parse(fs.readFileSync('backups/full-backup-pre-ess-leave-security-20260909.json', 'utf-8'));
  const payload = backup.payload || backup;
  const bEmps: any[] = payload.employees || [];

  const res = await fetch('https://vetan-svn.vercel.app/api/employees');
  const pEmps: any[] = await res.json();
  console.log(`backup employees: ${bEmps.length} | production employees: ${pEmps.length}\n`);

  const pMap = new Map(pEmps.map((e: any) => [String(e.id).toUpperCase(), e]));
  let lossRows = 0, gainRows = 0, changedRows = 0;
  const lossByField: Record<string, number> = {};
  const lossByCompany: Record<string, number> = {};
  const lossDetails: string[] = [];

  for (const b of bEmps) {
    const p = pMap.get(String(b.id).toUpperCase());
    if (!p) { console.log(`? MISSING IN PROD: ${b.id} (${b.company})`); continue; }
    const losses: string[] = [], gains: string[] = [];
    for (const f of FIELDS) {
      const bv = b[f], pv = p[f];
      if (!isEmpty(bv) && isEmpty(pv)) { losses.push(`${f}[had ${MASK(bv)}]`); lossByField[f] = (lossByField[f] || 0) + 1; }
      else if (isEmpty(bv) && !isEmpty(pv)) { gains.push(f); }
      else if (!isEmpty(bv) && !isEmpty(pv) && String(bv) !== String(p[f])) { changedRows++; }
    }
    if (losses.length) {
      lossRows++;
      lossByCompany[b.company] = (lossByCompany[b.company] || 0) + 1;
      if (lossDetails.length < 25) lossDetails.push(`${b.id} (${b.company}): ${losses.join(', ')}`);
    }
    if (gains.length) gainRows++;
  }

  console.log(`=== FIELD-LOSS (backup had value → prod empty) ===`);
  console.log(`employees with ≥1 lost field: ${lossRows}`);
  console.log(`per-field counts:`, JSON.stringify(lossByField));
  console.log(`per-company counts:`, JSON.stringify(lossByCompany));
  console.log(`employees with NEW values (prod gained): ${gainRows}`);
  console.log(`employees with value CHANGES (both non-empty, different): ${changedRows}`);
  console.log(`\n=== sample loss rows (masked, max 25) ===`);
  lossDetails.forEach(d => console.log(' ', d));

  // Sakar-III specific rollup
  const s3 = bEmps.filter((e: any) => e.company === 'Sakar-III');
  const s3Loss = lossDetails.filter((d: string) => d.includes('Sakar-III')).length;
  console.log(`\nSakar-III: ${s3.length} employees in backup; ${s3Loss} in sample loss rows (see per-company counts for full number)`);
}
main().catch(e => { console.error('FORENSIC-FAIL', e); process.exit(1); });
