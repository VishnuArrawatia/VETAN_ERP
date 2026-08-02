/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  FileText, 
  Edit3, 
  X, 
  Check, 
  AlertCircle, 
  Globe, 
  Image as ImageIcon,
  Plus,
  ArrowRight,
  ArrowLeft,
  Award,
  Sparkles,
  Layers,
  HelpCircle,
  ShieldCheck,
  Landmark,
  FolderTree,
  Scale
} from 'lucide-react';
import { CompanyMaster } from '../types';
import { upsertOfflineCompany } from '../lib/offlineStore';

interface CompanyMasterViewProps {
  companies: CompanyMaster[];
  activeHR?: {
    id: string;
    username: string;
    name: string;
    title: string;
    role: string;
    company_rights: string[];
  };
  onRefresh: () => Promise<void>;
  successBanner: string | null;
  setSuccessBanner: (msg: string | null) => void;
}

const DEFAULT_SETTINGS = {
  departments: "Production, QC, Maintenance, Stores, Purchase, Accounts, HR, Dispatch, Sales, Marketing, R&D, Administration",
  designations: "Senior Operator, Line Supervisor, Assembly Engineer, Quality Auditor, Production Head, Purchase Executive, Assistant Manager, Plant HR Manager, General Manager",
  salary_base_percent: 50,
  salary_hra_percent: 40,
  salary_da_percent: 0,
  salary_special_percent: 15,
  pf_opt_in_default: true,
  pf_employer_rate: 12,
  esic_opt_in_threshold: 21000,
  esic_employer_rate: 3.25,
  bonus_rate_percent: 8.33,
  leave_pl_carry_forward: 36,
  leave_cl_lapse: "LAPSE",
  leave_sl_lapse: "LAPSE",
  leave_pl_min_application: 2,
  leave_cl_half_day: true,
  leave_pl_sl_half_day_approval: true,
  attendance_shift_start: "09:00",
  attendance_shift_end: "18:00",
  attendance_grace_mins: 15,
  attendance_3_late_lop: true,
  approval_level_1: "Department Head",
  approval_level_2: "Plant HR Manager",
  approval_level_final: "Corporate Director",
  bank_name: "State Bank of India",
  bank_account_number: "39948827710",
  bank_ifsc: "SBIN0004012"
};

