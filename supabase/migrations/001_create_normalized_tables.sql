-- VETAN ERP — NORMALIZED TABLE CREATION
-- Date: 31 August 2026
-- Purpose: Convert single JSON blob to proper relational tables
-- Safety: ADDITIVE ONLY — does not touch existing vetan_erp_store

BEGIN;

-- 1. COMPANIES
CREATE TABLE IF NOT EXISTS public.vetan_companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  address TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EMPLOYEES
CREATE TABLE IF NOT EXISTS public.vetan_employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  unit TEXT,
  designation TEXT,
  department TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  base_salary NUMERIC DEFAULT 0,
  hra NUMERIC DEFAULT 0,
  special_allowance NUMERIC DEFAULT 0,
  da NUMERIC DEFAULT 0,
  edu_allowance NUMERIC DEFAULT 0,
  medical_allowance NUMERIC DEFAULT 0,
  conveyance_allowance NUMERIC DEFAULT 0,
  bank_name TEXT,
  bank_account TEXT,
  ifsc TEXT,
  pan TEXT,
  uan TEXT,
  pf_opt_in BOOLEAN DEFAULT false,
  esic_opt_in BOOLEAN DEFAULT false,
  professional_tax_opt_in BOOLEAN DEFAULT false,
  reporting_hod TEXT,
  reporting_hod_name TEXT,
  is_hod BOOLEAN DEFAULT false,
  aadhaar_number TEXT,
  dob TEXT,
  gender TEXT,
  marital_status TEXT,
  emergency_contact TEXT,
  blood_group TEXT,
  esic_number TEXT,
  cost_center TEXT,
  qualification TEXT,
  location TEXT,
  birth_year INTEGER,
  needs_password_change BOOLEAN DEFAULT false,
  employee_password TEXT,
  shift_timing TEXT,
  exit_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ATTENDANCE (monthly summary — one record per employee per month)
CREATE TABLE IF NOT EXISTS public.vetan_attendance (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  month TEXT NOT NULL,
  total_days INTEGER DEFAULT 0,
  working_days INTEGER DEFAULT 0,
  present INTEGER DEFAULT 0,
  absent INTEGER DEFAULT 0,
  leave INTEGER DEFAULT 0,
  weekly_off INTEGER DEFAULT 0,
  paid_holiday INTEGER DEFAULT 0,
  lwp INTEGER DEFAULT 0,
  lop_days INTEGER DEFAULT 0,
  overtime_hours NUMERIC DEFAULT 0,
  leave_pl NUMERIC DEFAULT 0,
  leave_cl NUMERIC DEFAULT 0,
  leave_sl NUMERIC DEFAULT 0,
  compoff_used NUMERIC DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  in_time TEXT,
  out_time TEXT,
  ot_hours NUMERIC DEFAULT 0,
  company TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vetan_attendance_unique UNIQUE (employee_id, month)
);

-- 4. PAYROLL RUNS (one per company per month)
CREATE TABLE IF NOT EXISTS public.vetan_payroll_runs (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  company TEXT,
  status TEXT DEFAULT 'DRAFT',
  total_employees INTEGER DEFAULT 0,
  total_gross NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  total_net NUMERIC DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vetan_payroll_run_unique UNIQUE (id)
);

