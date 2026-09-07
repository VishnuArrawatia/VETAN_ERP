import { useState, useRef } from 'react';
import { Search, Upload, Download } from 'lucide-react';
import { useStore, unitName, upsertLoan, removeLoan } from '../lib/store';
import { monthLabel, fmtINR, MONTHS } from '../lib/months';
import { Card, CardHeader, Btn, Input, Select, Badge, Empty, Th, Td, Table } from './ui';

export default function Loans({ monthKey: propMonth }: { monthKey: string }) {
  const { state, set } = useStore();
  const [monthKey, setMonthKey] = useState(propMonth);
  const [q, setQ] = useState('');
  const [unit, setUnit] = useState('all');
  const [editWorkerId, setEditWorkerId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // ---- Loan CSV template ----
  const downloadTemplate = () => {
    const head = 'Code,Name,Loan_Amount,Loan_EMI,Advance_Amount,Advance_Recovery,Other_Deductions,Outstanding_Remarks';
    const lines = state.workers.filter((w) => w.active).map((w) => `${w.code},${w.name.replace(/,/g, ' ')},,,,,,`);
    const blob = new Blob(['\uFEFF' + [head, ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `LOAN-TEMPLATE-${monthKey}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const loansFor = (workerId: string, mk: string) =>
    (state.loans || []).find((l) => l.workerId === workerId && l.monthKey === mk);

  const visible = state.workers
    .filter((w) => w.active)
    .filter((w) => unit === 'all' || w.unitId === unit)
    .filter((w) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return w.name.toLowerCase().includes(s) || w.code.toLowerCase().includes(s);
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  const setNum = (workerId: string, field: string, val: string) => {
    const n = parseFloat(val) || 0;
    set((s) => upsertLoan(s, monthKey, workerId, { [field]: n }));
  };

  // ---- CSV / Excel loan upload ----
  const norm = (s: any) => String(s == null ? '' : s).toString().trim().toLowerCase();
  const numv = (v: any) => { const n = parseFloat(v); return isNaN(n) ? 0 : Math.max(0, n); };

  const applyLoanRow = (code: string, row: any, map: Record<string, number>) => {
    const w = state.workers.find((x) => x.code && norm(x.code) === norm(code));
    if (!w) return 0;
    set((s) =>
      upsertLoan(s, monthKey, w.id, {
        loanAmount: numv(row[map.loanAmount]),
        loanDeduction: numv(row[map.loanDeduction]),
        advanceAmount: numv(row[map.advanceAmount]),
        advanceDeduction: numv(row[map.advanceDeduction]),
        otherDeductions: numv(row[map.otherDeductions]),
        outstanding: numv(row[map.outstanding]),
        remarks: map.remarks >= 0 ? String(row[map.remarks] || '').trim() : ''
      })
    );
    return 1;
  };

  const pickCol = (headers: string[], candidates: string[]): number => {
    for (const c of candidates) {
      const i = headers.findIndex((h) => norm(h) === c);
      if (i >= 0) return i;
    }
    for (const c of candidates) {
      const i = headers.findIndex((h) => norm(h).includes(c));
      if (i >= 0) return i;
    }
    return -1;
  };

  const parseLoanRows = async (rows: any[][]) => {
    let hr = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i].some((h: any) => ['proper code', 'worker_code', 'code', 'worker code'].includes(norm(h)))) {
        hr = i; break;
      }
    }
    if (hr < 0) throw new Error('Header row not found (need Code column)');
    const headers = (rows[hr] || []).map((h: any) => String(h == null ? '' : h));
    const map = {
      code: 0,
      loanAmount: pickCol(headers, ['loan_amount', 'loan amt', 'loan']),
      loanDeduction: pickCol(headers, ['loan_deduction', 'loan emi', 'emi', 'loan recovery']),
      advanceAmount: pickCol(headers, ['advance_amount', 'advance']),
      advanceDeduction: pickCol(headers, ['advance_deduction', 'advance recovery', 'adv recov']),
      otherDeductions: pickCol(headers, ['other_deductions', 'other deductions', 'other']),
      outstanding: pickCol(headers, ['outstanding', 'outstanding_balance', 'balance']),
      remarks: pickCol(headers, ['remarks', 'remark', 'note'])
    };
    let matched = 0, missing = 0;
    for (let r = hr + 1; r < rows.length; r++) {
      const code = String(rows[r]?.[map.code] ?? '').trim();
      if (!code) continue;
      const before = matched;
      matched += applyLoanRow(code, rows[r], map);
      if (matched === before) missing++;
    }
    return { matched, missing };
  };

  const handleFile = (file: File) => {
    setMsg('');
    if (!file) return;
    const runRows = async (readerResult: any, isArray: boolean) => {
      try {
        const win: any = window;
        if (file.name.toLowerCase().endsWith('.csv')) {
          const text = String(readerResult);
          const rows: string[][] = text.split(/\r\n|\r|\n/).map((line) => {
            const out: string[] = []; let cur = '', q = false;
            for (const ch of line) { if (ch === '"') q = !q; else if (ch === ',' && !q) { out.push(cur); cur = ''; } else cur += ch; }
            out.push(cur); return out;
          });
          const r = await parseLoanRows(rows);
          setMsg(`Loan CSV imported: ${r.matched} workers updated, ${r.missing} codes not found`);
        } else {
          if (!win.XLSX) {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
            await new Promise<void>((res, rej) => { s.onload = () => res(); s.onerror = () => rej(new Error('XLSX load failed')); document.head.appendChild(s); });
          }
          const wb = win.XLSX.read(readerResult, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows: any[][] = win.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          const r = await parseLoanRows(rows);
          setMsg(`Loan Excel imported: ${r.matched} workers updated, ${r.missing} codes not found`);
        }
      } catch (e: any) {
        setMsg('Import error: ' + e.message);
      }
    };
    if (file.name.toLowerCase().endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = () => runRows(reader.result, false);
      reader.readAsText(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => runRows(reader.result, true);
      reader.readAsArrayBuffer(file);
    }
  };

  const totalRecovery = (state.loans || [])
    .filter((l) => l.monthKey === monthKey)
    .reduce((sum, l) => sum + (l.loanDeduction || 0) + (l.advanceDeduction || 0) + (l.otherDeductions || 0), 0);
  const totalOutstanding = (state.loans || [])
    .filter((l) => l.monthKey === monthKey)
    .reduce((sum, l) => sum + (l.outstanding || 0), 0);
  const withLoan = (state.loans || []).filter((l) => l.monthKey === monthKey).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Loans &amp; Advance</h1>
          <p className="text-sm text-slate-500">Month-wise Loan / Advance / Other Deductions — kisi bhi mahine ki entry dekhlo aur sudhar lo</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Select value={monthKey} onChange={(e) => setMonthKey(e.target.value)} className="w-auto min-w-[120px]">
            {MONTHS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </Select>
          <Btn variant="secondary" onClick={downloadTemplate}>
            <Download size={15} /> Template
          </Btn>
          <Btn variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Excel / CSV Upload
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <Badge tone="blue">{withLoan} with records</Badge>
          <Badge tone="green">Recovery ₹{fmtINR(totalRecovery)}</Badge>
          <Badge tone="amber">Due ₹{fmtINR(totalOutstanding)}</Badge>
        </div>
      </div>

      {msg && (
        <div className="text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5">{msg}</div>
      )}
      <div className="text-[11px] text-slate-400 -mt-3">CSV/Excel columns: Code, Loan_Amount, Loan_EMI, Advance_Amount, Advance_Recovery, Other_Deductions, Outstanding_Remarks — download Template for the full worker list</div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['New Loans', (state.loans || []).filter((l) => l.monthKey === monthKey).reduce((s, l) => s + (l.loanAmount || 0), 0), 'text-slate-800'],
          ['Loan EMI Recovered', (state.loans || []).filter((l) => l.monthKey === monthKey).reduce((s, l) => s + (l.loanDeduction || 0), 0), 'text-emerald-600'],
          ['Advance Given', (state.loans || []).filter((l) => l.monthKey === monthKey).reduce((s, l) => s + (l.advanceAmount || 0), 0), 'text-amber-600'],
          ['Outstanding Due', totalOutstanding, 'text-rose-600'],
        ].map(([l, v, c]) => (
          <div key={l as string} className="rounded-xl bg-white border border-slate-200 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase text-slate-500">{l}</div>
            <div className={`text-lg font-bold tabular-nums ${c}`}>₹{fmtINR(v as number)}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search worker…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 max-w-xs" />
        </div>
        <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="all">All Units</option>
          {state.units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title={`Monthly Loan & Recovery — ${monthLabel(monthKey)}`}
          subtitle="Click a row to edit loan / advance / recovery for that worker for this month"
        />
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <Th>Code</Th><Th>Name</Th><Th>Unit</Th>
              <Th right>Loan Amt</Th><Th right>EMI (Loan)</Th><Th right>Advance</Th>
              <Th right>Adv. Recov.</Th><Th right>Other Ded.</Th><Th right>Outstanding</Th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={9}><Empty message="No workers match." /></td></tr>}
            {visible.map((w) => {
              const l = loansFor(w.id, monthKey);
              return (
                <tr key={w.id} className="border-t border-slate-100 hover:bg-slate-50/70 cursor-pointer" onClick={() => setEditWorkerId(w.id)}>
                  <Td className="font-mono text-xs">{w.code}</Td>
                  <Td className="font-medium">{w.name}</Td>
                  <Td><Badge>{unitName(state, w.unitId)}</Badge></Td>
                  <Td right className="tabular-nums">{l?.loanAmount ? '₹' + fmtINR(l.loanAmount) : '—'}</Td>
                  <Td right className="tabular-nums text-emerald-600">{l?.loanDeduction ? '₹' + fmtINR(l.loanDeduction) : '—'}</Td>
                  <Td right className="tabular-nums text-amber-600">{l?.advanceAmount ? '₹' + fmtINR(l.advanceAmount) : '—'}</Td>
                  <Td right className="tabular-nums">{l?.advanceDeduction ? '₹' + fmtINR(l.advanceDeduction) : '—'}</Td>
                  <Td right className="tabular-nums">{l?.otherDeductions ? '₹' + fmtINR(l.otherDeductions) : '—'}</Td>
                  <Td right className="tabular-nums font-semibold text-rose-600">{l?.outstanding ? '₹' + fmtINR(l.outstanding) : '—'}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>

      {editWorkerId && (
        <LoanEditModal
          workerId={editWorkerId}
          monthKey={monthKey}
          onClose={() => setEditWorkerId(null)}
        />
      )}
    </div>
  );
}
function LoanEditModal({ workerId, monthKey, onClose }: { workerId: string; monthKey: string; onClose: () => void }) {
  const { state, set } = useStore();
  const w = state.workers.find((x) => x.id === workerId)!;
  const rec = (state.loans || []).find((l) => l.workerId === workerId && l.monthKey === monthKey);
  const clearRec = () => {
    if (confirm(`Clear all loan/advance records for ${w.code} ${w.name} — ${monthLabel(monthKey)}?`)) {
      set((s) => removeLoan(s, monthKey, workerId));
      onClose();
    }
  };
  const f = {
    loanAmount: rec?.loanAmount ?? 0,
    loanDeduction: rec?.loanDeduction ?? 0,
    advanceAmount: rec?.advanceAmount ?? 0,
    advanceDeduction: rec?.advanceDeduction ?? 0,
    otherDeductions: rec?.otherDeductions ?? 0,
    outstanding: rec?.outstanding ?? 0,
    remarks: rec?.remarks ?? ''
  };
  const setNum = (field: string, val: string) => {
    const n = parseFloat(val) || 0;
    set((s) => upsertLoan(s, monthKey, workerId, { [field]: n }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-16 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Loan &amp; Advance — {w.code} {w.name}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
        </div>
        <div className="p-5">
          <div className="mb-3 text-xs text-slate-500">{monthLabel(monthKey)} · {unitName(state, w.unitId)}</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-semibold text-slate-500">New Loan Amount (₹)</span>
              <Input type="number" min={0} value={f.loanAmount} onChange={(e) => setNum('loanAmount', e.target.value)} className="mt-1 w-full text-right" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-500">EMI / Loan Recovery (₹)</span>
              <Input type="number" min={0} value={f.loanDeduction} onChange={(e) => setNum('loanDeduction', e.target.value)} className="mt-1 w-full text-right" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-500">Advance Given (₹)</span>
              <Input type="number" min={0} value={f.advanceAmount} onChange={(e) => setNum('advanceAmount', e.target.value)} className="mt-1 w-full text-right" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-500">Advance Recovery (₹)</span>
              <Input type="number" min={0} value={f.advanceDeduction} onChange={(e) => setNum('advanceDeduction', e.target.value)} className="mt-1 w-full text-right" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-500">Other Deductions (₹)</span>
              <Input type="number" min={0} value={f.otherDeductions} onChange={(e) => setNum('otherDeductions', e.target.value)} className="mt-1 w-full text-right" /></label>
            <label className="block"><span className="text-xs font-semibold text-slate-500">Outstanding Balance (₹)</span>
              <Input type="number" min={0} value={f.outstanding} onChange={(e) => setNum('outstanding', e.target.value)} className="mt-1 w-full text-right" /></label>
            <label className="block col-span-2"><span className="text-xs font-semibold text-slate-500">Remarks</span>
              <Input value={f.remarks} onChange={(e) => set((s) => upsertLoan(s, monthKey, workerId, { remarks: e.target.value }))} className="mt-1 w-full" placeholder="Optional notes…" /></label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="danger" onClick={clearRec} className="mr-auto">🗑 Clear Entry</Btn>
            <Btn variant="secondary" onClick={onClose}>Close</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}