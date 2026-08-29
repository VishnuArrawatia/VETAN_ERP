import { useState, useEffect } from 'react';
import { Gift, Download, Calendar, TrendingUp, Users, IndianRupee } from 'lucide-react';

interface BonusRegisterProps {
  activeMonth: string;
  activeCompany: string;
  employees: any[];
}

export default function BonusRegister({ activeMonth, activeCompany, employees }: BonusRegisterProps) {
  const [bonusData, setBonusData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [fy, setFy] = useState('2026-27');
  const [payMonth, setPayMonth] = useState('');

  const months = [
    { key: '2026-04', label: 'Apr 2026' }, { key: '2026-05', label: 'May 2026' },
    { key: '2026-06', label: 'Jun 2026' }, { key: '2026-07', label: 'Jul 2026' },
    { key: '2026-08', label: 'Aug 2026' }, { key: '2026-09', label: 'Sep 2026' },
    { key: '2026-10', label: 'Oct 2026 (Diwali Payout)' }, { key: '2026-11', label: 'Nov 2026' },
    { key: '2026-12', label: 'Dec 2026' }, { key: '2027-01', label: 'Jan 2027' },
    { key: '2027-02', label: 'Feb 2027' }, { key: '2027-03', label: 'Mar 2027' },
  ];

  useEffect(() => {
    fetchBonus();
  }, [activeMonth, activeCompany]);

  const fetchBonus = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bonus-register?month=${activeMonth}&company=${activeCompany}`);
      const data = await res.json();
      setBonusData(data);
    } catch (e) {
      console.error('Bonus fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePayBonus = async () => {
    if (!payMonth) {
      alert('Please select payout month (e.g. October for Diwali)');
      return;
    }
    if (!confirm(`Pay accumulated bonus for ALL employees in ${payMonth}?\nThis will mark all ACCUMULATED bonuses as PAID.`)) return;
    
    try {
      const res = await fetch('/api/bonus-register/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: payMonth, company: activeCompany })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Bonus paid for ${data.paid_count || 0} employees!`);
        fetchBonus();
      } else {
        alert('Error: ' + (data.error || 'Unknown'));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/bonus-register?month=${activeMonth}&company=${activeCompany}`);
      const data = await res.json();
      if (!data.employees || data.bonusList.length === 0) {
        alert('No bonus data found');
        return;
      }
      
      const headers = ['Employee Code', 'Employee Name', 'Unit', 'Department', 'Basic Salary', 'Bonus Rate %', 'Monthly Bonus', 'Months Accumulated', 'Total Accumulated', 'Status'];
      const rows = data.bonusList.map((e: any) => [
        e.employee_code || e.employee_id, e.employee_name, e.company, e.department,
        e.base_salary, e.bonus_rate, e.monthly_bonus, e.months_accumulated || 1,
        e.total_accumulated || e.monthly_bonus, e.month_status || 'ACCUMULATED'
      ]);
      
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bonus_Register_${activeMonth}_${activeCompany}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Export error: ' + e.message);
    }
  };

  const bonusList = bonusData?.employees || [];
  const totalAccumulated = bonusList.reduce((s: number, e: any) => s + (e.total_accumulated || e.monthly_bonus || 0), 0);
  const totalMonthly = bonusList.reduce((s: number, e: any) => s + (e.monthly_bonus || 0), 0);
  const accumulatedCount = bonusList.filter((e: any) => e.month_status === 'ACCUMULATED').length;
  const paidCount = bonusList.filter((e: any) => e.month_status === 'PAID').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <Gift size={24} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900">🎁 Bonus Register</h2>
              <p className="text-xs text-gray-500">
                Monthly accumulation: <strong>8.33% of Basic</strong> | FY {fy} | 
                Paid annually on <strong>Diwali (Oct)</strong>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-xl transition cursor-pointer">
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-blue-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Employees</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{bonusList.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-amber-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Accumulated</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-700">{accumulatedCount}</p>
          <p className="text-[10px] text-slate-400">Pending Diwali payout</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={16} className="text-emerald-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">This Month Bonus</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700">₹{totalMonthly.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400">8.33% of Basic × {bonusList.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={16} className="text-purple-600" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Total Accumulated FY</span>
          </div>
          <p className="text-2xl font-extrabold text-purple-700">₹{totalAccumulated.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-slate-400">{paidCount} paid, {accumulatedCount} pending</p>
        </div>
      </div>

      {/* Diwali Payout Button */}
      <div className="bg-gradient-to-r from-orange-100 to-red-50 border border-orange-300 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-orange-800">🎇 Diwali Bonus Payout</h3>
            <p className="text-[11px] text-orange-600">
              Mark all accumulated bonuses as PAID. Typically done in <strong>October</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={payMonth}
              onChange={(e) => setPayMonth(e.target.value)}
              className="px-3 py-2 border border-orange-300 rounded-lg text-xs font-bold"
            >
              <option value="">Select Payout Month</option>
              {months.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
            <button
              onClick={handlePayBonus}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold rounded-xl shadow transition cursor-pointer"
            >
              🎁 Pay Bonus
            </button>
          </div>
        </div>
      </div>

      {/* Bonus Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">#</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Code</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Name</th>
                <th className="px-3 py-2.5 text-left font-extrabold text-slate-700">Unit</th>
                <th className="px-3 py-2.5 text-right font-extrabold text-slate-700">Basic ₹</th>
                <th className="px-3 py-2.5 text-center font-extrabold text-slate-700">Rate</th>
                <th className="px-3 py-2.5 text-right font-extrabold text-slate-700">Monthly Bonus ₹</th>
                <th className="px-3 py-2.5 text-right font-extrabold text-slate-700">Accumulated ₹</th>
                <th className="px-3 py-2.5 text-center font-extrabold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : bonusList.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No bonus data. Process payroll first to generate bonus provisions.</td></tr>
              ) : (
                bonusList.map((emp: any, i: number) => (
                  <tr key={emp.employee_id || i} className="border-t border-slate-100 hover:bg-orange-50/30">
                    <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2 font-mono font-bold text-slate-700">{emp.employee_code || emp.employee_id}</td>
                    <td className="px-3 py-2 font-semibold text-slate-900">{emp.employee_name}</td>
                    <td className="px-3 py-2 text-slate-600">{emp.company}</td>
                    <td className="px-3 py-2 text-right font-mono">₹{(emp.base_salary || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-center font-mono text-orange-600 font-bold">{emp.bonus_rate}%</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-emerald-700">₹{(emp.monthly_bonus || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-purple-700">₹{(emp.total_accumulated || emp.monthly_bonus || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                        emp.month_status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {emp.month_status === 'PAID' ? '✅ PAID' : '⏳ ACCUMULATED'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {bonusList.length > 0 && (
              <tfoot className="bg-slate-100 sticky bottom-0">
                <tr className="font-extrabold">
                  <td colSpan={4} className="px-3 py-2.5 text-right text-slate-700">TOTAL</td>
                  <td className="px-3 py-2.5 text-right font-mono">₹{bonusList.reduce((s: number, e: any) => s + (e.base_salary || 0), 0).toLocaleString('en-IN')}</td>
                  <td></td>
                  <td className="px-3 py-2.5 text-right font-mono text-emerald-700">₹{totalMonthly.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-purple-700">₹{totalAccumulated.toLocaleString('en-IN')}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-extrabold text-slate-700 mb-2">📋 How Bonus Works (Payment of Bonus Act)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-slate-600">
          <div className="flex items-start gap-2">
            <span className="text-lg">1️⃣</span>
            <div><strong>Monthly Accumulation:</strong> Every month, 8.33% of Basic Salary is accumulated as bonus provision.</div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">2️⃣</span>
            <div><strong>During FY:</strong> Bonus stays as ACCUMULATED. It is NOT paid monthly — only provisioned.</div>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-lg">3️⃣</span>
            <div><strong>Diwali Payout (Oct):</strong> All accumulated bonus is paid at once. Click "Pay Bonus" to mark as PAID.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
