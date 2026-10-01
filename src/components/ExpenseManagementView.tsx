/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * EXPENSE MANAGEMENT MODULE — paperless expense claims.
 * HR view: approve/reject/mark-paid. Claims data comes from App.tsx state.
 */
import React, { useState } from 'react';
import { Plus, Trash2, X, Receipt, CheckCircle, XCircle, Banknote, IndianRupee } from 'lucide-react';

interface Company { id: string; name: string }
interface ExpenseClaim {
  id?: string; claim_no?: string; employee_id: string; employee_name: string;
  company?: string; title: string; category?: string; expense_date?: string;
  amount: number; description?: string; status?: string;
  submitted_at?: string; decided_by?: string; decided_at?: string; decision_note?: string; paid_at?: string;
}

const CATEGORIES = ['TRAVEL', 'FUEL', 'MEALS', 'LODGING', 'OFFICE_SUPPLIES', 'TRAINING', 'COMMUNICATION', 'OTHER'];
const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: 'bg-sky-100 text-sky-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700',
  PAID: 'bg-violet-100 text-violet-700'
};

interface Props {
  claims: ExpenseClaim[];
  companies: Company[];
  activeCompany: string;
  canDecide: boolean;
  onDecide: (id: string, status: 'APPROVED' | 'REJECTED' | 'PAID', note?: string) => Promise<void>;
  onCreate: (draft: Partial<ExpenseClaim>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ExpenseManagementView({ claims, companies, activeCompany, canDecide, onDecide, onCreate, onDelete }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<ExpenseClaim>>({});
  const [busy, setBusy] = useState(false);
  const [noteFor, setNoteFor] = useState<{ id: string; status: 'APPROVED' | 'REJECTED' | 'PAID' } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const visible = claims
    .filter(c => activeCompany === 'GROUP' || activeCompany === 'ALL' ? true : c.company === activeCompany)
    .filter(c => filterStatus === 'ALL' ? true : c.status === filterStatus)
    .sort((a, b) => (b.submitted_at || '').localeCompare(a.submitted_at || ''));

  const totalByStatus = (s: string) => claims.filter(c => c.status === s).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const submit = async () => {
    if (!form.title || !form.amount || !form.employee_id) return;
    setBusy(true);
    await onCreate({ ...form, amount: Number(form.amount) });
    setBusy(false);
    setShowModal(false);
    setForm({});
  };

  const decide = async () => {
    if (!noteFor) return;
    setBusy(true);
    await onDecide(noteFor.id, noteFor.status, noteText || undefined);
    setBusy(false);
    setNoteFor(null);
    setNoteText('');
  };

  return (
    <div className="space-y-4">
      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['SUBMITTED', 'APPROVED', 'PAID', 'REJECTED'].map(s => (
          <div key={s} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">{s}</div>
                <div className="text-base font-black text-slate-800 flex items-center">
                  <IndianRupee size={12} className="text-slate-400" />
                  {totalByStatus(s).toLocaleString('en-IN')}
                </div>
                <div className="text-[9px] text-slate-400 font-bold">{claims.filter(c => c.status === s).length} claims</div>
              </div>
              {s === 'SUBMITTED' && <Receipt size={16} className="text-sky-400" />}
              {s === 'APPROVED' && <CheckCircle size={16} className="text-emerald-400" />}
              {s === 'PAID' && <Banknote size={16} className="text-violet-400" />}
              {s === 'REJECTED' && <XCircle size={16} className="text-rose-400" />}
            </div>
          </div>
        ))}
      </div>

      {/* Claims list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Receipt size={16} className="text-emerald-600" /> Expense Claims
            <span className="text-[10px] font-bold text-slate-400">({visible.length})</span>
          </h3>
          <div className="flex items-center gap-2">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg text-[10px] px-2 py-1.5 font-bold bg-white">
              <option value="ALL">ALL STATUSES</option>
              {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {canDecide && (
              <button onClick={() => { setForm({ category: 'TRAVEL', status: 'SUBMITTED' }); setShowModal(true); }}
                className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5">
                <Plus size={13} /> New Claim
              </button>
            )}
          </div>
        </div>
        {visible.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No expense claims {filterStatus !== 'ALL' ? 'with this status' : 'yet'}.</p>
        ) : (
          <div className="space-y-2">
            {visible.map(c => (
              <div key={c.id} className="border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-2 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-mono font-bold text-slate-400">{c.claim_no}</span>
                    <span className="text-xs font-bold text-slate-800">{c.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${STATUS_STYLES[c.status || 'SUBMITTED']}`}>{c.status}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-600">{c.category}</span>
                  </div>
                  <div className="flex gap-3 mt-1 text-[10px] text-slate-500 flex-wrap">
                    <span className="font-bold text-slate-700">{c.employee_name} ({c.employee_id})</span>
                    {c.company && <span>{c.company}</span>}
                    {c.expense_date && <span>{c.expense_date}</span>}
                    {c.decided_by && <span>by {c.decided_by}</span>}
                  </div>
                  {c.description && <p className="text-[10px] text-slate-400 mt-1">{c.description}</p>}
                  {c.decision_note && <p className="text-[10px] text-slate-500 mt-1 font-semibold">Note: {c.decision_note}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-800 flex items-center justify-end">
                      <IndianRupee size={11} />{Number(c.amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                  {canDecide && c.status === 'SUBMITTED' && (
                    <div className="flex gap-1">
                      <button onClick={() => setNoteFor({ id: c.id!, status: 'APPROVED' })} title="Approve" className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600"><CheckCircle size={14} /></button>
                      <button onClick={() => setNoteFor({ id: c.id!, status: 'REJECTED' })} title="Reject" className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500"><XCircle size={14} /></button>
                    </div>
                  )}
                  {canDecide && c.status === 'APPROVED' && (
                    <button onClick={() => setNoteFor({ id: c.id!, status: 'PAID' })} title="Mark Paid" className="p-1.5 rounded-lg hover:bg-violet-100 text-violet-600"><Banknote size={14} /></button>
                  )}
                  {canDecide && c.status !== 'PAID' && (
                    <button onClick={() => onDelete(c.id!)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400"><Trash2 size={13} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal (HR-side entry) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">New Expense Claim</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Employee ID *" value={form.employee_id || ''} onChange={e => setForm({ ...form, employee_id: e.target.value.toUpperCase() })} className="border rounded-lg px-3 py-2 text-xs" />
              <input placeholder="Employee Name" value={form.employee_name || ''} onChange={e => setForm({ ...form, employee_name: e.target.value })} className="border rounded-lg px-3 py-2 text-xs" />
              <select value={form.company || (activeCompany !== 'GROUP' ? activeCompany : companies[0]?.id)} onChange={e => setForm({ ...form, company: e.target.value })} className="border rounded-lg px-2 py-2 text-xs">
                {companies.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
              </select>
              <input type="date" value={form.expense_date || ''} onChange={e => setForm({ ...form, expense_date: e.target.value })} className="border rounded-lg px-3 py-2 text-xs" />
              <input placeholder="Title *" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="border rounded-lg px-3 py-2 text-xs col-span-2" />
              <select value={form.category || 'TRAVEL'} onChange={e => setForm({ ...form, category: e.target.value })} className="border rounded-lg px-2 py-2 text-xs">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
              <input type="number" min={0} placeholder="Amount ₹ *" value={form.amount ?? ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-xs" />
            </div>
            <textarea placeholder="Description / remarks" value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-xs h-16" />
            <button disabled={busy} onClick={submit} className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50">Submit Claim</button>
          </div>
        </div>
      )}

      {/* Decision note modal */}
      {noteFor && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={() => setNoteFor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800">{noteFor.status === 'APPROVED' ? 'Approve' : noteFor.status === 'REJECTED' ? 'Reject' : 'Mark Paid'} Claim</h3>
            <textarea placeholder="Note (optional)" value={noteText} onChange={e => setNoteText(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-xs h-16" />
            <button disabled={busy} onClick={decide} className={`w-full py-2 text-white text-xs font-bold rounded-lg disabled:opacity-50 ${noteFor.status === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
              Confirm {noteFor.status}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
