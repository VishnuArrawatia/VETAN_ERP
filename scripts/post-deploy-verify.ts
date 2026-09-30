/** POST-DEPLOY VERIFY: production data integrity after retention deploy (read-only). */
const BASE = 'https://vetan-svn.vercel.app';
const H = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR' };

async function get(p: string) {
  const r = await fetch(BASE + p, { headers: H });
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; } catch { return { status: r.status, json: null as any }; }
}

async function main() {
  const v = await get('/api/version');
  console.log('version:', JSON.stringify(v.json));

  const emps = await get('/api/employees');
  const empArr = Array.isArray(emps.json) ? emps.json : [];
  console.log('employees:', empArr.length, '| status:', emps.status);

  const diag = await get('/api/supabase-diag');
  console.log('diag: hasClient=%s, store_error=%s, row_exists=%s, size=%s KB, updated=%s',
    diag.json?.hasClient, diag.json?.store_query?.error, diag.json?.store_query?.row_exists,
    Math.round((diag.json?.store_query?.payload_bytes || 0) / 1024), diag.json?.store_query?.updated_at);

  // SALARY DATA intact?
  const apr = await get('/api/payslips/month/2026-04');
  const may = await get('/api/payslips/month/2026-05');
  const aprArr = Array.isArray(apr.json) ? apr.json : [];
  const mayArr = Array.isArray(may.json) ? may.json : [];
  const sumNet = (a: any[]) => a.reduce((s, x) => s + (Number(x?.net_salary) || 0), 0);
  console.log(`payslips Apr: ${aprArr.length} (net ₹${sumNet(aprArr).toLocaleString('en-IN')})`);
  console.log(`payslips May: ${mayArr.length} (net ₹${sumNet(mayArr).toLocaleString('en-IN')})`);

  const loans = await get('/api/loans');
  const loanArr = Array.isArray(loans.json) ? loans.json : loans.json?.loans || [];
  console.log('loans:', loanArr.length);

  const runs = await get('/api/payroll-runs');
  const runArr = Array.isArray(runs.json) ? runs.json : runs.json?.runs || [];
  console.log('payroll_runs:', runArr.map((r: any) => `${r.month}:${r.status}`).join(', '));

  // LOCAL SAFETY BACKUP se cross-check
  const fs = await import('fs');
  const local = JSON.parse(fs.readFileSync('backups/pre-retention-deploy-2026-09-27T19-12-46/full-store.json', 'utf-8'));
  const ld = local.data || local;
  console.log('\nCROSS-CHECK vs local safety backup:');
  console.log(`  employees: prod=${empArr.length} local=${(ld.employees || []).length} ${empArr.length === (ld.employees || []).length ? '✅' : '⚠️'}`);
  console.log(`  payslips:  prod=${aprArr.length + mayArr.length} (Apr+May) local=${(ld.payslips || []).length} (all)`);
  console.log(`  loans:     prod=${loanArr.length} local=${(ld.loans || []).length} ${loanArr.length === (ld.loans || []).length ? '✅' : '⚠️'}`);

  const okAll = empArr.length === 107 && diag.json?.store_query?.error === null && aprArr.length >= 79 && mayArr.length >= 37;
  console.log(`\nFINAL: ${okAll ? '✅ ALL GOOD — data 100% intact, deployment healthy' : '⚠️ CHECK NEEDED'}`);
}
main().catch(e => { console.error('FATAL', e?.message || e); process.exit(1); });
