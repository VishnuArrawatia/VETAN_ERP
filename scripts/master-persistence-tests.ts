/**
 * MASTER-ENTITY PERSISTENCE + RECYCLE TESTS (fake cloud — NO production contact).
 * Proves: masters created via API survive a full instance recycle (cold start).
 * Covers the HOD-disappearance bug class across ALL master entities.
 * Run: npx tsx scripts/master-persistence-tests.ts
 */
import http from 'http';

const PORT_A = 3471;
const PORT_B = 3472;
let pass = 0, fail = 0;
const ok = (c: boolean, label: string) => { if (c) { pass++; console.log(`  ✅ ${label}`); } else { fail++; console.log(`  ❌ ${label}`); } };
const section = (t: string) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 60 - t.length))}`);

process.env.SESSION_SECRET = 'master-test-secret';

// ── Fake Supabase: an independent "cloud" that stores the last written payload ──
let cloudPayload: any = {
  employees: [{ id: 'SEED1', name: 'Seed Employee', status: 'ACTIVE', company: 'SVN-1' }],
  companies: [], users: [{ id: 'USR001', username: 'vishnu', name: 'Vishnu', role: 'SUPER_HR', disabled: false, company_rights: ['ALL'] }], hods: [], shifts: [], departments: []
};
let cloudWrites = 0;
let cloudUpdatedAt = new Date(Date.now() - 60000).toISOString();

function chainWrite(u: any) {
  const doWrite = async () => {
    cloudWrites++;
    cloudPayload = JSON.parse(JSON.stringify(u && u.payload !== undefined ? u.payload : u));
    cloudUpdatedAt = new Date().toISOString();
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
              maybeSingle: async () => ({
                data: { payload: cloudPayload, updated_at: cloudUpdatedAt },
                error: null
              }),
              single: async () => ({ data: { payload: cloudPayload, updated_at: cloudUpdatedAt }, error: null })
            };
          }
        };
      },
      update: (u: any) => chainWrite(u),
      upsert: (u: any) => chainWrite(u),
      insert: (u: any) => chainWrite(u)
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
    if (r.status > 0 && r.status !== -1) return true;
    await new Promise(res => setTimeout(res, 250));
  }
  return false;
}

function listFind(json: any, find: (x: any) => boolean): boolean {
  const arr = Array.isArray(json) ? json : json?.data || json?.employees || json?.users || json?.hods || [];
  return Array.isArray(arr) && arr.some(find);
}

interface Probe { name: string; create: { method: string; path: string; body: any }; listPath: string; find: (x: any) => boolean }

const probes: Probe[] = [
  { name: 'HOD',        create: { method: 'POST', path: '/api/hods',      body: { name: 'Test HOD QA', department: 'QA-Dept', company: 'SVN-1', active: true } }, listPath: '/api/hods',        find: (x) => x.name === 'Test HOD QA' },
  { name: 'User',       create: { method: 'POST', path: '/api/hr/users',  body: { username: 'qa_user_test', name: 'QA User', role: 'HR', password: 'x12345', company_rights: ['SVN-1'] } }, listPath: '/api/hr/users', find: (x) => x.username === 'qa_user_test' },
  { name: 'Shift',      create: { method: 'POST', path: '/api/shifts',    body: { code: 'QA-SHIFT', name: 'QA Shift', start_time: '09:00', end_time: '18:00' } }, listPath: '/api/shifts',      find: (x) => x.code === 'QA-SHIFT' },
  { name: 'Department', create: { method: 'POST', path: '/api/departments', body: { department: 'QA Department' } }, listPath: '/api/departments', find: (x) => x.name === 'QA Department' || x.department === 'QA Department' },
  { name: 'Company',    create: { method: 'POST', path: '/api/companies', body: { id: 'QA1', name: 'QA Company Ltd', pin: '1234' } }, listPath: '/api/companies',    find: (x) => x.name === 'QA Company Ltd' } // PHASE-1: company create now requires Super Admin PIN (default '1234' in isolated db)
];

async function main() {
  const { createApp } = await import('../server/app');

  // ════ PHASE A: instance #1 — create masters ════
  section('PHASE A: instance #1 — create masters');
  const appA: any = await createApp(fakeSupabase as any);
  const srvA = appA.listen(PORT_A);
  ok(await waitReady(PORT_A), 'instance #1 ready');

  for (const p of probes) {
    const r = await call(PORT_A, p.create.method, p.create.path, p.create.body, HR);
    ok(r.status === 200 && r.json?.success !== false && !r.json?.error, `${p.name} create → HTTP ${r.status}${r.json?.error ? ' err=' + r.json.error : ''}${r.json?.persistWarning ? ' ⚠persistWarning' : ''}`);
  }
  for (const p of probes) {
    const r = await call(PORT_A, 'GET', p.listPath, undefined, HR);
    ok(listFind(r.json, p.find), `${p.name} visible in instance #1`);
  }
  // flush pending persist before "recycle" (simulates response-await contract)
  const dbA = (appA.locals as any)?.db;
  if (dbA?.flushPendingWrites) await dbA.flushPendingWrites();
  ok(cloudPayload?.hods?.some((h: any) => h.name === 'Test HOD QA'), 'HOD reached cloud payload (after flush)');
  ok(Array.isArray(cloudPayload?.users) && cloudPayload.users.some((u: any) => u.username === 'qa_user_test'), 'User reached cloud payload');
  srvA.close();

  // ════ PHASE B: RECYCLE — instance #2 loads ONLY from cloud ════
  section('PHASE B: RECYCLE — fresh instance from cloud only');
  const appB: any = await createApp(fakeSupabase as any);
  const srvB = appB.listen(PORT_B);
  ok(await waitReady(PORT_B), 'instance #2 ready (cold start)');

  for (const p of probes) {
    const r = await call(PORT_B, 'GET', p.listPath, undefined, HR);
    ok(listFind(r.json, p.find), `${p.name} SURVIVED recycle`);
  }

  section(`RESULTS: ${pass} pass, ${fail} fail`);
  srvB.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
