import React, { useState, useEffect, useMemo } from 'react';
import { Employee, SalaryRevision } from '../types';
import { TrendingUp, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

interface SalaryRevisionFormProps {
  employees: Employee[];
  activeCompany: string;
  activeHRName: string;
  onSuccess: () => void;
}

export default function SalaryRevisionForm({
  employees,
  activeCompany,
  activeHRName,
  onSuccess
}: SalaryRevisionFormProps) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('Annual Performance Appraisal');
  const [remarks, setRemarks] = useState('');
  
  // Increments state for each salary head
  const [incBasic, setIncBasic] = useState(0);
  const [incHra, setIncHra] = useState(0);
  const [incConveyance, setIncConveyance] = useState(0);
  const [incChildEdu, setIncChildEdu] = useState(0);
  const [incMedical, setIncMedical] = useState(0);
  const [incSpecial, setIncSpecial] = useState(0);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Find selected employee object
  const selectedEmp = useMemo(() => {
    return employees.find(e => e.id === selectedEmpId);
  }, [selectedEmpId, employees]);

  // Reset increments when employee changes
  useEffect(() => {
    setIncBasic(0);
    setIncHra(0);
    setIncConveyance(0);
    setIncChildEdu(0);
    setIncMedical(0);
    setIncSpecial(0);
    setFormError('');
    setFormSuccess('');
  }, [selectedEmpId]);

  // Old Salary breakdown
  const oldStructure = useMemo(() => {
    if (!selectedEmp) return null;
    const basic = selectedEmp.base_salary || 0;
    const hra = selectedEmp.hra || 0;
    const conveyance = selectedEmp.conveyance_allowance || 0;
    const childEdu = selectedEmp.edu_allowance || 0;
    const medical = selectedEmp.medical_allowance || 0;
    const special = selectedEmp.special_allowance || 0;
    
    const gross = basic + hra + conveyance + childEdu + medical + special;
    
    // PF/ESIC Employee deduction estimations
    const pfDeduction = selectedEmp.pf_opt_in ? Math.round(basic * 0.12) : 0;
    const esicDeduction = selectedEmp.esic_opt_in ? Math.round(gross * 0.0075) : 0;
    const pt = selectedEmp.professional_tax_opt_in ? 200 : 0;
    const takeHome = gross - pfDeduction - esicDeduction - pt;

    // Employer Contributions
    const empPf = selectedEmp.pf_opt_in ? Math.round(basic * 0.12) : 0;
    const empEsic = selectedEmp.esic_opt_in ? Math.round(gross * 0.0325) : 0;
    const ctc = gross + empPf + empEsic;

    return { basic, hra, conveyance, childEdu, medical, special, gross, ctc, takeHome };
  }, [selectedEmp]);

  // New Structure breakdown with incremental updates
  const newStructure = useMemo(() => {
    if (!oldStructure || !selectedEmp) return null;
    
    const basic = oldStructure.basic + (Number(incBasic) || 0);
    const hra = oldStructure.hra + (Number(incHra) || 0);
    const conveyance = oldStructure.conveyance + (Number(incConveyance) || 0);
    const childEdu = oldStructure.childEdu + (Number(incChildEdu) || 0);
    const medical = oldStructure.medical + (Number(incMedical) || 0);
    const special = oldStructure.special + (Number(incSpecial) || 0);

    const gross = basic + hra + conveyance + childEdu + medical + special;

    const pfDeduction = selectedEmp.pf_opt_in ? Math.round(basic * 0.12) : 0;
    const esicDeduction = selectedEmp.esic_opt_in ? Math.round(gross * 0.0075) : 0;
    const pt = selectedEmp.professional_tax_opt_in ? 200 : 0;
    const takeHome = gross - pfDeduction - esicDeduction - pt;

    const empPf = selectedEmp.pf_opt_in ? Math.round(basic * 0.12) : 0;
    const empEsic = selectedEmp.esic_opt_in ? Math.round(gross * 0.0325) : 0;
    const ctc = gross + empPf + empEsic;

    return { basic, hra, conveyance, childEdu, medical, special, gross, ctc, takeHome };
  }, [oldStructure, selectedEmp, incBasic, incHra, incConveyance, incChildEdu, incMedical, incSpecial]);

  // Total increment
  const totalIncrement = useMemo(() => {
    return (Number(incBasic) || 0) + 
           (Number(incHra) || 0) + 
           (Number(incConveyance) || 0) + 
           (Number(incChildEdu) || 0) + 
           (Number(incMedical) || 0) + 
           (Number(incSpecial) || 0);
  }, [incBasic, incHra, incConveyance, incChildEdu, incMedical, incSpecial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!selectedEmpId) {
      setFormError('Please select a valid employee.');
      return;
    }
    if (!effectiveDate) {
      setFormError('Effective Date is required.');
      return;
    }
    if (totalIncrement <= 0) {
      setFormError('Total increment must be greater than zero.');
      return;
    }

    // RULE: "Do not allow increment only in Basic Salary"
    const hasBasicInc = Number(incBasic) > 0;
    const hasOtherInc = (Number(incHra) > 0) || 
                        (Number(incConveyance) > 0) || 
                        (Number(incChildEdu) > 0) || 
                        (Number(incMedical) > 0) || 
                        (Number(incSpecial) > 0);

    if (hasBasicInc && !hasOtherInc) {
      setFormError('Strict Corporate Policy: Salary increment CANNOT be only in Basic Salary. Please distribute increments across other heads (e.g., HRA, Special Allowance, Conveyance, etc.).');
      return;
    }

    try {
      const payload = {
        employee_code: selectedEmpId,
        old_salary: oldStructure?.basic || 0,
        new_salary: newStructure?.basic || 0,
        effective_date: effectiveDate,
        reason: reason,
        approved_by: activeHRName,
        hra: newStructure?.hra || 0,
        conveyance_allowance: newStructure?.conveyance || 0,
        edu_allowance: newStructure?.childEdu || 0,
        medical_allowance: newStructure?.medical || 0,
        special_allowance: newStructure?.special || 0,
        remarks: remarks,
        increment_amount: totalIncrement,
        old_structure: oldStructure,
        new_structure: newStructure
      };

      const res = await fetch('/api/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit salary revision');
      }

      setFormSuccess(`Successfully recorded salary revision for ${selectedEmp?.name}! New structures synced to SQLite.`);
      
      // Reset Form fields
      setSelectedEmpId('');
      setEffectiveDate('');
      setRemarks('');
      setReason('Annual Performance Appraisal');
      
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving revision.');
    }
  };

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-indigo-500 text-white rounded-xl">
          <TrendingUp size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Salary Revision Form & Distribution Board</h3>
          <p className="text-[10px] text-slate-500">Formulate increments across multiple salary heads and evaluate live impact on CTC and Net pay.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Select Employee</label>
            <select 
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full text-xs p-2.5 border bg-white rounded-xl focus:outline-none" 
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.filter(emp => emp.status === 'ACTIVE' && (activeCompany === 'GROUP' || emp.company === activeCompany)).map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.id}) - Company: {emp.company}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Effective Date</label>
            <input 
              type="date" 
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full text-xs p-2.5 border bg-white rounded-xl focus:outline-none" 
              required 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Appraisal Category / Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs p-2.5 border bg-white rounded-xl focus:outline-none"
              required
            >
              <option value="Annual Performance Appraisal">Annual Performance Appraisal</option>
              <option value="Mid-Year Promotional Cycle">Mid-Year Promotional Cycle</option>
              <option value="Role Transition / Re-designation">Role Transition / Re-designation</option>
              <option value="Market Correction Adjustments">Market Correction Adjustments</option>
              <option value="Retention & Special Increment">Retention & Special Increment</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Approval Remarks</label>
            <input 
              type="text" 
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Remarks for increment authorization log..." 
              className="w-full text-xs p-2.5 border bg-white rounded-xl focus:outline-none" 
            />
          </div>
        </div>

        {/* Validation notifications */}
        {formError && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-2 text-rose-700 text-xs leading-normal">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        {formSuccess && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-2 text-emerald-700 text-xs leading-normal">
            <CheckCircle size={15} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>{formSuccess}</span>
          </div>
        )}

        {selectedEmp && oldStructure && newStructure && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Salary Heads Breakdown Sheet</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">Active Head: {selectedEmp.name} ({selectedEmp.id})</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Salary Head</th>
                      <th className="p-3 text-right">Old Amount (₹)</th>
                      <th className="p-3 text-center">Increment Field (₹)</th>
                      <th className="p-3 text-right">New Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {/* Basic */}
                    <tr>
                      <td className="p-3 text-slate-950 font-bold">Basic Salary</td>
                      <td className="p-3 text-right font-mono text-slate-500">₹{oldStructure.basic.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <input 
                          type="number" 
                          value={incBasic || ''} 
                          onChange={(e) => setIncBasic(Math.max(0, parseInt(e.target.value) || 0))} 
                          placeholder="0" 
                          className="w-28 text-center text-xs p-1 border rounded focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </td>
                      <td className="p-3 text-right font-mono text-slate-950 font-bold">₹{newStructure.basic.toLocaleString('en-IN')}</td>
                    </tr>
                    {/* HRA */}
                    <tr>
                      <td className="p-3 text-slate-950 font-bold">House Rent Allowance (HRA)</td>
                      <td className="p-3 text-right font-mono text-slate-500">₹{oldStructure.hra.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <input 
                          type="number" 
                          value={incHra || ''} 
                          onChange={(e) => setIncHra(Math.max(0, parseInt(e.target.value) || 0))} 
                          placeholder="0" 
                          className="w-28 text-center text-xs p-1 border rounded focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </td>
                      <td className="p-3 text-right font-mono text-slate-950 font-bold">₹{newStructure.hra.toLocaleString('en-IN')}</td>
                    </tr>
                    {/* Conveyance */}
                    <tr>
                      <td className="p-3 text-slate-950 font-bold">Conveyance Allowance</td>
                      <td className="p-3 text-right font-mono text-slate-500">₹{oldStructure.conveyance.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <input 
                          type="number" 
                          value={incConveyance || ''} 
                          onChange={(e) => setIncConveyance(Math.max(0, parseInt(e.target.value) || 0))} 
                          placeholder="0" 
                          className="w-28 text-center text-xs p-1 border rounded focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </td>
                      <td className="p-3 text-right font-mono text-slate-950 font-bold">₹{newStructure.conveyance.toLocaleString('en-IN')}</td>
                    </tr>
                    {/* Child Education */}
                    <tr>
                      <td className="p-3 text-slate-950 font-bold">Child Education Allowance</td>
                      <td className="p-3 text-right font-mono text-slate-500">₹{oldStructure.childEdu.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <input 
                          type="number" 
                          value={incChildEdu || ''} 
                          onChange={(e) => setIncChildEdu(Math.max(0, parseInt(e.target.value) || 0))} 
                          placeholder="0" 
                          className="w-28 text-center text-xs p-1 border rounded focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </td>
                      <td className="p-3 text-right font-mono text-slate-950 font-bold">₹{newStructure.childEdu.toLocaleString('en-IN')}</td>
                    </tr>
                    {/* Medical */}
                    <tr>
                      <td className="p-3 text-slate-950 font-bold">Medical Allowance</td>
                      <td className="p-3 text-right font-mono text-slate-500">₹{oldStructure.medical.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <input 
                          type="number" 
                          value={incMedical || ''} 
                          onChange={(e) => setIncMedical(Math.max(0, parseInt(e.target.value) || 0))} 
                          placeholder="0" 
                          className="w-28 text-center text-xs p-1 border rounded focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </td>
                      <td className="p-3 text-right font-mono text-slate-950 font-bold">₹{newStructure.medical.toLocaleString('en-IN')}</td>
                    </tr>
                    {/* Special Allowance */}
                    <tr>
                      <td className="p-3 text-slate-950 font-bold">Special Allowance</td>
                      <td className="p-3 text-right font-mono text-slate-500">₹{oldStructure.special.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        <input 
                          type="number" 
                          value={incSpecial || ''} 
                          onChange={(e) => setIncSpecial(Math.max(0, parseInt(e.target.value) || 0))} 
                          placeholder="0" 
                          className="w-28 text-center text-xs p-1 border rounded focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </td>
                      <td className="p-3 text-right font-mono text-slate-950 font-bold">₹{newStructure.special.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Evaluation of live totals */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-inner text-slate-300">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <FileText size={13} className="text-indigo-400" />
                Live Fiscal Outflow & CTC Impact Calculations
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 font-mono text-xs">
                {/* Gross wages panel */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">Monthly Gross Salary</span>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Old Gross:</span>
                    <span>₹{oldStructure.gross.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold">
                    <span>Increment:</span>
                    <span>+₹{totalIncrement.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-slate-850 pt-1 flex justify-between items-center text-white font-extrabold text-sm">
                    <span className="text-[10px] font-sans font-medium text-slate-400">New Gross:</span>
                    <span>₹{newStructure.gross.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* CTC Cost panel */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">Corporate Cost to Company (CTC)</span>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Old CTC Cost:</span>
                    <span>₹{oldStructure.ctc.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold">
                    <span>Increment:</span>
                    <span>+₹{(newStructure.ctc - oldStructure.ctc).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-slate-850 pt-1 flex justify-between items-center text-white font-extrabold text-sm">
                    <span className="text-[10px] font-sans font-medium text-slate-400">New CTC:</span>
                    <span>₹{newStructure.ctc.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Take home panel */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">Monthly Net Take-Home</span>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Old Take-Home:</span>
                    <span>₹{oldStructure.takeHome.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold">
                    <span>Increment:</span>
                    <span>+₹{(newStructure.takeHome - oldStructure.takeHome).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="border-t border-slate-850 pt-1 flex justify-between items-center text-white font-extrabold text-sm">
                    <span className="text-[10px] font-sans font-medium text-slate-400">New Take-Home:</span>
                    <span>₹{newStructure.takeHome.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-5 pt-3 border-t border-slate-800">
                <button 
                  type="submit" 
                  disabled={totalIncrement <= 0}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-xs text-white font-extrabold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  Authorized & Commit Salary Revision
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
