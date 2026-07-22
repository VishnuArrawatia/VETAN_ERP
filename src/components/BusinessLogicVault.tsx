import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  ShieldAlert, 
  Lock, 
  Scale, 
  FileSpreadsheet, 
  TrendingUp, 
  Percent, 
  Briefcase, 
  Clock, 
  Coins, 
  AlertTriangle, 
  Save, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  Play, 
  Building, 
  Check, 
  Sparkles, 
  Users 
} from 'lucide-react';

interface VaultConfig {
  pfRateEmployee: number;
  pfRateEmployerEPF: number;
  pfRateEmployerEPS: number;
  pfCeiling: number;
  esicRateEmployee: number;
  esicRateEmployer: number;
  esicCeiling: number;
  gratuityFormulaFactor: number; // 15 / 26
  lateDeductionThreshold: number; // 3 late arrivals
  lateDeductionLOPDays: number; // 0.5 days LOP
  gracePeriodMinutes: number; // 15 mins
  fullDayHours: number; // 8 hours
  halfDayHours: number; // 4 hours
}

const DEFAULT_VAULT_CONFIG: VaultConfig = {
  pfRateEmployee: 12,
  pfRateEmployerEPF: 3.67,
  pfRateEmployerEPS: 8.33,
  pfCeiling: 15000,
  esicRateEmployee: 0.75,
  esicRateEmployer: 3.25,
  esicCeiling: 21000,
  gratuityFormulaFactor: 15 / 26,
  lateDeductionThreshold: 3,
  lateDeductionLOPDays: 0.5,
  gracePeriodMinutes: 15,
  fullDayHours: 8,
  halfDayHours: 4,
};

