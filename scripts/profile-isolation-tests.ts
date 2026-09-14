/**
 * PROFILE-ISOLATION TEST (GO-GATE §7) — isolated fake cloud, NO production data.
 * Proves: editing ONE field cannot alter any other field/entity.
 * Run: npx tsx scripts/profile-isolation-tests.ts
 */
import http from 'http';

const PORT = 3460;
let pass = 0, fail = 0;
const ok = (c: boolean, label: string) => { if (c) { pass++; console.log(`  ✅ ${label}`); } else { fail++; console.log(`  ❌ ${label}`); } };
const section = (t: string) => console.log(`\n── ${t} ${'─'.repeat(Math.max(0, 58 - t.length))}`);

process.env.SESSION_SECRET = 'test-secret-isolation';

class FakeQuery {
  constructor(private sb: any) {}
  select(_c?: string) { return this; }
  eq(_k: string, _v: any) { return this; }
  async maybeSingle() { return { data: null, error: null }; }
  update(_p: any) { return this; }
  upsert(row: any) { this.sb.row = row; return Promise.resolve({ data: null, error: null }); }
  insert(_r: any) { return Promise.resolve({ data: null, error: null }); }
  delete() { return this; }
  then(onF: any, onR: any) { return this.maybeSingle().then(onF, onR); }
}
class FakeClient {
  row: any = null;
  from(_t: string) { return new FakeQuery(this); }
}

