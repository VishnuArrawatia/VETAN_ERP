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
  Info,
  Edit3,
  Save,
  X,
  Users
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
  
  // Opening Balance Edit State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [editPL, setEditPL] = useState(0);
  const [editCL, setEditCL] = useState(0);
  const [editSL, setEditSL] = useState(0);
  const [editCompOff, setEditCompOff] = useState(0);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkPL, setBulkPL] = useState(18);
  const [bulkCL, setBulkCL] = useState(6);
  const [bulkSL, setBulkSL] = useState(6);
  const [bulkCompOff, setBulkCompOff] = useState(0);
  const [saving, setSaving] = useState(false);
  const [bulkSearch, setBulkSearch] = useState('');
  const [bulkEdits, setBulkEdits] = useState<Record<string, {pl: number, cl: number, sl: number, compoff: number}>>({});
  
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

  // Open Edit Modal for single employee
  const openEditModal = (emp: any) => {
    setEditEmpId(emp.id);
    setEditPL(emp.leave_balance_pl || 0);
    setEditCL(emp.leave_balance_cl || 0);
    setEditSL(emp.leave_balance_sl || 0);
    setEditCompOff(emp.leave_balance_compoff || 0);
    setEditModalOpen(true);
  };

  // Save single employee opening balance
  const saveOpeningBalance = async () => {
    if (!editEmpId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${editEmpId}/leave-opening`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_balance_pl: Number(editPL),
          leave_balance_cl: Number(editCL),
          leave_balance_sl: Number(editSL),
          leave_balance_compoff: Number(editCompOff)
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Opening Balance updated successfully!');
        setEditModalOpen(false);
        window.location.reload();
      } else {
        alert('Error: ' + (data.error || 'Failed to update'));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Save bulk opening balance — either default for all or individual edits
  const saveBulkOpeningBalance = async () => {
    setSaving(true);
    try {
      // Check if any individual edits were made
      const hasEdits = Object.keys(bulkEdits).length > 0;
      if (hasEdits) {
        // Save each employee individually
        let saved = 0, failed = 0;
        for (const [empId, vals] of Object.entries(bulkEdits)) {
          try {
            const res = await fetch(`/api/employees/${empId}/leave-opening`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                leave_balance_pl: vals.pl,
                leave_balance_cl: vals.cl,
                leave_balance_sl: vals.sl,
                leave_balance_compoff: vals.compodoff || 0
              })
            });
            const data = await res.json();
            if (data.success) saved++; else failed++;
          } catch { failed++; }
        }
        alert(`Opening Balance updated! Saved: ${saved}, Failed: ${failed}`);
      } else {
        // Use default values for ALL employees
        const res = await fetch('/api/leave-opening-bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            default_balance: {
              pl: Number(bulkPL),
              cl: Number(bulkCL),
              sl: Number(bulkSL),
              compoff: Number(bulkCompOff)
            }
          })
        });
        const data = await res.json();
        if (data.success) {
          alert(`Opening Balance updated for ${data.updated} employees!`);
        } else {
          alert('Error: ' + (data.error || 'Failed to update'));
        }
      }
      setBulkModalOpen(false);
      setBulkEdits({});
      window.location.reload();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Update individual employee edit in bulk modal
  const updateBulkEdit = (empId: string, field: 'pl' | 'cl' | 'sl' | 'compoff', value: number) => {
    setBulkEdits(prev => ({
      ...prev,
      [empId]: { ...prev[empId], [field]: value }
    }));
  };

  // Apply default values to all visible employees
  const applyDefaultToAll = () => {
    const edits: Record<string, {pl: number, cl: number, sl: number, compoff: number}> = {};
    filteredEmployees.forEach(emp => {
      edits[emp.id] = { pl: bulkPL, cl: bulkCL, sl: bulkSL, compoff: bulkCompOff };
    });
    setBulkEdits(edits);
    alert('Default values applied to all employees. Click Save to confirm.');
  };

  // Filter employees for bulk modal
  const bulkFilteredEmployees = useMemo(() => {
    if (!bulkSearch.trim()) return filteredEmployees;
    const q = bulkSearch.toLowerCase();
    return filteredEmployees.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.department.toLowerCase().includes(q)
    );
  }, [filteredEmployees, bulkSearch]);

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

        {/* View Switchers + Set Opening Balance */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setBulkModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white rounded-xl transition cursor-pointer"
          >
            <Users size={13} />
            Set Opening Balance
          </button>
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
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={() => openEditModal(row.employee)}
                              className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Edit Opening Balance"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button 
                              onClick={() => handlePrintCard(row.employee.id)}
                              className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Print Leave Card"
                            >
                              <Printer size={13} />
                            </button>
                          </div>
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

      {/* ═══════════════════════════════════════════════════ */}
      {/* EDIT OPENING BALANCE MODAL (Single Employee) */}
      {/* ═══════════════════════════════════════════════════ */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="bg-amber-600 p-4 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">Edit Opening Leave Balance</h4>
                <p className="text-[10px] text-amber-100 mt-0.5">Set PL, CL, SL & CompOff for {editEmpId}</p>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 hover:bg-amber-700 rounded-lg">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">PL (Privilege Leave)</label>
                  <input type="number" value={editPL} onChange={(e) => setEditPL(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm font-mono focus:ring-1 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">CL (Casual Leave)</label>
                  <input type="number" value={editCL} onChange={(e) => setEditCL(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm font-mono focus:ring-1 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">SL (Sick Leave)</label>
                  <input type="number" value={editSL} onChange={(e) => setEditSL(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm font-mono focus:ring-1 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">CompOff</label>
                  <input type="number" value={editCompOff} onChange={(e) => setEditCompOff(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg p-2 text-sm font-mono focus:ring-1 focus:ring-amber-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer">
                  Cancel
                </button>
                <button onClick={saveOpeningBalance} disabled={saving}
                  className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5">
                  <Save size={13} />
                  {saving ? 'Saving...' : 'Save Balance'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* EMPLOYEE-WISE OPENING BALANCE EDITOR */}
      {/* ═══════════════════════════════════════════════════ */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
            <div className="bg-emerald-700 p-4 text-white flex items-center justify-between shrink-0">
              <div>
                <h4 className="font-bold text-sm">Set Leave Opening Balance — Employee Wise</h4>
                <p className="text-[10px] text-emerald-100 mt-0.5">Edit PL / CL / SL / CompOff for each employee individually</p>
              </div>
              <button onClick={() => { setBulkModalOpen(false); setBulkEdits({}); }} className="p-1 hover:bg-emerald-800 rounded-lg">
                <X size={16} />
              </button>
            </div>

            {/* Default Values + Apply All + Search */}
            <div className="bg-emerald-50 border-b border-emerald-200 p-3 flex flex-wrap items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-800 uppercase">Defaults:</span>
                <input type="number" value={bulkPL} onChange={(e) => setBulkPL(Number(e.target.value))}
                  className="w-12 border border-emerald-200 rounded-lg p-1.5 text-xs font-mono text-center" placeholder="PL" title="PL" />
                <input type="number" value={bulkCL} onChange={(e) => setBulkCL(Number(e.target.value))}
                  className="w-12 border border-emerald-200 rounded-lg p-1.5 text-xs font-mono text-center" placeholder="CL" title="CL" />
                <input type="number" value={bulkSL} onChange={(e) => setBulkSL(Number(e.target.value))}
                  className="w-12 border border-emerald-200 rounded-lg p-1.5 text-xs font-mono text-center" placeholder="SL" title="SL" />
                <input type="number" value={bulkCompOff} onChange={(e) => setBulkCompOff(Number(e.target.value))}
                  className="w-12 border border-emerald-200 rounded-lg p-1.5 text-xs font-mono text-center" placeholder="C-Off" title="CompOff" />
                <button onClick={applyDefaultToAll}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer whitespace-nowrap">
                  Apply to All
                </button>
              </div>
              <div className="flex-1 min-w-[150px]">
                <input type="text" value={bulkSearch} onChange={(e) => setBulkSearch(e.target.value)}
                  placeholder="🔍 Search employee..."
                  className="w-full border border-emerald-200 rounded-lg p-1.5 text-xs bg-white" />
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">
                {Object.keys(bulkEdits).length > 0 ? `${Object.keys(bulkEdits).length} edited` : 'No changes yet'}
              </span>
            </div>

            {/* Employee List */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-[9px] font-bold text-gray-500 uppercase text-left w-8">#</th>
                    <th className="p-2 text-[9px] font-bold text-gray-500 uppercase text-left">Code</th>
                    <th className="p-2 text-[9px] font-bold text-gray-500 uppercase text-left">Employee Name</th>
                    <th className="p-2 text-[9px] font-bold text-gray-500 uppercase text-left">Unit</th>
                    <th className="p-2 text-[9px] font-bold text-gray-500 uppercase text-center">PL</th>
                    <th className="p-2 text-[9px] font-bold text-gray-500 uppercase text-center">CL</th>
                    <th className="p-2 text-[9px] font-bold text-gray-500 uppercase text-center">SL</th>
                    <th className="p-2 text-[9px] font-bold text-gray-500 uppercase text-center">C-Off</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkFilteredEmployees.map((emp, idx) => {
                    const edit = bulkEdits[emp.id];
                    const isEdited = !!edit;
                    const currentPL = isEdited ? edit.pl : (emp.leave_balance_pl || 0);
                    const currentCL = isEdited ? edit.cl : (emp.leave_balance_cl || 0);
                    const currentSL = isEdited ? edit.sl : (emp.leave_balance_sl || 0);
                    const currentCO = isEdited ? (edit as any).compoff || 0 : (emp.leave_balance_compoff || 0);
                    return (
                      <tr key={emp.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isEdited ? 'bg-emerald-50/60' : ''}`}>
                        <td className="p-2 text-[10px] text-gray-400 font-mono">{idx + 1}</td>
                        <td className="p-2 text-[10px] font-bold text-gray-700 font-mono">{emp.id}</td>
                        <td className="p-2 text-[10px] text-gray-800">{emp.name}</td>
                        <td className="p-2 text-[10px] text-gray-500">{emp.company}</td>
                        <td className="p-1">
                          <input type="number" value={currentPL}
                            onChange={(e) => updateBulkEdit(emp.id, 'pl', Number(e.target.value))}
                            className="w-14 border border-gray-200 rounded-lg p-1 text-[11px] font-mono text-center focus:ring-1 focus:ring-emerald-400" />
                        </td>
                        <td className="p-1">
                          <input type="number" value={currentCL}
                            onChange={(e) => updateBulkEdit(emp.id, 'cl', Number(e.target.value))}
                            className="w-14 border border-gray-200 rounded-lg p-1 text-[11px] font-mono text-center focus:ring-1 focus:ring-emerald-400" />
                        </td>
                        <td className="p-1">
                          <input type="number" value={currentSL}
                            onChange={(e) => updateBulkEdit(emp.id, 'sl', Number(e.target.value))}
                            className="w-14 border border-gray-200 rounded-lg p-1 text-[11px] font-mono text-center focus:ring-1 focus:ring-emerald-400" />
                        </td>
                        <td className="p-1">
                          <input type="number" value={currentCO}
                            onChange={(e) => updateBulkEdit(emp.id, 'compoff', Number(e.target.value))}
                            className="w-14 border border-gray-200 rounded-lg p-1 text-[11px] font-mono text-center focus:ring-1 focus:ring-emerald-400" />
                        </td>
                      </tr>
                    );
                  })}
                  {bulkFilteredEmployees.length === 0 && (
                    <tr><td colSpan={8} className="p-6 text-center text-xs text-gray-400">No employees found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-3 flex items-center justify-between bg-gray-50 shrink-0">
              <span className="text-[10px] text-gray-500">
                {bulkFilteredEmployees.length} employees • Click any cell to edit
              </span>
              <div className="flex gap-2">
                <button onClick={() => { setBulkModalOpen(false); setBulkEdits({}); }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer">
                  Cancel
                </button>
                <button onClick={saveBulkOpeningBalance} disabled={saving || Object.keys(bulkEdits).length === 0}
                  className={`px-5 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    Object.keys(bulkEdits).length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}>
                  <Save size={13} />
                  {saving ? 'Saving...' : `Save ${Object.keys(bulkEdits).length} Employee(s)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
