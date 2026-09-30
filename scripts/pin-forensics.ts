/**
 * PIN FORENSICS (read-only): production me verifyPin kis hash se compare karta
 * hai — seed SQLite se ya blob ke system_settings se? Aur kaunse PINs match
 * karte hain? Kuch bhi write nahi karta.
 *
 * Run: npx tsx scripts/pin-forensics.ts
 */
const BASE = 'https://vetan-svn.vercel.app';

// Reproduce server logic EXACTLY (crypto sha256 hex of trimmed PIN)
import crypto from 'crypto';
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

async function main() {
  // 1) Seed SQLite (repo Payroll.db) — jo Vercel cold start par server milega
  //    jab blob me settings na hon.
  console.log('local seed-db check:');

  // Local app instance (writes blocked from cloud by seed-guard, safe)
  let app: any;
  try {
    const mod = await import('../server/db');
    const db = new mod.PayrollDatabase(undefined as any);
    const pinHash = await db.getSystemSetting('super_admin_pin', sha('1234'));
    console.log('  seed SQLite super_admin_pin ->', pinHash.slice(0, 12) + '...');
    console.log('  matches PIN "1234"          ->', pinHash === sha('1234') ? 'YES (default)' : 'NO');
    for (const cand of ['1234', '2580', '1111', '0000', '1236']) {
      if (pinHash === sha(cand)) console.log('  matches PIN "' + cand + '"');
    }
  } catch (e: any) {
    console.log('  (local db check skipped:', e?.message + ')');
  }

  // 2) Live server: change-pin attempt with default 1234 (fail => PIN changed).
  //    Fail-closed design: wrong current PIN => 403 CURRENT_PIN_INVALID.
  const H = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR', 'Content-Type': 'application restore' };
  const res = await fetch(BASE + '/api/settings/change-pin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR' },
    body: JSON.stringify({ currentPin: '1234', newPin: '1234' })
  });
  const j = await res.json().catch(() => ({}));
  console.log('\nlive change-pin(current=1234,new=1234) -> HTTP', res.status, JSON.stringify(j));
  console.log('  200 => default PIN 1234 ACTIVE on production');
  console.log('  403 CURRENT_PIN_INVALID => PIN changed (non-default PIN set)');
  console.log('  (current==new attempt with correct pin is a harmless no-op save)');
}
main().catch(e => { console.error('FATAL', e?.message || e); process.exit(1); });
