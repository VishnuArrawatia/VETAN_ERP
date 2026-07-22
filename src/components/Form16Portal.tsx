/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Percent, 
  HelpCircle, 
  Printer, 
  Eye, 
  ChevronRight, 
  AlertCircle,
  Building,
  CheckCircle,
  X,
  CreditCard
} from 'lucide-react';
import { Employee, Form16Calculation } from '../types';

interface Form16PortalProps {
  employees: Employee[];
  activeCompany: string;
  onFetchForm16: (employeeId: string) => Promise<Form16Calculation | null>;
}

export default function Form16Portal({ employees, activeCompany, onFetchForm16 }: Form16PortalProps) {
  const [activeAnalysis, setActiveAnalysis] = useState<Form16Calculation | null>(null);
  const [loading, setLoading] = useState(false);

  const activeEmployees = employees.filter(e => activeCompany === 'ALL' || e.company === activeCompany);

  const handleFetchReport = async (empId: string) => {
    setLoading(true);
    setActiveAnalysis(null);
    try {
      const calc = await onFetchForm16(empId);
      if (calc) {
        setActiveAnalysis(calc);
      }
    } catch (e) {
      alert('Error scanning tax registry files.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper informational panel */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-905 font-display text-sm tracking-tight flex items-center gap-1.5">
            <Percent size={16} className="text-emerald-500" />
            Form 16 Annual Income Tax Estimator Desk
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">Automates corporate tax projections under Indian Section 80C, 80D, and HRA relief exemptions.</p>
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
                    ANNUAL INCOME TAX ASSESSMENT
                  </span>
                  <h3 className="text-base font-bold font-display mt-2">{activeAnalysis.employee_name} ({activeAnalysis.employee_id})</h3>
                </div>

                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-medium rounded-lg transition cursor-pointer"
                >
                  <Printer size={13} />
                  Print Form 16 Sheet
                </button>
              </div>

              {/* Taxation details breakdown */}
              <div className="space-y-3 text-xs text-slate-700">
                
                <div className="flex justify-between pb-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Gross Estimated Annual Salary (Base + Allowances):</span>
                  <span className="font-mono font-bold text-gray-900">₹{activeAnalysis.gross_annual_salary.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between pb-1.5 border-b border-gray-100 text-rose-600">
                  <span>Standard Section Deductions (Flat Indian Slab):</span>
                  <span className="font-mono font-bold">- ₹{activeAnalysis.standard_deduction.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between pb-1.5 border-b border-gray-100 text-rose-500">
                  <span>Section 80C Provident Fund matching limits:</span>
                  <span className="font-mono font-medium">- ₹{activeAnalysis.section_80c.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between pb-1.5 border-b border-gray-100 text-rose-500">
                  <span>Section 80D Medical & Health insurance claims:</span>
                  <span className="font-mono">- ₹{activeAnalysis.section_80d.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between pb-1.5 border-b border-gray-100 text-rose-500 font-sans">
                  <span>HRA Exemption (Section 10(13A) Rent Relief):</span>
                  <span className="font-mono">- ₹{activeAnalysis.hra_exemption.toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between pb-1.5 border-b border-gray-150 font-bold text-gray-900 text-sm">
                  <span>Net Taxable Income Value:</span>
                  <span className="font-mono">₹{activeAnalysis.taxable_income.toLocaleString('en-IN')}</span>
                </div>

                {activeAnalysis.tax_on_income <= 0 ? (
                  <div className="p-3 bg-emerald-50 text-emerald-800 font-bold border border-emerald-150 rounded-xl text-center">
                    ◆ Taxable income is below limits. Section 87A rebate of ₹25,000 applied. No Tax Payable.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 pt-3.5">
                    <div className="p-3 bg-gray-50 border rounded-xl space-y-1">
                      <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Estimated Basic Slabs Tax</span>
                      <p className="text-base font-extrabold text-gray-900 font-mono">₹{activeAnalysis.tax_on_income.toLocaleString('en-IN')}</p>
                    </div>

                    <div className="p-3 bg-slate-900 text-white rounded-xl space-y-1 flex flex-col justify-between">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Active Net Tax Payable (yearly)</span>
                      <p className="text-base font-extrabold text-emerald-400 font-mono">₹{activeAnalysis.net_tax_payable.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                )}

              </div>

            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 bg-gray-50 border-2 border-dashed rounded-2xl text-center select-none">
              <Percent size={40} className="text-gray-300 mb-3" />
              <span className="text-xs font-semibold text-gray-400 block font-display">No taxation profile loaded</span>
              <p className="text-[11px] text-gray-400 mt-1 max-w-sm">Select any employee from the ledger on the left to compute current tax exemption worksheets instantly.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
