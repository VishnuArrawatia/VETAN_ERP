import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../lib/store';
import { Card, CardHeader, Btn, Input, Badge } from './ui';
import { Settings as SettingsState } from '../types';

export default function Settings() {
  const { state, set, reset } = useStore();
  const [newCompany, setNewCompany] = useState({ name: '', short: '' });
  const [newUnit, setNewUnit] = useState({ name: '', companyId: state.companies[0]?.id || '' });
  const [newContractor, setNewContractor] = useState({ name: '' });

  const updateSettings = (patch: Partial<SettingsState>) =>
    set((s) => ({ ...s, settings: { ...s.settings, ...patch } }));

  const addCompany = () => {
    if (!newCompany.name.trim()) return;
    const id = 'c-' + Date.now();
    set((s) => ({
      ...s,
      companies: [
        ...s.companies,
        { id, name: newCompany.name.trim(), short: newCompany.short.trim() || newCompany.name.trim() }
      ]
    }));
    setNewCompany({ name: '', short: '' });
  };

  const addUnit = () => {
    if (!newUnit.name.trim()) return;
    const id = 'u-' + Date.now();
    set((s) => ({ ...s, units: [...s.units, { id, name: newUnit.name.trim(), companyId: newUnit.companyId }] }));
    setNewUnit({ name: '', companyId: state.companies[0]?.id || '' });
  };

  const addContractor = () => {
    if (!newContractor.name.trim()) return;
    const id = 'ct' + Date.now();
    set((s) => ({
      ...s,
      contractors: [
        ...s.contractors,
        { id, name: newContractor.name.trim(), pf: true, esic: true, commissionPerDay: 25, gstRate: 0.18, tdsRate: 0.02 }
      ]
    }));
    setNewContractor({ name: '' });
  };

  const pct = (v: number) => Math.round(v * 10000) / 100;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statutory rates */}
        <Card>
          <CardHeader title="Statutory Rates" subtitle="Applies to monthly payroll (employee share)" />
          <div className="p-5 grid grid-cols-2 gap-4 text-sm">
            {[
              ['PF (Employee %)', 'pfEmp', pct(state.settings.pfEmp)],
              ['PF (Employer %)', 'pfEr', pct(state.settings.pfEr)],
              ['ESIC (Employee %)', 'esicEmp', pct(state.settings.esicEmp)],
              ['ESIC (Employer %)', 'esicEr', pct(state.settings.esicEr)],
              ['Bonus Rate %', 'bonusRate', pct(state.settings.bonusRate)],
            ].map(([label, key, val]) => (
              <label key={key as string} className="block">
                <span className="text-xs font-semibold text-slate-500">{label}</span>
                <Input
                  type="number"
                  step="0.01"
                  defaultValue={val as number}
                  onBlur={(e) =>
                    updateSettings({ [key as string]: (parseFloat(e.target.value) || 0) / 100 })
                  }
                  className="mt-1 w-full"
                />
              </label>
            ))}
          </div>
        </Card>

        {/* Companies */}
        <Card>
          <CardHeader
            title="Companies"
            subtitle="Aaj 2 hain, kal 4 ho sakti hain — yahan add karein"
            right={<Badge tone="violet">{state.companies.length}</Badge>}
          />
          <div className="p-5 space-y-3">
            {state.companies.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                <div>
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.short} · {state.units.filter((u) => u.companyId === c.id).length} units</div>
                </div>
                <button
                  onClick={() => set((s) => ({ ...s, companies: s.companies.filter((x) => x.id !== c.id) }))}
                  className="text-slate-300 hover:text-rose-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Input placeholder="Company name" value={newCompany.name} onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })} className="flex-1" />
              <Input placeholder="Short" value={newCompany.short} onChange={(e) => setNewCompany({ ...newCompany, short: e.target.value })} className="w-24" />
              <Btn onClick={addCompany}><Plus size={14} /> Add</Btn>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Units */}
        <Card>
          <CardHeader
            title="Units"
            subtitle="Add dynamic units — each belongs to a company"
            right={<Badge tone="blue">{state.units.length}</Badge>}
          />
          <div className="p-5 space-y-3">
            {state.units.map((u) => {
              const comp = state.companies.find((c) => c.id === u.companyId);
              return (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                  <div>
                    <div className="text-sm font-semibold">{u.name}</div>
                    <div className="text-xs text-slate-400">{comp?.name || '—'} · {state.workers.filter((w) => w.unitId === u.id && w.active).length} workers</div>
                  </div>
                  <button
                    onClick={() => set((s) => ({ ...s, units: s.units.filter((x) => x.id !== u.id) }))}
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
            <div className="flex gap-2 pt-1">
              <Input placeholder="Unit name" value={newUnit.name} onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })} className="flex-1" />
              <select
                value={newUnit.companyId}
                onChange={(e) => setNewUnit({ ...newUnit, companyId: e.target.value })}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm bg-white"
              >
                {state.companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.short}</option>
                ))}
              </select>
              <Btn onClick={addUnit}><Plus size={14} /> Add</Btn>
            </div>
          </div>
        </Card>

        {/* Contractors */}
        <Card>
          <CardHeader
            title="Contractors"
            subtitle="Contractor master — used for contractor payroll"
            right={<Badge tone="green">{state.contractors.length}</Badge>}
          />
          <div className="p-5 space-y-3">
            {state.contractors.map((ct) => (
              <div key={ct.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5">
                <div className="text-sm font-semibold">{ct.name}</div>
                <div className="flex items-center gap-2">
                  <Badge tone="blue">{ct.pf ? 'PF' : 'No PF'}</Badge>
                  <button
                    onClick={() => set((s) => ({ ...s, contractors: s.contractors.filter((x) => x.id !== ct.id) }))}
                    className="text-slate-300 hover:text-rose-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <Input placeholder="Contractor name" value={newContractor.name} onChange={(e) => setNewContractor({ name: e.target.value })} className="flex-1" />
              <Btn onClick={addContractor}><Plus size={14} /> Add</Btn>
            </div>
          </div>
        </Card>
      </div>

      {/* Danger zone */}
      <Card>
        <CardHeader title="Danger Zone" />
        <div className="p-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-700">Reset to seed data</div>
            <div className="text-xs text-slate-500">Discards all HR edits and reloads demo data from the Excel file.</div>
          </div>
          <Btn
            variant="danger"
            onClick={() => {
              if (confirm('Reset all demo data?')) reset();
            }}
          >
            Reset
          </Btn>
        </div>
      </Card>
    </div>
  );
}