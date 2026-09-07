import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useStore, addCommissionRate, removeCommissionRate, unitName } from '../lib/store';
import { Card, CardHeader, Btn, Input, Badge, Select, Table, Th, Td } from './ui';
import { Settings as SettingsState } from '../types';
import { MONTHS, monthLabel } from '../lib/months';

export default function Settings() {
  const { state, set, reset } = useStore();
  const [newCompany, setNewCompany] = useState({ name: '', short: '' });
  const [newUnit, setNewUnit] = useState({ name: '', companyId: state.companies[0]?.id || '' });
  const [newContractor, setNewContractor] = useState({ name: '', code: '', gstNo: '', address: '' });
  const [newDept, setNewDept] = useState('');
  const [cmForm, setCmForm] = useState({ effectiveFrom: '2026-06', unitId: 'all', rate12: '25', rate11: '20', rate8: '20' });

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
        {
          id, name: newContractor.name.trim(),
          code: newContractor.code.trim() || undefined,
          gstNo: newContractor.gstNo.trim() || undefined,
          address: newContractor.address.trim() || undefined,
          pf: true, esic: true, commissionPerDay: 25, gstRate: 0.18, tdsRate: 0.02
        }
      ]
    }));
    setNewContractor({ name: '', code: '', gstNo: '', address: '' });
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
            <label className="block col-span-2">
              <span className="text-xs font-semibold text-slate-500">PF Wage Ceiling (₹/month) — 0 = no cap</span>
              <Input
                type="number"
                defaultValue={(state.settings as any).pfCeiling || 0}
                onBlur={(e) => updateSettings({ pfCeiling: parseFloat(e.target.value) || 0 } as any)}
                className="mt-1 w-full"
              />
            </label>
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
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 cursor-pointer" title="ESIC applicable for this unit (Sakar Unit III = YES)">
                      <input
                        type="checkbox"
                        checked={u.esic === true}
                        onChange={(e) => set((s) => ({ ...s, units: s.units.map((x) => (x.id === u.id ? { ...x, esic: e.target.checked } : x)) }))}
                      />
                      ESIC
                    </label>
                    <button
                      onClick={() => set((s) => ({ ...s, units: s.units.filter((x) => x.id !== u.id) }))}
                      className="text-slate-300 hover:text-rose-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
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
                <div>
                  <div className="text-sm font-semibold">{ct.name} {ct.code && <span className="font-mono text-xs text-slate-400">({ct.code})</span>}</div>
                  <div className="text-xs text-slate-400">GST: {ct.gstNo || '—'} · {ct.address || 'no address'}</div>
                </div>
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
            <div className="space-y-2 pt-1">
              <Input placeholder="Contractor name" value={newContractor.name} onChange={(e) => setNewContractor({ ...newContractor, name: e.target.value })} className="w-full" />
              <div className="flex gap-2">
                <Input placeholder="Code (optional)" value={newContractor.code} onChange={(e) => setNewContractor({ ...newContractor, code: e.target.value })} className="w-28" />
                <Input placeholder="GST No." value={newContractor.gstNo} onChange={(e) => setNewContractor({ ...newContractor, gstNo: e.target.value })} className="flex-1" />
              </div>
              <div className="flex gap-2">
                <Input placeholder="Address (invoice ke liye)" value={newContractor.address} onChange={(e) => setNewContractor({ ...newContractor, address: e.target.value })} className="flex-1" />
                <Btn onClick={addContractor}><Plus size={14} /> Add</Btn>
              </div>
            </div>
          </div>
        </Card>

        {/* Departments */}
        <Card>
          <CardHeader
            title="Departments"
            subtitle="Master list — naye department add / delete karein"
            right={<Badge tone="blue">{(state.settings.departments || []).length}</Badge>}
          />
          <div className="p-5 space-y-3">
            <div className="flex flex-wrap gap-2">
              {(state.settings.departments || []).map((dp) => (
                <span key={dp} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {dp}
                  <button
                    onClick={() =>
                      set((s) => ({
                        ...s,
                        settings: { ...s.settings, departments: (s.settings.departments || []).filter((x) => x !== dp) }
                      }))
                    }
                    className="text-slate-400 hover:text-rose-500"
                    title={`Delete ${dp}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="New department name"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                className="flex-1"
              />
              <Btn
                onClick={() => {
                  const v = newDept.trim();
                  if (!v) return;
                  set((s) => ({
                    ...s,
                    settings: { ...s.settings, departments: [...(s.settings.departments || []), v] }
                  }));
                  setNewDept('');
                }}
              >
                <Plus size={14} /> Add
              </Btn>
            </div>
          </div>
        </Card>
      </div>

      {/* Contractor Commission Rates (effective by month, unit/location-wise) */}
      <Card>
        <CardHeader
          title="Contractor Commission Rates (unit + month-wise)"
          subtitle="Base April 2026 (All Units): 12h=₹20 · 11h=₹20 · 8h=₹20 per payday. Kisi unit ke liye alag rate chahiye to Unit select karke save karein. Nayi entry us month se lagti hai — pehle ke months apni purani rate se hi count honge."
          right={<Badge tone="violet">{(state.settings.commissionRates || []).length} entries</Badge>}
        />
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Effective From (month)</span>
              <Select value={cmForm.effectiveFrom} onChange={(e) => setCmForm({ ...cmForm, effectiveFrom: e.target.value })} className="mt-1 w-full">
                {MONTHS.map((m) => <option key={m.key} value={m.key}>{monthLabel(m.key)}</option>)}
              </Select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">Company / Unit (location)</span>
              <Select value={cmForm.unitId} onChange={(e) => setCmForm({ ...cmForm, unitId: e.target.value })} className="mt-1 w-full">
                <option value="all">All Units (common rate)</option>
                {state.companies.map((c) => (
                  <optgroup key={c.id} label={c.name}>
                    {state.units.filter((u) => u.companyId === c.id).map((u) => (
                      <option key={u.id} value={u.id}>{c.short} — {u.name}</option>
                    ))}
                  </optgroup>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">12h Worker (₹/payday)</span>
              <Input type="number" min={0} value={cmForm.rate12} onChange={(e) => setCmForm({ ...cmForm, rate12: e.target.value })} className="mt-1 w-full" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">11h Worker (₹/payday)</span>
              <Input type="number" min={0} value={cmForm.rate11} onChange={(e) => setCmForm({ ...cmForm, rate11: e.target.value })} className="mt-1 w-full" />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-500">8h Worker (₹/payday)</span>
              <Input type="number" min={0} value={cmForm.rate8} onChange={(e) => setCmForm({ ...cmForm, rate8: e.target.value })} className="mt-1 w-full" />
            </label>
          </div>
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <Btn
              onClick={() => {
                const r12 = parseFloat(cmForm.rate12) || 0;
                const r11 = parseFloat(cmForm.rate11) || 0;
                const r8 = parseFloat(cmForm.rate8) || 0;
                if (!cmForm.effectiveFrom) { alert('Effective month chahiye'); return; }
                const scopeLabel = cmForm.unitId === 'all' ? 'All Units (common)' : unitName(state, cmForm.unitId);
                const existing = (state.settings.commissionRates || []).find(
                  (r) => (r.unitId || 'all') === cmForm.unitId && r.effectiveFrom === cmForm.effectiveFrom
                );
                if (existing && !confirm(`${scopeLabel} ke liye ${monthLabel(cmForm.effectiveFrom)} se pehle se entry hai. Replace kar dein?`)) return;
                set((s) => addCommissionRate(s, { effectiveFrom: cmForm.effectiveFrom, unitId: cmForm.unitId, rate12: r12, rate11: r11, rate8: r8 }));
                alert(`✅ Rate saved: ${scopeLabel} · ${monthLabel(cmForm.effectiveFrom)} (12h=₹${r12}, 11h=₹${r11}, 8h=₹${r8})`);
              }}
            >
              <Plus size={14} /> Save Rate
            </Btn>
          </div>

          {(state.settings.commissionRates || []).length === 0 ? (
            <div className="text-sm text-slate-400 py-2">No revisions yet — har jagah base rate (12h=₹20, 11h=₹20, 8h=₹20) apply hoga.</div>
          ) : (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Company / Unit</Th><Th>Effective From</Th><Th right>12h Rate</Th><Th right>11h Rate</Th><Th right>8h Rate</Th><Th>Added</Th><Th right>Remove</Th>
                </tr>
              </thead>
              <tbody>
                {(state.settings.commissionRates || [])
                  .slice()
                  .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || (a.unitId || 'all').localeCompare(b.unitId || 'all'))
                  .map((r) => {
                    const isAll = (r.unitId || 'all') === 'all';
                    const u = !isAll ? state.units.find((x) => x.id === r.unitId) : null;
                    const c = u ? state.companies.find((x) => x.id === u.companyId) : null;
                    return (
                      <tr key={r.id} className="border-t border-slate-100">
                        <Td>
                          {isAll ? (
                            <Badge tone="blue">All Units (common)</Badge>
                          ) : (
                            <span className="text-xs font-semibold text-slate-700">{c ? c.short + ' — ' : ''}{u ? u.name : r.unitId}</span>
                          )}
                        </Td>
                        <Td className="font-mono text-xs">{monthLabel(r.effectiveFrom)}</Td>
                        <Td right>₹{r.rate12}</Td>
                        <Td right>₹{r.rate11}</Td>
                        <Td right>₹{r.rate8}</Td>
                        <Td className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString('en-IN')}</Td>
                        <Td right>
                          <button
                            onClick={() => set((s) => removeCommissionRate(s, r.id))}
                            className="text-slate-300 hover:text-rose-500"
                            title={`Delete entry (${isAll ? 'All Units' : unitName(state, r.unitId)}, ${r.effectiveFrom})`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
              </tbody>
            </Table>
          )}
        </div>
      </Card>

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