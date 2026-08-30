/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Employee {
  id: string;
  emp_code?: string;
  name: string;
  company: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  joining_date: string;
  exit_date?: string; // for F&F
  status: 'ACTIVE' | 'RESIGNED' | 'SEPARATED';
  bank_name: string;
  bank_account: string;
  ifsc: string;
  pan: string;
  uan: string;
  base_salary: number; // monthly base
  hra: number; // House Rent Allowance
  special_allowance: number;
  da: number; // Dearness Allowance
  pf_opt_in: boolean;
  esic_opt_in: boolean;
  professional_tax_opt_in: boolean;
  
  // Annual Leave Balances
  leave_balance_pl: number; // Privilege Leaves
  leave_balance_cl: number; // Casual Leaves
  leave_balance_sl: number; // Sick Leaves

  // Educational and Professional details requested by the user
  qualification?: string;
  location?: string;
  vehicle_detail?: string;
  prev_company_name?: string;
  prev_company_location?: string;
  total_experience?: string; // Total experience (e.g. "5 Years")

  // Salary Components requested by user
  edu_allowance?: number;
  medical_allowance?: number;
  conveyance_allowance?: number;
  bonus_payable?: number;
  ctc_salary?: number;
  sctc?: number;
  form?: string;
  shift_timing?: string;
  password?: string;
  birth_year?: number;
  needs_password_change?: boolean;

  // Phase 2 fields
  aadhaar_number?: string;
  dob?: string;
  gender?: string;
  marital_status?: string;
  emergency_contact?: string;
  blood_group?: string;
  esic_number?: string;
  cost_center?: string;
  reporting_manager?: string;
  employee_category?: 'Staff' | 'Worker' | 'Contract';
  reporting_hod?: string;
  reporting_hod_code?: string;
  reporting_hod_name?: string;
  is_hod?: boolean;
  can_approve_leave?: boolean;
  can_approve_misspunch?: boolean;
  photo?: string;
  salary_structure_type?: 'FIXED' | 'PERCENTAGE' | 'MIXED';
  hidden_salary_heads?: string;
  pf_number?: string;
  pf_member_id?: string;
  form_11_status?: string;
  form_11_file?: string;
  pf_non_deduction_reason?: string;
  pf_verified_by?: string;
  pf_verification_date?: string;
  pf_hr_remarks?: string;

  // Workforce module fields
  father_husband_name?: string;
  contractor?: string;
  payment_group?: string;
  wage_group?: string;
  wage_rate?: number;
  work_type?: string;
  id_proof_type?: string;
  id_proof_number?: string;
}

export interface LeaveApplication {
  id: string;
  employee_id: string;
  employee_name: string;
  company: string;
  leave_type: 'PL' | 'CL' | 'SL';
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PENDING_HOD' | 'PENDING_HR' | 'REJECTED_HOD' | 'REJECTED_HR';
  applied_date?: string;
  reporting_hod?: string;
  reporting_hod_name?: string;
  hod_approved_date?: string;
  hod_id?: string;
  hr_approved_date?: string;
  hr_id?: string;
}

export interface HRUser {
  id: string;
  username: string;
  name: string;
  company_rights: string[];
  role: 'SUPER_HR' | 'COMPANY_HR' | 'MANAGEMENT' | 'ATTENDANCE_ONLY_HR' | 'AUDITOR';
  title?: string;
  password?: string;
  disabled?: boolean;
}

export interface FullAndFinalSettlement {
  id: string;
  employee_id: string;
  employee_name: string;
  company: string;
  last_working_day: string;
  gratuity_earned: number;
  earned_leave_encashment: number;
  unpaid_salary_days: number;
  unpaid_salary_earned: number;
  notice_period_deduction: number;
  pending_bonus?: number;
  gross_earnings: number;
  gross_deductions: number;
  net_settlement_pay: number;
  status: 'DRAFT' | 'PREPARED' | 'VERIFIED' | 'APPROVED' | 'FINAL_APPROVED' | 'DISBURSED';
  disbursed_date?: string;

  // New detailed professional F&F fields
  department?: string;
  designation?: string;
  reporting_manager?: string;
  joining_date?: string;
  resignation_date?: string;
  resignation_acceptance_date?: string;
  leaving_date?: string;
  total_service_period?: string;

