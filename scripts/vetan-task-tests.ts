/**
 * VETAN ERP — Task verification (no production data touched):
 *   1. Form 16 new-regime engine: component aggregation + tax math (hand-verified)
 *   2. Employee-profile persistence: OCC conflict simulation (stale instance
 *      cannot overwrite newer edits) — the Task-2 "reverting profile" scenario.
 *
 * Run: npx tsx scripts/vetan-task-tests.ts
 */

import {
  REGIME_CONFIGS, currentFY, fyMonths, fyOfMonth,
  buildForm16Income, computeNewRegimeTax
} from '../server/form16-engine';
import { mergeStores } from '../src/lib/storeMerge';
import { PayrollDatabase } from '../server/db';

let pass = 0; let fail = 0;
function ok(cond: boolean, label: string) {
  if (cond) { pass++; console.log(`  ✅ ${label}`); }
  else { fail++; console.log(`  ❌ ${label}`); }
}
const inr = (v: number) => Math.round(v).toLocaleString('en-IN');

// ============================================================
console.log('\n=== 1. Form 16 ENGINE — tax math (new regime, FY-2026-27) ===');
const C = REGIME_CONFIGS['2026-27'];

// Case A: gross 15,00,000 → taxable 14,25,000 → slab tax 93,750, cess 3,750, net 97,500
{
  const t = computeNewRegimeTax(1500000, C);
  ok(t.taxable_income === 1425000, `taxable = 14,25,000 (got ${inr(t.taxable_income)})`);
  ok(t.tax_on_income === 93750, `slab tax = 93,750 (got ${inr(t.tax_on_income)})`);
  ok(t.rebate_87a === 0, 'no rebate above 12L');
  ok(t.marginal_relief === 0, 'no marginal relief at this level');
  ok(t.surcharge === 0, 'no surcharge under 50L');
  ok(t.cess === 3750, `cess = 3,750 (got ${inr(t.cess)})`);
  ok(t.net_tax_payable === 97500, `net = 97,500 (got ${inr(t.net_tax_payable)})`);
}

// Case B: gross 11,00,000 → taxable 10,25,000 → tax 42,500 fully rebated → net 0
{
  const t = computeNewRegimeTax(1100000, C);
  ok(t.taxable_income === 1025000, `taxable = 10,25,000 (got ${inr(t.taxable_income)})`);
  ok(t.rebate_87a === 42500, `87A rebate = 42,500 (got ${inr(t.rebate_87a)})`);
  ok(t.net_tax_payable === 0, `net tax = 0 (got ${inr(t.net_tax_payable)})`);
}

// Case C: marginal relief at 12L boundary — gross 13,00,000 → taxable 12,25,000
{
  const t = computeNewRegimeTax(1300000, C);
  ok(t.taxable_income === 1225000, `taxable = 12,25,000 (got ${inr(t.taxable_income)})`);
  ok(t.tax_on_income === 63750, `slab tax = 63,750 (got ${inr(t.tax_on_income)})`);
  ok(t.marginal_relief === 38750, `marginal relief = 38,750 (got ${inr(t.marginal_relief)})`);
  ok(t.net_tax_payable === 26000, `net = 26,000 ≤ income − 12L + cess (got ${inr(t.net_tax_payable)})`);
}

// Case D: FY helpers
{
  ok(fyMonths('2026-27').length === 12, 'FY has 12 months');
  ok(fyMonths('2026-27')[0] === '2026-04' && fyMonths('2026-27')[11] === '2027-03', 'Apr→Mar order');
  ok(fyOfMonth('2027-01') === '2026-27', 'Jan-27 maps to FY-2026-27');
  ok(/^2026-27$|^2027-28$/.test(currentFY()), `currentFY sane (${currentFY()})`);
}

// ============================================================
console.log('\n=== 2. Form 16 INCOME COMPONENTS — aggregation + no double count ===');
{
  const payslips = [
    { month: '2026-04', earned_base_salary: 50000, earned_hra: 20000, earned_special_allowance: 10000, overtime_pay: 500, earned_bonus_payable: 4000, arrear_payment: 5000, tds: 2000 },
    { month: '2026-05', earned_base_salary: 50000, earned_hra: 20000, earned_special_allowance: 10000, earned_leave_encashment: 100000, other_earnings: 2500, tds: 2000 }
  ];
  const inc = buildForm16Income(payslips as any, { fy: '2026-27', config: C });
  ok(inc.salary_income === 160500, `salary = 1,60,500 (80,500 Apr + 80,000 May incl OT only in Apr) (got ${inr(inc.salary_income)})`);
  ok(inc.bonus_income === 4000, `bonus = 4,000 (got ${inr(inc.bonus_income)})`);
  ok(inc.arrear_income === 5000, `arrear = 5,000 (got ${inr(inc.arrear_income)})`);
  ok(inc.leave_encashment_gross === 100000, `LE gross = 1,00,000 (got ${inr(inc.leave_encashment_gross)})`);
  ok(inc.leave_encashment_exemption === 100000, `LE exemption = min(actual, 10×50k, 25L) = 1,00,000 (got ${inr(inc.leave_encashment_exemption)})`);
  ok(inc.leave_encashment_taxable === 0, `LE taxable = 0 (got ${inr(inc.leave_encashment_taxable)})`);
  ok(inc.other_income === 2500, `other = 2,500 (got ${inr(inc.other_income)})`);
  const sum = inc.salary_income + inc.bonus_income + inc.arrear_income + inc.leave_encashment_taxable + inc.other_income;
  ok(sum === inc.gross_total_income, `no double count: Σcomponents == gross (got ${inr(inc.gross_total_income)})`);
  ok(inc.months_counted === 2 && inc.month_wise.length === 2, 'month-wise rows = 2');
  ok(inc.tds_deducted === 4000, `TDS = 4,000 (got ${inr(inc.tds_deducted)})`);
}

