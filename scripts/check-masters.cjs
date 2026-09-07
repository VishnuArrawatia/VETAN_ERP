#!/usr/bin/env node
/**
 * Vetan ERP — Master Data Health Check
 * =====================================
 * Validates every master in the live ERP store (mirror of the Supabase
 * `vetan_erp_store` payload) and cross-checks the local SQLite backend
 * (Payroll.db) plus workspace data files.
 *
 * Usage:  node scripts/check-masters.cjs
 *
 * Sources checked:
 *   - payroll_persisted_store.json  (live store mirror, identical to
 *     public/data/payroll_store.json shipped with the app)
 *   - Payroll.db                    (Express/SQLite backend tables)
 *   - loans.json                    (workspace loan register dump, if any)
 *   - employees.json                (workspace employee dump, if any)
 *   - audit_*_payslips.json         (workspace payroll audit dumps, if any)
 *
 * Sections: 1-9 master data · 10 ESS / Employee Portal readiness.
 *
 * Severity: FAIL = broken integrity (blocks payroll / breaks references)
 *           WARN = data-quality or completeness gap (should be fixed)
 *           INFO = informational only
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

const ROOT = path.join(__dirname, '..');
const STORE_PATH = path.join(ROOT, 'payroll_persisted_store.json');
const SNAPSHOT_PATH = path.join(ROOT, 'public', 'data', 'payroll_store.json');
const DB_PATH = path.join(ROOT, 'Payroll.db');
const LOANS_DUMP_PATH = path.join(ROOT, 'loans.json');
const EMPS_DUMP_PATH = path.join(ROOT, 'employees.json');

// ---------------------------------------------------------------- helpers

const issues = [];
function fail(master, msg) { issues.push({ master, sev: 'FAIL', msg }); }
function warn(master, msg) { issues.push({ master, sev: 'WARN', msg }); }
function info(master, msg) { issues.push({ master, sev: 'INFO', msg }); }

function readJson(p, label) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.log(`  !! ${label}: cannot read (${e.message})`);
    return null;
  }
}

function distinct(vals) {
  return [...new Set(vals.map(String).filter((v) => v && v.trim() !== ''))];
}

// ---------------------------------------------------------------- data load

const store = readJson(STORE_PATH, 'payroll_persisted_store.json');
if (!store) process.exit(1);

const snapshot = readJson(SNAPSHOT_PATH, 'public/data/payroll_store.json');
const loansDump = readJson(LOANS_DUMP_PATH, 'loans.json');
const empsDump = readJson(EMPS_DUMP_PATH, 'employees.json');

// Payroll.db (SQLite backend)
const dbTables = {};
function queryDb(sql) {
  return new Promise((resolve) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);
    db.all(sql, (e, rows) => {
      db.close();
      resolve(e ? null : rows);
    });
  });
}
const DB = {
  hods: null, users: null, shifts: null, contractors: null, loans: null, revisions: null,
  async load() {
    const [hods, users, shifts, contractors, loans, revisions] = await Promise.all([
      queryDb('SELECT * FROM hods'),
      queryDb('SELECT id, username, name, role, title, disabled FROM users'),
      queryDb('SELECT * FROM shifts'),
      queryDb('SELECT * FROM contractors'),
      queryDb('SELECT id, employee_id, employee_name, amount, month, status FROM loans'),
      queryDb('SELECT * FROM salary_revisions')
    ]);
    DB.hods = hods || [];
    DB.users = users || [];
    DB.shifts = shifts || [];
    DB.contractors = contractors || [];
    DB.loans = loans || [];
    DB.revisions = revisions || [];
  }
};

// ---------------------------------------------------------------- 1. Employee Master

function checkEmployees() {
  const M = 'Employee Master';
  const emps = store.employees || [];
  const companyIds = new Set((store.companies || []).map((c) => String(c.id)));
  const deptMaster = new Set((store.departments || []).map((d) => String(d).toLowerCase().trim()));

  info(M, `${emps.length} records`);

  // duplicates
  const ids = emps.map((e) => String(e.id));
  const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  if (dupIds.length) fail(M, `Duplicate employee IDs: ${dupIds.join(', ')}`);

  const dupField = (field, label) => {
    const m = {};
    emps.forEach((e) => { const k = String(e[field] || '').trim(); if (k) (m[k] = m[k] || []).push(e.id); });
    const dups = Object.entries(m).filter(([, v]) => v.length > 1);
    if (dups.length) warn(M, `Duplicate ${label} across employees: ` + dups.slice(0, 6).map(([k, v]) => `${k} (${v.join(',')})`).join('; ') + (dups.length > 6 ? ` … (+${dups.length - 6} more)` : ''));
  };
  dupField('pan', 'PAN');
  dupField('uan', 'UAN');
  dupField('bank_account', 'bank account');

  // critical fields
  const critical = [
    ['id', 'ID'], ['name', 'Name'], ['company', 'Company'], ['status', 'Status'],
    ['joining_date', 'Joining date'], ['bank_name', 'Bank name'], ['bank_account', 'Bank account'],
    ['ifsc', 'IFSC']
  ];
  critical.forEach(([f, label]) => {
    const missing = emps.filter((e) => e[f] === undefined || e[f] === null || String(e[f]).trim() === '');
    if (missing.length) warn(M, `${label} missing on ${missing.length} record(s): ${missing.slice(0, 8).map((e) => e.id).join(', ')}`);
  });
  const noSalary = emps.filter((e) => !(Number(e.base_salary) > 0));
  if (noSalary.length) fail(M, `base_salary <= 0 or missing on ${noSalary.length}: ${noSalary.slice(0, 8).map((e) => e.id).join(', ')}`);

  // company / department references
  const badCompany = emps.filter((e) => !companyIds.has(String(e.company)));
  if (badCompany.length) fail(M, `${badCompany.length} employee(s) reference unknown company: ${[...new Set(badCompany.map((e) => e.company))].join(', ')}`);
  const badDept = emps.filter((e) => e.department && !deptMaster.has(String(e.department).toLowerCase().trim()));
  if (badDept.length) warn(M, `${badDept.length} employee(s) use a department not in Department Master (${distinct(badDept.map((e) => e.department)).join(', ')})`);

  // status
  const badStatus = emps.filter((e) => !['ACTIVE', 'EXIT', 'RESIGNED', 'INACTIVE'].includes(String(e.status).toUpperCase()));
  if (badStatus.length) warn(M, `Unexpected status values: ${distinct(badStatus.map((e) => e.status)).join(', ')}`);
  const statusCounts = emps.reduce((a, e) => { a[e.status] = (a[e.status] || 0) + 1; return a; }, {});
  info(M, `Status split: ${Object.entries(statusCounts).map(([k, v]) => `${k}=${v}`).join(', ')}`);

  // formats
  const badPan = emps.filter((e) => e.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(e.pan).trim().toUpperCase()));
  if (badPan.length) warn(M, `${badPan.length} PAN(s) fail format: ${badPan.slice(0, 6).map((e) => `${e.id}:${e.pan}`).join(', ')}`);
  const badUan = emps.filter((e) => e.uan && !/^\d{12}$/.test(String(e.uan).trim()));
  if (badUan.length) warn(M, `${badUan.length} UAN(s) not 12 digits: ${badUan.slice(0, 6).map((e) => `${e.id}:${e.uan}`).join(', ')}`);
  const badIfsc = emps.filter((e) => e.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(String(e.ifsc).trim().toUpperCase()));
  if (badIfsc.length) warn(M, `${badIfsc.length} IFSC(s) fail format: ${badIfsc.slice(0, 5).map((e) => `${e.id}:${e.ifsc}`).join(', ')}`);
  const badEmail = emps.filter((e) => e.email && !/^\S+@\S+\.\S+$/.test(String(e.email).trim()));
  if (badEmail.length) warn(M, `${badEmail.length} email(s) fail format: ${badEmail.slice(0, 5).map((e) => `${e.id}:${e.email}`).join(', ')}`);
  const badPhone = emps.filter((e) => e.phone && !/^\d{10}$/.test(String(e.phone).replace(/[^0-9]/g, '')));
  if (badPhone.length) warn(M, `${badPhone.length} phone(s) not 10 digits: ${badPhone.slice(0, 5).map((e) => `${e.id}:${e.phone}`).join(', ')}`);

  // dates
  const badDates = emps.filter((e) => e.joining_date && Number.isNaN(Date.parse(e.joining_date)));
  if (badDates.length) warn(M, `${badDates.length} joining_date(s) unparseable: ${badDates.slice(0, 5).map((e) => `${e.id}:${e.joining_date}`).join(', ')}`);
  const futureJoin = emps.filter((e) => e.joining_date && Date.parse(e.joining_date) > Date.now() + 86400000);
  if (futureJoin.length) warn(M, `${futureJoin.length} joining_date(s) in the future: ${futureJoin.slice(0, 5).map((e) => `${e.id}:${e.joining_date}`).join(', ')}`);

  // worker completeness (gender / dob / aadhaar / category)
  const staff = emps.filter((e) => String(e.employee_category || e.category || '').toLowerCase() === 'staff');
  const workers = emps.filter((e) => !staff.includes(e));
  const noGender = workers.filter((e) => !e.gender);
  const noDob = workers.filter((e) => !e.dob);
  const noAadhaar = workers.filter((e) => !e.aadhaar_number);
  const noCategory = workers.filter((e) => !e.employee_category);
  if (noCategory.length) warn(M, `${noCategory.length} worker record(s) missing employee_category (Worker analytics will undercount): e.g. ${noCategory.slice(0, 5).map((e) => e.id).join(', ')}`);
  if (noGender.length) warn(M, `${noGender.length} worker record(s) missing gender (e.g. ${noGender.slice(0, 5).map((e) => e.id).join(', ')})`);
  if (noDob.length) warn(M, `${noDob.length} worker record(s) missing dob`);
  if (noAadhaar.length) warn(M, `${noAadhaar.length} worker record(s) missing aadhaar_number`);
  const noPhone = emps.filter((e) => !e.phone);
  if (noPhone.length) warn(M, `${noPhone.length} record(s) missing phone (${noPhone.slice(0, 5).map((e) => e.id).join(', ')}…)`);
  info(M, `Staff=${staff.length}, Worker/other=${workers.length}`);
}

// ---------------------------------------------------------------- 2. Company Master

function checkCompanies() {
  const M = 'Company Master';
  const cos = store.companies || [];
  info(M, `${cos.length} companies`);
  const expected = ['SVN-1', 'SVN-II', 'Sakar-I', 'Sakar-III', 'Flare-1', 'Zenivo-1'];
  const ids = cos.map((c) => String(c.id));
  const missing = expected.filter((e) => !ids.includes(e));
  if (missing.length) fail(M, `Expected companies not present: ${missing.join(', ')}`);
  const extra = ids.filter((id) => !expected.includes(id));
  if (extra.length) warn(M, `Unexpected company ids: ${extra.join(', ')}`);

  const statutory = ['gst_number', 'pan_number', 'tan_number', 'cin_number', 'pf_number', 'esic_number', 'pt_number'];
  cos.forEach((c) => {
    const missingFields = statutory.filter((f) => !c[f]);
    if (missingFields.length) warn(M, `${c.id}: missing statutory field(s) ${missingFields.join(', ')}`);
  });
  const badGst = cos.filter((c) => c.gst_number && !/^[0-9A-Z]{15}$/.test(String(c.gst_number).trim().toUpperCase()));
  if (badGst.length) warn(M, `GST format suspect: ${badGst.map((c) => `${c.id}:${c.gst_number}`).join(', ')}`);
  const badPan = cos.filter((c) => c.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(String(c.pan_number).trim().toUpperCase()));
  if (badPan.length) warn(M, `Company PAN format suspect: ${badPan.map((c) => `${c.id}:${c.pan_number}`).join(', ')}`);
  const noUnit = cos.filter((c) => !c.unit_name);
  if (noUnit.length) warn(M, `unit_name missing on: ${noUnit.map((c) => c.id).join(', ')}`);
}

// ---------------------------------------------------------------- 3. Department Master

function checkDepartments() {
  const M = 'Department Master';
  const depts = (store.departments || []).map((d) => String(d).trim()).filter(Boolean);
  info(M, `${depts.length} departments: ${depts.join(', ')}`);
  const dup = depts.filter((d, i) => depts.indexOf(d) !== i);
  if (dup.length) warn(M, `Duplicate departments: ${[...new Set(dup)].join(', ')}`);
}

// ---------------------------------------------------------------- 4. HOD Master

function checkHods() {
  const M = 'HOD Master';
  const jsonHods = store.hods || [];
  info(M, `store hods=${jsonHods.length}, Payroll.db hods=${DB.hods.length}`);
  if (jsonHods.length === 0 && DB.hods.length === 0) {
    warn(M, 'HOD Master is empty — no HODs configured anywhere (leave approvals fall back to HR).');
    return;
  }
  if (jsonHods.length === 0 && DB.hods.length > 0) {
    warn(M, `Live store has NO HODs but local SQLite backend has ${DB.hods.length}: ${DB.hods.map((h) => `${h.id} ${h.name} (${h.company}/${h.department})`).join('; ')} — HOD module will show empty in the deployed ERP.`);
  }
  const companyIds = new Set((store.companies || []).map((c) => String(c.id)));
  [...jsonHods, ...DB.hods].forEach((h) => {
    if (h.company && !companyIds.has(String(h.company))) warn(M, `HOD ${h.id || h.name} references unknown company '${h.company}'`);
  });
}

// ---------------------------------------------------------------- 5. User / Role Master

function checkUsers() {
  const M = 'User Role Master';
  const jsonUsers = store.users || [];
  const dbUsers = DB.users || [];
  info(M, `store users=${jsonUsers.length}, Payroll.db users=${dbUsers.length}`);

  const jIds = new Set(jsonUsers.map((u) => String(u.id)));
  const onlyDb = dbUsers.filter((u) => !jIds.has(String(u.id)));
  if (onlyDb.length) warn(M, `Users present in local SQLite but NOT in live store: ${onlyDb.map((u) => `${u.id} (${u.username}/${u.role})`).join(', ')}`);

  const validRoles = ['SUPER_HR', 'MANAGEMENT', 'COMPANY_HR', 'ATTENDANCE_ONLY_HR', 'AUDITOR'];
  jsonUsers.forEach((u) => {
    if (!validRoles.includes(u.role)) warn(M, `${u.id} (${u.username}): unknown role '${u.role}'`);
    if (u.disabled === undefined && u.status === undefined) info(M, `${u.id} (${u.username}): no disabled flag`);
    const rights = u.company_rights || [];
    const companyIds = new Set((store.companies || []).map((c) => String(c.id)));
    const bad = rights.filter((r) => !companyIds.has(String(r)));
    if (bad.length) warn(M, `${u.username}: company_rights include unknown company(ies): ${bad.join(', ')}`);
  });
  const dupUsers = distinct(jsonUsers.map((u) => String(u.username).toLowerCase()));
  if (dupUsers.length !== jsonUsers.length) {
    const seen = {};
    const dups = jsonUsers.filter((u) => { const k = String(u.username).toLowerCase(); if (seen[k]) return true; seen[k] = 1; return false; });
    warn(M, `Duplicate usernames: ${dups.map((u) => u.username).join(', ')}`);
  }
}

// ---------------------------------------------------------------- 6. Shift Master

function checkShifts() {
  const M = 'Shift Master';
  const inStore = store.shifts || store.shift_master;
  info(M, `store shifts=${(inStore || []).length}, Payroll.db shifts=${DB.shifts.length}`);
  if ((inStore || []).length === 0 && DB.shifts.length === 0) {
    warn(M, 'Shift Master is EMPTY — no shifts configured (General/Production/Night etc.). Employees have no shift mapping.');
  } else {
    const shifts = [...(inStore || []), ...DB.shifts];
    const codes = distinct(shifts.map((s) => s.code || s.id));
    if (codes.length !== shifts.length) warn(M, `Duplicate shift codes among ${shifts.length} shifts`);
  }
}

// ---------------------------------------------------------------- 7. Contractor Master

function checkContractors() {
  const M = 'Contractor Master';
  const inStore = store.contractors || [];
  info(M, `store contractors=${inStore.length}, Payroll.db contractors=${DB.contractors.length}`);
  const emps = store.employees || [];
  const contractorNames = distinct(emps.map((e) => e.contractor).filter(Boolean));
  if (inStore.length === 0 && DB.contractors.length === 0) {
    info(M, `No contractor master records; ${contractorNames.length} contractor name(s) referenced on employee records: ${contractorNames.slice(0, 8).join(', ')}${contractorNames.length > 8 ? '…' : ''}`);
  }
}

// ---------------------------------------------------------------- 8. Loan Master

function checkLoans() {
  const M = 'Loan Master';
  const storeLoans = store.loans || [];
  info(M, `store loans=${storeLoans.length}, Payroll.db loans=${DB.loans.length}, workspace loans.json=${loansDump ? loansDump.length : 'n/a'}`);
  if (storeLoans.length === 0 && DB.loans.length === 0) {
    warn(M, 'Loan Master is EMPTY in both store and SQLite backend.');
    if (loansDump && loansDump.length) {
      const act = loansDump.filter((l) => l.status === 'ACTIVE').length;
      warn(M, `But workspace file loans.json holds ${loansDump.length} loans (${act} ACTIVE) that are NOT in the live store — likely a lost/unsynced update (e.g. ${loansDump[0]?.id}).`);
    }
    return;
  }
  const emps = new Set((store.employees || []).map((e) => String(e.id)));
  const all = [...storeLoans, ...DB.loans];
  const orphan = all.filter((l) => l.employee_id && !emps.has(String(l.employee_id)));
  if (orphan.length) warn(M, `${orphan.length} loan(s) reference unknown employee: ${orphan.slice(0, 5).map((l) => `${l.id}:${l.employee_id}`).join(', ')}`);
}

// ---------------------------------------------------------------- 9. Salary Revision Master

function checkRevisions() {
  const M = 'Salary Revision Master';
  const revs = store.salary_revisions || [];
  const dbRevs = DB.revisions || [];
  info(M, `store revisions=${revs.length}, Payroll.db revisions=${dbRevs.length}`);
  const all = [...revs, ...dbRevs];
  const emps = new Set((store.employees || []).map((e) => String(e.id)));
  all.forEach((r) => {
    if (!emps.has(String(r.employee_code || r.employee_id))) warn(M, `Revision ${r.id} references unknown employee '${r.employee_code || r.employee_id}'`);
    if (!(Number(r.new_salary) > 0)) warn(M, `Revision ${r.id}: new_salary invalid (${r.new_salary})`);
    if (Number(r.new_salary) < Number(r.old_salary)) warn(M, `Revision ${r.id}: salary DECREASED ${r.old_salary} → ${r.new_salary}`);
    if (r.effective_date && Number.isNaN(Date.parse(r.effective_date))) warn(M, `Revision ${r.id}: unparseable effective_date ${r.effective_date}`);
  });
}

// ---------------------------------------------------------------- 10. ESS / Employee Portal

function checkEss() {
  const M = 'ESS / Employee Portal';
  const emps = store.employees || [];

  // --- login readiness ---
  const noPw = emps.filter((e) => !e.password || String(e.password).trim() === '');
  if (noPw.length) warn(M, `${noPw.length} employee(s) have NO password set (${noPw.map((e) => e.id).join(', ')}) — they can still log in with Employee Code as first-time password.`);

  const needsChange = emps.filter((e) => e.needs_password_change);
  if (needsChange.length === emps.length) {
    warn(M, `ALL ${emps.length} employees still have needs_password_change=true — nobody has completed the first-login password change (ESS onboarding not done).`);
  } else if (needsChange.length) {
    info(M, `${needsChange.length}/${emps.length} employees still need a password change.`);
  }

  const defaultPw = emps.filter((e) => String(e.password || '').toLowerCase() === e.id.toLowerCase());
  if (defaultPw.length) info(M, `${defaultPw.length} employee(s) still on default (Employee Code) password: ${defaultPw.slice(0, 8).map((e) => e.id).join(', ')}`);

  // --- profile completeness shown in portal ---
  const noEmail = emps.filter((e) => !e.email);
  if (noEmail.length) warn(M, `${noEmail.length} employee(s) have no email (${noEmail.slice(0, 6).map((e) => e.id).join(', ')})`);
  else info(M, 'Email present on all employees ✓');
  const noPhone = emps.filter((e) => !e.phone);
  if (noPhone.length) warn(M, `${noPhone.length} employee(s) have no phone number (${noPhone.slice(0, 6).map((e) => e.id).join(', ')}…)`);
  const noBank = emps.filter((e) => !e.bank_account || !e.ifsc);
  if (noBank.length) warn(M, `${noBank.length} employee(s) missing bank/IFSC (${noBank.slice(0, 6).map((e) => e.id).join(', ')})`);
  const noLeave = emps.filter((e) => e.leave_balance_pl === undefined || e.leave_balance_pl === null);
  if (noLeave.length) warn(M, `${noLeave.length} employee(s) missing leave balances`);

  // --- payslip coverage in the portal ---
  const slips = store.payslips || [];
  const slipEmps = new Set(slips.map((s) => s.employee_id || s.employee_code));
  const noSlip = emps.filter((e) => !slipEmps.has(String(e.id)));
  const months = {};
  slips.forEach((s) => { const m = s.month || s.month_key; months[m] = (months[m] || 0) + 1; });
  info(M, `Payslips in store: ${slips.length} (${Object.entries(months).map(([m, c]) => `${m}=${c}`).join(', ')})`);
  if (slips.length === 0) {
    warn(M, 'No payslips at all — ESS "My Payslips" is empty for everyone.');
  } else {
    if (noSlip.length) warn(M, `${noSlip.length} of ${emps.length} employees have NO payslip in the portal (e.g. ${noSlip.slice(0, 8).map((e) => e.id).join(', ')}…)`);
    const latest = Object.keys(months).sort().pop() || '';
    if (latest < '2026-08') warn(M, `Newest payslip month in store is ${latest} — no payslips for more recent months (Jun/Jul/Aug 2026 missing?).`);
  }

  // --- cross-check against audit dumps (server-side evidence) ---
  const masterEmpIds = new Set(emps.map((e) => String(e.id)));
  for (const [f, month] of [['audit_apr_payslips.json', '2026-04'], ['audit_may_payslips.json', '2026-05']]) {
    try {
      const d = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
      const arr = Array.isArray(d) ? d : (d.payslips || []);
      const valid = arr.filter((s) => masterEmpIds.has(String(s.employee_id || s.employee_code)));
      const inStore = months[month] || 0;
      // Ignore orphan slips (employee not in current master) and extra store slips.
      if (valid.length > 0 && inStore < valid.length) {
        warn(M, `Store has ${inStore} payslips for ${month} but audit dump ${f} shows ${valid.length} for current employees — store looks stale/lost-update.`);
      }
    } catch { /* file missing/not JSON — skip */ }
  }
}

