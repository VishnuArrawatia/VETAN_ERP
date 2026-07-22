/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle, 
  AlertCircle, 
  FileSpreadsheet, 
  Download, 
  Send, 
  Eye, 
  Mail, 
  MessageSquare, 
  Printer, 
  X,
  Lock,
  Unlock,
  Building,
  ArrowRight,
  Copy,
  Check,
  Receipt,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, PayrollRun, Payslip } from '../types';
import { getCompanyName } from './CompanyLogos';
import PayrollInputManagementView from './PayrollInputManagementView';

interface PayrollRegisterProps {
  employees: Employee[];
  payrollRuns: PayrollRun[];
  slips: Payslip[];
  activeMonth: string;
  activeCompany: string;
  onCalculatePayroll: (month: string, company: string) => Promise<boolean>;
  onClosePayroll: (month: string, company: string) => Promise<boolean>;
  onNavigate?: (tab: any) => void;
  setActiveMonth?: (month: string) => void;
  onRefresh?: () => void;
  activeHR?: any;
}

export default function PayrollRegister({ 
  employees, 
  payrollRuns, 
  slips, 
  activeMonth, 
  activeCompany, 
  onCalculatePayroll, 
  onClosePayroll,
  onNavigate,
  setActiveMonth,
  onRefresh,
  activeHR
}: PayrollRegisterProps) {
  const [topTab, setTopTab] = useState<'REGISTER' | 'INPUTS'>('INPUTS');
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [activeSlip, setActiveSlip] = useState<Payslip | null>(null);
  const [successLogs, setSuccessLogs] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [notificationsPreview, setNotificationsPreview] = useState<any[] | null>(null);

  // Accounts JV Modal state
  const [showAccountsJvModal, setShowAccountsJvModal] = useState(false);
  const [copyJvSuccess, setCopyJvSuccess] = useState(false);

  // Accounts JV Calculation for activeMonth
  const accountsJvData = React.useMemo(() => {
    const slipsForMonth = slips.filter(s => s.month === activeMonth);
    const unitsList = Array.from(new Set(employees.map(e => e.company))).sort();

    const unitBreakdowns = unitsList.map(unitName => {
      const unitSlips = slipsForMonth.filter(s => {
        const emp = employees.find(e => e.id === s.employee_id);
        return emp ? emp.company === unitName : false;
      });

      const empCount = unitSlips.length;
      const basicSalary = unitSlips.reduce((sum, s) => sum + (s.earned_base_salary || 0), 0);
      const hra = unitSlips.reduce((sum, s) => sum + (s.earned_hra || 0), 0);
      const eduAllowance = unitSlips.reduce((sum, s) => sum + (s.earned_edu_allowance || 0), 0);
      const medicalAllowance = unitSlips.reduce((sum, s) => sum + (s.earned_medical_allowance || 0), 0);
      const conveyanceAllowance = unitSlips.reduce((sum, s) => sum + (s.earned_conveyance_allowance || 0), 0);
      const specialAllowance = unitSlips.reduce((sum, s) => sum + (s.earned_special_allowance || 0), 0);
      const grossSalary = unitSlips.reduce((sum, s) => sum + (s.gross_salary || 0), 0);

      const eePf = unitSlips.reduce((sum, s) => sum + (s.pf_deduction || 0), 0);
      const erPf = unitSlips.reduce((sum, s) => sum + (s.employer_pf || 0), 0);
      const eeEsic = unitSlips.reduce((sum, s) => sum + (s.esic_deduction || 0), 0);
      const erEsic = unitSlips.reduce((sum, s) => sum + (s.employer_esic || 0), 0);

      const bonusPayable = unitSlips.reduce((sum, s) => sum + (s.earned_bonus_payable || s.rate_bonus_payable || 0), 0);
      const tds = unitSlips.reduce((sum, s) => sum + (s.tds || 0), 0);
      const salaryAdvance = unitSlips.reduce((sum, s) => sum + (s.salary_advance || 0), 0);
      const loanEmi = unitSlips.reduce((sum, s) => sum + (s.loan_deduction || 0), 0);
      const otherDeductions = unitSlips.reduce((sum, s) => sum + (s.custom_deductions || 0), 0);
      const totalDeductions = unitSlips.reduce((sum, s) => sum + (s.total_deductions || 0), 0);
      const netSalary = unitSlips.reduce((sum, s) => sum + (s.net_salary || 0), 0);

      return {
        unitName,
        empCount,
        basicSalary,
        hra,
        eduAllowance,
        medicalAllowance,
        conveyanceAllowance,
        specialAllowance,
        grossSalary,
        eePf,
        erPf,
        eeEsic,
        erEsic,
        bonusPayable,
        tds,
        salaryAdvance,
        loanEmi,
        otherDeductions,
        totalDeductions,
        netSalary
      };
    });

    const totals = {
      empCount: unitBreakdowns.reduce((s, u) => s + u.empCount, 0),
      basicSalary: unitBreakdowns.reduce((s, u) => s + u.basicSalary, 0),
      hra: unitBreakdowns.reduce((s, u) => s + u.hra, 0),
      eduAllowance: unitBreakdowns.reduce((s, u) => s + u.eduAllowance, 0),
      medicalAllowance: unitBreakdowns.reduce((s, u) => s + u.medicalAllowance, 0),
      conveyanceAllowance: unitBreakdowns.reduce((s, u) => s + u.conveyanceAllowance, 0),
      specialAllowance: unitBreakdowns.reduce((s, u) => s + u.specialAllowance, 0),
      grossSalary: unitBreakdowns.reduce((s, u) => s + u.grossSalary, 0),
      eePf: unitBreakdowns.reduce((s, u) => s + u.eePf, 0),
      erPf: unitBreakdowns.reduce((s, u) => s + u.erPf, 0),
      eeEsic: unitBreakdowns.reduce((s, u) => s + u.eeEsic, 0),
      erEsic: unitBreakdowns.reduce((s, u) => s + u.erEsic, 0),
      bonusPayable: unitBreakdowns.reduce((s, u) => s + u.bonusPayable, 0),
      tds: unitBreakdowns.reduce((s, u) => s + u.tds, 0),
      salaryAdvance: unitBreakdowns.reduce((s, u) => s + u.salaryAdvance, 0),
      loanEmi: unitBreakdowns.reduce((s, u) => s + u.loanEmi, 0),
      otherDeductions: unitBreakdowns.reduce((s, u) => s + u.otherDeductions, 0),
      totalDeductions: unitBreakdowns.reduce((s, u) => s + u.totalDeductions, 0),
      netSalary: unitBreakdowns.reduce((s, u) => s + u.netSalary, 0)
    };

    const debitEntries = [
      { account: 'Basic Salary Expense A/c', amount: totals.basicSalary, code: 'EXP-BASIC' },
      { account: 'House Rent Allowance (HRA) Expense A/c', amount: totals.hra, code: 'EXP-HRA' },
      { account: 'Education Allowance Expense A/c', amount: totals.eduAllowance, code: 'EXP-EDU' },
      { account: 'Medical Allowance Expense A/c', amount: totals.medicalAllowance, code: 'EXP-MED' },
      { account: 'Conveyance Allowance Expense A/c', amount: totals.conveyanceAllowance, code: 'EXP-CONV' },
      { account: 'Special Allowance Expense A/c', amount: totals.specialAllowance, code: 'EXP-SPEC' },
      { account: 'Employer EPF Contribution Expense A/c', amount: totals.erPf, code: 'EXP-ER-PF' },
      { account: 'Employer ESIC Contribution Expense A/c', amount: totals.erEsic, code: 'EXP-ER-ESIC' },
      { account: 'Bonus Expense A/c', amount: totals.bonusPayable, code: 'EXP-BONUS' }
    ].filter(item => item.amount > 0);

    const totalDebit = totals.grossSalary + totals.erPf + totals.erEsic + totals.bonusPayable;

    const creditEntries = [
      { account: 'Provident Fund Payable A/c (EE PF + ER PF)', amount: totals.eePf + totals.erPf, code: 'LIAB-PF' },
      { account: 'ESIC Payable A/c (EE ESIC + ER ESIC)', amount: totals.eeEsic + totals.erEsic, code: 'LIAB-ESIC' },
      { account: 'Income Tax TDS Payable A/c', amount: totals.tds, code: 'LIAB-TDS' },
      { account: 'Salary Advance Recovery A/c', amount: totals.salaryAdvance, code: 'REC-ADV' },
      { account: 'Loan EMI Recovery A/c', amount: totals.loanEmi, code: 'REC-LOAN' },
      { account: 'Other Deductions Recovery A/c', amount: totals.otherDeductions, code: 'REC-OTHER' },
      { account: 'Bonus Payable A/c', amount: totals.bonusPayable, code: 'LIAB-BONUS' },
      { account: 'Net Salary Payable A/c (Bank Disbursal)', amount: totals.netSalary, code: 'LIAB-NETBANK' }
    ].filter(item => item.amount > 0);

    const totalCredit = (totals.eePf + totals.erPf) + (totals.eeEsic + totals.erEsic) + totals.tds + totals.salaryAdvance + totals.loanEmi + totals.otherDeductions + totals.bonusPayable + totals.netSalary;

    return {
      unitBreakdowns,
      totals,
      debitEntries,
      totalDebit,
      creditEntries,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 1
    };
  }, [slips, activeMonth, employees]);

  const handleCopyJvFromRegister = () => {
    let text = `=========================================================\n`;
    text += `SAKAR & SVN GROUP - MONTHLY SALARY JOURNAL VOUCHER (JV)\n`;
    text += `MONTH: ${activeMonth} | GENERATED ON: ${new Date().toLocaleDateString('en-IN')}\n`;
    text += `=========================================================\n\n`;

    text += `--- DEBIT (Dr.) EXPENSES ---\n`;
    accountsJvData.debitEntries.forEach((dr, i) => {
      text += `${i + 1}. ${dr.account.padEnd(46)} : ₹ ${dr.amount.toLocaleString('en-IN').padStart(12)} Dr\n`;
    });
    text += `TOTAL DEBIT : ₹ ${accountsJvData.totalDebit.toLocaleString('en-IN')}\n\n`;

    text += `--- CREDIT (Cr.) LIABILITIES & RECOVERIES ---\n`;
    accountsJvData.creditEntries.forEach((cr, i) => {
      text += `${i + 1}. ${cr.account.padEnd(46)} : ₹ ${cr.amount.toLocaleString('en-IN').padStart(12)} Cr\n`;
    });
    text += `TOTAL CREDIT : ₹ ${accountsJvData.totalCredit.toLocaleString('en-IN')}\n\n`;

    navigator.clipboard.writeText(text);
    setCopyJvSuccess(true);
    setTimeout(() => setCopyJvSuccess(false), 3000);
  };

  // Master Unlock/Reset state
  const [securePinModal, setSecurePinModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onSubmit: (pin: string) => Promise<void>;
  } | null>(null);
  const [pinValue, setPinValue] = useState('');
  const [pinError, setPinError] = useState('');

  const handleAdminUnlockTrigger = () => {
    setPinValue('');
    setPinError('');
    setSecurePinModal({
      isOpen: true,
      title: 'Admin Master Reset & Unlock (एडमिन मास्टर अनलॉक)',
      description: `You are requesting to unlock the CLOSED salary cycle for ${activeMonth} in unit ${activeCompany}. Unlocking this will reset the cycle back to 'DRAFT', allowing you to recalculate (Run Draft Salary), alter wages/deductions, and re-lock when ready.`,
      onSubmit: async (pin) => {
        try {
          const res = await fetch('/api/payroll-runs/unlock', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-operator-name': activeHR?.name || 'Admin',
              'x-operator-role': activeHR?.role || 'SUPER_HR'
            },
            body: JSON.stringify({
              month: activeMonth,
              company: activeCompany,
              pin
            })
          });

          const data = await res.json();
          if (res.ok && data.success) {
            setSuccessLogs(`Success! Payroll month ${activeMonth} has been unlocked and reset to Draft. You can now re-run salary calculations.`);
            setSecurePinModal(null);
            if (onRefresh) {
              onRefresh();
            }
          } else {
            setPinError(data.message || data.error || 'Failed to unlock payroll month. Invalid PIN.');
          }
        } catch (e: any) {
          setPinError('Connection failed: ' + e.message);
        }
      }
    });
  };

  // States for editing deductions
  const [isEditing, setIsEditing] = useState(false);
  const [editPf, setEditPf] = useState(0);
  const [editEsic, setEditEsic] = useState(0);
  const [editPt, setEditPt] = useState(0);
  const [editTds, setEditTds] = useState(0);
  const [editLoan, setEditLoan] = useState(0);
  const [editSalaryAdvance, setEditSalaryAdvance] = useState(0);
  const [editCustomDeductions, setEditCustomDeductions] = useState(0);

  useEffect(() => {
    if (activeSlip) {
      setEditPf(activeSlip.pf_deduction || 0);
      setEditEsic(activeSlip.esic_deduction || 0);
      setEditPt(activeSlip.professional_tax || 0);
      setEditTds(activeSlip.tds || 0);
      setEditLoan(activeSlip.loan_deduction || 0);
      setEditSalaryAdvance(activeSlip.salary_advance || 0);
      setEditCustomDeductions(activeSlip.custom_deductions || 0);
    } else {
      setIsEditing(false);
    }
  }, [activeSlip?.id]);

  const handleSaveDeductions = async () => {
    if (!activeSlip) return;
    try {
      const res = await fetch(`/api/payslips/${activeSlip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pf: Number(editPf),
          esic: Number(editEsic),
          pt: Number(editPt),
          tds: Number(editTds),
          loan: Number(editLoan),
          advance: Number(editSalaryAdvance),
          custom: Number(editCustomDeductions)
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSlip(data.slip);
        setIsEditing(false);
        if (onRefresh) onRefresh();
        alert('Deductions updated and salary totals recalculated successfully!');
      } else {
        alert(data.error || 'Failed to save deductions');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Find matches
  const suffix = activeCompany !== 'ALL' ? `-${activeCompany}` : '';
  const currentRun = payrollRuns.find(r => r.month === activeMonth && r.id === `RUN-${activeMonth}${suffix}`);

  const handleCalculate = async () => {
    setLoading(true);
    setSuccessLogs('');
    setErrorMsg('');
    try {
      const ok = await onCalculatePayroll(activeMonth, activeCompany);
      if (ok) {
        setSuccessLogs(`Salary calculations draft computed successfully for '${activeMonth}'!`);
      } else {
        setErrorMsg('Failed to process structure calculations.');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRun = async () => {
    if (!window.confirm('Are you absolutely sure you want to CLOSE and sign off the draft salary cycle for ' + activeMonth + '? This locks accounting details and records official logs to the database.')) return;
    setClosing(true);
    setSuccessLogs('');
    setErrorMsg('');
    try {
      const ok = await onClosePayroll(activeMonth, activeCompany);
      if (ok) {
        setSuccessLogs(`Signed-off and finalized salary cycle ledger of '${activeMonth}' successfully!`);
      } else {
        setErrorMsg('Failed closing the active draft.');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setClosing(false);
    }
  };

  const handlePayWages = async () => {
    if (!window.confirm(`Are you sure you want to DISBURSE payments and confirm salary status for ${activeMonth}? This marks all matching payslips as PAID and generates WhatsApp, SMS, and Email payment confirmation notifications.`)) return;
    setPaying(true);
    setSuccessLogs('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/payroll-runs/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: activeMonth, company: activeCompany })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessLogs(`Successfully triggered payment disburse and salary confirmation! Marked ${data.count} employees as PAID.`);
        setNotificationsPreview(data.notifications);
      } else {
        setErrorMsg('Failed to process payment disburse.');
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setPaying(false);
    }
  };

  const handleSendSlip = async (employeeId: string, method: 'EMAIL' | 'WHATSAPP') => {
    try {
      const res = await fetch('/api/delivery/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, method, month: activeMonth, media: 'Payslip' })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessLogs(data.message);
        setTimeout(() => setSuccessLogs(''), 4500);
      }
    } catch (err: any) {
      setErrorMsg('Failed delivery trigger simulation: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTopTab('INPUTS')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer ${
              topTab === 'INPUTS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet size={15} className={topTab === 'INPUTS' ? 'text-emerald-400' : ''} />
            Payroll Input & Deduction System (Module 13)
          </button>

          <button
            onClick={() => setTopTab('REGISTER')}
            className={`px-5 py-2.5 rounded-xl font-black text-xs transition flex items-center gap-2 cursor-pointer ${
              topTab === 'REGISTER'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Receipt size={15} className={topTab === 'REGISTER' ? 'text-indigo-400' : ''} />
            Salary Register, JV & Payslips
          </button>
        </div>

        <div className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border">
          Unit: <strong className="text-slate-900">{activeCompany}</strong> | Month: <strong className="text-slate-900">{activeMonth}</strong>
        </div>
      </div>

      {topTab === 'INPUTS' ? (
        <PayrollInputManagementView
          employees={employees}
          slips={slips}
          activeMonth={activeMonth}
          activeCompany={activeCompany}
          activeHR={activeHR}
          onRefresh={onRefresh}
          onCalculatePayroll={onCalculatePayroll}
          onClosePayroll={onClosePayroll}
        />
      ) : (
        <>
      
      {/* 💡 Reassurance & Hinglish Friendly Guide Banner */}
      <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-5 flex gap-4 items-start shadow-2xs">
        <div className="p-3 bg-slate-900 text-amber-400 border border-slate-800 rounded-xl shadow-xs shrink-0 mt-0.5">
          <CheckCircle size={20} />
        </div>
        <div className="space-y-1.5">
          <h4 className="font-bold text-slate-900 text-sm font-display flex items-center gap-2 flex-wrap">
            <span>सैलरी प्रोसेसिंग गाइड: 100% सुरक्षित और आसान "चेक-देन-फ्रीज" सिस्टम</span>
            <span className="bg-pink-500/10 text-pink-500 border border-pink-500/20 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">100% Safe Safeguard (Pink)</span>
          </h4>
          <p className="text-slate-600 text-xs leading-relaxed">
            <strong>घबराएं नहीं!</strong> इस ईआरपी में आपकी की हुई कोई भी मेहनत बेकार नहीं जाएगी। यह सिस्टम आपके पसंदीदा <strong>"चेक-देन-फ्रीज" (Check-then-Freeze)</strong> पैटर्न पर ही बना है। आप <strong>April-2026</strong> की ड्राफ्ट सैलरी जनरेट करने के बाद उसे <strong>Excel/CSV</strong> में डाउनलोड कर के पूरी तरह से जांच सकते हैं। जब तक आप "Freeze" नहीं दबाते, तब तक कोई भी डेटा स्थायी रूप से लॉक नहीं होता, और आप कर्मचारियों की सैलरी या हाजिरी में कितनी भी बार एडिट कर के दोबारा ड्राफ्ट रन कर सकते हैं।
          </p>
          <div className="text-[10px] text-slate-500 font-bold flex flex-wrap gap-x-5 gap-y-1 pt-1 font-mono">
            <span className="flex items-center gap-1 text-pink-500">✓ Draft Mode is 100% editable (Pink)</span>
            <span className="flex items-center gap-1 text-emerald-700">✓ Freeze locks monthly rates perfectly</span>
            <span className="flex items-center gap-1 text-amber-500">✓ Perfect workflow for April, May & future cycles (Gold)</span>
          </div>
        </div>
      </div>

      {/* 🧭 Interactive 5-Step Roadmap Wizard */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-gray-100 pb-5 gap-4">
          <div>
            <h3 className="font-bold text-slate-900 font-display text-base tracking-tight flex items-center gap-2.5">
              <span className="p-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl"><Building size={18} /></span>
              <span>मासिक सैलरी प्रक्रिया रोडमैप <span className="text-amber-500">(Gold)</span></span>
            </h3>
            <p className="text-gray-400 text-xs mt-1">
              अप्रैल से शुरू करके अगले 3-4 महीनों की सैलरी बारी-बारी से प्रोसेस करें, जांचें और लॉक करें।
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-slate-50 border border-slate-100 p-2.5 rounded-xl self-start lg:self-auto">
            <span className="text-[11px] font-bold text-slate-600 font-display whitespace-nowrap">प्रोसेसिंग महीना चुनें:</span>
            <div className="flex gap-1.5 flex-wrap">
              {['2026-04', '2026-05', '2026-06', '2026-07'].map((m) => {
                const isActive = activeMonth === m;
                const label = m === '2026-04' ? 'April-26' : m === '2026-05' ? 'May-26 (Increment)' : m === '2026-06' ? 'June-26' : 'July-26';
                return (
                  <button 
                    key={m}
                    onClick={() => setActiveMonth && setActiveMonth(m)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${isActive ? 'bg-blue-600 text-white shadow-xs' : 'bg-white hover:bg-gray-150 text-slate-700 border border-gray-200'}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* The Pipeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4.5">
          
          {/* Step 1 */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/15 flex flex-col justify-between hover:shadow-xs transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">Step 1</span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-blue-100 text-blue-800 rounded uppercase">Verify</span>
              </div>
              <h5 className="font-bold text-xs text-slate-800 font-display flex items-center gap-1">
                <span>हाजिरी & मास्टर</span>
              </h5>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                पहले <strong>{activeMonth}</strong> की हाजिरी (LOP, Overtime) और कर्मचारियों की लिस्ट जांच लें।
              </p>
            </div>
            <button 
              onClick={() => onNavigate && onNavigate('attendance')}
              className="mt-4 w-full py-2 text-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              Check Attendance
              <ArrowRight size={10} />
            </button>
          </div>

          {/* Step 2 */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between hover:shadow-xs transition-all ${currentRun ? 'border-emerald-200 bg-emerald-50/10' : 'border-blue-300 bg-blue-50/30 ring-2 ring-blue-500/20'}`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">Step 2</span>
                {currentRun ? (
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-emerald-100 text-emerald-800 rounded uppercase">Calculated</span>
                ) : (
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-amber-100 text-amber-800 rounded uppercase animate-pulse">Required</span>
                )}
              </div>
              <h5 className="font-bold text-xs text-slate-800 font-display">ड्राफ्ट सैलरी गणना</h5>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                सैलरी की गणना चलाएं। आप इसे बदलाव के बाद जितनी बार चाहें दोबारा चला सकते हैं।
              </p>
            </div>
            <button 
              onClick={handleCalculate}
              disabled={loading}
              className={`mt-4 w-full py-2 text-center text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                currentRun 
                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-extrabold border border-emerald-200' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white font-black'
              }`}
            >
              {loading ? 'Processing...' : currentRun ? 'Re-calculate Draft' : 'Run Draft Salary'}
            </button>
          </div>

          {/* Step 3 */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between hover:shadow-xs transition-all ${currentRun ? 'border-blue-200 bg-blue-50/10' : 'border-gray-150 opacity-60'}`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">Step 3</span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-sky-100 text-sky-800 rounded uppercase font-mono">Excel</span>
              </div>
              <h5 className="font-bold text-xs text-slate-800 font-display">एक्सेल में चेक करें</h5>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                सैलरी शीट एक्सेल डाउनलोड करें और चेक करें कि बेसिक, ईपीएफ, ईएसआईसी और नेट पेमेंट सही है।
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <a 
                href={currentRun ? `/api/excel/export/payroll/${activeMonth}?company=${activeCompany}` : '#'}
                onClick={(e) => {
                  if (!currentRun) {
                    e.preventDefault();
                    alert('सैलरी ड्राफ्ट जनरेट करने के बाद ही एक्सेल डाउनलोड हो सकती है। कृपया पहले Step 2 पूरा करें।');
                  }
                }}
                className={`flex-1 py-2 text-center text-[10px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1.5 border cursor-pointer shadow-2xs ${
                  currentRun 
                    ? 'bg-sky-600 hover:bg-sky-700 text-white border-sky-500 font-black' 
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                <FileSpreadsheet size={12} />
                Download Excel
              </a>

              <button
                onClick={() => setShowAccountsJvModal(true)}
                className="flex-1 py-2 bg-indigo-900 hover:bg-indigo-950 text-white border border-indigo-700 text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Receipt size={12} className="text-emerald-400" />
                Accounts JV
              </button>
            </div>
          </div>

          {/* Step 4 */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between hover:shadow-xs transition-all ${currentRun && currentRun.status === 'CLOSED' ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 bg-slate-50/30'}`}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">Step 4</span>
                <span className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded uppercase ${currentRun && currentRun.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-1050 bg-amber-100 text-amber-800'}`}>
                  {currentRun && currentRun.status === 'CLOSED' ? 'Locked' : 'Draft'}
                </span>
              </div>
              <h5 className="font-bold text-xs text-slate-800 font-display">फ्रीज (Freeze & Lock)</h5>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                यदि एक्सेल में सारा डाटा सही है, तो इस महीने को लॉक करें ताकि गलती से बदलाव न हो सके।
              </p>
            </div>
            {currentRun && currentRun.status === 'CLOSED' ? (
              <div className="space-y-2 mt-4">
                <button 
                  onClick={handlePayWages}
                  disabled={paying}
                  className="w-full py-2 text-center bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                >
                  <CheckCircle size={10} />
                  {paying ? 'Paying...' : 'Disburse & Confirm'}
                </button>
                <button 
                  onClick={handleAdminUnlockTrigger}
                  className="w-full py-2 text-center bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Unlock size={11} className="text-rose-500 animate-pulse" />
                  Admin Un-Lock & Reset
                </button>
              </div>
            ) : (
              <button 
                onClick={handleCloseRun}
                disabled={closing || !currentRun}
                className={`mt-4 w-full py-2 text-center text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 border cursor-pointer shadow-2xs ${
                  currentRun && currentRun.status === 'DRAFT' 
                    ? 'bg-slate-900 hover:bg-slate-800 text-white border-slate-950 font-extrabold' 
                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                }`}
              >
                <Lock size={12} />
                Freeze & Lock
              </button>
            )}
          </div>

          {/* Step 5 */}
          <div className="p-4 rounded-xl border border-gray-150 bg-slate-50/15 flex flex-col justify-between hover:shadow-xs transition-all">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-mono">Step 5</span>
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-indigo-100 text-indigo-800 rounded uppercase font-mono">Revision</span>
              </div>
              <h5 className="font-bold text-xs text-slate-800 font-display">इंक्रीमेंट (Revision)</h5>
              <p className="text-[10px] text-gray-400 leading-relaxed">
                मई-26 महीने के इंक्रीमेंट डालने के लिए 'Salary Revisions' टैब में जाकर नया वेतन जोड़ें।
              </p>
            </div>
            <button 
              onClick={() => onNavigate && onNavigate('revisions')}
              className="mt-4 w-full py-2 text-center bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[10px] font-extrabold rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              Add Increment (May)
              <ArrowRight size={10} />
            </button>
          </div>

        </div>
      </div>

      {successLogs && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2">
          <CheckCircle size={14} className="text-emerald-500" />
          {successLogs}
        </div>
      )}

      {activeMonth >= '2026-08' && (
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50/50 border-2 border-emerald-500/20 text-emerald-950 text-xs font-semibold rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <CheckCircle size={16} />
            </div>
            <div>
              <p className="font-extrabold text-emerald-950 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <span>Aug-26 % Salary Formula Enabled</span>
                <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1.5 py-0.5 rounded-full font-extrabold uppercase">PROVISION PASS</span>
              </p>
              <p className="text-[10px] text-emerald-800 font-medium mt-0.5">Under Aug-26 provisions, allowances (HRA 40%, Special 15%, DA 10%, Conveyance 8%, Medical 5%, Edu 2%) are automatically computed from the Basic Salary.</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold font-mono text-[9px] rounded-lg tracking-wider uppercase shadow-2xs self-start sm:self-auto">
            % Formula Active
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium rounded-lg flex items-center gap-2">
          <AlertCircle size={14} className="text-rose-500" />
          {errorMsg}
        </div>
      )}

      {/* Stats summaries cards */}
      {currentRun && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Processed Cycle Status</span>
            <span className={`text-xs font-bold font-mono uppercase px-2 py-0.5 rounded block w-fit ${currentRun.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              ◆ {currentRun.status}
            </span>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Gross Cumulative Expenditure</span>
            <p className="text-lg font-extrabold text-slate-800 font-display">₹{currentRun.total_gross.toLocaleString('en-IN')}</p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Estimated Tax / Statutory Deduct</span>
            <p className="text-lg font-extrabold text-slate-800 font-display">₹{currentRun.total_deductions.toLocaleString('en-IN')}</p>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Net take-home transfers</span>
            <p className="text-lg font-extrabold text-emerald-600 font-display">₹{currentRun.total_net.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* Exports utility card */}
      {slips.length > 0 && (
        <div className="bg-slate-900 text-white p-4.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
          <div>
            <h4 className="font-semibold text-xs font-display tracking-wide uppercase text-slate-400">Compliance & Remittance Exports</h4>
            <p className="text-[11px] text-slate-300 mt-0.5">Quickly extract standard corporate files customized for bank transfer formats and EPFO portals.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a 
              href={`/api/excel/export/pf/${activeMonth}?company=${activeCompany}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-300 border border-slate-700 rounded-lg font-mono tracking-wide transition cursor-pointer"
            >
              <Download size={12} />
              Download EPF ECR Text
            </a>

            <a 
              href={`/api/excel/export/payroll/${activeMonth}?company=${activeCompany}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-5050 text-[11px] font-medium text-white rounded-lg transition cursor-pointer"
            >
              <FileSpreadsheet size={12} />
              Salary Sheet Excel
            </a>

            <a 
              href={`/api/excel/export/bank/${activeMonth}?company=${activeCompany}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-700 text-[11px] border border-slate-700 text-slate-200 rounded-lg transition cursor-pointer"
            >
              <Download size={12} />
              Direct Bank Transfer format
            </a>

            <a 
              href={`/api/excel/export/bank/hdfc/${activeMonth}?company=${activeCompany}&format=excel`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-650 hover:bg-blue-750 bg-blue-600 hover:bg-blue-700 text-[11px] font-semibold text-white rounded-lg transition cursor-pointer"
              title="Generate Excel for HDFC salary upload"
            >
              <FileSpreadsheet size={12} />
              HDFC Bank Excel
            </a>

            <a 
              href={`/api/excel/export/bank/hdfc/${activeMonth}?company=${activeCompany}&format=csv`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-[11px] font-semibold text-white rounded-lg transition cursor-pointer"
              title="Generate CSV for HDFC salary upload"
            >
              <Download size={12} />
              HDFC Bank CSV
            </a>
          </div>
        </div>
      )}

      {/* Salary Register Spreadsheet Table */}
      <div className="bg-white border rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50 border-b select-none font-display text-gray-500">
                <th className="p-4.5 text-xs font-semibold">Staff Name / Ref</th>
                <th className="p-4.5 text-xs font-semibold text-right">Earned Basic (A)</th>
                <th className="p-4.5 text-xs font-semibold text-right">HRA / DA / SpAllow (B)</th>
                <th className="p-4.5 text-xs font-semibold text-right">Gross Earnings (A+B)</th>
                <th className="p-4.5 text-xs font-semibold text-center">EPF (12%) / ESIC</th>
                <th className="p-4.5 text-xs font-semibold text-right">Net Take-Home Pay</th>
                <th className="p-4.5 text-xs font-semibold text-right no-print">Payslip actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {slips.map((s) => {
                const emp = employees.find(e => e.id === s.employee_id);
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4.5">
                      <div>
                        <span className="text-xs font-semibold text-gray-900 block">{s.employee_name}</span>
                        <div className="flex flex-wrap gap-1.5 text-[10px] text-gray-400 font-mono mt-0.5 items-center">
                          <span>{s.employee_id}</span>
                          <span>|</span>
                          <span className="font-bold text-emerald-600 uppercase">{emp?.company}</span>
                          <span>|</span>
                          <span className={`px-1.5 py-0.2 text-[8px] font-extrabold rounded-sm uppercase tracking-wide ${s.payment_status === 'PAID' ? 'bg-emerald-150 bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {s.payment_status || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4.5 text-right font-mono text-xs text-gray-700 font-medium">
                      ₹{s.earned_base_salary.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4.5 text-right">
                      <div>
                        <span className="text-xs text-gray-600 block font-sans">
                          ₹{(
                            s.earned_hra +
                            s.earned_da +
                            s.earned_special_allowance +
                            (s.earned_edu_allowance || 0) +
                            (s.earned_medical_allowance || 0) +
                            (s.earned_conveyance_allowance || 0)
                          ).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] text-gray-400 block font-mono">
                          HRA: {s.earned_hra} | DA: {s.earned_da}
                          {s.earned_edu_allowance ? ` | Edu: ${s.earned_edu_allowance}` : ''}
                          {s.earned_medical_allowance ? ` | Med: ${s.earned_medical_allowance}` : ''}
                          {s.earned_conveyance_allowance ? ` | Conv: ${s.earned_conveyance_allowance}` : ''}
                        </span>
                      </div>
                    </td>
                    <td className="p-4.5 text-right font-mono text-xs text-slate-800 font-semibold">
                      ₹{s.gross_salary.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4.5">
                      <div className="text-center font-mono">
                        <span className="text-xs font-bold text-rose-600 block">PF: ₹{s.pf_deduction.toLocaleString('en-IN')} | ESIC: ₹{s.esic_deduction}</span>
                        <div className="text-[10px] text-gray-400 mt-0.5 flex items-center justify-center gap-2">
                          {s.tds > 0 && <span>TDS: ₹{s.tds}</span>}
                          {s.loan_deduction !== undefined && s.loan_deduction > 0 && (
                            <span className="text-amber-700 bg-amber-50 px-1 py-0.2 rounded font-bold border border-amber-100">Loan: ₹{s.loan_deduction}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4.5 text-right font-mono text-xs text-emerald-600 font-extrabold bg-emerald-50/20">
                      ₹{s.net_salary.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4.5 text-right no-print">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setActiveSlip(s)}
                          className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-xs font-medium text-gray-600 rounded-lg hover:border-emerald-600 hover:text-emerald-700 transition bg-white cursor-pointer"
                        >
                          <Eye size={12} />
                          Preview
                        </button>
                        
                         <button 
                          onClick={() => handleSendSlip(s.employee_id, 'WHATSAPP')}
                          className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded transition cursor-pointer"
                          title="Share via simulated WhatsApp"
                        >
                          <MessageSquare size={13} />
                        </button>

                        <button 
                          onClick={() => handleSendSlip(s.employee_id, 'EMAIL')}
                          className="p-1.5 hover:bg-gray-100 text-gray-500 rounded transition cursor-pointer"
                          title="Email dynamic payslip"
                        >
                          <Mail size={13} />
                        </button>

                        {s.payment_status === 'PAID' && (
                          <button 
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/delivery/send', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ employeeId: s.employee_id, method: 'WHATSAPP', media: 'CONFIRMATION', month: activeMonth })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  alert(`[Simulated Payment Broadcast Alert]\n\n${data.preview}`);
                                }
                              } catch (err: any) {
                                alert(err.message);
                              }
                            }}
                            className="p-1.5 hover:bg-purple-50 text-purple-600 rounded transition cursor-pointer"
                            title="Verify & Resend Payment Confirmation Template"
                          >
                            <CheckCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {slips.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-xs text-gray-400">
                    No active salary records calculated for this month. Choose 'Run Automated Draft Salary' above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT-READY PAYSLIP MODAL DIALOG */}
      <AnimatePresence>
        {activeSlip && (() => {
          const liveTotalDeductions = isEditing 
            ? (activeSlip.lop_deduction + editPf + editEsic + editPt + editTds + editLoan + editSalaryAdvance + editCustomDeductions)
            : (activeSlip.total_deductions);

          const liveNetSalary = isEditing
            ? Math.max(0, activeSlip.gross_salary - liveTotalDeductions)
            : activeSlip.net_salary;

          return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative p-8 print-shadow-none"
              >
                
                {/* Utility close triggers on dialogue */}
                <div className="absolute right-6 top-6 flex items-center gap-2 no-print">
                  {currentRun?.status === 'DRAFT' && (
                    isEditing ? (
                      <>
                        <button 
                          onClick={handleSaveDeductions}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold rounded-lg transition cursor-pointer"
                        >
                          Save
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-xs text-gray-700 font-medium rounded-lg transition cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-xs text-white font-bold rounded-lg transition cursor-pointer"
                      >
                        Edit Deductions
                      </button>
                    )
                  )}
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-medium rounded-lg transition cursor-pointer"
                  >
                    <Printer size={13} />
                    Print Payslip
                  </button>
                  <button 
                    onClick={() => {
                      setActiveSlip(null);
                      setIsEditing(false);
                    }}
                    className="p-1.5 border hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Printable frame section start */}
                <div className="space-y-6 text-slate-800">
                  
                  {/* Printable Header */}
                  <div className="text-center pb-5 border-b border-gray-200">
                    <div className="flex justify-center mb-1">
                      <Building className="text-emerald-600" size={24} />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight font-display">
                      {(() => {
                        const emp = employees.find(e => e.id === activeSlip.employee_id);
                        return getCompanyName(emp?.company || '');
                      })()}
                    </h2>
                    <p className="text-[10px] text-gray-400 block font-mono">Corporate Identity Registry & Salary Disbursal Statement</p>
                    <span className="text-xs font-bold text-gray-700 font-mono mt-2 block">
                      SALARY SLIP FOR: {new Date(`${activeSlip.month}-02`).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }).toUpperCase()} {activeSlip.month >= '2026-08' ? '(PERCENTAGE FORMULA APPLIED)' : ''}
                    </span>
                  </div>

                  {/* Sub-grid information parameters */}
                  <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                    <table className="w-full text-left">
                      <tbody>
                        <tr>
                          <td className="text-gray-400 pb-1.5">Employee ID:</td>
                          <td className="font-mono font-bold pb-1.5 text-gray-900">{activeSlip.employee_id}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pb-1.5">Staff Name:</td>
                          <td className="font-bold pb-1.5 text-gray-900">{activeSlip.employee_name}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pb-1.5">Designation:</td>
                          <td className="text-gray-700 pb-1.5">{activeSlip.designation}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pb-1.5">Department:</td>
                          <td className="text-gray-700 pb-1.5">{activeSlip.department}</td>
                        </tr>
                      </tbody>
                    </table>

                    <table className="w-full text-left">
                      <tbody>
                        <tr>
                          <td className="text-gray-400 pb-1.5">Bank Link Name:</td>
                          <td className="font-medium pb-1.5 text-gray-900">{activeSlip.bank_name}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pb-1.5">Account Number:</td>
                          <td className="font-mono pb-1.5 text-gray-900">{activeSlip.bank_account}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pb-1.5">IFS Code Details:</td>
                          <td className="font-mono pb-1.5 text-gray-900">{activeSlip.ifsc}</td>
                        </tr>
                        <tr>
                          <td className="text-gray-400 pb-1.5">PAN Card No:</td>
                          <td className="font-mono pb-1.5 text-gray-900 uppercase">{activeSlip.pan}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Earnings deduces block */}
                  <div className="grid grid-cols-2 gap-x-6 border-t border-b border-gray-100 py-4 font-sans text-xs">
                    
                    {/* Earnings column */}
                    <div className="space-y-2">
                      <span className="font-bold text-gray-900 border-b pb-1 block uppercase tracking-wider text-[10px]">Earnings Component</span>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Prorated Basic:</span>
                        <span className="font-mono">₹{activeSlip.earned_base_salary.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Earned HRA:</span>
                        <span className="font-mono">₹{activeSlip.earned_hra.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dearness Allowance (DA):</span>
                        <span className="font-mono">₹{activeSlip.earned_da.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Special Allowances:</span>
                        <span className="font-mono">₹{activeSlip.earned_special_allowance.toLocaleString('en-IN')}</span>
                      </div>
                      {activeSlip.earned_edu_allowance !== undefined && activeSlip.earned_edu_allowance > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Education Allowance:</span>
                          <span className="font-mono">₹{activeSlip.earned_edu_allowance.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {activeSlip.earned_medical_allowance !== undefined && activeSlip.earned_medical_allowance > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Medical Allowance:</span>
                          <span className="font-mono">₹{activeSlip.earned_medical_allowance.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      {activeSlip.earned_conveyance_allowance !== undefined && activeSlip.earned_conveyance_allowance > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Conveyance Allowance:</span>
                          <span className="font-mono">₹{activeSlip.earned_conveyance_allowance.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Overtime hours premium:</span>
                        <span className="font-mono">₹{activeSlip.overtime_pay.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Deductions column */}
                    <div className="space-y-2 border-l pl-6">
                      <span className="font-bold text-gray-900 border-b pb-1 block uppercase tracking-wider text-[10px]">Deductions</span>
                      <div className="flex justify-between items-center h-7">
                        <span className="text-gray-500">Loss of Pay (LOP) fine:</span>
                        <span className="font-mono">₹{activeSlip.lop_deduction.toLocaleString('en-IN')}</span>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2 pt-1 border-t border-dashed border-gray-100">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-500 text-[11px]">EPF Employee Share (12%):</span>
                            <input 
                              type="number"
                              value={editPf}
                              onChange={(e) => setEditPf(Math.max(0, Number(e.target.value)))}
                              className="w-24 px-2 py-1 border border-gray-200 rounded text-right font-mono text-[11px] focus:outline-hidden focus:border-blue-500"
                            />
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-500 text-[11px]">ESIC Share (0.75%):</span>
                            <input 
                              type="number"
                              value={editEsic}
                              onChange={(e) => setEditEsic(Math.max(0, Number(e.target.value)))}
                              className="w-24 px-2 py-1 border border-gray-200 rounded text-right font-mono text-[11px] focus:outline-hidden focus:border-blue-500"
                            />
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-500 text-[11px]">Professional Tax (PT):</span>
                            <input 
                              type="number"
                              value={editPt}
                              onChange={(e) => setEditPt(Math.max(0, Number(e.target.value)))}
                              className="w-24 px-2 py-1 border border-gray-200 rounded text-right font-mono text-[11px] focus:outline-hidden focus:border-blue-500"
                            />
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-500 text-[11px]">Income Tax (TDS):</span>
                            <input 
                              type="number"
                              value={editTds}
                              onChange={(e) => setEditTds(Math.max(0, Number(e.target.value)))}
                              className="w-24 px-2 py-1 border border-gray-200 rounded text-right font-mono text-[11px] focus:outline-hidden focus:border-blue-500"
                            />
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-500 text-[11px]">Loan Repayment:</span>
                            <input 
                              type="number"
                              value={editLoan}
                              onChange={(e) => setEditLoan(Math.max(0, Number(e.target.value)))}
                              className="w-24 px-2 py-1 border border-gray-200 rounded text-right font-mono text-[11px] focus:outline-hidden focus:border-blue-500"
                            />
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-500 text-[11px]">Salary Advance:</span>
                            <input 
                              type="number"
                              value={editSalaryAdvance}
                              onChange={(e) => setEditSalaryAdvance(Math.max(0, Number(e.target.value)))}
                              className="w-24 px-2 py-1 border border-gray-200 rounded text-right font-mono text-[11px] focus:outline-hidden focus:border-blue-500"
                            />
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-gray-500 text-[11px]">Others (Custom):</span>
                            <input 
                              type="number"
                              value={editCustomDeductions}
                              onChange={(e) => setEditCustomDeductions(Math.max(0, Number(e.target.value)))}
                              className="w-24 px-2 py-1 border border-gray-200 rounded text-right font-mono text-[11px] focus:outline-hidden focus:border-blue-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center h-7">
                            <span className="text-gray-500">EPF Employee Share (12%):</span>
                            <span className="font-mono">₹{activeSlip.pf_deduction.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center h-7">
                            <span className="text-gray-500">ESIC Medical Share (0.75%):</span>
                            <span className="font-mono">₹{activeSlip.esic_deduction.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center h-7">
                            <span className="text-gray-500">Professional Tax (PT):</span>
                            <span className="font-mono">₹{activeSlip.professional_tax.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center h-7">
                            <span className="text-gray-500">Income Tax (TDS Estimate):</span>
                            <span className="font-mono">₹{activeSlip.tds.toLocaleString('en-IN')}</span>
                          </div>
                          {activeSlip.loan_deduction !== undefined && activeSlip.loan_deduction > 0 && (
                            <div className="flex justify-between items-center h-7 font-semibold text-amber-700">
                              <span>Loan Repayment:</span>
                              <span className="font-mono">₹{activeSlip.loan_deduction.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {activeSlip.salary_advance !== undefined && activeSlip.salary_advance > 0 && (
                            <div className="flex justify-between items-center h-7 font-semibold text-amber-700">
                              <span>Salary Advance:</span>
                              <span className="font-mono">₹{activeSlip.salary_advance.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                          {activeSlip.custom_deductions !== undefined && activeSlip.custom_deductions > 0 && (
                            <div className="flex justify-between items-center h-7 font-semibold text-rose-700">
                              <span>Others (Deductions):</span>
                              <span className="font-mono">₹{activeSlip.custom_deductions.toLocaleString('en-IN')}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Sub totals */}
                  <div className="grid grid-cols-2 gap-x-6 text-xs font-bold pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-900">GROSS SALARY:</span>
                      <span className="font-mono text-gray-900">₹{activeSlip.gross_salary.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pl-6 border-l">
                      <span className="text-gray-900">TOTAL DEDUCTION:</span>
                      <span className="font-mono text-rose-600">₹{liveTotalDeductions.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Net Final transfers highlight */}
                  <div className="bg-emerald-50 p-4.5 rounded-xl border border-emerald-100 flex justify-between items-center text-emerald-900">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">NET TRANSFER AMOUNT</span>
                      <span className="text-xs text-emerald-700 block mt-0.5">Disbursed to bank listed on file.</span>
                    </div>
                    <span className="text-xl font-extrabold font-mono tracking-tight text-emerald-700">
                      ₹{liveNetSalary.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="pt-10 flex justify-between items-end border-t text-[10px] text-gray-400 font-mono">
                    <div>
                      <span>Disbursed via Central Clearing Desk Vetan ERP</span>
                      <span className="block mt-0.5">ID Ref code: {activeSlip.id}</span>
                    </div>
                    <div className="text-right">
                      <span className="border-t border-slate-300 pt-1.5 px-6 font-bold block text-slate-600 text-center select-none uppercase">Authorized HR Signatory</span>
                    </div>
                  </div>

                </div>

              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* NOTIFICATIONS TRANSCRIPT PREVIEW MODAL */}
      <AnimatePresence>
        {notificationsPreview && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold font-display">Generated Salary Payment Confirmations</h3>
                  <p className="text-slate-300 text-xs mt-1">Dispatched customized WhatsApp, SMS, and Email alerts to employees based on the registered template.</p>
                </div>
                <button 
                  onClick={() => setNotificationsPreview(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl transition text-slate-300 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notificationsPreview.map((notif, idx) => (
                    <div key={idx} className="border rounded-2xl p-4 bg-slate-50 space-y-4 shadow-xs">
                      <div className="flex justify-between items-center border-b pb-2">
                        <div>
                          <span className="text-[10px] text-gray-400 font-mono">EMPLOYEE CODE: {notif.employee_id}</span>
                          <h4 className="text-xs font-bold text-slate-800">{notif.employee_name}</h4>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                          ₹{notif.amount.toLocaleString('en-IN')} Sent
                        </span>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-[9px] text-purple-700 font-bold block uppercase tracking-wider">Simulated WhatsApp Broadcast Message</span>
                          <pre className="p-3 bg-white border rounded-xl text-[11px] font-sans whitespace-pre-wrap text-slate-700 select-all border-purple-100">
                            {notif.whatsapp}
                          </pre>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-blue-700 font-bold block uppercase tracking-wider">Simulated SMS Alert Message</span>
                          <pre className="p-3 bg-white border rounded-xl text-[11px] font-sans whitespace-pre-wrap text-slate-700 select-all border-blue-100">
                            {notif.sms}
                          </pre>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-rose-700 font-bold block uppercase tracking-wider">Simulated Email Notice Notification</span>
                          <pre className="p-3 bg-white border rounded-xl text-[11px] font-sans whitespace-pre-wrap text-slate-700 select-all border-rose-100">
                            {notif.email}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setNotificationsPreview(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xs text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Close & Refresh Sheets
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {securePinModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b bg-rose-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-800 rounded-lg text-rose-200">
                    <Unlock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold font-display">{securePinModal.title}</h3>
                    <p className="text-rose-200 text-[10px] mt-0.5">Super Admin Permission Override</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSecurePinModal(null)}
                  className="p-1.5 hover:bg-rose-800 rounded-xl transition text-rose-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setPinError('');
                  await securePinModal.onSubmit(pinValue);
                }} 
                className="p-6 space-y-4"
              >
                <p className="text-xs text-slate-600 leading-relaxed">
                  {securePinModal.description}
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block text-left">Super Admin Security PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinValue}
                    onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-digit PIN"
                    className="w-full text-center text-lg tracking-[0.5em] p-2.5 border rounded-xl font-mono font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                    autoFocus
                    required
                  />
                  <p className="text-[10px] text-gray-400 text-center">Contact Super Admin Vishnu Sakar for credentials (Default is 1234)</p>
                </div>

                {pinError && (
                  <div className="p-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-xs font-semibold text-center">
                    {pinError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSecurePinModal(null)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer select-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer select-none shadow-sm"
                  >
                    Unlock & Reset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ACCOUNTS JOURNAL VOUCHER (JV) POPUP MODAL --- */}
      <AnimatePresence>
        {showAccountsJvModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl my-8 overflow-hidden space-y-0"
            >
              {/* Header */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Receipt size={18} className="text-emerald-400" />
                    <h3 className="text-base font-black font-display">इकाई वार वेतन जर्नल वाउचर (Unit Accounts JV)</h3>
                    <span className="px-2 py-0.5 bg-indigo-900 text-indigo-200 text-[10px] font-mono font-bold rounded uppercase">
                      {activeMonth}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Accounts Department hand-off report with unit-wise earnings, statutory deductions & debit/credit ledger match.</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJvFromRegister}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copyJvSuccess ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    {copyJvSuccess ? 'Copied JV!' : 'Copy JV Text'}
                  </button>

                  <button
                    onClick={() => setShowAccountsJvModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                
                {/* Metric Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 border rounded-2xl">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Total Expenses (Dr)</span>
                    <div className="text-base font-black text-slate-900 font-mono">₹{accountsJvData.totalDebit.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border rounded-2xl">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Deductions Recovered</span>
                    <div className="text-base font-black text-rose-600 font-mono">₹{accountsJvData.totals.totalDeductions.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border rounded-2xl">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Net Bank Disbursal</span>
                    <div className="text-base font-black text-emerald-700 font-mono">₹{accountsJvData.totals.netSalary.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="p-3.5 bg-slate-50 border rounded-2xl">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Bonus Payable</span>
                    <div className="text-base font-black text-indigo-700 font-mono">₹{accountsJvData.totals.bonusPayable.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                {/* Double Entry Voucher Table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Debits */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-800 text-white px-3 py-2 text-xs font-mono font-bold flex justify-between">
                      <span>DEBITS (EXPENSE ACCOUNTS)</span>
                      <span>₹{accountsJvData.totalDebit.toLocaleString('en-IN')}</span>
                    </div>
                    <table className="w-full text-xs text-left">
                      <tbody className="divide-y font-mono">
                        {accountsJvData.debitEntries.map((dr, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-sans font-medium text-slate-800">{dr.account}</td>
                            <td className="p-2 text-right font-bold text-slate-900">₹{dr.amount.toLocaleString('en-IN')} Dr</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Credits */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-indigo-900 text-white px-3 py-2 text-xs font-mono font-bold flex justify-between">
                      <span>CREDITS (LIABILITIES & DISBURSAL)</span>
                      <span>₹{accountsJvData.totalCredit.toLocaleString('en-IN')}</span>
                    </div>
                    <table className="w-full text-xs text-left">
                      <tbody className="divide-y font-mono">
                        {accountsJvData.creditEntries.map((cr, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-sans font-medium text-slate-800">{cr.account}</td>
                            <td className="p-2 text-right font-bold text-indigo-900">₹{cr.amount.toLocaleString('en-IN')} Cr</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Unit Breakdown Matrix */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 font-display">Unit-Wise Breakdown Summary</h4>
                  <div className="overflow-x-auto border rounded-2xl">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="bg-slate-900 text-white font-mono text-[9px] uppercase">
                          <th className="p-2">Unit</th>
                          <th className="p-2 text-center">Emps</th>
                          <th className="p-2 text-right">Basic</th>
                          <th className="p-2 text-right">HRA</th>
                          <th className="p-2 text-right">Gross</th>
                          <th className="p-2 text-right">PF (EE+ER)</th>
                          <th className="p-2 text-right">ESIC (EE+ER)</th>
                          <th className="p-2 text-right">Bonus Pay</th>
                          <th className="p-2 text-right">TDS</th>
                          <th className="p-2 text-right">Adv. Rec.</th>
                          <th className="p-2 text-right bg-emerald-900 text-emerald-100">Net Disbursed</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y font-mono">
                        {accountsJvData.unitBreakdowns.map((u, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-bold font-sans text-slate-900">{u.unitName}</td>
                            <td className="p-2 text-center font-bold">{u.empCount}</td>
                            <td className="p-2 text-right">₹{u.basicSalary.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right">₹{u.hra.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right font-bold">₹{u.grossSalary.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right">₹{(u.eePf + u.erPf).toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right">₹{(u.eeEsic + u.erEsic).toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right text-indigo-700 font-bold">₹{u.bonusPayable.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right text-rose-700 font-bold">₹{u.tds.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right text-amber-700">₹{u.salaryAdvance.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right font-black text-emerald-800 bg-emerald-50">₹{u.netSalary.toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Narration */}
                <div className="bg-slate-50 p-3 rounded-xl border text-[11px] font-mono text-slate-700">
                  <strong>Narration:</strong> Being Monthly Salary Expenses, Statutory PF/ESIC Contributions, Bonus Payable (Bonus Exp Dr / Bonus Payable Cr), TDS, Salary Advance Deductions and Net Disbursal recorded unit-wise for {activeMonth}.
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-slate-50 p-4 border-t flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono">HR & Payroll Hand-off to Accounts Department</span>
                <button
                  onClick={() => setShowAccountsJvModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Close Voucher
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </>
      )}

    </div>
  );
}