  // Exit details
  reason_for_leaving?: string;
  exit_remarks?: string;

  // Notice Period details
  notice_applicable_days?: number;
  notice_served_days?: number;
  notice_shortfall_days?: number;

  // Leave Balances
  leave_balance_pl?: number;
  leave_balance_cl?: number;
  leave_balance_sl?: number;
  leave_balance_compoff?: number;

  // Recoveries
  recovery_salary_advance?: number;
  recovery_loan_outstanding?: number;
  recovery_asset?: number;
  recovery_other?: number;

  // Asset Clearance Checklist
  clearance_id_card?: boolean;
  clearance_laptop?: boolean;
  clearance_mobile?: boolean;
  clearance_access_card?: boolean;
  clearance_other_assets?: boolean;
  clearance_remarks?: string;

  // Approval Workflow Signatures
  approval_prepared_by?: string;
  approval_prepared_date?: string;
  approval_verified_by?: string;
  approval_verified_date?: string;
  approval_approved_by?: string;
  approval_approved_date?: string;
  approval_final_approved_by?: string;
  approval_final_approved_date?: string;
}

export interface Form16Calculation {
  employee_id: string;
  employee_name: string;
  company: string;
  pan: string;
  gross_annual_salary: number;
  standard_deduction: number; // ₹50000 flat
  section_80c: number; // Cap ₹150000 (PF contrib etc)
  section_80d: number; // Cap ₹25000
  hra_exemption: number;
  taxable_income: number;
  tax_on_income: number;
  rebate_87a: number; // tax rebate
  net_tax_payable: number;
}

export interface Attendance {
  id: string;
  employee_id: string;
  month: string; // YYYY-MM
  total_days: number;
  working_days: number;
  lop_days: number; // Loss of pay (unpaid leaves)
  overtime_hours: number;
  
  // Monthly Summary Upload Fields
  present?: number;
  absent?: number;
  weekly_off?: number;
  paid_holiday?: number;
  leave?: number;
  lwp?: number;
  ot_hours?: number;
  is_locked?: boolean;
  // Leave breakup fields
  leave_pl?: number;
  leave_cl?: number;
  leave_sl?: number;
  compoff_used?: number;
}

export interface PayrollRun {
  id: string; // RUN-YYYY-MM
  month: string; // YYYY-MM
  status: 'DRAFT' | 'CLOSED';
  processed_at: string;
  total_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
}

export interface Payslip {
  id: string; // SLIP-EMP-YYYY-MM
  employee_id: string;
  employee_name: string;
  designation: string;
  department: string;
  pan: string;
  uan: string;
  bank_name: string;
  bank_account: string;
  ifsc: string;
  month: string; // YYYY-MM
  
  // Salary structure rates
  rate_base_salary: number;
  rate_hra: number;
  rate_special_allowance: number;
  rate_da: number;
  rate_edu_allowance?: number;
  rate_medical_allowance?: number;
  rate_conveyance_allowance?: number;

  // Salary earned
  earned_base_salary: number;
  earned_hra: number;
  earned_special_allowance: number;
  earned_da: number;
  earned_edu_allowance?: number;
  earned_medical_allowance?: number;
  earned_conveyance_allowance?: number;
  overtime_pay: number;
  
  // Deductions
  lop_deduction: number;
  pf_deduction: number; // Employee Provident Fund (12% of base)
  esic_deduction: number; // Employee State Insurance (0.75% of gross)
  professional_tax: number; // PT
  tds: number; // Income tax TDS
  custom_deductions: number; // any other deductions
  loan_deduction: number; // loan deduction
  salary_advance?: number; // salary advance deduction
  
  // Variable Earnings & Incentives
  bonus_incentive?: number;
  performance_incentive?: number;
  attendance_incentive?: number;
  production_incentive?: number;
  reimbursement?: number;
  special_allowance_addition?: number;
  arrear_payment?: number;
  other_earnings?: number;

  // Additional Deductions
  canteen_deduction?: number;
  uniform_deduction?: number;
  notice_deduction?: number;
  mobile_deduction?: number;
  damage_deduction?: number;
  remarks?: string;

