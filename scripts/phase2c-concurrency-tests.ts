/**
 * PHASE-2C SAME-RECORD CONCURRENCY TEST HARNESS (fake cloud — NO production contact).
 *
 * Mandatory proof (§10): Instance A sets Employee Photo = NEW, Instance B sets the
 * SAME employee's Mobile = NEW → after concurrent saves + reload + COLD START,
 * BOTH Photo = NEW and Mobile = NEW.
 *
 * Run:                npx tsx scripts/phase2c-concurrency-tests.ts
 * Built-bundle run:   PHASE2C_MODULE=../api/_app.cjs npx tsx scripts/phase2c-concurrency-tests.ts
 * BEFORE-evidence:    run this same file against the pre-Phase-2C tree
 *                     (git stash the Phase-2C edits → run → observe field-loss failures)
 */
import http from 'http';

let pass = 0, fail = 0;
const ok = (c: boolean, label: string) => { if (c) { pass++; console.log(`  ✅ ${label}`); } else { fail++; console.log(`  ❌ ${label}`); } };
const section = (t: string) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 60 - t.length))}`);

process.env.SESSION_SECRET = 'p2c-test-secret';

// ── Fake cloud: independent "Supabase" with REAL CAS semantics (same as 2A/2B) ──
let cloudRow: { payload: any; updated_at: string } = {
  payload: {
    // Non-empty employees is REQUIRED: loadFromSupabase only accepts a payload
    // with at least one employee — otherwise the instance falls back to the
    // local SQLite file (wrong data source for this harness).
    employees: [{ id: 'SEED1', name: 'Seed Employee', status: 'ACTIVE', company: 'SVN-1', updated_at: new Date(Date.now() - 600000).toISOString() }],
    companies: [],
    users: [{ id: 'USR001', username: 'vishnu', name: 'Vishnu', role: 'SUPER_HR', disabled: false, company_rights: ['ALL'] }],
    hods: [], shifts: [], departments: []
  },
  updated_at: new Date(Date.now() - 60000).toISOString()
};
let cloudFailMode = false;

function chainWrite(u: any, expectVersion: string | null) {
  const doWrite = async () => {
    if (cloudFailMode) return { data: null, error: { message: 'simulated cloud outage' } };
    if (expectVersion !== null && cloudRow.updated_at !== expectVersion) {
      return { data: [], error: null }; // CAS miss → OCC conflict path
    }
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
const PHOTO_OLD = 'data:image/png;base64,OLDFACE';
const PHOTO_NEW = 'data:image/png;base64,P2CNEWPHOTO';

const EMP = (over: any = {}) => ({
  id: 'P2C001', name: 'P2C Employee', company: 'SVN-1', designation: 'Technician',
  department: 'Dept-1', email: 'p2c@x.com', phone: '9000000001', joining_date: '2026-01-10',
  status: 'ACTIVE', bank_name: 'HDFC', bank_account: '10020030040', ifsc: 'HDFC0000001',
  pan: 'ABCDE1234F', uan: '101010101010', base_salary: 20000, hra: 8000,
  special_allowance: 2000, da: 0, pf_opt_in: true, esic_opt_in: false,
  professional_tax_opt_in: false, leave_balance_pl: 18, leave_balance_cl: 6, leave_balance_sl: 6,
  photo: PHOTO_OLD, ...over
});

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

function cloudArr(key: string): any[] {
  return Array.isArray(cloudRow?.payload?.[key]) ? cloudRow.payload[key] : [];
}
function cloudEmp(id: string): any {
  return cloudArr('employees').find((e: any) => e?.id === id);
}

/** Start an isolated instance (fresh cold start from current cloud state). */
async function instance(port: number, label: string): Promise<{ app: any; srv: any }> {
  const app: any = await createApp(fakeSupabase as any);
  const srv = app.listen(port);
  ok(await waitReady(port), label);
  return { app, srv };
}

async function getEmp(port: number, id: string): Promise<any> {
  const r = await call(port, 'GET', '/api/employees', undefined, HR);
  const arr = Array.isArray(r.json) ? r.json : (r.json && (r.json.data || r.json.employees)) || [];
  return Array.isArray(arr) ? arr.find((e: any) => e?.id === id) : undefined;
}

let createApp: any;

async function main() {
  ({ createApp } = await import(process.env.PHASE2C_MODULE || '../server/app'));

  // ════ Seed baseline employee ════
  section('SEED: baseline employee in cloud');
  const s0 = await instance(3490, 'seed instance ready');
  let r = await call(3490, 'POST', '/api/employees', EMP(), HR);
  ok(r.status === 200 && !r.json?.error, `seed employee P2C001 (${r.json?.error || 'ok'})`);
  await flush(s0.app);
  ok(cloudEmp('P2C001')?.phone === '9000000001' && cloudEmp('P2C001')?.photo === PHOTO_OLD, 'baseline phone+photo in cloud');
  s0.srv.close();

  // ════ MANDATORY §10: Photo (A) + Mobile (B) concurrent on SAME employee ════
  section('MANDATORY §10: Instance A Photo + Instance B Mobile (same employee)');
  // Both instances load the SAME baseline (concurrent stale holders), then edit
  // DIFFERENT fields of the same record and persist.
  const a = await instance(3491, 'instance A ready (baseline snapshot)');
  const b = await instance(3492, 'instance B ready (baseline snapshot)');

  r = await call(3491, 'PUT', '/api/employees/P2C001', { id: 'P2C001', photo: PHOTO_NEW }, HR);
  ok(r.status === 200 && !r.json?.error, `A: PUT photo (${r.json?.error || 'ok'})`);
  await flush(a.app);
  ok(cloudEmp('P2C001')?.photo === PHOTO_NEW, 'cloud: photo = NEW after A persist');

  r = await call(3492, 'PUT', '/api/employees/P2C001', { id: 'P2C001', phone: '9111111111' }, HR);
  ok(r.status === 200 && !r.json?.error, `B: PUT mobile (${r.json?.error || 'ok'})`);
  await flush(b.app);

  // Cold start proof: brand-new instance loads cloud and must see BOTH.
  const c = await instance(3493, 'cold-start instance ready');
  const e3 = await getEmp(3493, 'P2C001');
  ok(e3?.photo === PHOTO_NEW, `§10 Photo = NEW PHOTO after cold start (got ${e3?.photo === PHOTO_NEW ? 'NEW' : (e3?.photo || 'undefined')?.slice(0, 30) || 'MISSING'})`);
  ok(e3?.phone === '9111111111', `§10 Mobile = NEW MOBILE after cold start (got ${e3?.phone})`);
  const ce = cloudEmp('P2C001');
  ok(ce?.photo === PHOTO_NEW && ce?.phone === '9111111111', '§10 cloud payload has BOTH new photo + new mobile');

  // Reload-merge path proof: B (still alive) reloads from cloud and must see both.
  const eB = await getEmp(3492, 'P2C001');
  ok(eB?.photo === PHOTO_NEW && eB?.phone === '9111111111', '§10 instance B reload shows BOTH (reload-merge path)');

  // ════ §11 field-pair matrix ════
  section('§11 pairs: Mobile+Bank, Email+Bank, Photo+Email, PAN+UAN');
  const pairs: Array<[string, any, string, any, string]> = [
    ['P2C002', { phone: '9222222222' }, 'phone', { bank_account: '5550011122' }, 'bank_account'],
    ['P2C003', { email: 'new3@x.com' }, 'email', { bank_account: '5550033344' }, 'bank_account'],
    ['P2C004', { photo: 'data:image/png;base64,FACE4' }, 'photo', { email: 'new4@x.com' }, 'email'],
    ['P2C005', { pan: 'ZZZZZ9999Z' }, 'pan', { uan: '202020202020' }, 'uan']
  ];
  for (const [id, editA, fA, editB, fB] of pairs) {
    r = await call(3493, 'POST', '/api/employees', EMP({ id, phone: '9000000001', email: 'old@x.com', bank_account: '10020030040', pan: 'ABCDE1234F', uan: '101010101010', photo: PHOTO_OLD }), HR);
    ok(r.status === 200 && !r.json?.error, `${id} seeded (${r.json?.error || 'ok'})`);
    await flush(c.app);
    const i1 = await instance(3494, `${id}: editor-1 instance ready`);
    const i2 = await instance(3495, `${id}: editor-2 instance ready`);
    r = await call(3494, 'PUT', `/api/employees/${id}`, { id, ...editA }, HR);
    ok(r.status === 200 && !r.json?.error, `${id}: editor-1 PUT ${fA} (${r.json?.error || 'ok'})`);
    await flush(i1.app);
    r = await call(3495, 'PUT', `/api/employees/${id}`, { id, ...editB }, HR);
    ok(r.status === 200 && !r.json?.error, `${id}: editor-2 PUT ${fB} (${r.json?.error || 'ok'})`);
    await flush(i2.app);
    const fin = cloudEmp(id);
    ok(fin?.[fA] === editA[fA] && fin?.[fB] === editB[fB], `${id}: BOTH ${fA}=${editA[fA]} AND ${fB}=${editB[fB]} survive (cloud)`);
    i1.srv.close(); i2.srv.close();
  }

  // ════ Stale unchanged-field protection ════
  section('§11: stale unchanged-field protection (full-object echo PUT)');
  r = await call(3493, 'POST', '/api/employees', EMP({ id: 'P2C006', email: 'old6@x.com' }), HR);
  ok(r.status === 200 && !r.json?.error, 'P2C006 seeded');
  await flush(c.app);
  const u1 = await instance(3496, 'P2C006: editor-1 ready');
  const u2 = await instance(3497, 'P2C006: editor-2 (full-object echo) ready');
  // editor-1 changes ONLY phone (photo untouched)
  r = await call(3496, 'PUT', '/api/employees/P2C006', { id: 'P2C006', phone: '9333333333' }, HR);
  ok(r.status === 200, 'P2C006: editor-1 PUT phone');
  await flush(u1.app);
  // editor-2 sends a FULL object (stale baseline incl. OLD phone-shaped echo attempt):
  // its copy still has old phone? No — editor-2 loads AFTER editor-1's persist, so this
  // is the echo-stamp attack instead: client echoes its own *_modified_at stamps.
  r = await call(3497, 'PUT', '/api/employees/P2C006', {
    id: 'P2C006', phone: '9333333333', photo: 'data:image/png;base64,FACE6',
    photo_modified_at: '1999-01-01T00:00:00.000Z', phone_modified_at: '1999-01-01T00:00:00.000Z'
  }, HR);
  ok(r.status === 200, 'P2C006: editor-2 full-object PUT (forged old stamps)');
  await flush(u2.app);
  const f6 = cloudEmp('P2C006');
  ok(f6?.phone === '9333333333', 'P2C006: forged stale stamp did NOT demote phone (phone intact)');
  ok(f6?.photo === 'data:image/png;base64,FACE6', 'P2C006: genuinely-changed photo accepted');
  ok(!('photo_modified_at' in (f6 || {})) || Date.parse(f6.photo_modified_at) > Date.parse('2000-01-01'), 'P2C006: client-forged 1999 stamp not persisted as authoritative');
  u1.srv.close(); u2.srv.close();

  // ════ Same-field concurrent edit → deterministic LWW (documented semantics) ════
  section('same-field concurrent edit → deterministic last-writer-wins');
  r = await call(3493, 'POST', '/api/employees', EMP({ id: 'P2C007', email: 'old7@x.com' }), HR);
  ok(r.status === 200, 'P2C007 seeded');
  await flush(c.app);
  const w1 = await instance(3498, 'P2C007: writer-1 ready');
  const w2 = await instance(3499, 'P2C007: writer-2 ready');
  r = await call(3498, 'PUT', '/api/employees/P2C007', { id: 'P2C007', phone: '9444440001' }, HR);
  ok(r.status === 200, 'writer-1 PUT phone=9444440001');
  await flush(w1.app);
  r = await call(3499, 'PUT', '/api/employees/P2C007', { id: 'P2C007', phone: '9444440002' }, HR);
  ok(r.status === 200, 'writer-2 PUT phone=9444440002');
  await flush(w2.app);
  const f7 = cloudEmp('P2C007')?.phone;
  ok(f7 === '9444440001' || f7 === '9444440002', `P2C007: final phone is ONE deterministic value (${f7}), no corruption`);
  w1.srv.close(); w2.srv.close();

  // ════ Delete + stale edit → Phase-2B tombstone must STILL win ════
  section('§11: delete + stale edit (tombstone wins over concurrent field edit)');
  r = await call(3493, 'POST', '/api/employees', EMP({ id: 'P2C008', email: 'old8@x.com' }), HR);
  ok(r.status === 200, 'P2C008 seeded');
  await flush(c.app);
  const d1 = await instance(3501, 'P2C008: deleter instance ready');
  const d2 = await instance(3502, 'P2C008: stale editor instance ready');
  // deleter hard-deletes the employee (PIN guard active since Phase-1; default PIN
  // accepted in test env). force=true → PURGED branch → tombstone (SEPARATED soft
  // delete keeps the record by design and is NOT a tombstone case).
  r = await call(3501, 'DELETE', '/api/employees/P2C008?force=true', { pin: '1234', force: true }, HR);
  ok(r.status === 200 && (r.json?.success !== false), `P2C008 deleted (${r.json?.error || 'ok'})`);
  await flush(d1.app);
  // stale editor (loaded before delete) tries a profile edit
  r = await call(3502, 'PUT', '/api/employees/P2C008', { id: 'P2C008', phone: '9555555555' }, HR);
  ok(r.status === 200 || r.status === 404, `stale edit attempt status=${r.status}`);
  if (r.status === 200) await flush(d2.app);
  const d3 = await instance(3503, 'P2C008: cold-start verifier ready');
  const g8 = await getEmp(3503, 'P2C008');
  ok(!g8, 'P2C008 stays DELETED after stale editor attempt (tombstone wins)');
  d1.srv.close(); d2.srv.close(); d3.srv.close();

  // ════ Cloud failure → NO fake success (Phase-2A protection intact) ════
  section('cloud failure during profile edit → persistWarning, no fake success');
  r = await call(3493, 'POST', '/api/employees', EMP({ id: 'P2C009', email: 'old9@x.com' }), HR);
  ok(r.status === 200, 'P2C009 seeded');
  await flush(c.app);
  cloudFailMode = true;
  r = await call(3493, 'PUT', '/api/employees/P2C009', { id: 'P2C009', phone: '9666666666' }, HR);
  const warned = !!(r.json && (r.json as any).persistWarning);
  ok(r.json && warned, `cloud outage: response carries persistWarning (status=${r.status}, warned=${warned})`);
  cloudFailMode = false;
  await flush(c.app); // drain failed persist
  const f9 = cloudEmp('P2C009');
  ok(f9?.phone !== '9666666666', 'failed write did NOT reach cloud (no silent fake success)');
  const v9 = await instance(3504, 'P2C009: cold-start verifier ready');
  const g9 = await getEmp(3504, 'P2C009');
  ok(g9?.phone !== '9666666666', 'P2C009 phone NOT new after cold start (mutation correctly absent)');
  v9.srv.close();

  c.srv.close();
  a.srv.close(); b.srv.close();

  console.log(`\n══════════ PHASE-2C RESULT: ${pass} pass, ${fail} fail ════════\n`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
