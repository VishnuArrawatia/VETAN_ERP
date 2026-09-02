import React, { useEffect, useMemo, useState } from 'react';
import {
  Smartphone,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Trash2,
  X
} from 'lucide-react';
import { Employee, EmployeeAsset } from '../types';
import {
  PREPAID_SIM_TYPE,
  computePrepaidStatus,
  hydratePrepaidAsset,
  isPrepaidSim,
  prepaidStatusLabel
} from '../lib/prepaidStatus';

interface PrepaidSimRegisterProps {
  employees: Employee[];
  activeCompany: string;
  activeHRRole?: string;
}

const emptyForm = {
  id: '',
  employee_id: '',
  operator: 'Jio',
  mobile_number: '',
  plan_name: '',
  plan_amount: '',
  last_recharge_date: '',
  validity_date: '',
  monthly_recovery: '',
  issue_date: new Date().toISOString().split('T')[0],
  remarks: ''
};

export default function PrepaidSimRegister({ employees, activeCompany, activeHRRole }: PrepaidSimRegisterProps) {
  const canEdit = activeHRRole !== 'AUDITOR' && activeHRRole !== 'ATTENDANCE_ONLY_HR';
  const [assets, setAssets] = useState<EmployeeAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'SURRENDERED'>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      const list = (Array.isArray(data) ? data : []).map(hydratePrepaidAsset).filter(isPrepaidSim);
      setAssets(list);
    } catch (e: any) {
      setError(e.message || 'Failed to load prepaid SIMs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const companyEmployees = useMemo(() => {
    const active = employees.filter(e => e.status === 'ACTIVE');
    if (!activeCompany || activeCompany === 'GROUP' || activeCompany === 'COMBINED' || activeCompany === 'ALL') {
      return active;
    }
    return active.filter(e => e.company === activeCompany);
  }, [employees, activeCompany]);

  const visible = useMemo(() => {
    return assets.filter(a => {
      const emp = employees.find(e => e.id === a.employee_id);
      const company = a.company || emp?.company || '';
      if (activeCompany && activeCompany !== 'GROUP' && activeCompany !== 'COMBINED' && activeCompany !== 'ALL') {
        if (company && company !== activeCompany) return false;
      }
      const live = computePrepaidStatus(a);
      if (statusFilter !== 'ALL' && live !== statusFilter) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return [a.employee_name, a.mobile_number, a.operator, a.plan_name, emp?.id]
        .some(v => String(v || '').toLowerCase().includes(q));
    });
  }, [assets, employees, activeCompany, search, statusFilter]);

  const counts = useMemo(() => {
    const base = { ACTIVE: 0, EXPIRING: 0, EXPIRED: 0, SURRENDERED: 0 };
    for (const a of assets) {
      const live = computePrepaidStatus(a);
      if (live === 'ACTIVE' || live === 'EXPIRING' || live === 'EXPIRED' || live === 'SURRENDERED') {
        base[live] += 1;
      }
    }
    return base;
  }, [assets]);

  const openNew = () => {
    setForm({ ...emptyForm });
    setError('');
    setShowForm(true);
  };

  const openEdit = (a: EmployeeAsset) => {
    setForm({
      id: a.id,
      employee_id: a.employee_id,
      operator: a.operator || 'Jio',
      mobile_number: a.mobile_number || a.serial_number || '',
      plan_name: a.plan_name || '',
      plan_amount: String(a.plan_amount || ''),
      last_recharge_date: a.last_recharge_date || '',
      validity_date: a.validity_date || '',
      monthly_recovery: String(a.monthly_recovery || ''),
      issue_date: a.issue_date || new Date().toISOString().split('T')[0],
      remarks: a.remarks || ''
    });
    setError('');
    setShowForm(true);
  };

  const save = async () => {
    const emp = employees.find(e => e.id === form.employee_id);
    if (!emp) {
      setError('Select an employee');
      return;
    }
    if (!form.mobile_number.trim()) {
      setError('Enter SIM / mobile number');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload: EmployeeAsset = {
        id: form.id || '',
        employee_id: emp.id,
        employee_name: emp.name,
        company: emp.company,
        asset_name: form.plan_name.trim() || `${form.operator} Prepaid SIM`,
        serial_number: form.mobile_number.trim(),
        type: PREPAID_SIM_TYPE,
        issue_date: form.issue_date,
        status: 'ISSUED',
        condition: 'Good',
        operator: form.operator,
        mobile_number: form.mobile_number.trim(),
        plan_name: form.plan_name.trim(),
        plan_amount: Number(form.plan_amount || 0),
        last_recharge_date: form.last_recharge_date,
        validity_date: form.validity_date,
        monthly_recovery: Number(form.monthly_recovery || 0),
        remarks: form.remarks.trim()
      };
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setNotice(form.id ? 'Prepaid SIM updated' : 'Prepaid SIM issued');
      setShowForm(false);
      await load();
    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const surrender = async (a: EmployeeAsset) => {
    if (!canEdit) return;
    const today = new Date().toISOString().split('T')[0];
    setSaving(true);
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...a,
          status: 'RETURNED',
          return_date: today,
          remarks: `${a.remarks || ''} | Surrendered ${today}`.trim()
        })
      });
      if (!res.ok) throw new Error('Surrender failed');
      setNotice(`SIM ${a.mobile_number} marked surrendered`);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: EmployeeAsset) => {
    if (!canEdit) return;
    if (!window.confirm(`Delete prepaid record for ${a.employee_name}?`)) return;
    try {
      await fetch(`/api/assets/${encodeURIComponent(a.id)}`, { method: 'DELETE' });
      setNotice('Record deleted');
      await load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const statusClass = (live: string) => {
    if (live === 'ACTIVE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (live === 'EXPIRING') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (live === 'EXPIRED') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 font-display flex items-center gap-2">
            <Smartphone size={18} className="text-emerald-600" />
            Corporate Prepaid Register
          </h2>
          <p className="text-xs text-slate-500 mt-1">Issue, recharge validity, and F&amp;F surrender status for company SIMs. Payroll recovery uses the existing mobile deduction head.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {canEdit && (
            <button onClick={openNew} className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5">
              <Plus size={13} /> Issue SIM
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { k: 'ACTIVE', label: 'Active', n: counts.ACTIVE, icon: <CheckCircle2 size={14} className="text-emerald-600" /> },
          { k: 'EXPIRING', label: 'Expiring (7 days)', n: counts.EXPIRING, icon: <AlertTriangle size={14} className="text-amber-600" /> },
          { k: 'EXPIRED', label: 'Expired / pending', n: counts.EXPIRED, icon: <XCircle size={14} className="text-rose-600" /> },
          { k: 'SURRENDERED', label: 'Surrendered', n: counts.SURRENDERED, icon: <RotateCcw size={14} className="text-slate-500" /> }
        ].map(card => (
          <button
            key={card.k}
            onClick={() => setStatusFilter(statusFilter === card.k ? 'ALL' : card.k as any)}
            className={`text-left p-4 rounded-2xl border bg-white shadow-xs ${statusFilter === card.k ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-slate-200'}`}
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-slate-400">{card.label}</span>
              {card.icon}
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">{card.n}</div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, number, operator"
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs"
          />
        </div>
      </div>

      {notice && <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">{notice}</div>}
      {error && <div className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2.5">Employee</th>
                <th className="px-3 py-2.5">Operator / Number</th>
                <th className="px-3 py-2.5">Plan</th>
                <th className="px-3 py-2.5">Last recharge</th>
                <th className="px-3 py-2.5">Validity</th>
                <th className="px-3 py-2.5">Recovery</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-slate-400">
                    {loading ? 'Loading…' : 'No corporate prepaid SIMs yet. Issue a SIM to start tracking validity.'}
                  </td>
                </tr>
              )}
              {visible.map(a => {
                const live = computePrepaidStatus(a);
                return (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-slate-800">{a.employee_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{a.employee_id} · {a.company || '—'}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold">{a.operator || '—'}</div>
                      <div className="font-mono text-slate-600">{a.mobile_number}</div>
                    </td>
                    <td className="px-3 py-2.5">{a.plan_name || a.asset_name || '—'}</td>
                    <td className="px-3 py-2.5 font-mono">{a.last_recharge_date || '—'}</td>
                    <td className="px-3 py-2.5 font-mono">{a.validity_date || '—'}</td>
                    <td className="px-3 py-2.5">₹{Number(a.monthly_recovery || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusClass(live)}`}>
                        {prepaidStatusLabel(live)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {canEdit && live !== 'SURRENDERED' && (
                        <>
                          <button onClick={() => openEdit(a)} className="text-emerald-700 font-bold mr-2">Edit</button>
                          <button onClick={() => surrender(a)} className="text-amber-700 font-bold mr-2">Surrender</button>
                        </>
                      )}
                      {canEdit && (
                        <button onClick={() => remove(a)} className="text-rose-600 inline-flex align-middle"><Trash2 size={13} /></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-5 space-y-3 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm">{form.id ? 'Update prepaid SIM' : 'Issue prepaid SIM'}</h3>
              <button onClick={() => setShowForm(false)}><X size={16} /></button>
            </div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Employee
              <select
                value={form.employee_id}
                onChange={e => setForm({ ...form, employee_id: e.target.value })}
                className="mt-1 w-full border rounded-xl px-3 py-2 text-xs"
              >
                <option value="">Select</option>
                {companyEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.id})</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Operator
                <select value={form.operator} onChange={e => setForm({ ...form, operator: e.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs">
                  {['Jio', 'Airtel', 'Vi', 'BSNL', 'Other'].map(o => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Mobile / SIM no
                <input value={form.mobile_number} onChange={e => setForm({ ...form, mobile_number: e.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" />
              </label>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Plan name
                <input value={form.plan_name} onChange={e => setForm({ ...form, plan_name: e.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" />
              </label>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Plan amount ₹
                <input type="number" value={form.plan_amount} onChange={e => setForm({ ...form, plan_amount: e.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" />
              </label>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Last recharge
                <input type="date" value={form.last_recharge_date} onChange={e => setForm({ ...form, last_recharge_date: e.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" />
              </label>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Validity till
                <input type="date" value={form.validity_date} onChange={e => setForm({ ...form, validity_date: e.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" />
              </label>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Monthly recovery ₹
                <input type="number" value={form.monthly_recovery} onChange={e => setForm({ ...form, monthly_recovery: e.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" />
              </label>
              <label className="block text-[10px] font-bold text-slate-500 uppercase">Issue date
                <input type="date" value={form.issue_date} onChange={e => setForm({ ...form, issue_date: e.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" />
              </label>
            </div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase">Remarks
              <input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} className="mt-1 w-full border rounded-xl px-3 py-2 text-xs" />
            </label>
            {error && <p className="text-xs text-rose-600">{error}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowForm(false)} className="px-3 py-2 text-xs font-bold text-slate-500">Cancel</button>
              <button disabled={saving} onClick={save} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
