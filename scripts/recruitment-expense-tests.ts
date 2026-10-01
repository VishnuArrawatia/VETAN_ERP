/**
 * RECRUITMENT + EXPENSE MANAGEMENT TEST HARNESS (fake cloud — NO production contact).
 *
 * Run:    npx tsx scripts/recruitment-expense-tests.ts
 * Bundle: PHASE2X_MODULE=../api/_app.cjs npx tsx scripts/recruitment-expense-tests.ts
 */
import http from 'http';

let pass = 0, fail = 0;
const ok = (c: boolean, label: string) => { if (c) { pass++; console.log(`  ✅ ${label}`); } else { fail++; console.log(`  ❌ ${label}`); } };
const section = (t: string) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 58 - t.length))}`);

process.env.SESSION_SECRET = 'recexp-test-secret';

// ── Fake cloud with real CAS semantics (Phase-2A/2B harness pattern) ──
let cloudRow: { payload: any; updated_at: string } = {
  payload: {
    employees: [
      { id: 'EMPRE1', name: 'Rec Emp One', status: 'ACTIVE', company: 'SVN-1', base_salary: 20000, created_at: new Date(Date.now() - 600000).toISOString() }
    ],
    companies: [], users: [{ id: 'USRRE', username: 'vishnu', name: 'Vishnu', role: 'SUPER_HR', disabled: false, company_rights: ['ALL'] }],
    hods: [], shifts: [], departments: [], salary_revisions: [],
    job_openings: [], job_candidates: [], expense_claims: []
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

async function call(port: number, method: string, path: string, body?: any, username = 'vishnu'): Promise<{ status: number; json: any }> {
  return new Promise((resolve) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      host: '127.0.0.1', port, path, method,
      headers: { 'x-operator-username': username, ...(payload ? { 'content-type': 'application/json', 'content-length': Buffer.byteLength(payload) } : {}) }
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
  const srv = app.listen(3487);
  ok(await waitReady(3487), 'instance ready (fake cloud)');

  // ════ 1. JOB OPENINGS CRUD ════
  section('1. Job openings CRUD');
  let r = await call(3487, 'GET', '/api/recruitment/jobs');
  ok(r.status === 200 && Array.isArray(r.json) && r.json.length === 0, 'empty jobs list starts clean');

  r = await call(3487, 'POST', '/api/recruitment/jobs', { company: 'SVN-1' });
  ok(r.status === 400, `job without title rejected 400 (got ${r.status})`);

  r = await call(3487, 'POST', '/api/recruitment/jobs', { title: 'Payroll Executive', company: 'SVN-1', department: 'HR', location: 'Jaipur', openings: 2 });
  ok(r.status === 200 && r.json?.success, 'job create works');
  const j1 = r.json?.job;
  ok(j1?.id === 'JOB0001' && j1?.status === 'OPEN', `id JOB0001 + default status OPEN (got ${j1?.id}/${j1?.status})`);

  r = await call(3487, 'POST', '/api/recruitment/jobs', { title: 'Accountant', company: 'Sakar-III' });
  const j2 = r.json?.job;
  ok(j2?.id === 'JOB0002', 'second job gets JOB0002');

  // ════ 2. CANDIDATE PIPELINE ════
  section('2. Candidate pipeline');
  r = await call(3487, 'POST', '/api/recruitment/candidates', { opening_id: 'JOB0001' });
  ok(r.status === 400, `candidate without name rejected 400 (got ${r.status})`);

  r = await call(3487, 'POST', '/api/recruitment/candidates', { opening_id: 'JOB0001', name: 'Ramesh Kumar', source: 'PORTAL' });
  ok(r.status === 200 && r.json?.candidate?.id === 'CAND0001', `candidate CAND0001 created (got ${r.json?.candidate?.id})`);
  ok(r.json?.candidate?.stage === 'APPLIED', 'default stage APPLIED');

  r = await call(3487, 'POST', '/api/recruitment/candidates', { opening_id: 'JOB0001', name: 'Sunita Sharma' });
  const c2 = r.json?.candidate;
  ok(c2?.id === 'CAND0002', 'second candidate CAND0002');

  let jobs = await call(3487, 'GET', '/api/recruitment/jobs');
  const j1view = jobs.json?.find((x: any) => x.id === 'JOB0001');
  ok(j1view?.candidate_count === 2 && j1view?.hired_count === 0, `JOB0001 counts: 2 candidates, 0 hired (got ${j1view?.candidate_count}/${j1view?.hired_count})`);

  r = await call(3487, 'POST', '/api/recruitment/candidates', { ...c2, stage: 'HIRED', rating: 4 });
  ok(r.json?.candidate?.stage === 'HIRED' && r.json?.candidate?.updated_at, 'stage move to HIRED persists');

  jobs = await call(3487, 'GET', '/api/recruitment/jobs');
  ok(jobs.json?.find((x: any) => x.id === 'JOB0001')?.hired_count === 1, 'hired_count now 1');

  const cands = await call(3487, 'GET', '/api/recruitment/candidates?opening_id=JOB0001');
  ok(cands.json?.length === 2, 'opening_id filter returns 2 candidates');

  r = await call(3487, 'DELETE', '/api/recruitment/candidates/CAND0001');
  ok(r.status === 200 && r.json?.success, 'candidate delete works');
  ok((await call(3487, 'GET', '/api/recruitment/candidates')).json?.length === 1, 'candidate list shrinks to 1');

  // ════ 3. COMPANY FILTER + CASCADE DELETE ════
  section('3. Company scoping + cascade delete');
  const svnJobs = await call(3487, 'GET', '/api/recruitment/jobs?company=SVN-1');
  ok(svnJobs.json?.length === 1 && svnJobs.json[0]?.id === 'JOB0001', 'company=SVN-1 filters to 1 job');

  await call(3487, 'POST', '/api/recruitment/candidates', { opening_id: 'JOB0002', name: 'Cascade Victim' });
  r = await call(3487, 'DELETE', `/api/recruitment/jobs/${j2.id}`);
  ok(r.status === 200 && r.json?.success, 'job delete works');
  ok((await call(3487, 'GET', '/api/recruitment/candidates?opening_id=JOB0002')).json?.length === 0, 'cascade removed JOB0002 candidates');
  r = await call(3487, 'DELETE', '/api/recruitment/jobs/JOB9999');
  ok(r.status === 404, `missing job delete → 404 (got ${r.status})`);

  // ════ 4. EXPENSE CLAIMS ════
  section('4. Expense claims');
  r = await call(3487, 'POST', '/api/expenses', { title: 'Taxi fare' });
  ok(r.status === 400, `claim without amount rejected 400 (got ${r.status})`);

  r = await call(3487, 'POST', '/api/expenses', { title: 'Client visit travel', employee_id: 'EMPRE1', employee_name: 'Rec Emp One', company: 'SVN-1', amount: 2500, category: 'TRAVEL', expense_date: '2026-09-28' });
  ok(r.status === 200 && r.json?.success, 'HR-submitted claim works');
  const cl1 = r.json?.claim;
  ok(cl1?.id === 'EXPC0001' && cl1?.claim_no === 'EXP-0001', `id EXPC0001 + claim_no EXP-0001 (got ${cl1?.id}/${cl1?.claim_no})`);
  ok(cl1?.status === 'SUBMITTED', 'default status SUBMITTED');

  r = await call(3487, 'POST', '/api/expenses', { title: 'Stationery', employee_id: 'EMPRE1', employee_name: 'Rec Emp One', company: 'Sakar-III', amount: 400 });
  const cl2 = r.json?.claim;
  ok(cl2?.claim_no === 'EXP-0002', 'second claim EXP-0002');

  let claims = await call(3487, 'GET', '/api/expenses');
  ok(claims.json?.length === 2, 'expense list returns 2');

  const svnClaims = await call(3487, 'GET', '/api/expenses?company=SVN-1');
  ok(svnClaims.json?.length === 1 && svnClaims.json[0]?.claim_no === 'EXP-0001', 'company filter on claims works');

  // ════ 5. DECISIONS (approve / reject / pay) ════
  section('5. Decision workflow');
  r = await call(3487, 'POST', `/api/expenses/${cl1.id}/decision`, { status: 'MAYBE' });
  ok(r.status === 400, `invalid status rejected 400 (got ${r.status})`);

  r = await call(3487, 'POST', `/api/expenses/${cl1.id}/decision`, { status: 'APPROVED', note: 'bills verified', operator: 'Vishnu' });
  ok(r.json?.claim?.status === 'APPROVED' && r.json?.claim?.decided_by === 'Vishnu', `approved with operator recorded (got ${r.json?.claim?.status}/${r.json?.claim?.decided_by})`);
  ok(!!r.json?.claim?.decided_at, 'decided_at timestamp set');

  r = await call(3487, 'POST', `/api/expenses/${cl1.id}/decision`, { status: 'PAID' });
  ok(r.json?.claim?.status === 'PAID' && !!r.json?.claim?.paid_at, 'PAID sets paid_at timestamp');

  r = await call(3487, 'POST', '/api/expenses/EXPC9999/decision', { status: 'APPROVED' });
  ok(r.status === 404, `decision on missing claim → 404 (got ${r.status})`);

  // ════ 6. DELETE + CLOUD PERSISTENCE ════
  section('6. Delete + cloud persistence');
  r = await call(3487, 'DELETE', `/api/expenses/${cl2.id}`);
  ok(r.status === 200 && r.json?.success, 'claim delete works');
  ok((await call(3487, 'GET', '/api/expenses')).json?.length === 1, 'claim list shrinks to 1');
  r = await call(3487, 'DELETE', '/api/expenses/EXPC9999');
  ok(r.status === 404, `missing claim delete → 404 (got ${r.status})`);

  await flush(app);
  const cloud = cloudRow.payload;
  ok(Array.isArray(cloud.job_openings) && cloud.job_openings.length === 1, `job_openings persisted to cloud (got ${cloud.job_openings?.length})`);
  ok(Array.isArray(cloud.job_candidates) && cloud.job_candidates.length === 1, `job_candidates persisted (got ${cloud.job_candidates?.length})`);
  ok(Array.isArray(cloud.expense_claims) && cloud.expense_claims.length === 1, `expense_claims persisted (got ${cloud.expense_claims?.length})`);
  ok(cloud.expense_claims?.[0]?.status === 'PAID', 'cloud copy has decision state');

  // ════ 7. RELOAD SURVIVAL (new instance adopts cloud copy) ════
  section('7. Reload survival');
  const app2: any = await createApp(fakeSupabase as any);
  const srv2 = app2.listen(3488);
  ok(await waitReady(3488), 'second instance ready');
  const reloaded = await call(3488, 'GET', '/api/recruitment/jobs');
  ok(reloaded.json?.length === 1 && reloaded.json[0]?.candidate_count === 1, 'fresh instance sees cloud-persisted module data');
  const reloadedClaims = await call(3488, 'GET', '/api/expenses');
  ok(reloadedClaims.json?.length === 1 && reloadedClaims.json[0]?.status === 'PAID', 'fresh instance sees cloud-persisted claim');

  srv.close(); srv2.close();

  console.log(`\n${'═'.repeat(62)}`);
  console.log(`  RESULT: ${pass} PASS, ${fail} FAIL`);
  console.log(`${'═'.repeat(62)}`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('HARNESS CRASH:', e); process.exit(1); });
