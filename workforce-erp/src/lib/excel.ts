import type { AppState } from '../types';
import { unitName, companyName, contractorName, effRates, commissionRate } from './store';
import { computeBills } from './contractor';
import { calcPayroll, totals } from './payroll';
import { monthLabel, monthDays } from './months';

/* ─────────────────────────────────────────────────────────────
 * Month-wise Excel Report Export
 * Builds a multi-sheet .xlsx workbook for a given month and
 * downloads it via the browser. Uses the SheetJS library that is
 * inlined into the single-file WORKFORCE-2026.html build, with a
 * one-time CDN fallback (same pattern as Attendance import).
 * ───────────────────────────────────────────────────────────── */

type XLSXLib = any;

export function loadXLSX(): Promise<XLSXLib> {
  const w = window as any;
  if (w.XLSX) return Promise.resolve(w.XLSX);
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    s.onload = () => (w.XLSX ? res(w.XLSX) : rej(new Error('XLSX library failed to load')));
    s.onerror = () => rej(new Error('Could not load Excel library — internet needed once.'));
    document.head.appendChild(s);
  });
}

/** Attach default column widths to a worksheet. */
function fmtSheet(ws: any, widths: number[]) {
  ws['!cols'] = widths.map((wch) => ({ wch }));
  return ws;
}

const r2 = (n: number) => Math.round((n || 0) * 100) / 100;

