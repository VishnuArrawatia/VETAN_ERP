/** Workforce Module — Worker Master, Attendance, Dashboard & Reports */

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Users, UserPlus, Search, Filter, Download, Upload,
  Building2, Briefcase, Shield, Wallet, TrendingUp,
  ChevronDown, Eye, Edit, XCircle, Check, Clock,
  Calendar, AlertTriangle, BarChart3, FileText,
  ChevronLeft, Printer, ArrowUpDown, Loader2, Layers
} from 'lucide-react';
import type { Employee, Attendance } from '../types';
import { filterEmployeesByCompany } from '../lib/offlineStore';
import * as XLSX from 'xlsx';

/* ─── Helpers ─── */
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtNum = (n: number) => n.toLocaleString('en-IN');
const monthKey = (d: string) => d.slice(0, 7);

/* ─── Types ─── */
type SubTab = 'dashboard' | 'master' | 'attendance' | 'reports';
type ReportId = 'worker_master' | 'daily_attendance' | 'monthly_summary' | 'contractor' | 'payment_group' | 'pf_nonpf' | 'joining' | 'exit' | 'ot' | 'workforce_dashboard';

interface Props {
  employees: Employee[];
  attendance: Attendance[];
  activeCompany: string;
  activeHR: { role: string; company_rights: string[]; username: string };
  activeMonth: string;
  setActiveMonth: (m: string) => void;
  successBanner: string;
  setSuccessBanner: (s: string) => void;
  errorBanner: string;
  setErrorBanner: (s: string) => void;
  onRefresh: () => void;
}

