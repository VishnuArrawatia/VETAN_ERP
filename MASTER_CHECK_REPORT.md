# Vetan ERP — Master Data Health Check

============================================================
 VETAN ERP — MASTER & ESS HEALTH CHECK
 Date: 2026-09-04
============================================================

Summary: 0 FAIL · 18 WARN · 15 INFO


--- Employee Master ---
  [WARN] 73 employee(s) use a department not in Department Master (Store, Quality, HR & Admin, PPC, Dispatch & Logistics, Accounts & Finance, Operation Head, Sales & Marketing, Electrician, Moulding, SMT, MI, Extrusion, 0.5 Bulb, IT)
  [WARN] 6 PAN(s) fail format: SK1ST0006:ABCDE960F, SK1ST0077:ABCDE299F, SK1ST0089:ABCDE205F, SV1ST0002:ABCDE907F, SV2ST0011:ABCDE197F, SV2ST0013:ABCDE685F
  [WARN] 11 UAN(s) not 12 digits: SK3ST0007:10014103151, SK3ST0017:10099873646, SK3ST0018:10019346232, SK1ST0077:10045601738, SK1ST0078:10099017639, SV1ST0036:10034023091
  [WARN] 92 worker record(s) missing employee_category (Worker analytics will undercount): e.g. SK3ST0001, SK3ST0005, SK3ST0006, SK3ST0007, SK3ST0008
  [WARN] 92 worker record(s) missing gender (e.g. SK3ST0001, SK3ST0005, SK3ST0006, SK3ST0007, SK3ST0008)
  [WARN] 92 worker record(s) missing dob
  [WARN] 92 worker record(s) missing aadhaar_number
  [WARN] 39 record(s) missing phone (SK3ST0001, SK3ST0005, SK3ST0006, SK3ST0007, SK3ST0008…)

--- HOD Master ---
  [WARN] Live store has NO HODs but local SQLite backend has 4: HOD001 Alok Sharma (SVN-1/Production); HOD002 Ritesh Saxena (SVN-II/Quality); HOD003 Sanjay Rawat (Sakar-I/Maintenance); HOD004 Vimal Kumar (Sakar-III/Logistics) — HOD module will show empty in the deployed ERP.

--- User Role Master ---
  [WARN] Users present in local SQLite but NOT in live store: USR011 (varrawatia/SUPER_HR), USR012 (vks/MANAGEMENT), USR009 (audit/AUDITOR)

--- Shift Master ---
  [WARN] Shift Master is EMPTY — no shifts configured (General/Production/Night etc.). Employees have no shift mapping.

--- Loan Master ---
  [WARN] Loan Master is EMPTY in both store and SQLite backend.
  [WARN] But workspace file loans.json holds 27 loans (25 ACTIVE) that are NOT in the live store — likely a lost/unsynced update (e.g. LOAN-1787862874482-675).

--- ESS / Employee Portal ---
  [WARN] 2 employee(s) have NO password set (EMP006, EMP007) — they can still log in with Employee Code as first-time password.
  [WARN] ALL 100 employees still have needs_password_change=true — nobody has completed the first-login password change (ESS onboarding not done).
  [WARN] 39 employee(s) have no phone number (SK3ST0001, SK3ST0005, SK3ST0006, SK3ST0007, SK3ST0008, SK3ST0010…)
  [WARN] Newest payslip month in store is 2026-05 — no payslips for more recent months (Jun/Jul/Aug 2026 missing?).

--- Store integrity ---
  [WARN] employees.json differs from live store: 10 only in dump (SV1ST0097, SV1ST0098, SV1ST0099, SV1ST0100, SV1ST0101) , 5 only in store (SK1ST0019, FL1ST0019, FL1ST0016, SV1WR108, SV1WR146)

--- Employee Master ---
  [INFO] 100 records
  [INFO] Status split: ACTIVE=100
  [INFO] Staff=8, Worker/other=92

--- Company Master ---
  [INFO] 6 companies

--- Department Master ---
  [INFO] 13 departments: Production, QC, Maintenance, Stores, Purchase, Accounts, HR, Dispatch, Sales, Marketing, R&D, Administration, Finishing

--- HOD Master ---
  [INFO] store hods=0, Payroll.db hods=4

--- User Role Master ---
  [INFO] store users=8, Payroll.db users=11

--- Shift Master ---
  [INFO] store shifts=0, Payroll.db shifts=0

--- Contractor Master ---
  [INFO] store contractors=0, Payroll.db contractors=0
  [INFO] No contractor master records; 0 contractor name(s) referenced on employee records: 

--- Loan Master ---
  [INFO] store loans=0, Payroll.db loans=0, workspace loans.json=27

--- Salary Revision Master ---
  [INFO] store revisions=1, Payroll.db revisions=0

--- ESS / Employee Portal ---
  [INFO] Email present on all employees ✓
  [INFO] Payslips in store: 120 (2026-05=32, 2026-04=88)

--- Store integrity ---
  [INFO] payroll_persisted_store.json is IDENTICAL to shipped snapshot public/data/payroll_store.json (100 employees)

============================================================
 VERDICT: Masters structurally OK (warnings above should be reviewed)
============================================================