// Out-of-FY payslips must be excluded
{
  const inc = buildForm16Income([
    { month: '2025-01', earned_base_salary: 999999 } as any,
    { month: '2026-06', earned_base_salary: 10000 } as any
  ], { fy: '2026-27', config: C });
  ok(inc.salary_income === 10000 && inc.months_counted === 1, 'out-of-FY payslip excluded');
}

// F&F double-count guard: settlement in a month that already has LE payslip → skipped
{
  const inc = buildForm16Income(
    [{ month: '2026-08', earned_leave_encashment: 50000 } as any],
    { fy: '2026-27', config: C, ffSettlements: [{ employee_id: 'X', settlement_date: '2026-08-31', earned_leave_encashment: 30000 } as any] }
  );
  ok(inc.leave_encashment_gross === 50000, `F&F LE skipped when payslip already has it (got ${inr(inc.leave_encashment_gross)})`);
}

// ============================================================
console.log('\n=== 3. MERGE RULE — one-sided timestamp wins ===');
{
  const oldUnstamped = [{ id: 'E1', pan: 'OLDPAN', email: 'old@x.com' }];
  const newStamped = [{ id: 'E1', pan: 'NEWPAN', email: 'new@x.com', updated_at: '2026-09-08T10:00:00Z' }];
  // 'base' prefer (as in OCC conflict path): stamped incoming must STILL win
  const m = mergeStores({ employees: oldUnstamped }, { employees: newStamped }, 'base');
  ok(m.employees[0].pan === 'NEWPAN', `stamped record beats unstamped stale copy (got ${m.employees[0].pan})`);
  // reverse direction: stamped base must survive incoming unstamped
  const m2 = mergeStores({ employees: newStamped }, { employees: oldUnstamped }, 'incoming');
  ok(m2.employees[0].pan === 'NEWPAN', `stamped base survives unstamped incoming (got ${m2.employees[0].pan})`);
}

// ============================================================
console.log('\n=== 4. TASK-2 PERSISTENCE — OCC conflict simulation (fake Supabase) ===');

class FakeUpdate {
  constructor(private sb: FakeClient, private eqs: [string, any][], private payload: any) {}
  eq(k: string, v: any) { this.eqs.push([k, v]); return this; }
  select(_c?: string) { return this; }
  then(onF: any, onR: any) {
    const ver = this.eqs.find(e => e[0] === 'updated_at')?.[1];
    if (!this.sb.row || this.sb.row.updated_at !== ver) {
      return Promise.resolve({ data: [], error: null }).then(onF, onR); // CAS miss → conflict
    }
    this.sb.row = { payload: this.payload.payload, updated_at: this.payload.updated_at };
    return Promise.resolve({ data: [{ id: 'live' }], error: null }).then(onF, onR);
  }
}
class FakeQuery {
  private eqs: [string, any][] = [];
  constructor(private sb: FakeClient) {}
  select(_c?: string) { return this; }
  eq(k: string, v: any) { this.eqs.push([k, v]); return this; }
  async maybeSingle() {
    return { data: this.sb.row ? { payload: this.sb.row.payload, updated_at: this.sb.row.updated_at } : null, error: null };
  }
  update(payload: any) { return new FakeUpdate(this.sb, this.eqs, payload); }
  upsert(row: any) { this.sb.row = { payload: row.payload, updated_at: row.updated_at }; return Promise.resolve({ data: null, error: null }); }
  then(onF: any, onR: any) { return this.maybeSingle().then(onF, onR); }
}
class FakeClient {
  row: { payload: any; updated_at: string } | null = null;
  from(_t: string) { return new FakeQuery(this); }
}