/* ─── Dashboard KPIs ─── */
function DashboardView({ workers, attendance, activeMonth, employees }: { workers: Employee[]; attendance: Attendance[]; activeMonth: string; employees: Employee[] }) {
  const active = workers.filter(w => w.status === 'ACTIVE');
  const inactive = workers.filter(w => w.status !== 'ACTIVE');
  const monthAtt = attendance.filter(a => a.month === activeMonth);
  
  const byUnit = useMemo(() => {
    const map: Record<string, number> = {};
    active.forEach(w => { const u = w.company || 'Unknown'; map[u] = (map[u] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [active]);

  const byContractor = useMemo(() => {
    const map: Record<string, number> = {};
    active.forEach(w => { const c = w.contractor || 'Direct'; map[c] = (map[c] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [active]);

  const byCategory = useMemo(() => {
    const pf = active.filter(w => w.pf_opt_in).length;
    const nonPf = active.length - pf;
    return { pf, nonPf };
  }, [active]);

  const present = useMemo(() => {
    const empIds = new Set(active.map(w => w.id));
    return monthAtt.filter(a => empIds.has(a.employee_id) && (a.present || 0) > 0).length;
  }, [monthAtt, active]);

  const absent = useMemo(() => {
    const empIds = new Set(active.map(w => w.id));
    return monthAtt.filter(a => empIds.has(a.employee_id) && (a.absent || 0) > 0).length;
  }, [monthAtt, active]);

  const onLeave = useMemo(() => {
    const empIds = new Set(active.map(w => w.id));
    return monthAtt.filter(a => empIds.has(a.employee_id) && (a.leave || 0) > 0).length;
  }, [monthAtt, active]);

  const otHours = useMemo(() => monthAtt.reduce((sum, a) => sum + (a.ot_hours || 0), 0), [monthAtt]);

  const recentJoiners = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return active.filter(w => w.joining_date && new Date(w.joining_date) >= cutoff);
  }, [active]);

  const kpis = [
    { label: 'Total Workers', value: workers.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Active', value: active.length, icon: Check, color: 'bg-emerald-500' },
    { label: 'Inactive', value: inactive.length, icon: XCircle, color: 'bg-gray-400' },
    { label: 'Present (' + activeMonth + ')', value: present, icon: Check, color: 'bg-green-500' },
    { label: 'Absent', value: absent, icon: AlertTriangle, color: 'bg-red-500' },
    { label: 'On Leave', value: onLeave, icon: Calendar, color: 'bg-amber-500' },
    { label: 'OT Hours', value: otHours, icon: Clock, color: 'bg-purple-500' },
    { label: 'New Joiners (30d)', value: recentJoiners.length, icon: UserPlus, color: 'bg-cyan-500' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(kpi => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 shadow-sm">
            <div className={`p-2 rounded-lg ${kpi.color} text-white`}>
              <kpi.icon size={16} />
            </div>
            <div>
              <div className="text-lg font-bold text-slate-800">{fmtNum(kpi.value)}</div>
              <div className="text-[10px] text-slate-500 font-medium">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Grouping Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Unit */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2"><Building2 size={14} /> Unit-wise Workers</h3>
          <div className="space-y-2">
            {byUnit.map(([unit, count]) => (
              <div key={unit} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">{unit}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(count / active.length) * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Contractor */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2"><Briefcase size={14} /> Contractor-wise</h3>
          <div className="space-y-2">
            {byContractor.map(([ctr, count]) => (
              <div key={ctr} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">{ctr}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${(count / active.length) * 100}%` }} />
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PF vs Non-PF */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2"><Shield size={14} /> PF vs Non-PF</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">PF Workers</span>
              <span className="text-sm font-bold text-blue-700">{byCategory.pf}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${active.length ? (byCategory.pf / active.length) * 100 : 0}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">Non-PF Workers</span>
              <span className="text-sm font-bold text-amber-700">{byCategory.nonPf}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div className="bg-amber-500 h-3 rounded-full" style={{ width: `${active.length ? (byCategory.nonPf / active.length) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Worker Master ─── */
function WorkerMasterView({ workers, setWorkers, activeCompany, activeHR, successBanner, setSuccessBanner, errorBanner, setErrorBanner }: {
  workers: Employee[];
  setWorkers: (e: Employee[]) => void;
  activeCompany: string;
  activeHR: any;
  successBanner: string;
  setSuccessBanner: (s: string) => void;
  errorBanner: string;
  setErrorBanner: (s: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('ALL');
  const [filterDept, setFilterDept] = useState('ALL');
  const [filterContractor, setFilterContractor] = useState('ALL');
  const [filterPf, setFilterPf] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPaymentGroup, setFilterPaymentGroup] = useState('ALL');
  const [page, setPage] = useState(1);
  const [viewWorker, setViewWorker] = useState<Employee | null>(null);
  const [editWorker, setEditWorker] = useState<Employee | null>(null);
  const [addMode, setAddMode] = useState(false);
  const perPage = 25;

  const units = useMemo(() => [...new Set(workers.map(w => w.company).filter(Boolean))].sort(), [workers]);
  const depts = useMemo(() => [...new Set(workers.map(w => w.department).filter(Boolean))].sort(), [workers]);
  const contractors = useMemo(() => [...new Set(workers.map(w => w.contractor).filter(Boolean))].sort(), [workers]);
  const paymentGroups = useMemo(() => [...new Set(workers.map(w => w.payment_group).filter(Boolean))].sort(), [workers]);

  const filtered = useMemo(() => {
    let list = [...workers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(w => w.id.toLowerCase().includes(q) || w.name.toLowerCase().includes(q) || (w.father_husband_name || '').toLowerCase().includes(q) || w.phone.includes(q));
    }
    if (filterUnit !== 'ALL') list = list.filter(w => w.company === filterUnit);
    if (filterDept !== 'ALL') list = list.filter(w => w.department === filterDept);
    if (filterContractor !== 'ALL') list = list.filter(w => (w.contractor || 'Direct') === filterContractor);
    if (filterPf === 'PF') list = list.filter(w => w.pf_opt_in);
    else if (filterPf === 'NON_PF') list = list.filter(w => !w.pf_opt_in);
    if (filterStatus !== 'ALL') list = list.filter(w => w.status === filterStatus);
    if (filterPaymentGroup !== 'ALL') list = list.filter(w => w.payment_group === filterPaymentGroup);
    return list;
  }, [workers, search, filterUnit, filterDept, filterContractor, filterPf, filterStatus, filterPaymentGroup]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const exportExcel = useCallback(() => {
    const rows = filtered.map(w => ({
      'Worker ID': w.id, 'Name': w.name, 'Father/Husband': w.father_husband_name || '',
      'Mobile': w.phone, 'Aadhaar': w.aadhaar_number || '', 'DOB': w.dob || '',
      'Joining Date': w.joining_date, 'Company': w.company, 'Department': w.department,
      'Designation': w.designation, 'Contractor': w.contractor || 'Direct',
      'PF': w.pf_opt_in ? 'Yes' : 'No', 'Payment Group': w.payment_group || '',
      'Wage Group': w.wage_group || '', 'Wage Rate': w.wage_rate || w.base_salary,
      'Status': w.status, 'Bank': w.bank_name, 'Account': w.bank_account, 'IFSC': w.ifsc,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Worker Master');
    XLSX.writeFile(wb, `Workforce_Master_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setSuccessBanner('Worker Master exported successfully');
    setTimeout(() => setSuccessBanner(''), 3000);
  }, [filtered, setSuccessBanner]);

  const handleDeactivate = (emp: Employee) => {
    const updated = workers.map(w => w.id === emp.id ? { ...w, status: w.status === 'ACTIVE' ? 'RESIGNED' as const : 'ACTIVE' as const } : w);
    setWorkers(updated);
    setSuccessBanner(`Worker ${emp.name} ${emp.status === 'ACTIVE' ? 'deactivated' : 'activated'}`);
    setTimeout(() => setSuccessBanner(''), 3000);
  };

  const formatCurrency = (n: number) => '₹' + n.toLocaleString('en-IN');

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by ID, Name, Father's Name, Mobile..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <select value={filterUnit} onChange={e => { setFilterUnit(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-2 text-[11px] bg-white">
          <option value="ALL">All Units</option>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-2 text-[11px] bg-white">
          <option value="ALL">All Depts</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filterContractor} onChange={e => { setFilterContractor(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-2 text-[11px] bg-white">
          <option value="ALL">All Contractors</option>
          {contractors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterPf} onChange={e => { setFilterPf(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-2 text-[11px] bg-white">
          <option value="ALL">PF/Non-PF</option>
          <option value="PF">PF</option>
          <option value="NON_PF">Non-PF</option>
        </select>
        <select value={filterPaymentGroup} onChange={e => { setFilterPaymentGroup(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-2 text-[11px] bg-white">
          <option value="ALL">All Pay Groups</option>
          {paymentGroups.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }} className="border border-slate-200 rounded-lg px-2 py-2 text-[11px] bg-white">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="RESIGNED">Inactive</option>
        </select>
        <button onClick={() => setAddMode(true)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold hover:bg-emerald-700 cursor-pointer"><UserPlus size={13} /> Add Worker</button>
        <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-700 cursor-pointer"><Download size={13} /> Export</button>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500">
        <span>Showing <strong className="text-slate-800">{filtered.length}</strong> workers</span>
        <span>|</span>
        <span>Active: <strong className="text-emerald-700">{filtered.filter(w => w.status === 'ACTIVE').length}</strong></span>
        <span>Inactive: <strong className="text-slate-600">{filtered.filter(w => w.status !== 'ACTIVE').length}</strong></span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-[11px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">#</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">ID</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Name</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Father/Husband</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Mobile</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Company</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Department</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Designation</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Contractor</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-600">PF</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Pay Group</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-600">Wage</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-600">Status</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((w, i) => (
              <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                <td className="px-3 py-2 text-slate-400">{(page - 1) * perPage + i + 1}</td>
                <td className="px-3 py-2 font-mono font-bold text-slate-800">{w.id}</td>
                <td className="px-3 py-2 font-semibold text-slate-800">{w.name}</td>
                <td className="px-3 py-2 text-slate-600">{w.father_husband_name || '—'}</td>
                <td className="px-3 py-2 font-mono text-slate-600">{w.phone}</td>
                <td className="px-3 py-2 text-slate-600">{w.company}</td>
                <td className="px-3 py-2 text-slate-600">{w.department}</td>
                <td className="px-3 py-2 text-slate-600">{w.designation}</td>
                <td className="px-3 py-2 text-slate-600">{w.contractor || 'Direct'}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${w.pf_opt_in ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {w.pf_opt_in ? 'PF' : 'Non-PF'}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">{w.payment_group || '—'}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold text-slate-800">{formatCurrency(w.wage_rate || w.base_salary)}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${w.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {w.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => setViewWorker(w)} className="p-1 rounded hover:bg-blue-50 text-blue-600 cursor-pointer" title="View"><Eye size={13} /></button>
                    <button onClick={() => setEditWorker(w)} className="p-1 rounded hover:bg-amber-50 text-amber-600 cursor-pointer" title="Edit"><Edit size={13} /></button>
                    <button onClick={() => handleDeactivate(w)} className={`p-1 rounded cursor-pointer ${w.status === 'ACTIVE' ? 'hover:bg-red-50 text-red-500' : 'hover:bg-green-50 text-green-600'}`} title={w.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                      {w.status === 'ACTIVE' ? <XCircle size={13} /> : <Check size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={14} className="px-4 py-8 text-center text-slate-400 text-xs">No workers found matching your filters</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded-lg text-[11px] disabled:opacity-40 hover:bg-slate-50 cursor-pointer">Prev</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded-lg text-[11px] disabled:opacity-40 hover:bg-slate-50 cursor-pointer">Next</button>
          </div>
        </div>
      )}

      {/* View Worker Modal */}
      {viewWorker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setViewWorker(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Worker Profile — {viewWorker.name}</h3>
              <button onClick={() => setViewWorker(null)} className="p-1 rounded hover:bg-slate-100 cursor-pointer"><XCircle size={16} /></button>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3 text-[11px]">
              {([
                ['Worker ID', viewWorker.id], ['Name', viewWorker.name],
                ['Father/Husband', viewWorker.father_husband_name || '—'], ['Mobile', viewWorker.phone],
                ['Aadhaar', viewWorker.aadhaar_number || '—'], ['DOB', viewWorker.dob || '—'],
                ['Joining Date', fmtDate(viewWorker.joining_date)], ['Company', viewWorker.company],
                ['Department', viewWorker.department], ['Designation', viewWorker.designation],
                ['Contractor', viewWorker.contractor || 'Direct'], ['PF', viewWorker.pf_opt_in ? 'Yes' : 'No'],
                ['Payment Group', viewWorker.payment_group || '—'], ['Wage Group', viewWorker.wage_group || '—'],
                ['Wage/Rate', formatCurrency(viewWorker.wage_rate || viewWorker.base_salary)],
                ['Bank', viewWorker.bank_name], ['Account', viewWorker.bank_account], ['IFSC', viewWorker.ifsc],
                ['Status', viewWorker.status],
              ] as [string, string | number | boolean][]).map(([k, v]) => (
                <div key={k}>
                  <div className="text-[10px] text-slate-400 font-medium">{k}</div>
                  <div className="font-semibold text-slate-800">{String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Worker Modal */}
      {editWorker && (
        <WorkerFormModal
          worker={editWorker}
          onClose={() => setEditWorker(null)}
          onSave={(updated) => {
            setWorkers(workers.map(w => w.id === updated.id ? updated : w));
            setEditWorker(null);
            setSuccessBanner(`Worker ${updated.name} updated`);
            setTimeout(() => setSuccessBanner(''), 3000);
          }}
        />
      )}

      {/* Add Worker Modal */}
      {addMode && (
        <WorkerFormModal
          worker={null}
          onClose={() => setAddMode(false)}
          onSave={(newWorker) => {
            if (workers.some(w => w.id === newWorker.id)) {
              setErrorBanner(`Worker ID ${newWorker.id} already exists`);
              setTimeout(() => setErrorBanner(''), 3000);
              return;
            }
            setWorkers([...workers, newWorker]);
            setAddMode(false);
            setSuccessBanner(`Worker ${newWorker.name} added successfully`);
            setTimeout(() => setSuccessBanner(''), 3000);
          }}
        />
      )}
    </div>
  );
}

/* ─── Worker Form Modal ─── */
function WorkerFormModal({ worker, onClose, onSave }: { worker: Employee | null; onClose: () => void; onSave: (w: Employee) => void }) {
  const [form, setForm] = useState<Partial<Employee>>(worker || {
    id: '', name: '', father_husband_name: '', phone: '', aadhaar_number: '', dob: '',
    joining_date: new Date().toISOString().slice(0, 10), company: '', department: '',
    designation: '', contractor: '', pf_opt_in: false, payment_group: '', wage_group: '',
    wage_rate: 0, base_salary: 0, bank_name: '', bank_account: '', ifsc: '',
    status: 'ACTIVE', employee_category: 'Worker', email: '',
  });
  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    if (!form.id || !form.name) return;
    onSave({ ...form, base_salary: form.wage_rate || form.base_salary || 0 } as Employee);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-800">{worker ? 'Edit Worker' : 'Add New Worker'}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 cursor-pointer"><XCircle size={16} /></button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Input label="Worker ID *" value={form.id || ''} onChange={v => set('id', v)} disabled={!!worker} />
            <Input label="Name *" value={form.name || ''} onChange={v => set('name', v)} />
            <Input label="Father/Husband Name" value={form.father_husband_name || ''} onChange={v => set('father_husband_name', v)} />
            <Input label="Mobile *" value={form.phone || ''} onChange={v => set('phone', v)} />
            <Input label="Aadhaar Number" value={form.aadhaar_number || ''} onChange={v => set('aadhaar_number', v)} />
            <Input label="Date of Birth" type="date" value={form.dob || ''} onChange={v => set('dob', v)} />
            <Input label="Joining Date" type="date" value={form.joining_date || ''} onChange={v => set('joining_date', v)} />
            <Input label="Company *" value={form.company || ''} onChange={v => set('company', v)} />
            <Input label="Department" value={form.department || ''} onChange={v => set('department', v)} />
            <Input label="Designation / Work Type" value={form.designation || ''} onChange={v => set('designation', v)} />
            <Input label="Contractor" value={form.contractor || ''} onChange={v => set('contractor', v)} />
            <div>
              <label className="text-[10px] text-slate-500 font-medium block mb-1">PF Status</label>
              <select value={form.pf_opt_in ? 'PF' : 'NON_PF'} onChange={e => set('pf_opt_in', e.target.value === 'PF')} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white">
                <option value="PF">PF</option>
                <option value="NON_PF">Non-PF</option>
              </select>
            </div>
            <Input label="Payment Group" value={form.payment_group || ''} onChange={v => set('payment_group', v)} />
            <Input label="Wage Group" value={form.wage_group || ''} onChange={v => set('wage_group', v)} />
            <Input label="Wage/Rate (₹)" type="number" value={String(form.wage_rate || '')} onChange={v => set('wage_rate', Number(v))} />
            <Input label="Bank Name" value={form.bank_name || ''} onChange={v => set('bank_name', v)} />
            <Input label="Bank Account" value={form.bank_account || ''} onChange={v => set('bank_account', v)} />
            <Input label="IFSC Code" value={form.ifsc || ''} onChange={v => set('ifsc', v)} />
            <Input label="Email" value={form.email || ''} onChange={v => set('email', v)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer">{worker ? 'Save Changes' : 'Add Worker'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Input Helper ─── */
function Input({ label, value, onChange, type = 'text', disabled = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
  return (
    <div>
      <label className="text-[10px] text-slate-500 font-medium block mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50 disabled:bg-slate-50" />
    </div>
  );
}

/* ─── Attendance View ─── */
function AttendanceView({ workers, attendance, activeMonth }: { workers: Employee[]; attendance: Attendance[]; activeMonth: string }) {
  const active = workers.filter(w => w.status === 'ACTIVE');
  const monthData = useMemo(() => {
    const map: Record<string, Attendance> = {};
    attendance.filter(a => a.month === activeMonth).forEach(a => { map[a.employee_id] = a; });
    return map;
  }, [attendance, activeMonth]);

  const [search, setSearch] = useState('');
  const [filterUnit, setFilterUnit] = useState('ALL');
  const units = useMemo(() => [...new Set(active.map(w => w.company).filter(Boolean))].sort(), [active]);

  const filtered = useMemo(() => {
    let list = active;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(w => w.id.toLowerCase().includes(q) || w.name.toLowerCase().includes(q));
    }
    if (filterUnit !== 'ALL') list = list.filter(w => w.company === filterUnit);
    return list;
  }, [active, search, filterUnit]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ID or Name..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-500 outline-none" />
        </div>
        <select value={filterUnit} onChange={e => setFilterUnit(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-2 text-[11px] bg-white">
          <option value="ALL">All Units</option>
          {units.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-[11px]">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">#</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">ID</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Name</th>
              <th className="text-left px-3 py-2 font-semibold text-slate-600">Company</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-600">Total Days</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-600">Present</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-600">Absent</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-600">Leave</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-600">LWP</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-600">OT Hours</th>
              <th className="text-center px-3 py-2 font-semibold text-slate-600">Weekly Off</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((w, i) => {
              const att = monthData[w.id];
              return (
                <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-800">{w.id}</td>
                  <td className="px-3 py-2 font-semibold text-slate-800">{w.name}</td>
                  <td className="px-3 py-2 text-slate-600">{w.company}</td>
                  <td className="px-3 py-2 text-center font-mono">{att?.total_days || '—'}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-bold text-emerald-700">{att?.present ?? '—'}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-bold text-red-600">{att?.absent ?? '—'}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-bold text-amber-600">{att?.leave ?? '—'}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-bold text-orange-600">{att?.lwp ?? '—'}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-bold text-purple-600">{att?.ot_hours ?? 0}</span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className="font-bold text-blue-600">{att?.weekly_off ?? '—'}</span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-slate-400 text-xs">No attendance data found for {activeMonth}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Reports View ─── */
function ReportsView({ workers, attendance, activeMonth }: { workers: Employee[]; attendance: Attendance[]; activeMonth: string }) {
  const [activeReport, setActiveReport] = useState<ReportId | null>(null);
  const active = workers.filter(w => w.status === 'ACTIVE');
  const monthAtt = attendance.filter(a => a.month === activeMonth);

  const reports: { id: ReportId; name: string; icon: any; description: string }[] = [
    { id: 'worker_master', name: 'Worker Master Report', icon: Users, description: 'Complete list of all workers with all details' },
    { id: 'daily_attendance', name: 'Daily Attendance Report', icon: Calendar, description: 'Day-wise attendance summary' },
    { id: 'monthly_summary', name: 'Monthly Attendance Summary', icon: BarChart3, description: 'Month-wise present/absent/leave summary' },
    { id: 'contractor', name: 'Contractor-wise Report', icon: Briefcase, description: 'Workers grouped by contractor' },
    { id: 'payment_group', name: 'Payment Group Report', icon: Wallet, description: 'Workers grouped by payment group' },
    { id: 'pf_nonpf', name: 'PF / Non-PF Report', icon: Shield, description: 'PF and Non-PF worker breakdown' },
    { id: 'joining', name: 'Joining Report', icon: UserPlus, description: 'Recent joiners and joining trends' },
    { id: 'exit', name: 'Exit Report', icon: XCircle, description: 'Worker exits and separations' },
    { id: 'ot', name: 'OT Report', icon: Clock, description: 'Overtime hours summary' },
    { id: 'workforce_dashboard', name: 'Workforce Dashboard', icon: Layers, description: 'Complete workforce overview' },
  ];

  const exportReport = (reportId: ReportId) => {
    let data: any[] = [];
    let sheetName = 'Report';
    switch (reportId) {
      case 'worker_master':
        data = workers.map(w => ({ ID: w.id, Name: w.name, 'Father/Husband': w.father_husband_name || '', Mobile: w.phone, Aadhaar: w.aadhaar_number || '', 'Joining Date': w.joining_date, Company: w.company, Department: w.department, Designation: w.designation, Contractor: w.contractor || 'Direct', PF: w.pf_opt_in ? 'Yes' : 'No', 'Payment Group': w.payment_group || '', 'Wage Rate': w.wage_rate || w.base_salary, Status: w.status }));
        sheetName = 'Worker Master';
        break;
      case 'monthly_summary':
        data = active.map(w => {
          const att = monthAtt.find(a => a.employee_id === w.id);
          return { ID: w.id, Name: w.name, Company: w.company, 'Total Days': att?.total_days || 0, Present: att?.present || 0, Absent: att?.absent || 0, Leave: att?.leave || 0, LWP: att?.lwp || 0, 'OT Hours': att?.ot_hours || 0 };
        });
        sheetName = 'Monthly Summary';
        break;
      case 'contractor':
        const byCtr: Record<string, Employee[]> = {};
        active.forEach(w => { const c = w.contractor || 'Direct'; if (!byCtr[c]) byCtr[c] = []; byCtr[c].push(w); });
        data = Object.entries(byCtr).flatMap(([ctr, emps]) => emps.map(w => ({ Contractor: ctr, ID: w.id, Name: w.name, Company: w.company, Department: w.department, 'Wage Rate': w.wage_rate || w.base_salary })));
        sheetName = 'Contractor Report';
        break;
      case 'pf_nonpf':
        data = active.map(w => ({ ID: w.id, Name: w.name, Company: w.company, Department: w.department, 'PF Status': w.pf_opt_in ? 'PF' : 'Non-PF', 'Payment Group': w.payment_group || '' }));
        sheetName = 'PF Report';
        break;
      case 'ot':
        data = active.map(w => {
          const att = monthAtt.find(a => a.employee_id === w.id);
          return { ID: w.id, Name: w.name, Company: w.company, 'OT Hours': att?.ot_hours || 0 };
        }).filter(d => d['OT Hours'] > 0);
        sheetName = 'OT Report';
        break;
      case 'joining':
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);
        data = active.filter(w => w.joining_date && new Date(w.joining_date) >= thirtyDaysAgo).map(w => ({ ID: w.id, Name: w.name, 'Joining Date': w.joining_date, Company: w.company, Department: w.department, Designation: w.designation, Contractor: w.contractor || 'Direct' }));
        sheetName = 'Joining Report';
        break;
      case 'exit':
        data = workers.filter(w => w.status !== 'ACTIVE').map(w => ({ ID: w.id, Name: w.name, 'Exit Date': w.exit_date || '', Company: w.company, Status: w.status }));
        sheetName = 'Exit Report';
        break;
      default:
        return;
    }
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName.replace(/\s+/g, '_')}_${activeMonth}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {activeReport ? (
        <div>
          <button onClick={() => setActiveReport(null)} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mb-3 cursor-pointer"><ChevronLeft size={14} /> Back to Reports</button>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">{reports.find(r => r.id === activeReport)?.name}</h3>
            <button onClick={() => exportReport(activeReport)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-[11px] font-semibold hover:bg-blue-700 cursor-pointer"><Download size={13} /> Export to Excel</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-xs text-slate-500">
            Report data for <strong>{activeMonth}</strong> — {active.length} active workers, {monthAtt.length} attendance records.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {reports.map(r => (
            <button key={r.id} onClick={() => setActiveReport(r.id)}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition text-left cursor-pointer shadow-sm">
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><r.icon size={18} /></div>
              <div>
                <div className="text-xs font-bold text-slate-800">{r.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{r.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Main Module ─── */
export default function WorkforceModule(props: Props) {
  const { employees, attendance, activeCompany, activeHR, activeMonth, setActiveMonth, successBanner, setSuccessBanner, errorBanner, setErrorBanner, onRefresh } = props;
  const [subTab, setSubTab] = useState<SubTab>('dashboard');

  // Filter workers only (category = Worker or Contract)
  const workers = useMemo(() => {
    const isMgmt = activeHR?.role === 'MANAGEMENT' || activeHR?.role === 'SUPER_HR';
    const all = filterEmployeesByCompany(employees, isMgmt ? 'ALL' : activeCompany);
    return all.filter(e => e.employee_category === 'Worker' || e.employee_category === 'Contract' || (e.designation || '').toLowerCase().includes('worker'));
  }, [employees, activeHR, activeCompany]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users size={20} className="text-emerald-600" /> Workforce Module
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">{workers.length} workers | {workers.filter(w => w.status === 'ACTIVE').length} active</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] font-bold text-slate-400">Month</label>
          <input type="month" value={activeMonth} onChange={e => setActiveMonth(e.target.value)} className="border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-mono bg-white" />
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {([
          { id: 'dashboard' as SubTab, label: 'Dashboard', icon: Layers },
          { id: 'master' as SubTab, label: 'Worker Master', icon: Users },
          { id: 'attendance' as SubTab, label: 'Attendance', icon: Calendar },
          { id: 'reports' as SubTab, label: 'Reports', icon: BarChart3 },
        ]).map(tab => (
          <button key={tab.id} onClick={() => setSubTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold transition cursor-pointer ${subTab === tab.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {subTab === 'dashboard' && <DashboardView workers={workers} attendance={attendance} activeMonth={activeMonth} employees={employees} />}
      {subTab === 'master' && <WorkerMasterView workers={workers} setWorkers={() => onRefresh()} activeCompany={activeCompany} activeHR={activeHR} successBanner={successBanner} setSuccessBanner={setSuccessBanner} errorBanner={errorBanner} setErrorBanner={setErrorBanner} />}
      {subTab === 'attendance' && <AttendanceView workers={workers} attendance={attendance} activeMonth={activeMonth} />}
      {subTab === 'reports' && <ReportsView workers={workers} attendance={attendance} activeMonth={activeMonth} />}
    </div>
  );
}
