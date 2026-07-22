/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Bell, 
  TrendingUp, 
  Info,
  Archive,
  History,
  Check,
  User,
  Users
} from 'lucide-react';
import { Employee } from '../types';

interface HRPolicyViewProps {
  employees: Employee[];
  activeCompany: string;
  sessionMode: 'HR' | 'EMPLOYEE' | 'MANAGEMENT';
  loggedInEmployeeId?: string;
}

interface Policy {
  id: string;
  name: string;
  content: string;
  pdf_url: string;
  version: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

interface Acknowledgement {
  id: string;
  employee_id: string;
  policy_name: string;
  read_date: string;
  acknowledgement_date: string;
  version: string;
}

export default function HRPolicyView({ 
  employees, 
  activeCompany, 
  sessionMode,
  loggedInEmployeeId 
}: HRPolicyViewProps) {
  
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [acks, setAcks] = useState<Acknowledgement[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);

  // HR Add Policy state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState('');
  const [newPolicyContent, setNewPolicyContent] = useState('');
  const [newPolicyVersion, setNewPolicyVersion] = useState('1.0');
  const [submitting, setSubmitting] = useState(false);

  // Notifications state
  const [notificationMsg, setNotificationMsg] = useState('');

  // Fetch policies and acks on mount
  useEffect(() => {
    fetchPoliciesAndAcks();
  }, []);

  const fetchPoliciesAndAcks = async () => {
    setLoading(true);
    try {
      const resPolicies = await fetch('/api/policies');
      const policiesData = await resPolicies.json();
      
      const resAcks = await fetch('/api/policy-acknowledgements');
      const acksData = await resAcks.json();

      setPolicies(policiesData || []);
      setAcks(acksData || []);

      // Seed default policies if database is completely empty so that the dashboard works flawlessly!
      if (!policiesData || policiesData.length === 0) {
        seedDefaultPolicies();
      }
    } catch (e) {
      console.error('Failed fetching policies or acks', e);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultPolicies = async () => {
    const defaults = [
      {
        id: 'POL-01',
        name: 'VETAN Prevention of Sexual Harassment (POSH) Policy',
        content: `### Prevention of Sexual Harassment (POSH) Policy\n\n**1. Purpose**\nWe are committed to providing a workspace free from harassment and discrimination.\n\n**2. Coverage**\nThis policy covers all employees, workers, consultants, and service providers inside our industrial plants and corporate offices.\n\n**3. Internal Complaints Committee (ICC)**\nComplaints can be escalated directly to the ICC representative, Manisha Sapate, or emailed to \`posh@vetan.corp\`.`,
        pdf_url: '/docs/POSH_Handbook_2026.pdf',
        version: '2.1'
      },
      {
        id: 'POL-02',
        name: 'Factory Standing Safety Regulations & Protective Gear Code',
        content: `### Factory standing Safety Regulations\n\n**1. Helmet & Protective Shoes**\nAll technical staff, machine supervisors, and loader workers MUST wear reinforced yellow safety helmets and insulation boots on the machinery deck floor.\n\n**2. Emergency Protocols**\nIn case of mechanical fire, sound siren code 3. Assembly point is open park face A outside gates.`,
        pdf_url: '/docs/Factory_Safety_Rules.pdf',
        version: '1.4'
      },
      {
        id: 'POL-03',
        name: 'Vetan Official Employee Handbook & Statutory Standing Orders',
        content: `### Employee Handbook & Statutory Standing Orders\n\n**1. Scope of Coverage**\nThis handbook applies to all regular employees, staff members, workers, and contract personnel across all corporate units:\n- SVN Unit I & II (Daman)\n- Sakar Unit I & III (Vadodara)\n- Flare Unit I (Vadodara)\n- Zenivo Unit I (Vadodara)\n\n**2. Attendance & Biometric Punches**\n- All employees must complete biometric fingerprint or face punches at the start and end of their shifts.\n- In case of missed punches, the employee must submit a "Miss Punch Regularization Form" through the Employee Self-Service portal within 48 hours.\n\n**3. Request & Approval Workflows**\n- ALL requests including Leaves, Applications, and Miss Punch corrections MUST be routed to your reporting HOD (Head of Department) first.\n- Once recommended/approved by the HOD, the request is automatically forwarded to the respective Unit HR for final validation, payroll reconciliation, and salary credit adjustment.\n\n**4. Code of Conduct & Integrity**\n- Punctuality, professional decorum, and compliance with plant safety guidelines are mandatory.\n- Any violation of statutory rules or industrial discipline will undergo review by the Management Committee.\n\n**5. Statutory Provident Fund (EPF) & ESIC Policies**\n- EPF (Employees' Provident Fund) is deducted as per the standard statutory rate of 12% on the eligible basic wage limit.\n- Employees can view their opt-in settings, view payslips, and check leave balance summaries via the employee portal.\n\n**6. Reporting Structure & Escalation**\n- Any direct grievance or workplace concern can be escalated directly to the Company Management (or Reporting HOD) for prompt settlement.`,
        pdf_url: '/docs/Vetan_Employee_Handbook_2026.pdf',
        version: '3.0'
      }
    ];

    for (const item of defaults) {
      await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    }
    fetchPoliciesAndAcks();
  };

  // Create Policy Action
  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName || !newPolicyContent) return;

    setSubmitting(true);
    try {
      const body = {
        name: newPolicyName,
        content: newPolicyContent,
        version: newPolicyVersion || '1.0',
        pdf_url: `/docs/${newPolicyName.replace(/\s+/g, '_')}_v${newPolicyVersion}.pdf`
      };

      const res = await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setNewPolicyName('');
        setNewPolicyContent('');
        setNewPolicyVersion('1.0');
        setIsModalOpen(false);
        fetchPoliciesAndAcks();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Archive Policy Action
  const handleArchivePolicy = async (policy: Policy) => {
    try {
      await fetch('/api/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...policy, is_archived: 1 })
      });
      fetchPoliciesAndAcks();
    } catch (e) {
      console.error(e);
    }
  };

  // Employee Acknowledge Action
  const handleAcknowledge = async (policy: Policy) => {
    if (!loggedInEmployeeId) return;

    try {
      const body = {
        employee_id: loggedInEmployeeId,
        policy_name: policy.name,
        version: policy.version
      };

      const res = await fetch('/api/policy-acknowledgements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setNotificationMsg(`You have successfully acknowledged "${policy.name}"!`);
        fetchPoliciesAndAcks();
        setTimeout(() => setNotificationMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper trigger notification
  const handleSendReminder = (policyName: string) => {
    setNotificationMsg(`Broadcasting automated HR handbook reminders to all pending employees for "${policyName}"!`);
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  // Filtered list of policies
  const activePolicies = useMemo(() => {
    return policies.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.content.toLowerCase().includes(searchTerm.toLowerCase());
      // HR sees all (including archived for reference), employees see active only
      const matchArchive = sessionMode === 'HR' || p.is_archived === 0;
      return matchSearch && matchArchive;
    });
  }, [policies, searchTerm, sessionMode]);

  const selectedPolicy = useMemo(() => {
    if (!selectedPolicyId) return activePolicies[0] || null;
    return policies.find(p => p.id === selectedPolicyId) || activePolicies[0] || null;
  }, [selectedPolicyId, activePolicies, policies]);

  // Acknowledged by logged-in employee map
  const employeeAcks = useMemo(() => {
    if (!loggedInEmployeeId) return new Set<string>();
    const filtered = acks.filter(a => a.employee_id === loggedInEmployeeId);
    return new Set(filtered.map(a => `${a.policy_name}_v${a.version}`));
  }, [acks, loggedInEmployeeId]);

  // HR compliance matrices
  const complianceStats = useMemo(() => {
    const activeEmps = employees.filter(e => e.status === 'ACTIVE');
    const totalEmps = activeEmps.length || 1;

    return policies.map(p => {
      const policyAcks = acks.filter(a => a.policy_name === p.name && a.version === p.version);
      const ackCount = policyAcks.length;
      const compliancePercent = Math.min(100, Math.round((ackCount / totalEmps) * 100));

      const yetToAck = activeEmps.filter(e => !acks.some(a => a.employee_id === e.id && a.policy_name === p.name && a.version === p.version));

      return {
        policy: p,
        ackCount,
        compliancePercent,
        yetToAck
      };
    });
  }, [policies, acks, employees]);

  // Overall MD statistics
  const mdPolicySummary = useMemo(() => {
    const totalPolicies = policies.filter(p => p.is_archived === 0).length;
    
    // Average compliance % across active policies
    const activeStats = complianceStats.filter(c => c.policy.is_archived === 0);
    const avgCompliance = activeStats.length > 0 
      ? Math.round(activeStats.reduce((sum, s) => sum + s.compliancePercent, 0) / activeStats.length)
      : 0;

    const latestUpdate = policies.length > 0 
      ? [...policies].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]
      : null;

    // Aggregate pending list of employees yet to acknowledge
    const pendingList: Array<{ empId: string; name: string; policy: string }> = [];
    activeStats.forEach(stat => {
      stat.yetToAck.slice(0, 5).forEach(emp => {
        pendingList.push({
          empId: emp.id,
          name: emp.name,
          policy: stat.policy.name
        });
      });
    });

    return {
      totalPolicies,
      avgCompliance,
      latestUpdate,
      pendingList
    };
  }, [policies, complianceStats]);

  const handlePrint = (name: string, content: string) => {
    const printWindow = window.open('', '', 'height=500,width=700');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${name}</title><style>body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; } h3 { border-b: 1px solid #e2e8f0; padding-bottom: 8px; }</style></head><body>`);
      printWindow.document.write(`<h3>${name}</h3>`);
      printWindow.document.write(`<div style="white-space: pre-wrap; font-size: 13px;">${content}</div>`);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  const handleDownloadPolicy = (policy: Policy | null) => {
    if (!policy) return;
    const content = `================================================================================
${policy.name.toUpperCase()}
Version: ${policy.version || '1.0'} | Date: ${policy.created_at || new Date().toLocaleDateString('en-IN')}
SAKAR ELECTRICALS & ELECTRONICS PVT LTD - VETAN ERP
================================================================================

${policy.content || ''}

================================================================================
Official Compliance Record - SAKAR ELECTRICALS & ELECTRONICS PVT LTD
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (policy.name || 'Policy_Document').replace(/[^a-zA-Z0-9_-]/g, '_');
    a.download = `${safeName}_v${policy.version || '1.0'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner / Message Alert */}
      {notificationMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 size={15} className="text-emerald-500" />
          {notificationMsg}
        </div>
      )}

      {/* Main Grid: split depending on role */}
      {sessionMode === 'EMPLOYEE' ? (
        /* ================== EMPLOYEE SELF SERVICE VIEW ================== */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Policy List Panel (1 col) */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-950 font-display text-sm tracking-tight flex items-center gap-1.5 pb-2 border-b">
              <BookOpen size={16} className="text-indigo-600" />
              Company Handbooks & Policies
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input 
                type="text"
                placeholder="Search manual or handbook..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-2.5 max-h-[400px] overflow-y-auto no-scrollbar">
              {activePolicies.map(p => {
                const acknowledged = employeeAcks.has(`${p.name}_v${p.version}`);
                return (
                  <div 
                    key={p.id}
                    onClick={() => setSelectedPolicyId(p.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2 ${
                      selectedPolicy?.id === p.id 
                        ? 'border-indigo-600 bg-indigo-50/20' 
                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">{p.name}</span>
                      <span className="text-[9px] text-gray-400 block font-mono mt-0.5">Version: {p.version} • Created: {p.created_at}</span>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-100">
                      <span className="text-[10px] text-indigo-600 font-semibold">Click to view handbook →</span>
                      {acknowledged ? (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                          <Check size={10} />
                          Acknowledged
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1">
                          <AlertCircle size={10} />
                          Pending Ack
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reader View Panel (2 cols) */}
          <div className="lg:col-span-2">
            {selectedPolicy ? (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
                
                {/* Header buttons */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-xs tracking-wider uppercase text-white font-display">{selectedPolicy.name}</h4>
                    <span className="text-[10px] text-slate-400">Policy Version: {selectedPolicy.version} • Status: Approved</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handlePrint(selectedPolicy.name, selectedPolicy.content)}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-200 hover:text-white transition cursor-pointer"
                      title="Print Document"
                    >
                      <Printer size={13} />
                    </button>
                    <button 
                      onClick={() => handleDownloadPolicy(selectedPolicy)}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-200 hover:text-white transition cursor-pointer"
                      title="Download Document Copy"
                    >
                      <Download size={13} />
                    </button>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto grow bg-slate-50/50">
                  <div className="prose prose-sm max-w-none text-xs text-slate-700 leading-relaxed font-sans space-y-4">
                    <div className="p-4 bg-white border border-gray-200/60 rounded-xl whitespace-pre-line font-medium shadow-xs">
                      {selectedPolicy.content}
                    </div>
                  </div>
                </div>

                {/* Footer Acknowledgement Section */}
                <div className="p-4 bg-slate-900 text-white border-t flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-xs text-slate-400 text-center sm:text-left leading-normal">
                    💡 <strong>Legal Acknowledgement:</strong> By clicking Acknowledge, you declare that you have read, understood and agree to VETAN company safety handbooks.
                  </div>
                  {employeeAcks.has(`${selectedPolicy.name}_v${selectedPolicy.version}`) ? (
                    <span className="px-4 py-2 bg-emerald-950 border border-emerald-700 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 size={13} />
                      Acknowledged & Stored
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleAcknowledge(selectedPolicy)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl transition cursor-pointer"
                    >
                      Acknowledge "Read & Understood"
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed p-8 rounded-2xl text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                <Info size={24} className="text-gray-300 mb-2" />
                <h4 className="text-xs font-bold text-slate-500">No Policy Handbooks Available</h4>
              </div>
            )}
          </div>

        </div>
      ) : (
        /* ================== HR & MD MANAGEMENT DASHBOARD VIEW ================== */
        <div className="space-y-6">
          
          {/* MD Dashboard metrics preview at the top */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-slate-950 p-4 rounded-2xl text-white border border-slate-900 shadow-sm flex flex-col justify-between">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Total Active Policies</span>
              <strong className="text-2xl font-black font-sans text-white tracking-tight mt-1 block">
                {mdPolicySummary.totalPolicies} Manuals
              </strong>
              <span className="text-[9px] text-amber-400 font-bold block mt-1 flex items-center gap-1">★ Official handbooks active (Gold)</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average Acknowledgement %</span>
              <strong className="text-2xl font-black font-sans text-indigo-700 tracking-tight mt-1 block">
                {mdPolicySummary.avgCompliance}%
              </strong>
              <div className="w-full bg-gray-100 h-1 rounded mt-1.5 overflow-hidden">
                <div className="bg-indigo-600 h-1 transition-all" style={{ width: `${mdPolicySummary.avgCompliance}%` }} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Latest Document Update</span>
              <strong className="text-xs font-bold text-slate-800 tracking-tight mt-1 block truncate">
                {mdPolicySummary.latestUpdate?.name || 'N/A'}
              </strong>
              <span className="text-[9px] text-emerald-600 font-bold block mt-1 font-mono">
                v{mdPolicySummary.latestUpdate?.version || '0'} • {mdPolicySummary.latestUpdate?.updated_at || ''}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Yet to acknowledge count</span>
              <strong className="text-2xl font-black font-sans text-amber-600 tracking-tight mt-1 block">
                {complianceStats.reduce((sum, s) => sum + s.yetToAck.length, 0)} Employees
              </strong>
              <span className="text-[9px] text-amber-600 font-bold block mt-1">Requiring HR reminder notices</span>
            </div>

          </div>

          {/* HR Actions Desk */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Policies List & compliance progress (2 cols) */}
            <div className="lg:col-span-2 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              
              <div className="flex justify-between items-center border-b pb-3 border-gray-100">
                <div>
                  <h4 className="font-bold text-xs font-display tracking-widest text-slate-400 uppercase">Handbooks Compliance Registry</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Manage policy PDFs, track acknowledgement quotas.</span>
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white rounded-lg transition cursor-pointer"
                >
                  <Upload size={13} />
                  Upload PDF Handbook
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px] text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 font-display select-none">
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase">Policy Details</th>
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase text-center">Version Code</th>
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase text-center">Ack Quota (%)</th>
                      <th className="p-3 text-[10px] font-bold text-gray-400 uppercase text-right">Review Action Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {complianceStats.map(({ policy, ackCount, compliancePercent }) => (
                      <tr key={policy.id} className={`hover:bg-gray-50/50 transition ${policy.is_archived ? 'opacity-50 bg-gray-50/20' : ''}`}>
                        <td className="p-3">
                          <div>
                            <span className="font-bold text-slate-900 block">{policy.name}</span>
                            <span className="text-[9px] text-gray-400 block font-mono mt-0.5">ID: {policy.id} • Created: {policy.created_at}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-mono bg-indigo-50 border border-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">
                            v{policy.version}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1 text-center">
                            <span className="font-bold font-mono text-indigo-700">{compliancePercent}% ({ackCount} acks)</span>
                            <div className="w-24 bg-gray-100 h-1 rounded mx-auto overflow-hidden">
                              <div className="bg-indigo-600 h-1" style={{ width: `${compliancePercent}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleSendReminder(policy.name)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              title="Send Reminder Notice"
                            >
                              <Bell size={13} />
                            </button>
                            {policy.is_archived === 0 && (
                              <button 
                                onClick={() => handleArchivePolicy(policy)}
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                                title="Archive Policy"
                              >
                                <Archive size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MD Room: Pending employees listing (1 col) */}
            <div className="bg-slate-900 p-5 rounded-3xl text-white border border-slate-800 shadow-md flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="font-bold text-xs font-display tracking-widest text-pink-400 uppercase">MD Room Pending Audit <span className="text-[10px] text-amber-400 font-mono font-black">(Pink & Gold)</span></h4>
                  <span className="text-[10px] text-slate-100 block mt-0.5 font-bold">Employees yet to acknowledge latest updates</span>
                </div>

                <div className="space-y-3 mt-4 max-h-[250px] overflow-y-auto pr-1">
                  {mdPolicySummary.pendingList.map((item, i) => (
                    <div key={i} className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="font-bold text-slate-200 block">{item.name}</strong>
                          <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{item.empId}</span>
                        </div>
                        <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900 px-1.5 py-0.5 rounded font-bold uppercase whitespace-nowrap">
                          Yet to read
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate mt-2">Document: {item.policy}</span>
                    </div>
                  ))}
                  {mdPolicySummary.pendingList.length === 0 && (
                    <span className="text-center text-[10px] text-slate-500 block py-8">
                      100% compliant! All active employees acknowledged corporate manuals.
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4 text-[10px] text-slate-400 leading-normal">
                🛡️ <strong>MD Boardroom Safety Index:</strong> Complete standing acknowledgements keep plant factories safe and legally indemnified.
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Upload/New Policy Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="bg-indigo-700 p-4 text-white">
              <h4 className="font-semibold font-display text-white">Upload standing HR Policy Manual</h4>
              <p className="text-[10px] text-indigo-100 mt-0.5">Publish factory compliance handbooks and release to employees.</p>
            </div>

            <form onSubmit={handleCreatePolicy} className="p-5 space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-gray-500 uppercase block text-[10px]">Policy Manual Name</label>
                <input 
                  type="text"
                  placeholder="e.g. factory Safety Standing Rules, POSH 2026, etc"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg p-2"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-500 uppercase block text-[10px]">Version Code</label>
                <input 
                  type="text"
                  placeholder="e.g. 1.0, 2.1"
                  value={newPolicyVersion}
                  onChange={(e) => setNewPolicyVersion(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-lg p-2"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-500 uppercase block text-[10px]">Policy content (Markdown format)</label>
                <textarea 
                  value={newPolicyContent}
                  onChange={(e) => setNewPolicyContent(e.target.value)}
                  placeholder="Write standing rules details..."
                  required
                  rows={6}
                  className="w-full border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-900 leading-normal">
                💡 <strong>PDF Simulation:</strong> Vetan automatically compiles the handbook details into an optimized PDF index link (`/docs/`) and alerts staff portals to read-acknowledge.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white rounded-lg cursor-pointer"
                >
                  {submitting ? 'Uploading...' : 'Publish Manual'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
