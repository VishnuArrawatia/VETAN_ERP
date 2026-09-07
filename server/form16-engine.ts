/**
 * Form 16 Engine — NEW TAX REGIME (Section 115BAC), config-driven.
 *
 * Design rules (production HR/payroll data — read-only aggregation):
 *  - Income components are derived ONLY from stored payroll records (payslips,
 *    F&F settlements). Nothing is estimated from employee salary structure here
 *    except the leave-encashment exemption basis (actual earned salaries).
 *  - Every payslip field maps to EXACTLY ONE component — no double counting:
 *      salary_income      = earned_base + earned_hra + earned_special + earned_edu
 *                           + earned_medical + earned_conveyance + overtime_pay
 *      bonus_income       = earned_bonus_payable + bonus_incentive + performance_incentive
 *                           + attendance_incentive + production_incentive
 *      arrear_income      = arrear_payment (fully taxable salary; Sec-89(1) relief via
 *                           Form 10E, if any, is filed outside the ERP — noted, not applied)
 *      leave_encashment   = earned_leave_encashment (+ F&F settlement encashment in FY)
 *      other_income       = other_earnings + special_allowance_addition
 *                           (+ bonus_payable annual accrual is NOT included — it is a
 *                           liability provision, not paid income)
 *  - Tax slabs, standard deduction, rebate, surcharge, cess all come from
 *    REGIME_CONFIGS below — change the config, never the engine, per FY.
 */

// ---------------------------------------------------------------------------
// Regime configuration (New Tax Regime — Finance Act 2025, FY 2025-26 onwards)
// ---------------------------------------------------------------------------

export interface TaxSlab {
  /** Upper bound of the slab, inclusive. `null` = no upper bound. */
  upTo: number | null;
  /** Rate as fraction, e.g. 0.05 for 5%. */
  rate: number;
}

export interface SurchargeTier {
  /** Total income strictly above this (₹) attracts the rate. */
  above: number;
  rate: number;
}

export interface RegimeConfig {
  name: string;
  /** Flat standard deduction from salary income (₹). */
  standardDeduction: number;
  /** Rebate u/s 87A applies when taxable income ≤ this limit (₹). */
  rebateIncomeLimit: number;
  /** Maximum rebate u/s 87A (₹). */
  rebateMax: number;
  /** Health & education cess rate on tax+surcharge after rebate. */
  cessRate: number;
  slabs: TaxSlab[];
  surcharge: SurchargeTier[];
  /** Section 10(10AA) leave-encashment lifetime cap for non-government employees (₹). */
  leaveEncashmentCap: number;
  /** Months of average (basic+DA) salary exempt for leave encashment. */
  leaveEncashmentMonthsMultiplier: number;
}

/**
 * NEW REGIME slabs — FY 2025-26 & FY 2026-27 (AY 2026-27 & 2027-28):
 *   0–4L nil | 4–8L 5% | 8–12L 10% | 12–16L 15% | 16–20L 20% | 20–24L 25% | >24L 30%
 * Std deduction ₹75,000; 87A rebate: taxable ≤ ₹12,00,000 → max ₹60,000;
 * Surcharge (new regime): 10% >50L, 15% >1Cr, 25% >2Cr; Cess 4%.
 */
