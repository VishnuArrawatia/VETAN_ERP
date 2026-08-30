/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Daily Attendance View — HR Morning Workflow
 * Mark All Present → Handle Exceptions → Auto Monthly
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Download,
  Printer,
  CheckSquare,
  Square,
  UserMinus,
  UserCheck,
  Moon,
  Sun
} from 'lucide-react';
import { Employee, Attendance } from '../types';

interface DailyAttendanceViewProps {
  employees: Employee[];
  attendance: Attendance[];
  activeCompany: string;
  activeMonth: string;
  onSaveAttendance: (records: Attendance[]) => Promise<boolean>;
}

export default function DailyAttendanceView({ 
  employees, 
  attendance, 
  activeCompany, 
  activeMonth,
  onSaveAttendance
}: DailyAttendanceViewProps) {
  
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [employeeStatus, setEmployeeStatus] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY'>>({});
  const [punchTimes, setPunchTimes] = useState<Record<string, { in_time: string; out_time: string }>>({});

  // Get yesterday's date
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Filter employees for current unit
  const unitEmployees = useMemo(() => {
    return employees.filter(e => 
      (activeCompany === 'GROUP' || activeCompany === 'COMBINED') || 
      e.company === activeCompany
    );
  }, [employees, activeCompany]);

  const activeEmps = useMemo(() => 
    unitEmployees.filter(e => e.status === 'ACTIVE'), 
    [unitEmployees]
  );

  // Get attendance for yesterday (using monthly data as proxy)
  const yesterdayAtt = useMemo(() => {
    return attendance.filter(a => 
      a.employee_id && 
      activeEmps.some(e => e.id === a.employee_id) &&
      a.month === activeMonth
    );
  }, [attendance, activeEmps, activeMonth]);

  // Initialize employee status from existing attendance
  useEffect(() => {
    const initialStatus: Record<string, 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY'> = {};
    activeEmps.forEach(emp => {
      const att = yesterdayAtt.find(a => a.employee_id === emp.id);
      if (att) {
        if ((att.leave || 0) > 0) {
          initialStatus[emp.id] = 'LEAVE';
        } else if ((att.absent || 0) > 0 && (att.present || 0) === 0) {
          initialStatus[emp.id] = 'ABSENT';
        } else if ((att.present || 0) > 0 && (att.absent || 0) > 0) {
          initialStatus[emp.id] = 'HALF_DAY';
        } else if ((att.present || 0) > 0) {
          initialStatus[emp.id] = 'PRESENT';
        }
      }
    });
    setEmployeeStatus(initialStatus);
  }, [activeEmps, yesterdayAtt]);

  // Count stats
  const stats = useMemo(() => {
    const present = Object.values(employeeStatus).filter(s => s === 'PRESENT').length;
    const absent = Object.values(employeeStatus).filter(s => s === 'ABSENT').length;
    const onLeave = Object.values(employeeStatus).filter(s => s === 'LEAVE').length;
    const halfDay = Object.values(employeeStatus).filter(s => s === 'HALF_DAY').length;
    const noData = activeEmps.length - Object.keys(employeeStatus).length;
    return { present, absent, onLeave, halfDay, noData };
  }, [employeeStatus, activeEmps]);

  // Mark All Present
  const handleMarkAllPresent = async () => {
    if (!confirm('Mark ALL employees as PRESENT for yesterday? This will set IN+OUT for everyone.')) return;
    
    setMarkingAll(true);
    try {
      const res = await fetch('/api/daily-attendance/mark-all-present', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: yesterday, company: activeCompany })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`✅ Marked ${data.count} employees as PRESENT for ${yesterday}`);
        // Update local state
        const newStatus: Record<string, 'PRESENT'> = {};
        const newPunch: Record<string, { in_time: string; out_time: string }> = {};
        activeEmps.forEach(emp => {
          newStatus[emp.id] = 'PRESENT';
          newPunch[emp.id] = { in_time: '09:00', out_time: '18:30' };
        });
        setEmployeeStatus(newStatus);
        setPunchTimes(newPunch);
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setMarkingAll(false);
    }
  };

  // Toggle employee status
  const toggleEmployeeStatus = async (empId: string, newStatus: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY') => {
    try {
      const apiStatus = newStatus === 'HALF_DAY' ? 'PRESENT' : newStatus;
      const halfDay = newStatus === 'HALF_DAY';
      
      await fetch('/api/daily-attendance/mark-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, date: yesterday, status: apiStatus, halfDay })
      });
      
      setEmployeeStatus(prev => ({ ...prev, [empId]: newStatus }));
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  // Save all changes — ACCUMULATE into monthly summary, never overwrite
  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const records: Attendance[] = Object.entries(employeeStatus).map(([empId, status]) => {
        const emp = activeEmps.find(e => e.id === empId);
        const month = yesterday.substring(0, 7);
        const punch = punchTimes[empId] || { in_time: '', out_time: '' };
        
        // Find existing monthly attendance to ACCUMULATE into
        const existing = attendance.find(a => a.employee_id === empId && a.month === month);
        const calendarDays = 30; // Default for month — will be calculated properly
        
        if (existing) {
          // ACCUMULATE: increment present/absent/leave counts, keep total_days
          const newPresent = (existing.present || 0) + (status === 'PRESENT' ? 1 : status === 'HALF_DAY' ? 0.5 : 0);
          const newAbsent = (existing.absent || 0) + (status === 'ABSENT' ? 1 : 0);
          const newLeave = (existing.leave || 0) + (status === 'LEAVE' ? 1 : 0);
          const newLwp = existing.lwp || 0;
          const newWo = existing.weekly_off || 0;
          const newPh = existing.paid_holiday || 0;
          const newTotal = newPresent + newAbsent + newLeave + newLwp + newWo + newPh;
          
          return {
            ...existing,
            id: existing.id,
            employee_id: empId,
            month: month,
            total_days: Math.max(existing.total_days || calendarDays, newTotal),
            present: newPresent,
            absent: newAbsent,
            leave: newLeave,
            working_days: newPresent + newWo + newPh + newLeave,
            lop_days: newAbsent + newLwp,
            in_time: punch.in_time || existing.in_time,
            out_time: punch.out_time || existing.out_time
          } as any;
        } else {
          // NEW record — create with calendar days for the month
          return {
            id: `ATT-${empId}-${month}`,
            employee_id: empId,
            month: month,
            total_days: calendarDays,
            working_days: status === 'PRESENT' ? 1 : status === 'HALF_DAY' ? 0.5 : 0,
            lop_days: status === 'ABSENT' ? 1 : 0,
            overtime_hours: 0,
            present: status === 'PRESENT' ? 1 : status === 'HALF_DAY' ? 0.5 : 0,
            absent: status === 'ABSENT' ? 1 : 0,
            weekly_off: 0,
            paid_holiday: 0,
            leave: status === 'LEAVE' ? 1 : 0,
            lwp: 0,
            is_locked: false,
            in_time: punch.in_time || undefined,
            out_time: punch.out_time || undefined
          } as any;
        }
      });
      
      await onSaveAttendance(records);
      setSuccessMsg('✅ Attendance saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get status icon/color
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PRESENT': return { icon: <CheckCircle size={12} />, color: 'bg-emerald-100 text-emerald-700', label: 'Present' };
      case 'ABSENT': return { icon: <XCircle size={12} />, color: 'bg-rose-100 text-rose-700', label: 'Absent' };
      case 'LEAVE': return { icon: <Calendar size={12} />, color: 'bg-amber-100 text-amber-700', label: 'Leave' };
      case 'HALF_DAY': return { icon: <Moon size={12} />, color: 'bg-orange-100 text-orange-700', label: 'Half Day' };
      default: return { icon: <Clock size={12} />, color: 'bg-slate-100 text-slate-500', label: 'Not Marked' };
    }
  };

  return (
    <div className="bg-white p-6 border border-slate-200/80 rounded-3xl shadow-sm space-y-6">
      
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
              <Sun size={18} className="text-amber-500" />
              Daily Attendance — {new Date(yesterday).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Mark attendance for yesterday • Auto-calculates to monthly attendance
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-emerald-700">{successMsg}</p>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleMarkAllPresent}
          disabled={markingAll}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-teal-600 transition shadow-lg cursor-pointer disabled:opacity-50"
        >
          {markingAll ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
          ) : (
            <CheckSquare size={16} />
          )}
          MARK ALL PRESENT (IN+OUT)
        </button>
        
        <button
          onClick={handleSaveAll}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div>
          ) : (
            <CheckCircle size={16} />
          )}
          SAVE ALL CHANGES
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center">
          <CheckCircle size={24} className="mx-auto text-emerald-600 mb-1" />
          <p className="text-3xl font-black text-emerald-700">{stats.present}</p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Present ✅</p>
        </div>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 text-center">
          <Moon size={24} className="mx-auto text-orange-600 mb-1" />
          <p className="text-3xl font-black text-orange-700">{stats.halfDay}</p>
          <p className="text-[10px] font-bold text-orange-600 uppercase">Half Day 🌙</p>
        </div>
        <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 text-center">
          <XCircle size={24} className="mx-auto text-rose-600 mb-1" />
          <p className="text-3xl font-black text-rose-700">{stats.absent}</p>
          <p className="text-[10px] font-bold text-rose-600 uppercase">Absent ❌</p>
        </div>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
          <Calendar size={24} className="mx-auto text-amber-600 mb-1" />
          <p className="text-3xl font-black text-amber-700">{stats.onLeave}</p>
          <p className="text-[10px] font-bold text-amber-600 uppercase">Leave 📅</p>
        </div>
        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-center">
          <Clock size={24} className="mx-auto text-slate-500 mb-1" />
          <p className="text-3xl font-black text-slate-600">{activeEmps.length - stats.present - stats.halfDay - stats.absent - stats.onLeave}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase">Remaining</p>
        </div>
      </div>

      {/* Employee List with Status Toggles */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-700 mb-3">
          Employee Attendance — Click to change status
        </h4>
        
        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-100">
              <tr className="text-left text-[10px] font-bold text-slate-500 uppercase">
                <th className="p-2">Employee</th>
                <th className="p-2">Unit</th>
                <th className="p-2 text-center">In Time ⏰</th>
                <th className="p-2 text-center">Out Time ⏰</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeEmps.map(emp => {
                const status = employeeStatus[emp.id] || 'NOT_MARKED';
                const statusDisplay = getStatusDisplay(status);
                
                return (
                  <tr key={emp.id} className="border-t border-slate-100 hover:bg-white">
                    <td className="p-2">
                      <span className="font-semibold text-slate-800">{emp.name}</span>
                      <br/>
                      <span className="text-[10px] text-slate-400 font-mono">{emp.id}</span>
                    </td>
                    <td className="p-2 text-slate-600">{emp.company}</td>
                    <td className="p-2 text-center">
                      <input
                        type="time"
                        value={punchTimes[emp.id]?.in_time || ''}
                        onChange={e => setPunchTimes(prev => ({
                          ...prev,
                          [emp.id]: { ...prev[emp.id], in_time: e.target.value }
                        }))}
                        className="w-20 text-[10px] border border-slate-200 rounded px-1 py-0.5 font-mono"
                        title="In Time"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <input
                        type="time"
                        value={punchTimes[emp.id]?.out_time || ''}
                        onChange={e => setPunchTimes(prev => ({
                          ...prev,
                          [emp.id]: { ...prev[emp.id], out_time: e.target.value }
                        }))}
                        className="w-20 text-[10px] border border-slate-200 rounded px-1 py-0.5 font-mono"
                        title="Out Time"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusDisplay.color} flex items-center justify-center gap-1`}>
                        {statusDisplay.icon}
                        {statusDisplay.label}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => toggleEmployeeStatus(emp.id, 'PRESENT')}
                          className={`p-1.5 rounded transition cursor-pointer ${status === 'PRESENT' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                          title="Mark Present"
                        >
                          <CheckCircle size={12} />
                        </button>
                        <button
                          onClick={() => toggleEmployeeStatus(emp.id, 'HALF_DAY')}
                          className={`p-1.5 rounded transition cursor-pointer ${status === 'HALF_DAY' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'}`}
                          title="Mark Half Day"
                        >
                          <Moon size={12} />
                        </button>
                        <button
                          onClick={() => toggleEmployeeStatus(emp.id, 'ABSENT')}
                          className={`p-1.5 rounded transition cursor-pointer ${status === 'ABSENT' ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-600 hover:bg-rose-200'}`}
                          title="Mark Absent"
                        >
                          <XCircle size={12} />
                        </button>
                        <button
                          onClick={() => toggleEmployeeStatus(emp.id, 'LEAVE')}
                          className={`p-1.5 rounded transition cursor-pointer ${status === 'LEAVE' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
                          title="Mark Leave"
                        >
                          <Calendar size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow Guide */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-[10px] text-blue-700 leading-relaxed">
          <strong>📌 HR Daily Workflow:</strong><br/>
          1. <strong>Subah 9:30 AM</strong> — "MARK ALL PRESENT" click karo (sabka IN+OUT ho jayega)<br/>
          2. <strong>Exceptions handle karo</strong> — Jo absent hai unka ❌ click, jo half day hai unka 🌙 click<br/>
          3. <strong>Leave adjust karo</strong> — Jo chutti pe hai unka 📅 click<br/>
          4. <strong>SAVE ALL CHANGES</strong> — Click karo, attendance save ho jayega<br/>
          5. <strong>Sham ko</strong> — Agar koi galti ho to correct kar sakte ho<br/>
          6. <strong>Monthly Auto</strong> — Daily attendance se monthly attendance auto ban jata hai
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// UNIT-WISE PAY DAYS SUMMARY COMPONENT
// Shows all units' attendance summary for the month
// HR can verify pay days before freezing attendance
// ═══════════════════════════════════════════════════════════

