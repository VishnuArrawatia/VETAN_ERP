/**
 * RESUME: interrupted set-ess-password-1995 run — update ONLY employees that
 * still carry their pre-baseline state (password/needs_password_change/session_epoch
 * unchanged from backups/pre-ess-1995-2026-09-30T19-48-58).
 * Run: npx tsx scripts/resume-ess-1995.ts
 */
import fs from 'fs';

const BASE = 'https://vetan-svn.vercel.app';
const H = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR', 'Content-Type': 'application/json' };
const NEW_DEFAULT = '1995';
const BASELINE = 'backups/pre-ess-1995-2026-09-30T19-48-58/pre-reset-store.json';
const { hashPassword } = await import('../server/auth');

async function fetchStore(): Promise<any[]> {
  const r = await fetch(BASE + '/api/backup-json', { headers: H });
  if (!r.ok) throw new Error('backup-json HTTP ' + r.status);
  const j = await r.json();
  return ((j.data || j).employees || []);
}

async function main() {
  const pre = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const preData = pre.data || pre;
  const preMap = new Map<string, any>((preData.employees || []).map((e: any) => [e.id, e]));
  let live = await fetchStore();
  console.log('[RESUME] live employees: ' + live.length);

  const needsUpdate = live.filter((e: any) => {
    const p = preMap.get(e.id);
    if (!p) return false;
    return String(e.password || '') === String(p.password || '')
      && !!e.needs_password_change === !!p.needs_password_change
      && Number(e.session_epoch || 0) === Number(p.session_epoch || 0);
  });
  console.log('[RESUME] to update now: ' + needsUpdate.length);

  let ok = 0, fail = 0;
  for (const e of needsUpdate) {
    try {
      const res = await fetch(BASE + '/api/employees/' + encodeURIComponent(e.id), {
        method: 'PUT', headers: H,
        body: JSON.stringify({
          password: hashPassword(NEW_DEFAULT),
          needs_password_change: true,
          session_epoch: Number(e.session_epoch || 0) + 1
        })
      });
      if (res.ok) ok++; else { fail++; console.log('  !! ' + e.id + ' HTTP ' + res.status); }
    } catch (err: any) { fail++; console.log('  !! ' + e.id + ' ' + (err?.message || err)); }
    await new Promise(rr => setTimeout(rr, 650));
  }
  console.log('[RESUME] pass done: ok=' + ok + ' fail=' + fail);

  // Second sweep for any leftovers, then final verify
  live = await fetchStore();
  const remaining = live.filter((e: any) => {
    const p = preMap.get(e.id);
    return p && String(e.password || '') === String(p.password || '')
      && Number(e.session_epoch || 0) === Number(p.session_epoch || 0);
  });
  if (remaining.length) {
    console.log('[RESUME] leftover: ' + remaining.length + ' — retrying once');
    for (const e of remaining) {
      await fetch(BASE + '/api/employees/' + encodeURIComponent(e.id), {
        method: 'PUT', headers: H,
        body: JSON.stringify({
          password: hashPassword(NEW_DEFAULT),
          needs_password_change: true,
          session_epoch: Number(e.session_epoch || 0) + 1
        })
      }).then(r => console.log('  retry ' + e.id + ' -> ' + r.status));
      await new Promise(rr => setTimeout(rr, 650));
    }
  }

  // Final verify: count + sample logins
  live = await fetchStore();
  const done = live.filter((e: any) => e.needs_password_change === true && String(e.password || '').startsWith('scrypt$') && Number(e.session_epoch || 0) >= 1);
  console.log('[VERIFY] updated-state count: ' + done.length + '/' + live.length);
  const sample = ['SK3ST0001', 'SV1ST0070', 'SV2ST0001', 'FL1ST005', 'ZE1ST005', 'SK1ST0001'];
  for (const id of sample) {
    const lr = await fetch(BASE + '/api/employee/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId: id, password: NEW_DEFAULT })
    });
    const lj: any = await lr.json().catch(() => ({}));
    console.log('  login ' + id + ' -> ' + lr.status + (lj.needsPasswordChange ? ' + forced-change ✅' : ' (' + (lj.error || 'no flag') + ')'));
    await new Promise(rr => setTimeout(rr, 400));
  }
  console.log('[DONE]');
}
main().catch(e => { console.error('FATAL', e?.message || e); process.exit(1); });
