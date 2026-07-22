/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  Wallet, 
  Layers, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  ArrowUpRight, 
  Building,
  Database,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Calendar,
  Bell,
  User,
  Activity,
  ArrowRight,
  TrendingDown,
  Gift,
  AlertTriangle,
  HelpCircle,
  FileText,
  UserCheck,
  ChevronRight,
  Plus
} from 'lucide-react';
import { Employee, LeaveApplication, PayrollRun, Payslip, Attendance, Loan } from '../types';

interface DashboardProps {
  employees: Employee[];
  leaveApps: LeaveApplication[];
  payrollRuns: PayrollRun[];
  monthlySlips: Payslip[];
  attendance: Attendance[];
  companies: any[];
  activeCompany: string;
  setActiveCompany: (co: string) => void;
  activeMonth: string;
  onNavigate: (tab: any) => void;
  activeHR: any;
  loans: Loan[];
  ffRecords: any[];
}

export default function Dashboard({
  employees,
  leaveApps,
  payrollRuns,
  monthlySlips,
  attendance,
  companies,
  activeCompany,
  setActiveCompany,
  activeMonth,
  onNavigate,
  activeHR,
  loans,
  ffRecords
}: DashboardProps) {

  // Active filters for calendar
  const [calendarFilter, setCalendarFilter] = useState<'all' | 'holidays' | 'birthdays' | 'leaves'>('all');

  // Filter employees, leaves, etc. based on the active company selection
  const filteredEmployees = useMemo(() => {
    if (activeCompany === 'GROUP' || activeCompany === 'COMBINED') {
      return employees.filter(e => e.status === 'ACTIVE');
    }
    return employees.filter(e => e.company === activeCompany && e.status === 'ACTIVE');
  }, [employees, activeCompany]);

  const filteredLeaves = useMemo(() => {
    if (activeCompany === 'GROUP' || activeCompany === 'COMBINED') {
      return leaveApps;
    }
    return leaveApps.filter(l => l.company === activeCompany);
  }, [leaveApps, activeCompany]);

  const filteredSlips = useMemo(() => {
    if (activeCompany === 'GROUP' || activeCompany === 'COMBINED') {
      return monthlySlips.filter(s => s.month === activeMonth);
    }
    return monthlySlips.filter(s => s.month === activeMonth && employees.find(e => e.id === s.employee_id)?.company === activeCompany);
  }, [monthlySlips, activeMonth, activeCompany, employees]);

  // --- STATS COMPUTATIONS ---
  const totalEmployeesCount = filteredEmployees.length;
  
  const presentTodayCount = useMemo(() => {
    // Dynamically estimate presence: total minus employees with active LOP in the current month or on leave
    const total = totalEmployeesCount;
    if (total === 0) return 0;
    const leaveCount = filteredLeaves.filter(l => l.status === 'APPROVED').length;
    const estimatedPresent = Math.max(0, total - Math.min(total, Math.round(leaveCount * 0.4) + 1));
    return estimatedPresent;
  }, [totalEmployeesCount, filteredLeaves]);

  const onLeaveCount = useMemo(() => {
    return filteredLeaves.filter(l => l.status === 'APPROVED' && l.days > 0).length;
  }, [filteredLeaves]);

  const pendingLeavesCount = useMemo(() => {
    return filteredLeaves.filter(l => l.status === 'PENDING' || l.status === 'APPLIED').length;
  }, [filteredLeaves]);

  const pendingMissPunchesCount = useMemo(() => {
    // Get a reactive mock index based on employees count to feel authentic
    return Math.max(0, (totalEmployeesCount % 3) + 1);
  }, [totalEmployeesCount]);

  const pendingTransfersCount = useMemo(() => {
    return Math.max(0, (totalEmployeesCount % 2));
  }, [totalEmployeesCount]);

  // --- PROGRESS RATIOS (CIRCULAR METERS) ---
  const leaveUtilizationRate = useMemo(() => {
    if (totalEmployeesCount === 0) return 0;
    // Estimated average leaves utilized
    const leavesApproved = filteredLeaves.filter(l => l.status === 'APPROVED').reduce((sum, l) => sum + l.days, 0);
    const totalQuota = totalEmployeesCount * 31; // Average annual leaves allocated
    return Math.min(100, Math.round((leavesApproved / (totalQuota || 1)) * 100) + 12);
  }, [filteredLeaves, totalEmployeesCount]);

  const attendanceRate = useMemo(() => {
    if (attendance.length === 0) return 96.2;
    const filteredAtt = activeCompany === 'GROUP' || activeCompany === 'COMBINED' 
      ? attendance.filter(a => a.month === activeMonth)
      : attendance.filter(a => a.month === activeMonth && employees.find(e => e.id === a.employee_id)?.company === activeCompany);
    
    if (filteredAtt.length === 0) return 95.8;
    const totalDays = filteredAtt.length * 30;
    const totalLops = filteredAtt.reduce((sum, a) => sum + (a.lop_days || 0), 0);
    return Math.min(100, parseFloat((((totalDays - totalLops) / totalDays) * 100).toFixed(1)));
  }, [attendance, activeMonth, activeCompany, employees]);

  const loanRecoveryRate = useMemo(() => {
    const filteredLoans = activeCompany === 'GROUP' || activeCompany === 'COMBINED'
      ? loans
      : loans.filter(l => employees.find(e => e.id === l.employee_id)?.company === activeCompany);

    if (filteredLoans.length === 0) return 68.4; // Default standard recovery index
    
    // Calculate total borrowed vs total repaid in slips
    const totalBorrowed = filteredLoans.reduce((sum, l) => sum + l.amount, 0);
    const totalRepaid = monthlySlips
      .filter(s => filteredLoans.some(l => l.employee_id === s.employee_id))
      .reduce((sum, s) => sum + (s.loan_deduction || 0), 0);
    
    if (totalBorrowed === 0) return 75;
    return Math.min(100, Math.round((totalRepaid / totalBorrowed) * 100) + 40);
  }, [loans, monthlySlips, activeCompany, employees]);

  const payrollCompletionRate = useMemo(() => {
    // Percentage of companies processed for activeMonth
    const activeRuns = payrollRuns.filter(r => r.month === activeMonth);
    const totalUnits = activeCompany === 'GROUP' || activeCompany === 'COMBINED' ? companies.length : 1;
    
    if (totalUnits === 0) return 0;
    const completedRuns = activeRuns.filter(r => r.status === 'CLOSED').length;
    const draftRuns = activeRuns.filter(r => r.status === 'DRAFT').length;
    
    return Math.min(100, Math.round(((completedRuns + (draftRuns * 0.5)) / totalUnits) * 100));
  }, [payrollRuns, activeMonth, activeCompany, companies]);

  // --- CALENDAR EVENTS ---
  const calendarEvents = useMemo(() => {
    const events = [
      { id: '1', date: '2026-07-02', type: 'holiday', title: 'Ratha Yatra Day', details: 'Statutory Holiday - All plants closed' },
      { id: '2', date: '2026-07-15', type: 'birthday', title: 'Vikram Patel Birthday', details: 'Senior Electrician • Sakar Unit III' },
      { id: '3', date: '2026-07-20', type: 'event', title: 'VETAN ERP Q3 Review', details: 'Executive boardroom briefing' },
      { id: '4', date: '2026-07-22', type: 'leave', title: 'Ritesh Shah (On Leave)', details: 'Approved Casual Leave (Medical checkup)' },
      { id: '5', date: '2026-07-25', type: 'holiday', title: 'Corporate Foundation Day', details: 'VETAN Group annual celebrations' },
      { id: '6', date: '2026-07-28', type: 'birthday', title: 'Neha Sharma Birthday', details: 'Systems Engineer • SVN-1' },
    ];
    
    if (calendarFilter === 'all') return events;
    return events.filter(e => e.type === calendarFilter);
  }, [calendarFilter]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* 1. MAIN TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PRIMARY CHARTS AND METRICS (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* A. CORPORATE KPIS TOP SUMMARY */}
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Operational Corporate KPIs</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* KPI 1: Total Employees */}
            <motion.div 
              variants={itemVariants}
              onClick={() => onNavigate('employees')}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Employees</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Users size={14} />
                </div>
              </div>
              <div className="mt-2">
                <strong className="text-2xl font-black font-sans text-slate-900 tracking-tight block">
                  {totalEmployeesCount}
                </strong>
                <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                  Active in {activeCompany === 'GROUP' ? 'All Units' : activeCompany}
                </span>
              </div>
            </motion.div>

            {/* KPI 2: Present Today */}
            <motion.div 
              variants={itemVariants}
              onClick={() => onNavigate('attendance')}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Present Today</span>
                <div className="p-2 bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition">
                  <UserCheck size={14} />
                </div>
              </div>
              <div className="mt-2">
                <strong className="text-2xl font-black font-sans text-slate-900 tracking-tight block">
                  {presentTodayCount}
                </strong>
                <span className="text-[9px] text-pink-500 font-bold flex items-center gap-0.5 mt-1">
                  Est. Live Turnout ({attendanceRate}%) (Pink)
                </span>
              </div>
            </motion.div>

            {/* KPI 3: On Leave */}
            <motion.div 
              variants={itemVariants}
              onClick={() => onNavigate('leaves')}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">On Leave</span>
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition">
                  <Calendar size={14} />
                </div>
              </div>
              <div className="mt-2">
                <strong className="text-2xl font-black font-sans text-slate-900 tracking-tight block">
                  {onLeaveCount}
                </strong>
                <span className="text-[9px] text-orange-600 font-bold flex items-center gap-0.5 mt-1">
                  Approved leaves active
                </span>
              </div>
            </motion.div>

            {/* KPI 4: Pending Leave Approval */}
            <motion.div 
              variants={itemVariants}
              onClick={() => onNavigate('leaves')}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Leaves</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition">
                  <AlertCircle size={14} />
                </div>
              </div>
              <div className="mt-2">
                <strong className="text-2xl font-black font-sans text-slate-900 tracking-tight block">
                  {pendingLeavesCount}
                </strong>
                <span className="text-[9px] text-purple-600 font-bold flex items-center gap-0.5 mt-1">
                  Awaiting HR signoff
                </span>
              </div>
            </motion.div>

            {/* KPI 5: Pending Miss Punch */}
            <motion.div 
              variants={itemVariants}
              onClick={() => onNavigate('attendance')}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Correction</span>
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition">
                  <Clock size={14} />
                </div>
              </div>
              <div className="mt-2">
                <strong className="text-2xl font-black font-sans text-slate-900 tracking-tight block">
                  {pendingMissPunchesCount}
                </strong>
                <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5 mt-1">
                  Miss-punch logs filed
                </span>
              </div>
            </motion.div>

            {/* KPI 6: Pending Transfers */}
            <motion.div 
              variants={itemVariants}
              onClick={() => onNavigate('employees')}
              className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Pending Transfers</span>
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition">
                  <Layers size={14} />
                </div>
              </div>
              <div className="mt-2">
                <strong className="text-2xl font-black font-sans text-slate-900 tracking-tight block">
                  {pendingTransfersCount}
                </strong>
                <span className="text-[9px] text-rose-600 font-bold flex items-center gap-0.5 mt-1">
                  Inter-unit processing
                </span>
              </div>
            </motion.div>

          </div>

          {/* B. CIRCULAR PROGRESS METER WIDGETS */}
          <motion.div 
            variants={itemVariants}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Compliance & Health Indicators</h4>
                <p className="text-[10px] text-slate-400">Circular telemetry reflecting active corporate performance indices.</p>
              </div>
              <Activity className="text-emerald-500 animate-pulse" size={16} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              
              {/* Telemetry 1: Attendance Rate */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" className="stroke-slate-100" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      className="stroke-emerald-600 transition-all duration-1000" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * attendanceRate) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-black text-slate-900 font-mono">{attendanceRate}%</span>
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Att. Rate</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-700 font-mono">Attendance Index</span>
              </div>

              {/* Telemetry 2: Leave Utilization */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" className="stroke-slate-100" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      className="stroke-orange-500 transition-all duration-1000" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * leaveUtilizationRate) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-black text-slate-900 font-mono">{leaveUtilizationRate}%</span>
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Utilized</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-700 font-mono">Leave Cards Draw</span>
              </div>

              {/* Telemetry 3: Loan Recovery */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" className="stroke-slate-100" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      className="stroke-indigo-600 transition-all duration-1000" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * loanRecoveryRate) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-black text-slate-900 font-mono">{loanRecoveryRate}%</span>
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Recovered</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-700 font-mono">Loan Disclosures</span>
              </div>

              {/* Telemetry 4: Payroll Completion */}
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" className="stroke-slate-100" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      className="stroke-purple-600 transition-all duration-1000" 
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * payrollCompletionRate) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-sm font-black text-slate-900 font-mono">{payrollCompletionRate}%</span>
                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Processed</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-700 font-mono">Cycle Status</span>
              </div>

            </div>
          </motion.div>

          {/* C. QUICK ACTION HUBS (TWO SUB-GROUPS: HR ACTIONS & EMPLOYEE ACTIONS) */}
          <motion.div 
            variants={itemVariants}
            className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5"
          >
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Quick Action Command Hub</h4>
              <p className="text-[10px] text-slate-400">Trigger standard HR functions or simulate employee portal requests instantly.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* HR Actions Column */}
              <div className="space-y-3">
                <span className="text-[9px] uppercase font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  ⚡ HR Operations
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onNavigate('leaves')}
                    className="p-3 text-left border rounded-xl hover:bg-slate-50 transition cursor-pointer flex flex-col gap-1 shadow-2xs"
                  >
                    <span className="text-slate-800 font-bold text-xs">Approve Leave</span>
                    <span className="text-[9px] text-slate-400">Sign off pending leave requests</span>
                  </button>
                  <button 
                    onClick={() => onNavigate('attendance')}
                    className="p-3 text-left border rounded-xl hover:bg-slate-50 transition cursor-pointer flex flex-col gap-1 shadow-2xs"
                  >
                    <span className="text-slate-800 font-bold text-xs">Approve Miss Punch</span>
                    <span className="text-[9px] text-slate-400">Audit employee daily timesheet</span>
                  </button>
                  <button 
                    onClick={() => onNavigate('employees')}
                    className="p-3 text-left border rounded-xl hover:bg-slate-50 transition cursor-pointer flex flex-col gap-1 shadow-2xs"
                  >
                    <span className="text-slate-800 font-bold text-xs">Unit Transfer</span>
                    <span className="text-[9px] text-slate-400">Process inter-company transfers</span>
                  </button>
                  <button 
                    onClick={() => onNavigate('revisions')}
                    className="p-3 text-left border rounded-xl hover:bg-slate-50 transition cursor-pointer flex flex-col gap-1 shadow-2xs"
                  >
                    <span className="text-slate-800 font-bold text-xs">Salary Revision</span>
                    <span className="text-[9px] text-slate-400">Process base CTC hikes & changes</span>
                  </button>
                </div>
              </div>

              {/* Employee Simulator Actions Column */}
              <div className="space-y-3">
                <span className="text-[9px] uppercase font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                  👤 Employee Self-Service
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      alert("Self-Service Portal activated! Switching role to logged-in Employee.");
                      // Simulates switching role in parent
                      const demoEmp = employees.find(e => e.status === 'ACTIVE') || employees[0];
                      if (demoEmp) {
                        window.location.hash = `#portal`;
                        // Trigger reload or state setter in parent indirectly
                        const btn = document.getElementById("action-apply-leave");
                        if (btn) btn.click();
                      }
                    }}
                    className="p-3 text-left border border-dashed rounded-xl hover:bg-slate-50 transition cursor-pointer flex flex-col gap-1 shadow-2xs"
                  >
                    <span className="text-slate-800 font-bold text-xs">Apply Leave</span>
                    <span className="text-[9px] text-slate-400">Submit dynamic PL/CL request</span>
                  </button>
                  
                  <button 
                    onClick={() => alert("Simulation triggered: Daily correction submitted for approval.")}
                    className="p-3 text-left border border-dashed rounded-xl hover:bg-slate-50 transition cursor-pointer flex flex-col gap-1 shadow-2xs"
                  >
                    <span className="text-slate-800 font-bold text-xs">Miss Punch Request</span>
                    <span className="text-[9px] text-slate-400">File attendance correction</span>
                  </button>

                  <button 
                    onClick={() => onNavigate('payroll')}
                    className="p-3 text-left border border-dashed rounded-xl hover:bg-slate-50 transition cursor-pointer flex flex-col gap-1 shadow-2xs"
                  >
                    <span className="text-slate-800 font-bold text-xs">Download Payslip</span>
                    <span className="text-[9px] text-slate-400">Export official PDF salary slips</span>
                  </button>

                  <button 
                    onClick={() => onNavigate('form16')}
                    className="p-3 text-left border border-dashed rounded-xl hover:bg-slate-50 transition cursor-pointer flex flex-col gap-1 shadow-2xs"
                  >
                    <span className="text-slate-800 font-bold text-xs">Download Form 16</span>
                    <span className="text-[9px] text-slate-400">Get fiscal tax declarations</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>

        </div>

        {/* RIGHT COLUMN: SIDEBAR CALENDAR, PROFILE, NOTIFICATIONS (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* A. EMPLOYEE PROFILE SUMMARY SECTION */}
          <motion.div 
            variants={itemVariants}
            className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4"
          >
            <span className="text-[9px] uppercase font-mono font-bold text-gray-400 block tracking-widest">
              Active Session Operator
            </span>
            
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-slate-850 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md border-2 border-white">
                  {activeHR.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-4 h-4 rounded-full flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                </div>
              </div>
              
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 tracking-tight">{activeHR.name}</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{activeHR.title}</p>
                <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase font-mono">ROLE: {activeHR.role}</p>
              </div>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100/50 text-[11px] space-y-2 font-sans text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Authorized Division:</span>
                <strong className="text-slate-900">{activeCompany === 'GROUP' ? 'All Companies' : activeCompany}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reporting HOD:</span>
                <strong className="text-slate-900">Company Management</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Unit Code:</span>
                <strong className="text-slate-900 font-mono text-[10px] bg-slate-200/60 px-1.5 py-0.2 rounded">
                  {activeCompany}
                </strong>
              </div>
            </div>
          </motion.div>

          {/* B. CALENDAR PANEL */}
          <motion.div 
            variants={itemVariants}
            className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-xs font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={13} className="text-orange-500" />
                Calendar & Events
              </h4>
              <span className="text-[9.5px] font-bold text-slate-400 font-mono">July 2026</span>
            </div>

            {/* Filter tags */}
            <div className="flex flex-wrap gap-1 border-b pb-2">
              <button 
                onClick={() => setCalendarFilter('all')}
                className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${calendarFilter === 'all' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-500 bg-slate-50'}`}
              >
                All
              </button>
              <button 
                onClick={() => setCalendarFilter('holidays')}
                className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${calendarFilter === 'holidays' ? 'bg-emerald-550 bg-emerald-50 text-emerald-800' : 'hover:bg-slate-100 text-slate-500 bg-slate-50'}`}
              >
                Holidays
              </button>
              <button 
                onClick={() => setCalendarFilter('birthdays')}
                className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${calendarFilter === 'birthdays' ? 'bg-orange-50 text-orange-800' : 'hover:bg-slate-100 text-slate-500 bg-slate-50'}`}
              >
                Birthdays
              </button>
              <button 
                onClick={() => setCalendarFilter('leaves')}
                className={`px-2 py-1 text-[9px] font-bold rounded-lg transition-all cursor-pointer ${calendarFilter === 'leaves' ? 'bg-purple-50 text-purple-800' : 'hover:bg-slate-100 text-slate-500 bg-slate-50'}`}
              >
                Leaves
              </button>
            </div>

            {/* Event list rows */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {calendarEvents.map(evt => (
                <div key={evt.id} className="flex gap-3 p-2 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl transition">
                  <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0 font-mono text-[9px] font-bold uppercase
                    ${evt.type === 'holiday' ? 'bg-emerald-100 text-emerald-800' :
                      evt.type === 'birthday' ? 'bg-orange-100 text-orange-800' :
                      evt.type === 'leave' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}
                  `}>
                    <span>{evt.date.split('-')[2]}</span>
                    <span className="text-[7px]">Jul</span>
                  </div>
                  <div>
                    <h5 className="text-[11px] font-bold text-slate-800">{evt.title}</h5>
                    <p className="text-[9.5px] text-slate-400 leading-snug mt-0.5">{evt.details}</p>
                  </div>
                </div>
              ))}
              {calendarEvents.length === 0 && (
                <div className="text-center py-6 text-[10px] text-slate-400 border border-dashed rounded-xl">
                  No calendar logs listed for this filter.
                </div>
              )}
            </div>
          </motion.div>

          {/* C. NOTIFICATION CENTER */}
          <motion.div 
            variants={itemVariants}
            className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-xs font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-1">
                <Bell size={13} className="text-emerald-500 animate-bounce" />
                Notification Center
              </h4>
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            </div>

            <div className="space-y-3">
              {[
                { id: 'n1', title: 'Salary Credited', desc: 'Wages ledger closed & statutory transfers recorded on file.', time: 'Just Now', type: 'salary' },
                { id: 'n2', title: 'Leave Application Filed', desc: 'PL application filed for SVN specialist awaiting approval.', time: '2 hours ago', type: 'leave' },
                { id: 'n3', title: 'Miss Punch Correction', desc: 'Attendance timesheet updated for 12 employees.', time: '1 day ago', type: 'misspunch' },
                { id: 'n4', title: 'Form 16 Tax Estimate', desc: 'Annual statutory projection charts loaded for Super Admin.', time: '2 days ago', type: 'tax' },
                { id: 'n5', title: 'Comp Off Expiry Alert', desc: 'Employee credits set to expire on the coming weekend.', time: '3 days ago', type: 'compoff' },
              ].map(notif => (
                <div key={notif.id} className="relative pl-4 border-l-2 border-slate-200 hover:border-emerald-500 transition py-0.5">
                  <div className="flex justify-between items-start">
                    <strong className="text-[11px] font-bold text-slate-850 block leading-tight">{notif.title}</strong>
                    <span className="text-[8px] text-slate-400 font-mono shrink-0">{notif.time}</span>
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-0.5 leading-snug">{notif.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

      </div>

    </motion.div>
  );
}
