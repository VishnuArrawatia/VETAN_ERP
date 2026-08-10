import { PayrollDatabase } from '../server/db.ts';

const db = new PayrollDatabase();
await db.init();

const emp = db.getEmployees().find(e => e.status === 'ACTIVE') || db.getEmployees()[0];
if (!emp) throw new Error('No employee');

const company = emp.company;
const month = '2026-09'; // dedicated smoke month
const companyEmps = db.getEmployees(company).filter(e => e.status === 'ACTIVE');

emp.base_salary = 50000;
emp.pf_opt_in = true;
db.updateEmployee(emp.id, { base_salary: 50000, pf_opt_in: true });

// --- Gap: missing attendance must block payroll ---
try {
  db.runPayroll(month, company);
  throw new Error('EXPECTED_FAIL: payroll should block without attendance');
} catch (e: any) {
  if (!/Attendance missing|not ready|not locked/i.test(e.message)) throw e;
  console.log('OK payroll blocked without attendance:', e.message.slice(0, 80));
}

// Commit attendance for ALL active employees in unit (unlocked first)
for (const e of companyEmps) {
  db.saveAttendance([{
    id: `ATT-${e.id}-${month}`,
    employee_id: e.id,
    month,
    total_days: 30,
    working_days: 30,
    lop_days: 0,
    overtime_hours: 0,
    present: 26,
    absent: 0,
    weekly_off: 4,
    paid_holiday: 0,
    leave: 0,
    lwp: 0,
    is_locked: false
  }]);
}

try {
  db.runPayroll(month, company);
  throw new Error('EXPECTED_FAIL: payroll should block when attendance unlocked');
} catch (e: any) {
  if (!/not locked|Lock/i.test(e.message)) throw e;
  console.log('OK payroll blocked when attendance unlocked');
}

// Lock attendance (unlock-then-lock path)
for (const e of companyEmps) {
  const att = db.getEmployeeAttendance(e.id).find(a => a.month === month)!;
  db.saveAttendance([{ ...att, is_locked: false }]); // ensure editable
  db.saveAttendance([{
    ...att,
    present: att.present ?? 26,
    absent: att.absent ?? 0,
    weekly_off: att.weekly_off ?? 4,
    paid_holiday: att.paid_holiday ?? 0,
    leave: att.leave ?? 0,
    lwp: att.lwp ?? 0,
    is_locked: true
  }]);
}
console.log('OK attendance commit & lock for', companyEmps.length, 'employees');

db.runPayroll(month, company);
let slip = db.getPayslipsByMonth(month, company).find(s => s.employee_id === emp.id);
if (!slip) throw new Error('No slip after payroll');

const expectedPf = Math.round(15000 * 0.12);
if (slip.pf_deduction !== expectedPf) {
  throw new Error(`PF ceiling failed: got ${slip.pf_deduction}, expected ${expectedPf}`);
}
console.log('OK PF ceiling', slip.pf_deduction);

db.updatePayslipFullVariableInputs(slip.id, {
  bonus_incentive: 2500,
  canteen_deduction: 120,
  salary_advance: 500,
  custom_deductions: 75,
  pf: 1000
});
slip = db.getPayslipsByMonth(month, company).find(s => s.employee_id === emp.id)!;
if (slip.bonus_incentive !== 2500) throw new Error('bonus not saved');
if (slip.salary_advance !== 500) throw new Error('advance not saved');
if (slip.custom_deductions !== 75) throw new Error('other deduction not saved');
if (slip.pf_deduction !== 1000) throw new Error('pf alias not applied');

db.runPayroll(month, company);
slip = db.getPayslipsByMonth(month, company).find(s => s.employee_id === emp.id)!;
if (slip.bonus_incentive !== 2500) throw new Error(`bonus wiped on recalc: ${slip.bonus_incentive}`);
if (slip.canteen_deduction !== 120) throw new Error('canteen wiped on recalc');
if (slip.salary_advance !== 500) throw new Error('advance wiped on recalc');
if (slip.custom_deductions !== 75) throw new Error('other wiped on recalc');
if (slip.pf_deduction !== 1000) throw new Error('manual pf wiped on recalc');
console.log('OK variable inputs / advance / other preserved across recalc');

