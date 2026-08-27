import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';

interface Employee {
  id: string;
  name: string;
  company: string;
  base_salary: number;
  status?: string;
}

interface Payslip {
  employee_id: string;
  employee_name: string;
  month: string;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
}

interface Company {
  id: string;
  name: string;
  unit_name?: string;
}

interface Props {
  employees: Employee[];
  monthlySlips: Payslip[];
  companies: Company[];
}

export default function UnitWiseSalaryReport({ employees, monthlySlips, companies }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Get available months from payslips
  const availableMonths = useMemo(() => {
    const months = [...new Set(monthlySlips.map(s => s.month))].sort().reverse();
    return months;
  }, [monthlySlips]);

  // Build unit-wise data
  const reportData = useMemo(() => {
    const unitMap: Record<string, { employees: any[]; totalGross: number; totalDed: number; totalNet: number }> = {};

    // Get employees for each unit
    employees.filter(e => e.status !== 'SEPARATED' && e.status !== 'RESIGNED').forEach(emp => {
      const unit = emp.company || 'Unknown';
      if (!unitMap[unit]) {
        unitMap[unit] = { employees: [], totalGross: 0, totalDed: 0, totalNet: 0 };
      }
      
      const slip = monthlySlips.find(s => s.employee_id === emp.id && s.month === selectedMonth);
      
      unitMap[unit].employees.push({
        id: emp.id,
        name: emp.name,
        gross: slip?.gross_salary || 0,
        deductions: slip?.total_deductions || 0,
        net: slip?.net_salary || 0,
        hasSlip: !!slip
      });

      if (slip) {
        unitMap[unit].totalGross += slip.gross_salary || 0;
        unitMap[unit].totalDed += slip.total_deductions || 0;
        unitMap[unit].totalNet += slip.net_salary || 0;
      }
    });

    return unitMap;
  }, [employees, monthlySlips, selectedMonth]);

  // Grand totals
  const grandTotal = useMemo(() => {
    let totalEmp = 0, totalGross = 0, totalDed = 0, totalNet = 0;
    Object.values(reportData).forEach(unit => {
      totalEmp += unit.employees.length;
      totalGross += unit.totalGross;
      totalDed += unit.totalDed;
      totalNet += unit.totalNet;
    });
    return { totalEmp, totalGross, totalDed, totalNet };
  }, [reportData]);

  // Export to Excel
  const exportToExcel = () => {
    const rows: any[] = [];
    
    Object.entries(reportData)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([unit, data]) => {
        // Unit header
        data.employees
          .sort((a, b) => a.id.localeCompare(b.id))
          .forEach(emp => {
            rows.push({
              'Unit': unit,
              'Employee Code': emp.id,
              'Employee Name': emp.name,
              'Gross Salary': emp.gross,
              'Deductions': emp.deductions,
              'Net Salary': emp.net
            });
          });
        // Unit total row
        rows.push({
          'Unit': `${unit} TOTAL`,
          'Employee Code': '',
          'Employee Name': `${data.employees.length} employees`,
          'Gross Salary': data.totalGross,
          'Deductions': data.totalDed,
          'Net Salary': data.totalNet
        });
        // Empty row
        rows.push({});
      });
    
    // Grand total
    rows.push({
      'Unit': 'GRAND TOTAL',
      'Employee Code': '',
      'Employee Name': `${grandTotal.totalEmp} employees`,
      'Gross Salary': grandTotal.totalGross,
      'Deductions': grandTotal.totalDed,
      'Net Salary': grandTotal.totalNet
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Report');
    XLSX.writeFile(wb, `Unit_Salary_Report_${selectedMonth}.xlsx`);
  };

  const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN');

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h3 className="font-extrabold text-slate-950 text-sm uppercase tracking-wide">
            Unit-wise Salary Report
          </h3>
          <p className="text-[10px] text-slate-400">
            Monthly salary summary by unit — Gross, Deductions & Net Salary
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition"
          >
            📊 Export Excel
          </button>
        </div>
      </div>

      {/* Grand Total Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
          <div className="text-[10px] font-bold text-blue-600 uppercase">Total Employees</div>
          <div className="text-2xl font-black text-blue-900">{grandTotal.totalEmp}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
          <div className="text-[10px] font-bold text-green-600 uppercase">Total Gross</div>
          <div className="text-2xl font-black text-green-900">{fmt(grandTotal.totalGross)}</div>
        </div>
        <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
          <div className="text-[10px] font-bold text-red-600 uppercase">Total Deductions</div>
          <div className="text-2xl font-black text-red-900">{fmt(grandTotal.totalDed)}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
          <div className="text-[10px] font-bold text-purple-600 uppercase">Total Net</div>
          <div className="text-2xl font-black text-purple-900">{fmt(grandTotal.totalNet)}</div>
        </div>
      </div>

      {/* Unit-wise Tables */}
      {Object.entries(reportData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([unit, data]) => (
          <div key={unit} className="border border-slate-200 rounded-2xl overflow-hidden">
            {/* Unit Header */}
            <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="font-black text-sm">{unit}</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                  {data.employees.length} employees
                </span>
              </div>
              <div className="flex gap-6 text-[11px] font-bold">
                <span>Gross: <span className="text-green-300">{fmt(data.totalGross)}</span></span>
                <span>Ded: <span className="text-red-300">{fmt(data.totalDed)}</span></span>
                <span>Net: <span className="text-blue-300">{fmt(data.totalNet)}</span></span>
              </div>
            </div>

            {/* Employee Table */}
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                  <th className="px-4 py-2 text-left">Employee Code</th>
                  <th className="px-4 py-2 text-left">Employee Name</th>
                  <th className="px-4 py-2 text-right">Gross Salary</th>
                  <th className="px-4 py-2 text-right">Deductions</th>
                  <th className="px-4 py-2 text-right">Net Salary</th>
                </tr>
              </thead>
              <tbody>
                {data.employees
                  .sort((a, b) => a.id.localeCompare(b.id))
                  .map((emp, i) => (
                    <tr key={emp.id} className={`border-t border-slate-100 ${!emp.hasSlip ? 'bg-amber-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                      <td className="px-4 py-2 font-mono font-bold text-slate-900">{emp.id}</td>
                      <td className="px-4 py-2 font-semibold text-slate-700">{emp.name}</td>
                      <td className="px-4 py-2 text-right font-mono text-green-700">{emp.gross > 0 ? fmt(emp.gross) : '-'}</td>
                      <td className="px-4 py-2 text-right font-mono text-red-600">{emp.deductions > 0 ? fmt(emp.deductions) : '-'}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-slate-900">{emp.net > 0 ? fmt(emp.net) : '-'}</td>
                    </tr>
                  ))}
                {/* Unit Total Row */}
                <tr className="bg-slate-800 text-white font-bold">
                  <td colSpan={2} className="px-4 py-2.5 text-xs uppercase">{unit} — Total</td>
                  <td className="px-4 py-2.5 text-right font-mono text-green-300">{fmt(data.totalGross)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-red-300">{fmt(data.totalDed)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-blue-300">{fmt(data.totalNet)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

      {/* Grand Total Row */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl flex justify-between items-center">
        <div className="font-black text-sm uppercase">Grand Total — {selectedMonth}</div>
        <div className="flex gap-8 text-sm font-bold">
          <span>{grandTotal.totalEmp} Employees</span>
          <span>Gross: <span className="text-green-300 text-lg">{fmt(grandTotal.totalGross)}</span></span>
          <span>Ded: <span className="text-red-300 text-lg">{fmt(grandTotal.totalDed)}</span></span>
          <span>Net: <span className="text-blue-300 text-lg">{fmt(grandTotal.totalNet)}</span></span>
        </div>
      </div>
    </div>
  );
}
