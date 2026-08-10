import { PayrollDatabase } from '../server/db.ts';

const db = new PayrollDatabase();
await db.init();

const emp = db.getEmployees().find(e => e.status === 'ACTIVE') || db.getEmployees()[0];
if (!emp) throw new Error('No employee');

emp.base_salary = 50000;
emp.pf_opt_in = true;
db.updateEmployee(emp.id, { base_salary: 50000, pf_opt_in: true });

const month = '2026-08';
db.saveAttendance([{
  id: `ATT-${emp.id}-${month}`,
  employee_id: emp.id,
  month,
  total_days: 31,
  working_days: 31,
  lop_days: 0,
  overtime_hours: 0,
  present: 27,
  absent: 0,
  weekly_off: 4,
  paid_holiday: 0,
  leave: 0,
  lwp: 0
}]);

db.runPayroll(month, emp.company);
let slip = db.getPayslipsByMonth(month, emp.company).find(s => s.employee_id === emp.id);
if (!slip) throw new Error('No slip after payroll');

const expectedPf = Math.round(15000 * 0.12);
if (slip.pf_deduction !== expectedPf) {
  throw new Error(`PF ceiling failed: got ${slip.pf_deduction}, expected ${expectedPf}`);
}
console.log('OK PF ceiling', slip.pf_deduction);

db.updatePayslipFullVariableInputs(slip.id, {
  bonus_incentive: 2500,
  canteen_deduction: 120,
  pf: 1000
});
slip = db.getPayslipsByMonth(month, emp.company).find(s => s.employee_id === emp.id)!;
if (slip.bonus_incentive !== 2500) throw new Error('bonus not saved');
if (slip.pf_deduction !== 1000) throw new Error('pf alias not applied');

db.runPayroll(month, emp.company);
slip = db.getPayslipsByMonth(month, emp.company).find(s => s.employee_id === emp.id)!;
if (slip.bonus_incentive !== 2500) throw new Error(`bonus wiped on recalc: ${slip.bonus_incentive}`);
if (slip.canteen_deduction !== 120) throw new Error('canteen wiped on recalc');
if (slip.pf_deduction !== 1000) throw new Error('manual pf wiped on recalc');
console.log('OK variable inputs preserved across recalc');

const leave = db.addLeaveApplication({
  id: '',
  employee_id: emp.id,
  employee_name: emp.name,
  company: emp.company,
  leave_type: 'CL',
  start_date: '2026-08-10',
  end_date: '2026-08-11',
  days: 2,
  reason: 'smoke test',
  status: 'PENDING_HR'
} as any);
const before = db.getEmployeeAttendance(emp.id).find(a => a.month === '2026-08')!;
const leaveBefore = before.leave || 0;
const presentBefore = before.present || 0;
db.updateLeaveWorkflowStatus(leave.id, 'SUPER_HR', 'APPROVE', 'smoke');
const after = db.getEmployeeAttendance(emp.id).find(a => a.month === '2026-08')!;
if ((after.leave || 0) !== leaveBefore + 2) throw new Error(`leave not posted: before=${leaveBefore} after=${after.leave}`);
if ((after.present || 0) !== presentBefore - 2) throw new Error(`present not reduced: before=${presentBefore} after=${after.present}`);
console.log('OK leave approval posted to attendance', { leave: after.leave, present: after.present });

const corr = db.addAttendanceCorrection({
  employee_id: emp.id,
  employee_name: emp.name,
  company: emp.company,
  date: '2026-08-12',
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
const afterCorr = db.getEmployeeAttendance(emp.id).find(a => a.month === '2026-08')!;
if (corr.status !== 'APPROVED') throw new Error('correction not approved');
if ((afterCorr.present || 0) !== presentMid + 1) throw new Error(`miss-punch present expected ${presentMid + 1} got ${afterCorr.present}`);
if ((afterCorr.absent || 0) !== absentMid - 1) throw new Error(`miss-punch absent expected ${absentMid - 1} got ${afterCorr.absent}`);
console.log('OK miss-punch posted to attendance', { present: afterCorr.present, absent: afterCorr.absent });

console.log('ALL SMOKE CHECKS PASSED');