// Leave posting requires unlock
try {
  db.updateLeaveWorkflowStatus(
    db.addLeaveApplication({
      id: '',
      employee_id: emp.id,
      employee_name: emp.name,
      company,
      leave_type: 'CL',
      start_date: `${month}-10`,
      end_date: `${month}-11`,
      days: 2,
      reason: 'smoke locked leave',
      status: 'PENDING_HR'
    } as any).id,
    'SUPER_HR',
    'APPROVE',
    'smoke'
  );
  throw new Error('EXPECTED_FAIL: leave approve should fail while attendance locked');
} catch (e: any) {
  if (!/locked/i.test(e.message)) throw e;
  console.log('OK leave blocked while attendance locked');
}

// Unlock attendance for leave/miss-punch posting
for (const e of companyEmps) {
  const att = db.getEmployeeAttendance(e.id).find(a => a.month === month)!;
  db.saveAttendance([{ ...att, is_locked: false }]);
}

const before = db.getEmployeeAttendance(emp.id).find(a => a.month === month)!;
const leaveBefore = before.leave || 0;
const presentBefore = before.present || 0;
const leave = db.addLeaveApplication({
  id: '',
  employee_id: emp.id,
  employee_name: emp.name,
  company,
  leave_type: 'CL',
  start_date: `${month}-10`,
  end_date: `${month}-11`,
  days: 2,
  reason: 'smoke test',
  status: 'PENDING_HR'
} as any);
db.updateLeaveWorkflowStatus(leave.id, 'SUPER_HR', 'APPROVE', 'smoke');
const after = db.getEmployeeAttendance(emp.id).find(a => a.month === month)!;
if ((after.leave || 0) !== leaveBefore + 2) throw new Error(`leave not posted: before=${leaveBefore} after=${after.leave}`);
if ((after.present || 0) !== presentBefore - 2) throw new Error(`present not reduced`);
console.log('OK leave approval posted to attendance');

const corr = db.addAttendanceCorrection({
  employee_id: emp.id,
  employee_name: emp.name,
  company,
  date: `${month}-12`,
  original_status: 'ABSENT',
  requested_status: 'PRESENT',
  reason: 'smoke miss punch'
});
corr.status = 'PENDING_HR';
after.absent = (after.absent || 0) + 1;
db.saveAttendance([after]);
const presentMid = after.present || 0;
const absentMid = after.absent || 0;
db.updateAttendanceCorrectionWorkflowStatus(corr.id, 'SUPER_HR', 'APPROVE', 'smoke');
const afterCorr = db.getEmployeeAttendance(emp.id).find(a => a.month === month)!;
if (corr.status !== 'APPROVED') throw new Error('correction not approved');
if ((afterCorr.present || 0) !== presentMid + 1) throw new Error(`miss-punch present mismatch`);
if ((afterCorr.absent || 0) !== absentMid - 1) throw new Error(`miss-punch absent mismatch`);
console.log('OK miss-punch posted to attendance');

// Locked attendance cannot be edited without unlock
db.saveAttendance([{ ...afterCorr, is_locked: true }]);
try {
  db.saveAttendance([{ ...afterCorr, present: 99, is_locked: true }]);
  throw new Error('EXPECTED_FAIL: locked attendance edit should fail');
} catch (e: any) {
  if (!/locked/i.test(e.message)) throw e;
  console.log('OK locked attendance edit blocked');
}

// Loan skip blocked when payroll CLOSED
db.closePayroll(month, company);
try {
  const loans = db.getLoans(emp.id);
  if (loans.length === 0) {
    db.addLoan({
      employee_id: emp.id,
      amount: 10000,
      monthly_deduction: 1000,
      month,
      status: 'ACTIVE'
    } as any);
  }
  const loan = db.getLoans(emp.id)[0];
  db.skipLoanEmi(loan.id, month, 'SKIP', 'smoke');
  throw new Error('EXPECTED_FAIL: skip EMI should fail when payroll CLOSED');
} catch (e: any) {
  if (!/CLOSED|frozen/i.test(e.message)) throw e;
  console.log('OK loan skip blocked when payroll CLOSED');
}

console.log('ALL SMOKE CHECKS PASSED');
