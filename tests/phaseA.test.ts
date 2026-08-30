/** Phase A verification — pure calc engine + schema bootstrap (no server needed). */
import { PayrollDatabase } from '../server/db';

let pass = 0, fail = 0;
function assert(name: string, cond: boolean, extra?: string) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' -> ' + extra : '')); }
}

const db = new PayrollDatabase(); // constructor ok without init(); pure methods don't touch sqlite

// ---- 1. Wage-Equivalent Days exact rule ----
// 22.40 -> 22, 22.49 -> 22, 22.50 -> 22.5, 22.90 -> 22.5 (NOT 23), 23.00 -> 23, 23.50 -> 23.5
function wv(g: number, m: number) { return db.calculateWageEquivalentDays(g, m); }
assert('WV: 22.40 -> 22', wv(22.40 * 1, 1) === 22, String(wv(22.40 * 1, 1)));
assert('WV: 22.49 -> 22', wv(22.49, 1) === 22, String(wv(22.49, 1)));
assert('WV: 22.50 -> 22.5', wv(22.5, 1) === 22.5, String(wv(22.5, 1)));
assert('WV: 22.90 -> 22.5 (NOT 23)', wv(22.9, 1) === 22.5, String(wv(22.9, 1)));
assert('WV: 23.00 -> 23', wv(23, 1) === 23, String(wv(23, 1)));
assert('WV: 23.49 -> 23', wv(23.49, 1) === 23, String(wv(23.49, 1)));
assert('WV: 23.50 -> 23.5', wv(23.5, 1) === 23.5, String(wv(23.5, 1)));

// Exact blueprint examples (gross / minwage 511)
const MINW = 511;
assert('EX A: 11700/511 -> 22.5', db.calculateWageEquivalentDays(11700, MINW) === 22.5, String(db.calculateWageEquivalentDays(11700, MINW)));
assert('EX B: 10000/511 -> 19.5', db.calculateWageEquivalentDays(10000, MINW) === 19.5, String(db.calculateWageEquivalentDays(10000, MINW)));
assert('EX C: 15000/511 -> 29 (0.354 < 0.50)', db.calculateWageEquivalentDays(15000, MINW) === 29, String(db.calculateWageEquivalentDays(15000, MINW)));
assert('EX D: 4000/511 -> 7.5 (0.828 >= 0.50)', db.calculateWageEquivalentDays(4000, MINW) === 7.5, String(db.calculateWageEquivalentDays(4000, MINW)));

// ---- 2. Business NCP (PF/ESIC layer only) — Paid 26 example ----
const ncp = db.calculateBusinessNCP(26, 11700, MINW);
assert('NCP: applicable=22.5', ncp.applicableDays === 22.5, String(ncp.applicableDays));
assert('NCP: counted=22.5', ncp.countedWageDays === 22.5, String(ncp.countedWageDays));
assert('NCP: businessNcp=3.5', ncp.businessNcp === 3.5, String(ncp.businessNcp));

// Paid 26, gross 15000 -> counted 29.5 >= 26 -> applicable 26, ncp 0
const ncpC = db.calculateBusinessNCP(26, 15000, MINW);
assert('NCP C: applicable=26', ncpC.applicableDays === 26, String(ncpC.applicableDays));
assert('NCP C: businessNcp=0', ncpC.businessNcp === 0, String(ncpC.businessNcp));

// ---- 3. Zero-min-wage guard ----
assert('Zero min -> 0 counted', db.calculateWageEquivalentDays(10000, 0) === 0);

// ---- 3. getMinimumWage defaults to 511 when no rate configured (sqlite not attached in unit test, falls back) ----
const mw = await db.getMinimumWage('SVN-1');
assert('getMinimumWage default=511', mw === 511, String(mw));

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
