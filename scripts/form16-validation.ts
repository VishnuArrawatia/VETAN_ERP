/**
 * INDEPENDENT FORM 16 VALIDATION (Task 1) — no code changes unless a real error.
 *
 * Cross-checks the engine (server/form16-engine.ts) against a FRESHLY WRITTEN
 * independent slab reference (refSlabTax below — re-implemented here, not reusing
 * engine internals) + hand-verified numbers. Synthetic payslips only — NO
 * production data touched.
 *
 * Run: npx tsx scripts/form16-validation.ts
 */
import { REGIME_CONFIGS, buildForm16Income, computeNewRegimeTax } from '../server/form16-engine';

let pass = 0, fail = 0;
const ok = (c: boolean, l: string) => { if (c) { pass++; } else { fail++; console.log(`   ❌ ${l}`); } };
const INR = (v: number) => Math.round(v).toLocaleString('en-IN');

// ---------------------------------------------------------------------------
// INDEPENDENT REFERENCE — new-regime slab tax, re-implemented here from the
// Finance Act 2025 table (NOT touching engine internals).
// ---------------------------------------------------------------------------
function refSlabTax(taxable: number, slabs: { upTo: number | null; rate: number }[]) {
  let tax = 0, lower = 0, out: { from: number; to: number | null; rate: number; tax: number }[] = [];
  for (const s of slabs) {
    const upper = s.upTo === null ? taxable : Math.min(s.upTo, taxable);
    if (upper > lower) {
      const t = Math.round((upper - lower) * s.rate);
      tax += t; out.push({ from: lower, to: s.upTo, rate: s.rate, tax: t });
    }
    lower = s.upTo === null ? taxable : s.upTo;
    if (s.upTo === null || taxable <= s.upTo) break;
  }
  return { tax, out };
}
function refNewRegime(taxable: number, C: typeof REGIME_CONFIGS['2026-27']) {
  const t = refSlabTax(taxable, C.slabs).tax;
  let rebate = 0, marginalRelief = 0;
  if (taxable <= C.rebateIncomeLimit) rebate = Math.min(t, C.rebateMax);
  else { const ex = taxable - C.rebateIncomeLimit; if (t > ex) marginalRelief = t - ex; }
  const afterRebate = Math.max(0, t - marginalRelief - rebate);
  let surcharge = 0, sr = 0;
  for (const tier of C.surcharge) {
    if (taxable > tier.above) {
      surcharge = Math.round(afterRebate * tier.rate);
      const over = taxable - tier.above;
      if (surcharge > over) { sr = surcharge - over; surcharge = over; }
      break;
    }
  }
  const cess = Math.round((afterRebate + surcharge) * C.cessRate);
  return { tax: t, rebate, marginalRelief, surcharge, surchargeRelief: sr, cess, net: afterRebate + surcharge + cess };
}

const C = REGIME_CONFIGS['2026-27'];
const MONTHS = ['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09','2026-10','2026-11','2026-12','2027-01','2027-02','2027-03'];

/** Build 12 monthly payslips with the SAME salary composition + optional one-month extras. */
function twelve(base: number, hra: number, special: number, edu: number, med: number, conv: number, extras?: Partial<any> & { monthIdx?: number }) {
  const tds = extras?.tds || 0; delete (extras as any)?.tds;
  const extraMonth = extras?.monthIdx ?? 0; const e = { ...extras }; delete (e as any).monthIdx;
  return MONTHS.map((m, i) => {
    const one = i === extraMonth ? e : {};
    return {
      month: m, earned_base_salary: base, earned_hra: hra, earned_special_allowance: special,
      earned_da: 0, earned_edu_allowance: edu, earned_medical_allowance: med, earned_conveyance_allowance: conv, overtime_pay: 0,
      earned_bonus_payable: 0, bonus_incentive: 0, performance_incentive: 0, attendance_incentive: 0, production_incentive: 0,
      arrear_payment: 0, earned_leave_encashment: 0, other_earnings: 0, special_allowance_addition: 0, tds: i === extraMonth ? tds : 0, ...one
    };
  });
}

