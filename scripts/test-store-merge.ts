/**
 * Unit tests for src/lib/storeMerge.ts — the no-data-loss merge layer shared by
 * the server and the browser writer.
 *
 * Run: npx esbuild scripts/test-store-merge.ts --bundle --platform=node --format=cjs --outfile=/tmp/test-store-merge.cjs && node /tmp/test-store-merge.cjs
 */
import {
  mergeStores,
  mergeRecordArrays,
  recordKey,
  recordTime
} from '../src/lib/storeMerge';

let failures = 0;
let passed = 0;

function assert(cond: boolean, label: string) {
  if (cond) {
    passed++;
  } else {
    failures++;
    console.error(`  ✗ FAIL: ${label}`);
  }
}

function assertEq(actual: any, expected: any, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed++;
  } else {
    failures++;
    console.error(`  ✗ FAIL: ${label}\n    expected ${e}\n    actual   ${a}`);
  }
}

// --- recordKey / recordTime helpers -------------------------------------
assertEq(recordKey({ id: 'EMP1' }), 'id:EMP1', 'recordKey uses id');
assertEq(recordKey({ username: 'alok' }), 'username:alok', 'recordKey falls back to username');
assertEq(recordKey('Accounts'), 's:Accounts', 'recordKey string arrays');
assert(recordTime({ updated_at: '2026-08-30T10:00:00Z' })! > recordTime({ updated_at: '2026-08-01T10:00:00Z' })!, 'recordTime compares updated_at');
assertEq(recordTime({ name: 'no ts' }), null, 'recordTime null for untimed');

// --- 1. Loans incident: local has 27 loans, remote has 0 — nothing lost -- 
const base1 = { employees: [{ id: 'E1', name: 'A' }], loans: [] };
const local1 = { employees: [{ id: 'E1', name: 'A' }], loans: [{ id: 'LN1', amount: 5000 }, { id: 'LN2', amount: 8000 }] };
const merged1 = mergeStores(base1, local1, 'incoming');
assertEq(merged1.loans.length, 2, 'loans only on one side survive the merge');

// --- 2. Payslip incident: remote has slips local lacks — remote-only kept ---
const local2 = { employees: [{ id: 'E1' }], payslips: [] };
const remote2 = { employees: [{ id: 'E1' }], payslips: [{ id: 'SLIP-E1-2026-04' }, { id: 'SLIP-E1-2026-05' }] };
const merged2 = mergeStores(local2, remote2, 'base'); // prefer local, still remote-only slips must stay
assertEq(merged2.payslips.length, 2, 'remote-only payslips kept even when prefer=base');

// --- 3. Both sides edited the SAME untimed record — prefer side wins ---
const base3 = { employees: [{ id: 'E1', department: 'Quality' }] };
const remote3 = { employees: [{ id: 'E1', department: 'QC' }] };
const preferBase = mergeStores(base3, remote3, 'base');
const preferIncoming = mergeStores(base3, remote3, 'incoming');
assertEq(preferBase.employees[0].department, 'Quality', 'untimed same-id conflict: prefer base keeps base');
assertEq(preferIncoming.employees[0].department, 'QC', 'untimed same-id conflict: prefer incoming keeps incoming');

// --- 4. Timed records: newer timestamp wins regardless of prefer side ----
const oldRec = { id: 'E1', department: 'QC', updated_at: '2026-08-01T10:00:00Z' };
const newRec = { id: 'E1', department: 'Quality', updated_at: '2026-08-30T10:00:00Z' };
const timedBaseWins = mergeRecordArrays([oldRec], [newRec], 'base');
const timedIncomingWins = mergeRecordArrays([newRec], [oldRec], 'incoming');
assertEq(timedBaseWins[0].department, 'Quality', 'newer timestamp wins even when prefer=base');
assertEq(timedIncomingWins[0].department, 'Quality', 'newer timestamp wins when prefer=incoming');

// --- 5. Departments: string arrays union without duplicates ---------------
const deptLocal = { departments: ['Accounts', 'Production'] };
const deptRemote = { departments: ['Accounts', 'HR'] };
const mergedDept = mergeStores(deptLocal, deptRemote, 'incoming');
assertEq(mergedDept.departments.length, 3, 'string departments union to 3 unique values');

// --- 6. Keys only on one side (settings / collections) always kept --------
const local6 = { employees: [{ id: 'E1' }], month_status: [{ id: 'M-2026-08', locked: true }] };
const remote6 = { employees: [{ id: 'E1' }], gate_passes: [{ id: 'GP001' }] };
const merged6 = mergeStores(local6, remote6, 'incoming');
assertEq(merged6.month_status.length, 1, 'local-only key kept');
assertEq(merged6.gate_passes.length, 1, 'remote-only key kept');

// --- 7. Users keyed by username (no id) dedupe correctly -------------------
const usersBase = { users: [{ username: 'alok', role: 'HR' }] };
const usersRemote = { users: [{ username: 'alok', role: 'SUPER_HR' }, { username: 'md', role: 'MD' }] };
const usersMerged = mergeStores(usersBase, usersRemote, 'base');
assertEq(usersMerged.users.length, 2, 'username-keyed users union to 2');
assertEq(usersMerged.users[0].role, 'HR', 'untimed username conflict keeps prefer=base copy');

// --- 8. Merge idempotency: merging same side twice changes nothing --------
const again = mergeStores(merged1, local1, 'incoming');
assertEq(again, merged1, 're-merging same store is idempotent');

// --- 9. Null / empty guards -------------------------------------------------
assertEq(mergeStores(null as any, remote6, 'incoming').employees?.length, 1, 'null base returns incoming');
assertEq(mergeStores(local6, null as any, 'incoming').employees?.length, 1, 'null incoming returns base');

console.log(`\n${passed} passed, ${failures} failed`);
process.exit(failures > 0 ? 1 : 0);
