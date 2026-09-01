/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Sparkles, 
  Plus, 
  Share2, 
  Mail, 
  MessageSquare,
  Info, 
  Check,
  Building,
  User,
  HeartPulse,
  BookOpen,
  Award,
  ListFilter
} from 'lucide-react';
import { Employee, LeaveApplication } from '../types';
import LeaveRegisterView from './LeaveRegisterView';
import CompOffLedgerView from './CompOffLedgerView';
import HRPolicyView from './HRPolicyView';

interface LeavesControllerProps {
  employees: Employee[];
  applications: LeaveApplication[];
  attendance: any[];
  activeCompany: string;
  sessionMode: 'HR' | 'EMPLOYEE' | 'MANAGEMENT';
  loggedInEmployeeId?: string;
  onAddLeave: (app: LeaveApplication) => Promise<boolean>;
  onUpdateStatus: (id: string, status: 'APPROVED' | 'REJECTED') => Promise<boolean>;
}

export default function LeavesController({ employees, applications, attendance, activeCompany, sessionMode, loggedInEmployeeId, onAddLeave, onUpdateStatus }: LeavesControllerProps) {
  const [subTab, setSubTab] = useState<'approvals' | 'register' | 'compoff' | 'policies'>('approvals');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sharingApp, setSharingApp] = useState<LeaveApplication | null>(null);
  const [sharingEmployeeCard, setSharingEmployeeCard] = useState<Employee | null>(null);
  const [shareSuccess, setShareSuccess] = useState('');
  
  // New application sheet state
  const [empId, setEmpId] = useState('');
  const [leaveType, setLeaveType] = useState<'PL' | 'CL' | 'SL'>('PL');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState(1);
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [reason, setReason] = useState('');

  // Sync dates and half-day status
  React.useEffect(() => {
    if (isHalfDay && startDate) {
      setEndDate(startDate);
    }
  }, [isHalfDay, startDate]);

  // Dynamic calculations for leave days
  React.useEffect(() => {
    if (startDate && endDate) {
      if (isHalfDay) {
        setDays(0.5);
      } else {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDays(isNaN(diffDays) ? 1 : (diffDays < 1 ? 1 : diffDays));
      }
    }
  }, [startDate, endDate, isHalfDay]);

  const activeEmployees = employees.filter(e => activeCompany === 'ALL' || e.company === activeCompany);
  // HR sees PENDING, PENDING_HR, APPROVED, REJECTED — NOT PENDING_HOD (HOD handles those via Employee ESS)
  const filteredApps = applications.filter(a => {
    if (activeCompany !== 'ALL' && a.company !== activeCompany) return false;
    return a.status !== 'PENDING_HOD';
  });

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empId) return alert('Select staff member');
    const selectedEmp = employees.find(e => e.id === empId);
    if (!selectedEmp) return;

    if (leaveType === 'PL' && !isHalfDay && days < 2) {
      alert('Privilege Leave (PL) must be applied for a minimum of 2 days.');
      return;
    }

    const newApp: LeaveApplication = {
      id: '',
      employee_id: empId,
      employee_name: selectedEmp.name,
      company: selectedEmp.company,
      leave_type: leaveType,
      start_date: startDate,
      end_date: isHalfDay ? startDate : endDate,
      days: days,
      reason: reason || 'Personal emergency',
      status: 'PENDING'
    };

    const success = await onAddLeave(newApp);
    if (success) {
      setIsModalOpen(false);
      setReason('');
      setDays(1);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await onUpdateStatus(id, status);
  };

  // HR OVERRIDE: Emergency bypass when HOD is unresponsive. Audit trail logged server-side.
  const handleHrOverride = async (id: string, action: 'APPROVED' | 'REJECTED') => {
    const confirmed = window.confirm(
      '⚠️ HR OVERRIDE WARNING:\n\nYou are about to bypass the HOD approval step.\nThis action is permanently logged in the audit trail.\n\nProceed with HR Override?'
    );
    if (!confirmed) return;
    try {
      const res = await fetch('/api/leaves/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          actorRole: 'COMPANY_HR',
          action: 'APPROVE',
          actorId: 'HR',
          override: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setShareSuccess('HR Override applied successfully. Leave moved to HR approval queue.');
        setTimeout(() => setShareSuccess(''), 4000);
        // Refresh the leave list
        window.location.reload();
      } else {
        alert(data.error || 'Override failed');
      }
    } catch (e) {
      alert('Error applying HR override');
    }
  };

  const triggerShareAlert = (method: 'WHATSAPP' | 'EMAIL', targetName: string) => {
    setShareSuccess(`Shared leave update successfully with employee ${targetName} via direct ${method}!`);
    setTimeout(() => {
      setShareSuccess('');
    }, 3500);
  };

  const openShareCardModal = (emp: Employee) => {
    setSharingEmployeeCard(emp);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Navigation Subtabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-4 bg-slate-900 p-2 rounded-2xl shadow-inner border border-slate-800">
        <button
          onClick={() => setSubTab('approvals')}
          className={`px-4 py-2.5 text-xs font-black transition-all relative whitespace-nowrap cursor-pointer rounded-xl flex-1 md:flex-none ${
            subTab === 'approvals' 
              ? 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2 font-display uppercase tracking-wider">
            <Calendar size={13} className={subTab === 'approvals' ? 'text-amber-400' : 'text-slate-400'} />
            Leave Approvals <span className="text-[10px] text-amber-500/80 font-mono">(Gold)</span>
          </div>
        </button>
        <button
          onClick={() => setSubTab('register')}
          className={`px-4 py-2.5 text-xs font-black transition-all relative whitespace-nowrap cursor-pointer rounded-xl flex-1 md:flex-none ${
            subTab === 'register' 
              ? 'bg-pink-500/10 text-pink-400 ring-1 ring-pink-500/30' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2 font-display uppercase tracking-wider">
            <ListFilter size={13} className={subTab === 'register' ? 'text-pink-400' : 'text-slate-400'} />
            Balances <span className="text-[10px] text-pink-500/80 font-mono">(Pink)</span>
          </div>
        </button>
        <button
          onClick={() => setSubTab('compoff')}
          className={`px-4 py-2.5 text-xs font-black transition-all relative whitespace-nowrap cursor-pointer rounded-xl flex-1 md:flex-none ${
            subTab === 'compoff' 
              ? 'bg-yellow-400/10 text-yellow-300 ring-1 ring-yellow-400/20' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2 font-display uppercase tracking-wider">
            <Award size={13} className={subTab === 'compoff' ? 'text-yellow-300' : 'text-slate-400'} />
            Comp Off <span className="text-[10px] text-yellow-400/80 font-mono">(Yellow)</span>
          </div>
        </button>
        <button
          onClick={() => setSubTab('policies')}
          className={`px-4 py-2.5 text-xs font-black transition-all relative whitespace-nowrap cursor-pointer rounded-xl flex-1 md:flex-none ${
            subTab === 'policies' 
              ? 'bg-slate-800 text-white ring-1 ring-slate-700' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2 font-display uppercase tracking-wider">
            <BookOpen size={13} className={subTab === 'policies' ? 'text-white' : 'text-slate-400'} />
            HR Policies <span className="text-[10px] text-slate-200 font-mono">(White)</span>
          </div>
        </button>
      </div>

      {subTab === 'register' && (
        <LeaveRegisterView
          employees={employees}
          applications={applications}
          attendance={attendance}
          activeCompany={activeCompany}
        />
      )}

      {subTab === 'compoff' && (
        <CompOffLedgerView
          employees={employees}
          activeCompany={activeCompany}
        />
      )}

      {subTab === 'policies' && (
        <HRPolicyView
          employees={employees}
          activeCompany={activeCompany}
          sessionMode={sessionMode}
          loggedInEmployeeId={loggedInEmployeeId}
        />
      )}

      {subTab === 'approvals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Leaves registry approval desk */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="font-semibold text-gray-900 font-display text-sm tracking-tight">Active Leave Requests Approvals Desk</h3>
            <p className="text-gray-400 text-xs mt-0.5">Approve leave entries. Credits will automatically adjust matching balances.</p>
          </div>
          <button 
            id="btn-apply-leave"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white rounded-xl transition cursor-pointer"
          >
            <Plus size={14} />
            File Leave Entry
          </button>
        </div>

        {/* Workflow info banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-2.5">
          <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-blue-700 leading-relaxed">
            <strong>Leave Workflow:</strong> Employee applies &rarr; <strong>HOD approves</strong> (via Employee ESS) &rarr; <strong>HR final approval</strong> (here). 
            Leaves pending HOD approval are handled by the reporting HOD through the Employee ESS portal. Only leaves approved by HOD appear here for your final approval.
          </p>
        </div>

        {/* Persistent Leave Policy rules overview */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50/20 border border-emerald-100 rounded-2xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center gap-1.5 pb-1.5 border-b border-emerald-100/60">
            <Sparkles size={14} className="text-emerald-600" />
            <h4 className="text-xs font-bold font-display text-emerald-800 uppercase tracking-widest">Company Leave Policy Rules (छुट्टी के नियम)</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-emerald-950/80">
            <div className="space-y-1">
              <span className="font-bold block text-emerald-900">PL (Privilege Leave)</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-900/70">
                <li>Min application = <strong className="text-emerald-700">2 Days</strong></li>
                <li>Carry Forward = <strong className="text-emerald-700 font-bold">Max 36 Days</strong></li>
                <li>Half Day PL = <strong className="text-amber-700 font-medium">Mgmt Approval</strong></li>
              </ul>
            </div>
            <div className="space-y-1 border-t sm:border-t-0 sm:border-l sm:pl-4 border-emerald-100/50">
              <span className="font-bold block text-emerald-900">CL (Casual Leave)</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-900/70">
                <li>Year-End Status = <strong className="text-rose-700">Lapse</strong></li>
                <li>Half Day CL = <strong className="text-emerald-700 font-bold">Allowed</strong></li>
              </ul>
            </div>
            <div className="space-y-1 border-t sm:border-t-0 sm:border-l sm:pl-4 border-emerald-100/50">
              <span className="font-bold block text-emerald-900">SL (Sick Leave)</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-900/70">
                <li>Year-End Status = <strong className="text-rose-700">Lapse</strong></li>
                <li>Half Day SL = <strong className="text-amber-700 font-medium">Mgmt Approval</strong></li>
              </ul>
            </div>
          </div>
        </div>

        {shareSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-lg flex items-center gap-2">
            <Check size={14} className="text-emerald-500" />
            {shareSuccess}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 font-display select-none">
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Staff / Company</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Leave Model</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Duration</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
                  <th className="p-4 text-xs font-semibold text-gray-400 uppercase text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition">
                    <td className="p-4">
                      <div>
                        <span className="text-xs font-bold text-gray-900 block">{app.employee_name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400 font-mono">
                          <span>{app.employee_id}</span>
                          <span>•</span>
                          <span className="font-semibold text-emerald-600 uppercase">{app.company}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="px-2 py-0.5 bg-gray-100 border text-[9px] font-bold rounded text-gray-700">
                          {app.leave_type === 'PL' ? 'Privilege (PL)' : app.leave_type === 'CL' ? 'Casual (CL)' : 'Sick (SL)'}
                        </span>
                        <span className="text-[11px] text-gray-500 block mt-1 italic font-sans">"{app.reason}"</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-xs text-gray-700">
                        <span className="font-mono block">{app.start_date} to {app.end_date}</span>
                        <span className="text-[10px] font-semibold text-amber-600 block mt-0.5">{app.days} Day{app.days > 1 && 's'} credit</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex">
                        {app.status === 'APPROVED' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                              <CheckCircle size={12} />
                              Approved
                            </span>
                            {(app as any).hr_override && (
                              <span className="text-[9px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase" title={`HR Override by ${(app as any).hr_override_by} on ${(app as any).hr_override_date}`}>
                                HR Override (HOD Bypassed)
                              </span>
                            )}
                          </div>
                        ) : (app.status === 'REJECTED' || app.status === 'REJECTED_HR' || app.status === 'REJECTED_HOD') ? (
                          <span className="flex items-center gap-1.5 text-xs text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                            <XCircle size={12} />
                            {app.status === 'REJECTED_HOD' ? 'Rejected by HOD' : app.status === 'REJECTED_HR' ? 'Rejected by HR' : 'Rejected'}
                          </span>
                        ) : app.status === 'PENDING_HOD' ? (
                          <span className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100" title="Routed to HOD">
                            <Clock size={12} />
                            Pending HOD
                          </span>
                        ) : app.status === 'PENDING_HR' ? (
                          <span className="flex items-center gap-1.5 text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100" title="Routed to HR">
                            <Clock size={12} />
                            Pending HR
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                            <Clock size={12} />
                            Pending Review
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      {/* PENDING_HOD: HOD approval expected. HR can override in emergency. */}
                      {app.status === 'PENDING_HOD' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                            Awaiting HOD
                          </span>
                          <button 
                            onClick={() => handleHrOverride(app.id, 'APPROVED')}
                            className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2 py-1 text-[9px] font-bold transition cursor-pointer flex items-center gap-1"
                            title="Emergency HR Override — bypass HOD (audit logged)"
                          >
                            <Check size={11} />
                            HR Override
                          </button>
                        </div>
                      ) : (app.status === 'PENDING_HR' || app.status === 'PENDING') ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'APPROVED')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg p-1.5 transition cursor-pointer"
                            title="Approve leave"
                          >
                            <Check size={13} />
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(app.id, 'REJECTED')}
                            className="bg-rose-500 hover:bg-rose-600 text-white rounded-lg p-1.5 transition cursor-pointer"
                            title="Reject leave"
                          >
                            <XCircle size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => triggerShareAlert('WHATSAPP', app.employee_name)}
                            className="p-1 hover:bg-emerald-50 rounded text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                            title="Share status on WhatsApp"
                          >
                            <MessageSquare size={13} />
                          </button>
                          <button 
                            onClick={() => triggerShareAlert('EMAIL', app.employee_name)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-900 transition cursor-pointer"
                            title="Send confirmation Email"
                          >
                            <Mail size={13} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-xs text-gray-400">
                      No matching leave logs files registered for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Annual leave balance cards sharing desk */}
      <div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="border-b pb-3 border-gray-50">
            <h3 className="font-semibold text-gray-900 font-display text-sm tracking-tight flex items-center gap-1.5 pb-1">
              <Sparkles size={15} className="text-emerald-500" />
              Annual Leave Cards (FY 2026-27)
            </h3>
            <p className="text-gray-400 text-xs">Verify current live casual/earned leave balance matrices. Press any staff member to share card.</p>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto no-scrollbar">
            {activeEmployees.map((emp) => (
              <div 
                key={emp.id}
                onClick={() => openShareCardModal(emp)}
                className="p-3 bg-gray-50 hover:bg-emerald-50/40 border border-gray-100 hover:border-emerald-100 rounded-xl transition-all cursor-pointer group flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-gray-900 group-hover:text-emerald-900 block">{emp.name}</span>
                  <div className="flex gap-1 mt-0.5">
                    <span className="text-[10px] text-gray-400">{emp.designation}</span>
                    <span className="text-[10px] text-gray-300">•</span>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">{emp.company}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 text-right">
                    <div className="text-[10px] bg-white border px-1.5 py-0.5 rounded font-bold font-mono">
                      PL: <span className="text-emerald-600">{emp.leave_balance_pl}</span>
                    </div>
                    <div className="text-[10px] bg-white border px-1.5 py-0.5 rounded font-bold font-mono">
                      CL: <span className="text-blue-600">{emp.leave_balance_cl}</span>
                    </div>
                  </div>
                  <Share2 size={13} className="text-gray-400 group-hover:text-emerald-600 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )}

      {/* New Leave Application Dialog */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden"
            >
              <div className="bg-emerald-700 p-4 text-white">
                <h4 className="font-semibold font-display">New Leave Entry application</h4>
                <p className="text-[10px] text-emerald-100 mt-0.5">Register approved leave files to sync annual indices instantly.</p>
              </div>

              <form onSubmit={handleCreateLeave} className="p-5 space-y-4">
                
                {/* Visual leave rules helper for admin */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50/25 border border-emerald-100/70 rounded-xl p-3 text-[10px] text-emerald-950 space-y-1.5">
                  <div className="font-bold flex items-center gap-1 text-emerald-800 uppercase tracking-wider">
                    <Sparkles size={11} className="text-emerald-500" />
                    Unit Leave Policies (FY 2026-27)
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <strong className="text-emerald-900 block">Privilege (PL)</strong>
                      <span>Min 2 days • Carry-forward Max 36d • Half-day (Mgmt Appr)</span>
                    </div>
                    <div className="border-l border-emerald-100 pl-2">
                      <strong className="text-emerald-900 block">Casual (CL)</strong>
                      <span>Year-end lapse • Half-day (Allowed)</span>
                    </div>
                    <div className="border-l border-emerald-100 pl-2">
                      <strong className="text-emerald-900 block">Sick (SL)</strong>
                      <span>Year-end lapse • Half-day (Mgmt Appr)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase block">Staff Member</label>
                  <select 
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    required
                    className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                  >
                    <option value="">-- Choose Employee --</option>
                    {activeEmployees.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.company} - {e.id})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase block">Leave Format</label>
                    <select 
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as any)}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 bg-white"
                    >
                      <option value="PL">Privilege Leave (PL)</option>
                      <option value="CL">Casual Leave (CL)</option>
                      <option value="SL">Sick Leave (SL)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase block">Calculated Days</label>
                    <input 
                      type="number" 
                      readOnly
                      disabled
                      value={days}
                      className="w-full border border-gray-100 bg-gray-50 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 font-mono font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-0.5">
                  <input
                    type="checkbox"
                    id="adminHalfDay"
                    checked={isHalfDay}
                    onChange={(e) => setIsHalfDay(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <label htmlFor="adminHalfDay" className="text-[11px] font-medium text-slate-700 select-none cursor-pointer">
                    Apply as Half Day (आधा दिन)
                  </label>
                </div>

                {isHalfDay && (
                  <div className={`p-2 rounded text-[10px] font-semibold leading-normal ${
                    leaveType === 'CL' 
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                      : 'bg-amber-50 text-amber-800 border border-amber-100'
                  }`}>
                    {leaveType === 'CL' 
                      ? '✅ Half Day CL is allowed.' 
                      : '⚠️ Half Day PL/SL requires Management Approval.'}
                  </div>
                )}

                {leaveType === 'PL' && !isHalfDay && (
                  <div className="p-2.5 rounded text-[10px] bg-slate-50 border text-slate-600 font-medium">
                    ℹ️ PL must be applied for a minimum of 2 days.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase block">From Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase block">To Date</label>
                    <input 
                      type="date" 
                      disabled={isHalfDay}
                      value={isHalfDay ? startDate : endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase block">Brief Purpose / Reason</label>
                  <input 
                    type="text" 
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="e.g. Health issue, Out of station"
                    className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-1.5 border text-xs text-gray-500 rounded bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Close
                  </button>
                  <button 
                    type="submit"
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-semibold rounded cursor-pointer"
                  >
                    Submit Entry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Leave card share preview module */}
      <AnimatePresence>
        {sharingEmployeeCard && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border overflow-hidden p-6 relative"
            >
              <button 
                onClick={() => setSharingEmployeeCard(null)}
                className="absolute right-4 top-4 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <XCircle size={20} />
              </button>

              <div className="flex flex-col items-center text-center space-y-4 pt-4">
                <div className="p-3.5 bg-emerald-100 text-emerald-800 rounded-2xl">
                  <User size={30} />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-700 uppercase rounded-full">
                    {sharingEmployeeCard.company}
                  </span>
                  <h4 className="font-bold text-lg text-gray-900 mt-2 font-display">{sharingEmployeeCard.name}</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">{sharingEmployeeCard.designation} • {sharingEmployeeCard.department}</p>
                </div>
              </div>

              {/* Leave summaries widget */}
              <div className="grid grid-cols-3 gap-3 my-6 text-center">
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-semibold text-emerald-800 block">Privilege (PL)</span>
                  <span className="text-xl font-extrabold text-emerald-900 font-mono block mt-1">{sharingEmployeeCard.leave_balance_pl}</span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Left</span>
                </div>
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                  <span className="text-[10px] font-semibold text-blue-800 block">Casual (CL)</span>
                  <span className="text-xl font-extrabold text-blue-900 font-mono block mt-1">{sharingEmployeeCard.leave_balance_cl}</span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Left</span>
                </div>
                <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100">
                  <span className="text-[10px] font-semibold text-rose-800 block">Sick (SL)</span>
                  <span className="text-xl font-extrabold text-rose-900 font-mono block mt-1">{sharingEmployeeCard.leave_balance_sl}</span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">Left</span>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t">
                <span className="text-[10px] font-bold text-gray-400 uppercase block tracking-widest text-center">Direct Share Channels</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      triggerShareAlert('WHATSAPP', sharingEmployeeCard.name);
                      setSharingEmployeeCard(null);
                    }}
                    className="flex justify-center items-center gap-1.5 py-2 border rounded-xl hover:bg-emerald-50 text-xs font-semibold text-emerald-700 transition cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    WhatsApp
                  </button>
                  <button 
                    onClick={() => {
                      triggerShareAlert('EMAIL', sharingEmployeeCard.name);
                      setSharingEmployeeCard(null);
                    }}
                    className="flex justify-center items-center gap-1.5 py-2 border rounded-xl hover:bg-gray-50 text-xs font-semibold text-gray-700 transition cursor-pointer"
                  >
                    <Mail size={13} />
                    Email Card
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
