/**
 * ONE-TIME: set ALL employee ESS passwords to '1995' and force the
 * compulsory password-change flow on next login (per owner directive).
 *
 * HOW (safe by design):
 *  1. Downloads full store + saves a local safety copy first.
 *  2. PUTs ONLY {password, needs_password_change, session_epoch} per employee
 *     via /api/employees/:id (partial merge path). Hash = scrypt, unique salt
 *     per employee. Epoch bump revokes any existing sessions.
 *  3. Verifies a real ESS login with '1995' (expects 200 + needsPasswordChange).
 *
 * Run:            npx tsx scripts/set-ess-password-1995.ts            (dry run)
 * Actual update:  npx tsx scripts/set-ess-password-1995.ts --apply
 */
import fs from 'fs';
import path from 'path';
import { hashPassword } from '../server/auth';

const BASE = 'https://vetan-svn.vercel.app';
const H = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR', 'Content-Type': 'application/json' };
const APPLY = process.argv.includes('--apply');
const NEW_DEFAULT = '1995';

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const dir = path.join('backups', 'pre-ess-1995-' + stamp);
  fs.mkdirSync(dir, { recursive: true });

  // 1) Safety snapshot (also our source for session_epoch per employee)
  const r = await fetch(BASE + '/api/backup-json', { headers: H });
  if (!r.ok) { console.error('FATAL backup fetch', r.status); process.exit(1); }
  const storeText = await r.text();
  fs.writeFileSync(path.join(dir, 'pre-reset-store.json'), storeText);
  const store = (JSON.parse(storeText) || {}).data || JSON.parse(storeText);
  const emps: any[] = store.employees || [];
  console.log('[BACKUP] ' + path.join(dir, 'pre-reset-store.json'));
  console.log('[SCAN] employees: ' + emps.length);

  let ok = 0, fail = 0, skipped = 0;
  for (const e of emps) {
    const epoch = Number(e.session_epoch || 0) + 1;
    const body = JSON.stringify({
      password: hashPassword(NEW_DEFAULT),   // unique scrypt salt per employee
      needs_password_change: true,
      session_epoch: epoch
    });
    console.log('  ' + e.id + ' ' + (e.name || '') + ' (epoch ' + (epoch - 1) + ' -> ' + epoch + ')');
    if (!APPLY) { ok++; continue; }

    const res = await fetch(BASE + '/api/employees/' + encodeURIComponent(e.id), {
      method: 'PUT', headers: H, body
    });
    if (res.ok) ok++;
    else { fail++; console.log('    !! HTTP ' + res.status); }
    await new Promise(rr => setTimeout(rr, 700)); // gentle pace (OCC + persist per write)
  }

  console.log('\n=== RESULT (' + (APPLY ? 'APPLIED' : 'DRY RUN') + ') ===');
  console.log('updated: ' + ok + ' | failed: ' + fail);

  if (APPLY && ok > 0) {
    // 2) Verify: real ESS login with the new default (sample of 6 across companies)
    console.log('\n=== VERIFY (real ESS logins) ===');
    const sample = emps.filter(e => ['SVN-1', 'Sakar-I', 'Sakar-III', 'SVN-II', 'Flare-1', 'Zenivo-1'].includes(e.company)).slice(0, 6);
    let vok = 0;
    for (const e of sample) {
      const lr = await fetch(BASE + '/api/employee/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: e.id, password: NEW_DEFAULT })
      });
      const lj: any = await lr.json().catch(() => ({}));
      const good = lr.ok && lj.needsPasswordChange === true;
      if (good) vok++;
      console.log('  ' + e.id + ' -> HTTP ' + lr.status + (good ? ' + forced-change ✅' : ' (' + (lj.error || 'no forced-change flag') + ')'));
      await new Promise(rr => setTimeout(rr, 500));
    }
    console.log('verify: ' + vok + '/' + sample.length + ' logins OK with forced change');
  }
  if (!APPLY) console.log('Re-run with --apply to write changes.');
}
main().catch(e => { console.error('FATAL', e?.message || e); process.exit(1); });
