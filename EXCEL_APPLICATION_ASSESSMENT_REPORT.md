# VETAN ERP — Complete Application Assessment Report

**Classification:** Read-only technical assessment (no code or data changed)  
**Date:** 10 August 2026  
**Auditor:** Cursor Cloud Agent (Excel application assessment)  
**Repository:** `github.com/VishnuArrawatia/VETAN_ERP`  
**Scope requested:** All sheets, VBA modules, UserForms, attendance, leave, payroll, loan recovery, bugs, UI, database design, reports  

---

## 0. Scope note — Excel workbook not present

**No `.xls` / `.xlsx` / `.xlsm` workbook was found** in this repository or environment. There are **no VBA modules** and **no Excel UserForms** to decompile.

This run is titled *Excel application assessment*. The live system under assessment is the **VETAN ERP** web application — a multi-unit HRMS/payroll product that fills the same functional space as a classic Excel+VBA payroll workbook. For mapping purposes:

| Excel concept (requested) | Equivalent in VETAN ERP |
|---------------------------|-------------------------|
| Workbook sheets | React modules / ledgers / registers |
| VBA modules | `server/db.ts` business methods + `server.ts` routes + client calculators |
| UserForms | Login, Add Employee, Leave, Loan, F&F, Company wizard, Payroll PIN, etc. |
| Named ranges / macros | Types in `src/types.ts` + SQLite/JSON store |
| Reports / Pivot | Management Analytics, MD Dashboard, Excel/CSV exports |

**If the original `.xlsm` workbook is uploaded**, a second pass can map sheet-by-sheet and line-by-line against this report. Until then, this document is the complete assessment of **all analytics / all modules** available in the codebase.

**Existing `AUDIT_REPORT.md` (14 Jul 2026) is treated as stale marketing.** Several “PASSED / statutory certified” claims contradict the live engine (PF ceiling, OT rate, LWF, addresses, security).

---

## Executive verdict

VETAN ERP is a **broad, multi-unit payroll prototype** with strong UI coverage (attendance, leave, payroll, loans, F&F, ESS, MD analytics). It is **not** production-hardened:

1. **Auth is spoofable** (client-set headers; security often off; plaintext passwords).  
2. **Persistence is a JSON blob** (SQLite mirror + Supabase open RLS), not a relational ERP.  
3. **Attendance, leave, and payroll are loosely coupled** — leave/miss-punch approvals often do not write attendance.  
4. **Payroll math has compliance gaps** (no PF ₹15k ceiling on slips, no LWF, weak TDS/PT).  
5. **Loan recovery is employee-pooled**, not per-loan ledgered — concurrent loans corrupt outstanding.

**Overall:** Fit for controlled internal pilot with locked processes; **not** ready for unsupervised multi-tenant production without security + ledger redesign.

---

## Table of contents

