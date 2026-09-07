import type { AppState, ContractorRec, WorkerRec } from '../types';
import { effRates, commissionRate, unitName } from './store';
import { pfBase, esicApplicable } from './payroll';
import { monthLabel, monthDays } from './months';

/* ─────────────────────────────────────────────────────────────────────────
 * Contractor Bill computation — SINGLE SOURCE OF TRUTH.
 * UI (Page-1 invoice + worker detail), Excel export, printable PDF and
 * automated tests all read from these pure functions, so PDF/Excel/UI
 * totals can never drift apart.
 *
 * Core separations (business rules):
 *  - Worker deductions (PF/ESIC employee, loan, advance, other) affect ONLY
 *    worker Net Payable.
 *  - Employer PF / Employer ESIC / Commission / GST affect ONLY the bill.
 *  - Commission applies ONLY to Contractor-mode workers.
 * ───────────────────────────────────────────────────────────────────────── */

export interface BillWorkerRow {
  w: WorkerRec;
  sl: number;
  code: string;
  name: string;
  unitId: string;
  payDays: number;
  basicWages: number;
  allAllowance: number; // HRA + other allowances (month total)
  grossWages: number;   // basicWages + allAllowance
  commission: number;   // 0 for Company-mode workers (never billed)
  pfEmp: number;        // employee PF deduction (reduces net payable)
  esicEmp: number;      // employee ESIC deduction (where applicable)
  loanDeduction: number;
  advanceDeduction: number;
  otherDeduction: number;
  netPayable: number;
  advancePaid: number;  // displayed separately — NOT part of net payable math
  erPf: number;         // employer lines (bill-only, never deducted)
  erEsic: number;
}

export interface ReconCheck {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
}

export interface ContractorBillCalc {
  ct: ContractorRec;
  rows: BillWorkerRow[];
  units: string[];
  unitNames: string;
  workers: number;
  payDays: number;
  wages: number;
  commission: number;
  empPf: number;
  erPf: number;
  empEsic: number;
  erEsic: number;
  loanDeduction: number;
  advanceDeduction: number;
  otherDeduction: number;
  advancePaid: number;
  netPayable: number;
  taxable: number;      // wages + commission + erPf + erEsic
  gst: number;
  grandTotal: number;   // taxable + gst
  invoiceNo: string;
  invoiceDate: string;
  recon: ReconCheck[];
  reconOk: boolean;
}