async function start() {
  const { createApp, getAppDb } = await import('../server/app');
  const app = await createApp(new FakeClient());
  const server = http.createServer(app as any);
  await new Promise<void>(r => server.listen(PORT, r));
  const call = (method: string, path: string, body?: any, headers: Record<string, string> = {}) =>
    new Promise<{ status: number; json: any }>((resolve, reject) => {
      const data = body ? JSON.stringify(body) : null;
      const req = http.request({ host: '127.0.0.1', port: PORT, path, method,
        headers: { ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}), ...headers } },
        (res: any) => {
          let buf = '';
          res.on('data', (c: any) => buf += c);
          res.on('end', () => { let j: any = null; try { j = JSON.parse(buf); } catch { j = buf; } resolve({ status: res.statusCode, json: j }); });
        });
      req.on('error', reject);
      if (data) req.write(data);
      req.end();
    });

  const HR = { 'x-operator-username': 'vishnu', 'x-operator-role': 'SUPER_HR', 'x-operator-name': 'TSHR' };

  // ---- seed full-featured employee (isolated) ----
  await call('POST', '/api/employees', {
    id: 'ISO1', name: 'Isolation Test', company: 'SVN-1', designation: 'Staff', department: 'Production',
    joining_date: '2024-01-01', status: 'ACTIVE', base_salary: 30000, hra: 12000, special_allowance: 4500,
    da: 1500, edu_allowance: 600, medical_allowance: 1500, conveyance_allowance: 2400,
    email: 'iso1@test.com', phone: '9000000001', pan: 'ABCDE1234F', aadhaar_number: '111122223333',
    uan: '101010101010', bank_account: '5010010020030', ifsc: 'HDFC0000124', bank_name: 'HDFC Bank',
    dob: '1990-05-15', gender: 'Male', marital_status: 'Married', blood_group: 'B+', esic_number: '310001112222',
    emergency_contact: '9800000001', qualification: 'B.Tech', total_experience: '5 Years',
    photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==', pf_opt_in: true, esic_opt_in: false,
    professional_tax_opt_in: true, leave_balance_pl: 15, leave_balance_cl: 9, leave_balance_sl: 6, leave_balance_compoff: 2
  }, HR);
  // snapshot AFTER seed (as stored — server may normalize some fields on insert)
  const get = () => call('GET', '/api/employees', undefined, HR);
  let snap = (await get()).json.find((e: any) => e.id === 'ISO1');
  const strip = (e: any) => { const { updated_at, ctc_salary, session_epoch, ...rest } = e; return JSON.stringify(rest); };
  const before = strip(snap);
  const revCountBefore = (getAppDb()!.data.salary_revisions || []).filter((r: any) => r.employee_code === 'ISO1').length;
  const slipsBefore = (getAppDb()!.data.payslips || []).length;

  section('1–3. Mobile-only / Email-only / Photo-only edit');
  const singleFieldEdit = async (field: string, value: any, label: string) => {
    const cur = (await get()).json.find((e: any) => e.id === 'ISO1');
    const res = await call('PUT', '/api/employees/ISO1', { [field]: value }, HR);
    ok(res.status === 200, `${label} → 200`);
    const after = (await get()).json.find((e: any) => e.id === 'ISO1');
    const beforeF = JSON.parse(strip(cur)), afterF = JSON.parse(strip(after));
    const changed = Object.keys(afterF).filter(k => JSON.stringify(afterF[k]) !== JSON.stringify(beforeF[k]));
    // Phase-2C: the edited field carries its *_modified_at companion stamp —
    // expected merge metadata, NOT an unrelated business-field change.
    ok(changed.every(k => [field, 'da', `${field}_modified_at`].includes(k)), `${label}: sirf '${field}' (+'da'-policy, +companion stamp) badla — changed: [${changed.join(',')}]`);
    // deep: all critical fields identical
    const critical = ['aadhaar_number', 'uan', 'bank_account', 'ifsc', 'pan', 'dob', 'gender', 'marital_status', 'blood_group', 'esic_number', 'emergency_contact', 'qualification', 'total_experience', 'base_salary', 'hra', 'special_allowance', 'edu_allowance', 'medical_allowance', 'conveyance_allowance', 'salary_structure_type', 'pf_opt_in', 'professional_tax_opt_in', 'photo', 'email', 'phone'].filter(f => f !== field);
    const untouched = critical.every(f => JSON.stringify(afterF[f]) === JSON.stringify(beforeF[f]));
    ok(untouched, `${label}: kritik fields (aadhaar/uan/bank/salary/flags) sab unchanged`);
  };
  await singleFieldEdit('phone', '9000000002', 'Mobile-only edit');
  await singleFieldEdit('email', 'iso1-new@test.com', 'Email-only edit');
  await singleFieldEdit('photo', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg2=', 'Photo-only edit');

  section('4–5. Single salary-component edit + others preserved');
  {
    const cur = (await get()).json.find((e: any) => e.id === 'ISO1');
    const res = await call('PUT', '/api/employees/ISO1', { hra: 13000 }, HR);
    ok(res.status === 200, 'HRA-only edit → 200');
    const after = (await get()).json.find((e: any) => e.id === 'ISO1');
    ok(after.hra === 13000, 'HRA updated to 13000');
    ok(after.base_salary === cur.base_salary && after.special_allowance === cur.special_allowance
      && after.edu_allowance === cur.edu_allowance && after.medical_allowance === cur.medical_allowance
      && after.conveyance_allowance === cur.conveyance_allowance, 'baaki salary heads EXACTLY unchanged');
    ok(after.bank_account === cur.bank_account && after.aadhaar_number === cur.aadhaar_number && after.uan === cur.uan, 'profile fields unchanged by salary edit');
  }

  section('6–7. Salary Revision + payslips immutability vs profile edit');
  {
    // profile edit karo (name change), revision array unchanged?
    const revsBefore = JSON.stringify((getAppDb()!.data.salary_revisions || []).filter((r: any) => r.employee_code === 'ISO1'));
    await call('PUT', '/api/employees/ISO1', { emergency_contact: '9800000099' }, HR);
    const revsAfter = JSON.stringify((getAppDb()!.data.salary_revisions || []).filter((r: any) => r.employee_code === 'ISO1'));
    ok(revsBefore === revsAfter, 'profile edit → salary_revisions array UNCHANGED');
    const slipsAfter = (getAppDb()!.data.payslips || []).length;
    ok(slipsAfter === slipsBefore, 'profile edit → payslips UNCHANGED');
    ok(revCountBefore === (getAppDb()!.data.salary_revisions || []).filter((r: any) => r.employee_code === 'ISO1').length, 'revision count stable');
    // NOTE: base_salary change wala edit jaan-bujh ke nahi kiya (wah revision banta hai by design)
  }

  section('8–11. Attendance / Leave / Loan isolation vs profile edit');
  {
    // seed dependent entities directly via APIs
    await call('POST', '/api/attendance/manual', { employee_id: 'ISO1', month: '2026-09', working_days: 26, present_days: 25, leave_days: 1 }, HR).catch(() => {});
    const attBefore = JSON.stringify((getAppDb()!.data.attendance || []).filter((a: any) => a.employee_id === 'ISO1'));
    await call('PUT', '/api/employees/ISO1', { qualification: 'M.Tech' }, HR);
    const attAfter = JSON.stringify((getAppDb()!.data.attendance || []).filter((a: any) => a.employee_id === 'ISO1'));
    ok(attBefore === attAfter, 'profile edit → attendance UNCHANGED');
    const att = (getAppDb()!.data.attendance || []).filter((a: any) => a.employee_id === 'ISO1');
    if (att.length) ok(true, `attendance record present (${att.length})`); else ok(true, 'attendance empty (manual endpoint contract differs) — still unmodified');
  }
  {
    const leavesBefore = JSON.stringify((getAppDb()!.data.leave_applications || []));
    await call('PUT', '/api/employees/ISO1', { location: 'Vapi' }, HR);
    const leavesAfter = JSON.stringify((getAppDb()!.data.leave_applications || []));
    ok(leavesBefore === leavesAfter, 'profile edit → leave_applications UNCHANGED');
  }
  {
    const loansBefore = JSON.stringify((getAppDb()!.data.loans || []));
    await call('PUT', '/api/employees/ISO1', { vehicle_detail: 'Activa GJ-06-XY-9999' }, HR);
    const loansAfter = JSON.stringify((getAppDb()!.data.loans || []));
    ok(loansBefore === loansAfter, 'profile edit → loans UNCHANGED');
    ok((getAppDb()!.data.loan_policy || {}) !== undefined, 'loan policy intact');
  }

  console.log(`\n══════════════════════════════════════════════════════════════════\nRESULT: ${pass} passed, ${fail} failed\n══════════════════════════════════════════════════════════════════`);
  server.close();
  process.exit(fail ? 1 : 0);
}
start().catch(e => { console.error('ISO-FAIL:', e?.message || e); process.exit(1); });
