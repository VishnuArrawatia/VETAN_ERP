/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Daily Attendance View — HR Morning Report
 * Shows yesterday's double punch vs single punch status
 */

import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Download,
  Printer,
  RefreshCw,
  FileText
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
  
  const [showReport, setShowReport] = useState(true);

  // Get yesterday's date
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  // Get day before yesterday
  const dayBefore = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
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

  // Categorize employees
  const report = useMemo(() => {
    const doublePunch: { emp: Employee; att: Attendance }[] = [];
    const singlePunchIN: { emp: Employee; att: Attendance }[] = [];
    const singlePunchOUT: { emp: Employee; att: Attendance }[] = [];
    const absent: { emp: Employee; att: Attendance }[] = [];
    const onLeave: { emp: Employee; att: Attendance }[] = [];
    const noData: Employee[] = [];

    activeEmps.forEach(emp => {
      const att = yesterdayAtt.find(a => a.employee_id === emp.id);
      
      if (!att) {
        noData.push(emp);
        return;
      }

      const hasPresent = (att.present || 0) > 0;
      const hasAbsent = (att.absent || 0) > 0;
      const hasLeave = (att.leave || 0) > 0;

      if (hasLeave) {
        onLeave.push({ emp, att });
      } else if (hasPresent && !hasAbsent) {
        // Full day present = both IN and OUT assumed
        doublePunch.push({ emp, att });
      } else if (hasPresent && hasAbsent) {
        // Present but also absent = single punch (only IN recorded)
        singlePunchIN.push({ emp, att });
      } else if (!hasPresent && hasAbsent) {
        absent.push({ emp, att });
      } else {
        noData.push(emp);
      }
    });

    return { doublePunch, singlePunchIN, singlePunchOUT, absent, onLeave, noData };
  }, [activeEmps, yesterdayAtt]);

  // Generate printable report
  const generateReport = () => {
    const dateStr = new Date(yesterday).toLocaleDateString('en-IN', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    let reportText = `
═══════════════════════════════════════════════════════════════
           DAILY ATTENDANCE REPORT — ${dateStr}
           Unit: ${activeCompany}
═══════════════════════════════════════════════════════════════

SUMMARY:
───────────────────────────────────────────────────────────────
✅ Double Punch (IN+OUT):  ${report.doublePunch.length} employees
⚠️  Single Punch (IN only): ${report.singlePunchIN.length} employees
❌ Absent:                  ${report.absent.length} employees
📅 On Leave:                ${report.onLeave.length} employees
⏳ No Data:                 ${report.noData.length} employees
───────────────────────────────────────────────────────────────
TOTAL: ${activeEmps.length} employees

`;

    if (report.doublePunch.length > 0) {
      reportText += `
✅ DOUBLE PUNCH (IN + OUT) — ${report.doublePunch.length}
───────────────────────────────────────────────────────────────
`;
      report.doublePunch.forEach(({ emp }, i) => {
        reportText += `${i + 1}. ${emp.name} (${emp.id}) — ${emp.company}\n`;
      });
    }

    if (report.singlePunchIN.length > 0) {
      reportText += `
⚠️  SINGLE PUNCH (IN only, OUT missing) — ${report.singlePunchIN.length}
───────────────────────────────────────────────────────────────
`;
      report.singlePunchIN.forEach(({ emp }, i) => {
        reportText += `${i + 1}. ${emp.name} (${emp.id}) — ${emp.company} — VERIFY OUT PUNCH\n`;
      });
    }

    if (report.absent.length > 0) {
      reportText += `
❌ ABSENT — ${report.absent.length}
───────────────────────────────────────────────────────────────
`;
      report.absent.forEach(({ emp }, i) => {
        reportText += `${i + 1}. ${emp.name} (${emp.id}) — ${emp.company}\n`;
      });
    }

    if (report.onLeave.length > 0) {
      reportText += `
📅 ON LEAVE — ${report.onLeave.length}
───────────────────────────────────────────────────────────────
`;
      report.onLeave.forEach(({ emp }, i) => {
        reportText += `${i + 1}. ${emp.name} (${emp.id}) — ${emp.company}\n`;
      });
    }

    reportText += `
═══════════════════════════════════════════════════════════════
Generated: ${new Date().toLocaleString('en-IN')}
VETAN ERP — SVN & Sakar Group
═══════════════════════════════════════════════════════════════
`;

    return reportText;
  };

  // Download report as text file
  const downloadReport = () => {
    const reportText = generateReport();
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Attendance_Report_${yesterday}_${activeCompany}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Print report
  const printReport = () => {
    const reportText = generateReport();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<pre style="font-family: monospace; font-size: 12px;">${reportText}</pre>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="bg-white p-6 border border-slate-200/80 rounded-3xl shadow-sm space-y-6">
      
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-extrabold text-slate-950 text-base flex items-center gap-2">
              <FileText size={18} className="text-emerald-600" />
              Daily Attendance Report
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Yesterday's attendance status — Double Punch vs Single Punch
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer"
            >
              <Download size={13} />
              Download Report
            </button>
            <button
              onClick={printReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-600 text-white text-xs font-bold rounded-xl hover:bg-slate-700 transition cursor-pointer"
            >
              <Printer size={13} />
              Print
            </button>
          </div>
        </div>
        
        {/* Date Banner */}
        <div className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <Calendar size={24} />
            <div>
              <p className="text-xs font-semibold opacity-80">Yesterday's Report</p>
              <p className="text-lg font-black">
                {new Date(yesterday).toLocaleDateString('en-IN', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 text-center">
          <CheckCircle size={24} className="mx-auto text-emerald-600 mb-1" />
          <p className="text-3xl font-black text-emerald-700">{report.doublePunch.length}</p>
          <p className="text-[10px] font-bold text-emerald-600 uppercase">Double Punch ✅</p>
          <p className="text-[9px] text-emerald-500">IN + OUT Done</p>
        </div>
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 text-center">
          <AlertTriangle size={24} className="mx-auto text-orange-600 mb-1" />
          <p className="text-3xl font-black text-orange-700">{report.singlePunchIN.length}</p>
          <p className="text-[10px] font-bold text-orange-600 uppercase">Single Punch ⚠️</p>
          <p className="text-[9px] text-orange-500">IN only, OUT missing</p>
        </div>
        <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4 text-center">
          <XCircle size={24} className="mx-auto text-rose-600 mb-1" />
          <p className="text-3xl font-black text-rose-700">{report.absent.length}</p>
          <p className="text-[10px] font-bold text-rose-600 uppercase">Absent ❌</p>
          <p className="text-[9px] text-rose-500">No punch recorded</p>
        </div>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 text-center">
          <Calendar size={24} className="mx-auto text-amber-600 mb-1" />
          <p className="text-3xl font-black text-amber-700">{report.onLeave.length}</p>
          <p className="text-[10px] font-bold text-amber-600 uppercase">On Leave 📅</p>
          <p className="text-[9px] text-amber-500">Approved leave</p>
        </div>
        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-center">
          <Clock size={24} className="mx-auto text-slate-500 mb-1" />
          <p className="text-3xl font-black text-slate-600">{report.noData.length}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase">No Data ⏳</p>
          <p className="text-[9px] text-slate-400">Not entered yet</p>
        </div>
      </div>

      {/* Total */}
      <div className="bg-slate-100 rounded-xl p-3 text-center">
        <span className="text-xs font-bold text-slate-700">
          Total Employees: {activeEmps.length} | 
          Attendance Entered: {activeEmps.length - report.noData.length} | 
          Pending: {report.noData.length}
        </span>
      </div>

      {/* Single Punch Alert List */}
      {report.singlePunchIN.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
          <h4 className="text-xs font-bold text-orange-800 flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-orange-600" />
            Single Punch Employees — Verify OUT Punch ({report.singlePunchIN.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {report.singlePunchIN.map(({ emp }) => (
              <div key={emp.id} className="bg-white border border-orange-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">{emp.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{emp.id} | {emp.company}</p>
                </div>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">
                  IN Only ⚠️
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Employee List */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-bold text-slate-700 mb-3">
          Complete Employee List — {new Date(yesterday).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </h4>
        
        <div className="max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-100">
              <tr className="text-left text-[10px] font-bold text-slate-500 uppercase">
                <th className="p-2">#</th>
                <th className="p-2">Employee</th>
                <th className="p-2">Unit</th>
                <th className="p-2 text-center">Working Days</th>
                <th className="p-2 text-center">Absent Days</th>
                <th className="p-2 text-center">Leave</th>
                <th className="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {/* Double Punch */}
              {report.doublePunch.map(({ emp, att }, i) => (
                <tr key={emp.id} className="border-t border-slate-100 bg-emerald-50/30">
                  <td className="p-2 text-slate-400">{i + 1}</td>
                  <td className="p-2">
                    <span className="font-semibold text-slate-800">{emp.name}</span>
                    <br/>
                    <span className="text-[10px] text-slate-400 font-mono">{emp.id}</span>
                  </td>
                  <td className="p-2 text-slate-600">{emp.company}</td>
                  <td className="p-2 text-center font-mono text-emerald-700 font-bold">{att.present || 0}</td>
                  <td className="p-2 text-center font-mono text-slate-500">{att.absent || 0}</td>
                  <td className="p-2 text-center font-mono text-amber-600">{att.leave || 0}</td>
                  <td className="p-2 text-center">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                      ✅ Double Punch
                    </span>
                  </td>
                </tr>
              ))}
              
              {/* Single Punch */}
              {report.singlePunchIN.map(({ emp, att }, i) => (
                <tr key={emp.id} className="border-t border-slate-100 bg-orange-50/50">
                  <td className="p-2 text-slate-400">{report.doublePunch.length + i + 1}</td>
                  <td className="p-2">
                    <span className="font-semibold text-slate-800">{emp.name}</span>
                    <br/>
                    <span className="text-[10px] text-slate-400 font-mono">{emp.id}</span>
                  </td>
                  <td className="p-2 text-slate-600">{emp.company}</td>
                  <td className="p-2 text-center font-mono text-orange-700 font-bold">{att.present || 0}</td>
                  <td className="p-2 text-center font-mono text-orange-600">{att.absent || 0}</td>
                  <td className="p-2 text-center font-mono text-amber-600">{att.leave || 0}</td>
                  <td className="p-2 text-center">
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold">
                      ⚠️ Single Punch
                    </span>
                  </td>
                </tr>
              ))}

              {/* Absent */}
              {report.absent.map(({ emp, att }, i) => (
                <tr key={emp.id} className="border-t border-slate-100 bg-rose-50/30">
                  <td className="p-2 text-slate-400">{report.doublePunch.length + report.singlePunchIN.length + i + 1}</td>
                  <td className="p-2">
                    <span className="font-semibold text-slate-800">{emp.name}</span>
                    <br/>
                    <span className="text-[10px] text-slate-400 font-mono">{emp.id}</span>
                  </td>
                  <td className="p-2 text-slate-600">{emp.company}</td>
                  <td className="p-2 text-center font-mono text-slate-500">{att.present || 0}</td>
                  <td className="p-2 text-center font-mono text-rose-600 font-bold">{att.absent || 0}</td>
                  <td className="p-2 text-center font-mono text-amber-600">{att.leave || 0}</td>
                  <td className="p-2 text-center">
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                      ❌ Absent
                    </span>
                  </td>
                </tr>
              ))}

              {/* On Leave */}
              {report.onLeave.map(({ emp, att }, i) => (
                <tr key={emp.id} className="border-t border-slate-100 bg-amber-50/30">
                  <td className="p-2 text-slate-400">{report.doublePunch.length + report.singlePunchIN.length + report.absent.length + i + 1}</td>
                  <td className="p-2">
                    <span className="font-semibold text-slate-800">{emp.name}</span>
                    <br/>
                    <span className="text-[10px] text-slate-400 font-mono">{emp.id}</span>
                  </td>
                  <td className="p-2 text-slate-600">{emp.company}</td>
                  <td className="p-2 text-center font-mono text-slate-500">{att.present || 0}</td>
                  <td className="p-2 text-center font-mono text-slate-500">{att.absent || 0}</td>
                  <td className="p-2 text-center font-mono text-amber-700 font-bold">{att.leave || 0}</td>
                  <td className="p-2 text-center">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                      📅 On Leave
                    </span>
                  </td>
                </tr>
              ))}

              {/* No Data */}
              {report.noData.map((emp, i) => (
                <tr key={emp.id} className="border-t border-slate-100">
                  <td className="p-2 text-slate-400">{report.doublePunch.length + report.singlePunchIN.length + report.absent.length + report.onLeave.length + i + 1}</td>
                  <td className="p-2">
                    <span className="font-semibold text-slate-800">{emp.name}</span>
                    <br/>
                    <span className="text-[10px] text-slate-400 font-mono">{emp.id}</span>
                  </td>
                  <td className="p-2 text-slate-600">{emp.company}</td>
                  <td className="p-2 text-center font-mono text-slate-400">—</td>
                  <td className="p-2 text-center font-mono text-slate-400">—</td>
                  <td className="p-2 text-center font-mono text-slate-400">—</td>
                  <td className="p-2 text-center">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold">
                      ⏳ No Data
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-[10px] text-blue-700 leading-relaxed">
          <strong>📌 HR Daily Process:</strong><br/>
          1. <strong>Subah 9:30 AM</strong> — Ye report open karo<br/>
          2. <strong>Double Punch</strong> — Sab sahi hai ✅<br/>
          3. <strong>Single Punch</strong> — Verify karo ki employee ne OUT kiya ya nahi ⚠️<br/>
          4. <strong>Absent</strong> — LOP lagega ya leave adjust karo ❌<br/>
          5. <strong>Download/Print</strong> — Report save karo for records
        </p>
      </div>
    </div>
  );
}