// ---------------------------------------------------------------- cross-checks

function crossChecks() {
  if (snapshot) {
    const same = JSON.stringify(snapshot.employees) === JSON.stringify(store.employees);
    info('Store integrity', `payroll_persisted_store.json ${same ? 'is IDENTICAL' : 'DIFFERS'} to shipped snapshot public/data/payroll_store.json (${store.employees.length} employees)`);
  }
  if (empsDump) {
    const ids = new Set(store.employees.map((e) => String(e.id)));
    const dumpIds = new Set(empsDump.map((e) => String(e.id)));
    const inDumpOnly = [...dumpIds].filter((id) => !ids.has(id));
    const inStoreOnly = [...ids].filter((id) => !dumpIds.has(id));
    if (inDumpOnly.length || inStoreOnly.length) {
      warn('Store integrity', `employees.json differs from live store: ${inDumpOnly.length} only in dump (${inDumpOnly.slice(0, 5).join(', ')}) , ${inStoreOnly.length} only in store (${inStoreOnly.slice(0, 5).join(', ')})`);
    } else {
      info('Store integrity', `employees.json matches live store (${empsDump.length} employees)`);
    }
  }
}

// ---------------------------------------------------------------- report

function report() {
  const rows = [];
  const order = ['FAIL', 'WARN', 'INFO'];
  order.forEach((sev) => {
    issues.filter((i) => i.sev === sev).forEach((i) => rows.push(i));
  });
  const failCount = issues.filter((i) => i.sev === 'FAIL').length;
  const warnCount = issues.filter((i) => i.sev === 'WARN').length;
  const infoCount = issues.filter((i) => i.sev === 'INFO').length;

  let out = '';
  out += '============================================================\n';
  out += ' VETAN ERP — MASTER & ESS HEALTH CHECK\n';
  out += ' Date: ' + new Date().toISOString().slice(0, 10) + '\n';
  out += '============================================================\n\n';
  out += `Summary: ${failCount} FAIL · ${warnCount} WARN · ${infoCount} INFO\n\n`;

  let lastMaster = '';
  rows.forEach((i) => {
    if (i.master !== lastMaster) {
      out += `\n--- ${i.master} ---\n`;
      lastMaster = i.master;
    }
    out += `  [${i.sev}] ${i.msg}\n`;
  });

  out += '\n============================================================\n';
  out += failCount === 0 ? ' VERDICT: Masters structurally OK (warnings above should be reviewed)\n' : ' VERDICT: ' + failCount + ' FAIL issue(s) must be fixed\n';
  out += '============================================================\n';

  console.log(out);
  const reportPath = path.join(ROOT, 'MASTER_CHECK_REPORT.md');
  fs.writeFileSync(reportPath, '# Vetan ERP — Master Data Health Check\n\n' + out);
  console.log(`Report saved → ${path.relative(ROOT, reportPath)}`);
}

// ---------------------------------------------------------------- main

(async () => {
  await DB.load();
  checkEmployees();
  checkCompanies();
  checkDepartments();
  checkHods();
  checkUsers();
  checkShifts();
  checkContractors();
  checkLoans();
  checkRevisions();
  checkEss();
  crossChecks();
  report();
})();