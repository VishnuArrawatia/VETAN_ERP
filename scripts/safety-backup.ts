/** SAFETY-NET: download FULL production store to a local timestamped backup file (read-only action). */
import fs from 'fs';
import path from 'path';

const BASE = 'https://vetan-svn.vercel.app';
const H = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR' };

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.join('backups', `pre-retention-deploy-${stamp}`);
  fs.mkdirSync(dir, { recursive: true });

  // 1) Full store JSON (authoritative snapshot: employees, payslips, attendance, loans, etc.)
  const r = await fetch(BASE + '/api/backup-json', { headers: H });
  if (!r.ok) { console.error('FATAL: backup-json HTTP', r.status); process.exit(1); }
  const txt = await r.text();
  const file = path.join(dir, 'full-store.json');
  fs.writeFileSync(file, txt);
  let summary: any = {};
  try {
    const j = JSON.parse(txt);
    const d = j.data || j;
    const count = (k: string) => (Array.isArray(d[k]) ? d[k].length : 0);
    summary = {
      employees: count('employees'),
      payslips: count('payslips'),
      attendance: count('attendance'),
      payroll_runs: count('payroll_runs'),
      loans: count('loans'),
      leave_applications: count('leave_applications'),
      salary_revisions: count('salary_revisions'),
      users: count('users'),
      top_level_keys: Object.keys(j).slice(0, 8),
    };
  } catch { summary = { note: 'backup-json not JSON or different shape', bytes: txt.length }; }
  console.log(`[OK] full store -> ${file} (${(txt.length / 1024 / 1024).toFixed(2)} MB)`);
  console.log(JSON.stringify(summary, null, 2));

  // 2) Payslips per known months (salary-data safety net, small files)
  const months = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08'];
  for (const m of months) {
    try {
      const pr = await fetch(`${BASE}/api/payslips/month/${m}`, { headers: H });
      const pt = await pr.text();
      if (pr.ok) {
        const arr = JSON.parse(pt);
        fs.writeFileSync(path.join(dir, `payslips-${m}.json`), JSON.stringify(arr, null, 2));
        console.log(`[OK] payslips ${m}: ${Array.isArray(arr) ? arr.length : '?'} slips`);
      } else {
        console.log(`[--] payslips ${m}: HTTP ${pr.status} (skip)`);
      }
    } catch (e: any) { console.log(`[--] payslips ${m}: ${e?.message}`); }
  }
  console.log(`\nSafety backup complete: ${dir}`);
}
main().catch(e => { console.error('FATAL', e?.message || e); process.exit(1); });
