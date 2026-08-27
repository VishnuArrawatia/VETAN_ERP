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
  pf_deduction?: number;
  esic_deduction?: number;
  tds?: number;
  loan_deduction?: number;
  salary_advance?: number;
  custom_deductions?: number;
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
  currentUser?: { role: string; company_rights?: string[] } | null;
}

export default function UnitWiseSalaryReport({ employees, monthlySlips, companies, currentUser }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  // Determine accessible units based on role
  const accessibleUnits = useMemo(() => {
    if (!currentUser) return null; // null means all units
    if (currentUser.role === 'SUPER_HR' || currentUser.role === 'MANAGEMENT') return null;
    return currentUser.company_rights || [];
  }, [currentUser]);

  // Get available months from payslips
  const availableMonths = useMemo(() => {
    const months = [...new Set(monthlySlips.map(s => s.month))].sort().reverse();
    return months;
  }, [monthlySlips]);

  // Build unit-wise data
  const reportData = useMemo(() => {
    const unitMap: Record<string, {
      employees: any[];
      totalGross: number;
      totalDed: number;
      totalNet: number;
      totalPF: number;
      totalESIC: number;
      totalTDS: number;
      totalLoan: number;
      totalAdvance: number;
    }> = {};

    employees.filter(e => e.status !== 'SEPARATED' && e.status !== 'RESIGNED').forEach(emp => {
      const unit = emp.company || 'Unknown';
      
      // Unit-based filtering for HR
      if (accessibleUnits && !accessibleUnits.includes(unit)) return;
      
      if (!unitMap[unit]) {
        unitMap[unit] = {
          employees: [], totalGross: 0, totalDed: 0, totalNet: 0,
          totalPF: 0, totalESIC: 0, totalTDS: 0, totalLoan: 0, totalAdvance: 0
        };
      }
      
      const slip = monthlySlips.find(s => s.employee_id === emp.id && s.month === selectedMonth);
      
      unitMap[unit].employees.push({
        id: emp.id,
        name: emp.name,
        gross: slip?.gross_salary || 0,
        deductions: slip?.total_deductions || 0,
        net: slip?.net_salary || 0,
        pf: slip?.pf_deduction || 0,
        esic: slip?.esic_deduction || 0,
        tds: slip?.tds || 0,
        loan: slip?.loan_deduction || 0,
        advance: slip?.salary_advance || 0,
        hasSlip: !!slip
      });

      if (slip) {
        unitMap[unit].totalGross += slip.gross_salary || 0;
        unitMap[unit].totalDed += slip.total_deductions || 0;
        unitMap[unit].totalNet += slip.net_salary || 0;
        unitMap[unit].totalPF += slip.pf_deduction || 0;
        unitMap[unit].totalESIC += slip.esic_deduction || 0;
        unitMap[unit].totalTDS += slip.tds || 0;
        unitMap[unit].totalLoan += slip.loan_deduction || 0;
        unitMap[unit].totalAdvance += slip.salary_advance || 0;
      }
    });

    return unitMap;
  }, [employees, monthlySlips, selectedMonth, accessibleUnits]);

  // Grand totals
  const grandTotal = useMemo(() => {
    let totalEmp = 0, totalGross = 0, totalDed = 0, totalNet = 0;
    let totalPF = 0, totalESIC = 0, totalTDS = 0, totalLoan = 0, totalAdvance = 0;
    Object.values(reportData).forEach(unit => {
      totalEmp += unit.employees.length;
      totalGross += unit.totalGross;
      totalDed += unit.totalDed;
      totalNet += unit.totalNet;
      totalPF += unit.totalPF;
      totalESIC += unit.totalESIC;
      totalTDS += unit.totalTDS;
      totalLoan += unit.totalLoan;
      totalAdvance += unit.totalAdvance;
    });
    return { totalEmp, totalGross, totalDed, totalNet, totalPF, totalESIC, totalTDS, totalLoan, totalAdvance };
  }, [reportData]);

  // Export to Excel
  const exportToExcel = () => {
    const rows: any[] = [];
    
    Object.entries(reportData)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([unit, data]) => {
        data.employees
          .sort((a, b) => a.id.localeCompare(b.id))
          .forEach(emp => {
            rows.push({
              'Unit': unit,
              'Employee Code': emp.id,
              'Employee Name': emp.name,
              'PF Deduction': emp.pf,
              'ESIC Deduction': emp.esic,
              'TDS': emp.tds,
              'Loan Deduction': emp.loan,
              'Salary Advance': emp.advance,
              'Total Deductions': emp.deductions,
              'Gross Salary': emp.gross,
              'Net Salary': emp.net
            });
          });
        rows.push({
          'Unit': `${unit} TOTAL`,
          'Employee Code': '',
          'Employee Name': `${data.employees.length} employees`,
          'PF Deduction': data.totalPF,
          'ESIC Deduction': data.totalESIC,
          'TDS': data.totalTDS,
          'Loan Deduction': data.totalLoan,
          'Salary Advance': data.totalAdvance,
          'Total Deductions': data.totalDed,
          'Gross Salary': data.totalGross,
          'Net Salary': data.totalNet
        });
        rows.push({});
      });
    
    rows.push({
      'Unit': 'GRAND TOTAL',
      'Employee Code': '',
      'Employee Name': `${grandTotal.totalEmp} employees`,
      'PF Deduction': grandTotal.totalPF,
      'ESIC Deduction': grandTotal.totalESIC,
      'TDS': grandTotal.totalTDS,
      'Loan Deduction': grandTotal.totalLoan,
      'Salary Advance': grandTotal.totalAdvance,
      'Total Deductions': grandTotal.totalDed,
      'Gross Salary': grandTotal.totalGross,
      'Net Salary': grandTotal.totalNet
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Salary Report');
    XLSX.writeFile(wb, `Unit_Salary_Report_${selectedMonth}.xlsx`);
  };

  const fmt = (n: number) => '₹' + Number(n).toLocaleString('en-IN');

  const units = Object.entries(reportData).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h3 className="font-extrabold text-slate-950 text-sm uppercase tracking-wide">
            Unit-wise Salary Report
          </h3>
          <p className="text-[10px] text-slate-400">
            Monthly salary breakdown — Gross, PF, ESIC, Deductions & Net
            {accessibleUnits && <span className="ml-2 text-emerald-600 font-bold">({accessibleUnits.join(', ')})</span>}
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
          <div className="text-[9px] font-bold text-blue-600 uppercase">Employees</div>
          <div className="text-xl font-black text-blue-900">{grandTotal.totalEmp}</div>
        </div>
        <div className="bg-green-50 p-3 rounded-2xl border border-green-100">
          <div className="text-[9px] font-bold text-green-600 uppercase">Total Gross</div>
          <div className="text-xl font-black text-green-900">{fmt(grandTotal.totalGross)}</div>
        </div>
        <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
          <div className="text-[9px] font-bold text-indigo-600 uppercase">Total PF</div>
          <div className="text-xl font-black text-indigo-900">{fmt(grandTotal.totalPF)}</div>
        </div>
        <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100">
          <div className="text-[9px] font-bold text-amber-600 uppercase">Total ESIC</div>
          <div className="text-xl font-black text-amber-900">{fmt(grandTotal.totalESIC)}</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100">
          <div className="text-[9px] font-bold text-purple-600 uppercase">Total Net</div>
          <div className="text-xl font-black text-purple-900">{fmt(grandTotal.totalNet)}</div>
        </div>
      </div>

      {/* Unit-wise Tables */}
      {units.map(([unit, data]) => (
        <div key={unit} className="border border-slate-200 rounded-2xl overflow-hidden">
          {/* Unit Header — Clickable */}
          <div
            className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-800 transition"
            onClick={() => setExpandedUnit(expandedUnit === unit ? null : unit)}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{expandedUnit === unit ? '▼' : '▶'}</span>
              <span className="font-black text-sm">{unit}</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                {data.employees.length} employees
              </span>
            </div>
            <div className="flex gap-4 text-[10px] font-bold">
              <span>Gross: <span className="text-green-300">{fmt(data.totalGross)}</span></span>
              <span>PF: <span className="text-indigo-300">{fmt(data.totalPF)}</span></span>
              <span>ESIC: <span className="text-amber-300">{fmt(data.totalESIC)}</span></span>
              <span>Net: <span className="text-blue-300">{fmt(data.totalNet)}</span></span>
            </div>
          </div>

          {/* Employee Table — Expanded */}
          {expandedUnit === unit && (
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[9px]">
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-right">Gross</th>
                    <th className="px-3 py-2 text-right text-indigo-700">PF</th>
                    <th className="px-3 py-2 text-right text-amber-700">ESIC</th>
                    <th className="px-3 py-2 text-right text-red-700">TDS</th>
                    <th className="px-3 py-2 text-right">Loan</th>
                    <th className="px-3 py-2 text-right">Advance</th>
                    <th className="px-3 py-2 text-right text-red-700">Total Ded</th>
                    <th className="px-3 py-2 text-right font-black">Net Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {data.employees
                    .sort((a, b) => a.id.localeCompare(b.id))
                    .map((emp, i) => (
                      <tr key={emp.id} className={`border-t border-slate-100 ${!emp.hasSlip ? 'bg-amber-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                        <td className="px-3 py-1.5 text-slate-400 font-mono">{i + 1}</td>
                        <td className="px-3 py-1.5 font-mono font-bold text-slate-900">{emp.id}</td>
                        <td className="px-3 py-1.5 font-semibold text-slate-700">{emp.name}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-green-700">{emp.gross > 0 ? fmt(emp.gross) : '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-indigo-600">{emp.pf > 0 ? fmt(emp.pf) : '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-amber-600">{emp.esic > 0 ? fmt(emp.esic) : '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-red-600">{emp.tds > 0 ? fmt(emp.tds) : '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-600">{emp.loan > 0 ? fmt(emp.loan) : '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono text-slate-600">{emp.advance > 0 ? fmt(emp.advance) : '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-red-700">{emp.deductions > 0 ? fmt(emp.deductions) : '-'}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900 bg-green-50">{emp.net > 0 ? fmt(emp.net) : '-'}</td>
                      </tr>
                    ))}
                  {/* Unit Total Row */}
                  <tr className="bg-slate-800 text-white font-bold text-[10px]">
                    <td colSpan={3} className="px-3 py-2.5 uppercase">{unit} — Total</td>
                    <td className="px-3 py-2.5 text-right font-mono text-green-300">{fmt(data.totalGross)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-indigo-300">{fmt(data.totalPF)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-amber-300">{fmt(data.totalESIC)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-red-300">{fmt(data.totalTDS)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmt(data.totalLoan)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{fmt(data.totalAdvance)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-red-300">{fmt(data.totalDed)}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-blue-300">{fmt(data.totalNet)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}

      {/* Grand Total Row */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 rounded-2xl">
        <div className="flex justify-between items-center mb-3">
          <div className="font-black text-sm uppercase">Grand Total — {selectedMonth}</div>
          <div className="text-[10px] bg-white/10 px-3 py-1 rounded-full">{grandTotal.totalEmp} employees</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm font-bold">
          <div>Gross: <span className="text-green-300 text-lg">{fmt(grandTotal.totalGross)}</span></div>
          <div>PF: <span className="text-indigo-300 text-lg">{fmt(grandTotal.totalPF)}</span></div>
          <div>ESIC: <span className="text-amber-300 text-lg">{fmt(grandTotal.totalESIC)}</span></div>
          <div>Deductions: <span className="text-red-300 text-lg">{fmt(grandTotal.totalDed)}</span></div>
          <div>Net: <span className="text-blue-300 text-lg">{fmt(grandTotal.totalNet)}</span></div>
        </div>
      </div>
    </div>
  );
}