export const REGIME_CONFIGS: Record<string, RegimeConfig> = {
  '2026-27': {
    name: 'New Tax Regime (Sec 115BAC) — FY 2026-27',
    standardDeduction: 75000,
    rebateIncomeLimit: 1200000,
    rebateMax: 60000,
    cessRate: 0.04,
    slabs: [
      { upTo: 400000, rate: 0 },
      { upTo: 800000, rate: 0.05 },
      { upTo: 1200000, rate: 0.10 },
      { upTo: 1600000, rate: 0.15 },
      { upTo: 2000000, rate: 0.20 },
      { upTo: 2400000, rate: 0.25 },
      { upTo: null, rate: 0.30 }
    ],
    surcharge: [
      { above: 5000000, rate: 0.10 },
      { above: 10000000, rate: 0.15 },
      { above: 20000000, rate: 0.25 }
    ],
    leaveEncashmentCap: 2500000,
    leaveEncashmentMonthsMultiplier: 10
  },
  '2025-26': {
    name: 'New Tax Regime (Sec 115BAC) — FY 2025-26',
    standardDeduction: 75000,
    rebateIncomeLimit: 1200000,
    rebateMax: 60000,
    cessRate: 0.04,
    slabs: [
      { upTo: 400000, rate: 0 },
      { upTo: 800000, rate: 0.05 },
      { upTo: 1200000, rate: 0.10 },
      { upTo: 1600000, rate: 0.15 },
      { upTo: 2000000, rate: 0.20 },
      { upTo: 2400000, rate: 0.25 },
      { upTo: null, rate: 0.30 }
    ],
    surcharge: [
      { above: 5000000, rate: 0.10 },
      { above: 10000000, rate: 0.15 },
      { above: 20000000, rate: 0.25 }
    ],
    leaveEncashmentCap: 2500000,
    leaveEncashmentMonthsMultiplier: 10
  }
};

// ---------------------------------------------------------------------------
// FY helpers (Indian FY: April → March)
// ---------------------------------------------------------------------------

