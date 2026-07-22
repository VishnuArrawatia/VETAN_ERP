import React, { useState } from 'react';
import { BookOpen, Printer, UserCheck, Shield, Users, ArrowRight, CheckCircle, HelpCircle, FileText, Smartphone, Laptop, Key, Clock, Calendar, FileSpreadsheet, Upload, Download, AlertTriangle } from 'lucide-react';

export default function UserGuideView() {
  const [lang, setLang] = useState<'en' | 'hi'>('hi'); // Default to Hindi as requested by Hindi query
  const [activeRole, setActiveRole] = useState<'employee' | 'hod' | 'hr'>('employee');

  const [uploadedHandbook, setUploadedHandbook] = useState<{
    name: string;
    uploadedAt: string;
    size: string;
    fileUrl?: string;
  } | null>({
    name: 'Sakar_Official_Employee_Handbook_v3.5.pdf',
    uploadedAt: '17-Jul-2026 10:30 AM',
    size: '2.4 MB'
  });
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleHandbookUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError(lang === 'en' ? 'Only PDF files are allowed!' : 'केवल PDF फाइलें ही अपलोड की जा सकती हैं!');
      return;
    }
    setUploadError('');
    setIsUploading(true);
    const objectUrl = URL.createObjectURL(file);
    setTimeout(() => {
      setUploadedHandbook({
        name: file.name,
        uploadedAt: new Date().toLocaleDateString('en-IN') + ' ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        fileUrl: objectUrl
      });
      setIsUploading(false);
    }, 1200);
  };

  const handleDownloadHandbook = () => {
    if (!uploadedHandbook) return;

    if (uploadedHandbook.fileUrl) {
      const a = document.createElement('a');
      a.href = uploadedHandbook.fileUrl;
      a.download = uploadedHandbook.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const docTitle = "SAKAR ELECTRICALS & ELECTRONICS PVT LTD";
    const docSubtitle = "OFFICIAL EMPLOYEE HANDBOOK & STATUTORY STANDING ORDERS v3.5";
    const dateStr = new Date().toLocaleDateString('en-IN');

    const content = `================================================================================
          ${docTitle}
             VETAN ERP - ${docSubtitle}
================================================================================
Units Covered: Sakar Unit I & III (Vadodara) | SVN Unit I & II (Daman) | Flare | Zenivo
Document Version: 3.5 (Official Release)
Date of Issue: 17-Jul-2026

--------------------------------------------------------------------------------
SECTION 1: ATTENDANCE & BIOMETRIC RULES
--------------------------------------------------------------------------------
1. Attendance Punches: All employees must complete biometric fingerprint or face punches at shift start & end.
2. Grace Period: A maximum of 10 minutes grace time is permitted up to 3 times per calendar month.
3. Missed Punch Regularization: In case of missed punches, submit a "Miss Punch Regularization" request via Vetan Employee Self-Service portal within 48 hours.
4. Overtime (OT): Approved factory overtime is credited based on biometric shift calculations after reporting HOD verification.

--------------------------------------------------------------------------------
SECTION 2: LEAVE & APPLICATION WORKFLOWS
--------------------------------------------------------------------------------
1. Request Routing: ALL requests (Casual Leave, Paid Leave, Sick Leave, Duty On Tour, Gatepass) MUST be routed to your Reporting HOD first.
2. Final HR Settlement: Upon HOD approval, requests are automatically routed to Unit HR for final validation and payroll processing.
3. Comp-Off Expiry Policy: Earned comp-off credits automatically expire 180 days after credit.

--------------------------------------------------------------------------------
SECTION 3: LOANS & ADVANCES POLICY
--------------------------------------------------------------------------------
1. Eligibility: Employees with minimum 1 year of continuous service are eligible.
2. Standard Repayment Tenure: Repayment is structured between 6 to 12 Months EMI Repayment (Capped at 12 Months max).
3. Deduction: Monthly EMI is auto-deducted directly from monthly salary slips.

--------------------------------------------------------------------------------
SECTION 4: CODE OF CONDUCT & PLANT SAFETY REGULATIONS
--------------------------------------------------------------------------------
1. Mandatory Protective Equipment: High-density safety helmets and insulated footwear required on factory floors.
2. Decorum & Integrity: Punctuality, workplace respect, and zero tolerance for statutory non-compliance.

SECTION 5: PAYROLL & STATUTORY DEDUCTIONS
--------------------------------------------------------------------------------
1. EPF & ESIC: Standard statutory deductions calculated automatically.
2. Payslip Generation: Monthly payslips available on 1st of every month.

================================================================================
Issued by: Human Resources & Operations Management
SAKAR ELECTRICALS & ELECTRONICS PVT LTD
Verified on: ${dateStr}
================================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = uploadedHandbook.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  const images = {
    login: "/src/assets/images/login_guide_1783284972788.jpg",
    dashboard: "/src/assets/images/dashboard_guide_1783284985379.jpg",
    leave: "/src/assets/images/leave_guide_1783284997231.jpg",
    hod: "/src/assets/images/hod_guide_1783285008669.jpg",
    payroll: "/src/assets/images/payroll_guide_1783285018822.jpg"
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 md:p-6 print:p-0">
      {/* HEADER SECTION (HIDDEN IN PRINT) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-150 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:hidden select-none">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-700">
            <BookOpen size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-display">System User Guide & Step-by-Step Manual</h2>
            <p className="text-xs text-gray-500">Official step-by-step guidebook with interactive screenshots for SAKAR ELECTRICALS & ELECTRONICS PVT LTD.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Language Selector */}
          <div className="bg-gray-100 p-0.5 rounded-lg flex items-center border">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${lang === 'en' ? 'bg-white text-slate-900 shadow-xs font-bold border' : 'text-slate-500 hover:text-slate-900'}`}
            >
              English
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition ${lang === 'hi' ? 'bg-white text-slate-900 shadow-xs font-bold border' : 'text-slate-500 hover:text-slate-900'}`}
            >
              हिन्दी (Hindi)
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition select-none cursor-pointer"
          >
            <Printer size={14} />
            {lang === 'en' ? 'Print Guide / Save PDF' : 'गाइड प्रिंट करें / PDF सेव करें'}
          </button>
        </div>
      </div>

      {/* PRINT-ONLY HEADER */}
      <div className="hidden print:block text-center border-b pb-6 mb-8">
        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">SAKAR ELECTRICALS & ELECTRONICS PVT LTD</h1>
        <p className="text-sm font-semibold text-emerald-800 mt-1">VETAN ERP - USER MANUAL & SYSTEM GUIDE</p>
        <p className="text-[10px] text-gray-500 mt-1">Generated on: {new Date().toLocaleDateString('en-IN')} | System Version 3.5 (Official)</p>
      </div>

      {/* ROLE CONTROLLER (TABS) */}
      <div className="flex bg-gray-100 p-1.5 rounded-2xl border print:hidden select-none max-w-lg">
        <button
          onClick={() => setActiveRole('employee')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${activeRole === 'employee' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <UserCheck size={14} />
          {lang === 'en' ? '1. Employee Self Service' : '1. कर्मचारी स्व-सेवा'}
        </button>
        <button
          onClick={() => setActiveRole('hod')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${activeRole === 'hod' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Users size={14} />
          {lang === 'en' ? '2. HOD Approvals' : '2. विभागाध्यक्ष (HOD)'}
        </button>
        <button
          onClick={() => setActiveRole('hr')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${activeRole === 'hr' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
        >
          <Shield size={14} />
          {lang === 'en' ? '3. HR & Admin' : '3. एचआर और एडमिन'}
        </button>
      </div>

      {/* MAIN GUIDE CONTAINER */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 md:p-8 space-y-12">
        
        {/* ==================================== */}
        {/* OFFICIAL EMPLOYEE PDF HANDBOOK & SYSTEM WORKFLOW SECTION */}
        {/* ==================================== */}
        <div className="bg-slate-50/70 p-5 md:p-8 rounded-3xl border border-slate-150 space-y-8 select-none print:hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[10px] bg-rose-600 text-white font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase inline-block mb-2">
                {lang === 'en' ? 'Core System Architecture & Files' : 'मुख्य सिस्टम संरचना और दस्तावेज़'}
              </span>
              <h3 className="text-base font-extrabold text-slate-900 font-display flex items-center gap-2">
                <FileText className="text-rose-500" size={18} />
                {lang === 'en' ? 'Official Employee PDF Handbook Portal' : 'आधिकारिक कर्मचारी नियमावली पुस्तिका (PDF Handbook)'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {lang === 'en' ? 'Upload, manage, or download the latest rules and policies handbook for Sakar & SVN units.' : 'साकार और एसवीएन यूनिट्स के नियमों तथा नीतियों की पीडीएफ बुक अपलोड या डाउनलोड करें।'}
              </p>
            </div>

            {/* Simulated Live Action Status */}
            <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-800 px-3.5 py-2 rounded-2xl border border-emerald-100/80 text-xs font-bold">
              <CheckCircle size={15} className="text-emerald-500 shrink-0" />
              <div>
                <p className="leading-none text-[11px] font-black">{lang === 'en' ? 'Connected to Vetan ERP Storage' : 'Vetan ERP क्लाउड स्टोरेज सक्रिय है'}</p>
                <p className="text-[9px] text-emerald-600 font-bold mt-0.5">Auto-Synced with HOD & Employee Portals</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Handbook Upload/Download Portal */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                {lang === 'en' ? 'Manage PDF Document' : 'पीडीएफ दस्तावेज़ प्रबंधित करें'}
              </h4>

              {uploadedHandbook ? (
                <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-emerald-100 p-2 rounded-xl text-emerald-700">
                      <FileText size={20} />
                    </div>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{uploadedHandbook.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{uploadedHandbook.size} • Uploaded {uploadedHandbook.uploadedAt}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadHandbook}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      <Download size={11} />
                      {lang === 'en' ? 'Download Handbook' : 'नियमावली डाउनलोड करें'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setUploadedHandbook(null)}
                      className="px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-[10px] font-bold rounded-lg transition border border-transparent hover:border-rose-100 cursor-pointer"
                    >
                      {lang === 'en' ? 'Replace' : 'बदलें'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 hover:border-slate-300 transition-all bg-slate-50/50">
                  <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Upload size={18} />
                  </div>
                  <div>
                    <label className="cursor-pointer block">
                      <span className="text-xs font-bold text-slate-800 hover:text-emerald-600 transition underline">
                        {lang === 'en' ? 'Click to upload PDF' : 'कर्मचारी नियमावली PDF अपलोड करने के लिए क्लिक करें'}
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleHandbookUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[9px] text-slate-400 mt-1">Accepts only official .pdf files up to 10MB</p>
                  </div>
                </div>
              )}

              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-200">
                  <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  {lang === 'en' ? 'Processing and linking handbook guidelines to AI compliance engines...' : 'नियमावली को प्रोसेस कर कंप्लायंस इंजन से लिंक किया जा रहा है...'}
                </div>
              )}

              {uploadError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl text-[10.5px] font-bold flex items-center gap-1.5">
                  <AlertTriangle size={13} className="text-rose-500" />
                  {uploadError}
                </div>
              )}

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 border">
                <span className="text-[9.5px] font-extrabold text-slate-500 uppercase block">
                  {lang === 'en' ? 'HOW TO UPLOAD IN COLOURED BINDING:' : 'प्रिंट एवं अपलोड संबंधी निर्देश:'}
                </span>
                <ul className="text-[10px] text-slate-600 list-decimal pl-4 space-y-1 leading-normal">
                  <li>
                    {lang === 'en' 
                      ? 'Ensure all leave slabs and overtime policies in the PDF exactly match the software settings.' 
                      : 'सुनिश्चित करें कि पीडीएफ में उल्लेखित सभी नीतियां सॉफ्टवेयर की सेटिंग्स से हूबहू मेल खाती हों।'}
                  </li>
                  <li>
                    {lang === 'en' 
                      ? 'Upload high-resolution documents with compressed size below 10MB for fast load times on employee mobile apps.' 
                      : 'मोबाइल एप पर त्वरित लोड के लिए पीडीएफ फाइल का आकार 10MB से कम रखें।'}
                  </li>
                  <li>
                    {lang === 'en' 
                      ? 'Once uploaded, the Handbook will immediately appear on the Employee Portal download dashboard.' 
                      : 'अपलोड होते ही यह नियमावली सभी कर्मचारियों के स्वयं-सेवा पोर्टल पर डाउनलोड के लिए उपलब्ध हो जाएगी।'}
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Step-by-Step Absolute Routing Workflow & Features */}
            <div className="lg:col-span-7 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                {lang === 'en' ? 'OFFICIAL SYSTEM WORKFLOW (रूटीन निर्देश)' : 'सिस्टम उपयोग करने का तरीका (STEP-BY-STEP WORKFLOW)'}
              </h4>

              <div className="relative border-l border-slate-200 pl-4 space-y-5">
                {/* Point 1: Routing */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-100"></div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-900">
                      {lang === 'en' ? '1. Absolute HOD-to-HR Routing (हाजिरी सुधार व छुट्टी आवेदन)' : '1. अनिवार्य हाजिरी सुधार एवं अवकाश आवेदन मार्ग (HOD -> HR Route)'}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {lang === 'en' 
                        ? 'All employee self-service submissions (Leave requests, Mis-punch regularizations) must FIRST route directly to their designated reporting HOD. Once approved by the HOD, the request automatically transfers to the active Unit HR for final validation and payroll credit adjustments.' 
                        : 'कर्मचारी द्वारा प्रस्तुत सभी आवेदन (छुट्टी के लिए लीव फॉर्म या हाजिरी सुधार के लिए मिस-पंच फॉर्म) अनिवार्य रूप से सबसे पहले उनके नामित विभागाध्यक्ष (HOD) के पास अनुमोदन के लिए जाएंगे। HOD द्वारा प्रमाणित करने के बाद ही यह संबंधित यूनिट एचआर के डैशबोर्ड पर अंतिम स्वीकृति और वेतन गणना के लिए हस्तांतरित किए जाएंगे।'}
                    </p>
                  </div>
                </div>

                {/* Point 2: Admin Unlock */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-2 ring-blue-100"></div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-900">
                      {lang === 'en' ? '2. Admin Master Un-Lock & Reset (बंद पेरोल महीना पुनः खोलें)' : '2. एडमिन मास्टर अनलॉक और रीसेट फंक्शन का उपयोग'}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {lang === 'en' 
                        ? 'If a salary cycle for a month is already "CLOSED", it blocks further edits. To alter attendance, apply corrections, or recalculate draft wages, click the "Admin Un-Lock & Reset" button under the Payroll Register and enter the Super Admin Security PIN (Default is 1234). This immediately reverts the status to DRAFT, enabling full modification rights.' 
                        : 'यदि किसी महीने का वेतन चक्र "CLOSED" हो चुका है, तो उसमें कोई बदलाव नहीं किया जा सकता। ऐसी स्थिति में, सैलरी पुनः गणना करने या सुधार करने के लिए पेरोल रजिस्टर के अंतर्गत "Admin Un-Lock & Reset" बटन दबाएं और सुपर एडमिन सुरक्षा पिन (डिफ़ॉल्ट "1234") दर्ज करें। इससे वेतन चक्र तुरंत DRAFT स्थिति में बदल जाएगा और आप पुनः बदलाव कर पाएंगे।'}
                    </p>
                  </div>
                </div>

                {/* Point 3: Scroll limit */}
                <div className="relative">
                  <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-100"></div>
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-slate-900">
                      {lang === 'en' ? '3. Festival Scrolling Message & Show Limit (त्यौहार संदेश प्रदर्शन अवधि)' : '3. त्यौहार संदेश / आवश्यक सूचना का न्यूनतम समय'}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {lang === 'en' 
                        ? 'To ensure high employee engagement and visibility, the festival launch banner is programmed to stay active for a minimum of 15 seconds. Employees cannot close it before 15 seconds, or they must explicitly click the "X" button to dismiss it once the timer permits. This guarantees all staff read the vital policy updates.' 
                        : 'यह सुनिश्चित करने के लिए कि सभी कर्मचारी आवश्यक त्यौहार संदेश या नोटिस को ध्यानपूर्वक पढ़ें, सिस्टम में संदेश की प्रदर्शन अवधि को न्यूनतम 15 सेकंड के लिए लॉक किया गया है। 15 सेकंड से पहले इसे ऑटो-बंद नहीं किया जा सकता, या समय पूरा होने पर वे इसे "X" बटन पर क्लिक करके बंद कर सकते हैं।'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* ==================================== */}
        {/* 1. EMPLOYEE ROLE GUIDE */}
        {/* ==================================== */}
        {(activeRole === 'employee' || window.matchMedia('print').matches) && (
          <div className="space-y-10">
            <div className="border-b pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-lg">Level 1</span>
                  {lang === 'en' ? 'Employee Portal Operations Guide' : 'कर्मचारी स्वयं-सेवा संचालन मार्गदर्शिका'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'en' ? 'Instructions for punching attendance, checking payslips, and leave applications.' : 'हाजिरी लगाने, सैलरी स्लिप देखने और छुट्टी आवेदन की पूरी जानकारी।'}
                </p>
              </div>
            </div>

            {/* Step 1: Login */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b pb-8">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">1</span>
                  <h4 className="text-sm font-bold text-slate-800">
                    {lang === 'en' ? 'Step 1: Secure Login & Password Setup' : 'चरण 1: सुरक्षित लॉगिन और पासवर्ड बदलना'}
                  </h4>
                </div>
                
                {lang === 'en' ? (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      Every employee is registered with a unique <strong>Reference ID</strong> (e.g., <code className="bg-gray-100 px-1 rounded text-red-600 font-mono">EMP001</code>).
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Enter your unique Employee ID and default password assigned by HR.</li>
                      <li><strong>Mandatory Password Reset:</strong> Upon first login, you will be prompted to set a new secure password of your choice.</li>
                      <li>Keep your password safe as it protects your financial salary records.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      साकार इलेक्ट्रिकल्स एंड इलेक्ट्रॉनिक्स प्राइवेट लिमिटेड (SAKAR ELECTRICALS & ELECTRONICS PVT LTD) के प्रत्येक कर्मचारी को एक यूनिक <strong>Reference ID</strong> प्रदान की जाती है (जैसे <code className="bg-gray-100 px-1 rounded text-red-600 font-mono">EMP001</code>)।
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5">
                      <li>अपना एम्प्लॉई आईडी और एचआर द्वारा दिया गया डिफॉल्ट पासवर्ड दर्ज करें।</li>
                      <li><strong>पासवर्ड बदलना अनिवार्य है:</strong> पहली बार लॉगिन करने पर सुरक्षा कारणों से आपको अपना नया पासवर्ड बनाना होगा।</li>
                      <li>नया पासवर्ड सुरक्षित रखें क्योंकि यह आपके सैलरी रिकॉर्ड की सुरक्षा करता है।</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="lg:col-span-7">
                <div className="border rounded-2xl overflow-hidden shadow-xs bg-gray-50 p-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1 px-1">
                    {lang === 'en' ? 'Reference Screenshot: Login Window' : 'संदर्भ चित्र: लॉगिन स्क्रीन'}
                  </span>
                  <img
                    src={images.login}
                    alt="Login Interface Guide"
                    className="w-full h-auto rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Dashboard & Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b pb-8">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">2</span>
                  <h4 className="text-sm font-bold text-slate-800">
                    {lang === 'en' ? 'Step 2: Check Attendance & Dashboard' : 'चरण 2: मासिक अटेंडेंस और डैशबोर्ड देखना'}
                  </h4>
                </div>

                {lang === 'en' ? (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      The home screen displays your active work status, leave balances, and holidays:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Attendance Log:</strong> Check your monthly check-in and check-out timings in real-time.</li>
                      <li><strong>Overtime Tracker:</strong> Review extra hours recorded under official shift logs.</li>
                      <li><strong>Holiday Calendar:</strong> View national and local paid holidays directly from the calendar list.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      लॉगिन करने के बाद आपको मुख्य डैशबोर्ड दिखाई देगा, जहां आपकी मासिक अटेंडेंस और छुट्टियां दर्ज होती हैं:
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5">
                      <li><strong>अटेंडेंस का विवरण:</strong> अपनी दैनिक आगमन (In-Time) और प्रस्थान (Out-Time) का समय देखें।</li>
                      <li><strong>ओवरटाइम:</strong> आपकी पाली (Shift) के बाद किए गए अतिरिक्त काम के घंटों का विवरण दर्ज होता है।</li>
                      <li><strong>हॉलिडे कैलेंडर:</strong> सरकारी और साकार इलेक्ट्रिकल्स एंड इलेक्ट्रॉनिक्स प्राइवेट लिमिटेड के सवैतनिक अवकाशों की सूची सीधे देख सकते हैं।</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="lg:col-span-7">
                <div className="border rounded-2xl overflow-hidden shadow-xs bg-gray-50 p-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1 px-1">
                    {lang === 'en' ? 'Reference Screenshot: Employee Dashboard' : 'संदर्भ चित्र: एम्प्लॉई डैशबोर्ड'}
                  </span>
                  <img
                    src={images.dashboard}
                    alt="Employee Dashboard Guide"
                    className="w-full h-auto rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Leaves */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-4">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">3</span>
                  <h4 className="text-sm font-bold text-slate-800">
                    {lang === 'en' ? 'Step 3: Apply for Leaves & Comp-Off' : 'चरण 3: छुट्टी और कंप-ऑफ के लिए आवेदन करना'}
                  </h4>
                </div>

                {lang === 'en' ? (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      Applying for leaves is completely digitalized:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Navigate to <strong>Leaves Portal</strong> on your sidebar.</li>
                      <li>Choose leave type: <strong>PL</strong> (Privilege Leave), <strong>CL</strong> (Casual Leave), or <strong>SL</strong> (Sick Leave).</li>
                      <li><strong>Compensatory Off (Comp-Off):</strong> If you worked on Sunday or any holiday, select "Comp-Off" to credit extra hours back to your balance.</li>
                      <li>Click submit. Your HOD will receive an instant approval notification.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      छुट्टियों के लिए आवेदन करना अब पूर्ण रूप से डिजिटल है:
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5">
                      <li>साइडबार में <strong>Leaves</strong> विकल्प पर क्लिक करें।</li>
                      <li>अपनी छुट्टी का प्रकार चुनें: <strong>PL</strong> (सवैतनिक अवकाश), <strong>CL</strong> (आकस्मिक अवकाश), या <strong>SL</strong> (बीमारी अवकाश)।</li>
                      <li><strong>कंप-ऑफ (Comp-Off):</strong> यदि आपने रविवार या राष्ट्रीय अवकाश के दिन कार्य किया है, तो अतिरिक्त छुट्टी पाने के लिए "Comp-Off" चुनें।</li>
                      <li>सबमिट करें। इसके बाद आपके विभागाध्यक्ष (HOD) के पास मंजूरी के लिए सूचना चली जाएगी।</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="lg:col-span-7">
                <div className="border rounded-2xl overflow-hidden shadow-xs bg-gray-50 p-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1 px-1">
                    {lang === 'en' ? 'Reference Screenshot: Leave Application Panel' : 'संदर्भ चित्र: छुट्टी आवेदन फॉर्म'}
                  </span>
                  <img
                    src={images.leave}
                    alt="Leave Application Guide"
                    className="w-full h-auto rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* 2. HOD ROLE GUIDE */}
        {/* ==================================== */}
        {(activeRole === 'hod' || window.matchMedia('print').matches) && (
          <div className="space-y-10">
            <div className="border-b pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-lg">Level 2</span>
                  {lang === 'en' ? 'HOD Leave Verification & Roster Workflow' : 'विभागाध्यक्ष (HOD) छुट्टी स्वीकृति संचालन पुस्तिका'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'en' ? 'Reviewing pending leaves, tracking team balance, and approving rosters.' : 'लंबित छुट्टी आवेदनों की जांच, टीम के अवकाश बही की गणना और शिफ्ट प्रबंधन।'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-4">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs">1</span>
                  <h4 className="text-sm font-bold text-slate-800">
                    {lang === 'en' ? 'Step-by-Step Approval Actions' : 'छुट्टी स्वीकृत या अस्वीकृत करने की प्रक्रिया'}
                  </h4>
                </div>

                {lang === 'en' ? (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      As a Head of Department (HOD), you manage floor operations by filtering leave requests:
                    </p>
                    <ul className="list-decimal pl-4 space-y-2">
                      <li><strong>Check Alerts:</strong> When a department member applies for a leave, a badge notification lights up on your dashboard.</li>
                      <li><strong>Verify Balance:</strong> The panel dynamically displays the team member's active remaining balances (PL, CL, SL) so you can make informed decisions.</li>
                      <li><strong>Maintain Floor Roster:</strong> Avoid granting simultaneous leaves to multiple key personnel during peak production times.</li>
                      <li>Click <strong className="text-emerald-600">Approve</strong> to forward it to final HR processing, or <strong className="text-rose-600">Reject</strong> with an explanatory remark.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      विभागाध्यक्ष (HOD) के रूप में, आप अपने विभाग के सुचारू संचालन के लिए छुट्टी अनुरोधों की समीक्षा करते हैं:
                    </p>
                    <ul className="list-decimal pl-4 space-y-2.5">
                      <li><strong>नोटिफिकेशन अलर्ट:</strong> जब भी आपके विभाग का कोई कर्मचारी छुट्टी का आवेदन करेगा, आपके डैशबोर्ड पर अलर्ट चमकेगा।</li>
                      <li><strong>बैलेंस की जांच:</strong> सिस्टम आपको तुरंत कर्मचारी के बचे हुए अवकाशों (PL, CL, SL) का ब्योरा दिखाएगा ताकि सही निर्णय लिया जा सके।</li>
                      <li><strong>फ्लोर संचालन का ध्यान रखें:</strong> फैक्ट्री फ्लोर पर एक ही समय में कई मुख्य ऑपरेटरों को छुट्टी देने से बचें ताकि उत्पादन प्रभावित न हो।</li>
                      <li>संतुष्ट होने पर <strong className="text-emerald-600">Approve</strong> दबाएं (यह अंतिम मंजूरी के लिए एचआर को जाएगा) या कारण के साथ <strong className="text-rose-600">Reject</strong> करें।</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="lg:col-span-7">
                <div className="border rounded-2xl overflow-hidden shadow-xs bg-gray-50 p-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1 px-1">
                    {lang === 'en' ? 'Reference Screenshot: HOD Approval Actions' : 'संदर्भ चित्र: विभागाध्यक्ष (HOD) स्वीकृति पैनल'}
                  </span>
                  <img
                    src={images.hod}
                    alt="HOD Panel Guide"
                    className="w-full h-auto rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* 3. HR & ADMIN ROLE GUIDE */}
        {/* ==================================== */}
        {(activeRole === 'hr' || window.matchMedia('print').matches) && (
          <div className="space-y-10">
            <div className="border-b pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-lg">Level 3</span>
                  {lang === 'en' ? 'HR Administrator & Payroll Operations Manual' : 'मानव संसाधन (HR) और पेरोल संचालन नियमावली'}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'en' ? 'Manage Master configurations, monthly bulk sheets, and compile final HDFC Bank transfer files.' : 'मास्टर सेटिंग्स, थोक डेटा अपलोड, मासिक अटेंडेंस रजिस्टर मार्क करना और HDFC बैंक फाइल तैयार करना।'}
                </p>
              </div>
            </div>

            {/* HR Task 1: Bulk Upload & Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b pb-8">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">1</span>
                  <h4 className="text-sm font-bold text-slate-800">
                    {lang === 'en' ? 'Step 1: Master Setups & Bulk Upload' : 'चरण 1: मास्टर सेटिंग्स और बल्क एक्सेल अपलोड'}
                  </h4>
                </div>

                {lang === 'en' ? (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      Set up your structural variables and import employees:
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5">
                      <li><strong>Bulk Upload:</strong> Navigate to Staff Directory, open "Bulk Excel Paste" and copy-paste database rows. The parser will automatically map Reference IDs, Salaries, and Contact details.</li>
                      <li><strong>Salary Config:</strong> Define standard statutory slabs (e.g., standard PF rate of 12% of Base Salary, and ESIC thresholds) under the <strong>Company Master</strong> tab.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      सॉफ़्टवेयर का बुनियादी ढांचा तैयार करने और कर्मचारियों का रिकॉर्ड जोड़ने की विधि:
                    </p>
                    <ul className="list-disc pl-4 space-y-2">
                      <li><strong>बल्क एक्सेल अपलोड:</strong> स्टाफ डायरेक्टरी में जाएं, "Bulk Excel Paste" खोलें और एक्सेल की पंक्तियाँ सीधे पेस्ट करें। हमारा स्वचालित पार्सर डेटा को तुरंत मैप कर लेगा।</li>
                      <li><strong>वेतन सेटिंग्स:</strong> कंपनी मास्टर टैब में जाकर पीएफ दर (बेसिक सैलरी का 12%), ईएसआईसी सीमा और अन्य कंपनी मापदंड तय करें।</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="lg:col-span-7">
                <div className="bg-slate-50 p-6 rounded-2xl border space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2.5 rounded-xl text-blue-700">
                      <FileSpreadsheet size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{lang === 'en' ? 'Excel Spreadsheet Mapping' : 'एक्सेल स्प्रेडशीट कॉलम प्रारूप'}</span>
                      <span className="text-[10px] text-gray-500">{lang === 'en' ? 'Make sure your columns match these headers:' : 'कृपया अपनी फाइल के कॉलम इन शीर्षकों से मिलाएं:'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white border p-2 rounded-xl text-[10px] font-bold text-slate-700">Reference ID</div>
                    <div className="bg-white border p-2 rounded-xl text-[10px] font-bold text-slate-700">Employee Name</div>
                    <div className="bg-white border p-2 rounded-xl text-[10px] font-bold text-slate-700">Base Salary</div>
                    <div className="bg-white border p-2 rounded-xl text-[10px] font-bold text-slate-700">Department</div>
                    <div className="bg-white border p-2 rounded-xl text-[10px] font-bold text-slate-700">Designation</div>
                    <div className="bg-white border p-2 rounded-xl text-[10px] font-bold text-slate-700">Joining Date</div>
                  </div>
                </div>
              </div>
            </div>

            {/* HR Task 2: Payroll Processing */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-4">
              <div className="lg:col-span-5 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">2</span>
                  <h4 className="text-sm font-bold text-slate-800">
                    {lang === 'en' ? 'Step 2: Processing Monthly Payroll' : 'चरण 2: मासिक सैलरी प्रोसेस और बैंक फाइल डाउनलोड'}
                  </h4>
                </div>

                {lang === 'en' ? (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      At the end of each month, compile wages and generate payout sheets:
                    </p>
                    <ul className="list-disc pl-4 space-y-1.5">
                      <li>Go to <strong>Payroll Processor</strong> on the main menu.</li>
                      <li>Select the active month and company branch (e.g. SAKAR ELECTRICALS & ELECTRONICS PVT LTD).</li>
                      <li>Click <strong>Calculate Wages</strong>. The system will process total presents, deduct Loss of Pay (LOP) days, apply PF & ESIC, and calculate net cash transfers.</li>
                      <li>Click <strong>Download HDFC Bank CSV</strong> to generate the bulk salary release file ready for upload on Corporate Banking.</li>
                    </ul>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                    <p>
                      प्रत्येक महीने के अंत में कुल वेतन गणना करने और बैंक फाइल बनाने की प्रक्रिया:
                    </p>
                    <ul className="list-disc pl-4 space-y-2">
                      <li>मुख्य मेनू में <strong>Payroll Processor</strong> विकल्प पर जाएं।</li>
                      <li>सक्रिय महीना और कंपनी का चयन करें।</li>
                      <li><strong>Calculate Wages</strong> पर क्लिक करें। सिस्टम उपस्थित दिनों की गणना करेगा, बिना वेतन के दिनों (LOP) की कटौती करेगा, और सरकारी मापदंडों के अनुसार पीएफ-ईएसआईसी घटाकर इन-हैंड सैलरी निकालेगा।</li>
                      <li><strong>Download HDFC Bank CSV</strong> बटन दबाएं। इससे बल्क सैलरी ट्रांसफर स्प्रेडशीट डाउनलोड हो जाएगी, जिसे सीधे कॉर्पोरेट बैंकिंग पोर्टल पर अपलोड किया जा सकता है।</li>
                    </ul>
                  </div>
                )}
              </div>
              <div className="lg:col-span-7">
                <div className="border rounded-2xl overflow-hidden shadow-xs bg-gray-50 p-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1 px-1">
                    {lang === 'en' ? 'Reference Screenshot: Payroll Panel' : 'संदर्भ चित्र: पेरोल और बैंक ट्रांसफर प्रोसेसर'}
                  </span>
                  <img
                    src={images.payroll}
                    alt="Payroll Processing Guide"
                    className="w-full h-auto rounded-xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM COMPLIANCE CORNER */}
        <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl space-y-3 select-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide font-display">
              {lang === 'en' ? 'Government Compliance Norms (SAKAR ELECTRICALS & ELECTRONICS PVT LTD)' : 'वैधानिक अनुपालन मानदंड (साकार इलेक्ट्रिकल्स एंड इलेक्ट्रॉनिक्स प्राइवेट लिमिटेड)'}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            {lang === 'en' ? (
              'This software fully conforms to Indian statutory compliance codes. Provident Fund (PF) is calculated exactly as 12% of the Base Salary (Dearness Allowance completely removed). Employee State Insurance (ESIC) contributions apply at 0.75% for workers with gross earnings up to ₹21,000/month, and Professional Tax (PT) calculations follow respective state tax slabs automatically.'
            ) : (
              'यह सॉफ्टवेयर भारत सरकार के वैधानिक श्रम नियमों के पूर्ण अनुपालन में काम करता है। प्रोविडेंट फंड (PF) की गणना सीधे बेसिक सैलरी पर 12% की दर से की जाती है (सैलरी संरचना से डीए को पूरी तरह हटा दिया गया है)। कर्मचारी राज्य बीमा (ESIC) का योगदान (0.75%) उन कर्मियों पर लागू होता है जिनकी ग्रॉस सैलरी ₹21,000/माह या उससे कम है। व्यावसायिक कर (Professional Tax) की गणना राज्यवार स्लैब के अनुसार स्वचालित रूप से की जाती है।'
            )}
          </p>
        </div>

      </div>
    </div>
  );
}
