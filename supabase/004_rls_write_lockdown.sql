-- VETAN ERP — RLS WRITE LOCKDOWN (anon key se tampering band)
--
-- KYA BADALTA HAI:
--   Pehle: vetan_erp_store / vetan_erp_backups par policy (true) thi —
--          browser (anon/publishable key, jo JS bundle me public hota hai)
--          poora database READ + WRITE kar sakta tha (Aadhaar/bank/salary PII,
--          koi bhi DevTools se live data overwrite/ransom kar sakta tha).
--   Ab:    ANON = sirf READ (offline fallback + Database Health status ke liye).
--          WRITE sirf SERVER (service_role key, RLS bypass karta hai) se hoga.
--
-- KAISE CHALAYE:
--   1. https://supabase.com/dashboard → project VETAN_ERP → SQL Editor
--   2. New Query → ye poora file paste karo → Run
--   3. Verification section ka output dekho (policies list aani chahiye)
--
-- SAFETY:
--   - Server (Vercel function) service_role key use karta hai — uska saara
--     read/write pehle jaisa chalega. Kuch break nahi hoga.
--   - App me koi data loss nahi — ye sirf PERMISSION layer hai.
--   - Rollback: neeche SECTION ROLLBACK me diya hai.

BEGIN;

-- ============================================================
-- 1. LIVE STORE — anon read-only
-- ============================================================

alter table public.vetan_erp_store enable row level security;

-- Purani open policy hatao
drop policy if exists vetan_erp_store_all on public.vetan_erp_store;
drop policy if exists "vetan_erp_store_all" on public.vetan_erp_store;

-- READ: sabko (anon offline-fallback + status UI ke liye)
create policy vetan_erp_store_read
  on public.vetan_erp_store
  for select
  using (true);

-- WRITE (insert/update/delete): koi policy NAHI banate = anon ke liye DENIED.
-- Server service_role RLS bypass karta hai, uske liye policy ki zaroorat nahi.

-- ============================================================
-- 2. BACKUPS — anon read-only
-- ============================================================

alter table public.vetan_erp_backups enable row level security;

drop policy if exists vetan_erp_backups_all on public.vetan_erp_backups;
drop policy if exists "vetan_erp_backups_all" on public.vetan_erp_backups;

create policy vetan_erp_backups_read
  on public.vetan_erp_backups
  for select
  using (true);

-- ============================================================
-- 3. NORMALIZED TABLES (agar run hui hain) — same treatment
--    (jo tables exist nahi karti unpar errors ignore ho jayenge
--     kyunki DO block use kiya hai)
-- ============================================================

do $$
declare t text;
begin
  foreach t in array array[
    'vetan_companies','vetan_employees','vetan_attendance','vetan_payroll_runs',
    'vetan_payslips','vetan_salary_revisions','vetan_loans','vetan_loan_policy',
    'vetan_leave_applications','vetan_hr_users','vetan_hods','vetan_shifts',
    'vetan_departments','vetan_audit_logs','vetan_system_settings',
    'vetan_ff_settlements','vetan_attendance_corrections','vetan_compoff_requests',
    'vetan_overtime_requests','vetan_assets','vetan_month_status',
    'vetan_attendance_upload_batches'
  ] loop
    if exists (select 1 from information_schema.tables
               where table_schema='public' and table_name=t) then
      execute format('alter table public.%I enable row level security', t);
      -- drop any legacy open-all policy
      execute format('drop policy if exists %I on public.%I', t || '_all', t);
      -- read for everyone; writes only via service_role
      execute format('create policy %I on public.%I for select using (true)', t || '_read', t);
    end if;
  end loop;
end $$;

COMMIT;

-- ============================================================
-- VERIFICATION — policies list (select-only honi chahiye)
-- ============================================================

select tablename, policyname, cmd
from pg_policies
where schemaname = 'public' and tablename like 'vetan_%'
order by tablename, policyname;

-- ============================================================
-- SECTION ROLLBACK (agar kabhi wapas purana behaviour chahiye):
--
-- drop policy if exists vetan_erp_store_read on public.vetan_erp_store;
-- create policy vetan_erp_store_all on public.vetan_erp_store for all using (true) with check (true);
-- drop policy if exists vetan_erp_backups_read on public.vetan_erp_backups;
-- create policy vetan_erp_backups_all on public.vetan_erp_backups for all using (true) with check (true);
-- ============================================================
