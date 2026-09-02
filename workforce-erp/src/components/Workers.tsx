import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, History } from 'lucide-react';
import { useStore, unitName, contractorName, addWorker, updateWorker, addWageRevision } from '../lib/store';
import { WorkerRec, AppState } from '../types';
import { fmtINR, monthLabel, MONTHS } from '../lib/months';
import { Card, CardHeader, Btn, Input, Select, Badge, Modal, Empty, Th, Td, Table } from './ui';

export default function Workers() {
  const { state, set } = useStore();
  const [q, setQ] = useState('');
  const [unit, setUnit] = useState('all');
  const [mode, setMode] = useState('all');
  const [editId, setEditId] = useState<string | null>(null);
  const [revId, setRevId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = state.workers.filter((w) => {
    if (unit !== 'all' && w.unitId !== unit) return false;
    if (mode !== 'all' && w.mode !== mode) return false;
    if (q) {
      const s = q.toLowerCase();
      return (
        w.name.toLowerCase().includes(s) ||
        w.code.toLowerCase().includes(s) ||
        w.department.toLowerCase().includes(s) ||
        (w.uan || '').includes(s)
      );
    }
    return true;
  });
  filtered.sort((a, b) => a.code.localeCompare(b.code));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Workers</h1>
          <p className="text-sm text-slate-500">
            {state.workers.filter((w) => w.active).length} active · {state.workers.length} total · {filtered.length} shown
          </p>
        </div>
        <Btn onClick={() => setShowAdd(true)}><Plus size={16} /> Add Worker</Btn>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search name / code / UAN…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 max-w-xs" />
        </div>
        <Select value={unit} onChange={(e) => setUnit(e.target.value)}>
          <option value="all">All Units</option>
          {state.units.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>
        <Select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="all">Company + Contractor</option>
          <option value="Company">Company</option>
          <option value="Contractor">Contractor</option>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <Th>Code</Th><Th>Name</Th><Th>Unit</Th><Th>Mode</Th><Th>Dept</Th>
              <Th right>Rate/Day</Th><Th right>CTC</Th><Th>PF</Th><Th>ESIC</Th><Th right>Actions</Th>
            </tr>
          </thead>
<tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={10}><Empty message="No workers match." /></td></tr>
            )}
            {filtered.slice(0, 100).map((w) => (
              <tr key={w.id} className={`border-t border-slate-100 ${w.active ? '' : 'opacity-45'}`}>
                <Td className="font-mono text-xs">{w.code}</Td>
                <Td className="font-medium">{w.name}</Td>
                <Td><Badge>{unitName(state, w.unitId)}</Badge></Td>
                <Td>
                  {w.mode === 'Company' ? (
                    <Badge tone="violet">Company</Badge>
                  ) : (
                    <Badge tone="amber">{contractorName(state, w.contractor)}</Badge>
                  )}
                </Td>
                <Td>{w.department || '—'}</Td>
                <Td right className="tabular-nums">₹{fmtINR(w.rateDay)}</Td>
                <Td right className="tabular-nums">₹{fmtINR(w.ctc)}</Td>
                <Td>{w.pf ? <Badge tone="blue">PF</Badge> : <span className="text-xs text-slate-300">—</span>}</Td>
                <Td>{w.esic ? <Badge tone="green">ESIC</Badge> : <span className="text-xs text-slate-300">—</span>}</Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => setRevId(w.id)} className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100" title="Wage Revisions">
                      <History size={14} />
                    </button>
                    <button onClick={() => setEditId(w.id)} className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100" title="Edit">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Toggle active for ${w.name}?`))
                          set((s) => ({ ...s, workers: s.workers.map((x) => (x.id === w.id ? { ...x, active: !x.active } : x)) }));
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100"
                      title="Toggle active"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
        {filtered.length > 100 && (
          <div className="px-4 py-2 text-center text-xs text-slate-400 border-t border-slate-100">
            Showing first 100 — narrow your search
          </div>
        )}
      </Card>
{showAdd && (
        <WorkerForm
          title="Add Worker"
          state={state}
          onSave={(data) => {
            set((s) =>
              addWorker(s, {
                id: 'w' + Date.now(),
                code: data.code,
                name: data.name,
                unitId: data.unitId,
                companyId: state.units.find((u) => u.id === data.unitId)?.companyId || state.companies[0].id,
                contractor: data.mode === 'Contractor' ? data.contractor : '',
                department: data.department,
                gender: 'M',
                doj: data.doj,
                uan: data.uan,
                bank: data.bank,
                ac: data.ac,
                ifsc: data.ifsc,
                mode: data.mode,
                rateBasic: data.rateBasic,
                rateHra: data.rateHra,
                rateOther: data.rateOther,
                rateDay: data.rateBasic + data.rateHra + data.rateOther,
                ctc: data.ctc,
                minWage: data.minWage,
                pf: data.pf,
                esic: data.esic,
                active: true
              })
            );
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editId && (
        <WorkerForm
          title="Edit Worker"
          state={state}
          initial={state.workers.find((w) => w.id === editId)}
          onSave={(data) => {
            set((s) =>
              updateWorker(s, editId, {
                name: data.name, unitId: data.unitId,
                contractor: data.mode === 'Contractor' ? data.contractor : '',
                department: data.department, mode: data.mode,
                rateBasic: data.rateBasic, rateHra: data.rateHra, rateOther: data.rateOther,
                rateDay: data.rateBasic + data.rateHra + data.rateOther,
                ctc: data.ctc, minWage: data.minWage, pf: data.pf, esic: data.esic
              })
            );
            setEditId(null);
          }}
          onClose={() => setEditId(null)}
        />
      )}

      {revId && (
        <WageRevisionModal
          worker={state.workers.find((w) => w.id === revId)!}
          onClose={() => setRevId(null)}
        />
      )}
    </div>
  );
}

export type WorkerFormData = {
  code: string; name: string; unitId: string; mode: 'Company' | 'Contractor'; contractor: string;
  department: string; doj: string; uan: string; bank: string; ac: string; ifsc: string;
  rateBasic: number; rateHra: number; rateOther: number; ctc: number; minWage: number;
  pf: boolean; esic: boolean;
};
export function WorkerForm({
  title, state, initial, onSave, onClose,
}: {
  title: string;
  state: AppState;
  initial?: WorkerRec;
  onSave: (d: WorkerFormData) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState(() => ({
    code: initial?.code || '',
    name: initial?.name || '',
    unitId: initial?.unitId || state.units[0]?.id || '',
    mode: initial?.mode || ('Contractor' as 'Company' | 'Contractor'),
    contractor: initial?.contractor || state.contractors[0]?.id || '',
    department: initial?.department || '',
    doj: initial?.doj || '',
    uan: initial?.uan || '',
    bank: initial?.bank || '',
    ac: initial?.ac || '',
    ifsc: initial?.ifsc || '',
    rateBasic: initial?.rateBasic || 0,
    rateHra: initial?.rateHra || 0,
    rateOther: initial?.rateOther || 0,
    ctc: initial?.ctc || 0,
    minWage: initial?.minWage || 0,
    pf: initial?.pf ?? true,
    esic: initial?.esic ?? false
  }));
  const n = (v: string) => parseFloat(v) || 0;
  const set = (patch: Partial<WorkerFormData>) => setF((p) => ({ ...p, ...patch }));

  return (
    <Modal title={title} open onClose={onClose} wide>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="block"><span className="text-xs font-semibold text-slate-500">Code</span>
          <Input value={f.code} onChange={(e) => set({ code: e.target.value })} className="mt-1 w-full" /></label>
        <label className="block md:col-span-2"><span className="text-xs font-semibold text-slate-500">Name</span>
          <Input value={f.name} onChange={(e) => set({ name: e.target.value })} className="mt-1 w-full" /></label>
        <label className="block"><span className="text-xs font-semibold text-slate-500">Unit</span>
          <Select value={f.unitId} onChange={(e) => set({ unitId: e.target.value })} className="mt-1 w-full">
            {state.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select></label>
        <label className="block"><span className="text-xs font-semibold text-slate-500">Mode</span>
          <Select value={f.mode} onChange={(e) => set({ mode: e.target.value as 'Company' | 'Contractor' })} className="mt-1 w-full">
            <option value="Company">Company</option>
            <option value="Contractor">Contractor</option>
          </Select></label>
        {f.mode === 'Contractor' && (
          <label className="block"><span className="text-xs font-semibold text-slate-500">Contractor</span>
            <Select value={f.contractor} onChange={(e) => set({ contractor: e.target.value })} className="mt-1 w-full">
              {state.contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select></label>
        )}
        <label className="block"><span className="text-xs font-semibold text-slate-500">Department</span>
          <Input value={f.department} onChange={(e) => set({ department: e.target.value })} className="mt-1 w-full" /></label>
        <label className="block"><span className="text-xs font-semibold text-slate-500">DOJ</span>
          <Input type="date" value={f.doj} onChange={(e) => set({ doj: e.target.value })} className="mt-1 w-full" /></label>
      <label className="block"><span className="text-xs font-semibold text-slate-500">UAN</span>
          <Input value={f.uan} onChange={(e) => set({ uan: e.target.value })} className="mt-1 w-full" /></label>
        <label className="block"><span className="text-xs font-semibold text-slate-500">Bank</span>
          <Input value={f.bank} onChange={(e) => set({ bank: e.target.value })} className="mt-1 w-full" /></label>
        <label className="block"><span className="text-xs font-semibold text-slate-500">A/c No</span>
          <Input value={f.ac} onChange={(e) => set({ ac: e.target.value })} className="mt-1 w-full" /></label>
        <label className="block"><span className="text-xs font-semibold text-slate-500">IFSC</span>
          <Input value={f.ifsc} onChange={(e) => set({ ifsc: e.target.value })} className="mt-1 w-full" /></label>
        <label className="block"><span className="text-xs font-semibold text-slate-500">Basic/Day</span>
          <Input type="number" value={f.rateBasic} onChange={(e) => set({ rateBasic: n(e.target.value) })} className="mt-1 w-full" /></label>
        <label className="block"><span className="text-xs font-semibold text-slate-500">HRA/Day</span>
          <Input type="number" value={f.rateHra} onChange={(e) => set({ rateHra: n(e.target.value) })} className="mt-1 w-full" /></label>
        <label className="block"><span className="text-xs font-semibold text-slate-500">Other/Day</span>
          <Input type="number" value={f.rateOther} onChange={(e) => set({ rateOther: n(e.target.value) })} className="mt-1 w-full" /></label>
        <label className="block"><span className="text-xs font-semibold text-slate-500">CTC</span>
          <Input type="number" value={f.ctc} onChange={(e) => set({ ctc: n(e.target.value) })} className="mt-1 w-full" /></label>
        <label className="block"><span className="text-xs font-semibold text-slate-500">Min Wage</span>
          <Input type="number" value={f.minWage} onChange={(e) => set({ minWage: n(e.target.value) })} className="mt-1 w-full" /></label>
        <div className="flex items-end gap-4 md:col-span-2 pb-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.pf} onChange={(e) => set({ pf: e.target.checked })} className="accent-indigo-600" /> PF
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.esic} onChange={(e) => set({ esic: e.target.checked })} className="accent-indigo-600" /> ESIC
          </label>
        </div>
      </div>
      <div className="mt-5 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="text-sm">
          <span className="text-slate-500">Total rate/day:</span>{' '}
          <span className="font-bold text-indigo-700">₹{fmtINR(f.rateBasic + f.rateHra + f.rateOther)}</span>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => onSave({ ...f, contractor: f.mode === 'Contractor' ? f.contractor : '' })}>Save</Btn>
        </div>
      </div>
    </Modal>
  );
}

function WageRevisionModal({ worker, onClose }: { worker: WorkerRec; onClose: () => void }) {
  const { set } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [ef, setEf] = useState('2026-09');
  const [rb, setRb] = useState(worker.rateBasic.toString());
  const [rh, setRh] = useState(worker.rateHra.toString());
  const [ro, setRo] = useState(worker.rateOther.toString());
  const [reason, setReason] = useState('');
  const n = (v: string) => Math.max(0, parseFloat(v) || 0);
  const revs = [...(worker.revisions || [])].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  const save = () => {
    if (!ef) return;
    set((s) => addWageRevision(s, worker.id, {
      effectiveFrom: ef,
      rateBasic: n(rb),
      rateHra: n(rh),
      rateOther: n(ro),
      reason: reason.trim() || undefined
    }));
    setShowForm(false);
  };
  return (
    <Modal title={`Wage Revisions — ${worker.name} (${worker.code})`} open onClose={onClose} wide>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            Current rate/day: ₹{fmtINR(worker.rateDay)} (Basic ₹{fmtINR(worker.rateBasic)} + HRA ₹{fmtINR(worker.rateHra)} + Other ₹{fmtINR(worker.rateOther)})
          </div>
          <Btn onClick={() => setShowForm((v) => !v)}><Plus size={14} /> {showForm ? 'Close Form' : 'Add Revision'}</Btn>
        </div>

        {showForm && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="block"><span className="text-xs font-semibold text-slate-500">Effective From (month)</span>
                <Select value={ef} onChange={(e) => setEf(e.target.value)} className="mt-1 w-full">
                  {MONTHS.map((m) => <option key={m.key} value={m.key}>{monthLabel(m.key)}</option>)}
                </Select></label>
              <label className="block"><span className="text-xs font-semibold text-slate-500">Basic/Day</span>
                <Input type="number" min={0} value={rb} onChange={(e) => setRb(e.target.value)} className="mt-1 w-full" /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-500">HRA/Day</span>
                <Input type="number" min={0} value={rh} onChange={(e) => setRh(e.target.value)} className="mt-1 w-full" /></label>
              <label className="block"><span className="text-xs font-semibold text-slate-500">Other/Day</span>
                <Input type="number" min={0} value={ro} onChange={(e) => setRo(e.target.value)} className="mt-1 w-full" /></label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <label className="block md:col-span-2"><span className="text-xs font-semibold text-slate-500">Reason (optional)</span>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. May increment, Diwali bonus revision…" className="mt-1 w-full" /></label>
              <div className="flex items-center justify-between gap-2 md:justify-end">
                <span className="text-sm text-slate-500">Total/day: <strong className="text-indigo-700">₹{fmtINR(n(rb) + n(rh) + n(ro))}</strong></span>
                <Btn onClick={save}>Save Revision</Btn>
              </div>
            </div>
          </div>
        )}

        <Card className="overflow-hidden">
          <CardHeader title="Revision History" subtitle="New rates apply from the selected month onward — earlier months keep their old rates" />
          <Table>
            <thead className="bg-slate-50">
              <tr>
                <Th>Effective From</Th><Th right>Basic/Day</Th><Th right>HRA/Day</Th><Th right>Other/Day</Th><Th right>Total/Day</Th><Th>Reason</Th>
              </tr>
            </thead>
            <tbody>
              {revs.length === 0 && (
                <tr><td colSpan={6}><Empty message="No revisions yet — worker keeps its master rates for all months." /></td></tr>
              )}
              {revs.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <Td className="font-mono text-xs">{monthLabel(r.effectiveFrom)}</Td>
                  <Td right>₹{fmtINR(r.rateBasic)}</Td>
                  <Td right>₹{fmtINR(r.rateHra)}</Td>
                  <Td right>₹{fmtINR(r.rateOther)}</Td>
                  <Td right className="font-semibold">₹{fmtINR(r.rateDay)}</Td>
                  <Td>{r.reason || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      </div>
    </Modal>
  );
}