  // Summary
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  
  // Employer contributions
  employer_pf: number; // 12% matching
  employer_esic: number; // 3.25% matching
  rate_bonus_payable?: number;
  earned_bonus_payable?: number;
  ctc_salary?: number;
  payment_status?: string;
  payment_date?: string;
  hidden_salary_heads?: string;
  salary_structure_type?: 'FIXED' | 'PERCENTAGE' | 'MIXED';
  pay_days?: number;
  calendar_days?: number;
}

export interface PayrollEarningHead {
  id: string;
  code: string;
  name: string;
  category: 'STATUTORY' | 'VARIABLE' | 'RECURRING';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PayrollDeductionHead {
  id: string;
  code: string;
  name: string;
  category: 'STATUTORY' | 'RECOVERY' | 'TAX' | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SQLResult {
  success: boolean;
  columns?: string[];
  rows?: any[][];
  affectedRows?: number;
  error?: string;
  queryTimeMs?: number;
}

export interface AdditionalLoan {
  id: string;
  amount: number;
  month: string; // YYYY-MM
  reason: string;
  date: string;
}

export interface LoanSettlement {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  recovery_type: 'FULL_SETTLEMENT' | 'PARTIAL' | 'MONTHLY_EMI' | 'ADDITIONAL_RECOVERY';
  payment_mode: 'Cash' | 'Bank Transfer' | 'Salary Deduction' | 'Cheque' | 'UPI' | 'Journal Entry';
  reference_number?: string;
  approved_by?: string;
  remarks?: string;
  principal_paid?: number;
  interest_paid?: number;
  charges?: number;
}

export interface LoanSkipRecord {
  month: string; // YYYY-MM
  reason: string; // Medical Emergency, LWP, Management Approval, Worker Request
  approved_by: string;
  approval_date: string;
}

export interface LoanAuditLog {
  id: string;
  date: string; // YYYY-MM-DD HH:mm
  action: 'LOAN_ISSUED' | 'EMI_RECOVERED' | 'EMI_SKIPPED' | 'EMI_UNSKIPPED' | 'TOPUP_ADDED' | 'PARTIAL_SETTLEMENT' | 'FULL_FORECLOSURE' | 'LOAN_CLOSED' | 'DETAILS_UPDATED';
  details: string;
  performed_by: string;
}

export type LoanType = 'Salary Advance' | 'Employee Loan' | 'Emergency Loan' | 'Festival Loan' | 'Special Loan';

export interface Loan {
  id: string;
  loan_number?: string; // Auto-generated e.g. LN-2026-001
  employee_id: string;
  employee_code?: string;
  employee_name: string;
  department?: string;
  company?: string;
  unit?: string;
  loan_type?: LoanType;
  loan_date?: string; // YYYY-MM-DD
  amount: number; // Disbursed amount or total loan principal
  interest_rate?: number; // Optional interest %
  emi_start_month?: string; // YYYY-MM
  monthly_deduction: number; // Monthly EMI
  total_installments?: number;
  opening_balance?: number; // 1st April opening balance
  opening_date?: string; // YYYY-MM-DD
  month: string; // YYYY-MM (month loan was given)
  reason: string; // Purpose / Reason
  approval_authority?: string;
  remarks?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CLOSED';
  closed_date?: string;
  closure_reference?: string;
  skipped_months?: (string | LoanSkipRecord)[]; // Array of YYYY-MM strings or detailed records where EMI is skipped
  additional_loans?: AdditionalLoan[]; // Mid-year loan top-ups / additions
  settlements?: LoanSettlement[]; // Full / Partial settlements
  audit_trail?: LoanAuditLog[];
  total_amount?: number;
  disbursal_month?: string;
  total_repaid?: number;
  outstanding_balance?: number;

  // Guarantor 1 Details
  guarantor1_id?: string;
  guarantor1_code?: string;
  guarantor1_name?: string;
  guarantor1_department?: string;
  guarantor1_monthly_salary?: number;
  guarantor1_guarantee_limit?: number; // 4 * Monthly CTC

  // Guarantor 2 Details
  guarantor2_id?: string;
  guarantor2_code?: string;
  guarantor2_name?: string;
  guarantor2_department?: string;
  guarantor2_monthly_salary?: number;
  guarantor2_guarantee_limit?: number; // 4 * Monthly CTC
}

export interface CompanyMaster {
  id: string; // 'SVN-1' | 'SVN-II' | 'Sakar-I' | 'Sakar-III'
  name: string;
  unit_name: string;
  logo: string;
  registered_office: string;
  factory_address: string;
  gst_number: string;
  pan_number: string;
  tan_number: string;
  cin_number: string;
  pf_number: string;
  esic_number: string;
  pt_number: string;
  settings?: string;
}

export interface SalaryRevision {
  id: string;
  employee_code: string;
  old_salary: number;
  new_salary: number;
  effective_date: string;
  reason: string;
  approved_by: string;
  created_at: string;
  remarks?: string;
  increment_amount?: number;
  old_structure?: string; // JSON structure containing: { basic, hra, conveyance, edu, medical, special, gross, ctc, takeHome }
  new_structure?: string; // JSON structure containing: { basic, hra, conveyance, edu, medical, special, gross, ctc, takeHome }
}

export interface EmployeeAsset {
  id: string;
  employee_id: string;
  employee_name: string;
  asset_name: string;
  serial_number: string;
  type: string;
  issue_date: string;
  return_date?: string;
  status: 'ISSUED' | 'RETURNED' | 'LOST' | 'DAMAGED';
  condition: string;
}

export interface TravelReimbursement {
  id: string;
  employee_id: string;
  employee_name: string;
  month: string;
  fuel_liters: number;
  rate_per_liter: number;
  amount: number;
  travel_purpose: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface BroadcastNotice {
  id: string;
  title: string;
  message: string;
  target_type: 'ALL' | 'COMPANY' | 'DEPARTMENT';
  target_value: string;
  created_at: string;
  created_by: string;
}

export interface HODMaster {
  id: string;
  name: string;
  department: string;
  company: string;
  active?: boolean;
}

export interface Shift {
  code: string;
  name: string;
  start_time: string;
  end_time: string;
  grace_time: number;
  weekly_off: string;
}

// ===== Workforce Module (Phase A: foundation — additive, opt-in) =====
// All collections below are EMPTY by default and do not affect Staff Payroll.

export interface ContractorMaster {
  id: string;
  name: string;
  company: string;
  unit?: string;
  gst?: string;
  pan?: string;
  contact?: string;
  active: number; // 1/0
}

export interface MinimumWageRate {
  id: string;
  company: string;
  unit?: string;
  worker_category?: string;
  wage_group?: string;
  effective_from: string; // YYYY-MM-DD
  effective_to?: string; // YYYY-MM-DD or null (open-ended)
  minimum_wage: number;
  active: number; // 1/0
}

export interface ContractorBill {
  id: string; // BILL-<company>-<month>-<contractor>
  company: string;
  contractor_id: string;
  month: string; // YYYY-MM
  status: 'DRAFT' | 'ISSUED' | 'PAID';
  total_gross: number;
  total_pf: number;
  total_esic: number;
  net_payable: number;
  created_by?: string;
  created_at?: string;
  locked: number; // 0/1
}

export interface ContractorBillLine {
  id: string;
  bill_id: string;
  employee_id: string;
  worker_name?: string;
  present_days: number;
  leave_days: number;
  weekly_off: number;
  holiday: number;
  paid_days: number;
  ncp_days: number;
  wage_rate: number;
  gross_wages: number;
  pf: number;
  esic: number;
  other_deductions: number;
  net_payable: number;
}

export interface ChequePayment {
  id: string; // CHEQUE-<company>-<month>-<employee>
  employee_id: string;
  company: string;
  month: string;
  net_pay: number;
  cheque_number: string;
  payment_date: string;
  remarks?: string;
}

export interface MonthStatus {
  company: string;
  month: string;
  state: 'OPEN' | 'UPLOADED' | 'RECONCILED' | 'FINALIZED' | 'PAYROLL_DONE' | 'CLOSED' | 'LOCKED';
  locked_by?: string;
  locked_at?: string;
  lock_reason?: string;
  updated_at: string;
}

export interface AttendanceUploadBatch {
  id: string; // BATCH-<company>-<month>-<timestamp>
  company: string;
  month: string;
  source: 'CSV' | 'BIOMETRIC_DIRECT';
  file_name: string;
  uploaded_by?: string;
  uploaded_at: string;
  staff_skipped: number;
  worker_rows: number;
  duplicate_ids: string; // JSON array
  status: 'OK' | 'VALIDATED' | 'LOCKED';
}



