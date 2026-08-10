import React, { useState, useEffect, useMemo } from 'react';
import { Employee } from '../types';
import { TrendingUp, FileText, AlertTriangle, CheckCircle, Plus, Minus, RefreshCw, Users } from 'lucide-react';

interface SalaryRevisionFormProps {
  employees: Employee[];
  activeCompany: string;
  activeHRName: string;
  onSuccess: () => void;
}

type RevisionMode = 'INCREMENT' | 'RESTRUCTURE';
type ApplyScope = 'ONE' | 'UNIT' | 'ALL';
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

function buildStructure(emp: Employee, adjustments: Record<HeadKey, number>) {
  const basic0 = emp.base_salary || 0;
  const hra0 = emp.hra || 0;
  const conveyance0 = emp.conveyance_allowance || 0;
  const childEdu0 = emp.edu_allowance || 0;
  const medical0 = emp.medical_allowance || 0;
  const special0 = emp.special_allowance || 0;

  const old = {
    basic: basic0,
    hra: hra0,
    conveyance: conveyance0,
    childEdu: childEdu0,
    medical: medical0,
    special: special0,
    gross: basic0 + hra0 + conveyance0 + childEdu0 + medical0 + special0,
  };

  const basic = Math.max(0, basic0 + (Number(adjustments.basic) || 0));
  const hra = Math.max(0, hra0 + (Number(adjustments.hra) || 0));
  const conveyance = Math.max(0, conveyance0 + (Number(adjustments.conveyance) || 0));
  const childEdu = Math.max(0, childEdu0 + (Number(adjustments.childEdu) || 0));
  const medical = Math.max(0, medical0 + (Number(adjustments.medical) || 0));
  const special = Math.max(0, special0 + (Number(adjustments.special) || 0));
  const gross = basic + hra + conveyance + childEdu + medical + special;

  const pfWageOld = Math.min(15000, basic0);
  const pfWageNew = Math.min(15000, basic);
  const pfOld = emp.pf_opt_in ? Math.round(pfWageOld * 0.12) : 0;
  const pfNew = emp.pf_opt_in ? Math.round(pfWageNew * 0.12) : 0;
  const esicOld = emp.esic_opt_in ? Math.round(old.gross * 0.0075) : 0;
  const esicNew = emp.esic_opt_in ? Math.round(gross * 0.0075) : 0;
  const pt = emp.professional_tax_opt_in ? 200 : 0;
  const empPfOld = emp.pf_opt_in ? Math.round(pfWageOld * 0.12) : 0;
  const empPfNew = emp.pf_opt_in ? Math.round(pfWageNew * 0.12) : 0;
  const empEsicOld = emp.esic_opt_in ? Math.round(old.gross * 0.0325) : 0;
  const empEsicNew = emp.esic_opt_in ? Math.round(gross * 0.0325) : 0;

  return {
    old: {
      ...old,
      takeHome: old.gross - pfOld - esicOld - pt,
      ctc: old.gross + empPfOld + empEsicOld,
    },
    neu: {
      basic, hra, conveyance, childEdu, medical, special, gross,
      takeHome: gross - pfNew - esicNew - pt,
      ctc: gross + empPfNew + empEsicNew,
    },
  };
}