export function CompanyMasterView({ 
  companies, 
  activeHR,
  onRefresh, 
  successBanner, 
  setSuccessBanner 
}: CompanyMasterViewProps) {
  const [selectedCompany, setSelectedCompany] = useState<CompanyMaster | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states - Step 1: Corporate Profile & Identifiers
  const [compId, setCompId] = useState('');
  const [name, setName] = useState('');
  const [unitName, setUnitName] = useState('');
  const [logo, setLogo] = useState('');
  const [registeredOffice, setRegisteredOffice] = useState('');
  const [factoryAddress, setFactoryAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [tanNumber, setTanNumber] = useState('');
  const [cinNumber, setCinNumber] = useState('');
  const [pfNumber, setPfNumber] = useState('');
  const [esicNumber, setEsicNumber] = useState('');
  const [ptNumber, setPtNumber] = useState('');

  // Form states - Step 2: Org Structure
  const [departmentsCsv, setDepartmentsCsv] = useState(DEFAULT_SETTINGS.departments);
  const [designationsCsv, setDesignationsCsv] = useState(DEFAULT_SETTINGS.designations);

  // Form states - Step 3: Wage & Statutory Formulas
  const [salaryBasePercent, setSalaryBasePercent] = useState(DEFAULT_SETTINGS.salary_base_percent);
  const [salaryHraPercent, setSalaryHraPercent] = useState(DEFAULT_SETTINGS.salary_hra_percent);
  const [salaryDaPercent, setSalaryDaPercent] = useState(DEFAULT_SETTINGS.salary_da_percent);
  const [salarySpecialPercent, setSalarySpecialPercent] = useState(DEFAULT_SETTINGS.salary_special_percent);
  const [pfOptInDefault, setPfOptInDefault] = useState(DEFAULT_SETTINGS.pf_opt_in_default);
  const [pfEmployerRate, setPfEmployerRate] = useState(DEFAULT_SETTINGS.pf_employer_rate);
  const [esicOptInThreshold, setEsicOptInThreshold] = useState(DEFAULT_SETTINGS.esic_opt_in_threshold);
  const [esicEmployerRate, setEsicEmployerRate] = useState(DEFAULT_SETTINGS.esic_employer_rate);
  const [bonusRatePercent, setBonusRatePercent] = useState(DEFAULT_SETTINGS.bonus_rate_percent);

  // Form states - Step 4: Leaves & Shift Attendance
  const [leavePlCarryForward, setLeavePlCarryForward] = useState(DEFAULT_SETTINGS.leave_pl_carry_forward);
  const [leaveClLapse, setLeaveClLapse] = useState(DEFAULT_SETTINGS.leave_cl_lapse);
  const [leaveSlLapse, setLeaveSlLapse] = useState(DEFAULT_SETTINGS.leave_sl_lapse);
  const [leavePlMinApplication, setLeavePlMinApplication] = useState(DEFAULT_SETTINGS.leave_pl_min_application);
  const [leaveClHalfDay, setLeaveClHalfDay] = useState(DEFAULT_SETTINGS.leave_cl_half_day);
  const [leavePlSlHalfDayApproval, setLeavePlSlHalfDayApproval] = useState(DEFAULT_SETTINGS.leave_pl_sl_half_day_approval);
  const [attendanceShiftStart, setAttendanceShiftStart] = useState(DEFAULT_SETTINGS.attendance_shift_start);
  const [attendanceShiftEnd, setAttendanceShiftEnd] = useState(DEFAULT_SETTINGS.attendance_shift_end);
  const [attendanceGraceMins, setAttendanceGraceMins] = useState(DEFAULT_SETTINGS.attendance_grace_mins);
  const [attendance3LateLop, setAttendance3LateLop] = useState(DEFAULT_SETTINGS.attendance_3_late_lop);

  // Form states - Step 5: Approvals & Banking
  const [approvalLevel1, setApprovalLevel1] = useState(DEFAULT_SETTINGS.approval_level_1);
  const [approvalLevel2, setApprovalLevel2] = useState(DEFAULT_SETTINGS.approval_level_2);
  const [approvalLevelFinal, setApprovalLevelFinal] = useState(DEFAULT_SETTINGS.approval_level_final);
  const [bankName, setBankName] = useState(DEFAULT_SETTINGS.bank_name);
  const [bankAccountNumber, setBankAccountNumber] = useState(DEFAULT_SETTINGS.bank_account_number);
  const [bankIfsc, setBankIfsc] = useState(DEFAULT_SETTINGS.bank_ifsc);

  const isSuperAdmin = activeHR?.role === 'SUPER_HR';

  const resetForm = () => {
    setCompId('');
    setName('');
    setUnitName('');
    setLogo('');
    setRegisteredOffice('');
    setFactoryAddress('');
    setGstNumber('');
    setPanNumber('');
    setTanNumber('');
    setCinNumber('');
    setPfNumber('');
    setEsicNumber('');
    setPtNumber('');
    setDepartmentsCsv(DEFAULT_SETTINGS.departments);
    setDesignationsCsv(DEFAULT_SETTINGS.designations);
    setSalaryBasePercent(DEFAULT_SETTINGS.salary_base_percent);
    setSalaryHraPercent(DEFAULT_SETTINGS.salary_hra_percent);
    setSalaryDaPercent(DEFAULT_SETTINGS.salary_da_percent);
    setSalarySpecialPercent(DEFAULT_SETTINGS.salary_special_percent);
    setPfOptInDefault(DEFAULT_SETTINGS.pf_opt_in_default);
    setPfEmployerRate(DEFAULT_SETTINGS.pf_employer_rate);
    setEsicOptInThreshold(DEFAULT_SETTINGS.esic_opt_in_threshold);
    setEsicEmployerRate(DEFAULT_SETTINGS.esic_employer_rate);
    setBonusRatePercent(DEFAULT_SETTINGS.bonus_rate_percent);
    setLeavePlCarryForward(DEFAULT_SETTINGS.leave_pl_carry_forward);
    setLeaveClLapse(DEFAULT_SETTINGS.leave_cl_lapse);
    setLeaveSlLapse(DEFAULT_SETTINGS.leave_sl_lapse);
    setLeavePlMinApplication(DEFAULT_SETTINGS.leave_pl_min_application);
    setLeaveClHalfDay(DEFAULT_SETTINGS.leave_cl_half_day);
    setLeavePlSlHalfDayApproval(DEFAULT_SETTINGS.leave_pl_sl_half_day_approval);
    setAttendanceShiftStart(DEFAULT_SETTINGS.attendance_shift_start);
    setAttendanceShiftEnd(DEFAULT_SETTINGS.attendance_shift_end);
    setAttendanceGraceMins(DEFAULT_SETTINGS.attendance_grace_mins);
    setAttendance3LateLop(DEFAULT_SETTINGS.attendance_3_late_lop);
    setApprovalLevel1(DEFAULT_SETTINGS.approval_level_1);
    setApprovalLevel2(DEFAULT_SETTINGS.approval_level_2);
    setApprovalLevelFinal(DEFAULT_SETTINGS.approval_level_final);
    setBankName(DEFAULT_SETTINGS.bank_name);
    setBankAccountNumber(DEFAULT_SETTINGS.bank_account_number);
    setBankIfsc(DEFAULT_SETTINGS.bank_ifsc);
    setError(null);
  };

  const handleCreateNewClick = () => {
    resetForm();
    setIsEditing(false);
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleEditClick = (c: CompanyMaster) => {
    setSelectedCompany(c);
    setCompId(c.id);
    setName(c.name);
    setUnitName(c.unit_name);
    setLogo(c.logo || '');
    setRegisteredOffice(c.registered_office || '');
    setFactoryAddress(c.factory_address || '');
    setGstNumber(c.gst_number || '');
    setPanNumber(c.pan_number || '');
    setTanNumber(c.tan_number || '');
    setCinNumber(c.cin_number || '');
    setPfNumber(c.pf_number || '');
    setEsicNumber(c.esic_number || '');
    setPtNumber(c.pt_number || '');

    // Parse Settings if they exist
    let sets = DEFAULT_SETTINGS;
    if (c.settings) {
      try {
        sets = { ...DEFAULT_SETTINGS, ...JSON.parse(c.settings) };
      } catch (err) {
        console.warn("Could not parse company settings:", err);
      }
    }

    setDepartmentsCsv(sets.departments);
    setDesignationsCsv(sets.designations);
    setSalaryBasePercent(sets.salary_base_percent);
    setSalaryHraPercent(sets.salary_hra_percent);
    setSalaryDaPercent(sets.salary_da_percent);
    setSalarySpecialPercent(sets.salary_special_percent);
    setPfOptInDefault(sets.pf_opt_in_default);
    setPfEmployerRate(sets.pf_employer_rate);
    setEsicOptInThreshold(sets.esic_opt_in_threshold);
    setEsicEmployerRate(sets.esic_employer_rate);
    setBonusRatePercent(sets.bonus_rate_percent);
    setLeavePlCarryForward(sets.leave_pl_carry_forward);
    setLeaveClLapse(sets.leave_cl_lapse);
    setLeaveSlLapse(sets.leave_sl_lapse);
    setLeavePlMinApplication(sets.leave_pl_min_application);
    setLeaveClHalfDay(sets.leave_cl_half_day);
    setLeavePlSlHalfDayApproval(sets.leave_pl_sl_half_day_approval);
    setAttendanceShiftStart(sets.attendance_shift_start);
    setAttendanceShiftEnd(sets.attendance_shift_end);
    setAttendanceGraceMins(sets.attendance_grace_mins);
    setAttendance3LateLop(sets.attendance_3_late_lop);
    setApprovalLevel1(sets.approval_level_1);
    setApprovalLevel2(sets.approval_level_2);
    setApprovalLevelFinal(sets.approval_level_final);
    setBankName(sets.bank_name);
    setBankAccountNumber(sets.bank_account_number);
    setBankIfsc(sets.bank_ifsc);

    setIsEditing(true);
    setWizardStep(1);
    setIsWizardOpen(true);
    setError(null);
  };

  const saveSetupWizard = async () => {
    setLoading(true);
    setError(null);

    const compiledSettings = {
      departments: departmentsCsv,
      designations: designationsCsv,
      salary_base_percent: salaryBasePercent,
      salary_hra_percent: salaryHraPercent,
      salary_da_percent: salaryDaPercent,
      salary_special_percent: salarySpecialPercent,
      pf_opt_in_default: pfOptInDefault,
      pf_employer_rate: pfEmployerRate,
      esic_opt_in_threshold: esicOptInThreshold,
      esic_employer_rate: esicEmployerRate,
      bonus_rate_percent: bonusRatePercent,
      leave_pl_carry_forward: leavePlCarryForward,
      leave_cl_lapse: leaveClLapse,
      leave_sl_lapse: leaveSlLapse,
      leave_pl_min_application: leavePlMinApplication,
      leave_cl_half_day: leaveClHalfDay,
      leave_pl_sl_half_day_approval: leavePlSlHalfDayApproval,
      attendance_shift_start: attendanceShiftStart,
      attendance_shift_end: attendanceShiftEnd,
      attendance_grace_mins: attendanceGraceMins,
      attendance_3_late_lop: attendance3LateLop,
      approval_level_1: approvalLevel1,
      approval_level_2: approvalLevel2,
      approval_level_final: approvalLevelFinal,
      bank_name: bankName,
      bank_account_number: bankAccountNumber,
      bank_ifsc: bankIfsc
    };

    const payload = {
      id: compId.trim().toUpperCase(),
      name: name.trim(),
      unit_name: unitName.trim(),
      logo: logo.trim(),
      registered_office: registeredOffice.trim(),
      factory_address: factoryAddress.trim(),
      gst_number: gstNumber.trim().toUpperCase(),
      pan_number: panNumber.trim().toUpperCase(),
      tan_number: tanNumber.trim().toUpperCase(),
      cin_number: cinNumber.trim().toUpperCase(),
      pf_number: pfNumber.trim(),
      esic_number: esicNumber.trim(),
      pt_number: ptNumber.trim(),
      settings: JSON.stringify(compiledSettings)
    };

    try {
      const activeHRUser = localStorage.getItem('vetan_active_hr');
      const operatorName = activeHRUser ? JSON.parse(activeHRUser).name : 'Group HR Director';

      let response: Response | null = null;
      try {
        if (isEditing && selectedCompany) {
          response = await fetch(`/api/companies/${selectedCompany.id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'X-Operator-Name': operatorName,
              'X-Operator-Role': activeHR?.role || 'SUPER_HR'
            },
            body: JSON.stringify(payload)
          });
        } else {
          response = await fetch('/api/companies', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Operator-Name': operatorName,
              'X-Operator-Role': activeHR?.role || 'SUPER_HR'
            },
            body: JSON.stringify(payload)
          });
        }
      } catch {
        response = null;
      }

      const rawText = response ? await response.text() : '';
      let resData: any = null;
      try {
        resData = rawText ? JSON.parse(rawText) : null;
      } catch {
        resData = null;
      }

      const apiOk = !!(response && response.ok && resData && (resData.success !== false));
      if (!apiOk) {
        // Vercel has no Express /api — keep the edited legal name in offline store
        await upsertOfflineCompany(payload);
      } else if (response && !response.ok) {
        throw new Error(resData?.error || 'Failed to save company settings');
      }

      // Automatically register any newly declared departments into the database so they are usable immediately
      const depts = departmentsCsv.split(',').map(d => d.trim()).filter(Boolean);
      for (const d of depts) {
        try {
          await fetch('/api/departments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ department: d })
          });
        } catch (e) {
          console.warn('Failed to seed department', d, e);
        }
      }

      setSuccessBanner(isEditing 
        ? `Setup Wizard settings for ${compId} updated successfully!` 
        : `New Unit ${compId} (${unitName}) created & fully configured through Corporate Setup Wizard!`
      );
      setIsWizardOpen(false);
      setSelectedCompany(null);
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Server error saving company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-gray-900 tracking-tight flex items-center gap-2">
            <Building2 className="text-emerald-600" size={22} />
            Corporate Company Master Registry
          </h2>
          <p className="text-gray-500 text-xs mt-0.5">
            Manage dynamically added group companies, statutory PAN/GST parameters, and unit PF/ESIC codes.
          </p>
        </div>

        {isSuperAdmin && (
          <button 
            onClick={handleCreateNewClick}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus size={15} />
            <span>Register Company / Unit Wizard</span>
          </button>
        )}
      </div>

      {successBanner && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 text-xs font-bold rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="p-1 hover:bg-emerald-100 rounded text-emerald-800 cursor-pointer">
            <X size={14} />
          </button>
        </motion.div>
      )}

      {/* Grid of Group Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {companies.map((c) => {
          let sets = DEFAULT_SETTINGS;
          if (c.settings) {
            try {
              sets = { ...DEFAULT_SETTINGS, ...JSON.parse(c.settings) };
            } catch (err) {}
          }

          const factoryImages: Record<string, string> = {
            'Sakar-I': '/src/assets/images/sakar_i_factory_1784275477727.jpg',
            'Sakar-III': '/src/assets/images/sakar_iii_factory_1784275525132.jpg',
            'SVN-1': '/src/assets/images/svn_i_factory_1784275461192.jpg',
            'SVN-II': '/src/assets/images/svn_ii_factory_1784278017538.jpg',
            'Flare-1': '/src/assets/images/flare_factory_1784275493334.jpg',
            'Zenivo-1': '/src/assets/images/zenivo_factory_1784275508025.jpg'
          };

          return (
            <motion.div 
              key={c.id}
              whileHover={{ y: -2 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-6 relative overflow-hidden group"
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4 items-center">
                  <img 
                    src={c.logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=80&h=80&fit=crop'} 
                    alt={c.name} 
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-2xl object-cover border border-slate-100 bg-slate-50 shadow-xs"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded-md">
                        {c.id}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest font-display">
                        {c.unit_name}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm font-display mt-1">{c.name}</h3>
                  </div>
                </div>

                {isSuperAdmin && (
                  <button 
                    onClick={() => handleEditClick(c)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600 hover:text-slate-900 cursor-pointer border border-transparent hover:border-slate-200"
                    title="Launch setup wizard for updates"
                  >
                    <Edit3 size={15} />
                  </button>
                )}
              </div>

              {/* Factory Photo Banner */}
              {factoryImages[c.id] && (
                <div className="h-32 w-full rounded-2xl overflow-hidden relative border border-slate-100 shadow-inner">
                  <img 
                    src={factoryImages[c.id]} 
                    alt={`${c.name} Factory`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-slate-950/70 backdrop-blur-xs text-white text-[9px] font-mono font-bold rounded-md uppercase tracking-wider">
                    Factory Facility
                  </div>
                </div>
              )}

              {/* Address Details */}
              <div className="space-y-3.5 text-xs text-slate-600 border-t pt-4">
                <div className="flex gap-2 items-start">
                  <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wide">Registered Office</span>
                    <p className="font-medium text-slate-800 leading-relaxed mt-0.5">{c.registered_office || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <Building2 size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wide">Factory Address</span>
                    <p className="font-medium text-slate-800 leading-relaxed mt-0.5">{c.factory_address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Legal & Statutory Summary */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-2 text-[10px]">
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">GST Number</span>
                  <span className="font-mono font-bold text-slate-800">{c.gst_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">PAN Number</span>
                  <span className="font-mono font-bold text-slate-800 uppercase">{c.pan_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">TAN Number</span>
                  <span className="font-mono font-bold text-slate-800 uppercase">{c.tan_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">CIN Number</span>
                  <span className="font-mono font-semibold text-slate-700 uppercase">{c.cin_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">PF code</span>
                  <span className="font-mono font-bold text-slate-800">{c.pf_number || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[8px] uppercase font-bold text-gray-400 block">ESIC code</span>
                  <span className="font-mono font-bold text-slate-800">{c.esic_number || 'N/A'}</span>
                </div>
              </div>

              {/* Wizard Setup Settings Summary Block */}
              <div className="bg-emerald-50/45 border border-emerald-100/50 p-4 rounded-2xl space-y-3 text-[11px] leading-relaxed">
                <span className="text-[8px] uppercase font-extrabold text-emerald-800 tracking-wider flex items-center gap-1">
                  <Sparkles size={11} className="text-emerald-600" />
                  Active Policy Setup configurations
                </span>

                <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-medium">Salary Structure:</span>
                    <span className="font-semibold text-slate-800 block">Base: {sets.salary_base_percent}% • HRA: {sets.salary_hra_percent}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-medium">Statutory Contributions:</span>
                    <span className="font-semibold text-slate-800 block">EPF: {sets.pf_employer_rate}% • ESIC: {sets.esic_employer_rate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-medium">Leave rules:</span>
                    <span className="font-semibold text-slate-800 block">PL Carry Fwd: {sets.leave_pl_carry_forward} Days • Min PL: {sets.leave_pl_min_application} Days</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[9px] uppercase font-medium">Shift & Grace:</span>
                    <span className="font-semibold text-slate-800 block">{sets.attendance_shift_start} to {sets.attendance_shift_end} (Grace {sets.attendance_grace_mins}m)</span>
                  </div>
                </div>

                <div className="border-t border-emerald-100/40 pt-2.5 grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-gray-400 block text-[8px] uppercase font-medium">Corporate Banking:</span>
                    <span className="font-mono font-bold text-slate-700 block">{sets.bank_name}</span>
                    <span className="font-mono text-slate-500 block">{sets.bank_account_number}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[8px] uppercase font-medium">Approval Chain:</span>
                    <span className="font-semibold text-slate-700 block truncate">{sets.approval_level_1} → {sets.approval_level_final}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 5-Step COMPLETE SETUP WIZARD DIALOG MODAL */}
      <AnimatePresence>
        {isWizardOpen && (
          <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            >
              {/* Wizard Header */}
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center relative">
                <div>
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block">
                    {isEditing ? 'MASTER RECONCILIATION CORRECTION' : 'NEW ENTERPRISE SETUP WIZARD'}
                  </span>
                  <h3 className="text-base font-extrabold font-display mt-0.5">
                    {isEditing ? `Edit Unit Profile & Rules: ${compId}` : 'Launch Automated Setup Wizard'}
                  </h3>
                </div>
                <button 
                  onClick={() => setIsWizardOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-xl transition text-slate-300 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Progress Tracker Bar */}
              <div className="bg-slate-100 px-6 py-3 border-b flex items-center justify-between text-xs font-bold text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
                  <span className={wizardStep === 1 ? 'text-slate-800' : 'text-slate-400'}>Profile</span>
                </div>
                <div className="w-8 h-0.5 bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
                  <span className={wizardStep === 2 ? 'text-slate-800' : 'text-slate-400'}>Departments</span>
                </div>
                <div className="w-8 h-0.5 bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
                  <span className={wizardStep === 3 ? 'text-slate-800' : 'text-slate-400'}>Salary heads</span>
                </div>
                <div className="w-8 h-0.5 bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>4</span>
                  <span className={wizardStep === 4 ? 'text-slate-800' : 'text-slate-400'}>Leaves & Shift</span>
                </div>
                <div className="w-8 h-0.5 bg-slate-300" />
                <div className="flex items-center gap-1.5">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === 5 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>5</span>
                  <span className={wizardStep === 5 ? 'text-slate-800' : 'text-slate-400'}>Banking</span>
                </div>
              </div>

              {/* Wizard Form Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-150 text-red-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle size={15} />
                    <span>{error}</span>
                  </div>
                )}

                {/* STEP 1: Corporate Profile & Identifiers */}
                {wizardStep === 1 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Company Code / ID</label>
                        <input 
                          type="text"
                          required
                          disabled={isEditing}
                          placeholder="e.g. ZENIVO"
                          value={compId}
                          onChange={(e) => setCompId(e.target.value.toUpperCase())}
                          className="w-full text-xs p-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold text-slate-800 uppercase disabled:bg-slate-150"
                        />
                      </div>

                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Legal Corporate Name</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Zenivo Electronics Pvt Ltd"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full text-xs p-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Unit Designation</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Unit II"
                          value={unitName}
                          onChange={(e) => setUnitName(e.target.value)}
                          className="w-full text-xs p-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-medium"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block flex items-center gap-1">
                          <ImageIcon size={11} />
                          Logo URL Address
                        </label>
                        <input 
                          type="url"
                          placeholder="https://..."
                          value={logo}
                          onChange={(e) => setLogo(e.target.value)}
                          className="w-full text-xs p-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Corporate Registered Office</label>
                        <textarea 
                          rows={2}
                          required
                          placeholder="Enter main legal address"
                          value={registeredOffice}
                          onChange={(e) => setRegisteredOffice(e.target.value)}
                          className="w-full text-xs p-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-normal"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Industrial Factory Address</label>
                        <textarea 
                          rows={2}
                          required
                          placeholder="Enter plant location address"
                          value={factoryAddress}
                          onChange={(e) => setFactoryAddress(e.target.value)}
                          className="w-full text-xs p-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-normal"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-2xl space-y-3">
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block border-b pb-1">Statutory Tax & Government Codes</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">GSTIN Number</label>
                          <input 
                            type="text"
                            placeholder="27AAACZ1234F1Z1"
                            value={gstNumber}
                            onChange={(e) => setGstNumber(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">PAN Number</label>
                          <input 
                            type="text"
                            placeholder="AAACZ1234F"
                            value={panNumber}
                            onChange={(e) => setPanNumber(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">TAN Number</label>
                          <input 
                            type="text"
                            placeholder="MUMA12345C"
                            value={tanNumber}
                            onChange={(e) => setTanNumber(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">CIN Number</label>
                          <input 
                            type="text"
                            placeholder="U12345MH2026PTC123456"
                            value={cinNumber}
                            onChange={(e) => setCinNumber(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">PF Code No</label>
                          <input 
                            type="text"
                            placeholder="MH/BAN/12345"
                            value={pfNumber}
                            onChange={(e) => setPfNumber(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase block">ESIC Code No</label>
                          <input 
                            type="text"
                            placeholder="31000123450001001"
                            value={esicNumber}
                            onChange={(e) => setEsicNumber(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Departments & Designations */}
                {wizardStep === 2 && (
                  <div className="space-y-5">
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                      <FolderTree className="text-emerald-600 mt-1 shrink-0" size={18} />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Company-wise Departmental Structures</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Define specialized organizational units specific to this factory/office. These will instantly become selectable when inserting employees.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider">Active Departments (Comma Separated)</label>
                      <textarea
                        rows={4}
                        required
                        value={departmentsCsv}
                        onChange={(e) => setDepartmentsCsv(e.target.value)}
                        placeholder="Production, QC, Maintenance..."
                        className="w-full text-xs p-3 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed font-medium"
                      />
                      <span className="text-[10px] text-slate-400 block">Comma-separated departments will be dynamically cataloged and registered.</span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase block tracking-wider">Active Authorized Designations (Comma Separated)</label>
                      <textarea
                        rows={4}
                        required
                        value={designationsCsv}
                        onChange={(e) => setDesignationsCsv(e.target.value)}
                        placeholder="Junior Engineer, Line Operator..."
                        className="w-full text-xs p-3 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none leading-relaxed font-medium"
                      />
                      <span className="text-[10px] text-slate-400 block">Standard hierarchy definitions.</span>
                    </div>
                  </div>
                )}

                {/* STEP 3: Salary heads & Formula Configurations */}
                {wizardStep === 3 && (
                  <div className="space-y-5">
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl flex items-start gap-3">
                      <Scale className="text-emerald-600 mt-1 shrink-0" size={18} />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Dynamic Wage Formula Settings</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Configure statutory ratios. Ratios dictate how an employee's gross base salary breaks down into dynamic allowances and state deductions.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Base Salary (% of Gross)</label>
                        <div className="relative">
                          <input 
                            type="number"
                            required
                            min={1}
                            max={100}
                            value={salaryBasePercent}
                            onChange={(e) => setSalaryBasePercent(Number(e.target.value))}
                            className="w-full text-xs p-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold"
                          />
                          <span className="absolute right-3 top-3 text-[11px] font-bold text-slate-400">%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">HRA Rate (% of Base)</label>
                        <div className="relative">
                          <input 
                            type="number"
                            required
                            min={0}
                            max={100}
                            value={salaryHraPercent}
                            onChange={(e) => setSalaryHraPercent(Number(e.target.value))}
                            className="w-full text-xs p-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold"
                          />
                          <span className="absolute right-3 top-3 text-[11px] font-bold text-slate-400">%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block">Special Allowance (% of Base)</label>
                        <div className="relative">
                          <input 
                            type="number"
                            required
                            min={0}
                            max={100}
                            value={salarySpecialPercent}
                            onChange={(e) => setSalarySpecialPercent(Number(e.target.value))}
                            className="w-full text-xs p-2.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none font-bold"
                          />
                          <span className="absolute right-3 top-3 text-[11px] font-bold text-slate-400">%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-2xl space-y-4">
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block border-b pb-1.5">Statutory Rules Setup</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">EPF Employer Rate</label>
                            <span className="text-[9px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1 rounded">EPF Scheme 1952</span>
                          </div>
                          <div className="relative">
                            <input 
                              type="number"
                              required
                              step="0.01"
                              value={pfEmployerRate}
                              onChange={(e) => setPfEmployerRate(Number(e.target.value))}
                              className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">%</span>
                          </div>
                          <label className="flex items-center gap-2 text-[10px] text-slate-500 select-none cursor-pointer mt-1">
                            <input 
                              type="checkbox"
                              checked={pfOptInDefault}
                              onChange={(e) => setPfOptInDefault(e.target.checked)}
                              className="accent-emerald-600"
                            />
                            <span>Default PF opt-in for new hires</span>
                          </label>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-slate-600 uppercase">ESIC Subscribing Limit</label>
                            <span className="text-[9px] font-mono font-bold text-purple-600 bg-purple-50 px-1 rounded">ESIC Act 1948</span>
                          </div>
                          <div className="relative">
                            <input 
                              type="number"
                              required
                              value={esicOptInThreshold}
                              onChange={(e) => setEsicOptInThreshold(Number(e.target.value))}
                              className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] font-bold text-slate-400">INR Gross</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] text-slate-400 uppercase font-medium">Employer ESIC rate:</span>
                            <input 
                              type="number"
                              step="0.01"
                              value={esicEmployerRate}
                              onChange={(e) => setEsicEmployerRate(Number(e.target.value))}
                              className="w-14 p-0.5 text-center text-[10px] border rounded font-mono"
                            />
                            <span className="text-[10px] text-slate-500">%</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-3 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block">Bonus Rule Scheme (% of Wage)</label>
                        <div className="relative max-w-xs">
                          <input 
                            type="number"
                            required
                            step="0.01"
                            value={bonusRatePercent}
                            onChange={(e) => setBonusRatePercent(Number(e.target.value))}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none font-semibold"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">%</span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 block leading-normal">Default minimum bonus rate is 8.33% (equivalent to one month basic wage per Payment of Bonus Act).</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: Leaves & Shift Attendance */}
                {wizardStep === 4 && (
                  <div className="space-y-5">
                    <div className="bg-slate-50 p-4 border rounded-2xl space-y-4">
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block border-b pb-1.5">Leave Policy Rules</span>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">PL Carry Forward (Max Days)</label>
                          <input 
                            type="number"
                            required
                            value={leavePlCarryForward}
                            onChange={(e) => setLeavePlCarryForward(Number(e.target.value))}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1"
                          />
                          <span className="text-[9px] text-slate-400 block font-medium">PL Carry Forward = Maximum 36 Days</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">Min PL Apply Count (Days)</label>
                          <input 
                            type="number"
                            required
                            value={leavePlMinApplication}
                            onChange={(e) => setLeavePlMinApplication(Number(e.target.value))}
                            className="w-full text-xs p-2 border rounded-lg focus:ring-1"
                          />
                          <span className="text-[9px] text-slate-400 block font-medium">Minimum PL Application = 2 Days</span>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">Casual Leave Year-End</label>
                          <select 
                            value={leaveClLapse}
                            onChange={(e) => setLeaveClLapse(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg bg-white"
                          >
                            <option value="LAPSE">Lapse (Year End Lapse)</option>
                            <option value="ENCASH">Encashment</option>
                            <option value="ACCUMULATE">Accumulate</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">Sick Leave Year-End</label>
                          <select 
                            value={leaveSlLapse}
                            onChange={(e) => setLeaveSlLapse(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg bg-white"
                          >
                            <option value="LAPSE">Lapse (Year End Lapse)</option>
                            <option value="ENCASH">Encashment</option>
                            <option value="ACCUMULATE">Accumulate</option>
                          </select>
                        </div>
                      </div>

                      <div className="border-t pt-3 grid grid-cols-2 gap-4">
                        <label className="flex items-start gap-2 text-[10.5px] text-slate-600 select-none cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={leaveClHalfDay}
                            onChange={(e) => setLeaveClHalfDay(e.target.checked)}
                            className="accent-emerald-600 mt-0.5"
                          />
                          <div>
                            <strong className="block text-slate-800">Half Day CL Allowed</strong>
                            <span className="text-[9px] text-slate-400">Allow 0.5 days debit on Casual Leave application.</span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2 text-[10.5px] text-slate-600 select-none cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={leavePlSlHalfDayApproval}
                            onChange={(e) => setLeavePlSlHalfDayApproval(e.target.checked)}
                            className="accent-emerald-600 mt-0.5"
                          />
                          <div>
                            <strong className="block text-slate-800">Half Day PL/SL approval required</strong>
                            <span className="text-[9px] text-slate-400">Requires manual management waiver.</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-2xl space-y-4">
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block border-b pb-1.5">Attendance & Shift Timing Rules</span>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">Shift Start Time</label>
                          <input 
                            type="text"
                            placeholder="09:00"
                            value={attendanceShiftStart}
                            onChange={(e) => setAttendanceShiftStart(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg text-center font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">Shift End Time</label>
                          <input 
                            type="text"
                            placeholder="18:00"
                            value={attendanceShiftEnd}
                            onChange={(e) => setAttendanceShiftEnd(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg text-center font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">Late Grace Period</label>
                          <div className="relative">
                            <input 
                              type="number"
                              value={attendanceGraceMins}
                              onChange={(e) => setAttendanceGraceMins(Number(e.target.value))}
                              className="w-full text-xs p-2 border rounded-lg text-center font-bold"
                            />
                            <span className="absolute right-2 top-2 text-[9px] font-bold text-slate-400">mins</span>
                          </div>
                        </div>
                      </div>

                      <label className="flex items-start gap-2 text-[10.5px] text-slate-600 select-none cursor-pointer border-t pt-3">
                        <input 
                          type="checkbox"
                          checked={attendance3LateLop}
                          onChange={(e) => setAttendance3LateLop(e.target.checked)}
                          className="accent-emerald-600 mt-0.5"
                        />
                        <div>
                          <strong className="block text-slate-800">3 Late Marks = 1 LOP Day Deduction</strong>
                          <span className="text-[9px] text-slate-400">Automate proration penalties for late attendance beyond grace period.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* STEP 5: Corporate Banking & Approver Hierarchies */}
                {wizardStep === 5 && (
                  <div className="space-y-5">
                    <div className="bg-slate-50 p-4 border rounded-2xl space-y-4">
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block border-b pb-1.5 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-600" />
                        Enterprise Workflow Approval Chain
                      </span>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">Level 1 Approver</label>
                          <input 
                            type="text"
                            value={approvalLevel1}
                            onChange={(e) => setApprovalLevel1(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">Level 2 Approver</label>
                          <input 
                            type="text"
                            value={approvalLevel2}
                            onChange={(e) => setApprovalLevel2(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">Final Approver</label>
                          <input 
                            type="text"
                            value={approvalLevelFinal}
                            onChange={(e) => setApprovalLevelFinal(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 border rounded-2xl space-y-4">
                      <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block border-b pb-1.5 flex items-center gap-1.5">
                        <Landmark size={14} className="text-emerald-600" />
                        Unit Corporate Bank Account details
                      </span>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">Disbursement Bank Name</label>
                          <input 
                            type="text"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">IFSC Code No</label>
                          <input 
                            type="text"
                            value={bankIfsc}
                            onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                            className="w-full text-xs p-2 border rounded-lg font-mono font-bold uppercase"
                          />
                        </div>

                        <div className="space-y-1 col-span-3">
                          <label className="text-[9px] font-bold text-slate-600 uppercase block">Corporate Account Number</label>
                          <input 
                            type="text"
                            value={bankAccountNumber}
                            onChange={(e) => setBankAccountNumber(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Wizard Footer Controls */}
              <div className="p-4 border-t bg-slate-50 flex justify-between items-center">
                <button 
                  type="button"
                  disabled={wizardStep === 1}
                  onClick={() => setWizardStep(prev => prev - 1)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <div className="text-[11px] font-bold text-slate-400">
                  Step {wizardStep} of 5
                </div>

                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsWizardOpen(false)}
                    className="px-4 py-2 border rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  {wizardStep < 5 ? (
                    <button 
                      type="button"
                      onClick={() => setWizardStep(prev => prev + 1)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Continue</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button 
                      type="button"
                      disabled={loading}
                      onClick={saveSetupWizard}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl transition cursor-pointer shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {loading ? 'Completing Setup...' : 'Save & Complete Setup Wizard'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
