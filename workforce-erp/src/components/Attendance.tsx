import { useStore, unitName, upsertAttendance } from '../lib/store';
import { monthDays } from '../lib/months';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { Card, CardHeader, Btn, Input, Select, Badge, Empty, Th, Td, Table } from './ui';

export default function Attendance({ monthKey }: { monthKey: string }) {
  const { state, set } = useStore();
  const [q, setQ] = useState('');
  const [unit, setUnit] = useState('all');
  const totalDays = monthDays(monthKey);

  const visible = state.workers
    .filter((w) => w.active)
    .filter((w) => unit === 'all' || w.unitId === unit)
    .filter((w) => {
      if (!q) return true;
      const s = q.toLowerCase();
      return w.name.toLowerCase().includes(s) || w.code.toLowerCase().includes(s);
    })
    .sort((a, b) => a.code.localeCompare(b.code));

  const setNum = (workerId: string, field: string, val: string) => {
    const n = Math.max(0, Math.min(totalDays, parseFloat(val) || 0));
    set((s) => upsertAttendance(s, monthKey, workerId, { [field]: n }));
  };
  const setBool = (workerId: string, field: string, on: boolean) => {
    set((s) => upsertAttendance(s, monthKey, workerId, { [field]: on }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Attendance</h1>
          <p className="text-sm text-slate-500">{monthKey} · {totalDays} days/month · edits save instantly</p>
        </div>
        <Badge tone="blue">{visible.length} workers</Badge>
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
          title="Monthly Attendance Entry"
          subtitle="Present + Weekly Off + Paid Holiday + Leave + Absent + LWP = total days of month"
        />
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <Th>Code</Th><Th>Name</Th><Th>Unit</Th>
              <Th right>Present</Th><Th right>Absent</Th><Th right>W/O</Th>
              <Th right>Paid Hol.</Th><Th right>Leave</Th><Th right>LWP</Th><Th right>OT hrs</Th>
              <Th>Seen</Th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && <tr><td colSpan={11}><Empty message="No workers match." /></td></tr>}
            {visible.map((w) => {
              const a = state.attendance.find((x) => x.workerId === w.id && x.monthKey === monthKey);
              const rowSum = (a?.present || 0) + (a?.absent || 0) + (a?.weeklyOff || 0) + (a?.paidHoliday || 0) + (a?.leave || 0) + (a?.lwp || 0);
              const ok = Math.abs(rowSum - totalDays) < 0.01;
              return (
                <tr key={w.id} className="border-t border-slate-100">
                  <Td className="font-mono text-xs">{w.code}</Td>
                  <Td className="font-medium">{w.name}</Td>
                  <Td><Badge>{unitName(state, w.unitId)}</Badge></Td>
                  <Td right><Input type="number" min={0} max={totalDays} value={a?.present ?? 0} onChange={(e) => setNum(w.id, 'present', e.target.value)} className="w-16 text-right tabular-nums" /></Td>
                  <Td right><Input type="number" min={0} max={totalDays} value={a?.absent ?? 0} onChange={(e) => setNum(w.id, 'absent', e.target.value)} className="w-16 text-right tabular-nums" /></Td>
                  <Td right><Input type="number" min={0} max={7} value={a?.weeklyOff ?? 0} onChange={(e) => setNum(w.id, 'weeklyOff', e.target.value)} className="w-16 text-right tabular-nums" /></Td>
                  <Td right><Input type="number" min={0} max={totalDays} value={a?.paidHoliday ?? 0} onChange={(e) => setNum(w.id, 'paidHoliday', e.target.value)} className="w-16 text-right tabular-nums" /></Td>
                  <Td right><Input type="number" min={0} max={totalDays} value={a?.leave ?? 0} onChange={(e) => setNum(w.id, 'leave', e.target.value)} className="w-16 text-right tabular-nums" /></Td>
                  <Td right><Input type="number" min={0} max={totalDays} value={a?.lwp ?? 0} onChange={(e) => setNum(w.id, 'lwp', e.target.value)} className="w-16 text-right tabular-nums" /></Td>
                  <Td right><Input type="number" min={0} max={300} value={a?.otHours ?? 0} onChange={(e) => setNum(w.id, 'otHours', e.target.value)} className="w-16 text-right tabular-nums" /></Td>
                  <Td>
                    {ok ? (
                      <Badge tone="green">{rowSum}</Badge>
                    ) : rowSum > 0 ? (
                      <Badge tone="amber">{rowSum}</Badge>
                    ) : (
                      <Badge>unset</Badge>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
        {visible.length > 50 && (
          <div className="px-4 py-2 text-center text-xs text-slate-400 border-t border-slate-100">
            Showing {visible.length} workers — scroll to edit each row
          </div>
        )}
      </Card>
    </div>
  );
}