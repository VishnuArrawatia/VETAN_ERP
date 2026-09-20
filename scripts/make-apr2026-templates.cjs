/* APRIL-2026 IMPORT TEMPLATES GENERATOR (blank/sample files only — ZERO production contact)
 * Columns EXACTLY match current VETAN parsers (code-verified 20-Sep-2026):
 *  T1 Attendance   → AttendanceSheet.tsx (findVal aliases, SUM=30 rule)
 *  T2 LeaveOpening → /api/leave-opening/import (as_on MUST be 2026-04-01)
 *  T3 LeaveRecords → /api/historical-leaves/import
 *  T4 PayrollInput → PayrollInputManagementView.tsx Excel parser
 *  T5 Bonus        → /api/bonus-provisions/import (EMPLOYEE CODE/MONTH/BASIC/BONUS AMOUNT)
 *  T6 Arrear       → /api/arrears/import (EMPLOYEE CODE/ARREAR MONTH/AMOUNT/REASON...)
 * Data sheet is ALWAYS sheet #1 (uploaders read SheetNames[0] only); GUIDE is sheet #2.
 * Run: node scripts/make-apr2026-templates.cjs
 */
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'templates', 'APR2026');
fs.mkdirSync(OUT, { recursive: true });

const UNITS = ['SVN-I', 'SVN-II', 'SAKAR-I', 'SAKAR-III'];

function styleCols(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}
function buildWb(dataSheetName, header, rows, guideLines, dataWidths) {
  const wb = XLSX.utils.book_new();
  const wsData = XLSX.utils.aoa_to_sheet([header, ...rows]);
  styleCols(wsData, dataWidths);
  XLSX.utils.book_append_sheet(wb, wsData, dataSheetName); // sheet #1 = DATA (uploader reads this)
  const wsGuide = XLSX.utils.aoa_to_sheet(guideLines.map(l => [l]));
  styleCols(wsGuide, [110]);
  XLSX.utils.book_append_sheet(wb, wsGuide, 'GUIDE');      // sheet #2 = instructions (never uploaded)
  return wb;
}

/* ── T1: ATTENDANCE (one file per unit) ───────────────────────────── */
const attHeader = ['Employee ID', 'Present', 'Absent', 'Weekly_Off', 'Paid_Holiday', 'Leave', 'LWP', 'OT_Hours', 'PL', 'CL', 'SL', 'C-Off'];
const attSample = [
  ['ZZ0001', 24, 0, 4, 0, 2, 0, 8, 2, 0, 0, 0],   // sum: 24+0+4+0+2+0 = 30 ✓
  ['ZZ0002', 26, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0],   // sum: 30 ✓
];
const attGuide = [
  'APRIL-2026 ATTENDANCE IMPORT — GUIDE (ye sheet upload NAHI hoti, sirf DATA sheet hoti hai)',
  '1. SAMPLE rows (ZZ0001/ZZ0002) DELETE karke apne real employees bharo. Ek row = ek employee.',
  '2. Employee ID = Employee Master ka EXACT code (jaise SV1ST0001). Master me na ho to row reject hogi.',
  '3. HARD RULE: Present + Absent + Weekly_Off + Paid_Holiday + Leave + LWP = 30 (April ke calendar days).',
  '   Galat sum = poori row REJECT (SUM_MISMATCH). PL/CL/SL/C-Off Leave ke ANDAR ka breakdown hai — sum me dobara mat gino.',
  '4. Decimal allowed (0.5 half-day). OT negative nahi ho sakta. No-punch ≠ Present — data missing hai to bharo.',
  '5. Ye file UNIT-WISE hai — har unit apni file me. Alag unit ke employees dusri file me mat milao.',
  '6. Upload kahan: Attendance module → Monthly sub-tab → drag & drop (.xlsx/.csv). Month Apr-2026 select karke.',
  '7. Har save ka record Audit-Log me jata hai. Import ke baad count verify karo: rows = unit ke active employees.',
];

