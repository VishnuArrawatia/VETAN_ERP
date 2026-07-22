/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  User, 
  Calculator, 
  Printer, 
  Trash2, 
  CheckCircle, 
  Percent, 
  HelpCircle,
  Clock,
  X,
  CreditCard,
  Briefcase,
  UserCheck,
  FileCheck,
  ShieldCheck,
  DollarSign,
  Calendar,
  FileText,
  CheckSquare,
  Square,
  AlertCircle,
  ArrowRight,
  Search,
  Check
} from 'lucide-react';
import { Employee, FullAndFinalSettlement } from '../types';

interface FAndFControllerProps {
  employees: Employee[];
  ffRecords: FullAndFinalSettlement[];
  activeCompany: string;
  onCalculateFF: (employeeId: string, lastWorkingDay: string) => Promise<FullAndFinalSettlement | null>;
  onCommitFF: (settlement: FullAndFinalSettlement) => Promise<boolean>;
}

export default function FAndFController({ 
  employees, 
  ffRecords, 
  activeCompany, 
  onCalculateFF, 
  onCommitFF 
}: FAndFControllerProps) {
  // Session simulation
  const [sessionUser, setSessionUser] = useState<{name: string, role: string}>(() => {
    try {
      const stored = localStorage.getItem('vetan_active_hr');
      return stored ? JSON.parse(stored) : { name: 'HR Manager', role: 'SUPER_HR' };
    } catch {
      return { name: 'HR Manager', role: 'SUPER_HR' };
    }
  });

  const [targetEmpId, setTargetEmpId] = useState('');
  const [lastWorkingDay, setLastWorkingDay] = useState(new Date().toISOString().split('T')[0]);
  const [activeCalculation, setActiveCalculation] = useState<FullAndFinalSettlement | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [printingRecord, setPrintingRecord] = useState<FullAndFinalSettlement | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'initialize' | 'cases'>('cases');
  const [activeStep, setActiveStep] = useState<number>(1);

  // Live editable fields
  const [ffDepartment, setFfDepartment] = useState('');
  const [ffDesignation, setFfDesignation] = useState('');
  const [ffReportingManager, setFfReportingManager] = useState('');
  const [ffJoiningDate, setFfJoiningDate] = useState('');
  const [ffResignationDate, setFfResignationDate] = useState('');
  const [ffResignationAcceptDate, setFfResignationAcceptDate] = useState('');
  const [ffLeavingDate, setFfLeavingDate] = useState('');
  const [ffTotalServicePeriod, setFfTotalServicePeriod] = useState('');

  // Exit details
  const [ffReason, setFfReason] = useState('Personal Reasons');
  const [ffRemarks, setFfRemarks] = useState('');

  // Notice Period
  const [ffNoticeApplicable, setFfNoticeApplicable] = useState(30);
  const [ffNoticeServed, setFfNoticeServed] = useState(30);
  const [ffNoticeShortfall, setFfNoticeShortfall] = useState(0);

  // Leaves
  const [ffLeavePL, setFfLeavePL] = useState(0);
  const [ffLeaveCL, setFfLeaveCL] = useState(0);
  const [ffLeaveSL, setFfLeaveSL] = useState(0);
  const [ffLeaveCompOff, setFfLeaveCompOff] = useState(0);

  // Line calculations (with overrides)
  const [ffGratuity, setFfGratuity] = useState(0);
  const [ffLeaveEncashment, setFfLeaveEncashment] = useState(0);
  const [ffUnpaidDays, setFfUnpaidDays] = useState(0);
  const [ffUnpaidEarned, setFfUnpaidEarned] = useState(0);
  const [ffPendingBonus, setFfPendingBonus] = useState(0);

  // Recoveries
  const [ffRecoveryAdvance, setFfRecoveryAdvance] = useState(0);
  const [ffRecoveryLoan, setFfRecoveryLoan] = useState(0);
  const [ffRecoveryAsset, setFfRecoveryAsset] = useState(0);
  const [ffRecoveryOther, setFfRecoveryOther] = useState(0);

  // Clearance Checklist
  const [ffClearanceID, setFfClearanceID] = useState(true);
  const [ffClearanceLaptop, setFfClearanceLaptop] = useState(true);
  const [ffClearanceMobile, setFfClearanceMobile] = useState(true);
  const [ffClearanceAccess, setFfClearanceAccess] = useState(true);
  const [ffClearanceOther, setFfClearanceOther] = useState(true);
  const [ffClearanceRemarks, setFfClearanceRemarks] = useState('');

  // Approval Signatures
  const [prepBy, setPrepBy] = useState('');
  const [prepDate, setPrepDate] = useState('');
  const [verBy, setVerBy] = useState('');
  const [verDate, setVerDate] = useState('');
  const [appBy, setAppBy] = useState('');
  const [appDate, setAppDate] = useState('');
  const [finBy, setFinBy] = useState('');
  const [finDate, setFinDate] = useState('');

  const activeEmployees = employees.filter(e => activeCompany === 'ALL' || e.company === activeCompany);
  const filteredFF = ffRecords.filter(f => {
    const matchesCompany = activeCompany === 'ALL' || f.company === activeCompany;
    const matchesSearch = f.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCompany && matchesSearch;
  });

  // Keep live calculations synchronized
  const liveNoticeDeduction = Math.max(0, ffNoticeShortfall) * Math.round((activeCalculation ? (employees.find(e => e.id === activeCalculation.employee_id)?.base_salary || 30000) : 30000) / 30);
  const liveGrossEarnings = ffGratuity + ffLeaveEncashment + ffUnpaidEarned + ffPendingBonus;
  const liveGrossDeductions = liveNoticeDeduction + ffRecoveryAdvance + ffRecoveryLoan + ffRecoveryAsset + ffRecoveryOther;
  const liveNetSettlementPay = liveGrossEarnings - liveGrossDeductions;

  // Sync state with selected calculation
  useEffect(() => {
    if (activeCalculation) {
      setFfDepartment(activeCalculation.department || '');
      setFfDesignation(activeCalculation.designation || '');
      setFfReportingManager(activeCalculation.reporting_manager || '');
      setFfJoiningDate(activeCalculation.joining_date || '');
      setFfResignationDate(activeCalculation.resignation_date || '');
      setFfResignationAcceptDate(activeCalculation.resignation_acceptance_date || '');
      setFfLeavingDate(activeCalculation.leaving_date || '');
      setFfTotalServicePeriod(activeCalculation.total_service_period || '');

      setFfReason(activeCalculation.reason_for_leaving || 'Personal Reasons');
      setFfRemarks(activeCalculation.exit_remarks || '');

      setFfNoticeApplicable(activeCalculation.notice_applicable_days ?? 30);
      setFfNoticeServed(activeCalculation.notice_served_days ?? 30);
      setFfNoticeShortfall(activeCalculation.notice_shortfall_days ?? 0);

      setFfLeavePL(activeCalculation.leave_balance_pl ?? 0);
      setFfLeaveCL(activeCalculation.leave_balance_cl ?? 0);
      setFfLeaveSL(activeCalculation.leave_balance_sl ?? 0);
      setFfLeaveCompOff(activeCalculation.leave_balance_compoff ?? 0);

      setFfGratuity(activeCalculation.gratuity_earned || 0);
      setFfLeaveEncashment(activeCalculation.earned_leave_encashment || 0);
      setFfUnpaidDays(activeCalculation.unpaid_salary_days || 0);
      setFfUnpaidEarned(activeCalculation.unpaid_salary_earned || 0);
      setFfPendingBonus(activeCalculation.pending_bonus || 0);

      setFfRecoveryAdvance(activeCalculation.recovery_salary_advance || 0);
      setFfRecoveryLoan(activeCalculation.recovery_loan_outstanding || 0);
      setFfRecoveryAsset(activeCalculation.recovery_asset || 0);
      setFfRecoveryOther(activeCalculation.recovery_other || 0);

      setFfClearanceID(activeCalculation.clearance_id_card ?? true);
      setFfClearanceLaptop(activeCalculation.clearance_laptop ?? true);
      setFfClearanceMobile(activeCalculation.clearance_mobile ?? true);
      setFfClearanceAccess(activeCalculation.clearance_access_card ?? true);
      setFfClearanceOther(activeCalculation.clearance_other_assets ?? true);
      setFfClearanceRemarks(activeCalculation.clearance_remarks || '');

      setPrepBy(activeCalculation.approval_prepared_by || '');
      setPrepDate(activeCalculation.approval_prepared_date || '');
      setVerBy(activeCalculation.approval_verified_by || '');
      setVerDate(activeCalculation.approval_verified_date || '');
      setAppBy(activeCalculation.approval_approved_by || '');
      setAppDate(activeCalculation.approval_approved_date || '');
      setFinBy(activeCalculation.approval_final_approved_by || '');
      setFinDate(activeCalculation.approval_final_approved_date || '');

      setActiveStep(1);
    }
  }, [activeCalculation?.id]);

  // Recalculate shortfall and PL encashment if notice/leave inputs change
  useEffect(() => {
    if (activeCalculation) {
      const shortfall = Math.max(0, ffNoticeApplicable - ffNoticeServed);
      if (shortfall !== ffNoticeShortfall) {
        setFfNoticeShortfall(shortfall);
      }
    }
  }, [ffNoticeApplicable, ffNoticeServed]);

  useEffect(() => {
    if (activeCalculation) {
      const emp = employees.find(e => e.id === activeCalculation.employee_id);
      if (emp) {
        const calculatedPLValue = Math.round((emp.base_salary / 30) * ffLeavePL);
        if (calculatedPLValue !== ffLeaveEncashment) {
          setFfLeaveEncashment(calculatedPLValue);
        }
      }
    }
  }, [ffLeavePL]);

  const handleFFCalculate = async () => {
    if (!targetEmpId) {
      setErrorMsg('Select a resigning employee to process settlement.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    const result = await onCalculateFF(targetEmpId, lastWorkingDay);
    if (result) {
      setActiveCalculation(result);
      setActiveTab('cases');
      setSuccessMsg(`Initiated fresh F&F worksheet for ${result.employee_name}. Fill details across the steps below.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const saveWorksheet = async (newStatus?: 'DRAFT' | 'PREPARED' | 'VERIFIED' | 'APPROVED' | 'FINAL_APPROVED' | 'DISBURSED') => {
    if (!activeCalculation) return;

    const statusToSave = newStatus || activeCalculation.status;

    const updatedObj: FullAndFinalSettlement = {
      ...activeCalculation,
      status: statusToSave,
      department: ffDepartment,
      designation: ffDesignation,
      reporting_manager: ffReportingManager,
      joining_date: ffJoiningDate,
      resignation_date: ffResignationDate,
      resignation_acceptance_date: ffResignationAcceptDate,
      leaving_date: ffLeavingDate,
      total_service_period: ffTotalServicePeriod,

      reason_for_leaving: ffReason,
      exit_remarks: ffRemarks,

      notice_applicable_days: Number(ffNoticeApplicable),
      notice_served_days: Number(ffNoticeServed),
      notice_shortfall_days: Number(ffNoticeShortfall),

      leave_balance_pl: Number(ffLeavePL),
      leave_balance_cl: Number(ffLeaveCL),
      leave_balance_sl: Number(ffLeaveSL),
      leave_balance_compoff: Number(ffLeaveCompOff),

      gratuity_earned: Number(ffGratuity),
      earned_leave_encashment: Number(ffLeaveEncashment),
      unpaid_salary_days: Number(ffUnpaidDays),
      unpaid_salary_earned: Number(ffUnpaidEarned),
      notice_period_deduction: liveNoticeDeduction,
      pending_bonus: Number(ffPendingBonus),

      recovery_salary_advance: Number(ffRecoveryAdvance),
      recovery_loan_outstanding: Number(ffRecoveryLoan),
      recovery_asset: Number(ffRecoveryAsset),
      recovery_other: Number(ffRecoveryOther),

      gross_earnings: liveGrossEarnings,
      gross_deductions: liveGrossDeductions,
      net_settlement_pay: liveNetSettlementPay,

      clearance_id_card: ffClearanceID,
      clearance_laptop: ffClearanceLaptop,
      clearance_mobile: ffClearanceMobile,
      clearance_access_card: ffClearanceAccess,
      clearance_other_assets: ffClearanceOther,
      clearance_remarks: ffClearanceRemarks,

      approval_prepared_by: prepBy,
      approval_prepared_date: prepDate,
      approval_verified_by: verBy,
      approval_verified_date: verDate,
      approval_approved_by: appBy,
      approval_approved_date: appDate,
      approval_final_approved_by: finBy,
      approval_final_approved_date: finDate,
    };

    if (statusToSave === 'DISBURSED') {
      updatedObj.disbursed_date = new Date().toISOString().split('T')[0];
    }

    const success = await onCommitFF(updatedObj);
    if (success) {
      setSuccessMsg(`F&F worksheet saved successfully as ${statusToSave}!`);
      // Update active calculation state
      setActiveCalculation(updatedObj);
      setTimeout(() => setSuccessMsg(''), 4500);
    } else {
      setErrorMsg('Failed to persist F&F Settlement details.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleApplySignature = (role: 'HR' | 'Accounts' | 'HOD' | 'Admin') => {
    const currentDate = new Date().toISOString().split('T')[0];
    const userName = sessionUser.name || 'System Auditor';

    if (role === 'HR') {
      setPrepBy(userName);
      setPrepDate(currentDate);
      setSuccessMsg('HR Preparation signed off successfully.');
    } else if (role === 'Accounts') {
      setVerBy(`${userName} (Accounts)`);
      setVerDate(currentDate);
      setSuccessMsg('Accounts Verification stamp applied.');
    } else if (role === 'HOD') {
      setAppBy(`${userName} (HOD approval)`);
      setAppDate(currentDate);
      setSuccessMsg('HOD clearance stamp applied.');
    } else if (role === 'Admin') {
      setFinBy(`${userName} (Super Admin sign-off)`);
      setFinDate(currentDate);
      setSuccessMsg('Super Admin final authorization stamp applied.');
    }
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleClearSignature = (role: 'HR' | 'Accounts' | 'HOD' | 'Admin') => {
    if (role === 'HR') { setPrepBy(''); setPrepDate(''); }
    if (role === 'Accounts') { setVerBy(''); setVerDate(''); }
    if (role === 'HOD') { setAppBy(''); setAppDate(''); }
    if (role === 'Admin') { setFinBy(''); setFinDate(''); }
    setSuccessMsg('Signature stamp removed.');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'PREPARED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'VERIFIED': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'APPROVED': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'FINAL_APPROVED': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'DISBURSED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Title Panel & Simulation Banner */}
      <div className="bg-white border p-6 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-slate-900 tracking-tight flex items-center gap-2">
            <Building className="text-emerald-600" />
            Full & Final (F&F) Settlement Workflow
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Calculate service gratuity, encash PL leaves, assess liability recoveries, log clearance checklists, and execute statutory audit signatures.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 border px-4 py-2.5 rounded-xl text-xs">
          <Clock size={16} className="text-slate-400" />
          <div>
            <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Active Signee Context</span>
            <span className="font-semibold text-slate-800">{sessionUser.name} ({sessionUser.role})</span>
          </div>
        </div>
      </div>

      {/* KPI Metric Summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border p-4 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Initiated / Drafts</span>
          <span className="text-2xl font-extrabold text-slate-900 block font-display mt-1">
            {ffRecords.filter(f => f.status === 'DRAFT' || f.status === 'PREPARED').length}
          </span>
          <span className="text-[10px] text-gray-400 mt-1 block">Worksheets being compiled</span>
        </div>
        <div className="bg-white border p-4 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Pending Sign-off</span>
          <span className="text-2xl font-extrabold text-amber-600 block font-display mt-1">
            {ffRecords.filter(f => f.status === 'VERIFIED' || f.status === 'APPROVED' || f.status === 'FINAL_APPROVED').length}
          </span>
          <span className="text-[10px] text-gray-400 mt-1 block">Awaiting Accounts / HOD / Admin</span>
        </div>
        <div className="bg-white border p-4 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Disbursed / Separated</span>
          <span className="text-2xl font-extrabold text-emerald-600 block font-display mt-1">
            {ffRecords.filter(f => f.status === 'DISBURSED').length}
          </span>
          <span className="text-[10px] text-gray-400 mt-1 block">Statutory accounts closed</span>
        </div>
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs border border-slate-800">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Compliance Standard</span>
          <span className="text-base font-bold block font-display mt-1.5 flex items-center gap-1">
            <ShieldCheck size={16} className="text-emerald-400" />
            100% Audit-Ready
          </span>
          <span className="text-[9px] text-slate-400 block mt-1">Statutory compliance matching Labour Law</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle size={15} className="text-emerald-500" />
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle size={15} className="text-rose-500" />
          {errorMsg}
        </div>
      )}

      {/* Main Workspace Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Settlement Navigation Sidebar */}
        <div className="lg:col-span-4 bg-white border rounded-2xl p-4 shadow-xs space-y-4 max-h-[750px] overflow-y-auto">
          
          <div className="flex gap-2 border-b pb-3">
            <button
              onClick={() => setActiveTab('cases')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition ${activeTab === 'cases' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              F&F Registry ({filteredFF.length})
            </button>
            <button
              onClick={() => setActiveTab('initialize')}
              className={`flex-1 py-1.5 text-center text-xs font-bold rounded-lg transition ${activeTab === 'initialize' ? 'bg-slate-900 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
            >
              Initialize F&F
            </button>
          </div>

          {activeTab === 'cases' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Employee, F&F ID..."
                  className="w-full pl-9 pr-3 py-1.5 border rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-gray-5/50"
                />
              </div>

              <div className="space-y-2.5">
                {filteredFF.map(f => (
                  <div 
                    key={f.id}
                    onClick={() => setActiveCalculation(f)}
                    className={`p-3 border rounded-xl cursor-pointer transition flex flex-col justify-between gap-1 ${activeCalculation?.id === f.id ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-100 hover:bg-gray-50'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-gray-900 text-xs block">{f.employee_name}</span>
                        <span className="text-[10px] text-gray-400 block font-mono">{f.employee_id} ({f.company})</span>
                      </div>
                      <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${getStatusColor(f.status)}`}>
                        {f.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-end pt-2 border-t border-dashed border-gray-100 mt-1">
                      <div>
                        <span className="text-[9px] text-gray-400 block">Net Settlement Pay</span>
                        <span className="font-mono text-xs font-bold text-slate-800">
                          {f.net_settlement_pay >= 0 ? `₹${f.net_settlement_pay.toLocaleString('en-IN')}` : `Recover ₹${Math.abs(f.net_settlement_pay).toLocaleString('en-IN')}`}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrintingRecord(f);
                        }}
                        className="p-1 hover:bg-white border rounded text-slate-600 hover:text-emerald-600 transition"
                        title="Print Compliance Letter"
                      >
                        <Printer size={12} />
                      </button>
                    </div>
                  </div>
                ))}

                {filteredFF.length === 0 && (
                  <div className="text-center text-xs text-gray-400 py-10">
                    No matching F&F cases found.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'initialize' && (
            <div className="space-y-4 pt-1">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] p-3 rounded-xl leading-relaxed">
                Choose an exiting employee and log their final working date. Vetan will prefill leave balances, computed service gratuity and detect any outstanding loan balances automatically.
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider">Employee Name</label>
                  <select
                    value={targetEmpId}
                    onChange={(e) => setTargetEmpId(e.target.value)}
                    className="w-full border p-2 text-xs rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Employee --</option>
                    {activeEmployees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.company} - {e.id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider">Last Working Date</label>
                  <input 
                    type="date" 
                    value={lastWorkingDay}
                    onChange={(e) => setLastWorkingDay(e.target.value)}
                    className="w-full border p-2 text-xs rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleFFCalculate}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calculator size={14} />
                  Compile Draft Settlement
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Detailed Settlement Stepper Workspace */}
        <div className="lg:col-span-8 bg-white border rounded-2xl p-5 shadow-xs space-y-6">
          
          {!activeCalculation ? (
            <div className="h-full min-h-[400px] flex flex-col justify-center items-center text-center p-6 space-y-3">
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full">
                <Calculator size={36} />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Active Worksheet Loaded</h3>
              <p className="text-gray-400 text-xs max-w-sm leading-relaxed">
                Select an existing F&F case from the registry sidebar or click <strong>Initialize F&F</strong> to begin calculating a new settlement.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Stepper Header Block */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div>
                  <span className={`inline-block text-[8px] font-extrabold uppercase px-2 py-0.5 rounded border ${getStatusColor(activeCalculation.status)}`}>
                    Status: {activeCalculation.status}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm mt-1.5">
                    F&F Audit Sheet: {activeCalculation.employee_name}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveCalculation(null)}
                  className="p-1.5 border hover:bg-gray-50 rounded-lg text-gray-400 transition"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Step Navigation Strip */}
              <div className="flex overflow-x-auto no-scrollbar border-b pb-1 gap-2">
                {[
                  { step: 1, label: 'Profile' },
                  { step: 2, label: 'Notice & Leaves' },
                  { step: 3, label: 'Earnings' },
                  { step: 4, label: 'Recoveries & Clearance' },
                  { step: 5, label: 'Balance Sheet' },
                  { step: 6, label: 'Statutory Sign-offs' }
                ].map(s => (
                  <button
                    key={s.step}
                    onClick={() => setActiveStep(s.step)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition shrink-0 ${activeStep === s.step ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-gray-500 hover:bg-gray-50'}`}
                  >
                    {s.step}. {s.label}
                  </button>
                ))}
              </div>

              {/* STEP 1 CONTENT: PROFILE DETAILS */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-slate-800 pb-1 border-b border-gray-50">
                    <User size={15} className="text-emerald-600" />
                    <h4 className="font-bold text-xs">Personnel Profile & Exit Timelines</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px] font-bold block">Employee Code (Primary ID)</label>
                      <input
                        type="text"
                        disabled
                        value={activeCalculation.employee_id}
                        className="w-full bg-gray-50 border p-2 rounded-lg text-gray-600 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px] font-bold block">Employee Name</label>
                      <input
                        type="text"
                        value={ffDepartment ? activeCalculation.employee_name : ''}
                        disabled
                        className="w-full bg-gray-50 border p-2 rounded-lg text-gray-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px] font-bold block">Department</label>
                      <input
                        type="text"
                        value={ffDepartment}
                        onChange={(e) => setFfDepartment(e.target.value)}
                        className="w-full border p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px] font-bold block">Designation</label>
                      <input
                        type="text"
                        value={ffDesignation}
                        onChange={(e) => setFfDesignation(e.target.value)}
                        className="w-full border p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px] font-bold block">Reporting HOD / Manager</label>
                      <input
                        type="text"
                        value={ffReportingManager}
                        onChange={(e) => setFfReportingManager(e.target.value)}
                        className="w-full border p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px] font-bold block">Total Calculated Service Period</label>
                      <input
                        type="text"
                        value={ffTotalServicePeriod}
                        onChange={(e) => setFfTotalServicePeriod(e.target.value)}
                        placeholder="e.g. 5 Years, 2 Months"
                        className="w-full border p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2">
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px] font-bold block">Date of Joining</label>
                      <input
                        type="date"
                        value={ffJoiningDate}
                        onChange={(e) => setFfJoiningDate(e.target.value)}
                        className="w-full border p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px] font-bold block">Date of Resignation</label>
                      <input
                        type="date"
                        value={ffResignationDate}
                        onChange={(e) => setFfResignationDate(e.target.value)}
                        className="w-full border p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px] font-bold block">Resignation Accepted On</label>
                      <input
                        type="date"
                        value={ffResignationAcceptDate}
                        onChange={(e) => setFfResignationAcceptDate(e.target.value)}
                        className="w-full border p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-gray-400 text-[10px] font-bold block">Date of Leaving (LWD)</label>
                      <input
                        type="date"
                        value={ffLeavingDate}
                        onChange={(e) => setFfLeavingDate(e.target.value)}
                        className="w-full border p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white font-semibold text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-1 text-xs">
                      <label className="text-gray-400 text-[10px] font-bold block">Reason for Separation / Leaving</label>
                      <select
                        value={ffReason}
                        onChange={(e) => setFfReason(e.target.value)}
                        className="w-full border p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white text-xs"
                      >
                        <option value="Better Career Growth">Better Career Opportunity</option>
                        <option value="Personal Reasons">Personal Grounds</option>
                        <option value="Higher Education">Higher Education</option>
                        <option value="Health Reasons">Medical / Health reasons</option>
                        <option value="Relocation">Relocation / Migration</option>
                        <option value="Retirement">Superannuation / Retirement</option>
                        <option value="Involuntary Termination">Involuntary Separation</option>
                      </select>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="text-gray-400 text-[10px] font-bold block">Exit Remarks & Notes</label>
                      <textarea
                        rows={3}
                        value={ffRemarks}
                        onChange={(e) => setFfRemarks(e.target.value)}
                        placeholder="Log detailed exit interview feedback or hand-over descriptions..."
                        className="w-full border p-2 rounded-lg focus:ring-1 focus:ring-emerald-500 bg-white text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 CONTENT: NOTICE PERIOD & LEAVE BALANCES */}
              {activeStep === 2 && (
                <div className="space-y-6">
                  
                  {/* Notice period card */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-slate-800 pb-1 border-b border-gray-50">
                      <Briefcase size={15} className="text-emerald-600" />
                      <h4 className="font-bold text-xs">Statutory Notice Period Audit</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <label className="text-gray-400 text-[10px] font-bold block">Notice Applicable (Days)</label>
                        <input
                          type="number"
                          value={ffNoticeApplicable}
                          onChange={(e) => setFfNoticeApplicable(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-2 rounded-lg bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-gray-400 text-[10px] font-bold block">Notice Served (Days)</label>
                        <input
                          type="number"
                          value={ffNoticeServed}
                          onChange={(e) => setFfNoticeServed(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-2 rounded-lg bg-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-gray-400 text-[10px] font-bold block">Shortfall Days (Deduction)</label>
                        <input
                          type="number"
                          disabled
                          value={ffNoticeShortfall}
                          className="w-full bg-gray-50 border p-2 rounded-lg text-rose-600 font-bold"
                        />
                      </div>
                    </div>
                    {ffNoticeShortfall > 0 && (
                      <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-800">
                        Notice shortfall of <strong>{ffNoticeShortfall} days</strong> detected. This will trigger a notice pay recovery penalty of <strong>₹{liveNoticeDeduction.toLocaleString('en-IN')}</strong> from basic wage rates.
                      </div>
                    )}
                  </div>

                  {/* Leave Section card */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between pb-1 border-b border-gray-50">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <FileText size={15} className="text-emerald-600" />
                        <h4 className="font-bold text-xs">Compliance Leave Ledger Balances</h4>
                      </div>
                      <span className="text-[10px] bg-slate-100 font-semibold px-2 py-0.5 rounded text-gray-500 font-mono">
                        PL Encashment Eligible
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div className="space-y-1 bg-emerald-50/10 p-3 border rounded-xl">
                        <label className="text-emerald-700 text-[9px] font-bold uppercase block">Privilege Leave (PL)</label>
                        <input
                          type="number"
                          value={ffLeavePL}
                          onChange={(e) => setFfLeavePL(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-1.5 rounded bg-white text-xs mt-1.5 text-emerald-800 font-bold"
                        />
                        <span className="text-[8px] text-gray-400 mt-1 block">Eligible for payout</span>
                      </div>
                      <div className="space-y-1 p-3 border rounded-xl bg-gray-50/30">
                        <label className="text-gray-500 text-[9px] font-bold uppercase block">Casual Leave (CL)</label>
                        <input
                          type="number"
                          value={ffLeaveCL}
                          onChange={(e) => setFfLeaveCL(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-1.5 rounded bg-white text-xs mt-1.5 text-gray-600"
                        />
                        <span className="text-[8px] text-gray-400 mt-1 block">Lapses on separation</span>
                      </div>
                      <div className="space-y-1 p-3 border rounded-xl bg-gray-50/30">
                        <label className="text-gray-500 text-[9px] font-bold uppercase block">Sick Leave (SL)</label>
                        <input
                          type="number"
                          value={ffLeaveSL}
                          onChange={(e) => setFfLeaveSL(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-1.5 rounded bg-white text-xs mt-1.5 text-gray-600"
                        />
                        <span className="text-[8px] text-gray-400 mt-1 block">Lapses on separation</span>
                      </div>
                      <div className="space-y-1 p-3 border rounded-xl bg-gray-50/30">
                        <label className="text-gray-500 text-[9px] font-bold uppercase block">Comp Off (CO)</label>
                        <input
                          type="number"
                          value={ffLeaveCompOff}
                          onChange={(e) => setFfLeaveCompOff(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-1.5 rounded bg-white text-xs mt-1.5 text-gray-600"
                        />
                        <span className="text-[8px] text-gray-400 mt-1 block">Non-encashable</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border p-3.5 rounded-xl text-xs space-y-2">
                      <div className="flex justify-between items-center text-slate-700">
                        <span>Privilege Leave Encashment Value:</span>
                        <span className="font-mono font-bold text-gray-900">₹{ffLeaveEncashment.toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 leading-relaxed font-mono">
                        Formula applied: (Base Salary / 30) * Privilege Leave Balance = (₹{employees.find(e => e.id === activeCalculation.employee_id)?.base_salary || 30000} / 30) * {ffLeavePL} PL days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 CONTENT: EARNINGS & GRATUITY */}
              {activeStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-slate-800 pb-1 border-b border-gray-50">
                    <DollarSign size={15} className="text-emerald-600" />
                    <h4 className="font-bold text-xs">Earnings, Wages & Gratuity Accruals</h4>
                  </div>

                  <div className="space-y-4 text-xs">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-gray-400 text-[10px] font-bold block uppercase">Gratuity Payout (₹)</label>
                        <input
                          type="number"
                          value={ffGratuity}
                          onChange={(e) => setFfGratuity(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-2 rounded-lg bg-white font-mono"
                        />
                        <span className="text-[9px] text-gray-400 leading-normal block">
                          Completed Years: {Math.floor(Number(activeCalculation.total_service_period?.split(' ')[0]) || 0)} years. (Requires min. 5 continuous years. Standard calculation applied: 15/26 * Basic * Years).
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-gray-400 text-[10px] font-bold block uppercase">Pending Bonus (₹)</label>
                        <input
                          type="number"
                          value={ffPendingBonus}
                          onChange={(e) => setFfPendingBonus(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-2 rounded-lg bg-white text-emerald-700 font-bold font-mono"
                          placeholder="0"
                        />
                        <span className="text-[9px] text-gray-400 block">Ex-gratia, performance bonuses, or statutory annual payouts due.</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 border p-4 rounded-2xl space-y-3.5">
                      <span className="font-bold block text-gray-500 uppercase tracking-wider text-[9px]">Final Unpaid Salary / Wages Due</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-gray-400 text-[10px] font-bold block">Unpaid Working Days (Current Month)</label>
                          <input
                            type="number"
                            value={ffUnpaidDays}
                            onChange={(e) => {
                              const days = Math.max(0, Number(e.target.value));
                              setFfUnpaidDays(days);
                              const emp = employees.find(em => em.id === activeCalculation.employee_id);
                              if (emp) {
                                const gross = emp.base_salary + emp.hra + emp.special_allowance + (emp.conveyance_allowance || 0) + (emp.edu_allowance || 0) + (emp.medical_allowance || 0);
                                setFfUnpaidEarned(Math.round((gross / 30) * days));
                              }
                            }}
                            className="w-full border p-2 rounded-lg bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-gray-400 text-[10px] font-bold block">Unpaid Salary Earned (₹)</label>
                          <input
                            type="number"
                            value={ffUnpaidEarned}
                            onChange={(e) => setFfUnpaidEarned(Math.max(0, Number(e.target.value)))}
                            className="w-full border p-2 rounded-lg bg-white font-mono font-bold"
                          />
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 font-mono">
                        Prefills dynamically based on standard gross salary divided by 30 calendar days.
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 4 CONTENT: RECOVERIES & CLEARANCE */}
              {activeStep === 4 && (
                <div className="space-y-6">
                  
                  {/* Asset clearance checkboxes */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-slate-800 pb-1 border-b border-gray-50">
                      <CheckSquare size={15} className="text-emerald-600" />
                      <h4 className="font-bold text-xs font-display uppercase tracking-wider">Company Asset Clearance Checklist</h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs text-slate-700">
                      <button
                        type="button"
                        onClick={() => setFfClearanceID(!ffClearanceID)}
                        className={`p-3 border rounded-xl flex items-center justify-between text-left transition ${ffClearanceID ? 'border-emerald-200 bg-emerald-50/15 text-emerald-950' : 'border-rose-100 bg-rose-50/10'}`}
                      >
                        <span className="font-semibold">ID Card Clearance</span>
                        {ffClearanceID ? <CheckCircle size={15} className="text-emerald-600 shrink-0" /> : <X size={15} className="text-rose-500 shrink-0" />}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setFfClearanceLaptop(!ffClearanceLaptop)}
                        className={`p-3 border rounded-xl flex items-center justify-between text-left transition ${ffClearanceLaptop ? 'border-emerald-200 bg-emerald-50/15 text-emerald-950' : 'border-rose-100 bg-rose-50/10'}`}
                      >
                        <span className="font-semibold">Laptop & IT Assets</span>
                        {ffClearanceLaptop ? <CheckCircle size={15} className="text-emerald-600 shrink-0" /> : <X size={15} className="text-rose-500 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFfClearanceMobile(!ffClearanceMobile)}
                        className={`p-3 border rounded-xl flex items-center justify-between text-left transition ${ffClearanceMobile ? 'border-emerald-200 bg-emerald-50/15 text-emerald-950' : 'border-rose-100 bg-rose-50/10'}`}
                      >
                        <span className="font-semibold">Corporate SIM / Mobile</span>
                        {ffClearanceMobile ? <CheckCircle size={15} className="text-emerald-600 shrink-0" /> : <X size={15} className="text-rose-500 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFfClearanceAccess(!ffClearanceAccess)}
                        className={`p-3 border rounded-xl flex items-center justify-between text-left transition ${ffClearanceAccess ? 'border-emerald-200 bg-emerald-50/15 text-emerald-950' : 'border-rose-100 bg-rose-50/10'}`}
                      >
                        <span className="font-semibold">Access Card Handover</span>
                        {ffClearanceAccess ? <CheckCircle size={15} className="text-emerald-600 shrink-0" /> : <X size={15} className="text-rose-500 shrink-0" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFfClearanceOther(!ffClearanceOther)}
                        className={`p-3 border rounded-xl flex items-center justify-between text-left transition ${ffClearanceOther ? 'border-emerald-200 bg-emerald-50/15 text-emerald-950' : 'border-rose-100 bg-rose-50/10'}`}
                      >
                        <span className="font-semibold">Keys & Physical Files</span>
                        {ffClearanceOther ? <CheckCircle size={15} className="text-emerald-600 shrink-0" /> : <X size={15} className="text-rose-500 shrink-0" />}
                      </button>
                    </div>

                    <div className="space-y-1 text-xs">
                      <label className="text-gray-400 text-[10px] font-bold block">Asset Clearance Handoff Remarks</label>
                      <input
                        type="text"
                        value={ffClearanceRemarks}
                        onChange={(e) => setFfClearanceRemarks(e.target.value)}
                        placeholder="IT Handover complete. Serial ID LPT-209 verified."
                        className="w-full border p-2 rounded-lg bg-white"
                      />
                    </div>
                  </div>

                  {/* Recoveries input fields */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-1.5 text-slate-800 pb-1 border-b border-gray-50">
                      <Percent size={15} className="text-rose-500" />
                      <h4 className="font-bold text-xs text-rose-700">Audit Recoveries & Deductions</h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="space-y-1 bg-rose-50/5 p-3 border border-rose-100 rounded-xl">
                        <label className="text-rose-900 text-[10px] font-bold block">Salary Advance O/S</label>
                        <input
                          type="number"
                          value={ffRecoveryAdvance}
                          onChange={(e) => setFfRecoveryAdvance(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-1.5 rounded mt-1.5 bg-white font-mono text-rose-700"
                        />
                      </div>
                      
                      <div className="space-y-1 bg-amber-50/5 p-3 border border-amber-200 rounded-xl">
                        <label className="text-amber-900 text-[10px] font-bold block">Loan Outstanding</label>
                        <input
                          type="number"
                          value={ffRecoveryLoan}
                          onChange={(e) => setFfRecoveryLoan(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-1.5 rounded mt-1.5 bg-white font-mono text-amber-800 font-semibold"
                        />
                        <span className="text-[8px] text-slate-500 mt-1 block">Auto-prefilled from ledger</span>
                      </div>

                      <div className="space-y-1 bg-rose-50/5 p-3 border border-rose-100 rounded-xl">
                        <label className="text-rose-900 text-[10px] font-bold block">Asset Damage Recovery</label>
                        <input
                          type="number"
                          value={ffRecoveryAsset}
                          onChange={(e) => setFfRecoveryAsset(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-1.5 rounded mt-1.5 bg-white font-mono text-rose-700"
                        />
                      </div>

                      <div className="space-y-1 bg-rose-50/5 p-3 border border-rose-100 rounded-xl">
                        <label className="text-rose-900 text-[10px] font-bold block">Other Recovery</label>
                        <input
                          type="number"
                          value={ffRecoveryOther}
                          onChange={(e) => setFfRecoveryOther(Math.max(0, Number(e.target.value)))}
                          className="w-full border p-1.5 rounded mt-1.5 bg-white font-mono text-rose-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5 CONTENT: BALANCE SHEET SUMMARY */}
              {activeStep === 5 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-1.5 text-slate-800 pb-1 border-b border-gray-50">
                    <FileText size={15} className="text-emerald-600" />
                    <h4 className="font-bold text-xs uppercase tracking-wider font-display">Statutory Balance Sheet</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    
                    {/* Left: Earnings breakdown */}
                    <div className="space-y-3 bg-emerald-50/5 border border-emerald-100 rounded-xl p-4">
                      <span className="font-extrabold text-emerald-800 block text-[9px] uppercase tracking-wider">A. Gross Earnings Breakdown</span>
                      <div className="divide-y space-y-2 text-slate-700 pt-1.5">
                        <div className="flex justify-between pb-1">
                          <span>Service Gratuity:</span>
                          <span className="font-mono font-bold text-slate-800">₹{ffGratuity.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 pb-1">
                          <span>PL Leave Encashment:</span>
                          <span className="font-mono font-bold text-slate-800">₹{ffLeaveEncashment.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 pb-1">
                          <span>Pending Salary Due:</span>
                          <span className="font-mono font-bold text-slate-800">₹{ffUnpaidEarned.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 pb-1 text-emerald-700">
                          <span>Pending Bonus Accrued:</span>
                          <span className="font-mono font-bold">₹{ffPendingBonus.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2.5 font-bold text-slate-900 border-t-2">
                          <span>Total Earnings (A):</span>
                          <span className="font-mono">₹{liveGrossEarnings.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Deductions & Recoveries breakdown */}
                    <div className="space-y-3 bg-rose-50/5 border border-rose-100 rounded-xl p-4">
                      <span className="font-extrabold text-rose-800 block text-[9px] uppercase tracking-wider">B. Recoveries & Liabilities Breakdown</span>
                      <div className="divide-y space-y-2 text-slate-700 pt-1.5">
                        <div className="flex justify-between pb-1">
                          <span>Notice Shortfall Penalty:</span>
                          <span className="font-mono font-bold text-rose-600">₹{liveNoticeDeduction.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 pb-1">
                          <span>Salary Advance Outstanding:</span>
                          <span className="font-mono font-bold text-rose-600">₹{ffRecoveryAdvance.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 pb-1 text-amber-750">
                          <span>Loan Liability Outstanding:</span>
                          <span className="font-mono font-bold text-amber-700">₹{ffRecoveryLoan.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 pb-1">
                          <span>Asset Damage/Loss Recovery:</span>
                          <span className="font-mono font-bold text-rose-600">₹{ffRecoveryAsset.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2 pb-1">
                          <span>Other Deductions:</span>
                          <span className="font-mono font-bold text-rose-600">₹{ffRecoveryOther.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between pt-2.5 font-bold text-slate-900 border-t-2">
                          <span>Total Recoveries (B):</span>
                          <span className="font-mono">₹{liveGrossDeductions.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Net Summary highlight block */}
                  <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${liveNetSettlementPay >= 0 ? 'bg-emerald-950 text-white border-emerald-900' : 'bg-rose-950 text-white border-rose-900'}`}>
                    <div>
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">
                        {liveNetSettlementPay >= 0 ? 'C. Net Disbursable Settle Value' : 'C. Recoverable Liability Outstanding'}
                      </span>
                      <p className="text-[10.5px] text-slate-300 mt-1 max-w-md leading-relaxed font-sans">
                        {liveNetSettlementPay >= 0 
                          ? 'This amount represents the legal final clearance sum to be paid into the employee corporate salary bank account.' 
                          : 'Liability exceeds accrued earnings. The employee owes the corporate entity outstanding dues before releasing certificates.'}
                      </p>
                    </div>
                    <div className="text-right sm:shrink-0">
                      <span className={`text-2xl font-extrabold font-mono tracking-tight block ${liveNetSettlementPay >= 0 ? 'text-emerald-300' : 'text-rose-400'}`}>
                        ₹{Math.abs(liveNetSettlementPay).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                        {liveNetSettlementPay >= 0 ? 'PAYABLE TO EMPLOYEE' : 'LIABILITY RECOVERY DUE'}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl text-[10.5px] text-gray-500 leading-relaxed font-mono">
                    ⚠️ <strong>Audit Verification Checklist:</strong> All asset clearance flags must be fully ticked, and any outstanding loan liabilities successfully offset, prior to marking this settlement as 'FINAL_APPROVED' or issuing the statutory compliance clearance letter.
                  </div>

                </div>
              )}

              {/* STEP 6 CONTENT: APPROVAL WORKFLOW SIGN-OFFS */}
              {activeStep === 6 && (
                <div className="space-y-6">
                  
                  <div className="flex items-center gap-1.5 text-slate-800 pb-1 border-b border-gray-50">
                    <UserCheck size={15} className="text-emerald-600" />
                    <h4 className="font-bold text-xs uppercase tracking-wider font-display">Labour Compliance Audit Approval Timeline</h4>
                  </div>

                  <p className="text-xs text-gray-500 leading-relaxed">
                    A compliant Full and Final clearance sheet requires verification and sign-off across four corporate functions under Labour law guidelines. Check each stage in succession to apply appropriate signature stamps.
                  </p>

                  <div className="space-y-4 pt-1">
                    
                    {/* Stage 1: Prep by HR */}
                    <div className="p-4 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-slate-900 text-white rounded-full text-[10px] font-bold flex items-center justify-center">1</span>
                          <span className="font-bold text-xs text-gray-900">Prepared By (HR)</span>
                        </div>
                        <p className="text-[10.5px] text-gray-400 mt-1 max-w-md leading-relaxed">Calculates and compiles basic parameters, service tenure, and PL balances.</p>
                        {prepBy && (
                          <div className="mt-2 text-[10.5px] text-emerald-800 font-mono font-bold bg-emerald-50 w-fit px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                            <Check size={12} />
                            Stamped: {prepBy} on {prepDate}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        {!prepBy ? (
                          <button
                            onClick={() => handleApplySignature('HR')}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Sign as HR
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClearSignature('HR')}
                            className="w-full sm:w-auto px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stage 2: Verified by Accounts */}
                    <div className="p-4 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-slate-900 text-white rounded-full text-[10px] font-bold flex items-center justify-center">2</span>
                          <span className="font-bold text-xs text-gray-900">Verified By (Accounts)</span>
                        </div>
                        <p className="text-[10.5px] text-gray-400 mt-1 max-w-md leading-relaxed">Verifies advance recoveries, outstanding loan structures and final balances.</p>
                        {verBy && (
                          <div className="mt-2 text-[10.5px] text-emerald-800 font-mono font-bold bg-emerald-50 w-fit px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                            <Check size={12} />
                            Stamped: {verBy} on {verDate}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        {!prepBy ? (
                          <span className="text-[10px] text-gray-400 italic font-medium p-2 block">HR Prep Required First</span>
                        ) : !verBy ? (
                          <button
                            onClick={() => handleApplySignature('Accounts')}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Stamp Accounts
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClearSignature('Accounts')}
                            className="w-full sm:w-auto px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stage 3: Approved by HOD */}
                    <div className="p-4 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-slate-900 text-white rounded-full text-[10px] font-bold flex items-center justify-center">3</span>
                          <span className="font-bold text-xs text-gray-900">Approved By (HOD)</span>
                        </div>
                        <p className="text-[10.5px] text-gray-400 mt-1 max-w-md leading-relaxed">Attests that work hand-overs, keys, and physical asset returns are verified.</p>
                        {appBy && (
                          <div className="mt-2 text-[10.5px] text-emerald-800 font-mono font-bold bg-emerald-50 w-fit px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                            <Check size={12} />
                            Stamped: {appBy} on {appDate}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        {!verBy ? (
                          <span className="text-[10px] text-gray-400 italic font-medium p-2 block">Accounts Verification Required</span>
                        ) : !appBy ? (
                          <button
                            onClick={() => handleApplySignature('HOD')}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Stamp HOD Sign
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClearSignature('HOD')}
                            className="w-full sm:w-auto px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stage 4: Approved by Super Admin */}
                    <div className="p-4 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 bg-slate-900 text-white rounded-full text-[10px] font-bold flex items-center justify-center">4</span>
                          <span className="font-bold text-xs text-gray-900">Final Approved By (Super Admin)</span>
                        </div>
                        <p className="text-[10.5px] text-gray-400 mt-1 max-w-md leading-relaxed">Legal sign-off of financial clearances and release authorization.</p>
                        {finBy && (
                          <div className="mt-2 text-[10.5px] text-emerald-800 font-mono font-bold bg-emerald-50 w-fit px-2.5 py-1 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                            <Check size={12} />
                            Stamped: {finBy} on {finDate}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto">
                        {!appBy ? (
                          <span className="text-[10px] text-gray-400 italic font-medium p-2 block">HOD Approval Required</span>
                        ) : !finBy ? (
                          <button
                            onClick={() => handleApplySignature('Admin')}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Stamp Admin Sign
                          </button>
                        ) : (
                          <button
                            onClick={() => handleClearSignature('Admin')}
                            className="w-full sm:w-auto px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* STAGE ACTION BAR */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-t pt-4 gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPrintingRecord(activeCalculation)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 font-semibold rounded-xl transition cursor-pointer"
                  >
                    <Printer size={13} />
                    Audit PDF Preview
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => {
                      let computedStatus: 'DRAFT' | 'PREPARED' | 'VERIFIED' | 'APPROVED' | 'FINAL_APPROVED' | 'DISBURSED' = 'DRAFT';
                      if (prepBy) computedStatus = 'PREPARED';
                      if (verBy) computedStatus = 'VERIFIED';
                      if (appBy) computedStatus = 'APPROVED';
                      if (finBy) computedStatus = 'FINAL_APPROVED';

                      saveWorksheet(computedStatus);
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-xs font-bold text-white rounded-xl transition shadow-xs text-center cursor-pointer"
                  >
                    Commit & Save Worksheet
                  </button>

                  {finBy && activeCalculation.status !== 'DISBURSED' && (
                    <button
                      onClick={() => saveWorksheet('DISBURSED')}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-extrabold text-white rounded-xl transition shadow-xs text-center cursor-pointer"
                    >
                      Authorize Final Disbursal
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* COMPLIANCE AUDIT A4 PDF OVERLAY PRINT WINDOW */}
      <AnimatePresence>
        {printingRecord && (
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs overflow-y-auto flex items-center justify-center p-0 md:p-8 no-print">
            
            <motion.div 
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              className="bg-white w-full max-w-4xl min-h-[1100px] shadow-2xl p-6 md:p-12 relative font-sans text-slate-950 printable-sheet"
              id="compliance-printable-document"
            >
              
              {/* Overlay Interactive controls (hidden during print) */}
              <div className="flex items-center justify-between gap-3 p-4 bg-slate-100 border-b rounded-xl mb-6 no-print">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <ShieldCheck size={16} />
                  </span>
                  <div>
                    <span className="font-bold text-xs block text-slate-800">Compliance Audit & Labour Print Panel</span>
                    <span className="text-[10px] text-gray-400 font-mono">Format matching Section 19 of Payment of Gratuity Act & EPF laws</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-semibold rounded-lg transition cursor-pointer"
                  >
                    <Printer size={13} />
                    Run System Print
                  </button>
                  <button 
                    onClick={() => setPrintingRecord(null)}
                    className="p-1.5 border hover:bg-gray-200 rounded-lg text-gray-500 transition cursor-pointer bg-white"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* PDF Document Structure */}
              <div className="space-y-6 text-slate-900 text-xs font-sans">
                
                {/* Official Letterhead Header */}
                <div className="flex justify-between items-start pb-5 border-b-2 border-slate-900">
                  <div className="space-y-1.5">
                    <span className="text-xl font-extrabold tracking-tight text-slate-900 font-display uppercase block">
                      {printingRecord.company}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono block">
                      CIN: L45201MH2012PLC230491 | Statutory Labour Compliance Division
                    </span>
                    <span className="text-[9.5px] text-slate-600 block">
                      Corporate Head Office: Sakar Corporate Suites, MIDC Road, Mumbai, India.
                    </span>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="px-2.5 py-0.5 bg-slate-100 border text-[9px] font-extrabold uppercase rounded tracking-wider text-slate-800">
                      Audit Sheet Ref
                    </span>
                    <span className="font-mono text-xs font-bold block text-slate-800 mt-1">{printingRecord.id}</span>
                    <span className="text-[9px] text-slate-500 block font-mono">Date: {printingRecord.disbursed_date || new Date().toISOString().split('T')[0]}</span>
                  </div>
                </div>

                {/* Main Heading */}
                <div className="text-center py-2 bg-slate-100 rounded border border-slate-200">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-900 font-display">
                    FULL & FINAL STATUTORY SETTLEMENT STATEMENT
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                    Under Payment of Wages Act, Payment of Gratuity Act & Compliance Guidelines
                  </p>
                </div>

                {/* 10 Required Profile fields block */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 block">
                    I. EMPLOYEE PROFILE & EXIT TIMELINES
                  </span>
                  
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-6 border p-4 rounded-xl bg-slate-50/50">
                    <div className="flex justify-between items-center border-b pb-1.5 border-dashed border-slate-200 text-slate-800">
                      <span>1. Employee Name:</span>
                      <strong className="text-slate-900 uppercase font-semibold">{printingRecord.employee_name}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 border-dashed border-slate-200 text-slate-800">
                      <span>2. Department:</span>
                      <strong className="text-slate-900 uppercase font-semibold">{printingRecord.department || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 border-dashed border-slate-200 text-slate-800">
                      <span>3. Designation:</span>
                      <strong className="text-slate-900 uppercase font-semibold">{printingRecord.designation || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 border-dashed border-slate-200 text-slate-800">
                      <span>4. Reporting Manager:</span>
                      <strong className="text-slate-900 uppercase font-semibold">{printingRecord.reporting_manager || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 border-dashed border-slate-200 text-slate-800">
                      <span>5. Date of Joining (DOJ):</span>
                      <strong className="text-slate-900 font-mono">{printingRecord.joining_date || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 border-dashed border-slate-200 text-slate-800">
                      <span>6. Date of Resignation:</span>
                      <strong className="text-slate-900 font-mono">{printingRecord.resignation_date || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 border-dashed border-slate-200 text-slate-800">
                      <span>7. Acceptance Date:</span>
                      <strong className="text-slate-900 font-mono">{printingRecord.resignation_acceptance_date || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 border-dashed border-slate-200 text-slate-800">
                      <span>8. Last Working Date:</span>
                      <strong className="text-slate-900 font-mono">{printingRecord.last_working_day || 'N/A'}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 border-dashed border-slate-200 text-slate-800">
                      <span>9. Date of Leaving (DOL):</span>
                      <strong className="text-slate-900 font-mono">{printingRecord.leaving_date || printingRecord.last_working_day}</strong>
                    </div>
                    <div className="flex justify-between items-center border-b pb-1.5 border-dashed border-slate-200 text-slate-800">
                      <span>10. Service Period:</span>
                      <strong className="text-emerald-800 font-semibold">{printingRecord.total_service_period || 'N/A'}</strong>
                    </div>
                  </div>
                </div>

                {/* Separation Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border p-3 rounded-xl bg-slate-50/20 text-slate-800">
                  <div>
                    <span className="block text-[9px] font-bold text-gray-500 uppercase">Reason for Separation</span>
                    <span className="block font-semibold text-slate-900 mt-0.5">{printingRecord.reason_for_leaving || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-bold text-gray-500 uppercase">Exit Remarks / Handover Notes</span>
                    <span className="block text-slate-700 mt-0.5 leading-relaxed">{printingRecord.exit_remarks || 'All files and physical logs transferred successfully.'}</span>
                  </div>
                </div>

                {/* SIDE-BY-SIDE LEDGER SECTION (EARNINGS & RECOVERIES) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                  
                  {/* Left Column: Earnings Breakdown */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 block">
                      II. EARNINGS & ACCRUALS (A)
                    </span>
                    
                    <table className="w-full text-left border rounded-xl overflow-hidden font-mono text-[10.5px]">
                      <thead>
                        <tr className="bg-slate-100 border-b text-slate-800 font-bold">
                          <th className="p-2">Component Description</th>
                          <th className="p-2 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y text-slate-800">
                        <tr>
                          <td className="p-2 text-slate-600">
                            Service Gratuity Payout:
                            <span className="block text-[8.5px] font-sans text-gray-400">Completing completed years benefit</span>
                          </td>
                          <td className="p-2 text-right font-bold">₹{printingRecord.gratuity_earned.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-600">
                            PL Leave Encashment:
                            <span className="block text-[8.5px] font-sans text-gray-400">PL Bal: {printingRecord.leave_balance_pl || 0} days (eligible for payout)</span>
                          </td>
                          <td className="p-2 text-right font-bold">₹{printingRecord.earned_leave_encashment.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-600">
                            Pending Working Wages Due:
                            <span className="block text-[8.5px] font-sans text-gray-400">Unpaid Days: {printingRecord.unpaid_salary_days || 0} days</span>
                          </td>
                          <td className="p-2 text-right font-bold">₹{printingRecord.unpaid_salary_earned.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-600">
                            Pending Annual/Performance Bonus:
                            <span className="block text-[8.5px] font-sans text-gray-400">Statutory accruals</span>
                          </td>
                          <td className="p-2 text-right font-bold text-slate-800">₹{(printingRecord.pending_bonus || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="bg-slate-50 font-sans font-bold text-slate-950">
                          <td className="p-2.5 uppercase">Gross Earnings Sum (A):</td>
                          <td className="p-2.5 text-right font-mono">₹{printingRecord.gross_earnings.toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column: Recoveries Breakdown */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 block">
                      III. RECOVERIES & LIABILITIES (B)
                    </span>
                    
                    <table className="w-full text-left border border-rose-200 rounded-xl overflow-hidden font-mono text-[10.5px]">
                      <thead>
                        <tr className="bg-rose-50/50 border-b border-rose-200 text-rose-950 font-bold">
                          <th className="p-2">Deduction Description</th>
                          <th className="p-2 text-right">Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y border-rose-100 text-slate-800">
                        <tr>
                          <td className="p-2 text-slate-600">
                            Notice Shortfall Penalty:
                            <span className="block text-[8.5px] font-sans text-gray-400">Shortfall Days: {printingRecord.notice_shortfall_days || 0} days</span>
                          </td>
                          <td className="p-2 text-right font-bold text-rose-700">₹{printingRecord.notice_period_deduction.toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-600">
                            Salary Advance Outstanding:
                            <span className="block text-[8.5px] font-sans text-gray-400">Advanced wages</span>
                          </td>
                          <td className="p-2 text-right font-bold text-rose-700">₹{(printingRecord.recovery_salary_advance || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-600">
                            Outstanding Loan Liability:
                            <span className="block text-[8.5px] font-sans text-gray-400">Pending principal & interest dues</span>
                          </td>
                          <td className="p-2 text-right font-bold text-amber-700">₹{(printingRecord.recovery_loan_outstanding || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-600">
                            Asset Damage / Non-Return Penalties:
                            <span className="block text-[8.5px] font-sans text-gray-400">IT or physical damages</span>
                          </td>
                          <td className="p-2 text-right font-bold text-rose-700">₹{(printingRecord.recovery_asset || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr>
                          <td className="p-2 text-slate-600">
                            Other Recoveries:
                            <span className="block text-[8.5px] font-sans text-gray-400">Ad-hoc expenses</span>
                          </td>
                          <td className="p-2 text-right font-bold text-rose-700">₹{(printingRecord.recovery_other || 0).toLocaleString('en-IN')}</td>
                        </tr>
                        <tr className="bg-rose-50/35 font-sans font-bold text-slate-950">
                          <td className="p-2.5 uppercase">Gross Recoveries Sum (B):</td>
                          <td className="p-2.5 text-right font-mono">₹{printingRecord.gross_deductions.toLocaleString('en-IN')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>

                {/* Final Net balance highlighted strip */}
                <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-extrabold uppercase block tracking-wider">
                      {printingRecord.net_settlement_pay >= 0 ? 'IV. NET PAYABLE FINAL CLEARANCE VALUE (A - B)' : 'IV. NET LIABILITY RECOVERY VALUE (B - A)'}
                    </span>
                    <span className="text-[9.5px] text-slate-400 block mt-0.5">
                      Statutory final clearance value to be processed via corporate NEFT channels.
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-emerald-400 block">
                      ₹{Math.abs(printingRecord.net_settlement_pay).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 block">
                      {printingRecord.net_settlement_pay >= 0 ? 'NET CREDIT PAYABLE' : 'DEBIT BALANCE DUE'}
                    </span>
                  </div>
                </div>

                {/* Asset clearance check table */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 block">
                    V. DEPARTMENTAL CLEARANCE & CERTIFICATE HANDOVER SIGN-OFFS
                  </span>
                  
                  <table className="w-full border text-left text-[10px] text-slate-700 divide-y rounded-xl overflow-hidden bg-slate-50/20">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-900">
                        <th className="p-2">Clearance Function</th>
                        <th className="p-2 text-center">Status</th>
                        <th className="p-2">Officer Remarks</th>
                        <th className="p-2">Signature Stamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-2 font-bold text-slate-950">1. IT Asset Handover & Server Accounts (Laptop)</td>
                        <td className="p-2 text-center font-bold text-emerald-700">
                          {printingRecord.clearance_laptop ? 'APPROVED' : 'PENDING'}
                        </td>
                        <td className="p-2 text-gray-500">Corporate laptop and cloud logs removed.</td>
                        <td className="p-2 text-gray-400 italic">Verified by IT Officer</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-950">2. Security Gate, Access Control & ID Badges</td>
                        <td className="p-2 text-center font-bold text-emerald-700">
                          {printingRecord.clearance_id_card && printingRecord.clearance_access_card ? 'APPROVED' : 'PENDING'}
                        </td>
                        <td className="p-2 text-gray-500">Physical access ID badge handed over.</td>
                        <td className="p-2 text-gray-400 italic">Verified by Security Admin</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-950">3. HR Clearance & Leave Auditing</td>
                        <td className="p-2 text-center font-bold text-emerald-700">
                          APPROVED
                        </td>
                        <td className="p-2 text-gray-500">Leaves encashment mapped; certificates generated.</td>
                        <td className="p-2 text-gray-400 italic">Verified by HR Manager</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-slate-950">4. Finance Dues & Outstanding Loans Clearance</td>
                        <td className="p-2 text-center font-bold text-emerald-700">
                          {printingRecord.recovery_loan_outstanding && printingRecord.recovery_loan_outstanding > 0 ? 'LIABILITY RECOVERED' : 'CLEARED'}
                        </td>
                        <td className="p-2 text-gray-500">All advance salaries and loans verified.</td>
                        <td className="p-2 text-gray-400 italic">Verified by Accounts Head</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Four-stage verification box */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-800 block">
                    VI. FOUR-STAGE COMPLIANCE APPROVAL WORKFLOW VERIFICATION
                  </span>

                  <div className="grid grid-cols-4 gap-4 text-[9.5px]">
                    <div className="border p-3 rounded-xl bg-slate-50/50 space-y-1.5 flex flex-col justify-between min-h-[90px]">
                      <div>
                        <strong className="block text-slate-900">1. PREPARED BY</strong>
                        <span className="text-slate-500 block">Corporate HR Desk</span>
                      </div>
                      {printingRecord.approval_prepared_by ? (
                        <div className="font-mono text-emerald-800 text-[8.5px]">
                          ✔ {printingRecord.approval_prepared_by}
                          <span className="block text-slate-400 text-[8px]">{printingRecord.approval_prepared_date}</span>
                        </div>
                      ) : (
                        <span className="text-rose-600 block font-bold">AWAITING HR</span>
                      )}
                    </div>

                    <div className="border p-3 rounded-xl bg-slate-50/50 space-y-1.5 flex flex-col justify-between min-h-[90px]">
                      <div>
                        <strong className="block text-slate-900">2. VERIFIED BY</strong>
                        <span className="text-slate-500 block">Finance & Accounts</span>
                      </div>
                      {printingRecord.approval_verified_by ? (
                        <div className="font-mono text-emerald-800 text-[8.5px]">
                          ✔ {printingRecord.approval_verified_by}
                          <span className="block text-slate-400 text-[8px]">{printingRecord.approval_verified_date}</span>
                        </div>
                      ) : (
                        <span className="text-rose-600 block font-bold">AWAITING ACCTS</span>
                      )}
                    </div>

                    <div className="border p-3 rounded-xl bg-slate-50/50 space-y-1.5 flex flex-col justify-between min-h-[90px]">
                      <div>
                        <strong className="block text-slate-900">3. APPROVED BY</strong>
                        <span className="text-slate-500 block">Department HOD</span>
                      </div>
                      {printingRecord.approval_approved_by ? (
                        <div className="font-mono text-emerald-800 text-[8.5px]">
                          ✔ {printingRecord.approval_approved_by}
                          <span className="block text-slate-400 text-[8px]">{printingRecord.approval_approved_date}</span>
                        </div>
                      ) : (
                        <span className="text-rose-600 block font-bold">AWAITING HOD</span>
                      )}
                    </div>

                    <div className="border p-3 rounded-xl bg-slate-50/50 space-y-1.5 flex flex-col justify-between min-h-[90px]">
                      <div>
                        <strong className="block text-slate-900">4. FINAL APPROVED</strong>
                        <span className="text-slate-500 block">Super Admin Sign-off</span>
                      </div>
                      {printingRecord.approval_final_approved_by ? (
                        <div className="font-mono text-emerald-800 text-[8.5px]">
                          ✔ {printingRecord.approval_final_approved_by}
                          <span className="block text-slate-400 text-[8px]">{printingRecord.approval_final_approved_date}</span>
                        </div>
                      ) : (
                        <span className="text-rose-600 block font-bold">AWAITING ADMIN</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Final Compliance Declaration & Signature lines */}
                <div className="space-y-8 pt-4">
                  <div className="bg-slate-50 border p-3.5 rounded-xl leading-relaxed italic text-slate-800 text-center font-sans text-[11px]">
                    "I, <strong>{printingRecord.employee_name}</strong>, hereby declare that I have received a sum of 
                    <strong> ₹{Math.max(0, printingRecord.net_settlement_pay).toLocaleString('en-IN')}</strong> as the full and final clearance 
                    of all my statutory dues, claims, and entitlements from <strong>{printingRecord.company}</strong>, and there are no further 
                    arrears, disputes, or complaints outstanding under my payroll."
                  </div>

                  <div className="grid grid-cols-2 pt-8 font-mono text-[9px] text-gray-400">
                    <div className="space-y-14">
                      <div className="w-48 border-t border-slate-900 pt-2 font-bold text-slate-800 uppercase tracking-wider text-center">
                        RESIGNEE SIGNATURE & DATE
                      </div>
                    </div>
                    <div className="space-y-14 flex flex-col items-end">
                      <div className="w-48 border-t border-slate-900 pt-2 font-bold text-slate-800 uppercase tracking-wider text-center">
                        COMPLIANCE AUDITOR SIGNATURE
                      </div>
                    </div>
                  </div>
                </div>

                {/* Official Compliance Footer */}
                <div className="pt-8 border-t text-center text-[8.5px] text-gray-400 font-mono">
                  This document is generated by Vetan HRMS Compliance Engine, automatically validated under India statutory Payment of Wages Act, Section 19.
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
