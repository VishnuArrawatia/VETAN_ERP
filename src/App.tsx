/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Users, 
  Layers, 
  ShieldCheck, 
  Search, 
  Plus, 
  FileSpreadsheet, 
  Eye, 
  EyeOff,
  Trash2, 
  UserPlus, 
  Settings, 
  Menu,
  ChevronDown,
  Building,
  Calendar,
  Sparkles,
  Award,
  Check,
  X,
  Lock,
  FileText,
  FolderTree,
  Printer,
  Clock,
  LogOut,
  Coins,
  TrendingUp,
  LineChart,
  BookOpen,
  Grid,
  CheckCircle,
  Database,
  RefreshCw,
  XCircle,
  ArrowRightLeft
} from 'lucide-react';

import { 
  Employee, 
  LeaveApplication, 
  FullAndFinalSettlement, 
  Form16Calculation, 
  Attendance, 
  PayrollRun, 
  Payslip,
  Loan,
  CompanyMaster,
  SalaryRevision
} from './types';

// Importing custom components built in the previous steps
import { CompanyMasterView } from './components/CompanyMasterView';
import LeavesController from './components/LeavesController';
import FactoryGatePassView from './components/FactoryGatePassView';
import PayrollRegister from './components/PayrollRegister';
import SqlConsole from './components/SqlConsole';
import FAndFController from './components/FAndFController';
import Form16Portal from './components/Form16Portal';
import FinancialYearAttendance from './components/FinancialYearAttendance';
import AttendanceSheet from './components/AttendanceSheet';
import ExcelImportModal from './components/ExcelImportModal';
import OrganizationStructure from './components/OrganizationStructure';
import LoginPortal from './components/LoginPortal';
import EmployeePortal from './components/EmployeePortal';
import AuditBackupsView from './components/AuditBackupsView';
import HRLettersHub from './components/HRLettersHub';
import DatabaseHealthView from './components/DatabaseHealthView';
import ManagementDashboard from './components/ManagementDashboard';
import { CompanyLogo, getCompanyName } from './components/CompanyLogos';
import Dashboard from './components/Dashboard';
import UserRoleMasterView from './components/UserRoleMasterView';
import UserGuideView from './components/UserGuideView';
import EmployeeLifeCycleReport from './components/EmployeeLifeCycleReport';
import ManagementAnalyticsModule from './components/ManagementAnalyticsModule';
import HODMasterView from './components/HODMasterView';
import ShiftMasterView from './components/ShiftMasterView';
import BusinessLogicVault from './components/BusinessLogicVault';
import SalaryRevisionForm from './components/SalaryRevisionForm';
import FestivalBanner from './components/FestivalBanner';
import { LoanManagementView } from './components/LoanManagementView';
import WorkforceModule from './components/WorkforceModule';
import { fetchJsonWithOfflineFallback, filterEmployeesByCompany } from './lib/offlineStore';

// Define simulated HR Users & Powers
const SIMULATED_HR_USERS = [
  {
    id: 'USR001',
    username: 'vishnu',
    name: 'Vishnu Arrawatia',
    title: 'Company Management',
    role: 'SUPER_HR',
    company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1']
  },
  {
    id: 'USR002',
    username: 'vijay',
    name: 'Mr. V. K. Saraf (MD)',
    title: 'Managing Director',
    role: 'MANAGEMENT',
    company_rights: ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1']
  },
  {
    id: 'USR003',
    username: 'vijendra',
    name: 'Vijendra',
    title: 'HR Officer (SVN Unit I)',
    role: 'COMPANY_HR',
    company_rights: ['SVN-1']
  },
  {
    id: 'USR004',
    username: 'manisha_s',
    name: 'Manisha Sapate',
    title: 'HR Officer (SVN Unit II)',
    role: 'COMPANY_HR',
    company_rights: ['SVN-II']
  },
  {
    id: 'USR005',
    username: 'manisha',
    name: 'Manisha',
    title: 'HR Officer (Sakar Unit I)',
    role: 'COMPANY_HR',
    company_rights: ['Sakar-I']
  },
  {
    id: 'USR006',
    username: 'indraprakash',
    name: 'Indraprakash',
    title: 'HR Officer (Sakar Unit III)',
    role: 'COMPANY_HR',
    company_rights: ['Sakar-III']
  },
  {
    id: 'USR007',
    username: 'nilesh',
    name: 'Nilesh',
    title: 'HR Officer (Flare)',
    role: 'COMPANY_HR',
    company_rights: ['Flare-1']
  },
  {
    id: 'USR008',
    username: 'pinki',
    name: 'Pinki',
    title: 'HR Officer (Zenivo)',
    role: 'COMPANY_HR',
    company_rights: ['Zenivo-1']
  }
];

const getNormalizedUnit = (val: string): string => {
  if (!val) return '';
  const upper = val.toUpperCase().trim();
  if (upper.includes('SVN-I') || upper === 'SVN-1' || upper === 'SVN I' || upper === 'SVN_I' || (upper.includes('SVN') && (upper.includes('I') && !upper.includes('II')))) {
    return 'SVN-I';
  }
  if (upper.includes('SVN-II') || upper === 'SVN-2' || upper === 'SVN II' || upper === 'SVN_II' || (upper.includes('SVN') && upper.includes('II'))) {
    return 'SVN-II';
  }
  if (upper.includes('SAKAR-I') || upper === 'SAKAR-1' || upper === 'SAKAR I' || upper === 'SAKAR_I' || (upper.includes('SAKAR') && (upper.includes('I') && !upper.includes('III')))) {
    return 'Sakar-I';
  }
  if (upper.includes('SAKAR-III') || upper === 'SAKAR-3' || upper === 'SAKAR III' || upper === 'SAKAR_III' || (upper.includes('SAKAR') && upper.includes('III'))) {
    return 'Sakar-III';
  }
  if (upper.includes('ZENIVO')) {
    return 'Zenivo';
  }
  if (upper.includes('FLARE')) {
    return 'Flare';
  }
  return '';
};

const getEmployeeUnit = (emp: any): string => {
  if (!emp) return '';
  const compUnit = getNormalizedUnit(emp.company || '');
  if (compUnit) return compUnit;
  const locUnit = getNormalizedUnit(emp.location || '');
  if (locUnit) return locUnit;
  const ccUnit = getNormalizedUnit(emp.cost_center || '');
  if (ccUnit) return ccUnit;
  return '';
};

