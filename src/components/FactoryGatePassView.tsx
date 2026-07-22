/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  User, 
  Check, 
  X, 
  Plus, 
  AlertCircle, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  Search, 
  Filter, 
  QrCode, 
  ArrowRightLeft, 
  ExternalLink,
  Printer,
  CheckCircle
} from 'lucide-react';
import { Employee, CompanyMaster } from '../types';

interface FactoryGatePassViewProps {
  employees: Employee[];
  companies: CompanyMaster[];
  gatePasses: any[];
  activeCompany: string;
  sessionMode: 'MANAGEMENT' | 'HR' | 'EMPLOYEE';
  loggedInEmployeeId?: string;
  activeHR?: any;
  onRefresh: () => void;
}

export default function FactoryGatePassView({
  employees,
  companies,
  gatePasses,
  activeCompany,
  sessionMode,
  loggedInEmployeeId,
  activeHR,
  onRefresh
}: FactoryGatePassViewProps) {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState(loggedInEmployeeId || '');
  const [destinationType, setDestinationType] = useState<'INTERNAL' | 'VENDOR'>('INTERNAL');
  const [targetCompanyId, setTargetCompanyId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [vendorLocation, setVendorLocation] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedDeparture, setExpectedDeparture] = useState('');
  const [expectedReturn, setExpectedReturn] = useState('');

  // Selected Gate Pass for detailed Print view
  const [printPass, setPrintPass] = useState<any | null>(null);

  // Active user identity
  const currentUserId = sessionMode === 'EMPLOYEE' ? loggedInEmployeeId : (activeHR?.username || 'admin');
  const currentUserName = sessionMode === 'EMPLOYEE' 
    ? (employees.find(e => e.id === loggedInEmployeeId)?.name || 'Employee')
    : (activeHR?.name || 'HR Specialist');

  // Filter gate passes based on access
  const filteredPasses = gatePasses.filter(pass => {
    // 1. Employee mode: Only see own gate passes
    if (sessionMode === 'EMPLOYEE') {
      return pass.employee_id === loggedInEmployeeId;
    }
    // 2. HR Mode: Filter by company if not group/combined
    if (activeCompany !== 'GROUP' && activeCompany !== 'COMBINED') {
      return pass.company === activeCompany || pass.target_company === activeCompany;
    }
    return true;
  }).filter(pass => {
    // Search query matches
    const matchesSearch = 
      pass.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pass.employee_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pass.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pass.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pass.target_company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pass.vendor_location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    const matchesStatus = statusFilter === 'ALL' || pass.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleApplyPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !purpose || !expectedDeparture || !expectedReturn) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (destinationType === 'INTERNAL' && !targetCompanyId) {
      setErrorMsg('Please select a destination factory.');
      return;
    }

    if (destinationType === 'VENDOR' && (!vendorName || !vendorLocation)) {
      setErrorMsg('Please enter both Vendor Site Name and Location.');
      return;
    }

    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) {
      setErrorMsg('Invalid Employee selected.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/gate-passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: emp.id,
          employee_name: emp.name,
          company: emp.company,
          target_company: destinationType === 'INTERNAL' ? targetCompanyId : vendorName,
          purpose,
          applied_date: new Date().toISOString(),
          status: 'PENDING_HOD',
          reporting_hod: emp.reporting_hod_code || null,
          reporting_hod_name: emp.reporting_hod_name || null,
          destination_type: destinationType,
          vendor_location: destinationType === 'VENDOR' ? vendorLocation : null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg('Gate pass request submitted successfully and routed for approval.');
        setShowApplyModal(false);
        // Clear form
        setPurpose('');
        setTargetCompanyId('');
        setVendorName('');
        setVendorLocation('');
        setExpectedDeparture('');
        setExpectedReturn('');
        setDestinationType('INTERNAL');
        onRefresh();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(data.error || 'Failed to submit gate pass request.');
      }
    } catch (err: any) {
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (passId: string, status: string, additionalDetails = {}) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gate-passes/${passId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          details: {
            ...additionalDetails
          }
        })
      });
      if (res.ok) {
        setSuccessMsg(`Gate pass ${passId} status updated successfully to ${status}`);
        onRefresh();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Failed to update gate pass status.');
      }
    } catch (err: any) {
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper formatting dates
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  // Stats calculation
  const totalActivePasses = gatePasses.filter(p => p.status === 'CHECKED_OUT' || p.status === 'CHECKED_IN').length;
  const pendingApprovals = gatePasses.filter(p => p.status === 'PENDING_HOD').length;
  const completedToday = gatePasses.filter(p => p.status === 'RETURNED').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-emerald-50 text-[10px] font-bold text-emerald-800 border border-emerald-100 rounded-full font-mono uppercase tracking-wide">
                Statutory Security Suite
              </span>
              <span className="px-2.5 py-1 bg-amber-50 text-[10px] font-bold text-amber-800 border border-amber-100 rounded-full font-mono uppercase tracking-wide">
                New Feature
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight font-display mt-2 flex items-center gap-2">
              <ArrowRightLeft className="text-emerald-600" size={22} />
              Inter-Factory Gate Pass & Movement Tracker
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              औद्योगिक गेट पास एवं मूवमेंट सिस्टम - ट्रैक करें जब कर्मचारी एक इकाई से दूसरी इकाई में ड्यूटी हेतु जाते हैं।
            </p>
          </div>
          
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer select-none"
          >
            <Plus size={15} />
            Apply Gate Pass (गेट पास आवेदन)
          </button>
        </div>

        {/* Highlight Stats Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-emerald-50/50 border border-emerald-100/60 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Clock size={18} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">Active Employees Out</span>
              <div className="text-lg font-black text-slate-900">{totalActivePasses} Personnel</div>
              <span className="text-[9px] text-emerald-700 font-semibold block leading-none mt-0.5">Currently on inter-unit duty</span>
            </div>
          </div>

          <div className="bg-amber-50/50 border border-amber-100/60 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">Pending Approvals</span>
              <div className="text-lg font-black text-slate-900">{pendingApprovals} Applications</div>
              <span className="text-[9px] text-amber-700 font-semibold block leading-none mt-0.5">Awaiting HOD/HR signature</span>
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100/60 rounded-2xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800">
              <CheckCircle size={18} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase text-gray-400 block tracking-wider">Total Returned Safely</span>
              <div className="text-lg font-black text-slate-900">{completedToday} Gate Passes</div>
              <span className="text-[9px] text-blue-700 font-semibold block leading-none mt-0.5">Checked-in and completed today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner message handles */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-800 font-semibold">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <AlertCircle size={15} />
          {errorMsg}
        </div>
      )}

      {/* Live Movement Terminal & Filters */}
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-black text-slate-900 font-display">Active Gate Pass Register</h3>
            <p className="text-[11px] text-gray-400">View, audit, or approve active and historic plant movement records.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 lg:flex-initial min-w-[200px]">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Emp ID, Name..."
                className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 bg-gray-50/50"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs">
              <Filter size={13} className="text-gray-400" />
              <span className="text-gray-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-800 cursor-pointer focus:outline-none"
              >
                <option value="ALL">All Passes</option>
                <option value="PENDING_HOD">Pending Approval</option>
                <option value="APPROVED">Approved (Awaiting Exit)</option>
                <option value="CHECKED_OUT">Checked-Out (On Transit)</option>
                <option value="CHECKED_IN">Checked-In (At Destination)</option>
                <option value="RETURNED">Returned (Completed)</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Print Detailed view helper preview */}
        {printPass && (
          <div className="p-6 bg-amber-50/30 border border-amber-200/50 rounded-2xl relative">
            <button 
              onClick={() => setPrintPass(null)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
            <div className="max-w-2xl mx-auto bg-white p-6 border rounded-xl shadow-xs border-dashed border-slate-300" id="print-area">
              <div className="text-center pb-4 border-b border-dashed border-slate-200">
                <h4 className="text-base font-black text-slate-900 uppercase font-display">OFFICIAL INTER-UNIT MOVEMENT PASS</h4>
                <p className="text-[10px] text-gray-400 font-semibold tracking-wider">SAKAR &amp; SVN MULTI-UNIT ERP SYSTEM</p>
                <p className="text-[9px] text-emerald-700 font-bold mt-1 uppercase">Pass ID: {printPass.id}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 text-xs">
                <div>
                  <span className="text-gray-400 block font-medium">Employee Name &amp; ID:</span>
                  <span className="font-extrabold text-slate-800">{printPass.employee_name} ({printPass.employee_id})</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Authorized Unit (Source):</span>
                  <span className="font-extrabold text-emerald-800 uppercase font-mono">{printPass.company}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Destination Type:</span>
                  <span className="font-bold text-slate-800 uppercase text-[11px]">
                    {printPass.destination_type === 'VENDOR' ? '🏭 Vendor / Client Site' : '🏢 Internal Factory'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Target Destination Name:</span>
                  <span className="font-extrabold text-emerald-800 uppercase font-mono">{printPass.target_company}</span>
                </div>
                {printPass.destination_type === 'VENDOR' && (
                  <div className="col-span-2">
                    <span className="text-gray-400 block font-medium">Vendor Location / Address:</span>
                    <span className="font-extrabold text-amber-900 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 inline-block mt-0.5">
                      📍 {printPass.vendor_location}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 block font-medium">Request Status:</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase tracking-wider text-[9px]">
                    {printPass.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium">Authorized Signatory:</span>
                  <span className="font-semibold text-slate-800">{printPass.reporting_hod_name || 'Unit HR Representative'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 block font-medium">Purpose of Movement:</span>
                  <span className="font-semibold text-slate-800">{printPass.purpose}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-4 text-[10px] space-y-2">
                <span className="text-slate-400 font-bold uppercase block tracking-wider">Gate Security Log Entries:</span>
                <div className="grid grid-cols-2 gap-3 text-slate-700">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="font-medium text-[9px] text-gray-400 block">1. DEPARTURE PUNCH (Source Factory):</span>
                    <span className="font-bold">{formatDateTime(printPass.departure_time)}</span>
                    <span className="block text-[8px] text-gray-400 mt-0.5">Security Operator: {printPass.out_gate_security_id || 'Awaiting'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="font-medium text-[9px] text-gray-400 block">2. ARRIVAL PUNCH (Destination Factory):</span>
                    <span className="font-bold">{formatDateTime(printPass.arrival_time)}</span>
                    <span className="block text-[8px] text-gray-400 mt-0.5">Security Operator: {printPass.in_gate_security_id || 'Awaiting'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="font-medium text-[9px] text-gray-400 block">3. RETURN DEPARTURE PUNCH:</span>
                    <span className="font-bold">{formatDateTime(printPass.return_departure_time)}</span>
                    <span className="block text-[8px] text-gray-400 mt-0.5">Security Operator: {printPass.return_out_gate_security_id || 'Awaiting'}</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="font-medium text-[9px] text-gray-400 block">4. FINAL RETURN ARRIVAL PUNCH:</span>
                    <span className="font-bold">{formatDateTime(printPass.return_arrival_time)}</span>
                    <span className="block text-[8px] text-gray-400 mt-0.5">Security Operator: {printPass.return_in_gate_security_id || 'Awaiting'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={13} />
                  Print Out Gate Pass
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gate Passes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-extrabold uppercase bg-gray-50/50">
                <th className="py-3 px-4">Pass ID</th>
                <th className="py-3 px-4">Employee Details</th>
                <th className="py-3 px-4">Transit Route</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Gate Timings Log (In / Out)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions / Security Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredPasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 font-medium">
                    No active inter-factory gate passes found.
                  </td>
                </tr>
              ) : (
                filteredPasses.map((pass) => (
                  <tr key={pass.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800">
                      {pass.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-800">{pass.employee_name}</div>
                      <div className="text-[10px] text-gray-400 font-semibold">{pass.employee_id} • Unit: <span className="uppercase font-mono">{pass.company}</span></div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-700 uppercase font-mono">{pass.company}</span>
                        <ArrowRightLeft size={10} className="text-gray-400" />
                        {pass.destination_type === 'VENDOR' ? (
                          <span className="font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1" title="Vendor/Client Site">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            {pass.target_company}
                          </span>
                        ) : (
                          <span className="font-bold text-emerald-800 uppercase font-mono">{pass.target_company}</span>
                        )}
                      </div>
                      {pass.destination_type === 'VENDOR' ? (
                        <div className="text-[10px] text-slate-500 mt-1 font-medium bg-amber-50/20 px-1.5 py-0.5 rounded border border-amber-100 max-w-[200px] truncate" title={pass.vendor_location}>
                          📍 {pass.vendor_location || 'Not Specified'}
                        </div>
                      ) : (
                        <span className="text-[9.5px] text-gray-400 leading-none">Inter-unit movement</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600 max-w-[150px] truncate" title={pass.purpose}>
                      {pass.purpose}
                    </td>
                    <td className="py-3.5 px-4 space-y-1">
                      <div className="text-[10px] grid grid-cols-2 gap-x-2 text-slate-500">
                        <span>Departed:</span>
                        <span className="font-bold text-slate-800">{formatDateTime(pass.departure_time)}</span>
                        
                        <span>Arrived Destination:</span>
                        <span className="font-bold text-slate-800">{formatDateTime(pass.arrival_time)}</span>

                        <span>Return Departure:</span>
                        <span className="font-bold text-slate-800">{formatDateTime(pass.return_departure_time)}</span>

                        <span>Return Check-In:</span>
                        <span className="font-bold text-emerald-800">{formatDateTime(pass.return_arrival_time)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide inline-block ${
                        pass.status === 'PENDING_HOD' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        pass.status === 'APPROVED' ? 'bg-sky-100 text-sky-800 border border-sky-200' :
                        pass.status === 'CHECKED_OUT' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse' :
                        pass.status === 'CHECKED_IN' ? 'bg-purple-100 text-purple-800 border border-purple-200 animate-pulse' :
                        pass.status === 'RETURNED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {pass.status === 'PENDING_HOD' ? 'Pending Approval' :
                         pass.status === 'APPROVED' ? 'Approved' :
                         pass.status === 'CHECKED_OUT' ? 'Checked-Out' :
                         pass.status === 'CHECKED_IN' ? 'Active at Target' :
                         pass.status === 'RETURNED' ? 'Returned (Safe)' :
                         pass.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick print badge */}
                        <button
                          onClick={() => setPrintPass(pass)}
                          className="p-1.5 hover:bg-gray-100 text-slate-600 rounded-lg transition"
                          title="View / Print Pass"
                        >
                          <Printer size={14} />
                        </button>

                        {/* Approvals (HR / HOD only) */}
                        {sessionMode !== 'EMPLOYEE' && pass.status === 'PENDING_HOD' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(pass.id, 'APPROVED')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-0.5"
                            >
                              <Check size={11} /> Approve
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(pass.id, 'REJECTED')}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] rounded-lg transition cursor-pointer flex items-center gap-0.5"
                            >
                              <X size={11} /> Reject
                            </button>
                          </>
                        )}

                        {/* GATE DESK TERMINAL ACTIONS (Simulated check-out/check-in points) */}
                        {sessionMode !== 'EMPLOYEE' && (
                          <div className="flex gap-1">
                            {/* Check-Out Departure Punch */}
                            {pass.status === 'APPROVED' && (
                              <button
                                onClick={() => handleUpdateStatus(pass.id, 'CHECKED_OUT', {
                                  departure_time: new Date().toISOString(),
                                  out_gate_security_id: currentUserId
                                })}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1"
                                title="Punch OUT from Departure Gate"
                              >
                                <QrCode size={11} /> Gate OUT (P-1)
                              </button>
                            )}

                            {/* Check-In Destination Punch */}
                            {pass.status === 'CHECKED_OUT' && (
                              <button
                                onClick={() => handleUpdateStatus(pass.id, 'CHECKED_IN', {
                                  arrival_time: new Date().toISOString(),
                                  in_gate_security_id: currentUserId
                                })}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white font-black text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1"
                                title="Punch IN at Target Factory Gate"
                              >
                                <QrCode size={11} /> Gate IN (P-2)
                              </button>
                            )}

                            {/* Return Departure Target Punch */}
                            {pass.status === 'CHECKED_IN' && (
                              <button
                                onClick={() => handleUpdateStatus(pass.id, 'RETURN_DEPARTED', {
                                  return_departure_time: new Date().toISOString(),
                                  return_out_gate_security_id: currentUserId
                                })}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-slate-950 font-black text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1"
                                title="Punch OUT from Target Factory returning back"
                              >
                                <QrCode size={11} /> Target OUT (P-3)
                              </button>
                            )}

                            {/* Final Arrival Return Punch */}
                            {(pass.status === 'RETURN_DEPARTED' || pass.status === 'CHECKED_IN' || pass.status === 'CHECKED_OUT') && pass.status !== 'RETURNED' && (
                              <button
                                onClick={() => handleUpdateStatus(pass.id, 'RETURNED', {
                                  return_arrival_time: new Date().toISOString(),
                                  return_in_gate_security_id: currentUserId
                                })}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-lg transition cursor-pointer flex items-center gap-1"
                                title="Punch IN back at Source Gate"
                              >
                                <QrCode size={11} /> Return IN (P-4)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security instructions and guidelines */}
      <div className="p-5 bg-emerald-50 border border-emerald-150 rounded-3xl flex items-start gap-4">
        <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
          <ShieldCheck size={20} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black text-slate-900 font-display">Gate Security Guard Verification Workflow (नियम व निर्देश)</h4>
          <p className="text-[11px] text-slate-700 leading-relaxed">
            जब भी कोई कर्मचारी अपनी मूल फैक्ट्री छोड़कर दूसरी यूनिट में जा रहा हो, तो निम्नलिखित ४ चरण का पालन होना अनिवार्य है ताकि काम के समय का दुरुपयोग न हो:
          </p>
          <ul className="list-disc pl-5 text-[10.5px] text-slate-600 space-y-1 pt-1.5 font-sans">
            <li><strong>१. Gate OUT:</strong> कर्मचारी प्रस्थान के समय मूल गेट पर सुरक्षाकर्मी द्वारा Gate OUT पंच करवाएगा।</li>
            <li><strong>२. Gate IN:</strong> गंतव्य यूनिट (Target Factory) पहुँचने पर वहाँ के गेट सुरक्षाकर्मी द्वारा तुरंत Gate IN पंच होना चाहिए। इससे यात्रा का समय प्रमाणित होगा।</li>
            <li><strong>३. Target OUT:</strong> गंतव्य यूनिट में कार्य समाप्त करके वापस लौटते समय पुनः गेट से प्रस्थान पंच (Target OUT) करना आवश्यक है।</li>
            <li><strong>४. Return IN:</strong> पुनः मूल फैक्ट्री लौटने पर सुरक्षाकर्मी Final Check-In पंच (Return IN) करेगा, जिससे यह सिद्ध होगा कि कर्मचारी गंतव्य से सीधे वापस आया है।</li>
          </ul>
        </div>
      </div>

      {/* APPLY PASS MODAL */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-md w-full overflow-hidden shadow-2xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-slate-900 font-display">Apply for Factory Gate Pass</h3>
                <p className="text-xs text-gray-500">नया गेट पास / मूवमेंट रिक्वेस्ट सबमिट करें</p>
              </div>
              <button
                onClick={() => setShowApplyModal(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplyPass} className="space-y-4">
              {/* Employee selection (For HR/Management) */}
              {sessionMode !== 'EMPLOYEE' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Select Employee (कर्मचारी चुनें)</label>
                  <select
                    value={selectedEmpId}
                    onChange={(e) => setSelectedEmpId(e.target.value)}
                    required
                    className="w-full text-xs p-3 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 font-bold"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees
                      .filter(e => activeCompany === 'GROUP' || activeCompany === 'COMBINED' || e.company === activeCompany)
                      .map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.id}) - {e.designation}</option>
                      ))
                    }
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Employee ID</label>
                  <input
                    type="text"
                    disabled
                    value={currentUserName}
                    className="w-full text-xs p-3 border border-gray-200 bg-gray-50/50 rounded-xl text-slate-500 font-bold"
                  />
                </div>
              )}

              {/* Destination Type Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Destination Type (गंतव्य का प्रकार)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDestinationType('INTERNAL')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${destinationType === 'INTERNAL' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-gray-50 border-gray-200 text-slate-600 hover:bg-gray-100'}`}
                  >
                    🏢 Internal Factory
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestinationType('VENDOR')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition text-center ${destinationType === 'VENDOR' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-gray-50 border-gray-200 text-slate-600 hover:bg-gray-100'}`}
                  >
                    🏭 Vendor / Client Site
                  </button>
                </div>
              </div>

              {destinationType === 'INTERNAL' ? (
                /* Target Company */
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Destination Factory / Unit (गंतव्य फैक्ट्री)</label>
                  <select
                    value={targetCompanyId}
                    onChange={(e) => setTargetCompanyId(e.target.value)}
                    required={destinationType === 'INTERNAL'}
                    className="w-full text-xs p-3 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 font-bold"
                  >
                    <option value="">-- Choose Destination --</option>
                    {companies
                      .filter(c => c.id !== (employees.find(e => e.id === selectedEmpId)?.company || ''))
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                      ))
                    }
                  </select>
                </div>
              ) : (
                /* Custom Vendor Site Inputs */
                <div className="space-y-3 bg-amber-50/20 p-3 rounded-2xl border border-amber-100">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Vendor / Client Name (वेंडर या क्लाइंट का नाम)</label>
                    <input
                      type="text"
                      placeholder="e.g. Sakar Electricals Workshop / Tata Vendor Site"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      required={destinationType === 'VENDOR'}
                      className="w-full text-xs p-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-amber-500 text-slate-800 font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Vendor Location / Address (स्थान और पता)</label>
                    <input
                      type="text"
                      placeholder="e.g. Sector 5 GIDC, Gandhinagar / Site-B Plot 45"
                      value={vendorLocation}
                      onChange={(e) => setVendorLocation(e.target.value)}
                      required={destinationType === 'VENDOR'}
                      className="w-full text-xs p-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:border-amber-500 text-slate-800 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Expected Timings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Expected Departure</label>
                  <input
                    type="datetime-local"
                    value={expectedDeparture}
                    onChange={(e) => setExpectedDeparture(e.target.value)}
                    required
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Expected Return</label>
                  <input
                    type="datetime-local"
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                    required
                    className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800 font-medium"
                  />
                </div>
              </div>

              {/* Purpose */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Purpose of Visit (यात्रा का उद्देश्य)</label>
                <textarea
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. For maintenance, delivery check, training, HOD meet..."
                  required
                  rows={3}
                  className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 text-slate-800"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer select-none shadow-sm"
                >
                  {loading ? 'Submitting...' : 'Submit Pass Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