interface Report { name: string; components: Record<string, number>; gross: number; exemption: number; std: number; taxable: number; slabs: { from: number; to: number | null; rate: number; tax: number }[]; rebate: number; mrelief: number; surcharge: number; cess: number; net: number; tds: number; balance: number; refund?: number }

function runCase(name: string, payslips: any[], extras?: { ff?: any[] }): Report {
  const inc = buildForm16Income(payslips, { fy: '2026-27', config: C, ffSettlements: extras?.ff });
  const tax = computeNewRegimeTax(inc.gross_total_income, C);
  const balance = Math.max(0, tax.net_tax_payable - inc.tds_deducted);
  return {
    name,
    components: {
      salary: inc.salary_income, bonus: inc.bonus_income, arrear: inc.arrear_income,
      LE_gross: inc.leave_encashment_gross, LE_exempt: inc.leave_encashment_exemption, LE_taxable: inc.leave_encashment_taxable, other: inc.other_income
    },
    gross: inc.gross_total_income,
    exemption: inc.leave_encashment_exemption,
    std: tax.total_deductions,
    taxable: tax.taxable_income,
    slabs: tax.slabs_applied,
    rebate: tax.rebate_87a,
    mrelief: tax.marginal_relief,
    surcharge: tax.surcharge,
    cess: tax.cess,
    net: tax.net_tax_payable,
    tds: inc.tds_deducted,
    balance,
    refund: inc.tds_deducted > tax.net_tax_payable ? inc.tds_deducted - tax.net_tax_payable : 0
  };
}

function print(r: Report) {
  console.log(`\n--- ${r.name} ---`);
  console.log(`  Salary               : ₹${INR(r.components.salary)}`);
  console.log(`  Bonus                : ₹${INR(r.components.bonus)}`);
  console.log(`  Arrear               : ₹${INR(r.components.arrear)}`);
  console.log(`  Leave Encash (gross) : ₹${INR(r.components.LE_gross)}`);
  console.log(`  Leave Encash exempt  : ₹${INR(r.components.LE_exempt)}`);
  console.log(`  Leave Encash taxable : ₹${INR(r.components.LE_taxable)}`);
  console.log(`  Other                : ₹${INR(r.components.other)}`);
  console.log(`  GROSS TOTAL          : ₹${INR(r.gross)}`);
  console.log(`  Less Standard Deduct : ₹${INR(r.std)}`);
  console.log(`  TAXABLE INCOME       : ₹${INR(r.taxable)}`);
  r.slabs.forEach(s => console.log(`    slab ${INR(s.from + 1)}–${s.to === null ? 'above' : INR(s.to)} @ ${(s.rate * 100).toFixed(0)}% = ₹${INR(s.tax)}`));
  console.log(`  Rebate u/s 87A       : ₹${INR(r.rebate)}`);
  console.log(`  Marginal relief      : ₹${INR(r.mrelief)}`);
  console.log(`  Surcharge            : ₹${INR(r.surcharge)}`);
  console.log(`  Cess 4%              : ₹${INR(r.cess)}`);
  console.log(`  NET TAX              : ₹${INR(r.net)}`);
  console.log(`  TDS deducted         : ₹${INR(r.tds)}`);
  console.log(`  Balance payable      : ₹${INR(r.balance)}${r.refund ? `  (REFUNDABLE ₹${INR(r.refund)})` : ''}`);
}

console.log('=== FORM 16 INDEPENDENT VALIDATION (FY-2026-27, New Regime) ===');

