export interface Company {
  id: string;
  name: string;
  short: string;
}

export interface Unit {
  id: string;
  name: string;
  companyId: string;
  esic?: boolean; // ESIC applicable for this unit/location (undefined = worker-level flag governs; Sakar Unit III = true)
}

export interface ContractorRec {
  id: string;
  name: string;
  code?: string;   // contractor code (for invoice header)
  address?: string; // contractor address (for invoice header)
  gstNo?: string;  // contractor GST number (for invoice header)
  pf: boolean;
  esic: boolean;
  commissionPerDay: number;
  gstRate: number;
  tdsRate: number;
}

export interface WageRevision {
  id: string;
  workerId: string;
  effectiveFrom: string; // month key e.g. "2026-08"
  rateBasic: number;
  rateHra: number;
  rateOther: number;
  rateDay: number;
  reason?: string;
  createdAt: string;
}

export interface WorkerRec {
  id: string;
  code: string;
  name: string;
  unitId: string;
  companyId: string;
  contractor: string;
  department: string;
  gender: 'M' | 'F';
  doj: string;
  uan: string;
  bank: string;
  ac: string;
  ifsc: string;
  mode: 'Company' | 'Contractor';
  workingHours: number; // 8 or 12 — used for contractor commission
  rateBasic: number;
  rateHra: number;
  rateOther: number;
  rateDay: number;
  ctc: number;
  minWage: number;
  pf: boolean;
  esic: boolean;
  active: boolean;
  revisions?: WageRevision[];
}

export interface AttendanceRec {
  id: string;
  monthKey: string;
  workerId: string;
  present: number;
  absent: number;
  weeklyOff: number;
  paidHoliday: number;
  leave: number;
  lwp: number;
  otHours: number;
}

export interface LeaveRec {
  id: string;
  monthKey: string;
  workerId: string;
  opening: number;
  earned: number;
  taken: number;
  balance: number;
}

export interface LoanRecoveryRec {
  id: string;
  monthKey: string; // e.g. "2026-07"
  workerId: string;
  loanAmount: number;      // new loan given this month
  loanDeduction: number;   // EMI/deduction recovered this month
  advanceAmount: number;   // advance given this month
  advanceDeduction: number; // advance recovered this month
  otherDeductions: number;
  outstanding: number;
  remarks?: string;
}

export interface PfChallanRec {
  id: string;
  monthKey: string;
  contractorId: string;
  empPf: number;
  erPf: number;
  total: number;
  generatedAt: string;
  challanNo?: string;
}

export interface ContractorBillRec {
  id: string;
  monthKey: string;
  contractorId: string;
  invoiceNo?: string;
  invoiceDate?: string;   // ISO date the invoice was generated
  unitNames?: string;     // units covered by this bill (header display)
  wages: number;
  commission: number;
  empPf: number;
  erPf: number;
  esic: number;   // legacy: employee ESIC total (kept for old saved bills)
  erEsic?: number; // employer ESIC contribution (bill line, 3.25%)
  taxable?: number; // wages + commission + erPf + erEsic
  gst: number;
  tds: number;
  total: number;    // grand total = taxable + gst (per new rule)
  netBill: number;
  workers: number;
  generatedAt: string;
}

/** Commission rate schedule — per working-hours tier, effective from a month, per unit/location.
 *  unitId = 'all' means the entry is the common fallback for every unit; a unit-specific
 *  entry always overrides the 'all' entry for that unit. Old months keep their rate
 *  (effective-date logic), new months use the latest applicable entry. */
export interface CommissionRateRec {
  id: string;
  unitId: string; // unit id or 'all' (common rate for every unit/location)
  effectiveFrom: string; // month key e.g. "2026-06"
  rate12: number; // per payday for workers with workingHours >= 12
  rate11: number; // per payday for workers with workingHours >= 11 (11h)
  rate8: number;  // per payday for workers with workingHours < 11 (8h)
  createdAt: string;
}

export interface Settings {
  pfEmp: number;
  pfEr: number;
  esicEmp: number;
  esicEr: number;
  bonusRate: number;
  pfCeiling?: number; // PF wage ceiling (₹/month). 0 or undefined = no cap (existing behaviour)
  departments: string[];
  commissionRates?: CommissionRateRec[];
}

export interface AppState {
  companies: Company[];
  units: Unit[];
  workers: WorkerRec[];
  attendance: AttendanceRec[];
  leave: LeaveRec[];
  loans: LoanRecoveryRec[];
  pfChallans: PfChallanRec[];
  contractorBills: ContractorBillRec[];
  contractors: ContractorRec[];
  settings: Settings;
}