import { useStore, unitName, upsertLeave } from '../lib/store';
import { monthLabel } from '../lib/months';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardHeader, Btn, Input, Select, Badge, Empty, Th, Td, Table } from './ui';

export default function Leave() {
  const { state, set } = useStore();
  const monthsPresent = [...new Set(state.leave.map((l) => l.monthKey))].sort().reverse();
  const [m, setM] = useState(monthsPresent[0] || '2026-07');
  const [q, setQ] = useState('');
  const [unit, setUnit] = useState('all');

  const visible = state.workers
    .filter((w) => w.active)
    .filter((w) => unit === 'all' || w.unitId === unit)
    .filter((w) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return w.name.toLowerCase().includes(s) || w.code.toLowerCase().includes(s);
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  const rec = (workerId: string) =>
    state.leave.find((l) => l.workerId === workerId && l.monthKey === m);

  const upd = (workerId: string, patch: { opening?: number; earned?: number; taken?: number }) => {
    set((s) => upsertLeave(s, m, workerId, patch));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Leave Ledger</h1>
          <p className="text-sm text-slate-500">Opening + Earned − Taken = Balance (auto)</p>
        </div>
        <Select value={m} onChange={(e) => setM(e.target.value)}>
          {monthsPresent.map((k) => (
            <option key={k} value={k}>{monthLabel(k)}</option>
          ))}
        </Select>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search worker…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 max-w-xs" />
        </div>
        <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="all">All Units</option>
          {state.units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Monthly Leave Entry"
          subtitle="HR updates leave taken each month — balance auto-computes & carries forward"
          right={<Badge tone="green">{visible.length} shown</Badge>}
        />
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <Th>Code</Th><Th>Name</Th><Th>Unit</Th>
              <Th right>Opening</Th><Th right>Earned</Th><Th right>Taken</Th><Th right>Balance</Th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={7}><Empty message="No workers match." /></td></tr>}
            {visible.map((w) => {
              const r = rec(w.id);
              return (
                <tr key={w.id} className="border-t border-slate-100">
                  <Td className="font-mono text-xs">{w.code}</Td>
                  <Td className="font-medium">{w.name}</Td>
                  <Td><Badge>{unitName(state, w.unitId)}</Badge></Td>
                  <Td right>
                    <Input type="number" min={0} max={60} value={r?.opening ?? 0}
                      onChange={(e) => upd(w.id, { opening: parseFloat(e.target.value) || 0 })}
                      className="w-16 text-right tabular-nums" />
                  </Td>
                  <Td right>
                    <Input type="number" min={0} max={12} value={r?.earned ?? 1}
                      onChange={(e) => upd(w.id, { earned: parseFloat(e.target.value) || 0 })}
                      className="w-16 text-right tabular-nums" />
                  </Td>
                  <Td right>
                    <Input type="number" min={0} max={60} value={r?.taken ?? 0}
                      onChange={(e) => upd(w.id, { taken: parseFloat(e.target.value) || 0 })}
                      className="w-16 text-right tabular-nums" />
                  </Td>
                  <Td right className="font-semibold tabular-nums">
                    {(r?.balance ?? 0) < 1 ? (
                      <Badge tone="red">{(r?.balance ?? 0).toFixed(0)}</Badge>
                    ) : (
                      <Badge tone="green">{(r?.balance ?? 0).toFixed(0)}</Badge>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}