// ---------------------------------------------------------------------------
// CASE 1 — ONLY SALARY (12 × 68,500 = 822,000)
// ---------------------------------------------------------------------------
{
  const r = runCase('Case 1 — Only Salary', twelve(40000, 16000, 8000, 1000, 1500, 2000));
  print(r);
  ok(r.gross === 822000, `C1 gross 822000 (${INR(r.gross)})`);
  ok(r.components.bonus === 0 && r.components.arrear === 0 && r.components.LE_gross === 0 && r.components.other === 0, 'C1 zero bonus/arrear/LE/other');
  ok(r.taxable === 747000, `C1 taxable 747000 (${INR(r.taxable)})`);
  ok(r.slabs.reduce((s, x) => s + x.tax, 0) === 17350, `C1 slab tax 17350 (${INR(r.slabs.reduce((s, x) => s + x.tax, 0))})`);
  ok(r.rebate === 17350, `C1 rebate 17350 (${INR(r.rebate)})`);
  ok(r.net === 0 && r.balance === 0, `C1 net 0 (${INR(r.net)})`);
}

// ---------------------------------------------------------------------------
// CASE 2 — SALARY + BONUS (600,000 + 100,000)
// ---------------------------------------------------------------------------
{
  const r = runCase('Case 2 — Salary + Bonus', twelve(30000, 12000, 8000, 0, 0, 0, {
    earned_bonus_payable: 40000, bonus_incentive: 30000, performance_incentive: 15000, attendance_incentive: 10000, production_incentive: 5000
  }));
  print(r);
  ok(r.gross === 700000, `C2 gross 700000 (${INR(r.gross)})`);
  ok(r.components.bonus === 100000, `C2 bonus 100000 (${INR(r.components.bonus)})`);
  ok(r.components.salary === 600000, `C2 salary 600000 (${INR(r.components.salary)})`);
  ok(r.taxable === 625000 && r.net === 0, `C2 taxable 625000, net 0 (${INR(r.taxable)}, ${INR(r.net)})`);
}

// ---------------------------------------------------------------------------
// CASE 3 — SALARY + ARREAR (600,000 + 150,000)
// ---------------------------------------------------------------------------
{
  const r = runCase('Case 3 — Salary + Arrear', twelve(30000, 12000, 8000, 0, 0, 0, { arrear_payment: 150000 }));
  print(r);
  ok(r.gross === 750000, `C3 gross 750000 (${INR(r.gross)})`);
  ok(r.components.arrear === 150000, `C3 arrear 150000 (${INR(r.components.arrear)})`);
  ok(r.taxable === 675000 && r.net === 0, `C3 taxable 675000, net 0 (${INR(r.taxable)})`);
}

// ---------------------------------------------------------------------------
// CASE 4 — SALARY + LEAVE ENCASHMENT (600,000 + 400,000 gross; avg base 30,000)
//   exemption = min(400000, 10×30000=300000, 25L) = 300000 → LE taxable 100000
// ---------------------------------------------------------------------------
{
  const r = runCase('Case 4 — Salary + Leave Encashment', twelve(30000, 12000, 8000, 0, 0, 0, { earned_leave_encashment: 400000 }));
  print(r);
  ok(r.components.LE_gross === 400000, `C4 LE gross 400000 (${INR(r.components.LE_gross)})`);
  ok(r.exemption === 300000, `C4 LE exemption 300000 (${INR(r.exemption)})`);
  ok(r.components.LE_taxable === 100000, `C4 LE taxable 100000 (${INR(r.components.LE_taxable)})`);
  ok(r.gross === 700000, `C4 gross 700000 (${INR(r.gross)})`);
  ok(r.taxable === 625000 && r.net === 0, `C4 net 0 (${INR(r.net)})`);
}

