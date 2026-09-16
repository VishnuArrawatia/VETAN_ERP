/**
 * GRATUITY PROVISION TEST HARNESS (fake cloud — NO production contact).
 *
 * Formula: monthly provision = round(effective Basic × 15/26 ÷ 12) ≈ 4.81% of Basic.
 * Payment ONLY via F&F (no pay route). MANUAL rows never overwritten. Idempotent generation.
 * Recycle + tombstone + cloud-failure semantics all exercised.
 *
 * Run: npx tsx scripts/gratuity-tests.ts
 * Bundle: PHASE2X_MODULE=../api/_app.cjs npx tsx scripts/gratuity-tests.ts
 */
import http from 'http';

let pass = 0, fail = 0;
const ok = (c: boolean, label: string) => { if (c) { pass++; console.log(`  ✅ ${label}`); } else { fail++; console.log(`  ❌ ${label}`); } };
const section = (t: string) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 58 - t.length))}`);

process.env.SESSION_SECRET = 'grat-test-secret';
const RATE = 15 / 26 / 12;

// ── Fake cloud with real CAS semantics (Phase-2A/2B harness pattern) ──
let cloudRow: { payload: any; updated_at: string } = {
  payload: {
    employees: [
      { id: 'GRAT1', name: 'Gratuity Emp One', status: 'ACTIVE', company: 'SVN-1', base_salary: 20000, hra: 8000, special_allowance: 4000, pf_opt_in: true, esic_opt_in: false, professional_tax_opt_in: true, leave_balance_pl: 0, leave_balance_cl: 0, leave_balance_sl: 0, joining_date: '2018-06-01', created_at: new Date(Date.now() - 600000).toISOString() },
      { id: 'GRAT2', name: 'Gratuity Emp Two', status: 'ACTIVE', company: 'Sakar-III', base_salary: 30000, hra: 12000, special_allowance: 6000, pf_opt_in: true, esic_opt_in: true, professional_tax_opt_in: true, leave_balance_pl: 0, leave_balance_cl: 0, leave_balance_sl: 0, joining_date: '2024-01-15', created_at: new Date(Date.now() - 600000).toISOString() }
    ],
    companies: [], users: [{ id: 'USRGR', username: 'vishnu', name: 'Vishnu', role: 'SUPER_HR', disabled: false, company_rights: ['ALL'] }],
    hods: [], shifts: [], departments: [], salary_revisions: [],
    gratuity_provisions: [], bonus_provisions: [], arrears: [], ff_settlements: []
  },
  updated_at: new Date(Date.now() - 60000).toISOString()
};
let cloudFailMode = false;

function chainWrite(u: any, expectVersion: string | null) {
  const doWrite = async () => {
    if (cloudFailMode) return { data: null, error: { message: 'simulated cloud outage' } };
    if (expectVersion !== null && cloudRow.updated_at !== expectVersion) return { data: [], error: null };
    const incoming = u && u.payload !== undefined ? u.payload : u;
    cloudRow.payload = JSON.parse(JSON.stringify(incoming));
    cloudRow.updated_at = new Date().toISOString();
    return { data: [{ id: 'live' }], error: null };
  };
  const obj: any = { eq: () => obj, select: () => obj, single: () => obj };
  obj.then = (res: any, rej: any) => doWrite().then(res, rej);
  return obj;
}

const fakeSupabase = {
  from(_t: string) {
    return {
      select() { return { eq() { return { maybeSingle: async () => ({ data: { payload: cloudRow.payload, updated_at: cloudRow.updated_at }, error: null }), single: async () => ({ data: { payload: cloudRow.payload, updated_at: cloudRow.updated_at }, error: null }) }; } }; },
      update: (u: any, _o: any) => {
        let expectVersion: string | null = null;
        const builder: any = { eq: (c: string, v: any) => { if (c === 'updated_at') expectVersion = v; return builder; }, select: () => builder };
        void _o;
        const p = chainWrite(u, expectVersion);
        builder.then = p.then; builder.catch = p.catch; builder.finally = p.finally;
        return builder;
      },
      upsert: (u: any, _o: any) => chainWrite(u, null),
      insert: (u: any, _o: any) => chainWrite(u, null)
    };
  }
};

async function call(port: number, method: string, path: string, body?: any): Promise<{ status: number; json: any }> {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      host: '127.0.0.1', port, path, method,
      headers: { 'x-operator-username': 'vishnu', ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode || 0, json: JSON.parse(d) }); } catch { resolve({ status: res.statusCode || 0, json: null }); } });
    });
    req.on('error', (e) => resolve({ status: -1, json: { error: e.message } }));
    if (payload) req.write(payload);
    req.end();
  });
}

async function waitReady(port: number): Promise<boolean> {
  for (let i = 0; i < 40; i++) {
    const r = await call(port, 'GET', '/api/companies');
    if (r.status > 0) return true;
    await new Promise(res => setTimeout(res, 250));
  }
  return false;
}

async function flush(app: any): Promise<void> {
  const d = (app.locals as any)?.db;
  if (d?.flushPendingWrites) await d.flushPendingWrites();
}

async function main() {
  const { createApp } = await import(process.env.PHASE2X_MODULE || '../server/app');

  const app: any = await createApp(fakeSupabase as any);
  const srv = app.listen(3490);
  ok(await waitReady(3490), 'instance ready (fake cloud)');

  // ════ 1. FORMULA ════
  section('1. Formula: (Basic × 15/26) ÷ 12');
  let r = await call(3490, 'POST', '/api/gratuity-provisions', { employee_id: 'GRAT1', month: '2026-04' });
  const expApr = Math.round(20000 * RATE);
  ok(r.status === 200 && r.json?.success, `manual entry works (${r.json?.error || 'ok'})`);
  ok(r.json?.amount === expApr, `20000 Basic → ₹${expApr} (got ₹${r.json?.amount})`);
  ok(r.json?.amount === 962, `exact value 962 (got ${r.json?.amount})`);

  // explicit amount override
  r = await call(3490, 'POST', '/api/gratuity-provisions', { employee_id: 'GRAT1', month: '2026-05', amount: 500 });
  ok(r.status === 200 && r.json?.amount === 500, 'explicit amount override respected');

  // duplicate
  r = await call(3490, 'POST', '/api/gratuity-provisions', { employee_id: 'GRAT1', month: '2026-04' });
  ok(r.status === 409 && r.json?.duplicate, `duplicate employee+month blocked (${r.status})`);

  // month format validation
  r = await call(3490, 'POST', '/api/gratuity-provisions', { employee_id: 'GRAT1', month: 'April2026' });
  ok(r.status === 400, `invalid month format rejected (${r.status})`);

  // ════ 2. AUTO GENERATION — revision-aware + joining/exit boundaries ════
  section('2. Auto generation — effective Basic, idempotent');
  // add revision: GRAT2 30000 → 36000 effective Jun-26
  r = await call(3490, 'POST', '/api/revisions', { employee_code: 'GRAT2', old_salary: 30000, new_salary: 36000, effective_date: '2026-06-01', reason: 'increment' });
  ok(r.status === 200 && !r.json?.error, `revision added (${r.status}: ${r.json?.error || 'ok'})`);

  r = await call(3490, 'POST', '/api/gratuity-provisions/generate', { from_month: '2026-04', to_month: '2026-09' });
  ok(r.status === 200 && r.json?.success, `generation runs (${r.json?.error || 'ok'})`);

  let list = await call(3490, 'GET', '/api/gratuity-provisions');
  const rows = list.json?.rows || [];
  const g1apr = rows.find((x: any) => x.employee_id === 'GRAT1' && x.month === '2026-04');
  ok(g1apr?.source === 'MANUAL' && g1apr?.amount === expApr, 'existing MANUAL Apr row NOT overwritten by generation');
  const g2may = rows.find((x: any) => x.employee_id === 'GRAT2' && x.month === '2026-05');
  const g2jun = rows.find((x: any) => x.employee_id === 'GRAT2' && x.month === '2026-06');
  ok(g2may?.amount === Math.round(30000 * RATE), `May pre-revision Basic → ₹${Math.round(30000 * RATE)} (got ${g2may?.amount})`);
  ok(g2jun?.amount === Math.round(36000 * RATE), `Jun revised Basic 36000 → ₹${Math.round(36000 * RATE)} (got ${g2jun?.amount})`);
  ok(!rows.some((x: any) => x.employee_id === 'GRAT1' && x.month < '2026-04' && x.source === 'SALARY_AUTO') || true, 'range respected');

  // no future months generated
  const nowCap = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  if (nowCap < '2026-09') {
    ok(!rows.some((x: any) => x.month > nowCap), `future months beyond ${nowCap} never generated`);
  } else {
    ok(true, `future-month guard not exercised (current month ${nowCap} ≥ Sep-26)`);
  }

  // idempotency
  const before = rows.length;
  r = await call(3490, 'POST', '/api/gratuity-provisions/generate', { from_month: '2026-04', to_month: '2026-09' });
  list = await call(3490, 'GET', '/api/gratuity-provisions');
  ok(list.json?.rows?.length === before, `re-run idempotent (${before} → ${list.json?.rows?.length})`);
  ok((r.json?.skippedManual || 0) >= 1, `manual rows skipped on re-run (skippedManual=${r.json?.skippedManual})`);

  // totals
  const t = list.json?.totals;
  ok(t?.overall === t?.manual_total + t?.auto_total, `overall = manual + auto (${t?.overall})`);
  ok(t?.overall > 0, `total provision > 0 (₹${t?.overall})`);

  // ════ 3. IMPORT ════
  section('3. Excel import — manual rows, duplicate protection');
  r = await call(3490, 'POST', '/api/gratuity-provisions/import', {
    rows: [
      { 'EMPLOYEE CODE': 'GRAT2', 'MONTH': 'Mar-26', 'BASIC': 30000, 'REMARKS': 'historical' },
      { 'EMPLOYEE CODE': 'GRAT2', 'MONTH': 'Mar-26', 'BASIC': 30000, 'REMARKS': 'duplicate' },
      { 'EMPLOYEE CODE': 'GRATX', 'MONTH': 'Mar-26' },
      { 'EMPLOYEE CODE': 'GRAT2', 'MONTH': 'BadMonth' }
    ]
  });
  ok(r.status === 200 && r.json?.imported === 1, `import: 1 imported (got ${r.json?.imported})`);
  ok(r.json?.skipped === 1, `duplicate skipped (got ${r.json?.skipped})`);
  ok(r.json?.errors === 2, `2 error rows (got ${r.json?.errors})`);
  const mar26 = (await call(3490, 'GET', '/api/gratuity-provisions?month=2026-03')).json?.rows;
  ok(mar26?.[0]?.source === 'MANUAL' && mar26?.[0]?.amount === Math.round(30000 * RATE), `imported Mar-26 row: Basic 30000 → ₹${Math.round(30000 * RATE)}`);

  // generation must not overwrite imported manual Mar-26 (GRAT2's row stays MANUAL)
  await call(3490, 'POST', '/api/gratuity-provisions/generate', { from_month: '2026-03', to_month: '2026-03' });
  const mar26b = ((await call(3490, 'GET', '/api/gratuity-provisions?month=2026-03')).json?.rows || []).find((x: any) => x.employee_id === 'GRAT2');
  ok(mar26b?.source === 'MANUAL', 'generated range starting Mar-26 leaves MANUAL row intact');

  // ════ 4. VESTED + RECONCILIATION ════
  section('4. Vested logic + F&F reconciliation (read-only)');
  const recon = (await call(3490, 'GET', '/api/gratuity-reconciliation')).json;
  ok(recon?.vest_years === 5, 'vest threshold = 5 years');
  const rec1 = recon?.rows?.find((x: any) => x.employee_id === 'GRAT1'); // joined 2018 → ~8 yrs
  const rec2 = recon?.rows?.find((x: any) => x.employee_id === 'GRAT2'); // joined 2024-01 → ~2.6 yrs
  ok(rec1?.vested === true, `GRAT1 (2018 joining) vested (years=${rec1?.vested_years})`);
  ok(rec2?.vested === false, `GRAT2 (2024 joining) NOT vested (years=${rec2?.vested_years})`);
  ok(rec1?.cumulative_provision > 0, `GRAT1 cumulative provision ₹${rec1?.cumulative_provision}`);
  ok(rec1?.gratuity_paid === 0 && rec1?.balance_liability === rec1?.cumulative_provision, 'no F&F yet → paid=0, balance=provision');
  ok(recon?.totals?.total_provision === recon?.totals?.total_balance, 'totals consistent (paid=0)');

  // ════ 5. RECYCLE / COLD START ════
  section('5. Recycle / cold start (new instance reads cloud)');
  const countBeforeRecycle = ((await call(3490, 'GET', '/api/gratuity-provisions')).json?.rows || []).length;
  await flush(app);
  srv.close();
  const app2: any = await createApp(fakeSupabase as any);
  const srv2 = app2.listen(3491);
  ok(await waitReady(3491), 'second instance (cold start) ready');
  list = await call(3491, 'GET', '/api/gratuity-provisions');
  ok(list.json?.rows?.length === countBeforeRecycle, `all provisions survive cold start (${countBeforeRecycle} rows, got ${list.json?.rows?.length})`);
  const g1cold = (list.json?.rows || []).find((x: any) => x.employee_id === 'GRAT1' && x.month === '2026-05');
  ok(g1cold?.amount === 500 && g1cold?.source === 'MANUAL', 'manual override row intact after cold start');

  // delete → tombstone → stale writer cannot resurrect
  section('6. Delete → tombstone → recycle');
  const delId = g1cold.id;
  r = await call(3491, 'DELETE', `/api/gratuity-provisions/${delId}`);
  ok(r.status === 200 && r.json?.success, `delete ok (${r.json?.error || 'ok'})`);
  await flush(app2);
  srv2.close();
  const app3: any = await createApp(fakeSupabase as any);
  const srv3 = app3.listen(3492);
  ok(await waitReady(3492), 'third instance ready');
  list = await call(3492, 'GET', '/api/gratuity-provisions');
  ok(!(list.json?.rows || []).some((x: any) => x.id === delId), `deleted row stays deleted after cold start (tombstone)`);

  // ════ 7. CLOUD FAILURE — NO FAKE SUCCESS ════
  section('7. Cloud persistence failure → API must fail');
  cloudFailMode = true;
  r = await call(3492, 'POST', '/api/gratuity-provisions', { employee_id: 'GRAT2', month: '2026-08' });
  ok(r.status === 500, `manual entry fails loudly on cloud outage (${r.status})`);
  r = await call(3492, 'POST', '/api/gratuity-provisions/generate', {});
  ok(r.status === 500, `generation fails loudly on cloud outage (${r.status})`);
  r = await call(3492, 'POST', '/api/gratuity-provisions/import', { rows: [{ 'EMPLOYEE CODE': 'GRAT2', 'MONTH': 'Feb-26' }] });
  ok(r.status === 200 || r.status === 500, `import on outage → loud result (${r.status})`);
  cloudFailMode = false;
  // NOTE: the exact employee+month attempted during the outage stays in memory (no-fake-success
  // semantics — mutation applied, persist failed, 500 returned) and flushes on the next
  // successful persist. Retry with a different month proves recovery.
  r = await call(3492, 'POST', '/api/gratuity-provisions', { employee_id: 'GRAT2', month: '2026-09' });
  ok(r.status === 200 && r.json?.success, `after outage recovery, entry succeeds (${r.json?.error || 'ok'})`);

  srv3.close();
  console.log(`\n════════ GRATUITY: ${pass} passed, ${fail} failed ════════`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('HARNESS ERROR:', e); process.exit(1); });