export default function SalaryRevisionForm({
  employees,
  activeCompany,
  activeHRName,
  onSuccess
}: SalaryRevisionFormProps) {
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [mode, setMode] = useState<RevisionMode>('INCREMENT');
  const [applyScope, setApplyScope] = useState<ApplyScope>('ONE');
  const [reason, setReason] = useState('Annual Performance Appraisal');
  const [remarks, setRemarks] = useState('');
  const [adj, setAdj] = useState<Record<HeadKey, number>>(emptyAdj());
  const [submitting, setSubmitting] = useState(false);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const selectedEmp = useMemo(
    () => employees.find(e => e.id === selectedEmpId),
    [selectedEmpId, employees]
  );

  const scopedEmployees = useMemo(() => {
    const active = employees.filter(e => e.status === 'ACTIVE');
    if (applyScope === 'ONE') {
      return selectedEmp ? [selectedEmp] : [];
    }
    if (applyScope === 'UNIT') {
      if (!activeCompany || activeCompany === 'GROUP' || activeCompany === 'ALL') return [];
      return active.filter(e => e.company === activeCompany);
    }
    // ALL
    return active;
  }, [employees, applyScope, selectedEmp, activeCompany]);

  useEffect(() => {
    setAdj(emptyAdj());
    setFormError('');
    setFormSuccess('');
  }, [selectedEmpId, mode, applyScope]);

  useEffect(() => {
    if (mode === 'RESTRUCTURE') {
      setReason('Salary Restructure / Head Redistribution');
    } else if (reason.startsWith('Salary Restructure') || reason.includes('Restructure')) {
      setReason('Annual Performance Appraisal');
    }
  }, [mode]);

  const preview = useMemo(() => {
    if (applyScope === 'ONE' && selectedEmp) {
      return buildStructure(selectedEmp, adj);
    }
    return null;
  }, [applyScope, selectedEmp, adj]);

  const netTemplateChange = useMemo(
    () => HEADS.reduce((sum, h) => sum + (Number(adj[h.key]) || 0), 0),
    [adj]
  );

  const hasAnyChange = useMemo(
    () => HEADS.some(h => (Number(adj[h.key]) || 0) !== 0),
    [adj]
  );

  const setHeadAdj = (key: HeadKey, value: number) => {
    let next = Math.round(value) || 0;
    if (applyScope === 'ONE' && selectedEmp) {
      const map: Record<HeadKey, number> = {
        basic: selectedEmp.base_salary || 0,
        hra: selectedEmp.hra || 0,
        conveyance: selectedEmp.conveyance_allowance || 0,
        childEdu: selectedEmp.edu_allowance || 0,
        medical: selectedEmp.medical_allowance || 0,
        special: selectedEmp.special_allowance || 0,
      };
      next = Math.max(-map[key], next);
    }
    setAdj(prev => ({ ...prev, [key]: next }));
  };

  const bumpHead = (key: HeadKey, delta: number) => {
    setHeadAdj(key, (Number(adj[key]) || 0) + delta);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!effectiveDate) {
      setFormError('Effective Date zaroori hai. Is date se naya structure apply hoga.');
      return;
    }
    if (!hasAnyChange) {
      setFormError('Kam se kam ek salary head me + ya − change dalein.');
      return;
    }
    if (mode === 'INCREMENT' && netTemplateChange <= 0) {
      setFormError('Increment mode me net Gross badhna chahiye. Sirf heads shift ke liye Restructure mode use karein.');
      return;
    }

    if (applyScope === 'ONE') {
      if (!selectedEmp || !preview) {
        setFormError('Pehle employee select karein.');
        return;
      }
      if (mode === 'INCREMENT') {
        const hasBasicInc = (Number(adj.basic) || 0) > 0;
        const hasOtherInc = HEADS.filter(h => h.key !== 'basic').some(h => (Number(adj[h.key]) || 0) > 0);
        const net = preview.neu.gross - preview.old.gross;
        if (hasBasicInc && !hasOtherInc && (Number(adj.basic) || 0) === net) {
          setFormError('Policy: Increment sirf Basic me nahi ho sakta. Dusre heads me bhi distribute karein, ya Restructure use karein.');
          return;
        }
      }
    } else {
      if (scopedEmployees.length === 0) {
        if (applyScope === 'UNIT') {
          setFormError('Unit-wide ke liye left side se specific company select karein (GROUP Dashboard nahi).');
        } else {
          setFormError('Koi active employee nahi mila.');
        }
        return;
      }
      const ok = window.confirm(
        `Confirm Bulk ${mode}\n\n` +
        `Employees: ${scopedEmployees.length}\n` +
        `Scope: ${applyScope === 'UNIT' ? `Unit ${activeCompany}` : 'ALL companies'}\n` +
        `Effective Date: ${effectiveDate}\n` +
        `Net template Δ Gross: ₹${netTemplateChange.toLocaleString('en-IN')}\n\n` +
        `Yeh change sab selected employees pe apply hoga. Continue?`
      );
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      if (applyScope === 'ONE' && selectedEmp && preview) {
        const payload = {
          employee_code: selectedEmp.id,
          old_salary: preview.old.basic,
          new_salary: preview.neu.basic,
          effective_date: effectiveDate,
          reason: mode === 'RESTRUCTURE'
            ? (reason.includes('Restructure') ? reason : `Restructure: ${reason}`)
            : reason,
          approved_by: activeHRName,
          hra: preview.neu.hra,
          conveyance_allowance: preview.neu.conveyance,
          edu_allowance: preview.neu.childEdu,
          medical_allowance: preview.neu.medical,
          special_allowance: preview.neu.special,
          remarks: `[${mode}] ${remarks || ''}`.trim(),
          increment_amount: preview.neu.gross - preview.old.gross,
          old_structure: preview.old,
          new_structure: { ...preview.neu, revision_mode: mode, adjustments: adj }
        };

        const res = await fetch('/api/revisions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to save revision');
        }
        setFormSuccess(
          `${mode === 'RESTRUCTURE' ? 'Restructure' : 'Increment'} save ho gaya: ${selectedEmp.name}. Effective ${effectiveDate}. New Gross ₹${preview.neu.gross.toLocaleString('en-IN')}.`
        );
      } else {
        const res = await fetch('/api/revisions/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scope: applyScope === 'UNIT' ? 'UNIT' : 'ALL',
            company: activeCompany,
            effective_date: effectiveDate,
            reason: mode === 'RESTRUCTURE'
              ? (reason.includes('Restructure') ? reason : `Bulk Restructure: ${reason}`)
              : `Bulk Increment: ${reason}`,
            approved_by: activeHRName,
            remarks,
            mode,
            adjustments: adj
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Bulk revision failed');

        setFormSuccess(
          `Bulk ${mode} complete. Applied: ${data.applied} / ${data.total_targets}. ` +
          (data.skipped_count ? `Skipped: ${data.skipped_count} (payroll locked / no change). ` : '') +
          `Effective date: ${effectiveDate}.`
        );
      }

      setSelectedEmpId('');
      setEffectiveDate('');
      setRemarks('');
      setAdj(emptyAdj());
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Save fail hua.');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`;
  const fmtSigned = (n: number) => {
    const v = Math.round(n);
    if (v > 0) return `+₹${v.toLocaleString('en-IN')}`;
    if (v < 0) return `−₹${Math.abs(v).toLocaleString('en-IN')}`;
    return '₹0';
  };

  const showHeadEditor = applyScope !== 'ONE' || !!selectedEmp;

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
            Ek employee, poori unit, ya sabhi employees. Har head pe + / −. Effective date ke saath.
          </p>
        </div>
      </div>

      {/* Clear guidance box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[11px] text-amber-950 leading-relaxed space-y-1">
        <p className="font-bold text-amber-900">Kaise use karein (short guide)</p>
        <p>1) Pehle mode choose karo: <strong>Increment</strong> (salary badhana) ya <strong>Restructure</strong> (heads shift).</p>
        <p>2) Phir scope choose karo: <strong>One Employee</strong> / <strong>Current Unit</strong> / <strong>All Employees</strong>.</p>
        <p>3) Effective Date dalo → heads me +/− karo → Commit.</p>
        <p>Note: Unit-wide ke liye left sidebar me specific company select honi chahiye (GROUP Dashboard pe Unit option kaam nahi karega).</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">1. Mode</label>
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
          </div>
        </div>

        {/* Scope */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">2. Kispe apply karna hai?</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setApplyScope('ONE')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                applyScope === 'ONE'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              One Employee
            </button>
            <button
              type="button"
              onClick={() => setApplyScope('UNIT')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                applyScope === 'UNIT'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users size={13} />
              Current Unit ({activeCompany === 'GROUP' ? 'select company' : activeCompany})
            </button>
            <button
              type="button"
              onClick={() => setApplyScope('ALL')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition cursor-pointer ${
                applyScope === 'ALL'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Users size={13} />
              All Employees (sab companies)
            </button>
          </div>
          {applyScope !== 'ONE' && (
            <p className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
              Bulk target: <strong>{scopedEmployees.length}</strong> active employee(s)
              {applyScope === 'UNIT' ? ` in unit ${activeCompany}` : ' across all units'}.
              Same +/− har employee pe apply hoga (head ₹0 se neeche nahi jayega).
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {applyScope === 'ONE' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 block">Select Employee</label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full text-xs p-2.5 border bg-white rounded-xl focus:outline-none"
                required={applyScope === 'ONE'}
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
          )}

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
                  <option value="Bulk Unit Restructure">Bulk Unit Restructure</option>
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

        {showHeadEditor && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 px-4 py-3 flex flex-wrap justify-between items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  3. Salary Heads — Adjust with + / −
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {applyScope === 'ONE'
                    ? `${selectedEmp?.name} (${selectedEmp?.id})`
                    : `Bulk × ${scopedEmployees.length} employees`}
                  {' · '}{mode}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-700">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Salary Head</th>
                      {applyScope === 'ONE' && preview && (
                        <th className="p-3 text-right">Old (₹)</th>
                      )}
                      <th className="p-3 text-center">Adjust (+ / −)</th>
                      {applyScope === 'ONE' && preview && (
                        <>
                          <th className="p-3 text-right">New (₹)</th>
                          <th className="p-3 text-right">Δ</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {HEADS.map(h => {
                      const delta = Number(adj[h.key]) || 0;
                      return (
                        <tr key={h.key}>
                          <td className="p-3 text-slate-950 font-bold">{h.label}</td>
                          {applyScope === 'ONE' && preview && (
                            <td className="p-3 text-right font-mono text-slate-500">
                              {fmt(preview.old[h.key])}
                            </td>
                          )}
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => bumpHead(h.key, -100)}
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
                                className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          {applyScope === 'ONE' && preview && (
                            <>
                              <td className="p-3 text-right font-mono text-slate-950 font-bold">
                                {fmt(preview.neu[h.key])}
                              </td>
                              <td className={`p-3 text-right font-mono font-bold ${
                                delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-400'
                              }`}>
                                {fmtSigned(delta)}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  {applyScope === 'ONE' && preview && (
                    <tfoot>
                      <tr className="bg-slate-50 font-bold">
                        <td className="p-3">Gross Salary</td>
                        <td className="p-3 text-right font-mono">{fmt(preview.old.gross)}</td>
                        <td className="p-3 text-center text-[10px] text-slate-400">Breakup</td>
                        <td className="p-3 text-right font-mono text-sm">{fmt(preview.neu.gross)}</td>
                        <td className={`p-3 text-right font-mono ${
                          preview.neu.gross - preview.old.gross > 0 ? 'text-emerald-600'
                            : preview.neu.gross - preview.old.gross < 0 ? 'text-rose-600' : 'text-slate-500'
                        }`}>
                          {fmtSigned(preview.neu.gross - preview.old.gross)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            {applyScope === 'ONE' && preview && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Old Gross Breakup</h4>
                  <div className="space-y-1.5 text-xs font-mono">
                    {HEADS.map(h => (
                      <div key={h.key} className="flex justify-between text-slate-600">
                        <span className="font-sans text-slate-500">{h.label}</span>
                        <span>{fmt(preview.old[h.key])}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
                      <span className="font-sans">Gross</span>
                      <span>{fmt(preview.old.gross)}</span>
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
                            {fmt(preview.neu[h.key])}
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
                        {fmt(preview.neu.gross)}
                        <span className={`ml-2 text-[10px] ${
                          preview.neu.gross - preview.old.gross > 0 ? 'text-emerald-600'
                            : preview.neu.gross - preview.old.gross < 0 ? 'text-rose-600' : 'text-slate-400'
                        }`}>
                          ({fmtSigned(preview.neu.gross - preview.old.gross)})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-slate-300">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3 flex items-center gap-1.5">
                <FileText size={13} className="text-indigo-400" />
                Summary before save
              </h4>
              <div className="text-xs space-y-1 mb-4">
                <p>Mode: <strong className="text-white">{mode}</strong></p>
                <p>
                  Apply to:{' '}
                  <strong className="text-white">
                    {applyScope === 'ONE'
                      ? selectedEmp?.name || '—'
                      : applyScope === 'UNIT'
                        ? `Unit ${activeCompany} (${scopedEmployees.length} staff)`
                        : `All employees (${scopedEmployees.length} staff)`}
                  </strong>
                </p>
                <p>Effective Date: <strong className="text-white">{effectiveDate || 'not set'}</strong></p>
                <p>Template net Δ Gross: <strong className="text-white">{fmtSigned(netTemplateChange)}</strong></p>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting || !hasAnyChange || !effectiveDate}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-xs text-white font-extrabold rounded-xl transition cursor-pointer"
                >
                  {submitting
                    ? 'Saving...'
                    : applyScope === 'ONE'
                      ? (mode === 'RESTRUCTURE' ? 'Commit Restructure' : 'Commit Increment')
                      : `Commit Bulk ${mode} (${scopedEmployees.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
