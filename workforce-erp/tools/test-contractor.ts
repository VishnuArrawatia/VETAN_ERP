/* Automated business-rule tests for Contractor Bill / Commission / PF / ESIC logic.
 * Run:  npx tsx tools/test-contractor.ts   (from workforce-erp folder)
 * Covers spec §12 Test 1-10. */
import type { AppState, WorkerRec } from '../src/types';
import { computeBill, computeBills } from '../src/lib/contractor';
import { calcPayroll } from '../src/lib/payroll';

const r2 = (n: number) => Math.round(n * 100) / 100;

function mkWorker(p: Partial<WorkerRec>): WorkerRec {
  return {
    id: p.id || 'wx', code: p.code || 'X001', name: p.name || 'Test Worker',
    unitId: p.unitId || 'u2', companyId: p.companyId || 'c-sak',
    contractor: p.contractor ?? 'ct1', department: 'Assembly', gender: 'M', doj: '2026-01-01',
    uan: '', bank: '', ac: '', ifsc: '',
    mode: p.mode || 'Contractor', workingHours: p.workingHours ?? 12,
    rateBasic: p.rateBasic ?? 400, rateHra: p.rateHra ?? 100, rateOther: p.rateOther ?? 25,
    rateDay: (p.rateBasic ?? 400) + (p.rateHra ?? 100) + (p.rateOther ?? 25),
    ctc: 0, minWage: 0,
    pf: p.pf ?? true, esic: p.esic ?? false, active: true, revisions: p.revisions || []
  } as WorkerRec;
}

function mkState(): AppState {
  const workers: WorkerRec[] = [
    mkWorker({ id: 'w-ct', code: 'CTW001', name: 'Contractor Worker 12h', unitId: 'u1', companyId: 'c-svn' }),
    mkWorker({ id: 'w-comp', code: 'CPW001', name: 'Company Worker', mode: 'Company', contractor: '' }),
    mkWorker({ id: 'w-s3', code: 'S3W001', name: 'Sakar-III Worker', unitId: 'u3', esic: true }),
    mkWorker({ id: 'w-esicoff', code: 'S1W001', name: 'Sakar-I Worker ESIC off', unitId: 'u2', esic: true }),
    mkWorker({ id: 'w-loan', code: 'CTW002', name: 'Worker With Loan', unitId: 'u1', companyId: 'c-svn', esic: true })
  ];
  return {
    companies: [
      { id: 'c-svn', name: 'SVN Opto Electronics Pvt Ltd', short: 'SVN Opto' },
      { id: 'c-sak', name: 'Sakar Electricals & Electronics Pvt. Ltd.', short: 'Sakar Elec' }
    ],
    units: [
      { id: 'u1', name: 'SVN-II', companyId: 'c-svn' },
      { id: 'u2', name: 'Sakar-I', companyId: 'c-sak' },
      { id: 'u3', name: 'Sakar-III', companyId: 'c-sak', esic: true }
    ],
    workers,
    attendance: [
      { id: 'a1', monthKey: '2026-07', workerId: 'w-ct', present: 26, absent: 0, weeklyOff: 0, paidHoliday: 0, leave: 0, lwp: 0, otHours: 0 },
      { id: 'a2', monthKey: '2026-07', workerId: 'w-comp', present: 26, absent: 0, weeklyOff: 0, paidHoliday: 0, leave: 0, lwp: 0, otHours: 0 },
      { id: 'a3', monthKey: '2026-07', workerId: 'w-s3', present: 26, absent: 0, weeklyOff: 0, paidHoliday: 0, leave: 0, lwp: 0, otHours: 0 },
      { id: 'a4', monthKey: '2026-07', workerId: 'w-esicoff', present: 26, absent: 0, weeklyOff: 0, paidHoliday: 0, leave: 0, lwp: 0, otHours: 0 },
      { id: 'a5', monthKey: '2026-07', workerId: 'w-loan', present: 26, absent: 0, weeklyOff: 0, paidHoliday: 0, leave: 0, lwp: 0, otHours: 0 }
    ],
    leave: [], loans: [
      { id: 'l1', monthKey: '2026-07', workerId: 'w-loan', loanAmount: 0, loanDeduction: 500, advanceAmount: 2000, advanceDeduction: 1000, otherDeductions: 150, outstanding: 0, remarks: '' }
    ],
    pfChallans: [], contractorBills: [],
    contractors: [{ id: 'ct1', name: 'Test Contractor', code: 'CTC-01', address: 'Plot 5, Industrial Area', gstNo: '27ABCDE1234F1Z5', pf: true, esic: true, commissionPerDay: 25, gstRate: 0.18, tdsRate: 0.02 }],
    settings: {
      pfEmp: 0.12, pfEr: 0.12, esicEmp: 0.0175, esicEr: 0.0325, bonusRate: 0.0833,
      pfCeiling: 0, departments: [], commissionRates: []
    }
  } as AppState;
}