/** Compute the full contractor bill (Page-1 summary + worker detail + reconciliation). */
export function computeBill(s: AppState, monthKey: string, ct: ContractorRec): ContractorBillCalc {
  const workers = s.workers.filter(
    (w) => w.active && w.mode === 'Contractor' && w.contractor === ct.id
  );

  const rows: BillWorkerRow[] = workers.map((w, i) => {
    const att = s.attendance.find((a) => a.workerId === w.id && a.monthKey === monthKey) || null;
    const payDays = (att?.present || 0) + (att?.paidHoliday || 0) + (att?.leave || 0);
    const rt = effRates(s, w, monthKey);

    const basicWages = round2(rt.rateBasic * payDays);
    const allAllowance = round2((rt.rateHra + rt.rateOther) * payDays);
    const grossWages = round2(basicWages + allAllowance);

    // Commission — contractor workers only, unit-wise rate by working-hours tier
    let commission = 0;
    if (w.mode === 'Contractor') {
      const cmw = commissionRate(s, monthKey, w.unitId);
      const wh = w.workingHours ?? 8;
      commission = round2(payDays * (wh >= 12 ? cmw.rate12 : wh >= 11 ? cmw.rate11 : cmw.rate8));
    }

    // PF (employee deduction + employer contribution) — ceiling configurable
    const base = pfBase(basicWages, s);
    const pfEmp = w.pf ? round2(base * s.settings.pfEmp) : 0;
    const erPf = w.pf ? round2(base * s.settings.pfEr) : 0;

    // ESIC — worker flag AND unit config (never name-based)
    const esicOn = esicApplicable(s, w);
    const esicEmp = esicOn ? round2(grossWages * s.settings.esicEmp) : 0;
    const erEsic = esicOn ? round2(grossWages * s.settings.esicEr) : 0;

    // Deductions (reduce worker net payable only)
    const ln = (s.loans || []).find((l) => l.workerId === w.id && l.monthKey === monthKey);
    const loanDeduction = round2(ln?.loanDeduction || 0);
    const advanceDeduction = round2(ln?.advanceDeduction || 0);
    const otherDeduction = round2(ln?.otherDeductions || 0);
    const advancePaid = round2(ln?.advanceAmount || 0); // display-only, no double count

    const netPayable = round2(
      grossWages - pfEmp - esicEmp - loanDeduction - advanceDeduction - otherDeduction
    );

  const wages = sum('grossWages');
  const commission = sum('commission');
  const empPf = sum('pfEmp');
  const erPf = sum('erPf');
  const empEsic = sum('esicEmp');
  const erEsic = sum('erEsic');
  const taxable = round2(wages + commission + erPf + erEsic);
  const gst = round2(taxable * (ct.gstRate ?? 0.18));
  const grandTotal = round2(taxable + gst);

  const units = [...new Set(rows.map((r) => unitName(s, r.unitId)))];

  // ── Reconciliation controls (spec §9) — bill generation is blocked if any fails ──
  const recon: ReconCheck[] = [
    { id: 'A', label: 'Σ Worker Gross = Wages Amount',
      ok: round2(rows.reduce((a, r) => a + r.grossWages, 0)) === wages,
      detail: `Σ gross ₹${wages}` },
    { id: 'B', label: 'Σ Worker Commission = Commission Amount',
      ok: round2(rows.reduce((a, r) => a + r.commission, 0)) === commission,
      detail: `Σ commission ₹${commission}` },
    { id: 'C', label: 'Σ Employer PF = Bill Employer PF',
      ok: round2(rows.reduce((a, r) => a + r.erPf, 0)) === erPf,
      detail: `Σ ER PF ₹${erPf}` },
    { id: 'D', label: 'Σ Employer ESIC = Bill Employer ESIC',
      ok: round2(rows.reduce((a, r) => a + r.erEsic, 0)) === erEsic,
      detail: `Σ ER ESIC ₹${erEsic}` },
    { id: 'E', label: 'Worker count matches detail',
      ok: rows.length === workers.length,
      detail: `${rows.length} workers` },
    { id: 'G', label: 'Grand Total = Wages + Commission + ER PF + ER ESIC + GST',
      ok: grandTotal === round2(wages + commission + erPf + erEsic + gst),
      detail: `₹${wages} + ₹${commission} + ₹${erPf} + ₹${erEsic} + ₹${gst} = ₹${grandTotal}` }
  ];

  return {
    ct, rows,
    units,
    unitNames: units.join(', ') || '—',
    workers: rows.length,
    payDays: rows.reduce((a, r) => a + r.payDays, 0),
    wages, commission, empPf, erPf, empEsic, erEsic,
    loanDeduction: sum('loanDeduction'),
    advanceDeduction: sum('advanceDeduction'),
    otherDeduction: sum('otherDeduction'),
    advancePaid: sum('advancePaid'),
    netPayable: sum('netPayable'),
    taxable, gst, grandTotal,
    invoiceNo: invoiceNoFor(ct.id, monthKey),
    invoiceDate: new Date().toISOString().slice(0, 10),
    recon,
    reconOk: recon.every((c) => c.ok)
  };
}

/** All contractor bills for a month (only contractors that have workers). */
export function computeBills(s: AppState, monthKey: string): ContractorBillCalc[] {
/* ── Printable HTML builders (PDF via browser print — same data as Excel/UI) ── */

const inr = (n: number) => '₹' + (Math.round(n * 100) / 100).toLocaleString('en-IN');

function billCss(): string {
  return `
    * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
    body { margin: 24px; color: #111; }
    .inv-head { display:flex; justify-content:space-between; border-bottom:3px solid #1e3a8a; padding-bottom:10px; }
    .inv-head h1 { margin:0; font-size:20px; color:#1e3a8a; }
    .inv-meta { text-align:right; font-size:12px; line-height:1.6; }
    .meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:4px 24px; font-size:12.5px; margin:12px 0; }
    table { width:100%; border-collapse:collapse; font-size:12px; margin-top:10px; }
    th, td { border:1px solid #cbd5e1; padding:5px 7px; }
    th { background:#eef2ff; text-align:left; }
    .num { text-align:right; font-variant-numeric: tabular-nums; }
    .sumrow td { border:none; padding:3px 7px; }
    .sumrow .lbl { text-align:right; }
    .grand td { font-weight:bold; background:#eef2ff; border:1px solid #94a3b8; }
    h2 { font-size:15px; color:#1e3a8a; margin:18px 0 4px; }
    .pagebreak { page-break-before: always; }
    @media print { body { margin: 10mm; } }
  `;
}

function billHeaderHtml(s: AppState, b: ContractorBillCalc, monthKey: string): string {
  const unit = s.units.find((u) => b.units.includes(unitName(s, u.id)));
  const comp = unit ? s.companies.find((c) => c.id === unit.companyId) : null;
  return `
    <div class="inv-head">
      <div>
        <h1>${comp ? comp.name : '—'}</h1>
        <div style="font-size:12.5px">Unit: ${b.unitNames}</div>
      </div>
      <div class="inv-meta">
        <div><b>INVOICE</b></div>
        <div>Invoice No: <b>${b.invoiceNo}</b></div>
        <div>Invoice Date: ${b.invoiceDate}</div>
        <div>Billing Month: ${monthLabel(monthKey)}</div>
        <div>Billing Period: 01 – ${monthDays(monthKey)} ${monthLabel(monthKey)}</div>
      </div>
    </div>
    <div class="meta-grid">
      <div><b>Contractor:</b> ${b.ct.name}</div>
      <div><b>Contractor Code:</b> ${b.ct.code || b.ct.id}</div>
      <div><b>Address:</b> ${b.ct.address || '—'}</div>
      <div><b>GST No:</b> ${b.ct.gstNo || '—'}</div>
      <div><b>Workers:</b> ${b.workers} · Total Pay Days: ${b.payDays}</div>
      <div><b>Company:</b> ${comp ? comp.name : '—'}</div>
    </div>`;
}

function billSummaryHtml(b: ContractorBillCalc): string {
  return `
    <table style="width:62%; margin-left:auto; margin-top:14px;">
      <tr class="sumrow"><td class="lbl">Wages Amount</td><td class="num">${inr(b.wages)}</td></tr>
      <tr class="sumrow"><td class="lbl">+ Commission Amount</td><td class="num">${inr(b.commission)}</td></tr>
      <tr class="sumrow"><td class="lbl">+ Employer PF Contribution</td><td class="num">${inr(b.erPf)}</td></tr>
      <tr class="sumrow"><td class="lbl">+ Employer ESIC Contribution</td><td class="num">${inr(b.erEsic)}</td></tr>
      <tr class="sumrow"><td class="lbl" style="font-weight:bold; border-top:1px solid #64748b;">= Taxable Contractor Service Amount</td><td class="num" style="font-weight:bold; border-top:1px solid #64748b;">${inr(b.taxable)}</td></tr>
function billDetailHtml(b: ContractorBillCalc): string {
  const head = ['Sl', 'Code', 'Worker Name', 'Pay Days', 'Basic Wages', 'All Allowance', 'Gross Wages', 'Loan Ded.', 'Advance Ded.', 'PF Ded.', 'ESIC Ded.', 'Other Ded.', 'Net Payable', 'Advance Paid'];
  const body = b.rows.map((r) => `
    <tr>
      <td>${r.sl}</td><td>${r.code}</td><td>${r.name}</td><td class="num">${r.payDays}</td>
      <td class="num">${inr(r.basicWages)}</td><td class="num">${inr(r.allAllowance)}</td><td class="num">${inr(r.grossWages)}</td>
      <td class="num">${r.loanDeduction ? inr(r.loanDeduction) : '—'}</td>
      <td class="num">${r.advanceDeduction ? inr(r.advanceDeduction) : '—'}</td>
      <td class="num">${r.pfEmp ? inr(r.pfEmp) : '—'}</td>
      <td class="num">${r.esicEmp ? inr(r.esicEmp) : '—'}</td>
      <td class="num">${r.otherDeduction ? inr(r.otherDeduction) : '—'}</td>
      <td class="num" style="font-weight:bold">${inr(r.netPayable)}</td>
      <td class="num">${r.advancePaid ? inr(r.advancePaid) : '—'}</td>
    </tr>`).join('');
  const foot = `
    <tr style="background:#eef2ff; font-weight:bold;">
      <td colspan="3">TOTAL (${b.workers} workers)</td>
      <td class="num">${b.payDays}</td>
      <td class="num">${inr(b.rows.reduce((a, r) => a + r.basicWages, 0))}</td>
      <td class="num">${inr(b.rows.reduce((a, r) => a + r.allAllowance, 0))}</td>
      <td class="num">${inr(b.wages)}</td>
      <td class="num">${inr(b.loanDeduction)}</td>
      <td class="num">${inr(b.advanceDeduction)}</td>
      <td class="num">${inr(b.empPf)}</td>
      <td class="num">${inr(b.empEsic)}</td>
      <td class="num">${inr(b.otherDeduction)}</td>
      <td class="num">${inr(b.netPayable)}</td>
      <td class="num">${inr(b.advancePaid)}</td>
    </tr>`;
  return `
    <h2>Worker-wise Detailed Statement</h2>
    <table>
      <thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${body}${foot}</tbody>
    </table>`;
}

/** Open a print window with the full Contractor Bill (Page 1 invoice + worker detail). */
export function printContractorBill(s: AppState, b: ContractorBillCalc, monthKey: string) {
  const win = window.open('', '_blank', 'width=1000,height=750');
  if (!win) { alert('Popup blocked — please allow popups for print.'); return; }
  win.document.write(`<!doctype html><html><head><title>${b.invoiceNo} — ${b.ct.name}</title><style>${billCss()}</style></head><body>
    ${billHeaderHtml(s, b, monthKey)}
    ${billSummaryHtml(b)}
    <div class="pagebreak"></div>
    ${billDetailHtml(b)}
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}

/** Open a print window with one worker's payslip. Employer lines shown, NOT deducted. */
export function printWorkerPayslip(s: AppState, b: ContractorBillCalc, r: BillWorkerRow, monthKey: string) {
  const unit = s.units.find((u) => u.id === r.w.unitId);
  const comp = unit ? s.companies.find((c) => c.id === unit.companyId) : null;
  const rt = effRates(s, r.w, monthKey);
  const hraAmt = Math.round(rt.rateHra * r.payDays * 100) / 100;
  const line = (l: string, v: string, bold = false) =>
    `<tr><td${bold ? ' style="font-weight:bold"' : ''}>${l}</td><td class="num"${bold ? ' style="font-weight:bold"' : ''}>${v}</td></tr>`;
  const win = window.open('', '_blank', 'width=820,height=900');
  if (!win) { alert('Popup blocked — please allow popups for print.'); return; }
  win.document.write(`<!doctype html><html><head><title>Payslip — ${r.name} (${monthLabel(monthKey)})</title><style>${billCss()}</style></head><body>
    <div class="inv-head">
      <div><h1>${comp ? comp.name : '—'}</h1><div style="font-size:12.5px">Unit: ${unit ? unit.name : '—'} · Contractor: ${b.ct.name}</div></div>
      <div class="inv-meta"><div><b>WORKER PAYSLIP</b></div><div>Month: <b>${monthLabel(monthKey)}</b></div></div>
    </div>
    <div class="meta-grid">
      <div><b>Worker Code:</b> ${r.code}</div><div><b>Worker Name:</b> ${r.name}</div>
      <div><b>Worker Category:</b> ${r.w.mode === 'Contractor' ? 'Contractor Worker' : 'Company Worker'}</div>
      <div><b>Contractor:</b> ${b.ct.name}</div>
      <div><b>Pay Days:</b> ${r.payDays}</div><div><b>Department:</b> ${r.w.department || '—'}</div>
    </div>
    <table style="width:70%">
      <thead><tr><th>Earnings</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        ${line('Basic Wages', inr(r.basicWages))}
        ${line('HRA', inr(hraAmt))}
        ${line('Other Allowances', inr(r.allAllowance - hraAmt))}
        ${line('Gross Wages', inr(r.grossWages), true)}
      </tbody>
    </table>
    <table style="width:70%">
      <thead><tr><th>Deductions</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        ${line('PF Employee', r.pfEmp ? inr(r.pfEmp) : '—')}
        ${line('ESIC Employee', r.esicEmp ? inr(r.esicEmp) : '—')}
        ${line('Loan Deduction', r.loanDeduction ? inr(r.loanDeduction) : '—')}
        ${line('Advance Deduction', r.advanceDeduction ? inr(r.advanceDeduction) : '—')}
        ${line('Other Deduction', r.otherDeduction ? inr(r.otherDeduction) : '—')}
        ${line('NET PAYABLE', inr(r.netPayable), true)}
      </tbody>
    </table>
    <table style="width:70%; margin-top:10px;">
      <thead><tr><th>Employer Contributions (not deducted from worker)</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>
        ${line('Employer PF Contribution', r.erPf ? inr(r.erPf) : '—')}
        ${line('Employer ESIC Contribution', r.erEsic ? inr(r.erEsic) : '—')}
      </tbody>
    </table>
    ${r.advancePaid ? `<div style="font-size:12px; margin-top:8px;">Advance Paid this month (separate, not double-counted): <b>${inr(r.advancePaid)}</b></div>` : ''}
    </body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
}
      <tr class="sumrow"><td class="lbl">+ GST Amount</td><td class="num">${inr(b.gst)}</td></tr>
      <tr class="grand"><td class="lbl">GRAND TOTAL CONTRACTOR BILL</td><td class="num">${inr(b.grandTotal)}</td></tr>
    </table>`;
}
  return s.contractors
    .map((ct) => computeBill(s, monthKey, ct))
    .filter((b) => b.rows.length > 0);
}
    return {
      w, sl: i + 1, code: w.code, name: w.name, unitId: w.unitId,
      payDays, basicWages, allAllowance, grossWages, commission,
      pfEmp, esicEmp, loanDeduction, advanceDeduction, otherDeduction,
      netPayable, advancePaid, erPf, erEsic
    };
  });

  const sum = (k: keyof BillWorkerRow) => round2(rows.reduce((acc, r) => acc + (r[k] as number), 0));
export const round2 = (n: number) => Math.round((n || 0) * 100) / 100;

/** Invoice number for a contractor + billing month (stable within a month). */
export function invoiceNoFor(ctId: string, monthKey: string): string {
  return `INV-${monthKey.replace('-', '')}-${ctId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
}