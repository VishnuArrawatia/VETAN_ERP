import { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Download, Plus, Trash2, Upload, Scale } from 'lucide-react';
import { Employee } from '../types';
import * as XLSX from 'xlsx';

interface GratuityRegisterProps {
  employees: Employee[];
  activeCompany: string;
  /** Bumps on global Refresh — re-pulls register + reconciliation from server. */
  dataVersion?: number;
}

const MONTHS = (() => {
  const out: { key: string; label: string }[] = [];
  for (let y = 2025; y <= 2027; y++) {
    for (let m = 1; m <= 12; m++) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short' }) + ` ${y}`;
      out.push({ key, label });
    }
  }
  return out;
})();

interface GratRow {
  id: string;
  employee_id: string;
  emp_code: string;
  employee_name: string;
  company: string;
  unit: string;
  department: string;
  month: string;
  base_salary: number;
  accrual_rate: number | null;
  amount: number;
  source: 'MANUAL' | 'SALARY_AUTO';
  status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

interface ReconRow {
  employee_id: string;
  employee_name: string;
  company: string;
  joining_date: string | null;
  exit_date: string | null;
  months_accrued: number;
  cumulative_provision: number;
  vested_years: number;
  vested: boolean;
  ff_status: string | null;
  gratuity_paid: number;
  balance_liability: number;
  variance: number;
  forfeited: boolean;
}

export default function GratuityRegister({ employees, activeCompany, dataVersion = 0 }: GratuityRegisterProps) {
  const [tab, setTab] = useState<'register' | 'recon'>('register');
  const [rows, setRows] = useState<GratRow[]>([]);
  const [totals, setTotals] = useState({ overall: 0, manual_total: 0, auto_total: 0 });
  const [recon, setRecon] = useState<{ rows: ReconRow[]; totals: any; vest_years: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fMonth, setFMonth] = useState('');
  const [fEmp, setFEmp] = useState('');
  const [fCompany, setFCompany] = useState('');
  const [fSource, setFSource] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [genFrom, setGenFrom] = useState('2026-04');
  const [genTo, setGenTo] = useState(MONTHS.find(m => m.key === new Date().toISOString().slice(0, 7))?.key || new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState({ employee_id: '', month: '', base_salary: '', amount: '', remarks: '' });

  const companies = useMemo(() => Array.from(new Set(employees.map(e => e.company).filter(Boolean))), [employees]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gratuity-provisions', { credentials: 'include' });
      const data = await res.json();
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      if (data?.totals) setTotals({ overall: Number(data.totals.overall) || 0, manual_total: Number(data.totals.manual_total) || 0, auto_total: Number(data.totals.auto_total) || 0 });
    } catch (e) { console.error('Gratuity fetch error:', e); }
    finally { setLoading(false); }
  };
  const fetchRecon = async () => {
    try {
      const res = await fetch('/api/gratuity-reconciliation', { credentials: 'include' });
      if (res.ok) setRecon(await res.json());
    } catch (e) { console.error('Gratuity recon fetch error:', e); }
  };
  useEffect(() => { fetchRows(); fetchRecon(); }, [dataVersion]);

  const filtered = rows.filter(r =>
    (!fMonth || r.month === fMonth) &&
    (!fEmp || r.employee_id === fEmp) &&
    (!fCompany || fCompany === 'ALL' || r.company === fCompany) &&
    (!fSource || r.source === fSource)
  );
  const filteredTotal = filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const openAdd = () => {
    setForm({ employee_id: '', month: '', base_salary: '', amount: '', remarks: '' });
    setMsg('');
    setShowForm(true);
  };

  const save = async () => {
    if (!form.employee_id || !form.month) { setMsg('Employee aur Month required hain.'); return; }
    try {
      const res = await fetch('/api/gratuity-provisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          employee_id: form.employee_id,
          month: form.month,
          base_salary: form.base_salary === '' ? undefined : Number(form.base_salary),
          amount: form.amount === '' ? undefined : Number(form.amount),
          remarks: form.remarks
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) { setMsg(`✅ Provision saved (₹${data.amount}).`); setShowForm(false); fetchRows(); }
      else setMsg(`❌ ${data.error || 'Save failed'}`);
    } catch (e: any) { setMsg(`❌ ${e.message}`); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this gratuity provision row?')) return;
    try {
      const res = await fetch(`/api/gratuity-provisions/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setMsg('✅ Deleted.'); fetchRows(); fetchRecon(); }
      else setMsg(`❌ ${data.error || 'Delete failed'}`);
    } catch (e: any) { setMsg(`❌ ${e.message}`); }
  };

  const generate = async () => {
    if (!confirm(`Auto-generate provisions ${genFrom} → ${genTo}? (Existing rows skip honge — duplicates nahi banenge)`)) return;
    setMsg('⏳ Generating…');
    try {
      const res = await fetch('/api/gratuity-provisions/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ from_month: genFrom, to_month: genTo })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg(`✅ Generated: ${data.created} created, ${data.updated} updated (${data.skippedManual} manual skipped).`);
        fetchRows(); fetchRecon();
      } else setMsg(`❌ ${data.error || 'Generation failed'}`);
    } catch (e: any) { setMsg(`❌ ${e.message}`); }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['GRATUITY PROVISION IMPORT TEMPLATE', null, null, null, null],
      ['Columns: EMPLOYEE CODE | MONTH | BASIC (optional) | GRATUITY AMOUNT (optional) | REMARKS', null, null, null, null],
      ['BASIC blank ho to employee ka us-month ka effective Basic use hoga. AMOUNT blank ho to Basic × 15/26 ÷ 12.', null, null, null, null],
      [],
      ['EMPLOYEE CODE', 'MONTH', 'BASIC', 'GRATUITY AMOUNT', 'REMARKS'],
      ['SV1ST0001', 'Oct-25', 20000, '', 'historical provision'],
      ['SV1ST0002', '2025-11', '', '', '']
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gratuity Import');
    XLSX.writeFile(wb, 'Gratuity_Provision_Template.xlsx');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMsg('⏳ Importing…');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
      const rowsIn = raw
        .map((r: any) => ({
          'EMPLOYEE CODE': String(r['EMPLOYEE CODE'] ?? r['EMPLOYEE_CODE'] ?? '').trim(),
          'MONTH': r['MONTH'] ?? r['Month'] ?? '',
          'BASIC': r['BASIC'] ?? r['Basic'] ?? '',
          'GRATUITY AMOUNT': r['GRATUITY AMOUNT'] ?? r['GRATUITY_AMOUNT'] ?? '',
          'REMARKS': r['REMARKS'] ?? r['Remarks'] ?? ''
        }))
        .filter(r => r['EMPLOYEE CODE']);
      if (rowsIn.length === 0) { setMsg('❌ Import file me koi valid row nahi mili.'); return; }
      const res = await fetch('/api/gratuity-provisions/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ rows: rowsIn })
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ Import: ${data.imported} imported, ${data.skipped} skipped, ${data.errors} errors.${data.errors ? ' Details: ' + (data.results || []).filter((x: any) => x.status === 'ERROR').map((x: any) => `Row ${x.row} ${x.employee}: ${x.message}`).join(' | ') : ''}`);
        fetchRows(); fetchRecon();
      } else setMsg(`❌ ${data.error || 'Import failed'}`);
    } catch (err: any) { setMsg(`❌ Import error: ${err.message}`); }
  };

  const exportXlsx = () => {
    const headers = ['Employee Code', 'Name', 'Company', 'Unit', 'Department', 'Month', 'Basic', 'Accrual Rate %', 'Amount', 'Source', 'Status', 'Remarks'];
    const data = filtered.map(r => [r.emp_code || r.employee_id, r.employee_name, r.company, r.unit, r.department, r.month, r.base_salary, r.accrual_rate != null ? (r.accrual_rate * 100).toFixed(2) : '', r.amount, r.source, r.status, r.remarks || '']);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gratuity Register');
    XLSX.writeFile(wb, `Gratuity_Register_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportRecon = () => {
    if (!recon) return;
    const headers = ['Employee Code', 'Name', 'Company', 'Joining', 'Exit', 'Months Accrued', 'Cumulative Provision', 'Vested Years', 'Vested', 'F&F Status', 'Gratuity Paid', 'Balance Liability', 'Variance'];
    const data = recon.rows.map(r => [r.employee_id, r.employee_name, r.company, r.joining_date || '', r.exit_date || '', r.months_accrued, r.cumulative_provision, r.vested_years, r.vested ? 'YES' : 'NO', r.ff_status || '', r.gratuity_paid, r.balance_liability, r.variance]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gratuity Reconciliation');
    XLSX.writeFile(wb, `Gratuity_Reconciliation_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Scale className="text-amber-600" size={24} /> Gratuity Provision Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous liability accrual — <b>(Basic × 15/26) ÷ 12</b> per month. Vested: {recon?.vest_years ?? 5}+ years. Payment ONLY via Full &amp; Final — no direct payout here.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('register')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === 'register' ? 'bg-amber-600 text-white' : 'bg-white border text-slate-600'}`}>Provision Register</button>
          <button onClick={() => setTab('recon')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${tab === 'recon' ? 'bg-amber-600 text-white' : 'bg-white border text-slate-600'}`}>F&amp;F Reconciliation</button>
        </div>
      </div>

      {msg && <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-4 py-2 text-sm">{msg}</div>}

      {tab === 'register' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Provision Liability</p><p className="text-2xl font-black font-mono text-fuchsia-600">₹{totals.overall.toLocaleString('en-IN')}</p></div>
            <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Manual (Imported)</p><p className="text-xl font-black font-mono text-blue-600">₹{totals.manual_total.toLocaleString('en-IN')}</p></div>
            <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Auto (Salary Sheet)</p><p className="text-xl font-black font-mono text-emerald-600">₹{totals.auto_total.toLocaleString('en-IN')}</p></div>
            <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Rows</p><p className="text-xl font-black font-mono text-slate-700">{rows.length}</p></div>
          </div>

          <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex flex-wrap gap-2 items-end">
              <button onClick={openAdd} className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-xs font-bold"><Plus size={14} /> Add Manual Provision</button>
              <button onClick={downloadTemplate} className="flex items-center gap-1 bg-slate-100 border px-3 py-2 rounded-lg text-xs font-bold text-slate-700"><FileSpreadsheet size={14} /> Template</button>
              <label className="flex items-center gap-1 bg-slate-100 border px-3 py-2 rounded-lg text-xs font-bold text-slate-700 cursor-pointer"><Upload size={14} /> Import Excel
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImport} />
              </label>
              <button onClick={exportXlsx} className="flex items-center gap-1 bg-slate-100 border px-3 py-2 rounded-lg text-xs font-bold text-slate-700"><Download size={14} /> Export</button>
              <div className="flex items-center gap-1 ml-auto">
                <select value={genFrom} onChange={e => setGenFrom(e.target.value)} className="border rounded-lg px-2 py-2 text-xs">
                  {MONTHS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
                <span className="text-xs text-slate-400 font-bold">→</span>
                <select value={genTo} onChange={e => setGenTo(e.target.value)} className="border rounded-lg px-2 py-2 text-xs">
                  {MONTHS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                </select>
                <button onClick={generate} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-bold">⚙️ Generate Auto</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={fMonth} onChange={e => setFMonth(e.target.value)} className="border rounded-lg px-2 py-1.5 text-xs"><option value="">All Months</option>{MONTHS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
              <select value={fEmp} onChange={e => setFEmp(e.target.value)} className="border rounded-lg px-2 py-1.5 text-xs"><option value="">All Employees</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}</select>
              <select value={fCompany} onChange={e => setFCompany(e.target.value)} className="border rounded-lg px-2 py-1.5 text-xs"><option value="">All Companies</option>{companies.map(c => <option key={c} value={c}>{c}</option>)}</select>
              <select value={fSource} onChange={e => setFSource(e.target.value)} className="border rounded-lg px-2 py-1.5 text-xs"><option value="">All Sources</option><option value="MANUAL">MANUAL</option><option value="SALARY_AUTO">SALARY AUTO</option></select>
              <span className="ml-auto text-xs font-bold text-slate-500 self-center">Filtered total: ₹{filteredTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 text-left">Employee</th><th className="p-3 text-left">Company</th><th className="p-3 text-left">Month</th>
                  <th className="p-3 text-right">Basic</th><th className="p-3 text-right">Rate %</th><th className="p-3 text-right">Provision</th>
                  <th className="p-3 text-center">Source</th><th className="p-3 text-center">Status</th><th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={9} className="p-6 text-center text-slate-400">Loading…</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-slate-400">No gratuity provisions yet — Generate Auto ya Import Excel se shuru karein.</td></tr>}
                {filtered.map(r => (
                  <tr key={r.id} className="border-t hover:bg-amber-50/40">
                    <td className="p-3"><b>{r.employee_name}</b><br /><span className="text-slate-400">{r.emp_code || r.employee_id}</span></td>
                    <td className="p-3">{r.company}</td>
                    <td className="p-3 font-mono">{r.month}</td>
                    <td className="p-3 text-right font-mono">₹{r.base_salary.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono">{r.accrual_rate != null ? (r.accrual_rate * 100).toFixed(2) : '4.81'}</td>
                    <td className="p-3 text-right font-mono font-black text-fuchsia-700">₹{r.amount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.source === 'MANUAL' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.source === 'MANUAL' ? 'MANUAL' : 'SALARY AUTO'}</span></td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.status === 'SETTLED' ? 'bg-slate-200 text-slate-700' : r.status === 'FORFEITED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span></td>
                    <td className="p-3 text-right"><button onClick={() => remove(r.id)} className="text-rose-500 hover:text-rose-700"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'recon' && recon && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total Provision</p><p className="text-xl font-black font-mono text-fuchsia-600">₹{recon.totals.total_provision.toLocaleString('en-IN')}</p></div>
            <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Paid via F&amp;F</p><p className="text-xl font-black font-mono text-emerald-600">₹{recon.totals.total_paid.toLocaleString('en-IN')}</p></div>
            <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Balance Liability</p><p className="text-xl font-black font-mono text-amber-600">₹{recon.totals.total_balance.toLocaleString('en-IN')}</p></div>
            <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Vested Employees ({recon.vest_years}+ yrs)</p><p className="text-xl font-black font-mono text-blue-600">{recon.totals.vested_employees}</p></div>
            <div className="bg-white border rounded-xl p-4 shadow-sm"><p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Forfeited (non-vested exit)</p><p className="text-xl font-black font-mono text-rose-600">{recon.totals.forfeited_cases}</p></div>
          </div>
          <div className="flex justify-end">
            <button onClick={exportRecon} className="flex items-center gap-1 bg-slate-100 border px-3 py-2 rounded-lg text-xs font-bold text-slate-700"><Download size={14} /> Export Reconciliation</button>
          </div>
          <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3 text-left">Employee</th><th className="p-3 text-left">Service</th><th className="p-3 text-right">Months</th>
                  <th className="p-3 text-right">Cumulative Provision</th><th className="p-3 text-center">Vested</th><th className="p-3 text-center">F&amp;F</th>
                  <th className="p-3 text-right">Paid</th><th className="p-3 text-right">Balance</th><th className="p-3 text-right">Variance</th>
                </tr>
              </thead>
              <tbody>
                {recon.rows.length === 0 && <tr><td colSpan={9} className="p-6 text-center text-slate-400">No provisions or settlements yet.</td></tr>}
                {recon.rows.map(r => (
                  <tr key={r.employee_id} className="border-t hover:bg-amber-50/40">
                    <td className="p-3"><b>{r.employee_name}</b><br /><span className="text-slate-400">{r.employee_id}</span></td>
                    <td className="p-3">{r.vested_years} yrs{r.exit_date ? ` (exited ${r.exit_date.slice(0, 10)})` : ''}</td>
                    <td className="p-3 text-right font-mono">{r.months_accrued}</td>
                    <td className="p-3 text-right font-mono">₹{r.cumulative_provision.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.vested ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{r.vested ? 'YES' : 'NO'}</span></td>
                    <td className="p-3 text-center text-[10px]">{r.ff_status || '—'}</td>
                    <td className="p-3 text-right font-mono">₹{r.gratuity_paid.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-mono font-bold text-amber-700">₹{r.balance_liability.toLocaleString('en-IN')}</td>
                    <td className={`p-3 text-right font-mono ${Math.abs(r.variance) > 500 ? 'text-rose-600 font-bold' : ''}`}>{r.variance < 0 ? `−₹${Math.abs(r.variance).toLocaleString('en-IN')}` : `₹${r.variance.toLocaleString('en-IN')}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-3">
            <h3 className="font-black text-lg">Add Manual Gratuity Provision</h3>
            <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select Employee…</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
            </select>
            <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select Month…</option>
              {MONTHS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <input type="number" placeholder="Basic (optional — blank = effective Basic)" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Amount (optional — blank = Basic × 4.81%)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <input type="text" placeholder="Remarks" value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border text-sm font-bold">Cancel</button>
              <button onClick={save} className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-bold">Save Provision</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
