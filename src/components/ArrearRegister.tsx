import { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, Download, Plus, Trash2, Edit3, IndianRupee, Upload } from 'lucide-react';
import { Employee } from '../types';
import * as XLSX from 'xlsx';
import { downloadArrearTemplate, parseImportFile, normalizeMonth, type ImportResponse } from '../lib/excelImport';

interface ArrearRegisterProps {
  employees: Employee[];
  activeCompany: string;
  /** Bumps on global Refresh — re-pulls register from server. */
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

interface ArrearRow {
  id: string;
  employee_id: string;
  employee_name: string;
  company: string;
  unit: string;
  department: string;
  arrear_month: string;
  amount: number;
  reason: string;
  remarks: string;
  pf_effect: number | null;
  bonus_effect: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  // Future increment foundation (stored, never auto-computed)
  effective_from?: string;
  actual_salary?: number | null;
  revised_salary?: number | null;
  basic_actual?: number | null;
  basic_revised?: number | null;
  hra_actual?: number | null;
  hra_revised?: number | null;
  gross_actual?: number | null;
  gross_revised?: number | null;
  salary_difference?: number | null;
  pf_difference?: number | null;
  bonus_difference?: number | null;
  net_arrear?: number | null;
}

export default function ArrearRegister({ employees, activeCompany, dataVersion = 0 }: ArrearRegisterProps) {
  const [rows, setRows] = useState<ArrearRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fMonth, setFMonth] = useState('');
  const [fEmp, setFEmp] = useState('');
  const [fCompany, setFCompany] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({
    employee_id: '', arrear_month: '', amount: '', reason: '', remarks: '',
    pf_effect: '', bonus_effect: '', status: 'DRAFT',
    effective_from: '', actual_salary: '', revised_salary: ''
  });

  const companies = useMemo(() => Array.from(new Set(employees.map(e => e.company).filter(Boolean))), [employees]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/arrears', { credentials: 'include' });
      const data = await res.json();
      setRows(Array.isArray(data?.rows) ? data.rows : (Array.isArray(data) ? data : []));
      setTotal(Number(data?.total) || 0);
    } catch (e) {
      console.error('Arrear fetch error:', e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchRows(); }, [dataVersion]);

  const filtered = rows.filter(r =>
    (!fMonth || r.arrear_month === fMonth) &&
    (!fEmp || r.employee_id === fEmp) &&
    (!fCompany || fCompany === 'ALL' || r.company === fCompany)
  );
  const filteredTotal = filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const openAdd = () => {
    setEditId(null);
    setForm({ employee_id: '', arrear_month: '', amount: '', reason: '', remarks: '', pf_effect: '', bonus_effect: '', status: 'DRAFT', effective_from: '', actual_salary: '', revised_salary: '' });
    setMsg('');
    setShowForm(true);
  };

  const openEdit = (r: ArrearRow) => {
    setEditId(r.id);
    setForm({
      employee_id: r.employee_id, arrear_month: r.arrear_month, amount: String(r.amount ?? ''),
      reason: r.reason || '', remarks: r.remarks || '',
      pf_effect: r.pf_effect != null ? String(r.pf_effect) : '', bonus_effect: r.bonus_effect != null ? String(r.bonus_effect) : '',
      status: r.status || 'DRAFT',
      effective_from: r.effective_from || '', actual_salary: r.actual_salary != null ? String(r.actual_salary) : '', revised_salary: r.revised_salary != null ? String(r.revised_salary) : ''
    });
    setMsg('');
    setShowForm(true);
  };

