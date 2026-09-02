import { useState } from 'react';
import { Printer } from 'lucide-react';
import { useStore, unitName, companyName, effRates } from '../lib/store';
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
                <Td>Total</Td><td colSpan={2} className="px-3 py-2.5 text-sm text-left">{rows.length} workers</td>
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
function PayslipModal({
  worker, monthKey, payDays, otPay, basic, hra, other, gross, pf, esic, net, onClose,
}: {
  worker: WorkerRec; monthKey: string; payDays: number; otPay: number;
  basic: number; hra: number; other: number; gross: number; pf: number; esic: number; net: number;
  onClose: () => void;
}) {
  const { state } = useStore();
  const company = companyName(state, worker.companyId);
  const rt = effRates(state, worker, monthKey);
  return (
    <Modal title="Payslip" open onClose={onClose} wide>
      <div className="print-area rounded-xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div>
            <div className="text-lg font-bold text-slate-800">{company}</div>
            <div className="text-xs text-slate-500">Salary Slip — {monthLabel(monthKey)}</div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Code: <span className="font-mono text-slate-700">{worker.code}</span></div>
            <div>UAN: {worker.uan || '—'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-[11px] uppercase text-slate-400">Name</div><div className="font-semibold">{worker.name}</div></div>
          <div><div className="text-[11px] uppercase text-slate-400">Unit</div><div className="font-semibold">{unitName(state, worker.unitId)}</div></div>
          <div><div className="text-[11px] uppercase text-slate-400">Department</div><div>{worker.department || '—'}</div></div>
          <div><div className="text-[11px] uppercase text-slate-400">Paid Days</div><div className="tabular-nums">{payDays} / {monthDays(monthKey)}</div></div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <th className="text-left px-3 py-2 rounded-l-lg">Earnings</th>
              <th className="text-right px-3 py-2 rounded-r-lg">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100"><td className="px-3 py-2">Basic</td><td className="px-3 py-2 text-right tabular-nums">₹{fmtINR2(basic)}</td></tr>
            <tr className="border-b border-slate-100"><td className="px-3 py-2">HRA</td><td className="px-3 py-2 text-right tabular-nums">₹{fmtINR2(hra)}</td></tr>
            {other > 0 && <tr className="border-b border-slate-100"><td className="px-3 py-2">Other Allowance</td><td className="px-3 py-2 text-right tabular-nums">₹{fmtINR2(other)}</td></tr>}
            {otPay > 0 && <tr className="border-b border-slate-100"><td className="px-3 py-2">Overtime</td><td className="px-3 py-2 text-right tabular-nums">₹{fmtINR2(otPay)}</td></tr>}
            <tr><td className="px-3 py-2 font-semibold">Gross</td><td className="px-3 py-2 text-right font-bold">₹{fmtINR2(gross)}</td></tr>
          </tbody>
        </table>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] uppercase text-slate-500">
              <th className="text-left px-3 py-2 rounded-l-lg">Deductions</th>
              <th className="text-right px-3 py-2 rounded-r-lg">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100"><td className="px-3 py-2">Employee PF</td><td className="px-3 py-2 text-right tabular-nums">₹{fmtINR2(pf)}</td></tr>
            <tr className="border-b border-slate-100"><td className="px-3 py-2">ESIC</td><td className="px-3 py-2 text-right tabular-nums">₹{fmtINR2(esic)}</td></tr>
            <tr><td className="px-3 py-2 font-semibold">Total Deduction</td><td className="px-3 py-2 text-right font-bold">₹{fmtINR2(pf + esic)}</td></tr>
          </tbody>
        </table>

        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-emerald-800 text-sm">NET PAYABLE</span>
          <span className="text-xl font-extrabold text-emerald-700 tabular-nums">₹{fmtINR2(net)}</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Effective rate/day ₹{fmtINR(rt.rateDay)} (Basic ₹{fmtINR(rt.rateBasic)} + HRA ₹{fmtINR(rt.rateHra)} + Other ₹{fmtINR(rt.rateOther)}) · Bank: {worker.bank || '—'} {worker.ac || ''}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2 no-print">
        <Btn variant="secondary" onClick={onClose}>Close</Btn>
        <Btn onClick={() => window.print()}>
          <Printer size={15} /> Print / PDF
        </Btn>
      </div>
    </Modal>
  );
}