/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileSpreadsheet, 
  Calendar, 
  Clock, 
  Plus, 
  Save, 
  Sparkles, 
  CheckCircle,
  Building,
  Table,
  Upload
} from 'lucide-react';
import { Employee, Attendance } from '../types';

interface FinancialYearAttendanceProps {
  employees: Employee[];
  attendance: Attendance[];
  activeCompany: string;
  onSaveAttendance: (records: Attendance[]) => Promise<boolean>;
}

export default function FinancialYearAttendance({ 
  employees, 
  attendance, 
  activeCompany, 
  onSaveAttendance 
}: FinancialYearAttendanceProps) {
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [employeeAttendance, setEmployeeAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRows, setEditingRows] = useState<Record<string, Attendance>>({});
  const [saveSuccess, setSaveSuccess] = useState('');

  // Months lists from April 2026 to March 2027 (standard Indian Financial Year 2026-27)
  const financialMonths = [
    { label: 'Apr 2026', key: '2026-04', days: 30 },
    { label: 'May 2026', key: '2026-05', days: 31 },
    { label: 'Jun 2026', key: '2026-06', days: 30 },
    { label: 'Jul 2026', key: '2026-07', days: 31 },
    { label: 'Aug 2026', key: '2026-08', days: 31 },
    { label: 'Sep 2026', key: '2026-09', days: 30 },
    { label: 'Oct 2026', key: '2026-10', days: 31 },
    { label: 'Nov 2026', key: '2026-11', days: 30 },
    { label: 'Dec 2026', key: '2026-12', days: 31 },
    { label: 'Jan 2027', key: '2027-01', days: 31 },
    { label: 'Feb 2027', key: '2027-02', days: 28 },
    { label: 'Mar 2027', key: '2027-03', days: 31 }
  ];

  const activeEmployees = employees.filter(e => activeCompany === 'ALL' || e.company === activeCompany);
  
  // Choose the target employee safely
  const targetEmp = activeEmployees.find(e => e.id === selectedEmpId) || activeEmployees[0];

  // Sync selectedEmpId if targetEmp changes or activeCompany limits list
  React.useEffect(() => {
    if (targetEmp && targetEmp.id !== selectedEmpId) {
      setSelectedEmpId(targetEmp.id);
    }
  }, [targetEmp, selectedEmpId]);

  // Fetch complete attendance records for selected employee from backend
  React.useEffect(() => {
    if (targetEmp?.id) {
      setLoading(true);
      fetch(`/api/attendance/employee/${targetEmp.id}`)
        .then(res => res.json())
        .then(data => {
          setEmployeeAttendance(data || []);
          setLoading(false);
        })
        .catch(err => {
          console.error('[YTD Attendance] Error fetching employee attendance history', err);
          setLoading(false);
        });
    }
  }, [targetEmp?.id]);

  // Load or cache initial attendance across the 12 months for this employee
  const getMonthRecord = (monthKey: string, totalDays: number): Attendance => {
    // Check local editing state first
    if (editingRows[monthKey]) return editingRows[monthKey];

    // Check fetched state
    const existing = employeeAttendance.find(a => a.employee_id === targetEmp?.id && a.month === monthKey);
    if (existing) return existing;

    // Return template fallback
    return {
      id: `ATT-${targetEmp?.id}-${monthKey}`,
      employee_id: targetEmp?.id || '',
      month: monthKey,
      total_days: totalDays,
      working_days: totalDays,
      lop_days: 0,
      overtime_hours: 0
    };
  };

  const handleFieldChange = (monthKey: string, field: 'working_days' | 'lop_days' | 'overtime_hours', val: number) => {
    const current = getMonthRecord(monthKey, financialMonths.find(m => m.key === monthKey)!.days);
    const updated = { ...current };

    if (field === 'lop_days') {
      updated.lop_days = Math.min(updated.total_days, Math.max(0, val));
      updated.working_days = updated.total_days - updated.lop_days;
    } else if (field === 'working_days') {
      updated.working_days = Math.min(updated.total_days, Math.max(0, val));
      updated.lop_days = updated.total_days - updated.working_days;
    } else {
      updated.overtime_hours = Math.max(0, val);
    }

    setEditingRows(prev => ({ ...prev, [monthKey]: updated }));
  };

  const handleBulkSubmit = async () => {
    if (!targetEmp) return;
    const listToSave = Object.values(editingRows) as Attendance[];
    if (listToSave.length === 0) {
      setSaveSuccess('No manual cellular values changed for saving.');
      setTimeout(() => setSaveSuccess(''), 2500);
      return;
    }

    const ok = await onSaveAttendance(listToSave);
    if (ok) {
      setSaveSuccess(`Successfully commited annual attendance for ${targetEmp.name} in database records!`);
      // Update our local employeeAttendance with saved rows
      setEmployeeAttendance(prev => {
        const next = [...prev];
        for (const item of listToSave) {
          const idx = next.findIndex(a => a.month === item.month);
          if (idx !== -1) {
            next[idx] = item;
          } else {
            next.push(item);
          }
        }
        return next;
      });
      setEditingRows({});
      setTimeout(() => setSaveSuccess(''), 3500);
    }
  };

  // Compile calculations summary details for this employee
  const totals = financialMonths.reduce((acc, m) => {
    const entry = getMonthRecord(m.key, m.days);
    acc.totalDays += entry.total_days;
    acc.workingDays += entry.working_days;
    acc.lopDays += entry.lop_days;
    acc.overtimeHours += entry.overtime_hours;
    return acc;
  }, { totalDays: 0, workingDays: 0, lopDays: 0, overtimeHours: 0 });

  return (
    <div className="space-y-6">
      
      {/* Visual Header */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] bg-slate-900 text-white font-mono font-bold px-2 py-0.5 rounded uppercase">
            Financial Year Cycle: FY 2026-27 Master Spreadsheet
          </span>
          <h3 className="font-semibold text-gray-901 font-display mt-2 text-base tracking-tight">Standard Complete Year Attendance Form</h3>
          <p className="text-gray-400 text-xs mt-0.5">Maintain monthly presence logs, Loss of Pay (LOP) fine schedules, and overtime payouts globally in a single file.</p>
        </div>

        {targetEmp && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 block pb-0.5">Employee Selection</span>
              <select
                value={selectedEmpId}
                onChange={(e) => {
                  setSelectedEmpId(e.target.value);
                  setEditingRows({});
                }}
                className="border p-1.5 text-xs rounded bg-white hover:border-emerald-500 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {activeEmployees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.company})</option>
                ))}
              </select>
            </div>
            
            <button
              id="btn-save-master-att"
              onClick={handleBulkSubmit}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer select-none"
            >
              <Save size={13} />
              Save Year Changes
            </button>
          </div>
        )}
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-500" />
          {saveSuccess}
        </div>
      )}

      {targetEmp ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Master Spread Cell Matrix */}
          <div className="lg:col-span-3 bg-white border rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 bg-gray-50/50 border-b flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700 font-display flex items-center gap-1.5">
                <Table size={14} className="text-emerald-500" />
                Cell Matrix Register — {targetEmp.name}
              </span>
              <span className="text-gray-400 font-mono">1 cell = 1 billing month unit</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-gray-50/30 border-b select-none font-display text-gray-400 text-[10px] tracking-wider uppercase">
                    <th className="p-3">Month Range</th>
                    <th className="p-3 text-center">Calendar Days</th>
                    <th className="p-3 text-center">Paid presence Days</th>
                    <th className="p-3 text-center text-rose-500 font-semibold">Loss of Pay (LOP)</th>
                    <th className="p-3 text-center text-amber-600">Overtime Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono text-xs text-slate-800">
                  {financialMonths.map((m) => {
                    const record = getMonthRecord(m.key, m.days);
                    const isEdited = !!editingRows[m.key];
                    return (
                      <tr key={m.key} className={`hover:bg-slate-50 transition-all ${isEdited ? 'bg-amber-50/30' : ''}`}>
                        <td className="p-3 font-semibold text-slate-900 border-r">{m.label}</td>
                        <td className="p-3 text-center text-gray-400 border-r">{m.days}</td>
                        <td className="p-3 border-r h-full text-center">
                          <input 
                            type="number"
                            min="0"
                            max={m.days}
                            value={record.working_days}
                            onChange={(e) => handleFieldChange(m.key, 'working_days', parseInt(e.target.value) || 0)}
                            className="w-16 border rounded text-center p-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-bold"
                          />
                        </td>
                        <td className="p-3 border-r text-center">
                          <input 
                            type="number"
                            min="0"
                            max={m.days}
                            value={record.lop_days}
                            onChange={(e) => handleFieldChange(m.key, 'lop_days', parseInt(e.target.value) || 0)}
                            className="w-16 border rounded text-center p-1 text-xs text-rose-600 font-bold focus:ring-1 focus:ring-emerald-500 bg-white focus:outline-none"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input 
                            type="number"
                            min="0"
                            max="99"
                            value={record.overtime_hours}
                            onChange={(e) => handleFieldChange(m.key, 'overtime_hours', parseInt(e.target.value) || 0)}
                            className="w-16 border rounded text-center p-1 text-xs text-amber-600 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Master stats report block */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-[10px] text-slate-400 font-bold tracking-widest block uppercase">Year-to-Date Accruals</span>
              <h4 className="text-sm font-semibold font-display tracking-tight text-slate-200">FY Overall Report Summary</h4>

              <div className="space-y-3 pt-2 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Total Calendar Days:</span>
                  <span>{totals.totalDays}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Worked Presence Days:</span>
                  <span className="text-emerald-400 font-bold">{totals.workingDays}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-rose-450 text-rose-300">Net Unpaid LOP Days:</span>
                  <span className="text-rose-400 font-bold">{totals.lopDays}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-slate-400">Overtime hours logged:</span>
                  <span className="text-amber-400 font-bold">{totals.overtimeHours} Hrs</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1.5 text-xs font-sans">
              <span className="font-bold block text-slate-200 flex items-center gap-1">
                <Sparkles size={11} className="text-emerald-400" />
                Proration Notice
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">When computing salary runs for {targetEmp.company}, the system parses this exact grid to evaluate prorated basic, allowances, and statutory PF caps automatically.</p>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-10 bg-white border rounded-2xl text-xs text-gray-400">Please choose a staffing company unit.</div>
      )}

    </div>
  );
}