export default function App() {
  // Authentication Role simulation state
  const [activeHR, setActiveHR] = useState(() => {
    try {
      const stored = localStorage.getItem('vetan_active_hr');
      return stored ? JSON.parse(stored) : SIMULATED_HR_USERS[0];
    } catch {
      return SIMULATED_HR_USERS[0];
    }
  });
  const [activeCompany, setActiveCompany] = useState<string>(() => {
    return localStorage.getItem('vetan_active_company') || 'SVN-1';
  });
  const [currentSessionMode, setCurrentSessionMode] = useState<'LOGIN' | 'HR' | 'EMPLOYEE'>(() => {
    return (localStorage.getItem('vetan_current_session_mode') as 'LOGIN' | 'HR' | 'EMPLOYEE') || 'LOGIN';
  });
  const [loggedInEmployee, setLoggedInEmployee] = useState<Employee | null>(() => {
    try {
      const stored = localStorage.getItem('vetan_logged_in_employee');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Keep localStorage in sync with authentication states
  useEffect(() => {
    if (activeHR) {
      localStorage.setItem('vetan_active_hr', JSON.stringify(activeHR));
    } else {
      localStorage.removeItem('vetan_active_hr');
    }
  }, [activeHR]);

  useEffect(() => {
    localStorage.setItem('vetan_active_company', activeCompany);
  }, [activeCompany]);

  useEffect(() => {
    localStorage.setItem('vetan_current_session_mode', currentSessionMode);
  }, [currentSessionMode]);

  useEffect(() => {
    if (loggedInEmployee) {
      localStorage.setItem('vetan_logged_in_employee', JSON.stringify(loggedInEmployee));
    } else {
      localStorage.removeItem('vetan_logged_in_employee');
    }
  }, [loggedInEmployee]);
  const [activeMonth, setActiveMonth] = useState('2026-05');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'attendance' | 'payroll' | 'leaves' | 'gatepass' | 'form16' | 'ff' | 'sql' | 'org' | 'companies' | 'audit' | 'letters' | 'users' | 'hods' | 'shifts' | 'revisions' | 'loans' | 'reports' | 'guide' | 'dbhealth' | 'vault' | 'workforce'>('dashboard');
  const [reportsSubTab, setReportsSubTab] = useState<'lifecycle' | 'analytics' | 'legacy'>('lifecycle');
  const [attendanceSubTab, setAttendanceSubTab] = useState<'monthly' | 'yearly' | 'corrections'>('monthly');
  const [correctionsList, setCorrectionsList] = useState<any[]>([]);
  const [loadingCorrections, setLoadingCorrections] = useState(false);

  // Directory Data store
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaveApps, setLeaveApps] = useState<LeaveApplication[]>([]);
  const [ffRecords, setFfRecords] = useState<FullAndFinalSettlement[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [monthlySlips, setMonthlySlips] = useState<Payslip[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanPolicy, setLoanPolicy] = useState<{
    max_amount: number;
    eligibility: string;
    interest_rate: number;
    repayment_options: string;
  }>({
    max_amount: 300000,
    eligibility: "Minimum 1 Year of Continuous Service",
    interest_rate: 0,
    repayment_options: "Standard 5 to 6 Months EMI (Maximum 12 Months if loan > ₹1,50,000)"
  });
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [policyMaxAmount, setPolicyMaxAmount] = useState(100000);
  const [policyEligibility, setPolicyEligibility] = useState('');
  const [policyInterestRate, setPolicyInterestRate] = useState(0);
  const [policyRepaymentOptions, setPolicyRepaymentOptions] = useState('');
  const [allRevisions, setAllRevisions] = useState<SalaryRevision[]>([]);
  const [compoffRequests, setCompoffRequests] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [gatePasses, setGatePasses] = useState<any[]>([]);

  // Selected Employee Profile detailed view
  const [selectedEmployeeProfile, setSelectedEmployeeProfile] = useState<Employee | null>(null);
  const [profileHistorySlips, setProfileHistorySlips] = useState<Payslip[]>([]);
  const [profileLoans, setProfileLoans] = useState<Loan[]>([]);
  const [profileRevisions, setProfileRevisions] = useState<SalaryRevision[]>([]);
  const [profileEditHistory, setProfileEditHistory] = useState<any[]>([]);
  const [activePayslipDetail, setActivePayslipDetail] = useState<Payslip | null>(null);

  // Form states for adding a new loan
  const [newLoanAmount, setNewLoanAmount] = useState<number>(5000);
  const [newLoanDeduction, setNewLoanDeduction] = useState<number>(1000);
  const [newLoanReason, setNewLoanReason] = useState<string>('');
  const [newLoanMonth, setNewLoanMonth] = useState<string>('');

  // Edit states for existing employee profile inside Ledger Modal (Apply Increment/Edit profile)
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editId, setEditId] = useState('');
  const [editBaseSalary, setEditBaseSalary] = useState<number>(0);
  const [editDesignation, setEditDesignation] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editBankAccount, setEditBankAccount] = useState('');
  const [editIfsc, setEditIfsc] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPan, setEditPan] = useState('');
  const [editUan, setEditUan] = useState('');
  const [editQualification, setEditQualification] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editVehicleDetail, setEditVehicleDetail] = useState('');
  const [editPrevCompanyName, setEditPrevCompanyName] = useState('');
  const [editPrevCompanyLocation, setEditPrevCompanyLocation] = useState('');
  const [editTotalExperience, setEditTotalExperience] = useState('');
  const [editShiftTiming, setEditShiftTiming] = useState<string>('8:00 AM to 5:30 PM');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editExitDate, setEditExitDate] = useState('');
  
  // Phase 2 fields for edit profile
  const [editAadhaar, setEditAadhaar] = useState('');
  const [editDOB, setEditDOB] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editMaritalStatus, setEditMaritalStatus] = useState('Single');
  const [editEmergencyContact, setEditEmergencyContact] = useState('');
  const [editBloodGroup, setEditBloodGroup] = useState('O+');
  const [editEsicNumber, setEditEsicNumber] = useState('');
  const [editCostCenter, setEditCostCenter] = useState('');
  const [editReportingManager, setEditReportingManager] = useState('');
  const [editEmployeeCategory, setEditEmployeeCategory] = useState<'Staff' | 'Worker' | 'Contract'>('Staff');
  const [editReportingHod, setEditReportingHod] = useState('');
  const [editReportingHodName, setEditReportingHodName] = useState('');
  const [editIsHod, setEditIsHod] = useState(false);
  const [editCanApproveLeave, setEditCanApproveLeave] = useState(false);
  const [editCanApproveMissPunch, setEditCanApproveMissPunch] = useState(false);
  const [editPhoto, setEditPhoto] = useState('');
  const [editHra, setEditHra] = useState<number>(0);
  const [editDa, setEditDa] = useState<number>(0);
  const [editSpecialAllowance, setEditSpecialAllowance] = useState<number>(0);
  const [editEduAllowance, setEditEduAllowance] = useState<number>(0);
  const [editMedicalAllowance, setEditMedicalAllowance] = useState<number>(0);
  const [editConveyanceAllowance, setEditConveyanceAllowance] = useState<number>(0);
  const [editSalaryStructureType, setEditSalaryStructureType] = useState<'FIXED' | 'PERCENTAGE' | 'MIXED'>('FIXED');
  const [editHiddenHeads, setEditHiddenHeads] = useState<string[]>([]);
  const [editSalaryMode, setEditSalaryMode] = useState<'percent' | 'manual'>('manual');
  const [editPfOptIn, setEditPfOptIn] = useState(false);
  const [editEsicOptIn, setEditEsicOptIn] = useState(false);
  const [editPtOptIn, setEditPtOptIn] = useState(false);

  // Search/Filters directory
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('ALL');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedPfFilter, setSelectedPfFilter] = useState('ALL');
  const [selectedEsicFilter, setSelectedEsicFilter] = useState('ALL');
  const [manualStatus, setManualStatus] = useState<'ACTIVE' | 'RESIGNED' | 'NOTICE' | 'PROBATION' | 'RETIRED'>('ACTIVE');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'RESIGNED' | 'NOTICE' | 'PROBATION' | 'RETIRED'>('ACTIVE');
  const [employeeViewMode, setEmployeeViewMode] = useState<'grid' | 'master'>('master');
  const [activeReportSubTab, setActiveReportSubTab] = useState<'company' | 'dept' | 'unit'>('company');
  const [showManagementReports, setShowManagementReports] = useState(true);

  // Deletion Secure PIN states
  const [deleteTargetEmp, setDeleteTargetEmp] = useState<{ id: string; name: string } | null>(null);
  const [deletePin, setDeletePin] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [forceDelete, setForceDelete] = useState(false);

  // Modal control states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isNewEmpOpen, setIsNewEmpOpen] = useState(false);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [errorBanner, setErrorBanner] = useState('');

  // Form hooks for creating a single employee manually
  const [manualId, setManualId] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualDesignation, setManualDesignation] = useState('');
  const [manualDept, setManualDept] = useState('Engineering');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualBirthYear, setManualBirthYear] = useState<number | ''>(1995);
  const [manualBaseSalary, setManualBaseSalary] = useState(25000);
  const [manualPan, setManualPan] = useState('');
  const [manualUan, setManualUan] = useState('');
  const [manualBankName, setManualBankName] = useState('HDFC Bank');
  const [manualBankAccount, setManualBankAccount] = useState('');
  const [manualIfsc, setManualIfsc] = useState('HDFC0000124');
  const [manualDOJ, setManualDOJ] = useState(() => new Date().toISOString().split('T')[0]);
  const [manualUnit, setManualUnit] = useState<'SVN-1' | 'SVN II' | 'Sakar I' | 'Sakar III'>('SVN-1');
  const [manualQualification, setManualQualification] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualVehicleDetail, setManualVehicleDetail] = useState('');
  const [manualPrevCompanyName, setManualPrevCompanyName] = useState('');
  const [manualPrevCompanyLocation, setManualPrevCompanyLocation] = useState('');
  const [manualTotalExperience, setManualTotalExperience] = useState('');
  const [manualPfOptIn, setManualPfOptIn] = useState(true);
  const [manualEsicOptIn, setManualEsicOptIn] = useState(true);
  const [manualPtOptIn, setManualPtOptIn] = useState(true);
  
  // Salary breakdown inputs
  const [manualSalaryStructureType, setManualSalaryStructureType] = useState<'FIXED' | 'PERCENTAGE' | 'MIXED'>('FIXED');
  const [manualHiddenHeads, setManualHiddenHeads] = useState<string[]>([]);
  const [manualHra, setManualHra] = useState<number | ''>('');
  const [manualDa, setManualDa] = useState<number | ''>('');
  const [manualSpecialAllowance, setManualSpecialAllowance] = useState<number | ''>('');
  const [manualEduAllowance, setManualEduAllowance] = useState<number | ''>('');
  const [manualMedicalAllowance, setManualMedicalAllowance] = useState<number | ''>('');
  const [manualConveyanceAllowance, setManualConveyanceAllowance] = useState<number | ''>('');
  const [manualBonusPayable, setManualBonusPayable] = useState<number | ''>('');
  const [manualSctc, setManualSctc] = useState<number | ''>('');
  const [manualForm, setManualForm] = useState('Form-16');
  const [manualShiftTiming, setManualShiftTiming] = useState<string>('8:00 AM to 5:30 PM');

  // Phase 2 fields for manual create
  const [manualAadhaar, setManualAadhaar] = useState('');
  const [manualDOB, setManualDOB] = useState('');
  const [manualGender, setManualGender] = useState('Male');
  const [manualMaritalStatus, setManualMaritalStatus] = useState('Single');
  const [manualEmergencyContact, setManualEmergencyContact] = useState('');
  const [manualBloodGroup, setManualBloodGroup] = useState('O+');
  const [manualEsicNumber, setManualEsicNumber] = useState('');
  const [manualCostCenter, setManualCostCenter] = useState('');
  const [manualReportingManager, setManualReportingManager] = useState('');
  const [manualEmployeeCategory, setManualEmployeeCategory] = useState<'Staff' | 'Worker' | 'Contract'>('Staff');
  const [manualReportingHod, setManualReportingHod] = useState('');
  const [manualReportingHodName, setManualReportingHodName] = useState('');
  const [manualIsHod, setManualIsHod] = useState(false);
  const [manualCanApproveLeave, setManualCanApproveLeave] = useState(false);
  const [manualCanApproveMissPunch, setManualCanApproveMissPunch] = useState(false);
  const [manualPhoto, setManualPhoto] = useState('');

  // Backup and restore state
  const [backupPromptOpen, setBackupPromptOpen] = useState(false);
  const [backupStats, setBackupStats] = useState<{ employeesCount: number; savedAt: string } | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);

  const isServerDataDummy = (employeesList: any[]) => {
    if (!employeesList || employeesList.length === 0) return true;
    if (employeesList.length !== 7) return false;
    const seedNames = ['Rahul Sharma', 'Priya Patel', 'Amit Mishra', 'Sneha Reddy', 'Vikram Singh', 'Amitabh Shah', 'Kiran Rao'];
    return employeesList.every((e: any) => seedNames.includes(e.name));
  };

  const restoreBackup = async () => {
    setRestoringBackup(true);
    setErrorBanner('');
    try {
      const backupStr = localStorage.getItem('vetan_erp_auto_save_backup');
      if (backupStr) {
        const payload = JSON.parse(backupStr);
        const res = await fetch('/api/restore-json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const statsStr = localStorage.getItem('vetan_erp_auto_save_backup_stats');
          const stats = statsStr ? JSON.parse(statsStr) : null;
          const count = stats?.employeesCount || (payload.employees ? payload.employees.length : 100);
          setSuccessBanner(`🎉 ${count} Employee Records Restored Successfully`);
          setBackupPromptOpen(false);
          // Refresh everything
          fetchEmployees();
          fetchLeaveApps();
          fetchPayrollRuns();
          fetchFAndF();
          fetchLoans();
          fetchRevisions();
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || 'Failed to restore data.';
          setErrorBanner(`❌ Restoration Failed: ${errMsg}`);
        }
      } else {
        setErrorBanner('❌ Error: No backup data found in persistent storage.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorBanner(`❌ Error: ${e.message || e}`);
    } finally {
      setRestoringBackup(false);
    }
  };

  // Background Auto-Save to localStorage
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      try {
        const res = await fetch('/api/backup-json');
        if (res.ok) {
          const data = await res.json();
          if (data && data.employees && Array.isArray(data.employees) && data.employees.length > 0) {
            const isServerDummy = isServerDataDummy(data.employees);

            // Guard against overwriting a real/custom backup with reset default seed data
            const existingBackupStr = localStorage.getItem('vetan_erp_auto_save_backup');
            let shouldSave = true;

            if (existingBackupStr) {
              try {
                const existingBackup = JSON.parse(existingBackupStr);
                const isBackupDummy = isServerDataDummy(existingBackup.employees || []);
                const existingCount = existingBackup.employees ? existingBackup.employees.length : 0;
                
                // If server currently has dummy/seed data, but our local backup is REAL, NEVER overwrite!
                if (isServerDummy && !isBackupDummy) {
                  shouldSave = false;
                  console.log('[Auto-Save] Overwrite prevented: Server is showing dummy data, but your local storage contains a real user database.');
                } else if (data.employees.length < existingCount) {
                  // If incoming count is less than existing backup count, do not overwrite unless existing is dummy and incoming is real
                  if (!isServerDummy && isBackupDummy) {
                    shouldSave = true;
                  } else {
                    shouldSave = false;
                    console.log('[Auto-Save] Overwrite prevented: Server has fewer records than your existing local storage backup.');
                  }
                }
              } catch (e) {
                console.error('[Auto-Save] Error parsing existing backup', e);
              }
            }

            if (shouldSave) {
              localStorage.setItem('vetan_erp_auto_save_backup', JSON.stringify(data));
              localStorage.setItem('vetan_erp_auto_save_backup_stats', JSON.stringify({
                employeesCount: data.employees.length,
                savedAt: new Date().toISOString()
              }));
              const nowStr = new Date().toISOString();
              localStorage.setItem('vetan_last_save_time', nowStr);
              localStorage.setItem('vetan_last_backup_time', nowStr);
              console.log(`[Auto-Save] Successfully saved snapshot with ${data.employees.length} employees`);
            }
          }
        }
      } catch (e) {
        console.error('[Auto-Save] Failed to save database snapshot', e);
      }
    }, 15000); // Sync every 15 seconds

    return () => clearInterval(autoSaveInterval);
  }, []);

  // Check for auto-saved backup on initial load & silent restore
  useEffect(() => {
    const checkBackupOnLoad = async () => {
      try {
        // Wait 1.5 seconds for server data to load first
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Fetch current count
        const res = await fetch('/api/employees');
        if (res.ok) {
          const currentEmps = await res.json();
          const currentCount = currentEmps ? currentEmps.length : 0;
          const isServerDummy = isServerDataDummy(currentEmps);
          
          // Check localStorage
          const statsStr = localStorage.getItem('vetan_erp_auto_save_backup_stats');
          const backupStr = localStorage.getItem('vetan_erp_auto_save_backup');
          
          if (statsStr && backupStr) {
            const stats = JSON.parse(statsStr);
            const backup = JSON.parse(backupStr);
            const isBackupDummy = isServerDataDummy(backup.employees || []);
            
            if (stats && stats.employeesCount > 0) {
              setBackupStats(stats);
              
              // Trigger auto-restore if the server has dummy/seeded data but backup has real data,
              // OR if the backup has more employees than current server state
              const shouldRestoreSilently = (isServerDummy && !isBackupDummy) || (stats.employeesCount > currentCount);
              
              if (shouldRestoreSilently) {
                console.log(`[Auto-Restore] Silent auto-restore triggered: Server is dummy/reset, but local backup contains real data.`);
                
                const restoreRes = await fetch('/api/restore-json', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(backup)
                });
                if (restoreRes.ok) {
                  console.log(`[Auto-Restore] Successfully restored ${stats.employeesCount} employees and records silently.`);
                  localStorage.setItem('vetan_last_restore_time', new Date().toISOString());
                  // Refresh all data
                  fetchEmployees();
                  fetchLeaveApps();
                  fetchPayrollRuns();
                  fetchFAndF();
                  fetchLoans();
                  fetchRevisions();
                  setSuccessBanner('🎉 Database Auto-Restored: All records successfully recovered from persistent storage.');
                  return;
                }
              }
              
              // If silent restore wasn't triggered or failed:
              // Show recovery prompt if the server is in default seed state so the user can restore manually
              if (isServerDummy && !isBackupDummy) {
                setBackupPromptOpen(true);
              }
            }
          }
        }
      } catch (e) {
        console.error('Error checking for auto-saved backup', e);
      }
    };
    
    checkBackupOnLoad();
  }, []);

  // Global fetch hook to inject Operator/Employee security credentials
  useEffect(() => {
    const originalFetch = window.fetch;
    const interceptedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers || {});
      if (activeHR) {
        headers.set('X-Operator-Username', activeHR.username || '');
        headers.set('X-Operator-Role', activeHR.role || '');
      }
      if (loggedInEmployee) {
        headers.set('X-Employee-ID', loggedInEmployee.id || '');
      }
      return originalFetch(input, {
        ...init,
        headers
      });
    };

    try {
      Object.defineProperty(window, 'fetch', {
        value: interceptedFetch,
        configurable: true,
        writable: true
      });
    } catch (e) {
      console.warn('Failed to define window.fetch using Object.defineProperty, trying fallback', e);
      try {
        (window as any).fetch = interceptedFetch;
      } catch (err2) {
        console.error('Critical: Failed to intercept window.fetch', err2);
      }
    }

    return () => {
      try {
        Object.defineProperty(window, 'fetch', {
          value: originalFetch,
          configurable: true,
          writable: true
        });
      } catch (e) {
        try {
          (window as any).fetch = originalFetch;
        } catch (err2) {
          // Ignore
        }
      }
    };
  }, [activeHR, loggedInEmployee]);

  // Trigger loading directory lists
  useEffect(() => {
    // Only fetch if activeCompany is a valid string and not COMBINED/GROUP
    if (activeCompany && activeCompany !== 'COMBINED' && activeCompany !== 'GROUP') {
      fetchEmployees();
      fetchLeaveApps();
      fetchCorrectionsList();
      fetchPayrollRuns();
      fetchFAndF();
      fetchLoans();
      fetchRevisions();
      fetchCompoffRequests();
      fetchGatePasses();
    } else {
      // For COMBINED/GROUP, fetch unfiltered/all allowed data
      fetchEmployees();
      fetchLeaveApps();
      fetchCorrectionsList();
      fetchPayrollRuns();
      fetchFAndF();
      fetchLoans();
      fetchRevisions();
      fetchCompoffRequests();
      fetchGatePasses();
    }
  }, [activeCompany, activeMonth, currentSessionMode, activeHR]);

  const [companies, setCompanies] = useState<CompanyMaster[]>([]);

  const getCompanySettings = (companyId: string) => {
    const DEFAULT_SETTINGS = {
      salary_base_percent: 50,
      salary_hra_percent: 40,
      salary_da_percent: 0,
      salary_special_percent: 15,
      pf_opt_in_default: true,
      pf_employer_rate: 12,
      esic_opt_in_threshold: 21000,
      esic_employer_rate: 3.25,
      bonus_rate_percent: 8.33,
    };

    const c = companies.find(co => co.id === companyId);
    if (c && c.settings) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(c.settings) };
      } catch (e) {
        // ignore
      }
    }
    return DEFAULT_SETTINGS;
  };

  useEffect(() => {
    fetchDepartments();
    fetchCompanies();
  }, [activeHR, loggedInEmployee]);

  const fetchCompanies = async () => {
    try {
      const data = await fetchJsonWithOfflineFallback('/api/companies', (store) => store.companies || []);
      setCompanies(data);
    } catch (e) {
      console.error('Error fetching companies list', e);
    }
  };

  const fetchDepartments = async () => {
    try {
      const data = await fetchJsonWithOfflineFallback('/api/departments', (store) => store.departments || []);
      setDepartments(data);
    } catch (e) {
      console.error('Error fetching departments list', e);
    }
  };

  // Adjust company filter instantly when HR User switches power parameters
  useEffect(() => {
    if (activeHR.role === 'SUPER_HR' || activeHR.role === 'MANAGEMENT') {
      if (activeCompany === 'GROUP' || activeCompany === 'COMBINED') return;
      const allCompanyIds = companies.map(c => c.id);
      if (allCompanyIds.length > 0 && !allCompanyIds.includes(activeCompany)) {
        setActiveCompany('GROUP'); // default to GROUP for Super HR
      }
    } else {
      const rights = activeHR.company_rights || [];
      if (rights.length > 0 && !rights.includes(activeCompany)) {
        setActiveCompany(rights[0]);
      }
    }
    if (activeHR.role === 'ATTENDANCE_ONLY_HR' && activeTab !== 'attendance' && activeTab !== 'dashboard') {
      setActiveTab('attendance');
    }
  }, [activeHR, activeTab, companies, activeCompany]);

  // Automatic syncing useEffects removed to allow manual selections and preserve exact imported values

  const applySalaryTemplate = (templateName: string, isEditMode: boolean) => {
    let base = 15000;
    let hra = 6000;
    let conveyance = 1600;
    let education = 500;
    let medical = 1250;
    let special = 3450;
    let da = 0;

    if (templateName === 'Staff') {
      base = 15000;
      hra = 6000;
      conveyance = 1600;
      education = 500;
      medical = 1250;
      special = 3450;
    } else if (templateName === 'Worker') {
      base = 10000;
      hra = 4000;
      conveyance = 1000;
      education = 200;
      medical = 1000;
      special = 1200;
    } else if (templateName === 'Executive') {
      base = 25000;
      hra = 10000;
      conveyance = 2000;
      education = 800;
      medical = 1500;
      special = 4500;
    } else if (templateName === 'Manager') {
      base = 45000;
      hra = 18000;
      conveyance = 3200;
      education = 1500;
      medical = 2500;
      special = 8500;
    }

    if (isEditMode) {
      setEditSalaryStructureType('FIXED');
      setEditBaseSalary(base);
      setEditHra(hra);
      setEditDa(da);
      setEditSpecialAllowance(special);
      setEditEduAllowance(education);
      setEditMedicalAllowance(medical);
      setEditConveyanceAllowance(conveyance);
      setEditHiddenHeads([]);
    } else {
      setManualSalaryStructureType('FIXED');
      setManualBaseSalary(base);
      setManualHra(hra);
      setManualDa(da);
      setManualSpecialAllowance(special);
      setManualEduAllowance(education);
      setManualMedicalAllowance(medical);
      setManualConveyanceAllowance(conveyance);
      setManualHiddenHeads([]);
    }
  };

  const renderSalaryStructureEditor = (isEdit: boolean) => {
    // Pick correct states
    const structureType = isEdit ? editSalaryStructureType : manualSalaryStructureType;
    const rawSetStructureType = isEdit ? setEditSalaryStructureType : setManualSalaryStructureType;
    const setStructureType = (newType: 'FIXED' | 'PERCENTAGE' | 'MIXED') => {
      rawSetStructureType(newType);
      if (newType === 'PERCENTAGE') {
        const base = Number(baseSalary) || 0;
        const newHra = Math.round(base * 0.40);
        const newDa = 0;
        const newSpecial = Math.round(base * 0.15);
        const newConveyance = Math.round(base * 0.08);
        const newEdu = Math.round(base * 0.02);
        const newMedical = Math.round(base * 0.05);

        if (isEdit) {
          setEditHra(newHra);
          setEditDa(newDa);
          setEditSpecialAllowance(newSpecial);
          setEditConveyanceAllowance(newConveyance);
          setEditEduAllowance(newEdu);
          setEditMedicalAllowance(newMedical);
        } else {
          setManualHra(newHra);
          setManualDa(newDa);
          setManualSpecialAllowance(newSpecial);
          setManualConveyanceAllowance(newConveyance);
          setManualEduAllowance(newEdu);
          setManualMedicalAllowance(newMedical);
        }
      }
    };
    const hiddenHeads = isEdit ? editHiddenHeads : manualHiddenHeads;
    const setHiddenHeads = isEdit ? setEditHiddenHeads : setManualHiddenHeads;

    const baseSalary = isEdit ? editBaseSalary : (manualBaseSalary || 0);
    const rawSetBaseSalary = isEdit ? setEditBaseSalary : setManualBaseSalary;
    const setBaseSalary = (newBase: number) => {
      rawSetBaseSalary(newBase);
      if (structureType === 'PERCENTAGE') {
        const newHra = Math.round(newBase * 0.40);
        const newDa = 0;
        const newSpecial = Math.round(newBase * 0.15);
        const newConveyance = Math.round(newBase * 0.08);
        const newEdu = Math.round(newBase * 0.02);
        const newMedical = Math.round(newBase * 0.05);

        if (isEdit) {
          setEditHra(newHra);
          setEditDa(newDa);
          setEditSpecialAllowance(newSpecial);
          setEditConveyanceAllowance(newConveyance);
          setEditEduAllowance(newEdu);
          setEditMedicalAllowance(newMedical);
        } else {
          setManualHra(newHra);
          setManualDa(newDa);
          setManualSpecialAllowance(newSpecial);
          setManualConveyanceAllowance(newConveyance);
          setManualEduAllowance(newEdu);
          setManualMedicalAllowance(newMedical);
        }
      }
    };

    const hra = isEdit ? editHra : (manualHra || 0);
    const setHra = isEdit ? setEditHra : (val: number) => setManualHra(val === 0 ? '' : val);

    const da = isEdit ? editDa : (manualDa || 0);
    const setDa = isEdit ? setEditDa : (val: number) => setManualDa(val === 0 ? '' : val);

    const special = isEdit ? editSpecialAllowance : (manualSpecialAllowance || 0);
    const setSpecial = isEdit ? setEditSpecialAllowance : (val: number) => setManualSpecialAllowance(val === 0 ? '' : val);

    const edu = isEdit ? editEduAllowance : (manualEduAllowance || 0);
    const setEdu = isEdit ? setEditEduAllowance : (val: number) => setManualEduAllowance(val === 0 ? '' : val);

    const medical = isEdit ? editMedicalAllowance : (manualMedicalAllowance || 0);
    const setMedical = isEdit ? setEditMedicalAllowance : (val: number) => setManualMedicalAllowance(val === 0 ? '' : val);

    const conveyance = isEdit ? editConveyanceAllowance : (manualConveyanceAllowance || 0);
    const setConveyance = isEdit ? setEditConveyanceAllowance : (val: number) => setManualConveyanceAllowance(val === 0 ? '' : val);

    // Toggle a head's visibility
    const toggleHeadVisibility = (headName: string) => {
      if (hiddenHeads.includes(headName)) {
        setHiddenHeads(hiddenHeads.filter(h => h !== headName));
      } else {
        setHiddenHeads([...hiddenHeads, headName]);
        // Set value to 0 when hiding
        if (headName === 'hra') setHra(0);
        else if (headName === 'da') setDa(0);
        else if (headName === 'special_allowance') setSpecial(0);
        else if (headName === 'edu_allowance') setEdu(0);
        else if (headName === 'medical_allowance') setMedical(0);
        else if (headName === 'conveyance_allowance') setConveyance(0);
      }
    };

    // Calculate dynamic values for percentage display
    const companyId = isEdit ? (selectedEmployeeProfile?.company || '') : manualUnit;
    const sets = getCompanySettings(companyId);
    const calculatedHra = Math.round(baseSalary * (sets.salary_hra_percent / 100));
    const calculatedDa = Math.round(baseSalary * (sets.salary_da_percent / 100));
    const calculatedSpecial = Math.round(baseSalary * (sets.salary_special_percent / 100));
    const calculatedConveyance = Math.round(baseSalary * 0.08);
    const calculatedEdu = Math.round(baseSalary * 0.02);
    const calculatedMedical = Math.round(baseSalary * 0.05);

    // Check if a head is hidden
    const isHidden = (headName: string) => hiddenHeads.includes(headName);

    // Helper to render a head row
    const renderHeadRow = (
      id: string,
      label: string,
      sublabel: string,
      value: number,
      setValue: (val: number) => void,
      formulaValue: number,
      defaultPercent: number
    ) => {
      const headHidden = isHidden(id);
      const isLockedPercentage = structureType === 'PERCENTAGE';

      return (
        <div key={id} className={`p-2.5 rounded-lg border transition-all ${
          headHidden 
            ? 'bg-gray-50/50 border-dashed border-gray-200 opacity-60' 
            : 'bg-white border-slate-100 shadow-2xs hover:border-slate-200'
        }`}>
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleHeadVisibility(id)}
                title={headHidden ? "Show Salary Head" : "Hide Salary Head"}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  headHidden ? 'text-gray-400 hover:text-slate-600 bg-gray-150' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {headHidden ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <div>
                <span className={`text-[10px] font-bold block uppercase tracking-wider ${headHidden ? 'text-gray-400 line-through' : 'text-slate-700'}`}>
                  {label}
                </span>
                <span className="text-[9px] text-gray-400 block">{sublabel}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {!headHidden && (isLockedPercentage || structureType === 'MIXED') && (
                <button
                  type="button"
                  onClick={() => setValue(formulaValue)}
                  disabled={isLockedPercentage || headHidden}
                  className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold border transition-all ${
                    value === formulaValue 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-gray-50 text-gray-400 border-gray-150 hover:bg-gray-100 cursor-pointer'
                  }`}
                >
                  {defaultPercent}% Formula (₹{formulaValue})
                </button>
              )}

              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  min={0}
                  disabled={isLockedPercentage || headHidden}
                  value={headHidden ? 0 : value}
                  onChange={(e) => setValue(Number(e.target.value) || 0)}
                  className={`w-28 text-right text-xs p-1.5 pl-5 border rounded-md font-mono font-bold transition-all ${
                    isLockedPercentage 
                      ? 'bg-gray-50 text-gray-500 border-gray-200 font-bold cursor-not-allowed' 
                      : headHidden 
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                        : 'bg-white text-slate-800 border-gray-300 focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
              <Building2 size={14} className="text-emerald-600" />
              Interactive Salary Structure Setup
            </h4>
            <p className="text-[9px] text-gray-400 mt-0.5">Customize salary heads, hide unused rows, or apply predefined templates.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Quick Template Selector */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  applySalaryTemplate(e.target.value, isEdit);
                  e.target.value = ''; // Reset select
                }
              }}
              defaultValue=""
              className="text-[10px] font-bold p-1 border rounded-md bg-white text-slate-700 shadow-2xs cursor-pointer focus:outline-none"
            >
              <option value="" disabled>Apply Template...</option>
              <option value="Staff">Staff Salary Structure (₹15,000 Base)</option>
              <option value="Worker">Worker Salary Structure (₹10,000 Base)</option>
              <option value="Executive">Executive Salary Structure (₹25,000 Base)</option>
              <option value="Manager">Manager Salary Structure (₹45,000 Base)</option>
            </select>
          </div>
        </div>

        {/* Structure Type Select Buttons */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Salary Structure Mode</label>
          <div className="grid grid-cols-3 bg-gray-200/50 p-1 rounded-lg border border-gray-300/30 gap-1 select-none">
            <button
              type="button"
              onClick={() => setStructureType('FIXED')}
              className={`py-1.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                structureType === 'FIXED' ? 'bg-white text-slate-950 shadow-xs border border-gray-200/30' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Fixed Amount
            </button>
            <button
              type="button"
              onClick={() => setStructureType('PERCENTAGE')}
              className={`py-1.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                structureType === 'PERCENTAGE' ? 'bg-white text-slate-950 shadow-xs border border-gray-200/30' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Percentage-Based
            </button>
            <button
              type="button"
              onClick={() => setStructureType('MIXED')}
              className={`py-1.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                structureType === 'MIXED' ? 'bg-white text-slate-950 shadow-xs border border-gray-200/30' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mixed Structure
            </button>
          </div>
        </div>

        {/* Basic Salary (Anchor Head) */}
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-slate-900 uppercase tracking-wider block">Basic Salary *</span>
              <span className="text-[9px] text-gray-400 block">Anchor earner head (always active)</span>
            </div>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₹</span>
              <input
                type="number"
                required
                min={1}
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value) || 0)}
                className="w-36 text-right text-xs p-1.5 pl-5 border rounded-md font-mono font-bold text-slate-900 border-gray-300 bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* List of other allowanced heads */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Salary Components / Allowances</span>
            <span className="text-[8px] text-gray-400">Toggle eye to hide unused heads</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {renderHeadRow('hra', 'House Rent Allowance (HRA)', 'Rent exemption under Section 10(13A)', hra, setHra, calculatedHra, 40)}
            {renderHeadRow('conveyance_allowance', 'Conveyance Allowance', 'Local commuting expenditure coverage', conveyance, setConveyance, calculatedConveyance, 8)}
            {renderHeadRow('edu_allowance', 'Education Allowance', 'Children education statutory benefit', edu, setEdu, calculatedEdu, 2)}
            {renderHeadRow('medical_allowance', 'Medical Allowance', 'Domiciliary medical expenses reimbursement', medical, setMedical, calculatedMedical, 5)}
            {renderHeadRow('special_allowance', 'Special Allowance', 'Flexible balancing supplementary allowance', special, setSpecial, calculatedSpecial, 15)}
          </div>
        </div>

        {/* Real-time structured payroll formula validator */}
        {(() => {
          const pfOptIn = isEdit ? editPfOptIn : manualPfOptIn;
          const esicOptIn = isEdit ? editEsicOptIn : manualEsicOptIn;
          const ptOptIn = isEdit ? editPtOptIn : manualPtOptIn;

          const liveBase = Number(baseSalary) || 0;
          const liveHra = Number(hra) || 0;
          const liveConveyance = Number(conveyance) || 0;
          const liveEdu = Number(edu) || 0;
          const liveMedical = Number(medical) || 0;
          const liveSpecial = Number(special) || 0;

          // Gross Salary = Basic + HRA + Conveyance + Education + Medical + Special
          const liveGross = liveBase + liveHra + liveConveyance + liveEdu + liveMedical + liveSpecial;

          // Employer Contributions
          const liveEmployerPf = pfOptIn ? Math.round(liveBase * (sets.pf_employer_rate / 100)) : 0;
          const liveEmployerEsic = (esicOptIn && liveGross <= sets.esic_opt_in_threshold) ? Math.round(liveGross * (sets.esic_employer_rate / 100)) : 0;
          const liveBonusPayable = Math.round(liveBase * 0.0833);
          const liveCtc = liveGross + liveEmployerPf + liveEmployerEsic + liveBonusPayable;

          // Employee Deductions
          const liveEmployeePf = pfOptIn ? Math.round(liveBase * 0.12) : 0;
          const liveEmployeeEsic = (esicOptIn && liveGross <= sets.esic_opt_in_threshold) ? Math.round(liveGross * 0.0075) : 0;

          let livePt = 0;
          if (ptOptIn) {
            if (liveGross > 15000) livePt = 200;
            else if (liveGross > 10000) livePt = 150;
          }

          const liveAnnualTaxable = (liveGross - liveEmployeePf - livePt) * 12;
          let liveTds = 0;
          if (liveAnnualTaxable > 700000) {
            const excess = liveAnnualTaxable - 700000;
            liveTds = Math.round((excess * 0.10) / 12);
          }

          // Active Loans
          const liveLoanDeduction = isEdit 
            ? (loans || []).filter(l => l.employee_id === selectedEmployeeProfile?.id && l.status === 'ACTIVE').reduce((sum, l) => sum + (l.monthly_deduction || 0), 0)
            : 0;

          const liveTotalDeductions = liveEmployeePf + liveEmployeeEsic + livePt + liveTds + liveLoanDeduction;
          const liveTakeHome = Math.max(0, liveGross - liveTotalDeductions);

          return (
            <div className="mt-4 p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h5 className="text-[10px] font-black tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
                  <FileSpreadsheet size={14} className="text-emerald-400" />
                  Real-time Salary Breakdown & Formula Verification
                </h5>
                <span className="text-[8px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 font-mono">
                  Sakar Electricals Standard
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Gross Salary Bento */}
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-indigo-400 tracking-wider uppercase block">
                      1. Gross Salary (Total Earnings)
                    </span>
                    <span className="text-[8px] text-slate-400 block mb-2 font-medium">
                      Basic + HRA + Conveyance + Edu + Med + Special
                    </span>
                    <div className="space-y-1 text-[10px] font-sans">
                      <div className="flex justify-between text-slate-300">
                        <span>Basic (Base Salary)</span>
                        <span className="font-mono">₹{liveBase.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>HRA</span>
                        <span className="font-mono">+ ₹{liveHra.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Conveyance</span>
                        <span className="font-mono">+ ₹{liveConveyance.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Education Allowance</span>
                        <span className="font-mono">+ ₹{liveEdu.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Medical Allowance</span>
                        <span className="font-mono">+ ₹{liveMedical.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Special Allowance</span>
                        <span className="font-mono">+ ₹{liveSpecial.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between items-center text-emerald-400">
                    <span className="text-[9px] font-bold uppercase">Gross Salary:</span>
                    <strong className="text-xs font-mono font-black">₹{liveGross.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* 2. CTC Bento */}
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-amber-400 tracking-wider uppercase block">
                      2. CTC (Cost to Company)
                    </span>
                    <span className="text-[8px] text-slate-400 block mb-2 font-medium">
                      Gross + Employer PF & ESIC + Bonus
                    </span>
                    <div className="space-y-1 text-[10px] font-sans">
                      <div className="flex justify-between text-slate-300">
                        <span>Gross Salary</span>
                        <span className="font-mono">₹{liveGross.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Employer PF ({sets.pf_employer_rate}%)</span>
                        <span className="font-mono">+ ₹{liveEmployerPf.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Employer ESIC ({sets.esic_employer_rate}%)</span>
                        <span className="font-mono">+ ₹{liveEmployerEsic.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Bonus Payable (8.33%)</span>
                        <span className="font-mono">+ ₹{liveBonusPayable.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between items-center text-amber-400">
                    <span className="text-[9px] font-bold uppercase">Total CTC:</span>
                    <strong className="text-xs font-mono font-black">₹{liveCtc.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* 3. Take Home Bento */}
                <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold text-teal-400 tracking-wider uppercase block">
                      3. Take Home (Net Pay)
                    </span>
                    <span className="text-[8px] text-slate-400 block mb-2 font-medium">
                      Gross - PF - ESIC - TDS - PT - Loans
                    </span>
                    <div className="space-y-1 text-[10px] font-sans">
                      <div className="flex justify-between text-slate-300">
                        <span>Gross Salary</span>
                        <span className="font-mono">₹{liveGross.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Employee PF (12%)</span>
                        <span className="font-mono">- ₹{liveEmployeePf.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Employee ESIC (0.75%)</span>
                        <span className="font-mono">- ₹{liveEmployeeEsic.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Professional Tax (PT)</span>
                        <span className="font-mono">- ₹{livePt.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>TDS (Income Tax)</span>
                        <span className="font-mono">- ₹{liveTds.toLocaleString('en-IN')}</span>
                      </div>
                      {liveLoanDeduction > 0 && (
                        <div className="flex justify-between text-slate-400">
                          <span>Loan Repayments</span>
                          <span className="font-mono">- ₹{liveLoanDeduction.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between items-center text-teal-400">
                    <span className="text-[9px] font-bold uppercase">Take Home:</span>
                    <strong className="text-xs font-mono font-black">₹{liveTakeHome.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const fetchEmployees = async () => {
    try {
      const isMgmt = currentSessionMode === 'HR' && (activeHR?.role === 'MANAGEMENT' || activeHR?.role === 'SUPER_HR');
      const companyParam = isMgmt ? 'ALL' : activeCompany;
      const data = await fetchJsonWithOfflineFallback(`/api/employees?company=${companyParam}`, (store) =>
        filterEmployeesByCompany(store.employees || [], companyParam)
      );
      setEmployees(data);
    } catch (e) {
      console.error('Error fetching employees directory', e);
    }
  };

  const fetchLoanPolicy = async () => {
    try {
      const res = await fetch('/api/loans/policy');
      const data = await res.json();
      if (data) {
        setLoanPolicy(data);
        setPolicyMaxAmount(data.max_amount || 100000);
        setPolicyEligibility(data.eligibility || '');
        setPolicyInterestRate(data.interest_rate || 0);
        setPolicyRepaymentOptions(data.repayment_options || '');
      }
    } catch (e) {
      console.error('Error fetching loan policy', e);
    }
  };

  const fetchLoans = async () => {
    try {
      const data = await fetchJsonWithOfflineFallback('/api/loans', (store) => store.loans || []);
      setLoans(data);
      fetchLoanPolicy();
    } catch (e) {
      console.error('Error fetching loans list', e);
    }
  };

  const fetchRevisions = async () => {
    try {
      const data = await fetchJsonWithOfflineFallback('/api/revisions', (store) => store.salary_revisions || []);
      setAllRevisions(data);
    } catch (e) {
      console.error('Error fetching salary revisions list', e);
    }
  };

  const fetchCompoffRequests = async () => {
    try {
      const isMgmt = currentSessionMode === 'HR' && (activeHR?.role === 'MANAGEMENT' || activeHR?.role === 'SUPER_HR');
      const companyParam = isMgmt ? 'ALL' : activeCompany;
      const data = await fetchJsonWithOfflineFallback(`/api/compoff?company=${companyParam}`, (store) =>
        store.compoff_requests || []
      );
      setCompoffRequests(data);
    } catch (e) {
      console.error('Error fetching compoff requests list', e);
    }
  };

  const fetchGatePasses = async () => {
    try {
      const isMgmt = currentSessionMode === 'HR' && (activeHR?.role === 'MANAGEMENT' || activeHR?.role === 'SUPER_HR');
      const companyParam = isMgmt ? 'ALL' : activeCompany;
      const data = await fetchJsonWithOfflineFallback(`/api/gate-passes?company=${companyParam}`, (store) =>
        store.gate_passes || []
      );
      setGatePasses(data);
    } catch (e) {
      console.error('Error fetching gate passes list', e);
    }
  };

  const fetchEmployeeProfileData = async (employee: Employee) => {
    try {
      setSelectedEmployeeProfile(employee);
      setIsEditingProfile(false); // Reset edit state
      setEditId(employee.id);
      setEditBaseSalary(employee.base_salary);
      setEditDesignation(employee.designation);
      setEditDepartment(employee.department);
      setEditBankName(employee.bank_name || 'HDFC Bank');
      setEditBankAccount(employee.bank_account || '');
      setEditIfsc(employee.ifsc || 'HDFC0000124');
      setEditPhone(employee.phone || '');
      setEditEmail(employee.email || '');
      setEditPan(employee.pan || '');
      setEditUan(employee.uan || '');
      setEditQualification(employee.qualification || '');
      setEditLocation(employee.location || '');
      setEditVehicleDetail(employee.vehicle_detail || '');
      setEditPrevCompanyName(employee.prev_company_name || '');
      setEditPrevCompanyLocation(employee.prev_company_location || '');
      setEditTotalExperience(employee.total_experience || '');
      setEditShiftTiming(employee.shift_timing || '8:00 AM to 5:30 PM');
      setEditJoiningDate(employee.joining_date || '');
      setEditExitDate(employee.exit_date || '');
      setEditAadhaar(employee.aadhaar_number || '');
      setEditDOB(employee.dob || '');
      setEditGender(employee.gender || 'Male');
      setEditMaritalStatus(employee.marital_status || 'Single');
      setEditEmergencyContact(employee.emergency_contact || '');
      setEditBloodGroup(employee.blood_group || 'O+');
      setEditEsicNumber(employee.esic_number || '');
      setEditCostCenter(employee.cost_center || '');
      setEditReportingManager(employee.reporting_manager || '');
      setEditEmployeeCategory(employee.employee_category || 'Staff');
      setEditReportingHod(employee.reporting_hod || '');
      setEditReportingHodName(employee.reporting_hod_name || '');
      setEditIsHod(!!employee.is_hod);
      setEditCanApproveLeave(!!employee.can_approve_leave);
      setEditCanApproveMissPunch(!!employee.can_approve_misspunch);
      setEditPhoto(employee.photo || '');
      setEditHra(employee.hra !== undefined ? employee.hra : Math.round(employee.base_salary * 0.40));
      setEditDa(0);
      setEditSpecialAllowance(employee.special_allowance !== undefined ? employee.special_allowance : Math.round(employee.base_salary * 0.15));
      setEditEduAllowance(employee.edu_allowance !== undefined ? employee.edu_allowance : 0);
      setEditMedicalAllowance(employee.medical_allowance !== undefined ? employee.medical_allowance : 0);
      setEditConveyanceAllowance(employee.conveyance_allowance !== undefined ? employee.conveyance_allowance : 0);
      setEditSalaryStructureType(employee.salary_structure_type || 'PERCENTAGE');
      setEditHiddenHeads(employee.hidden_salary_heads ? employee.hidden_salary_heads.split(',').filter(Boolean) : []);
      setEditSalaryMode('manual');
      setEditPfOptIn(!!employee.pf_opt_in);
      setEditEsicOptIn(!!employee.esic_opt_in);
      setEditPtOptIn(!!employee.professional_tax_opt_in);

      // Fetch historical payslips for this employee
      const resSlips = await fetch(`/api/payslips/employee/${employee.id}`);
      const dataSlips = await resSlips.json();
      // Sort slips descending by month
      dataSlips.sort((a: any, b: any) => b.month.localeCompare(a.month));
      setProfileHistorySlips(dataSlips);

      // Fetch loans for this employee
      const resLoans = await fetch(`/api/loans?employee_id=${employee.id}`);
      const dataLoans = await resLoans.json();
      setProfileLoans(dataLoans);

      // Fetch salary revisions for this employee
      const resRevs = await fetch(`/api/revisions?employee_code=${employee.id}`);
      const dataRevs = await resRevs.json();
      setProfileRevisions(Array.isArray(dataRevs) ? dataRevs : []);

      // Fetch audit logs for profile edit history
      const resAudit = await fetch('/api/audit-logs');
      if (resAudit.ok) {
        const dataAudit = await resAudit.json();
        if (Array.isArray(dataAudit)) {
          const filtered = dataAudit.filter((log: any) => 
            log.action === 'EMPLOYEE_FIELD_EDIT' && 
            log.details && 
            log.details.includes(`Employee:${employee.id} |`)
          ).map((log: any) => {
            const parts = log.details.split(' | ');
            const fieldPart = parts.find((p: string) => p.startsWith('Field:'));
            const oldPart = parts.find((p: string) => p.startsWith('Old:'));
            const newPart = parts.find((p: string) => p.startsWith('New:'));
            
            const field = fieldPart ? fieldPart.split(':')[1] : '';
            const oldVal = oldPart ? oldPart.split(':')[1] : '';
            const newVal = newPart ? newPart.split(':')[1] : '';
            
            return {
              id: log.id,
              field: field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' '),
              oldValue: oldVal,
              newValue: newVal,
              changedBy: log.user_name,
              timestamp: log.timestamp
            };
          });
          setProfileEditHistory(filtered);
        }
      }
    } catch (e) {
      console.error('Error fetching employee profile detailed history', e);
    }
  };

  const fetchLeaveApps = async () => {
    try {
      const isMgmt = currentSessionMode === 'HR' && (activeHR?.role === 'MANAGEMENT' || activeHR?.role === 'SUPER_HR');
      const companyParam = isMgmt ? 'ALL' : activeCompany;
      const data = await fetchJsonWithOfflineFallback(`/api/leaves?company=${companyParam}`, (store) =>
        store.leave_applications || []
      );
      setLeaveApps(data);
    } catch (e) {
      console.error('Error with leave applications fetch', e);
    }
  };

  const fetchCorrectionsList = async () => {
    setLoadingCorrections(true);
    try {
      const isMgmt = currentSessionMode === 'HR' && (activeHR?.role === 'MANAGEMENT' || activeHR?.role === 'SUPER_HR');
      const companyParam = isMgmt ? 'ALL' : activeCompany;
      const data = await fetchJsonWithOfflineFallback(`/api/attendance/corrections?company=${companyParam}`, (store) =>
        store.attendance_corrections || []
      );
      setCorrectionsList(data);
    } catch (e) {
      console.error('Error fetching corrections', e);
    } finally {
      setLoadingCorrections(false);
    }
  };

  const handleUpdateCorrectionStatus = async (id: string, status: 'APPROVE' | 'REJECT'): Promise<boolean> => {
    try {
      const req = correctionsList.find(c => c.id === id);
      
      const body = {
        id,
        actorRole: 'COMPANY_HR',
        action: status,
        actorId: 'HR'
        // No override: HOD step cannot be skipped by HR. PENDING_HOD corrections handled by HOD via Employee ESS.
      };

      const res = await fetch('/api/attendance/corrections/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        fetchCorrectionsList();
        fetchEmployees();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const fetchFAndF = async () => {
    try {
      const isMgmt = currentSessionMode === 'HR' && (activeHR?.role === 'MANAGEMENT' || activeHR?.role === 'SUPER_HR');
      const companyParam = isMgmt ? 'ALL' : activeCompany;
      const data = await fetchJsonWithOfflineFallback(`/api/ff?company=${companyParam}`, (store) =>
        store.ff_settlements || []
      );
      setFfRecords(data);
    } catch (e) {
      console.error('Error fetching F&F settlement registry', e);
    }
  };

  const fetchPayrollRuns = async () => {
    try {
      const runs = await fetchJsonWithOfflineFallback('/api/payroll-runs', (store) => store.payroll_runs || []);
      setPayrollRuns(runs);

      const isMgmt = currentSessionMode === 'HR' && (activeHR?.role === 'MANAGEMENT' || activeHR?.role === 'SUPER_HR');
      const companyParam = isMgmt ? 'ALL' : activeCompany;

      const dataSlips = await fetchJsonWithOfflineFallback(`/api/payslips/month/${activeMonth}?company=${companyParam}`, (store) => {
        const slips = store.payslips || [];
        return slips.filter((s: any) => {
          const monthOk = !activeMonth || s.month === activeMonth || s.payroll_month === activeMonth;
          const companyOk = !companyParam || companyParam === 'ALL' || s.company === companyParam;
          return monthOk && companyOk;
        });
      });
      setMonthlySlips(dataSlips);

      const dataAtt = await fetchJsonWithOfflineFallback(`/api/attendance?month=${activeMonth}&company=${companyParam}`, (store) => {
        const rows = store.attendance || [];
        return rows.filter((a: any) => {
          const monthOk = !activeMonth || a.month === activeMonth;
          const companyOk = !companyParam || companyParam === 'ALL' || a.company === companyParam;
          return monthOk && companyOk;
        });
      });
      setAttendance(dataAtt);
    } catch (e) {
      console.error('Error loading payroll runs list', e);
    }
  };

  // Create single employee manually
  const handleCreateEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId || !manualId.trim()) {
      alert("Employee Code is a mandatory field.");
      return;
    }
    const baseVal = Number(manualBaseSalary);
    const sets = getCompanySettings(manualUnit);
    const hraVal = manualHra !== '' ? Number(manualHra) : Math.round(baseVal * (sets.salary_hra_percent / 100));
    const specialVal = manualSpecialAllowance !== '' ? Number(manualSpecialAllowance) : Math.round(baseVal * (sets.salary_special_percent / 100));
    const daVal = 0;
    const eduVal = manualEduAllowance !== '' ? Number(manualEduAllowance) : 0;
    const medVal = manualMedicalAllowance !== '' ? Number(manualMedicalAllowance) : 0;
    const convVal = manualConveyanceAllowance !== '' ? Number(manualConveyanceAllowance) : 0;
    const bonusVal = Math.round(baseVal * 0.0833);

    const grossVal = baseVal + hraVal + specialVal + daVal + eduVal + medVal + convVal;
    const pfEmployerVal = manualPfOptIn ? Math.round((baseVal + daVal) * (sets.pf_employer_rate / 100)) : 0;
    const esicEmployerVal = (manualEsicOptIn && grossVal <= sets.esic_opt_in_threshold) ? Math.round(grossVal * (sets.esic_employer_rate / 100)) : 0;
    const calculatedCtcVal = grossVal + pfEmployerVal + esicEmployerVal + bonusVal;

    const payload: Partial<Employee> = {
      id: manualId.trim(),
      name: manualName,
      company: manualUnit as any,
      designation: manualDesignation,
      department: manualDept,
      email: manualEmail || `${manualName.toLowerCase().replace(/\s+/g, '')}@sakarelectricals.com`,
      phone: manualPhone || '9876500000',
      birth_year: Number(manualBirthYear) || 1995,
      joining_date: manualDOJ,
      status: 'ACTIVE',
      bank_name: manualBankName,
      bank_account: manualBankAccount || '501004' + Math.floor(Math.random() * 1000000000),
      ifsc: manualIfsc,
      pan: manualPan.toUpperCase() || 'BKPPS' + Math.floor(Math.random() * 10000) + 'F',
      uan: manualUan || '100' + Math.floor(Math.random() * 1000000000),
      base_salary: baseVal,
      hra: hraVal,
      special_allowance: specialVal,
      da: 0,
      edu_allowance: eduVal,
      medical_allowance: medVal,
      conveyance_allowance: convVal,
      bonus_payable: bonusVal,
      ctc_salary: calculatedCtcVal,
      sctc: manualSctc !== '' ? Number(manualSctc) : 0,
      form: manualForm,
      pf_opt_in: manualPfOptIn,
      esic_opt_in: manualEsicOptIn,
      professional_tax_opt_in: manualPtOptIn,
      salary_structure_type: manualSalaryStructureType,
      hidden_salary_heads: manualHiddenHeads.join(','),
      qualification: manualQualification,
      location: manualLocation,
      vehicle_detail: manualVehicleDetail,
      prev_company_name: manualPrevCompanyName,
      prev_company_location: manualPrevCompanyLocation,
      total_experience: manualTotalExperience,
      shift_timing: manualShiftTiming,
      aadhaar_number: manualAadhaar,
      dob: manualDOB,
      gender: manualGender,
      marital_status: manualMaritalStatus,
      emergency_contact: manualEmergencyContact,
      blood_group: manualBloodGroup,
      esic_number: manualEsicNumber,
      cost_center: manualCostCenter,
      reporting_manager: manualReportingManager,
      employee_category: manualEmployeeCategory,
      reporting_hod: manualReportingHod,
      reporting_hod_code: manualReportingHod,
      reporting_hod_name: manualReportingHodName,
      is_hod: manualIsHod,
      can_approve_leave: manualCanApproveLeave,
      can_approve_misspunch: manualCanApproveMissPunch,
      photo: manualPhoto,
      leave_balance_pl: 18,
      leave_balance_cl: 6,
      leave_balance_sl: 6
    };

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Operator-Role': activeHR?.role || 'COMPANY_HR',
          'X-Operator-Name': activeHR?.name || 'Admin'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessBanner('Successfully created and added employee profile!');
        fetchEmployees();
        setIsNewEmpOpen(false);
        // Reset manual form fields
        setManualId('');
        setManualName('');
        setManualDesignation('');
        setManualEmail('');
        setManualPhone('');
        setManualBirthYear(1995);
        setManualBaseSalary(25000);
        setManualAadhaar('');
        setManualDOB('');
        setManualGender('Male');
        setManualMaritalStatus('Single');
        setManualEmergencyContact('');
        setManualBloodGroup('O+');
        setManualEsicNumber('');
        setManualCostCenter('');
        setManualReportingManager('');
        setManualEmployeeCategory('Staff');
        setManualReportingHod('');
        setManualReportingHodName('');
        setManualIsHod(false);
        setManualCanApproveLeave(false);
        setManualCanApproveMissPunch(false);
        setManualPhoto('');
        setManualBankAccount('');
        setManualPan('');
        setManualUan('');
        setManualQualification('');
        setManualLocation('');
        setManualVehicleDetail('');
        setManualPrevCompanyName('');
        setManualPrevCompanyLocation('');
        setManualTotalExperience('');
        setManualHra('');
        setManualDa('');
        setManualSpecialAllowance('');
        setManualEduAllowance('');
        setManualMedicalAllowance('');
        setManualConveyanceAllowance('');
        setManualBonusPayable('');
        setManualSctc('');
        setManualShiftTiming('8:00 AM to 5:30 PM');
        setTimeout(() => setSuccessBanner(''), 3000);
      } else {
        alert(data.error || 'Failed saving employee document.');
      }
    } catch (err: any) {
      alert('Failed saving employee document: ' + err.message);
    }
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    setDeleteTargetEmp({ id, name });
    setDeletePin('');
    setDeleteError('');
    setForceDelete(false);
  };

  const submitDeleteWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTargetEmp) return;
    setDeleteError('');
    try {
      const res = await fetch(`/api/employees/${deleteTargetEmp.id}?force=${forceDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-security-pin': deletePin
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessBanner(data.message || `Processed delete command for ${deleteTargetEmp.name} successfully!`);
        setDeleteTargetEmp(null);
        fetchEmployees();
        fetchPayrollRuns();
        setTimeout(() => setSuccessBanner(''), 3000);
      } else {
        setDeleteError(data.message || data.error || 'Failed to authenticate PIN or execute delete action.');
      }
    } catch (e: any) {
      setDeleteError('Network error executing delete command.');
    }
  };

  const downloadEmployeeMasterCSV = () => {
    const headers = [
      'Code', 'Name', 'Designation', 'Department', 'UNIT', 'Reporting Manager', 'Reporting HOD', 'Reporting HOD Name', 'Date of Joining', 'Date of Leaving',
      'Basic Salary', 'HRA', 'Conveyance All', 'Child All', 'Medical All', 'Special All', 'DA', 'Gross Salary',
      'PF contri by Empr', 'ESIC Contr by EMPR', 'Bonus Payable', 'CTC',
      'PF Deduction', 'ESIC Deduction', 'PT deduction', 'TDS deduction', 'Other deduction', 'Total Deduction', 'Take Home',
      'Phone', 'Birth Year', 'DOB', 'Qualification', 'UAN No.', 'ESIC No.',
      'Bank Name', 'IFSC Code', 'Bank Account no.', 'Location', 'Vehicle Detail',
      'Previous Company Name', 'Previous Company Location', 'Total Experience',
      'PF Applicable', 'ESIC Applicable', 'PT Applicable'
    ];

    const isFormulaMonth = activeMonth >= '2026-08';
    const csvRows = [headers.join(',')];

    filteredEmployeesList.forEach(emp => {
      const hiddenHeads = (emp.hidden_salary_heads || '').split(',').map(h => h.trim());
      const isHidden = (head: string) => hiddenHeads.includes(head);

      const sets = getCompanySettings(emp.company);
      const isLockedPercentage = emp.salary_structure_type === 'PERCENTAGE' || isFormulaMonth;
      const rate_base = emp.base_salary;
      const rate_hra = isHidden('hra') ? 0 : (isLockedPercentage ? Math.round(rate_base * (sets.salary_hra_percent / 100)) : emp.hra);
      const rate_conveyance = isHidden('conveyance_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * 0.08) : (emp.conveyance_allowance || 0));
      const rate_edu = isHidden('edu_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * 0.02) : (emp.edu_allowance || 0));
      const rate_medical = isHidden('medical_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * 0.05) : (emp.medical_allowance || 0));
      const rate_special = isHidden('special_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * (sets.salary_special_percent / 100)) : emp.special_allowance);
      const rate_da = 0; // DA completely removed

      const gross_salary = rate_base + rate_hra + rate_conveyance + rate_edu + rate_medical + rate_special + rate_da;

      const employer_pf = emp.pf_opt_in ? Math.round((rate_base) * (sets.pf_employer_rate / 100)) : 0;
      const employer_esic = (emp.esic_opt_in && gross_salary <= sets.esic_opt_in_threshold) ? Math.round(gross_salary * (sets.esic_employer_rate / 100)) : 0;
      const bonus_payable = Math.round(rate_base * 0.0833);
      const ctc = gross_salary + employer_pf + employer_esic + bonus_payable;

      const pf_deduction = emp.pf_opt_in ? Math.round((rate_base) * 0.12) : 0;
      const esic_deduction = (emp.esic_opt_in && gross_salary <= 21000) ? Math.round(gross_salary * 0.0075) : 0;

      let professional_tax = 0;
      if (emp.professional_tax_opt_in) {
        if (gross_salary > 15000) professional_tax = 200;
        else if (gross_salary > 10000) professional_tax = 150;
      }

      let tds = 0;
      const annual_estimated_taxable = (gross_salary - pf_deduction - professional_tax) * 12;
      if (annual_estimated_taxable > 700000) {
        const excess = annual_estimated_taxable - 700000;
        tds = Math.round((excess * 0.10) / 12);
      }

      const empLoans = (loans || []).filter(l => l.employee_id === emp.id && l.status === 'ACTIVE');
      const loanDeduction = empLoans.reduce((sum, l) => sum + (l.monthly_deduction || 0), 0);

      const total_deduction = pf_deduction + esic_deduction + professional_tax + tds + loanDeduction;
      const take_home = Math.max(0, gross_salary - total_deduction);

      const row = [
        `"${emp.id}"`,
        `"${emp.name.replace(/"/g, '""')}"`,
        `"${(emp.designation || '').replace(/"/g, '""')}"`,
        `"${(emp.department || '').replace(/"/g, '""')}"`,
        `"${(emp.company || '').replace(/"/g, '""')}"`,
        `"${(emp.reporting_manager || '').replace(/"/g, '""')}"`,
        `"${(emp.reporting_hod || '').replace(/"/g, '""')}"`,
        `"${(emp.reporting_hod_name || '').replace(/"/g, '""')}"`,
        `"${emp.joining_date || ''}"`,
        `"${emp.exit_date || ''}"`,
        rate_base,
        rate_hra,
        rate_conveyance,
        rate_edu,
        rate_medical,
        rate_special,
        rate_da,
        gross_salary,
        employer_pf,
        employer_esic,
        bonus_payable,
        ctc,
        pf_deduction,
        esic_deduction,
        professional_tax,
        tds,
        loanDeduction,
        total_deduction,
        take_home,
        `"${emp.phone || ''}"`,
        emp.birth_year || '',
        `"${emp.dob || ''}"`,
        `"${(emp.qualification || '').replace(/"/g, '""')}"`,
        `"${emp.uan || ''}"`,
        `"${emp.esic_number || ''}"`,
        `"${(emp.bank_name || '').replace(/"/g, '""')}"`,
        `"${emp.ifsc || ''}"`,
        `"${emp.bank_account || ''}"`,
        `"${(emp.location || '').replace(/"/g, '""')}"`,
        `"${(emp.vehicle_detail || '').replace(/"/g, '""')}"`,
        `"${(emp.prev_company_name || '').replace(/"/g, '""')}"`,
        `"${(emp.prev_company_location || '').replace(/"/g, '""')}"`,
        `"${emp.total_experience || ''}"`,
        emp.pf_opt_in ? 'YES' : 'NO',
        emp.esic_opt_in ? 'YES' : 'NO',
        emp.professional_tax_opt_in ? 'YES' : 'NO'
      ];
      csvRows.push(row.join(','));
    });

    const csvString = "\uFEFF" + csvRows.join("\r\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Employee_Master_Sheet_${activeCompany}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleToggleStatutoryOptIn = async (employeeId: string, field: 'pf_opt_in' | 'esic_opt_in' | 'professional_tax_opt_in', currentValue: boolean) => {
    try {
      const payload = {
        [field]: !currentValue ? 1 : 0
      };
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessBanner(`Employee statutory setting updated successfully!`);
        fetchEmployees();
        setTimeout(() => setSuccessBanner(''), 3000);
      } else {
        alert(data.error || 'Failed to update statutory setting');
      }
    } catch (e) {
      console.error('Error toggling statutory status', e);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptName.trim()) return;
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: newDeptName.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data.departments);
        setNewDeptName('');
        setIsDeptModalOpen(false);
        setSuccessBanner(`Department "${newDeptName.trim()}" created successfully!`);
        setTimeout(() => setSuccessBanner(''), 3000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create department');
      }
    } catch (e) {
      alert('Failed to connect to server');
    }
  };

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeProfile) return;
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: selectedEmployeeProfile.id,
          employee_name: selectedEmployeeProfile.name,
          amount: Number(newLoanAmount),
          monthly_deduction: Number(newLoanDeduction),
          reason: newLoanReason || 'Personal Loan',
          month: newLoanMonth || activeMonth,
          status: 'ACTIVE'
        })
      });
      if (res.ok) {
        setSuccessBanner('Loan successfully granted and recorded!');
        // Reset form
        setNewLoanAmount(5000);
        setNewLoanDeduction(1000);
        setNewLoanReason('');
        // Reload details
        fetchEmployeeProfileData(selectedEmployeeProfile);
        fetchLoans();
        setTimeout(() => setSuccessBanner(''), 3000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add loan');
      }
    } catch (e) {
      console.error('Error adding loan', e);
    }
  };

  const handleUpdateLoanStatus = async (loanId: string, status: 'ACTIVE' | 'CLOSED') => {
    if (!selectedEmployeeProfile) return;
    try {
      const res = await fetch(`/api/loans/${loanId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setSuccessBanner(`Loan status updated to ${status}!`);
        fetchEmployeeProfileData(selectedEmployeeProfile);
        fetchLoans();
        setTimeout(() => setSuccessBanner(''), 3000);
      }
    } catch (e) {
      console.error('Error updating loan status', e);
    }
  };

  const handleEditEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeProfile) return;
    try {
      const payload: Partial<Employee> = {
        id: editId.trim(),
        base_salary: Number(editBaseSalary),
        designation: editDesignation,
        department: editDepartment,
        joining_date: editJoiningDate,
        exit_date: editExitDate || undefined,
        status: editExitDate ? 'RESIGNED' : 'ACTIVE',
        bank_name: editBankName,
        bank_account: editBankAccount,
        ifsc: editIfsc,
        phone: editPhone,
        email: editEmail,
        pan: editPan.toUpperCase(),
        uan: editUan,
        qualification: editQualification,
        location: editLocation,
        vehicle_detail: editVehicleDetail,
        prev_company_name: editPrevCompanyName,
        prev_company_location: editPrevCompanyLocation,
        total_experience: editTotalExperience,
        shift_timing: editShiftTiming,
        // Proportional Allowance Scale-up on Salary Hike/Increment
        hra: Number(editHra),
        special_allowance: Number(editSpecialAllowance),
        da: 0,
        edu_allowance: Number(editEduAllowance),
        medical_allowance: Number(editMedicalAllowance),
        conveyance_allowance: Number(editConveyanceAllowance),
        salary_structure_type: editSalaryStructureType,
        hidden_salary_heads: editHiddenHeads.join(','),
        pf_opt_in: editPfOptIn,
        esic_opt_in: editEsicOptIn && (Number(editBaseSalary) + Number(editHra) + Number(editSpecialAllowance) + Number(editEduAllowance) + Number(editMedicalAllowance) + Number(editConveyanceAllowance)) <= 21000,
        professional_tax_opt_in: editPtOptIn,
        aadhaar_number: editAadhaar,
        dob: editDOB,
        gender: editGender,
        marital_status: editMaritalStatus,
        emergency_contact: editEmergencyContact,
        blood_group: editBloodGroup,
        esic_number: editEsicNumber,
        cost_center: editCostCenter,
        reporting_manager: editReportingManager,
        employee_category: editEmployeeCategory,
        reporting_hod: editReportingHod,
        reporting_hod_code: editReportingHod,
        reporting_hod_name: editReportingHodName,
        is_hod: editIsHod,
        can_approve_leave: editCanApproveLeave,
        can_approve_misspunch: editCanApproveMissPunch,
        photo: editPhoto
      };

      const res = await fetch(`/api/employees/${selectedEmployeeProfile.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Operator-Role': activeHR?.role || 'COMPANY_HR',
          'X-Operator-Name': activeHR?.name || 'Admin'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessBanner('Employee profile details & salary updated successfully!');
        setIsEditingProfile(false);
        fetchEmployees();
        fetchEmployeeProfileData(data.employee);
        setTimeout(() => setSuccessBanner(''), 3000);
      } else {
        alert(data.error || 'Failed to update employee details');
      }
    } catch (e) {
      console.error('Error updating employee details', e);
      alert('Error updating employee details');
    }
  };

  // Leaves interactions
  const handleAddLeave = async (app: LeaveApplication): Promise<boolean> => {
    try {
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app)
      });
      const data = await res.json();
      if (data.success) {
        fetchLeaveApps();
        fetchEmployees();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleUpdateLeaveStatus = async (id: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> => {
    try {
      const app = leaveApps.find(a => a.id === id);
      // HR workflow: only PENDING_HR leaves are visible to HR. PENDING_HOD leaves are handled by HOD via Employee ESS.
      const isWorkflow = app && app.status === 'PENDING_HR';
      
      const endpoint = isWorkflow ? '/api/leaves/workflow' : '/api/leaves/status';
      const body = isWorkflow ? {
        id,
        actorRole: 'COMPANY_HR',
        action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
        actorId: 'HR'
        // No override: HR only approves PENDING_HR. HOD step cannot be skipped.
      } : { id, status };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        fetchLeaveApps();
        fetchEmployees();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // F&F Calculations triggers
  const handleCalculateFFSub = async (employeeId: string, lastWorkingDay: string): Promise<FullAndFinalSettlement | null> => {
    try {
      const res = await fetch(`/api/ff/calculate?employee_id=${employeeId}&last_working_day=${lastWorkingDay}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const handleCommitFFSub = async (settlement: FullAndFinalSettlement): Promise<boolean> => {
    try {
      const res = await fetch('/api/ff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settlement)
      });
      const data = await res.json();
      if (data.success) {
        fetchFAndF();
        fetchEmployees();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // Form 16 Tax Estimation retrieval
  const handleFetchForm16Sub = async (employeeId: string): Promise<Form16Calculation | null> => {
    try {
      const res = await fetch(`/api/form16/${employeeId}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // Attendance spreadsheet fetch
  const handleFetchAttendanceSub = async (month: string): Promise<Attendance[]> => {
    try {
      const res = await fetch(`/api/attendance?month=${month}&company=${activeCompany}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('[App] Error fetching monthly attendance for sheet:', e);
    }
    return [];
  };

  // Attendance spreadsheet save
  const handleSaveAttendanceSub = async (records: Attendance[]): Promise<boolean> => {
    try {
      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records })
      });
      const data = await res.json();
      if (data.success) {
        fetchPayrollRuns();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  // Calculations triggers parameters of payroll runs
  const handleCalculatePayrollSub = async (month: string, company: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/payroll-runs/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, company })
      });
      const data = await res.json();
      if (data.success) {
        fetchPayrollRuns();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const handleClosePayrollSub = async (month: string, company: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/payroll-runs/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, company })
      });
      const data = await res.json();
      if (data.success) {
        fetchPayrollRuns();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const isCompanyAuthorized = (compName: string) => {
    if (!activeHR) return false;
    if (activeHR.role === 'SUPER_HR' || activeHR.role === 'MANAGEMENT') {
      return true;
    }
    const rights = activeHR.company_rights || [];
    const nameClean = (compName || '').trim().toUpperCase().replace(/[-_ ]/g, '');
    
    const isMatch = (right: string) => {
      const rightClean = right.trim().toUpperCase().replace(/[-_ ]/g, '');
      if (nameClean === rightClean) return true;
      
      const convertRomanToNum = (s: string) => {
        return s
          .replace(/VIII/g, '8')
          .replace(/VII/g, '7')
          .replace(/VI/g, '6')
          .replace(/IV/g, '4')
          .replace(/V/g, '5')
          .replace(/III/g, '3')
          .replace(/II/g, '2')
          .replace(/IX/g, '9')
          .replace(/I/g, '1');
      };
      
      const nameWithNum = convertRomanToNum(nameClean);
      const rightWithNum = convertRomanToNum(rightClean);
      if (nameWithNum === rightWithNum) return true;

      if (nameClean.includes(rightClean) || rightClean.includes(nameClean)) return true;
      
      return false;
    };

    return rights.some(isMatch);
  };

  // Filters Employees directory list
  const filteredEmployeesList = employees.filter(emp => {
    const nameStr = emp.name || '';
    const desStr = emp.designation || '';
    const idStr = emp.id || '';
    const matchesSearch = !searchTerm ? true : (
      nameStr.toLowerCase().includes(searchTerm.toLowerCase()) || 
      desStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idStr.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Department filter matches standard department list or ALL
    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;
    
    // Company Wise filter: All, SAKAR-I, SAKAR-III, SVN-I, SVN-II, FLARE, ZENIVO
    let matchesCompany = true;
    if (selectedCompanyFilter !== 'ALL') {
      const cmpUpper = (emp.company || '').toUpperCase();
      const filterUpper = selectedCompanyFilter.toUpperCase();
      if (filterUpper === 'SAKAR-I') {
        matchesCompany = cmpUpper === 'SAKAR-I' || cmpUpper === 'SAKAR-1' || cmpUpper === 'SAKAR I' || cmpUpper === 'SAKAR_I';
      } else if (filterUpper === 'SAKAR-III') {
        matchesCompany = cmpUpper === 'SAKAR-III' || cmpUpper === 'SAKAR-3' || cmpUpper === 'SAKAR III' || cmpUpper === 'SAKAR_III';
      } else if (filterUpper === 'SVN-I') {
        matchesCompany = cmpUpper === 'SVN-I' || cmpUpper === 'SVN-1' || cmpUpper === 'SVN I' || cmpUpper === 'SVN_I' || cmpUpper === 'SVN-1' || cmpUpper === 'SVN-II';
      } else if (filterUpper === 'SVN-II') {
        matchesCompany = cmpUpper === 'SVN-II' || cmpUpper === 'SVN-2' || cmpUpper === 'SVN II' || cmpUpper === 'SVN_II';
      } else if (filterUpper === 'FLARE') {
        matchesCompany = cmpUpper.includes('FLARE');
      } else if (filterUpper === 'ZENIVO') {
        matchesCompany = cmpUpper.includes('ZENIVO');
      } else {
        matchesCompany = cmpUpper.includes(filterUpper);
      }
    }

    // Unit Wise Filter: All, Unit Selection
    let matchesUnit = true;
    if (selectedUnitFilter !== 'ALL') {
      matchesUnit = getEmployeeUnit(emp) === selectedUnitFilter;
    }

    // Status Wise Filter: Active, Resigned, Notice Period, Probation, Retired
    let matchesStatus = true;
    if (selectedStatusFilter !== 'ALL') {
      const statusUpper = (emp.status || '').toUpperCase();
      const filterUpper = selectedStatusFilter.toUpperCase();
      if (filterUpper === 'ACTIVE') {
        matchesStatus = statusUpper === 'ACTIVE';
      } else if (filterUpper === 'RESIGNED') {
        matchesStatus = statusUpper === 'RESIGNED' || statusUpper === 'SEPARATED';
      } else if (filterUpper === 'NOTICE' || filterUpper === 'NOTICE PERIOD' || filterUpper === 'NOTICE_PERIOD') {
        matchesStatus = statusUpper === 'NOTICE' || statusUpper === 'NOTICE_PERIOD' || statusUpper === 'NOTICE PERIOD';
      } else if (filterUpper === 'PROBATION') {
        matchesStatus = statusUpper === 'PROBATION';
      } else if (filterUpper === 'RETIRED') {
        matchesStatus = statusUpper === 'RETIRED';
      }
    }

    // PF Status Filter: All, PF Covered, PF Non-Covered
    let matchesPf = true;
    if (selectedPfFilter !== 'ALL') {
      matchesPf = selectedPfFilter === 'PF_COVERED' ? emp.pf_opt_in === true : emp.pf_opt_in === false;
    }

    // ESIC Status Filter: All, ESIC Covered, ESIC Non-Covered
    let matchesEsic = true;
    if (selectedEsicFilter !== 'ALL') {
      matchesEsic = selectedEsicFilter === 'ESIC_COVERED' ? emp.esic_opt_in === true : emp.esic_opt_in === false;
    }

    const matchesAuthorized = isCompanyAuthorized(emp.company);

    return matchesSearch && matchesDept && matchesCompany && matchesUnit && matchesStatus && matchesPf && matchesEsic && matchesAuthorized;
  });

  if (currentSessionMode === 'LOGIN') {
    return (
      <LoginPortal 
        onLoginSuccess={(emp) => {
          setLoggedInEmployee(emp);
          setCurrentSessionMode('EMPLOYEE');
        }} 
        onHRAdminSuccess={(hrUser) => {
          setActiveHR(hrUser);
          setCurrentSessionMode('HR');
          if (hrUser.role === 'SUPER_HR' || hrUser.role === 'MANAGEMENT') {
            setActiveCompany('GROUP');
          } else if (hrUser.company_rights && hrUser.company_rights.length > 0) {
            setActiveCompany(hrUser.company_rights[0]);
          }
        }}
      />
    );
  }

  if (currentSessionMode === 'EMPLOYEE' && loggedInEmployee) {
    return (
      <EmployeePortal 
        employee={loggedInEmployee} 
        onLogout={() => {
          localStorage.removeItem('vetan_logged_in_employee');
          localStorage.removeItem('vetan_active_hr');
          localStorage.removeItem('vetan_current_session_mode');
          setLoggedInEmployee(null);
          setCurrentSessionMode('LOGIN');
        }}
      />
    );
  }

  if (currentSessionMode === 'HR' && activeHR.role === 'MANAGEMENT') {
    return (
      <ManagementDashboard 
        employees={employees}
        leaveApps={leaveApps}
        payrollRuns={payrollRuns}
        monthlySlips={monthlySlips}
        attendance={attendance}
        companies={companies}
        departments={departments}
        activeMonth={activeMonth}
        setActiveMonth={setActiveMonth}
        compoffRequests={compoffRequests}
        ffRecords={ffRecords}
        onLogout={() => {
          localStorage.removeItem('vetan_logged_in_employee');
          localStorage.removeItem('vetan_active_hr');
          localStorage.removeItem('vetan_current_session_mode');
          setCurrentSessionMode('LOGIN');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-sky-50/10 via-slate-50/50 to-indigo-50/5 flex flex-col font-sans antialiased text-slate-800">
      <FestivalBanner />
      
      {/* Upper simulated Login controller simulation & headers */}
      <header className="bg-white border-b border-gray-150 py-3.5 px-6 sticky top-0 z-40 select-none">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          {/* Logo brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-r pr-4 border-slate-200">
              {/* Circle Icon with Pink Background */}
              <div className="relative">
                <div className="w-[46px] h-[46px] bg-gradient-to-br from-pink-500 via-pink-400 to-rose-400 rounded-full flex items-center justify-center shadow-lg shadow-pink-400/30 border-3 border-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 21H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M5 21V7L12 3L19 7V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 21V15H15V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M10 9H14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                    <path d="M10 12H14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              {/* Brand Text — VETAN Dark Blue + ERP Orange */}
              <div className="flex flex-col">
                <div className="flex items-baseline leading-none">
                  <span className="text-[24px] font-black tracking-tight text-slate-800 font-display" style={{color: '#1e3a5f'}}>VETAN</span>
                  <span className="text-[12px] font-extrabold tracking-[0.12em] ml-1.5 relative -top-[6px]" style={{color: '#ea580c'}}>ERP</span>
                </div>
                <p className="text-[8px] font-bold tracking-[0.12em] text-pink-500 uppercase leading-none mt-1">Powered by Vishnu Intelligence</p>
                <p className="text-[7px] font-medium text-gray-400 tracking-wider uppercase mt-0.5">Multi-Unit Statutory Suite</p>
              </div>
            </div>
            
            <div className="flex items-center bg-slate-50 border border-slate-100 px-3 py-1 rounded-xl">
              <CompanyLogo company={activeCompany} className="h-7" />
            </div>
          </div>

          {/* Login simulators */}
          <div className="flex flex-wrap items-center gap-3">
            {(activeHR.role === 'SUPER_HR' || activeHR.role === 'MANAGEMENT') ? (
              <>
                <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                  <ShieldCheck size={12} />
                  Simulate HR Login Power:
                </span>

                <div className="flex gap-1.5 flex-wrap">
                  {SIMULATED_HR_USERS.map((usr) => {
                    const isActive = activeHR.id === usr.id;
                    return (
                      <button
                        key={usr.id}
                        onClick={() => {
                          setActiveHR(usr);
                          if (usr.company_rights && usr.company_rights.length === 1) {
                            setActiveCompany(usr.company_rights[0]);
                          } else if (usr.company_rights && usr.company_rights.length > 0) {
                            setActiveCompany(usr.company_rights[0]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer select-none flex items-center gap-1.5 ${isActive ? 'bg-slate-900 text-white shadow-xs' : 'bg-gray-100 hover:bg-gray-200 text-slate-700'}`}
                      >
                        <span>{usr.name}</span>
                        <span className="text-[9px] opacity-75 font-mono">({usr.role === 'SUPER_HR' ? 'Super' : 'Unit'})</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-100 flex items-center gap-1.5">
                  <ShieldCheck size={13} />
                  Logged in as: <strong className="font-extrabold">{activeHR.name}</strong> ({activeHR.title})
                </span>
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('vetan_logged_in_employee');
                localStorage.removeItem('vetan_active_hr');
                localStorage.removeItem('vetan_current_session_mode');
                setLoggedInEmployee(null);
                setCurrentSessionMode('LOGIN');
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 transition cursor-pointer flex items-center gap-1.5 ml-auto md:ml-2"
            >
              <LogOut size={12} />
              Exit Workspace
            </button>
          </div>

        </div>
      </header>

      {/* Main Container Workspace */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Sidebar panels */}
        <aside className="w-full md:w-60 flex flex-col gap-4.5 select-none">
          
          {/* Active simulated credentials badge */}
          <div className="bg-white border rounded-2xl p-4 space-y-3.5 shadow-xs">
            <div className="border-b pb-3">
              <span className="text-[9px] uppercase font-mono font-bold text-gray-400 tracking-wider">Active HR Specialist Profile</span>
              <h4 className="font-bold text-xs text-slate-900 font-display block mt-1">{activeHR.name}</h4>
              <p className="text-[10px] text-gray-400">{activeHR.title} • {activeHR.role}</p>
            </div>

            <div className="space-y-2">
              <span className="text-[8.5px] uppercase font-bold text-gray-400 block tracking-wider">Authorized SVN / Sakar Units:</span>
              <div className="flex flex-wrap gap-1">
                {(activeHR.role === 'SUPER_HR' ? companies.map(c => c.id) : activeHR.company_rights).map(co => (
                  <span key={co} className="px-2 py-0.5 bg-emerald-50 text-[9px] font-bold text-emerald-800 border border-emerald-100 rounded uppercase font-mono">
                    {co}
                  </span>
                ))}
              </div>
            </div>

            {/* Active Company Selector unit */}
            {(activeHR.role === 'SUPER_HR' || activeHR.role === 'MANAGEMENT' || (activeHR.company_rights && activeHR.company_rights.length > 1)) ? (
              <div className="space-y-1 pt-1.5">
                <label className="text-[9.5px] font-bold text-gray-400 uppercase block">Active Workspace Corporate unit</label>
                <select
                  value={activeCompany}
                  onChange={(e) => setActiveCompany(e.target.value)}
                  className="w-full border p-1.5 text-xs rounded-lg font-bold bg-white cursor-pointer select-none text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 animate-pulse border-emerald-300"
                >
                  {(activeHR.role === 'SUPER_HR' || activeHR.role === 'MANAGEMENT') && (
                    <>
                      <option value="GROUP">◇ GROUP DASHBOARD</option>
                      <option value="COMBINED">◇ COMBINED DASHBOARD</option>
                    </>
                  )}
                  {companies
                    .filter(c => activeHR.role === 'SUPER_HR' || activeHR.role === 'MANAGEMENT' || activeHR.company_rights.includes(c.id))
                    .map(c => (
                      <option key={c.id} value={c.id}>◇ UNIT: {c.id}</option>
                    ))
                  }
                </select>
              </div>
            ) : (
              <div className="space-y-1 pt-1.5">
                <label className="text-[9.5px] font-bold text-gray-400 uppercase block">Active Workspace Corporate unit</label>
                <div className="w-full border border-gray-100 p-2 text-xs rounded-lg font-extrabold bg-gray-50 text-slate-700 uppercase font-mono">
                  ◇ UNIT: {activeCompany}
                </div>
              </div>
            )}

            {/* General Active Month control selection */}
            <div className="space-y-1">
              <label className="text-[9.5px] font-bold text-gray-400 uppercase block">Cycle processing Month</label>
              <input 
                type="month"
                value={activeMonth}
                onChange={(e) => setActiveMonth(e.target.value)}
                className="w-full border p-1 bg-white rounded text-xs font-mono text-center font-bold"
              />
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="bg-white border border-slate-200/80 rounded-2xl p-2.5 flex flex-col gap-1 shadow-xs">
            
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-1 pb-1 block">Core HRMS</span>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='dashboard' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>Dashboard Summary</span>
              <Layers size={14} />
            </button>

            <button
              id="sidebar-tab-employees"
              disabled={activeHR.role === 'ATTENDANCE_ONLY_HR'}
              onClick={() => setActiveTab('employees')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between ${activeHR.role === 'ATTENDANCE_ONLY_HR' ? 'opacity-40 cursor-not-allowed text-gray-400' : 'cursor-pointer'} ${activeTab==='employees' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>Employee Master</span>
              {activeHR.role === 'ATTENDANCE_ONLY_HR' ? <Lock size={12} className="text-gray-400" /> : <Users size={14} />}
            </button>

            <button
              id="sidebar-tab-attendance"
              onClick={() => setActiveTab('attendance')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='attendance' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>Attendance Register</span>
              <FileSpreadsheet size={14} />
            </button>

            <button
              id="sidebar-tab-leaves"
              disabled={activeHR.role === 'ATTENDANCE_ONLY_HR'}
              onClick={() => setActiveTab('leaves')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between ${activeHR.role === 'ATTENDANCE_ONLY_HR' ? 'opacity-40 cursor-not-allowed text-gray-400' : 'cursor-pointer'} ${activeTab==='leaves' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>Leave Management</span>
              {activeHR.role === 'ATTENDANCE_ONLY_HR' ? <Lock size={12} className="text-gray-400" /> : <Sparkles size={14} />}
            </button>

            <button
              id="sidebar-tab-gatepass"
              onClick={() => setActiveTab('gatepass')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='gatepass' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>Factory Gate Pass</span>
              <ArrowRightLeft size={14} />
            </button>

            <button
              id="sidebar-tab-workforce"
              onClick={() => setActiveTab('workforce')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='workforce' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>Workforce Module</span>
              <Users size={14} />
            </button>

            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2.5 pb-1 block">Comp & Benefits</span>

            <button
              id="sidebar-tab-payroll"
              disabled={activeHR.role === 'ATTENDANCE_ONLY_HR'}
              onClick={() => setActiveTab('payroll')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between ${activeHR.role === 'ATTENDANCE_ONLY_HR' ? 'opacity-40 cursor-not-allowed text-gray-400' : 'cursor-pointer'} ${activeTab==='payroll' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>Payroll Processor</span>
              {activeHR.role === 'ATTENDANCE_ONLY_HR' ? <Lock size={12} className="text-gray-400" /> : <Building2 size={14} />}
            </button>

            <button
              id="sidebar-tab-revisions"
              disabled={activeHR.role === 'ATTENDANCE_ONLY_HR'}
              onClick={() => setActiveTab('revisions')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between ${activeHR.role === 'ATTENDANCE_ONLY_HR' ? 'opacity-40 cursor-not-allowed text-gray-400' : 'cursor-pointer'} ${activeTab==='revisions' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>Salary Revision</span>
              {activeHR.role === 'ATTENDANCE_ONLY_HR' ? <Lock size={12} className="text-gray-400" /> : <TrendingUp size={14} />}
            </button>

            <button
              id="sidebar-tab-loans"
              disabled={activeHR.role === 'ATTENDANCE_ONLY_HR'}
              onClick={() => setActiveTab('loans')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between ${activeHR.role === 'ATTENDANCE_ONLY_HR' ? 'opacity-40 cursor-not-allowed text-gray-400' : 'cursor-pointer'} ${activeTab==='loans' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>Loan Management</span>
              {activeHR.role === 'ATTENDANCE_ONLY_HR' ? <Lock size={12} className="text-gray-400" /> : <Coins size={14} />}
            </button>

            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-2.5 pb-1 block">Letters & Analytics</span>

            <button
              id="sidebar-tab-reports"
              onClick={() => setActiveTab('reports')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='reports' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>Reports & Analytics</span>
              <LineChart size={14} />
            </button>

            <button
              id="sidebar-tab-letters"
              disabled={activeHR.role === 'ATTENDANCE_ONLY_HR'}
              onClick={() => setActiveTab('letters')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between ${activeHR.role === 'ATTENDANCE_ONLY_HR' ? 'opacity-40 cursor-not-allowed text-gray-400' : 'cursor-pointer'} ${activeTab==='letters' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>HR Letters Hub</span>
              {activeHR.role === 'ATTENDANCE_ONLY_HR' ? <Lock size={12} className="text-gray-400" /> : <FileText size={14} />}
            </button>

            {/* System operations user manual guide */}
            <button
              id="sidebar-tab-guide"
              onClick={() => setActiveTab('guide')}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='guide' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-gray-100 text-slate-700'}`}
            >
              <span>📖 System User Guide</span>
              <BookOpen size={14} />
            </button>

            {/* Collapsible Settings Group */}
            <div className="border-t border-slate-100 pt-2 mt-2">
              <button
                onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold tracking-wide transition flex items-center justify-between cursor-pointer text-slate-700 hover:bg-slate-50`}
              >
                <div className="flex items-center gap-2">
                  <Settings size={14} className="text-slate-500" />
                  <span>Settings & Master</span>
                </div>
                <ChevronDown size={14} className={`transform transition-transform duration-200 ${isSettingsExpanded ? 'rotate-180' : ''}`} />
              </button>

              {isSettingsExpanded && (
                <div className="pl-2 mt-1.5 space-y-1 ml-2 border-l border-slate-200">
                  {/* Company Master */}
                  <button
                    onClick={() => setActiveTab('companies')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='companies' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-gray-100 text-slate-600'}`}
                  >
                    <span>Company Master</span>
                    <Building size={12} />
                  </button>

                  {/* HOD Master */}
                  <button
                    onClick={() => setActiveTab('hods')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='hods' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-gray-100 text-slate-600'}`}
                  >
                    <span>HOD Master</span>
                    <Award size={12} />
                  </button>

                  {/* Shift Master */}
                  <button
                    onClick={() => setActiveTab('shifts')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='shifts' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-gray-100 text-slate-600'}`}
                  >
                    <span>Shift Master</span>
                    <Clock size={12} />
                  </button>

                  {/* Org Structure */}
                  <button
                    onClick={() => setActiveTab('org')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='org' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-gray-100 text-slate-600'}`}
                  >
                    <span>Org Structure</span>
                    <FolderTree size={12} />
                  </button>

                  {/* Resigning F&F */}
                  <button
                    disabled={activeHR.role === 'ATTENDANCE_ONLY_HR'}
                    onClick={() => setActiveTab('ff')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition flex items-center justify-between ${activeHR.role === 'ATTENDANCE_ONLY_HR' ? 'opacity-40 cursor-not-allowed text-gray-400' : 'cursor-pointer'} ${activeTab==='ff' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-gray-100 text-slate-600'}`}
                  >
                    <span>Full & Final Settle</span>
                    {activeHR.role === 'ATTENDANCE_ONLY_HR' ? <Lock size={10} /> : <Settings size={12} />}
                  </button>

                  {/* Database Health & Stability diagnostics */}
                  <button
                    onClick={() => setActiveTab('dbhealth')}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='dbhealth' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-gray-100 text-slate-600'}`}
                  >
                    <span>Database Health</span>
                    <Database size={12} />
                  </button>

                  {/* Super HR Settings */}
                  {activeHR.role === 'SUPER_HR' && (
                    <>
                      {/* User Role Master */}
                      <button
                        onClick={() => setActiveTab('users')}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='users' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-gray-100 text-slate-600'}`}
                      >
                        <span>User Role Master</span>
                        <ShieldCheck size={12} />
                      </button>

                      {/* Compliance & Backups */}
                      <button
                        onClick={() => setActiveTab('audit')}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='audit' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-gray-100 text-slate-600'}`}
                      >
                        <span>Compliance & Backups</span>
                        <ShieldCheck size={12} />
                      </button>

                      {/* SQLite console */}
                      <button
                        onClick={() => setActiveTab('sql')}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='sql' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-gray-100 text-slate-600'}`}
                      >
                        <span>SQLite Console</span>
                        <Menu size={12} />
                      </button>

                      {/* Business Logic Vault */}
                      {activeHR.username === 'vishnu' && (
                        <button
                          onClick={() => setActiveTab('vault')}
                          className={`w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide transition flex items-center justify-between cursor-pointer ${activeTab==='vault' ? 'bg-indigo-50 text-indigo-800 font-bold' : 'hover:bg-gray-100 text-slate-600'}`}
                        >
                          <span className="flex items-center gap-1">🔒 Business Logic Vault</span>
                          <Lock size={12} className="text-indigo-600" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

          </nav>
        </aside>

        {/* Content Body */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {successBanner && (
                <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" />
                  {successBanner}
                </div>
              )}

              {errorBanner && (
                <div className="p-3 mb-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-medium rounded-xl flex items-center gap-2">
                  <XCircle size={14} className="text-rose-500" />
                  {errorBanner}
                </div>
              )}

              {backupPromptOpen && backupStats && (
                <div className="p-4 mb-6 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex gap-3 items-start md:items-center">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                      <Database size={20} className="animate-pulse text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm tracking-tight text-amber-950">⚡ Database Auto-Save Recovery Detect Hua!</h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Humne aapke browser me pichla Session Backup paya jisme <strong>{backupStats.employeesCount} Staff Members</strong> aur unka Attendance data saved hai (Saved on: {new Date(backupStats.savedAt).toLocaleString('en-IN')}).
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 justify-end">
                    <button 
                      onClick={() => setBackupPromptOpen(false)}
                      className="px-3 py-1.5 text-xs text-amber-800 hover:bg-amber-100 rounded-lg font-medium transition cursor-pointer"
                    >
                      Ignore
                    </button>
                    <button 
                      onClick={restoreBackup}
                      disabled={restoringBackup}
                      className="px-4 py-1.5 text-xs bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-bold shadow-sm transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {restoringBackup ? 'Restoring...' : 'Restore All Data Instantly'}
                    </button>
                  </div>
                </div>
              )}

              {/* DASHBOARD TAB WORKSPACE */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Hero banner */}
                  <div className="bg-slate-950 rounded-3xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 dark-banner select-none shadow-lg border border-slate-800">
                    <div className="space-y-2">
                      <span className="text-[10px] bg-emerald-600 text-white font-mono font-bold px-2 py-0.5 rounded w-fit block tracking-wider uppercase">Vetan ERP Edition</span>
                      <h2 className="text-2xl font-bold font-display tracking-tight text-white leading-tight">Welcome back, {activeHR.name}</h2>
                      <p className="text-slate-300 text-xs max-w-md leading-relaxed font-sans">
                        {activeCompany === 'GROUP' 
                          ? "You are currently viewing the Company Management Group Division Overview with full cross-company analytics."
                          : activeCompany === 'COMBINED'
                          ? "You are currently viewing the Combined Dashboard with aggregated corporate parameters."
                          : "You have active unit permissions to process salaries, approve annual leave cards, and print exiting F&F letters."
                        }
                      </p>
                    </div>

                    <div className="p-4 bg-slate-900 border-slate-800 border rounded-2xl space-y-1.5 text-xs min-w-[200px]">
                      <span className="text-slate-400 text-[10px] uppercase block">Selected Dashboard Mode:</span>
                      <p className="text-base font-bold text-gray-50 uppercase tracking-wide">
                        {activeCompany === 'GROUP' ? '◇ GROUP VIEW' : activeCompany === 'COMBINED' ? '◇ COMBINED VIEW' : `◇ UNIT: ${activeCompany}`}
                      </p>
                      <span className="text-slate-400 text-[9px] block">Month cycle: {activeMonth}</span>
                    </div>
                  </div>

                  <Dashboard
                    employees={employees}
                    leaveApps={leaveApps}
                    payrollRuns={payrollRuns}
                    monthlySlips={monthlySlips}
                    attendance={attendance}
                    companies={companies}
                    activeCompany={activeCompany}
                    setActiveCompany={setActiveCompany}
                    activeMonth={activeMonth}
                    onNavigate={setActiveTab}
                    activeHR={activeHR}
                    loans={loans}
                    ffRecords={ffRecords}
                  />

                  {false ? (
                    <div className="space-y-6">
                      {/* Flowchart Diagram Representation */}
                      <div className="flex flex-col items-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-gray-200">
                        <div className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2">
                          <Layers size={14} className="text-emerald-400" />
                          SUPER ADMIN PORTAL (VISHNU)
                        </div>
                        
                        <div className="h-6 w-0.5 bg-gray-300"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                        <div className="h-6 w-0.5 bg-gray-300"></div>

                        {/* Company Nodes Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full max-w-4xl px-6">
                          {[
                            { brand: 'SVN', name: 'SVN Group', color: 'border-emerald-200 text-emerald-800 bg-emerald-50/30', icon: '⚡', unitId: 'SVN-1' },
                            { brand: 'Sakar', name: 'Sakar Group', color: 'border-orange-200 text-orange-800 bg-orange-50/30', icon: '⚙️', unitId: 'Sakar-I' },
                            { brand: 'Flare', name: 'Flare Group', color: 'border-rose-200 text-rose-800 bg-rose-50/30', icon: '🔥', unitId: 'Flare-1' },
                            { brand: 'Zenivo', name: 'Zenivo Group', color: 'border-blue-200 text-blue-800 bg-blue-50/30', icon: '🌐', unitId: 'Zenivo-1' }
                          ].map((node, i, arr) => (
                            <div key={node.brand} className="flex flex-col items-center">
                              <div className={`p-4 border rounded-xl ${node.color} w-full text-center shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer`}
                                onClick={() => setActiveCompany(node.unitId)}
                              >
                                <span className="text-lg block mb-1">{node.icon}</span>
                                <h4 className="font-extrabold text-xs">{node.brand} Division</h4>
                                <span className="text-[10px] font-medium text-slate-500 block mt-1">Click to inspect →</span>
                              </div>
                              {i < arr.length - 1 && (
                                <div className="md:hidden flex flex-col items-center my-2">
                                  <div className="h-4 w-0.5 bg-gray-300"></div>
                                  <div className="text-gray-400 text-xs">↓</div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Division breakdown list */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                          { brand: 'SVN', name: 'SVN Division', desc: 'SVN-1 & SVN-II manufacturing units', units: ['SVN-1', 'SVN-II'], theme: 'emerald' },
                          { brand: 'Sakar', name: 'Sakar Electricals Division', desc: 'Sakar-I & Sakar-III electronics plants', units: ['Sakar-I', 'Sakar-III'], theme: 'orange' },
                          { brand: 'Flare', name: 'Flare Luminaires Division', desc: 'Savli Unit I specialized systems', units: ['Flare-1'], theme: 'rose' },
                          { brand: 'Zenivo', name: 'Zenivo Opto Electronics Division', desc: 'Kadlya Unit I digital tech', units: ['Zenivo-1'], theme: 'blue' },
                        ].map(group => {
                          const groupEmps = employees.filter(e => group.units.includes(e.company));
                          const groupRuns = payrollRuns.filter(r => group.units.includes(r.company));
                          const groupLeaves = leaveApps.filter(l => group.units.includes(l.company));
                          const groupFF = ffRecords.filter(f => {
                            const emp = employees.find(e => e.id === f.employee_id);
                            return emp && group.units.includes(emp.company);
                          });

                          return (
                            <div key={group.brand} className="bg-white border rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md hover:border-slate-300 transition-all">
                              <div className="flex justify-between items-start border-b pb-3">
                                <div>
                                  <h3 className="font-extrabold text-xs text-slate-900 uppercase font-mono">{group.name}</h3>
                                  <p className="text-[11px] text-gray-400 mt-0.5">{group.desc}</p>
                                </div>
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200 text-[9px] font-mono font-bold rounded uppercase">
                                  {group.brand} Division
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="text-[9px] text-gray-400 uppercase font-bold block">Personnel</span>
                                  <p className="text-sm font-extrabold text-slate-800 mt-1">{groupEmps.length} Staff</p>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="text-[9px] text-gray-400 uppercase font-bold block">Pending Leaves</span>
                                  <p className="text-sm font-extrabold text-slate-800 mt-1">{groupLeaves.length} Applied</p>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="text-[9px] text-gray-400 uppercase font-bold block">F&F Exits</span>
                                  <p className="text-sm font-extrabold text-slate-800 mt-1">{groupFF.length} Settled</p>
                                </div>
                                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="text-[9px] text-gray-400 uppercase font-bold block">Salary Cycles</span>
                                  <p className="text-sm font-extrabold text-slate-800 mt-1">{groupRuns.length} Processed</p>
                                </div>
                              </div>

                              <div className="rounded-xl overflow-hidden border border-slate-150 h-28 relative">
                                {group.brand === 'SVN' && (
                                  <div className="grid grid-cols-2 h-full gap-0.5">
                                    <img 
                                      src="/src/assets/images/svn_i_factory_1784275461192.jpg" 
                                      alt="SVN I Factory" 
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                                    />
                                    <img 
                                      src="/src/assets/images/svn_ii_factory_1784278017538.jpg" 
                                      alt="SVN II Factory" 
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                                    />
                                  </div>
                                )}
                                {group.brand === 'Sakar' && (
                                  <div className="grid grid-cols-2 h-full gap-0.5">
                                    <img 
                                      src="/src/assets/images/sakar_i_factory_1784275477727.jpg" 
                                      alt="Sakar I Factory" 
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                                    />
                                    <img 
                                      src="/src/assets/images/sakar_iii_factory_1784275525132.jpg" 
                                      alt="Sakar III Factory" 
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                                    />
                                  </div>
                                )}
                                {group.brand === 'Flare' && (
                                  <img 
                                    src="/src/assets/images/flare_factory_1784275493334.jpg" 
                                    alt="Flare Factory" 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                                  />
                                )}
                                {group.brand === 'Zenivo' && (
                                  <img 
                                    src="/src/assets/images/zenivo_factory_1784275508025.jpg" 
                                    alt="Zenivo Factory" 
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover transition-all duration-300 hover:scale-105"
                                  />
                                )}
                                <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-slate-900/60 backdrop-blur-xs rounded text-[9px] font-bold text-white uppercase tracking-wider">
                                  {group.brand} Production Facility
                                </div>
                              </div>

                              <div className="pt-1 flex flex-col gap-2">
                                <span className="text-[9px] uppercase font-bold text-gray-400 block tracking-wider">Inspect individual units:</span>
                                <div className="flex gap-2">
                                  {group.units.map(u => (
                                    <button 
                                      key={u}
                                      onClick={() => setActiveCompany(u)}
                                      className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border font-bold text-[10px] py-1.5 px-2 rounded-lg transition-all shadow-2xs cursor-pointer"
                                    >
                                      Inspect {u} →
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Operational indicators stats */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between shadow-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Active Employees Directory</span>
                            <p className="text-2xl font-extrabold text-gray-900 font-display mt-2">{employees.length} Personnel</p>
                            <span className="text-[10px] text-emerald-600 block mt-1">✓ Logged active accounts</span>
                          </div>
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Users size={22} className="text-emerald-600" /></div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between shadow-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Leave apps filed</span>
                            <p className="text-2xl font-extrabold text-slate-800 font-display mt-2">{leaveApps.length} Leaves</p>
                            <span className="text-[10px] text-orange-600 block mt-1">✓ Real-time ledger update</span>
                          </div>
                          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Sparkles size={22} className="text-amber-600" /></div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between shadow-xs">
                          <div>
                            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">Settled Exits</span>
                            <p className="text-2xl font-extrabold text-slate-805 font-display mt-2">{ffRecords.length} Separated</p>
                            <span className="text-[10px] text-rose-600 block mt-1">✓ F&F balance sheets closed</span>
                          </div>
                          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><Layers size={22} className="text-rose-500" /></div>
                        </div>
                      </div>

                      {/* Informational instructions cards workflow */}
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 uppercase font-display border-b pb-2">Quick Start Operation workflow</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-600 pt-2 leading-relaxed">
                          
                          <div className="space-y-1.5 build-card">
                            <span className="font-mono text-emerald-600 text-sm font-bold">01.</span>
                            <h4 className="font-bold text-slate-800">Review Directory list</h4>
                            <p className="font-sans">Enter or copy-paste rows from Excel using our bulk import spreadsheet utility under the "Staff directory" tab.</p>
                          </div>

                          <div className="space-y-1.5 build-card">
                            <span className="font-mono text-emerald-650 text-emerald-600 text-sm font-bold">02.</span>
                            <h4 className="font-bold text-slate-800">Complete Master FY Grid</h4>
                            <p className="font-sans">Check monthly presence days and LOP leave cuts under the "FY Attendance register" grid.</p>
                          </div>

                          <div className="space-y-1.5 build-card">
                            <span className="font-mono text-emerald-600 text-sm font-bold">03.</span>
                            <h4 className="font-bold text-slate-800">Process Draft Salary</h4>
                            <p className="font-sans">Compute monthly salary drafts, click EPF ECR downloads, and print out payslips for employees.</p>
                          </div>

                          <div className="space-y-1.5 build-card">
                            <span className="font-mono text-emerald-700 text-sm font-bold">04.</span>
                            <h4 className="font-bold text-slate-850">Direct SQL auditing</h4>
                            <p className="font-sans">Run SELECT query scans against active tables directly to confirm math compliance checks instantly.</p>
                          </div>

                        </div>
                      </div>
                    </>
                  )}

                </div>
              )}

              {/* SALARY REVISION TAB WORKSPACE */}
              {activeTab === 'revisions' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                      <div>
                        <h3 className="font-extrabold text-slate-950 text-sm uppercase tracking-wide">
                          Employee Salary Revision & Appraisal Register
                        </h3>
                        <p className="text-[10px] text-slate-400">Log base CTC salary adjustments, performance increments, and dynamic allowances histories.</p>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold font-mono text-[10px] rounded-full uppercase">
                        Active Unit: {activeCompany}
                      </span>
                    </div>

                    {/* New Salary Revision Form */}
                    <SalaryRevisionForm
                      employees={employees}
                      activeCompany={activeCompany}
                      activeHRName={activeHR ? activeHR.name : 'Group HR Director'}
                      onSuccess={() => {
                        fetchEmployees();
                        fetchRevisions();
                      }}
                    />

                    {/* Salary Revision Table List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Historical Increments Audit Ledger</h4>
                      <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                        <table className="w-full text-xs text-left text-slate-600">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              <th className="p-3">Staff Member</th>
                              <th className="p-3">Effective Date</th>
                              <th className="p-3">Old Salary</th>
                              <th className="p-3">New Salary</th>
                              <th className="p-3">Increment Hike</th>
                              <th className="p-3">Reason</th>
                              <th className="p-3">Approved By</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {allRevisions.filter(rev => {
                              const emp = employees.find(e => e.id === rev.employee_code);
                              return !emp || activeCompany === 'GROUP' || emp.company === activeCompany;
                            }).length === 0 ? (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-400">
                                  No previous revisions recorded. Use the form above to record first salary increment!
                                </td>
                              </tr>
                            ) : (
                              allRevisions
                                .filter(rev => {
                                  const emp = employees.find(e => e.id === rev.employee_code);
                                  return !emp || activeCompany === 'GROUP' || emp.company === activeCompany;
                                })
                                .map((rev, index) => {
                                  const emp = employees.find(e => e.id === rev.employee_code);
                                  const diff = rev.new_salary - rev.old_salary;
                                  const pct = rev.old_salary > 0 ? Math.round((diff / rev.old_salary) * 100) : 0;
                                  return (
                                    <tr key={index} className="hover:bg-slate-50/50 transition">
                                      <td className="p-3">
                                        <strong className="text-slate-950 font-bold block">{emp ? emp.name : 'Unknown Employee'}</strong>
                                        <span className="text-[10px] text-slate-400 font-mono">{rev.employee_code}</span>
                                      </td>
                                      <td className="p-3 font-mono font-bold text-slate-700">{rev.effective_date}</td>
                                      <td className="p-3 font-mono">₹{rev.old_salary.toLocaleString('en-IN')}</td>
                                      <td className="p-3 font-mono font-bold text-slate-900">₹{rev.new_salary.toLocaleString('en-IN')}</td>
                                      <td className="p-3">
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-mono font-black text-[10px]">
                                          +{pct}% (₹{diff.toLocaleString('en-IN')})
                                        </span>
                                      </td>
                                      <td className="p-3 text-slate-500 italic max-w-xs truncate">{rev.reason}</td>
                                      <td className="p-3 font-medium text-slate-700">{rev.approved_by || 'HR Admin'}</td>
                                    </tr>
                                  );
                                })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* LOAN MANAGEMENT TAB WORKSPACE */}
              {activeTab === 'loans' && (
                <LoanManagementView
                  loans={loans}
                  employees={employees}
                  activeCompany={activeCompany}
                  loanPolicy={loanPolicy}
                  onRefresh={() => {
                    fetchEmployees();
                    fetchLoans();
                  }}
                  activeHRRole={activeHR.role}
                />
              )}

              {/* REPORTS & ANALYTICS TAB WORKSPACE */}
              {activeTab === 'reports' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Sub-navigation bar inside reports */}
                  <div className="flex border-b border-slate-200 pb-3 gap-6 no-print">
                    <button
                      onClick={() => setReportsSubTab('lifecycle')}
                      className={`text-xs font-black uppercase tracking-wider pb-1.5 border-b-2 transition cursor-pointer ${reportsSubTab === 'lifecycle' ? 'border-emerald-600 text-slate-950 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Employee Life Cycle Dossier
                    </button>
                    <button
                      onClick={() => setReportsSubTab('analytics')}
                      className={`text-xs font-black uppercase tracking-wider pb-1.5 border-b-2 transition cursor-pointer ${reportsSubTab === 'analytics' ? 'border-emerald-600 text-slate-950 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      Management Analytics & Increment Register
                    </button>
                    <button
                      onClick={() => setReportsSubTab('legacy')}
                      className={`text-xs font-black uppercase tracking-wider pb-1.5 border-b-2 transition cursor-pointer ${reportsSubTab === 'legacy' ? 'border-emerald-600 text-slate-950 font-extrabold' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                      EPF ECR & Master Exports
                    </button>
                  </div>

                  {/* Render based on sub-tab */}
                  {reportsSubTab === 'lifecycle' && (
                    <EmployeeLifeCycleReport 
                      employees={employees}
                      allRevisions={allRevisions}
                      allLoans={loans}
                      allLeaveApps={leaveApps}
                      allFfRecords={ffRecords}
                      allAttendance={attendance}
                    />
                  )}

                  {reportsSubTab === 'analytics' && (
                    <ManagementAnalyticsModule 
                      employees={employees}
                      monthlySlips={monthlySlips}
                      payrollRuns={payrollRuns}
                      allRevisions={allRevisions}
                      companies={companies}
                      departments={departments}
                      activeMonth={activeMonth}
                      onRefreshData={() => {
                        fetchRevisions();
                        fetchEmployees();
                      }}
                    />
                  )}

                  {reportsSubTab === 'legacy' && (
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b pb-4">
                        <div>
                          <h3 className="font-extrabold text-slate-950 text-sm uppercase tracking-wide">
                            Corporate Reports & Analytics Center
                          </h3>
                          <p className="text-[10px] text-slate-400">Generate on-the-fly CSV datasets, download tax compliance records, and visualize division-wise headcount distributions.</p>
                        </div>
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 font-bold font-mono text-[10px] rounded-full uppercase">
                          Active Unit: {activeCompany}
                        </span>
                      </div>

                      {/* Report Generators Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* CSV Headcount Directory */}
                        <div className="p-5 border border-slate-200 rounded-2xl space-y-3 hover:shadow-md transition">
                          <div className="p-2.5 bg-indigo-50 text-indigo-700 w-fit rounded-xl">
                            <Users size={18} />
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase">Headcount Master Register</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">Download complete active staff listings with bank channels, PAN IDs, and basic salaries.</p>
                          <button onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8," 
                              + ["Employee ID,Name,Company,Designation,Department,Base Salary,Status"].join(",") + "\n"
                              + employees.map(e => `"${e.id}","${e.name}","${e.company}","${e.designation}","${e.department}",${e.base_salary},"${e.status}"`).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `VETAN_Headcount_Master_${activeCompany}.csv`);
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase rounded-xl transition cursor-pointer">
                            Generate CSV Dataset
                          </button>
                        </div>

                        {/* EPF ECR Compliance Template */}
                        <div className="p-5 border border-slate-200 rounded-2xl space-y-3 hover:shadow-md transition">
                          <div className="p-2.5 bg-yellow-50 text-yellow-700 w-fit rounded-xl">
                            <FileSpreadsheet size={18} />
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase">EPF ECR Text Draft</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">Format monthly PF wages, pension contributions, and administrative dues into the ECR format.</p>
                          <button onClick={() => {
                            const ecrRows = employees.map(e => {
                              const uan = e.uan || "100000000000";
                              const wage = Math.min(e.base_salary, 15000);
                              const eePF = Math.round(wage * 0.12);
                              const erEPS = Math.round(wage * 0.0833);
                              const erEPF = Math.max(0, eePF - erEPS);
                              return `${uan}#${e.name}#${e.base_salary}#${wage}#${wage}#${wage}#${eePF}#${erEPS}#${erEPF}#0#0`;
                            }).join("\n");
                            const blob = new Blob([ecrRows], { type: 'text/plain' });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.download = `EPF_ECR_${activeMonth}_${activeCompany}.txt`;
                            link.click();
                          }} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase rounded-xl transition cursor-pointer">
                            Download EPF ECR Text
                          </button>
                        </div>

                        {/* SQLite DB backup */}
                        <div className="p-5 border border-slate-200 rounded-2xl space-y-3 hover:shadow-md transition">
                          <div className="p-2.5 bg-orange-50 text-orange-700 w-fit rounded-xl">
                            <Settings size={18} />
                          </div>
                          <h4 className="font-extrabold text-xs text-slate-900 uppercase">Database Integrity Backup</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed">Save a system checkpoint file containing all live tables and employee audit histories.</p>
                          <button onClick={() => setActiveTab('audit')} className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] uppercase rounded-xl transition cursor-pointer">
                            Open Backup Center
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Headcount Distribution Custom Visual Chart (SVG) */}
                      <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/50">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Departmental Headcount Distribution (Interactive SVG)</h4>
                        
                        {(() => {
                          const deptCounts: { [key: string]: number } = {};
                          employees
                            .filter(e => activeCompany === 'GROUP' || e.company === activeCompany)
                            .forEach(e => {
                              deptCounts[e.department] = (deptCounts[e.department] || 0) + 1;
                            });

                          const depts = Object.keys(deptCounts);
                          const maxCount = Math.max(...Object.values(deptCounts), 1);

                          return (
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                {/* Left side: Bar chart */}
                                <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-4">
                                  {depts.map((dept, i) => {
                                    const count = deptCounts[dept];
                                    const pct = Math.round((count / maxCount) * 100);
                                    return (
                                      <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold text-slate-700 uppercase">
                                          <span>{dept}</span>
                                          <span className="font-mono">{count} Personnel ({Math.round((count / employees.length) * 100)}%)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                          <div 
                                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Right side: Summary telemetry */}
                                <div className="space-y-3">
                                  <div className="p-4 bg-white rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                                    <div>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Average CTC Salary</span>
                                      <strong className="text-xl font-black text-slate-900 mt-1 block">
                                        ₹{Math.round(
                                          employees
                                            .filter(e => activeCompany === 'GROUP' || e.company === activeCompany)
                                            .reduce((acc, curr) => acc + curr.base_salary, 0) / Math.max(1, employees.filter(e => activeCompany === 'GROUP' || e.company === activeCompany).length)
                                        ).toLocaleString('en-IN')}/mo
                                      </strong>
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Monthly Budget</span>
                                      <strong className="text-xl font-black text-slate-900 mt-1 block">
                                        ₹{employees
                                          .filter(e => activeCompany === 'GROUP' || e.company === activeCompany)
                                          .reduce((acc, curr) => acc + curr.base_salary, 0)
                                          .toLocaleString('en-IN')}
                                      </strong>
                                    </div>
                                  </div>
                                  
                                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl text-center text-xs text-indigo-950 font-medium">
                                    📊 Headcount & CTC parameters successfully calibrated to match SQLite records.
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* STAFF DIRECTORY TAB WORKSPACE */}
              {activeTab === 'employees' && (
                <div className="space-y-6">
                  
                  {(() => {
                    // 1. Calculations for Dynamic Summary Cards
                    const totalEmp = filteredEmployeesList.length;
                    
                    // Company wise unique count in filtered list
                    const uniqueCompaniesCount = new Set(filteredEmployeesList.map(e => e.company).filter(Boolean)).size;
                    
                    // Department wise unique count in filtered list
                    const uniqueDeptsCount = new Set(filteredEmployeesList.map(e => e.department).filter(Boolean)).size;
                    
                    // PF & Non-PF covered
                    const pfCoveredCount = filteredEmployeesList.filter(e => e.pf_opt_in === true).length;
                    const pfNonCoveredCount = filteredEmployeesList.filter(e => !e.pf_opt_in).length;
                    
                    // ESIC covered
                    const esicCoveredCount = filteredEmployeesList.filter(e => e.esic_opt_in === true).length;
                    
                    // Probation status
                    const probationCount = filteredEmployeesList.filter(e => (e.status || '').toUpperCase() === 'PROBATION').length;
                    
                    // Notice period status
                    const noticeCount = filteredEmployeesList.filter(e => ['NOTICE', 'NOTICE PERIOD', 'NOTICE_PERIOD'].includes((e.status || '').toUpperCase())).length;

                    // 2. Calculations for Management Reports
                    // Company Wise Stats
                    const compStats: Record<string, {
                      total: number;
                      male: number;
                      female: number;
                      pf: number;
                      esic: number;
                      totalSalary: number;
                      avgSalary: number;
                    }> = {};

                    employees.forEach(emp => {
                      const comp = emp.company || 'Unknown';
                      if (!isCompanyAuthorized(comp)) return;
                      if (!compStats[comp]) {
                        compStats[comp] = { total: 0, male: 0, female: 0, pf: 0, esic: 0, totalSalary: 0, avgSalary: 0 };
                      }
                      const s = compStats[comp];
                      s.total += 1;
                      if ((emp.gender || '').toLowerCase() === 'male') s.male += 1;
                      else if ((emp.gender || '').toLowerCase() === 'female') s.female += 1;
                      
                      if (emp.pf_opt_in) s.pf += 1;
                      if (emp.esic_opt_in) s.esic += 1;
                      s.totalSalary += emp.base_salary || 0;
                    });

                    Object.keys(compStats).forEach(comp => {
                      const s = compStats[comp];
                      s.avgSalary = s.total > 0 ? Math.round(s.totalSalary / s.total) : 0;
                    });

                    // Department Wise Stats
                    const deptStats: Record<string, {
                      headcount: number;
                      totalCtc: number;
                      totalExpYears: number;
                      expCount: number;
                      newJoiners: number;
                    }> = {};

                    employees.forEach(emp => {
                      if (!isCompanyAuthorized(emp.company || '')) return;
                      const dept = emp.department || 'Other';
                      if (!deptStats[dept]) {
                        deptStats[dept] = { headcount: 0, totalCtc: 0, totalExpYears: 0, expCount: 0, newJoiners: 0 };
                      }
                      const s = deptStats[dept];
                      s.headcount += 1;
                      s.totalCtc += emp.ctc_salary || (emp.base_salary * 1.4) || 0;
                      
                      if (emp.total_experience) {
                        const match = String(emp.total_experience).match(/[\d.]+/);
                        if (match) {
                          s.totalExpYears += parseFloat(match[0]);
                          s.expCount += 1;
                        }
                      }

                      if (emp.joining_date) {
                        const year = parseInt(emp.joining_date.substring(0, 4));
                        if (year >= 2024) {
                          s.newJoiners += 1;
                        }
                      }
                    });

                    // Unit Wise Stats
                    const unitStats: Record<string, {
                      count: number;
                      monthlySalaryCost: number;
                      attritionCount: number;
                    }> = {};

                    employees.forEach(emp => {
                      const unit = getEmployeeUnit(emp) || 'Other';
                      if (unit !== 'Other' && !isCompanyAuthorized(unit)) return;
                      if (!unitStats[unit]) {
                        unitStats[unit] = { count: 0, monthlySalaryCost: 0, attritionCount: 0 };
                      }
                      const s = unitStats[unit];
                      
                      const isResigned = (emp.status || '').toUpperCase() === 'RESIGNED' || (emp.status || '').toUpperCase() === 'SEPARATED';
                      if (isResigned) {
                        s.attritionCount += 1;
                      } else {
                        s.count += 1;
                        s.monthlySalaryCost += emp.base_salary || 0;
                      }
                    });

                    return (
                      <div className="space-y-6">
                        {/* Summary Cards Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 select-none">
                          {/* Card 1: Total Employees */}
                          <div className="bg-gradient-to-br from-pink-50 to-amber-50 p-3 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between h-20 transition hover:shadow-sm">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-pink-900">Total Employees</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xl font-black text-slate-900 font-mono">{totalEmp}</span>
                              <Users size={14} className="text-pink-600 opacity-70" />
                            </div>
                          </div>

                          {/* Card 2: Company Wise Count */}
                          <div className="bg-gradient-to-br from-pink-50 to-amber-50 p-3 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between h-20 transition hover:shadow-sm">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900">Active Companies</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xl font-black text-slate-900 font-mono">{uniqueCompaniesCount}</span>
                              <Building2 size={14} className="text-amber-600 opacity-70" />
                            </div>
                          </div>

                          {/* Card 3: Department Wise Count */}
                          <div className="bg-gradient-to-br from-pink-50 to-amber-50 p-3 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between h-20 transition hover:shadow-sm">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-pink-900">Active Depts</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xl font-black text-slate-900 font-mono">{uniqueDeptsCount}</span>
                              <Layers size={14} className="text-pink-600 opacity-70" />
                            </div>
                          </div>

                          {/* Card 4: PF Covered Count */}
                          <div className="bg-gradient-to-br from-pink-50 to-amber-50 p-3 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between h-20 transition hover:shadow-sm">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900">PF Covered</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xl font-black text-slate-900 font-mono">{pfCoveredCount}</span>
                              <ShieldCheck size={14} className="text-amber-600 opacity-70" />
                            </div>
                          </div>

                          {/* Card 5: PF Non-Covered Count */}
                          <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-20 transition hover:shadow-sm">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700">PF Non-Covered</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xl font-black text-slate-900 font-mono">{pfNonCoveredCount}</span>
                              <Lock size={14} className="text-slate-500 opacity-50" />
                            </div>
                          </div>

                          {/* Card 6: ESIC Covered Count */}
                          <div className="bg-gradient-to-br from-pink-50 to-amber-50 p-3 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between h-20 transition hover:shadow-sm">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-pink-900">ESIC Covered</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xl font-black text-slate-900 font-mono">{esicCoveredCount}</span>
                              <Coins size={14} className="text-pink-600 opacity-70" />
                            </div>
                          </div>

                          {/* Card 7: Probation Employees Count */}
                          <div className="bg-gradient-to-br from-pink-50 to-amber-50 p-3 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between h-20 transition hover:shadow-sm">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900">Probation</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xl font-black text-slate-900 font-mono">{probationCount}</span>
                              <Clock size={14} className="text-amber-600 opacity-70" />
                            </div>
                          </div>

                          {/* Card 8: Notice Period Employees Count */}
                          <div className="bg-gradient-to-br from-pink-50 to-amber-50 p-3 rounded-xl border border-pink-100 shadow-xs flex flex-col justify-between h-20 transition hover:shadow-sm">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-pink-900">Notice Period</span>
                            <div className="flex items-baseline justify-between mt-1">
                              <span className="text-xl font-black text-slate-900 font-mono">{noticeCount}</span>
                              <FileText size={14} className="text-pink-600 opacity-70" />
                            </div>
                          </div>
                        </div>

                        {/* Management Presentation Summary Dashboard Reports */}
                        {(activeHR.role === 'SUPER_HR' || activeHR.role === 'MANAGEMENT') && (
                          <div className="bg-white border border-pink-100 rounded-2xl shadow-sm overflow-hidden transition hover:shadow-md">
                            <div className="p-4 bg-slate-900 text-white flex items-center justify-between cursor-pointer select-none" onClick={() => setShowManagementReports(!showManagementReports)}>
                              <div className="flex items-center gap-3">
                                <div className="bg-amber-400 p-2 rounded-xl text-slate-950 font-black">
                                  <TrendingUp size={16} />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">📊 Management Presentation Reports Summary</h4>
                                  <p className="text-[10px] text-gray-400">Automated corporate metrics (Company, Department, Unit Wise) required for MD presentations and planning</p>
                                </div>
                              </div>
                              <button className="text-[10px] font-extrabold px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition cursor-pointer">
                                {showManagementReports ? 'COLLAPSE' : 'EXPAND'}
                              </button>
                            </div>

                            {showManagementReports && (
                              <div className="p-5 space-y-4">
                                {/* Sub tab switcher inside reports */}
                                <div className="flex flex-wrap gap-2 border-b pb-3 select-none">
                                  <button
                                    onClick={() => setActiveReportSubTab('company')}
                                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${activeReportSubTab === 'company' ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white font-extrabold shadow-sm' : 'bg-gray-100 text-slate-700 hover:bg-gray-200'}`}
                                  >
                                    🏢 Company Wise Headcount
                                  </button>
                                  <button
                                    onClick={() => setActiveReportSubTab('dept')}
                                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${activeReportSubTab === 'dept' ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white font-extrabold shadow-sm' : 'bg-gray-100 text-slate-700 hover:bg-gray-200'}`}
                                  >
                                    ⚙️ Department Wise Headcount
                                  </button>
                                  <button
                                    onClick={() => setActiveReportSubTab('unit')}
                                    className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${activeReportSubTab === 'unit' ? 'bg-gradient-to-r from-pink-500 to-amber-500 text-white font-extrabold shadow-sm' : 'bg-gray-100 text-slate-700 hover:bg-gray-200'}`}
                                  >
                                    🏭 Unit Wise Overview
                                  </button>
                                </div>

                                {/* Company Wise Report */}
                                {activeReportSubTab === 'company' && (
                                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-xs text-left border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-700 font-extrabold uppercase text-[9px] tracking-wider">
                                          <th className="p-3.5">Company / Corporate Brand</th>
                                          <th className="p-3.5 text-center">Total Employees</th>
                                          <th className="p-3.5 text-center">Male</th>
                                          <th className="p-3.5 text-center">Female</th>
                                          <th className="p-3.5 text-center">PF Covered</th>
                                          <th className="p-3.5 text-center">ESIC Covered</th>
                                          <th className="p-3.5 text-right">Average Base Salary</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y text-slate-800">
                                        {Object.keys(compStats).map((comp, idx) => {
                                          const s = compStats[comp];
                                          return (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                              <td className="p-3.5 font-bold text-slate-900">{comp}</td>
                                              <td className="p-3.5 text-center font-mono font-black text-slate-900">{s.total}</td>
                                              <td className="p-3.5 text-center font-mono text-indigo-700 font-semibold">{s.male}</td>
                                              <td className="p-3.5 text-center font-mono text-pink-700 font-semibold">{s.female}</td>
                                              <td className="p-3.5 text-center font-mono text-emerald-700 font-semibold">{s.pf}</td>
                                              <td className="p-3.5 text-center font-mono text-amber-700 font-semibold">{s.esic}</td>
                                              <td className="p-3.5 text-right font-mono font-black text-emerald-800">₹{s.avgSalary.toLocaleString('en-IN')}/mo</td>
                                            </tr>
                                          );
                                        })}
                                        {/* Group Consolidated Row for MD/Admin */}
                                        <tr className="bg-amber-50/70 font-black border-t-2 border-amber-200 text-slate-900">
                                          <td className="p-3.5 font-extrabold text-slate-900">🌐 GROUP CONSOLIDATED (TOTAL)</td>
                                          <td className="p-3.5 text-center font-mono font-black text-slate-950">{Object.values(compStats).reduce((acc, c) => acc + c.total, 0)}</td>
                                          <td className="p-3.5 text-center font-mono text-indigo-900">{Object.values(compStats).reduce((acc, c) => acc + c.male, 0)}</td>
                                          <td className="p-3.5 text-center font-mono text-pink-900">{Object.values(compStats).reduce((acc, c) => acc + c.female, 0)}</td>
                                          <td className="p-3.5 text-center font-mono text-emerald-900">{Object.values(compStats).reduce((acc, c) => acc + c.pf, 0)}</td>
                                          <td className="p-3.5 text-center font-mono text-amber-900">{Object.values(compStats).reduce((acc, c) => acc + c.esic, 0)}</td>
                                          <td className="p-3.5 text-right font-mono font-black text-emerald-900">
                                            ₹{Math.round(
                                              Object.values(compStats).reduce((acc, c) => acc + c.totalSalary, 0) /
                                              (Object.values(compStats).reduce((acc, c) => acc + c.total, 0) || 1)
                                            ).toLocaleString('en-IN')}/mo
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* Department Wise Report */}
                                {activeReportSubTab === 'dept' && (
                                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-xs text-left border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-700 font-extrabold uppercase text-[9px] tracking-wider">
                                          <th className="p-3.5">Department Name</th>
                                          <th className="p-3.5 text-center">Headcount</th>
                                          <th className="p-3.5 text-right">Total Dynamic Cost (CTC)</th>
                                          <th className="p-3.5 text-center">Average Experience</th>
                                          <th className="p-3.5 text-center">New Joiners (2024-26)</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y text-slate-800">
                                        {Object.keys(deptStats).map((dept, idx) => {
                                          const s = deptStats[dept];
                                          const avgExp = s.expCount > 0 ? (s.totalExpYears / s.expCount).toFixed(1) : 'N/A';
                                          return (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                              <td className="p-3.5 font-bold text-slate-900">{dept}</td>
                                              <td className="p-3.5 text-center font-mono font-black text-slate-900">{s.headcount}</td>
                                              <td className="p-3.5 text-right font-mono font-black text-indigo-700">₹{Math.round(s.totalCtc).toLocaleString('en-IN')}/mo</td>
                                              <td className="p-3.5 text-center font-mono font-semibold text-slate-700">{avgExp} Years</td>
                                              <td className="p-3.5 text-center font-mono text-emerald-700 font-extrabold">+{s.newJoiners} New</td>
                                            </tr>
                                          );
                                        })}
                                        {/* All Departments Total Row */}
                                        <tr className="bg-amber-50/70 font-black border-t-2 border-amber-200 text-slate-900">
                                          <td className="p-3.5 font-extrabold text-slate-900">🌐 ALL DEPARTMENTS TOTAL</td>
                                          <td className="p-3.5 text-center font-mono font-black text-slate-950">{Object.values(deptStats).reduce((acc, d) => acc + d.headcount, 0)}</td>
                                          <td className="p-3.5 text-right font-mono font-black text-indigo-900">₹{Math.round(Object.values(deptStats).reduce((acc, d) => acc + d.totalCtc, 0)).toLocaleString('en-IN')}/mo</td>
                                          <td className="p-3.5 text-center font-mono text-slate-900">
                                            {(() => {
                                              const totExp = Object.values(deptStats).reduce((acc, d) => acc + d.totalExpYears, 0);
                                              const totExpCount = Object.values(deptStats).reduce((acc, d) => acc + d.expCount, 0);
                                              return totExpCount > 0 ? (totExp / totExpCount).toFixed(1) : 'N/A';
                                            })()} Years
                                          </td>
                                          <td className="p-3.5 text-center font-mono text-emerald-900 font-extrabold">
                                            +{Object.values(deptStats).reduce((acc, d) => acc + d.newJoiners, 0)} New
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* Unit Wise Report */}
                                {activeReportSubTab === 'unit' && (
                                  <div className="overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full text-xs text-left border-collapse">
                                      <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-700 font-extrabold uppercase text-[9px] tracking-wider">
                                          <th className="p-3.5">Unit / Corporate Location</th>
                                          <th className="p-3.5 text-center">Active Employee Count</th>
                                          <th className="p-3.5 text-right">Monthly Payout (Base Wages)</th>
                                          <th className="p-3.5 text-center">Attrition Count</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y text-slate-800">
                                        {Object.keys(unitStats).map((unit, idx) => {
                                          const s = unitStats[unit];
                                          return (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                              <td className="p-3.5 font-bold text-slate-900">{unit}</td>
                                              <td className="p-3.5 text-center font-mono font-black text-slate-900">{s.count}</td>
                                              <td className="p-3.5 text-right font-mono font-black text-rose-700 font-semibold">₹{s.monthlySalaryCost.toLocaleString('en-IN')}/mo</td>
                                              <td className="p-3.5 text-center font-mono font-bold text-amber-700">{s.attritionCount} Resigned</td>
                                            </tr>
                                          );
                                        })}
                                        {/* All Units Consolidated Row */}
                                        <tr className="bg-amber-50/70 font-black border-t-2 border-amber-200 text-slate-900">
                                          <td className="p-3.5 font-extrabold text-slate-900">🌐 ALL UNITS CONSOLIDATED</td>
                                          <td className="p-3.5 text-center font-mono font-black text-slate-950">{Object.values(unitStats).reduce((acc, u) => acc + u.count, 0)}</td>
                                          <td className="p-3.5 text-right font-mono font-black text-rose-900">₹{Object.values(unitStats).reduce((acc, u) => acc + u.monthlySalaryCost, 0).toLocaleString('en-IN')}/mo</td>
                                          <td className="p-3.5 text-center font-mono text-amber-900">{Object.values(unitStats).reduce((acc, u) => acc + u.attritionCount, 0)} Resigned</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Workforce Directory Filters Control Panel */}
                        <div className="bg-white p-5 rounded-2xl border border-pink-100 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-pink-50 pb-2 select-none">
                            <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                              <Search size={14} className="text-pink-600" />
                              🔍 Dynamic Employee Master Filter Controls
                            </h5>
                            {(searchTerm || selectedDept !== 'ALL' || selectedCompanyFilter !== 'ALL' || selectedUnitFilter !== 'ALL' || selectedStatusFilter !== 'ALL' || selectedPfFilter !== 'ALL' || selectedEsicFilter !== 'ALL') && (
                              <button
                                onClick={() => {
                                  setSearchTerm('');
                                  setSelectedDept('ALL');
                                  setSelectedCompanyFilter('ALL');
                                  setSelectedUnitFilter('ALL');
                                  setSelectedStatusFilter('ALL');
                                  setSelectedPfFilter('ALL');
                                  setSelectedEsicFilter('ALL');
                                }}
                                className="text-[10px] font-extrabold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                              >
                                Clear All Active Filters
                              </button>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {/* Company Filter */}
                            {(activeHR.role === 'SUPER_HR' || activeHR.role === 'MANAGEMENT' || (activeHR.company_rights && activeHR.company_rights.length > 1)) && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Company Wise</label>
                                <select
                                  value={selectedCompanyFilter}
                                  onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                                  className="w-full p-2 text-xs border rounded-xl bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                                >
                                  <option value="ALL">All Companies</option>
                                  {isCompanyAuthorized('SAKAR-I') && <option value="SAKAR-I">SAKAR-I</option>}
                                  {isCompanyAuthorized('SAKAR-III') && <option value="SAKAR-III">SAKAR-III</option>}
                                  {isCompanyAuthorized('SVN-I') && <option value="SVN-I">SVN-I</option>}
                                  {isCompanyAuthorized('SVN-II') && <option value="SVN-II">SVN-II</option>}
                                  {isCompanyAuthorized('FLARE') && <option value="FLARE">FLARE</option>}
                                  {isCompanyAuthorized('ZENIVO') && <option value="ZENIVO">ZENIVO</option>}
                                </select>
                              </div>
                            )}

                             {/* Unit Filter */}
                             {(activeHR.role === 'SUPER_HR' || activeHR.role === 'MANAGEMENT' || (activeHR.company_rights && activeHR.company_rights.length > 1)) && (
                               <div className="space-y-1">
                                 <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Unit Wise</label>
                                 <select
                                   value={selectedUnitFilter}
                                   onChange={(e) => setSelectedUnitFilter(e.target.value)}
                                   className="w-full p-2 text-xs border rounded-xl bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                                 >
                                   <option value="ALL">All Units</option>
                                   {['SVN-I', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Zenivo', 'Flare']
                                     .filter(unit => isCompanyAuthorized(unit))
                                     .map(unit => (
                                       <option key={unit} value={unit}>{unit}</option>
                                     ))
                                   }
                                 </select>
                               </div>
                             )}

                            {/* Department Filter */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Department Wise</label>
                              <select
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="w-full p-2 text-xs border rounded-xl bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                              >
                                <option value="ALL">All Departments</option>
                                {departments.map(dept => (
                                  <option key={dept} value={dept}>{dept}</option>
                                ))}
                              </select>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status Wise</label>
                              <select
                                value={selectedStatusFilter}
                                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                                className="w-full p-2 text-xs border rounded-xl bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                              >
                                <option value="ALL">All Statuses</option>
                                <option value="ACTIVE">Active</option>
                                <option value="RESIGNED">Resigned</option>
                                <option value="NOTICE">Notice Period</option>
                                <option value="PROBATION">Probation</option>
                                <option value="RETIRED">Retired</option>
                              </select>
                            </div>

                            {/* PF Status Filter */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">PF Status</label>
                              <select
                                value={selectedPfFilter}
                                onChange={(e) => setSelectedPfFilter(e.target.value)}
                                className="w-full p-2 text-xs border rounded-xl bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                              >
                                <option value="ALL">All PF Status</option>
                                <option value="PF_COVERED">PF Covered</option>
                                <option value="PF_NON_COVERED">PF Non-Covered</option>
                              </select>
                            </div>

                            {/* ESIC Status Filter */}
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">ESIC Status</label>
                              <select
                                value={selectedEsicFilter}
                                onChange={(e) => setSelectedEsicFilter(e.target.value)}
                                className="w-full p-2 text-xs border rounded-xl bg-slate-50 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-pink-500 cursor-pointer"
                              >
                                <option value="ALL">All ESIC Status</option>
                                <option value="ESIC_COVERED">ESIC Covered</option>
                                <option value="ESIC_NON_COVERED">ESIC Non-Covered</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Triggers bar */}
                  <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Search Name or Ref ID..."
                          className="pl-9 pr-4 py-1.5 text-xs border rounded-xl bg-gray-50 focus:bg-white focus:ring-1 focus:ring-pink-500 font-sans focus:outline-none w-52"
                        />
                      </div>

                      {/* View Mode Switcher */}
                      <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 select-none">
                        <button
                          type="button"
                          onClick={() => setEmployeeViewMode('grid')}
                          className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${employeeViewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <Grid size={12} />
                          Simple Grid
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmployeeViewMode('master')}
                          className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${employeeViewMode === 'master' ? 'bg-emerald-600 text-white shadow-xs font-extrabold' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <FileSpreadsheet size={12} />
                          Employee Master Sheet
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 select-none">
                      <button
                        onClick={downloadEmployeeMasterCSV}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold rounded-xl transition cursor-pointer border border-pink-100"
                        title="Export the active staff listings as a 46-column CSV Master Spreadsheet"
                      >
                        <FileSpreadsheet size={13} />
                        Export Employee Master
                      </button>

                      <button
                        onClick={() => {
                          window.location.href = '/api/backup';
                          setSuccessBanner('📥 Full SQLite Database (Payroll.db) successfully exported! You can use this file to restore or run VETAN ERP locally.');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold rounded-xl transition cursor-pointer border border-amber-100"
                        title="Export the complete binary SQLite database file (Payroll.db)"
                      >
                        <Database size={13} />
                        Export Full Database
                      </button>

                      <button
                        onClick={() => setIsDeptModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition cursor-pointer border border-blue-100"
                        title="Add dynamic department"
                      >
                        <Plus size={13} />
                        Add Department
                      </button>

                      <button
                        id="btn-open-excel-import"
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        <FileSpreadsheet size={13} />
                        Bulk Excel Paste
                      </button>

                      <button
                        id="btn-open-manual-create"
                        onClick={() => {
                          setManualUnit(activeCompany as any);
                          setIsNewEmpOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-pink-500 to-amber-500 hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                      >
                        <Plus size={13} />
                        Register Employee
                      </button>
                    </div>

                  </div>

                  {employeeViewMode === 'master' ? (
                    /* 44-COLUMN COMPREHENSIVE SPREADSHEET GRID VIEW */
                    <div className="bg-white border rounded-2xl shadow-xs overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b flex justify-between items-center select-none">
                        <div>
                          <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                            <span>📊 SACAR/SVN Corporate Employee Master Registry</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-bold">46 Columns Standard</span>
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">Calculated based on active rates, formulas for {activeMonth} cycle and employee opt-in choices</p>
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          Total Employees: {filteredEmployeesList.length}
                        </div>
                      </div>

                      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-300">
                        <table className="w-full text-[11px] text-left border-collapse border border-slate-200">
                          <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
                            <tr className="border-b select-none font-display text-slate-700 font-extrabold">
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[90px] sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Code</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[160px] sticky left-[90px] z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Name</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[140px]">Designation</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[140px]">Department</th>
                              <th className="p-3 border-r border-purple-200 bg-purple-700 text-white uppercase tracking-wider text-[10px] min-w-[100px] text-center">UNIT</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[145px]">Reporting Manager</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[145px]">Reporting HOD</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[110px]">Date of Joining</th>
                              <th className="p-3 border-r border-purple-200 bg-purple-700 text-white uppercase tracking-wider text-[10px] min-w-[110px] text-center">Date of Leaving</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[100px] text-right">Basic Salary</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[90px] text-right">HRA</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[110px] text-right">Conveyance All</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[90px] text-right">Child All</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[90px] text-right">Medical All</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[90px] text-right">Special All</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[90px] text-right">DA</th>
                              <th className="p-3 border-r border-emerald-200 bg-emerald-100 text-emerald-950 uppercase tracking-wider text-[10px] min-w-[110px] text-right font-black">Gross Salary</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[150px] text-right">PF contri by Empr</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[150px] text-right">ESIC Contr by EMPR</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[110px] text-right">Bonus Payable</th>
                              <th className="p-3 border-r border-emerald-200 bg-emerald-200 text-emerald-950 uppercase tracking-wider text-[10px] min-w-[120px] text-right font-black">CTC</th>
                              <th className="p-3 border-r border-rose-200 bg-rose-50 text-rose-950 uppercase tracking-wider text-[10px] min-w-[100px] text-right">PF Deduction</th>
                              <th className="p-3 border-r border-rose-200 bg-rose-50 text-rose-950 uppercase tracking-wider text-[10px] min-w-[110px] text-right">ESIC Deduction</th>
                              <th className="p-3 border-r border-rose-200 bg-rose-50 text-rose-950 uppercase tracking-wider text-[10px] min-w-[100px] text-right">PT deduction</th>
                              <th className="p-3 border-r border-rose-200 bg-rose-50 text-rose-950 uppercase tracking-wider text-[10px] min-w-[110px] text-right">TDS deduction</th>
                              <th className="p-3 border-r border-rose-200 bg-rose-50 text-rose-950 uppercase tracking-wider text-[10px] min-w-[110px] text-right">Other deduction</th>
                              <th className="p-3 border-r border-rose-200 bg-rose-100 text-rose-950 uppercase tracking-wider text-[10px] min-w-[120px] text-right font-black">Total Deduction</th>
                              <th className="p-3 border-r border-teal-200 bg-teal-100 text-teal-950 uppercase tracking-wider text-[10px] min-w-[120px] text-right font-black">Take Home</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[110px]">Phone</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[85px] text-center">Birth Year</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[100px] text-center">DOB</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[130px]">Qualification</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[130px]">UAN No.</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[130px]">ESIC No.</th>
                              <th className="p-3 border-r border-purple-200 bg-purple-700 text-white uppercase tracking-wider text-[10px] min-w-[140px] text-center">Bank Name</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[120px]">IFSC Code</th>
                              <th className="p-3 border-r border-purple-200 bg-purple-700 text-white uppercase tracking-wider text-[10px] min-w-[160px] text-center">Bank Account no.</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[120px]">Location</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[140px]">Vehicle Detail</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[170px]">Previous Company Name</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[170px]">Previous Company Location</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[110px] text-center">Total Experience</th>
                              <th className="p-3 border-r border-blue-200 bg-blue-100 text-blue-950 uppercase tracking-wider text-[10px] min-w-[110px] text-center font-bold">PF APPLICABLE</th>
                              <th className="p-3 border-r border-purple-200 bg-purple-100 text-purple-950 uppercase tracking-wider text-[10px] min-w-[115px] text-center font-bold">ESIC APPLICABLE</th>
                              <th className="p-3 border-r border-slate-200 bg-slate-200 text-slate-950 uppercase tracking-wider text-[10px] min-w-[110px] text-center font-bold">PT APPLICABLE</th>
                              <th className="p-3 bg-slate-100 text-slate-800 uppercase tracking-wider text-[10px] min-w-[120px] text-center sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-800 font-sans font-medium">
                            {filteredEmployeesList.map(emp => {
                              const isFormulaMonth = activeMonth >= '2026-08';
                              const hiddenHeads = (emp.hidden_salary_heads || '').split(',').map(h => h.trim());
                              const isHidden = (head: string) => hiddenHeads.includes(head);

                              const sets = getCompanySettings(emp.company);
                              const isLockedPercentage = emp.salary_structure_type === 'PERCENTAGE' || isFormulaMonth;
                              const rate_base = emp.base_salary;
                              const rate_hra = isHidden('hra') ? 0 : (isLockedPercentage ? Math.round(rate_base * (sets.salary_hra_percent / 100)) : emp.hra);
                              const rate_conveyance = isHidden('conveyance_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * 0.08) : (emp.conveyance_allowance || 0));
                              const rate_edu = isHidden('edu_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * 0.02) : (emp.edu_allowance || 0));
                              const rate_medical = isHidden('medical_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * 0.05) : (emp.medical_allowance || 0));
                              const rate_special = isHidden('special_allowance') ? 0 : (isLockedPercentage ? Math.round(rate_base * (sets.salary_special_percent / 100)) : emp.special_allowance);
                              const rate_da = 0; // DA completely removed

                              const gross_salary = rate_base + rate_hra + rate_conveyance + rate_edu + rate_medical + rate_special + rate_da;

                              const employer_pf = emp.pf_opt_in ? Math.round((rate_base) * (sets.pf_employer_rate / 100)) : 0;
                              const employer_esic = (emp.esic_opt_in && gross_salary <= sets.esic_opt_in_threshold) ? Math.round(gross_salary * (sets.esic_employer_rate / 100)) : 0;
                              const bonus_payable = Math.round(rate_base * 0.0833);
                              const ctc = gross_salary + employer_pf + employer_esic + bonus_payable;

                              const pf_deduction = emp.pf_opt_in ? Math.round((rate_base) * 0.12) : 0;
                              const esic_deduction = (emp.esic_opt_in && gross_salary <= sets.esic_opt_in_threshold) ? Math.round(gross_salary * 0.0075) : 0;

                              let professional_tax = 0;
                              if (emp.professional_tax_opt_in) {
                                if (gross_salary > 15000) professional_tax = 200;
                                else if (gross_salary > 10000) professional_tax = 150;
                              }

                              let tds = 0;
                              const annual_estimated_taxable = (gross_salary - pf_deduction - professional_tax) * 12;
                              if (annual_estimated_taxable > 700000) {
                                const excess = annual_estimated_taxable - 700000;
                                tds = Math.round((excess * 0.10) / 12);
                              }

                              const empLoans = (loans || []).filter(l => l.employee_id === emp.id && l.status === 'ACTIVE');
                              const loanDeduction = empLoans.reduce((sum, l) => sum + (l.monthly_deduction || 0), 0);

                              const total_deduction = pf_deduction + esic_deduction + professional_tax + tds + loanDeduction;
                              const take_home = Math.max(0, gross_salary - total_deduction);

                              return (
                                <tr key={emp.id} className="hover:bg-slate-50/70 border-b border-slate-100">
                                  {/* Code */}
                                  <td className="p-3 border-r border-slate-200 font-mono font-bold text-slate-900 bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    {emp.id}
                                  </td>
                                  {/* Name */}
                                  <td className="p-3 border-r border-slate-200 font-bold text-gray-900 bg-white sticky left-[90px] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    {emp.name}
                                  </td>
                                  {/* Designation */}
                                  <td className="p-3 border-r border-slate-200 text-slate-700 font-medium">
                                    {emp.designation}
                                  </td>
                                  {/* Department */}
                                  <td className="p-3 border-r border-slate-200 text-slate-600 font-medium">
                                    {emp.department}
                                  </td>
                                  {/* UNIT */}
                                  <td className="p-3 border-r border-purple-100 text-center font-bold text-purple-700 bg-purple-50/40">
                                    {emp.company}
                                  </td>
                                  {/* Reporting Manager */}
                                  <td className="p-3 border-r border-slate-200 font-medium text-slate-700">
                                    {emp.reporting_manager || '-'}
                                  </td>
                                  {/* Reporting HOD */}
                                  <td className="p-3 border-r border-slate-200 text-emerald-800 bg-emerald-50/10 font-bold">
                                    {emp.reporting_hod_name || emp.reporting_hod || '-'}
                                  </td>
                                  {/* Date of Joining */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600">
                                    {emp.joining_date}
                                  </td>
                                  {/* Date of Leaving */}
                                  <td className="p-3 border-r border-purple-100 text-center font-mono font-bold text-purple-800 bg-purple-50/40">
                                    {emp.exit_date || '-'}
                                  </td>
                                  {/* Base Salary */}
                                  <td className="p-3 border-r border-slate-200 font-mono font-bold text-slate-700 text-right">
                                    ₹{rate_base.toLocaleString('en-IN')}
                                  </td>
                                  {/* HRA */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600 text-right">
                                    ₹{rate_hra.toLocaleString('en-IN')}
                                  </td>
                                  {/* Con All */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600 text-right">
                                    ₹{rate_conveyance.toLocaleString('en-IN')}
                                  </td>
                                  {/* Child All */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600 text-right">
                                    ₹{rate_edu.toLocaleString('en-IN')}
                                  </td>
                                  {/* Medical All */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600 text-right">
                                    ₹{rate_medical.toLocaleString('en-IN')}
                                  </td>
                                  {/* Special All */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600 text-right">
                                    ₹{rate_special.toLocaleString('en-IN')}
                                  </td>
                                  {/* Dearnes All */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600 text-right">
                                    ₹{rate_da.toLocaleString('en-IN')}
                                  </td>
                                  {/* Gross Salary */}
                                  <td className="p-3 border-r border-emerald-200 font-mono font-black text-emerald-800 text-right bg-emerald-50/40">
                                    ₹{gross_salary.toLocaleString('en-IN')}
                                  </td>
                                  {/* PF employer contribution */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600 text-right">
                                    ₹{employer_pf.toLocaleString('en-IN')}
                                  </td>
                                  {/* ESIC employer contribution */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600 text-right">
                                    ₹{employer_esic.toLocaleString('en-IN')}
                                  </td>
                                  {/* Bonus Payable */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600 text-right">
                                    ₹{bonus_payable.toLocaleString('en-IN')}
                                  </td>
                                  {/* CTC */}
                                  <td className="p-3 border-r border-emerald-200 font-mono font-black text-emerald-950 text-right bg-emerald-100/30">
                                    ₹{ctc.toLocaleString('en-IN')}
                                  </td>
                                  {/* PF Deduction */}
                                  <td className="p-3 border-r border-rose-200 font-mono text-rose-700 text-right bg-rose-50/20">
                                    ₹{pf_deduction.toLocaleString('en-IN')}
                                  </td>
                                  {/* ESIC Deduction */}
                                  <td className="p-3 border-r border-rose-200 font-mono text-rose-700 text-right bg-rose-50/20">
                                    ₹{esic_deduction.toLocaleString('en-IN')}
                                  </td>
                                  {/* PT deduction */}
                                  <td className="p-3 border-r border-rose-200 font-mono text-rose-700 text-right bg-rose-50/20">
                                    ₹{professional_tax.toLocaleString('en-IN')}
                                  </td>
                                  {/* TDS deduction */}
                                  <td className="p-3 border-r border-rose-200 font-mono text-rose-700 text-right bg-rose-50/20">
                                    ₹{tds.toLocaleString('en-IN')}
                                  </td>
                                  {/* Other deduction */}
                                  <td className="p-3 border-r border-rose-200 font-mono text-rose-700 text-right bg-rose-50/20">
                                    ₹{loanDeduction.toLocaleString('en-IN')}
                                  </td>
                                  {/* Total Deduction */}
                                  <td className="p-3 border-r border-rose-200 font-mono font-extrabold text-rose-900 text-right bg-rose-100/30">
                                    ₹{total_deduction.toLocaleString('en-IN')}
                                  </td>
                                  {/* Take Home */}
                                  <td className="p-3 border-r border-teal-200 font-mono font-black text-teal-800 text-right bg-teal-50">
                                    ₹{take_home.toLocaleString('en-IN')}
                                  </td>
                                  {/* Phone */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600">
                                    {emp.phone || '-'}
                                  </td>
                                  {/* Birth Year */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600 text-center">
                                    {emp.birth_year || '-'}
                                  </td>
                                  {/* DOB */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600 text-center">
                                    {emp.dob || '-'}
                                  </td>
                                  {/* Qualification */}
                                  <td className="p-3 border-r border-slate-200 text-slate-600">
                                    {emp.qualification || '-'}
                                  </td>
                                  {/* UAN No. */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600">
                                    {emp.uan || '-'}
                                  </td>
                                  {/* ESIC No. */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600">
                                    {emp.esic_number || '-'}
                                  </td>
                                  {/* Bank Name */}
                                  <td className="p-3 border-r border-purple-100 font-bold text-purple-700 bg-purple-50/20 text-center">
                                    {emp.bank_name || '-'}
                                  </td>
                                  {/* IFSC Code */}
                                  <td className="p-3 border-r border-slate-200 font-mono text-slate-600">
                                    {emp.ifsc || '-'}
                                  </td>
                                  {/* Bank Account no. */}
                                  <td className="p-3 border-r border-purple-100 font-mono font-bold text-purple-800 bg-purple-50/20 text-center">
                                    {emp.bank_account || '-'}
                                  </td>
                                  {/* Location */}
                                  <td className="p-3 border-r border-slate-200 text-slate-600">
                                    {emp.location || '-'}
                                  </td>
                                  {/* Vehicle Detail */}
                                  <td className="p-3 border-r border-slate-200 text-slate-600">
                                    {emp.vehicle_detail || '-'}
                                  </td>
                                  {/* Previous Company Name */}
                                  <td className="p-3 border-r border-slate-200 text-slate-600">
                                    {emp.prev_company_name || '-'}
                                  </td>
                                  {/* Previous Company Location */}
                                  <td className="p-3 border-r border-slate-200 text-slate-600">
                                    {emp.prev_company_location || '-'}
                                  </td>
                                  {/* Total Experience */}
                                  <td className="p-3 border-r border-slate-200 text-center font-mono text-slate-600">
                                    {emp.total_experience || '-'}
                                  </td>
                                  {/* PF Applicable checkbox toggle */}
                                  <td className="p-3 border-r border-blue-200 text-center bg-blue-50/30">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatutoryOptIn(emp.id, 'pf_opt_in', !!emp.pf_opt_in)}
                                      className={`px-2 py-1 text-[10px] font-extrabold rounded-md shadow-2xs transition-all uppercase cursor-pointer ${emp.pf_opt_in ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                    >
                                      {emp.pf_opt_in ? 'PF YES' : 'PF NO'}
                                    </button>
                                  </td>
                                  {/* ESIC Applicable checkbox toggle */}
                                  <td className="p-3 border-r border-purple-200 text-center bg-purple-50/30">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatutoryOptIn(emp.id, 'esic_opt_in', !!emp.esic_opt_in)}
                                      className={`px-2 py-1 text-[10px] font-extrabold rounded-md shadow-2xs transition-all uppercase cursor-pointer ${emp.esic_opt_in ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                    >
                                      {emp.esic_opt_in ? 'ESIC YES' : 'ESIC NO'}
                                    </button>
                                  </td>
                                  {/* PT Applicable checkbox toggle */}
                                  <td className="p-3 border-r border-slate-200 text-center bg-slate-100/40">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatutoryOptIn(emp.id, 'professional_tax_opt_in', !!emp.professional_tax_opt_in)}
                                      className={`px-2 py-1 text-[10px] font-extrabold rounded-md shadow-2xs transition-all uppercase cursor-pointer ${emp.professional_tax_opt_in ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                    >
                                      {emp.professional_tax_opt_in ? 'PT YES' : 'PT NO'}
                                    </button>
                                  </td>
                                  {/* Actions */}
                                  <td className="p-3 text-center sticky right-0 z-10 bg-white shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => fetchEmployeeProfileData(emp)}
                                        className="text-emerald-600 hover:text-emerald-800 p-1 bg-emerald-50 hover:bg-emerald-100 rounded-md transition cursor-pointer font-extrabold text-[10px]"
                                        title="View detailed employee profile & ledger"
                                      >
                                        Ledger
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                        className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 transition rounded-md cursor-pointer"
                                        title="Delete employee profile"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredEmployeesList.length === 0 && (
                              <tr>
                                <td colSpan={45} className="text-center py-16 text-slate-400 font-sans text-xs">
                                  No employee matches found in active SVN/Sakar directory.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    /* Employees simple display list */
                    <div className="bg-white border rounded-2xl shadow-xs overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                          <thead>
                            <tr className="bg-gray-50 border-b select-none font-display text-gray-405 text-xs">
                              <th className="p-4">Employee Name / Ref ID</th>
                              <th className="p-4">Designation & Department</th>
                              <th className="p-4">Salary Base Rate</th>
                              <th className="p-4">Statutory opt-ins</th>
                              <th className="p-4">Joining Date</th>
                              <th className="p-4 text-right">Directory actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-slate-800 text-xs font-sans">
                            {filteredEmployeesList.map(emp => (
                              <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-4">
                                  <div>
                                    <span className="font-bold text-gray-900 block">{emp.name}</span>
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 mt-0.5">
                                      <span>{emp.id}</span>
                                      <span>•</span>
                                      <span className="text-emerald-700 uppercase font-bold">{emp.company}</span>
                                    </div>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <div>
                                    <span className="font-medium block text-gray-700">{emp.designation}</span>
                                    <span className="text-[10px] text-gray-400 block mt-0.5">{emp.department}</span>
                                  </div>
                                </td>

                                <td className="p-4 font-mono font-bold text-slate-700">
                                  <div>
                                    <span>₹{emp.base_salary.toLocaleString('en-IN')}/mo</span>
                                    <p className="text-[9px] text-gray-400 block mt-0.5">Gross rates: ₹{emp.base_salary + emp.hra + emp.special_allowance + (emp.conveyance_allowance || 0) + (emp.medical_allowance || 0) + (emp.edu_allowance || 0)}</p>
                                  </div>
                                </td>

                                <td className="p-4">
                                  <div className="flex gap-1.5">
                                    {emp.pf_opt_in && (
                                      <span className="px-1.5 py-0.5 bg-blue-50 border border-blue-100 text-[9px] font-bold text-blue-700 rounded uppercase font-mono">pf</span>
                                    )}
                                    {emp.esic_opt_in && (
                                      <span className="px-1.5 py-0.5 bg-purple-50 border border-purple-100 text-[9px] font-bold text-purple-700 rounded uppercase font-mono">esic</span>
                                    )}
                                    {emp.professional_tax_opt_in && (
                                      <span className="px-1.5 py-0.5 bg-gray-100 border text-[9px] font-bold text-gray-700 rounded uppercase font-mono">pt</span>
                                    )}
                                  </div>
                                </td>

                                <td className="p-4 font-mono text-[11px] text-gray-450">
                                  {emp.joining_date}
                                </td>

                                <td className="p-4 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button
                                      onClick={() => fetchEmployeeProfileData(emp)}
                                      className="text-emerald-600 hover:text-emerald-800 p-1.5 hover:bg-emerald-50 transition rounded-lg cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
                                      title="View detailed employee profile, monthly ledger, bank salary details and loan accounts"
                                    >
                                      <FileText size={13} />
                                      <span>Profile Ledger</span>
                                    </button>

                                    <button
                                      onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                                      className="text-gray-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 transition rounded-lg cursor-pointer"
                                      title="Delete employee profile"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {filteredEmployeesList.length === 0 && (
                              <tr>
                                <td colSpan={6} className="text-center py-12 text-gray-400 font-sans">
                                  Zero employee matches found in active SVN/Sakar directory.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* YEAR COMPLETE ATTENDANCE TAB PANEL */}
              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  {/* Attendance Sub-tabs selection */}
                  <div className="flex border-b border-gray-150 gap-4 pb-2 items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAttendanceSubTab('monthly')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer select-none ${attendanceSubTab === 'monthly' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        Monthly Register (All Staff)
                      </button>
                      <button
                        onClick={() => setAttendanceSubTab('yearly')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer select-none ${attendanceSubTab === 'yearly' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        Annual Calendar (Single Employee)
                      </button>
                      <button
                        onClick={() => setAttendanceSubTab('corrections')}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer select-none ${attendanceSubTab === 'corrections' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                      >
                        Miss Punch Regularizations (मिस पंच सुधार)
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider hidden md:inline">
                      Unit: {activeCompany} • Active Month: {activeMonth}
                    </span>
                  </div>

                  {attendanceSubTab === 'monthly' ? (
                    <AttendanceSheet 
                      employees={employees}
                      onFetchAttendance={handleFetchAttendanceSub}
                      onSaveAttendance={handleSaveAttendanceSub}
                      activeCompany={activeCompany}
                      activeMonth={activeMonth}
                    />
                  ) : attendanceSubTab === 'yearly' ? (
                    <FinancialYearAttendance 
                      employees={employees}
                      attendance={attendance}
                      activeCompany={activeCompany}
                      onSaveAttendance={handleSaveAttendanceSub}
                    />
                  ) : (
                    <div className="bg-white p-6 border border-slate-200/80 rounded-3xl shadow-sm space-y-4">
                      <div className="border-b pb-3 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <h3 className="font-extrabold text-slate-950 text-sm flex items-center gap-2">
                            <Clock size={16} className="text-emerald-500" />
                            Miss Punch Regularization Approval Desk (मिस पंच सुधार डेस्क)
                          </h3>
                          <p className="text-slate-400 text-xs mt-0.5">
                            Approve or reject attendance correction files. Approved corrections will sync with the employee's active records.
                          </p>
                        </div>
                        <button
                          onClick={fetchCorrectionsList}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold rounded-xl transition cursor-pointer shadow-sm select-none"
                        >
                          <RefreshCw size={13} className={loadingCorrections ? 'animate-spin' : ''} />
                          <span>Refresh List</span>
                        </button>
                      </div>

                      {loadingCorrections ? (
                        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                          <span className="text-xs text-slate-450">Fetching regularization requests...</span>
                        </div>
                      ) : correctionsList.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 space-y-1 select-none">
                          <CheckCircle size={36} className="mx-auto text-emerald-500/30" />
                          <p className="text-sm font-bold text-slate-500">All Clear! No Pending Corrections</p>
                          <p className="text-xs text-slate-400">Any submitted Miss Punch requests from the Employee Portal will appear here.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto border border-slate-200/60 rounded-2xl">
                          <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 font-sans font-extrabold text-slate-400 uppercase tracking-wider select-none">
                                <th className="p-4">Staff Details</th>
                                <th className="p-4">Work Date</th>
                                <th className="p-4">Correction details</th>
                                <th className="p-4">Reason / Remarks</th>
                                <th className="p-4">Approval Routing</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {correctionsList.map((corr: any) => (
                                <tr key={corr.id} className="hover:bg-slate-50/40 transition">
                                  <td className="p-4">
                                    <div className="font-bold text-slate-900">{corr.employee_name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">Code: {corr.employee_id} • <span className="uppercase text-emerald-600 font-bold">{corr.company}</span></div>
                                  </td>
                                  <td className="p-4 font-mono font-bold text-slate-700">
                                    {corr.date}
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 rounded font-mono text-[10px] font-bold uppercase">{corr.original_status}</span>
                                      <span className="text-slate-400">→</span>
                                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded font-mono text-[10px] font-bold uppercase">{corr.requested_status}</span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-slate-600 italic">
                                    &ldquo;{corr.reason}&rdquo;
                                  </td>
                                  <td className="p-4 text-[11px] text-slate-500">
                                    {corr.reporting_hod_name ? (
                                      <div>
                                        HOD: <strong className="text-slate-700 font-bold">{corr.reporting_hod_name}</strong>
                                        <div className="text-[10px] text-slate-400 mt-0.5 font-mono">({corr.reporting_hod})</div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400">Direct routing</span>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    {corr.status === 'APPROVED' ? (
                                      <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-mono uppercase">
                                        <CheckCircle size={11} /> Approved
                                      </span>
                                    ) : corr.status.startsWith('REJECTED') ? (
                                      <span className="inline-flex items-center gap-1.5 text-[10px] text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100 font-mono uppercase" title={corr.status}>
                                        <XCircle size={11} /> {corr.status === 'REJECTED_HOD' ? 'Rejected by HOD' : corr.status === 'REJECTED_HR' ? 'Rejected by HR' : 'Rejected'}
                                      </span>
                                    ) : corr.status === 'PENDING_HOD' ? (
                                      <span className="inline-flex items-center gap-1.5 text-[10px] text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 font-mono uppercase" title="Routed to HOD">
                                        <Clock size={11} /> Pending HOD
                                      </span>
                                    ) : corr.status === 'PENDING_HR' ? (
                                      <span className="inline-flex items-center gap-1.5 text-[10px] text-purple-700 font-bold bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100 font-mono uppercase" title="Routed to HR">
                                        <Clock size={11} /> Pending HR
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 text-[10px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 font-mono uppercase">
                                        <Clock size={11} /> Pending Review
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right">
                                    {(corr.status === 'PENDING' || corr.status === 'PENDING_HR' || corr.status === 'PENDING_HOD') && (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button 
                                          onClick={() => handleUpdateCorrectionStatus(corr.id, 'APPROVE')}
                                          className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition cursor-pointer shadow-xs"
                                          title={corr.status === 'PENDING_HOD' ? "HR Override Approve" : "Approve Correction"}
                                        >
                                          <Check size={12} />
                                        </button>
                                        <button 
                                          onClick={() => handleUpdateCorrectionStatus(corr.id, 'REJECT')}
                                          className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition cursor-pointer shadow-xs"
                                          title={corr.status === 'PENDING_HOD' ? "HR Override Reject" : "Reject Correction"}
                                        >
                                          <XCircle size={12} />
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* MONTH PROCESS WAGES TAB PANEL */}
              {activeTab === 'payroll' && (
                <div className="space-y-6">
                  <PayrollRegister
                    employees={employees}
                    payrollRuns={payrollRuns}
                    slips={monthlySlips}
                    activeMonth={activeMonth}
                    activeCompany={activeCompany}
                    onCalculatePayroll={handleCalculatePayrollSub}
                    onClosePayroll={handleClosePayrollSub}
                    onNavigate={setActiveTab}
                    setActiveMonth={setActiveMonth}
                    onRefresh={fetchPayrollRuns}
                    activeHR={activeHR}
                  />
                </div>
              )}

              {/* LEAVES TAB CONTROLLER PANEL */}
              {activeTab === 'leaves' && (
                <div className="space-y-6">
                  <LeavesController
                    employees={employees}
                    applications={leaveApps}
                    attendance={attendance}
                    activeCompany={activeCompany}
                    sessionMode={currentSessionMode === 'HR' ? (activeHR?.role === 'MANAGEMENT' ? 'MANAGEMENT' : 'HR') : 'EMPLOYEE'}
                    loggedInEmployeeId={loggedInEmployee?.id}
                    onAddLeave={handleAddLeave}
                    onUpdateStatus={handleUpdateLeaveStatus}
                  />
                </div>
              )}

              {/* FACTORY GATE PASS TAB PANEL */}
              {activeTab === 'gatepass' && (
                <div className="space-y-6">
                  <FactoryGatePassView
                    employees={employees}
                    companies={companies}
                    gatePasses={gatePasses}
                    activeCompany={activeCompany}
                    sessionMode={currentSessionMode === 'HR' ? (activeHR?.role === 'MANAGEMENT' ? 'MANAGEMENT' : 'HR') : 'EMPLOYEE'}
                    loggedInEmployeeId={loggedInEmployee?.id}
                    activeHR={activeHR}
                    onRefresh={fetchGatePasses}
                  />
                </div>
              )}

              {/* FORM 16 WORK SHEET PANEL */}
              {activeTab === 'form16' && (
                <div className="space-y-6">
                  <Form16Portal
                    employees={employees}
                    activeCompany={activeCompany}
                    onFetchForm16={handleFetchForm16Sub}
                  />
                </div>
              )}

              {/* RETIRE EXIT F&F SETTLE PANEL */}
              {activeTab === 'ff' && (
                <div className="space-y-6">
                  <FAndFController
                    employees={employees}
                    ffRecords={ffRecords}
                    activeCompany={activeCompany}
                    onCalculateFF={handleCalculateFFSub}
                    onCommitFF={handleCommitFFSub}
                  />
                </div>
              )}

              {/* ORGANIZATION STRUCTURE HIERARCHY */}
              {activeTab === 'org' && (
                <div className="space-y-6">
                  <OrganizationStructure 
                    employees={employees}
                    activeCompany={activeCompany}
                  />
                </div>
              )}

              {/* COMPANY MASTER MODULE */}
              {activeTab === 'companies' && (
                <div className="space-y-6">
                  <CompanyMasterView 
                    companies={companies}
                    activeHR={activeHR}
                    onRefresh={fetchCompanies}
                    successBanner={successBanner}
                    setSuccessBanner={setSuccessBanner}
                  />
                </div>
              )}

              {/* SYSTEM AUDIT LOGS AND COMPLIANCE TOOLS */}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  <AuditBackupsView 
                    activeMonth={activeMonth}
                    activeCompany={activeCompany}
                    activeHR={activeHR}
                  />
                </div>
              )}

              {/* HR DOCUMENT LETTERS AND COMMUNICATION HUB */}
              {activeTab === 'letters' && (
                <div className="space-y-6">
                  <HRLettersHub 
                    employees={employees}
                    activeMonth={activeMonth}
                    activeCompany={activeCompany}
                    activeHR={activeHR}
                  />
                </div>
              )}

              {/* SQL INTERACTIVE CONSOLE MODULE */}
              {activeTab === 'sql' && (
                <div className="space-y-6">
                  <SqlConsole />
                </div>
              )}

              {/* DATABASE HEALTH VIEW */}
              {activeTab === 'dbhealth' && (
                <DatabaseHealthView 
                  employeesCount={employees.length}
                  onRefreshAll={() => {
                    fetchEmployees();
                    fetchLeaveApps();
                    fetchPayrollRuns();
                    fetchFAndF();
                    fetchLoans();
                    fetchRevisions();
                  }}
                />
              )}

              {/* USER ROLE MASTER MODULE */}
              {activeTab === 'users' && (
                <div className="space-y-6">
                  <UserRoleMasterView activeOperator={activeHR} />
                </div>
              )}

              {/* HOD MASTER MODULE */}
              {activeTab === 'hods' && (
                <div className="space-y-6">
                  <HODMasterView activeOperator={activeHR} />
                </div>
              )}

              {/* SHIFT MASTER MODULE */}
              {activeTab === 'shifts' && (
                <div className="space-y-6">
                  <ShiftMasterView 
                    activeOperator={activeHR} 
                    onRefreshEmployees={fetchEmployees}
                  />
                </div>
              )}

              {/* SYSTEM OPERATION GUIDE MANUAL */}
              {activeTab === 'guide' && (
                <UserGuideView />
              )}

              {/* BUSINESS LOGIC COMPLIANCE VAULT */}
              {activeTab === 'vault' && (
                <BusinessLogicVault activeOperator={activeHR} />
              )}

              {/* WORKFORCE MODULE */}
              {activeTab === 'workforce' && (
                <WorkforceModule
                  employees={employees}
                  attendance={attendance}
                  activeCompany={activeCompany}
                  activeHR={activeHR}
                  activeMonth={activeMonth}
                  setActiveMonth={setActiveMonth}
                  successBanner={successBanner}
                  setSuccessBanner={setSuccessBanner}
                  errorBanner={errorBanner}
                  setErrorBanner={setErrorBanner}
                  onRefresh={() => { fetchEmployees(); }}
                />
              )}

            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* SPREADSHEET PASTE DATA BULK EXCEL DIALOG wrapper */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        activeCompany={activeCompany}
        onImportSuccess={fetchEmployees}
      />

      {/* ADD/MANAGE DEPARTMENT DIALOG FORM */}
      <AnimatePresence>
        {isDeptModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="bg-blue-800 p-4.5 text-white flex justify-between items-center select-none">
                <div>
                  <h3 className="font-bold font-display text-sm tracking-tight">Add Dynamic Department</h3>
                  <p className="text-[10px] text-blue-100">Create new department for Sakar / SVN electricals employee directories</p>
                </div>
                <button 
                  onClick={() => {
                    setIsDeptModalOpen(false);
                    setNewDeptName('');
                  }} 
                  className="p-1.5 hover:bg-blue-700 rounded text-blue-100 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateDepartment} className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Department Name</label>
                  <input
                    type="text"
                    required
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="e.g. Quality Assurance"
                    className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border text-[11px] text-slate-500 space-y-1">
                  <span className="font-bold text-[10px] text-slate-600 block uppercase">Existing Departments</span>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto pt-1">
                    {departments.map((dept) => (
                      <span key={dept} className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md text-[10px] font-semibold">
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeptModalOpen(false);
                      setNewDeptName('');
                    }}
                    className="px-4 py-2 border text-xs text-gray-500 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    Save Department
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MANUAL EMPLOYEE DIALOG FORM FOR INDIVIDUAL ENTRY */}
      <AnimatePresence>
        {isNewEmpOpen && (
          <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden mt-10 mb-10"
            >
              <div className="bg-emerald-700 p-4.5 text-white flex justify-between items-center select-none">
                <div>
                  <h3 className="font-bold font-display text-sm tracking-tight">Manual Staff Registry entry</h3>
                  <p className="text-[10px] text-emerald-100">Configure base salary, allowances, and statutory parameters immediately</p>
                </div>
                <button 
                  onClick={() => setIsNewEmpOpen(false)}
                  className="p-1 hover:bg-emerald-850 rounded text-emerald-200 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Live Calculation variables */}
              {(() => {
                const sets = getCompanySettings(manualUnit);
                const liveHra = manualHra !== '' ? Number(manualHra) : Math.round(Number(manualBaseSalary) * (sets.salary_hra_percent / 100));
                const liveDa = 0;
                const liveSpecial = manualSpecialAllowance !== '' ? Number(manualSpecialAllowance) : Math.round(Number(manualBaseSalary) * (sets.salary_special_percent / 100));
                const liveEdu = Number(manualEduAllowance) || 0;
                const liveMedical = Number(manualMedicalAllowance) || 0;
                const liveConveyance = Number(manualConveyanceAllowance) || 0;
                const liveBonus = Math.round(Number(manualBaseSalary) * 0.0833);

                const liveGross = Number(manualBaseSalary) + liveHra + liveDa + liveSpecial + liveEdu + liveMedical + liveConveyance;
                
                const liveEmpPf = manualPfOptIn ? Math.round((Number(manualBaseSalary) + liveDa) * 0.12) : 0;
                const liveEmployerPf = manualPfOptIn ? Math.round((Number(manualBaseSalary) + liveDa) * (sets.pf_employer_rate / 100)) : 0;

                const liveEmpEsic = (manualEsicOptIn && liveGross <= sets.esic_opt_in_threshold) ? Math.round(liveGross * 0.0075) : 0;
                const liveEmployerEsic = (manualEsicOptIn && liveGross <= sets.esic_opt_in_threshold) ? Math.round(liveGross * (sets.esic_employer_rate / 100)) : 0;

                const liveCtc = liveGross + liveEmployerPf + liveEmployerEsic + liveBonus;

                return (
                  <form onSubmit={handleCreateEmployeeSubmit} className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
                    
                    {/* SECTION 1: Personal & Job Information */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider border-b pb-1">1. Personal & Job Information</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Employee Code *</label>
                          <input 
                            type="text" 
                            required
                            value={manualId} 
                            onChange={(e) => setManualId(e.target.value)} 
                            placeholder="e.g. EMP006" 
                            className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 font-bold text-slate-800"
                          />
                        </div>

                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Employee full name *</label>
                          <input 
                            type="text" 
                            required
                            value={manualName} 
                            onChange={(e) => setManualName(e.target.value)} 
                            placeholder="e.g. Ramesh Chandra" 
                            className="w-full text-xs p-2 border rounded-lg focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Designation *</label>
                          <input 
                            type="text" 
                            required
                            value={manualDesignation} 
                            onChange={(e) => setManualDesignation(e.target.value)} 
                            placeholder="e.g. Wire Specialist" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Department</label>
                          <select
                            value={manualDept}
                            onChange={(e) => setManualDept(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg bg-white"
                          >
                            {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Date of Joining *</label>
                          <input 
                            type="date" 
                            required
                            value={manualDOJ} 
                            onChange={(e) => setManualDOJ(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Corporate Unit</label>
                          <select
                            value={manualUnit}
                            onChange={(e) => setManualUnit(e.target.value as any)}
                            className="w-full text-xs p-2 border rounded-lg bg-white font-bold"
                          >
                            <option value="SVN-1">SVN-1</option>
                            <option value="SVN II">SVN II</option>
                            <option value="Sakar I">Sakar I</option>
                            <option value="Sakar III">Sakar III</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Mobile Phone</label>
                          <input 
                            type="text" 
                            value={manualPhone} 
                            onChange={(e) => setManualPhone(e.target.value)} 
                            placeholder="9955440022" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Birth Year *</label>
                          <input 
                            type="number" 
                            required
                            min={1940}
                            max={2015}
                            value={manualBirthYear} 
                            onChange={(e) => setManualBirthYear(e.target.value !== '' ? Number(e.target.value) : '')} 
                            placeholder="1995" 
                            className="w-full text-xs p-2 border rounded-lg font-mono font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Email ID</label>
                          <input 
                            type="email" 
                            value={manualEmail} 
                            onChange={(e) => setManualEmail(e.target.value)} 
                            placeholder="ramesh@sakarelectricals.com" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* SECTION 1B: Identity & Extended Personal Details */}
                    <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider border-b pb-1">1B. Identity & Extended Personal Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Aadhaar Number</label>
                          <input 
                            type="text" 
                            value={manualAadhaar} 
                            onChange={(e) => setManualAadhaar(e.target.value)} 
                            placeholder="12-digit Aadhaar" 
                            className="w-full text-xs p-2 border rounded-lg font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Date of Birth</label>
                          <input 
                            type="date" 
                            value={manualDOB} 
                            onChange={(e) => setManualDOB(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Gender</label>
                          <select 
                            value={manualGender} 
                            onChange={(e) => setManualGender(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg bg-white"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Marital Status</label>
                          <select 
                            value={manualMaritalStatus} 
                            onChange={(e) => setManualMaritalStatus(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg bg-white"
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Emergency Contact Name/No.</label>
                          <input 
                            type="text" 
                            value={manualEmergencyContact} 
                            onChange={(e) => setManualEmergencyContact(e.target.value)} 
                            placeholder="Name & Relationship / Phone" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Blood Group</label>
                          <select 
                            value={manualBloodGroup} 
                            onChange={(e) => setManualBloodGroup(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg bg-white font-semibold text-slate-700"
                          >
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">ESIC Number</label>
                          <input 
                            type="text" 
                            value={manualEsicNumber} 
                            onChange={(e) => setManualEsicNumber(e.target.value)} 
                            placeholder="17-digit ESIC No." 
                            className="w-full text-xs p-2 border rounded-lg font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Cost Center</label>
                          <input 
                            type="text" 
                            value={manualCostCenter} 
                            onChange={(e) => setManualCostCenter(e.target.value)} 
                            placeholder="e.g. Unit-I Production" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Reporting Manager</label>
                          <input 
                            type="text" 
                            value={manualReportingManager} 
                            onChange={(e) => setManualReportingManager(e.target.value)} 
                            placeholder="Supervisor Name" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Reporting HOD Code</label>
                          <input 
                            type="text" 
                            value={manualReportingHod} 
                            onChange={(e) => setManualReportingHod(e.target.value)} 
                            placeholder="e.g. EMP002" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Reporting HOD Name</label>
                          <input 
                            type="text" 
                            value={manualReportingHodName} 
                            onChange={(e) => setManualReportingHodName(e.target.value)} 
                            placeholder="e.g. Vishnu Sakar" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Employee Category</label>
                          <select 
                            value={manualEmployeeCategory} 
                            onChange={(e) => setManualEmployeeCategory(e.target.value as any)} 
                            className="w-full text-xs p-2 border rounded-lg bg-white font-bold"
                          >
                            <option value="Staff">Staff</option>
                            <option value="Worker">Worker</option>
                            <option value="Contract">Contract</option>
                          </select>
                        </div>

                        {/* Photo upload and HOD role settings */}
                        <div className="col-span-2 border-t pt-3 mt-1 grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block">Employee Photo (कर्मचारी की फोटो)</label>
                            <div className="flex items-center gap-2">
                              {manualPhoto ? (
                                <img src={manualPhoto} alt="Employee Preview" className="w-10 h-10 rounded-full object-cover border" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-slate-400 font-bold text-[10px]">No Pic</div>
                              )}
                              <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setManualPhoto(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300 flex-1"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 flex flex-col justify-center">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={manualIsHod} 
                                onChange={(e) => {
                                  setManualIsHod(e.target.checked);
                                  if (!e.target.checked) {
                                    setManualCanApproveLeave(false);
                                    setManualCanApproveMissPunch(false);
                                  }
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <div className="text-xs">
                                <span className="font-bold text-slate-800 block">Is HOD (HOD है)</span>
                                <span className="text-[10px] text-slate-400">Can act as a reporting HOD</span>
                              </div>
                            </label>

                            {manualIsHod && (
                              <div className="pl-6 space-y-1 border-l border-slate-200/60 ml-2">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input 
                                    type="checkbox" 
                                    checked={manualCanApproveLeave} 
                                    onChange={(e) => setManualCanApproveLeave(e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                                  />
                                  <span className="text-[11px] font-medium text-slate-700">Can Approve Leaves</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                  <input 
                                    type="checkbox" 
                                    checked={manualCanApproveMissPunch} 
                                    onChange={(e) => setManualCanApproveMissPunch(e.target.checked)}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                                  />
                                  <span className="text-[11px] font-medium text-slate-700">Can Approve Miss Punches</span>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 2: Professional & Address Details */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider border-b pb-1">2. Professional & Address Details</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Qualification & Degrees</label>
                          <input 
                            type="text" 
                            value={manualQualification} 
                            onChange={(e) => setManualQualification(e.target.value)} 
                            placeholder="e.g. B.Tech (Electrical Engineering)" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Work Location</label>
                          <input 
                            type="text" 
                            value={manualLocation} 
                            onChange={(e) => setManualLocation(e.target.value)} 
                            placeholder="e.g. Halol Unit I" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Vehicle Detail</label>
                          <input 
                            type="text" 
                            value={manualVehicleDetail} 
                            onChange={(e) => setManualVehicleDetail(e.target.value)} 
                            placeholder="e.g. GJ-06-HM-1234" 
                            className="w-full text-xs p-2 border rounded-lg font-mono uppercase"
                          />
                        </div>

                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Previous Employer Name</label>
                          <input 
                            type="text" 
                            value={manualPrevCompanyName} 
                            onChange={(e) => setManualPrevCompanyName(e.target.value)} 
                            placeholder="e.g. ABB India Ltd" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1 col-span-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Previous Company Location</label>
                          <input 
                            type="text" 
                            value={manualPrevCompanyLocation} 
                            onChange={(e) => setManualPrevCompanyLocation(e.target.value)} 
                            placeholder="e.g. Vadodara, Gujarat" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1 col-span-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Total Experience</label>
                          <input 
                            type="text" 
                            value={manualTotalExperience} 
                            onChange={(e) => setManualTotalExperience(e.target.value)} 
                            placeholder="e.g. 5.5 Years" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Shift Timing Selection block */}
                      <div className="grid grid-cols-1 gap-3 border-t pt-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-amber-700 uppercase block">Shift Timing (Work Schedule)</label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={manualShiftTiming}
                              onChange={(e) => setManualShiftTiming(e.target.value)}
                              placeholder="e.g. 8:00 AM to 5:30 PM, or write your own"
                              className="flex-1 text-xs p-2 border border-amber-200 bg-amber-50/50 rounded-lg text-amber-950 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] text-amber-800 font-bold uppercase mr-1 sm:ml-2">Quick Presets:</span>
                              {[
                                '8:00 AM to 5:30 PM',
                                '9:00 AM to 6:30 PM',
                                '8:00 AM to 8:00 PM'
                              ].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setManualShiftTiming(preset)}
                                  className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition border ${
                                    manualShiftTiming === preset
                                      ? 'bg-amber-600 text-white border-amber-600'
                                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="text-[9px] text-gray-500">
                            You can type <strong>any shift timing</strong> according to your requirements (e.g. <em>Morning 8 to 5.30</em>, etc.) or click a preset to apply instantly.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 3: Statutory & Banking Details */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider border-b pb-1">3. Statutory & Banking Details</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">PAN Card Number</label>
                          <input 
                            type="text" 
                            value={manualPan} 
                            onChange={(e) => setManualPan(e.target.value)} 
                            placeholder="BKPPS1204D" 
                            className="w-full text-xs p-2 border rounded-lg uppercase font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">UAN (Provident Fund)</label>
                          <input 
                            type="text" 
                            value={manualUan} 
                            onChange={(e) => setManualUan(e.target.value)} 
                            placeholder="100985412" 
                            className="w-full text-xs p-2 border rounded-lg font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Form / Document Type</label>
                          <input 
                            type="text" 
                            value={manualForm} 
                            onChange={(e) => setManualForm(e.target.value)} 
                            placeholder="Form-16" 
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1 col-span-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Bank Name</label>
                          <input 
                            type="text" 
                            value={manualBankName} 
                            onChange={(e) => setManualBankName(e.target.value)} 
                            placeholder="HDFC Bank"
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1 col-span-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Bank Account Number</label>
                          <input 
                            type="text" 
                            value={manualBankAccount} 
                            onChange={(e) => setManualBankAccount(e.target.value)} 
                            placeholder="0004015682"
                            className="w-full text-xs p-2 border rounded-lg font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">Bank IFSC Code</label>
                          <input 
                            type="text" 
                            value={manualIfsc} 
                            onChange={(e) => setManualIfsc(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg uppercase font-mono"
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-xl border flex flex-wrap gap-x-6 gap-y-2 select-none">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                          <input 
                            type="checkbox" 
                            checked={manualPfOptIn} 
                            onChange={(e) => setManualPfOptIn(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                          />
                          <span>EPF (Provident Fund) Applicable</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                          <input 
                            type="checkbox" 
                            checked={manualEsicOptIn} 
                            onChange={(e) => setManualEsicOptIn(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                          />
                          <span>ESIC Applicable</span>
                        </label>

                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                          <input 
                            type="checkbox" 
                            checked={manualPtOptIn} 
                            onChange={(e) => setManualPtOptIn(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                          />
                          <span>Professional Tax (PT)</span>
                        </label>
                      </div>
                    </div>

                    {/* SECTION 4: Salary Structure & Allowances */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider border-b pb-1">4. Salary Structure & Allowances</h4>
                      
                      {renderSalaryStructureEditor(false)}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Standard CTC (SCTC)</label>
                          <input 
                            type="number" 
                            value={manualSctc} 
                            onChange={(e) => setManualSctc(e.target.value === '' ? '' : Number(e.target.value))} 
                            placeholder="e.g. 35000"
                            className="w-full text-xs p-2 border rounded-lg font-mono font-semibold text-emerald-700"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Bonus Payable</label>
                          <input 
                            type="number" 
                            value={manualBonusPayable} 
                            onChange={(e) => setManualBonusPayable(e.target.value === '' ? '' : Number(e.target.value))} 
                            placeholder="e.g. 2100"
                            className="w-full text-xs p-2 border rounded-lg font-mono"
                          />
                        </div>
                      </div>

                      {/* Live Calculation Preview Block */}
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-3.5 select-none mt-2">
                        <div className="flex justify-between items-center border-b border-emerald-100 pb-2">
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                            <Sparkles size={14} />
                            Real-time Payroll & CTC Simulator
                          </span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase font-mono">LIVE PREVIEW</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                          <div>
                            <span className="text-gray-500 block text-[10px] uppercase font-semibold">Total Gross Rate</span>
                            <strong className="text-slate-900 text-sm font-mono">₹{liveGross.toLocaleString('en-IN')}</strong>
                          </div>

                          <div>
                            <span className="text-gray-500 block text-[10px] uppercase font-semibold">EPF (12% of B+DA)</span>
                            <strong className="text-slate-900 text-sm font-mono">₹{liveEmpPf.toLocaleString('en-IN')}</strong>
                            <p className="text-[9px] text-gray-400">Employer pays ₹{liveEmployerPf}</p>
                          </div>

                          <div>
                            <span className="text-gray-500 block text-[10px] uppercase font-semibold">ESIC Contri</span>
                            <strong className="text-slate-900 text-sm font-mono">₹{liveEmpEsic.toLocaleString('en-IN')}</strong>
                            {manualEsicOptIn && liveGross <= 21000 ? (
                              <p className="text-[9px] text-gray-400">Employer pays ₹{liveEmployerEsic}</p>
                            ) : (
                              <p className="text-[9px] text-rose-600 font-semibold">Inapplicable (Gross &gt; 21k)</p>
                            )}
                          </div>

                          <div>
                            <span className="text-gray-500 block text-[10px] uppercase font-semibold text-emerald-800">Computed CTC</span>
                            <strong className="text-emerald-700 text-sm font-mono font-bold">₹{liveCtc.toLocaleString('en-IN')}</strong>
                            <p className="text-[9px] text-gray-400">Gross + EPF + ESIC + Bonus</p>
                          </div>
                        </div>
                        
                        <div className="bg-emerald-50/20 p-2.5 rounded-lg border border-emerald-100/50 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide block">CTC Salary Status</span>
                          <span className="text-[9px] font-mono font-extrabold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded uppercase">🔒 LOCKED & SYSTEM CALCULATED</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <button 
                        type="button" 
                        onClick={() => setIsNewEmpOpen(false)}
                        className="px-4 py-2 border text-xs text-gray-500 rounded-xl hover:bg-gray-50 transition cursor-pointer"
                      >
                        Close
                      </button>
                      <button 
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-semibold rounded-xl transition cursor-pointer"
                      >
                        Submit Register
                      </button>
                    </div>

                  </form>
                );
              })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED EMPLOYEE PROFILE & SALARY/ATTENDANCE LEDGER MODAL */}
      <AnimatePresence>
        {selectedEmployeeProfile && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-50 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-emerald-800 p-5 text-white flex justify-between items-start select-none shrink-0">
                <div className="flex items-center gap-4">
                  {selectedEmployeeProfile.photo ? (
                    <img 
                      src={selectedEmployeeProfile.photo} 
                      alt={selectedEmployeeProfile.name} 
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400/80 shadow-md" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-emerald-900/80 border border-emerald-600/50 flex items-center justify-center text-emerald-200 font-bold text-sm tracking-wide uppercase select-none">
                      {selectedEmployeeProfile.name.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-emerald-900 border border-emerald-600 rounded text-[9px] font-bold uppercase tracking-widest">{selectedEmployeeProfile.company}</span>
                      <span className="text-emerald-300 font-mono text-xs">{selectedEmployeeProfile.id}</span>
                    </div>
                    <h3 className="font-bold font-display text-lg tracking-tight mt-1">{selectedEmployeeProfile.name}</h3>
                    <p className="text-xs text-emerald-100/80">{selectedEmployeeProfile.designation} • {selectedEmployeeProfile.department}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployeeProfile(null)}
                  className="p-1.5 hover:bg-emerald-900/60 rounded-xl text-emerald-200 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-6 overflow-y-auto space-y-6">
                
                {/* Section 1: Detailed Profile Card */}
                <div className="bg-white p-5 rounded-2xl border shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Official & Financial Profile Details</h4>
                    {!isEditingProfile ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(true)}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-200 flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>Edit Profile / Apply Increment</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-bold uppercase animate-pulse">Editing Master Data...</span>
                    )}
                  </div>

                  {!isEditingProfile ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-xs">
                      <div>
                        <span className="text-gray-400 block mb-0.5">Base Monthly Salary</span>
                        <strong className="text-slate-800 text-sm">₹{selectedEmployeeProfile.base_salary.toLocaleString('en-IN')}/mo</strong>
                        <span className="text-[10px] text-gray-400 block">
                          Gross Rate: ₹{(
                            selectedEmployeeProfile.base_salary +
                            (selectedEmployeeProfile.hra !== undefined ? selectedEmployeeProfile.hra : Math.round(selectedEmployeeProfile.base_salary * 0.40)) +
                            (selectedEmployeeProfile.special_allowance !== undefined ? selectedEmployeeProfile.special_allowance : Math.round(selectedEmployeeProfile.base_salary * 0.15)) +
                            (selectedEmployeeProfile.edu_allowance || 0) +
                            (selectedEmployeeProfile.medical_allowance || 0) +
                            (selectedEmployeeProfile.conveyance_allowance || 0)
                          ).toLocaleString('en-IN')}/mo
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Joining Date</span>
                        <strong className="text-slate-800 text-sm">{selectedEmployeeProfile.joining_date}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Email Address</span>
                        <strong className="text-slate-800 text-sm break-all">{selectedEmployeeProfile.email || 'N/A'}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Mobile Phone</span>
                        <strong className="text-slate-800 text-sm">{selectedEmployeeProfile.phone || 'N/A'}</strong>
                      </div>

                      <div className="pt-2 border-t">
                        <span className="text-gray-400 block mb-0.5">PAN Card No.</span>
                        <strong className="text-slate-800 text-sm uppercase font-mono">{selectedEmployeeProfile.pan || 'N/A'}</strong>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-gray-400 block mb-0.5">UAN (Provident Fund)</span>
                        <strong className="text-slate-800 text-sm font-mono">{selectedEmployeeProfile.uan || 'N/A'}</strong>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-gray-400 block mb-0.5">Bank Name</span>
                        <strong className="text-slate-800 text-sm">{selectedEmployeeProfile.bank_name || 'N/A'}</strong>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-gray-400 block mb-0.5">Bank Account & IFSC</span>
                        <strong className="text-slate-800 text-sm block font-mono">{selectedEmployeeProfile.bank_account || 'N/A'}</strong>
                        <span className="text-[10px] text-emerald-700 font-bold font-mono">{selectedEmployeeProfile.ifsc || ''}</span>
                      </div>

                      {/* Educational & Professional details section */}
                      <div className="pt-2 border-t col-span-2">
                        <span className="text-gray-400 block mb-0.5">Qualification & Degrees</span>
                        <strong className="text-slate-800 text-sm">{selectedEmployeeProfile.qualification || 'N/A'}</strong>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-gray-400 block mb-0.5">Designated Work Location</span>
                        <strong className="text-slate-800 text-sm">{selectedEmployeeProfile.location || 'N/A'}</strong>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-gray-400 block mb-0.5">Vehicle Registration Detail</span>
                        <strong className="text-slate-800 text-sm font-mono">{selectedEmployeeProfile.vehicle_detail || 'N/A'}</strong>
                      </div>

                      <div className="pt-2 border-t col-span-2">
                        <span className="text-gray-400 block mb-0.5">Previous Employer Name</span>
                        <strong className="text-slate-800 text-sm">{selectedEmployeeProfile.prev_company_name || 'N/A'}</strong>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-gray-400 block mb-0.5">Previous Company Location</span>
                        <strong className="text-slate-800 text-sm">{selectedEmployeeProfile.prev_company_location || 'N/A'}</strong>
                      </div>
                      <div className="pt-2 border-t">
                        <span className="text-gray-400 block mb-0.5">Total Professional Experience</span>
                        <strong className="text-emerald-700 font-bold text-sm">{selectedEmployeeProfile.total_experience || 'N/A'}</strong>
                      </div>

                      {/* Phase 2 identity & personal information */}
                      <div className="col-span-4 bg-slate-50/70 p-4.5 rounded-2xl border border-gray-100 grid grid-cols-2 md:grid-cols-5 gap-4 mt-2">
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Aadhaar Number</span>
                          <strong className="text-slate-800 text-xs font-mono">{selectedEmployeeProfile.aadhaar_number || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Date of Birth</span>
                          <strong className="text-slate-800 text-xs">{selectedEmployeeProfile.dob || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Gender & Marital</span>
                          <strong className="text-slate-800 text-xs">{selectedEmployeeProfile.gender || 'N/A'} ({selectedEmployeeProfile.marital_status || 'N/A'})</strong>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Emergency Contact</span>
                          <strong className="text-slate-800 text-xs">{selectedEmployeeProfile.emergency_contact || 'N/A'}</strong>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Blood Group</span>
                          <strong className="text-rose-600 font-bold text-xs">{selectedEmployeeProfile.blood_group || 'N/A'}</strong>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">ESIC Number</span>
                          <strong className="text-slate-800 text-xs font-mono">{selectedEmployeeProfile.esic_number || 'N/A'}</strong>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Cost Center</span>
                          <strong className="text-slate-800 text-xs">{selectedEmployeeProfile.cost_center || 'N/A'}</strong>
                        </div>
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Reporting Manager</span>
                          <strong className="text-slate-800 text-xs">{selectedEmployeeProfile.reporting_manager || 'N/A'}</strong>
                        </div>
                        <div className="pt-2 border-t border-gray-200 col-span-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-0.5">Employee Category</span>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px] tracking-wide uppercase">{selectedEmployeeProfile.employee_category || 'Staff'}</span>
                        </div>
                      </div>

                      {/* Shift Timing Display Block */}
                      <div className="pt-2 border-t col-span-4 bg-amber-50/50 p-3 rounded-xl flex items-center justify-between border border-amber-100/70 mt-1">
                        <div>
                          <span className="text-amber-800 font-bold block mb-0.5 text-[9px] uppercase tracking-wider">Shift Timing (Work Schedule)</span>
                          <strong className="text-amber-950 text-xs font-sans flex items-center gap-1.5">
                            <Clock size={13} className="text-amber-600 animate-pulse" />
                            {selectedEmployeeProfile.shift_timing || '8:00 AM to 5:30 PM'}
                          </strong>
                        </div>
                        <span className="text-[9px] text-amber-700 bg-amber-100/60 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          Active Shift
                        </span>
                      </div>

                      {/* Salary Components & Statutory Allowances Details Sub-section */}
                      <div className="pt-4 border-t col-span-4 bg-slate-50 p-4 rounded-xl space-y-3">
                        <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Salary Components & Statutory Configuration</h5>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                          <div>
                            <span className="text-gray-400 block mb-0.5">House Rent Allowance (HRA)</span>
                            <strong className="text-slate-800">₹{(selectedEmployeeProfile.hra !== undefined ? selectedEmployeeProfile.hra : Math.round(selectedEmployeeProfile.base_salary * 0.40)).toLocaleString('en-IN')}/mo</strong>
                          </div>

                          <div>
                            <span className="text-gray-400 block mb-0.5">Special Allowance</span>
                            <strong className="text-slate-800">₹{(selectedEmployeeProfile.special_allowance !== undefined ? selectedEmployeeProfile.special_allowance : Math.round(selectedEmployeeProfile.base_salary * 0.15)).toLocaleString('en-IN')}/mo</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Education Allowance</span>
                            <strong className="text-slate-800">₹{(selectedEmployeeProfile.edu_allowance || 0).toLocaleString('en-IN')}/mo</strong>
                          </div>

                          <div>
                            <span className="text-gray-400 block mb-0.5">Medical Allowance</span>
                            <strong className="text-slate-800">₹{(selectedEmployeeProfile.medical_allowance || 0).toLocaleString('en-IN')}/mo</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Conveyance Allowance</span>
                            <strong className="text-slate-800">₹{(selectedEmployeeProfile.conveyance_allowance || 0).toLocaleString('en-IN')}/mo</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Bonus Payable</span>
                            <strong className="text-slate-800">₹{(selectedEmployeeProfile.bonus_payable || 0).toLocaleString('en-IN')}</strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Standard CTC / SCTC</span>
                            <strong className="text-slate-800">₹{(selectedEmployeeProfile.sctc || 0).toLocaleString('en-IN')}/mo</strong>
                          </div>

                          <div>
                            <span className="text-gray-400 block mb-0.5">EPF Contribution (Opted In)</span>
                            <strong className={selectedEmployeeProfile.pf_opt_in ? "text-emerald-700 font-bold" : "text-gray-500 font-medium"}>
                              {selectedEmployeeProfile.pf_opt_in ? "Yes (12% of B+DA)" : "No"}
                            </strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">ESIC Contribution (Opted In)</span>
                            <strong className={selectedEmployeeProfile.esic_opt_in ? "text-emerald-700 font-bold" : "text-gray-500 font-medium"}>
                              {selectedEmployeeProfile.esic_opt_in ? "Yes (0.75% of Gross)" : "No"}
                            </strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">Professional Tax (PT)</span>
                            <strong className={selectedEmployeeProfile.professional_tax_opt_in ? "text-emerald-700 font-bold" : "text-gray-500 font-medium"}>
                              {selectedEmployeeProfile.professional_tax_opt_in ? "Yes (Slab-based)" : "No"}
                            </strong>
                          </div>
                          <div>
                            <span className="text-gray-400 block mb-0.5">CTC Salary</span>
                            <strong className="text-emerald-800 font-bold text-sm">₹{(
                              (() => {
                                const detEmp = selectedEmployeeProfile;
                                const detSets = getCompanySettings(detEmp.company);
                                const detBase = detEmp.base_salary;
                                const detHra = detEmp.hra !== undefined ? detEmp.hra : Math.round(detBase * (detSets.salary_hra_percent / 100));
                                const detDa = 0; // DA completely removed
                                const detSpecial = detEmp.special_allowance !== undefined ? detEmp.special_allowance : Math.round(detBase * (detSets.salary_special_percent / 100));
                                const detEdu = detEmp.edu_allowance || 0;
                                const detMedical = detEmp.medical_allowance || 0;
                                const detConveyance = detEmp.conveyance_allowance || 0;

                                const detGross = detBase + detHra + detSpecial + detDa + detEdu + detMedical + detConveyance;
                                const detEmployerPf = detEmp.pf_opt_in ? Math.round((detBase) * (detSets.pf_employer_rate / 100)) : 0;
                                const detEmployerEsic = (detEmp.esic_opt_in && detGross <= detSets.esic_opt_in_threshold) ? Math.round(detGross * (detSets.esic_employer_rate / 100)) : 0;
                                const detBonus = Math.round(detBase * 0.0833);

                                return detGross + detEmployerPf + detEmployerEsic + detBonus;
                              })()
                            ).toLocaleString('en-IN')}/mo</strong>
                          </div>
                        </div>

                        {/* Read-Only Calculation Breakdown Block */}
                        {(() => {
                          const detEmp = selectedEmployeeProfile;
                          const detSets = getCompanySettings(detEmp.company);
                          const detBase = detEmp.base_salary;
                          const detHra = detEmp.hra !== undefined ? detEmp.hra : Math.round(detBase * (detSets.salary_hra_percent / 100));
                          const detDa = 0; // DA completely removed
                          const detSpecial = detEmp.special_allowance !== undefined ? detEmp.special_allowance : Math.round(detBase * (detSets.salary_special_percent / 100));
                          const detEdu = detEmp.edu_allowance || 0;
                          const detMedical = detEmp.medical_allowance || 0;
                          const detConveyance = detEmp.conveyance_allowance || 0;

                          const detGross = detBase + detHra + detSpecial + detDa + detEdu + detMedical + detConveyance;
                          const detEmployerPf = detEmp.pf_opt_in ? Math.round((detBase) * (detSets.pf_employer_rate / 100)) : 0;
                          const detEmployerEsic = (detEmp.esic_opt_in && detGross <= detSets.esic_opt_in_threshold) ? Math.round(detGross * (detSets.esic_employer_rate / 100)) : 0;
                          const detBonus = Math.round(detBase * 0.0833);
                          const detCtc = detGross + detEmployerPf + detEmployerEsic + detBonus;

                          return (
                            <div className="mt-4 pt-4 border-t border-slate-200">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-2">
                                Read-Only CTC Calculation Breakdown
                              </span>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 bg-emerald-50/40 p-4 rounded-xl border border-emerald-100 font-sans text-xs">
                                <div className="space-y-1">
                                  <span className="text-gray-400 block font-semibold text-[9px] uppercase">Gross Salary</span>
                                  <strong className="text-slate-900 text-sm font-mono block">₹{detGross.toLocaleString('en-IN')}</strong>
                                  <p className="text-[8.5px] text-gray-500 leading-relaxed font-medium">Basic + HRA + Conv + Edu + Med + Spec</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-gray-400 block font-semibold text-[9px] uppercase">PF Employer</span>
                                  <strong className="text-slate-900 text-sm font-mono block">₹{detEmployerPf.toLocaleString('en-IN')}</strong>
                                  <p className="text-[8.5px] text-gray-500 leading-relaxed font-medium">@{detSets.pf_employer_rate}% of Basic</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-gray-400 block font-semibold text-[9px] uppercase">ESIC Employer</span>
                                  <strong className="text-slate-900 text-sm font-mono block">₹{detEmployerEsic.toLocaleString('en-IN')}</strong>
                                  <p className="text-[8.5px] text-gray-500 leading-relaxed font-medium">@{detSets.esic_employer_rate}% of Gross</p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-gray-400 block font-semibold text-[9px] uppercase">Bonus Payable</span>
                                  <strong className="text-slate-900 text-sm font-mono block">₹{detBonus.toLocaleString('en-IN')}</strong>
                                  <p className="text-[8.5px] text-gray-500 leading-relaxed font-medium">@{detSets.bonus_rate_percent}% of Basic</p>
                                </div>
                                <div className="space-y-1 bg-emerald-50 border border-emerald-100/50 p-2 rounded-lg">
                                  <span className="text-emerald-800 block font-bold text-[9px] uppercase">Computed CTC</span>
                                  <strong className="text-emerald-700 text-sm font-mono font-extrabold block">₹{detCtc.toLocaleString('en-IN')}</strong>
                                  <p className="text-[8.5px] text-emerald-600/80 leading-relaxed font-bold">Gross + PF + ESIC + Bonus</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleEditEmployeeSubmit} className="space-y-4 text-xs">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Employee Code</label>
                          <input
                            type="text"
                            required
                            disabled={activeHR?.role !== 'SUPER_HR'}
                            value={editId}
                            onChange={(e) => setEditId(e.target.value)}
                            placeholder="Employee Code"
                            className={`w-full text-xs p-2 border rounded-lg font-mono font-bold ${
                              activeHR?.role === 'SUPER_HR' 
                                ? 'bg-white text-slate-800 border-slate-300 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500' 
                                : 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                            }`}
                          />
                          {activeHR?.role !== 'SUPER_HR' && (
                            <span className="text-[8.5px] text-gray-400 block font-sans">Only Super HR can edit codes</span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Base Salary (Increment)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={editBaseSalary}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setEditBaseSalary(val);
                              if (editSalaryStructureType === 'PERCENTAGE' || editSalaryMode === 'percent') {
                                setEditHra(Math.round(val * 0.40));
                                setEditDa(0);
                                setEditSpecialAllowance(Math.round(val * 0.15));
                                setEditConveyanceAllowance(Math.round(val * 0.08));
                                setEditEduAllowance(Math.round(val * 0.02));
                                setEditMedicalAllowance(Math.round(val * 0.05));
                              }
                            }}
                            className="w-full text-xs p-2 border rounded-lg font-mono font-bold"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Designation</label>
                          <input
                            type="text"
                            required
                            value={editDesignation}
                            onChange={(e) => setEditDesignation(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Department</label>
                          <select
                            value={editDepartment}
                            onChange={(e) => setEditDepartment(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg bg-white font-semibold"
                          >
                            {departments.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Mobile Phone</label>
                          <input
                            type="text"
                            required
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Date of Joining</label>
                          <input
                            type="date"
                            required
                            value={editJoiningDate}
                            onChange={(e) => setEditJoiningDate(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Date of Leaving (Separation)</label>
                          <input
                            type="date"
                            value={editExitDate}
                            onChange={(e) => setEditExitDate(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      {/* Dynamic Salary Component modes: standard formula % vs manual feed lump-sum */}
                      <div className="space-y-3">
                        {renderSalaryStructureEditor(true)}

                        <div className="flex flex-wrap justify-between items-center bg-emerald-50/50 border border-emerald-100 p-3 px-4 rounded-xl text-xs font-sans">
                          <div className="flex gap-4">
                            <div>
                              <span className="text-gray-500 uppercase font-semibold text-[10px]">Base Salary: </span>
                              <strong className="font-mono text-slate-800">₹{Number(editBaseSalary).toLocaleString('en-IN')}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 uppercase font-semibold text-[10px]">Total Allowances: </span>
                              <strong className="font-mono text-slate-800">₹{(Number(editHra) + Number(editSpecialAllowance) + Number(editEduAllowance) + Number(editMedicalAllowance) + Number(editConveyanceAllowance)).toLocaleString('en-IN')}</strong>
                            </div>
                          </div>
                          <div className="text-slate-900">
                            <span className="text-emerald-800 uppercase font-bold text-[10px]">Calculated Gross Rate: </span>
                            <strong className="font-mono text-base text-slate-950 font-extrabold">₹{(Number(editBaseSalary) + Number(editHra) + Number(editSpecialAllowance) + Number(editEduAllowance) + Number(editMedicalAllowance) + Number(editConveyanceAllowance)).toLocaleString('en-IN')}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Email Address</label>
                          <input
                            type="email"
                            required
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">PAN Card No.</label>
                          <input
                            type="text"
                            required
                            value={editPan}
                            onChange={(e) => setEditPan(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-mono uppercase"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">UAN (Provident Fund)</label>
                          <input
                            type="text"
                            value={editUan}
                            onChange={(e) => setEditUan(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Bank Name</label>
                          <input
                            type="text"
                            required
                            value={editBankName}
                            onChange={(e) => setEditBankName(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Bank Account Number</label>
                          <input
                            type="text"
                            required
                            value={editBankAccount}
                            onChange={(e) => setEditBankAccount(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-mono"
                          />
                        </div>

                        <div className="space-y-1 col-span-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Bank IFSC Code</label>
                          <input
                            type="text"
                            required
                            value={editIfsc}
                            onChange={(e) => setEditIfsc(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-mono uppercase"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t pt-4">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Qualification & Degrees</label>
                          <input
                            type="text"
                            value={editQualification}
                            onChange={(e) => setEditQualification(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                            placeholder="e.g. B.Tech (Electrical Engineering)"
                          />
                        </div>

                        <div className="space-y-1 col-span-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Work Location</label>
                          <input
                            type="text"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                            placeholder="e.g. Halol Unit I"
                          />
                        </div>

                        <div className="space-y-1 col-span-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Vehicle registration</label>
                          <input
                            type="text"
                            value={editVehicleDetail}
                            onChange={(e) => setEditVehicleDetail(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-mono"
                            placeholder="e.g. GJ-06-HM-1234"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-2">
                        <div className="space-y-1 col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Previous Employer</label>
                          <input
                            type="text"
                            value={editPrevCompanyName}
                            onChange={(e) => setEditPrevCompanyName(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                            placeholder="e.g. ABB India Ltd"
                          />
                        </div>

                        <div className="space-y-1 col-span-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Previous Company Location</label>
                          <input
                            type="text"
                            value={editPrevCompanyLocation}
                            onChange={(e) => setEditPrevCompanyLocation(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                            placeholder="e.g. Vadodara, Gujarat"
                          />
                        </div>

                        <div className="space-y-1 col-span-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Total Experience</label>
                          <input
                            type="text"
                            value={editTotalExperience}
                            onChange={(e) => setEditTotalExperience(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg font-semibold text-emerald-700 font-bold"
                            placeholder="e.g. 5.5 Years"
                          />
                        </div>
                      </div>

                      {/* Phase 2 identity & personal information edits */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-5 gap-3 border-t pt-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Aadhaar Number</label>
                          <input 
                            type="text" 
                            value={editAadhaar} 
                            onChange={(e) => setEditAadhaar(e.target.value)} 
                            placeholder="12-digit Aadhaar" 
                            className="w-full text-xs p-2 border rounded-lg font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Date of Birth</label>
                          <input 
                            type="date" 
                            value={editDOB} 
                            onChange={(e) => setEditDOB(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Gender</label>
                          <select 
                            value={editGender} 
                            onChange={(e) => setEditGender(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg bg-white font-semibold"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Marital Status</label>
                          <select 
                            value={editMaritalStatus} 
                            onChange={(e) => setEditMaritalStatus(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg bg-white font-semibold"
                          >
                            <option value="Single">Single</option>
                            <option value="Married">Married</option>
                            <option value="Divorced">Divorced</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Emergency Contact</label>
                          <input 
                            type="text" 
                            value={editEmergencyContact} 
                            onChange={(e) => setEditEmergencyContact(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Blood Group</label>
                          <select 
                            value={editBloodGroup} 
                            onChange={(e) => setEditBloodGroup(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg bg-white font-semibold text-slate-700"
                          >
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">ESIC Number</label>
                          <input 
                            type="text" 
                            value={editEsicNumber} 
                            onChange={(e) => setEditEsicNumber(e.target.value)} 
                            placeholder="17-digit ESIC" 
                            className="w-full text-xs p-2 border rounded-lg font-mono font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Cost Center</label>
                          <input 
                            type="text" 
                            value={editCostCenter} 
                            onChange={(e) => setEditCostCenter(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Reporting Manager</label>
                          <input 
                            type="text" 
                            value={editReportingManager} 
                            onChange={(e) => setEditReportingManager(e.target.value)} 
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Reporting HOD Code</label>
                          <input 
                            type="text" 
                            value={editReportingHod} 
                            onChange={(e) => setEditReportingHod(e.target.value)} 
                            placeholder="e.g. EMP002"
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Reporting HOD Name</label>
                          <input 
                            type="text" 
                            value={editReportingHodName} 
                            onChange={(e) => setEditReportingHodName(e.target.value)} 
                            placeholder="e.g. Vishnu Sakar"
                            className="w-full text-xs p-2 border rounded-lg font-semibold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Employee Category</label>
                          <select 
                            value={editEmployeeCategory} 
                            onChange={(e) => setEditEmployeeCategory(e.target.value as any)} 
                            className="w-full text-xs p-2 border rounded-lg bg-white font-bold"
                          >
                            <option value="Staff">Staff</option>
                            <option value="Worker">Worker</option>
                            <option value="Contract">Contract</option>
                          </select>
                        </div>
                      </div>

                      {/* Photo Upload & HOD Auth Section */}
                      <div className="border-t pt-4 space-y-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">HOD Role & Photo (एचओडी भूमिका और फोटो)</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Photo Input & Preview */}
                          <div className="space-y-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <label className="text-[10px] font-bold text-gray-500 uppercase block">Employee Photo (कर्मचारी की फोटो)</label>
                            <div className="flex items-center gap-3">
                              {editPhoto ? (
                                <img src={editPhoto} alt="Employee Preview" className="w-12 h-12 rounded-full object-cover border-2 border-slate-200" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm">No Pic</div>
                              )}
                              <div className="flex-1">
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setEditPhoto(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 file:text-slate-700 hover:file:bg-slate-300"
                                />
                                {editPhoto && (
                                  <button 
                                    type="button"
                                    onClick={() => setEditPhoto('')}
                                    className="text-[10px] text-red-500 font-bold hover:underline mt-1 block"
                                  >
                                    Remove Photo
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Authorization checkboxes */}
                          <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col justify-center">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={editIsHod} 
                                onChange={(e) => {
                                  setEditIsHod(e.target.checked);
                                  if (!e.target.checked) {
                                    setEditCanApproveLeave(false);
                                    setEditCanApproveMissPunch(false);
                                  }
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                              />
                              <div className="text-xs">
                                <span className="font-bold text-slate-800 block">Is HOD (HOD है)</span>
                                <span className="text-[10px] text-slate-400">Mark this employee as a Reporting HOD</span>
                              </div>
                            </label>

                            <div className="pl-6 space-y-2 border-l border-slate-200/60 ml-2 mt-1">
                              <label className={`flex items-center gap-2 cursor-pointer select-none ${!editIsHod ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                <input 
                                  type="checkbox" 
                                  checked={editCanApproveLeave} 
                                  disabled={!editIsHod}
                                  onChange={(e) => setEditCanApproveLeave(e.target.checked)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                                />
                                <span className="text-[11px] font-medium text-slate-700">Can Approve Leave applications</span>
                              </label>

                              <label className={`flex items-center gap-2 cursor-pointer select-none ${!editIsHod ? 'opacity-40 cursor-not-allowed' : ''}`}>
                                <input 
                                  type="checkbox" 
                                  checked={editCanApproveMissPunch} 
                                  disabled={!editIsHod}
                                  onChange={(e) => setEditCanApproveMissPunch(e.target.checked)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                                />
                                <span className="text-[11px] font-medium text-slate-700">Can Approve Miss Punch requests</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Edit Shift Timing Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                        <div className="space-y-1.5 col-span-1 md:col-span-2">
                          <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Shift Timing (Work Schedule)</label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={editShiftTiming}
                              onChange={(e) => setEditShiftTiming(e.target.value)}
                              placeholder="e.g. 8:00 AM to 5:30 PM, or write your own"
                              className="flex-1 text-xs p-2.5 border border-amber-200 bg-amber-50/50 rounded-lg text-amber-950 font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] text-amber-800 font-bold uppercase mr-1 sm:ml-2">Quick Presets:</span>
                              {[
                                '8:00 AM to 5:30 PM',
                                '9:00 AM to 6:30 PM',
                                '8:00 AM to 8:00 PM'
                              ].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setEditShiftTiming(preset)}
                                  className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition border ${
                                    editShiftTiming === preset
                                      ? 'bg-amber-600 text-white border-amber-600'
                                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>
                          <p className="text-[9px] text-gray-500">
                            You can type <strong>any shift timing</strong> according to your requirements (e.g. <em>Morning 8 to 5.30</em>, etc.) or click a preset to apply instantly.
                          </p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Statutory Opt-ins (EPF / ESIC / PT)</label>
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 flex flex-col gap-2 mt-1">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                              <input 
                                type="checkbox" 
                                checked={editPfOptIn} 
                                onChange={(e) => setEditPfOptIn(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                              />
                              <span>EPF (Provident Fund) Applicable</span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                              <input 
                                type="checkbox" 
                                checked={editEsicOptIn} 
                                onChange={(e) => setEditEsicOptIn(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                              />
                              <span>ESIC Applicable</span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 select-none">
                              <input 
                                type="checkbox" 
                                checked={editPtOptIn} 
                                onChange={(e) => setEditPtOptIn(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                              />
                              <span>Professional Tax (PT) Applicable</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t pt-4">
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer select-none"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer select-none"
                        >
                          Save Updates
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Section 2: Loan accounts ledger */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Loan Summary & Records list */}
                  <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Loan & Advance Ledger</h4>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full font-mono uppercase">
                        Active Loans: {profileLoans.filter(l => l.status === 'ACTIVE').length}
                      </span>
                    </div>

                    {profileLoans.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs">
                        No active or past loans recorded for this employee.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {profileLoans.map(loan => {
                          // Calculate how much was actually repaid for this loan
                          // Find total repayments in profileHistorySlips
                          const repaid = profileHistorySlips
                            .reduce((sum, s) => sum + (s.loan_deduction || 0), 0);
                          const remaining = Math.max(0, loan.amount - repaid);
                          const isFullyRepaid = remaining === 0;

                          return (
                            <div key={loan.id} className="p-3 bg-slate-50 border rounded-xl flex flex-col justify-between gap-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[10px] text-gray-400 block font-mono">LOAN ID: {loan.id.substring(0, 12)}...</span>
                                  <span className="text-xs font-bold text-slate-800">{loan.reason}</span>
                                  <p className="text-[10px] text-gray-400">Granted: {loan.month}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-bold block text-slate-800 font-mono">₹{loan.amount.toLocaleString('en-IN')}</span>
                                  <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase ${loan.status === 'CLOSED' || isFullyRepaid ? 'bg-gray-200 text-gray-600' : 'bg-emerald-100 text-emerald-800'}`}>
                                    {isFullyRepaid ? 'PAID' : loan.status}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="border-t pt-2 grid grid-cols-3 gap-2 text-[10px] text-gray-500 font-mono">
                                <div>
                                  <span>Deduction/Mo</span>
                                  <strong className="block text-slate-700">₹{loan.monthly_deduction}/mo</strong>
                                </div>
                                <div>
                                  <span>Repaid So Far</span>
                                  <strong className="block text-emerald-600 font-bold">₹{repaid.toLocaleString('en-IN')}</strong>
                                </div>
                                <div>
                                  <span>Remaining</span>
                                  <strong className="block text-rose-600 font-bold">₹{remaining.toLocaleString('en-IN')}</strong>
                                </div>
                              </div>

                              {loan.status === 'ACTIVE' && !isFullyRepaid && (
                                <div className="flex justify-end pt-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateLoanStatus(loan.id, 'CLOSED')}
                                    className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[9px] font-semibold transition cursor-pointer select-none"
                                  >
                                    Deactivate/Stop Deductions
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Grant New Loan Form */}
                  <div className="bg-white p-5 rounded-2xl border shadow-sm">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Record / Grant New Loan</h4>
                    <form onSubmit={handleAddLoan} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Loan Amount (₹)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={newLoanAmount}
                            onChange={(e) => setNewLoanAmount(Number(e.target.value))}
                            className="w-full text-xs p-2 border rounded-lg font-mono font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Monthly Deduction (₹)</label>
                          <input
                            type="number"
                            required
                            min={1}
                            value={newLoanDeduction}
                            onChange={(e) => setNewLoanDeduction(Number(e.target.value))}
                            className="w-full text-xs p-2 border rounded-lg font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Month Granted</label>
                          <input
                            type="month"
                            required
                            value={newLoanMonth || activeMonth}
                            onChange={(e) => setNewLoanMonth(e.target.value)}
                            className="w-full text-xs p-1.5 border rounded-lg font-mono bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Loan Purpose / Remarks</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Festival Advance"
                            value={newLoanReason}
                            onChange={(e) => setNewLoanReason(e.target.value)}
                            className="w-full text-xs p-2 border rounded-lg"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus size={13} />
                          Grant Loan Record
                        </button>
                      </div>
                    </form>
                  </div>

                </div>

                {/* Section 2.5: Salary Increment History (Revision Register) */}
                <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Salary Revision Register & Complete Increment History</h4>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-full font-mono uppercase">
                      Total Revisions: {profileRevisions.length}
                    </span>
                  </div>

                  {profileRevisions.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs bg-slate-50/50">
                      No previous salary increments or revisions found. Any future salary changes will preserve history here automatically.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-slate-600">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <th className="p-3">Revision ID</th>
                            <th className="p-3">Effective Date</th>
                            <th className="p-3">Old Salary</th>
                            <th className="p-3">New Salary</th>
                            <th className="p-3">Increment Amount</th>
                            <th className="p-3">Reason / Remarks</th>
                            <th className="p-3">Approved By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {profileRevisions.map(rev => {
                            const hike = rev.new_salary - rev.old_salary;
                            const percentage = rev.old_salary > 0 ? Math.round((hike / rev.old_salary) * 100) : 0;
                            return (
                              <tr key={rev.id} className="hover:bg-slate-50">
                                <td className="p-3 font-mono text-[10px] text-gray-400">{rev.id.substring(0, 16)}...</td>
                                <td className="p-3 font-medium text-slate-800">{rev.effective_date}</td>
                                <td className="p-3 font-mono text-slate-500">₹{rev.old_salary.toLocaleString('en-IN')}</td>
                                <td className="p-3 font-mono text-slate-800 font-bold">₹{rev.new_salary.toLocaleString('en-IN')}</td>
                                <td className="p-3 font-mono text-emerald-650 font-bold text-emerald-600">
                                  +₹{hike.toLocaleString('en-IN')} ({percentage}%)
                                </td>
                                <td className="p-3 text-slate-700">{rev.reason}</td>
                                <td className="p-3 font-medium text-slate-700">{rev.approved_by}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 2.6: Employee Master Fields Edit History */}
                <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Employee Master Data Edit History Log</h4>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full font-mono uppercase">
                      Changes Tracked: {profileEditHistory.length}
                    </span>
                  </div>

                  {profileEditHistory.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 text-xs bg-slate-50/50">
                      No previous profile edits tracked. Any edits made to this employee's master records will automatically preserve a full change history trail here.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left text-slate-600">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <th className="p-3">Field Modified</th>
                            <th className="p-3">Old Value</th>
                            <th className="p-3">New Value</th>
                            <th className="p-3">Changed By</th>
                            <th className="p-3">Date & Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {profileEditHistory.map(hist => (
                            <tr key={hist.id} className="hover:bg-slate-50">
                              <td className="p-3 font-semibold text-slate-800">{hist.field}</td>
                              <td className="p-3 text-rose-700 bg-rose-50/30 font-mono font-bold">
                                {hist.oldValue || <span className="text-gray-400 font-normal italic">empty</span>}
                              </td>
                              <td className="p-3 text-emerald-700 bg-emerald-50/30 font-mono font-bold">
                                {hist.newValue || <span className="text-gray-400 font-normal italic">empty</span>}
                              </td>
                              <td className="p-3 font-medium text-slate-700">{hist.changedBy}</td>
                              <td className="p-3 text-gray-400 font-mono">{new Date(hist.timestamp).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 3: Month-by-month Salary & Attendance History */}
                <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Month-by-Month Attendance & Salary History Ledger</h4>
                  
                  {profileHistorySlips.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 border rounded-xl bg-slate-50 text-xs">
                      No payslip calculations found in active periods for this employee. Generate salaries in the "Salary calculation sheet" to seed ledger logs.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[950px] text-xs font-sans">
                        <thead>
                          <tr className="bg-gray-50 border-b font-display text-gray-400 uppercase text-[10px] select-none">
                            <th className="p-3">Month</th>
                            <th className="p-3">Attendance Stats</th>
                            <th className="p-3">Gross Salary</th>
                            <th className="p-3">Statutory PF/ESIC</th>
                            <th className="p-3">TDS Tax</th>
                            <th className="p-3">Loan Deducted</th>
                            <th className="p-3">Total Deductions</th>
                            <th className="p-3">Net Salary Disbursed</th>
                            <th className="p-3">Disbursement Destination</th>
                            <th className="p-3 text-right">Salary Slip</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {profileHistorySlips.map(slip => {
                            // Find matching attendance for this month
                            const att = attendance.find(a => a.employee_id === slip.employee_id && a.month === slip.month);
                            const working_days = att ? att.working_days : (slip.lop_deduction > 0 ? 28 : 30);
                            const lop_days = att ? att.lop_days : 0;
                            const ot_hours = att ? att.overtime_hours : 0;

                            return (
                              <tr key={slip.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-3 font-bold text-slate-900 font-mono">
                                  {slip.month}
                                </td>
                                <td className="p-3">
                                  <div>
                                    <span className="font-semibold block text-slate-700">{working_days} working days</span>
                                    <span className="text-[10px] text-gray-400 block mt-0.5">LOP: {lop_days} days • OT: {ot_hours} hrs</span>
                                  </div>
                                </td>
                                <td className="p-3 font-semibold text-slate-800 font-mono">
                                  ₹{slip.gross_salary.toLocaleString('en-IN')}
                                </td>
                                <td className="p-3 text-slate-600 font-mono">
                                  <div>
                                    <span>PF: ₹{slip.pf_deduction}</span>
                                    <span className="block text-[10px] text-gray-400">ESIC: ₹{slip.esic_deduction}</span>
                                  </div>
                                </td>
                                <td className="p-3 font-bold text-rose-600 font-mono">
                                  ₹{slip.tds.toLocaleString('en-IN')}
                                </td>
                                <td className="p-3 font-bold text-amber-600 font-mono">
                                  ₹{slip.loan_deduction ? slip.loan_deduction.toLocaleString('en-IN') : '0'}
                                </td>
                                <td className="p-3 text-slate-500 font-mono">
                                  ₹{slip.total_deductions.toLocaleString('en-IN')}
                                </td>
                                <td className="p-3">
                                  <strong className="text-emerald-700 text-sm font-mono block">₹{slip.net_salary.toLocaleString('en-IN')}</strong>
                                </td>
                                <td className="p-3">
                                  <div className="text-[11px]">
                                    <span className="font-medium text-slate-700 block">{slip.bank_name}</span>
                                    <span className="text-[10px] text-gray-400 font-mono block mt-0.5">A/C: {slip.bank_account}</span>
                                    <span className="text-[9px] text-emerald-800 font-bold font-mono">{slip.ifsc}</span>
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <button 
                                    onClick={() => setActivePayslipDetail(slip)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-emerald-200 text-xs font-semibold text-emerald-700 rounded-lg hover:bg-emerald-50 transition bg-white cursor-pointer"
                                  >
                                    <Eye size={12} />
                                    Print Slip
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="bg-slate-100 p-4 border-t flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedEmployeeProfile(null)}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer select-none"
                >
                  Close Profile Ledger
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PRINT-READY PAYSLIP DETAIL MODAL */}
      <AnimatePresence>
        {activePayslipDetail && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs overflow-y-auto flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden relative p-8 print-shadow-none text-slate-800"
            >
              {/* Utility Close Triggers */}
              <div className="absolute right-6 top-6 flex items-center gap-2 no-print">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs text-white font-semibold rounded-lg shadow-sm transition cursor-pointer"
                >
                  <Printer size={13} />
                  Print Payslip
                </button>
                <button 
                  onClick={() => setActivePayslipDetail(null)}
                  className="p-1.5 border hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer animate-none"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Printable Frame Section */}
              <div className="space-y-6">
                {/* Printable Header */}
                <div className="text-center pb-5 border-b border-gray-200">
                  <div className="flex justify-center mb-2">
                    {(() => {
                      const emp = employees.find(e => e.id === activePayslipDetail.employee_id);
                      const cmp = emp?.company || activePayslipDetail.company || 'Sakar Electricals Ltd';
                      return <CompanyLogo company={cmp} className="h-12" showText={false} />;
                    })()}
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 tracking-tight font-display">
                    {(() => {
                      const emp = employees.find(e => e.id === activePayslipDetail.employee_id);
                      const cmp = emp?.company || activePayslipDetail.company || 'Sakar Electricals Ltd';
                      return getCompanyName(cmp);
                    })()}
                  </h2>
                  <p className="text-[10px] text-gray-400 block font-mono">Corporate Identity Registry & Wage Disbursal Statement</p>
                  <span className="text-xs font-bold text-gray-700 font-mono mt-2 block">
                    SALARY SLIP FOR: {new Date(`${activePayslipDetail.month}-02`).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }).toUpperCase()}
                  </span>
                </div>

                {/* Sub-grid info */}
                <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                  <table className="w-full text-left">
                    <tbody>
                      <tr>
                        <td className="text-gray-400 pb-1.5">Employee ID:</td>
                        <td className="font-mono font-bold pb-1.5 text-gray-900">{activePayslipDetail.employee_id}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-400 pb-1.5">Staff Name:</td>
                        <td className="font-bold pb-1.5 text-gray-900">{activePayslipDetail.employee_name}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-400 pb-1.5">Designation:</td>
                        <td className="text-gray-700 pb-1.5">{activePayslipDetail.designation}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-400 pb-1.5">Department:</td>
                        <td className="text-gray-700 pb-1.5">{activePayslipDetail.department}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="w-full text-left">
                    <tbody>
                      <tr>
                        <td className="text-gray-400 pb-1.5">Bank Link Name:</td>
                        <td className="font-medium pb-1.5 text-gray-900">{activePayslipDetail.bank_name}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-400 pb-1.5">Account Number:</td>
                        <td className="font-mono pb-1.5 text-gray-900">{activePayslipDetail.bank_account}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-400 pb-1.5">IFS Code Details:</td>
                        <td className="font-mono pb-1.5 text-gray-900">{activePayslipDetail.ifsc}</td>
                      </tr>
                      <tr>
                        <td className="text-gray-400 pb-1.5">PAN Card No:</td>
                        <td className="font-mono pb-1.5 text-gray-900 uppercase">{activePayslipDetail.pan}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Earnings & Deductions details block */}
                <div className="grid grid-cols-2 gap-x-6 border-t border-b border-gray-100 py-4 font-sans text-xs">
                  {/* Earnings column */}
                  <div className="space-y-2">
                    <span className="font-bold text-gray-900 border-b pb-1 block uppercase tracking-wider text-[10px]">Earnings Component</span>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Prorated Basic:</span>
                      <span className="font-mono">₹{activePayslipDetail.earned_base_salary.toLocaleString('en-IN')}</span>
                    </div>
                    {activePayslipDetail.earned_hra !== undefined && activePayslipDetail.earned_hra > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Earned HRA:</span>
                        <span className="font-mono">₹{activePayslipDetail.earned_hra.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {activePayslipDetail.earned_da !== undefined && activePayslipDetail.earned_da > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Dearness Allowance (DA):</span>
                        <span className="font-mono">₹{activePayslipDetail.earned_da.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {activePayslipDetail.earned_special_allowance !== undefined && activePayslipDetail.earned_special_allowance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Special Allowances:</span>
                        <span className="font-mono">₹{activePayslipDetail.earned_special_allowance.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {activePayslipDetail.earned_edu_allowance !== undefined && activePayslipDetail.earned_edu_allowance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Education Allowance:</span>
                        <span className="font-mono">₹{activePayslipDetail.earned_edu_allowance.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {activePayslipDetail.earned_medical_allowance !== undefined && activePayslipDetail.earned_medical_allowance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Medical Allowance:</span>
                        <span className="font-mono">₹{activePayslipDetail.earned_medical_allowance.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    {activePayslipDetail.earned_conveyance_allowance !== undefined && activePayslipDetail.earned_conveyance_allowance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Conveyance Allowance:</span>
                        <span className="font-mono">₹{activePayslipDetail.earned_conveyance_allowance.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Overtime hours premium:</span>
                      <span className="font-mono">₹{activePayslipDetail.overtime_pay.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Deductions column */}
                  <div className="space-y-2 border-l pl-6">
                    <span className="font-bold text-gray-900 border-b pb-1 block uppercase tracking-wider text-[10px]">Statutory Deductions</span>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Loss of Pay (LOP) fine:</span>
                      <span className="font-mono">₹{activePayslipDetail.lop_deduction.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">EPF Employee Share (12%):</span>
                      <span className="font-mono">₹{activePayslipDetail.pf_deduction.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">ESIC Medical Share (0.75%):</span>
                      <span className="font-mono">₹{activePayslipDetail.esic_deduction.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Professional Tax (PT):</span>
                      <span className="font-mono">₹{activePayslipDetail.professional_tax.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Income Tax (TDS Estimate):</span>
                      <span className="font-mono">₹{activePayslipDetail.tds.toLocaleString('en-IN')}</span>
                    </div>
                    {activePayslipDetail.loan_deduction !== undefined && activePayslipDetail.loan_deduction > 0 && (
                      <div className="flex justify-between font-semibold text-amber-700">
                        <span>Loan / Advance Repayment:</span>
                        <span className="font-mono">₹{activePayslipDetail.loan_deduction.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub totals */}
                <div className="grid grid-cols-2 gap-x-6 text-xs font-bold pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-900">GROSS SALARY:</span>
                    <span className="font-mono text-gray-900">₹{activePayslipDetail.gross_salary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pl-6 border-l">
                    <span className="text-gray-900">TOTAL DEDUCTION:</span>
                    <span className="font-mono text-rose-600">₹{activePayslipDetail.total_deductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Net Final transfers highlight */}
                <div className="bg-emerald-50 p-4.5 rounded-xl border border-emerald-100 flex justify-between items-center text-emerald-900">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">NET TRANSFER AMOUNT</span>
                    <span className="text-xs text-emerald-700 block mt-0.5">Disbursed to bank listed on file.</span>
                  </div>
                  <span className="text-xl font-extrabold font-mono tracking-tight text-emerald-700">
                    ₹{activePayslipDetail.net_salary.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-10 flex justify-between items-end border-t text-[10px] text-gray-400 font-mono">
                  <div>
                    <span>Disbursed via Central Clearing Desk Vetan ERP</span>
                    <span className="block mt-0.5">ID Ref code: {activePayslipDetail.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="border-t border-slate-300 pt-1.5 px-6 font-bold block text-slate-600 text-center select-none uppercase">Authorized HR Signatory</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Secure Deletion PIN prompt modal */}
      <AnimatePresence>
        {deleteTargetEmp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 text-slate-900"
            >
              <div className="p-6 bg-rose-50 border-b border-rose-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-rose-900">Secure Employee Purge</h3>
                    <p className="text-xs text-rose-700">Irreversible Administration Protocol</p>
                  </div>
                </div>
              </div>

              <form onSubmit={submitDeleteWithPin} className="p-6 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  You are attempting to delete employee <strong className="text-slate-900">{deleteTargetEmp.name}</strong> from VETAN ERP records. 
                  This will perform the following operations:
                </p>
                <ul className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-lg border">
                  <li>• Validate if employee has active payroll records</li>
                  <li>• Permanent delete allowed for test/duplicate accounts</li>
                  <li>• Active payroll accounts will be set to <strong className="text-slate-800">SEPARATED</strong> status only</li>
                </ul>

                <div className="flex items-start gap-2 bg-rose-50/70 border border-rose-100 p-3 rounded-lg select-none">
                  <input
                    type="checkbox"
                    id="force-delete-checkbox"
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                    className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 h-4 w-4 border-rose-300"
                  />
                  <label htmlFor="force-delete-checkbox" className="text-xs font-semibold text-rose-800 cursor-pointer">
                    Force Permanent Delete
                    <span className="block text-[10px] text-rose-600/80 font-normal mt-0.5">
                      Check this to permanently delete this dummy/testing employee, completely purging all their test payslips, attendance sheets, and records.
                    </span>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block text-left">Company Management Security PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={deletePin}
                    onChange={(e) => setDeletePin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 4-digit PIN"
                    className="w-full text-center text-lg tracking-[0.5em] p-2.5 border rounded-xl font-mono font-bold focus:ring-2 focus:ring-rose-500 outline-none"
                    autoFocus
                    required
                  />
                  <p className="text-[10px] text-gray-400 text-center">Contact Company Management for credentials</p>
                </div>

                {deleteError && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs font-semibold text-center">
                    {deleteError}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTargetEmp(null)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer select-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer select-none shadow-sm"
                  >
                    Verify & Purge
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
