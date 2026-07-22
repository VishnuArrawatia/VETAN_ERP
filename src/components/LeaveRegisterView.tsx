/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { 
  Printer, 
  Search, 
  Building, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  Download,
  FileText,
  AlertCircle,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { Employee, LeaveApplication, Attendance } from '../types';

interface LeaveRegisterViewProps {
  employees: Employee[];
  applications: LeaveApplication[];
  attendance: Attendance[];
  activeCompany: string;
}

export default function LeaveRegisterView({ 
  employees, 
  applications, 
  attendance, 
  activeCompany 
}: LeaveRegisterViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'register' | 'exceptions'>('register');
  
  // Custom print ref
  const printRef = useRef<HTMLDivElement>(null);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchCompany = activeCompany === 'ALL' || activeCompany === 'GROUP' || activeCompany === 'COMBINED' || emp.company === activeCompany;
      const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.department.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCompany && matchSearch;
    });
  }, [employees, activeCompany, searchTerm]);

  // Compute stats for each employee
  const employeeLeaveDetails = useMemo(() => {
    return filteredEmployees.map(emp => {
      // Approved leaves
      const empApps = applications.filter(app => app.employee_id === emp.id && app.status === 'APPROVED');
      const pendingApps = applications.filter(app => app.employee_id === emp.id && (app.status === 'PENDING' || app.status === 'PENDING_HOD' || app.status === 'PENDING_HR'));

      // Month-wise availed leaves for current FY (assuming April 2026 - March 2027)
      const months = [
        { name: 'Apr', filter: '2026-04' },
        { name: 'May', filter: '2026-05' },
        { name: 'Jun', filter: '2026-06' },
        { name: 'Jul', filter: '2026-07' },
        { name: 'Aug', filter: '2026-08' },
        { name: 'Sep', filter: '2026-09' },
        { name: 'Oct', filter: '2026-10' },
        { name: 'Nov', filter: '2026-11' },
        { name: 'Dec', filter: '2026-12' },
        { name: 'Jan', filter: '2027-01' },
        { name: 'Feb', filter: '2027-02' },
        { name: 'Mar', filter: '2027-03' }
      ];

      const monthAvailed: Record<string, number> = {};
      months.forEach(m => {
        const leavesInMonth = empApps.filter(app => app.start_date.startsWith(m.filter));
        monthAvailed[m.name] = leavesInMonth.reduce((sum, app) => sum + app.days, 0);
      });

      const totalAvailed = empApps.reduce((sum, app) => sum + app.days, 0);
      const totalPending = pendingApps.reduce((sum, app) => sum + app.days, 0);

      // Simple Trend array for trend visual
      const trendData = months.map(m => monthAvailed[m.name]);

      return {
        employee: emp,
        opening_pl: 15, // standard opening balances for display
        opening_cl: 7,
        opening_sl: 8,
        total_opening: 30,
        monthAvailed,
        totalAvailed,
        totalPending,
        current_pl: emp.leave_balance_pl,
        current_cl: emp.leave_balance_cl,
        current_sl: emp.leave_balance_sl,
        total_current: emp.leave_balance_pl + emp.leave_balance_cl + emp.leave_balance_sl,
        trendData
      };
    });
  }, [filteredEmployees, applications]);

  // Compute Exception reporting
  // Compare "Attendance Leave Days" vs. "Leave Card Leave Availed"
  const exceptions = useMemo(() => {
    const list: Array<{
      id: string;
      employee_id: string;
      name: string;
      company: string;
      department: string;
      month: string;
      attendance_leave_days: number;
      leave_register_days: number;
      discrepancy: number;
      status: 'CRITICAL_MISMATCH' | 'WARNING_UNRECORDED';
      message: string;
    }> = [];

    filteredEmployees.forEach(emp => {
      // Find all attendance records for this employee
      const empAtt = attendance.filter(a => a.employee_id === emp.id);

      empAtt.forEach(att => {
        // Attendance Leave Days is 'leave' + 'lwp' from the attendance sheet
        const attLeave = Number(att.leave || 0);
        
        // Find approved leave application days in this employee's month
        // We look for leaves matching the month formatted like "2026-07"
        const targetMonthYear = att.month; // e.g. "2026-07"
        const monthlyApprovedLeaves = applications.filter(app => 
          app.employee_id === emp.id && 
          app.status === 'APPROVED' && 
          app.start_date.startsWith(targetMonthYear)
        );

        const regLeaveDays = monthlyApprovedLeaves.reduce((sum, l) => sum + l.days, 0);

        if (attLeave !== regLeaveDays) {
          const discrepancy = attLeave - regLeaveDays;
          if (discrepancy > 0) {
            list.push({
              id: `${emp.id}-${att.month}`,
              employee_id: emp.id,
              name: emp.name,
              company: emp.company,
              department: emp.department,
              month: att.month,
              attendance_leave_days: attLeave,
              leave_register_days: regLeaveDays,
              discrepancy,
              status: 'WARNING_UNRECORDED',
              message: `Leave Register Not Updated (${discrepancy} Day${discrepancy > 1 ? 's' : ''} Availed in Attendance, but 0 entered in Leave Register)`
            });
          } else if (discrepancy < 0) {
            list.push({
              id: `${emp.id}-${att.month}`,
              employee_id: emp.id,
              name: emp.name,
              company: emp.company,
              department: emp.department,
              month: att.month,
              attendance_leave_days: attLeave,
              leave_register_days: regLeaveDays,
              discrepancy: Math.abs(discrepancy),
              status: 'CRITICAL_MISMATCH',
              message: `Approved leave register has ${regLeaveDays} days, but monthly attendance upload has ${attLeave} days.`
            });
          }
        }
      });
    });

    return list;
  }, [filteredEmployees, attendance, applications]);

  // Selected Employee Details
  const activeDetails = useMemo(() => {
    if (!selectedEmpId) return null;
    return employeeLeaveDetails.find(d => d.employee.id === selectedEmpId) || null;
  }, [selectedEmpId, employeeLeaveDetails]);

  // Handle direct print of Leave Card
  const handlePrintCard = (empId: string) => {
    const printContent = document.getElementById(`leave-card-print-${empId}`);
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Employee Leave Card</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        body { font-family: 'Inter', sans-serif; padding: 30px; color: #1e293b; line-height: 1.5; }
        .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
        .header { display: flex; justify-content: space-between; align-items: center; border-b: 2px solid #f1f5f9; padding-bottom: 16px; margin-bottom: 16px; }
        .title { font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; color: #0f172a; }
        .grid { display: grid; grid-cols: 2; gap: 12px; margin-bottom: 16px; }
        .info-item { font-size: 13px; }
        .label { font-weight: bold; color: #64748b; }
        .table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        .table th, .table td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
        .table th { bg-color: #f8fafc; font-weight: bold; }
        .badge { display: inline-block; padding: 2px 6px; font-size: 11px; font-weight: bold; border-radius: 4px; }
        .badge-pl { background: #ecfdf5; color: #065f46; }
        .badge-cl { background: #eff6ff; color: #1e40af; }
        .badge-sl { background: #fff1f2; color: #9f1239; }
        .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 12px; }
      `);
      printWindow.document.write('</style></head><body>');
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Section / Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-bold text-gray-950 font-display text-base tracking-tight flex items-center gap-2">
            <Calendar className="text-emerald-600" size={18} />
            HR Leave Register & Card Generator
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Durable leave balances tracker, historical trend auditing, and automated Attendance Upload exception mapping.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveView('register')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'register' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-gray-500 hover:text-slate-900'
            }`}
          >
            Leave Register
          </button>
          <button 
            onClick={() => setActiveView('exceptions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'exceptions' 
                ? 'bg-white text-rose-700 shadow-xs' 
                : 'text-gray-500 hover:text-slate-900'
            }`}
          >
            Exception Audit
            {exceptions.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {activeView === 'register' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main List & Summary */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input 
                type="text"
                placeholder="Search staff by Employee ID, Name or Department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Leave Register Grid */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 font-display select-none">
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase">Employee Details</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Opening (PL / CL / SL)</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Availed Month-Wise</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Total Availed</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-center">Current Balance</th>
                      <th className="p-4 text-[10px] font-bold text-gray-400 uppercase text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {employeeLeaveDetails.map((row) => (
                      <tr 
                        key={row.employee.id} 
                        className={`hover:bg-gray-50/40 transition cursor-pointer ${
                          selectedEmpId === row.employee.id ? 'bg-emerald-50/20' : ''
                        }`}
                        onClick={() => setSelectedEmpId(row.employee.id)}
                      >
                        <td className="p-4">
                          <div>
                            <span className="text-xs font-bold text-gray-950 block">{row.employee.name}</span>
                            <span className="text-[10px] text-gray-400 block font-mono mt-0.5">{row.employee.id} • {row.employee.department}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex gap-1.5 text-[10px] font-mono">
                            <span className="bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded" title="Opening PL">PL:{row.opening_pl}</span>
                            <span className="bg-blue-50 text-blue-800 font-bold px-1.5 py-0.5 rounded" title="Opening CL">CL:{row.opening_cl}</span>
                            <span className="bg-rose-50 text-rose-800 font-bold px-1.5 py-0.5 rounded" title="Opening SL">SL:{row.opening_sl}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {/* Micro trend sparks */}
                          <div className="flex items-end justify-center gap-0.5 h-6">
                            {Object.entries(row.monthAvailed).map(([month, val], i) => {
                              const numVal = Number(val || 0);
                              return (
                                <div 
                                  key={month}
                                  className={`w-1.5 rounded-t transition-all ${numVal > 0 ? 'bg-emerald-600' : 'bg-gray-200'}`}
                                  style={{ height: `${Math.min(24, Math.max(3, numVal * 8))}px` }}
                                  title={`${month}: ${numVal} days availed`}
                                />
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-xs font-bold text-slate-800 font-mono">{row.totalAvailed} Days</span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="inline-flex gap-1.5 text-[10px] font-mono font-extrabold">
                            <span className="text-emerald-700 font-bold">{row.current_pl}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-blue-700 font-bold">{row.current_cl}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-rose-700 font-bold">{row.current_sl}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handlePrintCard(row.employee.id)}
                            className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Print Leave Card"
                          >
                            <Printer size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {employeeLeaveDetails.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-xs text-gray-400">
                          No employees found matching the search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Leave Card View & Print */}
          <div>
            {activeDetails ? (
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden sticky top-6">
                
                {/* Visual Card Heading */}
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs font-display tracking-wide uppercase text-white">Employee Leave Card</h4>
                    <span className="text-[10px] text-slate-400">FY 2026-27 Official Record</span>
                  </div>
                  <button 
                    onClick={() => handlePrintCard(activeDetails.employee.id)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-bold text-white rounded-lg transition cursor-pointer"
                  >
                    <Printer size={12} />
                    Print
                  </button>
                </div>

                {/* Printable Content Block */}
                <div id={`leave-card-print-${activeDetails.employee.id}`} className="p-5 space-y-4 bg-white">
                  
                  {/* Company Header for Official Printout */}
                  <div className="border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-xs uppercase text-slate-800 tracking-tight block">VETAN GROUP DIVISIONS</strong>
                        <span className="text-[9px] text-slate-400 block mt-0.5">Unit factory: {activeDetails.employee.company}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded font-bold text-slate-700">
                        {activeDetails.employee.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div>
                        <span className="text-gray-400 text-[10px] block">Employee Name</span>
                        <span className="font-bold text-slate-900 block">{activeDetails.employee.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] block">Department / Rank</span>
                        <span className="font-semibold text-slate-700 block">{activeDetails.employee.department} • {activeDetails.employee.designation}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block mb-2">Leave Summary (FY Balance)</span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                        <span className="text-[10px] font-bold text-emerald-800 block">Privilege (PL)</span>
                        <strong className="text-base font-black text-emerald-900 font-mono block mt-1">{activeDetails.current_pl}</strong>
                        <span className="text-[9px] text-emerald-600/70 block mt-0.5">Availed: {applications.filter(a => a.employee_id === activeDetails.employee.id && a.leave_type === 'PL' && a.status === 'APPROVED').reduce((sum, a) => sum + a.days, 0)}</span>
                      </div>
                      <div className="bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                        <span className="text-[10px] font-bold text-blue-800 block">Casual (CL)</span>
                        <strong className="text-base font-black text-blue-900 font-mono block mt-1">{activeDetails.current_cl}</strong>
                        <span className="text-[9px] text-blue-600/70 block mt-0.5">Availed: {applications.filter(a => a.employee_id === activeDetails.employee.id && a.leave_type === 'CL' && a.status === 'APPROVED').reduce((sum, a) => sum + a.days, 0)}</span>
                      </div>
                      <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100">
                        <span className="text-[10px] font-bold text-rose-800 block">Sick (SL)</span>
                        <strong className="text-base font-black text-rose-900 font-mono block mt-1">{activeDetails.current_sl}</strong>
                        <span className="text-[9px] text-rose-600/70 block mt-0.5">Availed: {applications.filter(a => a.employee_id === activeDetails.employee.id && a.leave_type === 'SL' && a.status === 'APPROVED').reduce((sum, a) => sum + a.days, 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Month-wise grid */}
                  <div>
                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block mb-2">Month-wise availed days</span>
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                      {Object.entries(activeDetails.monthAvailed).map(([month, val]) => {
                        const numVal = Number(val || 0);
                        return (
                          <div key={month} className="p-1.5 border border-gray-100 rounded bg-gray-50/50">
                            <span className="text-[9px] text-gray-400 uppercase font-semibold block">{month}</span>
                            <span className={`font-mono font-bold block mt-0.5 ${numVal > 0 ? 'text-emerald-700' : 'text-gray-300'}`}>{numVal}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* History Logs */}
                  <div className="pt-2">
                    <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block mb-2">Leave ledger history</span>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {applications.filter(a => a.employee_id === activeDetails.employee.id).map(app => (
                        <div key={app.id} className="p-2 bg-slate-50 rounded border border-slate-100 text-[11px] flex justify-between items-center">
                          <div>
                            <strong className="text-slate-800 block">
                              {app.leave_type} Leave • {app.days} Day{app.days > 1 ? 's' : ''}
                            </strong>
                            <span className="text-gray-400 text-[9px] block font-mono mt-0.5">{app.start_date} to {app.end_date}</span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                            app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      ))}
                      {applications.filter(a => a.employee_id === activeDetails.employee.id).length === 0 && (
                        <span className="text-center text-[10px] text-gray-400 block py-4">
                          No logged leave entries found in history.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Print footer validation signatures */}
                  <div className="pt-4 border-t border-dashed border-gray-200 grid grid-cols-2 gap-4 text-center text-[9px] text-gray-400">
                    <div>
                      <div className="h-6" />
                      <div className="border-t border-gray-200 pt-1">HR Signature / Seal</div>
                    </div>
                    <div>
                      <div className="h-6" />
                      <div className="border-t border-gray-200 pt-1">Employee Verification Signature</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 p-8 text-center rounded-2xl flex flex-col items-center justify-center h-full min-h-[300px]">
                <Info size={24} className="text-slate-300 mb-2" />
                <h4 className="text-xs font-bold text-slate-500">No employee selected</h4>
                <p className="text-[11px] text-gray-400 mt-0.5 max-w-[180px]">Select any employee from the grid to load their detailed Leave Card, print logs, and inspect balances.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EXCEPTIONS AUDIT TAB VIEW */
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl text-xs text-amber-800 flex gap-3">
            <AlertTriangle className="text-amber-600 shrink-0" size={16} />
            <div className="space-y-1">
              <strong className="font-bold block text-amber-900">Important Audit Compliance Notice (महत्वपूर्ण लेखा परीक्षा सूचना)</strong>
              <p className="leading-relaxed">
                This audit compares the <strong>Monthly Attendance Upload</strong> values against approved entries inside the <strong>Leave Card Register</strong>. 
                Vetan requires both to align. When they differ, it usually means employees took leave on the plant floor which HR forgot to officially record.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 font-display select-none">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Staff / Plant Unit</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Audit Cycle</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Attendance Leave (Days)</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Leave Card Availed (Days)</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-center">Audit Severity</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Audit Action Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exceptions.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/40 transition">
                      <td className="p-4">
                        <div>
                          <strong className="text-xs font-bold text-gray-950 block">{row.name}</strong>
                          <span className="text-[10px] text-gray-400 block font-mono mt-0.5">{row.employee_id} • {row.department} • <span className="text-emerald-600 font-extrabold">{row.company}</span></span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-semibold text-slate-700 font-mono">{row.month}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-slate-800 font-mono bg-slate-50 px-2 py-1 border rounded">{row.attendance_leave_days} Days</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-slate-800 font-mono bg-slate-50 px-2 py-1 border rounded">{row.leave_register_days} Days</span>
                      </td>
                      <td className="p-4 text-center">
                        {row.status === 'CRITICAL_MISMATCH' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700 px-2 py-0.5 rounded-lg uppercase">
                            <AlertCircle size={10} />
                            Critical Over-use
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded-lg uppercase">
                            <AlertTriangle size={10} />
                            Warning Mismatch
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-600 leading-normal">{row.message}</span>
                          <span className="text-[10px] text-red-600 font-extrabold bg-red-50 border border-red-100 rounded px-1.5 py-0.5 whitespace-nowrap">
                            Leave Register Not Updated
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {exceptions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-xs text-emerald-600 font-semibold">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 size={24} className="text-emerald-500" />
                          <span>Audit Complete! Leave Registers are 100% synchronized with Attendance upload.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
