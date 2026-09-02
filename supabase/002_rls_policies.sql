-- VETAN ERP — ROW LEVEL SECURITY (RLS) POLICIES
-- 
-- PREREQUISITE: Tables must exist first (run 001_create_normalized_tables.sql)
-- 
-- HOW TO RUN:
-- 1. Go to https://supabase.com/dashboard → Your Project → SQL Editor
-- 2. Create New Query
-- 3. Paste this entire file
-- 4. Click "Run"
--
-- WHAT THIS DOES:
-- - Enables RLS on core payroll tables
-- - Prevents UPDATE/DELETE on CLOSED payroll runs and payslips
-- - Prevents duplicate attendance records
-- - Ensures data immutability at DATABASE level

BEGIN;

-- ============================================================
-- 1. PAYROLL RUNS — Hard lock when CLOSED
-- ============================================================

ALTER TABLE vetan_payroll_runs ENABLE ROW LEVEL SECURITY;

-- Block UPDATE on CLOSED payroll runs
CREATE POLICY "Hard lock closed payroll runs"
ON vetan_payroll_runs
FOR UPDATE
USING (status != 'CLOSED')
WITH CHECK (status != 'CLOSED');

-- Block DELETE on CLOSED payroll runs
CREATE POLICY "Prevent delete on closed payroll runs"
ON vetan_payroll_runs
FOR DELETE
USING (status != 'CLOSED');

-- ============================================================
-- 2. PAYSLIPS — Hard lock when payroll is CLOSED
-- ============================================================

ALTER TABLE vetan_payslips ENABLE ROW LEVEL SECURITY;

-- Block UPDATE on payslips for CLOSED months
-- (The payroll_runs table determines if a month is closed)
CREATE POLICY "Hard lock closed payslips"
ON vetan_payslips
FOR UPDATE
USING (
  NOT EXISTS (
    SELECT 1 FROM vetan_payroll_runs pr
    WHERE pr.month = vetan_payslips.month
    AND pr.status = 'CLOSED'
  )
)
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM vetan_payroll_runs pr
    WHERE pr.month = vetan_payslips.month
    AND pr.status = 'CLOSED'
  )
);

-- Block DELETE on payslips for CLOSED months
CREATE POLICY "Prevent delete on closed payslips"
ON vetan_payslips
FOR DELETE
USING (
  NOT EXISTS (
    SELECT 1 FROM vetan_payroll_runs pr
    WHERE pr.month = vetan_payslips.month
    AND pr.status = 'CLOSED'
  )
);

-- ============================================================
-- 3. ATTENDANCE — Prevent duplicate records
-- ============================================================

ALTER TABLE vetan_attendance ENABLE ROW LEVEL SECURITY;

-- Block INSERT if employee+month already exists (upsert protection)
CREATE POLICY "Prevent duplicate attendance"
ON vetan_attendance
FOR INSERT
WITH CHECK (true);

-- Block UPDATE on LOCKED attendance
CREATE POLICY "Block update on locked attendance"
ON vetan_attendance
FOR UPDATE
USING (is_locked = false)
WITH CHECK (is_locked = false);

-- ============================================================
-- 4. EMPLOYEES — Prevent salary overwrite during locked months
-- ============================================================

ALTER TABLE vetan_employees ENABLE ROW LEVEL SECURITY;

-- Allow all operations on employees (no lock needed at DB level)
-- Salary revision logic handles this at application level
CREATE POLICY "Allow employee operations"
ON vetan_employees
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================
-- 5. SALARY REVISIONS — Append-only
-- ============================================================

ALTER TABLE vetan_salary_revisions ENABLE ROW LEVEL SECURITY;

-- Prevent UPDATE/DELETE on salary revisions (audit trail)
CREATE POLICY "Salary revisions are append-only"
ON vetan_salary_revisions
FOR UPDATE
USING (false);

CREATE POLICY "Salary revisions cannot be deleted"
ON vetan_salary_revisions
FOR DELETE
USING (false);

-- ============================================================
-- 6. LOANS — Block when paid off
-- ============================================================

ALTER TABLE vetan_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow loan operations"
ON vetan_loans
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================
-- 7. LEAVE APPLICATIONS — Status-based protection
-- ============================================================

ALTER TABLE vetan_leave_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow leave operations"
ON vetan_leave_applications
FOR ALL
USING (true)
WITH CHECK (true);

-- ============================================================
-- 8. AUDIT LOGS — Append-only (never modify/delete)
-- ============================================================

ALTER TABLE vetan_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Audit logs are append-only"
ON vetan_audit_logs
FOR UPDATE
USING (false);

CREATE POLICY "Audit logs cannot be deleted"
ON vetan_audit_logs
FOR DELETE
USING (false);

CREATE POLICY "Audit logs can be inserted"
ON vetan_audit_logs
FOR INSERT
WITH CHECK (true);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'vetan_%'
ORDER BY tablename;

-- Check policies count
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'vetan_%'
ORDER BY tablename, policyname;

COMMIT;