export function currentFY(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1; // 1-12
  // Jan–Mar belongs to the FY that started the previous calendar year
  const startYear = m >= 4 ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export function fyMonths(fy: string): string[] {
  const [startStr] = fy.split('-');
  const startYear = parseInt(startStr, 10);
  const months: string[] = [];
  for (let m = 4; m <= 12; m++) months.push(`${startYear}-${String(m).padStart(2, '0')}`);
  for (let m = 1; m <= 3; m++) months.push(`${startYear + 1}-${String(m).padStart(2, '0')}`);
  return months; // 12 months, 'YYYY-MM'
}

/** FY label for a payslip month ('2026-04' → '2026-27'). */
export function fyOfMonth(month: string): string {
  const [yStr, mStr] = month.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  const startYear = m >= 4 ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Income component aggregation (from ACTUAL stored payroll data)
// ---------------------------------------------------------------------------

export interface PayslipLike {
  month: string;
  earned_base_salary?: number;
  earned_hra?: number;
  earned_special_allowance?: number;
  earned_da?: number;
  earned_edu_allowance?: number;
  earned_medical_allowance?: number;
  earned_conveyance_allowance?: number;
  overtime_pay?: number;
  rate_bonus_payable?: number;
  earned_bonus_payable?: number;
  bonus_incentive?: number;
  performance_incentive?: number;
  attendance_incentive?: number;
  production_incentive?: number;
  arrear_payment?: number;
  earned_leave_encashment?: number;
  other_earnings?: number;
  special_allowance_addition?: number;
  tds?: number;
  lop_deduction?: number;
}

export interface FfSettlementLike {
  employee_id: string;
  settlement_date?: string;
  earned_leave_encashment?: number;
}

export interface MonthWiseRow {
  month: string;
  salary: number;
  bonus: number;
  arrear: number;
  leave_encashment: number;
  other: number;
}

export interface IncomeComponents {
  salary_income: number;
  bonus_income: number;
  arrear_income: number;
  leave_encashment_gross: number;
  leave_encashment_exemption: number;
  leave_encashment_taxable: number;
  other_income: number;
  gross_total_income: number;
  months_counted: number;
  tds_deducted: number;
  month_wise: MonthWiseRow[];
  notes: string[];
}

export interface BuildIncomeOptions {
  fy: string;
  /** Employee's monthly earned base rates for the 10(10AA) exemption basis. */
  config: RegimeConfig;
  /** F&F settlements for this employee (optional). */
  ffSettlements?: FfSettlementLike[];
}

/**
 * Aggregate the employee's FY income components from stored payslips.
 * Every component is summed per-month so the breakdown is fully transparent.
 */
export function buildForm16Income(
  payslips: PayslipLike[],
  opts: BuildIncomeOptions
): IncomeComponents {
  const { fy, config } = opts;
  const months = fyMonths(fy);
  const monthSet = new Set(months);

  const rows: MonthWiseRow[] = [];
  let tdsTotal = 0;
  let baseSamples: number[] = [];
  const notes: string[] = [];

  for (const p of payslips) {
    if (!p || !p.month || !monthSet.has(p.month)) continue;

    const salary = Math.max(0, (p.earned_base_salary || 0) + (p.earned_hra || 0) +
      (p.earned_special_allowance || 0) + (p.earned_da || 0) +
      (p.earned_edu_allowance || 0) + (p.earned_medical_allowance || 0) +
      (p.earned_conveyance_allowance || 0) + (p.overtime_pay || 0));
    const bonus = (p.earned_bonus_payable || 0) + (p.bonus_incentive || 0) +
      (p.performance_incentive || 0) + (p.attendance_incentive || 0) +
      (p.production_incentive || 0);
    const arrear = p.arrear_payment || 0;
    const leaveEncash = p.earned_leave_encashment || 0;
    const other = (p.other_earnings || 0) + (p.special_allowance_addition || 0);

    if (p.earned_base_salary) baseSamples.push(p.earned_base_salary);
    tdsTotal += p.tds || 0;

    rows.push({ month: p.month, salary, bonus, arrear, leave_encashment: leaveEncash, other });
  }

  // F&F leave encashment — only for FY settlements; a settlement month that also
  // has a payslip would double-count, so skip settlement rows whose month has a payslip.
  let ffEncash = 0;
  for (const f of opts.ffSettlements || []) {
    if (!f || f.employee_id == null) continue;
    const d = f.settlement_date || '';
    if (!d || !/^\d{4}-\d{2}/.test(d)) continue;
    const ym = d.slice(0, 7);
    if (!monthSet.has(ym)) continue;
    const enc = f.earned_leave_encashment || 0;
    if (enc <= 0) continue;
    if (rows.some(r => r.month === ym && r.leave_encashment > 0)) {
      notes.push(`F&F leave encashment for ${ym} skipped — payslip already carries it (double-count guard).`);
      continue;
    }
    ffEncash += enc;
    rows.push({ month: ym, salary: 0, bonus: 0, arrear: 0, leave_encashment: enc, other: 0 });
  }

  rows.sort((a, b) => a.month.localeCompare(b.month));

  const salary_income = rows.reduce((s, r) => s + r.salary, 0);
  const bonus_income = rows.reduce((s, r) => s + r.bonus, 0);
  const arrear_income = rows.reduce((s, r) => s + r.arrear, 0);
  const leave_encashment_gross = rows.reduce((s, r) => s + r.leave_encashment, 0);
  const other_income = rows.reduce((s, r) => s + r.other, 0);

  // Section 10(10AA) exemption (non-government): least of
  //  (a) actual leave encashment, (b) avg monthly salary × 10, (c) ₹25,00,000 cap.
  let leave_encashment_exemption = 0;
  if (leave_encashment_gross > 0) {
    const avgBase = baseSamples.length > 0
      ? baseSamples.reduce((s, v) => s + v, 0) / baseSamples.length
      : 0;
    const b = avgBase * config.leaveEncashmentMonthsMultiplier;
    leave_encashment_exemption = Math.max(0, Math.min(leave_encashment_gross, b, config.leaveEncashmentCap));
    notes.push(
      `Leave encashment exemption u/s 10(10AA): least of (actual ₹${Math.round(leave_encashment_gross)}, ` +
      `10× avg monthly salary ₹${Math.round(b)}, cap ₹${config.leaveEncashmentCap.toLocaleString('en-IN')}) = ₹${Math.round(leave_encashment_exemption)}.`
    );
  }
  const leave_encashment_taxable = Math.max(0, leave_encashment_gross - leave_encashment_exemption);

  const gross_total_income = salary_income + bonus_income + arrear_income + leave_encashment_taxable + other_income;

  if (arrear_income > 0) {
    notes.push('Arrears are fully taxable in the year received (new regime). Relief u/s 89(1) via Form 10E, if opted, is filed outside the ERP.');
  }

  return {
    salary_income,
    bonus_income,
    arrear_income,
    leave_encashment_gross,
    leave_encashment_exemption,
    leave_encashment_taxable,
    other_income,
    gross_total_income,
    months_counted: rows.length,
    tds_deducted: tdsTotal,
    month_wise: rows,
    notes
  };
}

// ---------------------------------------------------------------------------
// New-regime tax computation
// ---------------------------------------------------------------------------

export interface SlabApplied { from: number; to: number | null; rate: number; tax: number }

export interface TaxWorking {
  taxable_income: number;
  slabs_applied: SlabApplied[];
  tax_on_income: number;
  /** Marginal relief at the ₹12L rebate boundary. */
  marginal_relief: number;
  rebate_87a: number;
  surcharge: number;
  marginal_relief_surcharge: number;
  cess: number;
  net_tax_payable: number;
  total_deductions: number;
  effective_rate: number;
}

export function computeNewRegimeTax(
  grossTotalIncome: number,
  config: RegimeConfig
): TaxWorking {
  const total_deductions = config.standardDeduction;
  const taxable_income = Math.max(0, Math.round(grossTotalIncome - config.standardDeduction));

  // 1. Slab-wise tax
  const slabs_applied: SlabApplied[] = [];
  let tax_on_income = 0;
  let lower = 0;
  for (const slab of config.slabs) {
    const upper = slab.upTo === null ? taxable_income : Math.min(slab.upTo, taxable_income);
    if (upper <= lower) {
      if (slab.upTo === null || taxable_income <= lower) break;
      lower = slab.upTo;
      continue;
    }
    const slabTax = Math.round((upper - lower) * slab.rate);
    if (slabTax > 0 || slab.rate === 0) {
      slabs_applied.push({ from: lower, to: slab.upTo, rate: slab.rate, tax: slabTax });
    }
    tax_on_income += slabTax;
    lower = slab.upTo === null ? taxable_income : slab.upTo;
    if (slab.upTo === null || taxable_income <= slab.upTo) break;
  }

  // 2. Rebate u/s 87A (resident individuals, new regime)
  let rebate_87a = 0;
  let marginal_relief = 0;
  if (taxable_income <= config.rebateIncomeLimit) {
    rebate_87a = Math.min(tax_on_income, config.rebateMax);
  } else {
    // Marginal relief just above the rebate limit: tax cannot exceed
    // (income − rebateIncomeLimit) by more than the excess itself.
    const excess = taxable_income - config.rebateIncomeLimit;
    if (tax_on_income > excess) {
      marginal_relief = tax_on_income - excess;
    }
  }
  const taxAfterRebate = Math.max(0, tax_on_income - marginal_relief - rebate_87a);

  // 3. Surcharge (with marginal relief at tier boundaries)
  let surcharge = 0;
  let marginal_relief_surcharge = 0;
  for (const tier of config.surcharge) {
    if (taxable_income > tier.above) {
      surcharge = Math.round(taxAfterRebate * tier.rate);
      // Marginal relief: incremental tax+surcharge over the threshold is capped
      // at the income exceeding the threshold.
      const excessOver = taxable_income - tier.above;
      if (surcharge > excessOver) {
        marginal_relief_surcharge = surcharge - excessOver;
        surcharge = excessOver;
      }
      break; // highest applicable tier only
    }
  }

  // 4. Health & education cess
  const cess = Math.round((taxAfterRebate + surcharge) * config.cessRate);

  const net_tax_payable = Math.max(0, taxAfterRebate + surcharge + cess);
  const effective_rate = grossTotalIncome > 0 ? net_tax_payable / grossTotalIncome : 0;

  return {
    taxable_income,
    slabs_applied,
    tax_on_income,
    marginal_relief,
    rebate_87a,
    surcharge,
    marginal_relief_surcharge,
    cess,
    net_tax_payable,
    total_deductions,
    effective_rate
  };
}
