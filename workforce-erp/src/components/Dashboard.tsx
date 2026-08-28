import { useStore, unitName } from '../lib/store';
import { calcPayroll, totals } from '../lib/payroll';
import { monthLabel, monthDays, fmtINR } from '../lib/months';
import { Stat, Card, CardHeader, Badge } from './ui';

export default function Dashboard({ monthKey }: { monthKey: string }) {
  const { state } = useStore();
  const active = state.workers.filter((w) => w.active);
  const rows = calcPayroll(state, monthKey);
  const total = totals(rows);
  const attRows = state.attendance.filter((a) => a.monthKey === monthKey);

  const presentDayCount = attRows.reduce((s, a) => s + (a.present || 0), 0);
  const workerWithAtt = attRows.length;
  const attRate = workerWithAtt ? Math.round((presentDayCount / (workerWithAtt * monthDays(monthKey))) * 100) : 0;

  const company = active.filter((w) => w.mode === 'Company').length;
  const contractor = active.filter((w) => w.mode === 'Contractor').length;
  const pfEligible = active.filter((w) => w.pf).length;
  const esicEligible = active.filter((w) => w.esic).length;

  const byUnit = state.units.map((u) => {
    const ws = active.filter((w) => w.unitId === u.id);
    const pay = rows.filter((r) => r.worker.unitId === u.id);
    return { unit: u, count: ws.length, gross: pay.reduce((s, r) => s + r.gross, 0), net: pay.reduce((s, r) => s + r.net, 0) };
  });

  const byDept = Object.entries(
    active.reduce<Record<string, number>>((acc, w) => {
      const d = w.department || 'Other';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxDept = Math.max(1, ...byDept.map((d) => d[1]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{monthLabel(monthKey)} Overview</h1>
          <p className="text-sm text-slate-500">
            {active.length} active workers · {workerWithAtt} with attendance · {monthDays(monthKey)} days
          </p>
        </div>
        <div className="flex gap-2">
          <Badge tone="blue">{state.units.length} Units</Badge>
          <Badge tone="violet">{state.companies.length} Companies</Badge>
          <Badge tone="green">{state.contractors.length} Contractors</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Payroll Summary" subtitle={`${monthLabel(monthKey)} — basic + HRA + other + OT, minus PF/ESIC`} />
          <div className="p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                ['Gross', total.gross, 'text-slate-800'],
                ['Employee PF', total.pf, 'text-rose-600'],
                ['ESIC', total.esic, 'text-amber-600'],
                ['Net Pay', total.net, 'text-emerald-600'],
              ].map(([l, v, c]) => (
                <div key={l as string} className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-3">
                  <div className="text-[11px] font-semibold uppercase text-slate-500">{l}</div>
                  <div className={`text-lg font-bold tabular-nums ${c}`}>₹{fmtINR(v as number)}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
                  <tr><th className="text-left px-3 py-2">Unit</th><th className="text-right px-3 py-2">Workers</th><th className="text-right px-3 py-2">Gross</th><th className="text-right px-3 py-2">Net</th></tr>
                </thead>
                <tbody>
                  {byUnit.map((u) => (
                    <tr key={u.unit.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-medium">{u.unit.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{u.count}</td>
                      <td className="px-3 py-2 text-right tabular-nums">₹{fmtINR(u.gross)}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">₹{fmtINR(u.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Workers by Department" subtitle="Active workforce" />
          <div className="p-5 space-y-2.5">
            {byDept.map(([d, n]) => (
              <div key={d}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-600">{d}</span>
                  <span className="text-slate-500 tabular-nums">{n}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(n / maxDept) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Statutory & Setup" />
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-between items-center"><span>PF Eligible</span><Badge tone="blue">{pfEligible}</Badge></div>
            <div className="flex justify-between items-center"><span>ESIC Eligible</span><Badge tone="green">{esicEligible}</Badge></div>
            <div className="flex justify-between items-center"><span>PF % (Emp/Er)</span><span className="font-semibold tabular-nums">{(state.settings.pfEmp * 100)}% / {(state.settings.pfEr * 100)}%</span></div>
            <div className="flex justify-between items-center"><span>ESIC % (Emp/Er)</span><span className="font-semibold tabular-nums">{(state.settings.esicEmp * 100)}% / {(state.settings.esicEr * 100)}%</span></div>
            <div className="flex justify-between items-center"><span>Bonus Rate</span><span className="font-semibold tabular-nums">{(state.settings.bonusRate * 100)}%</span></div>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Headcount by Unit & Type" subtitle="Company vs Contractor per unit" />
          <div className="p-5">
            <div className="grid gap-3 md:grid-cols-3">
              {byUnit.map((u) => {
                const cmp = state.workers.filter((w) => w.unitId === u.unit.id && w.mode === 'Company' && w.active).length;
                const ctr = state.workers.filter((w) => w.unitId === u.unit.id && w.mode === 'Contractor' && w.active).length;
                const ident = state.units.findIndex((x) => x.id === u.unit.id) % 4;
                const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-sky-500'];
                return (
                  <div key={u.unit.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${colors[ident]}`} />
                      <span className="font-semibold text-sm">{u.unit.name}</span>
                    </div>
                    <div className="text-2xl font-bold mt-1 tabular-nums">{u.count}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      {cmp} Company · {ctr} Contractor
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 mt-2">
                      Net ₹{fmtINR(u.net)}
                    </div>
                  </div>
                );
              })}
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 flex flex-col items-center justify-center text-center">
                <div className="text-3xl font-bold text-indigo-200">+</div>
                <div className="text-xs text-slate-400 mt-1">New unit?<br />Add in Settings</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title={`Top Workers — ${monthLabel(monthKey)}`} subtitle="By net pay for the selected month (live from master + attendance)" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <tr>
                <th className="text-left px-3 py-2">#</th>
                <th className="text-left px-3 py-2">Code</th>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Unit</th>
                <th className="text-right px-3 py-2">Days</th>
                <th className="text-right px-3 py-2">Gross</th>
                <th className="text-right px-3 py-2">Net</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].sort((a, b) => b.net - a.net).slice(0, 8).map((r, i) => (
                <tr key={r.worker.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                  <td className="px-3 py-2 font-mono text-xs">{r.worker.code}</td>
                  <td className="px-3 py-2 font-medium">{r.worker.name}</td>
                  <td className="px-3 py-2"><Badge>{unitName(state, r.worker.unitId)}</Badge></td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.payDays}</td>
                  <td className="px-3 py-2 text-right tabular-nums">₹{fmtINR(r.gross)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">₹{fmtINR(r.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}