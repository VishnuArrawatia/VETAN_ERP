/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Percent,
  Printer,
  ChevronRight,
  Building,
  Info
} from 'lucide-react';
import { Employee, Form16Calculation } from '../types';

interface Form16PortalProps {
  employees: Employee[];
  activeCompany: string;
  onFetchForm16: (employeeId: string, fy?: string) => Promise<Form16Calculation | null>;
}

const FY_OPTIONS = ['2026-27', '2025-26', '2024-25'];
const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun',
  '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
};
const monthLabel = (m: string) => {
  const [y, mm] = m.split('-');
  return `${MONTH_LABELS[mm] || mm} ${y}`;
};
const inr = (v: number) => `₹${Math.round(v || 0).toLocaleString('en-IN')}`;

export default function Form16Portal({ employees, activeCompany, onFetchForm16 }: Form16PortalProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<Form16Calculation | null>(null);
  const [loading, setLoading] = useState(false);
  const [fy, setFy] = useState<string>(FY_OPTIONS[0]);

  const activeEmployees = employees.filter(e => activeCompany === 'ALL' || e.company === activeCompany);

  const handleFetchReport = async (empId: string, fySel?: string) => {
    setLoading(true);
    setActiveAnalysis(null);
    try {
      const calc = await onFetchForm16(empId, fySel || fy);
      if (calc) {
        setActiveAnalysis(calc);
      }
    } catch (e) {
      alert('Error scanning tax registry files.');
    } finally {
      setLoading(false);
    }
  };

  const income = activeAnalysis?.income;

  return (
    <div className="space-y-6">

      {/* Upper informational panel */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-905 font-display text-sm tracking-tight flex items-center gap-1.5">
            <Percent size={16} className="text-emerald-500" />
            Form 16 — Income Components & New Tax Regime Working
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Salary · Bonus · Arrear · Leave Encashment — derived from actual payroll data, taxed under Sec 115BAC (New Regime).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financial Year</span>
          <select
            value={fy}
            onChange={(e) => {
              setFy(e.target.value);
              if (activeAnalysis) handleFetchReport(activeAnalysis.employee_id, e.target.value);
            }}
            className="text-xs font-bold border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-100 cursor-pointer"
          >
            {FY_OPTIONS.map(f => (
              <option key={f} value={f}>FY {f}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left selector menu of employees list */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h4 className="text-xs font-bold font-display text-gray-500 uppercase tracking-widest pb-1 border-b">Select Staff Member</h4>

          <div className="space-y-2 max-h-[350px] overflow-y-auto no-scrollbar">
            {activeEmployees.map(emp => (
              <button
                key={emp.id}
                onClick={() => handleFetchReport(emp.id)}
                className="w-full text-left p-3 bg-gray-50 hover:bg-emerald-50/40 border hover:border-emerald-100 transition rounded-xl flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="text-xs font-semibold text-gray-850 group-hover:text-emerald-950 block">{emp.name}</span>
                  <div className="flex gap-1.5 text-[10px] text-gray-400 mt-0.5 font-mono">
                    <span>{emp.id}</span>
                    <span>|</span>
                    <span className="font-bold uppercase text-emerald-600">{emp.company}</span>
                  </div>
                </div>
                <ChevronRight size={13} className="text-gray-400 group-hover:text-emerald-600 transition" />
              </button>
            ))}
          </div>
        </div>

        {/* Right workspace results preview */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center bg-white p-24 border rounded-2xl gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              <span className="text-xs text-gray-400">Scanning corporate payroll taxation files...</span>
            </div>
          ) : activeAnalysis ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border rounded-2xl p-6 shadow-xs space-y-6"
            >
              <div className="border-b pb-4 flex justify-between items-center text-slate-800">
                <div>
                  <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 font-extrabold px-2 py-0.5 rounded uppercase font-mono">
                    {activeAnalysis.regime_name || 'NEW TAX REGIME'}{activeAnalysis.fy ? ` · FY ${activeAnalysis.fy}` : ''}
                  </span>
                  <h3 className="text-base font-bold font-display mt-2">{activeAnalysis.employee_name} ({activeAnalysis.employee_id})</h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
                    <Building size={10} /> {activeAnalysis.company} · PAN: {activeAnalysis.pan || '—'}
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-medium rounded-lg transition cursor-pointer"
                >
                  <Printer size={13} />
                  Print Form 16 Sheet
                </button>
              </div>

              {/* 1. INCOME COMPONENTS (from actual payroll data) */}
              {income && (
                <div className="space-y-1">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">A. Income Components (actual payroll data)</h4>
                  <table className="w-full text-xs">
                    <tbody className="text-slate-700">
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">1. Salary Income <span className="text-[9px] text-gray-300">(base + HRA + special + edu + medical + conveyance + OT)</span></td>
                        <td className="py-2 text-right font-mono font-bold text-gray-900">{inr(income.salary_income)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">2. Bonus Income <span className="text-[9px] text-gray-300">(earned bonus + incentives)</span></td>
                        <td className="py-2 text-right font-mono font-bold text-gray-900">{inr(income.bonus_income)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">3. Arrear Amount <span className="text-[9px] text-gray-300">(fully taxable in year received)</span></td>
                        <td className="py-2 text-right font-mono font-bold text-gray-900">{inr(income.arrear_income)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">4. Leave Encashment — Gross</td>
                        <td className="py-2 text-right font-mono font-bold text-gray-900">{inr(income.leave_encashment_gross)}</td>
                      </tr>
                      {income.leave_encashment_exemption > 0 && (
                        <tr className="border-b border-gray-100">
                          <td className="py-2 pl-4 text-gray-400">Less: Exemption u/s 10(10AA)</td>
                          <td className="py-2 text-right font-mono text-emerald-600">- {inr(income.leave_encashment_exemption)}</td>
                        </tr>
                      )}
                      <tr className="border-b border-gray-100">
                        <td className="py-2 pl-4 text-gray-600">Leave Encashment — Taxable</td>
                        <td className="py-2 text-right font-mono font-bold text-gray-900">{inr(income.leave_encashment_taxable)}</td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">5. Other Taxable Income <span className="text-[9px] text-gray-300">(other earnings + special addition)</span></td>
                        <td className="py-2 text-right font-mono font-bold text-gray-900">{inr(income.other_income)}</td>
                      </tr>
                      <tr className="bg-emerald-50/50">
                        <td className="py-2.5 font-extrabold text-gray-900">Gross Total Income <span className="text-[9px] font-normal text-gray-400">({income.months_counted} months' payroll)</span></td>
                        <td className="py-2.5 text-right font-mono font-extrabold text-emerald-700">{inr(income.gross_total_income)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* 2. TAX WORKING (New Regime) */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">B. Tax Working — New Regime (Sec 115BAC)</h4>
                <table className="w-full text-xs">
                  <tbody className="text-slate-700">
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-600">Gross Total Income</td>
                      <td className="py-2 text-right font-mono font-bold">{inr(income?.gross_total_income || 0)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-600">Less: Standard Deduction (new regime)</td>
                      <td className="py-2 text-right font-mono text-rose-600">- {inr(activeAnalysis.standard_deduction)}</td>
                    </tr>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <td className="py-2 font-bold text-gray-900">Taxable Income</td>
                      <td className="py-2 text-right font-mono font-extrabold text-gray-900">{inr(activeAnalysis.taxable_income)}</td>
                    </tr>
                  </tbody>
                </table>

                {(activeAnalysis.slabs_applied && activeAnalysis.slabs_applied.length > 0) && (
                  <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr className="text-[10px] uppercase tracking-wider text-gray-400">
                          <th className="text-left px-3 py-1.5 font-bold">Slab</th>
                          <th className="text-right px-3 py-1.5 font-bold">Rate</th>
                          <th className="text-right px-3 py-1.5 font-bold">Tax (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAnalysis.slabs_applied.map((s, i) => (
                          <tr key={i} className="border-t border-gray-50">
                            <td className="px-3 py-1.5 font-mono text-gray-600">
                              {inr(s.from + 1)} – {s.to === null ? 'above' : inr(s.to)}
                            </td>
                            <td className="px-3 py-1.5 text-right font-mono">{(s.rate * 100).toFixed(0)}%</td>
                            <td className="px-3 py-1.5 text-right font-mono font-bold">{inr(s.tax)}</td>
                          </tr>
                        ))}
                        <tr className="border-t border-gray-100 bg-gray-50/60">
                          <td className="px-3 py-1.5 font-bold text-gray-800" colSpan={2}>Tax on Income</td>
                          <td className="px-3 py-1.5 text-right font-mono font-extrabold">{inr(activeAnalysis.tax_on_income)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <table className="w-full text-xs mt-3">
                  <tbody className="text-slate-700">
                    {!!activeAnalysis.marginal_relief && activeAnalysis.marginal_relief > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">Less: Marginal Relief (87A boundary)</td>
                        <td className="py-2 text-right font-mono text-emerald-600">- {inr(activeAnalysis.marginal_relief)}</td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-600">Rebate u/s 87A <span className="text-[9px] text-gray-300">(taxable ≤ ₹12,00,000)</span></td>
                      <td className="py-2 text-right font-mono text-emerald-600">- {inr(activeAnalysis.rebate_87a)}</td>
                    </tr>
                    {!!activeAnalysis.surcharge && activeAnalysis.surcharge > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-600">
                          Add: Surcharge
                          {!!activeAnalysis.marginal_relief_surcharge && activeAnalysis.marginal_relief_surcharge > 0 && (
                            <span className="text-[9px] text-gray-400"> (marginal relief {inr(activeAnalysis.marginal_relief_surcharge)} applied)</span>
                          )}
                        </td>
                        <td className="py-2 text-right font-mono font-bold">+ {inr(activeAnalysis.surcharge)}</td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-600">Add: Health & Education Cess @ 4%</td>
                      <td className="py-2 text-right font-mono font-bold">+ {inr(activeAnalysis.cess)}</td>
                    </tr>
                    <tr className="bg-slate-900 text-white">
                      <td className="py-2.5 px-2 rounded-l-lg font-extrabold">Net Tax Payable (FY {activeAnalysis.fy || ''})</td>
                      <td className="py-2.5 text-right font-mono font-extrabold rounded-r-lg">{inr(activeAnalysis.net_tax_payable)}</td>
                    </tr>
                    {!!activeAnalysis.tds_deducted && activeAnalysis.tds_deducted > 0 && (
                      <>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-gray-600">Less: TDS already deducted (payroll)</td>
                          <td className="py-2 text-right font-mono text-emerald-600">- {inr(activeAnalysis.tds_deducted)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-gray-900">Balance Tax Payable</td>
                          <td className="py-2 text-right font-mono font-extrabold text-rose-600">{inr(activeAnalysis.balance_payable || 0)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* 3. MONTH-WISE TRANSPARENCY */}
              {activeAnalysis.month_wise && activeAnalysis.month_wise.length > 0 && (
                <div className="space-y-1">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-2">C. Month-wise Component Breakdown (no double counting)</h4>
                  <div className="border border-gray-100 rounded-xl overflow-x-auto">
                    <table className="w-full text-[11px]">
                      <thead className="bg-gray-50">
                        <tr className="text-[10px] uppercase tracking-wider text-gray-400">
                          <th className="text-left px-3 py-1.5 font-bold">Month</th>
                          <th className="text-right px-3 py-1.5 font-bold">Salary</th>
                          <th className="text-right px-3 py-1.5 font-bold">Bonus</th>
                          <th className="text-right px-3 py-1.5 font-bold">Arrear</th>
                          <th className="text-right px-3 py-1.5 font-bold">Leave Enc.</th>
                          <th className="text-right px-3 py-1.5 font-bold">Other</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAnalysis.month_wise.map(r => (
                          <tr key={r.month} className="border-t border-gray-50">
                            <td className="px-3 py-1.5 font-mono text-gray-600">{monthLabel(r.month)}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{r.salary ? inr(r.salary) : '—'}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{r.bonus ? inr(r.bonus) : '—'}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{r.arrear ? inr(r.arrear) : '—'}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{r.leave_encashment ? inr(r.leave_encashment) : '—'}</td>
                            <td className="px-3 py-1.5 text-right font-mono">{r.other ? inr(r.other) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {activeAnalysis.notes && activeAnalysis.notes.length > 0 && (
                <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 space-y-1.5">
                  {activeAnalysis.notes.map((n, i) => (
                    <p key={i} className="text-[11px] text-amber-800 flex gap-1.5"><Info size={12} className="shrink-0 mt-0.5" />{n}</p>
                  ))}
                </div>
              )}

              <p className="text-[9px] text-gray-300 font-mono text-center pt-2">
                Annualised structure reference (not taxed): {inr(activeAnalysis.gross_annual_salary)} · Regime slabs & limits are config-driven per FY (server/form16-engine.ts)
              </p>
            </motion.div>
          ) : (
            <div className="bg-white border border-dashed rounded-2xl p-12 text-center">
              <p className="text-xs text-gray-400">Select a staff member to compute their Form 16 income components and new-regime tax working.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
