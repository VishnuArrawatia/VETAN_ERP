import { computePrepaidStatus, hydratePrepaidAsset, packPrepaidMeta, prepaidStatusLabel } from '../src/lib/prepaidStatus';

let pass = 0, fail = 0;
function assert(name: string, cond: boolean, extra?: string) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? ' -> ' + extra : '')); }
}

const today = new Date('2026-09-02T00:00:00');

assert('No SIM -> NOT_ISSUED', computePrepaidStatus(null, today) === 'NOT_ISSUED');
assert('Returned -> SURRENDERED', computePrepaidStatus({ status: 'RETURNED' }, today) === 'SURRENDERED');
assert('Return date -> SURRENDERED', computePrepaidStatus({ status: 'ISSUED', return_date: '2026-08-01' }, today) === 'SURRENDERED');
assert('No validity -> ACTIVE', computePrepaidStatus({ status: 'ISSUED' }, today) === 'ACTIVE');
assert('Validity +30 -> ACTIVE', computePrepaidStatus({ status: 'ISSUED', validity_date: '2026-10-02' }, today) === 'ACTIVE');
assert('Validity +7 -> EXPIRING', computePrepaidStatus({ status: 'ISSUED', validity_date: '2026-09-09' }, today) === 'EXPIRING');
assert('Validity today -> EXPIRING', computePrepaidStatus({ status: 'ISSUED', validity_date: '2026-09-02' }, today) === 'EXPIRING');
assert('Validity yesterday -> EXPIRED', computePrepaidStatus({ status: 'ISSUED', validity_date: '2026-09-01' }, today) === 'EXPIRED');
assert('Label expired', prepaidStatusLabel('EXPIRED') === 'Expired / recharge pending');

const packed = packPrepaidMeta({ operator: 'Jio', mobile_number: '9876543210', validity_date: '2026-09-20', plan_amount: 199 });
const hydrated = hydratePrepaidAsset({
  id: 'AST-1',
  employee_id: 'E1',
  employee_name: 'Test',
  asset_name: 'SIM',
  serial_number: '9876543210',
  type: 'PREPAID_SIM',
  issue_date: '2026-04-01',
  status: 'ISSUED',
  condition: 'Good',
  prepaid_meta: packed
});
assert('Hydrate operator', hydrated.operator === 'Jio');
assert('Hydrate number', hydrated.mobile_number === '9876543210');
assert('Hydrate validity', hydrated.validity_date === '2026-09-20');
assert('Hydrated live EXPIRING window', computePrepaidStatus(hydrated, today) === 'ACTIVE');

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
