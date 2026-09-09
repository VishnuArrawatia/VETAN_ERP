/**
 * EXTENDED VALIDATION — T-PW (password rollback drill), CO comp-off leave,
 * T-CXL (cancellation × processed-payroll hard-lock), register/reconciliation.
 * Isolated: fake Supabase client; NO production data touched.
 * Run: npx tsx scripts/ess-extended-tests.ts
 */
import http from 'http';

const PORT = 3458;
let pass = 0, fail = 0;
const notExec: string[] = [];
const ok = (c: boolean, label: string) => { if (c) { pass++; console.log(`  ✅ ${label}`); } else { fail++; console.log(`  ❌ ${label}`); } };
const notRun = (label: string) => notExec.push(label);
const section = (t: string) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 58 - t.length))}`);

process.env.SESSION_SECRET = 'test-secret-ess-extended';

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

async function start() {
  const { createApp, getAppDb } = await import('../server/app');
  const app = await createApp(new FakeClient());
  const server = http.createServer(app as any);
  await new Promise<void>(r => server.listen(PORT, r));
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

  const HR = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR', 'x-operator-name': 'TSHR' };

  // ---- seed (isolated fake cloud) ----
  for (const id of ['PWA', 'COA']) {
    await call('POST', '/api/employees', { id, name: id, company: 'SVN-1', designation: 'Staff', department: 'Production', joining_date: '2024-01-01', status: 'ACTIVE', base_salary: 30000 }, HR);
  }
  const get = async (id: string) => (await call('GET', '/api/employees', undefined, HR)).json.find((e: any) => e.id === id);
  for (const id of ['PWA', 'COA']) {
    const cur = await get(id);
    await call('PUT', `/api/employees/${id}`, { ...cur, password: '', needs_password_change: true, leave_balance_pl: 12, leave_balance_cl: 8, leave_balance_sl: 6, leave_balance_compoff: 1 }, HR);
  }
  await call('POST', '/api/hods', { id: 'HODX', name: 'HODX', department: 'Production', company: 'SVN-1', active: true }, HR);
  const coa0 = await get('COA'); coa0.reporting_hod_code = 'HODX'; coa0.reporting_hod = 'HODX';
  await call('PUT', '/api/employees/COA', coa0, HR);
  // Isolation: previous runs ka stale leave/payroll-run state clear karo (SQLite
  // runtime-mirror persists; FakeClient cloud is fresh each run).
  {
    const appDb = getAppDb();
    if (appDb && Array.isArray(appDb.data?.leave_applications)) {
      appDb.data.leave_applications = appDb.data.leave_applications.filter((a: any) => !['PWA', 'COA'].includes(String(a.employee_id || '')));
    }
    if (appDb && Array.isArray(appDb.data?.payroll_runs)) {
      appDb.data.payroll_runs = appDb.data.payroll_runs.filter((r: any) => r.month !== '2026-09');
    }
    if (appDb && Array.isArray(appDb.data?.audit_log)) {
      appDb.data.audit_log = appDb.data.audit_log.filter((e: any) => !String(e.action || '').includes('Leave'));
    }
  }

  // ============ T-PW: PASSWORD LAZY-HASH + ROLLBACK DRILL ============
  section('T-PW. PASSWORD LAZY-HASH + ROLLBACK (zero-lockout proof)');
  const login = (pw: string) => call('POST', '/api/employee/login', { employeeId: 'PWA', password: pw });
  const l0 = await login('PWA');
  ok(l0.status === 200, `T-PW-1 default (emp-code) login works (got ${l0.status})`);
  const cookiePWA = String((l0.headers['set-cookie'] || [])[0] || '').split(';')[0];
  ok(!!cookiePWA, 'T-PW-1b HttpOnly session cookie issued on default login');
  const cp = await call('POST', '/api/employee/change-password', { employeeId: 'PWA', oldPassword: 'PWA', newPassword: 'NewPw@123' }, { Cookie: cookiePWA });
  ok(cp.status === 200, `T-PW-2 forced change works (got ${cp.status})`);
  const l1 = await login('NewPw@123');
  ok(l1.status === 200, 'T-PW-3 re-login with new password works (lazy migration path)');
  const l2 = await login('PWA');
  ok(l2.status === 401, 'T-PW-4 old/default password rejected after change');
  // Read credential from the DB layer directly — the API strips credentials by design.
  const pwaDb = getAppDb()!.data.employees.find((e: any) => e.id === 'PWA');
  ok(String(pwaDb.password || '').startsWith('scrypt$'), 'T-PW-5 stored credential is scrypt hash (not plaintext)');
  ok(pwaDb.needs_password_change === false, 'T-PW-6 needs_password_change=false after change');
  // ROLLBACK drill: simulate rollback to a build with no hash semantics — clear
  // the stored credential exactly like pre-fix data; default behavior must return.
  const cur2 = await get('PWA');
  await call('PUT', `/api/employees/PWA`, { ...cur2, password: '', needs_password_change: true }, HR);
  const l3 = await login('PWA');
  ok(l3.status === 200, 'T-PW-7 ROLLBACK drill: hash cleared → emp-code default login still works (NO LOCKOUT)');

  // ============ CO: COMP-OFF LEAVE (G-3) ============
  section('CO. COMP-OFF LEAVE — separate bucket, deducts once');
  const apco = await call('POST', '/api/leaves', { employee_id: 'COA', employee_name: 'COA', company: 'SVN-1', leave_type: 'CO', start_date: '2026-09-25', end_date: '2026-09-25', days: 1, reason: 'comp off' }, HR);
  ok(apco.status === 200, `CO application accepted (got ${apco.status}: ${JSON.stringify(apco.json).slice(0, 90)})`);
  const coId = apco.json.application?.id;
  ok((apco.json.application || {}).status === 'PENDING_HOD', 'CO routed to PENDING_HOD');
  const hod1 = await call('POST', '/api/leaves/workflow', { id: coId, action: 'APPROVE' }, HR);
  ok(hod1.status === 200, 'CO HOD-stage approve → 200');
  const coBalBefore = (await get('COA')).leave_balance_compoff;
  const fin2 = await call('POST', '/api/leaves/workflow', { id: coId, action: 'APPROVE' }, HR);
  ok(fin2.status === 200, 'CO final approve → 200');
  const coa2 = await get('COA');
  ok(coa2.leave_balance_compoff === Math.max(0, coBalBefore - 1), `CO deducts compoff balance exactly once (${coBalBefore} → ${coa2.leave_balance_compoff})`);
  ok(coa2.leave_balance_cl === 8, 'CO does NOT touch CL balance (separate buckets)');

  // ============ T-CXL: CANCELLATION × PROCESSED PAYROLL HARD-LOCK ============
  section('T-CXL. CANCELLATION HARD-LOCK vs CLOSED PAYROLL');
  const aps = await call('POST', '/api/leaves', { employee_id: 'COA', employee_name: 'COA', company: 'SVN-1', leave_type: 'CL', start_date: '2026-09-28', end_date: '2026-09-28', days: 1, reason: 't-cxl' }, HR);
  const sid = aps.json.application?.id;
  await call('POST', '/api/leaves/workflow', { id: sid, action: 'APPROVE' }, HR);
  const fin3 = await call('POST', '/api/leaves/workflow', { id: sid, action: 'APPROVE' }, HR);
  ok(fin3.status === 200, 'setup: CL Sep-2026 approved (balance deducted once)');
  const clAfterApproval = (await get('COA')).leave_balance_cl;
  // Sep-2026 payroll: seed a DRAFT run then CLOSE it (processed/locked)
  const appDb = getAppDb();
  appDb!.data.payroll_runs = appDb!.data.payroll_runs || [];
  if (!appDb!.data.payroll_runs.some((r: any) => r.id === 'RUN-2026-09-SVN-1')) {
    appDb!.data.payroll_runs.push({ id: 'RUN-2026-09-SVN-1', month: '2026-09', company: 'SVN-1', status: 'DRAFT', created_at: new Date().toISOString() });
  }
  const close = await call('POST', '/api/payroll-runs/close', { month: '2026-09', company: 'SVN-1' }, HR);
  ok(close.status === 200, `Sep-2026 payroll closed/locked (got ${close.status}: ${JSON.stringify(close.json).slice(0, 80)})`);
  const cx = await call('POST', '/api/leaves/cancel', { leave_id: sid, reason: 'post-lock cancel attempt' }, HR);
  ok(cx.status === 409 && cx.json.error === 'PAYROLL_PERIOD_CLOSED', `approved+processed leave cancel → 409 PAYROLL_PERIOD_CLOSED (got ${cx.status}: ${JSON.stringify(cx.json).slice(0, 110)})`);
  const clAfterBlocked = (await get('COA')).leave_balance_cl;
  ok(clAfterBlocked === clAfterApproval, `no balance restore after blocked cancellation (${clAfterApproval} → ${clAfterBlocked})`);
  // pending (unprocessed) leave cancels directly
  const aps2 = await call('POST', '/api/leaves', { employee_id: 'COA', employee_name: 'COA', company: 'SVN-1', leave_type: 'CL', start_date: '2026-10-02', end_date: '2026-10-02', days: 1, reason: 'pending-cxl' }, HR);
  const sid2 = aps2.json.application?.id;
  const cx2 = await call('POST', '/api/leaves/cancel', { leave_id: sid2, reason: 'plans changed' }, HR);
  ok(cx2.status === 200, `pending leave cancels directly (got ${cx2.status}: ${JSON.stringify(cx2.json).slice(0, 90)})`);
  const cx2b = await call('POST', '/api/leaves/cancel', { leave_id: sid2, reason: 'again' }, HR);
  ok(cx2b.status === 409, 'duplicate cancellation → 409 (idempotent)');
  // approved but UNPROCESSED (Oct, payroll open) — HR cancellation allowed
  const aps3 = await call('POST', '/api/leaves', { employee_id: 'COA', employee_name: 'COA', company: 'SVN-1', leave_type: 'SL', start_date: '2026-10-05', end_date: '2026-10-05', days: 1, reason: 'unprocessed-cxl' }, HR);
  const sid3 = aps3.json.application?.id;
  await call('POST', '/api/leaves/workflow', { id: sid3, action: 'APPROVE' }, HR);
  await call('POST', '/api/leaves/workflow', { id: sid3, action: 'APPROVE' }, HR);
  const cx3 = await call('POST', '/api/leaves/cancel', { leave_id: sid3, reason: 'recovered' }, HR);
  ok(cx3.status === 200, `approved+unprocessed leave: HR cancellation allowed (got ${cx3.status}: ${JSON.stringify(cx3.json).slice(0, 90)})`);
  const cx3b = await call('POST', '/api/leaves/cancel', { leave_id: sid3, reason: 'retry' }, HR);
  ok(cx3b.status === 409, 'duplicate reversal blocked (no double credit)');
  // attendance untouched by blocked reversal
  const att = await call('GET', '/api/attendance/employee/COA', undefined, HR);
  const sep = (att.json || []).find((a: any) => a.month === '2026-09');
  ok(!!sep && Number(sep.leave_cl || 0) >= 1, 'Sep-2026 attendance still shows approved CL (untouched by blocked cancel)');

  // ============ RECON: REGISTER SUMMARY + EXCEPTION VIEW ============
  section('RECON. LEAVE REGISTER + HR EXCEPTION VISIBILITY');
  const reg = await call('GET', '/api/leave-register/summary', undefined, HR);
  ok(reg.status === 200 && Array.isArray(reg.json), 'GET /api/leave-register/summary → 200');
  const row = (reg.json || []).find((r: any) => (r.employee_id === 'COA' || r.id === 'COA'));
  ok(!!row && JSON.stringify(row).toLowerCase().includes('opening'), 'register exposes Opening balance fields (COA row)');
  ok(!!row && JSON.stringify(row).toLowerCase().includes('taken'), 'register exposes Leave Taken fields (COA row)');
  const reconc = await call('GET', '/api/reconciliation/2026-09?company=SVN-1', undefined, HR);
  ok(reconc.status === 200, 'GET /api/reconciliation/2026-09 → 200 (HR exception view available)');

  // ============ HISTORICAL ATTENDANCE (existing pipeline) ============
  section('HATT. HISTORICAL ATTENDANCE — existing importer pipeline');
  const attB = await call('GET', '/api/attendance?month=2026-09', undefined, HR);
  ok(attB.status === 200, 'attendance API healthy (existing import/template pipeline unchanged)');
  notRun('historical-attendance full-file import Apr–Aug (real CSV via existing importer — needs HR production file; pipeline itself unchanged by this branch)');

  console.log(`\n══════════════════════════════════════════════════════════════════\nRESULT: ${pass} passed, ${fail} failed${notExec.length ? `, NOT EXECUTED: ${notExec.length}` : ''}\n══════════════════════════════════════════════════════════════════`);
  if (notExec.length) notExec.forEach(n => console.log(`  ⚠ NOT EXECUTED: ${n}`));
  server.close();
  process.exit(fail ? 1 : 0);
}
start().catch(e => { console.error(e); process.exit(1); });
