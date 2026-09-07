#!/usr/bin/env node
/**
 * Merge server-audited payslips into the live ERP store.
 * =======================================================
 * The live store (payroll_persisted_store.json + public/data/payroll_store.json)
 * only held 54 payslips (2026-04=52, 2026-05=2). The server audit dumps
 * (audit_apr_payslips.json = 92, audit_may_payslips.json = 32) contain the
 * authoritative/corrected slips (real PAN/UAN/bank + department names).
 *
 * Policy: union by slip id. Where an id exists in both, the audit dump version
 * wins (it reflects the live server). Store-only slips are kept. Slips whose
 * employee is NOT in the current Employee Master are skipped (orphans — they
 * stay in the audit dumps and would only pollute the ESS portal).
 *
 * Usage:  node scripts/merge-payslips.cjs
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STORE_PATH = path.join(ROOT, 'payroll_persisted_store.json');
const SNAPSHOT_PATH = path.join(ROOT, 'public', 'data', 'payroll_store.json');
const DUMPS = ['audit_apr_payslips.json', 'audit_may_payslips.json'];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const store = readJson(STORE_PATH);
const employees = store.employees || [];
const empIds = new Set(employees.map((e) => String(e.id)));
const slips = Array.isArray(store.payslips) ? store.payslips : [];

const byId = new Map();
slips.forEach((s) => { if (s && s.id) byId.set(s.id, s); });

let added = 0;
let replaced = 0;
let identical = 0;
let skippedOrphan = 0;
const skippedOrphanIds = [];

for (const dumpFile of DUMPS) {
  const dump = readJson(path.join(ROOT, dumpFile));
  const arr = Array.isArray(dump) ? dump : (dump.payslips || []);
  for (const s of arr) {
    if (!s || !s.id) continue;
    if (!empIds.has(String(s.employee_id || s.employee_code))) {
      skippedOrphan++;
      if (skippedOrphanIds.length < 12) skippedOrphanIds.push(s.id);
      continue; // not a current employee — keep out of the portal
    }
    const existing = byId.get(s.id);
    if (!existing) {
      byId.set(s.id, s);
      added++;
    } else if (JSON.stringify(existing) !== JSON.stringify(s)) {
      byId.set(s.id, s); // dump version wins
      replaced++;
    } else {
      identical++;
    }
  }
}

const merged = [...byId.values()];

// --- sanity checks ---
const dupIds = merged.length - new Set(merged.map((s) => s.id)).size;
const orphans = merged.filter((s) => !empIds.has(String(s.employee_id || s.employee_code)));
const months = {};
merged.forEach((s) => { const m = s.month || s.month_key; months[m] = (months[m] || 0) + 1; });
const covered = new Set(merged.map((s) => String(s.employee_id || s.employee_code)));
const uncovered = employees.filter((e) => !covered.has(String(e.id)));

console.log(`Store payslips before: ${slips.length}`);
console.log(`Added: ${added} · Replaced (dump wins): ${replaced} · Identical: ${identical}`);
console.log(`Skipped orphan slips (employee not in master): ${skippedOrphan} ${skippedOrphanIds.join(', ')}`);
console.log(`Store payslips after: ${merged.length}  (${Object.entries(months).map(([m, c]) => `${m}=${c}`).join(', ')})`);
console.log(`Duplicate ids: ${dupIds}`);
console.log(`Employees with >=1 payslip: ${covered.size}/${employees.length}${uncovered.length ? ' — MISSING: ' + uncovered.slice(0, 8).map((e) => e.id).join(', ') : ' — all employees covered ✓'}`);

if (dupIds > 0) {
  console.error('ABORT: merge would introduce duplicate ids — fix data first.');
  process.exit(1);
}
if (uncovered.length > 0) {
  console.warn(`NOTE: ${uncovered.length} employee(s) still have no payslip after merge (no data exists for them in dumps or store).`);
}

// --- write both store files, preserving CRLF + trailing-newline convention ---
function writeStore(obj, filePath, trailingNewline) {
  const text = JSON.stringify(obj, null, 2).replace(/\n/g, '\r\n');
  fs.writeFileSync(filePath, trailingNewline ? text + '\r\n' : text);
}

const next = { ...store, payslips: merged };
writeStore(next, STORE_PATH, false);   // payroll_persisted_store.json: no trailing newline
writeStore(next, SNAPSHOT_PATH, true); // public/data/payroll_store.json: trailing CRLF

console.log('\nWritten to:');
console.log('  ' + path.relative(ROOT, STORE_PATH));
console.log('  ' + path.relative(ROOT, SNAPSHOT_PATH));
console.log('\nNext: open the ERP and use Database Health → "Upload / Sync to Supabase" if the cloud store is older.');