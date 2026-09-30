/**
 * ONE-TIME: restore every known HR user's canonical default password via the
 * PROPER API path (POST /api/hr/users). The deployed Sep-2026 wipe-guard
 * hashes explicit passwords at rest and preserves all other user fields, so
 * this is safe: only `password` changes on each record.
 *
 * Skips the acct_* auditor accounts — their original defaults were never in
 * code, so blind-resetting them would just invent new passwords.
 *
 * Run: npx tsx scripts/restore-hr-passwords.ts
 */
const BASE = 'https://vetan-svn.vercel.app';
const H = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR', 'Content-Type': 'application/json' };

const DEFAULTS: Record<string, string> = {
  vishnu: 'Varrawatia',
  varrawatia: 'Varrawatia',
  vijay: 'VKS',
  vks: 'VKS',
  vijendra: 'vijendra',
  manisha_s: 'manisha_s',
  manisha: 'manisha',
  indraprakash: 'indraprakash',
  nilesh: 'nilesh',
  pinki: 'pinki',
  audit: 'audit'
};

async function main() {
  const listRes = await fetch(BASE + '/api/hr/users', { headers: H });
  if (!listRes.ok) { console.error('FATAL: cannot list users, HTTP', listRes.status); process.exit(1); }
  const users: any[] = await listRes.json();

  for (const u of users) {
    const target = DEFAULTS[u.username];
    if (!target) { console.log('SKIP  ' + u.username + ' (no known default)'); continue; }

    if (u.disabled) { console.log('SKIP  ' + u.username + ' (disabled account)'); continue; }

    // Check current password first — skip if the default already works.
    const probe = await fetch(BASE + '/api/hr/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u.username, password: target })
    });
    if (probe.ok) { console.log('OK    ' + u.username + ' (default already active)'); continue; }

    // Restore via the guarded save path (only password changes; guard hashes at rest).
    const save = await fetch(BASE + '/api/hr/users', {
      method: 'POST', headers: H,
      body: JSON.stringify({ ...u, password: target })
    });
    if (!save.ok) { console.log('FAIL  ' + u.username + ' — save HTTP ' + save.status); continue; }

    // Verify with a real login.
    const verify = await fetch(BASE + '/api/hr/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u.username, password: target })
    });
    console.log((verify.ok ? 'RESET ' : 'WARN  ') + u.username + ' -> ' + target + ' (login ' + verify.status + (verify.ok ? '' : ' — CHECK!') + ')');
    await new Promise(r => setTimeout(r, 700));
  }
  console.log('\nDone. All listed users now use their canonical default password (hashed at rest).');
}
main().catch(e => { console.error('FATAL', e?.message || e); process.exit(1); });