-- 5. PAYSLIPS (one per employee per month)
CREATE TABLE IF NOT EXISTS public.vetan_payslips (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  designation TEXT,
  department TEXT,
  pan TEXT,
  uan TEXT,
  bank_name TEXT,
  bank_account TEXT,
  ifsc TEXT,
  month TEXT NOT NULL,
  -- Rate heads
  rate_base_salary NUMERIC DEFAULT 0,
  rate_hra NUMERIC DEFAULT 0,
  rate_special_allowance NUMERIC DEFAULT 0,
  rate_da NUMERIC DEFAULT 0,
  rate_edu_allowance NUMERIC DEFAULT 0,
  rate_medical_allowance NUMERIC DEFAULT 0,
  rate_conveyance_allowance NUMERIC DEFAULT 0,
  rate_bonus_payable NUMERIC DEFAULT 0,
  -- Earned heads
  earned_base_salary NUMERIC DEFAULT 0,
  earned_hra NUMERIC DEFAULT 0,
  earned_special_allowance NUMERIC DEFAULT 0,
  earned_da NUMERIC DEFAULT 0,
  earned_edu_allowance NUMERIC DEFAULT 0,
  earned_medical_allowance NUMERIC DEFAULT 0,
  earned_conveyance_allowance NUMERIC DEFAULT 0,
  earned_bonus_payable NUMERIC DEFAULT 0,
  -- Other earnings
  overtime_pay NUMERIC DEFAULT 0,
  bonus_incentive NUMERIC DEFAULT 0,
  performance_incentive NUMERIC DEFAULT 0,
  attendance_incentive NUMERIC DEFAULT 0,
  production_incentive NUMERIC DEFAULT 0,
  reimbursement NUMERIC DEFAULT 0,
  special_allowance_addition NUMERIC DEFAULT 0,
  arrear_payment NUMERIC DEFAULT 0,
  other_earnings NUMERIC DEFAULT 0,
  -- Deductions
  pf_deduction NUMERIC DEFAULT 0,
  esic_deduction NUMERIC DEFAULT 0,
  professional_tax NUMERIC DEFAULT 0,
  tds NUMERIC DEFAULT 0,
  custom_deductions NUMERIC DEFAULT 0,
  loan_deduction NUMERIC DEFAULT 0,
  salary_advance NUMERIC DEFAULT 0,
  lop_deduction NUMERIC DEFAULT 0,
  canteen_deduction NUMERIC DEFAULT 0,
  uniform_deduction NUMERIC DEFAULT 0,
  notice_deduction NUMERIC DEFAULT 0,
  mobile_deduction NUMERIC DEFAULT 0,
  damage_deduction NUMERIC DEFAULT 0,
  -- Totals
  gross_salary NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  net_salary NUMERIC DEFAULT 0,
  employer_pf NUMERIC DEFAULT 0,
  employer_esic NUMERIC DEFAULT 0,
  ctc_salary NUMERIC DEFAULT 0,
  -- Calendar/Pay days
  calendar_days INTEGER DEFAULT 0,
  pay_days INTEGER DEFAULT 0,
  -- Payment
  payment_status TEXT DEFAULT 'PENDING',
  payment_date TEXT DEFAULT '',
  -- Other
  hidden_salary_heads TEXT,
  salary_structure_type TEXT DEFAULT 'FIXED',
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vetan_payslip_unique UNIQUE (employee_id, month)
);

