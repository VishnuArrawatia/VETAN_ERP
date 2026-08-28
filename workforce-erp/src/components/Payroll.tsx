function __placeholder__() {}
import { useState } from 'react';
import { Printer } from 'lucide-react';
import { useStore, unitName, companyName } from '../lib/store';
import { calcPayroll, totals } from '../lib/payroll';
import { monthLabel, monthDays, fmtINR, fmtINR2 } from '../lib/months';
import { WorkerRec } from '../types';
import { Card, CardHeader, Btn, Select, Badge, Empty, Th, Td, Table, Modal } from './ui';

export default function Payroll({ monthKey }: { monthKey: string }) {
  const { state } = useStore();
  const [unit, setUnit] = useState('all');
  const [slipId, setSlipId] = useState<string | null>(null);

  const rows = calcPayroll(state, monthKey, unit !== 'all' ? unit : undefined);
  const total = totals(rows);
  const slip = slipId ? rows.find((r) => r.worker.id === slipId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Payroll</h1>
          <p className="text-sm text-slate-500">
            {monthLabel(monthKey)} · {monthDays(monthKey)} days · auto from attendance × rates
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="all">All Units</option>
            {state.units.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </Select>
          <Badge tone="blue">{rows.length} workers</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Paid Days', total.payDays, 'text-slate-800'],
          ['Gross', total.gross, 'text-slate-800'],
          ['PF', total.pf, 'text-rose-600'],
          ['Net Pay', total.net, 'text-emerald-600'],
        ].map(([l, v, c]) => (
          <div key={l as string} className="rounded-xl bg-white border border-slate-200 px-4 py-3">
            <div className="text-[11px] font-semibold uppercase text-slate-500">{l}</div>
            <div className={`text-xl font-bold tabular-nums ${c}`}>₹{fmtINR(v as number)}</div>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Monthly Payroll" subtitle="Basic×days + HRA×days + Other×days + OT − PF − ESIC = Net" />
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <Th>Code</Th><Th>Name</Th><Th>Unit</Th>
              <Th right>Days</Th><Th right>OT</Th>
              <Th right>Basic</Th><Th right>HRA</Th><Th right>Other</Th>
              <Th right>Gross</Th><Th right>PF</Th><Th right>ESIC</Th><Th right>Net</Th>
              <Th right>Slip</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={13}><Empty message="No payroll for this unit/month." /></td></tr>}
            {rows.map((r) => (
              <tr key={r.worker.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <Td className="font-mono text-xs">{r.worker.code}</Td>
                <Td className="font-medium">{r.worker.name}</Td>
                <Td><Badge>{unitName(state, r.worker.unitId)}</Badge></Td>
                <Td right className="tabular-nums">{r.payDays}</Td>
                <Td right className="tabular-nums">{r.otPay ? '₹' + fmtINR(r.otPay) : '—'}</Td>
                <Td right className="tabular-nums">₹{fmtINR(r.basic)}</Td>
                <Td right className="tabular-nums">₹{fmtINR(r.hra)}</Td>
                <Td right className="tabular-nums">{r.other ? '₹' + fmtINR(r.other) : '—'}</Td>
                <Td right className="tabular-nums font-semibold">₹{fmtINR(r.gross)}</Td>
                <Td right className="tabular-nums text-rose-600">{r.pf ? '₹' + fmtINR(r.pf) : '—'}</Td>
                <Td right className="tabular-nums text-amber-600">{r.esic ? '₹' + fmtINR(r.esic) : '—'}</Td>
                <Td right className="tabular-nums font-bold text-emerald-700">₹{fmtINR(r.net)}</Td>
                <Td right>
                  <Btn size="sm" variant="secondary" onClick={() => setSlipId(r.worker.id)}>
                    <Printer size={13} /> Slip
                  </Btn>
                </Td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <Td>Total</Td><Td colSpan={2}>{rows.length} workers</Td>
                <Td right className="tabular-nums">{total.payDays}</Td>
                <Td right /><Td right className="tabular-nums">₹{fmtINR(total.basic)}</Td>
                <Td right /><Td right />
                <Td right className="tabular-nums">₹{fmtINR(total.gross)}</Td>
                <Td right className="tabular-nums text-rose-600">₹{fmtINR(total.pf)}</Td>
                <Td right className="tabular-nums text-amber-600">₹{fmtINR(total.esic)}</Td>
                <Td right className="tabular-nums text-emerald-700">₹{fmtINR(total.net)}</Td>
                <Td right />
              </tr>
            </tfoot>
          )}
        </Table>
      </Card>

      {slip && (
        <PayslipModal
          worker={slip.worker} monthKey={monthKey} payDays={slip.payDays} otPay={slip.otPay}
          basic={slip.basic} hra={slip.hra} other={slip.other} gross={slip.gross}
          pf={slip.pf} esic={slip.esic} net={slip.net} onClose={() => setSlipId(null)}
        />
      )}
    </div>
  );
}