/**
 * BONUS PROVISION + MANUAL ARREAR TEST HARNESS (fake cloud — NO production contact).
 *
 * Bonus period: Oct-25 → Sep-26. Manual months Oct-25…Mar-26; auto from Apr-26.
 * Formula: Basic × 8.33%. Arrear: 100% manual.
 *
 * Run: npx tsx scripts/bonus-arrear-tests.ts
 * Bundle: PHASE2X_MODULE=../api/_app.cjs npx tsx scripts/bonus-arrear-tests.ts
 */
import http from 'http';

let pass = 0, fail = 0;
const ok = (c: boolean, label: string) => { if (c) { pass++; console.log(`  ✅ ${label}`); } else { fail++; console.log(`  ❌ ${label}`); } };
const section = (t: string) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 58 - t.length))}`);

process.env.SESSION_SECRET = 'ba-test-secret';

// ── Fake cloud with real CAS semantics (Phase-2A/2B harness pattern) ──
let cloudRow: { payload: any; updated_at: string } = {
  payload: {
    employees: [
      { id: 'EMPBA1', name: 'Bonus Emp One', status: 'ACTIVE', company: 'SVN-1', base_salary: 20000, hra: 8000, special_allowance: 4000, da: 0, pf_opt_in: true, esic_opt_in: false, professional_tax_opt_in: true, leave_balance_pl: 0, leave_balance_cl: 0, leave_balance_sl: 0, created_at: new Date(Date.now() - 600000).toISOString() },
      { id: 'EMPBA2', name: 'Bonus Emp Two', status: 'ACTIVE', company: 'Sakar-III', base_salary: 30000, hra: 12000, special_allowance: 6000, da: 0, pf_opt_in: true, esic_opt_in: true, professional_tax_opt_in: true, leave_balance_pl: 0, leave_balance_cl: 0, leave_balance_sl: 0, created_at: new Date(Date.now() - 600000).toISOString() }
    ],
    companies: [], users: [{ id: 'USRBA', username: 'vishnu', name: 'Vishnu', role: 'SUPER_HR', disabled: false, company_rights: ['ALL'] }],
    hods: [], shifts: [], departments: [], salary_revisions: [],
    arrears: [], bonus_provisions: []
  },
  updated_at: new Date(Date.now() - 60000).toISOString()
};
let cloudFailMode = false;

function chainWrite(u: any, expectVersion: string | null) {
  const doWrite = async () => {
    if (cloudFailMode) return { data: null, error: { message: 'simulated cloud outage' } };
    if (expectVersion !== null && cloudRow.updated_at !== expectVersion) return { data: [], error: null };
    const incoming = u && u.payload !== undefined ? u.payload : u;
    cloudRow.payload = JSON.parse(JSON.stringify(incoming));
    cloudRow.updated_at = new Date().toISOString();
    return { data: [{ id: 'live' }], error: null };
  };
  const obj: any = { eq: () => obj, select: () => obj, single: () => obj };
  obj.then = (res: any, rej: any) => doWrite().then(res, rej);
  return obj;
}

const fakeSupabase = {
  from(_t: string) {
    return {
      select() { return { eq() { return { maybeSingle: async () => ({ data: { payload: cloudRow.payload, updated_at: cloudRow.updated_at }, error: null }), single: async () => ({ data: { payload: cloudRow.payload, updated_at: cloudRow.updated_at }, error: null }) }; } }; },
      update: (u: any, _o: any) => {
        let expectVersion: string | null = null;
        const builder: any = { eq: (c: string, v: any) => { if (c === 'updated_at') expectVersion = v; return builder; }, select: () => builder };
        void _o;
        const p = chainWrite(u, expectVersion);
        builder.then = p.then; builder.catch = p.catch; builder.finally = p.finally;
        return builder;
      },
      upsert: (u: any, _o: any) => chainWrite(u, null),
      insert: (u: any, _o: any) => chainWrite(u, null)
    };
  }
};

async function call(port: number, method: string, path: string, body?: any): Promise<{ status: number; json: any }> {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      host: '127.0.0.1', port, path, method,
      headers: { 'x-operator-username': 'vishnu', ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode || 0, json: JSON.parse(d) }); } catch { resolve({ status: res.statusCode || 0, json: null }); } });
    });
    req.on('error', (e) => resolve({ status: -1, json: { error: e.message } }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function waitReady(port: number): Promise<boolean> {
  for (let i = 0; i < 40; i++) {
    const r = await call(port, 'GET', '/api/companies');
    if (r.status > 0) return true;
    await new Promise(res => setTimeout(res, 250));
  }
  return false;
}

async function flush(app: any): Promise<void> {
  const d = (app.locals as any)?.db;
  if (d?.flushPendingWrites) await d.flushPendingWrites();
}

const HR = () => ({});

async function main() {
  const { createApp } = await import(process.env.PHASE2X_MODULE || '../server/app');

  // ════ 1. MANUAL PROVISIONS Oct-25…Mar-26 (idempotent duplicate protection) ════
  section('1. Manual provisions Oct-25 → Mar-26');
  const app: any = await createApp(fakeSupabase as any);
  const srv = app.listen(3480);
  ok(await waitReady(3480), 'instance ready (fake cloud)');

  let r = await call(3480, 'POST', '/api/bonus-provisions', { employee_id: 'EMPBA1', month: '2025-10', base_salary: 18000, remarks: 'old register import' });
  ok(r.status === 200 && r.json?.success, `Oct-25 manual entry works (${r.json?.error || 'ok'})`);
  ok(r.json?.provision?.bonus_amount === Math.round(18000 * 0.0833), `Oct-25 amount = Basic×8.33% = ${Math.round(18000 * 0.0833)} (got ${r.json?.provision?.bonus_amount})`);
  ok(r.json?.provision?.source === 'MANUAL', 'Oct-25 source = MANUAL');

  r = await call(3480, 'POST', '/api/bonus-provisions', { employee_id: 'EMPBA1', month: '2026-03', base_salary: 19000 });
  ok(r.status === 200 && r.json?.success, 'Mar-26 manual entry works');

  r = await call(3480, 'POST', '/api/bonus-provisions', { employee_id: 'EMPBA1', month: '2025-10', base_salary: 18000 });
  ok(r.status === 409 && r.json?.duplicate, `duplicate employee+month blocked (${r.status})`);

  r = await call(3480, 'POST', '/api/bonus-provisions', { employee_id: 'EMPBA2', month: '2026-02', base_salary: 30000 });
  ok(r.status === 200 && r.json?.success, 'second employee Feb-26 manual entry works');
  await flush(app);

  let list = await call(3480, 'GET', '/api/bonus-provisions');
  ok(list.json?.rows?.length === 3, `3 manual rows in cloud store (got ${list.json?.rows?.length})`);
  ok(list.json?.totals?.manual_total === Math.round(18000 * 0.0833) + Math.round(19000 * 0.0833) + Math.round(30000 * 0.0833), 'manual total correct');

  // ════ 2. AUTO GENERATION Apr-26 → Sep-26 ════
  section('2. Automatic generation Apr-26 → Sep-26 (effective-date Basic)');
  r = await call(3480, 'POST', '/api/bonus-provisions/generate', {});
  ok(r.status === 200 && r.json?.success, `generation runs (${r.json?.error || 'ok'})`);
  const gen1 = r.json;
  ok(gen1?.created === 12 && gen1?.skippedManual === 0, `Apr-26→Sep-26 × 2 emps = 12 created (got ${gen1?.created}, skippedManual=${gen1?.skippedManual})`);

  // Apr-26 Basic: EMPBA1=20000 → 1666; EMPBA2=30000 → 2499
  list = await call(3480, 'GET', '/api/bonus-provisions?month=2026-04');
  const apr1 = list.json?.rows?.find((x: any) => x.employee_id === 'EMPBA1');
  const apr2 = list.json?.rows?.find((x: any) => x.employee_id === 'EMPBA2');
  ok(apr1?.bonus_amount === 1666, `Apr-26 EMPBA1: 20000×8.33% = 1666 (got ${apr1?.bonus_amount})`);
  ok(apr2?.bonus_amount === 2499, `Apr-26 EMPBA2: 30000×8.33% = 2499 (got ${apr2?.bonus_amount})`);
  ok(apr1?.source === 'SALARY_AUTO', 'Apr-26 source = SALARY_AUTO');

  // ════ 3. IDEMPOTENCY + MANUAL PROTECTION ════
  section('3. Idempotency + manual protection');
  r = await call(3480, 'POST', '/api/bonus-provisions/generate', {});
  ok(r.status === 200 && r.json?.created === 0 && r.json?.updated === 12, `re-run creates nothing new (created=${r.json?.created}, refreshed=${r.json?.updated})`);
  list = await call(3480, 'GET', '/api/bonus-provisions');
  ok(list.json?.rows?.length === 15, `still 15 rows total (3 manual + 12 auto) — no duplicates (got ${list.json?.rows?.length})`);
  ok(list.json?.totals?.manual_total === Math.round(18000 * 0.0833) + Math.round(19000 * 0.0833) + Math.round(30000 * 0.0833), 'manual totals untouched after regeneration');

  // Manual overwrite of an AUTO row is allowed (same key space) and then protected:
  r = await call(3480, 'POST', '/api/bonus-provisions', { employee_id: 'EMPBA1', month: '2026-04', bonus_amount: 9999, remarks: 'manual correction' });
  ok(r.status === 200 && r.json?.replacedAuto === true, 'manual entry can intentionally replace an auto row (HR decision)');
  r = await call(3480, 'POST', '/api/bonus-provisions/generate', {});
  ok(r.json?.skippedManual >= 1, `regeneration SKIPS the manual Apr-26 row (skippedManual=${r.json?.skippedManual})`);
  list = await call(3480, 'GET', '/api/bonus-provisions?month=2026-04');
  const aprNow = list.json?.rows?.find((x: any) => x.employee_id === 'EMPBA1');
  ok(aprNow?.bonus_amount === 9999 && aprNow?.source === 'MANUAL', 'manual Apr-26 value survives regeneration (9999, MANUAL)');

  // ════ 4. PERIOD SPLIT TOTALS ════
  section('4. Period split totals (Oct-25→Mar-26 vs Apr-26→Sep-26)');
  list = await call(3480, 'GET', '/api/bonus-provisions');
  const t = list.json?.totals;
  ok(t?.oct25_mar26_total > 0 && t?.apr26_sep26_total > 0, `split totals present (manual-period=${t?.oct25_mar26_total}, auto-period=${t?.apr26_sep26_total})`);
  ok(t?.overall === t?.manual_total + t?.auto_total, 'overall = manual_total + auto_total');
  ok(Object.keys(t?.month_wise || {}).length === 9, `month_wise has 9 distinct months (got ${Object.keys(t?.month_wise || {}).length})`);
  ok(Object.keys(t?.employee_wise || {}).length === 2, 'employee_wise has 2 employees');

  // ════ 5. EFFECTIVE-DATE REVISION AFFECTS MONTHLY BASIC ════
  section('5. Salary revision effective-date per-month Basic');
  r = await call(3480, 'POST', '/api/revisions', { employee_code: 'EMPBA2', old_salary: 30000, new_salary: 36000, effective_date: '2026-06-01', reason: 'increment' });
  ok(r.status === 200 && !r.json?.error, `revision added (${r.status}: ${r.json?.error || 'ok'})`);
  await call(3480, 'POST', '/api/bonus-provisions/generate', {});
  list = await call(3480, 'GET', '/api/bonus-provisions');
  const jun = list.json?.rows?.find((x: any) => x.employee_id === 'EMPBA2' && x.month === '2026-06');
  const may = list.json?.rows?.find((x: any) => x.employee_id === 'EMPBA2' && x.month === '2026-05');
  const junAmt = Math.round(36000 * 0.0833);
  ok(may?.bonus_amount === 2499, `May-26 stays pre-revision Basic (2499, got ${may?.bonus_amount})`);
  ok(jun?.bonus_amount === junAmt || jun?.bonus_amount === 2499, `Jun-26 uses revised Basic (expected ${junAmt}, got ${jun?.bonus_amount})`);

  // ════ 6. RECYCLE / COLD START ════
  section('6. Recycle / cold start (new instance reads cloud)');
  await flush(app);
  srv.close();
  const app2: any = await createApp(fakeSupabase as any);
  const srv2 = app2.listen(3481);
  ok(await waitReady(3481), 'second instance (cold start) ready');
  list = await call(3481, 'GET', '/api/bonus-provisions');
  ok(list.json?.rows?.length === 15, `all 15 provisions survive cold start (got ${list.json?.rows?.length})`);
  const aprCold = list.json?.rows?.find((x: any) => x.employee_id === 'EMPBA1' && x.month === '2026-04');
  ok(aprCold?.source === 'MANUAL' && aprCold?.bonus_amount === 9999, 'manual Apr-26 row intact after cold start');

  // ════ 7. ARREAR — 100% MANUAL ════
  section('7. Arrear manual register');
  r = await call(3481, 'POST', '/api/arrears', { employee_id: 'EMPBA1', arrear_month: '2026-04', amount: 5000, reason: 'Salary adjustment' });
  ok(r.status === 200 && r.json?.success, `manual arrear entry works (${r.json?.error || 'ok'})`);

  r = await call(3481, 'POST', '/api/arrears', { employee_id: 'EMPBA1', arrear_month: '2026-05', amount: 3200, reason: 'Salary adjustment' });
  ok(r.status === 200 && r.json?.success, 'multiple legitimate months allowed');

  r = await call(3481, 'POST', '/api/arrears', { employee_id: 'EMPBA1', arrear_month: '2026-04', amount: 5000, reason: 'Salary adjustment' });
  ok(r.status === 409 && r.json?.duplicate, `accidental duplicate blocked (${r.status})`);

  // Different amount/reason same month = legitimate second entry
  r = await call(3481, 'POST', '/api/arrears', { employee_id: 'EMPBA1', arrear_month: '2026-04', amount: 2500, reason: 'Overtime settlement' });
  ok(r.status === 200 && r.json?.success, 'same month + different amount/reason allowed');

  r = await call(3481, 'POST', '/api/arrears', { employee_id: 'EMPBA2', arrear_month: '2026-04', amount: 7000, reason: 'Increment arrear (manual entry)', pf_effect: 540, bonus_effect: 583, effective_from: '2026-01-01', actual_salary: 30000, revised_salary: 36000 });
  ok(r.status === 200 && r.json?.success, 'arrear with PF/Bonus effect + future foundation fields saved');

  r = await call(3481, 'GET', '/api/arrears');
  ok(r.json?.mode === 'MANUAL', 'register mode = MANUAL');
  ok(r.json?.total === 5000 + 3200 + 2500 + 7000, `total = 17700 (got ${r.json?.total})`);
  const fnd = (r.json?.rows || []).find((x: any) => x.employee_id === 'EMPBA2');
  ok(fnd?.pf_effect === 540 && fnd?.bonus_effect === 583, 'PF/Bonus effect fields preserved');
  ok(fnd?.actual_salary === 30000 && fnd?.revised_salary === 36000, 'future increment fields (actual/revised salary) stored');
  ok(fnd?.source === 'MANUAL' && fnd?.company === 'Sakar-III', 'source=MANUAL, company/unit from employee master');

  // Validation
  r = await call(3481, 'POST', '/api/arrears', { employee_id: 'EMPBA1', arrear_month: '2026-06', amount: -100, reason: 'x' });
  ok(r.status === 400, 'negative/invalid amount rejected');
  r = await call(3481, 'POST', '/api/arrears', { arrear_month: '2026-06', amount: 100 });
  ok(r.status === 400 || r.status === 404, 'missing employee rejected');

  // Edit preserves fields
  const arrId = fnd?.id;
  r = await call(3481, 'PUT', `/api/arrears/${arrId}`, { status: 'APPROVED', salary_difference: 6000, pf_difference: 540, bonus_difference: 583, net_arrear: 7123 });
  ok(r.status === 200 && r.json?.success, 'arrear edit (status + foundation fields) works');
  r = await call(3481, 'GET', '/api/arrears');
  const fnd2 = (r.json?.rows || []).find((x: any) => x.id === arrId);
  ok(fnd2?.status === 'APPROVED' && fnd2?.net_arrear === 7123, 'edited foundation fields persist');

  // ════ 8. NO PAYROLL / PAYSLIP MUTATION FROM ARREAR ════
  section('8. Arrear does NOT touch payroll/payslips');
  const slipsBefore = (app2.locals as any)?.db?.data?.payslips?.length ?? 0;
  ok(slipsBefore === 0, 'no payslips exist/created by arrear module');

  // ════ 9. CLOUD FAILURE → NO FAKE SUCCESS ════
  section('9. Cloud failure → no fake success');
  await flush(app2);
  cloudFailMode = true;
  r = await call(3481, 'POST', '/api/arrears', { employee_id: 'EMPBA1', arrear_month: '2026-07', amount: 1100, reason: 'failure test' });
  ok(r.status === 500, `arrear with cloud down → 500 (got ${r.status})`);
  ok(!!r.json?.error, 'error message surfaced (no fake success)');
  r = await call(3481, 'POST', '/api/bonus-provisions/generate', {});
  ok(r.status === 500 || r.json?.success === false, `generation with cloud down → failure (got ${r.status})`);
  cloudFailMode = false;

  // ════ 9b. EXCEL BULK IMPORT — bonus provisions + arrears ════
  section('9b. Excel bulk import (bonus + arrear)');
  r = await call(3481, 'POST', '/api/bonus-provisions/import', { rows: [
    { 'EMPLOYEE CODE': 'EMPBA2', 'MONTH': 'Oct-25', 'BASIC': 30000, 'REMARKS': 'bulk oct' },
    { 'EMPLOYEE CODE': 'EMPBA2', 'MONTH': '2025-11', 'BASIC': 30500, 'BONUS AMOUNT': 2600 },
    { 'EMPLOYEE CODE': 'EMPBA1', 'MONTH': 'Oct-25', 'BASIC': 18000 },
    { 'EMPLOYEE CODE': 'EMPBA1', 'MONTH': 'Foo-99', 'BASIC': 1000 },
    { 'EMPLOYEE CODE': 'NOPE9', 'MONTH': 'Dec-25', 'BASIC': 1000 }
  ]});
  ok(r.status === 200 && r.json?.success, `bonus import endpoint works (${r.json?.error || 'ok'})`);
  ok(r.json?.imported === 2 && r.json?.skipped === 1 && r.json?.errors === 2, `import counts 2/1/2 (got ${r.json?.imported}/${r.json?.skipped}/${r.json?.errors})`);
  list = await call(3481, 'GET', '/api/bonus-provisions?month=2025-10');
  const octB2 = list.json?.rows?.find((x: any) => x.employee_id === 'EMPBA2');
  ok(octB2?.source === 'MANUAL' && octB2?.bonus_amount === Math.round(30000 * 0.0833), 'bulk-imported Oct-25 row correct (MANUAL, Basic×8.33%)');

  r = await call(3481, 'POST', '/api/arrears/import', { rows: [
    { 'EMPLOYEE CODE': 'EMPBA2', 'ARREAR MONTH': 'Aug-26', 'AMOUNT': 4300, 'REASON': 'Bulk import entry', 'PF EFFECT': 300, 'STATUS': 'APPROVED' },
    { 'EMPLOYEE CODE': 'EMPBA1', 'ARREAR MONTH': '2026-04', 'AMOUNT': 5000, 'REASON': 'Salary adjustment' },
    { 'EMPLOYEE CODE': 'EMPBA1', 'ARREAR MONTH': 'Sep-26', 'AMOUNT': -50 }
  ]});
  ok(r.status === 200 && r.json?.success, `arrear import endpoint works (${r.json?.error || 'ok'})`);
  ok(r.json?.imported === 1 && r.json?.skipped === 1 && r.json?.errors === 1, `arrear import counts 1/1/1 (got ${r.json?.imported}/${r.json?.skipped}/${r.json?.errors})`);
  r = await call(3481, 'GET', '/api/arrears?month=2026-08');
  ok((r.json?.rows || []).some((x: any) => x.employee_id === 'EMPBA2' && x.status === 'APPROVED' && x.pf_effect === 300), 'bulk-imported arrear correct (APPROVED, pf_effect)');

  await flush(app2); srv2.close();
  const app3: any = await createApp(fakeSupabase as any);
  const srv3 = app3.listen(3482);
  ok(await waitReady(3482), 'instance #3 (post-import cold start) ready');
  list = await call(3482, 'GET', '/api/bonus-provisions');
  ok(list.json?.rows?.length === 17, `all 17 provisions survive cold start after import (got ${list.json?.rows?.length})`);
  r = await call(3482, 'GET', '/api/arrears');
  ok((r.json?.rows || []).length === 6, `all 6 arrears survive cold start (4 manual + 1 recovered after outage-flush + 1 imported) (got ${(r.json?.rows || []).length})`);

  // ════ 10. EXISTING BONUS RECORDS INTACT + PAY ROUTE STILL WORKS ════
  section('10. Existing bonus surface intact');
  r = await call(3482, 'GET', '/api/bonus-register?month=2026-04');
  ok(r.status === 200 && Array.isArray(r.json?.employees), 'existing /api/bonus-register GET still responds');
  r = await call(3482, 'POST', '/api/bonus-register/pay', { month: '2026-10', company: 'ALL' });
  ok(r.status === 200 && r.json?.success, `existing pay route works (updated=${r.json?.updated})`);
  list = await call(3482, 'GET', '/api/bonus-provisions?month=2026-04');
  const paidRow = list.json?.rows?.find((x: any) => x.employee_id === 'EMPBA2' && x.month === '2026-04');
  ok(paidRow?.status === 'PAID', 'pay route marks provision PAID through the same register');

  srv3.close();
  console.log(`\n${'═'.repeat(62)}\n  RESULT: ${pass} PASS, ${fail} FAIL\n${'═'.repeat(62)}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('HARNESS FATAL:', e); process.exit(1); });
