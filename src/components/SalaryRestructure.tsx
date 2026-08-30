import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Save, Search, ChevronDown, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { Employee } from '../types';

interface SalaryRestructureProps {
  employees: Employee[];
  activeCompany?: string;
  onRefresh?: () => void;
}

interface RestructureResult {
  annualCTC: number;
  monthlyCTC: number;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medical: number;
  childrenEdu: number;
  specialAllowance: number;
  grossSalary: number;
  employerPF: number;
  employerESIC: number;
  bonus: number;
  calculatedCTC: number;
  employeePF: number;
  employeeESIC: number;
  professionalTax: number;
  tds: number;
  otherDeductions: number;
  totalDeductions: number;
  netTakeHome: number;
  difference: number;
  pfApplicable: boolean;
  esicApplicable: boolean;
  bonusApplicable: boolean;
}

function reverseCTCCalculation(
  annualCTC: number,
  pfApplicable: boolean,
  esicApplicable: boolean,
  bonusApplicable: boolean
): RestructureResult {
  const monthlyCTC = annualCTC / 12;
  
  // CTC = Gross + EmployerPF + EmployerESIC + Bonus
  // EmployerPF = 12% of Basic
  // Bonus = 8.33% of Basic
  // Gross = Basic + HRA + Conveyance + Medical + ChildrenEdu + Special
  // HRA = 40% of Basic (standard)
  // Conveyance = Fixed ₹1,600/month (standard)
  // Medical = 5% of Basic
  // Children Edu = ₹200/month (CEA standard)
  
  const pfRate = pfApplicable ? 0.12 : 0;
  const bonusRate = bonusApplicable ? 0.0833 : 0;
  const esicRate = esicApplicable ? 0.0325 : 0; // employer ESIC 3.25%
  
  // Iterative reverse calculation
  // CTC = Basic + HRA + Conv + Med + CEA + Special + EmpPF + EmpESIC + Bonus
  // CTC = Basic + 0.40*Basic + 1600 + 0.05*Basic + 200 + Special + 0.12*Basic + 0.0325*Gross + 0.0833*Basic
  
  // Simplified: Ignore ESIC for first iteration (ESIC is % of Gross, small amount)
  // CTC ≈ Basic * (1 + 0.40 + 0.05 + pfRate + bonusRate) + 1600 + 200 + Special
  
  // For initial estimate, assume Special = 0
  // CTC ≈ Basic * (1.45 + pfRate + bonusRate) + 1800
  // Basic ≈ (CTC - 1800) / (1.45 + pfRate + bonusRate)
  
  const divisor = 1.45 + pfRate + bonusRate;
  let basicEstimate = (monthlyCTC - 1800) / divisor;
  
  // Iterative refinement (5 iterations should converge)
  for (let i = 0; i < 10; i++) {
    const hra = Math.round(basicEstimate * 0.40);
    const conveyance = 1600;
    const medical = Math.round(basicEstimate * 0.05);
    const childrenEdu = 200;
    
    let gross = Math.round(basicEstimate) + hra + conveyance + medical + childrenEdu;
    
    // ESIC is % of Gross if applicable and below threshold
    let employerESIC = 0;
    if (esicApplicable && gross <= 21000) {
      employerESIC = Math.round(gross * 0.0325);
    }
    
    const employerPF = pfApplicable ? Math.round(basicEstimate * 0.12) : 0;
    const bonus = bonusApplicable ? Math.round(basicEstimate * 0.0833) : 0;
    
    const totalCTC = gross + employerPF + employerESIC + bonus;
    const diff = monthlyCTC - totalCTC;
    
    // Adjust basic to converge
    if (Math.abs(diff) < 1) break;
    basicEstimate += diff / divisor;
  }
  
  // Final calculation with converged basic
  const basicSalary = Math.round(basicEstimate);
  const hra = Math.round(basicSalary * 0.40);
  const conveyance = 1600;
  const medical = Math.round(basicSalary * 0.05);
  const childrenEdu = 200;
  
  let grossSalary = basicSalary + hra + conveyance + medical + childrenEdu;
  
  // Special allowance = remaining to reach gross (if any gap)
  // In our model, gross = sum of all components, no special needed
  const specialAllowance = 0;
  
  // Recalculate gross without special
  grossSalary = basicSalary + hra + conveyance + medical + childrenEdu + specialAllowance;
  
  let employerPF = pfApplicable ? Math.round(basicSalary * 0.12) : 0;
  let employerESIC = 0;
  if (esicApplicable && grossSalary <= 21000) {
    employerESIC = Math.round(grossSalary * 0.0325);
  }
  const bonus = bonusApplicable ? Math.round(basicSalary * 0.0833) : 0;
  
  const calculatedCTC = grossSalary + employerPF + employerESIC + bonus;
  
  // Employee deductions
  const employeePF = pfApplicable ? Math.round(basicSalary * 0.12) : 0;
  const employeeESIC = 0; // 0.75% of gross if applicable
  if (esicApplicable && grossSalary <= 21000) {
    // employeeESIC = Math.round(grossSalary * 0.0075);
    // For now, keep as 0 per current VETAN config
  }
  
  let professionalTax = 0;
  if (grossSalary > 15000) professionalTax = 200;
  else if (grossSalary > 10000) professionalTax = 150;
  
  const tds = 0; // Manual input
  const otherDeductions = 0; // Manual input
  
  const totalDeductions = employeePF + employeeESIC + professionalTax + tds + otherDeductions;
  const netTakeHome = grossSalary - totalDeductions;
  
  return {
    annualCTC,
    monthlyCTC,
    basicSalary,
    hra,
    conveyance,
    medical,
    childrenEdu,
    specialAllowance,
    grossSalary,
    employerPF,
    employerESIC,
    bonus,
    calculatedCTC,
    employeePF,
    employeeESIC,
    professionalTax,
    tds,
    otherDeductions,
    totalDeductions,
    netTakeHome,
    difference: Math.abs(monthlyCTC - calculatedCTC),
    pfApplicable,
    esicApplicable,
    bonusApplicable
  };
}