-- 6. SALARY REVISIONS
CREATE TABLE IF NOT EXISTS public.vetan_salary_revisions (
  id TEXT PRIMARY KEY,
  employee_code TEXT NOT NULL,
  old_salary NUMERIC DEFAULT 0,
  new_salary NUMERIC DEFAULT 0,
  effective_date TEXT,
  reason TEXT DEFAULT '',
  approved_by TEXT DEFAULT '',
  remarks TEXT DEFAULT '',
  old_structure TEXT DEFAULT '',
  new_structure TEXT DEFAULT '',
  increment_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LOANS
CREATE TABLE IF NOT EXISTS public.vetan_loans (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  company TEXT,
  amount NUMERIC DEFAULT 0,
  opening_balance NUMERIC DEFAULT 0,
  monthly_deduction NUMERIC DEFAULT 0,
  total_installments INTEGER DEFAULT 0,
  remaining_installments INTEGER DEFAULT 0,
  opening_date TEXT,
  status TEXT DEFAULT 'ACTIVE',
  guarantor_1 TEXT,
  guarantor_1_name TEXT,
  guarantor_1_salary NUMERIC DEFAULT 0,
  guarantor_2 TEXT,
  guarantor_2_name TEXT,
  guarantor_2_salary NUMERIC DEFAULT 0,
  monthly_emi_log JSONB DEFAULT '[]'::jsonb,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LOAN POLICY
CREATE TABLE IF NOT EXISTS public.vetan_loan_policy (
  company TEXT PRIMARY KEY,
  max_amount NUMERIC DEFAULT 0,
  min_tenure INTEGER DEFAULT 1,
  max_tenure INTEGER DEFAULT 24,
  interest_rate NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LEAVE APPLICATIONS
CREATE TABLE IF NOT EXISTS public.vetan_leave_applications (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  company TEXT,
  leave_type TEXT,
  start_date TEXT,
  end_date TEXT,
  days NUMERIC DEFAULT 0,
  reason TEXT DEFAULT '',
  status TEXT DEFAULT 'PENDING_HOD',
  reporting_hod TEXT,
  applied_date TIMESTAMPTZ DEFAULT NOW(),
  approved_date TIMESTAMPTZ,
  remarks TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. HR USERS
CREATE TABLE IF NOT EXISTS public.vetan_hr_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  pin TEXT,
  role TEXT DEFAULT 'HR',
  company TEXT,
  employee_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. HOD MASTERS
CREATE TABLE IF NOT EXISTS public.vetan_hods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department TEXT,
  company TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SHIFTS
CREATE TABLE IF NOT EXISTS public.vetan_shifts (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  in_time TEXT,
  out_time TEXT,
  grace_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. DEPARTMENTS
CREATE TABLE IF NOT EXISTS public.vetan_departments (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.vetan_audit_logs (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  detail TEXT,
  operator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.vetan_system_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. FF SETTLEMENTS
CREATE TABLE IF NOT EXISTS public.vetan_ff_settlements (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT,
  company TEXT,
  last_working_day TEXT,
  settlement_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. ATTENDANCE CORRECTIONS
CREATE TABLE IF NOT EXISTS public.vetan_attendance_corrections (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  month TEXT,
  requested_by TEXT,
  reason TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. COMPOFF REQUESTS
CREATE TABLE IF NOT EXISTS public.vetan_compoff_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  date TEXT,
  reason TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. OVERTIME REQUESTS
CREATE TABLE IF NOT EXISTS public.vetan_overtime_requests (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  date TEXT,
  hours NUMERIC DEFAULT 0,
  reason TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. ASSETS
CREATE TABLE IF NOT EXISTS public.vetan_assets (
  id TEXT PRIMARY KEY,
  employee_id TEXT,
  asset_name TEXT,
  asset_tag TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. MONTH STATUS
CREATE TABLE IF NOT EXISTS public.vetan_month_status (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  month TEXT NOT NULL,
  state TEXT DEFAULT 'OPEN',
  actor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vetan_month_status_unique UNIQUE (company, month)
);

-- 22. ATTENDANCE UPLOAD BATCHES
CREATE TABLE IF NOT EXISTS public.vetan_attendance_upload_batches (
  id TEXT PRIMARY KEY,
  company TEXT,
  month TEXT,
  uploaded_by TEXT,
  record_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_ve_emp_company ON public.vetan_employees(company);
CREATE INDEX IF NOT EXISTS idx_ve_emp_status ON public.vetan_employees(status);
CREATE INDEX IF NOT EXISTS idx_ve_att_month ON public.vetan_attendance(month);
CREATE INDEX IF NOT EXISTS idx_ve_att_company ON public.vetan_attendance(company);
CREATE INDEX IF NOT EXISTS idx_ve_ps_month ON public.vetan_payslips(month);
CREATE INDEX IF NOT EXISTS idx_ve_pr_month ON public.vetan_payroll_runs(month);
CREATE INDEX IF NOT EXISTS idx_ve_loan_emp ON public.vetan_loans(employee_id);
CREATE INDEX IF NOT EXISTS idx_ve_loan_status ON public.vetan_loans(status);
CREATE INDEX IF NOT EXISTS idx_ve_rev_emp ON public.vetan_salary_revisions(employee_code);
CREATE INDEX IF NOT EXISTS idx_ve_leave_emp ON public.vetan_leave_applications(employee_id);
CREATE INDEX IF NOT EXISTS idx_ve_audit_time ON public.vetan_audit_logs(created_at);

COMMIT;