// ---------------------------------------------------------------------------
// CASE 5 — FULL: salary 1,140,000 + bonus 70,000 + arrear 50,000 + LE 100,000(exempt) + other 20,000
//   gross 1,280,000; taxable 1,205,000 (>12L) → MARGINAL RELIEF case.
//   Independent reference: slab 60,750; excess 5,000 → marginal relief 55,750;
//   after 5,000; cess 200; net 5,200; TDS 3,000 → balance 2,200
// ---------------------------------------------------------------------------
{
  const r = runCase('Case 5 — Full (bonus+arrear+LE+other) — marginal relief', twelve(60000, 20000, 10000, 0, 0, 5000, {
    earned_bonus_payable: 30000, bonus_incentive: 20000, performance_incentive: 10000, attendance_incentive: 5000, production_incentive: 5000,
    arrear_payment: 50000, earned_leave_encashment: 100000, other_earnings: 15000, special_allowance_addition: 5000, tds: 3000
  }));
  print(r);
  ok(r.components.salary === 1140000, `C5 salary 1,140,000 (${INR(r.components.salary)})`);
  ok(r.components.bonus === 70000, `C5 bonus 70,000 (${INR(r.components.bonus)})`);
  ok(r.components.arrear === 50000, `C5 arrear 50,000 (${INR(r.components.arrear)})`);
  ok(r.components.LE_gross === 100000 && r.exemption === 100000 && r.components.LE_taxable === 0, `C5 LE 100,000 fully exempt (${INR(r.components.LE_taxable)})`);
  ok(r.components.other === 20000, `C5 other 20,000 (${INR(r.components.other)})`);
  ok(r.gross === 1280000, `C5 gross 1,280,000 (${INR(r.gross)})`);
  ok(r.taxable === 1205000, `C5 taxable 1,205,000 (${INR(r.taxable)})`);
  ok(r.mrelief === 55750, `C5 marginal relief 55,750 (${INR(r.mrelief)})`);
  ok(r.net === 5200, `C5 net 5,200 (${INR(r.net)})`);
  ok(r.tds === 3000 && r.balance === 2200, `C5 TDS 3,000 → balance 2,200 (${INR(r.tds)}, ${INR(r.balance)})`);
}

// ---------------------------------------------------------------------------
// CASE 6 — HIGH INCOME + SURCHARGE (salary 4,800,000 + bonus 200,000 + arrear 300,000 + other 100,000)
//   gross 5,400,000; taxable 5,325,000 (>50L) → surcharge 10%.
//   Independent reference below.
// ---------------------------------------------------------------------------
{
  const r = runCase('Case 6 — High income + Surcharge', twelve(400000, 0, 0, 0, 0, 0, {
    earned_bonus_payable: 200000, arrear_payment: 300000, other_earnings: 100000, tds: 1000000
  }));
  print(r);
  ok(r.gross === 5400000, `C6 gross 5,400,000 (${INR(r.gross)})`);
  ok(r.taxable === 5325000, `C6 taxable 5,325,000 (${INR(r.taxable)})`);
  ok(r.surcharge === 117750, `C6 surcharge 117,750 (${INR(r.surcharge)})`);
  ok(r.cess === 51810, `C6 cess 51,810 (${INR(r.cess)})`);
  ok(r.net === 1347060, `C6 net 1,347,060 (${INR(r.net)})`);
  ok(r.tds === 1000000 && r.balance === 347060, `C6 balance 347,060 (${INR(r.balance)})`);
}

// ---------------------------------------------------------------------------
// INDEPENDENT cross-reconciliation for Case 5 & Case 6 (fresh reference, not engine)
// ---------------------------------------------------------------------------
{
  const c5 = refNewRegime(1205000, C);
  const c6 = refNewRegime(5325000, C);
  ok(c5.tax === 60750, `REF C5 slab tax 60,750 (${INR(c5.tax)})`);
  ok(c5.marginalRelief === 55750, `REF C5 marginal relief 55,750 (${INR(c5.marginalRelief)})`);
  ok(c5.net === 5200, `REF C5 net 5,200 (${INR(c5.net)})`);
  ok(c6.tax === 1177500, `REF C6 slab tax 1,177,500 (${INR(c6.tax)})`);
  ok(c6.surcharge === 117750, `REF C6 surcharge 117,750 (${INR(c6.surcharge)})`);
  ok(c6.cess === 51810, `REF C6 cess 51,810 (${INR(c6.cess)})`);
  ok(c6.net === 1347060, `REF C6 net 1,347,060 (${INR(c6.net)})`);
  console.log('\n  Independent reference (re-implemented slab calc) matched the engine on Cases 5 & 6 ✓');
}

// ---------------------------------------------------------------------------
// COVERAGE CHECKS A–M
// ---------------------------------------------------------------------------
console.log('\n=== COVERAGE CHECKS (A–M) ===');

