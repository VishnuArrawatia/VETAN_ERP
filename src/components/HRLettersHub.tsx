import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Mail,
  MessageSquare,
  Smartphone,
  Download,
  Printer,
  Users,
  Search,
  CheckCircle,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  Calendar,
  AlertCircle,
  Building,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Send
} from 'lucide-react';
import { CompanyLogo } from './CompanyLogos';

interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  joining_date: string;
  base_salary: number;
  bank_name?: string;
  bank_account?: string;
  ifsc_code?: string;
  email: string;
  phone: string;
  company: string;
}

interface HRLettersHubProps {
  employees: Employee[];
  activeMonth: string;
  activeCompany: string;
  activeHR: {
    id: string;
    name: string;
    role: string;
  };
}

type LetterType = 'appointment' | 'increment' | 'experience';
type NotificationChannel = 'whatsapp' | 'sms' | 'email';

export default function HRLettersHub({
  employees,
  activeMonth,
  activeCompany,
  activeHR
}: HRLettersHubProps) {
  // Navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'hdfc' | 'letters'>('letters');

  // Common Selection States
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Part A: Notification states
  const [activeChannel, setActiveChannel] = useState<NotificationChannel>('whatsapp');
  const [testSendLoading, setTestSendLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  // Part B: HDFC Bank upload file states
  const [hdfcMonth, setHdfcMonth] = useState(activeMonth);
  const [hdfcCompany, setHdfcCompany] = useState(activeCompany);
  const [previewSlips, setPreviewSlips] = useState<any[]>([]);
  const [loadingSlips, setLoadingSlips] = useState(false);

  // Part C: Document Generator State
  const [activeLetterType, setActiveLetterType] = useState<LetterType>('appointment');
  const [signatoryName, setSignatoryName] = useState('Vishnu Sakar');
  const [signatoryDesignation, setSignatoryDesignation] = useState('Managing Director');
  
  // Custom letter variables
  const [probationMonths, setProbationMonths] = useState('6');
  const [incrementAmount, setIncrementAmount] = useState('10000');
  const [effectiveDate, setEffectiveDate] = useState('2026-07-01');
  const [exitDate, setExitDate] = useState('2026-06-30');
  const [conductQuality, setConductQuality] = useState('Excellent');

  // Filter employees
  const filteredEmployees = employees.filter(emp => {
    const text = searchQuery.toLowerCase();
    const matchesSearch = emp.name.toLowerCase().includes(text) || emp.id.toLowerCase().includes(text);
    const matchesCompany = activeCompany === 'ALL' || emp.company === activeCompany;
    return matchesSearch && matchesCompany;
  });

  // Default to first employee matching criteria
  useEffect(() => {
    if (filteredEmployees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(filteredEmployees[0].id);
    }
  }, [employees, activeCompany]);

  const selectedEmployee = employees.find(e => e.id === selectedEmpId) || filteredEmployees[0] || employees[0];

  // Fetch slips for HDFC Preview
  const fetchSlipsForHdfc = async () => {
    setLoadingSlips(true);
    try {
      const res = await fetch(`/api/payslips/month/${hdfcMonth}?company=${hdfcCompany}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewSlips(data || []);
      }
    } catch (err) {
      console.error('Error fetching slips:', err);
    } finally {
      setLoadingSlips(false);
    }
  };

  useEffect(() => {
    fetchSlipsForHdfc();
  }, [hdfcMonth, hdfcCompany]);

  // Format Helper
  const formatSalary = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    });
  };

  // Notification Template Builders
  const getWhatsAppTemplate = (emp: Employee) => {
    if (!emp) return '';
    const last4 = emp.bank_account ? emp.bank_account.slice(-4) : 'XXXX';
    return `*SALARY CREDIT ALERT* 💸
    
Dear *${emp.name}*,

We are pleased to inform you that your salary for the month of *${activeMonth}* has been successfully processed and credited.

🔹 *Net Amount:* ${formatSalary(emp.base_salary)}
🔹 *Account:* ******${last4}
🔹 *Status:* SUCCESS / CREDITED

You can download your detailed payslip from the employee portal. Thank you for your hard work!

Best regards,
*HR Operations Team*
_Sakar & SVN Group_`;
  };

  const getSMSTemplate = (emp: Employee) => {
    if (!emp) return '';
    const last4 = emp.bank_account ? emp.bank_account.slice(-4) : 'XXXX';
    return `Alert: Dear ${emp.name}, your salary for ${activeMonth} of ${formatSalary(emp.base_salary)} has been credited to bank account ******${last4}. Regards, HR Dept, Sakar Group.`;
  };

  const getEmailTemplate = (emp: Employee) => {
    if (!emp) return '';
    const last4 = emp.bank_account ? emp.bank_account.slice(-4) : 'XXXX';
    return `Subject: Salary Credit Intimation - ${activeMonth}

Dear ${emp.name} (${emp.id}),

This is to inform you that your salary for the month of ${activeMonth} has been credited to your registered bank account on ${new Date().toISOString().split('T')[0]}.

Disbursement Details:
------------------------------------
Employee Name:     ${emp.name}
Designation:       ${emp.designation}
Bank Account:      ******${last4}
Net Salary Paid:   ${formatSalary(emp.base_salary)}
------------------------------------

The detailed payslip is available for download on the Employee Self-Service (ESS) Portal. If you have any queries regarding your payroll calculation, please write to us at hr@sakarelectricals.com.

Thank you for your valuable contribution and dedication!

Sincerely,
HR & Payroll Team
Sakar & SVN Group`;
  };

  const handleSendTestNotification = async () => {
    if (!selectedEmployee) return;
    setTestSendLoading(true);
    setNotificationStatus(null);
    try {
      const channelLabel = activeChannel === 'whatsapp' ? 'WhatsApp' : activeChannel === 'sms' ? 'SMS' : 'Email';
      const res = await fetch('/api/delivery/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmployee.id,
          method: activeChannel.toUpperCase(),
          media: 'CONFIRMATION',
          month: activeMonth
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNotificationStatus(`✅ Test ${channelLabel} successfully dispatched to ${selectedEmployee.name}! Check the terminal logs for simulated delivery output.`);
      } else {
        setNotificationStatus(`❌ Failed to send: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setNotificationStatus(`❌ Error sending notification: ${err.message}`);
    } finally {
      setTestSendLoading(false);
    }
  };

  // Printing utility
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Print CSS override to hide all sidebar/UI controls and print just the letter container */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-letter-container, #print-letter-container * {
            visibility: visible;
          }
          #print-letter-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white p-6 rounded-2xl shadow-xs relative overflow-hidden print:hidden">
        <div className="absolute right-0 bottom-0 opacity-15 translate-x-10 translate-y-10">
          <FileText size={200} />
        </div>
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest block">SAKAR & SVN GROUP SERVICES</span>
          <h2 className="text-2xl font-black tracking-tight font-display">Communication, Banking & Letters Hub</h2>
          <p className="text-slate-300 text-xs max-w-2xl mt-1 leading-relaxed">
            Configure salary credit notification templates, audit the HDFC bank salary file export, and instantly generate official employment documents.
          </p>
        </div>
      </div>

      {/* Main Navigation Sub-tabs */}
      <div className="flex border-b border-gray-200 pb-px gap-6 print:hidden">
        <button
          onClick={() => setActiveSubTab('letters')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider relative cursor-pointer transition ${
            activeSubTab === 'letters' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>Document Letter Generator</span>
          {activeSubTab === 'letters' && (
            <motion.div layoutId="letters-active-bar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider relative cursor-pointer transition ${
            activeSubTab === 'notifications' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>Salary Credit Notifications</span>
          {activeSubTab === 'notifications' && (
            <motion.div layoutId="letters-active-bar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('hdfc')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider relative cursor-pointer transition ${
            activeSubTab === 'hdfc' ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <span>HDFC Salary Upload Formatter</span>
          {activeSubTab === 'hdfc' && (
            <motion.div layoutId="letters-active-bar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
          )}
        </button>
      </div>

      {/* Subtab Contents */}
      <div>
        <AnimatePresence mode="wait">
          
          {/* ==================== SUBTAB A: LETTERS GENERATOR ==================== */}
          {activeSubTab === 'letters' && (
            <motion.div
              key="letters-subtab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 xl:grid-cols-12 gap-6"
            >
              {/* Left Column: Selector & Configuration Fields */}
              <div className="xl:col-span-4 space-y-6 print:hidden">
                <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">Document Templates</h4>
                    <p className="text-[10px] text-gray-400">Select document to preview & print</p>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <button
                      onClick={() => setActiveLetterType('appointment')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        activeLetterType === 'appointment' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' : 'hover:bg-slate-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <UserCheck size={16} className={activeLetterType === 'appointment' ? 'text-emerald-600' : 'text-gray-400'} />
                      <div className="text-xs">Appointment Letter</div>
                    </button>

                    <button
                      onClick={() => setActiveLetterType('increment')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        activeLetterType === 'increment' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' : 'hover:bg-slate-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <TrendingUp size={16} className={activeLetterType === 'increment' ? 'text-emerald-600' : 'text-gray-400'} />
                      <div className="text-xs">Salary Increment Letter</div>
                    </button>

                    <button
                      onClick={() => setActiveLetterType('experience')}
                      className={`p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        activeLetterType === 'experience' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' : 'hover:bg-slate-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <FileText size={16} className={activeLetterType === 'experience' ? 'text-emerald-600' : 'text-gray-400'} />
                      <div className="text-xs">Experience Certificate</div>
                    </button>
                  </div>
                </div>

                {/* Employee Selector */}
                <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">Select Target Employee</h4>
                    <p className="text-[10px] text-gray-400">Dynamic fields will pull from selected record</p>
                  </div>

                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search staff..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-1.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="max-h-[160px] overflow-y-auto border rounded-xl divide-y">
                    {filteredEmployees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedEmpId(emp.id)}
                        className={`w-full text-left p-2.5 text-[11px] transition flex items-center justify-between ${
                          selectedEmpId === emp.id ? 'bg-emerald-50 font-semibold text-emerald-950' : 'hover:bg-slate-50 text-gray-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="font-bold block text-gray-900">{emp.name}</span>
                          <span className="text-[9px] text-gray-400">{emp.designation} • {emp.id}</span>
                        </div>
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-sm shrink-0 uppercase font-mono">{emp.company}</span>
                      </button>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <div className="p-4 text-center text-gray-400 text-[11px]">No active staff matches.</div>
                    )}
                  </div>
                </div>

                {/* Letter Options Form */}
                <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">Customizable Variables</h4>
                    <p className="text-[10px] text-gray-400">Add template-specific variables below</p>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {activeLetterType === 'appointment' && (
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Probation Period (Months)</label>
                        <input
                          type="number"
                          value={probationMonths}
                          onChange={(e) => setProbationMonths(e.target.value)}
                          className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    )}

                    {activeLetterType === 'increment' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Salary Hike (₹)</label>
                          <input
                            type="number"
                            value={incrementAmount}
                            onChange={(e) => setIncrementAmount(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Effective Date</label>
                          <input
                            type="date"
                            value={effectiveDate}
                            onChange={(e) => setEffectiveDate(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
                          />
                        </div>
                      </div>
                    )}

                    {activeLetterType === 'experience' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Date of Exit</label>
                          <input
                            type="date"
                            value={exitDate}
                            onChange={(e) => setExitDate(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Conduct Conducted</label>
                          <select
                            value={conductQuality}
                            onChange={(e) => setConductQuality(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                          >
                            <option value="Excellent">Excellent</option>
                            <option value="Very Good">Very Good</option>
                            <option value="Good">Good/Satisfactory</option>
                          </select>
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-3.5 space-y-3">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Authorized HR Signatory</label>
                        <input
                          type="text"
                          value={signatoryName}
                          onChange={(e) => setSignatoryName(e.target.value)}
                          placeholder="e.g. Vishnu Sakar"
                          className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Signatory Title</label>
                        <input
                          type="text"
                          value={signatoryDesignation}
                          onChange={(e) => setSignatoryDesignation(e.target.value)}
                          placeholder="e.g. Managing Director"
                          className="w-full p-2 border rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: PDF/A4 Live Document Canvas */}
              <div className="xl:col-span-8 flex flex-col items-center">
                
                {/* Canvas control header */}
                <div className="w-full bg-slate-100 border-t border-x rounded-t-2xl p-4 flex items-center justify-between shadow-xs print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">A4 Letterhead Live preview</span>
                  </div>
                  
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    <Printer size={14} />
                    <span>Print or Download PDF</span>
                  </button>
                </div>

                {/* Letter Container A4 simulated box */}
                <div 
                  id="print-letter-container"
                  className="w-full max-w-[800px] min-h-[1050px] bg-white border border-gray-200 shadow-lg rounded-b-2xl p-12 md:p-16 text-gray-800 flex flex-col justify-between font-serif relative overflow-hidden"
                >
                  {/* Decorative Sakar Letterhead Top Band */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-emerald-700" />
                  
                  {/* Letterhead Body */}
                  <div className="space-y-8">
                    {/* Company Header */}
                    <div className="flex justify-between items-start border-b-2 border-emerald-900 pb-5">
                      <div className="flex gap-4 items-start">
                        {selectedEmployee && (
                          <div className="shrink-0 p-1 bg-slate-50 border rounded-xl">
                            <CompanyLogo company={selectedEmployee.company} className="h-10" showText={false} />
                          </div>
                        )}
                        <div className="space-y-1">
                          <h1 className="text-xl md:text-2xl font-black font-sans tracking-tight text-emerald-950 uppercase">
                            {selectedEmployee?.company === 'SVN-1' ? 'SVN Opto Electronics Pvt. Ltd.' : 'Sakar Electricals & Electronics Pvt. Ltd.'}
                          </h1>
                          <p className="text-[10px] md:text-xs text-gray-500 font-sans tracking-wide leading-relaxed max-w-md">
                            {selectedEmployee?.company === 'SVN-1' 
                              ? 'Regd. Office: 101, Sakar Corporate Tower, Alkapuri, Vadodara, Gujarat - 390007\nFactory: Savli GIDC, Savli, Vadodara, Gujarat - 391775' 
                              : 'Factory: Plot No. 248, Savli GIDC, Savli, Vadodara, Gujarat - 391775'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-[10px] md:text-xs font-sans text-gray-400 space-y-0.5">
                        <strong className="text-emerald-950 block">CIN: U31900GJ2015PTC085123</strong>
                        <span>Email: hr@sakarelectricals.com</span>
                        <span className="block">Web: www.sakarelectricals.com</span>
                      </div>
                    </div>

                    {/* Meta info: Reference and Date */}
                    <div className="flex justify-between items-center text-xs font-sans text-gray-600">
                      <div>
                        <strong>REF NO:</strong> {(selectedEmployee?.company || 'SAKAR') + '/' + activeMonth.replace('-', '') + '/' + (selectedEmployee?.id || 'EMP')}
                      </div>
                      <div>
                        <strong>DATE:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Recipient Details */}
                    {selectedEmployee ? (
                      <div className="text-xs font-sans text-gray-800 space-y-1">
                        <strong className="text-sm block text-gray-950">To,</strong>
                        <strong className="text-sm block text-emerald-950">{selectedEmployee.name}</strong>
                        <div>Employee Code: {selectedEmployee.id}</div>
                        <div>Designation: {selectedEmployee.designation}</div>
                        <div>Email: {selectedEmployee.email}</div>
                        <div>Contact No: {selectedEmployee.phone}</div>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed text-center text-xs text-gray-400">
                        Please select or add an employee to render document metadata.
                      </div>
                    )}

                    {/* Dynamic Template Content */}
                    <div className="text-[13px] md:text-sm text-gray-800 leading-relaxed font-serif space-y-4 pt-4">
                      
                      {/* 1. Appointment Letter */}
                      {activeLetterType === 'appointment' && selectedEmployee && (
                        <>
                          <h3 className="text-center font-sans font-bold text-sm md:text-base text-gray-950 underline tracking-wide uppercase mb-6">
                            Subject: Offer of Appointment for the Position of {selectedEmployee.designation}
                          </h3>

                          <p>Dear {selectedEmployee.name},</p>
                          
                          <p>
                            With reference to your interview and subsequent discussions, we are extremely pleased to offer you an appointment as <strong>{selectedEmployee.designation}</strong> in our company on the following terms and conditions:
                          </p>

                          <ol className="list-decimal pl-5 space-y-2.5">
                            <li>
                              <strong>Date of Joining:</strong> Your date of joining will be <strong>{new Date(selectedEmployee.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.
                            </li>
                            <li>
                              <strong>Compensation Structure:</strong> Your gross starting CTC salary structure will be <strong>{formatSalary(selectedEmployee.base_salary)}</strong> per month. Details of your salary components are accessible via your ESS portal.
                            </li>
                            <li>
                              <strong>Probation Period:</strong> You will be on probation for a period of <strong>{probationMonths} months</strong> from your date of joining. Upon successful assessment of performance, your services will be confirmed in writing.
                            </li>
                            <li>
                              <strong>Work Location:</strong> Your initial place of work will be our vadodara manufacturing headquarters. However, your services are transferrable to other locations or group subsidiaries depending on business requirements.
                            </li>
                          </ol>

                          <p>
                            Please sign and return the duplicate copy of this letter as a token of your formal acceptance of the offer. We welcome you to Sakar & SVN Group and look forward to building an outstanding career together.
                          </p>
                        </>
                      )}

                      {/* 2. Salary Increment Letter */}
                      {activeLetterType === 'increment' && selectedEmployee && (
                        <>
                          <h3 className="text-center font-sans font-bold text-sm md:text-base text-gray-950 underline tracking-wide uppercase mb-6">
                            Subject: Salary Revision and Annual Appraisal
                          </h3>

                          <p>Dear {selectedEmployee.name},</p>
                          
                          <p>
                            In appreciation of your exceptional contributions, continuous dedication, and performance reviews during the past year, we are pleased to inform you that your base compensation structure is being revised.
                          </p>

                          <p>
                            Effective from <strong>{new Date(effectiveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>, your monthly base wage structure will be revised upwards as detailed below:
                          </p>

                          <div className="bg-slate-50 border rounded-xl p-4 font-sans text-xs space-y-2 max-w-md mx-auto my-4">
                            <div className="flex justify-between border-b pb-1.5">
                              <span className="text-gray-500">Current Monthly Base Wage:</span>
                              <span className="font-bold font-mono">{formatSalary(selectedEmployee.base_salary)}</span>
                            </div>
                            <div className="flex justify-between border-b pb-1.5 text-emerald-700">
                              <span className="font-semibold">Hike Amount Approved:</span>
                              <span className="font-bold font-mono">+ {formatSalary(Number(incrementAmount))}</span>
                            </div>
                            <div className="flex justify-between pt-1 font-bold text-gray-900 text-[13px]">
                              <span>New Monthly Base Wage:</span>
                              <span className="font-mono text-emerald-900">{formatSalary(selectedEmployee.base_salary + Number(incrementAmount))}</span>
                            </div>
                          </div>

                          <p>
                            All other terms and conditions of your employment contract remain unchanged. We appreciate your diligent work and hope that you will continue to deliver excellent performance to achieve new growth milestones.
                          </p>
                        </>
                      )}

                      {/* 3. Experience Certificate */}
                      {activeLetterType === 'experience' && selectedEmployee && (
                        <>
                          <h3 className="text-center font-sans font-bold text-sm md:text-base text-gray-950 underline tracking-wide uppercase mb-8 pt-4">
                            TO WHOMSOEVER IT MAY CONCERN
                          </h3>

                          <p className="indent-8 leading-relaxed">
                            This is to formally certify that <strong>{selectedEmployee.name}</strong> (Employee ID: {selectedEmployee.id}) was employed with us as <strong>{selectedEmployee.designation}</strong> under our registered business division from <strong>{new Date(selectedEmployee.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong> until his/her formal relieving on <strong>{new Date(exitDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.
                          </p>
                          
                          <p>
                            During his/her tenure of employment with us, we found {selectedEmployee.name} to be extremely diligent, sincere, and proactive in executing all corporate responsibilities. His/her technical aptitude and interpersonal conduct has been evaluated as <strong>{conductQuality}</strong>.
                          </p>

                          <p>
                            We appreciate his/her valuable efforts towards our manufacturing plant operations and wish him/her the absolute best in all future professional endeavors.
                          </p>
                        </>
                      )}

                    </div>
                  </div>

                  {/* Signatory & Footer stamp */}
                  <div className="space-y-12">
                    {/* Authorized Signatory signature section */}
                    <div className="flex justify-between items-end font-sans">
                      <div>
                        <div className="text-xs text-gray-400 mb-8 font-sans">For {selectedEmployee?.company === 'SVN-1' ? 'SVN Opto Electronics Pvt. Ltd.' : 'Sakar Electricals & Electronics Pvt. Ltd.'},</div>
                        <div className="border-t border-gray-400 pt-1.5 text-xs text-gray-900 font-bold w-48">
                          {signatoryName}
                          <span className="block font-normal text-[10px] text-gray-500">{signatoryDesignation}</span>
                        </div>
                      </div>
                      
                      {/* Simulated stamp mark */}
                      <div className="border-2 border-emerald-900/30 text-emerald-900/40 text-[9px] uppercase font-bold p-2.5 rounded-full rotate-12 select-none pointer-events-none">
                        Sakar HR Approved
                      </div>
                    </div>

                    {/* Footer Address Details */}
                    <div className="border-t pt-3.5 text-center text-[9px] text-gray-400 font-sans tracking-wider space-y-0.5">
                      <span>CONFIDENTIAL OFFICIAL EMPLOYMENT COMMUNICATIONS</span>
                      <p>Sakar Electricals &amp; Electronics Pvt. Ltd. &amp; SVN Opto Electronics Pvt. Ltd. • ISO 9001:2015 Registered Manufacturing Plant Headquarters</p>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* ==================== SUBTAB B: NOTIFICATIONS PREVIEW ==================== */}
          {activeSubTab === 'notifications' && (
            <motion.div
              key="notifications-subtab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Selector Column */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Employee dropdown picker */}
                <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">Select Recipient Employee</h4>
                    <p className="text-[10px] text-gray-400">See personalized templates for each staff member</p>
                  </div>

                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search staff..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-1.5 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="max-h-[180px] overflow-y-auto border rounded-xl divide-y">
                    {filteredEmployees.map(emp => (
                      <button
                        key={emp.id}
                        onClick={() => setSelectedEmpId(emp.id)}
                        className={`w-full text-left p-2.5 text-[11px] transition flex items-center justify-between ${
                          selectedEmpId === emp.id ? 'bg-emerald-50 font-semibold text-emerald-950' : 'hover:bg-slate-50 text-gray-700'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="font-bold block text-gray-900">{emp.name}</span>
                          <span className="text-[9px] text-gray-400">{emp.designation} • {emp.id}</span>
                        </div>
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded-sm shrink-0 uppercase font-mono">{emp.company}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Media Selector */}
                <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">Notification Channel</h4>
                    <p className="text-[10px] text-gray-400">Select communication medium</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveChannel('whatsapp')}
                      className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        activeChannel === 'whatsapp' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' : 'hover:bg-slate-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <MessageSquare size={16} className={activeChannel === 'whatsapp' ? 'text-emerald-600' : 'text-gray-400'} />
                      <div className="text-xs">WhatsApp Business API</div>
                    </button>

                    <button
                      onClick={() => setActiveChannel('sms')}
                      className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        activeChannel === 'sms' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' : 'hover:bg-slate-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <Smartphone size={16} className={activeChannel === 'sms' ? 'text-emerald-600' : 'text-gray-400'} />
                      <div className="text-xs">SMS Gateway (DND Compliant)</div>
                    </button>

                    <button
                      onClick={() => setActiveChannel('email')}
                      className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                        activeChannel === 'email' ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold' : 'hover:bg-slate-50 border-gray-200 text-gray-700'
                      }`}
                    >
                      <Mail size={16} className={activeChannel === 'email' ? 'text-emerald-600' : 'text-gray-400'} />
                      <div className="text-xs">SMTP Credit Intimation Email</div>
                    </button>
                  </div>
                </div>

                {/* Dispatch Trigger Controls */}
                <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">Delivery Simulator</h4>
                    <p className="text-[10px] text-gray-400">Trigger simulated transmission to test templates</p>
                  </div>

                  <button
                    onClick={handleSendTestNotification}
                    disabled={testSendLoading || !selectedEmployee}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
                  >
                    {testSendLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Sending Simulation...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Dispatch Test Notice</span>
                      </>
                    )}
                  </button>

                  {notificationStatus && (
                    <div className="p-3 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-[10px] leading-relaxed">
                      {notificationStatus}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Mock Preview Device Column */}
              <div className="lg:col-span-8 flex flex-col items-center">
                
                {/* 1. WHATSAPP / PHONE DEVICE MOCK */}
                {activeChannel === 'whatsapp' && selectedEmployee && (
                  <div className="w-full max-w-[380px] bg-slate-900 border-[10px] border-slate-800 rounded-[3rem] p-4 pt-10 pb-6 shadow-2xl relative overflow-hidden">
                    {/* Speaker Camera notch */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-full flex items-center justify-center gap-2">
                      <div className="w-12 h-1 bg-slate-700 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-slate-700 rounded-full" />
                    </div>

                    {/* WhatsApp Header App layout */}
                    <div className="bg-[#075E54] text-white p-3 rounded-t-xl flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-slate-800 font-bold shrink-0">S</div>
                      <div>
                        <strong className="block font-bold">Sakar & SVN Group HR</strong>
                        <span className="text-[9px] opacity-85">Business Account</span>
                      </div>
                    </div>

                    {/* Chat Bubble container */}
                    <div className="bg-[#ECE5DD] h-[400px] p-3 overflow-y-auto space-y-4 flex flex-col justify-end">
                      
                      <div className="bg-white rounded-lg p-3 text-xs text-gray-800 max-w-[85%] shadow-xs relative self-start border-l-4 border-emerald-600 whitespace-pre-wrap font-sans">
                        {getWhatsAppTemplate(selectedEmployee)}
                        <span className="absolute right-1 bottom-1 text-[8px] text-gray-400">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                    </div>
                  </div>
                )}

                {/* 2. SMS DEVICE MOCK */}
                {activeChannel === 'sms' && selectedEmployee && (
                  <div className="w-full max-w-[380px] bg-slate-900 border-[10px] border-slate-800 rounded-[3rem] p-4 pt-10 pb-6 shadow-2xl relative overflow-hidden">
                    {/* Speaker Camera notch */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-full flex items-center justify-center gap-2">
                      <div className="w-12 h-1 bg-slate-700 rounded-full" />
                      <div className="w-2.5 h-2.5 bg-slate-700 rounded-full" />
                    </div>

                    {/* SMS Header layout */}
                    <div className="bg-slate-100 p-3 rounded-t-xl text-center text-xs text-slate-700 border-b">
                      <strong className="block text-gray-900">VK-SAKARHR</strong>
                      <span className="text-[9px] text-gray-400">Short Code Gateway</span>
                    </div>

                    {/* Message Bubble container */}
                    <div className="bg-slate-50 h-[400px] p-3 overflow-y-auto flex flex-col justify-end">
                      <div className="bg-slate-200 rounded-2xl p-3 text-[11px] text-gray-800 max-w-[85%] self-start shadow-2xs leading-relaxed whitespace-pre-wrap font-sans">
                        {getSMSTemplate(selectedEmployee)}
                        <span className="block text-right text-[8px] text-gray-400 mt-1">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. EMAIL CLIENT MOCK */}
                {activeChannel === 'email' && selectedEmployee && (
                  <div className="w-full bg-white border border-gray-200 shadow-md rounded-2xl overflow-hidden flex flex-col font-sans">
                    {/* Browser top header window */}
                    <div className="bg-slate-100 p-3 flex items-center gap-2 border-b">
                      <div className="flex gap-1.5 shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="bg-white border rounded-md text-[10px] text-center px-4 py-0.5 text-gray-400 flex-1 truncate max-w-sm">
                        https://mail.sakarelectricals.com/inbox
                      </div>
                    </div>

                    {/* Email Headers */}
                    <div className="p-4 border-b space-y-2 text-xs bg-slate-50">
                      <div>
                        <span className="text-gray-400 w-16 inline-block font-bold">From:</span>
                        <strong className="text-gray-800">Sakar & SVN HR Operations Team &lt;hr@sakarelectricals.com&gt;</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 w-16 inline-block font-bold">To:</span>
                        <strong className="text-gray-800">{selectedEmployee.name} &lt;{selectedEmployee.email}&gt;</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 w-16 inline-block font-bold">Subject:</span>
                        <strong className="text-emerald-950">Salary Credit Intimation - {activeMonth}</strong>
                      </div>
                    </div>

                    {/* Email Body */}
                    <div className="p-6 h-[340px] overflow-y-auto whitespace-pre-wrap text-xs text-gray-800 leading-relaxed font-mono">
                      {getEmailTemplate(selectedEmployee)}
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* ==================== SUBTAB C: HDFC BANK UPLOAD ==================== */}
          {activeSubTab === 'hdfc' && (
            <motion.div
              key="hdfc-subtab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Form selection controls */}
              <div className="bg-white border rounded-2xl p-5 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Month</label>
                  <input
                    type="month"
                    value={hdfcMonth}
                    onChange={(e) => setHdfcMonth(e.target.value)}
                    className="w-full text-xs p-2 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Filter Company</label>
                  <select
                    value={hdfcCompany}
                    onChange={(e) => setHdfcCompany(e.target.value)}
                    className="w-full text-xs p-2 border rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="ALL">ALL Companies Combined</option>
                    <option value="SVN-1">SVN Opto Electronics Pvt Ltd</option>
                    <option value="SVN II">Sakar Electricals (Unit II)</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex gap-3">
                  <a
                    href={`/api/excel/export/bank/hdfc/${hdfcMonth}?company=${hdfcCompany}&format=excel`}
                    download
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-xs text-center"
                  >
                    <FileSpreadsheet size={14} />
                    <span>Download Excel Format</span>
                  </a>

                  <a
                    href={`/api/excel/export/bank/hdfc/${hdfcMonth}?company=${hdfcCompany}&format=csv`}
                    download
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-xs text-center"
                  >
                    <Download size={14} />
                    <span>Download HDFC CSV</span>
                  </a>
                </div>
              </div>

              {/* Grid layouts description */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Bank standard mapping instructions */}
                <div className="lg:col-span-4 bg-white border rounded-2xl p-5 shadow-xs space-y-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">HDFC Bank Salary Upload spec</h4>
                    <p className="text-[10px] text-gray-400">Mandatory format rules for corporate net-banking</p>
                  </div>

                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    The exported sheet utilizes the standard <strong>HDFC Corporate Enet bulk transfer structure</strong>, mapping the following transaction properties exactly:
                  </p>

                  <div className="space-y-2 text-[10px] font-mono">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-400">Column A (System Code):</span>
                      <strong className="text-gray-800">"HDFC" Identifier</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-400">Column B (Account):</span>
                      <strong className="text-gray-800">Beneficiary Bank Account</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-400">Column C (Amount):</span>
                      <strong className="text-emerald-700">Net Salary (Rounded)</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-400">Column D (Beneficiary Name):</span>
                      <strong className="text-gray-800">Employee Name</strong>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-gray-400">Column E (IFS Code):</span>
                      <strong className="text-gray-800">NEFT/RTGS IFS Code</strong>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-gray-400">Column F (Transaction Code):</span>
                      <strong className="text-gray-800">Salary Credit Narrative</strong>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2.5 items-start text-blue-950 text-[10px] leading-relaxed">
                    <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5" />
                    <p>
                      <strong>Note:</strong> Ensure all employee bank account details are up-to-date in the Staff Directory before uploading this payload into HDFC Enet Portal to avoid immediate batch rejections.
                    </p>
                  </div>
                </div>

                {/* Slip summary registry list */}
                <div className="lg:col-span-8 bg-white border rounded-2xl p-5 shadow-xs flex flex-col min-h-[360px]">
                  <div className="border-b pb-3 mb-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider font-display">Export Batch Preview</h4>
                      <p className="text-[10px] text-gray-400">Previewing records ready for HDFC file upload for: {hdfcMonth}</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-700 uppercase font-mono">
                      {previewSlips.length} Staff Slips
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto border rounded-xl bg-slate-50">
                    {loadingSlips ? (
                      <div className="flex items-center justify-center py-20">
                        <span className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : previewSlips.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-center space-y-1.5">
                        <span className="text-2xl">📁</span>
                        <h5 className="font-bold text-xs text-gray-800">No salary calculated for this month</h5>
                        <p className="text-[10px] text-gray-400 max-w-xs">Run salary calculations in the "Salary calculation sheet" tab first before exporting bank upload spreadsheets.</p>
                      </div>
                    ) : (
                      <table className="w-full text-[10px] text-left border-collapse">
                        <thead className="bg-slate-100 text-slate-700 font-bold border-b text-[9px] uppercase sticky top-0">
                          <tr>
                            <th className="p-2.5">Beneficiary Account</th>
                            <th className="p-2.5">Name</th>
                            <th className="p-2.5">IFSC Code</th>
                            <th className="p-2.5 text-right">Transfer Amount</th>
                            <th className="p-2.5 text-right">Transfer Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y bg-white">
                          {previewSlips.map((slip: any) => {
                            const emp = employees.find(e => e.id === slip.employee_id);
                            const isHdfc = emp?.bank_name?.toLowerCase().includes('hdfc');
                            return (
                              <tr key={slip.id} className="hover:bg-slate-50 font-mono">
                                <td className="p-2.5 text-gray-900 font-bold">{emp?.bank_account || 'N/A'}</td>
                                <td className="p-2.5 font-sans font-bold text-gray-800">{slip.employee_name}</td>
                                <td className="p-2.5 text-gray-600">{emp?.ifsc_code || 'N/A'}</td>
                                <td className="p-2.5 text-right text-emerald-800 font-bold">{formatSalary(slip.net_salary)}</td>
                                <td className="p-2.5 text-right">
                                  <span className={`px-1.5 py-0.5 rounded-sm text-[8px] font-bold uppercase tracking-wider ${
                                    isHdfc ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {isHdfc ? 'HDFC Internal' : 'NEFT / RTGS'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
