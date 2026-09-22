/**
 * VETAN ERP — MASTER ATTENDANCE WORKBOOK GENERATOR
 *
 * Builds ONE Excel workbook for HR with two data sheets + a GUIDE sheet:
 *   - "ATT-SVN-1"    : SVN-1 employees only (42)
 *   - "ATT-3UNITS"   : Sakar-I + SVN-II + Sakar-III employees (56)
 *   - "GUIDE"        : Hinglish filling rules (not uploaded)
 *
 * Columns are EXACTLY the aliases the AttendanceSheet parser accepts
 * (src/components/AttendanceSheet.tsx findVal lists).
 *
 * Also usable for ANY future month: node scripts/make-master-attendance-workbook.cjs [MonthName]
 * Output: templates/MASTER_ATTENDANCE_<MONTH>.xlsx (local file only — NO production import)
 */
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const MONTH = (process.argv[2] || 'APR2026').toUpperCase();

// ── Load local roster (Sep-4 snapshot; the only store we may read) ──
const store = JSON.parse(fs.readFileSync('public/data/payroll_store.json', 'utf8'));
const emps = (store.data || store).employees || [];

const EXCLUDED = new Set(['EMP006', 'EMP007']); // removed dummies
const unitOf = (e) => (e.company || '').trim();

const groups = {
  'ATT-SVN-1': emps.filter(e => unitOf(e) === 'SVN-1' && !EXCLUDED.has(e.id)),
  'ATT-3UNITS': emps.filter(e => ['Sakar-I', 'SVN-II', 'Sakar-III'].includes(unitOf(e)) && !EXCLUDED.has(e.id)),
};

const HEADERS = [
  'Employee ID', 'Employee Name', 'Present', 'Absent', 'Weekly_Off',
  'Paid_Holiday', 'Leave', 'LWP', 'OT_Hours', 'PL', 'CL', 'SL', 'C-Off'
];

// Blank numeric cells (HR must fill — blank parses as 0 and will fail the sum rule until filled)
function dataRows(list) {
  return list
    .sort((a, b) => (a.company || '').localeCompare(b.company || '') || a.id.localeCompare(b.id))
    .map(e => ({
      'Employee ID': e.id,
      'Employee Name': e.name || '',
      'Present': '', 'Absent': '', 'Weekly_Off': '', 'Paid_Holiday': '',
      'Leave': '', 'LWP': '', 'OT_Hours': '', 'PL': '', 'CL': '', 'SL': '', 'C-Off': ''
    }));
}

const wb = XLSX.utils.book_new();

for (const [sheetName, list] of Object.entries(groups)) {
  const byComp = {};
  list.forEach(e => { byComp[unitOf(e)] = (byComp[unitOf(e)] || 0) + 1; });
  console.log(`${sheetName}: ${list.length} rows  (${JSON.stringify(byComp)})`);
  const ws = XLSX.utils.json_to_sheet(dataRows(list), { header: HEADERS });
  ws['!cols'] = [{ wch: 12 }, { wch: 26 }, ...Array(11).fill({ wch: 9 })];
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

// ── GUIDE sheet ──
const guideLines = [
  ['VETAN ERP — MASTER ATTENDANCE SHEET (' + MONTH + ')'], [''],
  ['Ye workbook HR bharti hai. UPLOAD sirf Attendance → Monthly screen se hota hai.'], [''],
  ['RULES (zaroori):'],
  ['1. Har employee ki EK row. Naye employee ki row khud add karo (top se copy karke).'],
  ['2. HARD RULE: Present + Absent + Weekly_Off + Paid_Holiday + Leave + LWP = mahine ke total din'],
  ['   (April/Sep/Nov = 30, Jan/Mar/May/Jul/Aug/Oct/Dec = 31, Feb-26 = 28).'],
  ['   Galat sum = poori row REJECT. PL/CL/SL/C-Off Leave ke ANDAR ginte hain — sum me dobara NAHI.'],
  ['3. Employee ID bilkul waise hi (SV1ST0001, SK1ST0001 ...). Blank ya galat ID = row reject.'],
  ['4. OT_Hours me sirf approved overtime ghante.'],
  ['5. Jis employee ki koi entry na ho, uski row MAT delete karo — 0 bhar do (absent nahi samjha jayega).'],
  ['6. File Save karo naam me month ke saath: MASTER_ATTENDANCE_' + MONTH + '.xlsx'],
  ['7. Upload ke baad screen par "Saved" aur count check karo (SVN-1 = ' + groups['ATT-SVN-1'].length + ', 3-Units = ' + groups['ATT-3UNITS'].length + ').'],
  [''],
  ['MONTHLY REUSE: Har mahine same workbook — naye values bharke upload karo.'],
  ['Leave balances ab SAFE hain: same utilization dobara upload karne par double kata nahi (delta system).'],
  [''],
  ['Sheet guide:'],
  ['  ATT-SVN-1  →  sirf SVN-I ke employees'],
  ['  ATT-3UNITS →  Sakar-I + SVN-II + Sakar-III (ek hi sheet)']
];
const wsGuide = XLSX.utils.aoa_to_sheet(guideLines);
wsGuide['!cols'] = [{ wch: 110 }];
XLSX.utils.book_append_sheet(wb, wsGuide, 'GUIDE');

const outDir = 'templates';
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, `MASTER_ATTENDANCE_${MONTH}.xlsx`);
XLSX.writeFile(wb, out);
console.log('WROTE:', out);

// ── Round-trip verification: re-read and confirm structure ──
const back = XLSX.read(fs.readFileSync(out));
const names = back.SheetNames;
if (names[0] !== 'ATT-SVN-1' || names[1] !== 'ATT-3UNITS') {
  console.error('ROUND-TRIP FAIL: sheet order', names);
  process.exit(1);
}
for (const sn of ['ATT-SVN-1', 'ATT-3UNITS']) {
  const rows = XLSX.utils.sheet_to_json(back.Sheets[sn]);
  const keys = Object.keys(rows[0] || {});
  const missing = HEADERS.filter(h => !keys.includes(h));
  if (missing.length) { console.error(`${sn} missing columns:`, missing); process.exit(1); }
  const blankId = rows.filter(r => !r['Employee ID']).length;
  console.log(`${sn}: ${rows.length} rows, columns OK, blank-ID rows: ${blankId}`);
}
console.log('ROUND-TRIP OK');
