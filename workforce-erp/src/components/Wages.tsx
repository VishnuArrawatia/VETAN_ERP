import { useState } from 'react';
import { FileDown } from 'lucide-react';
import { useStore, unitName } from '../lib/store';
import { pfBase, esicApplicable } from '../lib/payroll';
import { monthLabel, fmtINR } from '../lib/months';
import { exportMonthWorkbook } from '../lib/excel';
import { Card, CardHeader, Select, Badge, Empty, Th, Td, Table, Input, Btn } from './ui';

type GroupBy = 'worker' | 'unit' | 'department';

interface Row {
  key: string;
  name: string;
  sub: string;
  count: number;
  payDays: number;
  gross: number;
  pf: number;
  esic: number;
  loan: number;
  advance: number;
  other: number;
  recovery: number;
  net: number;
}

export default function Wages({ monthKey }: { monthKey: string }) {
  const { state } = useStore();
  const [groupBy, setGroupBy] = useState<GroupBy>('worker');
  const [unit, setUnit] = useState('all');
  const [dept, setDept] = useState('all');
  const [q, setQ] = useState('');
  const [exporting, setExporting] = useState(false);

  const exportMonthExcel = async () => {
    setExporting(true);
    try {
      const filename = await exportMonthWorkbook(state, monthKey);
      alert(`📊 Excel month report saved: ${filename}`);
    } catch (e: any) {
      alert('Excel export failed: ' + (e?.message || e));
    } finally {
      setExporting(false);
    }
  };

  const depts = [...new Set(state.workers.map((w) => w.department || 'Other'))].sort();
  const rows: Row[] = [];

  for (const w of state.workers) {
    if (!w.active) continue;
    if (unit !== 'all' && w.unitId !== unit) continue;
    if (dept !== 'all' && (w.department || 'Other') !== dept) continue;
    if (q) {
      const s = q.toLowerCase();
      if (!w.name.toLowerCase().includes(s) && !w.code.toLowerCase().includes(s)) continue;
    }

    const att = state.attendance.find((a) => a.workerId === w.id && a.monthKey === monthKey);
    const payDays = (att?.present || 0) + (att?.paidHoliday || 0) + (att?.leave || 0);

    const eff = {
      rateBasic: w.rateBasic,
      rateHra: w.rateHra,
      rateOther: w.rateOther,
      rateDay: w.rateDay
    };
    const revs = (w.revisions || []).filter((r) => r.effectiveFrom <= monthKey).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
    const r1 = revs[0];
    if (r1) { eff.rateBasic = r1.rateBasic; eff.rateHra = r1.rateHra; eff.rateOther = r1.rateOther; eff.rateDay = r1.rateDay; }

    const otPay = Math.round((att?.otHours || 0) * (eff.rateDay / 8) * 100) / 100;
    const basic = Math.round(eff.rateBasic * payDays * 100) / 100;
    const hra = Math.round(eff.rateHra * payDays * 100) / 100;
    const other = Math.round(eff.rateOther * payDays * 100) / 100;
    const gross = Math.round((basic + hra + other + otPay) * 100) / 100;
    const pf = w.pf ? Math.round(pfBase(eff.rateBasic * payDays, state) * state.settings.pfEmp * 100) / 100 : 0;
    const esic = esicApplicable(state, w) ? Math.round(gross * state.settings.esicEmp * 100) / 100 : 0;

    const ln = (state.loans || []).find((l) => l.workerId === w.id && l.monthKey === monthKey);
    const loan = ln?.loanDeduction || 0;
    const advance = ln?.advanceDeduction || 0;
    const otherDed = ln?.otherDeductions || 0;
    const recovery = Math.round((loan + advance + otherDed) * 100) / 100;
    const net = Math.round((gross - pf - esic - recovery) * 100) / 100;

    rows.push({
      key: w.id,
      name: w.name,
      sub: `${w.code}`,
      count: 1,
      payDays,
      gross,
      pf,
      esic,
      loan,
      advance,
      other: otherDed,
      recovery,
      net
    });
  }
// Group rows
  const grouped: Row[] = [];
  if (groupBy !== 'worker') {
    const map = new Map<string, Row>();
    for (const r of rows) {
      const w = state.workers.find((x) => x.id === r.key);
      const key = groupBy === 'unit' ? (w?.unitId || 'Other') : (w?.department || 'Other');
      const label = groupBy === 'unit' ? unitName(state, key) : (key || 'Other');
      const cur = map.get(key) || { key, name: label, sub: '', count: 0, payDays: 0, gross: 0, pf: 0, esic: 0, loan: 0, advance: 0, other: 0, recovery: 0, net: 0 };
      cur.count += 1;
      cur.payDays += r.payDays;
      cur.gross += r.gross;
      cur.pf += r.pf;
      cur.esic += r.esic;
      cur.loan += r.loan;
      cur.advance += r.advance;
      cur.other += r.other;
      cur.recovery += r.recovery;
      cur.net += r.net;
      map.set(key, cur);
    }
    grouped.push(...map.values());
  } else {
    grouped.push(...rows);
  }

  const totals = grouped.reduce(
    (acc, r) => {
      acc.count += r.count;
      acc.payDays += r.payDays;
      acc.gross += r.gross;
      acc.pf += r.pf;
      acc.esic += r.esic;
      acc.loan += r.loan;
      acc.advance += r.advance;
      acc.other += r.other;
      acc.recovery += r.recovery;
      acc.net += r.net;
      return acc;
    },
    { count: 0, payDays: 0, gross: 0, pf: 0, esic: 0, loan: 0, advance: 0, other: 0, recovery: 0, net: 0 }
  );

  const isGrouped = groupBy !== 'worker';

  // ---- Wage Increment History (old → new) ----
  interface Inc {
    id: string;
    workerId: string;
    code: string;
    name: string;
    unitId: string;
    effective: string;
    oldBasic: number; oldHra: number; oldOther: number; oldDay: number;
    newBasic: number; newHra: number; newOther: number; newDay: number;
    incAmt: number; incPct: number;
    reason?: string;
  }
  const increments: Inc[] = [];
  for (const w of state.workers) {
    if (!w.active) continue;
    if (unit !== 'all' && w.unitId !== unit) continue;
    if (dept !== 'all' && (w.department || 'Other') !== dept) continue;
    const revs = (w.revisions || []).slice().sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
    let prev = { basic: w.rateBasic, hra: w.rateHra, other: w.rateOther, day: w.rateDay };
    for (const rv of revs) {
      const newDay = rv.rateBasic + rv.rateHra + rv.rateOther;
      const incAmt = Math.round((newDay - prev.day) * 100) / 100;
      const incPct = prev.day > 0 ? Math.round((incAmt / prev.day) * 1000) / 10 : 0;
      increments.push({
        id: rv.id,
        workerId: w.id,
        code: w.code,
        name: w.name,
        unitId: w.unitId,
        effective: rv.effectiveFrom,
        oldBasic: prev.basic, oldHra: prev.hra, oldOther: prev.other, oldDay: prev.day,
        newBasic: rv.rateBasic, newHra: rv.rateHra, newOther: rv.rateOther, newDay,
        incAmt, incPct,
        reason: rv.reason
      });
      prev = { basic: rv.rateBasic, hra: rv.rateHra, other: rv.rateOther, day: newDay };
    }
  }
  increments.sort((a, b) => b.effective.localeCompare(a.effective) || a.code.localeCompare(b.code));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Wages &amp; Deductions</h1>
          <p className="text-sm text-slate-500">
            {monthLabel(monthKey)} · worker / unit / department wise · incl. PF, ESIC, Loan, Advance, Other deductions
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
            <option value="worker">Worker wise</option>
            <option value="unit">Unit wise</option>
            <option value="department">Department wise</option>
          </Select>
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="all">All Units</option>
            {state.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Select value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="all">All Departments</option>
            {depts.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Btn variant="secondary" onClick={exportMonthExcel} disabled={exporting}>
            <FileDown size={15} /> {exporting ? 'Preparing…' : 'Month Excel'}
          </Btn>
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-[140px]" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          ['Headcount', totals.count, 'text-slate-800', true],
          ['Gross Wages', totals.gross, 'text-slate-800', false],
          ['PF', totals.pf, 'text-rose-600', false],
          ['ESIC', totals.esic, 'text-amber-600', false],
          ['Net Pay', totals.net, 'text-emerald-600', false],
        ].map(([l, v, c, raw]) => (
          <div key={l as string} className="rounded-xl bg-white border border-slate-200 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase text-slate-500">{l}</div>
            <div className={`text-lg font-bold tabular-nums ${c}`}>{raw ? v : '₹' + fmtINR(v as number)}</div>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title={`${monthLabel(monthKey)} — ${groupBy === 'worker' ? 'Worker wise' : groupBy === 'unit' ? 'Unit wise' : 'Department wise'} wages`}
          subtitle="Basic + HRA + Other + OT = Gross · minus PF, ESIC, Loan, Advance, Other deductions"
        />
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <Th>#</Th><Th>{isGrouped ? 'Name' : 'Worker / Code'}</Th>
              {isGrouped && <Th right>Count</Th>}
              <Th right>Days</Th><Th right>Gross</Th><Th right>PF</Th><Th right>ESIC</Th>
              <Th right>Loan</Th><Th right>Advance</Th><Th right>Other</Th><Th right>Net</Th>
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 && <tr><td colSpan={12}><Empty message="No wages for this month/filter." /></td></tr>}
            {grouped.map((r, i) => (
              <tr key={r.key} className="border-t border-slate-100 hover:bg-slate-50/60">
                <Td className="text-slate-400">{i + 1}</Td>
                <Td>
                  <div className="font-medium">{r.name}</div>
                  {r.sub && <div className="text-[11px] font-mono text-slate-400">{r.sub}</div>}
                </Td>
                {isGrouped && <Td right>{r.count}</Td>}
                <Td right className="tabular-nums">{r.payDays}</Td>
                <Td right className="tabular-nums font-semibold">₹{fmtINR(r.gross)}</Td>
                <Td right className="tabular-nums text-rose-600">{r.pf ? '₹' + fmtINR(r.pf) : '—'}</Td>
                <Td right className="tabular-nums text-amber-600">{r.esic ? '₹' + fmtINR(r.esic) : '—'}</Td>
                <Td right className="tabular-nums text-rose-600">{r.loan ? '₹' + fmtINR(r.loan) : '—'}</Td>
                <Td right className="tabular-nums text-rose-600">{r.advance ? '₹' + fmtINR(r.advance) : '—'}</Td>
                <Td right className="tabular-nums text-rose-600">{r.other ? '₹' + fmtINR(r.other) : '—'}</Td>
                <Td right className="tabular-nums font-bold text-emerald-700">₹{fmtINR(r.net)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title="Wage Increment History — Old Salary → New Salary"
          subtitle="Har increment ke saath old rate aur new rate (per day) — effective month, increase ₹/%"
          right={<Badge tone="violet">{increments.length} increments</Badge>}
        />
        {increments.length === 0 ? (
          <Empty message="No wage revisions recorded yet. Add one from Workers → worker → '+' Add Revision." />
        ) : (
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <Th>Code</Th><Th>Name</Th><Th>Unit</Th><Th>Eff. Month</Th>
                <Th right>Old Rate/Day</Th><Th right>New Rate/Day</Th>
                <Th right>Increase</Th><Th right>% </Th><Th>Reason</Th>
              </tr>
            </thead>
            <tbody>
              {increments.map((inc) => (
                <tr key={inc.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <Td className="font-mono text-xs">{inc.code}</Td>
                  <Td className="font-medium">{inc.name}</Td>
                  <Td><Badge>{unitName(state, inc.unitId)}</Badge></Td>
                  <Td className="font-mono text-xs">{monthLabel(inc.effective)}</Td>
                  <Td right className="tabular-nums text-slate-500">₹{fmtINR(inc.oldDay)}</Td>
                  <Td right className="tabular-nums text-emerald-700 font-semibold">₹{fmtINR(inc.newDay)}</Td>
                  <Td right className="tabular-nums font-semibold text-indigo-700">+₹{fmtINR(inc.incAmt)}</Td>
                  <Td right className="tabular-nums text-slate-600">{inc.incPct.toFixed(1)}%</Td>
                  <Td className="text-xs text-slate-500">{inc.reason || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}