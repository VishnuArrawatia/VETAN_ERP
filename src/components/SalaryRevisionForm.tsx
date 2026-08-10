import React, { useState, useEffect, useMemo } from 'react';
import { Employee } from '../types';
import { TrendingUp, FileText, AlertTriangle, CheckCircle, Plus, Minus, RefreshCw } from 'lucide-react';

interface SalaryRevisionFormProps {
  employees: Employee[];
  activeCompany: string;
  activeHRName: string;
  onSuccess: () => void;
}

type RevisionMode = 'INCREMENT' | 'RESTRUCTURE';

type HeadKey = 'basic' | 'hra' | 'conveyance' | 'childEdu' | 'medical' | 'special';

interface HeadDef {
  key: HeadKey;
  label: string;
}

const HEADS: HeadDef[] = [
  { key: 'basic', label: 'Basic Salary' },
  { key: 'hra', label: 'House Rent Allowance (HRA)' },
  { key: 'conveyance', label: 'Conveyance Allowance' },
  { key: 'childEdu', label: 'Child Education Allowance' },
  { key: 'medical', label: 'Medical Allowance' },
  { key: 'special', label: 'Special Allowance' },
];

const emptyAdj = (): Record<HeadKey, number> => ({
  basic: 0,
  hra: 0,
  conveyance: 0,
  childEdu: 0,
  medical: 0,
  special: 0,
});

