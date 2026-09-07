import { useStore, unitName, upsertAttendance } from '../lib/store';
import { monthDays } from '../lib/months';
import { exportMonthWorkbook } from '../lib/excel';
import { useState, useRef } from 'react';
import { Search, Upload, Download, FileDown } from 'lucide-react';
import { Card, CardHeader, Btn, Input, Select, Badge, Empty, Th, Td, Table } from './ui';

export default function Attendance({ monthKey }: { monthKey: string }) {
  const { state, set } = useStore();
  const [q, setQ] = useState('');
  const [unit, setUnit] = useState('all');
  const [msg, setMsg] = useState('');
  const [exporting, setExporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const totalDays = monthDays(monthKey);

  const exportMonthExcel = async () => {
    setExporting(true);
    setMsg('');
    try {
      const filename = await exportMonthWorkbook(state, monthKey);
      setMsg(`Excel month report saved: ${filename}`);
    } catch (e: any) {
      setMsg('Excel export failed: ' + (e?.message || e));
    } finally {
      setExporting(false);
    }
  };

  // ---- Download attendance template (CSV) ----
  const downloadTemplate = () => {
    const head = 'Code,Name,Present,Absent,Weekly_Off,Paid_Holiday,Leave,LWP,OT_Hours';
    const lines = state.workers.filter((w) => w.active).map((w) => `${w.code},${w.name.replace(/,/g, ' ')},,,,,,,`);
    const blob = new Blob(['\uFEFF' + [head, ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ATTENDANCE-TEMPLATE-${monthKey}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

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

  // ---- Excel / CSV attendance upload ----
  const norm = (s: any) => String(s == null ? '' : s).toString().trim().toLowerCase();

  const applyParsed = (code: string, row: any, map: Record<string, number>) => {
    const w = state.workers.find((x) => x.code && norm(x.code) === norm(code));
    if (!w) return 0;
    const num = (v: any) => {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : Math.max(0, n);
    };
    set((s) =>
      upsertAttendance(s, monthKey, w.id, {
        present: num(row[map.present]),
        absent: num(row[map.absent]),
        weeklyOff: num(row[map.weeklyOff]),
        paidHoliday: num(row[map.paidHoliday]),
        leave: num(row[map.leave]),
        lwp: num(row[map.lwp]),
        otHours: num(row[map.otHours])
      })
    );
    return 1;
  };

  const pickCol = (headers: string[], candidates: string[]): number => {
    for (const c of candidates) {
      const i = headers.findIndex((h) => norm(h) === c);
      if (i >= 0) return i;
    }
    // fuzzy: contains
    for (const c of candidates) {
      const i = headers.findIndex((h) => norm(h).includes(c));
      if (i >= 0) return i;
    }
    return -1;
  };

  const parseSheets = async (rows: any[][], fileText?: string) => {
    // rows: array of arrays
    let hr = -1;
    for (let i = 0; i < rows.length; i++) {
      const cell0 = norm(rows[i]?.[0]);
      if (cell0 === 'proper code' || cell0 === 'worker_code' || cell0 === 'code' || cell0 === 'worker code') {
        hr = i;
        break;
      }
      // also match any header containing code
      if (rows[i] && rows[i].some((h: any) => norm(h) === 'proper code' || norm(h) === 'worker_code' || norm(h) === 'code')) {
        hr = i; break;
      }
    }
    if (hr < 0) throw new Error('Header row not found (need a column named Code / Proper Code / Worker Code)');
    const headers = (rows[hr] || []).map((h: any) => String(h == null ? '' : h));
    const map = {
      code: 0,
      present: pickCol(headers, ['present', 'p', 'present days']),
      absent: pickCol(headers, ['absent', 'a', 'absent days']),
      weeklyOff: pickCol(headers, ['weekly_off', 'weekly off', 'wo', 'w/o']),
      paidHoliday: pickCol(headers, ['paid_holiday', 'paid holiday', 'holiday', 'ph']),
      leave: pickCol(headers, ['leave', 'l', 'leave days']),
      lwp: pickCol(headers, ['lwp', 'leave without pay']),
      otHours: pickCol(headers, ['ot_hours', 'ot hours', 'ot', 'overtime'])
    };
    let matched = 0, missing = 0;
    for (let r = hr + 1; r < rows.length; r++) {
      const code = String(rows[r]?.[map.code] ?? '').trim();
      if (!code) continue;
      const rc = matched + applyParsed(code, rows[r], map);
      if (rc > matched) matched = rc; else missing++;
    }
    return { matched, missing };
  };
  const setBool = (workerId: string, field: string, on: boolean) => {
    set((s) => upsertAttendance(s, monthKey, workerId, { [field]: on }));
  };

  const handleFile = (file: File) => {
    setMsg('');
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const text = String(reader.result);
          const rows: string[][] = text.split(/\r\n|\r|\n/).map((line) => {
            // simple CSV split (quote-aware)
            const out: string[] = [];
            let cur = '', q = false;
            for (const ch of line) {
              if (ch === '"') { q = !q; }
              else if (ch === ',' && !q) { out.push(cur); cur = ''; }
              else cur += ch;
            }
            out.push(cur);
            return out;
          });
          const r = await parseSheets(rows, text);
          setMsg(`CSV imported: ${r.matched} workers updated, ${r.missing} codes not found in roster`);
        } catch (e: any) {
          setMsg('CSV error: ' + e.message);
        }
      };
      reader.readAsText(file);
    } else {
      // Excel .xls/.xlsx — load SheetJS from CDN lazily
      const loadXLSX = (): Promise<any> =>
        new Promise((res, rej) => {
          const w = window as any;
          if (w.XLSX) return res(w.XLSX);
          const s = document.createElement('script');
          s.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
          s.onload = () => (w.XLSX ? res(w.XLSX) : rej(new Error('XLSX failed')));
          s.onerror = () => rej(new Error('Could not load Excel parser (need internet once)'));
          document.head.appendChild(s);
        });
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const XLSX = await loadXLSX();
          const wb = XLSX.read(reader.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          const r = await parseSheets(rows);
          setMsg(`Excel imported: ${r.matched} workers updated, ${r.missing} codes not found in roster`);
        } catch (e: any) {
          setMsg('Excel error: ' + e.message);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Attendance</h1>
          <p className="text-sm text-slate-500">{monthKey} · {totalDays} days/month · edits save instantly</p>
        </div>
        <div className="flex gap-2 items-center">
          <Btn variant="secondary" onClick={exportMonthExcel} disabled={exporting}>
            <FileDown size={15} /> {exporting ? 'Preparing…' : 'Month Excel'}
          </Btn>
          <Btn variant="secondary" onClick={downloadTemplate}>
            <Download size={15} /> Template
          </Btn>
          <Btn variant="secondary" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Excel / CSV Upload
          </Btn>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
          <Badge tone="blue">{visible.length} workers</Badge>
        </div>
      </div>

      {msg && (
        <div className="text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-2.5">{msg}</div>
      )}
      <div className="text-[11px] text-slate-400 -mt-3">Excel/CSV columns: Code (Proper Code/Worker_Code), Present, Absent, Weekly_Off, Paid_Holiday, Leave, LWP, OT_Hours — values auto-fill for the selected month</div>

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