export default function BusinessLogicVault({ activeOperator }: { activeOperator: any }) {
  // Check access first
  const isSuperAdminVishnu = activeOperator && activeOperator.username === 'vishnu' && activeOperator.role === 'SUPER_HR';

  const [config, setConfig] = useState<VaultConfig>(() => {
    const saved = localStorage.getItem('vetan_vault_config');
    if (saved) {
      try {
        return { ...DEFAULT_VAULT_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_VAULT_CONFIG;
      }
    }
    return DEFAULT_VAULT_CONFIG;
  });

  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'calculators'>('rules');
  const [selectedRule, setSelectedRule] = useState<'pf' | 'esic' | 'leaves' | 'salary' | 'gratuity' | 'ff' | 'contractor' | 'attendance' | 'late'>('pf');

  // PF Calc State
  const [pfGross, setPfGross] = useState<number>(18000);
  const [pfBasic, setPfBasic] = useState<number>(12000);
  const [pfLimitEnabled, setPfLimitEnabled] = useState<boolean>(true);

  // ESIC Calc State
  const [esicGross, setEsicGross] = useState<number>(19500);

  // Gratuity Calc State
  const [gratuityBasicDA, setGratuityBasicDA] = useState<number>(25000);
  const [gratuityYears, setGratuityYears] = useState<number>(6);

  // Late LOP State
  const [lateCount, setLateCount] = useState<number>(5);
  const [lateDailySalary, setLateDailySalary] = useState<number>(1200);

  // Contractor Commission State
  const [contractorWorkers, setContractorWorkers] = useState<number>(45);
  const [contractorAvgDays, setContractorAvgDays] = useState<number>(24);
  const [contractorRate, setContractorRate] = useState<number>(450); // Daily worker wage
  const [commissionType, setCommissionType] = useState<'fixed' | 'percentage'>('percentage');
  const [commissionRate, setCommissionRate] = useState<number>(8); // 8% or Rs 40/worker-day

  // F&F Calc State
  const [ffWorkedDays, setFfWorkedDays] = useState<number>(18);
  const [ffDailyBasic, setFfDailyBasic] = useState<number>(800);
  const [ffAccruedLeaves, setFfAccruedLeaves] = useState<number>(12);
  const [ffNoticePeriodDays, setFfNoticePeriodDays] = useState<number>(30);
  const [ffNoticeServedDays, setFfNoticeServedDays] = useState<number>(15);
  const [ffOutstandingLoan, setFfOutstandingLoan] = useState<number>(4500);

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSaveConfig = () => {
    localStorage.setItem('vetan_vault_config', JSON.stringify(config));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetConfig = () => {
    if (window.confirm('Are you sure you want to restore all compliance guidelines and rules to Indian statutory defaults?')) {
      setConfig(DEFAULT_VAULT_CONFIG);
      localStorage.setItem('vetan_vault_config', JSON.stringify(DEFAULT_VAULT_CONFIG));
    }
  };

  // PF Results
  const calculatePF = () => {
    const wageForPF = pfLimitEnabled ? Math.min(pfBasic, config.pfCeiling) : pfBasic;
    const employeePF = Math.round((wageForPF * config.pfRateEmployee) / 100);
    const employerEPS = Math.round((wageForPF * config.pfRateEmployerEPS) / 100);
    const employerEPF = Math.round((wageForPF * config.pfRateEmployerEPF) / 100);
    const totalEmployerPF = employerEPF + employerEPS;
    const adminCharges = Math.max(500, Math.round((wageForPF * 0.5) / 100));

    return { wageForPF, employeePF, employerEPS, employerEPF, totalEmployerPF, adminCharges };
  };

  // ESIC Results
  const calculateESIC = () => {
    const isApplicable = esicGross <= config.esicCeiling;
    const employeeESIC = isApplicable ? Math.ceil((esicGross * config.esicRateEmployee) / 100) : 0;
    const employerESIC = isApplicable ? Math.ceil((esicGross * config.esicRateEmployer) / 100) : 0;
    return { isApplicable, employeeESIC, employerESIC, totalESIC: employeeESIC + employerESIC };
  };

  // Gratuity Results
  const calculateGratuity = () => {
    const isEligible = gratuityYears >= 5;
    const amount = isEligible 
      ? Math.round(gratuityBasicDA * config.gratuityFormulaFactor * gratuityYears) 
      : 0;
    return { isEligible, amount };
  };

  // Late LOP Results
  const calculateLateLOP = () => {
    const penaltyOccurrences = Math.floor(lateCount / config.lateDeductionThreshold);
    const lopDays = penaltyOccurrences * config.lateDeductionLOPDays;
    const deduction = lopDays * lateDailySalary;
    return { penaltyOccurrences, lopDays, deduction };
  };

  // Contractor Results
  const calculateContractorBill = () => {
    const workerAttendanceDays = contractorWorkers * contractorAvgDays;
    const basicWageBill = workerAttendanceDays * contractorRate;
    let commission = 0;
    if (commissionType === 'fixed') {
      commission = workerAttendanceDays * commissionRate; // Rate as Rs per worker day
    } else {
      commission = (basicWageBill * commissionRate) / 100; // Rate as % of gross wage
    }
    const tds = Math.round((basicWageBill + commission) * 0.02); // 2% TDS under Section 194C
    const netPayout = basicWageBill + commission - tds;
    return { workerAttendanceDays, basicWageBill, commission, tds, netPayout };
  };

  // F&F Results
  const calculateFF = () => {
    const earnedSalary = ffWorkedDays * ffDailyBasic;
    const leaveEncashment = ffAccruedLeaves * ffDailyBasic;
    const noticeShortfallDays = Math.max(0, ffNoticePeriodDays - ffNoticeServedDays);
    const noticeRecovery = noticeShortfallDays * ffDailyBasic;
    const grossCredit = earnedSalary + leaveEncashment;
    const grossDeduction = ffOutstandingLoan + noticeRecovery;
    const netSettlement = grossCredit - grossDeduction;

    return { earnedSalary, leaveEncashment, noticeShortfallDays, noticeRecovery, grossCredit, grossDeduction, netSettlement };
  };

  const pfRes = calculatePF();
  const esicRes = calculateESIC();
  const gratuityRes = calculateGratuity();
  const lateRes = calculateLateLOP();
  const contractorRes = calculateContractorBill();
  const ffRes = calculateFF();

  if (!isSuperAdminVishnu) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 max-w-2xl mx-auto my-12 text-center shadow-xl">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
          <Lock size={32} />
        </div>
        <h2 className="text-2xl font-bold text-red-900 font-display">Access Restricted • अनाधिकृत प्रवेश वर्जित</h2>
        <p className="text-sm text-red-700 mt-2 leading-relaxed">
          Business Logic Vault contains sensitive Indian statutory compliance parameters, payroll algorithms, gratuity formula variables, and contractor commission scales.
        </p>
        <p className="text-xs text-red-500 font-medium mt-4 font-mono uppercase bg-red-100/50 py-2 rounded-xl inline-block px-4">
          Access Granted to: Super Admin (Vishnu) Only
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="absolute right-0 top-0 opacity-10 transform translate-x-12 -translate-y-6 select-none pointer-events-none">
          <ShieldAlert size={280} />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/20 w-fit">
              <Lock size={12} className="text-indigo-400" />
              <span className="text-[10px] font-bold text-indigo-300 tracking-wider uppercase font-mono">
                SECURE VAULT • SAKAR GROUP CONFIDENTIAL
              </span>
            </div>
            <h1 className="text-2xl font-extrabold font-display tracking-tight text-white flex items-center gap-2">
              Business Logic Vault <span className="text-indigo-400 text-xs font-mono font-medium">(व्यवसाय तर्क वॉल्ट)</span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Centralized repository of mathematical algorithms, statutory deduction structures, contractor billing ratios, and attendance rules for Sakar, SVN, Zenivo, and Flare Group.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button 
              onClick={handleResetConfig}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 transition border border-slate-700 cursor-pointer"
            >
              <RefreshCw size={12} />
              Reset Defaults
            </button>
            <button 
              onClick={handleSaveConfig}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/20 cursor-pointer"
            >
              <Save size={13} />
              Save Parameters
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-bounce">
            <CheckCircle size={14} />
            Changes saved successfully inside the Security Vault! New compliance settings are now active.
          </div>
        )}
      </div>

      {/* VIEW MODES */}
      <div className="flex border-b border-gray-200 bg-white p-1.5 rounded-2xl shadow-xs gap-1.5">
        <button
          onClick={() => setActiveSubTab('rules')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeSubTab === 'rules' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Scale size={14} />
          Compliance Regulations & Documentation
        </button>
        <button
          onClick={() => setActiveSubTab('calculators')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${activeSubTab === 'calculators' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <Calculator size={14} />
          Interactive Logic & Calculation Simulators
        </button>
      </div>

      {/* TABBED VIEW 1: COMPLIANCE REGULATIONS */}
      {activeSubTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Menu Sidebar */}
          <div className="lg:col-span-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2.5 mb-2 block select-none">
              Deductions & Policies
            </span>
            <button
              onClick={() => setSelectedRule('pf')}
              className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${selectedRule === 'pf' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>PF Calculation Logic</span>
              <Percent size={12} className={selectedRule === 'pf' ? 'text-indigo-600' : 'text-slate-400'} />
            </button>
            <button
              onClick={() => setSelectedRule('esic')}
              className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${selectedRule === 'esic' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>ESIC Logic</span>
              <Percent size={12} className={selectedRule === 'esic' ? 'text-indigo-600' : 'text-slate-400'} />
            </button>
            <button
              onClick={() => setSelectedRule('leaves')}
              className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${selectedRule === 'leaves' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>Leave Policy Logic</span>
              <FileText size={12} className={selectedRule === 'leaves' ? 'text-indigo-600' : 'text-slate-400'} />
            </button>
            <button
              onClick={() => setSelectedRule('salary')}
              className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${selectedRule === 'salary' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>Salary Structure Logic</span>
              <TrendingUp size={12} className={selectedRule === 'salary' ? 'text-indigo-600' : 'text-slate-400'} />
            </button>
            <button
              onClick={() => setSelectedRule('gratuity')}
              className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${selectedRule === 'gratuity' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>Gratuity Logic</span>
              <Coins size={12} className={selectedRule === 'gratuity' ? 'text-indigo-600' : 'text-slate-400'} />
            </button>
            <button
              onClick={() => setSelectedRule('ff')}
              className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${selectedRule === 'ff' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>F&F Logic</span>
              <Briefcase size={12} className={selectedRule === 'ff' ? 'text-indigo-600' : 'text-slate-400'} />
            </button>
            <button
              onClick={() => setSelectedRule('contractor')}
              className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${selectedRule === 'contractor' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>Contractor Commission</span>
              <Users size={12} className={selectedRule === 'contractor' ? 'text-indigo-600' : 'text-slate-400'} />
            </button>
            <button
              onClick={() => setSelectedRule('attendance')}
              className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${selectedRule === 'attendance' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>Attendance Rules</span>
              <Clock size={12} className={selectedRule === 'attendance' ? 'text-indigo-600' : 'text-slate-400'} />
            </button>
            <button
              onClick={() => setSelectedRule('late')}
              className={`text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${selectedRule === 'late' ? 'bg-indigo-50 text-indigo-700 font-bold border-l-3 border-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <span>Late Coming Rules</span>
              <AlertTriangle size={12} className={selectedRule === 'late' ? 'text-indigo-600' : 'text-slate-400'} />
            </button>
          </div>

          {/* Rule Detail Panel & Editable Config parameters */}
          <div className="lg:col-span-9 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            {selectedRule === 'pf' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                    <Percent size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-display">Provident Fund (PF) Calculation Logic</h3>
                    <p className="text-xs text-gray-500">Governed under the Employees Provident Funds and Miscellaneous Provisions Act, 1952</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">1. Core Deduction Metrics</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Provident Fund contributions are calculated on the <strong>Basic Salary + DA</strong> of the employee. 
                      By default, a statutory cap is applied which sets a maximum salary limit for mandatory deductions.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-indigo-600" />
                        <span><strong>Employee Contribution:</strong> 12% of PF wage.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-indigo-600" />
                        <span><strong>Employer Contribution (EPS):</strong> 8.33% of PF wage (diverted to Pension Fund).</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-indigo-600" />
                        <span><strong>Employer Contribution (EPF):</strong> 3.67% of PF wage (deposited to EPF).</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-indigo-600" />
                        <span><strong>EDLI Administration charges:</strong> 0.5% (Employer pays, min ₹500/month/branch).</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Vault Parameters Configuration</h4>
                    
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee PF Rate (%)</label>
                        <input 
                          type="number" 
                          value={config.pfRateEmployee}
                          onChange={(e) => setConfig({...config, pfRateEmployee: Number(e.target.value)})}
                          className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employer EPF (%)</label>
                          <input 
                            type="number" 
                            value={config.pfRateEmployerEPF}
                            onChange={(e) => setConfig({...config, pfRateEmployerEPF: Number(e.target.value)})}
                            className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employer EPS (%)</label>
                          <input 
                            type="number" 
                            value={config.pfRateEmployerEPS}
                            onChange={(e) => setConfig({...config, pfRateEmployerEPS: Number(e.target.value)})}
                            className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Statutory PF Ceiling (₹/month)</label>
                        <input 
                          type="number" 
                          value={config.pfCeiling}
                          onChange={(e) => setConfig({...config, pfCeiling: Number(e.target.value)})}
                          className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRule === 'esic' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <Percent size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-display">Employees' State Insurance (ESIC) Logic</h3>
                    <p className="text-xs text-gray-500">Governed under the Employees' State Insurance Act, 1948</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">1. Key ESIC Guidelines</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      ESIC provides medical, sickness, maternity, and disability benefits. It applies exclusively to employees whose monthly <strong>Gross Salary</strong> does not exceed the statutory ceiling.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-600" />
                        <span><strong>Eligibility:</strong> Gross Wage limit is ₹21,000 per month.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-600" />
                        <span><strong>Employee Contribution:</strong> 0.75% of Gross monthly wage.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-600" />
                        <span><strong>Employer Contribution:</strong> 3.25% of Gross monthly wage.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-emerald-600" />
                        <span><strong>Calculation Rule:</strong> Contributions are rounded up to the next Rupee.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-4">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Vault Parameters Configuration</h4>
                    
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee ESIC Rate (%)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={config.esicRateEmployee}
                          onChange={(e) => setConfig({...config, esicRateEmployee: Number(e.target.value)})}
                          className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employer ESIC Rate (%)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={config.esicRateEmployer}
                          onChange={(e) => setConfig({...config, esicRateEmployer: Number(e.target.value)})}
                          className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">ESIC Gross Limit (₹/month)</label>
                        <input 
                          type="number" 
                          value={config.esicCeiling}
                          onChange={(e) => setConfig({...config, esicCeiling: Number(e.target.value)})}
                          className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRule === 'leaves' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-display">Leave Policy & Encashment Logic</h3>
                    <p className="text-xs text-gray-500">Official leave accrual norms and payouts for Sakar Group Companies</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">1. Annual Leave Allocations</h4>
                    <ul className="space-y-3 text-xs text-slate-600">
                      <li className="flex gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                        <span><strong>Privilege / Paid Leave (PL):</strong> Accrued at 1.5 days for every 30 working days (18 days per calendar year). Max accumulate cap is 30 days. Excess leaves expire if not encashed.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                        <span><strong>Sick Leave (SL):</strong> 7 days allotted annually at the start of the fiscal year. SL cannot be encashed or carried forward.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>
                        <span><span><strong>Casual Leave (CL):</strong> 7 days allotted. Non-cumulative, expires on 31st March.</span></span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 space-y-4">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Leave Encashment Logic</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Leave Encashment is calculated only on the remaining <strong>Privilege/Paid Leaves (PL)</strong> at the time of retirement, resignation, or year-end.
                    </p>
                    <div className="bg-white p-3 rounded-lg border text-xs font-mono space-y-1.5 text-slate-700">
                      <div className="font-bold text-blue-800">Formula:</div>
                      <div>Encashment = (Basic Salary / 26) * PL Balance</div>
                      <div className="text-[10px] text-gray-400 mt-1">* 26 refers to official wage days in a calendar month.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRule === 'salary' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-display">Salary Structure & Split-up Logic</h3>
                    <p className="text-xs text-gray-500">Corporate split algorithm of Gross Monthly Cost-to-Company (CTC)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">1. Standard CTC Breakdown</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sakar Electricals Group follows a defined compensation split to optimize tax liabilities for employees while strictly complying with state labor standards:
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex gap-2">
                        <span className="font-bold text-indigo-600">Basic:</span>
                        <span>50% of the Gross Monthly Salary.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-indigo-600">HRA:</span>
                        <span>40% of the Basic Salary (50% in Metro regions - e.g. Daman / Gujarat industrial clusters with specific municipal declarations).</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-indigo-600">Special Allowance:</span>
                        <span>Balancing figure to reach the target Gross Salary.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-indigo-600">Deductions:</span>
                        <span>Professional Tax (based on state slabs), PF employee (12%), ESIC employee (0.75% where applicable), and Income Tax TDS.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">Wage Audit Notice</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Under the Code on Wages, the Basic Salary **must be at least 50%** of the total wages/compensation. Vetan ERP enforces this limit automatically during any employee revision or entry.
                      </p>
                    </div>
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex gap-2">
                      <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <span>Any revision falling below the 50% Basic wage rule triggers a compliance flag in the Executive Audit reports.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRule === 'gratuity' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                    <Coins size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-display">Gratuity Calculation Logic</h3>
                    <p className="text-xs text-gray-500">Governed under the Payment of Gratuity Act, 1972</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">1. Eligibility & Accrual Rules</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Gratuity is a statutory reward paid to employees who have rendered continuous service for <strong>5 years or more</strong> upon their resignation, retirement, or superannuation.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-amber-600" />
                        <span><strong>Minimum Service:</strong> 5 Years of continuous employment.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-amber-600" />
                        <span><strong>Exceptions:</strong> 5-year limit waived in case of employee demise or permanent disability.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={12} className="text-amber-600" />
                        <span><strong>Service Period Rounding:</strong> Completed months &gt; 6 months rounded up to the next full year.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 space-y-4">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">The Mathematical Formula</h4>
                    <div className="bg-white p-3 rounded-lg border text-xs font-mono space-y-1 text-slate-700">
                      <div className="font-bold text-amber-800">Formula:</div>
                      <div>Gratuity = (Basic + DA) * (15 / 26) * Years of Service</div>
                      <div className="text-[10px] text-gray-400 mt-2">Where:</div>
                      <div className="text-[10px] text-slate-500">- 15 represents 15 days of salary per year of service.</div>
                      <div className="text-[10px] text-slate-500">- 26 represents total working days in a month.</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRule === 'ff' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-display">Full & Final (F&F) Settlement Logic</h3>
                    <p className="text-xs text-gray-500">Comprehensive algorithm for employee separation and dues recovery</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">1. Separation Earnings & Recoveries</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      F&F Settlement is generated upon a formal separation. It consolidates all outstanding payroll segments into a single final voucher.
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold shrink-0">+ Dues:</span>
                        <span>Unpaid wages + Accrued PL Encashment + Gratuity (if eligible) + Reimbursements + Statutory Bonus.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 font-bold shrink-0">- Recoveries:</span>
                        <span>Outstanding Loans + Notice Period Shortfall Recovery + Tax TDS + Asset Non-Return Penalties.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-600 font-bold shrink-0">Timeline SLA:</span>
                        <span>All F&F Settlements must be completed within 30 days of the employee's last working day.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 space-y-3">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Notice Period Logic</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Standard notice period is **30 days** across all group entities unless modified by the HOD. Shortfall in notice served triggers auto-recovery computed on Basic salary per day.
                    </p>
                    <div className="bg-white p-2.5 rounded border text-[11px] text-slate-600">
                      <strong>Recovery Equation:</strong> (30 - Actual Served Days) * Daily Basic Salary
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRule === 'contractor' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="p-3 bg-slate-50 rounded-xl text-slate-700">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-display">Contractor Commission & Billing Logic</h3>
                    <p className="text-xs text-gray-500">Statutory guidelines for external third-party manpower services</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">1. Manpower Billing Framework</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sakar and SVN industrial plants engage verified contractors for floor work. Bills are verified based on recorded supervisor logs and calculated commissions:
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-slate-700 shrink-0 mt-0.5" />
                        <span><strong>Fixed Rate:</strong> Contractor earns ₹X per day for each worker who attended a full shift.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-slate-700 shrink-0 mt-0.5" />
                        <span><strong>Percentage Commission:</strong> Contractor receives Y% of the total wages of their workers.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-slate-700 shrink-0 mt-0.5" />
                        <span><strong>TDS Clause (Section 194C):</strong> 1% (Individual) or 2% (Corporates/Partnerships) TDS is deducted on gross billing.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 space-y-4">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Dynamic Controls</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Contractor billing automatically reconciles with biometric entry logs. Discrepancies exceeding 2.5% require written clearance from the plant manager.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedRule === 'attendance' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-display">Biometric Attendance & Split Shift Rules</h3>
                    <p className="text-xs text-gray-500">Biometric time tracking rules, hours matching, and shift criteria</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">1. Shift Hours Allocation</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Standard working shift is <strong>9.5 Hours</strong> (comprising 8.5 hours active floor duties + 1 hour breaks). Wage status is dynamically determined based on actual biometric in/out logs:
                    </p>
                    <ul className="space-y-2.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span><strong>Full Day Present:</strong> &gt;= {config.fullDayHours} hours of attendance recorded.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span><strong>Half Day Present:</strong> Present between {config.halfDayHours} and {config.fullDayHours} hours.</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span><strong>Absent / LOP:</strong> Present for &lt; {config.halfDayHours} hours.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 space-y-4">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Vault Parameters Configuration</h4>
                    
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Full Day Minimum Threshold (Hours)</label>
                        <input 
                          type="number" 
                          value={config.fullDayHours}
                          onChange={(e) => setConfig({...config, fullDayHours: Number(e.target.value)})}
                          className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Half Day Minimum Threshold (Hours)</label>
                        <input 
                          type="number" 
                          value={config.halfDayHours}
                          onChange={(e) => setConfig({...config, halfDayHours: Number(e.target.value)})}
                          className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedRule === 'late' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                  <div className="p-3 bg-red-50 rounded-xl text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 font-display">Late Coming Penalties & LOP Logic</h3>
                    <p className="text-xs text-gray-500">Corporate rules for late arrivals and Loss of Pay deductions</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-slate-800">1. Late Arrival Policies</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      To maintain industrial discipline, late-punch rules are strictly verified during the monthly payroll calculation run:
                    </p>
                    <ul className="space-y-2 text-xs text-slate-600">
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-red-600 shrink-0 mt-0.5" />
                        <span><strong>Grace Period:</strong> {config.gracePeriodMinutes} minutes. Staff arriving after 09:15 AM are flagged as Late.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-red-600 shrink-0 mt-0.5" />
                        <span><strong>LOP Deduction Slabs:</strong> For every {config.lateDeductionThreshold} late-marks accumulated in a calendar month, a deduction of {config.lateDeductionLOPDays} day of wages (Loss of Pay) is automatically applied.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check size={12} className="text-red-600 shrink-0 mt-0.5" />
                        <span><strong>Half-Day Threshold:</strong> Punching in after 10:30 AM is automatically categorized as a Half-Day absent, unless prior written HOD approval is secured.</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-4.5 rounded-xl border border-slate-200/60 space-y-4">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Vault Parameters Configuration</h4>
                    
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Grace Period (Minutes)</label>
                        <input 
                          type="number" 
                          value={config.gracePeriodMinutes}
                          onChange={(e) => setConfig({...config, gracePeriodMinutes: Number(e.target.value)})}
                          className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Threshold Late Count</label>
                          <input 
                            type="number" 
                            value={config.lateDeductionThreshold}
                            onChange={(e) => setConfig({...config, lateDeductionThreshold: Number(e.target.value)})}
                            className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">LOP Days Deducted</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={config.lateDeductionLOPDays}
                            onChange={(e) => setConfig({...config, lateDeductionLOPDays: Number(e.target.value)})}
                            className="w-full border p-2 bg-white rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TABBED VIEW 2: LOGIC SIMULATORS */}
      {activeSubTab === 'calculators' && (
        <div className="space-y-8">
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-900">
            <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wide">Interactive Simulation Area</h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Use the quick interactive tools below to simulate live payroll splits, late-mark penalty calculations, gratuity calculations, and contractor commissions under the customized parameters. These calculations do not affect the main database records.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* PF Calculator */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Calculator size={16} className="text-indigo-600" />
                <h4 className="font-bold text-sm text-slate-800 font-display">Statutory EPF Split Calculator</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Basic + DA (₹)</label>
                  <input 
                    type="number" 
                    value={pfBasic}
                    onChange={(e) => setPfBasic(Number(e.target.value))}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div className="flex items-center h-full pt-4">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={pfLimitEnabled}
                      onChange={(e) => setPfLimitEnabled(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Apply ₹{config.pfCeiling} Cap</span>
                  </label>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/50">
                <div className="text-xs font-semibold text-slate-500 border-b pb-1.5 uppercase tracking-wider text-[9px]">Simulation Results</div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Wages Considered for PF:</span>
                  <span className="font-mono font-bold text-slate-900">₹{pfRes.wageForPF.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Employee Deduction ({config.pfRateEmployee}%):</span>
                  <span className="font-mono font-bold text-red-600">₹{pfRes.employeePF.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Employer EPS Pension ({config.pfRateEmployerEPS}%):</span>
                  <span className="font-mono font-bold text-slate-700">₹{pfRes.employerEPS.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Employer EPF Balance ({config.pfRateEmployerEPF}%):</span>
                  <span className="font-mono font-bold text-slate-700">₹{pfRes.employerEPF.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-indigo-900 border-t pt-1.5">
                  <span>Total Employer Share ({config.pfRateEmployerEPF + config.pfRateEmployerEPS}%):</span>
                  <span className="font-mono">₹{pfRes.totalEmployerPF.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* ESIC Calculator */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Calculator size={16} className="text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-800 font-display">Statutory ESIC Calculator</h4>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Gross Monthly Salary (₹)</label>
                <input 
                  type="number" 
                  value={esicGross}
                  onChange={(e) => setEsicGross(Number(e.target.value))}
                  className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/50">
                <div className="text-xs font-semibold text-slate-500 border-b pb-1.5 uppercase tracking-wider text-[9px]">Simulation Results</div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Eligibility (Gross &lt;= ₹{config.esicCeiling}):</span>
                  <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${esicRes.isApplicable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {esicRes.isApplicable ? 'Applicable' : 'Exempted'}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Employee Share ({config.esicRateEmployee}%):</span>
                  <span className="font-mono font-bold text-red-600">₹{esicRes.employeeESIC}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Employer Share ({config.esicRateEmployer}%):</span>
                  <span className="font-mono font-bold text-slate-700">₹{esicRes.employerESIC}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-emerald-900 border-t pt-1.5">
                  <span>Total ESIC Pool:</span>
                  <span className="font-mono">₹{esicRes.totalESIC}</span>
                </div>
              </div>
            </div>

            {/* Gratuity Calculator */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Calculator size={16} className="text-amber-600" />
                <h4 className="font-bold text-sm text-slate-800 font-display">Statuity Gratuity Accrual Simulator</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Last Drawn Basic + DA (₹)</label>
                  <input 
                    type="number" 
                    value={gratuityBasicDA}
                    onChange={(e) => setGratuityBasicDA(Number(e.target.value))}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Service Tenure (Years)</label>
                  <input 
                    type="number" 
                    value={gratuityYears}
                    onChange={(e) => setGratuityYears(Number(e.target.value))}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/50">
                <div className="text-xs font-semibold text-slate-500 border-b pb-1.5 uppercase tracking-wider text-[9px]">Simulation Results</div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Service Threshold Met (5+ Yrs):</span>
                  <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${gratuityRes.isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {gratuityRes.isEligible ? 'Eligible' : 'Not Eligible'}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold text-amber-900 border-t pt-1.5">
                  <span>Net Estimated Gratuity Payment:</span>
                  <span className="font-mono text-base">₹{gratuityRes.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Late Coming Deductions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Calculator size={16} className="text-red-600" />
                <h4 className="font-bold text-sm text-slate-800 font-display">Late Coming & LOP Deduction Simulator</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Monthly Late Punch Count</label>
                  <input 
                    type="number" 
                    value={lateCount}
                    onChange={(e) => setLateCount(Number(e.target.value))}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Employee Daily Basic Salary (₹)</label>
                  <input 
                    type="number" 
                    value={lateDailySalary}
                    onChange={(e) => setLateDailySalary(Number(e.target.value))}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/50">
                <div className="text-xs font-semibold text-slate-500 border-b pb-1.5 uppercase tracking-wider text-[9px]">Simulation Results</div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Penalty Slabs Triggered:</span>
                  <span className="font-mono font-bold text-slate-900">{lateRes.penaltyOccurrences} (Slab: {config.lateDeductionThreshold} lates)</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Equivalent Loss-of-Pay (LOP) Days:</span>
                  <span className="font-mono font-bold text-slate-900">{lateRes.lopDays} Days (Factor: {config.lateDeductionLOPDays} LOP)</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-red-900 border-t pt-1.5">
                  <span>Net Attendance LOP Deduction:</span>
                  <span className="font-mono text-base text-red-600">- ₹{lateRes.deduction.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Contractor Commission */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Calculator size={16} className="text-slate-700" />
                <h4 className="font-bold text-sm text-slate-800 font-display">Contractor Manpower Commission Simulator</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Contracted Worker Count</label>
                  <input 
                    type="number" 
                    value={contractorWorkers}
                    onChange={(e) => setContractorWorkers(Number(e.target.value))}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Avg Days Worked/Worker</label>
                  <input 
                    type="number" 
                    value={contractorAvgDays}
                    onChange={(e) => setContractorAvgDays(Number(e.target.value))}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Daily Worker Wage (₹)</label>
                  <input 
                    type="number" 
                    value={contractorRate}
                    onChange={(e) => setContractorRate(Number(e.target.value))}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Commission Type</label>
                  <select 
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value as any)}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-bold"
                  >
                    <option value="percentage">Percentage (%) of Bill</option>
                    <option value="fixed">Fixed ₹ per worker day</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Commission Margin ({commissionType === 'percentage' ? '%' : '₹/day'})</label>
                <input 
                  type="number" 
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/50">
                <div className="text-xs font-semibold text-slate-500 border-b pb-1.5 uppercase tracking-wider text-[9px]">Simulation Results</div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Gross Worker Attendance Days:</span>
                  <span className="font-mono font-bold text-slate-900">{contractorRes.workerAttendanceDays} days</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Worker Basic Wage Bill:</span>
                  <span className="font-mono font-bold text-slate-900">₹{contractorRes.basicWageBill.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Contractor Commission:</span>
                  <span className="font-mono font-bold text-emerald-600">₹{contractorRes.commission.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>2% TDS (Section 194C):</span>
                  <span className="font-mono font-bold text-red-600">₹{contractorRes.tds.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-900 border-t pt-1.5">
                  <span>Net Vendor Payout:</span>
                  <span className="font-mono text-base">₹{contractorRes.netPayout.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* F&F Settlement */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b pb-3">
                <Calculator size={16} className="text-indigo-600" />
                <h4 className="font-bold text-sm text-slate-800 font-display">Full & Final (F&F) Settlement Simulator</h4>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Final Month Worked Days</label>
                  <input 
                    type="number" 
                    value={ffWorkedDays}
                    onChange={(e) => setFfWorkedDays(Number(e.target.value))}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Daily Basic Wages (₹)</label>
                  <input 
                    type="number" 
                    value={ffDailyBasic}
                    onChange={(e) => setFfDailyBasic(Number(e.target.value))}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">PL Leave Balance (Days)</label>
                  <input 
                    type="number" 
                    value={ffAccruedLeaves}
                    onChange={(e) => setFfAccruedLeaves(Number(e.target.value))}
                    className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Notice Period Required/Served</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input 
                      type="number" 
                      value={ffNoticePeriodDays}
                      placeholder="Req"
                      onChange={(e) => setFfNoticePeriodDays(Number(e.target.value))}
                      className="w-full border p-1 bg-slate-50 rounded-lg text-xs font-mono font-bold text-center"
                    />
                    <input 
                      type="number" 
                      value={ffNoticeServedDays}
                      placeholder="Serv"
                      onChange={(e) => setFfNoticeServedDays(Number(e.target.value))}
                      className="w-full border p-1 bg-slate-50 rounded-lg text-xs font-mono font-bold text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Outstanding Loan Dues (₹)</label>
                <input 
                  type="number" 
                  value={ffOutstandingLoan}
                  onChange={(e) => setFfOutstandingLoan(Number(e.target.value))}
                  className="w-full border p-2 bg-slate-50 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200/50">
                <div className="text-xs font-semibold text-slate-500 border-b pb-1.5 uppercase tracking-wider text-[9px]">Simulation Results</div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Earned Monthly Wages Dues:</span>
                  <span className="font-mono font-bold text-slate-900">₹{ffRes.earnedSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Accrued Leave Encashment:</span>
                  <span className="font-mono font-bold text-slate-900">₹{ffRes.leaveEncashment.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Notice Period Shortfall ({ffRes.noticeShortfallDays} Days) Recovery:</span>
                  <span className="font-mono font-bold text-red-600">- ₹{ffRes.noticeRecovery.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Outstanding Loan Deductions:</span>
                  <span className="font-mono font-bold text-red-600">- ₹{ffRes.grossDeduction.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-indigo-900 border-t pt-1.5">
                  <span>Net F&F Settlement Payout:</span>
                  <span className="font-mono text-base text-indigo-700">₹{ffRes.netSettlement.toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