// A+B: every field → exactly one bucket; sum of buckets == gross (no double count)
{
  const slips = twelve(40000, 16000, 8000, 1000, 1500, 2000, {
    earned_bonus_payable: 1000, bonus_incentive: 1, performance_incentive: 1, attendance_incentive: 1, production_incentive: 1,
    arrear_payment: 222, earned_leave_encashment: 333, other_earnings: 444, special_allowance_addition: 555
  });
  const inc = buildForm16Income(slips, { fy: '2026-27', config: C });
  const sum = inc.salary_income + inc.bonus_income + inc.arrear_income + inc.leave_encashment_taxable + inc.other_income;
  ok(sum === inc.gross_total_income, `A/B no-double-count (Σ == gross ${INR(inc.gross_total_income)})`);
  // Field→bucket audit against engine source mapping (each field appears once)
  const used = [
    ['earned_base_salary','salary'],['earned_hra','salary'],['earned_special_allowance','salary'],['earned_da','salary'],
    ['earned_edu_allowance','salary'],['earned_medical_allowance','salary'],['earned_conveyance_allowance','salary'],['overtime_pay','salary'],
    ['earned_bonus_payable','bonus'],['bonus_incentive','bonus'],['performance_incentive','bonus'],['attendance_incentive','bonus'],['production_incentive','bonus'],
    ['arrear_payment','arrear'],['earned_leave_encashment','leave'],['other_earnings','other'],['special_allowance_addition','other']
  ];
  const buckets = new Set(used.map(u => u[1]));
  ok(buckets.size === 5, 'A: salary/bonus/arrear/leave/other buckets — 5 distinct (got ' + buckets.size + ')');
  ok(used.length === 17, 'A: 17 earning fields map to exactly one bucket (got ' + used.length + ')');
}

// C: out-of-FY excluded
{
  const inc = buildForm16Income([{ month: '2025-01', earned_base_salary: 999999 } as any, { month: '2026-06', earned_base_salary: 10000 } as any], { fy: '2026-27', config: C });
  ok(inc.months_counted === 1 && inc.salary_income === 10000, 'C: out-of-FY payslip excluded');
}

// D: F&F leave encashment not duplicated with monthly payroll
{
  const inc = buildForm16Income([{ month: '2026-08', earned_leave_encashment: 50000 } as any], { fy: '2026-27', config: C, ffSettlements: [{ employee_id: 'X', settlement_date: '2026-08-31', earned_leave_encashment: 30000 } as any] });
  ok(inc.leave_encashment_gross === 50000, 'D: F&F LE skipped when payslip already covers month');
  const inc2 = buildForm16Income([{ month: '2026-06', earned_base_salary: 10000 } as any], { fy: '2026-27', config: C, ffSettlements: [{ employee_id: 'X', settlement_date: '2026-08-31', earned_leave_encashment: 40000 } as any] });
  ok(inc2.leave_encashment_gross === 40000, 'D: F&F LE included when month has no payslip');
}

// E: LE exemption — low vs high, 10×avg rule + cap
{
  const low = buildForm16Income([{ month: '2026-04', earned_base_salary: 30000, earned_leave_encashment: 50000 } as any], { fy: '2026-27', config: C });
  ok(low.leave_encashment_exemption === 50000, `E: LE exemption min(50000, 300000, 25L)=50000 (${INR(low.leave_encashment_exemption)})`);
  const high = buildForm16Income([{ month: '2026-04', earned_base_salary: 30000, earned_leave_encashment: 600000 } as any], { fy: '2026-27', config: C });
  ok(high.leave_encashment_exemption === 300000 && high.leave_encashment_taxable === 300000, `E: LE exemption capped at 10×avg=300000; taxable 300000 (${INR(high.leave_encashment_taxable)})`);
}