export default function SalaryRevisionForm({
  employees,
  activeCompany,
  activeHRName,
  onSuccess
}: SalaryRevisionFormProps) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [mode, setMode] = useState<RevisionMode>('INCREMENT');
  const [reason, setReason] = useState('Annual Performance Appraisal');
  const [remarks, setRemarks] = useState('');
  const [adj, setAdj] = useState<Record<HeadKey, number>>(emptyAdj());

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const selectedEmp = useMemo(
    () => employees.find(e => e.id === selectedEmpId),
    [selectedEmpId, employees]
  );

  useEffect(() => {
    setAdj(emptyAdj());
    setFormError('');
    setFormSuccess('');
  }, [selectedEmpId, mode]);

  useEffect(() => {
    if (mode === 'RESTRUCTURE') {
      setReason('Salary Restructure / Head Redistribution');
    } else if (reason === 'Salary Restructure / Head Redistribution') {
      setReason('Annual Performance Appraisal');
    }
  }, [mode]);

  const oldStructure = useMemo(() => {
    if (!selectedEmp) return null;
    const basic = selectedEmp.base_salary || 0;
    const hra = selectedEmp.hra || 0;
    const conveyance = selectedEmp.conveyance_allowance || 0;
    const childEdu = selectedEmp.edu_allowance || 0;
    const medical = selectedEmp.medical_allowance || 0;
    const special = selectedEmp.special_allowance || 0;
    const gross = basic + hra + conveyance + childEdu + medical + special;

    // Display-only estimates — master PF/ESIC rates unchanged in payroll engine
    const pfWage = Math.min(15000, basic);
    const pfDeduction = selectedEmp.pf_opt_in ? Math.round(pfWage * 0.12) : 0;
    const esicDeduction = selectedEmp.esic_opt_in ? Math.round(gross * 0.0075) : 0;
    const pt = selectedEmp.professional_tax_opt_in ? 200 : 0;
    const takeHome = gross - pfDeduction - esicDeduction - pt;
    const empPf = selectedEmp.pf_opt_in ? Math.round(pfWage * 0.12) : 0;
    const empEsic = selectedEmp.esic_opt_in ? Math.round(gross * 0.0325) : 0;
    const ctc = gross + empPf + empEsic;

    return { basic, hra, conveyance, childEdu, medical, special, gross, ctc, takeHome };
  }, [selectedEmp]);

  const newStructure = useMemo(() => {
    if (!oldStructure || !selectedEmp) return null;

    const basic = Math.max(0, oldStructure.basic + (Number(adj.basic) || 0));
    const hra = Math.max(0, oldStructure.hra + (Number(adj.hra) || 0));
    const conveyance = Math.max(0, oldStructure.conveyance + (Number(adj.conveyance) || 0));
    const childEdu = Math.max(0, oldStructure.childEdu + (Number(adj.childEdu) || 0));
    const medical = Math.max(0, oldStructure.medical + (Number(adj.medical) || 0));
    const special = Math.max(0, oldStructure.special + (Number(adj.special) || 0));
    const gross = basic + hra + conveyance + childEdu + medical + special;

    const pfWage = Math.min(15000, basic);
    const pfDeduction = selectedEmp.pf_opt_in ? Math.round(pfWage * 0.12) : 0;
    const esicDeduction = selectedEmp.esic_opt_in ? Math.round(gross * 0.0075) : 0;
    const pt = selectedEmp.professional_tax_opt_in ? 200 : 0;
    const takeHome = gross - pfDeduction - esicDeduction - pt;
    const empPf = selectedEmp.pf_opt_in ? Math.round(pfWage * 0.12) : 0;
    const empEsic = selectedEmp.esic_opt_in ? Math.round(gross * 0.0325) : 0;
    const ctc = gross + empPf + empEsic;

    return { basic, hra, conveyance, childEdu, medical, special, gross, ctc, takeHome };
  }, [oldStructure, selectedEmp, adj]);

  const netChange = useMemo(() => {
    if (!oldStructure || !newStructure) return 0;
    return newStructure.gross - oldStructure.gross;
  }, [oldStructure, newStructure]);

  const hasAnyChange = useMemo(
    () => HEADS.some(h => (Number(adj[h.key]) || 0) !== 0),
    [adj]
  );

  const setHeadAdj = (key: HeadKey, value: number) => {
    if (!oldStructure) return;
    const oldVal = oldStructure[key];
    // Do not allow new amount below 0
    const clamped = Math.max(-oldVal, Math.round(value) || 0);
    setAdj(prev => ({ ...prev, [key]: clamped }));
  };

  const bumpHead = (key: HeadKey, delta: number) => {
    setHeadAdj(key, (Number(adj[key]) || 0) + delta);
  };

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
    if (!hasAnyChange || !oldStructure || !newStructure) {
      setFormError('At least one salary head must be changed (+ or −).');
      return;
    }

    if (mode === 'INCREMENT' && netChange <= 0) {
      setFormError('Increment mode me net Gross badhna chahiye. Agar sirf heads shift karne hain to Restructure mode use karein.');
      return;
    }

    // Policy: increment cannot be only in Basic (still allow pure basic reduce in restructure)
    if (mode === 'INCREMENT') {
      const hasBasicInc = (Number(adj.basic) || 0) > 0;
      const hasOtherInc = HEADS.filter(h => h.key !== 'basic').some(h => (Number(adj[h.key]) || 0) > 0);
      if (hasBasicInc && !hasOtherInc && (Number(adj.basic) || 0) === netChange) {
        setFormError('Strict Corporate Policy: Increment CANNOT be only in Basic Salary. Distribute across other heads (HRA / Special / Conveyance, etc.), or use Restructure.');
        return;
      }
    }

    for (const h of HEADS) {
      if (newStructure[h.key] < 0) {
        setFormError(`${h.label} cannot go below ₹0.`);
        return;
      }
    }

    try {
      const payload = {
        employee_code: selectedEmpId,
        old_salary: oldStructure.basic,
        new_salary: newStructure.basic,
        effective_date: effectiveDate,
        reason: mode === 'RESTRUCTURE'
          ? (reason.includes('Restructure') ? reason : `Restructure: ${reason}`)
          : reason,
        approved_by: activeHRName,
        hra: newStructure.hra,
        conveyance_allowance: newStructure.conveyance,
        edu_allowance: newStructure.childEdu,
        medical_allowance: newStructure.medical,
        special_allowance: newStructure.special,
        remarks: `[${mode}] ${remarks || ''}`.trim(),
        increment_amount: netChange,
        old_structure: oldStructure,
        new_structure: {
          ...newStructure,
          revision_mode: mode,
          adjustments: adj
        }
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

      setFormSuccess(
        mode === 'RESTRUCTURE'
          ? `Restructure saved for ${selectedEmp?.name}. Effective ${effectiveDate}. Gross ₹${newStructure.gross.toLocaleString('en-IN')}.`
          : `Increment saved for ${selectedEmp?.name}. Effective ${effectiveDate}. Net +₹${netChange.toLocaleString('en-IN')}.`
      );

      setSelectedEmpId('');
      setEffectiveDate('');
      setRemarks('');
      setAdj(emptyAdj());
      setReason('Annual Performance Appraisal');
      setMode('INCREMENT');
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred while saving revision.');
    }
  };

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
  const fmtSigned = (n: number) => {
    const v = Math.round(n);
    if (v > 0) return `+₹${v.toLocaleString('en-IN')}`;
    if (v < 0) return `−₹${Math.abs(v).toLocaleString('en-IN')}`;
    return '₹0';
  };

  return (
    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-indigo-500 text-white rounded-xl">
          <TrendingUp size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Salary Revision — Increment & Restructure
          </h3>
          <p className="text-[10px] text-slate-500">
            Har head pe + / −. Increment me net raise; Restructure me heads shift (effective date ke saath).
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode toggle */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('INCREMENT')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
              mode === 'INCREMENT'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Plus size={13} />
            Increment
          </button>
          <button
            type="button"
            onClick={() => setMode('RESTRUCTURE')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
              mode === 'RESTRUCTURE'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <RefreshCw size={13} />
            Restructure
          </button>
          <span className="text-[10px] text-slate-500 self-center ml-1">
            {mode === 'INCREMENT'
              ? 'Net Gross badhega — kisi head me − bhi de sakte ho, dusre me +.'
              : 'Heads ke beech shift — ek head −, dusra +. Gross same ya change dono allowed.'}
          </span>
        </div>

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
              {employees
                .filter(emp => emp.status === 'ACTIVE' && (activeCompany === 'GROUP' || emp.company === activeCompany))
                .map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id}) - {emp.company}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Effective Date *</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              className="w-full text-xs p-2.5 border bg-white rounded-xl focus:outline-none"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Category / Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs p-2.5 border bg-white rounded-xl focus:outline-none"
              required
            >
              {mode === 'INCREMENT' ? (
                <>
                  <option value="Annual Performance Appraisal">Annual Performance Appraisal</option>
                  <option value="Mid-Year Promotional Cycle">Mid-Year Promotional Cycle</option>
                  <option value="Role Transition / Re-designation">Role Transition / Re-designation</option>
                  <option value="Market Correction Adjustments">Market Correction Adjustments</option>
                  <option value="Retention & Special Increment">Retention & Special Increment</option>
                </>
              ) : (
                <>
                  <option value="Salary Restructure / Head Redistribution">Salary Restructure / Head Redistribution</option>
                  <option value="Statutory / Compliance Restructure">Statutory / Compliance Restructure</option>
                  <option value="Role Transition Restructure">Role Transition Restructure</option>
                  <option value="Cost Neutral Head Shift">Cost Neutral Head Shift</option>
                </>
              )}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 block">Approval Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Authorization remarks..."
              className="w-full text-xs p-2.5 border bg-white rounded-xl focus:outline-none"
            />
          </div>
        </div>

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
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap justify-between items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Salary Heads — Old / ± Adjust / New
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {selectedEmp.name} ({selectedEmp.id}) · Mode: {mode}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Salary Head</th>
                      <th className="p-3 text-right">Old (₹)</th>
                      <th className="p-3 text-center">Adjust (+ / −)</th>
                      <th className="p-3 text-right">New (₹)</th>
                      <th className="p-3 text-right">Δ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {HEADS.map(h => {
                      const delta = Number(adj[h.key]) || 0;
                      return (
                        <tr key={h.key}>
                          <td className="p-3 text-slate-950 font-bold">{h.label}</td>
                          <td className="p-3 text-right font-mono text-slate-500">
                            {fmt(oldStructure[h.key])}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => bumpHead(h.key, -100)}
                                title="Decrease"
                                className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                              >
                                <Minus size={12} />
                              </button>
                              <input
                                type="number"
                                value={delta === 0 ? '' : delta}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  if (raw === '' || raw === '-') {
                                    setAdj(prev => ({ ...prev, [h.key]: 0 }));
                                    return;
                                  }
                                  setHeadAdj(h.key, parseInt(raw, 10) || 0);
                                }}
                                placeholder="0"
                                className={`w-24 text-center text-xs p-1.5 border rounded-lg focus:outline-none font-mono ${
                                  delta > 0
                                    ? 'border-emerald-300 text-emerald-700'
                                    : delta < 0
                                      ? 'border-rose-300 text-rose-700'
                                      : 'border-slate-200'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => bumpHead(h.key, 100)}
                                title="Increase"
                                className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-950 font-bold">
                            {fmt(newStructure[h.key])}
                          </td>
                          <td className={`p-3 text-right font-mono font-bold ${
                            delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-400'
                          }`}>
                            {fmtSigned(delta)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold">
                      <td className="p-3 text-slate-900">Gross Salary</td>
                      <td className="p-3 text-right font-mono">{fmt(oldStructure.gross)}</td>
                      <td className="p-3 text-center text-[10px] text-slate-400 uppercase">Breakup total</td>
                      <td className="p-3 text-right font-mono text-slate-950 text-sm">{fmt(newStructure.gross)}</td>
                      <td className={`p-3 text-right font-mono ${
                        netChange > 0 ? 'text-emerald-600' : netChange < 0 ? 'text-rose-600' : 'text-slate-500'
                      }`}>
                        {fmtSigned(netChange)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Gross breakup cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4">
                <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">
                  Old Gross Breakup
                </h4>
                <div className="space-y-1.5 text-xs font-mono">
                  {HEADS.map(h => (
                    <div key={h.key} className="flex justify-between text-slate-600">
                      <span className="font-sans text-slate-500">{h.label}</span>
                      <span>{fmt(oldStructure[h.key])}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
                    <span className="font-sans">Gross</span>
                    <span>{fmt(oldStructure.gross)}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-indigo-100 p-4">
                <h4 className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-3">
                  New Gross Breakup (Effective {effectiveDate || '—'})
                </h4>
                <div className="space-y-1.5 text-xs font-mono">
                  {HEADS.map(h => {
                    const delta = Number(adj[h.key]) || 0;
                    return (
                      <div key={h.key} className="flex justify-between text-slate-700">
                        <span className="font-sans text-slate-500">{h.label}</span>
                        <span>
                          {fmt(newStructure[h.key])}
                          {delta !== 0 && (
                            <span className={`ml-2 text-[10px] ${delta > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              ({fmtSigned(delta)})
                            </span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between border-t border-indigo-50 pt-2 font-bold text-indigo-900">
                    <span className="font-sans">Gross</span>
                    <span>
                      {fmt(newStructure.gross)}
                      <span className={`ml-2 text-[10px] ${netChange > 0 ? 'text-emerald-600' : netChange < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        ({fmtSigned(netChange)})
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-inner text-slate-300">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-4 border-b border-slate-800 pb-2 flex items-center gap-1.5">
                <FileText size={13} className="text-indigo-400" />
                Live Gross / CTC / Take-Home Impact
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 font-mono text-xs">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">Monthly Gross</span>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Old</span>
                    <span>{fmt(oldStructure.gross)}</span>
                  </div>
                  <div className={`flex justify-between text-[10px] font-bold ${
                    netChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    <span>Net Δ</span>
                    <span>{fmtSigned(netChange)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-1 flex justify-between items-center text-white font-extrabold text-sm">
                    <span className="text-[10px] font-sans font-medium text-slate-400">New</span>
                    <span>{fmt(newStructure.gross)}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">CTC (estimate)</span>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Old</span>
                    <span>{fmt(oldStructure.ctc)}</span>
                  </div>
                  <div className={`flex justify-between text-[10px] font-bold ${
                    newStructure.ctc - oldStructure.ctc >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    <span>Δ</span>
                    <span>{fmtSigned(newStructure.ctc - oldStructure.ctc)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-1 flex justify-between items-center text-white font-extrabold text-sm">
                    <span className="text-[10px] font-sans font-medium text-slate-400">New</span>
                    <span>{fmt(newStructure.ctc)}</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">Take-Home (estimate)</span>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">Old</span>
                    <span>{fmt(oldStructure.takeHome)}</span>
                  </div>
                  <div className={`flex justify-between text-[10px] font-bold ${
                    newStructure.takeHome - oldStructure.takeHome >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    <span>Δ</span>
                    <span>{fmtSigned(newStructure.takeHome - oldStructure.takeHome)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-1 flex justify-between items-center text-white font-extrabold text-sm">
                    <span className="text-[10px] font-sans font-medium text-slate-400">New</span>
                    <span>{fmt(newStructure.takeHome)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-3 border-t border-slate-800">
                <p className="text-[10px] text-slate-500 max-w-md">
                  Effective date: <strong className="text-slate-300">{effectiveDate || 'not set'}</strong>.
                  Payroll engine PF / Bonus / ESIC master formulas unchanged — yahan sirf head amounts update hote hain.
                </p>
                <button
                  type="submit"
                  disabled={!hasAnyChange || !effectiveDate}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-xs text-white font-extrabold rounded-xl transition cursor-pointer shadow-lg shadow-indigo-600/15"
                >
                  {mode === 'RESTRUCTURE' ? 'Commit Restructure' : 'Commit Increment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
