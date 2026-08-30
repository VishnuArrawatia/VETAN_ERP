import React, { useState, useMemo } from 'react';
import { Calculator, Download, Search, ChevronDown, CheckCircle, AlertTriangle, Clock, FileSpreadsheet } from 'lucide-react';
import { Employee, Payslip, Attendance } from '../types';
import * as XLSX from 'xlsx';

interface ArrearWorkingProps {
  employees: Employee[];
  slips: Payslip[];
  attendance: Attendance[];
  activeCompany?: string;
  onRefresh?: () => void;
}

interface ArrearMonth {
  month: string;
  calendarDays: number;
  paidDays: number;
  oldBasic: number;
  newBasic: number;
  oldHRA: number;
  newHRA: number;
  oldConveyance: number;
  newConveyance: number;
  oldMedical: number;
  newMedical: number;
  oldChildrenEdu: number;
  newChildrenEdu: number;
  oldGross: number;
  newGross: number;
  oldEmployerPF: number;
  newEmployerPF: number;
  oldBonus: number;
  newBonus: number;
  oldEmployerESIC: number;
  newEmployerESIC: number;
  oldPayable: number;
  newPayable: number;
  arrearDifference: number;
}

function calculateMonthArrear(
  month: string,
  oldBasic: number, newBasic: number,
  oldHRA: number, newHRA: number,
  oldConveyance: number, newConveyance: number,
  oldMedical: number, newMedical: number,
  oldChildrenEdu: number, newChildrenEdu: number,
  paidDays: number, calendarDays: number,
  pfApplicable: boolean, esicApplicable: boolean, bonusApplicable: boolean
): ArrearMonth {
  const proration = paidDays / calendarDays;
  
  // Old salary components (prorated)
  const oldGross = Math.round((oldBasic + oldHRA + oldConveyance + oldMedical + oldChildrenEdu) * proration);
  const oldEmployerPF = pfApplicable ? Math.round(oldBasic * 0.12 * proration) : 0;
  const oldBonus = bonusApplicable ? Math.round(oldBasic * 0.0833 * proration) : 0;
  const oldEmployerESIC = (esicApplicable && oldGross <= 21000) ? Math.round(oldGross * 0.0325) : 0;
  const oldPayable = oldGross + oldEmployerPF + oldEmployerESIC + oldBonus;
  
  // New salary components (prorated)
  const newGross = Math.round((newBasic + newHRA + newConveyance + newMedical + newChildrenEdu) * proration);
  const newEmployerPF = pfApplicable ? Math.round(newBasic * 0.12 * proration) : 0;
  const newBonus = bonusApplicable ? Math.round(newBasic * 0.0833 * proration) : 0;
  const newEmployerESIC = (esicApplicable && newGross <= 21000) ? Math.round(newGross * 0.0325) : 0;
  const newPayable = newGross + newEmployerPF + newEmployerESIC + newBonus;
  
  return {
    month,
    calendarDays,
    paidDays,
    oldBasic: Math.round(oldBasic * proration),
    newBasic: Math.round(newBasic * proration),
    oldHRA: Math.round(oldHRA * proration),
    newHRA: Math.round(newHRA * proration),
    oldConveyance: Math.round(oldConveyance * proration),
    newConveyance: Math.round(newConveyance * proration),
    oldMedical: Math.round(oldMedical * proration),
    newMedical: Math.round(newMedical * proration),
    oldChildrenEdu: Math.round(oldChildrenEdu * proration),
    newChildrenEdu: Math.round(newChildrenEdu * proration),
    oldGross,
    newGross,
    oldEmployerPF,
    newEmployerPF,
    oldBonus,
    newBonus,
    oldEmployerESIC,
    newEmployerESIC,
    oldPayable,
    newPayable,
    arrearDifference: newPayable - oldPayable
  };
}

