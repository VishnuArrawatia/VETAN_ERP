/**
 * HR USER PASSWORD-WIPE GUARD — regression tests.
 *
 * Bug context (Sep 2026 lockout): GET /api/hr/users strips the password
 * field (SECURITY-FIX #13), and the UI sends that stripped object back on
 * BOTH the user-edit save AND the disable/enable toggle. syncUser then
 * replaced the stored password with the syncUser default, locking every
 * admin out ("Password Incorrect" 401 for all accounts).
 *
 * The guard: POST /api/hr/users with empty/missing password must KEEP the
 * stored password; a non-empty password must SET it (hashed at rest).
 *
 * Run: npx tsx scripts/hr-password-wipe-guard-tests.ts
 */
import http from 'http';
import crypto from 'crypto';

const PORT = 3499;
// Unique per run: the local dev DB persists between runs, so leftover users
// from a previous run would collide (400 Username already exists).
const STAMP = crypto.randomBytes(3).toString('hex');
const U1 = `wtest_${STAMP}`;
const U2 = `wdef_${STAMP}`;
const LEGACY_LEFTOVER = /^(wtest_|wipe_test|wipe_default)/;
let pass = 0, fail = 0;
const ok = (c: boolean, label: string) => { if (c) { pass++; console.log(`  ✅ ${label}`); } else { fail++; console.log(`  ❌ ${label}`); } };
const section = (t: string) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 62 - t.length))}`);

class FakeQuery {
  private eqs: [string, any][] = [];
  constructor(private sb: any) {}
  select(_c?: string) { return this; }
  eq(k: string, v: any) { this.eqs.push([k, v]); return this; }
  async maybeSingle() {
    return { data: this.sb.row ? { payload: JSON.parse(JSON.stringify(this.sb.row.payload)), updated_at: this.sb.row.updated_at } : null, error: null };
  }
  update(_p: any) { return this; }
  upsert(row: any) { this.sb.row = { payload: JSON.parse(JSON.stringify(row.payload)), updated_at: row.updated_at }; return Promise.resolve({ data: null, error: null }); }
  insert(_r: any) { return Promise.resolve({ data: null, error: null }); }
  delete() { return this; }
  then(onF: any, onR: any) { return this.maybeSingle().then(onF, onR); }
}
class FakeClient {
  row: any = null;
  from(_t: string) { return new FakeQuery(this); }
}

process.env.SESSION_SECRET = 'test-secret-pw-wipe-guard';

function cookieOf(res: { headers: any }): string {
  const setCookie = res.headers?.['set-cookie'];
  const c = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return c ? String(c).split(';')[0] : '';
}

async function start() {
  const { createApp } = await import('../server/app');
  const app = await createApp(new FakeClient());
  const server = http.createServer(app as any);
  await new Promise<void>(res => server.listen(PORT, res));

  const call = (method: string, path: string, body?: any, headers: Record<string, string> = {}) =>
    new Promise<{ status: number; json: any; headers: any }>((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const req = http.request({ host: '127.0.0.1', port: PORT, path, method,
        headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}), ...headers } },
        r => { let chunks: Buffer[] = []; r.on('data', c => chunks.push(c)); r.on('end', () => {
          const txt = Buffer.concat(chunks).toString();
          let json: any = txt; try { json = JSON.parse(txt); } catch { /* keep text */ }
          resolve({ status: r.statusCode || 0, json, headers: r.headers });
        }); });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });

  try {
    // HR-side admin calls use the legacy x-operator-* headers (HR login does
    // not issue a session cookie — cookie auth is currently ESS-only).
    const OWNER = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR' };

    section('Setup: cleanup leftovers + owner login + security mode ON');
    const login = await call('POST', '/api/hr/login', { username: 'vishnu', password: 'Varrawatia' });
    ok(login.status === 200, `owner login (status ${login.status})`);
    // Self-cleaning harness: remove users left by earlier runs.
    const pre = await call('GET', '/api/hr/users', undefined, OWNER);
    for (const stale of (Array.isArray(pre.json) ? pre.json : []).filter((u: any) => LEGACY_LEFTOVER.test(u.username))) {
      const del = await call('DELETE', `/api/hr/users/${stale.id}`, undefined, OWNER);
      console.log(`  (cleanup) removed leftover ${stale.username} -> ${del.status}`);
    }
    const sec = await call('POST', '/api/settings/security-mode', { enabled: true }, OWNER);
    ok(sec.status === 200 && sec.json?.productionSecurityEnabled === true, `security mode enabled (status ${sec.status})`);

    section('T1: create user with explicit password → login works');
    const create = await call('POST', '/api/hr/users', { username: U1, name: 'Wipe Test', role: 'COMPANY_HR', company_rights: ['SVN-1'], password: 'firstpass1' }, OWNER);
    ok(create.status === 200, `user created (status ${create.status})`);
    const uid = create.json?.user?.id;
    ok(!!uid, `got generated id (${uid})`);
    const l1 = await call('POST', '/api/hr/login', { username: U1, password: 'firstpass1' });
    ok(l1.status === 200, `login with set password (status ${l1.status})`);
    const l1bad = await call('POST', '/api/hr/login', { username: U1, password: 'password123' });
    ok(l1bad.status === 401, `default password rejected after explicit set (status ${l1bad.status})`);

    section('T2: EDIT-SAVE with stripped payload (exact UI path) → password preserved');
    // GET /api/hr/users strips passwords — replicate the stripped object the UI sends back.
    const list1 = await call('GET', '/api/hr/users', undefined, OWNER);
    const stripped = (list1.json || []).find((u: any) => u.username === U1);
    ok(stripped && stripped.password === undefined, 'GET returns stripped password field (precondition)');
    const strippedPayload = { ...stripped, name: 'Wipe Test Renamed' };
    const saveEdit = await call('POST', '/api/hr/users', strippedPayload, OWNER);
    ok(saveEdit.status === 200, `edit save with stripped password (status ${saveEdit.status})`);
    const l2 = await call('POST', '/api/hr/login', { username: U1, password: 'firstpass1' });
    ok(l2.status === 200, `original password STILL works after edit save (status ${l2.status})`);

    section('T3: DISABLE/ENABLE toggle with stripped payload (exact UI path) → password preserved');
    const list2 = await call('GET', '/api/hr/users', undefined, OWNER);
    const stripped2 = (list2.json || []).find((u: any) => u.username === U1);
    const dis = await call('POST', '/api/hr/users', { ...stripped2, disabled: true }, OWNER);
    ok(dis.status === 200, `disable toggle saved (status ${dis.status})`);
    const l3dis = await call('POST', '/api/hr/login', { username: U1, password: 'firstpass1' });
    ok(l3dis.status === 403, `disabled account refused (status ${l3dis.status})`);
    const list3 = await call('GET', '/api/hr/users', undefined, OWNER);
    const stripped3 = (list3.json || []).find((u: any) => u.username === U1);
    const en = await call('POST', '/api/hr/users', { ...stripped3, disabled: false }, OWNER);
    ok(en.status === 200, `enable toggle saved (status ${en.status})`);
    const l3 = await call('POST', '/api/hr/login', { username: U1, password: 'firstpass1' });
    ok(l3.status === 200, `original password STILL works after disable+enable cycle (status ${l3.status})`);

    section('T4: explicit new password on edit → set + old one dead');
    const list4 = await call('GET', '/api/hr/users', undefined, OWNER);
    const stripped4 = (list4.json || []).find((u: any) => u.username === U1);
    const pwChange = await call('POST', '/api/hr/users', { ...stripped4, password: 'secondpass2' }, OWNER);
    ok(pwChange.status === 200, `password change saved (status ${pwChange.status})`);
    const l4new = await call('POST', '/api/hr/login', { username: U1, password: 'secondpass2' });
    ok(l4new.status === 200, `new password works (status ${l4new.status})`);
    const l4old = await call('POST', '/api/hr/login', { username: U1, password: 'firstpass1' });
    ok(l4old.status === 401, `old password rejected (status ${l4old.status})`);

    section('T5: create WITHOUT password → legacy default still applies');
    const create2 = await call('POST', '/api/hr/users', { username: U2, name: 'Wipe Default', role: 'COMPANY_HR', company_rights: ['SVN-1'] }, OWNER);
    ok(create2.status === 200, `user created without password (status ${create2.status})`);
    const l5 = await call('POST', '/api/hr/login', { username: U2, password: 'password123' });
    ok(l5.status === 200, `default password works for new no-password user (status ${l5.status})`);

    section('T6: brand-new username still auto-provisions on login (regression)');
    const l6 = await call('POST', '/api/hr/login', { username: 'vijay', password: 'VKS' });
    ok(l6.status === 200, `default user vijay/VKS login (status ${l6.status})`);

    console.log('\n════════════════════════════════════════');
    console.log(`RESULT: ${pass} passed, ${fail} failed`);
    console.log('════════════════════════════════════════');
  } finally {
    server.close();
  }
  process.exit(fail === 0 ? 0 : 1);
}

start().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
