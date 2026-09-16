/**
 * PHASE-2D SEED-WINDOW / RESURRECTION REGRESSION (pure merge-engine tests — no network, no production).
 *
 * Covers the exact live-proven production failure class:
 *   cold-start fallback -> SEED rows (7 dummies) -> union merge treats them as
 *   base-side one-sided records -> tombstone cannot suppress untimed copies
 *   (storeTs null) -> instance's next legit write carries dummies to the cloud.
 *
 * The production guard is _dropCloudTombstonedCollections (server/db.ts), which
 * uses isTombstoned(map, coll, item, 0) — the storeTs=0 sentinel that makes the
 * tombstone win over UNTIMED copies while timed re-creations still pass. These
 * tests prove the merge-engine semantics that the guard relies on.
 *
 * Run: npx tsx tests/phase2d-seedwindow.test.ts
 */
import { mergeStores, isTombstoned, getTombstones } from '../src/lib/storeMerge';

let pass = 0, fail = 0;
function assert(name: string, cond: boolean, extra?: string) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' -> ' + extra : '')); }
}

const TB = {
  employees: {
    // keys are recordKey(item) format — exactly what addTombstone() writes
    'id:EMP001': { deleted_at: '2026-09-16T10:00:00.000Z' },
    'id:EMP002': { deleted_at: '2026-09-16T10:00:00.000Z' }
  }
};

// A seed-style employee: NO updated_at / created_at (untimed) — exactly how
// SEED_EMPLOYEES enter this.data on a cold-start fallback instance.
const seedEmp = (id: string, name: string) => ({ id, name, company: 'SVN-1', status: 'ACTIVE' });

// ---- 1. Untimed seed copy MUST be suppressed by tombstone with storeTs=0 sentinel ----
assert('2D-1: tombstone suppresses untimed seed copy (storeTs=0)',
  isTombstoned(TB, 'employees', seedEmp('EMP001', 'Rahul Sharma'), 0) === true);

// ---- 2. Timed STALE copy (predates deletion) also suppressed ----
assert('2D-2: tombstone suppresses stale timed copy',
  isTombstoned(TB, 'employees', { id: 'EMP001', name: 'Rahul Sharma', created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-10T00:00:00Z' }, null) === true);

// ---- 3. Genuine RE-CREATION survives (created after deletion) ----
const recreated = { id: 'EMP001', name: 'Rahul Sharma (rejoin)', created_at: '2026-09-17T00:00:00Z', updated_at: '2026-09-17T00:00:00Z' };
assert('2D-3: legit re-creation (newer created_at) NOT suppressed',
  isTombstoned(TB, 'employees', recreated, 0) === false);

// ---- 4. mergeStores union: seed-side one-sided row re-enters WITHOUT belt ----
// This is the OLD behaviour (the bug): base carries the seed dummy, incoming is the clean cloud.
const cloud = { employees: [{ id: 'SV1ST0001', name: 'Real Employee', company: 'SVN-1' }] };
const seedStore = { employees: [seedEmp('EMP001', 'Rahul Sharma'), seedEmp('EMP002', 'Priya Patel')], payslips: [{ id: 'P1', employee_id: 'EMP001' }] };
const polluted = mergeStores(seedStore, cloud, 'incoming');
assert('2D-4: OLD BEHAVIOUR reproduced — seed rows survive union merge',
  polluted.employees.length === 3 && polluted.payslips.length === 1,
  `employees=${polluted.employees.length}`);

// ---- 5. Belt semantics (server/db.ts _dropCloudTombstonedCollections logic) ----
// (1) timed-stale suppression via isTombstoned(..., null); (2) demo-seed-id guard
// for UNTIMED tombstoned rows (EMP001–EMP007 can never be a legit re-creation).
const beltCleaned = polluted.employees.filter((e: any) => {
  if (isTombstoned(TB, 'employees', e, null)) return false;
  const key = 'id:' + e.id;
  if (/^id:EMP00[1-7]$/.test(key) && (TB.employees as any)[key]) return false;
  return true;
});
assert('2D-5: PHASE-2D belt removes tombstoned re-entries, keeps real rows',
  beltCleaned.length === 1 && beltCleaned[0].id === 'SV1ST0001',
  `employees=${beltCleaned.length}`);

// ---- 5b. Untimed LEGITIMATE re-creation (non-demo id) must SURVIVE the belt ----
// Mirrors Phase-2B Case D: HOD907 recreated with a fresh timestamp-less copy.
assert('2D-5b: belt keeps untimed legit re-creation (non-demo id)',
  (() => { const id = 'HOD907'; return !(isTombstoned(TB, 'employees', { id, name: 'v2' }, null) || (/^id:EMP00[1-7]$/.test('id:' + id) && (TB.employees as any)['id:' + id])); })());

// ---- 6. Cloud tombstones propagate through mergeStores (tombstones key preserved) ----
const cloudWithTb = { ...cloud, tombstones: TB };
const merged = mergeStores(seedStore, cloudWithTb, 'incoming');
assert('2D-6: tombstone map survives union merge',
  Object.keys(getTombstones(merged).employees || {}).length === 2);

// ---- 7. Untimed UNRELATED rows are NEVER dropped by the belt ----
assert('2D-7: unrelated untimed row not suppressed',
  isTombstoned(TB, 'employees', seedEmp('SV1ST0002', 'Real Person'), 0) === false);

// ---- 8. Same-id tombstone for another collection does not leak ----
assert('2D-8: collection isolation — other-collection rows unaffected',
  isTombstoned(TB, 'payslips', { id: 'EMP001' }, 0) === false);

// ---- 9. Delete+stale-edit case: timed record claiming to be newer but created BEFORE deletion ----
assert('2D-9: stale whole-record re-stamp (old created_at) still suppressed',
  isTombstoned(TB, 'employees', { id: 'EMP001', name: 'X', created_at: '2026-09-01T00:00:00Z', updated_at: '2026-09-20T00:00:00Z' }, null) === true);

// ---- 10. Full-store replacement (restore semantics) brings rows back — belt must not fight restore ----
// restoreFullBackupJSON clears matching tombstones before persisting; engine-level: a store whose
// tombstones no longer contain the id must keep the row.
const tbCleared = { employees: {} as any };
assert('2D-10: tombstone-cleared re-introduction (restore) not suppressed',
  isTombstoned(tbCleared, 'employees', seedEmp('EMP001', 'Rahul Sharma'), 0) === false);

console.log(`\nPHASE-2D SEED-WINDOW: ${pass}/${pass + fail} PASS`);
if (fail > 0) process.exit(1);
