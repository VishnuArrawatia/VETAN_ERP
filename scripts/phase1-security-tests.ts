/**
 * PHASE-1 SECURITY TESTS (isolated fake cloud — NO production contact).
 * Proves the security_mode=testing PIN-bypass P0 is eliminated:
 *   - verifyPin is fail-closed (missing/wrong PIN rejected even for SUPER_HR)
 *   - request-controlled flags can NEVER re-enable the bypass
 *   - destructive/admin routes are SUPER_HR-only with server-resolved roles
 *   - ESS sessions and anonymous requests are rejected
 * Run: npx tsx scripts/phase1-security-tests.ts
 */
import http from 'http';

const PORT = 3481;
let pass = 0, fail = 0;
const ok = (c: boolean, label: string) => { if (c) { pass++; console.log(`  ✅ ${label}`); } else { fail++; console.log(`  ❌ ${label}`); } };
const section = (t: string) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 58 - t.length))}`);

process.env.SESSION_SECRET = 'phase1-test-secret';
delete process.env.VETAN_ALLOW_PIN_BYPASS; // harness must run with bypass OFF (as on Vercel)

// ── Fake Supabase (same contract as master-persistence-tests) ──
let cloudPayload: any = {
  employees: [{ id: 'SEED1', name: 'Seed Employee', status: 'ACTIVE', company: 'SVN-1' }],
  companies: [{ id: 'SVN-1', name: 'SVN Unit 1' }],
  users: [
    { id: 'USR001', username: 'vishnu', name: 'Vishnu', role: 'SUPER_HR', disabled: false, company_rights: ['ALL'], password: 'Varrawatia' },
    { id: 'USR002', username: 'qa_hr', name: 'QA Company HR', role: 'COMPANY_HR', disabled: false, company_rights: ['SVN-1'], password: 'qahrpass' }
  ],
  hods: [], shifts: [], departments: []
};
let cloudUpdatedAt = new Date(Date.now() - 60000).toISOString();

function chainWrite(u: any) {
  const doWrite = async () => {
    cloudPayload = JSON.parse(JSON.stringify(u && u.payload !== undefined ? u.payload : u));
    cloudUpdatedAt = new Date().toISOString();
    return { data: [{ id: 'live' }], error: null };
  };
  const obj: any = { eq: () => obj, select: () => obj, single: () => obj };
  obj.then = (res: any, rej: any) => doWrite().then(res, rej);
  return obj;
}
const fakeSupabase = {
  from(_t: string) {
    return {
      select() { return { eq() { return { maybeSingle: async () => ({ data: { payload: cloudPayload, updated_at: cloudUpdatedAt }, error: null }), single: async () => ({ data: { payload: cloudPayload, updated_at: cloudUpdatedAt }, error: null }) }; } }; },
      update: (u: any) => chainWrite(u), upsert: (u: any) => chainWrite(u), insert: (u: any) => chainWrite(u)
    };
  }
};

async function call(method: string, path: string, body?: any, headers?: Record<string, string>): Promise<{ status: number; json: any; setCookie?: string }> {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      host: '127.0.0.1', port: PORT, path, method,
      headers: { ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}), ...(headers || {}) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode || 0, json: JSON.parse(d), setCookie: res.headers['set-cookie']?.[0] }); } catch { resolve({ status: res.statusCode || 0, json: null }); } });
    });
    req.on('error', (e) => resolve({ status: -1, json: { error: e.message } }));
    if (payload) req.write(payload);
    req.end();
  });
}

const SUPER = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR' };
const QAHR  = { 'x-operator-username': 'qa_hr',  'x-operator-role': 'COMPANY_HR' };
const DEFAULT_PIN = '1234'; // seeded default super_admin_pin in an isolated db

async function waitReady(): Promise<boolean> {
  for (let i = 0; i < 40; i++) {
    const r = await call('GET', '/api/companies');
    if (r.status > 0) return true;
    await new Promise(res => setTimeout(res, 250));
  }
  return false;
}

async function main() {
  // PHASE1_MODULE env lets the same battery run against the BUILT BUNDLE
  // (api/_app.cjs — the exact artifact Vercel serves): PHASE1_MODULE=../api/_app.cjs
  const { createApp } = await import(process.env.PHASE1_MODULE || '../server/app');
  const app: any = await createApp(fakeSupabase as any);
  const srv = app.listen(PORT);
  ok(await waitReady(), 'instance ready (isolated)');

  // ════ SECTION 1: Anonymous rejection ════
  section('Anonymous requests (no headers, no cookie)');
  let r = await call('POST', '/api/admin/purge-employees', {});
  ok(r.status === 401, `T1 purge-employees → ${r.status} (expect 401)`);
  r = await call('POST', '/api/settings/security-mode', { enabled: true });
  ok(r.status === 401, `T2 security-mode POST → ${r.status} (expect 401 — removed from PUBLIC_PATHS)`);
  r = await call('GET', '/api/backup-json');
  ok(r.status === 401, `T3 backup-json GET → ${r.status} (expect 401)`);
  r = await call('POST', '/api/restore-json', { employees: [] });
  ok(r.status === 401, `T4 restore-json → ${r.status} (expect 401)`);

  // ════ SECTION 2: Non-super HR rejected on destructive/admin surfaces ════
  section('COMPANY_HR vs destructive/admin surfaces (server-resolved role)');
  r = await call('POST', '/api/settings/security-mode', { enabled: true }, QAHR);
  ok(r.status === 403, `T5 security-mode toggle as COMPANY_HR → ${r.status} (expect 403)`);
  r = await call('POST', '/api/sql/query', { sql: 'SELECT 1' }, QAHR);
  ok(r.status === 403, `T6 sql/query as COMPANY_HR → ${r.status} (expect 403)`);
  r = await call('POST', '/api/admin/purge-employees', { pin: DEFAULT_PIN }, QAHR);
  ok(r.status === 403, `T7 purge with VALID pin as COMPANY_HR → ${r.status} (expect 403 — role gate)`);

  // ════ SECTION 3: PIN fail-closed (even SUPER_HR) ════
  section('PIN verification fail-closed');
  r = await call('POST', '/api/admin/purge-employees', { pin: '9999' }, SUPER);
  ok(r.status === 403 && r.json?.error === 'PIN_INVALID', `T8 SUPER_HR WRONG pin → ${r.status} ${r.json?.error || ''} (expect 403 PIN_INVALID)`);
  r = await call('POST', '/api/admin/purge-employees', {}, SUPER);
  ok(r.status === 403 && r.json?.error === 'PIN_INVALID', `T9 SUPER_HR MISSING pin → ${r.status} ${r.json?.error || ''} (expect 403 PIN_INVALID)`);
  r = await call('POST', '/api/restore-json', { employees: [{ id: 'SEED1', name: 'Seed Employee', company: 'SVN-1' }], pin: 'wrong' }, SUPER);
  ok(r.status === 403 && r.json?.error === 'PIN_INVALID', `T10 restore-json WRONG pin (SUPER_HR) → ${r.status} (expect 403 PIN_INVALID)`);
  r = await call('POST', '/api/companies', { id: 'X1', name: 'X' }, SUPER);
  ok(r.status === 403 && r.json?.error === 'PIN_INVALID', `T11 company create no pin → ${r.status} (expect 403 PIN_INVALID)`);

  // ════ SECTION 4: Request-controlled flags CANNOT re-enable bypass ════
  section('Forged testing-mode flags rejected');
  r = await call('POST', '/api/admin/purge-employees',
    { security_mode: 'testing', production_security_enabled: '0', testingMode: true }, SUPER);
  ok(r.status === 403 && r.json?.error === 'PIN_INVALID', `T12 body security_mode=testing + no pin → ${r.status} (expect 403)`);
  r = await call('POST', '/api/admin/purge-employees', {},
    { ...SUPER, 'x-security-mode': 'testing', 'x-testing': '1', 'x-bypass-pin': '1' });
  ok(r.status === 403 && r.json?.error === 'PIN_INVALID', `T13 forged bypass HEADERS + no pin → ${r.status} (expect 403)`);
  r = await call('POST', '/api/admin/purge-employees?pin=', {}, SUPER);
  ok(r.status === 403 && r.json?.error === 'PIN_INVALID', `T14 empty pin via query → ${r.status} (expect 403)`);

  // ════ SECTION 5: Forged role/username rejected ════
  section('Forged identity rejected');
  r = await call('POST', '/api/sql/query', { sql: 'SELECT 1' },
    { 'x-operator-username': 'ghost_admin', 'x-operator-role': 'SUPER_HR' });
  ok(r.status === 401, `T15 fake username + forged SUPER_HR role → ${r.status} (expect 401 — no such user)`);
  r = await call('POST', '/api/sql/query', { sql: 'SELECT 1' },
    { 'x-operator-username': 'qa_hr', 'x-operator-role': 'SUPER_HR' });
  ok(r.status === 403, `T16 real COMPANY_HR user + forged SUPER_HR role header → ${r.status} (expect 403 — role from server record)`);

  // ════ SECTION 6: Positive path — SUPER_HR + valid PIN allowed ════
  section('Legitimate SUPER_HR + valid PIN allowed');
  r = await call('POST', '/api/companies', { id: 'OK1', name: 'OK Company', pin: DEFAULT_PIN }, SUPER);
  ok(r.status === 200 && r.json?.success === true, `T17 company create with valid pin → ${r.status} (expect 200)`);
  r = await call('POST', '/api/admin/purge-employees', { pin: DEFAULT_PIN }, SUPER);
  ok(r.status === 200 && r.json?.success === true, `T18 purge with valid pin → ${r.status} (expect 200 — isolated fake db)`);
  r = await call('POST', '/api/restore-json', { employees: [{ id: 'SEED1', name: 'Seed Employee', company: 'SVN-1' }], pin: DEFAULT_PIN }, SUPER);
  ok(r.status === 200, `T19 restore-json valid payload + VALID pin → ${r.status} (expect 200 — isolated fake db)`);
  r = await call('POST', '/api/settings/change-pin', { currentPin: DEFAULT_PIN, newPin: '987654' }, SUPER);
  ok(r.status === 200 && r.json?.success === true, `T20 change-pin with valid current PIN → ${r.status} (expect 200)`);
  r = await call('POST', '/api/admin/purge-employees', { pin: DEFAULT_PIN }, SUPER);
  ok(r.status === 403 && r.json?.error === 'PIN_INVALID', `T20b OLD pin now rejected after change → ${r.status} (expect 403 PIN_INVALID)`);
  r = await call('POST', '/api/admin/purge-employees', { pin: '987654' }, SUPER);
  ok(r.status === 200, `T20c NEW pin accepted → ${r.status} (expect 200)`);
  r = await call('POST', '/api/restore-json', { employees: [{ id: 'SEED1', name: 'Seed Employee', company: 'SVN-1' }], pin: '987654' }, SUPER);
  ok(r.status === 200, `T20d restore-json with NEW pin → ${r.status} (expect 200)`);

  // ════ SECTION 7: ESS session blocked from destructive surfaces ════
  section('ESS employee session vs admin surfaces');
  const login = await call('POST', '/api/employee/login', { employeeId: 'SEED1', password: 'SEED1' });
  const cookie = login.setCookie;
  ok(login.status === 200 && !!cookie, `T21 ESS login works (cookie issued) → ${login.status}`);
  r = await call('POST', '/api/admin/purge-employees', { pin: DEFAULT_PIN }, cookie ? { cookie } : undefined);
  ok(r.status === 403, `T22 ESS session calling purge → ${r.status} (expect 403 even with valid pin)`);
  r = await call('POST', '/api/settings/security-mode', { enabled: false }, cookie ? { cookie } : undefined);
  ok(r.status === 403, `T23 ESS session toggling security-mode → ${r.status} (expect 403)`);

  // ════ SECTION 8: hr/login server-side password verification ════
  section('hr/login password verification (server-side)');
  r = await call('POST', '/api/settings/security-mode', { enabled: true }, SUPER);
  ok(r.status === 200 && r.json?.productionSecurityEnabled === true, `T24 SUPER_HR can enable production security → ${r.status}`);
  r = await call('POST', '/api/hr/login', { username: 'qa_hr', password: 'WRONG' });
  ok(r.status === 401, `T25 hr/login WRONG password → ${r.status} (expect 401)`);
  r = await call('POST', '/api/hr/login', { username: 'qa_hr', password: 'qahrpass' });
  ok(r.status === 200 && r.json?.user?.role === 'COMPANY_HR', `T26 hr/login CORRECT password → ${r.status} + role (expect 200)`);
  r = await call('POST', '/api/hr/login', { username: 'ghost', password: 'x' });
  ok(r.status === 404, `T27 hr/login unknown user → ${r.status} (expect 404)`);

  // ════ SECTION 9: legacy testing behavior preserved when sec disabled ════
  section('Zero-lockout: disabling security restores testing behavior');
  r = await call('POST', '/api/settings/security-mode', { enabled: false }, SUPER);
  ok(r.status === 200 && r.json?.productionSecurityEnabled === false, `T28 SUPER_HR can disable production security → ${r.status}`);
  r = await call('POST', '/api/hr/login', { username: 'qa_hr' });
  ok(r.status === 200, `T29 hr/login without password when security disabled → ${r.status} (expect 200 — testing behavior preserved)`);

  console.log(`\n════════ PHASE-1 SECURITY: ${pass} passed, ${fail} failed ════════`);
  srv.close();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error('Harness error:', e); process.exit(1); });
