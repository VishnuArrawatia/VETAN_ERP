// Builds src/data/seed.json from the Master Excel workbook (node tools/build_seed.cjs)
const XLSX = require('c:/Users/SAKAR/VETAN_ERP_Freebuff/node_modules/xlsx');
const fs = require('fs');
const path = require('path');

const FILE = 'D:\\c drive\\Desktop\\Workforce- JULY-2026 - 18.8.26 .xlsm';
const OUT = path.join(__dirname, '..', 'src', 'data', 'seed.json');
const wb = XLSX.readFile(FILE); // fixed

const srl2date = (srl) => {
  if (!srl && srl !== 0) return '';
  const d = new Date(Math.round((srl - 25569) * 86400 * 1000));
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};
const srl2month = (srl) => srl2date(srl).slice(0, 7);
const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
};

const companies = [
  { id: 'c-svn', name: 'SVN Opto Electronics Pvt Ltd', short: 'SVN Opto' },
  { id: 'c-sak', name: 'Sakar Electricals & Electronics Pvt. Ltd.', short: 'Sakar Elec' }
];
const unitById = {};
let unitSeq = 1;
const unitFor = (uname) => {
  const key = String(uname || '').trim();
  if (!key) return 'u-un';
  if (unitById[key]) return unitById[key].id;
  const cid = key === 'SVN-II' ? 'c-svn' : 'c-sak';
  const id = 'u' + unitSeq++;
  unitById[key] = { id, name: key, companyId: cid };
  return id;
};

const mh = XLSX.utils.sheet_to_json(wb.Sheets['MASTER_Workers'], { header: 1, defval: '' });
const heads = mh[0];
const ci = (name) => heads.indexOf(name);
const C = {
  code: ci('Worker_Code'), name: ci('Name'), unit: ci('Unit'), typ: ci('Type'),
  src: ci('Source'), dept: ci('Department'), gender: ci('Gender'), doj: ci('DOJ'),
  uan: ci('UAN'), bank: ci('Bank_Name'), ac: ci('Bank_AC_No'), ifsc: ci('IFSC'),
  rb: ci('Basic_Rate_Day'), rh: ci('HRA_Rate_Day'), ro: ci('Other_Allow_Rate_Day'),
  rd: ci('Total_Wage_Day'), ctc: ci('CTC'), mw: ci('Min_Wage_Day'),
  pf: ci('PF_Flag'), esic: ci('ESIC_Flag'), act: ci('Active_Status')
};

const workers = [];
const contractors = [];
const cIdByName = {};
const workerByCode = {};
let wSeq = 0;

function ensureContractor(name) {
  const n = String(name || '').trim();
  if (!n) return '';
  if (cIdByName[n]) return cIdByName[n];
  const rec = {
    id: 'ct' + (Object.keys(cIdByName).length + 1),
    name: n, pf: true, esic: true, commissionPerDay: 25, gstRate: 0.18, tdsRate: 0.02
  };
  cIdByName[n] = rec.id;
  contractors.push(rec);
  return rec.id;
}

for (let r = 1; r < mh.length; r++) {
  const row = mh[r];
  const code = String(row[C.code] || '').trim();
  const name = String(row[C.name] || '').trim();
  if (!code || !name) continue;
  const unit = String(row[C.unit] || '').trim();
  const typ = String(row[C.typ] || '').trim();
  const active = String(row[C.act] || '').trim() === '1';
  const mode = typ === 'Company' ? 'Company' : 'Contractor';
  const uId = unitFor(unit);
  const compIdx = unit === 'SVN-II' ? 0 : 1;
  const contractor = mode === 'Contractor' ? ensureContractor(row[C.src]) : '';
  const id = 'w' + ++wSeq;
  workers.push({
    id, code, name, unitId: uId, companyId: companies[compIdx].id, contractor,
    department: String(row[C.dept] || '').trim(),
    gender: String(row[C.gender] || '').trim(),
    doj: srl2date(row[C.doj]),
    uan: String(row[C.uan] || '').trim(),
    bank: String(row[C.bank] || '').trim(),
    ac: String(row[C.ac] || '').trim(),
    ifsc: String(row[C.ifsc] || '').trim(),
    mode,
    rateBasic: num(row[C.rb]), rateHra: num(row[C.rh]), rateOther: num(row[C.ro]),
    rateDay: num(row[C.rd]), ctc: num(row[C.ctc]), minWage: num(row[C.mw]),
    pf: String(row[C.pf] || '').toUpperCase() === 'YES',
    esic: String(row[C.esic] || '').toUpperCase() === 'YES',
    active
  });
}
// dedupe by code (last wins keeps master majority)
for (const w of workers) workerByCode[w.code] = w;

const ar = XLSX.utils.sheet_to_json(wb.Sheets['Attendance_Raw'], { header: 1, defval: '' });
let hr = 0;
for (let i = 0; i < ar.length; i++) {
  if (String(ar[i][0]).trim() === 'Proper Code') { hr = i; break; }
}
const ah = ar[hr];
const A = {};
ah.forEach((h, i) => (A[String(h).trim()] = i));

const attendance = [];
for (let r = hr + 1; r < ar.length; r++) {
  const row = ar[r];
  const code = String(row[A['Proper Code']] || '').trim();
  const w = workerByCode[code];
  if (!w) continue;
  const monthKey = srl2month(row[A['Month']]);
  if (!monthKey || monthKey < '2026-04' || monthKey > '2026-07') continue;
  attendance.push({
    id: 'att-' + monthKey + '-' + w.id, monthKey, workerId: w.id,
    present: num(row[A['Present']]), absent: num(row[A['Absent']]),
    weeklyOff: num(row[A['Weekly_Off']]), paidHoliday: num(row[A['Paid_Holiday']]),
    leave: num(row[A['Leave']]), lwp: num(row[A['LWP']]), otHours: num(row[A['OT_Hours']])
  });
}

// Leave ledger — carry forward month to month (1 earned/month, opening 0 in Apr)
const monthsPresent = [...new Set(attendance.map((a) => a.monthKey))].sort();
const leave = [];
for (const m of monthsPresent) {
  for (const w of workers) {
    if (!w.active) continue;
    const att = attendance.find((a) => a.workerId === w.id && a.monthKey === m);
    if (!att || (att.leave === 0 && att.absent === 0 && att.present === 0 && att.lwp === 0)) continue;
    const prev = leave.filter((l) => l.workerId === w.id).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    const opening = prev.length ? prev[prev.length - 1].balance : 0;
    const earned = 1;
    const taken = att.leave;
    leave.push({ id: 'lv-' + m + '-' + w.id, monthKey: m, workerId: w.id, opening, earned, taken, balance: Math.max(0, opening + earned - taken) });
  }
}

const state = {
  companies,
  units: Object.values(unitById),
  workers,
  attendance,
  leave,
  contractors,
  settings: { pfEmp: 0.12, pfEr: 0.12, esicEmp: 0.0075, esicEr: 0.0325, bonusRate: 0.0833 }
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(state));
console.log('Seed written to', OUT);
console.log('units:', state.units.map((u) => u.name).join(', '));
console.log('workers:', workers.length, '| active:', workers.filter((w) => w.active).length);
console.log('attendance rows:', attendance.length);
console.log('months:', monthsPresent.join(', '));
console.log('contractors:', contractors.length);