/* ── T2: LEAVE OPENING BALANCE ────────────────────────────────────── */
const obHeader = ['Employee Code', 'Employee Name', 'CL', 'PL', 'SL', 'CO', 'As On'];
const obSample = [['ZZ0001', 'SAMPLE-DELETE', 6, 12, 4, 0, '2026-04-01'], ['ZZ0002', 'SAMPLE-DELETE', 6, 12, 4, 0, '2026-04-01']];
const obGuide = [
  'LEAVE OPENING BALANCE (FY 2026-27) — GUIDE',
  '1. As On column me EXACTLY 2026-04-01 hi likhna — koi aur date = POORI import REJECT (OB_DATE_INVALID).',
  '2. Har employee ke closing balances (31-Mar-2026 wale) yahan OPENING ke roop me dalo. Sab units EK HI file me — company-neutral hai.',
  '3. CL/PL/SL ≥ 0. CO (comp-off) optional. Blank = 0 nahi — value likho (0 bhi likh do).',
  '4. Same file dobara upload = 409 ALREADY_IMPORTED (idempotent). Replace karna ho to UI ka replace/confirm option use karo.',
  '5. Upload kahan: Leave module → Opening Balance Import. Import ke baad Leave Register me Opening + Credit − Consumed = Closing verify karo.',
];

/* ── T3: APRIL LEAVE RECORDS ──────────────────────────────────────── */
const lrHeader = ['Employee Code', 'Leave Type', 'From Date', 'To Date', 'Days', 'Reason'];
const lrSample = [['ZZ0001', 'PL', '2026-04-10', '2026-04-12', 3, 'Family function'], ['ZZ0002', 'CL', '2026-04-21', '2026-04-21', 1, '']];
const lrGuide = [
  'APRIL-2026 LEAVE RECORDS (historical import) — GUIDE',
  '1. Sirf APRIL me liye gaye leaves dalo. Har leave alag row (employee ne 2 baar leave liya = 2 rows).',
  '2. Leave Type: PL / CL / SL / LWP / CO (uppercase). From/To date format: YYYY-MM-DD (2026-04-10).',
  '3. Days = From se To tak ke actual leave days (half-day ho to 0.5). Reason optional.',
  '4. Ye records-only import hai — balances isse apne-aap nahi katate; attendance/LOP aur opening-balance se reconcile hota hai.',
  '5. Employee Code master me hona chahiye, warna row skip. Same file dobara = duplicate-batch warning (confirm_replace se replace).',
];

/* ── T4: PAYROLL INPUTS (TDS / Other / Incentives) ────────────────── */
const piHeader = ['Employee Code', 'Employee Name', 'TDS (₹)', 'Other Deduction (₹)', 'Bonus Incentive (₹)', 'Performance Incentive (₹)', 'Reimbursement (₹)', 'Special Allowance Addition (₹)', 'Remarks'];
const piSample = [['ZZ0001', 'SAMPLE-DELETE', 1500, 200, 0, 0, 500, 0, 'April inputs'], ['ZZ0002', 'SAMPLE-DELETE', 0, 0, 0, 0, 0, 0, '']];
const piGuide = [
  'APRIL-2026 PAYROLL VARIABLE INPUTS — GUIDE',
  '1. ORDER ZAROORI: ye file April payroll CALCULATE hone ke BAAD hi upload hoti hai (payslips exist karne chahiye).',
  '   Sequence: Attendance → Calculate Apr-26 (DRAFT) → YE FILE → Review → Lock.',
  '2. PF / ESIC / PT is file me NAHI hai — wo engine automatic calculate karta hai. Yahan sirf MANUAL items: TDS, Other Deduction, incentives.',
  '3. LOAN EMI aur SALARY ADVANCE is file me NAHI dalte — wo Loan module se aate hain (Loan Master → EMI). Wahan maintain karo.',
  '4. Blank/0 = koi deduction nahi. Amount ₹ me, comma ke bina (1500 sahi, 1,500 bhi chalega).',
  '5. Upload kahan: Payroll → Input Management (April) → Excel upload. Import ke baad totals screen par verify karo.',
];

/* ── T5: BONUS (manual corrections only) ──────────────────────────── */
const bnHeader = ['EMPLOYEE CODE', 'MONTH', 'BASIC', 'BONUS AMOUNT', 'REMARKS'];
const bnSample = [['ZZ0001', 'Apr-26', 20000, 1666, 'manual correction'], ['ZZ0002', 'Apr-26', 18000, '', '']];
const bnGuide = [
  'BONUS PROVISION IMPORT (April-2026) — GUIDE (sirf manual correction ke liye)',
  '1. April AUTO month hai — payroll calculate hote hi Basic × 8.33% apne-aap provision ban jata hai (SALARY_AUTO).',
  '2. Ye import SIRF tab use karo jab kisi employee ka amount ALAG chahiye (source = MANUAL banta hai; auto use overwrite NAHI karta).',
  '3. MONTH: Apr-26 ya 2026-04 (dono chalega). BASIC blank = employee ka current Basic. BONUS AMOUNT blank = Basic × 8.33% auto.',
  '4. Same employee + month + MANUAL pehle se ho to row SKIP hogi (duplicate protection).',
  '5. Upload kahan: Bonus Register → Excel Import. Import ke baad Register me Source column verify karo (MANUAL vs SALARY AUTO).',
];

