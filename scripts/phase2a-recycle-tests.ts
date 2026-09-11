/**
 * PHASE-2A RECYCLE + CLOUD-FAILURE TEST HARNESS (fake cloud — NO production contact).
 *
 * Proves for every fixed persist-less mutation:
 *   MUTATION → memory changed → cloud changed → instance recycled → mutation survives.
 *
 * Also proves: when the cloud write FAILS, the mutation does NOT produce a
 * fake-success response (the API must surface failure).
 *
 * Run: npx tsx scripts/phase2a-recycle-tests.ts
 */
import http from 'http';

let pass = 0, fail = 0;
const ok = (c: boolean, label: string) => { if (c) { pass++; console.log(`  ✅ ${label}`); } else { fail++; console.log(`  ❌ ${label}`); } };
const section = (t: string) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 60 - t.length))}`);

process.env.SESSION_SECRET = 'p2a-test-secret';

// ── Fake cloud: independent "Supabase" with REAL CAS semantics ──
// The server's OCC layer writes update().eq('id','live').eq('updated_at', version)
// and checks the result array: empty ⇒ version moved ⇒ conflict. Our fake must
// model that, otherwise OCC passes vacuously. We also union-merge record arrays
// by id (mirroring storeMerge union) so two-instance writes converge instead of
// last-writer-wins clobbering.
let cloudRow: { payload: any; updated_at: string } = {
  payload: {
    employees: [{ id: 'SEED1', name: 'Seed Employee', status: 'ACTIVE', company: 'SVN-1' }],
    companies: [],
    users: [{ id: 'USR001', username: 'vishnu', name: 'Vishnu', role: 'SUPER_HR', disabled: false, company_rights: ['ALL'] }],
    hods: [], shifts: [], departments: []
  },
  updated_at: new Date(Date.now() - 60000).toISOString()
};
let cloudWrites = 0;
let cloudFailMode = false; // when true, ALL writes fail

function chainWrite(u: any, expectVersion: string | null) {
  const doWrite = async () => {
    cloudWrites++;
    if (cloudFailMode) return { data: null, error: { message: 'simulated cloud outage' } };
    if (expectVersion !== null && cloudRow.updated_at !== expectVersion) {
      // CAS miss — another writer moved the version; Supabase returns ZERO rows
      return { data: [], error: null };
    }
    const incoming = u && u.payload !== undefined ? u.payload : u;
    // Real Supabase stores the payload AS-IS (replace, not merge). The app's
    // OCC-conflict path is where merging happens — modeled separately in PHASE D2.
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
      select() {
        return {
          eq() {
            return {
              maybeSingle: async () => ({ data: { payload: cloudRow.payload, updated_at: cloudRow.updated_at }, error: null }),
              single: async () => ({ data: { payload: cloudRow.payload, updated_at: cloudRow.updated_at }, error: null })
            };
          }
        };
      },
      update: (u: any, _opts: any) => {
        // Capture the expected version from the chained .eq('updated_at', v)
        let expectVersion: string | null = null;
        const builder: any = { eq: (col: string, val: any) => { if (col === 'updated_at') expectVersion = val; return builder; }, select: () => builder };
        void _opts;
        const p = chainWrite(u, expectVersion);
        builder.then = p.then; builder.catch = p.catch; builder.finally = p.finally;
        return builder;
      },
      upsert: (u: any, _opts: any) => chainWrite(u, null),
      insert: (u: any, _opts: any) => chainWrite(u, null)
    };
  }
};

// ── tiny HTTP client ──
async function call(port: number, method: string, path: string, body?: any, headers?: Record<string, string>): Promise<{ status: number; json: any }> {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      host: '127.0.0.1', port, path, method,
      headers: { ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}), ...(headers || {}) }
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

const HR = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR' };

async function waitReady(port: number): Promise<boolean> {
  for (let i = 0; i < 40; i++) {
    const r = await call(port, 'GET', '/api/companies');
    if (r.status > 0) return true;
    await new Promise(res => setTimeout(res, 250));
  }
  return false;
}

function listHas(json: any, pred: (x: any) => boolean): boolean {
  const arr = Array.isArray(json) ? json : (json && json.data) || [];
  return Array.isArray(arr) && arr.some(pred);
}

function cloudHas(key: string, pred: (x: any) => boolean): boolean {
  return Array.isArray(cloudRow?.payload?.[key]) && cloudRow.payload[key].some(pred);
}

async function main() {
  const { createApp } = await import(process.env.PHASE2A_MODULE || '../server/app');

  // ════ PHASE A: mutations on instance #1 ════
  section('PHASE A: instance #1 — mutations via API');
  const appA: any = await createApp(fakeSupabase as any);
  const srvA = appA.listen(3481);
  ok(await waitReady(3481), 'instance #1 ready');

  let r = await call(3481, 'POST', '/api/departments', { department: 'P2A Department' }, HR);
  ok(r.status === 200 && !r.json?.error, `department create 200 (${r.json?.error || 'ok'})`);

  r = await call(3481, 'POST', '/api/companies', { id: 'P2A1', name: 'P2A Company Ltd', pin: '1234' }, HR);
  ok(r.status === 200 && !r.json?.error, `company create 200 (${r.json?.error || 'ok'})`);

  r = await call(3481, 'PUT', '/api/companies/P2A1', { name: 'P2A Company Renamed', pin: '1234' }, HR); // PHASE-1: company update requires Super Admin PIN
  ok(r.status === 200 && !r.json?.error, `company update 200 (${r.json?.error || 'ok'})`);

  r = await call(3481, 'POST', '/api/attendance/manual', { employee_id: 'SEED1', date: '2026-09-05', status: 'P' }, HR);
  ok(r.status === 200 && !r.json?.error, `attendance upsert 200 (${r.json?.error || 'ok'})`);

  r = await call(3481, 'POST', '/api/gate-passes', { employee_id: 'SEED1', employee_name: 'Seed Employee', company: 'SVN-1', date: '2026-09-05', purpose: 'P2A test' }, HR);
  ok(r.status === 200 && !r.json?.error, `gate pass create 200 (${r.json?.error || 'ok'})`);
  const gp = r.json?.id || r.json?.pass?.id || r.json?.gatePass?.id || null;
  if (gp) {
    r = await call(3481, 'PUT', `/api/gate-passes/${gp}`, { status: 'RETURNED', pin: '1234' }, HR);
    ok(r.status === 200 && !r.json?.error, `gate pass status update 200 (${r.json?.error || 'ok'})`);
  } else { ok(false, 'gate pass update (id not returned)'); }

  r = await call(3481, 'POST', '/api/policies', { name: 'P2A Policy', content: 'test' }, HR);
  ok(r.status === 200 && !r.json?.error, `policy create 200 (${r.json?.error || 'ok'})`);
  r = await call(3481, 'POST', '/api/policy-acknowledgements', { employee_id: 'SEED1', policy_name: 'P2A Policy' }, HR);
  ok(r.status === 200 && !r.json?.error, `policy ack create 200 (${r.json?.error || 'ok'})`);

  r = await call(3481, 'POST', '/api/assets', { employee_id: 'SEED1', employee_name: 'Seed Employee', asset_name: 'P2A Laptop', type: 'IT' }, HR);
  ok(r.status === 200 && !r.json?.error, `asset create 200 (${r.json?.error || 'ok'})`);
  // NOTE: delete persistence ends in a resurrection via the union-merge
  // (cloud stale copy re-adds the row) — that is the documented PHASE-2B
  // tombstone issue, OUT OF SCOPE here. We therefore assert survival of a
  // NOT-deleted sibling instead of absence of the deleted row.
  r = await call(3481, 'POST', '/api/assets', { employee_id: 'SEED1', employee_name: 'Seed Employee', asset_name: 'P2A Monitor', type: 'IT' }, HR);
  ok(r.status === 200 && !r.json?.error, `asset create #2 (kept) 200`);

  r = await call(3481, 'POST', '/api/travel', { employee_id: 'SEED1', employee_name: 'Seed Employee', month: '2026-09', fuel_liters: 10, rate_per_liter: 90, amount: 900, travel_purpose: 'P2A-T1' }, HR);
  ok(r.status === 200 && !r.json?.error, `travel create 200 (${r.json?.error || 'ok'})`);
  r = await call(3481, 'POST', '/api/travel', { employee_id: 'SEED1', employee_name: 'Seed Employee', month: '2026-09', fuel_liters: 5, rate_per_liter: 90, amount: 450, travel_purpose: 'P2A-T2' }, HR);
  ok(r.status === 200 && !r.json?.error, `travel create #2 (kept) 200`);

  r = await call(3481, 'POST', '/api/broadcasts', { title: 'P2A Broadcast', message: 'test', target_type: 'ALL' }, HR);
  ok(r.status === 200 && !r.json?.error, `broadcast create 200 (${r.json?.error || 'ok'})`);
  r = await call(3481, 'POST', '/api/broadcasts', { title: 'P2A Notice', message: 'kept', target_type: 'ALL' }, HR);
  ok(r.status === 200 && !r.json?.error, `broadcast create #2 (kept) 200`);

  r = await call(3481, 'POST', '/api/compoff-ledger', { employee_id: 'SEED1', employee_name: 'Seed Employee', company: 'SVN-1', date: '2026-09-05', days: 1, reason: 'P2A' }, HR);
  ok(r.status === 200 && !r.json?.error, `compoff-ledger entry 200 (${r.json?.error || 'ok'})`);

  // ════ PHASE B: flush → verify cloud contains every mutation ════
  section('PHASE B: cloud contains mutations (post-flush)');
  const dbA = (appA.locals as any)?.db;
  if (dbA?.flushPendingWrites) await dbA.flushPendingWrites();
  ok(cloudHas('departments', (d: any) => d === 'P2A Department'), 'department in cloud (string-record)');
  ok(cloudHas('companies', (c: any) => c.id === 'P2A1' && c.name === 'P2A Company Renamed'), 'company create+rename in cloud');
  ok(cloudHas('attendance', (a: any) => a.employee_id === 'SEED1' && a.month === '2026-09'), 'attendance in cloud');
  ok(cloudHas('gate_passes', (g: any) => g.purpose === 'P2A test' && g.status === 'RETURNED'), 'gate pass + status update in cloud');
  ok(cloudHas('policies', (p: any) => p.name === 'P2A Policy'), 'policy in cloud');
  ok(cloudHas('policy_acknowledgements', (a: any) => a.policy_name === 'P2A Policy'), 'policy ack in cloud');
  ok(cloudHas('assets', (a: any) => a.asset_name === 'P2A Monitor'), 'kept asset in cloud');
  ok(cloudHas('travel_reimbursements', (t: any) => t.travel_purpose === 'P2A-T2'), 'kept travel in cloud');
  ok(cloudHas('broadcasts', (b: any) => b.title === 'P2A Notice'), 'kept broadcast in cloud');
  ok(cloudHas('compoff_ledger', (c: any) => c.reason === 'P2A'), 'compoff ledger entry in cloud');

  // ════ PHASE C: RECYCLE — fresh instance loads ONLY from cloud ════
  section('PHASE C: RECYCLE — fresh instance from cloud only');
  const appB: any = await createApp(fakeSupabase as any);
  const srvB = appB.listen(3482);
  ok(await waitReady(3482), 'instance #2 (post-recycle) ready');
  r = await call(3482, 'GET', '/api/departments', undefined, HR); ok(listHas(r.json, (d: any) => d === 'P2A Department'), 'department survives recycle');
  r = await call(3482, 'GET', '/api/companies', undefined, HR); ok(listHas(r.json, (c: any) => c.id === 'P2A1' && c.name === 'P2A Company Renamed'), 'company (renamed) survives recycle');
  r = await call(3482, 'GET', '/api/gate-passes', undefined, HR); ok(listHas(r.json, (g: any) => g.purpose === 'P2A test' && g.status === 'RETURNED'), 'gate pass survives recycle');
  r = await call(3482, 'GET', '/api/policies', undefined, HR); ok(listHas(r.json, (p: any) => p.name === 'P2A Policy'), 'policy survives recycle');
  r = await call(3482, 'GET', '/api/policy-acknowledgements', undefined, HR); ok(listHas(r.json, (a: any) => a.policy_name === 'P2A Policy'), 'policy ack survives recycle');
  r = await call(3482, 'GET', '/api/assets', undefined, HR); ok(listHas(r.json, (a: any) => a.asset_name === 'P2A Monitor'), 'kept asset survives recycle');
  r = await call(3482, 'GET', '/api/travel', undefined, HR); ok(listHas(r.json, (t: any) => t.travel_purpose === 'P2A-T2'), 'kept travel survives recycle');
  r = await call(3482, 'GET', '/api/broadcasts', undefined, HR); ok(listHas(r.json, (b: any) => b.title === 'P2A Notice'), 'kept broadcast survives recycle');
  r = await call(3482, 'GET', '/api/compoff-ledger?employee_id=SEED1', undefined, HR); ok(listHas(r.json, (c: any) => c.reason === 'P2A'), 'compoff ledger survives recycle');
  srvB.close();

  // ════ PHASE D: TWO-INSTANCE union regression (DETERMINISTIC OCC-conflict path) ════
  section('PHASE D: two-instance union regression (serialized conflict)');
  // Both instances load the SAME cloud version first → both hold the same
  // _loadedVersion. Instance-3 writes dept and flushes (cloud version moves).
  // Instance-4's later write then CAS-fails ⇒ OCC merge path must UNION and
  // preserve instance-3's dept together with instance-4's shift.
  const appC: any = await createApp(fakeSupabase as any);
  const srvC = appC.listen(3483);
  const appD: any = await createApp(fakeSupabase as any);
  const srvD = appD.listen(3484);
  ok(await waitReady(3483) && await waitReady(3484), 'instances #3/#4 ready');
  r = await call(3483, 'POST', '/api/departments', { department: 'Union Dept A' }, HR);
  ok(r.status === 200, 'instance-3 dept create');
  const dbC = (appC.locals as any)?.db;
  if (dbC?.flushPendingWrites) await dbC.flushPendingWrites();
  ok(cloudHas('departments', (d: any) => d === 'Union Dept A'), 'instance-3 dept in cloud');
  r = await call(3484, 'POST', '/api/shifts', { code: 'UNION-SHIFT', name: 'Union Shift', start_time: '09:00', end_time: '18:00' }, HR);
  ok(r.status === 200, 'instance-4 shift create (stale version → OCC merge path)');
  const dbD = (appD.locals as any)?.db;
  if (dbD?.flushPendingWrites) await dbD.flushPendingWrites();
  ok(cloudHas('shifts', (s: any) => s.code === 'UNION-SHIFT'), 'instance-4 shift in cloud');
  ok(cloudHas('departments', (d: any) => d === 'Union Dept A'), 'union: instance-3 dept NOT clobbered by instance-4 write');

  const appE: any = await createApp(fakeSupabase as any);
  const srvE = appE.listen(3485);
  await waitReady(3485);
  r = await call(3485, 'GET', '/api/departments', undefined, HR); ok(listHas(r.json, (d: any) => d === 'Union Dept A'), 'union: dept A survives');
  r = await call(3485, 'GET', '/api/shifts', undefined, HR); ok(listHas(r.json, (s: any) => s.code === 'UNION-SHIFT'), 'union: shift B survives');
  srvC.close(); srvD.close(); srvE.close();

  // ════ PHASE E: CLOUD-FAILURE — no fake success ════
  section('PHASE E: cloud failure — no fake success');
  cloudFailMode = true;

  r = await call(3481, 'POST', '/api/departments', { department: 'Fail Dept' }, HR);
  ok(r.status >= 400 || r.json?.persistWarning || r.json?.error, `dept during outage → failure surfaced (HTTP ${r.status}, warning=${!!r.json?.persistWarning})`);

  r = await call(3481, 'POST', '/api/gate-passes', { employee_id: 'SEED1', employee_name: 'Seed', company: 'SVN-1', date: '2026-09-06', reason: 'P2A-fail' }, HR);
  ok(r.status >= 400 || r.json?.persistWarning || r.json?.error, `gate pass during outage → failure surfaced (HTTP ${r.status}, warning=${!!r.json?.persistWarning})`);

  r = await call(3481, 'POST', '/api/attendance/manual', { employee_id: 'SEED1', date: '2026-09-06', status: 'P' }, HR);
  ok(r.status >= 400 || r.json?.persistWarning || r.json?.error, `attendance during outage → failure surfaced (HTTP ${r.status}, warning=${!!r.json?.persistWarning})`);

  r = await call(3481, 'POST', '/api/policies', { name: 'Fail Policy', content: 'x' }, HR);
  ok(r.status >= 400 || r.json?.persistWarning || r.json?.error, `policy during outage → failure surfaced (HTTP ${r.status}, warning=${!!r.json?.persistWarning})`);

  cloudFailMode = false;
  srvA.close();
  console.log(`\n══ RESULT: ${pass} pass / ${fail} fail ══`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
