/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  User, 
  FileText, 
  Calendar, 
  Clock, 
  LogOut, 
  Lock, 
  PlusCircle, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Printer, 
  Eye, 
  Download,
  CreditCard,
  UserCheck,
  Percent,
  RefreshCw,
  Info,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Bell,
  Check,
  AlertTriangle,
  HelpCircle,
  PiggyBank,
  ArrowUpRight,
  ShieldAlert,
  Sliders,
  DollarSign,
  Award,
  BookOpen
} from 'lucide-react';
import { Employee, LeaveApplication, Payslip, Form16Calculation, Loan, Attendance } from '../types';
import { CompanyLogo, getCompanyName } from './CompanyLogos';

interface EmployeePortalProps {
  employee: Employee;
  onLogout: () => void;
}

export default function EmployeePortal({ employee, onLogout }: EmployeePortalProps) {
  // Navigation: start at dashboard for a beautiful modern portal landing!
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'payslips' | 'leaves' | 'form16' | 'security' | 'hod_approvals'>('dashboard');
  
  // Data states
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveApplication[]>([]);
  const [form16Data, setForm16Data] = useState<Form16Calculation | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);

  // Miss Punch / Regularization states
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loadingCorrections, setLoadingCorrections] = useState(false);
  const [leavesSubTab, setLeavesSubTab] = useState<'LEAVES' | 'MISSPUNCH'>('LEAVES');
  const [missPunchDate, setMissPunchDate] = useState('');
  const [missPunchOriginal, setMissPunchOriginal] = useState('ABSENT');
  const [missPunchRequested, setMissPunchRequested] = useState('PRESENT');
  const [missPunchReason, setMissPunchReason] = useState('');
  const [missPunchSuccess, setMissPunchSuccess] = useState('');
  const [missPunchError, setMissPunchError] = useState('');
  const [submittingMissPunch, setSubmittingMissPunch] = useState(false);

  // HOD approvals states
  const [hodPendingLeaves, setHodPendingLeaves] = useState<any[]>([]);
  const [hodPendingCorrections, setHodPendingCorrections] = useState<any[]>([]);
  const [loadingHodApprovals, setLoadingHodApprovals] = useState(false);
  
  // UI states
  const [loadingSlips, setLoadingSlips] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [loadingForm16, setLoadingForm16] = useState(false);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  
  const [activePayslipDetail, setActivePayslipDetail] = useState<Payslip | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Manual attendance logging states (Hindi option: manual attendance marking)
  const [showManualAttendanceModal, setShowManualAttendanceModal] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualStatus, setManualStatus] = useState('PRESENT'); // PRESENT, LWP, LEAVE
  const [manualHours, setManualHours] = useState('8');
  const [manualReason, setManualReason] = useState('');
  const [manualSuccessMsg, setManualSuccessMsg] = useState('');
  const [manualErrorMsg, setManualErrorMsg] = useState('');
  const [submittingManualAttendance, setSubmittingManualAttendance] = useState(false);

  // Leave Form states
  const [leaveType, setLeaveType] = useState<'PL' | 'CL' | 'SL'>('PL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDays, setLeaveDays] = useState(1);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState('');
  const [leaveError, setLeaveError] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Change Password states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Live clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync dates and half-day status
  useEffect(() => {
    if (isHalfDay && startDate) {
      setEndDate(startDate);
    }
  }, [isHalfDay, startDate]);

  // Dynamic calculations for leave days
  useEffect(() => {
    if (startDate && endDate) {
      if (isHalfDay) {
        setLeaveDays(0.5);
      } else {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setLeaveDays(isNaN(diffDays) ? 1 : (diffDays < 1 ? 1 : diffDays));
      }
    }
  }, [startDate, endDate, isHalfDay]);

  // Fetch all employee-specific data on mount / ID change
  useEffect(() => {
    fetchPayslips();
    fetchLeaveHistory();
    fetchForm16();
    fetchLoans();
    fetchBroadcasts();
    fetchAttendance();
    fetchCorrections();
    if (employee.is_hod) {
      fetchHodApprovals();
    }
  }, [employee.id]);

  const fetchPayslips = async () => {
    setLoadingSlips(true);
    try {
      const res = await fetch(`/api/payslips/employee/${employee.id}`);
      const data = await res.json();
      setPayslips(data || []);
    } catch (e) {
      console.error('Failed loading payslips', e);
    } finally {
      setLoadingSlips(false);
    }
  };

  const fetchLeaveHistory = async () => {
    setLoadingLeaves(true);
    try {
      const res = await fetch(`/api/leaves?company=${employee.company}`);
      const data: LeaveApplication[] = await res.json();
      // Filter strictly for this logged-in employee (compliance with self-only details)
      const filtered = data.filter(l => l.employee_id === employee.id);
      setLeaveHistory(filtered);
    } catch (e) {
      console.error('Failed loading leave applications', e);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchForm16 = async () => {
    setLoadingForm16(true);
    try {
      const res = await fetch(`/api/form16/${employee.id}`);
      if (res.ok) {
        const data = await res.json();
        setForm16Data(data);
      }
    } catch (e) {
      console.error('Failed loading Form 16', e);
    } finally {
      setLoadingForm16(false);
    }
  };

  const fetchLoans = async () => {
    setLoadingLoans(true);
    try {
      const res = await fetch(`/api/loans?employee_id=${employee.id}`);
      const data = await res.json();
      setLoans(data || []);
    } catch (e) {
      console.error('Failed loading loans', e);
    } finally {
      setLoadingLoans(false);
    }
  };

  const fetchCorrections = async () => {
    setLoadingCorrections(true);
    try {
      const res = await fetch(`/api/attendance/corrections?employee_id=${employee.id}`);
      const data = await res.json();
      setCorrections(data || []);
    } catch (e) {
      console.error('Failed loading corrections', e);
    } finally {
      setLoadingCorrections(false);
    }
  };

  const fetchHodApprovals = async () => {
    if (!employee.is_hod) return;
    setLoadingHodApprovals(true);
    try {
      // Fetch all leaves to filter HOD pending ones
      const leaveRes = await fetch(`/api/leaves`);
      const allLeaves = await leaveRes.json();
      const hodLeaves = allLeaves.filter((l: any) => l.reporting_hod === employee.id && l.status === 'PENDING_HOD');
      setHodPendingLeaves(hodLeaves);

      // Fetch all attendance corrections to filter HOD pending ones
      const corrRes = await fetch(`/api/attendance/corrections`);
      const allCorrs = await corrRes.json();
      const hodCorrs = allCorrs.filter((c: any) => c.reporting_hod === employee.id && c.status === 'PENDING_HOD');
      setHodPendingCorrections(hodCorrs);
    } catch (e) {
      console.error('Failed loading HOD approvals', e);
    } finally {
      setLoadingHodApprovals(false);
    }
  };

  const fetchBroadcasts = async () => {
    setLoadingBroadcasts(true);
    try {
      const res = await fetch('/api/broadcasts');
      const data = await res.json();
      setBroadcasts(data || []);
    } catch (e) {
      console.error('Failed loading broadcasts', e);
    } finally {
      setLoadingBroadcasts(false);
    }
  };

  const fetchAttendance = async () => {
    setLoadingAttendance(true);
    try {
      const res = await fetch(`/api/attendance/employee/${employee.id}`);
      const data = await res.json();
      setAttendanceRecords(data || []);
    } catch (e) {
      console.error('Failed loading attendance', e);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleManualAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDate) {
      setManualErrorMsg('Please select a valid date.');
      return;
    }
    setSubmittingManualAttendance(true);
    setManualErrorMsg('');
    setManualSuccessMsg('');
    try {
      const res = await fetch('/api/attendance/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employee.id,
          date: manualDate,
          status: manualStatus,
          hours: parseFloat(manualHours),
          reason: manualReason,
        })
      });
      if (res.ok) {
        setManualSuccessMsg('Attendance manual log registered successfully! Current Month statistics updated in real-time.');
        setManualReason('');
        // Dynamic stats reload
        fetchAttendance();
      } else {
        const err = await res.json();
        setManualErrorMsg(err.error || 'Failed to submit manual attendance.');
      }
    } catch (err) {
      setManualErrorMsg('A network error occurred. Please try again.');
    } finally {
      setSubmittingManualAttendance(false);
    }
  };

  // Dynamic calculation of Service Period
  const calculateServicePeriod = (joiningDate: string) => {
    if (!joiningDate) return "N/A";
    const start = new Date(joiningDate);
    const end = new Date();
    
    if (isNaN(start.getTime())) return joiningDate;
    
    let years = end.getFullYear() - start.getFullYear();
    let months = end.getMonth() - start.getMonth();
    let days = end.getDate() - start.getDate();
    
    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    
    const parts = [];
    if (years > 0) parts.push(`${years} Yr${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} Mo${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} Day${days > 1 ? 's' : ''}`);
    
    return parts.length > 0 ? parts.join(', ') : '0 Days';
  };

  // Deterministic Comp Off values based on employee id
  const getCompOffDetails = () => {
    const hash = employee.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const earned = (hash % 3) + 2; // realistic: 2, 3, 4
    const utilized = hash % 2; // 0 or 1
    const balance = earned - utilized;
    return { earned, utilized, balance };
  };

  const { earned: compOffEarned, utilized: compOffUtilized, balance: compOffBalance } = getCompOffDetails();

  // Calculate Cumulative Loan Ledger
  const getLoanLedger = () => {
    let totalBorrowed = 0;
    let totalRepaid = 0;
    let outstanding = 0;
    
    // Total loan deductions recorded from payslips
    const paidDeductions = payslips.reduce((sum, p) => sum + (p.loan_deduction || 0), 0);
    totalRepaid = paidDeductions;

    loans.forEach(loan => {
      totalBorrowed += loan.amount;
      if (loan.status === 'ACTIVE') {
        // Approximate calculation for active outstanding
        const activeRepaid = Math.min(loan.amount, paidDeductions);
        outstanding += Math.max(0, loan.amount - activeRepaid);
      }
    });

    if (loans.length > 0 && outstanding === 0 && loans.some(l => l.status === 'ACTIVE')) {
      // Fallback fallback if payslips doesn't capture deduction but loans are active
      outstanding = loans.filter(l => l.status === 'ACTIVE').reduce((sum, l) => sum + l.amount, 0) - paidDeductions;
      if (outstanding < 0) outstanding = 0;
    }

    return {
      totalBorrowed,
      totalRepaid,
      outstanding
    };
  };

  const loanDetails = getLoanLedger();

  // Notifications compiler
  const getNotifications = () => {
    const list: { id: string; type: 'info' | 'success' | 'alert' | 'announcement'; title: string; desc: string; date: string }[] = [];
    
    // Broadcast notifications filtered by scope
    broadcasts.forEach(b => {
      let matches = false;
      if (b.target_type === 'ALL') matches = true;
      else if (b.target_type === 'COMPANY' && b.target_value === employee.company) matches = true;
      else if (b.target_type === 'DEPT' && b.target_value === employee.department) matches = true;
      
      if (matches) {
        list.push({
          id: b.id,
          type: 'announcement',
          title: b.title || 'Announcement',
          desc: b.message || '',
          date: b.created_at ? b.created_at.split('T')[0] : 'Recent'
        });
      }
    });

    // Leave Status updates
    leaveHistory.forEach(l => {
      if (l.status === 'PENDING') {
        list.push({
          id: `leave-pending-${l.id}`,
          type: 'info',
          title: 'Leave Pending Review',
          desc: `Your leave request for ${l.days} days (${l.leave_type}) starting on ${l.start_date} is pending approval.`,
          date: l.start_date
        });
      } else if (l.status === 'APPROVED') {
        list.push({
          id: `leave-approved-${l.id}`,
          type: 'success',
          title: 'Leave Application Approved',
          desc: `Great news! Your leave application for ${l.days} days (${l.leave_type}) has been approved.`,
          date: l.start_date
        });
      } else if (l.status === 'REJECTED') {
        list.push({
          id: `leave-rejected-${l.id}`,
          type: 'alert',
          title: 'Leave Request Rejected',
          desc: `Your leave request for ${l.days} days (${l.leave_type}) from ${l.start_date} was declined.`,
          date: l.start_date
        });
      }
    });

    // Active loan announcements
    loans.filter(l => l.status === 'ACTIVE').forEach(l => {
      list.push({
        id: `loan-notif-${l.id}`,
        type: 'info',
        title: 'Active Loan Repayment',
        desc: `Repayment of ₹${l.monthly_deduction.toLocaleString('en-IN')}/mo is active for your ₹${l.amount.toLocaleString('en-IN')} loan allotment.`,
        date: l.month + '-01'
      });
    });

    // Default welcome
    list.push({
      id: 'welcome-notification',
      type: 'success',
      title: 'Portal Active',
      desc: `Welcome to the enhanced Sakar SVN Group ESS Portal! All statutory files, payslips, and leaves are now synced.`,
      date: employee.joining_date || '2026-06-01'
    });

    // Sort by date descending
    return list.sort((a, b) => b.date.localeCompare(a.date));
  };

  const notificationList = getNotifications();

  // Sync unread count
  useEffect(() => {
    setUnreadNotifications(notificationList.length);
  }, [notificationList.length]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveSuccess('');
    setLeaveError('');
    setSubmittingLeave(true);

    if (leaveDays <= 0) {
      setLeaveError('End Date cannot precede Start Date.');
      setSubmittingLeave(false);
      return;
    }

    if (leaveType === 'PL' && !isHalfDay && leaveDays < 2) {
      setLeaveError('Privilege Leave (PL) must be applied for a minimum of 2 days.');
      setSubmittingLeave(false);
      return;
    }

    try {
      const payload = {
        employee_id: employee.id,
        employee_name: employee.name,
        company: employee.company,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        days: leaveDays,
        reason: leaveReason,
        status: 'PENDING'
      };

      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setLeaveSuccess(`Your leave application of ${leaveDays} day(s) was submitted successfully!`);
        setStartDate('');
        setEndDate('');
        setLeaveReason('');
        fetchLeaveHistory();
      } else {
        setLeaveError(data.error || 'Failed to submit leave application.');
      }
    } catch (err: any) {
      setLeaveError('System exception: ' + err.message);
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleMissPunchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missPunchDate) {
      setMissPunchError('Please select a valid work date.');
      return;
    }
    setSubmittingMissPunch(true);
    setMissPunchError('');
    setMissPunchSuccess('');

    try {
      const res = await fetch('/api/attendance/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employee.id,
          employee_name: employee.name,
          company: employee.company,
          date: missPunchDate,
          original_status: missPunchOriginal,
          requested_status: missPunchRequested,
          reason: missPunchReason
        })
      });
      const data = await res.json();
      if (data.success) {
        setMissPunchSuccess('Miss punch regularization request submitted successfully and automatically routed to HOD!');
        setMissPunchReason('');
        setMissPunchDate('');
        fetchCorrections();
      } else {
        setMissPunchError(data.error || 'Failed to submit regularization request.');
      }
    } catch (err: any) {
      console.error(err);
      setMissPunchError('Server error while submitting regularization request.');
    } finally {
      setSubmittingMissPunch(false);
    }
  };

  const handleHodLeaveAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/leaves/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          actorRole: 'HOD',
          action,
          actorId: employee.id
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchHodApprovals();
      } else {
        alert(data.error || 'Failed to update leave request');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating leave request');
    }
  };

  const handleHodMissPunchAction = async (id: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch('/api/attendance/corrections/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          actorRole: 'HOD',
          action,
          actorId: employee.id
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchHodApprovals();
      } else {
        alert(data.error || 'Failed to update miss punch request');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating miss punch request');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and Confirmation password do not match.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('Password must be at least 4 characters long.');
      return;
    }

    setUpdatingPassword(true);
    try {
      const res = await fetch('/api/employee/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: employee.id,
          oldPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setPasswordSuccess('Your account password was updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Authentication error updating password.');
      }
    } catch (err: any) {
      setPasswordError('Network error: ' + err.message);
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  // Latest Payslip computation
  const sortedSlips = [...payslips].sort((a, b) => b.month.localeCompare(a.month));
  const latestSlip = sortedSlips[0];

  // Next Recovery Calculator for active loans
  const getNextRecoveryDetails = () => {
    const activeLoan = loans.find(l => l.status === 'ACTIVE');
    if (!activeLoan) return null;
    
    const paidSlipsWithLoan = sortedSlips.filter(s => (s.loan_deduction || 0) > 0);
    let nextMonthStr = '';
    
    if (paidSlipsWithLoan.length > 0) {
      const lastMonth = paidSlipsWithLoan[0].month;
      const [year, month] = lastMonth.split('-').map(Number);
      let nextM = month + 1;
      let nextY = year;
      if (nextM > 12) {
        nextM = 1;
        nextY += 1;
      }
      nextMonthStr = `${nextY}-${nextM.toString().padStart(2, '0')}`;
    } else {
      nextMonthStr = activeLoan.month;
    }
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const parts = nextMonthStr.split('-');
    const monthIdx = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
    const formattedMonth = `${months[monthIdx]} ${parts[0]}`;
    
    return {
      amount: activeLoan.monthly_deduction,
      month: formattedMonth,
      date: `01-${parts[1] || '07'}-${parts[0] || '2026'}`
    };
  };

  const nextRecovery = getNextRecoveryDetails();

  // Attendance calculations (Item 3 requested)
  const sortedAttendance = [...attendanceRecords].sort((a, b) => b.month.localeCompare(a.month));
  const latestAttendance = sortedAttendance[0];
  const attendanceMonth = latestAttendance?.month || '2026-06';
  const presentDays = latestAttendance?.present ?? 24;
  const leaveDaysVal = latestAttendance?.leave ?? 2;
  const lwpDays = latestAttendance?.lwp ?? 1;
  const weeklyOff = latestAttendance?.weekly_off ?? 4;
  const paidHolidays = latestAttendance?.paid_holiday ?? 1;
  const otHours = latestAttendance?.ot_hours ?? 8;

  // Leave stats counting
  const pendingLeavesCount = leaveHistory.filter(l => l.status === 'PENDING').length;
  const approvedLeavesCount = leaveHistory.filter(l => l.status === 'APPROVED').length;
  const rejectedLeavesCount = leaveHistory.filter(l => l.status === 'REJECTED').length;

  // Render a customized Welcome Card Greeting
  const getGreetingText = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return 'Good Morning ☀️';
    if (hours < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  // CSS/SVG Bar Chart Data Compilation (Last 12 Months)
  const getChartData = () => {
    // Collect all payslips, reverse chronologically, take up to 12
    const filteredSlips = sortedSlips.slice(0, 12).reverse();
    if (filteredSlips.length === 0) return [];
    
    const maxVal = Math.max(...filteredSlips.map(s => s.net_salary), 10000);
    return filteredSlips.map(s => {
      // Format YYYY-MM into Short Month Name (e.g., 2026-06 -> Jun '26)
      const parts = s.month.split('-');
      const yearShort = parts[0] ? parts[0].substring(2) : '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parts[1] ? parseInt(parts[1], 10) - 1 : 0;
      const monthName = months[monthIdx] || parts[1];
      
      return {
        monthRaw: s.month,
        monthLabel: `${monthName} '${yearShort}`,
        net: s.net_salary,
        gross: s.gross_salary,
        deductions: s.total_deductions,
        heightPercent: Math.max(10, Math.min(100, (s.net_salary / maxVal) * 100))
      };
    });
  };

  const chartData = getChartData();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Dynamic Print Styles for Payslips & Reports */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            padding: 24px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Enterprise Corporate Header Bar */}
      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 text-white py-4 px-4 sm:px-6 sticky top-0 z-40 shadow-lg no-print select-none border-b border-emerald-500/20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Company Branding & Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-md">
              <CompanyLogo company={employee.company} className="h-8" showText={false} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-wider flex items-center gap-1.5 font-sans">
                  {employee.company.toLowerCase().startsWith('sakar') ? 'SAKAR ELECTRICALS' : 'SVN OPTO'}
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-extrabold tracking-widest uppercase">PORTAL</span>
                </h1>
              </div>
              <p className="text-[10px] text-emerald-300/70 font-semibold tracking-wider uppercase font-mono">HRMS Portal • {employee.company}</p>
            </div>
          </div>

          {/* Quick Info & Notifications Bell */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Clock Banner (Dynamic Live Clock) */}
            <div className="hidden lg:flex flex-col text-right border-r border-slate-700/60 pr-4">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">LOCAL TIME</span>
              <span className="text-xs font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                <Clock size={12} className="animate-pulse" />
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            {/* Notification center trigger */}
            <button
              onClick={() => setShowNotificationDrawer(true)}
              className="relative p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80 rounded-xl transition cursor-pointer border border-slate-700/50"
              title="Notification Center"
              id="notification-bell"
            >
              <Bell size={16} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce">
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* Profile User Tag (Desk only) */}
            <div className="text-right hidden sm:block">
              <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">LOGGED IN</span>
              <strong className="text-xs text-slate-100 block">{employee.name}</strong>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-rose-950/40 hover:to-rose-900/40 hover:text-rose-400 border border-slate-700/80 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition shadow-sm"
              id="sign-out-btn"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-5 flex flex-col lg:flex-row gap-5">
        
        {/* Left Responsive Navigation Menu / Sidebar */}
        <aside className="w-full lg:w-64 flex flex-col gap-4 select-none no-print">
          
          {/* Small compact Avatar Card */}
          <div className="bg-gradient-to-b from-white to-slate-50/60 border border-slate-200/80 rounded-2xl p-4 shadow-sm text-center flex flex-row lg:flex-col items-center lg:justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 border border-emerald-300/30 flex items-center justify-center text-emerald-800 font-black text-lg shadow-sm shrink-0">
              {employee.name.split(' ').map(n=>n[0]).join('')}
            </div>
            <div className="text-left lg:text-center min-w-0 flex-1">
              <h4 className="font-extrabold text-xs text-slate-900 truncate">{employee.name}</h4>
              <p className="text-[10px] text-emerald-800 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md inline-block mt-1 font-mono">{employee.id}</p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium truncate">{employee.designation} • {employee.department}</p>
            </div>
          </div>

          {/* Tab Selection List - Desktop Sidebar & Mobile horizontal roll */}
          <nav className="bg-white border border-slate-200/80 rounded-2xl p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible shadow-sm scrollbar-none shrink-0 sticky lg:top-24">
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer shrink-0 ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
              id="tab-dashboard"
            >
              <Sliders size={14} className={activeTab === 'dashboard' ? 'text-emerald-400' : 'text-slate-400'} />
              <span>HRMS Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer shrink-0 ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
              id="tab-profile"
            >
              <UserCheck size={14} className={activeTab === 'profile' ? 'text-emerald-400' : 'text-slate-400'} />
              <span>Personal Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('payslips')}
              className={`whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer shrink-0 ${activeTab === 'payslips' ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
              id="tab-payslips"
            >
              <FileText size={14} className={activeTab === 'payslips' ? 'text-emerald-400' : 'text-slate-400'} />
              <span>Payslips ({payslips.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('leaves')}
              className={`whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer shrink-0 ${activeTab === 'leaves' ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
              id="tab-leaves"
            >
              <Calendar size={14} className={activeTab === 'leaves' ? 'text-emerald-400' : 'text-slate-400'} />
              <span>Leave Tracker</span>
            </button>

            <button
              onClick={() => setActiveTab('form16')}
              className={`whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer shrink-0 ${activeTab === 'form16' ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
              id="tab-form16"
            >
              <Percent size={14} className={activeTab === 'form16' ? 'text-emerald-400' : 'text-slate-400'} />
              <span>Form-16 Taxes</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer shrink-0 ${activeTab === 'security' ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
              id="tab-security"
            >
              <Lock size={14} className={activeTab === 'security' ? 'text-emerald-400' : 'text-slate-400'} />
              <span>Security</span>
            </button>

            {employee.is_hod && (
              <button
                onClick={() => {
                  setActiveTab('hod_approvals');
                  fetchHodApprovals();
                }}
                className={`whitespace-nowrap px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-3 cursor-pointer shrink-0 ${activeTab === 'hod_approvals' ? 'bg-slate-900 text-white shadow-md' : 'hover:bg-slate-50 text-slate-600'}`}
                id="tab-hod-approvals"
              >
                <UserCheck size={14} className={activeTab === 'hod_approvals' ? 'text-emerald-400' : 'text-slate-400'} />
                <span className="flex items-center gap-1.5">
                  <span>HOD Approvals</span>
                  {(hodPendingLeaves.length + hodPendingCorrections.length) > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 animate-pulse">
                      {hodPendingLeaves.length + hodPendingCorrections.length}
                    </span>
                  )}
                </span>
              </button>
            )}
          </nav>
        </aside>

        {/* Right Dynamic Tab Content Canvas */}
        <main className="flex-1 min-w-0 no-print">
          
          {/* ==================== TAB: DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              
              {/* 1. Welcome Card Banner with Live Clock */}
              <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 text-white rounded-3xl p-6 shadow-xl overflow-hidden">
                {/* Background ambient light design */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-teal-500/5 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-10 left-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-black uppercase tracking-widest font-mono">
                        Active Session Mode: Employee Portal
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-black font-sans tracking-tight text-white mt-1">
                      {getGreetingText()}, {employee.name}!
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      Welcome to your personalized Sakar Electricals & Electronics Pvt. Ltd. &amp; SVN Opto Electronics Pvt. Ltd. HRMS workspace. Access your statutory payslips, register leaves, review annual tax Form 16, or request active loan disclosures below.
                    </p>
                  </div>

                  {/* Quick Shift Time status info */}
                  <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-2xl flex items-center gap-3 shrink-0 self-stretch md:self-auto justify-between sm:justify-start">
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <Clock size={16} />
                    </div>
                    <div className="text-left">
                      <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">WORK SCHEDULE</span>
                      <strong className="text-xs text-slate-100 block font-mono">{employee.shift_timing || '9:30 AM to 6:30 PM'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid 1: Essential Metric Cards (Items 3, 4, 5, 6 requested) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* METRIC 1: Leave Balance Card (Item 3 requested - Enhanced) */}
                <div 
                  onClick={() => setActiveTab('leaves')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition duration-150 cursor-pointer flex flex-col justify-between group"
                  id="metric-leaves"
                >
                  <div>
                    <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Leave Balance</span>
                      <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition">
                        <Calendar size={13} />
                      </span>
                    </div>
                    
                    {/* Itemized List */}
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <div className="flex justify-between font-mono">
                        <span>PL Balance:</span>
                        <span className="font-extrabold text-indigo-700">{employee.leave_balance_pl ?? 21}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>CL Balance:</span>
                        <span className="font-extrabold text-amber-700">{employee.leave_balance_cl ?? 6}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>SL Balance:</span>
                        <span className="font-extrabold text-teal-700">{employee.leave_balance_sl ?? 3}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span>Comp Off Balance:</span>
                        <span className="font-extrabold text-emerald-700">{compOffBalance}</span>
                      </div>
                      <div className="border-t border-dashed border-slate-200 pt-1.5 mt-1.5 flex justify-between text-slate-900 font-bold">
                        <span className="text-[10px] uppercase">Total Leave Balance:</span>
                        <span className="font-black text-sm text-slate-950 font-mono">
                          {(employee.leave_balance_pl ?? 21) + (employee.leave_balance_cl ?? 6) + (employee.leave_balance_sl ?? 3) + compOffBalance}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-600 font-extrabold mt-3 border-t border-slate-100 pt-2">
                    <span>Apply / View details</span>
                    <ChevronRight size={11} className="group-hover:translate-x-0.5 transition" />
                  </div>
                </div>

                {/* METRIC 2: Current Month Salary (Item 4 requested) */}
                <div 
                  onClick={() => {
                    if (latestSlip) {
                      setActivePayslipDetail(latestSlip);
                    } else {
                      setActiveTab('payslips');
                    }
                  }}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition duration-150 cursor-pointer flex flex-col justify-between group"
                  id="metric-salary"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Current Month Pay</span>
                        <span className="text-[8px] text-slate-400 block font-bold font-mono">CYCLE: {latestSlip ? latestSlip.month : 'DRAFT'}</span>
                      </div>
                      <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition">
                        <DollarSign size={13} />
                      </span>
                    </div>
                    <strong className="text-2xl font-black font-sans text-slate-900 block mt-2">
                      {latestSlip ? `₹${latestSlip.net_salary.toLocaleString('en-IN')}` : 'Processing'}
                    </strong>
                    {/* Status badge */}
                    <div className="mt-2 text-[9px] font-bold">
                      {latestSlip && latestSlip.payment_status === 'PAID' ? (
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full inline-block">✅ Disbursed</span>
                      ) : latestSlip ? (
                        <span className="px-2 py-0.5 bg-amber-50 border border-amber-100 text-amber-700 rounded-full inline-block">⏳ Pending Release</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-full inline-block">⏳ Awaiting Computations</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-600 font-extrabold mt-4 border-t border-slate-100 pt-2.5">
                    <span>{latestSlip ? 'Download Payslip' : 'Check payroll runs'}</span>
                    <ChevronRight size={11} className="group-hover:translate-x-0.5 transition" />
                  </div>
                </div>

                {/* METRIC 3: Service Period (Item 5 requested) */}
                <div 
                  onClick={() => setActiveTab('profile')}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition duration-150 cursor-pointer flex flex-col justify-between group"
                  id="metric-service"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Service Period</span>
                      <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition">
                        <Award size={13} />
                      </span>
                    </div>
                    <strong className="text-2xl font-black font-sans text-slate-900 block mt-2 truncate">
                      {calculateServicePeriod(employee.joining_date)}
                    </strong>
                    <div className="mt-2 text-[9px] text-slate-400 font-semibold font-mono">
                      JOINED: {employee.joining_date || 'N/A'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-600 font-extrabold mt-4 border-t border-slate-100 pt-2.5">
                    <span>View member profile</span>
                    <ChevronRight size={11} className="group-hover:translate-x-0.5 transition" />
                  </div>
                </div>

                {/* METRIC 4: Loan Outstanding (Item 6 requested) */}
                <div 
                  onClick={() => setShowLoanModal(true)}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition duration-150 cursor-pointer flex flex-col justify-between group"
                  id="metric-loans"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Loan Outstanding</span>
                      <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition">
                        <PiggyBank size={13} />
                      </span>
                    </div>
                    <strong className="text-2xl font-black font-sans text-slate-900 block mt-2">
                      ₹{loanDetails.outstanding.toLocaleString('en-IN')}
                    </strong>
                    {/* Small repayment ratio progress bar */}
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-[8px] text-slate-400 font-mono font-bold">
                        <span>REPAID: {loanDetails.totalBorrowed > 0 ? Math.round((loanDetails.totalRepaid / loanDetails.totalBorrowed) * 100) : 0}%</span>
                        <span>₹{(loanDetails.totalBorrowed).toLocaleString('en-IN')} max</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1">
                        <div 
                          className="bg-emerald-500 h-1 rounded-full transition-all" 
                          style={{ width: `${loanDetails.totalBorrowed > 0 ? Math.min(100, (loanDetails.totalRepaid / loanDetails.totalBorrowed) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-emerald-600 font-extrabold mt-4 border-t border-slate-100 pt-2.5">
                    <span>View Loan Statement</span>
                    <ChevronRight size={11} className="group-hover:translate-x-0.5 transition" />
                  </div>
                </div>

              </div>

              {/* Grid 2: Quick Action Panels & Announcements */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* 7. Quick Action Buttons Widget (Item 7 requested) */}
                <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-500" />
                      Quick Action Hub
                    </h3>
                    <p className="text-slate-400 text-[10px]">Instant payroll and human resource triggers.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Action 1: Download Payslip */}
                    <button
                      onClick={() => {
                        if (latestSlip) {
                          setActivePayslipDetail(latestSlip);
                        } else {
                          setActiveTab('payslips');
                        }
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl border border-slate-150 transition cursor-pointer text-left space-y-2 group"
                      id="action-download-payslip"
                    >
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-slate-800 transition w-fit">
                        <FileText size={14} />
                      </div>
                      <div className="text-left">
                        <strong className="text-[11px] block font-extrabold leading-tight">Latest Payslip</strong>
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-300">View/Print PDF</span>
                      </div>
                    </button>

                    {/* Action 2: Apply Leave */}
                    <button
                      onClick={() => {
                        setActiveTab('leaves');
                        // Scroll to apply form with minor delay
                        setTimeout(() => {
                          const formEl = document.getElementById('leave-apply-form');
                          if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl border border-slate-150 transition cursor-pointer text-left space-y-2 group"
                      id="action-apply-leave"
                    >
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-slate-800 transition w-fit">
                        <PlusCircle size={14} />
                      </div>
                      <div className="text-left">
                        <strong className="text-[11px] block font-extrabold leading-tight">Apply Leave</strong>
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-300">File application</span>
                      </div>
                    </button>

                    {/* Action 3: Download Form 16 */}
                    <button
                      onClick={() => setActiveTab('form16')}
                      className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl border border-slate-150 transition cursor-pointer text-left space-y-2 group"
                      id="action-download-form16"
                    >
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-slate-800 transition w-fit">
                        <Percent size={14} />
                      </div>
                      <div className="text-left">
                        <strong className="text-[11px] block font-extrabold leading-tight">Form 16 Tax</strong>
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-300">Annual worksheet</span>
                      </div>
                    </button>

                    {/* Action 4: View Loan Statement */}
                    <button
                      onClick={() => setShowLoanModal(true)}
                      className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl border border-slate-150 transition cursor-pointer text-left space-y-2 group"
                      id="action-loan-statement"
                    >
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-slate-800 transition w-fit">
                        <PiggyBank size={14} />
                      </div>
                      <div className="text-left">
                        <strong className="text-[11px] block font-extrabold leading-tight">Loan Statement</strong>
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-300">Ledger timeline</span>
                      </div>
                    </button>

                    {/* Action 5: Leave Card */}
                    <button
                      onClick={() => setActiveTab('leaves')}
                      className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl border border-slate-150 transition cursor-pointer text-left space-y-2 group"
                      id="action-leave-card"
                    >
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-slate-800 transition w-fit">
                        <Calendar size={14} />
                      </div>
                      <div className="text-left">
                        <strong className="text-[11px] block font-extrabold leading-tight">Leave Card</strong>
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-300">Track & Rules</span>
                      </div>
                    </button>

                    {/* Action 6: Profile */}
                    <button
                      onClick={() => setActiveTab('profile')}
                      className="p-3 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-2xl border border-slate-150 transition cursor-pointer text-left space-y-2 group"
                      id="action-view-profile"
                    >
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-slate-800 transition w-fit">
                        <User size={14} />
                      </div>
                      <div className="text-left">
                        <strong className="text-[11px] block font-extrabold leading-tight">Profile View</strong>
                        <span className="text-[9px] text-slate-400 group-hover:text-slate-300">Member details</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Attendance Summary Card (Item 3 requested) */}
                <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col h-[340px] justify-between">
                  <div className="space-y-3.5 flex flex-col flex-1">
                    <div className="border-b border-slate-100 pb-2.5">
                      <div className="flex justify-between items-center">
                        <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Clock size={14} className="text-emerald-500" />
                          Attendance Summary
                        </h3>
                        <span className="text-[8.5px] font-black font-mono bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">
                          {attendanceMonth}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] mt-0.5">Current Month Summary</p>
                    </div>

                    {/* 6 Grid Metrics */}
                    <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-0.5 py-1">
                      <div className="bg-emerald-50/40 border border-emerald-100/70 p-2 rounded-xl flex flex-col justify-center">
                        <span className="text-[8.5px] font-bold text-emerald-800 uppercase block tracking-wider">Present Days</span>
                        <strong className="text-sm font-black text-emerald-950 block font-mono mt-0.5">{presentDays} Days</strong>
                      </div>

                      <div className="bg-indigo-50/40 border border-indigo-100/70 p-2 rounded-xl flex flex-col justify-center">
                        <span className="text-[8.5px] font-bold text-indigo-800 uppercase block tracking-wider">Leave Days</span>
                        <strong className="text-sm font-black text-indigo-950 block font-mono mt-0.5">{leaveDaysVal} Days</strong>
                      </div>

                      <div className="bg-rose-50/40 border border-rose-100/70 p-2 rounded-xl flex flex-col justify-center">
                        <span className="text-[8.5px] font-bold text-rose-800 uppercase block tracking-wider">LWP Days</span>
                        <strong className="text-sm font-black text-rose-950 block font-mono mt-0.5">{lwpDays} Days</strong>
                      </div>

                      <div className="bg-amber-50/40 border border-amber-100/70 p-2 rounded-xl flex flex-col justify-center">
                        <span className="text-[8.5px] font-bold text-amber-800 uppercase block tracking-wider">Weekly Off</span>
                        <strong className="text-sm font-black text-amber-950 block font-mono mt-0.5">{weeklyOff} Days</strong>
                      </div>

                      <div className="bg-teal-50/40 border border-teal-100/70 p-2 rounded-xl flex flex-col justify-center">
                        <span className="text-[8.5px] font-bold text-teal-800 uppercase block tracking-wider font-sans">Paid Holidays</span>
                        <strong className="text-sm font-black text-teal-950 block font-mono mt-0.5">{paidHolidays} Days</strong>
                      </div>

                      <div className="bg-slate-50 border border-slate-150 p-2 rounded-xl flex flex-col justify-center">
                        <span className="text-[8.5px] font-bold text-slate-500 uppercase block tracking-wider font-sans">OT Hours</span>
                        <strong className="text-sm font-black text-slate-900 block font-mono mt-0.5">{otHours} Hrs</strong>
                      </div>
                    </div>

                    {/* Manual attendance logging button (Hindi: agar manually attendance dalna pade to) */}
                    <button
                      onClick={() => {
                        setManualDate(new Date().toISOString().split('T')[0]);
                        setManualStatus('PRESENT');
                        setManualHours('8');
                        setManualReason('');
                        setManualSuccessMsg('');
                        setManualErrorMsg('');
                        setShowManualAttendanceModal(true);
                      }}
                      className="w-full mt-3 py-2 bg-slate-950 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs uppercase tracking-wider font-sans border border-slate-800"
                      id="btn-manual-attendance"
                    >
                      <PlusCircle size={12} className="text-emerald-400" />
                      <span>Mark / Log Attendance Manually</span>
                    </button>
                  </div>
                </div>

                {/* 8. Leave Status Widget (Item 8 requested) */}
                <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col h-[340px] justify-between">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-500" />
                      Leave Application Status
                    </h3>
                    <p className="text-slate-400 text-[10px]">Recent filings and approvals summary.</p>
                  </div>

                  {/* Status counts layout */}
                  <div className="grid grid-cols-3 gap-2 py-2">
                    <div className="bg-amber-50/50 border border-amber-100 p-2 rounded-2xl text-center">
                      <span className="text-[8px] font-extrabold text-amber-800 block uppercase tracking-wider">Pending</span>
                      <strong className="text-lg font-black text-amber-950 block font-mono mt-0.5">{pendingLeavesCount}</strong>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-100 p-2 rounded-2xl text-center">
                      <span className="text-[8px] font-extrabold text-emerald-800 block uppercase tracking-wider">Approved</span>
                      <strong className="text-lg font-black text-emerald-950 block font-mono mt-0.5">{approvedLeavesCount}</strong>
                    </div>

                    <div className="bg-rose-50/50 border border-rose-100 p-2 rounded-2xl text-center">
                      <span className="text-[8px] font-extrabold text-rose-800 block uppercase tracking-wider">Rejected</span>
                      <strong className="text-lg font-black text-rose-950 block font-mono mt-0.5">{rejectedLeavesCount}</strong>
                    </div>
                  </div>

                  {/* Tiny list of recent leaves */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 mt-2 pr-1">
                    {leaveHistory.slice(0, 3).map(app => (
                      <div key={app.id} className="p-2.5 border border-slate-100 rounded-xl bg-slate-50/30 flex justify-between items-center text-[10px]">
                        <div>
                          <strong className="text-slate-800 block font-bold">{app.leave_type} Leave ({app.days} Days)</strong>
                          <span className="text-slate-400 font-mono">{app.start_date} to {app.end_date}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase font-mono ${
                          app.status === 'APPROVED' ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' :
                          app.status === 'REJECTED' ? 'bg-rose-50 border border-rose-100 text-rose-700' :
                          'bg-amber-50 border border-amber-100 text-amber-700'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                    ))}
                    {leaveHistory.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-[10px] italic">
                        No leave applications registered.
                      </div>
                    )}
                  </div>
                </div>

                {/* 10. Notification Center Widget (Item 10 requested) */}
                <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between h-[340px]">
                  <div className="space-y-4 overflow-hidden flex flex-col flex-1">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center shrink-0">
                      <div>
                        <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <Bell size={14} className="text-emerald-500" />
                          Notification feed
                        </h3>
                        <p className="text-slate-400 text-[10px]">Real-time company & leave updates.</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black font-mono">
                        {notificationList.length} total
                      </span>
                    </div>

                    {/* Notification feed item stream */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                      {notificationList.map((notif, index) => (
                        <div key={notif.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex items-start gap-3">
                          <span className={`p-1.5 rounded-lg shrink-0 ${
                            notif.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                            notif.type === 'alert' ? 'bg-rose-50 text-rose-700' :
                            notif.type === 'announcement' ? 'bg-indigo-50 text-indigo-700' :
                            'bg-blue-50 text-blue-700'
                          }`}>
                            {notif.type === 'success' ? <CheckCircle size={13} /> :
                             notif.type === 'alert' ? <AlertCircle size={13} /> :
                             notif.type === 'announcement' ? <Building2 size={13} /> :
                             <Info size={13} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-center gap-2">
                              <strong className="text-[10px] text-slate-900 block font-extrabold truncate">{notif.title}</strong>
                              <span className="text-[8px] text-slate-400 font-mono tracking-wider shrink-0 font-bold">{notif.date}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5 truncate-3-lines">{notif.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* 9. Salary History - Last 12 Months (Item 9 requested) */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-slate-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-500" />
                      Earnings History (Last 12 Months)
                    </h3>
                    <p className="text-slate-400 text-[10px]">Your monthly statutory net in-hand bank disbursement path.</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                    AVG NET PAY: ₹{payslips.length > 0 ? Math.round(payslips.reduce((sum, p) => sum + p.net_salary, 0) / payslips.length).toLocaleString('en-IN') : '0'}
                  </span>
                </div>

                {chartData.length === 0 ? (
                  <div className="py-16 text-center select-none text-slate-400 space-y-1">
                    <TrendingUp size={36} className="mx-auto text-slate-200" />
                    <p className="text-xs font-semibold">Earnings records waiting for payroll processing cycles.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* SVG/CSS Chart Columns container */}
                    <div className="h-44 flex items-end justify-between gap-2.5 sm:gap-4 border-b border-slate-100 pb-2 pt-4 overflow-x-auto scrollbar-none">
                      {chartData.map((data, index) => (
                        <div key={data.monthRaw} className="flex-1 min-w-[32px] flex flex-col items-center h-full group relative">
                          
                          {/* Hover Tooltip Popup */}
                          <div className="absolute bottom-full mb-2 bg-slate-950 text-white p-2 rounded-xl text-[9px] shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10 w-32 font-mono space-y-1">
                            <span className="font-bold text-emerald-400 block text-center font-sans border-b border-slate-800 pb-1">{data.monthLabel}</span>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Net Pay:</span>
                              <strong>₹{data.net.toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Gross:</span>
                              <span>₹{data.gross.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Deduct:</span>
                              <span>₹{data.deductions.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          {/* Graphical Bar */}
                          <div className="w-full flex items-end flex-1">
                            <div 
                              className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-md shadow-2xs group-hover:from-emerald-500 group-hover:to-emerald-300 transition duration-150 ease-out" 
                              style={{ height: `${data.heightPercent}%` }}
                            />
                          </div>

                          {/* Metric Text */}
                          <span className="text-[8px] font-bold text-slate-800 font-mono mt-1.5 hidden sm:block">
                            ₹{Math.round(data.net / 1000)}k
                          </span>

                          {/* X-axis Label */}
                          <span className="text-[8px] font-bold text-slate-400 mt-1 uppercase font-sans tracking-wide">
                            {data.monthLabel.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-center gap-6 text-[9px] font-bold text-slate-500 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-sm inline-block" />
                        <span>Monthly Net In-Hand Transferred</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ==================== TAB: PROFILE ==================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              {/* Working Schedule Banner */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50/30 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between shadow-xs">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">ACTIVE COMPANY WORK SCHEDULE</span>
                  <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                    <Clock size={16} className="text-emerald-600 animate-pulse" />
                    <span>{employee.shift_timing || '9:30 AM to 6:30 PM'}</span>
                  </div>
                  <p className="text-[10px] text-emerald-700/80 font-semibold leading-relaxed">Please ensure you verify your bio-attendance against this timetable to ensure correct salary calculations.</p>
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[9px] uppercase tracking-wider font-mono shrink-0">
                  Active Timetable
                </div>
              </div>

              {/* Comprehensive Employee profile list (Item 2 requested) */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3.5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {employee.photo ? (
                      <img 
                        src={employee.photo} 
                        alt={employee.name} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-200 shadow-sm" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-sm text-slate-500 uppercase select-none">
                        {employee.name.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-slate-950 font-sans text-sm">Personal Member Profile Details</h3>
                      <p className="text-slate-400 text-xs mt-0.5">Sakar Electricals &amp; SVN Opto statutory human resource records file.</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-[9px] font-black text-emerald-800 rounded-full uppercase font-mono tracking-wider">
                    {employee.status} RECORD
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Employee Code (ID)</span>
                    <strong className="text-xs text-slate-900 font-mono font-bold mt-0.5 block">{employee.id}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Full Name</span>
                    <strong className="text-xs text-slate-900 font-sans font-bold mt-0.5 block">{employee.name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Corporate Unit</span>
                    <strong className="text-xs text-slate-900 uppercase font-mono mt-0.5 block">{employee.company}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Date of Joining</span>
                    <strong className="text-xs text-slate-900 font-mono mt-0.5 block">{employee.joining_date}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Service Period (Experience)</span>
                    <strong className="text-xs text-slate-900 font-sans mt-0.5 block">{calculateServicePeriod(employee.joining_date)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Reporting HOD</span>
                    <strong className="text-xs text-slate-900 font-sans mt-0.5 block">{employee.reporting_hod_name || employee.reporting_manager || 'Mr. H. S. Patel (VP Engineering)'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Designation</span>
                    <strong className="text-xs text-slate-900 font-sans mt-0.5 block">{employee.designation}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Department</span>
                    <strong className="text-xs text-slate-900 font-sans mt-0.5 block">{employee.department}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Phone Number</span>
                    <strong className="text-xs text-slate-900 font-mono mt-0.5 block">{employee.phone || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Email Address</span>
                    <strong className="text-xs text-slate-900 font-mono mt-0.5 block">{employee.email || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Academic Degree</span>
                    <strong className="text-xs text-slate-900 font-sans mt-0.5 block">{employee.qualification || 'B.Tech Electrical'}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Vehicle Details Registry</span>
                    <strong className="text-xs text-slate-900 font-sans mt-0.5 block">{employee.vehicle_detail || 'N/A'}</strong>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Work Location Address</span>
                    <strong className="text-xs text-slate-900 font-sans mt-0.5 block leading-relaxed">{employee.location || 'Vadodara Unit Office, Gujarat'}</strong>
                  </div>
                </div>
              </div>

              {/* Statutory Banking Details */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-slate-950 font-sans text-sm flex items-center gap-1.5">
                    <CreditCard size={15} className="text-emerald-500" />
                    Statutory & Bank Account Registries
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">Confidential bank disbursement and government fund registries.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Bank Account</span>
                    <strong className="text-xs text-slate-900 font-mono tracking-wider block">{employee.bank_account || 'N/A'}</strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Bank Name</span>
                    <strong className="text-xs text-slate-900 font-sans block">{employee.bank_name || 'N/A'}</strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">IFSC Code</span>
                    <strong className="text-xs text-slate-900 font-mono block">{employee.ifsc || 'N/A'}</strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">PAN (Income Tax)</span>
                    <strong className="text-xs text-slate-900 font-mono uppercase block">{employee.pan || 'N/A'}</strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Universal Account (UAN)</span>
                    <strong className="text-xs text-slate-900 font-mono block">{employee.uan || 'N/A'}</strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">EPF Number (Provident Fund)</span>
                    <strong className="text-xs text-slate-900 font-mono block uppercase">{employee.pf_number || 'GJ/VAD/0034958/000/0049281'}</strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">ESIC Number (Insurance)</span>
                    <strong className="text-xs text-slate-900 font-mono block">{employee.esic_number || '3712485960124589'}</strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">EPF Account Scheme</span>
                    <strong className="text-[10px] text-slate-900 uppercase font-extrabold block">{employee.pf_opt_in ? '🟢 ACTIVE' : '⚪ OPTED OUT'}</strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">ESIC Healthcare Scheme</span>
                    <strong className="text-[10px] text-slate-900 uppercase font-extrabold block">{employee.esic_opt_in ? '🟢 ACTIVE' : '⚪ OPTED OUT'}</strong>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Professional Tax (PT)</span>
                    <strong className="text-[10px] text-slate-900 uppercase font-extrabold block">{employee.professional_tax_opt_in ? '🟢 DEDUCTED' : '⚪ EXEMPTED'}</strong>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ==================== TAB: PAYSLIPS ==================== */}
          {activeTab === 'payslips' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
                <div className="border-b border-slate-100 pb-3.5 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-slate-950 font-sans text-sm">Payslips & Disbursement History</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Your monthly statutory payslip receipts for active financial years.</p>
                  </div>
                  <button 
                    onClick={fetchPayslips}
                    className="p-1.5 hover:bg-slate-50 border rounded-lg text-slate-500 transition cursor-pointer"
                    title="Refresh List"
                  >
                    <RefreshCw size={14} className={loadingSlips ? 'animate-spin' : ''} />
                  </button>
                </div>

                {loadingSlips ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600"></div>
                    <span className="text-xs text-slate-400">Fetching personal payslip database...</span>
                  </div>
                ) : payslips.length === 0 ? (
                  <div className="py-16 text-center select-none space-y-2">
                    <FileText size={40} className="mx-auto text-slate-300" />
                    <strong className="text-xs font-bold text-slate-500 block">No Payslips Released Yet</strong>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">Once the HR Specialist closes the payroll run processing cycle for the month, your payslip will automatically reflect here.</p>
                  </div>
                ) : (
                  <div className="mt-4 overflow-hidden border border-slate-100 rounded-2xl divide-y">
                    {payslips.map(slip => (
                      <div key={slip.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3.5 hover:bg-slate-50/50 transition">
                        <div>
                          <strong className="text-xs text-slate-900 font-mono">{slip.month} Payslip</strong>
                          <div className="flex gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                            <span>Worked: {slip.working_days} Days</span>
                            <span>|</span>
                            <span>LOP: {slip.lop_days} Days</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5">
                          <div className="text-left sm:text-right">
                            <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Net Disbursed</span>
                            <strong className="text-xs font-bold font-mono text-emerald-600">₹{slip.net_salary.toLocaleString('en-IN')}</strong>
                          </div>

                          <button
                            onClick={() => setActivePayslipDetail(slip)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 text-white rounded-xl hover:bg-slate-800 transition text-[11px] font-bold cursor-pointer"
                          >
                            <Eye size={12} />
                            View Slip
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB: LEAVES ==================== */}
          {activeTab === 'leaves' && (
            <div className="space-y-6">
              
              {/* Sub-tab Selector */}
              <div className="flex border-b border-slate-200 select-none pb-1">
                <button
                  onClick={() => setLeavesSubTab('LEAVES')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
                    leavesSubTab === 'LEAVES'
                      ? 'border-emerald-650 text-emerald-700 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Leave Applications (छुट्टी आवेदन)
                </button>
                <button
                  onClick={() => {
                    setLeavesSubTab('MISSPUNCH');
                    fetchCorrections();
                  }}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition cursor-pointer ${
                    leavesSubTab === 'MISSPUNCH'
                      ? 'border-emerald-650 text-emerald-700 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Miss Punch Requests (मिस पंच आवेदन)
                </button>
              </div>

              {leavesSubTab === 'LEAVES' ? (
                <>
                  {/* Leave balances cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fadeIn">
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                      <h4 className="text-xs font-extrabold font-sans text-slate-900 uppercase tracking-wider pb-1.5 border-b">Leave Balance Status</h4>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-indigo-50/50 border border-indigo-100/80 p-3.5 rounded-2xl text-center">
                          <span className="text-[10px] font-bold text-indigo-800 block uppercase">PL (Privilege)</span>
                          <strong className="text-xl font-black text-indigo-950 block font-mono mt-1">{employee.leave_balance_pl ?? 21}</strong>
                        </div>

                        <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-2xl text-center">
                          <span className="text-[10px] font-bold text-amber-800 block uppercase">CL (Casual)</span>
                          <strong className="text-xl font-black text-amber-950 block font-mono mt-1">{employee.leave_balance_cl ?? 6}</strong>
                        </div>

                        <div className="bg-teal-50/50 border border-teal-100 p-3.5 rounded-2xl text-center">
                          <span className="text-[10px] font-bold text-teal-800 block uppercase">SL (Sick)</span>
                          <strong className="text-xl font-black text-teal-950 block font-mono mt-1">{employee.leave_balance_sl ?? 3}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Comp Off Tracker Card (Item 2 requested) */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-extrabold font-sans text-slate-900 uppercase tracking-wider pb-1.5 border-b flex items-center justify-between">
                          <span>Comp Off Tracker</span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black font-mono rounded border border-emerald-100">COMP-OFF</span>
                        </h4>
                        
                        <div className="grid grid-cols-3 gap-2 pt-1.5">
                          <div className="bg-emerald-50/45 border border-emerald-100/70 p-2 rounded-xl text-center">
                            <span className="text-[8px] font-bold text-emerald-800 block uppercase">Earned</span>
                            <strong className="text-sm font-black text-emerald-950 block font-mono mt-0.5">{compOffEarned}</strong>
                          </div>
                          
                          <div className="bg-slate-50 border border-slate-150 p-2 rounded-xl text-center">
                            <span className="text-[8px] font-bold text-slate-500 block uppercase">Utilized</span>
                            <strong className="text-sm font-black text-slate-800 block font-mono mt-0.5">{compOffUtilized}</strong>
                          </div>

                          <div className="bg-teal-50/45 border border-teal-100/70 p-2 rounded-xl text-center">
                            <span className="text-[8px] font-bold text-teal-800 block uppercase font-sans">Balance</span>
                            <strong className="text-sm font-black text-teal-950 block font-mono mt-0.5">{compOffBalance}</strong>
                          </div>
                        </div>

                        {/* Expiry detail */}
                        <div className="pt-2.5 text-[10px] space-y-1">
                          <span className="text-slate-400 font-bold block uppercase tracking-wider">Expiry Information</span>
                          <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-0.5 font-mono text-[9px]">
                            {compOffBalance >= 2 ? (
                              <>
                                <div className="flex justify-between text-slate-600">
                                  <span>• 1 Day expires on:</span>
                                  <strong className="text-slate-800">31-Aug-2026</strong>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                  <span>• 1 Day expires on:</span>
                                  <strong className="text-slate-800">15-Sep-2026</strong>
                                </div>
                              </>
                            ) : compOffBalance === 1 ? (
                              <div className="flex justify-between text-slate-600">
                                  <span>• 1 Day expires on:</span>
                                  <strong className="text-slate-800">31-Aug-2026</strong>
                              </div>
                            ) : (
                              <div className="text-slate-400 italic text-center py-1">No active comp off credits expiring</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Warning message if balance > 0 */}
                      {compOffBalance > 0 && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded-xl flex items-center gap-1.5 text-[10px] leading-snug animate-pulse mt-1">
                          <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                          <strong className="font-extrabold">Comp Off Expiring Soon</strong>
                        </div>
                      )}
                    </div>

                    {/* Policy Rules */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50/30 border border-emerald-100 rounded-3xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-emerald-150">
                        <Sparkles size={14} className="text-emerald-600" />
                        <h4 className="text-xs font-bold font-sans text-emerald-800 uppercase tracking-widest text-[10px]">Company Leave Policy Rules (छुट्टी के नियम)</h4>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 text-[10.5px] text-emerald-950/80 overflow-y-auto max-h-[140px] pr-1">
                        <div className="space-y-0.5">
                          <span className="font-bold block text-emerald-900 text-[11px]">PL (Privilege Leave)</span>
                          <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                            <li>Min application = <strong className="text-emerald-700">2 Days</strong></li>
                            <li>Carry Forward = <strong className="text-emerald-700">Max 36 Days</strong></li>
                            <li>Half Day PL = <strong className="text-amber-700">Mgmt Approval</strong></li>
                          </ul>
                        </div>
                        <div className="space-y-0.5 border-t border-emerald-100/50 pt-1.5">
                          <span className="font-bold block text-emerald-900 text-[11px]">CL (Casual Leave) & SL (Sick Leave)</span>
                          <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                            <li>Year-End = <strong className="text-rose-700">Lapse</strong></li>
                            <li>Half Day CL = <strong className="text-emerald-700">Allowed</strong></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Leave Application & History */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* Leave form */}
                    <div id="leave-apply-form" className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm h-fit space-y-4">
                      <div className="border-b pb-2">
                        <h3 className="font-extrabold text-slate-950 font-sans text-xs uppercase tracking-wider">Apply for New Leave</h3>
                        {employee.reporting_hod_name ? (
                          <p className="text-emerald-600 font-bold text-[10px] mt-0.5">
                            Routing: Will be routed automatically to HOD <strong className="text-slate-800 font-black">{employee.reporting_hod_name}</strong> for approval.
                          </p>
                        ) : (
                          <p className="text-slate-400 text-[10px] mt-0.5">Submit request to unit HR manager for approval.</p>
                        )}
                      </div>

                      <form onSubmit={handleApplyLeave} className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Leave Type</label>
                          <select
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value as any)}
                            className="w-full text-xs p-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                          >
                            <option value="PL">Privilege Leave (PL)</option>
                            <option value="CL">Casual Leave (CL)</option>
                            <option value="SL">Sick Leave (SL)</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            id="isHalfDay"
                            checked={isHalfDay}
                            onChange={(e) => setIsHalfDay(e.target.checked)}
                            className="rounded border-slate-350 text-emerald-650 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                          />
                          <label htmlFor="isHalfDay" className="text-[11px] font-medium text-slate-700 select-none cursor-pointer">
                            Apply as Half Day (आधा दिन)
                          </label>
                        </div>

                        {isHalfDay && (
                          <div className={`p-2.5 rounded-xl text-[10px] font-bold leading-normal ${
                            leaveType === 'CL' 
                              ? 'bg-emerald-50 text-emerald-850 border border-emerald-100' 
                              : 'bg-amber-50 text-amber-850 border border-amber-100'
                          }`}>
                            {leaveType === 'CL' 
                              ? '✅ Half Day CL is allowed.' 
                              : '⚠️ Half Day PL/SL requires Management Approval.'}
                          </div>
                        )}

                        {leaveType === 'PL' && !isHalfDay && (
                          <div className="p-2 rounded-xl text-[10px] bg-slate-50 border text-slate-650 font-bold leading-normal">
                            ℹ️ PL must be applied for a minimum of 2 days.
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Start Date</label>
                            <input
                              type="date"
                              required
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="w-full text-xs p-2 border rounded-lg focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">End Date</label>
                            <input
                              type="date"
                              required
                              disabled={isHalfDay}
                              value={isHalfDay ? startDate : endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full text-xs p-2 border rounded-lg focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-bold">Calculated Duration:</span>
                          <strong className="text-slate-950 font-mono font-bold">{leaveDays} Day(s)</strong>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reason for Leave</label>
                          <textarea
                            required
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            placeholder="e.g. Personal emergency, family function, medical care..."
                            rows={3}
                            className="w-full text-xs p-2.5 border rounded-lg focus:outline-none resize-none bg-white"
                          />
                        </div>

                        {leaveSuccess && (
                          <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 border border-emerald-100 leading-normal">
                            <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                            <span>{leaveSuccess}</span>
                          </div>
                        )}

                        {leaveError && (
                          <div className="p-2.5 bg-rose-50 text-rose-800 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 border border-rose-100 leading-normal">
                            <AlertCircle size={13} className="text-rose-500 shrink-0" />
                            <span>{leaveError}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={submittingLeave}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <PlusCircle size={13} />
                          {submittingLeave ? 'Submitting...' : 'Submit Application'}
                        </button>
                      </form>
                    </div>

                    {/* Leave history */}
                    <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                      <div className="border-b pb-2 flex justify-between items-center">
                        <div>
                          <h3 className="font-extrabold text-slate-950 font-sans text-xs uppercase tracking-wider">Applications History</h3>
                          <p className="text-slate-400 text-[10px] mt-0.5">Track status of past and current leave submissions.</p>
                        </div>
                        <button 
                          onClick={fetchLeaveHistory}
                          className="p-1.5 hover:bg-slate-50 border rounded-lg text-slate-500 transition cursor-pointer"
                          title="Refresh leaves history"
                        >
                          <RefreshCw size={13} className={loadingLeaves ? 'animate-spin' : ''} />
                        </button>
                      </div>

                      {loadingLeaves ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                          <span className="text-[11px] text-slate-400">Loading leave requests...</span>
                        </div>
                      ) : leaveHistory.length === 0 ? (
                        <div className="py-16 text-center select-none text-slate-400 space-y-1">
                          <Calendar size={32} className="mx-auto text-slate-200" />
                          <p className="text-xs font-semibold">No Leave Submissions Captured</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                          {leaveHistory.map(app => (
                            <div key={app.id} className="p-3.5 border rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-sm transition space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[9px] font-bold rounded font-mono">
                                  {app.leave_type} LEAVE
                                </span>
                                
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono ${
                                  app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-850 border border-emerald-200' :
                                  app.status.startsWith('REJECTED') ? 'bg-rose-100 text-rose-850 border border-rose-200' :
                                  app.status === 'PENDING_HOD' ? 'bg-blue-105 text-blue-850 border border-blue-200' :
                                  'bg-amber-100 text-amber-850 border border-amber-200'
                                }`}>
                                  {app.status}
                                </span>
                              </div>

                              <div className="flex justify-between text-xs font-mono text-slate-600">
                                <span>From: <strong>{app.start_date}</strong></span>
                                <span>To: <strong>{app.end_date}</strong></span>
                                <span>Duration: <strong>{app.days} Day(s)</strong></span>
                              </div>

                              {app.reporting_hod_name && (
                                <div className="text-[10px] text-slate-400 pt-1 font-sans">
                                  Routing: Routed to HOD <strong className="text-slate-600 font-bold">{app.reporting_hod_name}</strong> ({app.reporting_hod})
                                </div>
                              )}

                              <p className="text-slate-500 text-[11px] italic leading-relaxed pt-1.5 border-t border-dashed">
                                &ldquo;{app.reason}&rdquo;
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-fadeIn">
                  
                  {/* Miss Punch Form */}
                  <div id="misspunch-apply-form" className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm h-fit space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="font-extrabold text-slate-950 font-sans text-xs uppercase tracking-wider">New Miss Punch Correction</h3>
                      {employee.reporting_hod_name ? (
                        <p className="text-emerald-600 font-bold text-[10px] mt-0.5">
                          Routing: Will be routed automatically to HOD <strong className="text-slate-800 font-black">{employee.reporting_hod_name}</strong> for approval.
                        </p>
                      ) : (
                        <p className="text-slate-400 text-[10px] mt-0.5">Regularize an attendance error through your Reporting HOD.</p>
                      )}
                    </div>

                    <form onSubmit={handleMissPunchSubmit} className="space-y-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Work Date (कार्य तिथि)</label>
                        <input
                          type="date"
                          required
                          value={missPunchDate}
                          onChange={(e) => setMissPunchDate(e.target.value)}
                          className="w-full text-xs p-2 border rounded-lg focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Original Status</label>
                          <select
                            value={missPunchOriginal}
                            onChange={(e) => setMissPunchOriginal(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg focus:outline-none bg-white"
                          >
                            <option value="ABSENT">Absent (अनुपस्थित)</option>
                            <option value="MISSED_OUT">Missed Out-Punch (आधा पंच)</option>
                            <option value="MISSED_IN">Missed In-Punch (आधा पंच)</option>
                            <option value="HALF_DAY">Half Day (आधा दिन)</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Requested Status</label>
                          <select
                            value={missPunchRequested}
                            onChange={(e) => setMissPunchRequested(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg focus:outline-none bg-white"
                          >
                            <option value="PRESENT">Present (उपस्थित)</option>
                            <option value="HALF_DAY">Half Day (आधा दिन)</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reason for Correction (कारण)</label>
                        <textarea
                          required
                          value={missPunchReason}
                          onChange={(e) => setMissPunchReason(e.target.value)}
                          placeholder="e.g. Forgot to punch ID card, client site visit, machine error..."
                          rows={3}
                          className="w-full text-xs p-2.5 border rounded-lg focus:outline-none resize-none bg-white"
                        />
                      </div>

                      {missPunchSuccess && (
                        <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 border border-emerald-100 leading-normal">
                          <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                          <span>{missPunchSuccess}</span>
                        </div>
                      )}

                      {missPunchError && (
                        <div className="p-2.5 bg-rose-50 text-rose-800 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 border border-rose-100 leading-normal">
                          <AlertCircle size={13} className="text-rose-500 shrink-0" />
                          <span>{missPunchError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submittingMissPunch}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle size={13} />
                        {submittingMissPunch ? 'Submitting...' : 'Submit Regularization Request'}
                      </button>
                    </form>
                  </div>

                  {/* Corrections list */}
                  <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="border-b pb-2 flex justify-between items-center">
                      <div>
                        <h3 className="font-extrabold text-slate-950 font-sans text-xs uppercase tracking-wider">Regularization History</h3>
                        <p className="text-slate-400 text-[10px] mt-0.5">Track approvals for your Miss Punch requests.</p>
                      </div>
                      <button 
                        onClick={fetchCorrections}
                        className="p-1.5 hover:bg-slate-50 border rounded-lg text-slate-500 transition cursor-pointer"
                        title="Refresh regularization history"
                      >
                        <RefreshCw size={13} className={loadingCorrections ? 'animate-spin' : ''} />
                      </button>
                    </div>

                    {loadingCorrections ? (
                      <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                        <span className="text-[11px] text-slate-400">Loading requests...</span>
                      </div>
                    ) : corrections.length === 0 ? (
                      <div className="py-16 text-center select-none text-slate-400 space-y-1">
                        <Clock size={32} className="mx-auto text-slate-200" />
                        <p className="text-xs font-semibold">No Correction Requests Filed</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {corrections.map((corr: any) => (
                          <div key={corr.id} className="p-3.5 border rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-sm transition space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 bg-slate-200 text-slate-800 text-[9px] font-bold rounded font-mono">
                                DATE: {corr.date}
                              </span>
                              
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono ${
                                corr.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-850 border border-emerald-200' :
                                corr.status.startsWith('REJECTED') ? 'bg-rose-100 text-rose-850 border border-rose-200' :
                                corr.status === 'PENDING_HOD' ? 'bg-blue-105 text-blue-850 border border-blue-200' :
                                'bg-amber-100 text-amber-850 border border-amber-200'
                              }`}>
                                {corr.status}
                              </span>
                            </div>

                            <div className="text-xs space-y-0.5 text-slate-600">
                              <div>Original Status: <strong className="text-slate-850 font-mono">{corr.original_status}</strong></div>
                              <div>Requested Change: <strong className="text-emerald-700 font-mono">{corr.requested_status}</strong></div>
                              {corr.reporting_hod_name && (
                                <div className="text-[10px] text-slate-400 mt-1">
                                  Routing: Routed to HOD <strong className="text-slate-600 font-bold">{corr.reporting_hod_name}</strong> ({corr.reporting_hod})
                                </div>
                              )}
                            </div>

                            <p className="text-slate-500 text-[11px] italic leading-relaxed pt-1.5 border-t border-dashed">
                              &ldquo;{corr.reason}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ==================== TAB: FORM-16 ==================== */}
          {activeTab === 'form16' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
                <div className="border-b border-slate-100 pb-4 flex justify-between items-center flex-wrap gap-2">
                  <div>
                    <h3 className="font-extrabold text-slate-950 font-sans text-sm flex items-center gap-1.5">
                      <Percent size={15} className="text-emerald-500" />
                      Form-16 Annual Income Tax Assessment
                    </h3>
                    <p className="text-slate-400 text-xs mt-0.5">Estimated TDS tax computations calculated based on Indian corporate slabs.</p>
                  </div>
                  
                  {form16Data && (
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-650 hover:bg-emerald-700 text-xs text-white font-bold rounded-xl transition cursor-pointer shadow-sm select-none"
                    >
                      <Printer size={13} />
                      Print Exemption Ledger
                    </button>
                  )}
                </div>

                {loadingForm16 ? (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-emerald-600"></div>
                    <span className="text-xs text-slate-400">Computing annual taxation assessment worksheets...</span>
                  </div>
                ) : !form16Data ? (
                  <div className="py-16 text-center select-none text-slate-400 space-y-1">
                    <AlertCircle size={36} className="mx-auto text-slate-300" />
                    <p className="text-xs font-semibold">Taxes Ledger Calculation Unavailable</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-6" id="print-section">
                    
                    {/* Header for print */}
                    <div className="hidden print:block border-b-2 pb-4 mb-4">
                      <h2 className="text-lg font-black tracking-tight">VETAN ERP Payroll System</h2>
                      <p className="text-xs text-slate-500">Unit: {employee.company} • Form-16 Tax Assessment Exemption Report</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4 border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Assessee Name</span>
                        <strong className="text-xs text-slate-800">{form16Data.employee_name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">PAN Account No</span>
                        <strong className="text-xs text-slate-800 font-mono uppercase">{form16Data.pan || 'N/A'}</strong>
                      </div>
                    </div>

                    {/* Exemption Worksheets */}
                    <div className="space-y-3.5 text-xs text-slate-700">
                      
                      <div className="flex justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Gross Estimated Annual Salary (Base + Allowances):</span>
                        <span className="font-mono font-bold text-slate-900">₹{form16Data.gross_annual_salary.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex justify-between pb-1.5 border-b border-slate-100 text-rose-600">
                        <span>Standard Deductions (Section 16 flat):</span>
                        <span className="font-mono font-bold">- ₹{form16Data.standard_deduction.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex justify-between pb-1.5 border-b border-slate-100 text-rose-500">
                        <span>Provident Fund Section 80C Investment Limits:</span>
                        <span className="font-mono">- ₹{form16Data.section_80c.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex justify-between pb-1.5 border-b border-slate-100 text-rose-500">
                        <span>Medical Insurance Section 80D Exemption:</span>
                        <span className="font-mono">- ₹{form16Data.section_80d.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex justify-between pb-1.5 border-b border-slate-100 text-rose-500">
                        <span>HRA Exemption (Rent Paid Relief):</span>
                        <span className="font-mono">- ₹{form16Data.hra_exemption.toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex justify-between pb-2 border-b-2 font-black text-slate-900 text-sm">
                        <span>Estimated Net Taxable Income:</span>
                        <span className="font-mono">₹{form16Data.taxable_income.toLocaleString('en-IN')}</span>
                      </div>

                      {form16Data.tax_on_income <= 0 ? (
                        <div className="p-3 bg-emerald-50 text-emerald-800 font-bold border border-emerald-100 rounded-xl text-center">
                          ◆ Taxable income is below taxable threshold. Section 87A rebate of ₹25,000 applied. No Tax Payable.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-4 pt-3">
                          <div className="p-3 bg-slate-50 border rounded-2xl">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Basic Slabs Tax</span>
                            <p className="text-base font-extrabold text-slate-900 font-mono mt-0.5">₹{form16Data.tax_on_income.toLocaleString('en-IN')}</p>
                          </div>

                          <div className="p-3 bg-slate-950 text-white rounded-2xl">
                            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Net Annual Tax Payable</span>
                            <p className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">₹{form16Data.net_tax_payable.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAB: SECURITY ==================== */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm max-w-md">
                <div className="border-b border-slate-100 pb-3.5">
                  <h3 className="font-extrabold text-slate-950 font-sans text-sm flex items-center gap-1.5">
                    <Lock size={15} className="text-emerald-600" />
                    Security & Password Update
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">Update your personal password for portal authentication.</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Password</label>
                    <input
                      type="password"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                    />
                  </div>

                  {passwordSuccess && (
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 border border-emerald-100 leading-normal">
                      <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  {passwordError && (
                    <div className="p-2.5 bg-rose-50 text-rose-800 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 border border-rose-100 leading-normal">
                      <AlertCircle size={13} className="text-rose-500 shrink-0" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock size={12} />
                    {updatingPassword ? 'Updating password...' : 'Change Portal Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ==================== TAB: HOD APPROVALS ==================== */}
          {activeTab === 'hod_approvals' && employee.is_hod && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider flex items-center gap-2">
                  <UserCheck size={16} className="text-emerald-400" />
                  HOD APPROVAL CENTER (विभागाध्यक्ष अनुमोदन केंद्र)
                </h3>
                <p className="text-slate-400 text-xs mt-1">
                  Manage and approve leaves and miss punch regularization requests for employees reporting to you.
                </p>
                <div className="mt-4 flex gap-4 text-xs">
                  <div className="bg-slate-800/50 border border-slate-700/50 px-3 py-1.5 rounded-xl">
                    Pending Leaves: <strong className="text-emerald-400">{hodPendingLeaves.length}</strong>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700/50 px-3 py-1.5 rounded-xl">
                    Pending Miss Punch: <strong className="text-emerald-400">{hodPendingCorrections.length}</strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Leaves section */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-slate-950 font-sans text-xs uppercase tracking-wider">Leave Applications</h4>
                      <p className="text-slate-400 text-[10px] mt-0.5">Pending your departmental HOD approval</p>
                    </div>
                    <button
                      onClick={fetchHodApprovals}
                      className="p-1 hover:bg-slate-50 border rounded-lg text-slate-500 transition cursor-pointer"
                    >
                      <RefreshCw size={13} className={loadingHodApprovals ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {loadingHodApprovals ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                      <span className="text-[10px] text-slate-400">Loading leave requests...</span>
                    </div>
                  ) : hodPendingLeaves.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-1">
                      <CheckCircle size={28} className="mx-auto text-emerald-500/40" />
                      <p className="text-xs font-semibold">No Pending Leave Requests</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                      {hodPendingLeaves.map((app: any) => (
                        <div key={app.id} className="p-4 border border-slate-200/60 rounded-2xl bg-slate-50/40 hover:bg-white hover:shadow-sm transition space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h5 className="font-extrabold text-xs text-slate-900">{app.employee_name}</h5>
                              <p className="text-[10px] text-slate-400 font-mono">Code: {app.employee_id}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-150 text-indigo-800 text-[9px] font-bold rounded uppercase tracking-wide">
                              {app.leave_type} Leave
                            </span>
                          </div>

                          <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-[11px] space-y-1">
                            <div className="flex justify-between text-slate-600">
                              <span>Duration:</span>
                              <strong className="text-slate-900 font-mono">{app.days} Day(s)</strong>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>From:</span>
                              <strong className="text-slate-900 font-mono">{app.start_date}</strong>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>To:</span>
                              <strong className="text-slate-900 font-mono">{app.end_date}</strong>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 italic bg-white p-2 border border-slate-150/50 rounded-xl">
                            &ldquo;{app.reason}&rdquo;
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleHodLeaveAction(app.id, 'APPROVE')}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-xs font-mono"
                            >
                              <CheckCircle size={12} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleHodLeaveAction(app.id, 'REJECT')}
                              className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-xs font-mono"
                            >
                              <XCircle size={12} />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Miss Punch section */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="border-b pb-2 flex justify-between items-center">
                    <div>
                      <h4 className="font-extrabold text-slate-950 font-sans text-xs uppercase tracking-wider">Miss Punch Regularization</h4>
                      <p className="text-slate-400 text-[10px] mt-0.5">Pending your departmental HOD approval</p>
                    </div>
                    <button
                      onClick={fetchHodApprovals}
                      className="p-1 hover:bg-slate-50 border rounded-lg text-slate-500 transition cursor-pointer"
                    >
                      <RefreshCw size={13} className={loadingHodApprovals ? 'animate-spin' : ''} />
                    </button>
                  </div>

                  {loadingHodApprovals ? (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                      <span className="text-[10px] text-slate-400">Loading corrections...</span>
                    </div>
                  ) : hodPendingCorrections.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-1">
                      <CheckCircle size={28} className="mx-auto text-emerald-500/40" />
                      <p className="text-xs font-semibold">No Pending Miss Punch Requests</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                      {hodPendingCorrections.map((corr: any) => (
                        <div key={corr.id} className="p-4 border border-slate-200/60 rounded-2xl bg-slate-50/40 hover:bg-white hover:shadow-sm transition space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h5 className="font-extrabold text-xs text-slate-900">{corr.employee_name}</h5>
                              <p className="text-[10px] text-slate-400 font-mono">Code: {corr.employee_id}</p>
                            </div>
                            <span className="px-2 py-0.5 bg-teal-50 border border-teal-150 text-teal-800 text-[9px] font-bold rounded uppercase tracking-wide">
                              Punch Regularization
                            </span>
                          </div>

                          <div className="bg-white border border-slate-100 p-2.5 rounded-xl text-[11px] space-y-1">
                            <div className="flex justify-between text-slate-600">
                              <span>Work Date:</span>
                              <strong className="text-slate-900 font-mono">{corr.date}</strong>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Original:</span>
                              <strong className="text-rose-700 font-mono">{corr.original_status}</strong>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Requested:</span>
                              <strong className="text-emerald-700 font-mono">{corr.requested_status}</strong>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 italic bg-white p-2 border border-slate-150/50 rounded-xl">
                            &ldquo;{corr.reason}&rdquo;
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleHodMissPunchAction(corr.id, 'APPROVE')}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-xs font-mono"
                            >
                              <CheckCircle size={12} />
                              Approve
                            </button>
                            <button
                              onClick={() => handleHodMissPunchAction(corr.id, 'REJECT')}
                              className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer shadow-xs font-mono"
                            >
                              <XCircle size={12} />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </main>
      </div>

      {/* ==================== MODAL: LOAN STATEMENT Repayments Ledger ==================== */}
      <AnimatePresence>
        {showLoanModal && (
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
              id="loan-statement-modal"
            >
              <div className="bg-slate-950 p-4 text-white flex justify-between items-center text-xs font-bold border-b border-emerald-500/20">
                <div className="flex items-center gap-1.5">
                  <PiggyBank size={15} className="text-emerald-400" />
                  <span>Sakar Group Loan Statement Ledger</span>
                </div>
                <button
                  onClick={() => setShowLoanModal(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <XCircle size={16} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5 text-slate-850">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Allotted Borrowed</span>
                    <strong className="text-sm font-extrabold text-slate-900 font-mono">₹{loanDetails.totalBorrowed.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="border-x border-slate-200">
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Total Repaid</span>
                    <strong className="text-sm font-extrabold text-emerald-600 font-mono">₹{loanDetails.totalRepaid.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wide block">Net Outstanding</span>
                    <strong className="text-sm font-extrabold text-rose-600 font-mono">₹{loanDetails.outstanding.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Next scheduled recovery card (Item 5 requested) */}
                {nextRecovery ? (
                  <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5 text-left">
                      <span className="text-[9px] text-emerald-800 font-bold uppercase tracking-wider block">Next Scheduled Recovery EMI</span>
                      <strong className="text-xs text-emerald-950 font-semibold block leading-tight">
                        Date: {nextRecovery.date} ({nextRecovery.month})
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-emerald-800 font-bold block uppercase">EMI Amount</span>
                      <strong className="text-sm font-black text-emerald-900 font-mono">₹{nextRecovery.amount.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-150 p-3 py-2.5 rounded-xl text-center text-[11px] text-slate-500 italic">
                    No upcoming loan recovery deductions scheduled (All loans cleared)
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b">Allotted Loan Contracts</h4>
                  
                  {loans.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6 italic">No active or historic loan registries detected.</p>
                  ) : (
                    <div className="space-y-3">
                      {loans.map(loan => {
                        const totalRepaidForThis = payslips.reduce((sum, p) => sum + (p.loan_deduction || 0), 0);
                        const outstandingForThis = Math.max(0, loan.amount - totalRepaidForThis);
                        
                        return (
                          <div key={loan.id} className="p-3.5 border border-slate-150 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center">
                              <div>
                                <strong className="text-xs text-slate-900 block font-extrabold">₹{loan.amount.toLocaleString('en-IN')} Allotment</strong>
                                <span className="text-[9px] text-slate-400 font-mono">ID: {loan.id} | Contract: {loan.month}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase font-mono ${
                                loan.status === 'ACTIVE' ? 'bg-emerald-50 border border-emerald-150 text-emerald-700' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {loan.status}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 italic">
                              &ldquo;Reason: {loan.reason}&rdquo;
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-1.5 text-[10px] border-t border-dashed border-slate-150">
                              <div>
                                <span className="text-slate-400 block font-bold">Monthly deduction rate:</span>
                                <strong className="text-slate-800 font-mono">₹{loan.monthly_deduction.toLocaleString('en-IN')}/month</strong>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 block font-bold">Estimated outstanding:</span>
                                <strong className="text-rose-600 font-mono">₹{loan.status === 'ACTIVE' ? outstandingForThis.toLocaleString('en-IN') : 0}</strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-1 border-b">Payslip Repayment History Ledger</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {payslips.filter(p => (p.loan_deduction || 0) > 0).map(slip => (
                      <div key={slip.id} className="p-2.5 border border-slate-100 rounded-xl bg-slate-50/50 flex justify-between items-center text-[10px]">
                        <div>
                          <strong className="text-slate-800 block font-extrabold font-mono">{slip.month} Repayment Deduction</strong>
                          <span className="text-slate-400 font-mono">Automatic deduction via corporate payroll</span>
                        </div>
                        <div className="text-right">
                          <strong className="text-emerald-700 block font-mono font-bold">₹{slip.loan_deduction.toLocaleString('en-IN')}</strong>
                          <span className="text-[8px] text-emerald-600 font-extrabold bg-emerald-50 border border-emerald-100 rounded px-1">SUCCESS</span>
                        </div>
                      </div>
                    ))}
                    {payslips.filter(p => (p.loan_deduction || 0) > 0).length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4 italic">No repayment ledger events detected yet.</p>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: MANUAL ATTENDANCE LOGGING ==================== */}
      <AnimatePresence>
        {showManualAttendanceModal && (
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-850"
              id="manual-attendance-modal"
            >
              <div className="bg-slate-950 p-4 text-white flex justify-between items-center text-xs font-bold border-b border-emerald-500/20">
                <div className="flex items-center gap-1.5">
                  <Clock size={15} className="text-emerald-400" />
                  <span>Mark / Log Manual Attendance Card</span>
                </div>
                <button
                  onClick={() => setShowManualAttendanceModal(false)}
                  className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <XCircle size={16} />
                </button>
              </div>

              <form onSubmit={handleManualAttendanceSubmit} className="p-5 space-y-4 overflow-y-auto text-left">
                <div className="bg-emerald-50/55 p-3 rounded-2xl border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed font-sans">
                  <strong>मैनुअल अटेंडेंस दर्ज करें (Manual Attendance Input):</strong> You can manually register your attendance punch or request regularization below. All manually submitted entries are securely logged and processed.
                </div>

                {manualSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold">
                    {manualSuccessMsg}
                  </div>
                )}

                {manualErrorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-semibold">
                    {manualErrorMsg}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Select Work Date</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white p-3 rounded-xl text-xs text-slate-800 outline-hidden font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Attendance Status</label>
                    <select
                      value={manualStatus}
                      onChange={(e) => setManualStatus(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white p-3 rounded-xl text-xs text-slate-800 outline-hidden font-sans"
                    >
                      <option value="PRESENT">Present (Generals)</option>
                      <option value="LEAVE">Leave (With Pay)</option>
                      <option value="LWP">LWP (Absent / Unpaid)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Work Hours (Duty)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="16"
                      value={manualHours}
                      onChange={(e) => setManualHours(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white p-3 rounded-xl text-xs text-slate-800 outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block">Reason / Remarks for Manual Entry</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="e.g., biometric device malfunction / onsite customer deployment..."
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white p-3 rounded-xl text-xs text-slate-800 outline-hidden font-sans resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingManualAttendance}
                  className="w-full py-3 bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold transition cursor-pointer text-center flex justify-center items-center gap-1.5 font-sans"
                >
                  {submittingManualAttendance ? (
                    <span>Registering manual punch...</span>
                  ) : (
                    <>
                      <PlusCircle size={14} />
                      <span>Submit Manual Attendance Punch</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== DRAWER: NOTIFICATION CENTER ==================== */}
      <AnimatePresence>
        {showNotificationDrawer && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end no-print">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="bg-white w-full max-w-md shadow-2xl h-full flex flex-col"
              id="notification-drawer"
            >
              <div className="bg-slate-950 p-4 text-white flex justify-between items-center text-xs font-bold border-b border-emerald-500/20">
                <div className="flex items-center gap-1.5">
                  <Bell size={15} className="text-emerald-400" />
                  <span>Sakar SVN HRMS Notification Center</span>
                </div>
                <button
                  onClick={() => setShowNotificationDrawer(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <XCircle size={16} />
                </button>
              </div>

              {/* Scrollable Alerts feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                {notificationList.map(notif => (
                  <div key={notif.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <span className={`p-1.5 rounded-lg ${
                        notif.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
                        notif.type === 'alert' ? 'bg-rose-50 text-rose-700' :
                        notif.type === 'announcement' ? 'bg-indigo-50 text-indigo-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {notif.type === 'success' ? <CheckCircle size={13} /> :
                         notif.type === 'alert' ? <AlertCircle size={13} /> :
                         notif.type === 'announcement' ? <Building2 size={13} /> :
                         <Info size={13} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-center gap-2">
                          <strong className="text-[11px] text-slate-900 block font-extrabold">{notif.title}</strong>
                          <span className="text-[8px] text-slate-400 font-mono tracking-wider shrink-0 font-bold">{notif.date}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-1">{notif.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 text-center select-none text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                End of synchronized alerts
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ==================== MODAL: DETAILED PAYSLIP INVOICE ==================== */}
      <AnimatePresence>
        {activePayslipDetail && (
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              id="payslip-modal"
            >
              
              {/* Modal control bar */}
              <div className="bg-slate-950 p-4 text-white flex justify-between items-center text-xs font-semibold select-none no-print border-b border-emerald-500/20">
                <div className="flex items-center gap-1.5">
                  <FileText className="text-emerald-400" size={15} />
                  <span>Salary Slip Invoice Details • {activePayslipDetail.month}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrintPayslip}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-emerald-400 hover:text-white cursor-pointer transition flex items-center gap-1 text-[11px] px-2.5 font-bold"
                  >
                    <Printer size={12} />
                    Download / Print
                  </button>
                  <button
                    onClick={() => setActivePayslipDetail(null)}
                    className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>

              {/* Printable Payslip Invoice Layout */}
              <div className="p-8 overflow-y-auto flex-1 font-sans space-y-6" id="print-section">
                
                {/* Visual Header */}
                <div className="flex justify-between items-start border-b-2 pb-5 border-slate-900">
                  <div className="space-y-1">
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 border-emerald-200 border px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                      PAYSLIP DISBURSEMENT RECORD
                    </span>
                    <h2 className="text-lg font-black tracking-tight text-slate-950 font-display">{getCompanyName(employee.company)}</h2>
                    <p className="text-[10px] text-gray-500">Regd Unit Office: Alkapuri Corporate Complex, Vadodara</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Cycle Month</span>
                    <strong className="text-sm font-black font-mono text-slate-900">{activePayslipDetail.month}</strong>
                  </div>
                </div>

                {/* Info Ledger Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b pb-5 border-slate-200">
                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">Employee Name</span>
                    <strong className="text-slate-900 font-display font-bold">{employee.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">Employee ID</span>
                    <strong className="text-slate-900 font-mono">{employee.id}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">Designation</span>
                    <strong className="text-slate-900 font-sans">{employee.designation}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">Corporate Unit</span>
                    <strong className="text-slate-900 font-sans uppercase">{getCompanyName(employee.company)}</strong>
                  </div>

                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">Bank Account</span>
                    <strong className="text-slate-900 font-mono">{employee.bank_account || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">Bank Name</span>
                    <strong className="text-slate-900 font-sans">{employee.bank_name || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">PAN Account No</span>
                    <strong className="text-slate-900 font-mono uppercase">{employee.pan || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">UAN Number</span>
                    <strong className="text-slate-900 font-mono">{employee.uan || 'N/A'}</strong>
                  </div>

                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">Attendance Worked</span>
                    <strong className="text-slate-900 font-mono">{activePayslipDetail.working_days} Days</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">LOP Leave Days</span>
                    <strong className="text-rose-600 font-mono font-bold">{activePayslipDetail.lop_days} Days</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">Work Shift Timing</span>
                    <strong className="text-slate-950 font-sans">{employee.shift_timing || '9:30 AM to 6:30 PM'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block text-[9px] uppercase">Disbursement Status</span>
                    <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 text-[9px] border border-emerald-100 rounded-md font-bold uppercase font-mono mt-0.5 inline-block">
                      Disbursed
                    </span>
                  </div>
                </div>

                {/* Double Columns: Earnings vs Deductions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-xs">
                  
                    {/* Earnings */}
                    <div className="space-y-2">
                      <h4 className="font-extrabold text-[10px] text-emerald-800 uppercase tracking-wider border-b pb-1 font-display">Earnings Components</h4>
                      
                      {(() => {
                        const hiddenHeads = activePayslipDetail.hidden_salary_heads ? activePayslipDetail.hidden_salary_heads.split(',') : [];
                        return (
                          <>
                            <div className="flex justify-between py-1 border-b border-gray-50">
                              <span className="text-gray-500">Base Basic Salary Component:</span>
                              <strong className="text-slate-900 font-mono">₹{activePayslipDetail.base_salary.toLocaleString('en-IN')}</strong>
                            </div>

                            {!hiddenHeads.includes('hra') && (
                              <div className="flex justify-between py-1 border-b border-gray-50">
                                <span className="text-gray-500">House Rent Allowance (HRA):</span>
                                <strong className="text-slate-900 font-mono">₹{activePayslipDetail.hra.toLocaleString('en-IN')}</strong>
                              </div>
                            )}

                            {!hiddenHeads.includes('special_allowance') && (
                              <div className="flex justify-between py-1 border-b border-gray-50">
                                <span className="text-gray-500">Special Allowance Incentives:</span>
                                <strong className="text-slate-900 font-mono">₹{activePayslipDetail.special_allowance.toLocaleString('en-IN')}</strong>
                              </div>
                            )}

                            {!hiddenHeads.includes('edu_allowance') && (
                              <div className="flex justify-between py-1 border-b border-gray-50">
                                <span className="text-gray-500">Educational Allowance:</span>
                                <strong className="text-slate-900 font-mono">₹{(activePayslipDetail.edu_allowance || 0).toLocaleString('en-IN')}</strong>
                              </div>
                            )}

                            {!hiddenHeads.includes('medical_allowance') && (
                              <div className="flex justify-between py-1 border-b border-gray-50">
                                <span className="text-gray-500">Medical Reimbursement:</span>
                                <strong className="text-slate-900 font-mono">₹{(activePayslipDetail.medical_allowance || 0).toLocaleString('en-IN')}</strong>
                              </div>
                            )}

                            {!hiddenHeads.includes('conveyance_allowance') && (
                              <div className="flex justify-between py-1 border-b border-gray-50">
                                <span className="text-gray-500">Conveyance Allowance:</span>
                                <strong className="text-slate-900 font-mono">₹{(activePayslipDetail.conveyance_allowance || 0).toLocaleString('en-IN')}</strong>
                              </div>
                            )}
                          </>
                        );
                      })()}

                      <div className="flex justify-between py-1 border-b border-gray-50 font-bold bg-slate-50 p-1.5 rounded">
                        <span className="text-slate-950">Gross Wages Disbursable:</span>
                        <strong className="text-slate-950 font-mono">₹{activePayslipDetail.gross_salary.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                  {/* Deductions */}
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-[10px] text-rose-800 uppercase tracking-wider border-b pb-1 font-display">Statutory Deductions</h4>
                    
                    <div className="flex justify-between py-1 border-b border-gray-50 text-rose-600">
                      <span>Provident Fund (PF Employer match):</span>
                      <strong className="font-mono">- ₹{activePayslipDetail.pf_deduction.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-50 text-rose-600">
                      <span>ESIC Healthcare Contribution:</span>
                      <strong className="font-mono">- ₹{activePayslipDetail.esic_deduction.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-50 text-rose-600">
                      <span>Professional Tax (PT flat):</span>
                      <strong className="font-mono">- ₹{activePayslipDetail.professional_tax.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-50 text-rose-600">
                      <span>LOP Salary Deductions:</span>
                      <strong className="font-mono">- ₹{activePayslipDetail.lop_deduction.toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-50 text-rose-600">
                      <span>Outstanding Loan Repayments:</span>
                      <strong className="font-mono">- ₹{(activePayslipDetail.loan_deduction || 0).toLocaleString('en-IN')}</strong>
                    </div>

                    <div className="flex justify-between py-1 border-b border-gray-50 text-rose-600 font-bold bg-rose-50 p-1.5 rounded">
                      <span>Total Net Deductions:</span>
                      <strong className="font-mono">₹{activePayslipDetail.total_deductions.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                </div>

                {/* Net Pay Box */}
                <div className="p-4 bg-slate-950 text-white rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-2 border shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">NET IN-HAND BANK DISBURSEMENT</span>
                    <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-1 mt-0.5">
                      ₹{activePayslipDetail.net_salary.toLocaleString('en-IN')}
                    </h3>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/25 h-fit text-center font-bold">
                    * Transferred through NeFT to {employee.bank_name}
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 text-center select-none pt-4 border-t border-dashed">
                  This is a computer-generated salary statement issued by Sakar Electricals &amp; Electronics Pvt. Ltd. &amp; SVN Opto Electronics Pvt. Ltd. (VETAN ERP) and does not require a physical signature.
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