/* ── T6: ARREAR ───────────────────────────────────────────────────── */
const arHeader = ['EMPLOYEE CODE', 'ARREAR MONTH', 'AMOUNT', 'REASON', 'PF EFFECT', 'BONUS EFFECT', 'STATUS', 'REMARKS'];
const arSample = [['ZZ0001', 'Apr-26', 5000, 'Salary adjustment', 600, 417, 'DRAFT', ''], ['ZZ0002', 'Apr-26', 0, '', '', '', '', '']];
const arGuide = [
  'ARREAR IMPORT (April-2026) — GUIDE (100% MANUAL — koi automatic calculation NAHI)',
  '1. AMOUNT > 0 hona chahiye (0/negative = row reject). Har arrear entry alag row.',
  '2. ARREAR MONTH: Apr-26 ya 2026-04. STATUS: DRAFT (default) / APPROVED / PAID.',
  '3. PF EFFECT / BONUS EFFECT future-ready reference fields hain — abhi payrol par automatic asar NAHI hota.',
  '4. Duplicate (same employee + month + amount + reason) auto-SKIP hota hai.',
  '5. Upload kahan: Arrear Register → Excel Import. Existing payroll/payslips par is import ka koi automatic asar nahi.',
];

/* ── Generate files ───────────────────────────────────────────────── */
const files = [];

for (const unit of UNITS) {
  const fname = `T1_Attendance_APR2026_${unit.replace(/[^A-Z0-9-]/gi, '')}.xlsx`;
  const wb = buildWb('ATTENDANCE', attHeader, attSample, attGuide, [14, 9, 9, 11, 12, 8, 7, 10, 7, 7, 7, 8]);
  XLSX.writeFile(wb, path.join(OUT, fname));
  files.push(`${fname}  (unit: ${unit})`);
}
XLSX.writeFile(buildWb('LEAVE_OPENING', obHeader, obSample, obGuide, [14, 18, 7, 7, 7, 7, 12]), path.join(OUT, 'T2_LeaveOpeningBalance_APR2026.xlsx'));
files.push('T2_LeaveOpeningBalance_APR2026.xlsx  (sab units ek saath)');
XLSX.writeFile(buildWb('LEAVE_RECORDS', lrHeader, lrSample, lrGuide, [14, 11, 12, 12, 8, 24]), path.join(OUT, 'T3_LeaveRecords_APR2026.xlsx'));
files.push('T3_LeaveRecords_APR2026.xlsx');
XLSX.writeFile(buildWb('PAYROLL_INPUTS', piHeader, piSample, piGuide, [14, 18, 10, 16, 14, 16, 14, 18, 20]), path.join(OUT, 'T4_PayrollInputs_APR2026.xlsx'));
files.push('T4_PayrollInputs_APR2026.xlsx  (TDS/Other/Incentives — CALCULATE ke BAAD)');
XLSX.writeFile(buildWb('BONUS', bnHeader, bnSample, bnGuide, [14, 10, 10, 14, 22]), path.join(OUT, 'T5_Bonus_APR2026_OPTIONAL.xlsx'));
files.push('T5_Bonus_APR2026_OPTIONAL.xlsx  (sirf manual corrections)');
XLSX.writeFile(buildWb('ARREAR', arHeader, arSample, arGuide, [14, 13, 10, 22, 11, 13, 10, 18]), path.join(OUT, 'T6_Arrear_APR2026_OPTIONAL.xlsx'));
files.push('T6_Arrear_APR2026_OPTIONAL.xlsx  (sirf agar arrear hai)');

console.log('Templates generated in templates/APR2026/:');
files.forEach(f => console.log('  ✓ ' + f));
console.log('\nNOTE: Sample rows ZZ0001/ZZ0002 (SAMPLE-DELETE) — upload se pehle delete karo.');
