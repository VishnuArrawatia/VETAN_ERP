import { useState, useEffect } from 'react';
import { Gift, Download, Plus, Zap, Users, IndianRupee, Calendar, Upload } from 'lucide-react';
import { Employee } from '../types';
import * as XLSX from 'xlsx';
import { downloadBonusTemplate, parseImportFile, normalizeMonth, type ImportResponse } from '../lib/excelImport';

interface BonusRegisterProps {
  activeMonth: string;
  activeCompany: string;
  employees: Employee[];
}

const MANUAL_MONTHS = ['2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03'];
const AUTO_MONTHS = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
const PERIOD_MONTHS = [...MANUAL_MONTHS, ...AUTO_MONTHS];
const ALL_MONTH_OPTIONS = [...MANUAL_MONTHS, ...AUTO_MONTHS, '2026-10', '2026-11', '2026-12', '2027-01', '2027-02', '2027-03'];
const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleString('en-IN', { month: 'short' }) + ` ${y}`;
};

interface ProvisionRow {
  id: string;
  employee_id: string;
  employee_name: string;
  company: string;
  month: string;
  base_salary: number;
  bonus_rate: number;
  bonus_amount: number;
  source: string;
  status: string;
  remarks?: string;
}

export default function BonusRegister({ activeCompany, employees }: BonusRegisterProps) {
  const [rows, setRows] = useState<ProvisionRow[]>([]);
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [payMonth, setPayMonth] = useState('');
  const [fMonth, setFMonth] = useState('');
  const [fEmp, setFEmp] = useState('');
  const [fCompany, setFCompany] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ employee_id: '', month: '', base_salary: '', bonus_amount: '', remarks: '' });

  const companies = Array.from(new Set(employees.map(e => e.company).filter(Boolean)));

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bonus-provisions', { credentials: 'include' });
      const data = await res.json();
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setTotals(data?.totals || null);
    } catch (e) {
      console.error('Bonus provision fetch error:', e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchRows(); }, []);

  const filtered = rows.filter(r =>
    (!fMonth || r.month === fMonth) &&
    (!fEmp || r.employee_id === fEmp) &&
    (!fCompany || fCompany === 'ALL' || r.company === fCompany)
  );
  const filteredTotal = filtered.reduce((s, r) => s + (Number(r.bonus_amount) || 0), 0);

  const save = async () => {
    if (!form.employee_id || !form.month) { setMsg('❌ Employee and Month are required.'); return; }
    try {
      const res = await fetch('/api/bonus-provisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          employee_id: form.employee_id,
          month: form.month,
          base_salary: form.base_salary === '' ? undefined : Number(form.base_salary),
          bonus_amount: form.bonus_amount === '' ? undefined : Number(form.bonus_amount),
          remarks: form.remarks
        })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMsg(data.replacedAuto ? `✅ Manual provision saved (replaced an auto row for ${form.month}).` : '✅ Manual provision saved.');
        setShowForm(false);
        setForm({ employee_id: '', month: '', base_salary: ``, bonus_amount: '', remarks: '' });
        fetchRows();
      } else {
        setMsg(`❌ ${data.error || 'Save failed'}`);
      }
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    }
  };

  const generate = async () => {
    if (!confirm('Generate automatic Bonus Provisions from the monthly Salary Sheets (Apr-26 onward)?\n\n• MANUAL records are never touched\n• Re-running never duplicates')) return;
    try {
      const res = await fetch('/api/bonus-provisions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setMsg(`✅ Generation complete — ${data.created} created, ${data.updated} refreshed, ${data.skippedManual} manual rows protected.`);
        fetchRows();
      } else setMsg(`❌ ${data.error || 'Generation failed'}`);
    } catch (e: any) { setMsg(`❌ ${e.message}`); }
  };

  const handlePayBonus = async () => {
    if (!payMonth) { alert('Please select payout month (e.g. October for Diwali)'); return; }
    if (!confirm(`Pay accumulated bonus for ALL employees in ${payMonth}?\nThis will mark all ACCUMULATED bonuses as PAID.`)) return;
    try {
      const res = await fetch('/api/bonus-register/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ month: payMonth, company: 'ALL' })
      });
      const data = await res.json();
      if (data.success) { alert(`Bonus paid for ${data.updated || 0} provisions!`); fetchRows(); }
      else alert('Error: ' + (data.error || 'Unknown'));
    } catch (e: any) { alert('Error: ' + e.message); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMsg('⏳ Importing…');
    try {
      const raw = await parseImportFile(file);
      const rows = raw.map((r: any) => {
        const m = normalizeMonth(r['MONTH'] ?? r['Month']);
        return {
          'EMPLOYEE CODE': String(r['EMPLOYEE CODE'] ?? r['EMPLOYEE_CODE'] ?? '').trim(),
          'MONTH': m || (r['MONTH'] ?? r['Month']),
          'BASIC': r['BASIC'] ?? r['Basic'] ?? '',
          'BONUS AMOUNT': r['BONUS AMOUNT'] ?? r['BONUS_AMOUNT'] ?? '',
          'REMARKS': r['REMARKS'] ?? r['Remarks'] ?? ''
        };
      }).filter(r => r['EMPLOYEE CODE']);
      if (rows.length === 0) { setMsg('❌ Import file me koi valid row nahi mili.'); return; }
      const res = await fetch('/api/bonus-provisions/import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ rows })
      });
      const data: ImportResponse = await res.json();
      if (data.success) {
        setMsg(`✅ Import: ${data.imported} imported, ${data.skipped} skipped, ${data.errors} errors.${data.errors ? ' Details: ' + (data.results || []).filter((x: any) => x.status === 'ERROR').map((x: any) => `Row ${x.row} ${x.employee}: ${x.message}`).join(' | ') : ''}`);
        fetchRows();
      } else setMsg(`❌ ${data.error || 'Import failed'}`);
    } catch (err: any) { setMsg(`❌ Import error: ${err.message}`); }
  };

  const exportCsv = () => {
    const headers = ['Employee Code', 'Name', 'Company', 'Month', 'Basic', 'Bonus %', 'Provision', 'Source', 'Status', 'Remarks'];
    const data = filtered.map(r => [
      r.employee_id, r.employee_name, r.company, monthLabel(r.month),
      r.base_salary, r.bonus_rate, r.bonus_amount, r.source === 'MANUAL' ? 'MANUAL' : 'SALARY AUTO', r.status, r.remarks || ''
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bonus Provision');
    XLSX.writeFile(wb, `Bonus_Provision_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const statusOf = (r: ProvisionRow) => (r.status === 'PAID' ? '✅ PAID' : '⏳ ACCUMULATED');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Gift size={24} /></div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">🎁 Bonus Provision Register</h2>
              <p className="text-xs text-gray-500">
                BONUS PERIOD: <strong>OCT-25 TO SEP-26</strong> | Formula: <strong>Basic × 8.33%</strong> |
                Manual months: <strong>Oct-25 → Mar-26</strong> | Auto: <strong>Apr-26 onward</strong>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl transition cursor-pointer">
              <Download size={13} /> Export
            </button>
            <button onClick={() => { setMsg(''); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-extrabold rounded-xl transition cursor-pointer">
              <Plus size={14} /> Add Manual Provision
            </button>
            <button onClick={generate} className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded-xl transition cursor-pointer">
              <Zap size={13} /> Generate/Refresh Automatic
            </button>
            <button onClick={() => downloadBonusTemplate(employees)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-xl transition cursor-pointer">
              <Download size={13} /> Excel Template
            </button>
            <label className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 text-[11px] font-bold rounded-xl transition cursor-pointer">
              <Upload size={13} /> Import Excel
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {msg}
        </div>
      )}

      {/* Summary cards — full-period totals from server */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Users size={16} className="text-blue-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Provision</span></div>
          <p className="text-xl font-extrabold text-slate-900">₹{((totals?.overall ?? 0) as number).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400">{rows.length} rows, Oct-25 → Sep-26</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><IndianRupee size={16} className="text-amber-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Manual (Oct-25→Mar-26)</span></div>
          <p className="text-xl font-extrabold text-amber-700">₹{(totals?.manual_total ?? 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400">HR-entered historical provisions</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Zap size={16} className="text-emerald-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Auto (Apr-26→Sep-26)</span></div>
          <p className="text-xl font-extrabold text-emerald-700">₹{(totals?.auto_total ?? 0).toLocaleString('en-IN')}</p>
          <p className="text-10 text-slate-400">From monthly Salary Sheets</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Calendar size={16} className="text-purple-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Oct-25 → Mar-26</span></div>
          <p className="text-xl font-extrabold text-purple-700">₹{(totals?.oct25_mar26_total ?? 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400">First half of the period</p>
        </div>
        <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Calendar size={16} className="text-rose-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Apr-26 → Sep-26</span></div>
          <p className="text-xl font-extrabold text-rose-700">₹{(totals?.apr26_sep26_total ?? 0).toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400">Second half of the period</p>
        </div>
      </div>

      {/* Diwali payout (existing flow, now counts provision rows) */}
      <div className="bg-gradient-to-r from-orange-100 to-red-50 border border-orange-300 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-orange-800">🎇 Diwali Bonus Payout</h3>
            <p className="text-[11px] text-orange-600">Mark all ACCUMULATED provisions as PAID. Typically done in <strong>October 2026</strong>.</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={payMonth} onChange={e => setPayMonth(e.target.value)} className="px-3 py-2 border border-orange-300 rounded-lg text-xs font-bold">
              <option value="">Select Payout Month</option>
              {ALL_MONTH_OPTIONS.map(k => <option key={k} value={k}>{monthLabel(k)}</option>)}
            </select>
            <button onClick={handlePayBonus} className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow transition cursor-pointer">🎁 Pay Bonus</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Month</label>
          <select value={fMonth} onChange={e => setFMonth(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 cursor-pointer">
            <option value="">All Months</option>
            {PERIOD_MONTHS.map(k => <option key={k} value={k}>{monthLabel(k)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Employee</label>
          <select value={fEmp} onChange={e => setFEmp(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 cursor-pointer max-w-[220px]">
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.emp_code || e.id} — {e.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Company</label>
          <select value={fCompany} onChange={e => setFCompany(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 cursor-pointer">
            <option value="">All Companies</option>
            {companies.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="ml-auto text-right">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Filtered total</span>
          <p className="text-xl font-extrabold text-orange-700">₹{filteredTotal.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Provision table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">#</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Code</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Name</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Company</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Month</th>
                <th className="px-3 py-2.5 text-right font-extrabold text-slate-700">Basic ₹</th>
                <th className="px-3 py-2.5 text-center font-extrabold text-slate-700">Bonus %</th>
                <th className="px-3 py-2.5 text-right font-extrabold text-slate-700">Provision ₹</th>
                <th className="px-3 py-2.5 text-center font-extrabold text-slate-700">Source</th>
                <th className="px-3 py-2.5 text-center font-extrabold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                  No provisions yet. Add manual rows for Oct-25 → Mar-26, or run “Generate/Refresh Automatic” for Apr-26 onward.
                </td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-orange-50/30">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-700">{r.employee_id}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{r.employee_name}</td>
                  <td className="px-3 py-2 text-slate-600">{r.company}</td>
                  <td className="px-3 py-2 text-slate-700 font-semibold">{monthLabel(r.month)}</td>
                  <td className="px-3 py-2 text-right font-mono">₹{(Number(r.base_salary) || 0).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-center font-mono text-orange-600 font-bold">{r.bonus_rate}%</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">₹{(Number(r.bonus_amount) || 0).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${r.source === 'MANUAL' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`}>
                      {r.source === 'MANUAL' ? 'MANUAL' : 'SALARY AUTO'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${r.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {statusOf(r)}
                    </span>
                    <button onClick={async () => {
                      if (!confirm('Delete this manual provision?')) return;
                      const res = await fetch(`/api/bonus-provisions/${r.id}`, { method: 'DELETE', credentials: 'include' });
                      const d = await res.json().catch(() => ({}));
                      if (res.ok) { setMsg('✅ Deleted.'); fetchRows(); } else setMsg(`❌ ${d.error || 'Delete failed'}`);
                    }} className="ml-1.5 text-slate-300 hover:text-red-600 cursor-pointer text-[10px]" title="Delete manual provision">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-slate-100 sticky bottom-0">
                <tr className="font-extrabold">
                  <td colSpan={7} className="px-3 py-2.5 text-right text-slate-700">TOTAL (filtered)</td>
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-700">₹{filteredTotal.toLocaleString('en-IN')}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-extrabold text-slate-700 mb-2">📋 How Bonus Works (Payment of Bonus Act)</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px] text-slate-600">
          <div className="flex items-start gap-2"><span className="text-lg">1️⃣</span>
            <div><strong>Manual Period:</strong> Oct-25 → Mar-26 provisions are entered by HR (Add Manual Provision). Auto-generation never overwrites them.</div></div>
          <div className="flex items-start gap-2"><span className="text-lg">2️⃣</span>
            <div><strong>Auto Period:</strong> Apr-26 onward = that month's Basic × 8.33%, from each month's effective Salary Sheet. Different Basic in different months → different provision.</div></div>
          <div className="flex items-start gap-2"><span className="text-lg">3️⃣</span>
            <div><strong>Idempotent:</strong> Re-running generation refreshes auto rows in place — never duplicates, never touches MANUAL rows.</div></div>
          <div className="flex items-start gap-2"><span className="text-lg">4️⃣</span>
            <div><strong>Diwali Payout:</strong> All accumulated provisions are marked PAID together (typically Oct-26).</div></div>
        </div>
      </div>

      {/* Add Manual Provision Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-sm font-extrabold">➕ Manual Bonus Provision</h3>
              <button onClick={() => setShowForm(false)} className="text-white/80 hover:text-white text-lg leading-none cursor-pointer">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Employee *</label>
                  <select value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 cursor-pointer">
                    <option value="">— Select Employee —</option>
                    {employees.filter(e => e.status === 'ACTIVE').map(e => <option key={e.id} value={e.id}>{e.emp_code || e.id} — {e.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Month * (Oct-25 → Mar-26)</label>
                  <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 cursor-pointer">
                    <option value="">— Select Month —</option>
                    {[...MANUAL_MONTHS, ...AUTO_MONTHS].map(k => <option key={k} value={k}>{monthLabel(k)}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Basic ₹ (blank = employee's current Basic)</label>
                  <input type="number" min="0" value={form.base_salary} onChange={e => setForm({ ...form, base_salary: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50" placeholder="e.g. 20000" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Provision ₹ (blank = Basic × 8.33%)</label>
                  <input type="number" min="0" value={form.bonus_amount} onChange={e => setForm({ ...form, bonus_amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50" placeholder="auto = Basic × 8.33%" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Remarks / Source note</label>
                <input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50" placeholder="e.g. imported from old register" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                <button onClick={save} className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow cursor-pointer">Save Provision</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
