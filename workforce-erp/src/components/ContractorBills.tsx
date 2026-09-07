import { useState } from 'react';
import { Printer, FileDown, FileText } from 'lucide-react';
import { useStore, upsertPfChallan, upsertContractorBill } from '../lib/store';
import { monthLabel, fmtINR, MONTHS } from '../lib/months';
import { exportMonthWorkbook } from '../lib/excel';
import { computeBills, printContractorBill, printWorkerPayslip, type ContractorBillCalc } from '../lib/contractor';
import { Card, CardHeader, Btn, Select, Badge, Empty, Th, Td, Table } from './ui';

export default function ContractorBills({ monthKey: propMonth }: { monthKey: string }) {
  const { state, set } = useStore();
  const [monthKey, setMonthKey] = useState(propMonth);
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

  // Contractor bills — single source of truth (lib/contractor.ts):
  // invoice summary + worker detail + reconciliation checks, all unit/ESIC/PF-ceiling aware.
  const perContractor: ContractorBillCalc[] = computeBills(state, monthKey);

  // Location/unit-wise summary
  const [selCt, setSelCt] = useState<string>('all');
  const byUnit = (state.units || []).map((u) => {
    const ws = state.workers.filter((w) => w.active && w.mode === 'Contractor' && w.unitId === u.id && (selCt === 'all' || w.contractor === selCt));
    return {
      u,
      count: ws.length,
      payDays: ws.reduce((s, w) => {
        const a = state.attendance.find((x) => x.workerId === w.id && x.monthKey === monthKey);
        return s + (a?.present || 0) + (a?.paidHoliday || 0) + (a?.leave || 0);
      }, 0)
    };
  }).filter((x) => x.count > 0);

  const genBill = (ci: number) => {
    const b = perContractor[ci];
    if (!b || b.rows.length === 0) return;
    // Reconciliation gate — spec §9: block bill generation on any mismatch
    if (!b.reconOk) {
      const failed = b.recon.filter((c) => !c.ok).map((c) => `${c.id}: ${c.label} [${c.detail}]`).join('\n');
      alert('❌ Bill BLOCKED — reconciliation mismatch:\n\n' + failed);
      return;
    }
    const id = 'bill-' + monthKey + '-' + b.ct.id;
    set((s) => upsertContractorBill(s, {
      id, monthKey, contractorId: b.ct.id,
      invoiceNo: b.invoiceNo, invoiceDate: b.invoiceDate, unitNames: b.unitNames,
      wages: b.wages, commission: b.commission,
      empPf: b.empPf, erPf: b.erPf,
      esic: b.empEsic, erEsic: b.erEsic, taxable: b.taxable,
      gst: b.gst, tds: 0, total: b.grandTotal, netBill: b.grandTotal,
      workers: b.rows.length,
      generatedAt: new Date().toISOString()
    }));
    alert(`✅ Contractor Bill saved: ${b.invoiceNo}\nGrand Total ₹${fmtINR(b.grandTotal)} (all reconciliation checks passed)`);
  };

  const genChallan = (ci: number) => {
    const b = perContractor[ci];
    if (!b || b.empPf + b.erPf <= 0) return;
    const existing = (state.pfChallans || []).find((c) => c.monthKey === monthKey && c.contractorId === b.ct.id);
    const id = existing ? existing.id : 'challan-' + monthKey + '-' + b.ct.id;
    const challanNo = existing?.challanNo || `CH-${monthKey.replace('-', '')}-${String((state.pfChallans || []).filter((c) => c.monthKey === monthKey).length + 1).padStart(3, '0')}`;
    set((s) => upsertPfChallan(s, {
      id, monthKey, contractorId: b.ct.id,
      empPf: b.empPf, erPf: b.erPf, total: Math.round((b.empPf + b.erPf) * 100) / 100,
      generatedAt: new Date().toISOString(), challanNo
    }));
  };

  return (
<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Contractor Billing &amp; PF Challan</h1>
          <p className="text-sm text-slate-500">Contractor-wise + location-wise bill · commission (unit-wise rates — Settings me set karein) · PF challan + log</p>
        </div>
        <div className="flex gap-2 items-center">
          <Btn variant="secondary" onClick={exportMonthExcel} disabled={exporting}>
            <FileDown size={15} /> {exporting ? 'Preparing…' : 'Month Excel'}
          </Btn>
          <Select value={monthKey} onChange={(e) => setMonthKey(e.target.value)} className="w-auto min-w-[120px]">
            {MONTHS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </Select>
          <Btn onClick={() => window.print()}>
            <Printer size={15} /> Print
          </Btn>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title={`Contractor-wise Bill — ${monthLabel(monthKey)}`}
          subtitle="Invoice rule: Wages + Commission + Employer PF + Employer ESIC = Taxable · + GST = Grand Total · Commission unit-wise rate se (Settings)"
          right={<Badge tone="green">{perContractor.length} contractors</Badge>}
        />
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <Th>Contractor</Th><Th>Invoice No</Th><Th right>Workers</Th><Th right>Pay Days</Th>
              <Th right>Wages (₹)</Th><Th right>Commission (₹)</Th>
              <Th right>ER PF (₹)</Th><Th right>ER ESIC (₹)</Th><Th right>GST (₹)</Th>
              <Th right>Grand Total (₹)</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {perContractor.map((b, i) => (
              <tr key={b.ct.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                <Td>
                  <div className="font-medium">{b.ct.name}</div>
                  <div className="text-[11px]">{b.reconOk ? <Badge tone="green">✓ Reconciled</Badge> : <Badge tone="red">✗ Mismatch</Badge>}</div>
                </Td>
                <Td className="font-mono text-xs">{b.invoiceNo}</Td>
                <Td right>{b.workers}</Td>
                <Td right className="tabular-nums">{b.payDays}</Td>
                <Td right className="tabular-nums">₹{fmtINR(b.wages)}</Td>
                <Td right className="tabular-nums text-indigo-700">{b.commission ? '₹' + fmtINR(b.commission) : '—'}</Td>
                <Td right className="tabular-nums text-rose-600">{b.erPf ? '₹' + fmtINR(b.erPf) : '—'}</Td>
                <Td right className="tabular-nums text-amber-600">{b.erEsic ? '₹' + fmtINR(b.erEsic) : '—'}</Td>
                <Td right className="tabular-nums">{b.gst ? '₹' + fmtINR(b.gst) : '—'}</Td>
                <Td right className="tabular-nums font-bold text-emerald-700">₹{fmtINR(b.grandTotal)}</Td>
                <Td>
                  <div className="flex gap-1 flex-wrap">
                    <Btn size="sm" variant="secondary" onClick={() => genBill(i)} title={b.reconOk ? 'All checks passed' : 'Blocked — reconciliation mismatch'}>Save Bill</Btn>
                    <Btn size="sm" variant="secondary" onClick={() => printContractorBill(state, b, monthKey)}><Printer size={12} /> PDF</Btn>
                    <Btn size="sm" variant="secondary" onClick={() => genChallan(i)} disabled={b.empPf + b.erPf <= 0}>PF Challan</Btn>
                  </div>
                </Td>
              </tr>
            ))}
            {perContractor.length === 0 && <tr><td colSpan={11}><Empty message="No contractor workers for this month." /></td></tr>}
          </tbody>
        </Table>
      </Card>
      {/* Invoice Page-1 + Worker Detail (Page 2) per contractor */}
      {perContractor.map((b, i) => (
        <Card key={b.ct.id} className="overflow-hidden">
          <CardHeader
            title={`Invoice ${b.invoiceNo} — ${b.ct.name}`}
            subtitle="Page 1 = invoice summary · Page 2 = worker detail · Print Bill se professional PDF banta hai"
            right={
              <div className="flex gap-1">
                <Btn size="sm" onClick={() => printContractorBill(state, b, monthKey)}><Printer size={12} /> Print Bill</Btn>
                <Btn size="sm" variant="secondary" onClick={() => genBill(i)}>Save Bill</Btn>
              </div>
            }
          />
          <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Page-1 summary */}
            <div className="rounded-lg border border-slate-200 p-4 text-sm">
              <div className="text-xs font-bold uppercase tracking-wide text-indigo-700 mb-2">Bill Summary (Page 1)</div>
              <div className="space-y-1 text-slate-600 text-xs mb-3">
                <div>Contractor: <b className="text-slate-800">{b.ct.name}</b> · Code: {b.ct.code || b.ct.id}</div>
                <div>Address: {b.ct.address || '—'} · GST No: {b.ct.gstNo || '—'}</div>
                <div>Unit: {b.unitNames} · Month: {monthLabel(monthKey)}</div>
              </div>
              <div className="space-y-1">
                {[
                  ['Wages Amount', b.wages],
                  ['+ Commission Amount', b.commission],
                  ['+ Employer PF Contribution', b.erPf],
                  ['+ Employer ESIC Contribution', b.erEsic]
                ].map(([l, v]) => (
                  <div key={l as string} className="flex justify-between text-slate-600">
                    <span>{l as string}</span><span className="tabular-nums">₹{fmtINR(v as number)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t border-slate-300 pt-1 text-slate-800">
                  <span>= Taxable Contractor Service Amount</span><span className="tabular-nums">₹{fmtINR(b.taxable)}</span>
                </div>
                <div className="flex justify-between text-slate-600"><span>+ GST Amount</span><span className="tabular-nums">₹{fmtINR(b.gst)}</span></div>
                <div className="flex justify-between font-bold bg-indigo-50 rounded px-2 py-1 text-indigo-800">
                  <span>GRAND TOTAL CONTRACTOR BILL</span><span className="tabular-nums">₹{fmtINR(b.grandTotal)}</span>
                </div>
              </div>
              <div className="mt-3 border-t border-slate-100 pt-2">
                <div className="text-xs font-bold mb-1">Reconciliation: {b.reconOk ? <Badge tone="green">ALL PASSED</Badge> : <Badge tone="red">BLOCKED</Badge>}</div>
                <div className="space-y-0.5">
                  {b.recon.map((c) => (
                    <div key={c.id} className="flex justify-between text-[11px]">
                      <span className={c.ok ? 'text-emerald-700' : 'text-rose-600'}>{c.ok ? '✓' : '✗'} {c.id}. {c.label}</span>
                      <span className="text-slate-400 font-mono">{c.detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Worker detail (Page 2) */}
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <div className="text-xs font-bold uppercase tracking-wide text-indigo-700 px-4 pt-3">Worker Detail (Page 2) — ⎙ = Payslip print</div>
              <Table>
                <thead className="bg-slate-50">
                  <tr>
                    <Th>#</Th><Th>Code / Name</Th><Th right>Days</Th><Th right>Basic</Th><Th right>Allow.</Th><Th right>Gross</Th>
                    <Th right>Loan</Th><Th right>Adv.</Th><Th right>PF</Th><Th right>ESIC</Th><Th right>Other</Th><Th right>Net Payable</Th><Th>⎙</Th>
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((r) => (
                    <tr key={r.w.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <Td className="text-slate-400">{r.sl}</Td>
                      <Td><div className="text-xs font-medium">{r.name}</div><div className="text-[10px] font-mono text-slate-400">{r.code}</div></Td>
                      <Td right className="tabular-nums">{r.payDays}</Td>
                      <Td right className="tabular-nums text-xs">{fmtINR(r.basicWages)}</Td>
                      <Td right className="tabular-nums text-xs">{fmtINR(r.allAllowance)}</Td>
                      <Td right className="tabular-nums text-xs font-semibold">{fmtINR(r.grossWages)}</Td>
                      <Td right className="tabular-nums text-xs text-rose-600">{r.loanDeduction ? fmtINR(r.loanDeduction) : '—'}</Td>
                      <Td right className="tabular-nums text-xs text-rose-600">{r.advanceDeduction ? fmtINR(r.advanceDeduction) : '—'}</Td>
                      <Td right className="tabular-nums text-xs text-rose-600">{r.pfEmp ? fmtINR(r.pfEmp) : '—'}</Td>
                      <Td right className="tabular-nums text-xs text-amber-600">{r.esicEmp ? fmtINR(r.esicEmp) : '—'}</Td>
                      <Td right className="tabular-nums text-xs text-rose-600">{r.otherDeduction ? fmtINR(r.otherDeduction) : '—'}</Td>
                      <Td right className="tabular-nums text-xs font-bold text-emerald-700">{fmtINR(r.netPayable)}</Td>
                      <Td><Btn size="sm" variant="ghost" onClick={() => printWorkerPayslip(state, b, r, monthKey)} title="Print Payslip"><FileText size={13} /></Btn></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="px-4 py-2 text-[11px] text-slate-400 border-t border-slate-100">
                Advance Paid alag se report hota hai — Net Payable me double-count nahi. Employer PF/ESIC worker se deduct nahi hote (sirf bill me add hote hain).
              </div>
            </div>
          </div>
        </Card>
      ))}
<Card className="overflow-hidden">
        <CardHeader title={`Location/Unit-wise Bill — ${monthLabel(monthKey)}`} subtitle="Pick a contractor or see all — workers & pay days per location" />
        <div className="px-5 pt-3">
          <Select value={selCt} onChange={(e) => setSelCt(e.target.value)} className="w-auto">
            <option value="all">All Contractors</option>
            {state.contractors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <Table>
          <thead className="bg-slate-50">
            <tr><Th>Unit / Location</Th><Th right>Workers</Th><Th right>Pay Days</Th></tr>
          </thead>
          <tbody>
            {byUnit.length === 0 && <tr><td colSpan={3}><Empty message="No contractor workers at any location for this filter." /></td></tr>}
            {byUnit.map((x) => (
              <tr key={x.u.id} className="border-t border-slate-100">
                <Td className="font-medium">{x.u.name}</Td>
                <Td right>{x.count}</Td>
                <Td right className="tabular-nums">{x.payDays}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader
          title={`PF Challan Log — ${monthLabel(monthKey)}`}
          subtitle="Contractor-wise PF challans generated (Employee + Employer PF)"
          right={<Badge tone="violet">{(state.pfChallans || []).filter((c) => c.monthKey === monthKey).length} challans</Badge>}
        />
        <Table>
          <thead className="bg-slate-50">
            <tr><Th>Challan No</Th><Th>Contractor</Th><Th right>Employee PF</Th><Th right>Employer PF</Th><Th right>Total</Th><Th>Generated At</Th></tr>
          </thead>
          <tbody>
            {(state.pfChallans || []).filter((c) => c.monthKey === monthKey).map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <Td className="font-mono text-xs">{c.challanNo || c.id}</Td>
                <Td className="font-medium">{contractorName(state, c.contractorId)}</Td>
                <Td right className="tabular-nums">₹{fmtINR(c.empPf)}</Td>
                <Td right className="tabular-nums">₹{fmtINR(c.erPf)}</Td>
                <Td right className="tabular-nums font-bold text-rose-700">₹{fmtINR(c.total)}</Td>
                <Td className="text-xs text-slate-500">{new Date(c.generatedAt).toLocaleString()}</Td>
              </tr>
            ))}
            {(state.pfChallans || []).filter((c) => c.monthKey === monthKey).length === 0 && <tr><td colSpan={6}><Empty message="No PF challans generated yet. Click 'PF Challan' on a contractor row." /></td></tr>}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}