export default function SalaryRestructure({ employees, activeCompany = 'ALL', onRefresh }: SalaryRestructureProps) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [annualCTC, setAnnualCTC] = useState('');
  const [pfApplicable, setPfApplicable] = useState(true);
  const [esicApplicable, setEsicApplicable] = useState(false);
  const [bonusApplicable, setBonusApplicable] = useState(true);
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const filteredEmployees = employees.filter(emp => {
    if (!activeCompany || activeCompany === 'ALL' || activeCompany === 'GROUP') return true;
    return emp.company === activeCompany;
  });
  
  const selectedEmp = employees.find(e => e.id === selectedEmpId);
  
  const result = useMemo(() => {
    const ctc = parseFloat(annualCTC);
    if (!ctc || ctc <= 0) return null;
    return reverseCTCCalculation(ctc, pfApplicable, esicApplicable, bonusApplicable);
  }, [annualCTC, pfApplicable, esicApplicable, bonusApplicable]);
  
  const handleApply = async () => {
    if (!selectedEmp || !result || !effectiveFrom) {
      setErrorMsg('Please select employee, enter CTC and effective date');
      return;
    }
    
    setSaving(true);
    setErrorMsg('');
    
    try {
      // Save to salary_revisions table
      const res = await fetch('/api/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-operator-role': 'SUPER_HR', 'x-operator-name': 'Vishnu Arrawatia' },
        body: JSON.stringify({
          employee_id: selectedEmp.id,
          employee_name: selectedEmp.name,
          company: selectedEmp.company,
          effective_from: effectiveFrom,
          type: 'SALARY_RESTRUCTURE',
          old_ctc: selectedEmp.ctc_salary || 0,
          new_ctc: result.annualCTC,
          old_base: selectedEmp.base_salary,
          new_base: result.basicSalary,
          old_hra: selectedEmp.hra || 0,
          new_hra: result.hra,
          old_special: selectedEmp.special_allowance || 0,
          new_special: result.specialAllowance,
          old_edu: selectedEmp.edu_allowance || 0,
          new_edu: result.childrenEdu,
          old_medical: selectedEmp.medical_allowance || 0,
          new_medical: result.medical,
          old_conveyance: selectedEmp.conveyance_allowance || 0,
          new_conveyance: result.conveyance,
          pf_applicable: pfApplicable,
          esic_applicable: esicApplicable,
          bonus_applicable: bonusApplicable,
          reason: reason || 'Salary Restructure',
          created_by: 'Vishnu Arrawatia'
        })
      });
      
      const data = await res.json();
      if (data.success || data.id) {
        // Also update employee master with new salary structure
        await fetch(`/api/employees/${selectedEmp.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'x-operator-role': 'SUPER_HR', 'x-operator-name': 'Vishnu Arrawatia' },
          body: JSON.stringify({
            base_salary: result.basicSalary,
            hra: result.hra,
            special_allowance: result.specialAllowance,
            edu_allowance: result.childrenEdu,
            medical_allowance: result.medical,
            conveyance_allowance: result.conveyance,
            ctc_salary: result.annualCTC,
            pf_opt_in: pfApplicable,
            esic_opt_in: esicApplicable
          })
        });
        
        setSaved(true);
        setTimeout(() => setSaved(false), 5000);
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg(data.error || 'Failed to save salary restructure');
      }
    } catch (e: any) {
      setErrorMsg('Network error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };
  
  const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN');
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Calculator size={28} />
          <div>
            <h2 className="text-xl font-extrabold">Salary Restructure</h2>
            <p className="text-indigo-200 text-xs mt-0.5">Enter Annual CTC — system reverse-calculates complete salary breakup</p>
          </div>
        </div>
      </div>
      
      {/* Employee Selection + CTC Input */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Employee Select */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Employee</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs font-medium bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none cursor-pointer"
              >
                <option value="">— Select Employee —</option>
                {filteredEmployees.filter(e => e.status === 'ACTIVE').map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.id} — {emp.name} ({emp.company})</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
            </div>
          </div>
          
          {/* Annual CTC */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Annual CTC (₹)</label>
            <input
              type="number"
              value={annualCTC}
              onChange={(e) => setAnnualCTC(e.target.value)}
              placeholder="e.g. 600000"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-mono font-bold bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Effective From */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Effective From</label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-medium bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        {/* Applicability Toggles */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-3 rounded-xl border-2 cursor-pointer transition ${pfApplicable ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}
               onClick={() => setPfApplicable(!pfApplicable)}>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-5 rounded-full transition-colors ${pfApplicable ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${pfApplicable ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
              </div>
              <span className="text-xs font-bold">PF Applicable</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Employer + Employee PF = 12% of Basic</p>
          </div>
          
          <div className={`p-3 rounded-xl border-2 cursor-pointer transition ${esicApplicable ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}
               onClick={() => setEsicApplicable(!esicApplicable)}>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-5 rounded-full transition-colors ${esicApplicable ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${esicApplicable ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
              </div>
              <span className="text-xs font-bold">ESIC Applicable</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">If Gross ≤ ₹21,000</p>
          </div>
          
          <div className={`p-3 rounded-xl border-2 cursor-pointer transition ${bonusApplicable ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-gray-50'}`}
               onClick={() => setBonusApplicable(!bonusApplicable)}>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-5 rounded-full transition-colors ${bonusApplicable ? 'bg-amber-500' : 'bg-gray-300'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${bonusApplicable ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
              </div>
              <span className="text-xs font-bold">Bonus Applicable</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">8.33% of Basic Salary</p>
          </div>
        </div>
        
        {/* Reason */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Reason / Remarks</label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Annual Increment, Promotion, etc."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
      
      {/* Calculated Breakdown */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Salary Break-up */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider border-b pb-2">
              💰 Salary Break-up (Monthly)
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Basic Salary</span>
                <span className="font-mono font-bold">{formatINR(result.basicSalary)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">HRA (40% of Basic)</span>
                <span className="font-mono">{formatINR(result.hra)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Conveyance Allowance</span>
                <span className="font-mono">{formatINR(result.conveyance)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Medical Allowance (5% of Basic)</span>
                <span className="font-mono">{formatINR(result.medical)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Children Education Allowance</span>
                <span className="font-mono">{formatINR(result.childrenEdu)}</span>
              </div>
              {result.specialAllowance > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Special Allowance</span>
                  <span className="font-mono">{formatINR(result.specialAllowance)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-xs font-extrabold">
                <span className="text-gray-900">GROSS SALARY</span>
                <span className="font-mono text-indigo-700">{formatINR(result.grossSalary)}</span>
              </div>
            </div>
          </div>
          
          {/* Employer Contributions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider border-b pb-2">
              🏢 Employer Contributions / CTC Cost
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Employer PF (12% of Basic)</span>
                <span className="font-mono">{formatINR(result.employerPF)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Employer ESIC (3.25% of Gross)</span>
                <span className="font-mono">{formatINR(result.employerESIC)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Bonus (8.33% of Basic)</span>
                <span className="font-mono">{formatINR(result.bonus)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-xs font-extrabold">
                <span className="text-gray-900">TOTAL CTC</span>
                <span className="font-mono text-emerald-700">{formatINR(result.calculatedCTC)}</span>
              </div>
              
              {/* CTC Reconciliation */}
              <div className={`mt-3 p-3 rounded-xl text-xs ${result.difference <= 1 ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Monthly CTC (Entered)</span>
                  <span className="font-mono font-bold">{formatINR(result.monthlyCTC)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Calculated CTC</span>
                  <span className="font-mono font-bold">{formatINR(result.calculatedCTC)}</span>
                </div>
                <div className="flex justify-between font-extrabold">
                  <span>Difference</span>
                  <span className={result.difference <= 1 ? 'text-emerald-700' : 'text-amber-700'}>
                    {result.difference <= 1 ? '✅ ₹0 (Rounded)' : `⚠️ ${formatINR(result.difference)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Employee Deductions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider border-b pb-2">
              📉 Employee Deductions
            </h3>
            
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Employee PF (12% of Basic)</span>
                <span className="font-mono">{formatINR(result.employeePF)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Employee ESIC (0.75%)</span>
                <span className="font-mono">{formatINR(result.employeeESIC)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Professional Tax</span>
                <span className="font-mono">{formatINR(result.professionalTax)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">TDS</span>
                <span className="font-mono">{formatINR(result.tds)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">Other Deductions</span>
                <span className="font-mono">{formatINR(result.otherDeductions)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between text-xs font-extrabold">
                <span className="text-gray-900">TOTAL DEDUCTIONS</span>
                <span className="font-mono text-red-600">{formatINR(result.totalDeductions)}</span>
              </div>
              
              <div className="mt-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex justify-between text-sm font-extrabold">
                  <span className="text-blue-900">NET TAKE HOME</span>
                  <span className="font-mono text-blue-700">{formatINR(result.netTakeHome)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Selected Employee Current Info */}
      {selectedEmp && (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
          <h3 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">📋 Current Employee Salary Structure</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div>
              <span className="text-gray-400 block text-[10px]">Basic</span>
              <span className="font-mono font-bold">{formatINR(selectedEmp.base_salary)}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">HRA</span>
              <span className="font-mono">{formatINR(selectedEmp.hra || 0)}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">Special</span>
              <span className="font-mono">{formatINR(selectedEmp.special_allowance || 0)}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[10px]">CTC</span>
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
        </div>
      )}
      
      {/* Error / Success Messages */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" />
          <span className="text-xs text-red-700">{errorMsg}</span>
        </div>
      )}
      
      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-2">
          <CheckCircle size={16} className="text-emerald-500" />
          <span className="text-xs text-emerald-700 font-bold">Salary Restructure saved successfully! Employee master updated.</span>
        </div>
      )}
      
      {/* Apply Button */}
      {result && selectedEmp && effectiveFrom && (
        <div className="flex justify-end">
          <button
            onClick={handleApply}
            disabled={saving || result.difference > 5}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving...' : 'Apply Salary Restructure'}
          </button>
        </div>
      )}
    </div>
  );
}