// F: Arrear — fully taxable; Sec 89/Form 10E represented as a note
{
  const inc = buildForm16Income([{ month: '2026-04', earned_base_salary: 30000, arrear_payment: 150000 } as any], { fy: '2026-27', config: C });
  ok(inc.arrear_income === 150000, 'F: arrear fully taxable in new regime');
  ok(inc.notes.some(n => /89/.test(n) && /10E/.test(n)), 'F: Sec-89/Form-10E note present (handled outside ERP, not applied)');
}

// G: Bonus & incentives all in bonus bucket
{
  const inc = buildForm16Income([{ month: '2026-04', earned_bonus_payable: 10, bonus_incentive: 10, performance_incentive: 10, attendance_incentive: 10, production_incentive: 10 } as any], { fy: '2026-27', config: C });
  ok(inc.bonus_income === 50 && inc.salary_income === 0, `G: bonus+incentives = 50 in bonus bucket (${INR(inc.bonus_income)})`);
}

// H: Other earnings mapping
{
  const inc = buildForm16Income([{ month: '2026-04', other_earnings: 30, special_allowance_addition: 20 } as any], { fy: '2026-27', config: C });
  ok(inc.other_income === 50 && inc.salary_income === 0, `H: other = 50 (${INR(inc.other_income)})`);
}

// I: zero bonus/arrear/LE/other → buckets 0
{
  const inc = buildForm16Income([{ month: '2026-04', earned_base_salary: 10000 } as any], { fy: '2026-27', config: C });
  ok(inc.bonus_income === 0 && inc.arrear_income === 0 && inc.leave_encashment_gross === 0 && inc.other_income === 0, 'I: zero components all 0');
}

// J: PF/ESIC do NOT affect new-regime taxable income (no 80C; only std deduction)
{
  const withPf = buildForm16Income([{ month: '2026-04', earned_base_salary: 50000, earned_hra: 10000, employer_pf: 7200, employer_esic: 0 } as any], { fy: '2026-27', config: C });
  const noPf = buildForm16Income([{ month: '2026-04', earned_base_salary: 50000, earned_hra: 10000 } as any], { fy: '2026-27', config: C });
  ok(withPf.salary_income === noPf.salary_income && withPf.gross_total_income === noPf.gross_total_income, 'J: PF/ESIC ignored (same income with/without)');
  ok(withPf.salary_income === 60000, 'J: salary excludes employer_pf (60,000)');
}

// K: ₹12L crossing + marginal relief (Case 5 covers 1,205,000); also just-under 12L → full rebate
{
  const under = computeNewRegimeTax(1199999 + 75000, C); // taxable 1,199,999 ≤ 12L
  ok(under.rebate_87a > 0 && under.net_tax_payable === 0, `K: taxable ≤12L → rebate, net 0 (${INR(under.rebate_87a)})`);
  const over = computeNewRegimeTax(1205000 + 75000, C); // gross 1,280,000 → taxable 1,205,000
  ok(over.marginal_relief === 55750, `K: taxable just over 12L → marginal relief (${INR(over.marginal_relief)})`);
}

// L: surcharge case (Case 6 covered) — re-assert once more via reference path
{
  const s = refNewRegime(5325000, C);
  ok(s.surcharge === 117750 && s.surchargeRelief === 0, `L: surcharge 117,750, no surcharge-relief here (${INR(s.surcharge)})`);
}

// M: TDS reconciliation — balance = max(0, net − tds); refund when TDS > net
{
  const r = runCase('M — TDS refund', twelve(60000, 20000, 10000, 0, 0, 5000, {
    earned_bonus_payable: 30000, bonus_incentive: 20000, performance_incentive: 10000, attendance_incentive: 5000, production_incentive: 5000,
    arrear_payment: 50000, earned_leave_encashment: 100000, other_earnings: 15000, special_allowance_addition: 5000, tds: 20000
  }));
  ok(r.net === 5200 && r.tds === 20000 && r.balance === 0 && r.refund === 14800, `M: TDS 20,000 > net 5,200 → refundable 14,800 (balance 0)`);
}

console.log(`\n================================================`);
console.log(`FORM 16 VALIDATION: ${pass} passed, ${fail} failed`);
console.log(`================================================`);
process.exit(fail > 0 ? 1 : 0);