/* ── Sheet 1: Summary ── */
function summarySheet(state: AppState, monthKey: string, XLSX: XLSXLib) {
  const rows = calcPayroll(state, monthKey);
  const total = totals(rows);
  const att = state.attendance.filter((a) => a.monthKey === monthKey);
  const active = state.workers.filter((w) => w.active);

  const presentDays = att.reduce((s, a) => s + (a.present || 0), 0);
  const absentDays = att.reduce((s, a) => s + (a.absent || 0), 0);
  const otHours = att.reduce((s, a) => s + (a.otHours || 0), 0);
  const companyMode = active.filter((w) => w.mode === 'Company').length;
  const contractorMode = active.filter((w) => w.mode === 'Contractor').length;
  const pfCount = active.filter((w) => w.pf).length;
  const esicCount = active.filter((w) => w.esic).length;

  const pfChallanTotal = (state.pfChallans || [])
    .filter((c) => c.monthKey === monthKey)
    .reduce((s, c) => s + (c.total || 0), 0);

  const aoa: any[][] = [
    ['WORKFORCE MONTHLY REPORT', monthLabel(monthKey), '', ''],
    ['Generated At', new Date().toLocaleString('en-IN'), '', ''],
    [],
    ['WORKFORCE OVERVIEW', '', '', ''],
    ['Active Workers', active.length, '', ''],
    ['Company Workers', companyMode, '', ''],
    ['Contractor Workers', contractorMode, '', ''],
    ['PF Eligible Workers', pfCount, '', ''],
    ['ESIC Eligible Workers', esicCount, '', ''],
    ['Workers with Attendance This Month', att.length, '', ''],
    ['Total Present Days (all workers)', presentDays, '', ''],
    ['Total Absent Days (all workers)', absentDays, '', ''],
    ['Total OT Hours', r2(otHours), '', ''],
    [],
    ['PAYROLL SUMMARY (Rs)', '', '', ''],
    ['Paid Days', total.payDays, '', ''],
    ['Gross Wages', r2(total.gross), '', ''],
    ['PF (Employee)', r2(total.pf), '', ''],
    ['ESIC (Employee)', r2(total.esic), '', ''],
    ['Loan/Advance Recovery', r2(total.recovery), '', ''],
    ['Net Pay', r2(total.net), '', ''],
    [],
    ['CONTRACTOR / PF (Rs)', '', '', ''],
    ['PF Challans Issued', (state.pfChallans || []).filter((c) => c.monthKey === monthKey).length, '', ''],
    ['PF Challan Total', r2(pfChallanTotal), '', ''],
    [],
    ['Month', monthKey, '', ''],
    ['Month Days', monthDays(monthKey), '', '']
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  return fmtSheet(ws, [30, 18, 12, 14]);
}
/* ── Sheet 2: Payroll ── */
function payrollSheet(state: AppState, monthKey: string, XLSX: XLSXLib) {
  const rows = calcPayroll(state, monthKey);
  const data = rows.map((r) => ({
    Code: r.worker.code,
    Name: r.worker.name,
    Unit: unitName(state, r.worker.unitId),
    Company: companyName(state, r.worker.companyId),
    Contractor: r.worker.mode === 'Contractor' ? contractorName(state, r.worker.contractor) : '—',
    Department: r.worker.department || '',
    'Pay Days': r.payDays,
    'OT Hours': r.att?.otHours || 0,
    'OT Pay': r2(r.otPay),
    Basic: r2(r.basic),
    HRA: r2(r.hra),
    Other: r2(r.other),
    Gross: r2(r.gross),
    PF: r2(r.pf),
    ESIC: r2(r.esic),
    'Loan Deduction': r2(r.loanDeduction),
    'Advance Deduction': r2(r.advanceDeduction),
    Recovery: r2(r.recovery),
    'Net Pay': r2(r.net),
    'Bank Account': r.worker.ac || '',
    IFSC: r.worker.ifsc || ''
  }));

  const total = totals(rows);
  const tHra = r2(rows.reduce((s, r) => s + r.hra, 0));
  const tOther = r2(rows.reduce((s, r) => s + r.other, 0));
  const tOtPay = r2(rows.reduce((s, r) => s + r.otPay, 0));
  if (data.length) {
    data.push({
      Code: 'TOTAL',
      Name: `${rows.length} workers`,
      'Pay Days': total.payDays,
      'OT Pay': tOtPay,
      Basic: r2(total.basic),
      HRA: tHra,
      Other: tOther,
      Gross: r2(total.gross),
      PF: r2(total.pf),
      ESIC: r2(total.esic),
      Recovery: r2(total.recovery),
      'Net Pay': r2(total.net)
    } as any);
  }
  const ws = XLSX.utils.json_to_sheet(data);
  return fmtSheet(ws, [16, 24, 14, 20, 16, 16, 9, 9, 10, 10, 10, 10, 10, 10, 10, 14, 16, 10, 10, 14, 12]);
}

/* ── Sheet 3: Attendance ── */
function attendanceSheet(state: AppState, monthKey: string, XLSX: XLSXLib) {
  const data = state.workers
    .filter((w) => w.active)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((w) => {
      const a = state.attendance.find((x) => x.workerId === w.id && x.monthKey === monthKey);
      const rowSum = (a?.present || 0) + (a?.absent || 0) + (a?.weeklyOff || 0) + (a?.paidHoliday || 0) + (a?.leave || 0) + (a?.lwp || 0);
      return {
        Code: w.code,
        Name: w.name,
        Unit: unitName(state, w.unitId),
        Company: companyName(state, w.companyId),
        Department: w.department || '',
        Present: a?.present || 0,
        Absent: a?.absent || 0,
        'Weekly Off': a?.weeklyOff || 0,
        'Paid Holiday': a?.paidHoliday || 0,
        Leave: a?.leave || 0,
        LWP: a?.lwp || 0,
        'OT Hours': r2(a?.otHours || 0),
        ['Total (expect ' + monthDays(monthKey) + ')']: rowSum,
        Status: rowSum <= 0 ? 'Not Yet Entered' : Math.abs(rowSum - monthDays(monthKey)) < 0.01 ? 'OK' : 'Check'
      };
    });
  const ws = XLSX.utils.json_to_sheet(data);
  return fmtSheet(ws, [16, 24, 14, 20, 16, 9, 9, 10, 12, 9, 9, 10, 18, 14]);
}

/* ── Sheet 4: Leave Ledger ── */
function leaveSheet(state: AppState, monthKey: string, XLSX: XLSXLib) {
  const data = state.workers
    .filter((w) => w.active)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((w) => {
      const l = state.leave.find((x) => x.workerId === w.id && x.monthKey === monthKey);
      return {
        Code: w.code,
        Name: w.name,
        Unit: unitName(state, w.unitId),
        Opening: l?.opening ?? 0,
        Earned: l?.earned ?? 0,
        Taken: l?.taken ?? 0,
        Balance: l?.balance ?? ((l?.opening || 0) + (l?.earned ?? 0) - (l?.taken || 0))
      };
    });
  const ws = XLSX.utils.json_to_sheet(data);
  return fmtSheet(ws, [16, 24, 14, 10, 10, 10, 10]);
}
/* ── Sheet 5: Loans & Recovery ── */
function loansSheet(state: AppState, monthKey: string, XLSX: XLSXLib) {
  const monthLoans = (state.loans || []).filter((l) => l.monthKey === monthKey);
  const data = state.workers
    .filter((w) => w.active)
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((w) => {
      const l = monthLoans.find((x) => x.workerId === w.id);
      return {
        Code: w.code,
        Name: w.name,
        Unit: unitName(state, w.unitId),
        'New Loan (Rs)': l?.loanAmount || 0,
        'Loan Deduction (Rs)': l?.loanDeduction || 0,
        'New Advance (Rs)': l?.advanceAmount || 0,
        'Advance Deduction (Rs)': l?.advanceDeduction || 0,
        'Other Deductions (Rs)': l?.otherDeductions || 0,
        'Outstanding (Rs)': l?.outstanding || 0,
        Remarks: l?.remarks || ''
      };
    });
  const ws = XLSX.utils.json_to_sheet(data);
  return fmtSheet(ws, [16, 24, 14, 14, 18, 14, 20, 18, 18, 22]);
}

/* ── Sheet 6: Contractor Bills (invoice summary + worker detail, spec-exact) ── */
function contractorSheet(state: AppState, monthKey: string, XLSX: XLSXLib) {
  const bills = computeBills(state, monthKey);
  const rows: any[] = [];
  for (const b of bills) {
    // Page-1 style summary block (matches PDF invoice exactly)
    rows.push({ Section: 'BILL SUMMARY', Contractor: b.ct.name, 'Invoice No': b.invoiceNo, 'Invoice Date': b.invoiceDate, Unit: b.unitNames, Workers: b.workers, 'Pay Days': b.payDays });
    rows.push({ Section: '', Contractor: 'Wages Amount', Amount: b.wages });
    rows.push({ Section: '', Contractor: '+ Commission Amount', Amount: b.commission });
    rows.push({ Section: '', Contractor: '+ Employer PF Contribution', Amount: b.erPf });
    rows.push({ Section: '', Contractor: '+ Employer ESIC Contribution', Amount: b.erEsic });
    rows.push({ Section: '', Contractor: '= Taxable Contractor Service Amount', Amount: b.taxable });
    rows.push({ Section: '', Contractor: '+ GST Amount', Amount: b.gst });
    rows.push({ Section: '', Contractor: 'GRAND TOTAL CONTRACTOR BILL', Amount: b.grandTotal });
    // Page-2 worker detail (same numbers as the PDF)
    for (const r of b.rows) {
      rows.push({
        Section: 'WORKER DETAIL',
        'Sl No': r.sl,
        'Worker Code': r.code,
        'Worker Name': r.name,
        Unit: unitName(state, r.unitId),
        'Pay Days': r.payDays,
        'Basic Wages (Rs)': r.basicWages,
        'All Allowance (Rs)': r.allAllowance,
        'Gross Wages (Rs)': r.grossWages,
        'Loan Deduction (Rs)': r.loanDeduction,
        'Advance Deduction (Rs)': r.advanceDeduction,
        'PF Deduction (Rs)': r.pfEmp,
        'ESIC Deduction (Rs)': r.esicEmp,
        'Other Deduction (Rs)': r.otherDeduction,
        'Net Payable (Rs)': r.netPayable,
        'Advance Paid (Rs)': r.advancePaid,
        'Employer PF (Rs)': r.erPf,
        'Employer ESIC (Rs)': r.erEsic,
        'Commission (Rs)': r.commission
      });
    }
    rows.push({ Section: 'WORKER DETAIL', 'Worker Code': 'TOTAL', 'Worker Name': `${b.workers} workers`, 'Pay Days': b.payDays, 'Gross Wages (Rs)': b.wages, 'Loan Deduction (Rs)': b.loanDeduction, 'Advance Deduction (Rs)': b.advanceDeduction, 'PF Deduction (Rs)': b.empPf, 'ESIC Deduction (Rs)': b.empEsic, 'Other Deduction (Rs)': b.otherDeduction, 'Net Payable (Rs)': b.netPayable, 'Advance Paid (Rs)': b.advancePaid });
  }
  const ws = XLSX.utils.json_to_sheet(rows);
  return fmtSheet(ws, [16, 10, 14, 22, 14, 10, 14, 14, 14, 14, 14, 12, 12, 12, 14, 14, 14, 14, 12]);
}
/* ── Sheet 7: PF Challans ── */
function pfChallanSheet(state: AppState, monthKey: string, XLSX: XLSXLib) {
  const rows = (state.pfChallans || [])
    .filter((c) => c.monthKey === monthKey)
    .map((c) => ({
      'Challan No': c.challanNo || c.id,
      Contractor: contractorName(state, c.contractorId),
      'Employee PF (Rs)': r2(c.empPf),
      'Employer PF (Rs)': r2(c.erPf),
      'Total (Rs)': r2(c.total),
      'Generated At': c.generatedAt ? new Date(c.generatedAt).toLocaleString('en-IN') : ''
    }));
  const ws = XLSX.utils.json_to_sheet(rows);
  return fmtSheet(ws, [22, 20, 16, 16, 14, 20]);
}

/* ── Sheet 8: Worker Master ── */
function workerMasterSheet(state: AppState, monthKey: string, XLSX: XLSXLib) {
  const data = state.workers
    .slice()
    .sort((a, b) => a.code.localeCompare(b.code))
    .map((w) => {
      const eff = effRates(state, w, monthKey);
      return {
        Code: w.code,
        Name: w.name,
        Unit: unitName(state, w.unitId),
        Company: companyName(state, w.companyId),
        Contractor: w.mode === 'Contractor' ? contractorName(state, w.contractor) : '—',
        Department: w.department || '',
        Gender: w.gender,
        'Join Date': w.doj,
        UAN: w.uan || '',
        Bank: w.bank || '',
        'Account No': w.ac || '',
        IFSC: w.ifsc || '',
        Mode: w.mode,
        'Working Hours': w.workingHours ?? 8,
        'Rate Basic (Rs)': eff.rateBasic,
        'Rate HRA (Rs)': eff.rateHra,
        'Rate Other (Rs)': eff.rateOther,
        'Rate / Day (Rs)': eff.rateDay,
        'CTC (Rs)': w.ctc || 0,
        'Min Wage (Rs)': w.minWage || 0,
        PF: w.pf ? 'Yes' : 'No',
        ESIC: w.esic ? 'Yes' : 'No',
        Active: w.active ? 'Yes' : 'No'
      };
    });
  const ws = XLSX.utils.json_to_sheet(data);
  return fmtSheet(ws, [16, 24, 14, 20, 16, 16, 8, 12, 16, 14, 14, 14, 12, 12, 12, 12, 12, 12, 12, 12, 8, 8, 8]);
}

/**
 * Generate & download the month-wise Excel report.
 * Returns the filename that was downloaded.
 */
export async function exportMonthWorkbook(state: AppState, monthKey: string): Promise<string> {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, summarySheet(state, monthKey, XLSX), 'Summary');
  XLSX.utils.book_append_sheet(wb, payrollSheet(state, monthKey, XLSX), 'Payroll');
  XLSX.utils.book_append_sheet(wb, attendanceSheet(state, monthKey, XLSX), 'Attendance');
  XLSX.utils.book_append_sheet(wb, leaveSheet(state, monthKey, XLSX), 'Leave Ledger');
  XLSX.utils.book_append_sheet(wb, loansSheet(state, monthKey, XLSX), 'Loans & Recovery');
  XLSX.utils.book_append_sheet(wb, contractorSheet(state, monthKey, XLSX), 'Contractor Bills');
  XLSX.utils.book_append_sheet(wb, pfChallanSheet(state, monthKey, XLSX), 'PF Challans');
  XLSX.utils.book_append_sheet(wb, workerMasterSheet(state, monthKey, XLSX), 'Worker Master');

  const filename = `WORKFORCE-2026_${monthKey}_Month-Report.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}