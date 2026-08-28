import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, ClipboardList, BarChart3, FileText, Search, Plus,
  Edit2, Trash2, Eye, Download, Filter, Building2, UserCheck,
  Calendar, TrendingUp, Briefcase, ChevronLeft, ChevronRight,
  X, Save, AlertCircle, CheckCircle, LogOut, Shield, Key,
  Lock, UserPlus, Settings, Database, Upload
} from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE = '/api';

// ============ API Helper ============
let authToken = localStorage.getItem('worker_erp_token') || '';

function apiHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };
}

async function apiFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, { ...options, headers: { ...apiHeaders(), ...(options.headers || {}) } });
  if (res.status === 401) {
    authToken = '';
    localStorage.removeItem('worker_erp_token');
    localStorage.removeItem('worker_erp_user');
    window.location.reload();
    throw new Error('Session expired');
  }
  return res;
}

async function apiDownload(url: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const contentDisp = res.headers.get('content-disposition');
  const filename = contentDisp?.split('filename=')[1] || 'export.xlsx';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ============ Types ============
interface User {
  id: number;
  username: string;
  displayName: string;
  role: 'super_admin' | 'hr' | 'reviewer';
  units: string[];
  isActive?: number;
}

// ============ Components ============

function Modal({ isOpen, onClose, title, children, wide }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-xl ${wide ? 'max-w-5xl' : 'max-w-4xl'} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Toast({ message, type, onClose }: any) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-2 z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
      {type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
      <span>{message}</span>
    </div>
  );
}

// ============ LOGIN PAGE ============
function LoginPage({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('worker_erp_token', data.token);
      localStorage.setItem('worker_erp_user', JSON.stringify(data.user));
      authToken = data.token;
      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">SVN-Sakar Group Workerforce</h1>
          <p className="text-gray-500 mt-1">SVN-Sakar Group — Workforce Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter username" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password" required />
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <><Key size={18} /> Login</>}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 text-center">
            Default Admin: <strong>admin</strong> / <strong>admin123</strong><br />
            Change password after first login!
          </p>
        </div>
      </div>
    </div>
  );
}

