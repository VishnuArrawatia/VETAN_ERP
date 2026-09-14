/**
 * Excel template + bulk import for Bonus Provisions (Oct-25 → Mar-26 manual) and
 * the manual Arrear Register. Uses the project's existing `xlsx` dependency.
 *
 * Flow:
 *   1. HR downloads the template (pre-filled with ALL active employees).
 *   2. HR fills only the required columns (Basic/Amount etc.) and imports.
 *   3. Frontend parses to JSON rows and POSTs to the import API — validation,
 *      month normalization, duplicate handling and persistence are SERVER-side.
 */

export interface ImportResultRow {
  row: number;
  employee: string;
  status: 'IMPORTED' | 'SKIPPED_DUPLICATE' | 'SKIPPED_AUTO' | 'ERROR';
  message: string;
}

export interface ImportResponse {
  success: boolean;
  imported?: number;
  skipped?: number;
  errors?: number;
  results?: ImportResultRow[];
  error?: string;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const BONUS_MANUAL_MONTHS = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
export const BONUS_AUTO_MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];

/** '2026-03' → 'Mar-26'; also parses 'Mar-26' / 'Mar-2026' / '03-2026' / '2026-03' back. */
export function normalizeMonth(v: any): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  // Excel real dates
  if (v instanceof Date && !isNaN(v.getTime())) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}`;
  }
  let m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m) {
    const mo = Number(m[2]);
    return (mo >= 1 && mo <= 12) ? `${m[1]}-${String(mo).padStart(2, '0')}` : null;
  }
  m = s.match(/^([A-Za-z]{3,})[-/\s](\d{2,4})$/);
  if (m) {
    const idx = MONTH_LABELS.findIndex(x => m![1].toLowerCase().startsWith(x.toLowerCase()));
    if (idx >= 0) {
      let y = Number(m[2]);
      if (y < 100) y += 2000;
      return `${y}-${String(idx + 1).padStart(2, '0')}`;
    }
  }
  m = s.match(/^(\d{1,2})[-/\s](\d{4})$/);
  if (m) {
    const mo = Number(m[1]);
    return (mo >= 1 && mo <= 12) ? `${m[2]}-${String(mo).padStart(2, '0')}` : null;
  }
  return null;
}

function sheetFromAoA(aoa: any[][]): any {
  const ws: any = {};
  const range = { s: { r: 0, c: 0 }, e: { r: aoa.length - 1, c: Math.max(...aoa.map(r => r.length)) - 1 } };
  ws['!ref'] = aoa_to_ref(range);
  for (let r = 0; r < aoa.length; r++) {
    for (let c = 0; c < aoa[r].length; c++) {
      const cell: any = { v: aoa[r][c] };
      if (typeof aoa[r][c] === 'number') cell.t = 'n'; else cell.t = 's';
      ws[encode_cell(r, c)] = cell;
    }
  }
  ws['!cols'] = [{ wch: 16 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 36 }, { wch: 10 }, { wch: 12 }, { wch: 26 }];
  return ws;
}

function encode_cell(r: number, c: number): string {
  let s = '';
  c++;
  while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); }
  return `${s}${r + 1}`;
}
function aoa_to_ref(range: any): string {
  return `${encode_cell(range.s.r, range.s.c)}:${encode_cell(range.e.r, range.e.c)}`;
}

/** Download the Bonus Provision import template (all active employees pre-filled). */
export function downloadBonusTemplate(employees: any[]): void {
  const aoa: any[][] = [
    ['EMPLOYEE CODE', 'EMPLOYEE NAME', 'MONTH', 'BASIC', 'BONUS AMOUNT', 'REMARKS', '', '', '', ''],
    ['(mandatory)', '(reference)', 'Oct-25 to Mar-26', '(₹, mandatory)', '(₹, blank = Basic × 8.33%)', '(optional)', '', '', '', ''],
    [], // blank separator row
    ...employees.filter(e => e.status === 'ACTIVE').map(e => [
      e.emp_code || e.id, e.name, '', Number(e.base_salary) || 0, '', '', '', '', '', ''
    ])
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromAoA(aoa), 'Bonus Provisions');
  const guide: any[][] = [
    ['BONUS PROVISION IMPORT — INSTRUCTIONS'],
    [''],
    ['1. MONTH column: type month as Oct-25, Nov-25 … Mar-26 (or 2025-10 … 2026-03).'],
    ['2. BASIC is mandatory. BONUS AMOUNT blank rahe to system Basic × 8.33% use karega.'],
    ['3. Same Employee+Month do baar file me ya system me ho to duplicate skip/error hoga.'],
    ['4. Apr-26 onward auto-generation se aata hai — is file me woh months mat bharein.'],
    ['5. Filled file ko Import button se upload karein.'],
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromAoA(guide), 'Instructions');
  XLSX.writeFile(wb, 'Bonus_Provision_Import_Template.xlsx');
}

/** Download the Arrear import template (all active employees pre-filled). */
export function downloadArrearTemplate(employees: any[]): void {
  const aoa: any[][] = [
    ['EMPLOYEE CODE', 'EMPLOYEE NAME', 'ARREAR MONTH', 'AMOUNT', 'REASON', 'PF EFFECT', 'BONUS EFFECT', 'STATUS', 'REMARKS'],
    ['(mandatory)', '(reference)', '(mandatory)', '(₹, mandatory)', '(optional)', '(₹, optional)', '(₹, optional)', 'DRAFT', '(optional)'],
    [],
    ...employees.filter(e => e.status === 'ACTIVE').map(e => [
      e.emp_code || e.id, e.name, '', '', '', '', '', 'DRAFT', ''
    ])
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheetFromAoA(aoa), 'Arrears');
  const guide: any[][] = [
    ['ARREAR IMPORT — INSTRUCTIONS'],
    [''],
    ['1. ARREAR MONTH: Apr-26, May-26 … (ya 2026-04 …).'],
    ['2. AMOUNT mandatory (positive number).'],
    ['3. Same Employee+Month+Amount+Reason duplicate hoga to skip hoga.'],
    ['4. STATUS: DRAFT / APPROVED / PAID (blank = DRAFT).'],
    ['5. PF EFFECT / BONUS EFFECT optional reference amounts hain — koi calculation nahi hoti.'],
  ];
  XLSX.utils.book_append_sheet(wb, sheetFromAoA(guide), 'Instructions');
  XLSX.writeFile(wb, 'Arrear_Import_Template.xlsx');
}

/** Parse an imported xlsx back to raw row objects (header-name based). */
export function parseImportFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev: any) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' });
        resolve(rows || []);
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  });
}
