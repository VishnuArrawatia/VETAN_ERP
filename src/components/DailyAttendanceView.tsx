/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Daily Attendance View — HR can see today's IN/OUT punches
 * and yesterday's single punch alerts
 */

import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  UserX, 
  RefreshCw,
  Calendar
} from 'lucide-react';
import { Employee, Attendance } from '../types';

interface DailyAttendanceViewProps {
  employees: Employee[];
  attendance: Attendance[];
  activeCompany: string;
  activeMonth: string;
}

export default function DailyAttendanceView({ 
  employees, 
  attendance, 
  activeCompany, 
  activeMonth 
}: DailyAttendanceViewProps) {
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

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

  // Get attendance for selected date
  const selectedDateAtt = useMemo(() => {
    return attendance.filter(a => 
      a.employee_id && 
      activeEmps.some(e => e.id === a.employee_id) &&
      a.month === activeMonth
    );
  }, [attendance, activeEmps, activeMonth]);

  // Get yesterday's attendance for single punch detection
  const yesterdayAtt = useMemo(() => {
    // In a real system, this would query yesterday's data
    // For now, we use the monthly attendance data
    return attendance.filter(a => 
      a.employee_id && 
      activeEmps.some(e => e.id === a.employee_id) &&
      a.month === activeMonth
    );
  }, [attendance, activeEmps, activeMonth]);

  // Calculate statistics
  const stats = useMemo(() => {
    const present = selectedDateAtt.filter(a => (a.present || 0) > 0 && (a.absent || 0) === 0);
    const absent = selectedDateAtt.filter(a => (a.absent || 0) > 0 && (a.leave || 0) === 0);
    const onLeave = selectedDateAtt.filter(a => (a.leave || 0) > 0);
    const singlePunch = selectedDateAtt.filter(a => (a.present || 0) > 0 && (a.absent || 0) > 0);
    const noData = activeEmps.filter(e => !selectedDateAtt.some(a => a.employee_id === e.id));

    return { present, absent, onLeave, singlePunch, noData };
  }, [selectedDateAtt, activeEmps]);

  // Yesterday's single punch alerts
  const yesterdayAlerts = useMemo(() => {
    return yesterdayAtt.filter(a => (a.present || 0) > 0 && (a.absent || 0) > 0);
  }, [yesterdayAtt]);

  return (
    <div className="bg-white p-6 border border-slate-200/80 rounded-3xl shadow-sm space-y-6">
      
      {/* Header */}
      <div className="border-b pb-3 flex justify-between items-start">
        <div>
          <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
            <Calendar size={16} className="text-emerald-600" />
            Daily Attendance Dashboard
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Track IN/OUT punches • Detect single punches • View yesterday's alerts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
          />
        </div>
      </div>

      {/* Yesterday's Single Punch Alert */}
      {yesterdayAlerts.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-orange-600" />
            <h4 className="text-xs font-bold text-orange-800">
              Yesterday's Single Punch Alert ({yesterday})
            </h4>
          </div>
          <p className="text-[10px] text-orange-600 mb-2">
            These employees had only IN punch yesterday — verify if OUT punch is missing:
          </p>
          <div className="flex flex-wrap gap-2">
            {yesterdayAlerts.map(a => {
              const emp = activeEmps.find(e => e.id === a.employee_id);
              return (
                <span key={a.employee_id} className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">
                  {emp?.name || a.employee_id} — {emp?.company}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-emerald-700">{stats.present.length}</p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Present (IN+OUT)</p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-orange-700">{stats.singlePunch.length}</p>
          <p className="text-[10px] font-bold text-orange-600 uppercase">Single Punch</p>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-rose-700">{stats.absent.length}</p>
          <p className="text-[10px] font-bold text-rose-600 uppercase">Absent</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-amber-700">{stats.onLeave.length}</p>
          <p className="text-[10px] font-bold text-amber-600 uppercase">On Leave</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-slate-700">{stats.noData.length}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase">No Punch Yet</p>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs font-bold text-slate-700">
            Employee List — {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <span className="text-[10px] text-slate-400">{activeEmps.length} total employees</span>
        </div>
        
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-100">
              <tr className="text-left text-[10px] font-bold text-slate-500 uppercase">
                <th className="p-2">Employee</th>
                <th className="p-2">Unit</th>
                <th className="p-2 text-center">IN Punch</th>
                <th className="p-2 text-center">OUT Punch</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-center">Working Days</th>
                <th className="p-2 text-center">Absent Days</th>
              </tr>
            </thead>
            <tbody>
              {activeEmps.map(emp => {
                const att = selectedDateAtt.find(a => a.employee_id === emp.id);
                const hasIN = att && (att.present || 0) > 0;
                const hasOUT = att && (att.present || 0) > 0 && (att.absent || 0) === 0;
                const isSinglePunch = att && (att.present || 0) > 0 && (att.absent || 0) > 0;
                const isOnLeave = att && (att.leave || 0) > 0;
                const isAbsent = att && (att.absent || 0) > 0 && !isOnLeave;

                let status = 'No Punch';
                let statusColor = 'bg-slate-100 text-slate-500';
                let statusIcon = <Clock size={10} />;

                if (isOnLeave) {
                  status = 'On Leave';
                  statusColor = 'bg-amber-100 text-amber-700';
                  statusIcon = <Calendar size={10} />;
                } else if (hasIN && hasOUT) {
                  status = 'Present';
                  statusColor = 'bg-emerald-100 text-emerald-700';
                  statusIcon = <CheckCircle size={10} />;
                } else if (isSinglePunch) {
                  status = 'Single Punch ⚠️';
                  statusColor = 'bg-orange-100 text-orange-700';
                  statusIcon = <AlertTriangle size={10} />;
                } else if (isAbsent) {
                  status = 'Absent';
                  statusColor = 'bg-rose-100 text-rose-700';
                  statusIcon = <XCircle size={10} />;
                }

                return (
                  <tr key={emp.id} className="border-t border-slate-100 hover:bg-white">
                    <td className="p-2">
                      <span className="font-semibold text-slate-800">{emp.name}</span>
                      <br/>
                      <span className="text-[10px] text-slate-400 font-mono">{emp.id}</span>
                    </td>
                    <td className="p-2 text-slate-600">{emp.company}</td>
                    <td className="p-2 text-center">
                      {hasIN ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                          ✅ IN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      {hasOUT ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                          ✅ OUT
                        </span>
                      ) : isSinglePunch ? (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">
                          ⚠️ MISSING
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[10px]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor} flex items-center justify-center gap-1`}>
                        {statusIcon}
                        {status}
                      </span>
                    </td>
                    <td className="p-2 text-center font-mono text-slate-700">
                      {att?.present || 0}
                    </td>
                    <td className="p-2 text-center font-mono text-rose-600">
                      {att?.absent || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-[10px] text-blue-700 leading-relaxed">
          <strong>How to use:</strong><br/>
          • <strong>Present (IN+OUT)</strong> — Employee punched both IN and OUT<br/>
          • <strong>Single Punch</strong> — Only IN punch recorded, OUT missing (check next day)<br/>
          • <strong>Absent</strong> — No punch recorded<br/>
          • <strong>No Punch Yet</strong> — Attendance not entered for this employee<br/>
          • <strong>Yesterday's Alert</strong> — Shows employees with single punch yesterday
        </p>
      </div>
    </div>
  );
}
