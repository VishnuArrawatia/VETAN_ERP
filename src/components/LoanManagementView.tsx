import React, { useState } from 'react';
import { 
  Coins, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit2, 
  SkipForward, 
  Check, 
  X, 
  RotateCcw, 
  UserCheck, 
  AlertCircle,
  TrendingDown,
  Building2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Receipt,
  Download,
  Printer,
  History,
  ShieldCheck,
  Briefcase,
  DollarSign,
  PieChart,
  BarChart3,
  BookOpen,
  FileText,
  User,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Loan, Employee, LoanType, LoanSettlement, LoanAuditLog, LoanSkipRecord } from '../types';

interface LoanManagementViewProps {
  loans: Loan[];
  employees: Employee[];
  activeCompany: string;
  loanPolicy: {
    max_amount: number;
    eligibility: string;
    interest_rate: number;
    repayment_options: string;
  };
  onRefresh: () => void;
  activeHRRole?: string;
}

export function LoanManagementView({
  loans,
  employees,
  activeCompany,
  loanPolicy,
  onRefresh,
  activeHRRole
}: LoanManagementViewProps) {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MASTER' | 'NEW_LOAN' | 'SETTLEMENT' | 'SKIP_EMI' | 'LEDGER' | 'REPORTS'>('DASHBOARD');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState(activeCompany || 'GROUP');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [loanTypeFilter, setLoanTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [selectedMonth, setSelectedMonth] = useState('2026-04');
  const [masterViewMode, setMasterViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  // Selected Loan for Modals/Views
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showPassbookModal, setShowPassbookModal] = useState(false);

  // Form States - New Loan / Opening Balance
  const [entryMode, setEntryMode] = useState<'OPENING' | 'NEW'>('NEW');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [formLoanType, setFormLoanType] = useState<LoanType>('Employee Loan');
  const [formLoanAmount, setFormLoanAmount] = useState('');
  const [formOpeningBalance, setFormOpeningBalance] = useState('');
  const [formInterestRate, setFormInterestRate] = useState('0');
  const [formEmiAmount, setFormEmiAmount] = useState('');
  const [formTotalInstallments, setFormTotalInstallments] = useState('');
  const [formDisbursalMonth, setFormDisbursalMonth] = useState('2026-04');
  const [formLoanDate, setFormLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [formPurpose, setFormPurpose] = useState('');
  const [formApprovalAuthority, setFormApprovalAuthority] = useState('MD / HR Head');
  const [formRemarks, setFormRemarks] = useState('');
  
  // Guarantor states
  const [formGuarantor1Code, setFormGuarantor1Code] = useState('');
  const [formGuarantor1Name, setFormGuarantor1Name] = useState('');
  const [formGuarantor1Dept, setFormGuarantor1Dept] = useState('');
  const [formGuarantor1Salary, setFormGuarantor1Salary] = useState('');
  const [formGuarantor2Code, setFormGuarantor2Code] = useState('');
  const [formGuarantor2Name, setFormGuarantor2Name] = useState('');
  const [formGuarantor2Dept, setFormGuarantor2Dept] = useState('');
  const [formGuarantor2Salary, setFormGuarantor2Salary] = useState('');

  // Form States - Settlement / Foreclosure
  const [settleLoanId, setSettleLoanId] = useState('');
  const [settleRecoveryType, setSettleRecoveryType] = useState<'FULL_SETTLEMENT' | 'PARTIAL'>('FULL_SETTLEMENT');
  const [settleAmount, setSettleAmount] = useState('');
  const [settlePaymentMode, setSettlePaymentMode] = useState<'Cash' | 'Bank Transfer' | 'Salary Deduction' | 'Cheque' | 'UPI' | 'Journal Entry'>('Bank Transfer');
  const [settleRefNo, setSettleRefNo] = useState('');
  const [settleApprovedBy, setSettleApprovedBy] = useState('HR / Accounts Head');
  const [settleRemarks, setSettleRemarks] = useState('');
  const [settleDate, setSettleDate] = useState(new Date().toISOString().split('T')[0]);

  // Form States - Skip EMI
  const [skipLoanId, setSkipLoanId] = useState('');
  const [skipMonth, setSkipMonth] = useState('2026-05');
  const [skipAction, setSkipAction] = useState<'SKIP' | 'UNSKIP'>('SKIP');
  const [skipReason, setSkipReason] = useState('Medical Emergency');
  const [skipApprovedBy, setSkipApprovedBy] = useState('Management Approval');

  // Form States - Edit Details
  const [targetLoan, setTargetLoan] = useState<Loan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOpeningBal, setEditOpeningBal] = useState('');
  const [editMonthlyEmi, setEditMonthlyEmi] = useState('');
  const [editReason, setEditReason] = useState('');

  // Form States - Top Up Loan
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupMonth, setTopupMonth] = useState('2026-06');
  const [topupReason, setTopupReason] = useState('Additional Emergency Advance');

  // Policy Form State
  const [policyMax, setPolicyMax] = useState(loanPolicy?.max_amount || 300000);
  const [policyElig, setPolicyElig] = useState(loanPolicy?.eligibility || 'Minimum 1 Year Service');
  const [policyInt, setPolicyInt] = useState(loanPolicy?.interest_rate || 0);
  const [policyRepay, setPolicyRepay] = useState(loanPolicy?.repayment_options || 'Standard 6 to 12 Months EMI Repayment (Maximum 12 Months Limit)');

  const financialMonths = [
    { key: '2026-04', label: 'April 2026 (1st April Opening)' },
    { key: '2026-05', label: 'May 2026' },
    { key: '2026-06', label: 'June 2026' },
    { key: '2026-07', label: 'July 2026' },
    { key: '2026-08', label: 'August 2026' },
    { key: '2026-09', label: 'September 2026' },
    { key: '2026-10', label: 'October 2026' },
    { key: '2026-11', label: 'November 2026' },
    { key: '2026-12', label: 'December 2026' },
    { key: '2027-01', label: 'January 2027' },
    { key: '2027-02', label: 'February 2027' },
    { key: '2027-03', label: 'March 2027' },
  ];

  // Helper: List of unique departments from employees
  const departmentsList = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  // Filtered Loans
  const filteredLoans = loans.filter(l => {
    const emp = employees.find(e => e.id === l.employee_id || e.id === l.employee_code);
    const matchesCompany = companyFilter === 'GROUP' || (emp && emp.company === companyFilter) || l.company === companyFilter;
    const matchesDept = departmentFilter === 'ALL' || (emp && emp.department === departmentFilter) || l.department === departmentFilter;
    const matchesLoanType = loanTypeFilter === 'ALL' || l.loan_type === loanTypeFilter;
    const matchesStatus = statusFilter === 'ALL' || l.status === statusFilter;
    const matchesSearch = !searchTerm || 
      (l.loan_number && l.loan_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      l.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCompany && matchesDept && matchesLoanType && matchesStatus && matchesSearch;
  });

  // KPI Calculations
  const activeLoansList = loans.filter(l => l.status === 'ACTIVE');
  const closedLoansList = loans.filter(l => l.status === 'CLOSED');

  const totalOpeningBalanceSum = activeLoansList.reduce((sum, l) => sum + (l.opening_balance !== undefined ? Number(l.opening_balance) : Number(l.amount || 0)), 0);
  const totalMonthlyEmiSum = activeLoansList.reduce((sum, l) => sum + Number(l.monthly_deduction || 0), 0);
  const totalAdditionalLoansSum = activeLoansList.reduce((sum, l) => {
    const adds = (l.additional_loans || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
    return sum + adds;
  }, 0);
  const totalRepaidSum = loans.reduce((sum, l) => sum + Number(l.total_repaid || 0), 0);
  const totalOutstandingSum = activeLoansList.reduce((sum, l) => sum + Number(l.outstanding_balance || 0), 0);

  // New Loans Disbursed This Month
  const newLoansThisMonth = loans.filter(l => l.disbursal_month === selectedMonth || l.month === selectedMonth);
  const newLoansThisMonthSum = newLoansThisMonth.reduce((sum, l) => sum + Number(l.amount || 0), 0);

  // Foreclosures / Settlements Total
  const allSettlements = loans.flatMap(l => l.settlements || []);
  const totalSettlementsAmount = allSettlements.reduce((sum, s) => sum + Number(s.amount || 0), 0);

  // Grouping Active Loans by Employee for Multiple Loan Support View
  const employeeLoanGroups = React.useMemo(() => {
    const map = new Map<string, {
      employee_id: string;
      employee_name: string;
      company?: string;
      department?: string;
      loans: Loan[];
      total_borrowed: number;
      total_repaid: number;
      total_outstanding: number;
      combined_emi: number;
    }>();

    for (const loan of activeLoansList) {
      const emp = employees.find(e => e.id === loan.employee_id || e.id === loan.employee_code);
      const key = loan.employee_id;
      
      const openBal = loan.opening_balance !== undefined ? Number(loan.opening_balance) : Number(loan.amount || 0);
      const addBal = (loan.additional_loans || []).reduce((s, a) => s + Number(a.amount || 0), 0);
      const borrowed = openBal + addBal;
      const repaid = Number(loan.total_repaid || 0);
      const outstanding = Number(loan.outstanding_balance || 0);
      const emi = Number(loan.monthly_deduction || 0);

      if (!map.has(key)) {
        map.set(key, {
          employee_id: key,
          employee_name: emp ? emp.name : loan.employee_name,
          company: emp ? emp.company : loan.company,
          department: emp ? emp.department : loan.department,
          loans: [loan],
          total_borrowed: borrowed,
          total_repaid: repaid,
          total_outstanding: outstanding,
          combined_emi: emi
        });
      } else {
        const existing = map.get(key)!;
        existing.loans.push(loan);
        existing.total_borrowed += borrowed;
        existing.total_repaid += repaid;
        existing.total_outstanding += outstanding;
        existing.combined_emi += emi;
      }
    }

    return Array.from(map.values());
  }, [activeLoansList, employees]);

  // Company-Wise Outstanding Breakdown
  const companyWiseOutstanding = React.useMemo(() => {
    const map = new Map<string, { activeCount: number; openingBal: number; outstanding: number; emiSum: number }>();
    for (const l of activeLoansList) {
      const emp = employees.find(e => e.id === l.employee_id);
      const comp = (emp ? emp.company : l.company) || 'SVN Group';
      const openBal = l.opening_balance !== undefined ? Number(l.opening_balance) : Number(l.amount || 0);
      const outBal = Number(l.outstanding_balance || 0);
      const emi = Number(l.monthly_deduction || 0);

      if (!map.has(comp)) {
        map.set(comp, { activeCount: 1, openingBal: openBal, outstanding: outBal, emiSum: emi });
      } else {
        const item = map.get(comp)!;
        item.activeCount += 1;
        item.openingBal += openBal;
        item.outstanding += outBal;
        item.emiSum += emi;
      }
    }
    return Array.from(map.entries()).map(([company, data]) => ({ company, ...data }));
  }, [activeLoansList, employees]);

  // Department-Wise Outstanding Breakdown
  const departmentWiseOutstanding = React.useMemo(() => {
    const map = new Map<string, { activeCount: number; outstanding: number; emiSum: number }>();
    for (const l of activeLoansList) {
      const emp = employees.find(e => e.id === l.employee_id);
      const dept = (emp ? emp.department : l.department) || 'General';
      const outBal = Number(l.outstanding_balance || 0);
      const emi = Number(l.monthly_deduction || 0);

      if (!map.has(dept)) {
        map.set(dept, { activeCount: 1, outstanding: outBal, emiSum: emi });
      } else {
        const item = map.get(dept)!;
        item.activeCount += 1;
        item.outstanding += outBal;
        item.emiSum += emi;
      }
    }
    return Array.from(map.entries()).map(([dept, data]) => ({ dept, ...data }));
  }, [activeLoansList, employees]);

  // Handler: Create / Disburse Loan
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !formEmiAmount || !formDisbursalMonth) {
      alert("कृपया कर्मचारी, मासिक ईएमआई और disbursal महीना चुनें।");
      return;
    }

    const emp = employees.find(e => e.id === selectedEmpId);
    const amountVal = entryMode === 'OPENING' ? Number(formOpeningBalance || 0) : Number(formLoanAmount || 0);

    if (amountVal <= 0) {
      alert("कृपया मान्य लोन राशि दर्ज करें।");
      return;
    }

    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmpId,
          employee_name: emp ? emp.name : 'Unknown',
          department: emp ? emp.department : '',
          company: emp ? emp.company : '',
          unit: emp ? emp.company : '',
          loan_type: formLoanType,
          loan_date: formLoanDate,
          amount: amountVal,
          interest_rate: Number(formInterestRate || 0),
          opening_balance: amountVal,
          opening_date: formDisbursalMonth === '2026-04' ? '2026-04-01' : `${formDisbursalMonth}-01`,
          monthly_deduction: Number(formEmiAmount),
          emi_start_month: formDisbursalMonth,
          total_installments: formTotalInstallments ? Number(formTotalInstallments) : Math.ceil(amountVal / Number(formEmiAmount)),
          month: formDisbursalMonth,
          reason: formPurpose || (entryMode === 'OPENING' ? '1st April FY Opening Balance' : `${formLoanType} Sanction`),
          approval_authority: formApprovalAuthority,
          remarks: formRemarks,
          guarantor1_code: formGuarantor1Code,
          guarantor1_name: formGuarantor1Name,
          guarantor1_department: formGuarantor1Dept,
          guarantor1_monthly_salary: Number(formGuarantor1Salary || 0),
          guarantor2_code: formGuarantor2Code,
          guarantor2_name: formGuarantor2Name,
          guarantor2_department: formGuarantor2Dept,
          guarantor2_monthly_salary: Number(formGuarantor2Salary || 0),
          status: 'ACTIVE',
          skipped_months: [],
          additional_loans: [],
          settlements: []
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to disburse loan');
      }

      const data = await res.json();
      alert(`लोन खाता ${data.loan?.loan_number || ''} सफलतापूर्वक रजिस्टर कर दिया गया है!`);
      resetCreateForm();
      onRefresh();
      setActiveTab('MASTER');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const resetCreateForm = () => {
    setSelectedEmpId('');
    setFormLoanAmount('');
    setFormOpeningBalance('');
    setFormEmiAmount('');
    setFormTotalInstallments('');
    setFormPurpose('');
    setFormRemarks('');
    setFormGuarantor1Code(''); setFormGuarantor1Name(''); setFormGuarantor1Dept(''); setFormGuarantor1Salary('');
    setFormGuarantor2Code(''); setFormGuarantor2Name(''); setFormGuarantor2Dept(''); setFormGuarantor2Salary('');
  };

  // Handler: Settle / Foreclose Loan
  const handleSettleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleLoanId || !settleAmount || Number(settleAmount) <= 0) {
      alert("कृपया लोन खाता और मान्य निपटान राशि चुनें।");
      return;
    }

    try {
      const res = await fetch(`/api/loans/${settleLoanId}/settlement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(settleAmount),
          recovery_type: settleRecoveryType,
          payment_mode: settlePaymentMode,
          reference_number: settleRefNo,
          approved_by: settleApprovedBy,
          remarks: settleRemarks,
          date: settleDate
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to process settlement');
      }

      alert(`₹${Number(settleAmount).toLocaleString('en-IN')} की लोन रिकवरी सफलता से दर्ज की गई!`);
      setSettleAmount('');
      setSettleRefNo('');
      setSettleRemarks('');
      onRefresh();
      setActiveTab('MASTER');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Skip EMI
  const handleSkipEmiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skipLoanId || !skipMonth) {
      alert("कृपया लोन खाता और महीना चुनें।");
      return;
    }

    try {
      const res = await fetch(`/api/loans/${skipLoanId}/skip-emi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: skipMonth,
          action: skipAction,
          reason: `${skipReason} (Approved By: ${skipApprovedBy})`
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update EMI skip status');
      }

      alert(skipAction === 'SKIP' ? `महीने ${skipMonth} की EMI SKIP कर दी गई है!` : `महीने ${skipMonth} की EMI फिर से चालू कर दी गई है!`);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Top Up Loan
  const handleTopupLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLoan || !topupAmount || Number(topupAmount) <= 0) {
      alert("कृपया मान्य राशि दर्ज करें।");
      return;
    }

    try {
      const res = await fetch(`/api/loans/${targetLoan.id}/add-amount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(topupAmount),
          month: topupMonth,
          reason: topupReason
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add top-up loan');
      }

      alert(`₹${Number(topupAmount).toLocaleString('en-IN')} का टॉप-अप लोन खाते में जोड़ दिया गया है!`);
      setShowTopupModal(false);
      setTopupAmount('');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Update Details
  const handleUpdateDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLoan) return;

    try {
      const res = await fetch(`/api/loans/${targetLoan.id}/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opening_balance: editOpeningBal !== '' ? Number(editOpeningBal) : undefined,
          monthly_deduction: editMonthlyEmi !== '' ? Number(editMonthlyEmi) : undefined,
          reason: editReason || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update loan details');
      }

      alert("लोन विवरण सफलतापूर्वक अपडेट हो गया है!");
      setShowEditModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Update Loan Status
  const handleUpdateStatus = async (loanId: string, status: 'ACTIVE' | 'CLOSED') => {
    try {
      const res = await fetch(`/api/loans/${loanId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error("Failed to update status");
      alert(`Loan status updated to ${status}`);
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Build Month-by-Month Balance Schedule for a Loan
  const buildFinancialYearLedger = (loan: Loan) => {
    const openingBal = loan.opening_balance !== undefined ? Number(loan.opening_balance) : Number(loan.amount || 0);
    const skippedMonths = Array.isArray(loan.skipped_months) ? loan.skipped_months : [];
    const addLoans = Array.isArray(loan.additional_loans) ? loan.additional_loans : [];
    const settlements = Array.isArray(loan.settlements) ? loan.settlements : [];
    const monthlyEmi = Number(loan.monthly_deduction || 0);

    let runningBal = openingBal;

    return financialMonths.map((mObj) => {
      const mCode = mObj.key;
      const startOfVal = runningBal;

      // Check additions in this month
      const monthAdditions = addLoans
        .filter(a => a.month === mCode)
        .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

      // Check manual settlements in this month
      const monthSettlements = settlements
        .filter(s => s.date && s.date.startsWith(mCode))
        .reduce((sum, s) => sum + Number(s.amount || 0), 0);

      const balBeforeDeduct = startOfVal + monthAdditions;
      const isSkipped = skippedMonths.some(sm => (typeof sm === 'string' ? sm === mCode : sm.month === mCode));

      let emiDeduction = 0;
      if (balBeforeDeduct > 0 && !isSkipped) {
        emiDeduction = Math.min(monthlyEmi, Math.max(0, balBeforeDeduct - monthSettlements));
      }

      const totalRecovery = emiDeduction + monthSettlements;
      const closingBal = Math.max(0, balBeforeDeduct - totalRecovery);
      runningBal = closingBal;

      return {
        monthCode: mCode,
        monthLabel: mObj.label,
        openingBal: startOfVal,
        additions: monthAdditions,
        balBeforeDeduct,
        isSkipped,
        emiDeduction,
        settlements: monthSettlements,
        totalRecovery,
        closingBal
      };
    });
  };

  // Export to Excel Function
  const exportToExcel = (reportType: string) => {
    let exportData: any[] = [];
    let fileName = `Loan_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

    if (reportType === 'MASTER_REGISTER') {
      fileName = `Loan_Master_Register_${companyFilter}.xlsx`;
      exportData = filteredLoans.map((l, i) => {
        const emp = employees.find(e => e.id === l.employee_id || e.id === l.employee_code);
        const openBal = l.opening_balance !== undefined ? l.opening_balance : (l.amount || 0);
        const addBal = (l.additional_loans || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
        return {
          'S.No': i + 1,
          'Loan Number': l.loan_number || l.id,
          'Employee Code': l.employee_id,
          'Employee Name': emp ? emp.name : l.employee_name,
          'Company': emp ? emp.company : l.company,
          'Department': emp ? emp.department : l.department,
          'Loan Type': l.loan_type || 'Employee Loan',
          'Loan Date': l.loan_date || l.month,
          '1st April Opening Bal (₹)': openBal,
          'Mid-Year Additions (₹)': addBal,
          'Monthly EMI (₹)': l.monthly_deduction || 0,
          'Total Repaid (₹)': l.total_repaid || 0,
          'Outstanding Balance (₹)': l.outstanding_balance || 0,
          'Status': l.status
        };
      });
    } else if (reportType === 'EMPLOYEE_SUMMARY') {
      fileName = `Employee_Wise_Outstanding_${companyFilter}.xlsx`;
      exportData = employeeLoanGroups.map((g, i) => ({
        'S.No': i + 1,
        'Employee Code': g.employee_id,
        'Employee Name': g.employee_name,
        'Company': g.company || '',
        'Department': g.department || '',
        'Active Loan Count': g.loans.length,
        'Loan Accounts': g.loans.map(l => l.loan_number || l.id).join(', '),
        'Total Borrowed Principal (₹)': g.total_borrowed,
        'Total Repaid (₹)': g.total_repaid,
        'Combined Monthly EMI (₹)': g.combined_emi,
        'Net Outstanding Balance (₹)': g.total_outstanding
      }));
    } else if (reportType === 'MONTH_END_POSITION') {
      fileName = `Month_End_Loan_Position_${selectedMonth}.xlsx`;
      exportData = loans.map((l, i) => {
        const emp = employees.find(e => e.id === l.employee_id);
        const openBal = l.opening_balance !== undefined ? l.opening_balance : (l.amount || 0);
        const newLoanInMonth = (l.month === selectedMonth || l.disbursal_month === selectedMonth) ? l.amount : 0;
        const addInMonth = (l.additional_loans || []).filter(a => a.month === selectedMonth).reduce((s, a) => s + Number(a.amount || 0), 0);
        const stlInMonth = (l.settlements || []).filter(s => s.date && s.date.startsWith(selectedMonth)).reduce((s, st) => s + Number(st.amount || 0), 0);
        const emiInMonth = (l.skipped_months || []).some(sm => typeof sm === 'string' ? sm === selectedMonth : sm.month === selectedMonth) ? 0 : Number(l.monthly_deduction || 0);

        return {
          'S.No': i + 1,
          'Loan Number': l.loan_number || l.id,
          'Employee Code': l.employee_id,
          'Employee Name': emp ? emp.name : l.employee_name,
          'Company': emp ? emp.company : l.company,
          'Opening Outstanding (₹)': openBal,
          'New Loan Issued (₹)': newLoanInMonth + addInMonth,
          'EMI Recovery (₹)': emiInMonth,
          'Settlement Recovery (₹)': stlInMonth,
          'Closing Outstanding (₹)': l.outstanding_balance || 0,
          'Status': l.status
        };
      });
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Loan Report');
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16 font-sans">
      
      {/* HEADER BANNER */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Coins size={24} className="text-yellow-400" />
            <h2 className="text-xl font-black font-display tracking-tight">
              कर्मचारी लोन एवं रिकवरी प्रबंधन प्रणाली (Module 12: Employee Loan System)
            </h2>
            <span className="px-2.5 py-0.5 bg-emerald-900 text-emerald-300 font-mono text-[10px] font-bold rounded-full border border-emerald-700">
              FY 2026-27 Active
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl">
            1st April Opening Balance, Auto EMI Deductions, Multiple Running Loans, Skip EMI Approval, Foreclosures & Month-End Outstanding Ledger.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowPolicyModal(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck size={14} className="text-indigo-400" />
            Loan Policy
          </button>

          <button
            onClick={() => {
              resetCreateForm();
              setActiveTab('NEW_LOAN');
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} />
            + Disburse New Loan / Opening Bal
          </button>
        </div>
      </div>

      {/* TOP SUB-NAVIGATION TABS */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold scrollbar-none">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'DASHBOARD' ? 'bg-white shadow-xs text-indigo-950 font-black' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PieChart size={15} className={activeTab === 'DASHBOARD' ? 'text-indigo-600' : 'text-slate-400'} />
          Loan Dashboard & Analytics
        </button>

        <button
          onClick={() => setActiveTab('MASTER')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'MASTER' ? 'bg-white shadow-xs text-indigo-950 font-black' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins size={15} className={activeTab === 'MASTER' ? 'text-indigo-600' : 'text-slate-400'} />
          Loan Master Register ({loans.length})
        </button>

        <button
          onClick={() => setActiveTab('NEW_LOAN')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'NEW_LOAN' ? 'bg-white shadow-xs text-indigo-950 font-black' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus size={15} className={activeTab === 'NEW_LOAN' ? 'text-indigo-600' : 'text-slate-400'} />
          Disburse New Loan / Opening
        </button>

        <button
          onClick={() => setActiveTab('SETTLEMENT')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'SETTLEMENT' ? 'bg-white shadow-xs text-indigo-950 font-black' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt size={15} className={activeTab === 'SETTLEMENT' ? 'text-indigo-600' : 'text-slate-400'} />
          Foreclosure & Advance Settlement
        </button>

        <button
          onClick={() => setActiveTab('SKIP_EMI')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'SKIP_EMI' ? 'bg-white shadow-xs text-indigo-950 font-black' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SkipForward size={15} className={activeTab === 'SKIP_EMI' ? 'text-indigo-600' : 'text-slate-400'} />
          Skip EMI Manager
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'LEDGER' ? 'bg-white shadow-xs text-indigo-950 font-black' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText size={15} className={activeTab === 'LEDGER' ? 'text-indigo-600' : 'text-slate-400'} />
          Month-Wise Ledger & Position
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'REPORTS' ? 'bg-white shadow-xs text-indigo-950 font-black' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet size={15} className={activeTab === 'REPORTS' ? 'text-indigo-600' : 'text-slate-400'} />
          Loan Reports & Exporter
        </button>
      </div>

      {/* KPI METRICS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Active Accounts</span>
          <div className="text-lg font-black text-slate-900 font-mono">{activeLoansList.length} Loans</div>
          <span className="text-[10px] text-slate-400 block font-sans">{closedLoansList.length} Accounts Closed</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">1st April Opening Bal</span>
          <div className="text-lg font-black text-indigo-900 font-mono">₹{totalOpeningBalanceSum.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-slate-400 block font-sans">Carried Forward Balance</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Monthly EMI Target</span>
          <div className="text-lg font-black text-amber-600 font-mono">₹{totalMonthlyEmiSum.toLocaleString('en-IN')}/mo</div>
          <span className="text-[10px] text-slate-400 block font-sans">Payroll Recovery</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Total Disbursed To Date</span>
          <div className="text-lg font-black text-blue-700 font-mono">₹{(totalOpeningBalanceSum + totalAdditionalLoansSum).toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-blue-600 font-bold block font-sans">+₹{totalAdditionalLoansSum.toLocaleString('en-IN')} Mid-Year</span>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Total Recovered</span>
          <div className="text-lg font-black text-emerald-700 font-mono">₹{totalRepaidSum.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-emerald-600 font-bold block font-sans">EMI + Foreclosures</span>
        </div>

        <div className="p-4 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-md space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Closing Outstanding</span>
          <div className="text-lg font-black text-rose-400 font-mono">₹{totalOutstandingSum.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-slate-400 block font-sans">Group Net Exposure</span>
        </div>
      </div>

      {/* --- TAB 1: DASHBOARD & ANALYTICS --- */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          
          {/* Employee-Wise Active Loans Summary Table (Multiple Loans per Employee) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-0">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <UserCheck size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-black font-display tracking-tight">कर्मचारी वार कुल बकाया लोन स्थिति (Employee-Wise Consolidated Loan Position)</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Multiple Active Loans per Employee tracked individually and consolidated for monthly payroll deductions.
                </p>
              </div>

              <button
                onClick={() => exportToExcel('EMPLOYEE_SUMMARY')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download size={14} />
                Export Employee Summary
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase border-b border-slate-200">
                    <th className="p-3">Employee Code & Name</th>
                    <th className="p-3">Company / Unit</th>
                    <th className="p-3">Department</th>
                    <th className="p-3 text-center">Active Loan Count</th>
                    <th className="p-3">Sanctioned Accounts</th>
                    <th className="p-3 text-right">Total Borrowed (₹)</th>
                    <th className="p-3 text-right">Total Recovered (₹)</th>
                    <th className="p-3 text-right bg-amber-50 text-amber-900 font-bold">Combined Monthly EMI (₹)</th>
                    <th className="p-3 text-right bg-rose-50 text-rose-950 font-bold">Net Outstanding (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {employeeLoanGroups.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 font-sans">
                        कोई सक्रिय लोन खाता उपलब्ध नहीं है।
                      </td>
                    </tr>
                  ) : (
                    employeeLoanGroups.map((g) => (
                      <tr key={g.employee_id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-sans">
                          <div className="font-bold text-slate-900 text-sm">{g.employee_name}</div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {g.employee_id}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded font-sans">
                            {g.company || 'SVN Group'}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700 font-sans">{g.department || 'N/A'}</td>
                        <td className="p-3 text-center">
                          {g.loans.length > 1 ? (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-black rounded-full">
                              ⚡ {g.loans.length} Multiple Loans
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                              1 Active Loan
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] font-sans">
                          <div className="flex flex-wrap gap-1">
                            {g.loans.map(l => (
                              <span key={l.id} className="px-1.5 py-0.5 bg-slate-100 border text-slate-700 font-mono text-[9px] rounded">
                                {l.loan_number || l.id} ({l.loan_type || 'Loan'})
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">₹{g.total_borrowed.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right text-emerald-700 font-bold">₹{g.total_repaid.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right bg-amber-50 font-black text-amber-900 text-sm">
                          ₹{g.combined_emi.toLocaleString('en-IN')}/mo
                        </td>
                        <td className="p-3 text-right bg-rose-50 font-black text-rose-700 text-sm">
                          ₹{g.total_outstanding.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Company & Department Outstanding Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Company Wise Outstanding */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900">
                    कंपनी वार लोन बकाया (Company Outstanding)
                  </h3>
                </div>
              </div>

              <div className="space-y-2">
                {companyWiseOutstanding.map(c => (
                  <div key={c.company} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="font-black text-slate-900 text-xs font-sans">{c.company}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{c.activeCount} Active Loans</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-rose-700 text-sm">₹{c.outstanding.toLocaleString('en-IN')}</div>
                      <span className="text-[10px] text-amber-600 font-mono font-bold">EMI: ₹{c.emiSum.toLocaleString('en-IN')}/mo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Wise Outstanding */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <Briefcase size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900">
                    विभाग वार लोन बकाया (Department Outstanding)
                  </h3>
                </div>
              </div>

              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {departmentWiseOutstanding.map(d => (
                  <div key={d.dept} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="font-black text-slate-900 text-xs font-sans">{d.dept}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{d.activeCount} Active Loans</span>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-black text-rose-700 text-sm">₹{d.outstanding.toLocaleString('en-IN')}</div>
                      <span className="text-[10px] text-amber-600 font-mono font-bold">EMI: ₹{d.emiSum.toLocaleString('en-IN')}/mo</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- TAB 2: MASTER LOAN REGISTER --- */}
      {(activeTab === 'MASTER' || activeTab === 'DASHBOARD') && activeTab === 'MASTER' && (
        <div className="space-y-4">
          
          {/* SEARCH AND FILTERS BAR */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Loan Num / Staff Name / ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="border border-slate-200 rounded-xl text-xs p-1.5 bg-slate-50 font-bold focus:outline-none"
              >
                <option value="GROUP">All Companies (Group)</option>
                <option value="SVN-1">SVN-1</option>
                <option value="SVN-II">SVN-II</option>
                <option value="Sakar-I">Sakar-I</option>
                <option value="Sakar-III">Sakar-III</option>
              </select>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="border border-slate-200 rounded-xl text-xs p-1.5 bg-slate-50 font-bold focus:outline-none"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={loanTypeFilter}
                onChange={(e) => setLoanTypeFilter(e.target.value)}
                className="border border-slate-200 rounded-xl text-xs p-1.5 bg-slate-50 font-bold focus:outline-none"
              >
                <option value="ALL">All Loan Types</option>
                <option value="Salary Advance">Salary Advance</option>
                <option value="Employee Loan">Employee Loan</option>
                <option value="Emergency Loan">Emergency Loan</option>
                <option value="Festival Loan">Festival Loan</option>
                <option value="Special Loan">Special Loan</option>
              </select>

              <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-100 text-xs font-bold">
                <button
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`px-3 py-1 rounded-lg transition ${statusFilter === 'ACTIVE' ? 'bg-white shadow-2xs text-indigo-950 font-extrabold' : 'text-slate-500'}`}
                >
                  Active ({loans.filter(l => l.status === 'ACTIVE').length})
                </button>
                <button
                  onClick={() => setStatusFilter('CLOSED')}
                  className={`px-3 py-1 rounded-lg transition ${statusFilter === 'CLOSED' ? 'bg-white shadow-2xs text-indigo-950 font-extrabold' : 'text-slate-500'}`}
                >
                  Closed ({loans.filter(l => l.status === 'CLOSED').length})
                </button>
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition ${statusFilter === 'ALL' ? 'bg-white shadow-2xs text-indigo-950 font-extrabold' : 'text-slate-500'}`}
                >
                  All ({loans.length})
                </button>
              </div>
            </div>

            <button
              onClick={() => exportToExcel('MASTER_REGISTER')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet size={14} />
              Excel Export
            </button>
          </div>

          {/* MAIN MASTER TABLE */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Coins size={16} className="text-indigo-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-display">
                  कर्मचारी लोन एवं रिकवरी मास्टर रजिस्टर (Master Loan Recovery Ledger)
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Showing {filteredLoans.length} Records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase tracking-wider">
                    <th className="p-3">Loan Num</th>
                    <th className="p-3">Staff Member</th>
                    <th className="p-3">Loan Type</th>
                    <th className="p-3 text-right">Sanctioned / Opening Bal</th>
                    <th className="p-3 text-right">Monthly EMI</th>
                    <th className="p-3 text-right">Additions</th>
                    <th className="p-3 text-right">Total Repaid</th>
                    <th className="p-3 text-right bg-slate-800">Closing Outstanding</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions & Tools</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-12 text-center text-slate-400 font-sans">
                        कोई लोन खाता नहीं मिला। नया लोन दर्ज करने के लिए ऊपर "+ Disburse New Loan" पर क्लिक करें।
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((loan) => {
                      const emp = employees.find(e => e.id === loan.employee_id || e.id === loan.employee_code);
                      const openBal = loan.opening_balance !== undefined ? loan.opening_balance : (loan.amount || 0);
                      const additionsSum = (loan.additional_loans || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
                      const repaid = loan.total_repaid || 0;
                      const closingBal = loan.outstanding_balance !== undefined ? loan.outstanding_balance : Math.max(0, openBal + additionsSum - repaid);

                      return (
                        <tr key={loan.id} className="hover:bg-slate-50 transition">
                          
                          {/* Loan Number */}
                          <td className="p-3">
                            <span className="font-bold text-indigo-900 text-xs font-mono block">
                              {loan.loan_number || loan.id}
                            </span>
                            <span className="text-[10px] text-slate-400 font-sans block">{loan.loan_date || loan.month}</span>
                          </td>

                          {/* Employee Info */}
                          <td className="p-3 font-sans">
                            <div className="font-bold text-slate-900 text-sm">{emp ? emp.name : loan.employee_name}</div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                              <span>ID: {loan.employee_id}</span>
                              {emp && <span className="px-1.5 py-0.2 bg-slate-100 rounded text-slate-600">{emp.company}</span>}
                              {loan.reason && <span className="italic text-slate-500">({loan.reason})</span>}
                            </div>
                          </td>

                          {/* Loan Type */}
                          <td className="p-3 font-sans">
                            <span className="px-2 py-0.5 bg-slate-100 border text-slate-700 font-bold text-[10px] rounded-full">
                              {loan.loan_type || 'Employee Loan'}
                            </span>
                          </td>

                          {/* Opening / Sanctioned */}
                          <td className="p-3 text-right font-bold text-indigo-950 font-mono">
                            ₹{openBal.toLocaleString('en-IN')}
                          </td>

                          {/* Monthly EMI */}
                          <td className="p-3 text-right font-bold text-amber-700 font-mono">
                            ₹{(loan.monthly_deduction || 0).toLocaleString('en-IN')}/mo
                          </td>

                          {/* Additions */}
                          <td className="p-3 text-right font-mono">
                            {additionsSum > 0 ? (
                              <span className="text-blue-700 font-bold">+₹{additionsSum.toLocaleString('en-IN')}</span>
                            ) : (
                              <span className="text-slate-300">₹0</span>
                            )}
                          </td>

                          {/* Repaid */}
                          <td className="p-3 text-right text-emerald-700 font-bold font-mono">
                            ₹{repaid.toLocaleString('en-IN')}
                          </td>

                          {/* Closing Balance */}
                          <td className="p-3 text-right font-black text-rose-700 bg-slate-50 font-mono text-sm">
                            ₹{closingBal.toLocaleString('en-IN')}
                          </td>

                          {/* Status */}
                          <td className="p-3 text-center">
                            <span className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase tracking-wider ${
                              closingBal === 0 || loan.status === 'CLOSED'
                                ? 'bg-slate-100 text-slate-600 border border-slate-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            }`}>
                              {closingBal === 0 ? 'COMPLETED' : loan.status}
                            </span>
                          </td>

                          {/* Action Buttons */}
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Ledger Statement */}
                              <button
                                onClick={() => setSelectedLoan(loan)}
                                title="View Month-Wise Closing Balance Ledger"
                                className="p-1.5 bg-slate-100 hover:bg-indigo-600 hover:text-white text-slate-700 rounded-lg transition cursor-pointer"
                              >
                                <Eye size={14} />
                              </button>

                              {/* Settle / Foreclose */}
                              <button
                                onClick={() => {
                                  setSettleLoanId(loan.id);
                                  setSettleAmount(String(closingBal));
                                  setActiveTab('SETTLEMENT');
                                }}
                                title="Close Loan / Full Foreclosure / Settlement"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 rounded-lg transition cursor-pointer"
                              >
                                <Receipt size={14} />
                              </button>

                              {/* Skip EMI */}
                              <button
                                onClick={() => {
                                  setSkipLoanId(loan.id);
                                  setActiveTab('SKIP_EMI');
                                }}
                                title="Skip / Pause EMI"
                                className="p-1.5 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-700 border border-amber-200 rounded-lg transition cursor-pointer"
                              >
                                <SkipForward size={14} />
                              </button>

                              {/* Top Up Loan */}
                              <button
                                onClick={() => {
                                  setTargetLoan(loan);
                                  setShowTopupModal(true);
                                }}
                                title="Add Mid-Year Top-up Loan"
                                className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg transition cursor-pointer"
                              >
                                <Plus size={14} />
                              </button>

                              {/* Audit Trail */}
                              <button
                                onClick={() => {
                                  setSelectedLoan(loan);
                                  setShowAuditModal(true);
                                }}
                                title="View Audit Log History"
                                className="p-1.5 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 rounded-lg transition cursor-pointer"
                              >
                                <History size={14} />
                              </button>

                              {/* Status Toggle */}
                              <button
                                onClick={() => handleUpdateStatus(loan.id, loan.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE')}
                                title={loan.status === 'ACTIVE' ? 'Close Loan' : 'Reopen Loan'}
                                className="p-1.5 bg-slate-100 hover:bg-slate-300 text-slate-600 rounded-lg transition cursor-pointer"
                              >
                                <RotateCcw size={14} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 3: DISBURSE NEW LOAN / OPENING BALANCE --- */}
      {activeTab === 'NEW_LOAN' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-4xl mx-auto">
          <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Plus size={18} className="text-emerald-400" />
                <h3 className="text-base font-black font-display">नया लोन संस्वीकृति / 1st April Opening Balance</h3>
              </div>
              <p className="text-xs text-slate-400">Issue new employee loan or bring forward opening loan balance for FY 2026-27.</p>
            </div>

            {/* Entry Mode Switch */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setEntryMode('NEW')}
                className={`px-3 py-1 rounded-lg transition ${entryMode === 'NEW' ? 'bg-emerald-600 text-white font-extrabold' : 'text-slate-400'}`}
              >
                Disburse New Loan
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('OPENING')}
                className={`px-3 py-1 rounded-lg transition ${entryMode === 'OPENING' ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-400'}`}
              >
                1st April Opening Bal
              </button>
            </div>
          </div>

          <form onSubmit={handleCreateLoan} className="p-6 space-y-6">
            
            {/* Corporate Repayment Guideline Banner */}
            <div className="p-4 bg-gradient-to-r from-indigo-50/80 via-amber-50/60 to-slate-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
              <BookOpen size={18} className="text-indigo-600 mt-0.5 shrink-0" />
              <div className="text-xs space-y-1">
                <div className="font-extrabold text-indigo-950 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <span>Corporate Loan Repayment Rule (पुनर्भुगतान नीति नियम)</span>
                  <span className="px-2 py-0.5 bg-indigo-600 text-white font-mono text-[9px] rounded-full">STANDARD POLICY</span>
                </div>
                <div className="text-slate-700 font-medium leading-relaxed">
                  • <strong>Standard Repayment Tenure:</strong> <strong>6 to 12 Months EMI</strong> for salary advances and employee loans.<br />
                  • <strong>Maximum Limit:</strong> Repayment tenure is capped at a maximum of <strong>12 Months EMI</strong>.
                </div>
              </div>
            </div>

            {/* Auto Loan Number Preview */}
            <div className="p-3.5 bg-slate-50 border rounded-2xl flex justify-between items-center">
              <span className="text-xs text-slate-500 font-medium">Auto Loan Number Sequence:</span>
              <span className="font-mono font-black text-indigo-900 text-sm">
                LN-{new Date().getFullYear()}-{String(loans.length + 1).padStart(3, '0')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Employee Selection */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">कर्मचारी चुनें (Employee) *</label>
                <select
                  required
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-bold focus:outline-none focus:border-indigo-600"
                >
                  <option value="">-- कर्मचारी चुनें (Select Staff) --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} (ID: {emp.id}) - {emp.company} [{emp.department || 'General'}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">लोन का प्रकार (Loan Type) *</label>
                <select
                  value={formLoanType}
                  onChange={(e) => setFormLoanType(e.target.value as LoanType)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-bold focus:outline-none focus:border-indigo-600"
                >
                  <option value="Salary Advance">Salary Advance (वेतन अग्रिम)</option>
                  <option value="Employee Loan">Employee Loan (कर्मचारी लोन)</option>
                  <option value="Emergency Loan">Emergency Loan (आपातकालीन ऋण)</option>
                  <option value="Festival Loan">Festival Loan (त्योहार अग्रिम)</option>
                  <option value="Special Loan">Special Loan (विशेष ऋण)</option>
                </select>
              </div>

              {/* Sanction Amount / Opening Balance */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  {entryMode === 'OPENING' ? '1st April Opening Loan Balance (₹) *' : 'स्वीकृत लोन राशि (Loan Amount ₹) *'}
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount}
                  onChange={(e) => {
                    if (entryMode === 'OPENING') setFormOpeningBalance(e.target.value);
                    else setFormLoanAmount(e.target.value);
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Interest Rate */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">ब्याज दर % (Interest Rate - Optional)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={formInterestRate}
                  onChange={(e) => setFormInterestRate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Monthly EMI Deduction with Policy Calculator */}
              <div className="space-y-2 md:col-span-2 bg-amber-50/40 p-4 rounded-2xl border border-amber-200">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Coins size={14} className="text-amber-600" />
                    मासिक ईएमआई कटौती (Monthly EMI Cut ₹) *
                  </label>

                  {Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount) > 0 && Number(formEmiAmount) > 0 && (
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg shadow-2xs">
                      Est. Tenure: ~{Math.ceil(Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount) / Number(formEmiAmount))} Months EMI
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={formEmiAmount}
                    onChange={(e) => setFormEmiAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-amber-950 bg-white focus:outline-none focus:border-indigo-600"
                  />

                  {/* Quick Select Buttons based on 6 to 12 Months rule */}
                  {Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount) > 0 && (
                    <div className="md:col-span-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Tenure:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount);
                          setFormEmiAmount(String(Math.ceil(amt / 6)));
                          setFormTotalInstallments('6');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-2xs transition cursor-pointer"
                      >
                        6 Months (₹{Math.ceil(Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount) / 6).toLocaleString('en-IN')}/mo)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount);
                          setFormEmiAmount(String(Math.ceil(amt / 8)));
                          setFormTotalInstallments('8');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg shadow-2xs transition cursor-pointer"
                      >
                        8 Months (₹{Math.ceil(Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount) / 8).toLocaleString('en-IN')}/mo)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount);
                          setFormEmiAmount(String(Math.ceil(amt / 10)));
                          setFormTotalInstallments('10');
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg shadow-2xs transition cursor-pointer"
                      >
                        10 Months (₹{Math.ceil(Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount) / 10).toLocaleString('en-IN')}/mo)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const amt = Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount);
                          setFormEmiAmount(String(Math.ceil(amt / 12)));
                          setFormTotalInstallments('12');
                        }}
                        className="px-2.5 py-1 text-[11px] font-extrabold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg shadow-2xs transition cursor-pointer"
                      >
                        Max 12 Months (₹{Math.ceil(Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount) / 12).toLocaleString('en-IN')}/mo)
                      </button>
                    </div>
                  )}
                </div>

                {/* Policy tenure check notices */}
                {Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount) > 0 && Number(formEmiAmount) > 0 && (
                  <div>
                    {(Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount) / Number(formEmiAmount)) > 12 && (
                      <p className="text-[11px] font-bold text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 mt-1">
                        ⚠️ Caution: Repayment tenure exceeds maximum allowed limit of 12 Months EMI.
                      </p>
                    )}
                    {(Number(entryMode === 'OPENING' ? formOpeningBalance : formLoanAmount) / Number(formEmiAmount)) < 6 && (
                      <p className="text-[11px] font-bold text-indigo-800 bg-indigo-50/80 p-2 rounded-lg border border-indigo-200 mt-1">
                        ℹ️ Note: Standard repayment tenure range is 6 to 12 Months EMI. (Early repayment tenure selected)
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Disbursal Month / EMI Start Month */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">EMI शुरू होने का महीना (EMI Start Month) *</label>
                <select
                  value={formDisbursalMonth}
                  onChange={(e) => setFormDisbursalMonth(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-bold focus:outline-none focus:border-indigo-600"
                >
                  {financialMonths.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Disbursal Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">लोन स्वीकृत तिथि (Sanction Date)</label>
                <input
                  type="date"
                  value={formLoanDate}
                  onChange={(e) => setFormLoanDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Purpose / Reason */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-slate-700">लोन का कारण (Purpose / Reason)</label>
                <input
                  type="text"
                  placeholder="e.g. Medical Emergency / Home Renovation / Festival Advance"
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Approval Authority */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">अनुमोदन अधिकारी (Approval Authority)</label>
                <input
                  type="text"
                  value={formApprovalAuthority}
                  onChange={(e) => setFormApprovalAuthority(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">रिमार्क्स (Remarks)</label>
                <input
                  type="text"
                  placeholder="Optional remarks"
                  value={formRemarks}
                  onChange={(e) => setFormRemarks(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

            </div>

            {/* GUARANTOR SECTION */}
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <h4 className="text-xs font-extrabold text-amber-800 mb-3 flex items-center gap-2">
                🛡️ गारंटर (Guarantors) — दो कर्मचारी अनिवार्य
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Guarantor 1 */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">गारंटर 1 — कोड</label>
                  <select
                    value={formGuarantor1Code}
                    onChange={(e) => {
                      const emp = employees.find((em: any) => (em.emp_code || em.id) === e.target.value);
                      setFormGuarantor1Code(e.target.value);
                      setFormGuarantor1Name(emp?.name || '');
                      setFormGuarantor1Dept(emp?.department || '');
                      setFormGuarantor1Salary(String(emp?.rate_base_salary || 0));
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select --</option>
                    {employees.map((em: any) => (
                      <option key={em.id} value={em.emp_code || em.id}>{em.emp_code || em.id} — {em.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">नाम</label>
                  <input type="text" value={formGuarantor1Name} readOnly className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">विभाग</label>
                  <input type="text" value={formGuarantor1Dept} readOnly className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">मासिक वेतन</label>
                  <input type="text" value={formGuarantor1Salary ? ('₹' + Number(formGuarantor1Salary).toLocaleString('en-IN')) : ''} readOnly className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50" />
                </div>

                {/* Guarantor 2 */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">गारंटर 2 — कोड</label>
                  <select
                    value={formGuarantor2Code}
                    onChange={(e) => {
                      const emp = employees.find((em: any) => (em.emp_code || em.id) === e.target.value);
                      setFormGuarantor2Code(e.target.value);
                      setFormGuarantor2Name(emp?.name || '');
                      setFormGuarantor2Dept(emp?.department || '');
                      setFormGuarantor2Salary(String(emp?.rate_base_salary || 0));
                    }}
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select --</option>
                    {employees.map((em: any) => (
                      <option key={em.id} value={em.emp_code || em.id}>{em.emp_code || em.id} — {em.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">नाम</label>
                  <input type="text" value={formGuarantor2Name} readOnly className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">विभाग</label>
                  <input type="text" value={formGuarantor2Dept} readOnly className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600">मासिक वेतन</label>
                  <input type="text" value={formGuarantor2Salary ? ('₹' + Number(formGuarantor2Salary).toLocaleString('en-IN')) : ''} readOnly className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-slate-50" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('MASTER')}
                className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                लोन खाता दर्ज करें (Save Loan Account)
              </button>
            </div>

          </form>
        </div>
      )}

      {/* --- TAB 4: FORECLOSURE & ADVANCE SETTLEMENT --- */}
      {activeTab === 'SETTLEMENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Settlement Entry Form */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden lg:col-span-1">
            <div className="bg-slate-900 text-white p-5 space-y-1">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-emerald-400" />
                <h3 className="text-base font-black font-display">लोन पूर्ण चुकता / अग्रिम रिकवरी</h3>
              </div>
              <p className="text-xs text-slate-400">Repay full loan balance before EMI completion or record partial extra payment.</p>
            </div>

            <form onSubmit={handleSettleLoanSubmit} className="p-5 space-y-4">
              
              {/* Select Loan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">लोन खाता चुनें (Select Loan Account) *</label>
                <select
                  required
                  value={settleLoanId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSettleLoanId(id);
                    const l = loans.find(x => x.id === id);
                    if (l) {
                      setSettleAmount(String(l.outstanding_balance || 0));
                    }
                  }}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-bold focus:outline-none"
                >
                  <option value="">-- सक्रिय लोन चुनें --</option>
                  {activeLoansList.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.loan_number || l.id} - {l.employee_name} (Outstanding: ₹{(l.outstanding_balance || 0).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Settlement Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">रिकवरी का प्रकार (Recovery Type) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSettleRecoveryType('FULL_SETTLEMENT');
                      const l = loans.find(x => x.id === settleLoanId);
                      if (l) setSettleAmount(String(l.outstanding_balance || 0));
                    }}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                      settleRecoveryType === 'FULL_SETTLEMENT'
                        ? 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Full Foreclosure (पूर्ण चुकता)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettleRecoveryType('PARTIAL')}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                      settleRecoveryType === 'PARTIAL'
                        ? 'bg-blue-700 text-white border-blue-800'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Partial Recovery (आंशिक जमा)
                  </button>
                </div>
              </div>

              {/* Settlement Amount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">रिकवरी राशि (Settlement Amount ₹) *</label>
                <input
                  type="number"
                  required
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-800 focus:outline-none"
                />
              </div>

              {/* Payment Mode */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">भुगतान माध्यम (Payment Mode) *</label>
                <select
                  value={settlePaymentMode}
                  onChange={(e) => setSettlePaymentMode(e.target.value as any)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-bold focus:outline-none"
                >
                  <option value="Bank Transfer">Bank Transfer (बैंक ट्रांसफर)</option>
                  <option value="Cash">Cash (नकद)</option>
                  <option value="UPI">UPI / NetBanking</option>
                  <option value="Cheque">Cheque (चेक)</option>
                  <option value="Salary Deduction">Salary Deduction (वेतन कटौती)</option>
                  <option value="Journal Entry">Journal Entry (खाता समायोजन)</option>
                </select>
              </div>

              {/* Ref Number */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">संदर्भ/यूटीआर नंबर (Ref / UTR Number)</label>
                <input
                  type="text"
                  placeholder="e.g. UTR123456789"
                  value={settleRefNo}
                  onChange={(e) => setSettleRefNo(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              {/* Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">निपटान तारीख (Settlement Date)</label>
                <input
                  type="date"
                  value={settleDate}
                  onChange={(e) => setSettleDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">रिमार्क्स (Remarks)</label>
                <input
                  type="text"
                  placeholder="e.g. Early repayment by staff"
                  value={settleRemarks}
                  onChange={(e) => setSettleRemarks(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-900 hover:bg-indigo-950 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                लोन जमा / फोरक्लोजर सबमिट करें
              </button>

            </form>
          </div>

          {/* Settlement History Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden lg:col-span-2 space-y-0">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-black font-display">अग्रिम जमा एवं लोन फोरक्लोजर रजिस्टर (Settlement History)</h3>
                </div>
                <p className="text-xs text-slate-400">Complete audit history of manual loan repayments and full closures.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase border-b">
                    <th className="p-3">Date</th>
                    <th className="p-3">Loan Num & Staff</th>
                    <th className="p-3">Recovery Type</th>
                    <th className="p-3 text-right">Settlement Amount</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Reference / Remarks</th>
                    <th className="p-3">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {allSettlements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 font-sans">
                        कोई फोरक्लोजर या अग्रिम जमा रिकॉर्ड उपलब्ध नहीं है।
                      </td>
                    </tr>
                  ) : (
                    allSettlements.map((stl) => {
                      const parentLoan = loans.find(l => (l.settlements || []).some(s => s.id === stl.id));
                      return (
                        <tr key={stl.id} className="hover:bg-slate-50 transition">
                          <td className="p-3 text-slate-600 font-bold">{stl.date}</td>
                          <td className="p-3 font-sans">
                            <div className="font-bold text-slate-900">{parentLoan?.employee_name || 'Staff'}</div>
                            <span className="text-[10px] font-mono text-indigo-700">{parentLoan?.loan_number || parentLoan?.id}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 font-bold text-[10px] rounded-full ${
                              stl.recovery_type === 'FULL_SETTLEMENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {stl.recovery_type}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-emerald-800 text-sm">
                            ₹{stl.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 font-sans font-medium text-slate-700">{stl.payment_mode}</td>
                          <td className="p-3 font-sans text-slate-500 text-[11px]">
                            {stl.reference_number && <div className="font-mono text-slate-700 font-bold">Ref: {stl.reference_number}</div>}
                            {stl.remarks || 'N/A'}
                          </td>
                          <td className="p-3 font-sans text-slate-600 text-[11px]">{stl.approved_by || 'HR Admin'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 5: SKIP EMI MANAGER --- */}
      {activeTab === 'SKIP_EMI' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Skip EMI Form */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden lg:col-span-1">
            <div className="bg-slate-900 text-white p-5 space-y-1">
              <div className="flex items-center gap-2">
                <SkipForward size={18} className="text-amber-400" />
                <h3 className="text-base font-black font-display">मासिक EMI Skip / Pause प्रबंधक</h3>
              </div>
              <p className="text-xs text-slate-400">Skip salary EMI deduction for selected month without balance changes.</p>
            </div>

            <form onSubmit={handleSkipEmiSubmit} className="p-5 space-y-4">
              
              {/* Select Loan */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">लोन खाता चुनें (Select Loan) *</label>
                <select
                  required
                  value={skipLoanId}
                  onChange={(e) => setSkipLoanId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-bold focus:outline-none"
                >
                  <option value="">-- लोन खाता चुनें --</option>
                  {activeLoansList.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.loan_number || l.id} - {l.employee_name} (EMI: ₹{l.monthly_deduction}/mo)
                    </option>
                  ))}
                </select>
              </div>

              {/* Action */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">एक्शन चुनें (Action) *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSkipAction('SKIP')}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                      skipAction === 'SKIP' ? 'bg-amber-600 text-white border-amber-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Skip EMI (रोकें)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSkipAction('UNSKIP')}
                    className={`py-2 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                      skipAction === 'UNSKIP' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    Restore EMI (चालू करें)
                  </button>
                </div>
              </div>

              {/* Skip Month */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">महीना चुनें (Select Month) *</label>
                <select
                  value={skipMonth}
                  onChange={(e) => setSkipMonth(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-bold focus:outline-none"
                >
                  {financialMonths.map(m => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">कारण (Reason for Skip) *</label>
                <select
                  value={skipReason}
                  onChange={(e) => setSkipReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-bold focus:outline-none"
                >
                  <option value="Medical Emergency">Medical Emergency (चिकित्सा आपात स्थिति)</option>
                  <option value="Leave Without Pay (LWP)">Leave Without Pay (LWP / बिना वेतन छुट्टी)</option>
                  <option value="Management Approval">Management Approval (प्रबंधन स्वीकृति)</option>
                  <option value="Worker Personal Request">Worker Personal Request (कर्मचारी अनुरोध)</option>
                </select>
              </div>

              {/* Approved By */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">स्वीकृति अधिकारी (Approved By)</label>
                <input
                  type="text"
                  value={skipApprovedBy}
                  onChange={(e) => setSkipApprovedBy(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition cursor-pointer"
              >
                {skipAction === 'SKIP' ? 'EMI Skip कन्फर्म करें' : 'EMI Restore कन्फर्म करें'}
              </button>

            </form>
          </div>

          {/* Active Skipped EMI Cases List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden lg:col-span-2 space-y-0">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-400" />
                  <h3 className="text-sm font-black font-display">वर्तमान में Skipped/Paused EMI सूची (Skipped EMI Register)</h3>
                </div>
                <p className="text-xs text-slate-400">All loans where EMI deduction is temporarily put on hold for specific months.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase border-b">
                    <th className="p-3">Loan Num & Staff</th>
                    <th className="p-3">Skipped Month</th>
                    <th className="p-3 text-right">Monthly EMI Held</th>
                    <th className="p-3 text-right">Current Outstanding</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {loans.filter(l => (l.skipped_months || []).length > 0).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 font-sans">
                        वर्तमान में कोई EMI Skip केस दर्ज नहीं है। सभी खातों से नियमित कटौती हो रही है।
                      </td>
                    </tr>
                  ) : (
                    loans.filter(l => (l.skipped_months || []).length > 0).flatMap(l => {
                      const skippedList = l.skipped_months || [];
                      return skippedList.map((sm, idx) => {
                        const mCode = typeof sm === 'string' ? sm : sm.month;
                        return (
                          <tr key={`${l.id}-${mCode}-${idx}`} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-sans">
                              <div className="font-bold text-slate-900">{l.employee_name}</div>
                              <span className="text-[10px] font-mono text-indigo-700">{l.loan_number || l.id}</span>
                            </td>
                            <td className="p-3 font-bold text-amber-800">
                              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full font-mono text-[10px]">
                                ⏸️ {mCode}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">₹{(l.monthly_deduction || 0).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-right font-bold text-rose-700">₹{(l.outstanding_balance || 0).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleSkipEmiSubmit({ preventDefault: () => {} } as any)}
                                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-lg transition cursor-pointer"
                              >
                                Restore EMI
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 6: MONTH-WISE LEDGER & MONTH-END POSITION REPORT --- */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-6">
          
          {/* Select Loan for Individual Ledger */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xl flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="space-y-1 w-full md:w-auto">
              <h3 className="text-sm font-black font-display uppercase tracking-wider text-slate-900">
                कर्मचारी लेजर एवं 12-महीने क्लोजिंग स्थिति (Employee Loan Ledger)
              </h3>
              <p className="text-xs text-slate-400">Select any loan account to inspect month-by-month opening, additions, EMI cut & closing balances.</p>
            </div>

            <div className="w-full md:w-80">
              <select
                value={selectedLoan?.id || ''}
                onChange={(e) => {
                  const l = loans.find(x => x.id === e.target.value);
                  setSelectedLoan(l || null);
                }}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-bold focus:outline-none"
              >
                <option value="">-- व्यक्तिगत लोन खाता चुनें --</option>
                {loans.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.loan_number || l.id} - {l.employee_name} (Bal: ₹{(l.outstanding_balance || 0).toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Render Month-wise Ledger Table for Selected Loan */}
          {selectedLoan ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-0">
              <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Coins size={18} className="text-yellow-400" />
                    <h3 className="text-base font-black font-display">
                      {selectedLoan.employee_name} - Loan Ledger Statement ({selectedLoan.loan_number || selectedLoan.id})
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400">
                    Sanction Amount / 1st April Bal: ₹{(selectedLoan.opening_balance !== undefined ? selectedLoan.opening_balance : selectedLoan.amount).toLocaleString('en-IN')} | Monthly EMI Rate: ₹{(selectedLoan.monthly_deduction || 0).toLocaleString('en-IN')}/mo
                  </p>
                </div>

                <button
                  onClick={() => setShowPassbookModal(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  Print Passbook / Statement
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase border-b">
                      <th className="p-3">Month Cycle</th>
                      <th className="p-3 text-right">Opening Balance</th>
                      <th className="p-3 text-right text-blue-700">New Addition</th>
                      <th className="p-3 text-right text-amber-700">EMI Cut</th>
                      <th className="p-3 text-right text-emerald-700">Settlements</th>
                      <th className="p-3 text-right font-bold text-slate-900 bg-slate-100">Closing Balance</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {buildFinancialYearLedger(selectedLoan).map((row) => (
                      <tr key={row.monthCode} className="hover:bg-slate-50">
                        <td className="p-3 font-bold font-sans text-slate-900">{row.monthLabel}</td>
                        <td className="p-3 text-right font-bold">₹{row.openingBal.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right text-blue-700">
                          {row.additions > 0 ? `+₹${row.additions.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-3 text-right font-bold text-amber-700">
                          {row.isSkipped ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] rounded-full">⏸️ SKIPPED</span>
                          ) : (
                            `₹${row.emiDeduction.toLocaleString('en-IN')}`
                          )}
                        </td>
                        <td className="p-3 text-right text-emerald-700 font-bold">
                          {row.settlements > 0 ? `₹${row.settlements.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-3 text-right font-black text-rose-700 bg-slate-50 text-sm">
                          ₹{row.closingBal.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center font-sans">
                          {row.closingBal === 0 ? (
                            <span className="text-slate-400 font-bold text-[10px]">CLOSED</span>
                          ) : (
                            <span className="text-emerald-700 font-bold text-[10px]">ACTIVE</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-dashed border-slate-300 p-12 rounded-3xl text-center text-slate-400 font-sans">
              ऊपर ड्रॉपडाउन से किसी कर्मचारी का लोन खाता चुनें और उसका विस्तृत 12-महीने का लेजर देखें।
            </div>
          )}

          {/* Month-End Loan Position Formula Matrix */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-0">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <BarChart3 size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-black font-display uppercase tracking-wider">
                    माह के अंत की लोन स्थिति रिपोर्ट (Month-End Loan Position Report)
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Formula: Opening Balance + New Loan Issued - EMI Recovered - Advance Recovery = Closing Outstanding
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="p-1.5 bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-700 focus:outline-none font-mono"
                >
                  {financialMonths.map(m => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>

                <button
                  onClick={() => exportToExcel('MONTH_END_POSITION')}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} />
                  Export Position Sheet
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-mono text-[10px] uppercase border-b">
                    <th className="p-3">Loan Num</th>
                    <th className="p-3">Employee Name</th>
                    <th className="p-3 text-right">Opening Outstanding</th>
                    <th className="p-3 text-right text-blue-700">(+) New Loan Issued</th>
                    <th className="p-3 text-right text-amber-700">(-) EMI Recovery</th>
                    <th className="p-3 text-right text-emerald-700">(-) Foreclosures / Advance</th>
                    <th className="p-3 text-right font-bold text-rose-900 bg-rose-50">(=) Closing Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {loans.map(l => {
                    const openBal = l.opening_balance !== undefined ? l.opening_balance : (l.amount || 0);
                    const newLoanInMonth = (l.month === selectedMonth || l.disbursal_month === selectedMonth) ? l.amount : 0;
                    const addInMonth = (l.additional_loans || []).filter(a => a.month === selectedMonth).reduce((s, a) => s + Number(a.amount || 0), 0);
                    const stlInMonth = (l.settlements || []).filter(s => s.date && s.date.startsWith(selectedMonth)).reduce((s, st) => s + Number(st.amount || 0), 0);
                    const isSkipped = (l.skipped_months || []).some(sm => typeof sm === 'string' ? sm === selectedMonth : sm.month === selectedMonth);
                    const emiInMonth = isSkipped ? 0 : Number(l.monthly_deduction || 0);

                    return (
                      <tr key={l.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-indigo-900">{l.loan_number || l.id}</td>
                        <td className="p-3 font-sans font-bold text-slate-900">{l.employee_name}</td>
                        <td className="p-3 text-right">₹{openBal.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right text-blue-700 font-bold">
                          {(newLoanInMonth + addInMonth) > 0 ? `+₹${(newLoanInMonth + addInMonth).toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-3 text-right text-amber-700 font-bold">
                          {isSkipped ? (
                            <span className="text-[10px] text-rose-600">SKIPPED</span>
                          ) : (
                            `₹${emiInMonth.toLocaleString('en-IN')}`
                          )}
                        </td>
                        <td className="p-3 text-right text-emerald-700 font-bold">
                          {stlInMonth > 0 ? `₹${stlInMonth.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="p-3 text-right font-black text-rose-700 bg-rose-50 text-sm">
                          ₹{(l.outstanding_balance || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 7: REPORTS & EXPORTER --- */}
      {activeTab === 'REPORTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Master Register Export */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center">
                <FileSpreadsheet size={20} />
              </div>
              <h3 className="text-base font-black font-display text-slate-900">Master Loan Register Report</h3>
              <p className="text-xs text-slate-500">
                Download full list of all sanctioned loan accounts, 1st April opening balances, monthly EMI rates, total repayments, and net outstanding balances.
              </p>
            </div>

            <button
              onClick={() => exportToExcel('MASTER_REGISTER')}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={14} />
              Download Excel Register
            </button>
          </div>

          {/* Card 2: Employee-Wise Summary */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-800 rounded-2xl flex items-center justify-center">
                <UserCheck size={20} />
              </div>
              <h3 className="text-base font-black font-display text-slate-900">Employee-Wise Loan Statement</h3>
              <p className="text-xs text-slate-500">
                Consolidated report grouping staff members with multiple active loans, showing total combined EMI deductions and net exposure.
              </p>
            </div>

            <button
              onClick={() => exportToExcel('EMPLOYEE_SUMMARY')}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={14} />
              Download Employee Summary
            </button>
          </div>

          {/* Card 3: Month-End Position */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-purple-100 text-purple-800 rounded-2xl flex items-center justify-center">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-base font-black font-display text-slate-900">Month-End Loan Position Report</h3>
              <p className="text-xs text-slate-500">
                Financial audit report displaying Opening Balance, New Disbursements, EMI Deductions, Manual Settlements, and Closing Balances.
              </p>
            </div>

            <button
              onClick={() => exportToExcel('MONTH_END_POSITION')}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download size={14} />
              Download Position Report
            </button>
          </div>

        </div>
      )}

      {/* --- MODAL: TOP-UP LOAN ADDITION --- */}
      {showTopupModal && targetLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="text-sm font-black font-display">नया टॉप-अप लोन (Add Top-Up Loan)</h3>
              <button onClick={() => setShowTopupModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTopupLoanSubmit} className="p-5 space-y-4">
              <div className="text-xs text-slate-600 font-sans">
                Staff: <strong className="text-slate-900">{targetLoan.employee_name}</strong> ({targetLoan.loan_number || targetLoan.id})
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">अतिरिक्त लोन राशि (Additional Amount ₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 5000"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">महीना चुनें (Month) *</label>
                <select
                  value={topupMonth}
                  onChange={(e) => setTopupMonth(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 font-bold focus:outline-none"
                >
                  {financialMonths.map(m => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">कारण (Reason)</label>
                <input
                  type="text"
                  value={topupReason}
                  onChange={(e) => setTopupReason(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                टॉप-अप लोन जोड़ें
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: AUDIT TRAIL LOG --- */}
      {showAuditModal && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-8">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <History size={18} className="text-emerald-400" />
                <h3 className="text-sm font-black font-display">ऑडिट ट्रेल (Audit Trail History)</h3>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="text-xs text-slate-500 font-mono border-b pb-2">
                Loan Account: <strong>{selectedLoan.loan_number || selectedLoan.id}</strong> | Staff: <strong>{selectedLoan.employee_name}</strong>
              </div>

              {(!selectedLoan.audit_trail || selectedLoan.audit_trail.length === 0) ? (
                <div className="text-center p-6 text-slate-400 text-xs">कोई परिवर्तन इतिहास उपलब्ध नहीं है।</div>
              ) : (
                <div className="space-y-2">
                  {selectedLoan.audit_trail.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 font-mono text-xs">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{log.date}</span>
                        <span className="font-bold text-indigo-900">{log.action}</span>
                      </div>
                      <div className="text-slate-800 font-sans font-medium">{log.details}</div>
                      <div className="text-[10px] text-slate-500 font-sans">By: {log.performed_by}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: PASSBOOK / STATEMENT PRINT VIEW --- */}
      {showPassbookModal && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-8 space-y-0">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center print:hidden">
              <h3 className="text-sm font-black font-display">Employee Loan Passbook / Statement</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  Print Statement
                </button>
                <button onClick={() => setShowPassbookModal(false)} className="text-slate-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Passbook Body */}
            <div className="p-8 space-y-6">
              <div className="border-b pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black uppercase text-slate-900">SVN / SAKAR GROUP HRMS</h2>
                  <p className="text-xs text-slate-500">Employee Loan Statement Passbook</p>
                </div>
                <div className="text-right text-xs font-mono">
                  <div className="font-bold text-indigo-950">Loan No: {selectedLoan.loan_number || selectedLoan.id}</div>
                  <div className="text-slate-500">Date: {new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans p-4 bg-slate-50 rounded-2xl border">
                <div>
                  <span className="text-slate-400 text-[10px] block">EMPLOYEE NAME</span>
                  <div className="font-bold text-slate-900">{selectedLoan.employee_name} ({selectedLoan.employee_id})</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">LOAN TYPE & SANCTION AMOUNT</span>
                  <div className="font-bold text-slate-900">{selectedLoan.loan_type || 'Loan'} - ₹{(selectedLoan.opening_balance !== undefined ? selectedLoan.opening_balance : selectedLoan.amount).toLocaleString('en-IN')}</div>
                </div>
              </div>

              <table className="w-full text-xs text-left border">
                <thead>
                  <tr className="bg-slate-900 text-white font-mono text-[9px] uppercase">
                    <th className="p-2 border">Month</th>
                    <th className="p-2 text-right border">Opening</th>
                    <th className="p-2 text-right border">EMI Cut</th>
                    <th className="p-2 text-right border">Settlement</th>
                    <th className="p-2 text-right border">Closing</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-mono">
                  {buildFinancialYearLedger(selectedLoan).map(r => (
                    <tr key={r.monthCode}>
                      <td className="p-2 border font-sans">{r.monthLabel}</td>
                      <td className="p-2 text-right border">₹{r.openingBal.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right border font-bold text-amber-800">
                        {r.isSkipped ? 'SKIPPED' : `₹${r.emiDeduction.toLocaleString('en-IN')}`}
                      </td>
                      <td className="p-2 text-right border font-bold text-emerald-800">
                        {r.settlements > 0 ? `₹${r.settlements.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="p-2 text-right border font-black text-rose-800">₹{r.closingBal.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center text-xs text-slate-400 pt-6 border-t font-mono">
                <span>Verified by HR & Accounts Dept</span>
                <span>Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: LOAN POLICY SETTINGS --- */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h3 className="text-sm font-black font-display">लोन नीति नियम (Loan Policy Rules)</h3>
              <button onClick={() => setShowPolicyModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-sans">
              <div className="p-3 bg-slate-50 border rounded-2xl space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">अधिकतम लोन सीमा:</span>
                  <span className="font-mono font-black text-indigo-900">₹{policyMax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">पात्रता मानदंड:</span>
                  <span className="font-semibold text-slate-800">{policyElig}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">ब्याज दर:</span>
                  <span className="font-mono font-bold text-emerald-700">{policyInt}% (Interest-Free)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">पुनर्भुगतान अवधि:</span>
                  <span className="font-semibold text-slate-800">{policyRepay}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed font-sans">
                <strong>नोट:</strong> लोन और एडवांस की राशि कर्मचारियों के मासिक वेतन से ऑटोमैटिक पेरोल प्रोसेसिंग के समय काटी जाती है।
              </div>

              <button
                onClick={() => setShowPolicyModal(false)}
                className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