// ============ DASHBOARD ============
function DashboardTab({ user }: { user: User }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const defaultFY = currentMonth >= 4 ? currentYear : currentYear - 1;
  const [fyYear, setFyYear] = useState(defaultFY);

  useEffect(() => { loadDashboard(); }, [fyYear]);

  const loadDashboard = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/dashboard?fy=${fyYear}`);
      setData(await res.json());
    } catch (error) { console.error('Dashboard error:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  if (!data) return <div className="text-center py-8 text-gray-500">Failed to load dashboard</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5">
            <span className="text-sm font-medium text-gray-600">Financial Year:</span>
            <select value={fyYear} onChange={(e) => setFyYear(parseInt(e.target.value))} className="px-2 py-1 border rounded text-sm font-semibold text-blue-700">
              {Array.from({length: 8}, (_, i) => 2025 + i).map(y => (
                <option key={y} value={y}>FY {y}-{String(y+1).slice(-2)}</option>
              ))}
            </select>
          </div>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {user.role === 'super_admin' ? '🌟 Super Admin' : user.role === 'hr' ? '👩‍💼 HR' : '👁 Reviewer'} — {user.units.includes('*') ? 'All Units' : user.units.join(', ')}
          </span>
        </div>
      </div>

      {/* COMPANY LOGOS - SVN & Sakar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border overflow-hidden flex items-center justify-center py-4 px-6 hover:shadow-md">
          <img src="/images/factory_svn.png" alt="SVN Opto Electronics" className="h-20 object-contain" loading="lazy" />
          <div className="ml-4 text-left">
            <p className="text-sm font-bold text-gray-800">SVN Opto Electronics Pvt Ltd</p>
            <p className="text-xs text-gray-500">Dabhel, Daman</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border overflow-hidden flex items-center justify-center py-4 px-6 hover:shadow-md">
          <img src="/images/factory_sakar.png" alt="Sakar Electricals & Electronics" className="h-20 object-contain" loading="lazy" />
          <div className="ml-4 text-left">
            <p className="text-sm font-bold text-gray-800">Sakar Electricals & Electronics Pvt Ltd</p>
            <p className="text-xs text-gray-500">Kachigam, Daman / Vapi, Gujarat</p>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <Users className="text-blue-600" size={24} />
            <div><p className="text-sm text-gray-600">Total Workers</p><p className="text-2xl font-bold text-blue-600">{data.totalWorkers}</p></div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-200">
          <div className="flex items-center gap-3">
            <UserCheck className="text-green-600" size={24} />
            <div><p className="text-sm text-gray-600">Active</p><p className="text-2xl font-bold text-green-600">{data.activeWorkers}</p></div>
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border border-red-200">
          <div className="flex items-center gap-3">
            <Users className="text-red-600" size={24} />
            <div><p className="text-sm text-gray-600">Inactive</p><p className="text-2xl font-bold text-red-600">{data.inactiveWorkers}</p></div>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-purple-600" size={24} />
            <div><p className="text-sm text-gray-600">Total CTC</p><p className="text-2xl font-bold text-purple-600">₹{(data.totalCTC / 100000).toFixed(1)}L</p></div>
          </div>
        </div>
      </div>

      {/* UNIT-WISE SUMMARY: Total | Left | Joined | Active */}
      <div className="bg-white p-4 rounded-xl border">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Building2 size={18} /> Unit-wise Workforce Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Unit</th>
                <th className="px-4 py-3 text-right font-semibold">Total Workers</th>
                <th className="px-4 py-3 text-right font-semibold text-red-600">Left (This Month)</th>
                <th className="px-4 py-3 text-right font-semibold text-green-600">New Join (This Month)</th>
                <th className="px-4 py-3 text-right font-semibold text-blue-600">Active Workers</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data.unitSummary || []).map((u: any) => (
                <tr key={u.unit} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.unit}</td>
                  <td className="px-4 py-3 text-right">{u.total}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">{u.left > 0 ? u.left : '-'}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{u.joined > 0 ? u.joined : '-'}</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-600">{u.active}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right">{data.totalWorkers}</td>
                <td className="px-4 py-3 text-right text-red-600">{(data.unitSummary || []).reduce((s: number, u: any) => s + (u.left || 0), 0) || '-'}</td>
                <td className="px-4 py-3 text-right text-green-600">{(data.unitSummary || []).reduce((s: number, u: any) => s + (u.joined || 0), 0) || '-'}</td>
                <td className="px-4 py-3 text-right text-blue-600">{data.activeWorkers}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* UNIT-WISE & MONTH-WISE WORKER COST */}
      <div className="bg-white p-4 rounded-xl border">
        <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp size={18} /> Unit-wise & Month-wise Worker Cost — <span className="text-blue-600">{data.fyLabel || `FY ${fyYear}-${String(fyYear+1).slice(-2)}`}</span></h3>
        <p className="text-sm text-gray-500 mb-3">Cost = (Basic + HRA + Other Allowance) × Present Days &nbsp;|&nbsp; Avg = Total Cost ÷ Workers</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left font-semibold border">Month</th>
                {(data.allUnits || []).map((u: string) => (
                  <th key={u} className="px-3 py-2 text-center font-semibold border" colSpan={3}>{u}</th>
                ))}
                <th className="px-3 py-2 text-center font-semibold border bg-gray-200" colSpan={2}>Grand Total</th>
              </tr>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 border"></th>
                {(data.allUnits || []).map((u: string) => (
                  <React.Fragment key={u}>
                    <th className="px-2 py-1 text-right text-xs border">Cost</th>
                    <th className="px-2 py-1 text-right text-xs border">#</th>
                    <th className="px-2 py-1 text-right text-xs border">Avg</th>
                  </React.Fragment>
                ))}
                <th className="px-2 py-1 text-right text-xs border bg-gray-200">Cost</th>
                <th className="px-2 py-1 text-right text-xs border bg-gray-200">Avg</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data.unitWiseCost || []).map((row: any) => (
                <tr key={row.monthKey} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium border whitespace-nowrap">{row.month}</td>
                  {(data.allUnits || []).map((u: string) => (
                    <React.Fragment key={u}>
                      <td className="px-2 py-2 text-right border">₹{(row[u + '_cost'] || 0).toLocaleString()}</td>
                      <td className="px-2 py-2 text-right border text-gray-500 text-xs">{row[u + '_count'] || 0}</td>
                      <td className="px-2 py-2 text-right border text-purple-600 font-medium">₹{(row[u + '_avg'] || 0).toLocaleString()}</td>
                    </React.Fragment>
                  ))}
                  <td className="px-2 py-2 text-right border bg-gray-50 font-bold">₹{(row.grandTotal || 0).toLocaleString()}</td>
                  <td className="px-2 py-2 text-right border bg-gray-50 font-bold text-purple-600">₹{(row.grandAvg || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contractor + PF/ESIC */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl border">
          <h3 className="font-bold mb-4 flex items-center gap-2"><Briefcase size={18} /> Contractor-wise Workers</h3>
          <div className="space-y-3">
            {data.contractorWise.map((item: any) => (
              <div key={item.source}>
                <div className="flex justify-between text-sm mb-1"><span>{item.source || 'Company Direct'}</span><span className="font-medium">{item.count}</span></div>
                <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${(item.count / data.activeWorkers) * 100}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <h3 className="font-bold mb-4">PF/ESIC Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">PF Status</p>
              {data.pfStats.map((item: any) => (
                <div key={item.pf_flag} className="flex justify-between py-1"><span>{item.pf_flag}</span><span className="font-medium">{item.count}</span></div>
              ))}
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">ESIC Status</p>
              {data.esicStats.map((item: any) => (
                <div key={item.esic_flag} className="flex justify-between py-1"><span>{item.esic_flag}</span><span className="font-medium">{item.count}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Department-wise */}
      <div className="bg-white p-4 rounded-xl border">
        <h3 className="font-bold mb-4">Department-wise Workers</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.departmentWise.slice(0, Math.ceil(data.departmentWise.length / 2)).map((item: any) => (
              <div key={item.department} className="flex justify-between py-1 border-b"><span>{item.department || 'Unknown'}</span><span className="font-medium">{item.count}</span></div>
            ))}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.departmentWise.slice(Math.ceil(data.departmentWise.length / 2)).map((item: any) => (
              <div key={item.department} className="flex justify-between py-1 border-b"><span>{item.department || 'Unknown'}</span><span className="font-medium">{item.count}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ WORKER MASTER ============
function WorkerMasterTab({ user }: { user: User }) {
  const [workers, setWorkers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ unit: '', type: '', department: '', source: '', status: '' });
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState<any>(null);
  const [toast, setToast] = useState<any>(null);
  const [units, setUnits] = useState<string[]>([]);
  const canEdit = user.role === 'super_admin' || user.role === 'hr';

  const [formData, setFormData] = useState({
    worker_code: '', name: '', father_name: '', gender: 'M', dob: '', doj: '',
    unit: '', type: '', source: '', department: '', working_hours: 8,
    pf_flag: 'NO', esic_flag: 'NO', uan: '', aadhaar: '',
    basic_wage: 0, hra: 0, total_wage: 0, ctc: 0, transport: '', transport_by: ''
  });

  useEffect(() => { loadUnits(); }, []);
  useEffect(() => { loadWorkers(); }, [page, filters, search]);

  const loadUnits = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/units`);
      const data = await res.json();
      setUnits(data.map((u: any) => u.name));
    } catch { setUnits(user.units.includes('*') ? ['SVN-I', 'SVN-II', 'Sakar-I', 'Sakar-III'] : user.units); }
  };

  const loadWorkers = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 25, search };
      if (filters.unit) params.unit = filters.unit;
      if (filters.type) params.type = filters.type;
      if (filters.department) params.department = filters.department;
      if (filters.source) params.source = filters.source;
      if (filters.status) params.status = filters.status;
      const res = await apiFetch(`${API_BASE}/workers?${new URLSearchParams(params).toString()}`);
      const data = await res.json();
      setWorkers(data.workers);
      setPagination(data.pagination);
    } catch (error) { console.error('Load workers error:', error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try {
      const url = editWorker ? `${API_BASE}/workers/${editWorker.worker_code}` : `${API_BASE}/workers`;
      const method = editWorker ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, body: JSON.stringify(formData) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setToast({ message: editWorker ? 'Worker updated!' : 'Worker added!', type: 'success' });
      setShowModal(false); setEditWorker(null); loadWorkers();
    } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
  };

  const handleEdit = (worker: any) => { setEditWorker(worker); setFormData(worker); setShowModal(true); };

  const handleDelete = async (code: string) => {
    if (!confirm('Deactivate this worker?')) return;
    try {
      await apiFetch(`${API_BASE}/workers/${code}`, { method: 'DELETE' });
      setToast({ message: 'Worker deactivated', type: 'success' }); loadWorkers();
    } catch { setToast({ message: 'Failed', type: 'error' }); }
  };

  const handleRestore = async (code: string) => {
    try {
      await apiFetch(`${API_BASE}/workers/${code}/restore`, { method: 'POST' });
      setToast({ message: 'Worker restored', type: 'success' }); loadWorkers();
    } catch { setToast({ message: 'Failed', type: 'error' }); }
  };

  const resetForm = () => {
    setFormData({ worker_code: '', name: '', father_name: '', gender: 'M', dob: '', doj: '', unit: '', type: '', source: '', department: '', working_hours: 8, pf_flag: 'NO', esic_flag: 'NO', uan: '', aadhaar: '', basic_wage: 0, hra: 0, total_wage: 0, ctc: 0, transport: '', transport_by: '' });
  };

  const availableUnits = user.units.includes('*') ? units : user.units.filter(u => units.includes(u));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Worker Master</h2>
        {canEdit && (
          <button onClick={() => { setEditWorker(null); resetForm(); setShowModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus size={18} /> Add Worker
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search by ID, Name, Father's Name..." value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg" />
            </div>
          </div>
          <select value={filters.unit} onChange={(e) => { setFilters({ ...filters, unit: e.target.value }); setPage(1); }} className="px-4 py-2 border rounded-lg">
            <option value="">All Units</option>
            {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }} className="px-4 py-2 border rounded-lg">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Unit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Wage</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                {canEdit && <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={canEdit ? 9 : 8} className="text-center py-8">Loading...</td></tr>
              ) : workers.length === 0 ? (
                <tr><td colSpan={canEdit ? 9 : 8} className="text-center py-8 text-gray-500">No workers found</td></tr>
              ) : (
                workers.map((worker) => (
                  <tr key={worker.worker_code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{worker.worker_code}</td>
                    <td className="px-4 py-3 text-sm">{worker.name}</td>
                    <td className="px-4 py-3 text-sm">{worker.unit}</td>
                    <td className="px-4 py-3 text-sm">{worker.department}</td>
                    <td className="px-4 py-3 text-sm">{worker.type}</td>
                    <td className="px-4 py-3 text-sm">{worker.source}</td>
                    <td className="px-4 py-3 text-sm">₹{worker.total_wage}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${worker.active_status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {worker.active_status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(worker)} className="p-1 hover:bg-blue-100 rounded"><Edit2 size={16} className="text-blue-600" /></button>
                          {worker.active_status ? (
                            <button onClick={() => handleDelete(worker.worker_code)} className="p-1 hover:bg-red-100 rounded"><Trash2 size={16} className="text-red-600" /></button>
                          ) : (
                            <button onClick={() => handleRestore(worker.worker_code)} className="p-1 hover:bg-green-100 rounded"><CheckCircle size={16} className="text-green-600" /></button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-sm text-gray-600">
            Showing {((page - 1) * 25) + 1} to {Math.min(page * 25, pagination.total || 0)} of {pagination.total || 0} workers
          </span>
          <div className="flex gap-2 items-center">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronLeft size={16} /></button>
            <span className="px-4 py-2 text-sm">Page {page} of {pagination.totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages || 1, p + 1))} disabled={page >= (pagination.totalPages || 1)} className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {canEdit && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editWorker ? 'Edit Worker' : 'Add Worker'} wide>
          <div className="grid md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Worker Code *</label><input type="text" value={formData.worker_code} onChange={(e) => setFormData({ ...formData, worker_code: e.target.value })} disabled={!!editWorker} className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100" /></div>
            <div><label className="block text-sm font-medium mb-1">Name *</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Father/Husband Name</label><input type="text" value={formData.father_name || ''} onChange={(e) => setFormData({ ...formData, father_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Gender</label><select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="M">Male</option><option value="F">Female</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Unit *</label><select value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="">Select Unit</option>{availableUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
            <div><label className="block text-sm font-medium mb-1">Department</label><input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Type</label><select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="">Select Type</option><option value="Company">Company</option><option value="Contractor-PF">Contractor-PF</option><option value="Contractor-Non-PF">Contractor-Non-PF</option></select></div>
            <div><label className="block text-sm font-medium mb-1">Source/Contractor</label><input type="text" value={formData.source || ''} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">DOJ</label><input type="date" value={formData.doj || ''} onChange={(e) => setFormData({ ...formData, doj: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">DOB</label><input type="date" value={formData.dob || ''} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Total Wage (₹)</label><input type="number" value={formData.total_wage} onChange={(e) => setFormData({ ...formData, total_wage: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">PF Flag</label><select value={formData.pf_flag} onChange={(e) => setFormData({ ...formData, pf_flag: e.target.value })} className="w-full px-3 py-2 border rounded-lg"><option value="YES">YES</option><option value="NO">NO</option></select></div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><Save size={18} /> {editWorker ? 'Update' : 'Save'}</button>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ============ ATTENDANCE ============
function AttendanceTab({ user }: { user: User }) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(5, 7));
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [units, setUnits] = useState<string[]>([]);
  const [unitFilter, setUnitFilter] = useState('');

  useEffect(() => { loadUnits(); loadAttendance(); }, []);

  const loadUnits = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/units`);
      setUnits((await res.json()).map((u: any) => u.name));
    } catch { setUnits(user.units.includes('*') ? ['SVN-I', 'SVN-II', 'Sakar-I', 'Sakar-III'] : user.units); }
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const params: any = { month, year };
      if (unitFilter) params.unit = unitFilter;
      const res = await apiFetch(`${API_BASE}/attendance?${new URLSearchParams(params).toString()}`);
      setRecords(await res.json());
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const availableUnits = user.units.includes('*') ? units : user.units.filter(u => units.includes(u));

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Attendance</h2>
      <div className="bg-white p-4 rounded-xl border">
        <div className="flex flex-wrap gap-4 items-end">
          <div><label className="block text-sm font-medium mb-1">Month</label><select value={month} onChange={(e) => setMonth(e.target.value)} className="px-4 py-2 border rounded-lg">
            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => <option key={m} value={m}>{m}</option>)}
          </select></div>
          <div><label className="block text-sm font-medium mb-1">Year</label><select value={year} onChange={(e) => setYear(e.target.value)} className="px-4 py-2 border rounded-lg">
            {Array.from({length: 8}, (_, i) => 2025 + i).map(y => <option key={y} value={y}>FY {y}-{String(y+1).slice(-2)}</option>)}
          </select></div>
          <div><label className="block text-sm font-medium mb-1">Unit</label><select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} className="px-4 py-2 border rounded-lg">
            <option value="">All Units</option>{availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select></div>
          <button onClick={loadAttendance} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Load</button>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Unit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Present</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Absent</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Leave</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">LWP</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">OT Hours</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Weekly Off</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8">Loading...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">No attendance records found</td></tr>
              ) : (
                records.map((r: any) => (
                  <tr key={`${r.worker_code}-${r.month}-${r.year}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{r.worker_code}</td>
                    <td className="px-4 py-3 text-sm">{r.name}</td>
                    <td className="px-4 py-3 text-sm">{r.unit}</td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">{r.present}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{r.absent}</td>
                    <td className="px-4 py-3 text-sm text-orange-600">{r.leave}</td>
                    <td className="px-4 py-3 text-sm text-yellow-600">{r.lwp}</td>
                    <td className="px-4 py-3 text-sm text-blue-600">{r.ot_hours}</td>
                    <td className="px-4 py-3 text-sm">{r.weekly_off}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============ REPORTS ============
function ReportsTab({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);

  const downloadReport = async (endpoint: string, filename: string) => {
    try {
      setLoading(true);
      await apiDownload(`${API_BASE}/export/${endpoint}`);
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    } finally { setLoading(false); }
  };

  const reports = [
    { id: 'workers', title: 'Worker Master Report', desc: 'Complete list of all workers', icon: <FileText className="text-blue-600" size={32} />, color: 'blue' },
    { id: 'unit-report', title: 'Unit-wise Report', desc: 'Workers grouped by unit', icon: <Building2 className="text-green-600" size={32} />, color: 'green' },
    { id: 'contractor-report', title: 'Contractor-wise Report', desc: 'Workers by contractor/source', icon: <Briefcase className="text-purple-600" size={32} />, color: 'purple' },
    { id: 'department-report', title: 'Department-wise Report', desc: 'Workers by department', icon: <Users className="text-orange-600" size={32} />, color: 'orange' },
    { id: 'pf-report', title: 'PF/ESIC Report', desc: 'Workers with PF and ESIC details', icon: <UserCheck className="text-red-600" size={32} />, color: 'red' },
    { id: 'attendance-report', title: 'Attendance Report', desc: 'Monthly attendance summary', icon: <Calendar className="text-indigo-600" size={32} />, color: 'indigo' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reports</h2>
      <p className="text-gray-600">Click any report to download as Excel file. Reports include only workers from your assigned units.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white p-6 rounded-xl border hover:shadow-lg transition-shadow">
            {report.icon}
            <h3 className="font-bold text-lg mt-3">{report.title}</h3>
            <p className="text-gray-600 text-sm mt-2">{report.desc}</p>
            <button onClick={() => downloadReport(report.id, report.title)}
              disabled={loading}
              className={`mt-4 text-${report.color}-600 hover:underline flex items-center gap-1 disabled:opacity-50`}>
              <Download size={16} /> {loading ? 'Exporting...' : 'Export Excel'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ USER MANAGEMENT (Super Admin) ============
function UserManagementTab({ user }: { user: User }) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [toast, setToast] = useState<any>(null);
  const [units, setUnits] = useState<string[]>([]);
  const [form, setForm] = useState({ username: '', password: '', displayName: '', role: 'reviewer', units: [] as string[] });

  useEffect(() => { loadUsers(); loadUnits(); }, []);

  const loadUsers = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/users`);
      setUsers(await res.json());
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const loadUnits = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/units`);
      setUnits((await res.json()).map((u: any) => u.name));
    } catch { setUnits(['SVN-I', 'SVN-II', 'Sakar-I', 'Sakar-III']); }
  };

  const handleSubmit = async () => {
    try {
      if (editUser) {
        const body: any = { displayName: form.displayName, role: form.role, units: form.units, isActive: true };
        if (form.password) body.password = form.password;
        const res = await apiFetch(`${API_BASE}/users/${editUser.id}`, { method: 'PUT', body: JSON.stringify(body) });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
        setToast({ message: 'User updated!', type: 'success' });
      } else {
        const res = await apiFetch(`${API_BASE}/users`, { method: 'POST', body: JSON.stringify(form) });
        if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
        setToast({ message: 'User created!', type: 'success' });
      }
      setShowModal(false); setEditUser(null); loadUsers();
    } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
  };

  const handleEdit = (u: any) => {
    setEditUser(u);
    setForm({ username: u.username, password: '', displayName: u.displayName, role: u.role, units: u.units || [] });
    setShowModal(true);
  };

  const handleDeactivate = async (id: number) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await apiFetch(`${API_BASE}/users/${id}`, { method: 'DELETE' });
      setToast({ message: 'User deactivated', type: 'success' }); loadUsers();
    } catch { setToast({ message: 'Failed', type: 'error' }); }
  };

  const toggleUnit = (unit: string) => {
    setForm(f => ({
      ...f,
      units: f.units.includes(unit) ? f.units.filter(u => u !== unit) : [...f.units, unit]
    }));
  };

  const roleLabel = (role: string) => role === 'super_admin' ? '🌟 Super Admin' : role === 'hr' ? '👩‍💼 HR' : '👁 Reviewer';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button onClick={() => { setEditUser(null); setForm({ username: '', password: '', displayName: '', role: 'reviewer', units: [] }); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <UserPlus size={18} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Username</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Display Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Assigned Units</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8">Loading...</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.displayName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : u.role === 'hr' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                    {roleLabel(u.role)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{u.units?.includes('*') ? 'All Units' : u.units?.join(', ') || 'None'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(u)} className="p-1 hover:bg-blue-100 rounded"><Edit2 size={16} className="text-blue-600" /></button>
                    {u.username !== 'admin' && <button onClick={() => handleDeactivate(u.id)} className="p-1 hover:bg-red-100 rounded"><Trash2 size={16} className="text-red-600" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editUser ? 'Edit User' : 'Add User'}>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Username *</label>
            <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={!!editUser}
              className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100" /></div>
          <div><label className="block text-sm font-medium mb-1">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Display Name *</label>
            <input type="text" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Role *</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="super_admin">🌟 Super Admin — Full access to all units</option>
              <option value="hr">👩‍💼 HR — Add/Edit workers in assigned units</option>
              <option value="reviewer">👁 Reviewer — View-only access to assigned units</option>
            </select></div>
          <div>
            <label className="block text-sm font-medium mb-2">Assigned Units</label>
            {form.role === 'super_admin' ? (
              <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">Super Admin has access to ALL units automatically.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {units.map(u => (
                  <label key={u} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${form.units.includes(u) ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={form.units.includes(u)} onChange={() => toggleUnit(u)} className="rounded" />
                    {u}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
            <strong>Role Permissions:</strong>
            <ul className="mt-1 space-y-1">
              <li>• <strong>Super Admin:</strong> Full access — all units, all operations, user management, backup</li>
              <li>• <strong>HR:</strong> Add/Edit workers, mark attendance, import data — only in assigned units</li>
              <li>• <strong>Reviewer:</strong> View-only — dashboards, reports, export — only in assigned units</li>
            </ul>
          </div>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Save size={18} /> {editUser ? 'Update' : 'Create'}
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ============ IMPORT DATA ============
function ImportTab({ user }: { user: User }) {
  const [preview, setPreview] = useState<any>(null);
  const [filePath, setFilePath] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<any>(null);

  const handlePreview = async () => {
    if (!filePath) return;
    try {
      setLoading(true);
      const res = await apiFetch(`${API_BASE}/import/preview`, { method: 'POST', body: JSON.stringify({ filePath }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setPreview(await res.json());
    } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
    finally { setLoading(false); }
  };

  const handleImport = async () => {
    if (!filePath || !confirm('Import this data? Duplicates will be skipped.')) return;
    try {
      setLoading(true);
      const res = await apiFetch(`${API_BASE}/import/execute`, { method: 'POST', body: JSON.stringify({ filePath, skipDuplicates: true }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const data = await res.json();
      setToast({ message: `Imported: ${data.stats.new} new, ${data.stats.duplicates} duplicates`, type: 'success' });
      setPreview(null); setFilePath('');
    } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Import Excel Data</h2>
      <div className="bg-white p-6 rounded-xl border">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Excel File Path (on server)</label>
            <input type="text" value={filePath} onChange={(e) => setFilePath(e.target.value)}
              placeholder="D:\c drive\Desktop\Workforce- JULY-2026 - 18.8.26 .xlsm"
              className="w-full px-3 py-2 border rounded-lg" />
            <p className="text-xs text-gray-500 mt-1">Enter the full path to the Excel file on the computer running the server.</p>
          </div>
          <button onClick={handlePreview} disabled={!filePath || loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
            <Upload size={18} /> {loading ? 'Processing...' : 'Preview Import'}
          </button>
        </div>

        {preview && (
          <div className="mt-6 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-3">Import Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div className="bg-white p-3 rounded-lg border"><p className="text-2xl font-bold text-blue-600">{preview.summary.existingWorkers}</p><p className="text-xs text-gray-600">Existing</p></div>
                <div className="bg-white p-3 rounded-lg border"><p className="text-2xl font-bold text-green-600">{preview.summary.newWorkers}</p><p className="text-xs text-gray-600">New</p></div>
                <div className="bg-white p-3 rounded-lg border"><p className="text-2xl font-bold text-yellow-600">{preview.summary.duplicateWorkers}</p><p className="text-xs text-gray-600">Duplicates</p></div>
                <div className="bg-white p-3 rounded-lg border"><p className="text-2xl font-bold text-red-600">{preview.summary.invalidRecords}</p><p className="text-xs text-gray-600">Invalid</p></div>
                <div className="bg-white p-3 rounded-lg border"><p className="text-2xl font-bold text-purple-600">{preview.summary.finalTotal}</p><p className="text-xs text-gray-600">Final Total</p></div>
              </div>
            </div>
            <button onClick={handleImport} disabled={loading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium">
              {loading ? 'Importing...' : `✅ Confirm Import — Add ${preview.summary.newWorkers} New Workers`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ LEAVE CONTROL ============
function LeaveControlTab({ user }: { user: User }) {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [toast, setToast] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [leaveForm, setLeaveForm] = useState({ leave_type: 'casual', from_date: '', to_date: '', days: 1, reason: '' });
  const [workerDetail, setWorkerDetail] = useState<any>(null);
  const canEdit = user.role === 'super_admin' || user.role === 'hr';

  useEffect(() => { loadSummary(); }, [year]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/leave/summary?year=${year}`);
      setSummary(await res.json());
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const openLeaveModal = async (worker: any) => {
    setSelectedWorker(worker);
    try {
      const res = await apiFetch(`${API_BASE}/leave/balance/${worker.worker_code}?year=${year}`);
      const data = await res.json();
      if (data.isContractor) {
        setToast({ message: 'Leave management is only for company-roll workers', type: 'error' });
        return;
      }
      setWorkerDetail(data);
      setShowModal(true);
    } catch (error) { setToast({ message: 'Failed to load leave details', type: 'error' }); }
  };

  const applyLeave = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/leave/apply`, {
        method: 'POST',
        body: JSON.stringify({ worker_code: selectedWorker.worker_code, ...leaveForm })
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setToast({ message: 'Leave applied successfully', type: 'success' });
      setShowModal(false); loadSummary();
    } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Leave Control</h2>
        <div className="flex items-center gap-3">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="px-3 py-2 border rounded-lg">
            {Array.from({length: 8}, (_, i) => 2025 + i).map(y => <option key={y} value={y}>FY {y}-{String(y+1).slice(-2)}</option>)}
          </select>
          <button onClick={() => apiDownload(`${API_BASE}/export/leave-report?year=${year}`)} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"><Download size={16} /> Export Excel</button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800">
        ℹ️ Leave control applies to <strong>Company-roll workers only</strong>. Contractor workers are excluded.
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Unit</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Allocated</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Taken</th>
                <th className="px-4 py-3 text-center text-sm font-semibold">Remaining</th>
                {canEdit && <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="text-center py-8">Loading...</td></tr>
              ) : summary.length === 0 ? (
                <tr><td colSpan={canEdit ? 7 : 6} className="text-center py-8 text-gray-500">No company workers found</td></tr>
              ) : (
                summary.map((w) => (
                  <tr key={w.worker_code} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{w.worker_code}</td>
                    <td className="px-4 py-3 text-sm">{w.name}</td>
                    <td className="px-4 py-3 text-sm">{w.unit}</td>
                    <td className="px-4 py-3 text-sm text-center">{w.total_allocated}</td>
                    <td className="px-4 py-3 text-sm text-center font-medium text-orange-600">{w.total_taken}</td>
                    <td className="px-4 py-3 text-sm text-center font-bold ${w.remaining <= 3 ? 'text-red-600' : 'text-green-600'}">{w.remaining}</td>
                    {canEdit && (
                      <td className="px-4 py-3 text-sm">
                        <button onClick={() => openLeaveModal(w)} className="text-blue-600 hover:underline text-sm">Apply Leave</button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && workerDetail && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`Leave - ${workerDetail.worker.name}`}>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div><p className="text-2xl font-bold text-blue-600">{workerDetail.balance.total_allocated}</p><p className="text-xs text-gray-600">Allocated</p></div>
                <div><p className="text-2xl font-bold text-orange-600">{workerDetail.balance.total_taken}</p><p className="text-xs text-gray-600">Taken</p></div>
                <div><p className="text-2xl font-bold text-red-600">{workerDetail.balance.total_lwp}</p><p className="text-xs text-gray-600">LWP</p></div>
                <div><p className="text-2xl font-bold text-green-600">{workerDetail.balance.remaining}</p><p className="text-xs text-gray-600">Remaining</p></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Leave Type</label>
                <select value={leaveForm.leave_type} onChange={(e) => setLeaveForm({...leaveForm, leave_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="casual">Casual Leave</option><option value="sick">Sick Leave</option><option value="earned">Earned Leave</option><option value="lwp">LWP (Without Pay)</option>
                </select></div>
              <div><label className="block text-sm font-medium mb-1">Days</label>
                <input type="number" min={1} max={30} value={leaveForm.days} onChange={(e) => setLeaveForm({...leaveForm, days: parseInt(e.target.value) || 1})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">From Date</label>
                <input type="date" value={leaveForm.from_date} onChange={(e) => setLeaveForm({...leaveForm, from_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">To Date</label>
                <input type="date" value={leaveForm.to_date} onChange={(e) => setLeaveForm({...leaveForm, to_date: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Reason</label>
              <textarea value={leaveForm.reason} onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={applyLeave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Apply Leave</button>
            </div>
            {workerDetail.transactions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-bold mb-2">Leave History</h4>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr><th className="p-2 text-left">Type</th><th className="p-2 text-left">From</th><th className="p-2 text-left">To</th><th className="p-2 text-center">Days</th><th className="p-2 text-left">Status</th></tr></thead>
                    <tbody>{workerDetail.transactions.map((t: any) => (
                      <tr key={t.id} className="border-t"><td className="p-2">{t.leave_type}</td><td className="p-2">{t.from_date}</td><td className="p-2">{t.to_date}</td><td className="p-2 text-center">{t.days}</td><td className="p-2"><span className={`px-2 py-0.5 rounded-full text-xs ${t.status === 'approved' ? 'bg-green-100 text-green-700' : t.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span></td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ============ ATTRITION REPORT ============
function AttritionTab({ user }: { user: User }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState('');
  const [units, setUnits] = useState<string[]>([]);
  const [unitFilter, setUnitFilter] = useState('');

  useEffect(() => { loadUnits(); loadReport(); }, [year, month, unitFilter]);

  const loadUnits = async () => {
    try { const res = await apiFetch(`${API_BASE}/units`); setUnits((await res.json()).map((u: any) => u.name)); }
    catch { setUnits(user.units.includes('*') ? ['SVN-I', 'SVN-II', 'Sakar-I', 'Sakar-III'] : user.units); }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ year });
      if (month) params.set('month', month);
      if (unitFilter) params.set('unit', unitFilter);
      const res = await apiFetch(`${API_BASE}/attrition-report?${params}`);
      setData(await res.json());
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const availableUnits = user.units.includes('*') ? units : user.units.filter(u => units.includes(u));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Attrition Report</h2>
        <button onClick={() => { const p = new URLSearchParams({ year }); if (month) p.set('month', month); if (unitFilter) p.set('unit', unitFilter); apiDownload(`${API_BASE}/export/attrition-report?${p}`); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"><Download size={16} /> Export Excel</button>
      </div>
      <div className="bg-white p-4 rounded-xl border">
        <div className="flex flex-wrap gap-4 items-end">
          <div><label className="block text-sm font-medium mb-1">Year</label><select value={year} onChange={(e) => setYear(e.target.value)} className="px-3 py-2 border rounded-lg">{Array.from({length: 8}, (_, i) => 2025 + i).map(y => <option key={y} value={y}>FY {y}-{String(y+1).slice(-2)}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Month</label><select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border rounded-lg"><option value="">All Months</option>{['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Unit</label><select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)} className="px-3 py-2 border rounded-lg"><option value="">All Units</option>{availableUnits.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
        </div>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Worker Code</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Unit</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Source</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Joining Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Exit Date</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? <tr><td colSpan={9} className="text-center py-8">Loading...</td></tr>
              : data.length === 0 ? <tr><td colSpan={9} className="text-center py-8 text-gray-500">No attrition records found</td></tr>
              : data.map((w: any) => (
                <tr key={w.worker_code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{w.worker_code}</td>
                  <td className="px-4 py-3 text-sm">{w.name}</td>
                  <td className="px-4 py-3 text-sm">{w.unit}</td>
                  <td className="px-4 py-3 text-sm">{w.department}</td>
                  <td className="px-4 py-3 text-sm">{w.type}</td>
                  <td className="px-4 py-3 text-sm">{w.source}</td>
                  <td className="px-4 py-3 text-sm">{w.doj}</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-600">{w.exit_date}</td>
                  <td className="px-4 py-3 text-sm">{w.exit_reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t text-sm text-gray-600">Total exits: {data.length}</div>
      </div>
    </div>
  );
}

// ============ WAGE HISTORY ============
function WageHistoryTab({ user }: { user: User }) {
  const [searchCode, setSearchCode] = useState('');
  const [workerData, setWorkerData] = useState<any>(null);
  const [toast, setToast] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ effective_from: '', new_wage: 0, basic_wage: 0, hra: 0, other_allowance: 0, ctc: 0, change_type: 'revision', reason: '' });
  const canEdit = user.role === 'super_admin' || user.role === 'hr';

  const loadWorker = async () => {
    if (!searchCode) return;
    try {
      const res = await apiFetch(`${API_BASE}/wage-history/${searchCode}`);
      if (!res.ok) { const err = await res.json(); setToast({ message: err.error, type: 'error' }); return; }
      setWorkerData(await res.json());
    } catch { setToast({ message: 'Worker not found', type: 'error' }); }
  };

  const addRevision = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/wage-history`, { method: 'POST', body: JSON.stringify({ worker_code: searchCode, ...form }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setToast({ message: 'Wage revision saved', type: 'success' });
      setShowModal(false); loadWorker();
    } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Wage History</h2>
      <div className="bg-white p-4 rounded-xl border">
        <div className="flex gap-4 items-end">
          <div className="flex-1"><label className="block text-sm font-medium mb-1">Worker Code</label>
            <input type="text" value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase())} placeholder="e.g. SV2PBHA001" className="w-full px-3 py-2 border rounded-lg" /></div>
          <button onClick={loadWorker} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Search</button>
          {canEdit && workerData && <button onClick={() => { setForm({ effective_from: new Date().toISOString().slice(0, 10), new_wage: workerData.worker.total_wage || 0, basic_wage: 0, hra: 0, other_allowance: 0, ctc: 0, change_type: 'revision', reason: '' }); setShowModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">+ Add Revision</button>}
        </div>
      </div>
      {workerData && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border">
            <h3 className="font-bold mb-2">{workerData.worker.name} ({workerData.worker_code}) — Current Wage: ₹{workerData.worker.total_wage}</h3>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr><th className="px-4 py-3 text-left text-sm font-semibold">Effective From</th><th className="px-4 py-3 text-right text-sm font-semibold">Old Wage</th><th className="px-4 py-3 text-right text-sm font-semibold">New Wage</th><th className="px-4 py-3 text-left text-sm font-semibold">Type</th><th className="px-4 py-3 text-left text-sm font-semibold">Reason</th><th className="px-4 py-3 text-left text-sm font-semibold">Changed By</th></tr>
              </thead>
              <tbody className="divide-y">
                {workerData.history.length === 0 ? <tr><td colSpan={6} className="text-center py-6 text-gray-500">No wage history</td></tr>
                : workerData.history.map((h: any) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{h.effective_from}</td>
                    <td className="px-4 py-3 text-sm text-right">₹{h.old_wage}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-600">₹{h.new_wage}</td>
                    <td className="px-4 py-3 text-sm"><span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">{h.change_type}</span></td>
                    <td className="px-4 py-3 text-sm">{h.reason || '-'}</td>
                    <td className="px-4 py-3 text-sm">{h.changed_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Wage Revision">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Effective From *</label><input type="date" value={form.effective_from} onChange={(e) => setForm({...form, effective_from: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Change Type</label>
                <select value={form.change_type} onChange={(e) => setForm({...form, change_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="revision">Revision</option><option value="may_increment">May Increment</option><option value="november_increment">November Increment</option><option value="mid_month_revision">Mid-Month Revision</option>
                </select></div>
              <div><label className="block text-sm font-medium mb-1">New Total Wage (₹) *</label><input type="number" value={form.new_wage} onChange={(e) => setForm({...form, new_wage: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Basic Wage (₹)</label><input type="number" value={form.basic_wage} onChange={(e) => setForm({...form, basic_wage: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">HRA (₹)</label><input type="number" value={form.hra} onChange={(e) => setForm({...form, hra: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Other Allowance (₹)</label><input type="number" value={form.other_allowance} onChange={(e) => setForm({...form, other_allowance: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Reason / Remarks</label><textarea value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={addRevision} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Revision</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ============ INCREMENT MANAGEMENT ============
function IncrementTab({ user }: { user: User }) {
  const [searchCode, setSearchCode] = useState('');
  const [workerData, setWorkerData] = useState<any>(null);
  const [toast, setToast] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ increment_type: 'may', effective_from: '', new_wage: 0, reason: '' });
  const [allIncrements, setAllIncrements] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const canEdit = user.role === 'super_admin' || user.role === 'hr';

  useEffect(() => { loadAllIncrements(); }, [filterType, filterYear]);

  const loadAllIncrements = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      if (filterYear) params.set('year', filterYear);
      const res = await apiFetch(`${API_BASE}/increments?${params}`);
      setAllIncrements(await res.json());
    } catch (error) { console.error(error); }
  };

  const loadWorker = async () => {
    if (!searchCode) return;
    try {
      const res = await apiFetch(`${API_BASE}/increments/${searchCode}`);
      if (!res.ok) { const err = await res.json(); setToast({ message: err.error, type: 'error' }); return; }
      setWorkerData(await res.json());
    } catch { setToast({ message: 'Worker not found', type: 'error' }); }
  };

  const addIncrement = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/increments`, { method: 'POST', body: JSON.stringify({ worker_code: searchCode, ...form }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setToast({ message: `Increment saved! Amount: ₹${form.new_wage - (workerData?.worker?.total_wage || 0)}`, type: 'success' });
      setShowModal(false); loadWorker(); loadAllIncrements();
    } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Increment / Wage Revision</h2>

      <div className="bg-white p-4 rounded-xl border">
        <div className="flex gap-4 items-end">
          <div className="flex-1"><label className="block text-sm font-medium mb-1">Worker Code</label>
            <input type="text" value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase())} placeholder="e.g. SV2PBHA001" className="w-full px-3 py-2 border rounded-lg" /></div>
          <button onClick={loadWorker} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Search</button>
          {canEdit && workerData && <button onClick={() => {
            const today = new Date().toISOString().slice(0, 10);
            const month = today.slice(5, 7);
            setForm({ increment_type: month >= '05' && month <= '06' ? 'may' : month >= '11' || month <= '12' ? 'november' : 'special', effective_from: today, new_wage: workerData.worker.total_wage || 0, reason: '' });
            setShowModal(true);
          }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">+ Add Increment</button>}
        </div>
      </div>

      {workerData && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b"><h3 className="font-bold">{workerData.worker.name} ({workerData.worker_code}) — Current: ₹{workerData.worker.total_wage}</h3></div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="px-4 py-3 text-left text-sm font-semibold">Date</th><th className="px-4 py-3 text-left text-sm font-semibold">Type</th><th className="px-4 py-3 text-right text-sm font-semibold">Old</th><th className="px-4 py-3 text-right text-sm font-semibold">New</th><th className="px-4 py-3 text-right text-sm font-semibold">Amount</th><th className="px-4 py-3 text-right text-sm font-semibold">%</th><th className="px-4 py-3 text-left text-sm font-semibold">Reason</th></tr>
            </thead>
            <tbody className="divide-y">
              {workerData.increments.length === 0 ? <tr><td colSpan={7} className="text-center py-6 text-gray-500">No increment history</td></tr>
              : workerData.increments.map((inc: any) => (
                <tr key={inc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{inc.effective_from}</td>
                  <td className="px-4 py-3 text-sm"><span className={`px-2 py-0.5 rounded-full text-xs ${inc.increment_type === 'may' ? 'bg-green-100 text-green-700' : inc.increment_type === 'november' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{inc.increment_type}</span></td>
                  <td className="px-4 py-3 text-sm text-right">₹{inc.old_wage}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">₹{inc.new_wage}</td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">+₹{inc.increment_amount}</td>
                  <td className="px-4 py-3 text-sm text-right">{inc.increment_percentage}%</td>
                  <td className="px-4 py-3 text-sm">{inc.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold">All Increments</h3>
          <div className="flex gap-3">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm">
              <option value="">All Types</option><option value="may">May</option><option value="november">November</option><option value="special">Special</option>
            </select>
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm">
              {Array.from({length: 8}, (_, i) => 2025 + i).map(y => <option key={y} value={y}>FY {y}-{String(y+1).slice(-2)}</option>)}
            </select>
          </div>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-3 text-left text-sm font-semibold">Code</th><th className="px-4 py-3 text-left text-sm font-semibold">Name</th><th className="px-4 py-3 text-left text-sm font-semibold">Unit</th><th className="px-4 py-3 text-left text-sm font-semibold">Type</th><th className="px-4 py-3 text-left text-sm font-semibold">Date</th><th className="px-4 py-3 text-right text-sm font-semibold">Old</th><th className="px-4 py-3 text-right text-sm font-semibold">New</th><th className="px-4 py-3 text-right text-sm font-semibold">Amount</th></tr>
          </thead>
          <tbody className="divide-y">
            {allIncrements.length === 0 ? <tr><td colSpan={8} className="text-center py-6 text-gray-500">No increments found</td></tr>
            : allIncrements.map((inc: any) => (
              <tr key={inc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{inc.worker_code}</td>
                <td className="px-4 py-3 text-sm">{inc.name}</td>
                <td className="px-4 py-3 text-sm">{inc.unit}</td>
                <td className="px-4 py-3 text-sm"><span className={`px-2 py-0.5 rounded-full text-xs ${inc.increment_type === 'may' ? 'bg-green-100 text-green-700' : inc.increment_type === 'november' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{inc.increment_type}</span></td>
                <td className="px-4 py-3 text-sm">{inc.effective_from}</td>
                <td className="px-4 py-3 text-sm text-right">₹{inc.old_wage}</td>
                <td className="px-4 py-3 text-sm text-right font-bold">₹{inc.new_wage}</td>
                <td className="px-4 py-3 text-sm text-right text-green-600">+₹{inc.increment_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Increment">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Increment Type *</label>
                <select value={form.increment_type} onChange={(e) => setForm({...form, increment_type: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                  <option value="may">May Increment</option><option value="november">November Increment</option><option value="special">Special / Mid-Month</option>
                </select></div>
              <div><label className="block text-sm font-medium mb-1">Effective From *</label><input type="date" value={form.effective_from} onChange={(e) => setForm({...form, effective_from: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div className="col-span-2"><label className="block text-sm font-medium mb-1">New Wage (₹) *</label><input type="number" value={form.new_wage} onChange={(e) => setForm({...form, new_wage: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded-lg text-lg font-bold" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Reason / Remarks</label><textarea value={form.reason} onChange={(e) => setForm({...form, reason: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={2} placeholder="e.g. Annual increment, performance-based, etc." /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={addIncrement} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Increment</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ============ LOAN & RECOVERY ============
function LoanRecoveryTab({ user }: { user: User }) {
  const [searchCode, setSearchCode] = useState('');
  const [workerData, setWorkerData] = useState<any>(null);
  const [toast, setToast] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(5, 7));
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [form, setForm] = useState({ loan_amount: 0, loan_deduction: 0, advance_amount: 0, advance_deduction: 0, other_deductions: 0, outstanding_balance: 0, remarks: '' });
  const [summary, setSummary] = useState<any[]>([]);
  const [view, setView] = useState<'worker' | 'summary'>('worker');
  const canEdit = user.role === 'super_admin' || user.role === 'hr';

  const loadSummary = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/loan-recovery?month=${month}&year=${year}`);
      setSummary(await res.json());
    } catch (error) { console.error(error); }
  };

  useEffect(() => { if (view === 'summary') loadSummary(); }, [view, month, year]);

  const loadWorker = async () => {
    if (!searchCode) return;
    try {
      const res = await apiFetch(`${API_BASE}/loan-recovery/${searchCode}`);
      if (!res.ok) { const err = await res.json(); setToast({ message: err.error, type: 'error' }); return; }
      setWorkerData(await res.json());
    } catch { setToast({ message: 'Worker not found', type: 'error' }); }
  };

  const saveRecovery = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/loan-recovery`, { method: 'POST', body: JSON.stringify({ worker_code: searchCode, month, year: parseInt(year), ...form }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setToast({ message: 'Loan/Recovery saved', type: 'success' });
      setShowModal(false); loadWorker();
    } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
  };

  const totalRecovery = summary.reduce((sum: number, r: any) => sum + (r.loan_deduction||0) + (r.advance_deduction||0) + (r.other_deductions||0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Loans & Recovery</h2>
        <div className="flex gap-2">
          <button onClick={() => setView('worker')} className={`px-3 py-1.5 rounded-lg text-sm ${view==='worker' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Worker View</button>
          <button onClick={() => setView('summary')} className={`px-3 py-1.5 rounded-lg text-sm ${view==='summary' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Monthly Summary</button>
          <button onClick={() => apiDownload(`${API_BASE}/export/loan-recovery?month=${month}&year=${year}`)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-green-700"><Download size={14} /> Export</button>
        </div>
      </div>

      {view === 'worker' ? (
        <>
          <div className="bg-white p-4 rounded-xl border">
            <div className="flex gap-4 items-end">
              <div className="flex-1"><label className="block text-sm font-medium mb-1">Worker Code</label>
                <input type="text" value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase())} placeholder="e.g. SK1WK0001" className="w-full px-3 py-2 border rounded-lg" /></div>
              <button onClick={loadWorker} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Search</button>
              {canEdit && workerData && <button onClick={() => { setForm({ loan_amount: 0, loan_deduction: 0, advance_amount: 0, advance_deduction: 0, other_deductions: 0, outstanding_balance: 0, remarks: '' }); setShowModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">+ Add Entry</button>}
            </div>
          </div>
          {workerData && (
            <>
              <div className="bg-white p-4 rounded-xl border"><h3 className="font-bold">{workerData.worker.name} ({workerData.worker_code}) — {workerData.worker.unit}</h3></div>
              <div className="bg-white rounded-xl border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr><th className="px-4 py-3 text-left text-sm font-semibold">Month</th><th className="px-4 py-3 text-right text-sm font-semibold">Loan Amt</th><th className="px-4 py-3 text-right text-sm font-semibold">Loan Ded</th><th className="px-4 py-3 text-right text-sm font-semibold">Advance Amt</th><th className="px-4 py-3 text-right text-sm font-semibold">Advance Ded</th><th className="px-4 py-3 text-right text-sm font-semibold">Other Ded</th><th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {workerData.records.length === 0 ? <tr><td colSpan={7} className="text-center py-6 text-gray-500">No loan/recovery records</td></tr>
                    : workerData.records.map((r: any) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{r.month}/{r.year}</td>
                        <td className="px-4 py-3 text-sm text-right">₹{r.loan_amount}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">₹{r.loan_deduction}</td>
                        <td className="px-4 py-3 text-sm text-right">₹{r.advance_amount}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">₹{r.advance_deduction}</td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">₹{r.other_deductions}</td>
                        <td className="px-4 py-3 text-sm">{r.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="bg-white p-4 rounded-xl border">
            <div className="flex gap-4 items-end">
              <div><label className="block text-sm font-medium mb-1">Month</label><select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border rounded-lg">
                {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{m}</option>)}</select></div>
              <div><label className="block text-sm font-medium mb-1">Year</label><select value={year} onChange={(e) => setYear(e.target.value)} className="px-3 py-2 border rounded-lg">
                {Array.from({length: 8}, (_, i) => 2025 + i).map(y => <option key={y} value={y}>FY {y}-{String(y+1).slice(-2)}</option>)}</select></div>
              <button onClick={loadSummary} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Load</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border text-center"><p className="text-2xl font-bold text-blue-600">{summary.length}</p><p className="text-sm text-gray-600">Workers with Recovery</p></div>
            <div className="bg-white p-4 rounded-xl border text-center"><p className="text-2xl font-bold text-red-600">₹{totalRecovery.toLocaleString()}</p><p className="text-sm text-gray-600">Total Deductions</p></div>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr><th className="px-4 py-3 text-left text-sm font-semibold">Code</th><th className="px-4 py-3 text-left text-sm font-semibold">Name</th><th className="px-4 py-3 text-left text-sm font-semibold">Unit</th><th className="px-4 py-3 text-right text-sm font-semibold">Loan Ded</th><th className="px-4 py-3 text-right text-sm font-semibold">Advance Ded</th><th className="px-4 py-3 text-right text-sm font-semibold">Other Ded</th><th className="px-4 py-3 text-right text-sm font-semibold">Total</th></tr>
              </thead>
              <tbody className="divide-y">
                {summary.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{r.worker_code}</td>
                    <td className="px-4 py-3 text-sm">{r.name}</td>
                    <td className="px-4 py-3 text-sm">{r.unit}</td>
                    <td className="px-4 py-3 text-sm text-right">₹{r.loan_deduction||0}</td>
                    <td className="px-4 py-3 text-sm text-right">₹{r.advance_deduction||0}</td>
                    <td className="px-4 py-3 text-sm text-right">₹{r.other_deductions||0}</td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-red-600">₹{(r.loan_deduction||0)+(r.advance_deduction||0)+(r.other_deductions||0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Loan/Recovery Entry">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Worker: {searchCode} | Month: {month}/{year}</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Loan Amount (₹)</label><input type="number" value={form.loan_amount} onChange={(e) => setForm({...form, loan_amount: parseFloat(e.target.value)||0})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Loan Deduction (₹)</label><input type="number" value={form.loan_deduction} onChange={(e) => setForm({...form, loan_deduction: parseFloat(e.target.value)||0})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Advance Amount (₹)</label><input type="number" value={form.advance_amount} onChange={(e) => setForm({...form, advance_amount: parseFloat(e.target.value)||0})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Advance Deduction (₹)</label><input type="number" value={form.advance_deduction} onChange={(e) => setForm({...form, advance_deduction: parseFloat(e.target.value)||0})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Other Deductions (₹)</label><input type="number" value={form.other_deductions} onChange={(e) => setForm({...form, other_deductions: parseFloat(e.target.value)||0})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Outstanding Balance (₹)</label><input type="number" value={form.outstanding_balance} onChange={(e) => setForm({...form, outstanding_balance: parseFloat(e.target.value)||0})} className="w-full px-3 py-2 border rounded-lg" /></div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Remarks</label><textarea value={form.remarks} onChange={(e) => setForm({...form, remarks: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveRecovery} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
            </div>
          </div>
        </Modal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ============ PAY SLIP ============
function PaySlipTab({ user }: { user: User }) {
  const [searchCode, setSearchCode] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(5, 7));
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [payslip, setPayslip] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [view, setView] = useState<'single' | 'bulk'>('single');
  const canEdit = user.role === 'super_admin' || user.role === 'hr';

  const loadPayslip = async () => {
    if (!searchCode) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/payslip/${searchCode}?month=${month}&year=${year}`);
      if (!res.ok) { const err = await res.json(); setPayslip(null); alert(err.error); return; }
      setPayslip(await res.json());
    } catch { setPayslip(null); }
    finally { setLoading(false); }
  };

  const loadBulk = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/payslips?month=${month}&year=${year}`);
      setPayslips(await res.json());
    } catch { setPayslips([]); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pay Slips</h2>
        <div className="flex gap-2">
          <button onClick={() => setView('single')} className={`px-3 py-1.5 rounded-lg text-sm ${view==='single' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Single Payslip</button>
          <button onClick={() => { setView('bulk'); loadBulk(); }} className={`px-3 py-1.5 rounded-lg text-sm ${view==='bulk' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Bulk Payslips</button>
          <button onClick={() => apiDownload(`${API_BASE}/export/payslips?month=${month}&year=${year}`)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-green-700"><Download size={14} /> Export</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border">
        <div className="flex gap-4 items-end">
          <div><label className="block text-sm font-medium mb-1">Month</label><select value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-2 border rounded-lg">
            {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => <option key={m} value={m}>{m}</option>)}</select></div>
          <div><label className="block text-sm font-medium mb-1">Year</label><select value={year} onChange={(e) => setYear(e.target.value)} className="px-3 py-2 border rounded-lg">
            {Array.from({length: 8}, (_, i) => 2025 + i).map(y => <option key={y} value={y}>FY {y}-{String(y+1).slice(-2)}</option>)}</select></div>
          {view === 'single' && (
            <><div className="flex-1"><label className="block text-sm font-medium mb-1">Worker Code</label>
              <input type="text" value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase())} placeholder="e.g. SK1WK0001" className="w-full px-3 py-2 border rounded-lg" /></div>
            <button onClick={loadPayslip} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">Generate</button></>
          )}
          {view === 'bulk' && <button onClick={loadBulk} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">Generate All</button>}
        </div>
      </div>

      {view === 'single' && payslip && (
        <div className="bg-white rounded-xl border p-6">
          <div className="text-center border-b pb-4 mb-4">
            <h3 className="text-lg font-bold">{payslip.unit?.company_name || 'SVN-Sakar Group'}</h3>
            <p className="text-sm text-gray-600">{payslip.unit?.address ? payslip.unit.address + ', ' : ''}{payslip.unit?.city || ''}{payslip.unit?.state ? ', ' + payslip.unit.state : ''}</p>
            <p className="text-sm font-medium mt-1">Pay Slip for {payslip.month}/{payslip.year}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><strong>Worker:</strong> {payslip.worker.worker_code} — {payslip.worker.name}</div>
            <div><strong>Unit:</strong> {payslip.worker.unit}</div>
            <div><strong>Department:</strong> {payslip.worker.department || '-'}</div>
            <div><strong>Type:</strong> {payslip.worker.type}</div>
            <div><strong>DOJ:</strong> {payslip.worker.doj || '-'}</div>
            <div><strong>UAN:</strong> {payslip.worker.uan || '-'}</div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-green-700 mb-2">Earnings</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td>Basic</td><td className="text-right">₹{payslip.earnings.basic}</td></tr>
                  <tr><td>HRA</td><td className="text-right">₹{payslip.earnings.hra}</td></tr>
                  <tr><td>Other Allowance</td><td className="text-right">₹{payslip.earnings.other_allowance}</td></tr>
                  <tr><td>OT ({payslip.attendance.ot_hours} hrs)</td><td className="text-right">₹{payslip.earnings.ot}</td></tr>
                  <tr className="font-bold border-t"><td>Gross Earnings</td><td className="text-right">₹{payslip.earnings.gross}</td></tr>
                </tbody>
              </table>
            </div>
            <div>
              <h4 className="font-bold text-red-700 mb-2">Deductions</h4>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td>Loan Deduction</td><td className="text-right">₹{payslip.deductions.loan}</td></tr>
                  <tr><td>Advance Deduction</td><td className="text-right">₹{payslip.deductions.advance}</td></tr>
                  <tr><td>Other Deductions</td><td className="text-right">₹{payslip.deductions.other}</td></tr>
                  <tr><td>LWP ({payslip.attendance.lwp} days)</td><td className="text-right">₹{payslip.deductions.lwp}</td></tr>
                  {payslip.worker.pf_flag === 'YES' && <tr><td>PF (12%)</td><td className="text-right">₹{payslip.deductions.pf}</td></tr>}
                  {payslip.worker.esic_flag === 'YES' && <tr><td>ESIC (0.75%)</td><td className="text-right">₹{payslip.deductions.esic}</td></tr>}
                  <tr className="font-bold border-t"><td>Total Deductions</td><td className="text-right">₹{payslip.deductions.total}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-lg font-bold text-blue-700">Net Pay: ₹{payslip.net_pay}</p>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-4 text-sm text-gray-600">
            <div>Present: {payslip.attendance.present}</div>
            <div>Absent: {payslip.attendance.absent}</div>
            <div>Leave: {payslip.attendance.leave}</div>
            <div>Weekly Off: {payslip.attendance.weekly_off}</div>
          </div>
        </div>
      )}

      {view === 'bulk' && payslips.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr><th className="px-4 py-3 text-left text-sm font-semibold">Code</th><th className="px-4 py-3 text-left text-sm font-semibold">Name</th><th className="px-4 py-3 text-left text-sm font-semibold">Unit</th><th className="px-4 py-3 text-right text-sm font-semibold">Gross</th><th className="px-4 py-3 text-right text-sm font-semibold">Deductions</th><th className="px-4 py-3 text-right text-sm font-semibold font-bold">Net Pay</th></tr>
            </thead>
            <tbody className="divide-y">
              {payslips.map((p: any) => (
                <tr key={p.worker_code} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{p.worker_code}</td>
                  <td className="px-4 py-3 text-sm">{p.name}</td>
                  <td className="px-4 py-3 text-sm">{p.unit}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{p.gross}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">₹{p.total_deductions}</td>
                  <td className="px-4 py-3 text-sm text-right font-bold">₹{p.net_pay}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t bg-gray-50 text-right">
            <span className="text-sm text-gray-600">Total Net Pay: </span>
            <span className="font-bold text-lg">₹{payslips.reduce((sum: number, p: any) => sum + p.net_pay, 0).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ GROUP BACKUP ============
function BackupTab({ user }: { user: User }) {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<any>(null);
  const [backupResult, setBackupResult] = useState<any>(null);

  useEffect(() => { loadBackups(); }, []);

  const loadBackups = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/backup/list`);
      setBackups(await res.json());
    } catch { console.error('Failed to load backups'); }
  };

  const createBackup = async () => {
    if (!confirm('Create a full backup of all Workerforce data?')) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/backup/group`, { method: 'POST' });
      if (!res.ok) throw new Error('Backup failed');
      const data = await res.json();
      setBackupResult(data);
      setToast({ message: 'Full backup created successfully!', type: 'success' });
      loadBackups();
    } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
    finally { setLoading(false); }
  };

  const restoreBackup = async (fileName: string) => {
    if (!confirm(`RESTORE from ${fileName}? This will OVERWRITE all current data. A safety backup will be created first.`)) return;
    if (!confirm('Are you REALLY sure? This action cannot be undone easily.')) return;
    try {
      const res = await apiFetch(`${API_BASE}/backup/restore-group`, { method: 'POST', body: JSON.stringify({ backupFile: fileName }) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      setToast({ message: 'Database restored! Please refresh the page.', type: 'success' });
    } catch (err: any) { setToast({ message: err.message, type: 'error' }); }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Group Backup & Restore</h2>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-sm text-blue-800"><strong>Full Group Backup</strong> creates two files:</p>
        <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
          <li><strong>.db file</strong> — Complete SQLite database (can restore everything)</li>
          <li><strong>.xlsx file</strong> — Excel with all workers, attendance, leave, wages, loans, increments, users, contractors, audit log</li>
        </ul>
      </div>

      <button onClick={createBackup} disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium">
        <Database size={20} /> {loading ? 'Creating Backup...' : 'Create Full Group Backup'}
      </button>

      {backupResult && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <h3 className="font-bold text-green-800 mb-2">✅ Backup Created</h3>
          <div className="grid grid-cols-2 gap-4">
            {backupResult.files.map((f: any, i: number) => (
              <div key={i} className="bg-white p-3 rounded border">
                <p className="font-medium text-sm">{f.name}</p>
                <p className="text-xs text-gray-500">{f.type} — {f.size}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
            <div>Workers: {backupResult.summary.workers}</div>
            <div>Attendance: {backupResult.summary.attendance}</div>
            <div>Leave: {backupResult.summary.leaveRecords}</div>
            <div>Wage History: {backupResult.summary.wageHistory}</div>
            <div>Loans: {backupResult.summary.loanRecovery}</div>
            <div>Increments: {backupResult.summary.increments}</div>
            <div>Users: {backupResult.summary.users}</div>
            <div>Audit: {backupResult.summary.auditEntries}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b"><h3 className="font-bold">Previous Backups</h3></div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr><th className="px-4 py-3 text-left text-sm font-semibold">File</th><th className="px-4 py-3 text-left text-sm font-semibold">Type</th><th className="px-4 py-3 text-left text-sm font-semibold">Size</th><th className="px-4 py-3 text-left text-sm font-semibold">Date</th><th className="px-4 py-3 text-left text-sm font-semibold">Action</th></tr>
          </thead>
          <tbody className="divide-y">
            {backups.length === 0 ? <tr><td colSpan={5} className="text-center py-6 text-gray-500">No backups yet</td></tr>
            : backups.map((b: any) => (
              <tr key={b.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium">{b.name}</td>
                <td className="px-4 py-3 text-sm"><span className={`px-2 py-0.5 rounded-full text-xs ${b.type === 'Database' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{b.type}</span></td>
                <td className="px-4 py-3 text-sm">{b.size}</td>
                <td className="px-4 py-3 text-sm">{new Date(b.date).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm">
                  {b.type === 'Database' && <button onClick={() => restoreBackup(b.name)} className="text-orange-600 hover:underline text-sm">Restore</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
        <strong>⚠️ Important:</strong> Always create a backup before making major changes. The restore function will overwrite all current data. A safety backup is automatically created before each restore.
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// ============ MAIN APP ============
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const savedUser = localStorage.getItem('worker_erp_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { /* ignore */ }
    }
  }, []);

  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    authToken = token;
  };

  const handleLogout = async () => {
    try { await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST' }); } catch { /* ignore */ }
    localStorage.removeItem('worker_erp_token');
    localStorage.removeItem('worker_erp_user');
    authToken = '';
    setUser(null);
  };

  if (!user) return <LoginPage onLogin={handleLogin} />;

  const isAdmin = user.role === 'super_admin';
  const canEdit = user.role === 'super_admin' || user.role === 'hr';

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={20} /> },
    { id: 'workers', label: 'Worker Master', icon: <Users size={20} /> },
    { id: 'attendance', label: 'Attendance', icon: <ClipboardList size={20} /> },
    { id: 'leave', label: 'Leave Control', icon: <Calendar size={20} /> },
    { id: 'wage-history', label: 'Wage History', icon: <TrendingUp size={20} /> },
    { id: 'increments', label: 'Increments', icon: <TrendingUp size={20} /> },
    { id: 'attrition', label: 'Attrition Report', icon: <FileText size={20} /> },
    { id: 'loans', label: 'Loans & Recovery', icon: <Briefcase size={20} /> },
    { id: 'payslips', label: 'Pay Slips', icon: <FileText size={20} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
  ];

  if (canEdit) tabs.push({ id: 'import', label: 'Import Data', icon: <Upload size={20} /> });
  if (isAdmin) tabs.push({ id: 'users', label: 'User Management', icon: <Shield size={20} /> });
  if (isAdmin) tabs.push({ id: 'backup', label: 'Group Backup', icon: <Database size={20} /> });

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={28} />
              <div>
                <h1 className="text-xl font-bold">SVN-Sakar Group Workerforce</h1>
                <p className="text-blue-200 text-xs">SVN-Sakar Group</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-blue-200">{user.units.includes('*') ? 'All Units' : user.units.join(', ')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'super_admin' ? 'bg-purple-500' : user.role === 'hr' ? 'bg-green-500' : 'bg-gray-500'}`}>
                  {user.role === 'super_admin' ? 'Admin' : user.role === 'hr' ? 'HR' : 'Reviewer'}
                </span>
                <button onClick={handleLogout} className="p-2 hover:bg-white/20 rounded-lg" title="Logout">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-6">
          <nav className="md:w-56 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border p-3 space-y-1">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    activeTab === tab.id ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-50 text-gray-700'
                  }`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </nav>

          <main className="flex-1 min-w-0">
            {activeTab === 'dashboard' && <DashboardTab user={user} />}
            {activeTab === 'workers' && <WorkerMasterTab user={user} />}
            {activeTab === 'attendance' && <AttendanceTab user={user} />}
            {activeTab === 'reports' && <ReportsTab user={user} />}
            {activeTab === 'leave' && <LeaveControlTab user={user} />}
            {activeTab === 'wage-history' && <WageHistoryTab user={user} />}
            {activeTab === 'increments' && <IncrementTab user={user} />}
            {activeTab === 'attrition' && <AttritionTab user={user} />}
            {activeTab === 'loans' && <LoanRecoveryTab user={user} />}
            {activeTab === 'payslips' && <PaySlipTab user={user} />}
            {activeTab === 'import' && canEdit && <ImportTab user={user} />}
            {activeTab === 'users' && isAdmin && <UserManagementTab user={user} />}
            {activeTab === 'backup' && isAdmin && <BackupTab user={user} />}
          </main>
        </div>
      </div>
    </div>
  );
}