  const save = async () => {
    if (!form.employee_id || !form.arrear_month || !form.amount) {
      setMsg('Employee, Month and Amount are required.');
      return;
    }
    const payload: any = {
      employee_id: form.employee_id,
      arrear_month: form.arrear_month,
      amount: Number(form.amount),
      reason: form.reason,
      remarks: form.remarks,
      status: form.status,
      pf_effect: form.pf_effect === '' ? null : Number(form.pf_effect),
      bonus_effect: form.bonus_effect === '' ? null : Number(form.bonus_effect)
    };
    if (editId) payload.id = editId;
    // Future increment foundation fields (optional, stored only)
    if (form.effective_from) payload.effective_from = form.effective_from;
    if (form.actual_salary !== '') payload.actual_salary = Number(form.actual_salary);
    if (form.revised_salary !== '') payload.revised_salary = Number(form.revised_salary);

    try {
      const res = await fetch(editId ? `/api/arrears/${editId}` : '/api/arrears', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success || !data.error)) {
        setMsg(editId ? '✅ Arrear updated.' : '✅ Arrear saved.');
        setShowForm(false);
        fetchRows();
      } else {
        setMsg(`❌ ${data.error || 'Save failed'}`);
      }
    } catch (e: any) {
      setMsg(`❌ ${e.message}`);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this arrear entry?')) return;
    try {
      const res = await fetch(`/api/arrears/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setMsg('✅ Deleted.'); fetchRows(); }
      else setMsg(`❌ ${data.error || 'Delete failed'}`);
    } catch (e: any) { setMsg(`❌ ${e.message}`); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMsg('⏳ Importing…');
    try {
      const raw = await parseImportFile(file);
      const rows = raw.map((r: any) => {
        const m = normalizeMonth(r['ARREAR MONTH'] ?? r['ARREAR_MONTH'] ?? r['MONTH']);
        return {
          'EMPLOYEE CODE': String(r['EMPLOYEE CODE'] ?? r['EMPLOYEE_CODE'] ?? '').trim(),
          'ARREAR MONTH': m || (r['ARREAR MONTH'] ?? r['ARREAR_MONTH'] ?? r['MONTH']),
          'AMOUNT': r['AMOUNT'] ?? r['Amount'] ?? '',
          'REASON': r['REASON'] ?? r['Reason'] ?? '',
          'PF EFFECT': r['PF EFFECT'] ?? r['PF_EFFECT'] ?? '',
          'BONUS EFFECT': r['BONUS EFFECT'] ?? r['BONUS_EFFECT'] ?? '',
          'STATUS': r['STATUS'] ?? r['Status'] ?? 'DRAFT',
          'REMARKS': r['REMARKS'] ?? r['Remarks'] ?? ''
        };
      }).filter(r => r['EMPLOYEE CODE']);
      if (rows.length === 0) { setMsg('❌ Import file me koi valid row nahi mili.'); return; }
      const res = await fetch('/api/arrears/import', {
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
    const headers = ['Employee Code', 'Name', 'Company', 'Unit', 'Department', 'Month', 'Amount', 'Reason', 'PF Effect', 'Bonus Effect', 'Status', 'Remarks'];
    const data = filtered.map(r => [r.employee_id, r.employee_name, r.company, r.unit, r.department, r.arrear_month, r.amount, r.reason || '', r.pf_effect ?? '', r.bonus_effect ?? '', r.status, r.remarks || '']);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Arrear Register');
    XLSX.writeFile(wb, `Arrear_Register_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const monthLabel = (k: string) => MONTHS.find(m => m.key === k)?.label || k;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={24} />
            <div>
              <h2 className="text-lg font-extrabold">Arrear Register — MANUAL ENTRY</h2>
              <p className="text-amber-100 text-xs mt-0.5">
                Arrear is entered month-wise by HR. No automatic calculation.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold rounded-xl transition cursor-pointer">
              <Download size={13} /> Export
            </button>
            <button onClick={() => downloadArrearTemplate(employees)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-xl transition cursor-pointer">
              <Download size={13} /> Excel Template
            </button>
            <label className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 text-[11px] font-bold rounded-xl transition cursor-pointer">
              <Upload size={13} /> Import Excel
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
            </label>
            <button onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-white text-orange-600 text-[11px] font-extrabold rounded-xl shadow transition cursor-pointer">
              <Plus size={14} /> Add Arrear
            </button>
            <button onClick={fetchRows} className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold rounded-xl transition cursor-pointer">↻</button>
          </div>
        </div>
      </div>

      {/* Message */}
      {msg && (
        <div className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${msg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {msg}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Month</label>
          <select value={fMonth} onChange={e => setFMonth(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 cursor-pointer">
            <option value="">All Months</option>
            {MONTHS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
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
          <span className="text-[10px] font-bold text-slate-500 uppercase">Total Arrear (filtered)</span>
          <p className="text-xl font-extrabold text-orange-700">₹{filteredTotal.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">#</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Code</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Name</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Company</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Month</th>
                <th className="px-3 py-2.5 text-right font-extrabold text-slate-700">Amount ₹</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Reason</th>
                <th className="px-3 py-2.5 text-right font-extrabold text-slate-700">PF Effect</th>
                <th className="px-3 py-2.5 text-right font-extrabold text-slate-700">Bonus Effect</th>
                <th className="px-3 py-2.5 text-center font-extrabold text-slate-700">Status</th>
                <th className="px-3 py-2.5 text-center font-extrabold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400">No arrear entries yet. Use “Add Arrear” to enter month-wise arrears manually.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-amber-50/40">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-700">{r.emp_code || r.employee_id}</td>
                  <td className="px-3 py-2 font-semibold text-slate-900">{r.employee_name}</td>
                  <td className="px-3 py-2 text-slate-600">{r.company}</td>
                  <td className="px-3 py-2 text-slate-700 font-semibold">{monthLabel(r.arrear_month)}</td>
                  <td className="px-3 py-2 text-right font-mono font-bold text-orange-700">₹{(Number(r.amount) || 0).toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-slate-600">{r.reason || '—'}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-600">{r.pf_effect != null ? `₹${Number(r.pf_effect).toLocaleString('en-IN')}` : '—'}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-600">{r.bonus_effect != null ? `₹${Number(r.bonus_effect).toLocaleString('en-IN')}` : '—'}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : r.status === 'PAID' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => openEdit(r)} className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer" title="Edit"><Edit3 size={14} /></button>
                    <button onClick={() => remove(r.id)} className="p-1 text-slate-400 hover:text-red-600 cursor-pointer" title="Delete"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-slate-100 sticky bottom-0">
                <tr className="font-extrabold">
                  <td colSpan={5} className="px-3 py-2.5 text-right text-slate-700">TOTAL (filtered rows)</td>
                  <td className="px-3 py-2.5 text-right font-mono text-orange-700">₹{filteredTotal.toLocaleString('en-IN')}</td>
                  <td colSpan={5}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Future foundation note */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-extrabold text-slate-700 mb-1.5">🔮 Future Increment Foundation (stored — NOT auto-calculated)</h4>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          Each entry can store reference fields for a future increment-arrear workflow: <strong>Effective From, Actual Salary, Revised Salary, Basic/HRA actual & revised, Gross actual & revised, Salary Difference, PF Difference, Bonus Difference, Net Arrear</strong>.
          Future model: <em>Salary Difference + PF effect + Bonus effect = Final Arrear impact</em>. These are structure-only today — <strong>nothing is calculated automatically</strong>.
        </p>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-sm font-extrabold">{editId ? '✏️ Edit Arrear (MANUAL)' : '➕ Add Arrear (MANUAL)'}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/80 hover:text-white text-lg leading-none cursor-pointer">×</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Employee *</label>
                  <select disabled={!!editId} value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 disabled:opacity-60 cursor-pointer">
                    <option value="">— Select Employee —</option>
                    {employees.filter(e => e.status === 'ACTIVE').map(e => <option key={e.id} value={e.id}>{e.emp_code || e.id} — {e.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Arrear Month *</label>
                  <select value={form.arrear_month} onChange={e => setForm({ ...form, arrear_month: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 cursor-pointer">
                    <option value="">— Select Month —</option>
                    {MONTHS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Arrear Amount ₹ *</label>
                  <input type="number" min="0" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50" placeholder="e.g. 5000" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Reason</label>
                  <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50" placeholder="e.g. Salary adjustment" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 cursor-pointer">
                    {['DRAFT', 'APPROVED', 'PAID'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">PF Effect (₹, optional)</label>
                  <input type="number" value={form.pf_effect} onChange={e => setForm({ ...form, pf_effect: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50" placeholder="PF impact reference" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Bonus Effect (₹, optional)</label>
                  <input type="number" value={form.bonus_effect} onChange={e => setForm({ ...form, bonus_effect: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50" placeholder="Bonus impact reference" />
                </div>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-3">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">🔮 Future Increment Foundation — optional reference fields (NOT auto-calculated)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Effective From</label>
                    <input type="date" value={form.effective_from} onChange={e => setForm({ ...form, effective_from: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Actual Salary</label>
                    <input type="number" value={form.actual_salary} onChange={e => setForm({ ...form, actual_salary: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Revised Salary</label>
                    <input type="number" value={form.revised_salary} onChange={e => setForm({ ...form, revised_salary: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50" />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Remarks</label>
                <textarea value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50" />
              </div>
              {msg && !showForm ? null : null}
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">Cancel</button>
                <button onClick={save} className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow cursor-pointer">
                  {editId ? 'Update Arrear' : 'Save Arrear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keep import used */}
      <IndianRupee className="hidden" />
    </div>
  );
}
