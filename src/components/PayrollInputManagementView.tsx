/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Copy,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Save,
  Plus,
  Coins,
  ShieldCheck,
  Building,
  UserCheck,
  Users,
  FileText,
  DollarSign,
  ArrowRight,
  Sparkles,
  PieChart,
  HelpCircle,
  X,
  Edit2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Employee, Payslip, PayrollEarningHead, PayrollDeductionHead } from '../types';

interface PayrollInputManagementViewProps {
  employees: Employee[];
  slips: Payslip[];
  activeMonth: string;
  activeCompany: string;
  activeHR?: any;
  onRefresh?: () => void;
  onCalculatePayroll?: (month: string, company: string) => Promise<boolean>;
  onClosePayroll?: (month: string, company: string) => Promise<boolean>;
}

export default function PayrollInputManagementView({
  employees,
  slips,
  activeMonth,
  activeCompany,
  activeHR,
  onRefresh,
  onCalculatePayroll,
  onClosePayroll
}: PayrollInputManagementViewProps) {
  const [subTab, setSubTab] = useState<'INPUTS' | 'EXCEL_IMPORT' | 'PREVIEW_FREEZE' | 'MASTERS' | 'SUMMARY'>('INPUTS');
  const [selectedUnit, setSelectedUnit] = useState<string>(activeCompany || 'ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [savingInputs, setSavingInputs] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Master Heads
  const [earningHeads, setEarningHeads] = useState<PayrollEarningHead[]>([]);
  const [deductionHeads, setDeductionHeads] = useState<PayrollDeductionHead[]>([]);
  const [showAddHeadModal, setShowAddHeadModal] = useState<'EARNING' | 'DEDUCTION' | null>(null);
  const [newHeadName, setNewHeadName] = useState('');
  const [newHeadCode, setNewHeadCode] = useState('');
  const [newHeadCategory, setNewHeadCategory] = useState<string>('VARIABLE');

  // Excel Upload State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelParsedData, setExcelParsedData] = useState<any[]>([]);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [excelValidCount, setExcelValidCount] = useState(0);

  // Single Employee Drawer/Modal State
  const [editingSlip, setEditingSlip] = useState<Payslip | null>(null);
  const [formInputs, setFormInputs] = useState<Record<string, any>>({});

  // Local Editable Inputs Grid Map (Key: slipId)
  const [gridData, setGridData] = useState<Record<string, Record<string, any>>>({});

  // Freeze / Unlock Modal
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');

  // Fetch Master Heads
  useEffect(() => {
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    try {
      const res = await fetch('/api/payroll-masters');
      if (res.ok) {
        const data = await res.json();
        setEarningHeads(data.earningHeads || []);
        setDeductionHeads(data.deductionHeads || []);
      }
    } catch (e) {
      console.error('Failed to load payroll masters', e);
    }
  };

  // Sync gridData when slips change
  useEffect(() => {
    const monthSlips = slips.filter(s => s.month === activeMonth);
    const initialGrid: Record<string, Record<string, any>> = {};
    monthSlips.forEach(s => {
      initialGrid[s.id] = {
        tds: s.tds || 0,
        custom_deductions: s.custom_deductions || 0,
        canteen_deduction: s.canteen_deduction || 0,
        uniform_deduction: s.uniform_deduction || 0,
        notice_deduction: s.notice_deduction || 0,
        mobile_deduction: s.mobile_deduction || 0,
        damage_deduction: s.damage_deduction || 0,
        salary_advance: s.salary_advance || 0,
        bonus_incentive: s.bonus_incentive || 0,
        performance_incentive: s.performance_incentive || 0,
        attendance_incentive: s.attendance_incentive || 0,
        production_incentive: s.production_incentive || 0,
        reimbursement: s.reimbursement || 0,
        special_allowance_addition: s.special_allowance_addition || 0,
        arrear_payment: s.arrear_payment || 0,
        other_earnings: s.other_earnings || 0,
        remarks: s.remarks || ''
      };
    });
    setGridData(initialGrid);
  }, [slips, activeMonth]);

  // List of Units & Departments
  const unitsList = useMemo(() => {
    const set = new Set(employees.map(e => e.company));
    return Array.from(set).sort();
  }, [employees]);

  const departmentsList = useMemo(() => {
    const set = new Set(employees.map(e => e.department));
    return Array.from(set).sort();
  }, [employees]);

  // Active Month Slips filtered
  const filteredSlips = useMemo(() => {
    let list = slips.filter(s => s.month === activeMonth);

    if (selectedUnit !== 'ALL') {
      list = list.filter(s => {
        const emp = employees.find(e => e.id === s.employee_id);
        return emp?.company === selectedUnit;
      });
    }

    if (selectedDept !== 'ALL') {
      list = list.filter(s => s.department === selectedDept);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => {
        const emp = employees.find(e => e.id === s.employee_id);
        const code = emp?.emp_code || '';
        return (
          s.employee_name.toLowerCase().includes(q) ||
          code.toLowerCase().includes(q) ||
          s.employee_id.toLowerCase().includes(q)
        );
      });
    }

    return list;
  }, [slips, activeMonth, selectedUnit, selectedDept, searchQuery, employees]);

  // Is Payroll Locked for selected unit & month?
  const isPayrollLocked = useMemo(() => {
    // If any slip in selected unit is locked
    const unitSlips = filteredSlips;
    if (unitSlips.length === 0) return false;
    return unitSlips.some(s => s.payment_status === 'PAID' || s.payment_status === 'CLOSED');
  }, [filteredSlips]);

  // Dashboard Aggregates
  const aggregates = useMemo(() => {
    const monthSlips = slips.filter(s => s.month === activeMonth && (selectedUnit === 'ALL' || employees.find(e => e.id === s.employee_id)?.company === selectedUnit));
    
    const activeEmps = employees.filter(e => e.status === 'ACTIVE' && (selectedUnit === 'ALL' || e.company === selectedUnit));
    const totalEmps = activeEmps.length;
    const processedEmps = monthSlips.length;
    const pendingEmps = Math.max(0, totalEmps - processedEmps);
    const paidEmps = monthSlips.filter(s => s.payment_status === 'PAID').length;
    const unpaidEmps = processedEmps - paidEmps;

    const totalGross = monthSlips.reduce((sum, s) => sum + (s.gross_salary || 0), 0);
    const totalPfEE = monthSlips.reduce((sum, s) => sum + (s.pf_deduction || 0), 0);
    const totalPfER = monthSlips.reduce((sum, s) => sum + (s.employer_pf || 0), 0);
    const totalEsicEE = monthSlips.reduce((sum, s) => sum + (s.esic_deduction || 0), 0);
    const totalEsicER = monthSlips.reduce((sum, s) => sum + (s.employer_esic || 0), 0);
    const totalPt = monthSlips.reduce((sum, s) => sum + (s.professional_tax || 0), 0);
    
    const totalLoan = monthSlips.reduce((sum, s) => sum + (s.loan_deduction || 0), 0);
    const totalAdvance = monthSlips.reduce((sum, s) => sum + (s.salary_advance || 0), 0);
    const totalTds = monthSlips.reduce((sum, s) => sum + (s.tds || 0), 0);
    
    const totalCanteen = monthSlips.reduce((sum, s) => sum + (s.canteen_deduction || 0), 0);
    const totalUniform = monthSlips.reduce((sum, s) => sum + (s.uniform_deduction || 0), 0);
    const totalNotice = monthSlips.reduce((sum, s) => sum + (s.notice_deduction || 0), 0);
    const totalMobile = monthSlips.reduce((sum, s) => sum + (s.mobile_deduction || 0), 0);
    const totalDamage = monthSlips.reduce((sum, s) => sum + (s.damage_deduction || 0), 0);
    const totalCustom = monthSlips.reduce((sum, s) => sum + (s.custom_deductions || 0), 0);

    const totalOtherDeductions = totalCanteen + totalUniform + totalNotice + totalMobile + totalDamage + totalCustom;
    const grandTotalDeductions = monthSlips.reduce((sum, s) => sum + (s.total_deductions || 0), 0);
    const totalNetPayable = monthSlips.reduce((sum, s) => sum + (s.net_salary || 0), 0);

    return {
      totalEmps,
      processedEmps,
      pendingEmps,
      paidEmps,
      unpaidEmps,
      totalGross,
      totalPfEE,
      totalPfER,
      totalEsicEE,
      totalEsicER,
      totalPt,
      totalLoan,
      totalAdvance,
      totalTds,
      totalCanteen,
      totalUniform,
      totalNotice,
      totalMobile,
      totalDamage,
      totalCustom,
      totalOtherDeductions,
      grandTotalDeductions,
      totalNetPayable
    };
  }, [slips, activeMonth, selectedUnit, employees]);

  // Handle local cell input change in bulk grid
  const handleCellChange = (slipId: string, field: string, val: string | number) => {
    setGridData(prev => ({
      ...prev,
      [slipId]: {
        ...(prev[slipId] || {}),
        [field]: field === 'remarks' ? val : Number(val) || 0
      }
    }));
  };

  // Save Bulk Variable Inputs
  const handleSaveBulkInputs = async () => {
    try {
      setSavingInputs(true);
      setStatusMsg(null);

      const records = Object.entries(gridData).map(([id, data]: [string, Record<string, any>]) => ({
        id,
        ...data
      }));

      const res = await fetch('/api/payslips/bulk-update-inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: activeMonth,
          company: selectedUnit,
          records
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMsg({ type: 'success', text: `Successfully updated monthly payroll inputs for ${json.count} employees!` });
        if (onRefresh) onRefresh();
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Failed to update payroll inputs' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setSavingInputs(false);
    }
  };

  // Copy Previous Month Inputs
  const handleCopyPreviousMonth = async () => {
    if (!window.confirm(`Copy variable inputs (TDS, Other Deductions, Allowances) from previous month to ${activeMonth}?`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/payslips/copy-previous-inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: activeMonth,
          company: selectedUnit
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMsg({ type: 'success', text: `Copied inputs from previous month for ${json.copiedCount} employees!` });
        if (onRefresh) onRefresh();
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Failed to copy previous inputs' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Download Sample Excel Template
  const handleDownloadExcelTemplate = () => {
    const sampleRows = employees.slice(0, 10).map(e => ({
      'Employee Code': e.emp_code || e.id,
      'Employee Name': e.name,
      'TDS (₹)': 0,
      'Other Deduction (₹)': 0,
      'Bonus Incentive (₹)': 0,
      'Performance Incentive (₹)': 0,
      'Reimbursement (₹)': 0,
      'Special Allowance Addition (₹)': 0,
      'Remarks': 'Monthly Input'
    }));

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll_Inputs');
    XLSX.writeFile(wb, `Payroll_Input_Template_${activeMonth}.xlsx`);
  };

  // Handle Excel Upload Selection
  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        const errors: string[] = [];
        let valid = 0;

        const parsedRecords = rows.map((r, idx) => {
          const empCode = String(r['Employee Code'] || r['emp_code'] || r['EmpCode'] || '').trim();
          const emp = employees.find(e => e.emp_code === empCode || e.id === empCode);

          if (!empCode || !emp) {
            errors.push(`Row ${idx + 2}: Invalid or unknown Employee Code "${empCode || 'EMPTY'}"`);
          } else {
            valid++;
          }

          return {
            emp_code: empCode,
            employee_name: r['Employee Name'] || emp?.name || '',
            tds: Number(r['TDS (₹)'] || r['TDS'] || 0),
            custom_deductions: Number(r['Other Deduction (₹)'] || r['Other Deduction'] || 0),
            bonus_incentive: Number(r['Bonus Incentive (₹)'] || r['Bonus'] || 0),
            performance_incentive: Number(r['Performance Incentive (₹)'] || r['Incentive'] || 0),
            reimbursement: Number(r['Reimbursement (₹)'] || r['Reimbursement'] || 0),
            special_allowance_addition: Number(r['Special Allowance Addition (₹)'] || r['Special Allowance'] || 0),
            remarks: String(r['Remarks'] || '')
          };
        });

        setExcelParsedData(parsedRecords);
        setExcelErrors(errors);
        setExcelValidCount(valid);
      } catch (err: any) {
        setExcelErrors([`Failed to parse Excel file: ${err.message}`]);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Apply Parsed Excel Data to Payroll
  const handleApplyExcelData = async () => {
    if (excelParsedData.length === 0) return;

    try {
      setLoading(true);
      const res = await fetch('/api/payslips/bulk-update-inputs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: activeMonth,
          company: selectedUnit,
          records: excelParsedData
        })
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMsg({ type: 'success', text: `Uploaded and applied monthly payroll inputs for ${json.count} employees from Excel!` });
        setExcelFile(null);
        setExcelParsedData([]);
        setExcelErrors([]);
        if (onRefresh) onRefresh();
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Failed to apply Excel inputs' });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Save Master Earning/Deduction Head
  const handleSaveMasterHead = async () => {
    if (!newHeadName.trim() || !newHeadCode.trim()) return;

    if (showAddHeadModal === 'EARNING') {
      const updated = [
        ...earningHeads,
        {
          id: `E-${Date.now()}`,
          code: newHeadCode.toUpperCase().replace(/\s+/g, '_'),
          name: newHeadName.trim(),
          category: newHeadCategory as any,
          status: 'ACTIVE' as const
        }
      ];
      setEarningHeads(updated);
      await fetch('/api/payroll-masters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ earningHeads: updated })
      });
    } else if (showAddHeadModal === 'DEDUCTION') {
      const updated = [
        ...deductionHeads,
        {
          id: `D-${Date.now()}`,
          code: newHeadCode.toUpperCase().replace(/\s+/g, '_'),
          name: newHeadName.trim(),
          category: newHeadCategory as any,
          status: 'ACTIVE' as const
        }
      ];
      setDeductionHeads(updated);
      await fetch('/api/payroll-masters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deductionHeads: updated })
      });
    }

    setShowAddHeadModal(null);
    setNewHeadName('');
    setNewHeadCode('');
  };

  // Save Single Employee Drawer Inputs
  const handleSaveSingleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlip) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/payslips/${editingSlip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formInputs)
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setStatusMsg({ type: 'success', text: `Updated inputs for ${editingSlip.employee_name}` });
        setEditingSlip(null);
        if (onRefresh) onRefresh();
      } else {
        setStatusMsg({ type: 'error', text: json.error || 'Failed to update payslip' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header & Month Selector */}
      <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold rounded-full border border-emerald-500/30">
              MODULE 13
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Month: <strong className="text-white">{activeMonth}</strong>
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight mt-1 flex items-center gap-2">
            Payroll Input & Monthly Deduction Management
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized HR Monthly Variable Input Sheet • Auto Statutory Calculation • Bulk Excel Import • Salary Freeze System
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Unit Filter dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <Building size={14} className="text-emerald-400" />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">ALL UNITS / GROUP</option>
              {unitsList.map(u => (
                <option key={u} value={u} className="bg-slate-900 text-white">{u}</option>
              ))}
            </select>
          </div>

          {/* Recalculate Base Attendance & Draft Wages */}
          {onCalculatePayroll && (
            <button
              onClick={() => onCalculatePayroll(activeMonth, selectedUnit)}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={14} />
              Re-Calculate Base Draft
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Status Banner */}
      {statusMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : statusMsg.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' && <CheckCircle2 size={16} className="text-emerald-600" />}
            {statusMsg.type === 'error' && <AlertTriangle size={16} className="text-rose-600" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-500 hover:text-slate-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Dashboard Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Headcount</span>
          <div className="text-lg font-black text-slate-900 mt-1 flex items-baseline gap-1">
            {aggregates.totalEmps}
            <span className="text-[10px] font-normal text-slate-500">Employees</span>
          </div>
          <div className="text-[10px] font-semibold text-emerald-700 mt-1">
            {aggregates.processedEmps} Processed / {aggregates.pendingEmps} Pending
          </div>
          <div className="text-[10px] font-semibold mt-1">
            <span className="text-green-600">✅ Paid: {aggregates.paidEmps}</span>
            <span className="text-orange-600 ml-2">⏳ Pending: {aggregates.unpaidEmps}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Gross Salary (₹)</span>
          <div className="text-lg font-black text-slate-900 mt-1">
            ₹{aggregates.totalGross.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] font-semibold text-slate-500 mt-1 block">Includes Base + Allowances</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Statutory (PF & ESIC)</span>
          <div className="text-lg font-black text-indigo-950 mt-1">
            ₹{(aggregates.totalPfEE + aggregates.totalEsicEE).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] font-semibold text-indigo-700 mt-1">
            PF: ₹{aggregates.totalPfEE.toLocaleString('en-IN')} | ESIC: ₹{aggregates.totalEsicEE.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Loan & Advance Recovery</span>
          <div className="text-lg font-black text-amber-950 mt-1">
            ₹{(aggregates.totalLoan + aggregates.totalAdvance).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] font-semibold text-amber-800 mt-1">
            Loan: ₹{aggregates.totalLoan.toLocaleString('en-IN')} | Adv: ₹{aggregates.totalAdvance.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">TDS & Other Recoveries</span>
          <div className="text-lg font-black text-slate-800 mt-1">
            ₹{(aggregates.totalTds + aggregates.totalOtherDeductions).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 mt-1">
            TDS: ₹{aggregates.totalTds.toLocaleString('en-IN')} | Other: ₹{aggregates.totalOtherDeductions.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-emerald-900 text-white p-4 rounded-2xl border border-emerald-800 shadow-sm">
          <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">Net Salary Payable</span>
          <div className="text-lg font-black text-emerald-100 mt-1">
            ₹{aggregates.totalNetPayable.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] font-semibold text-emerald-200 mt-1 block">Final Disbursal Total</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center border-b border-slate-200 gap-2">
        <button
          onClick={() => setSubTab('INPUTS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
            subTab === 'INPUTS'
              ? 'bg-white border-x border-t border-slate-300 text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText size={15} />
          Monthly Variable Inputs Sheet
        </button>

        <button
          onClick={() => setSubTab('EXCEL_IMPORT')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
            subTab === 'EXCEL_IMPORT'
              ? 'bg-white border-x border-t border-slate-300 text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet size={15} />
          Excel Bulk Import & Export
        </button>

        <button
          onClick={() => setSubTab('PREVIEW_FREEZE')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
            subTab === 'PREVIEW_FREEZE'
              ? 'bg-white border-x border-t border-slate-300 text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck size={15} />
          Salary Preview & Payroll Freeze
        </button>

        <button
          onClick={() => setSubTab('MASTERS')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
            subTab === 'MASTERS'
              ? 'bg-white border-x border-t border-slate-300 text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Coins size={15} />
          Earning & Deduction Masters
        </button>

        <button
          onClick={() => setSubTab('SUMMARY')}
          className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition flex items-center gap-2 cursor-pointer ${
            subTab === 'SUMMARY'
              ? 'bg-white border-x border-t border-slate-300 text-indigo-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <PieChart size={15} />
          Deduction Summary & Audit
        </button>
      </div>

      {/* ========================================================= */}
      {/* SUB TAB 1: MONTHLY VARIABLE INPUTS SHEET */}
      {/* ========================================================= */}
      {subTab === 'INPUTS' && (
        <div className="space-y-4">
          {/* Action Bar & Filters */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Department Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-medium">
                <Filter size={14} className="text-slate-500" />
                <span className="text-slate-500">Dept:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">ALL DEPARTMENTS</option>
                  {departmentsList.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Employee / Code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:border-indigo-600 w-52"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyPreviousMonth}
                disabled={loading || isPayrollLocked}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Copy size={14} />
                Copy Previous Month Inputs
              </button>

              <button
                onClick={handleSaveBulkInputs}
                disabled={savingInputs || isPayrollLocked}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save size={14} />
                {savingInputs ? 'Saving...' : 'Save All Inputs'}
              </button>
            </div>
          </div>

          {/* Payroll Rules Legend Banner */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center gap-3 text-xs text-indigo-950">
            <Sparkles size={16} className="text-indigo-600 shrink-0" />
            <div>
              <strong>Auto Calculated (Read-only):</strong> Attendance, Base, HRA, Statutory PF, ESIC, PT, Loan EMI. <br />
              <strong>HR Monthly Variable Inputs:</strong> TDS, Other Recovery, Canteen, Uniform, Notice, Damage, Bonus, Incentives, Reimbursements.
            </div>
          </div>

          {/* Bulk Variable Input Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider">
                  <th className="p-3 sticky left-0 bg-slate-100 min-w-[160px] shadow-2xs">Employee Name</th>
                  <th className="p-3 text-center min-w-[80px] bg-slate-50">Present / LOP</th>
                  <th className="p-3 text-right min-w-[90px] bg-indigo-50/60 text-indigo-950">Auto Base ₹</th>
                  <th className="p-3 text-right min-w-[90px] bg-amber-50/60 text-amber-950">PF / ESIC / PT ₹</th>
                  <th className="p-3 text-right min-w-[90px] bg-amber-50/60 text-amber-950">Loan EMI ₹</th>
                  
                  {/* Editable Deductions */}
                  <th className="p-3 text-center bg-rose-50 border-l border-rose-200 text-rose-900 min-w-[90px]">TDS (₹)</th>
                  <th className="p-3 text-center bg-rose-50 text-rose-900 min-w-[90px]">Other Ded. (₹)</th>
                  <th className="p-3 text-center bg-rose-50 text-rose-900 min-w-[80px]">Canteen (₹)</th>
                  <th className="p-3 text-center bg-rose-50 text-rose-900 min-w-[80px]">Uniform (₹)</th>
                  <th className="p-3 text-center bg-rose-50 text-rose-900 min-w-[80px]">Advance (₹)</th>
                  
                  {/* Editable Additions */}
                  <th className="p-3 text-center bg-emerald-50 border-l border-emerald-200 text-emerald-900 min-w-[90px]">Bonus (₹)</th>
                  <th className="p-3 text-center bg-emerald-50 text-emerald-900 min-w-[90px]">Incentive (₹)</th>
                  <th className="p-3 text-center bg-emerald-50 text-emerald-900 min-w-[90px]">Reimb. (₹)</th>
                  <th className="p-3 text-center bg-emerald-50 text-emerald-900 min-w-[90px]">Spec. Add (₹)</th>
                  
                  <th className="p-3 text-right min-w-[100px] bg-slate-100 font-black text-slate-900">Gross ₹</th>
                  <th className="p-3 text-right min-w-[100px] bg-emerald-100 text-emerald-950 font-black">Net Salary ₹</th>
                  <th className="p-3 text-center min-w-[60px]">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSlips.map((slip) => {
                  const emp = employees.find(e => e.id === slip.employee_id);
                  const rowInputs = gridData[slip.id] || {};

                  // Calculated total deductions preview
                  const tdsVal = Number(rowInputs.tds ?? slip.tds ?? 0);
                  const otherVal = Number(rowInputs.custom_deductions ?? slip.custom_deductions ?? 0);
                  const canteenVal = Number(rowInputs.canteen_deduction ?? slip.canteen_deduction ?? 0);
                  const uniformVal = Number(rowInputs.uniform_deduction ?? slip.uniform_deduction ?? 0);
                  const advVal = Number(rowInputs.salary_advance ?? slip.salary_advance ?? 0);

                  const bonusVal = Number(rowInputs.bonus_incentive ?? slip.bonus_incentive ?? 0);
                  const perfVal = Number(rowInputs.performance_incentive ?? slip.performance_incentive ?? 0);
                  const reimbVal = Number(rowInputs.reimbursement ?? slip.reimbursement ?? 0);
                  const specVal = Number(rowInputs.special_allowance_addition ?? slip.special_allowance_addition ?? 0);

                  const baseGross = (slip.earned_base_salary || 0) + (slip.earned_hra || 0) + (slip.earned_special_allowance || 0) + (slip.overtime_pay || 0);
                  const totalGrossPreview = baseGross + bonusVal + perfVal + reimbVal + specVal;

                  const statDeductions = (slip.pf_deduction || 0) + (slip.esic_deduction || 0) + (slip.professional_tax || 0) + (slip.loan_deduction || 0);
                  const totalDedPreview = statDeductions + tdsVal + otherVal + canteenVal + uniformVal + advVal;
                  const netSalaryPreview = Math.max(0, totalGrossPreview - totalDedPreview);

                  return (
                    <tr key={slip.id} className="hover:bg-slate-50 transition font-mono">
                      {/* Name & Code */}
                      <td className="p-3 sticky left-0 bg-white font-sans font-bold text-slate-900 border-r border-slate-100 shadow-2xs">
                        <div>{slip.employee_name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{emp?.emp_code || slip.employee_id} • {slip.department}</div>
                      </td>

                      {/* Present / LOP */}
                      <td className="p-3 text-center text-slate-600 font-sans">
                        <span className="font-bold text-emerald-800">{30 - (slip.lop_deduction > 0 ? 2 : 0)}d</span> / <span className="text-rose-600 font-bold">{slip.lop_deduction > 0 ? '2d LOP' : '0d'}</span>
                      </td>

                      {/* Auto Base */}
                      <td className="p-3 text-right text-indigo-950 font-bold bg-indigo-50/30">
                        ₹{slip.earned_base_salary?.toLocaleString('en-IN')}
                      </td>

                      {/* Statutory PF/ESIC/PT */}
                      <td className="p-3 text-right text-amber-900 bg-amber-50/30 font-semibold">
                        ₹{(slip.pf_deduction + slip.esic_deduction + slip.professional_tax)?.toLocaleString('en-IN')}
                      </td>

                      {/* Loan EMI */}
                      <td className="p-3 text-right text-amber-900 bg-amber-50/30 font-bold">
                        ₹{slip.loan_deduction?.toLocaleString('en-IN')}
                      </td>

                      {/* Editable Inputs: TDS */}
                      <td className="p-1 text-center bg-rose-50/30 border-l border-rose-100">
                        <input
                          type="number"
                          value={rowInputs.tds ?? 0}
                          onChange={(e) => handleCellChange(slip.id, 'tds', e.target.value)}
                          disabled={isPayrollLocked}
                          className="w-full text-center p-1 bg-white border border-slate-300 rounded text-rose-950 font-bold focus:outline-none focus:border-rose-600"
                        />
                      </td>

                      {/* Editable Inputs: Other Deduction */}
                      <td className="p-1 text-center bg-rose-50/30">
                        <input
                          type="number"
                          value={rowInputs.custom_deductions ?? 0}
                          onChange={(e) => handleCellChange(slip.id, 'custom_deductions', e.target.value)}
                          disabled={isPayrollLocked}
                          className="w-full text-center p-1 bg-white border border-slate-300 rounded text-rose-950 font-bold focus:outline-none focus:border-rose-600"
                        />
                      </td>

                      {/* Editable Inputs: Canteen */}
                      <td className="p-1 text-center bg-rose-50/30">
                        <input
                          type="number"
                          value={rowInputs.canteen_deduction ?? 0}
                          onChange={(e) => handleCellChange(slip.id, 'canteen_deduction', e.target.value)}
                          disabled={isPayrollLocked}
                          className="w-full text-center p-1 bg-white border border-slate-300 rounded text-rose-950 focus:outline-none focus:border-rose-600"
                        />
                      </td>

                      {/* Editable Inputs: Uniform */}
                      <td className="p-1 text-center bg-rose-50/30">
                        <input
                          type="number"
                          value={rowInputs.uniform_deduction ?? 0}
                          onChange={(e) => handleCellChange(slip.id, 'uniform_deduction', e.target.value)}
                          disabled={isPayrollLocked}
                          className="w-full text-center p-1 bg-white border border-slate-300 rounded text-rose-950 focus:outline-none focus:border-rose-600"
                        />
                      </td>

                      {/* Editable Inputs: Salary Advance */}
                      <td className="p-1 text-center bg-rose-50/30">
                        <input
                          type="number"
                          value={rowInputs.salary_advance ?? 0}
                          onChange={(e) => handleCellChange(slip.id, 'salary_advance', e.target.value)}
                          disabled={isPayrollLocked}
                          className="w-full text-center p-1 bg-white border border-slate-300 rounded text-amber-950 font-bold focus:outline-none focus:border-rose-600"
                        />
                      </td>

                      {/* Editable Inputs: Bonus */}
                      <td className="p-1 text-center bg-emerald-50/30 border-l border-emerald-100">
                        <input
                          type="number"
                          value={rowInputs.bonus_incentive ?? 0}
                          onChange={(e) => handleCellChange(slip.id, 'bonus_incentive', e.target.value)}
                          disabled={isPayrollLocked}
                          className="w-full text-center p-1 bg-white border border-slate-300 rounded text-emerald-950 font-bold focus:outline-none focus:border-emerald-600"
                        />
                      </td>

                      {/* Editable Inputs: Incentive */}
                      <td className="p-1 text-center bg-emerald-50/30">
                        <input
                          type="number"
                          value={rowInputs.performance_incentive ?? 0}
                          onChange={(e) => handleCellChange(slip.id, 'performance_incentive', e.target.value)}
                          disabled={isPayrollLocked}
                          className="w-full text-center p-1 bg-white border border-slate-300 rounded text-emerald-950 font-bold focus:outline-none focus:border-emerald-600"
                        />
                      </td>

                      {/* Editable Inputs: Reimbursement */}
                      <td className="p-1 text-center bg-emerald-50/30">
                        <input
                          type="number"
                          value={rowInputs.reimbursement ?? 0}
                          onChange={(e) => handleCellChange(slip.id, 'reimbursement', e.target.value)}
                          disabled={isPayrollLocked}
                          className="w-full text-center p-1 bg-white border border-slate-300 rounded text-emerald-950 focus:outline-none focus:border-emerald-600"
                        />
                      </td>

                      {/* Editable Inputs: Special Allowance Addition */}
                      <td className="p-1 text-center bg-emerald-50/30">
                        <input
                          type="number"
                          value={rowInputs.special_allowance_addition ?? 0}
                          onChange={(e) => handleCellChange(slip.id, 'special_allowance_addition', e.target.value)}
                          disabled={isPayrollLocked}
                          className="w-full text-center p-1 bg-white border border-slate-300 rounded text-emerald-950 focus:outline-none focus:border-emerald-600"
                        />
                      </td>

                      {/* Live Computed Gross */}
                      <td className="p-3 text-right font-black text-slate-900 bg-slate-50">
                        ₹{totalGrossPreview.toLocaleString('en-IN')}
                      </td>

                      {/* Live Computed Net Salary */}
                      <td className="p-3 text-right font-black text-emerald-900 bg-emerald-50/60">
                        ₹{netSalaryPreview.toLocaleString('en-IN')}
                      </td>

                      {/* Action Detail Drawer */}
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setEditingSlip(slip);
                            setFormInputs({
                              pf: slip.pf_deduction,
                              esic: slip.esic_deduction,
                              pt: slip.professional_tax,
                              tds: rowInputs.tds ?? slip.tds ?? 0,
                              loan: slip.loan_deduction,
                              advance: rowInputs.salary_advance ?? slip.salary_advance ?? 0,
                              custom: rowInputs.custom_deductions ?? slip.custom_deductions ?? 0,
                              canteen_deduction: rowInputs.canteen_deduction ?? slip.canteen_deduction ?? 0,
                              uniform_deduction: rowInputs.uniform_deduction ?? slip.uniform_deduction ?? 0,
                              notice_deduction: rowInputs.notice_deduction ?? slip.notice_deduction ?? 0,
                              mobile_deduction: rowInputs.mobile_deduction ?? slip.mobile_deduction ?? 0,
                              damage_deduction: rowInputs.damage_deduction ?? slip.damage_deduction ?? 0,
                              bonus_incentive: rowInputs.bonus_incentive ?? slip.bonus_incentive ?? 0,
                              performance_incentive: rowInputs.performance_incentive ?? slip.performance_incentive ?? 0,
                              reimbursement: rowInputs.reimbursement ?? slip.reimbursement ?? 0,
                              special_allowance_addition: rowInputs.special_allowance_addition ?? slip.special_allowance_addition ?? 0,
                              remarks: rowInputs.remarks ?? slip.remarks ?? ''
                            });
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB TAB 2: EXCEL BULK IMPORT / EXPORT */}
      {/* ========================================================= */}
      {subTab === 'EXCEL_IMPORT' && (
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" />
              Excel Bulk Payroll Input Upload Facility
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload variable payroll input Excel files for bulk processing. The system will automatically match and validate Employee Codes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Download Template Step */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono text-[10px]">1</span>
                Download Standard Payroll Input Template
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download pre-populated template with active employees and columns for TDS, Other Deductions, Bonus, Incentives, and Remarks.
              </p>
              <button
                onClick={handleDownloadExcelTemplate}
                className="w-full py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 rounded-xl font-bold text-xs shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} className="text-indigo-600" />
                Download Excel Template (.xlsx)
              </button>
            </div>

            {/* Upload File Step */}
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center gap-2 font-bold text-indigo-950 text-xs">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-mono text-[10px]">2</span>
                Upload Input File & Validate
              </div>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleExcelFileSelect}
                className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />

              {excelFile && (
                <div className="text-xs font-mono font-bold text-indigo-900 bg-white p-2 rounded-lg border border-indigo-200">
                  📄 Selected: {excelFile.name} ({excelParsedData.length} Rows Parsed)
                </div>
              )}
            </div>
          </div>

          {/* Validation Results & Errors Log */}
          {excelParsedData.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full border border-emerald-300">
                    ✅ Valid Employee Rows: {excelValidCount}
                  </span>
                  {excelErrors.length > 0 && (
                    <span className="px-3 py-1 bg-rose-100 text-rose-900 font-bold text-xs rounded-full border border-rose-300">
                      ⚠️ Upload Errors: {excelErrors.length}
                    </span>
                  )}
                </div>

                <button
                  onClick={handleApplyExcelData}
                  disabled={loading || excelValidCount === 0 || isPayrollLocked}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Upload size={14} />
                  {loading ? 'Applying...' : `Apply Valid Excel Data (${excelValidCount} Rows)`}
                </button>
              </div>

              {/* Errors Display */}
              {excelErrors.length > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                  <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="text-rose-600" />
                    Validation Errors Found (Displaying for verification):
                  </div>
                  <ul className="text-[11px] text-rose-800 font-mono space-y-0.5 max-h-32 overflow-y-auto">
                    {excelErrors.map((err, idx) => (
                      <li key={idx}>• {err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Emp Code</th>
                      <th className="p-2.5">Emp Name</th>
                      <th className="p-2.5 text-right">TDS (₹)</th>
                      <th className="p-2.5 text-right">Other Ded (₹)</th>
                      <th className="p-2.5 text-right">Bonus (₹)</th>
                      <th className="p-2.5 text-right">Incentive (₹)</th>
                      <th className="p-2.5 text-right">Reimb (₹)</th>
                      <th className="p-2.5 text-right">Spec Add (₹)</th>
                      <th className="p-2.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {excelParsedData.slice(0, 20).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{r.emp_code}</td>
                        <td className="p-2.5 font-sans">{r.employee_name}</td>
                        <td className="p-2.5 text-right text-rose-800">₹{r.tds}</td>
                        <td className="p-2.5 text-right text-rose-800">₹{r.custom_deductions}</td>
                        <td className="p-2.5 text-right text-emerald-800">₹{r.bonus_incentive}</td>
                        <td className="p-2.5 text-right text-emerald-800">₹{r.performance_incentive}</td>
                        <td className="p-2.5 text-right text-emerald-800">₹{r.reimbursement}</td>
                        <td className="p-2.5 text-right text-emerald-800">₹{r.special_allowance_addition}</td>
                        <td className="p-2.5 font-sans text-slate-500">{r.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB TAB 3: SALARY PREVIEW & PAYROLL FREEZE */}
      {/* ========================================================= */}
      {subTab === 'PREVIEW_FREEZE' && (
        <div className="space-y-6">
          {/* Status & Freeze Control Card */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payroll Status:</span>
                {isPayrollLocked ? (
                  <span className="px-3 py-1 bg-rose-600 text-white font-extrabold text-xs rounded-full flex items-center gap-1.5 shadow-2xs">
                    <Lock size={12} />
                    FROZEN & LOCKED
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-full flex items-center gap-1.5 shadow-2xs">
                    <CheckCircle2 size={12} />
                    DRAFT (UNLOCKED & EDITABLE)
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 mt-2">Pre-Freeze Salary Verification & Locking</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review complete salary calculations before freezing. Once frozen, no edits can be made without Super Admin PIN unlock.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {!isPayrollLocked ? (
                <button
                  onClick={async () => {
                    if (window.confirm(`Freeze payroll for ${activeMonth} (${selectedUnit})? No edits will be permitted after freezing.`)) {
                      if (onClosePayroll) {
                        await onClosePayroll(activeMonth, selectedUnit);
                      }
                    }
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Lock size={14} />
                  Freeze Payroll Month
                </button>
              ) : (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Unlock size={14} />
                  Super Admin Unlock
                </button>
              )}
            </div>
          </div>

          {/* Complete Pre-Freeze Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold uppercase tracking-wider">
                  <th className="p-3">Emp Code</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3 text-right">Gross Salary ₹</th>
                  <th className="p-3 text-right text-emerald-300">Total Earnings ₹</th>
                  <th className="p-3 text-right text-amber-300">PF / ESIC / PT ₹</th>
                  <th className="p-3 text-right text-amber-300">Loan Recovery ₹</th>
                  <th className="p-3 text-right text-amber-300">Advance ₹</th>
                  <th className="p-3 text-right text-rose-300">TDS ₹</th>
                  <th className="p-3 text-right text-rose-300">Other Ded ₹</th>
                  <th className="p-3 text-right text-rose-300 font-black">Total Ded ₹</th>
                  <th className="p-3 text-right text-emerald-400 font-black">Net Salary ₹</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredSlips.map(s => {
                  const emp = employees.find(e => e.id === s.employee_id);
                  const stat = (s.pf_deduction || 0) + (s.esic_deduction || 0) + (s.professional_tax || 0);
                  const otherDeds = (s.canteen_deduction || 0) + (s.uniform_deduction || 0) + (s.notice_deduction || 0) + (s.mobile_deduction || 0) + (s.damage_deduction || 0) + (s.custom_deductions || 0);

                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{emp?.emp_code || s.employee_id}</td>
                      <td className="p-3 font-sans font-bold text-slate-800">{s.employee_name}</td>
                      <td className="p-3 font-sans text-slate-500">{s.department}</td>
                      <td className="p-3 text-right font-bold text-slate-900">₹{s.gross_salary?.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-emerald-800 font-semibold">₹{s.gross_salary?.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-amber-900">₹{stat?.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-amber-900 font-bold">₹{s.loan_deduction?.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-amber-900">₹{s.salary_advance?.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-rose-800 font-bold">₹{s.tds?.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-rose-800">₹{otherDeds?.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-extrabold text-rose-900 bg-rose-50/40">₹{s.total_deductions?.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-black text-emerald-900 bg-emerald-50/60">₹{s.net_salary?.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB TAB 4: EARNING & DEDUCTION MASTERS */}
      {/* ========================================================= */}
      {subTab === 'MASTERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earning Master */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Coins className="text-emerald-600" size={16} />
                  Master Earning Heads (आय मद्द)
                </h3>
                <p className="text-[11px] text-slate-500">Configure unlimited earning components</p>
              </div>
              <button
                onClick={() => {
                  setShowAddHeadModal('EARNING');
                  setNewHeadCategory('VARIABLE');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Head
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {earningHeads.map(e => (
                <div key={e.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{e.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{e.code} • {e.category}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                    {e.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Deduction Master */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Coins className="text-rose-600" size={16} />
                  Master Deduction Heads (कटौती मद्द)
                </h3>
                <p className="text-[11px] text-slate-500">Configure unlimited deduction heads</p>
              </div>
              <button
                onClick={() => {
                  setShowAddHeadModal('DEDUCTION');
                  setNewHeadCategory('RECOVERY');
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
              >
                <Plus size={14} /> Add Head
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {deductionHeads.map(d => (
                <div key={d.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{d.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{d.code} • {d.category}</div>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full">
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB TAB 5: MONTH-END DEDUCTION SUMMARY */}
      {/* ========================================================= */}
      {subTab === 'SUMMARY' && (
        <div className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <PieChart className="text-indigo-600" />
                Month-End Total Deduction Breakdown Summary
              </h3>
              <p className="text-xs text-slate-500">Comprehensive itemized list of all employee deductions for {activeMonth}</p>
            </div>

            <button
              onClick={() => {
                const rows = [
                  { Category: 'Provident Fund (Employee PF 12%)', Amount: aggregates.totalPfEE },
                  { Category: 'Provident Fund (Employer PF 12%)', Amount: aggregates.totalPfER },
                  { Category: 'ESIC (Employee 0.75%)', Amount: aggregates.totalEsicEE },
                  { Category: 'ESIC (Employer 3.25%)', Amount: aggregates.totalEsicER },
                  { Category: 'Professional Tax (PT)', Amount: aggregates.totalPt },
                  { Category: 'Loan EMI Recovery', Amount: aggregates.totalLoan },
                  { Category: 'Salary Advance Recovery', Amount: aggregates.totalAdvance },
                  { Category: 'Income Tax TDS', Amount: aggregates.totalTds },
                  { Category: 'Canteen Charges', Amount: aggregates.totalCanteen },
                  { Category: 'Uniform Charges', Amount: aggregates.totalUniform },
                  { Category: 'Notice Period Recovery', Amount: aggregates.totalNotice },
                  { Category: 'Mobile Charges', Amount: aggregates.totalMobile },
                  { Category: 'Damage Recovery', Amount: aggregates.totalDamage },
                  { Category: 'Other Custom Recoveries', Amount: aggregates.totalCustom },
                  { Category: 'GRAND TOTAL DEDUCTIONS', Amount: aggregates.grandTotalDeductions }
                ];
                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Deduction_Summary');
                XLSX.writeFile(wb, `Deduction_Summary_${activeMonth}.xlsx`);
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={14} /> Download Summary Excel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] block">Statutory & Tax Recoveries</span>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Employee PF Total (12%):</span>
                <span className="font-mono font-bold text-slate-900">₹{aggregates.totalPfEE.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Employer PF Matching (12%):</span>
                <span className="font-mono font-bold text-slate-900">₹{aggregates.totalPfER.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Employee ESIC Total (0.75%):</span>
                <span className="font-mono font-bold text-slate-900">₹{aggregates.totalEsicEE.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Professional Tax (PT) Total:</span>
                <span className="font-mono font-bold text-slate-900">₹{aggregates.totalPt.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Income Tax TDS Total:</span>
                <span className="font-mono font-bold text-rose-800">₹{aggregates.totalTds.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2">
              <span className="font-extrabold text-amber-950 uppercase tracking-wider text-[11px] block">Advances & Company Recoveries</span>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-slate-700">Loan EMI Recovery:</span>
                <span className="font-mono font-bold text-amber-950">₹{aggregates.totalLoan.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-slate-700">Salary Advance Recovery:</span>
                <span className="font-mono font-bold text-amber-950">₹{aggregates.totalAdvance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-slate-700">Canteen Charges Recovery:</span>
                <span className="font-mono font-bold text-slate-900">₹{aggregates.totalCanteen.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-slate-700">Uniform Charges Recovery:</span>
                <span className="font-mono font-bold text-slate-900">₹{aggregates.totalUniform.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-amber-200/60">
                <span className="text-slate-700">Notice Period & Damage Recovery:</span>
                <span className="font-mono font-bold text-slate-900">₹{(aggregates.totalNotice + aggregates.totalDamage).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 pt-2 font-black text-rose-900 border-t border-amber-300">
                <span>GRAND TOTAL DEDUCTIONS:</span>
                <span className="font-mono text-sm">₹{aggregates.grandTotalDeductions.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SINGLE EMPLOYEE FULL FORM DRAWER */}
      {/* ========================================================= */}
      {editingSlip && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 space-y-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{editingSlip.employee_name}</h3>
                <p className="text-xs text-slate-500 font-mono">{editingSlip.department} • {editingSlip.month}</p>
              </div>
              <button onClick={() => setEditingSlip(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSingleForm} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                <span className="font-bold text-slate-700">Auto Base Earnings</span>
                <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1 font-mono">
                  <div>Basic: ₹{editingSlip.earned_base_salary?.toLocaleString('en-IN')}</div>
                  <div>HRA: ₹{editingSlip.earned_hra?.toLocaleString('en-IN')}</div>
                  <div>Special: ₹{editingSlip.earned_special_allowance?.toLocaleString('en-IN')}</div>
                  <div>Overtime: ₹{editingSlip.overtime_pay?.toLocaleString('en-IN')}</div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-bold text-rose-900 uppercase text-[10px] tracking-wider block">Variable Deductions</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-700">Income Tax TDS ₹</label>
                    <input
                      type="number"
                      value={formInputs.tds ?? 0}
                      onChange={(e) => setFormInputs({ ...formInputs, tds: e.target.value })}
                      className="w-full p-2 border rounded-xl font-bold font-mono text-rose-900 mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700">Other Deduction ₹</label>
                    <input
                      type="number"
                      value={formInputs.custom ?? 0}
                      onChange={(e) => setFormInputs({ ...formInputs, custom: e.target.value })}
                      className="w-full p-2 border rounded-xl font-bold font-mono text-rose-900 mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700">Canteen Recovery ₹</label>
                    <input
                      type="number"
                      value={formInputs.canteen_deduction ?? 0}
                      onChange={(e) => setFormInputs({ ...formInputs, canteen_deduction: e.target.value })}
                      className="w-full p-2 border rounded-xl font-mono mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700">Uniform Recovery ₹</label>
                    <input
                      type="number"
                      value={formInputs.uniform_deduction ?? 0}
                      onChange={(e) => setFormInputs({ ...formInputs, uniform_deduction: e.target.value })}
                      className="w-full p-2 border rounded-xl font-mono mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <span className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider block">Variable Earnings & Incentives</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-medium text-slate-700">Bonus Incentive ₹</label>
                    <input
                      type="number"
                      value={formInputs.bonus_incentive ?? 0}
                      onChange={(e) => setFormInputs({ ...formInputs, bonus_incentive: e.target.value })}
                      className="w-full p-2 border rounded-xl font-bold font-mono text-emerald-900 mt-1"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-slate-700">Performance Incentive ₹</label>
                    <input
                      type="number"
                      value={formInputs.performance_incentive ?? 0}
                      onChange={(e) => setFormInputs({ ...formInputs, performance_incentive: e.target.value })}
                      className="w-full p-2 border rounded-xl font-bold font-mono text-emerald-900 mt-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-medium text-slate-700">Remarks / Explanation</label>
                <textarea
                  value={formInputs.remarks ?? ''}
                  onChange={(e) => setFormInputs({ ...formInputs, remarks: e.target.value })}
                  rows={2}
                  className="w-full p-2 border rounded-xl mt-1"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition shadow-md cursor-pointer"
              >
                {loading ? 'Saving...' : 'Save Employee Payroll Inputs'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD MASTER HEAD */}
      {/* ========================================================= */}
      {showAddHeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-extrabold text-slate-900 text-base">
              Add New {showAddHeadModal === 'EARNING' ? 'Earning' : 'Deduction'} Master Head
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Head Name (मद्द का नाम) *</label>
                <input
                  type="text"
                  placeholder="e.g. Festival Bonus / Canteen Charges"
                  value={newHeadName}
                  onChange={(e) => setNewHeadName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl mt-1 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">System Code *</label>
                <input
                  type="text"
                  placeholder="e.g. FEST_BONUS / CANTEEN"
                  value={newHeadCode}
                  onChange={(e) => setNewHeadCode(e.target.value)}
                  className="w-full p-2.5 border rounded-xl mt-1 font-mono uppercase"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Category</label>
                <select
                  value={newHeadCategory}
                  onChange={(e) => setNewHeadCategory(e.target.value)}
                  className="w-full p-2.5 border rounded-xl mt-1 bg-white font-bold"
                >
                  <option value="VARIABLE">VARIABLE / MONTHLY</option>
                  <option value="STATUTORY">STATUTORY</option>
                  <option value="RECURRING">RECURRING</option>
                  <option value="RECOVERY">RECOVERY</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddHeadModal(null)}
                className="px-4 py-2 border rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveMasterHead}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Save Master Head
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SUPER ADMIN UNLOCK PIN */}
      {/* ========================================================= */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-rose-600 font-extrabold text-base">
              <Lock size={18} />
              Super Admin Unlock Security PIN
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter Super Admin PIN to unlock payroll month <strong>{activeMonth}</strong>. This action will reset payroll to Draft and create an audit log entry.
            </p>

            <input
              type="password"
              placeholder="Enter 4-Digit Security PIN"
              value={unlockPin}
              onChange={(e) => setUnlockPin(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl text-center font-mono font-black text-lg tracking-widest focus:outline-none focus:border-indigo-600"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockPin('');
                }}
                className="px-4 py-2 border rounded-xl font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
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
                        company: selectedUnit,
                        pin: unlockPin
                      })
                    });

                    const json = await res.json();
                    if (res.ok && json.success) {
                      setStatusMsg({ type: 'success', text: `Unlocked payroll month ${activeMonth}! Payroll status is now DRAFT.` });
                      setShowUnlockModal(false);
                      setUnlockPin('');
                      if (onRefresh) onRefresh();
                    } else {
                      alert(json.error || json.message || 'Invalid Security PIN');
                    }
                  } catch (e: any) {
                    alert(e.message);
                  }
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Verify & Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
