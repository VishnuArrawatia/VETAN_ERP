/**
 * VETAN ERP — MASTER → PER-UPLOAD SPLITTER
 *
 * HR fills the MASTER workbook (templates/MASTER_ATTENDANCE_<MONTH>.xlsx).
 * This tool splits it into upload-ready derivative files, each compatible
 * with an existing single-sheet uploader (zero code-change needed):
 *
 *   OUT/ATT_<MONTH>_SVN-I.xlsx     → Attendance → Monthly (unit = SVN-1)
 *   OUT/ATT_<MONTH>_3UNITS.xlsx    → Attendance → Monthly (all 3 units at once)
 *   OUT/INPUTS_<MONTH>_ALL.xlsx    → Payroll → Input Management → Excel Upload
 *                                    (TDS, Other Deduction, Salary Advance, Arrear,
 *                                     Bonus/Incentives — merged from both master sheets)
 *
 * Usage: node scripts/split-master-attendance.cjs <MASTER.xlsx> <MONTH e.g. APR2026>
 * Run AFTER filling the master. Local files only — no production contact.
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const [masterPath, MONTH] = [process.argv[2], (process.argv[3] || '').toUpperCase()];
if (!masterPath || !fs.existsSync(masterPath) || !MONTH) {
  console.error('Usage: node scripts/split-master-attendance.cjs <MASTER.xlsx> <MONTH>');
  process.exit(1);
}

const wbMaster = XLSX.read(fs.readFileSync(masterPath));
if (!wbMaster.SheetNames.includes('ATT-SVN-1') || !wbMaster.SheetNames.includes('ATT-3UNITS')) {
  console.error('MASTER file me "ATT-SVN-1" aur "ATT-3UNITS" sheets nahi mili:', wbMaster.SheetNames);
  process.exit(1);
}

const ATT_HEADERS = ['Employee ID', 'Employee Name', 'Present', 'Absent', 'Weekly_Off',
  'Paid_Holiday', 'Leave', 'LWP', 'OT_Hours', 'PL', 'CL', 'SL', 'C-Off'];

const NUMERIC = ['Present', 'Absent', 'Weekly_Off', 'Paid_Holiday', 'Leave', 'LWP', 'OT_Hours', 'PL', 'CL', 'SL', 'C-Off'];

function writeSheet(rows, headers, file, sheetName) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  ws['!cols'] = [{ wch: 12 }, { wch: 26 }, ...Array(Math.max(0, headers.length - 2)).fill({ wch: 9 })];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  XLSX.writeFile(wb, file);
  console.log('WROTE:', file, `(${rows.length} rows)`);
}

// ── 1. Attendance derivatives (single-sheet, identical columns) ──
const allRows = [];
for (const sn of ['ATT-SVN-1', 'ATT-3UNITS']) {
  const rows = XLSX.utils.sheet_to_json(wbMaster.Sheets[sn]);
  allRows.push(...rows);
  const unit = sn === 'ATT-SVN-1' ? 'SVN-I' : '3UNITS';
  writeSheet(rows, ATT_HEADERS, path.join('OUT', `ATT_${MONTH}_${unit}.xlsx`), 'DATA');
}

// ── 2. Sum-rule pre-check (fail fast BEFORE HR uploads) ──
const DAYS = { APR2026: 30, MAY2026: 31, JUN2026: 30, JUL2026: 31, AUG2026: 31, SEP2026: 30 };
const expected = DAYS[MONTH] || null;
let sumIssues = 0, missingValues = 0;
for (const r of allRows) {
  const blank = NUMERIC.filter(k => r[k] === undefined || r[k] === '' || r[k] === null);
  if (blank.length) { missingValues++; continue; }
  if (expected) {
    const sum = NUMERIC.slice(0, 6).reduce((s, k) => s + (Number(r[k]) || 0), 0);
    if (Math.abs(sum - expected) > 0.01) { sumIssues++; console.error(`  SUM-FAIL ${r['Employee ID']}: ${sum} != ${expected}`); }
  }
}
console.log(`PRE-CHECK: ${missingValues} rows with blank values, ${sumIssues} rows failing ${expected || '?'}-day sum rule`);
if (sumIssues > 0) console.error('⚠️  Pehle in rows theek karo — upload par ye REJECT hongi.');

// ── 3. Inputs derivative (T4 columns, merged from both sheets) ──
const INPUT_HEADERS = ['Employee Code', 'Employee Name', 'TDS (₹)', 'Other Deduction (₹)',
  'Salary Advance (₹)', 'Arrear Payment (₹)', 'Bonus Incentive (₹)',
  'Performance Incentive (₹)', 'Reimbursement (₹)', 'Special Allowance Addition (₹)', 'Remarks'];
const inputRows = allRows.map(r => ({
  'Employee Code': r['Employee ID'],
  'Employee Name': r['Employee Name'],
  'TDS (₹)': 0, 'Other Deduction (₹)': 0, 'Salary Advance (₹)': 0, 'Arrear Payment (₹)': 0,
  'Bonus Incentive (₹)': 0, 'Performance Incentive (₹)': 0, 'Reimbursement (₹)': 0,
  'Special Allowance Addition (₹)': 0, 'Remarks': ''
}));
writeSheet(inputRows, INPUT_HEADERS, path.join('OUT', `INPUTS_${MONTH}_ALL.xlsx`), 'DATA');
console.log('DONE — OUT/ folder ready for upload.');
