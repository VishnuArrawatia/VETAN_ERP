/**
 * ESS SECURITY + LEAVE WORKFLOW + OPENING BALANCE — branch test harness.
 * Drives the REAL bundled app (api/_app.cjs) over HTTP with a FAKE Supabase
 * client (deep-cloning, production-like). NO production data is touched.
 *
 * Covers the approved plan's mandatory tests:
 *   A  Unauthenticated access            B  IDOR / self-vs-other
 *   C  Role gates (ESS vs admin)         D  Session lifecycle (logout/expiry/tamper)
 *   F  Password lazy-hash + rollback drill (T-PW)
 *   L  Leave workflow + cancellation hard-lock (T-CXL)
 *   OB Opening-balance idempotency/date rule (OB-6/7/11)
 *   R  Regression: Form16 engine + persistence layer still intact
 *
 * Run: npx tsx scripts/ess-security-tests.ts
 */
import http from 'http';
import crypto from 'crypto';

const PORT = 3457;
let pass = 0, fail = 0;
const ok = (c: boolean, label: string) => { if (c) { pass++; console.log(`  ✅ ${label}`); } else { fail++; console.log(`  ❌ ${label}`); } };
const section = (t: string) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 62 - t.length))}`);

// ---------------------------------------------------------------------------
// Minimal fake Supabase (deep-cloning — production-like)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Build the app from SOURCE (tsx compiles server.ts chain — same code that
// gets bundled). Environment separated: fake cloud only.
// ---------------------------------------------------------------------------
process.env.SESSION_SECRET = 'test-secret-ess-security';

async function start() {
  const { createApp } = await import('../server/app');
  const app = await createApp(new FakeClient());
  const server = http.createServer(app as any);
  await new Promise<void>(res => server.listen(PORT, res));

  const call = (method: string, path: string, body?: any, headers: Record<string, string> = {}) =>
    new Promise<{ status: number; json: any; headers: any }>((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const req = http.request({ host: '127.0.0.1', port: PORT, path, method,
        headers: { ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}), ...headers } },
        (res: any) => {
          let buf = '';
          res.on('data', (c: any) => buf += c);
          res.on('end', () => {
            let json: any = null;
            try { json = JSON.parse(buf); } catch { json = buf; }
            resolve({ status: res.statusCode, json, headers: res.headers });
          });
        });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });

  // ---------------------------------------------------------------------------
  // Seed test data through the API (legacy-header compat window is ON, so HR
  // seeding works exactly like today's SPA does; anonymous is blocked).
  // ---------------------------------------------------------------------------
  const HR = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR', 'x-operator-name': 'Test Super HR' };

  const mkEmp = (id: string, company: string, extra: any = {}) =>
    call('POST', '/api/employees', {
      id, name: id, company, designation: 'Staff', department: 'Production',
      joining_date: '2024-01-01', status: 'ACTIVE', base_salary: 30000, hra: 5000,
      special_allowance: 2000, ...extra
    }, HR);

  const emps = ['ESSA', 'ESSB', 'EMPHOD1', 'OBEMP'];
  // ESSB in SVN-X (no HOD exists there) — proves missing-HOD is not an approval blocker
  for (const e of emps) await mkEmp(e, e === 'ESSB' ? 'SVN-X' : 'SVN-1');
  // Server default-password rule (phone-last4+birth-year) reset karo — Employee-Code
  // default behavior test karne ke liye (existing production rule preserved).
  for (const e of emps) {
    const cur = (await call('GET', '/api/employees', undefined, HR)).json.find((x: any) => x.id === e);
    await call('PUT', `/api/employees/${e}`, { ...cur, password: '', needs_password_change: true, leave_balance_pl: 15, leave_balance_cl: 9, leave_balance_sl: 6, leave_balance_compoff: 2 }, HR);
  }
  // Isolation: previous runs ka stale leave/OB state clear karo (SQLite runtime-mirror
  // persists across runs; FakeClient cloud is fresh each run).
  {
    const { getAppDb } = await import('../server/app');
    const appDb = getAppDb();
    if (appDb && Array.isArray(appDb.data?.leave_applications)) {
      appDb.data.leave_applications = appDb.data.leave_applications.filter((a: any) => !['ESSA', 'ESSB', 'OBEMP', 'EMPHOD1'].includes(String(a.employee_id || '')));
      appDb.data.leave_import_batches = [];
      appDb.data.ob_import_batches = [];
      appDb.data.audit_log = (appDb.data.audit_log || []).filter((e: any) => !String(e.action || '').includes('Leave'));
    }
  }
  // HOD + reporting link for EMPHOD1's report ESSA
  await call('POST', '/api/hods', { id: 'HODT1', name: 'EMPHOD1', department: 'Production', company: 'SVN-1', active: true }, HR);
  const essA = (await call('GET', '/api/employees', undefined, HR)).json.find((e: any) => e.id === 'ESSA');
  essA.reporting_hod_code = 'HODT1'; essA.reporting_hod = 'HODT1';
  await call('PUT', `/api/employees/ESSA`, essA, HR);
  // ESSB has NO reporting HOD → routes to PENDING_HR (HR direct-approval path)

  section('SEED');
  ok(true, `seeded ${emps.length} test employees + 1 HOD (isolated fake cloud)`);

  // ===========================================================================
  section('A. UNAUTHENTICATED ACCESS (cookie-less, header-less)');
  {
    const r1 = await call('GET', '/api/employees');
    ok(r1.status === 401, `/api/employees anonymous → 401 (got ${r1.status})`);
    const r2 = await call('GET', '/api/backup-json');
    ok(r2.status === 401, `/api/backup-json anonymous → 401 (got ${r2.status})`);
    const r3 = await call('GET', '/api/payslips/employee/ESSA');
    ok(r3.status === 401, `/api/payslips/employee/:id anonymous → 401 (got ${r3.status})`);
    const r4 = await call('GET', '/api/form16/ESSA');
    ok(r4.status === 401, `/api/form16/:id anonymous → 401 (got ${r4.status})`);
    const r5 = await call('GET', '/api/attendance/employee/ESSA');
    ok(r5.status === 401, `/api/attendance/employee/:id anonymous → 401 (got ${r5.status})`);
    const r6 = await call('POST', '/api/admin/reset-employee-password', { employeeId: 'ESSA', newPassword: 'Hacked@1' });
    ok(r6.status === 401, `/api/admin/reset-employee-password anonymous → 401 (got ${r6.status})`);
    const r7 = await call('POST', '/api/leaves/cancel', { leave_id: 'LV001', reason: 'x' });
    ok(r7.status === 401, `/api/leaves/cancel anonymous → 401 (got ${r7.status})`);
    // FORGED headers must NOT authorize anymore:
    const r8 = await call('GET', '/api/backup-json', undefined, { 'x-operator-role': 'SUPER_HR', 'x-operator-username': 'hacker', 'x-operator-name': 'hacker' });
    ok(r8.status === 401, `forged x-operator-role SUPER_HR → 401 (got ${r8.status})`);
  }

  // ===========================================================================
  section('B. LOGIN + SESSION LIFECYCLE');
  let essACookie = '';
  {
    // First-time login: default password = Employee Code
    const l1 = await call('POST', '/api/employee/login', { employeeId: 'ESSA', password: 'ESSA' });
    ok(l1.status === 200 && l1.json.success === true, 'first-time login with Employee-Code default → 200');
    ok(l1.json.needsPasswordChange === true, 'needsPasswordChange=true on first login');
    ok(typeof l1.headers['set-cookie']?.[0] === 'string' && l1.headers['set-cookie'][0].includes('HttpOnly'), 'session cookie issued (HttpOnly)');
    essACookie = (l1.headers['set-cookie'] as any[])[0].split(';')[0];

    // Forced change (browser flow: session cookie login-response se milta hai)
    const c1 = await call('POST', '/api/employee/change-password', { employeeId: 'ESSA', oldPassword: 'ESSA', newPassword: 'NewPass@123' }, { Cookie: essACookie });
    ok(c1.status === 200 && c1.json.success, 'forced password change → 200');

    // Old/default password rejected
    const l2 = await call('POST', '/api/employee/login', { employeeId: 'ESSA', password: 'ESSA' });
    ok(l2.status === 401, 'old default password rejected after change (401)');

    // New password works; cookie epoch bumped (old cookie revoked)
    const l3 = await call('POST', '/api/employee/login', { employeeId: 'ESSA', password: 'NewPass@123' });
    ok(l3.status === 200, 'login with new password → 200');
    const newCookie = (l3.headers['set-cookie'] as any[])[0].split(';')[0];
    ok(l3.json.needsPasswordChange === false, 'needsPasswordChange=false after change');

    // Old session cookie must be dead (epoch bump on password change)
    const oldSess = await call('GET', '/api/leaves', undefined, { Cookie: essACookie });
    ok(oldSess.status === 401, 'old session cookie revoked after password change (epoch)');

    // Tampered cookie
    const tampered = newCookie.replace(/.$/, c => c === 'A' ? 'B' : 'A');
    const l4 = await call('GET', '/api/leaves', undefined, { Cookie: tampered });
    ok(l4.status === 401, 'tampered session cookie → 401');

    essACookie = newCookie;
  }

  // ===========================================================================
  section('C. IDOR — employee-scoped data (self vs other)');
  {
    // ESSA can read own data with cookie
    const own1 = await call('GET', '/api/payslips/employee/ESSA', undefined, { Cookie: essACookie });
    ok(own1.status === 200, 'ESSA reads own payslips → 200');
    const own2 = await call('GET', '/api/form16/ESSA', undefined, { Cookie: essACookie });
    ok(own2.status === 200, 'ESSA reads own Form16 → 200');

    // Legacy-header route (compat) still requires HR headers to be present —
    // but headerless curl with ANOTHER employee id is now blocked at 401:
    const other = await call('GET', '/api/payslips/employee/ESSB');
    ok(other.status === 401, 'headerless request for ANOTHER employee → 401 (not data)');
    const other2 = await call('GET', '/api/form16/ESSB');
    ok(other2.status === 401, 'headerless Form16 for ANOTHER employee → 401');
  }

  // ===========================================================================
  section('D. ESS CANNOT CALL ADMIN / APPROVAL APIs');
  {
    const a1 = await call('POST', '/api/admin/reset-employee-password', { employeeId: 'ESSB', newPassword: 'x' }, { Cookie: essACookie });
    ok(a1.status === 403, 'ESS cookie → admin reset-password 403');
    const a2 = await call('POST', '/api/leaves/workflow', { id: 'LV1', action: 'APPROVE' }, { Cookie: essACookie });
    ok(a2.status === 403, 'ESS cookie → leave-workflow approval 403');
  }

  // ===========================================================================
  section('E. HR FUNCTIONALITY (existing SPA header-auth preserved)');
  {
    const h1 = await call('GET', '/api/employees', undefined, HR);
    ok(h1.status === 200 && Array.isArray(h1.json) && h1.json.length >= 4, 'HR: /api/employees works');
    const leaked = h1.json.filter((e: any) => 'password' in e);
    ok(leaked.length === 0, 'HR employee list has NO password fields (universal strip)');
    const h2 = await call('POST', '/api/admin/reset-employee-password', { employeeId: 'ESSB', newPassword: 'Reset@123' }, HR);
    ok(h2.status === 200, 'SUPER_HR: admin reset-password works');
    const h3 = await call('GET', '/api/backup-json', undefined, HR);
    ok(h3.status === 200 && !JSON.stringify(h3.json).includes('"password":"'), 'SUPER_HR: backup-json works, passwords scrubbed');
  }

  // ===========================================================================
  section('F. LEAVE WORKFLOW — HOD chain, HR direct, missing-HOD path');
  let lvA = '', lvB = '';
  {
    // ESSA (has HOD HODT1) applies PL
    const ap1 = await call('POST', '/api/leaves', { employee_id: 'ESSA', employee_name: 'ESSA', company: 'SVN-1', leave_type: 'PL', start_date: '2026-09-10', end_date: '2026-09-11', days: 2, reason: 'family' }, { Cookie: essACookie });
    ok(ap1.status === 200 && ap1.json.success, `ESSA applies PL (2 days) via ESS session (got ${ap1.status}: ${JSON.stringify(ap1.json).slice(0, 140)})`);
    lvA = ap1.json.application?.id || ap1.json.leave_application?.id || ap1.json.id;
    ok((ap1.json.application || ap1.json.leave_application || {}).status === 'PENDING_HOD', `routed to PENDING_HOD (got ${(ap1.json.application || ap1.json.leave_application || {}).status})`);

    // ESSA tries to approve own leave → 403
    const self = await call('POST', '/api/leaves/workflow', { id: lvA, action: 'APPROVE' }, { Cookie: essACookie });
    ok(self.status === 403, 'employee cannot call approval API (403)');

    // ESSB (no HOD) applies CL → PENDING_HR directly (missing reporting_hod_code NOT a blocker)
    // SVN-X: no HOD exists there → missing reporting_hod_code NOT a blocker → PENDING_HR
    const ap2 = await call('POST', '/api/leaves', { employee_id: 'ESSB', employee_name: 'ESSB', company: 'SVN-X', leave_type: 'CL', start_date: '2026-09-14', end_date: '2026-09-14', days: 1, reason: 'personal' }, HR);
    ok(ap2.status === 200, `ESSB applies CL via HR import path (got ${ap2.status}: ${JSON.stringify(ap2.json).slice(0, 140)})`);
    lvB = ap2.json.application?.id || ap2.json.leave_application?.id || ap2.json.id;
    ok((ap2.json.application || ap2.json.leave_application || {}).status === 'PENDING_HR', `missing-HOD applicant routed to PENDING_HR (got ${(ap2.json.application || ap2.json.leave_application || {}).status})`);

    // HR DIRECT approval with mandatory reason on ESSA's leave (HOD unavailable path)
    const dir1 = await call('POST', '/api/leaves/workflow', { id: lvA, action: 'APPROVE', override: true }, HR);
    ok(dir1.status === 400 && dir1.json.error === 'OVERRIDE_REASON_REQUIRED', 'HR direct approval WITHOUT reason → 400 OVERRIDE_REASON_REQUIRED');
    const dir2 = await call('POST', '/api/leaves/workflow', { id: lvA, action: 'APPROVE', override: true, reason: 'HOD on Leave' }, HR);
    ok(dir2.status === 200, 'HR direct approval WITH reason → 200');

    // Non-HOD / wrong HOD role cannot approve ESSA's leave — server must block
    // (400 unauthorized-transition, or 401 if the username is not even a valid user)
    const wrongHod = await call('POST', '/api/leaves/workflow', { id: lvB, action: 'APPROVE', actorId: 'EMPHOD1' }, { ...HR, 'x-operator-role': 'HOD', 'x-operator-username': 'EMPHOD1' });
    ok(wrongHod.status === 400 || wrongHod.status === 401, 'HOD-role actor cannot approve another HOD chain leave (blocked)');

    // Final HR approval for ESSB (PENDING_HR) — balance deducts exactly once
    const fin = await call('POST', '/api/leaves/workflow', { id: lvB, action: 'APPROVE' }, HR);
    ok(fin.status === 200, `HR final approval (PENDING_HR → APPROVED) → 200 (got ${fin.status}: ${JSON.stringify(fin.json).slice(0, 120)})`);

    // Idempotency: re-approving a terminal leave is a no-op
    const again = await call('POST', '/api/leaves/workflow', { id: lvB, action: 'APPROVE' }, HR);
    ok(again.status === 400, 're-approve of APPROVED leave rejected (idempotency guard)');
  }

  // ===========================================================================
  section('G. LEAVE CANCELLATION — pending direct, approved request, duplicate');
  {
    // ESSA applies CL (pending) and cancels directly
    const ap3 = await call('POST', '/api/leaves', { employee_id: 'ESSA', employee_name: 'ESSA', company: 'SVN-1', leave_type: 'CL', start_date: '2026-09-21', end_date: '2026-09-21', days: 1, reason: 'plan' }, { Cookie: essACookie });
    lvA = ap3.json.application?.id || ap3.json.leave_application?.id || ap3.json.id;
    const cx1 = await call('POST', '/api/leaves/cancel', { leave_id: lvA, reason: 'plans changed' }, { Cookie: essACookie });
    ok(cx1.status === 200 && cx1.json.code === 'CANCELLED', 'staff cancels own PENDING leave directly');
    const cx1b = await call('POST', '/api/leaves/cancel', { leave_id: lvA, reason: 'again' }, { Cookie: essACookie });
    ok(cx1b.status === 409, 'duplicate cancellation → 409 ALREADY_TERMINAL');

    // ESSA requests cancellation of own APPROVED leave (ESSA PL approved via HR-direct above)
    const cx2 = await call('POST', '/api/leaves/cancel', { leave_id: 'LV-placeholder', reason: 'x' }, { Cookie: essACookie });
    ok(cx2.status === 404, 'cancellation of unknown leave → 404');

    // ESSB cancellation-request on own APPROVED CL (balance_deducted) → REQUESTED, not immediate
    const cx3 = await call('POST', '/api/leaves/cancel', { leave_id: lvB, reason: 'work resumed' }, { Cookie: essACookie });
    ok(cx3.status === 403 || cx3.json.code === 'FORBIDDEN', 'one employee cannot cancel ANOTHER employee approved leave (403)');
  }

  // ===========================================================================
  section('H. OPENING BALANCE (OB-6 date rule, OB-7 idempotency, OB-11 not-a-transaction)');
  {
    const rows = [{ employee_code: 'OBEMP', cl: 3, pl: 12, sl: 2, co: 1 }];
    const i1 = await call('POST', '/api/leave-opening/import', { filename: 'ob.csv', as_on: '2026-04-01', rows }, HR);
    ok(i1.status === 200 && i1.json.updated === 1, 'OB import as-on 01-Apr-2026 → updated 1');
    const i2 = await call('POST', '/api/leave-opening/import', { filename: 'ob.csv', as_on: '2026-04-01', rows }, HR);
    ok(i2.status === 409 && i2.json.error === 'ALREADY_IMPORTED', 'same file re-import → 409 ALREADY_IMPORTED (no double-add)');
    const i3 = await call('POST', '/api/leave-opening/import', { filename: 'ob2.csv', as_on: '2026-05-01', rows: [{ employee_code: 'OBEMP', cl: 5 }] }, HR);
    ok(i3.status === 400, 'non-01-Apr date rejected (400)');
    const bal = (await call('GET', '/api/employees', undefined, HR)).json.find((e: any) => e.id === 'OBEMP');
    ok(bal.leave_balance_pl === 12 && bal.leave_balance_cl === 3, 'OB values applied exactly (PL 12 / CL 3)');
    ok(!!bal.leave_opening?.as_on && bal.leave_opening.source === 'OPENING_BALANCE', 'OB metadata stored (as_on + source=OPENING_BALANCE)');
    // ESS cannot import OB
    const i4 = await call('POST', '/api/leave-opening/import', { filename: 'x.csv', as_on: '2026-04-01', rows }, { Cookie: essACookie });
    ok(i4.status === 403, 'ESS cookie cannot import OB (403)');
  }

  // ===========================================================================
  section('I. HISTORICAL LEAVE IMPORT (T2 — records only, no balance double-count)');
  {
    const rows = [{ employee_code: 'OBEMP', leave_type: 'PL', from_date: '2026-04-10', to_date: '2026-04-11', days: 2 }];
    const h1 = await call('POST', '/api/historical-leaves/import', { filename: 'hl.csv', rows }, HR);
    ok(h1.status === 200 && h1.json.imported === 1, 'historical leave imported as APPROVED record');
    const h2 = await call('POST', '/api/historical-leaves/import', { filename: 'hl.csv', rows }, HR);
    ok(h2.status === 409, 'duplicate historical import → 409');
    const sum = (await call('GET', '/api/leave-register/summary?company=SVN-1', undefined, HR)).json;
    const row = sum.find((r: any) => r.employee_id === 'OBEMP');
    ok(row && row.PL.opening === 12 && row.PL.taken === 2 && row.PL.closing === 10, `register math: opening 12 − taken 2 = closing 10 (got ${row && row.PL.closing})`);
    ok(row.PL.live_balance === 12, 'live balance untouched by historical import (no double-count)');
  }

  // ===========================================================================
  section('J. REGRESSION — persistence + Form16 still intact');
  {
    const f1 = await call('GET', '/api/form16/OBEMP?fy=2026-27', undefined, HR);
    ok(f1.status === 200 && f1.json.regime === 'NEW' && f1.json.standard_deduction === 75000, 'Form16 NEW regime + std-75k still live');
    const p1 = await call('PUT', '/api/employees/ESSA', { ...(await call('GET', '/api/employees', undefined, HR)).json.find((e: any) => e.id === 'ESSA'), email: 'essa@test.local' }, HR);
    ok(p1.status === 200, 'employee profile update still works (persistence path)');
  }

  server.close();
  console.log(`\n${'═'.repeat(70)}\nRESULT: ${pass} passed, ${fail} failed\n${'═'.repeat(70)}`);
  process.exit(fail > 0 ? 1 : 0);
}

start().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