function makeInstance(client: FakeClient, employees: any[], version: string): PayrollDatabase {
  const db = new PayrollDatabase(client as any);
  const d: any = db as any;
  d.data = {
    employees: JSON.parse(JSON.stringify(employees)),
    payslips: [], attendance: [], payroll_runs: [], leave_applications: [], ff_settlements: [],
    loans: [], salary_revisions: [], companies: []
  };
  d._loadedVersion = version;
  d.loadedFromSeed = false;
  d.dbSqlite = { run: () => {} };
  d.writeJsonAtomic = () => {};
  d.rotateLocalSnapshots = () => {};
  d.writeLocalSnapshot = () => {};
  d.createCloudSnapshot = async () => ({ ok: true });
  d.logAudit = () => {};
  return db;
}

const BASE_EMPS = [
  { id: 'E1', name: 'Test One', company: 'SVN-1', base_salary: 30000, pan: 'OLDPAN11', email: 'old@sakar.com', status: 'ACTIVE' },
  { id: 'E2', name: 'Test Two', company: 'SVN-1', base_salary: 20000, pan: 'OLDPAN22', email: 'e2@sakar.com', status: 'ACTIVE' }
];

// --- Test 7 (concurrent writers): Instance A edits E1; stale Instance B edits E2 → E1's NEW values must survive
{
  const cloud = new FakeClient();
  cloud.row = { payload: { employees: JSON.parse(JSON.stringify(BASE_EMPS)) }, updated_at: 'T0' };

  const A = makeInstance(cloud, BASE_EMPS, 'T0');
  const B = makeInstance(cloud, BASE_EMPS, 'T0'); // B loaded the same old version and went to sleep

  // HR on instance A changes PAN + email + photo (base64) of E1
  A.updateEmployee('E1', { pan: 'NEWPAN99', email: 'new@sakar.com', photo: 'data:image/png;base64,NEWPHOTO' } as any);
  const r1 = await A.persistDataSync();
  ok(r1.ok === true, `instance A save OK (cloud version ${cloud.row?.updated_at})`);
  ok(cloud.row!.payload.employees.find((e: any) => e.id === 'E1').pan === 'NEWPAN99', 'A: new PAN in cloud');

  // Days later, instance B (stale in-memory copy) saves an UNRELATED E2 edit
  B.updateEmployee('E2', { email: 'e2-updated@sakar.com' } as any);
  const r2 = await B.persistDataSync();
  ok(r2.ok === true, `instance B conflict-merged save OK (conflicts resolved: ${r2.conflict ? 'yes' : 'no'})`);

  const cloudE1 = cloud.row!.payload.employees.find((e: any) => e.id === 'E1');
  const cloudE2 = cloud.row!.payload.employees.find((e: any) => e.id === 'E2');
  ok(cloudE1.pan === 'NEWPAN99', `E1 PAN survived stale-instance write (got ${cloudE1.pan})`);
  ok(cloudE1.email === 'new@sakar.com', `E1 email survived (got ${cloudE1.email})`);
  ok(cloudE1.photo === 'data:image/png;base64,NEWPHOTO', 'E1 PHOTO survived (photo travels in employee record — no separate path)');
  ok(cloudE2.email === 'e2-updated@sakar.com', `E2 edit also survived (got ${cloudE2.email})`);
  ok(!!cloudE1.updated_at, 'E1 carries updated_at merge-stamp');
}

// --- Test 8: reload path — a stale instance reloads and must NOT clobber a fresher stamped record it holds in flight
{
  const cloud = new FakeClient();
  cloud.row = { payload: { employees: JSON.parse(JSON.stringify(BASE_EMPS)) }, updated_at: 'T0' };
  const A = makeInstance(cloud, BASE_EMPS, 'T0');

  // In-flight edit on A (dirty, stamped) — meanwhile cloud moves to T1 with an older E1 copy
  A.updateEmployee('E1', { pan: 'INFLIGHT1' } as any);
  cloud.row = { payload: { employees: [{ ...BASE_EMPS[0], pan: 'CLOUD-OLDER', updated_at: '2026-09-01T00:00:00Z' }, BASE_EMPS[1]] }, updated_at: 'T1' };

  await A.reloadFromSupabase();
  const e1 = (A as any).data.employees.find((e: any) => e.id === 'E1');
  ok(e1.pan === 'INFLIGHT1', `in-flight edit survives reload (got ${e1.pan})`);

  // And the reverse: A reloads with NO in-flight edits → adopts the newer cloud copy
  const A2 = makeInstance(cloud, JSON.parse(JSON.stringify(BASE_EMPS)), 'T0');
  await A2.reloadFromSupabase();
  const e1b = (A2 as any).data.employees.find((e: any) => e.id === 'E1');
  ok(e1b.pan === 'CLOUD-OLDER', `stale instance adopts newer cloud copy on reload (got ${e1b.pan})`);
}

console.log(`\n==============================\nRESULT: ${pass} passed, ${fail} failed\n==============================`);
process.exit(fail > 0 ? 1 : 0);