function getDaysInMonth(yearMonth: string): number {
  const [y, m] = yearMonth.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function getMonthList(fromMonth: string, toMonth: string): string[] {
  const months: string[] = [];
  let [y, m] = fromMonth.split('-').map(Number);
  const [ey, em] = toMonth.split('-').map(Number);
  
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

export default function ArrearWorking({ employees, slips, attendance, activeCompany = 'ALL', onRefresh }: ArrearWorkingProps) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [arrearFrom, setArrearFrom] = useState('');
  const [arrearTo, setArrearTo] = useState('');
  const [pfApplicable, setPfApplicable] = useState(true);
  const [esicApplicable, setEsicApplicable] = useState(false);
  const [bonusApplicable, setBonusApplicable] = useState(true);
  const [arrearStatus, setArrearStatus] = useState<'DRAFT' | 'CALCULATED' | 'APPROVED'>('DRAFT');
  
  const filteredEmployees = employees.filter(emp => {
    if (!activeCompany || activeCompany === 'ALL' || activeCompany === 'GROUP') return true;
    return emp.company === activeCompany;
  });
  
  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  
  // Get old salary from current employee master (before restructure)
  const oldBasic = selectedEmp?.base_salary || 0;
  const oldHRA = selectedEmp?.hra || 0;
  const oldConveyance = selectedEmp?.conveyance_allowance || 0;
  const oldMedical = selectedEmp?.medical_allowance || 0;
  const oldChildrenEdu = selectedEmp?.edu_allowance || 0;
  
  // Get new salary from the most recent salary revision
  const latestRevision = useMemo(() => {
    if (!selectedEmpId) return null;
    // Find the revision that matches the effective date
    const revisions = (slips || []).filter(s => s.employee_id === selectedEmpId);
    // For now, use current employee master as "new" if restructure was applied
    return selectedEmp;
  }, [selectedEmpId, slips, selectedEmp]);
  
  const arrearMonths = useMemo(() => {
    if (!arrearFrom || !arrearTo || !selectedEmp) return [];
    
    const monthList = getMonthList(arrearFrom, arrearTo);
    
    // For now, use current employee master as "new" salary
    // In production, this would come from the salary revision with the effective date
    const newBasic = selectedEmp.base_salary;
    const newHRA = selectedEmp.hra || 0;
    const newConveyance = selectedEmp.conveyance_allowance || 0;
    const newMedical = selectedEmp.medical_allowance || 0;
    const newChildrenEdu = selectedEmp.edu_allowance || 0;
    
    return monthList.map(month => {
      const calendarDays = getDaysInMonth(month);
      
      // Get actual paid days from attendance
      const att = attendance.find(a => a.employee_id === selectedEmpId && a.month === month);
      const paidDays = att?.pay_days !== undefined ? Number(att.pay_days) : (att ? (att.working_days || calendarDays) - (att.lop_days || 0) : calendarDays);
      
      return calculateMonthArrear(
        month,
        oldBasic, newBasic,
        oldHRA, newHRA,
        oldConveyance, newConveyance,
        oldMedical, newMedical,
        oldChildrenEdu, newChildrenEdu,
        paidDays, calendarDays,
        pfApplicable, esicApplicable, bonusApplicable
      );
    });
  }, [arrearFrom, arrearTo, selectedEmp, selectedEmpId, attendance, pfApplicable, esicApplicable, bonusApplicable, oldBasic, oldHRA, oldConveyance, oldMedical, oldChildrenEdu]);
  
  const totalArrear = arrearMonths.reduce((sum, m) => sum + m.arrearDifference, 0);
  
  const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');
  
  const exportToExcel = () => {
    const headers = ['Month', 'Calendar Days', 'Paid Days', 'Old Basic', 'New Basic', 'Old HRA', 'New HRA', 'Old Gross', 'New Gross', 'Old Employer PF', 'New Employer PF', 'Old Bonus', 'New Bonus', 'Old Payable', 'New Payable', 'Arrear'];
    const data = arrearMonths.map(m => [
      m.month, m.calendarDays, m.paidDays,
      m.oldBasic, m.newBasic, m.oldHRA, m.newHRA,
      m.oldGross, m.newGross, m.oldEmployerPF, m.newEmployerPF,
      m.oldBonus, m.newBonus, m.oldPayable, m.newPayable, m.arrearDifference
    ]);
    data.push(['TOTAL', '', '', '', '', '', '', '', '', '', '', '', '', '', '', totalArrear]);
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Arrear Working');
    XLSX.writeFile(wb, `Arrear_Working_${selectedEmpId}_${arrearFrom}_to_${arrearTo}.xlsx`);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Calculator size={28} />
          <div>
            <h2 className="text-xl font-extrabold">Arrear Working</h2>
            <p className="text-amber-100 text-xs mt-0.5">Calculate month-wise arrears for retrospective salary revisions</p>
          </div>
        </div>
      </div>
      
      {/* Input Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Employee</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs font-medium bg-gray-50 focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer">
                <option value="">— Select Employee —</option>
                {filteredEmployees.filter(e => e.status === 'ACTIVE').map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.id} — {emp.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Arrear From</label>
            <input type="month" value={arrearFrom} onChange={(e) => setArrearFrom(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:ring-2 focus:ring-amber-500" />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Arrear To</label>
            <input type="month" value={arrearTo} onChange={(e) => setArrearTo(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:ring-2 focus:ring-amber-500" />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Effective From</label>
            <input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>
        
        {/* Applicability */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={pfApplicable} onChange={(e) => setPfApplicable(e.target.checked)} className="rounded" />
            <span className="font-bold">PF Applicable</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={esicApplicable} onChange={(e) => setEsicApplicable(e.target.checked)} className="rounded" />
            <span className="font-bold">ESIC Applicable</span>
          </label>
          <label className="flex items-center gap-2 text-xs cursor-pointer">
            <input type="checkbox" checked={bonusApplicable} onChange={(e) => setBonusApplicable(e.target.checked)} className="rounded" />
            <span className="font-bold">Bonus Applicable</span>
          </label>
        </div>
        
        {selectedEmp && (
          <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px]">Current Basic</span>
              <span className="font-mono font-bold">{formatINR(selectedEmp.base_salary)}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Current HRA</span>
              <span className="font-mono">{formatINR(selectedEmp.hra || 0)}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Current Special</span>
              <span className="font-mono">{formatINR(selectedEmp.special_allowance || 0)}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Current CTC</span>
              <span className="font-mono font-bold">{formatINR(selectedEmp.ctc_salary || 0)}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">PF</span>
              <span className="font-mono">{selectedEmp.pf_opt_in ? 'YES' : 'NO'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">ESIC</span>
              <span className="font-mono">{selectedEmp.esic_opt_in ? 'YES' : 'NO'}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Arrear Month-wise Table */}
      {arrearMonths.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-gray-900">📊 Month-wise Arrear Working</h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {arrearFrom} to {arrearTo} — {arrearMonths.length} months
              </p>
            </div>
            <button onClick={exportToExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5">
              <FileSpreadsheet size={13} /> Export Excel
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-gray-50 border-b text-[10px] font-bold text-gray-500 uppercase">
                  <th className="p-3">Month</th>
                  <th className="p-3 text-center">Cal Days</th>
                  <th className="p-3 text-center">Paid Days</th>
                  <th className="p-3 text-right">Old Payable</th>
                  <th className="p-3 text-right">New Payable</th>
                  <th className="p-3 text-right font-extrabold text-amber-700">Arrear</th>
                  <th className="p-3 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {arrearMonths.map((m, idx) => (
                  <tr key={m.month} className={`hover:bg-gray-50/50 ${m.arrearDifference > 0 ? '' : 'text-gray-400'}`}>
                    <td className="p-3 text-xs font-bold">{m.month}</td>
                    <td className="p-3 text-xs text-center">{m.calendarDays}</td>
                    <td className="p-3 text-xs text-center font-bold">{m.paidDays}</td>
                    <td className="p-3 text-xs text-right font-mono">{formatINR(m.oldPayable)}</td>
                    <td className="p-3 text-xs text-right font-mono">{formatINR(m.newPayable)}</td>
                    <td className={`p-3 text-xs text-right font-mono font-extrabold ${m.arrearDifference > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                      {m.arrearDifference > 0 ? `+${formatINR(m.arrearDifference)}` : formatINR(m.arrearDifference)}
                    </td>
                    <td className="p-3 text-center">
                      <details className="group">
                        <summary className="text-[10px] text-indigo-600 cursor-pointer hover:underline">View Breakdown</summary>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-[10px] space-y-1">
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-gray-500">Old Basic:</span><span className="font-mono">{formatINR(m.oldBasic)}</span><span></span>
                            <span className="text-gray-500">New Basic:</span><span className="font-mono">{formatINR(m.newBasic)}</span><span className="text-amber-600 font-bold">+{formatINR(m.newBasic - m.oldBasic)}</span>
                            <span className="text-gray-500">Old HRA:</span><span className="font-mono">{formatINR(m.oldHRA)}</span><span></span>
                            <span className="text-gray-500">New HRA:</span><span className="font-mono">{formatINR(m.newHRA)}</span><span className="text-amber-600 font-bold">+{formatINR(m.newHRA - m.oldHRA)}</span>
                            <span className="text-gray-500">Old Gross:</span><span className="font-mono">{formatINR(m.oldGross)}</span><span></span>
                            <span className="text-gray-500">New Gross:</span><span className="font-mono">{formatINR(m.newGross)}</span><span className="text-amber-600 font-bold">+{formatINR(m.newGross - m.oldGross)}</span>
                            <span className="text-gray-500">Old PF:</span><span className="font-mono">{formatINR(m.oldEmployerPF)}</span><span></span>
                            <span className="text-gray-500">New PF:</span><span className="font-mono">{formatINR(m.newEmployerPF)}</span><span className="text-amber-600 font-bold">+{formatINR(m.newEmployerPF - m.oldEmployerPF)}</span>
                            <span className="text-gray-500">Old Bonus:</span><span className="font-mono">{formatINR(m.oldBonus)}</span><span></span>
                            <span className="text-gray-500">New Bonus:</span><span className="font-mono">{formatINR(m.newBonus)}</span><span className="text-amber-600 font-bold">+{formatINR(m.newBonus - m.oldBonus)}</span>
                          </div>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50 border-t-2 border-amber-200">
                  <td colSpan={5} className="p-3 text-xs font-extrabold text-amber-900">TOTAL ARREAR</td>
                  <td className="p-3 text-right text-sm font-mono font-extrabold text-amber-700">{formatINR(totalArrear)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      
      {arrearFrom && arrearTo && arrearMonths.length === 0 && selectedEmpId && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-2">
          <Clock size={16} className="text-amber-500" />
          <span className="text-xs text-amber-700">Select valid Arrear From and To months to calculate.</span>
        </div>
      )}
    </div>
  );
}