1. [Module inventory (“all sheets”)](#1-module-inventory-all-sheets)  
2. [Business logic inventory (“VBA modules”)](#2-business-logic-inventory-vba-modules)  
3. [Forms inventory (“UserForms”)](#3-forms-inventory-userforms)  
4. [Attendance logic](#4-attendance-logic)  
5. [Leave control](#5-leave-control)  
6. [Payroll calculation](#6-payroll-calculation)  
7. [Loan recovery](#7-loan-recovery)  
8. [Bug register](#8-bug-register)  
9. [UI improvement suggestions](#9-ui-improvement-suggestions)  
10. [Database design suggestions](#10-database-design-suggestions)  
11. [Better reports](#11-better-reports)  
12. [Priority roadmap](#12-priority-roadmap)  

---

## 1. Module inventory (“all sheets”)

### 1.1 Primary HR shell (`App.tsx` tabs)

| Sheet / Module | Component | Purpose |
|----------------|-----------|---------|
| Dashboard | `Dashboard.tsx` | HR summary KPIs |
| Employee Master | Inline `App.tsx` | Directory + profile drawer |
| Attendance | `AttendanceSheet.tsx`, `FinancialYearAttendance.tsx` | Monthly matrix + FY grid |
| Leaves | `LeavesController.tsx`, `LeaveRegisterView.tsx` | Applications, approvals, register |
| Gate Pass | `FactoryGatePassView.tsx` | Factory exit / inter-unit |
| Payroll Register | `PayrollRegister.tsx` | Run / close / pay / slips / JV |
| Payroll Inputs | `PayrollInputManagementView.tsx` | Variable earnings & recoveries |
| Salary Revisions | `SalaryRevisionForm.tsx` | Increments |
| Loans | `LoanManagementView.tsx` | Disburse / EMI / settle / reports |
| Reports | `EmployeeLifeCycleReport.tsx`, `ManagementAnalyticsModule.tsx` | Lifecycle + analytics + ECR |
| HR Letters | `HRLettersHub.tsx` | Offer / confirmation templates |
| User Guide | `UserGuideView.tsx` | In-app documentation |
| Form 16 | `Form16Portal.tsx` | Annual tax estimate display |
| Full & Final | `FAndFController.tsx` | Exit settlement |
| Organization | `OrganizationStructure.tsx` | Org chart |
| Company Master | `CompanyMasterView.tsx` | Units + statutory settings |
| HOD Master | `HODMasterView.tsx` | Department heads |
| Shift Master | `ShiftMasterView.tsx` | Shifts + assignment |
| User / Role Master | `UserRoleMasterView.tsx` | HR operators |
| Audit & Backups | `AuditBackupsView.tsx` | Logs / restore |
| SQL Console | `SqlConsole.tsx` | Ad-hoc SELECT |
| DB Health | `DatabaseHealthView.tsx` | Sync / purge / health |
| Business Logic Vault | `BusinessLogicVault.tsx` | Policy docs + simulators (not live engine) |

### 1.2 Separate portals

| Portal | File | Audience |
|--------|------|----------|
| Login | `LoginPortal.tsx` | Employee / Admin |
| ESS | `EmployeePortal.tsx` | Self-service + HOD approvals |
| MD Dashboard | `ManagementDashboard.tsx` | MANAGEMENT role |
| Comp-off Ledger | `CompOffLedgerView.tsx` | Manual credit |
| HR Policy | `HRPolicyView.tsx` | Policy ack |
| Excel Import | `ExcelImportModal.tsx` | Bulk employee import |

### 1.3 Persistence layers (data “workbook”)

| Layer | Location | Role |
|-------|----------|------|
| In-memory store | `server/db.ts` `this.data` | Runtime truth for Express |
| JSON file | `payroll_persisted_store.json` / `public/data/payroll_store.json` | Offline / seed |
| SQLite | `Payroll.db` via `createTables` | Tabular mirror, weak constraints |
| Supabase | `vetan_erp_store.payload` jsonb | Cloud snapshot (`schema.sql`) |

---

## 2. Business logic inventory (“VBA modules”)

Canonical production math lives in **`/workspace/server/db.ts`**. UI vaults and App previews can diverge.

| Logical module | Key symbols | File |
|----------------|-------------|------|
| Tenant ACL | `getAllowedCompanies` | `server.ts` |
| Auth / PIN | `/api/hr/login`, `verifyPin`, `production_security_enabled` | `server.ts`, `db.ts` |
| Employee CRUD | `getEmployees`, `addEmployee`, … | `db.ts` |
| Attendance | `saveAttendance`, manual/bulk routes | `db.ts`, `server.ts` |
| Leave workflow | `addLeaveApplication`, `updateLeaveWorkflowStatus` | `db.ts` |
| Comp-off | `addCompOffRequest`, `addCompOffLedgerEntry` | `db.ts` |
| **Payroll engine** | **`calculateSingleSlip`**, **`runPayroll`** | **`db.ts` ~3439+** |
| Variable inputs | `updatePayslipFullVariableInputs` | `db.ts` |
| Freeze | `closePayroll`, `unlockPayroll`, `isPayrollLocked` | `db.ts` |
| Loans | `addLoan`, `settleLoan`, `skipLoanEmi`, `addLoanAmount` | `db.ts` |
| F&F | `calculateFFSettlement`, `saveFFSettlement` | `db.ts` |
| Form 16 | `calculateForm16` | `db.ts` |
| CTC | `computeCtcForEmployee` | `db.ts` |
| Company settings | `getCompanySettings` | `db.ts` |
| Revisions | `addSalaryRevision` | `db.ts` |

**Important:** `BusinessLogicVault.tsx` documents PF ceiling, OT 200%, leave accrual, late→LOP rules, etc., but those rules are **not bound** to `calculateSingleSlip` / attendance save.

---

## 3. Forms inventory (“UserForms”)

| Form | Location | Notes |
|------|----------|-------|
| Admin / Employee login | `LoginPortal.tsx` | Hardcoded fallback users in client |
| Add Employee megapage | `App.tsx` | ~60 fields; **wrong company option values** |
| Edit Employee / Profile | `App.tsx` drawer | KYC + salary mixed |
| Company 5-step wizard | `CompanyMasterView.tsx` | CSV textareas for org lists |
| User Role create/edit | `UserRoleMasterView.tsx` | Reveals plaintext passwords |
| HOD / Shift forms | `HODMasterView`, `ShiftMasterView` | Masters |
| Leave application | ESS + `LeavesController` | Client-side policy only |
| Miss-punch | ESS | Status-only on approve |
| Gate pass | `FactoryGatePassView` | Workflow |
| Loan create / settle / skip / top-up | `LoanManagementView` | Guarantors not collected in create UI |
| Salary revision | `SalaryRevisionForm` | Effective date not used in payroll |
| Payroll variable grid | `PayrollInputManagementView` | Excel upload supported |
| Payroll PIN (close/unlock) | `PayrollRegister` | Bypass when security off |
| F&F settlement | `FAndFController` | Multi-step approval |
| SQL / purge / restore | Ops views | High risk if exposed |

---

## 4. Attendance logic

### 4.1 Data model

One **monthly summary row** per employee (`Attendance` in `types.ts`):

- Breakdown: `present`, `absent`, `weekly_off`, `paid_holiday`, `leave`, `lwp`, `ot_hours`  
- Aggregates: `total_days`, `working_days`, `lop_days`, `overtime_hours`, `is_locked`

There is **no daily punch / biometric day table**.

### 4.2 Sheet formulas (`AttendanceSheet.tsx`)

**Calendar integrity:**

```text
Present + Absent + Weekly_Off + Paid_Holiday + Leave + LWP  ==  daysInMonth
```

**On commit:**

```text
working_days = Present + Weekly_Off + Paid_Holiday + Leave
lop_days     = Absent + LWP
```

Templates default to **WO=4, PH=1** (not shift-aware).

### 4.3 FY editor divergence

`FinancialYearAttendance.tsx` edits only `working_days` / `lop_days` / OT and forces:

```text
working_days + lop_days = total_days
```

It does not maintain P/A/WO/PH/Leave/LWP. February hardcoded to 28 days (no leap year).

### 4.4 How attendance feeds payroll

`runPayroll` → `calculateSingleSlip` uses:

```text
proration = (total_days - lop_days) / total_days
```

Detailed P/A columns matter only insofar as they define `lop_days`. Missing attendance is invented as **30 present / 0 LOP** inside `runPayroll` — full pay by default.

### 4.5 Attendance findings

| ID | Severity | Finding |
|----|----------|---------|
| A1 | High | Leave / miss-punch approvals do **not** update attendance |
| A2 | High | “Commit & lock” often does **not** set `is_locked`; lock is weakly enforced vs payroll CLOSED |
| A3 | Medium | Manual day API can inflate month beyond calendar days |
| A4 | Medium | Sheet vs FY editor can desync breakdown vs aggregates |
| A5 | Medium | Auto-create full-pay rows on GET attendance |
| A6 | Low | Fixed WO/PH templates ignore shift weekly-off |

---

## 5. Leave control

### 5.1 Types & balances

On employee master: `leave_balance_pl`, `leave_balance_cl`, `leave_balance_sl`.  
Defaults seeded ~**PL 18 / CL 6 / SL 6**. Policy UIs also claim 7/7, openings 15/7/8, portal fallbacks 21/6/3 — **inconsistent**.

### 5.2 Workflow

```text
PENDING_HOD → PENDING_HR → APPROVED  (balance deducted)
           ↘ REJECTED_HOD / REJECTED_HR
```

Implemented in `updateLeaveWorkflowStatus`. Deduction:

```text
leave_balance_* = max(0, balance - days)
```

No reject for insufficient balance (silent floor at 0). Re-approve can double-deduct.  
**SQLite `days` is INTEGER** while UI allows half-day `0.5`.

### 5.3 Accrual / carry-forward

Documented in Vault / LeavesController (PL 1.5/month, CF caps, year-end lapse) — **no scheduled accrual or lapse job exists**.

### 5.4 Comp-off (two disconnected systems)

1. `compoff_requests` — HOD→HR workflow; approve does **not** credit ledger  
2. `compoff_ledger` — manual credit; **no avail/consume API**  
3. ESS portal shows **fake** balances from employee-id hash  
4. MD panel mutates ledger objects during render (display corruption)

### 5.5 Leave findings

| ID | Severity | Finding |
|----|----------|---------|
| L1 | Critical | Approved leave does not post to monthly attendance |
| L2 | High | No server-side balance / overlap / notice validation |
| L3 | High | Re-approve can double-deduct |
| L4 | Medium | Policy numbers conflict across screens |
| L5 | Medium | Half-day vs INTEGER column |
| L6 | Medium | Comp-off request ≠ ledger ≠ portal |

---

## 6. Payroll calculation

### 6.1 Canonical engine

**`PayrollDB.calculateSingleSlip` / `runPayroll`** in `server/db.ts`.

`BusinessLogicVault` is documentation/simulator only.

### 6.2 Structure

```text
Heads: Basic, HRA, Special, Edu, Medical, Conveyance
DA   : forced 0
Modes: FIXED | PERCENTAGE | MIXED (payroll only treats PERCENTAGE as formula-locked)

Gross_rate = Basic + HRA + Special + Edu + Medical + Conveyance
CTC        = Gross + Employer_PF + Employer_ESIC + Bonus_payable(8.33% of Basic)
             (bonus is CTC accrual — not automatically in net)
```

### 6.3 Net formula (step by step)

```text
1. proration     = (totalDays - lopDays) / totalDays
2. earned_*      = round(rate_* × proration)     # per head
3. OT_pay        = OT_hours × round((Basic/(26×8))×1.5)
4. gross         = Σ earned_* + OT_pay
5. PF            = round(earned_basic × 12%)     # NO ₹15,000 ceiling
6. ESIC          = if full-rate gross ≤ 21,000: round(gross × 0.75%)
7. PT            = >15000→200; >10000→150; else 0
8. TDS estimate  = if (gross-PF-PT)×12 > 7L: 10% of excess / 12
9. Loan EMI      = min(EMI, remaining) summed across ACTIVE loans
10. + variable earnings / − variable recoveries (if preserved on slip)
11. net          = max(0, final_gross − total_deductions)

Note: lop_deduction is informational — LOP already applied via proration.
```

### 6.4 Freeze workflow

```text
Calculate → DRAFT → Close (CLOSED) → Pay (PAID)
Unlock: SUPER_HR + PIN (when security enabled)
```

Attendance edits blocked when payroll run is CLOSED.

### 6.5 Payroll findings

| ID | Severity | Finding |
|----|----------|---------|
| P1 | Critical | `runPayroll` **deletes** month slips then calc looks for `existingSlip` → **variable inputs wiped** |
| P2 | Critical | PF ₹15k wage ceiling **missing** on slips; ECR export may cap → books ≠ ECR |
| P3 | High | LWF **not implemented** |
| P4 | High | OT uses **1.5×**, not Factories Act 2× claimed in audit |
| P5 | High | Payslip edit payload (`pf/esic/pt/loan`) often **not applied** by `updatePayslipFullVariableInputs` |
| P6 | High | Missing attendance → default full 30-day pay |
| P7 | Medium | No mid-month join/exit proration; revisions ignore `effective_date` |
| P8 | Medium | Per-head rounding drift; ESIC eligibility vs contribution base inconsistent |
| P9 | Medium | TDS / Form 16 oversimplified and not reconciled |
| P10 | Medium | LOP shown as deduction in UI can double-count in edit preview |
| P11 | Low | App “formula month ≥ 2026-08” not mirrored in server engine |

---

## 7. Loan recovery

### 7.1 Model

Flat EMI from salary (not amortization). Fields: `amount`, `opening_balance`, `monthly_deduction`, `interest_rate` (**unused in math**), `additional_loans[]`, `settlements[]`, `skipped_months`, guarantors (schema yes / create UI no).

**API outstanding enrichment:**

```text
total_borrowed = opening_balance + Σ additional_loans
total_repaid   = Σ employee payslip.loan_deduction + Σ settlements
outstanding    = max(0, borrowed − repaid)
```

### 7.2 Payroll EMI (`calculateSingleSlip`)

For each ACTIVE loan:

```text
remaining = (opening + additional≤month) − Σ(all employee prior slip loan_deduction)
deduct    = min(EMI, remaining)
```

Settlements are **ignored** in remaining. Payslip stores **one pooled** `loan_deduction` with **no loan_id**.

### 7.3 Related paths

- Skip EMI can zero **entire** slip loan (all loans)  
- Skip after CLOSED payroll still mutates slips (no lock guard)  
- F&F uses `Σ ACTIVE amount − slips`, ignores settlements / opening+additional consistency; **does not close loans** on disbursement  
- UI FY ledger is **theoretical EMI**, not actual payslips  

### 7.4 Loan findings

| ID | Severity | Finding |
|----|----------|---------|
| R1 | Critical | Concurrent loans: employee-pooled deductions attributed to **each** loan → outstanding drift / premature CLOSE |
| R2 | High | Settlements ignored in payroll remaining → over-recovery risk |
| R3 | High | F&F recovery does not settle/close loan accounts |
| R4 | High | Interest rate stored but never applied |
| R5 | Medium | Skip EMI not lock-aware; unskip rebuilds single-loan EMI poorly |
| R6 | Medium | Policy max amount / installments / emi_start_month not enforced |
| R7 | Medium | Month-end Excel report uses scheduled EMI ≠ actual recovery |

---

## 8. Bug register

### 8.1 Critical — Security

| ID | Bug | Location |
|----|-----|----------|
| S1 | Tenant ACL trusts spoofable `X-Operator-*` headers; empty headers → unrestricted | `server.ts` `getAllowedCompanies` |
| S2 | `production_security_enabled` defaults `'0'` — password/PIN may be bypassed | `server.ts`, `db.ts` |
| S3 | Plaintext passwords in DB, seeds, frontend `SIMULATED_HR_USERS`, returned by `/api/hr/users` | multiple |
| S4 | Backup / restore / SQL dump endpoints weakly gated; PII + passwords exposable | `server.ts` |
| S5 | Supabase RLS `using (true)` — world R/W with anon key on full ERP blob | `supabase/schema.sql` |
| S6 | Login diagnostic logs password match | `server.ts` |

### 8.2 Critical / High — Functional

| ID | Domain | Bug |
|----|--------|-----|
| F1 | Master | Add Employee company options `SVN II` / `Sakar I` / `Sakar III` ≠ master IDs `SVN-II` / `Sakar-I` / `Sakar-III`; Flare/Zenivo missing |
| F2 | Leave↔Att | Leave approve does not update attendance |
| F3 | Att corr | Miss-punch approve does not update attendance |
| F4 | Payroll | Recalculate wipes variable incentives/recoveries |
| F5 | Payroll | No PF wage ceiling on slips |
| F6 | Loan | Concurrent-loan outstanding / EMI pool broken |
| F7 | Loan | Settlements not in EMI remaining |
| F8 | Comp-off | ESS fake balances; ledger unused for avail |
| F9 | Dashboard | Present / miss-punch metrics fabricated (estimates / modulo) |
| F10 | API | UI calls `/api/role-permissions`, `/api/admin/reset-requests` — not implemented |
| F11 | Persist | Dual write memory/SQLite/JSON/Supabase without distributed transactions |

### 8.3 Medium

- Leave half-day vs INTEGER; re-approve double deduct; insufficient balance silent  
- Attendance “lock” cosmetic; manual day inflation  
- PT slabs incomplete vs Gujarat rules; no LWF  
- Revision effective_date ignored; F&F loan/opening inconsistency  
- Address seeds (Savli vs Daman) inconsistent with company masters  
- `AUDIT_REPORT.md` claims Somnath GIDC / statutory PASS — code does not match  

---

## 9. UI improvement suggestions

1. **Replace Add Employee megapage** with a wizard (Identity → Statutory → Bank → Salary → Approvals). Bind company `<select>` to live `companies` master IDs only.  
2. **Never display plaintext passwords**; reset-only flows; strip `password` from all list APIs.  
3. **Dashboard honesty:** remove fabricated present/miss-punch; show “Awaiting biometric” or real day aggregates.  
4. **One attendance truth:** day grid → monthly rollup; leave/miss-punch approval should mutate the same day/month ledger with audit.  
5. **Payroll workspace:** single month cockpit — Attendance status → Inputs → Draft register → Exceptions → Close → Bank file. Highlight wiped-input risk until P1 fixed.  
6. **Loan stepper:** Employee → Principal/EMI → Guarantors → Approval; show **per-loan** outstanding and last recovery from payslip allocation.  
7. **Hide SQL / backup / purge** behind SUPER_HR + server session; redact PAN/Aadhaar/UAN in console results.  
8. **Offline/Vercel banner** when Express API unavailable — disable writes that only succeed locally.  
9. **Policy single source:** one Leave/PF/ESIC/PT config screen that **drives** the engine (retire conflicting Vault/portal numbers).  
10. **Motion / hierarchy:** keep brand-led login; reduce dense card stacks on MD dashboard into one composition per viewport job.  

---

## 10. Database design suggestions

### 10.1 Current assessment

- Supabase is a **single JSON document** (`vetan_erp_store`), not relational HRMS.  
- SQLite has wide tables but **almost no FKs**, weak uniqueness, denormalized names everywhere.  
- Leave balances and loan events are not transactional ledgers.  
- Tenancy is free-text `company` string matching.

### 10.2 Target relational outline

```text
orgs
companies (org_id, code UNIQUE, legal addresses, PF/ESIC/PT codes)
company_settings (company_id, key, value)
departments / designations / shifts  (company-scoped UNIQUE names)

users (password_hash, role, disabled)
user_company_rights (user_id, company_id)
sessions (token_hash, expires_at)          -- replace header spoofing

employees (company_id FK, emp_code UNIQUE per company, status, …)
employee_pii (encrypted aadhaar/pan, bank)
employee_compensation (effective_from, heads, structure_type)
leave_balances (employee_id, year, pl, cl, sl, compoff)
leave_transactions (delta, ref_application_id, posted_at)
leave_applications / attendance_corrections / gate_passes (FKs + workflow)

attendance_days (employee_id, work_date, status, ot_hours)   -- optional
attendance_months (employee_id, month, aggregates, UNIQUE)

payroll_runs (company_id, month, status, locked_at, locked_by)
payslips (run_id, employee_id, month, UNIQUE(employee_id,month))
payslip_lines (payslip_id, head_code, amount)                -- flexible heads

loans (employee_id, principal, emi, status, …)
loan_events (loan_id, type: DISBURSE|TOPUP|EMI|SKIP|SETTLE|INTEREST, amount, month, payslip_id)
loan_guarantors (loan_id, guarantor_employee_id)

salary_revisions (effective_date enforced by payroll)
ff_settlements + ff_line_items
audit_logs (actor, entity, before/after)
statutory_challan_maps (company_id, month, type, utr)
```

### 10.3 Migration path

1. Keep JSON blob as temporary read model.  
2. Normalize masters → attendance/leave → payroll → loans.  
3. Move writes to server service role; revoke open anon RLS.  
4. Enforce FKs + `user_company_rights` + sessions before multi-HR production.

---

## 11. Better reports

### Statutory
- EPF ECR from **payslip PF wages** (with ₹15k ceiling aligned to books), EPS 8.33/3.67 split, exits  
- ESIC contribution register (IP, wages, EE/ER) eligibility-aware  
- Professional Tax challan by unit/state with correct slabs  
- LWF half-yearly (once implemented)  
- Form 24Q / Form 16 with challan mapping (replace simplified 10% estimator)  
- Bonus Act tracking (8.33% accrued vs paid)

### HR
- Day-wise attendance register + LOP vs leave ledger reconciliation  
- Leave liability / PL encashment provision  
- Headcount movement (joiners / exits / transfers) by unit & category  
- Probation / notice / attrition watchlist  
- Policy acknowledgement compliance matrix  
- Gate-pass time-away by department  

### Finance
- Payroll JV by cost center with GL codes  
- Bank file audit (generated → paid → returned)  
- **Loan ageing** + EMI recovered vs locked payroll (per loan)  
- CTC vs cash cost variance (ER PF/ESIC)  
- Arrears / revision impact for a month  

### Management
- Unit-wise labour cost from **CLOSED** payslips only  
- OT hours & cost trend (compliance)  
- Increment budget vs actual  
- Staff vs Worker vs Contract mix  
- Pre-close exception: missing UAN / PAN / bank / Aadhaar  

---

## 12. Priority roadmap

### P0 — Stop data/security bleeding
1. Enable real auth (sessions/JWT); stop unrestricted empty-header ACL.  
2. Hash passwords; strip from APIs; force `production_security_enabled=1`.  
3. Lock down Supabase RLS / move writes server-side.  
4. Gate backup/SQL/restore.

### P1 — Make payroll trustworthy
5. Preserve variable inputs across recalculate.  
6. Align PF ceiling (and OT/PT/LWF) between slip, ECR, and Vault.  
7. Fix company ID dropdowns.  
8. Default missing attendance to **block** payroll, not auto-full-pay.

### P2 — Close ledger loops
9. Leave / miss-punch → attendance day/month postings.  
10. Per-loan recovery allocation on payslips; settlements in remaining.  
11. F&F closes loans and posts settlements.  
12. Single leave policy + accrual engine.

### P3 — Platform
13. Normalize DB schema; effective-dated compensation.  
14. Report catalog (§11).  
15. Retire or rewrite `AUDIT_REPORT.md` against automated test fixtures.

---

## Appendix A — Key file map

| Path | Role |
|------|------|
| `src/types.ts` | Domain model |
| `src/App.tsx` | Shell, employee forms, routing |
| `server.ts` | HTTP API, ACL, auth |
| `server/db.ts` | Persistence + **payroll/loan/leave engines** |
| `supabase/schema.sql` | Cloud JSON store |
| `src/components/AttendanceSheet.tsx` | Attendance sheet |
| `src/components/LeavesController.tsx` | Leave control |
| `src/components/PayrollRegister.tsx` | Payroll register |
| `src/components/LoanManagementView.tsx` | Loan recovery UI |
| `src/components/BusinessLogicVault.tsx` | Documented rules (non-binding) |
| `AUDIT_REPORT.md` | Prior certification (do not trust blindly) |

## Appendix B — Mental model

```text
[Attendance sheet] --lop_days--> [calculateSingleSlip] --net--> [Payslip]
[Leave approve] ----balance only-X-X-> (does not update attendance)
[Loan ACTIVE] ------pooled EMI------> payslip.loan_deduction
[Settlements] ------API outstanding-> (ignored by EMI remaining)
[F&F] --------------recovery amount-> (does not close loans)
[Vault docs] -------≠----------------> live engine
```

---

## Appendix C — Confirmation of constraints

- **No application code was modified** for this assessment.  
- **No Excel workbook** was available to extract VBA/UserForms from.  
- This report is the deliverable for “analyze all / find all bugs / suggest UI, DB, reports.”  

**End of report.**
