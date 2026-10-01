/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * RECRUITMENT MODULE — job openings + candidate pipeline (kanban-style board).
 * HR-only writes; reads open to any authenticated session.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Users, Briefcase, X, MapPin, Calendar, Building } from 'lucide-react';

interface Company { id: string; name: string }
interface JobOpening {
  id?: string; title: string; company: string; department?: string; location?: string;
  openings?: number; employment_type?: string; status?: string; description?: string;
  closing_date?: string; candidate_count?: number; hired_count?: number;
}
interface Candidate {
  id?: string; opening_id: string; name: string; email?: string; phone?: string;
  source?: string; stage?: string; rating?: number; resume_link?: string; notes?: string;
}

const STAGES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const STAGE_COLORS: Record<string, string> = {
  APPLIED: 'bg-slate-100 text-slate-700',
  SCREENING: 'bg-sky-100 text-sky-700',
  INTERVIEW: 'bg-amber-100 text-amber-700',
  OFFER: 'bg-violet-100 text-violet-700',
  HIRED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-rose-100 text-rose-700'
};

interface Props {
  companies: Company[];
  activeCompany: string;
  canEdit: boolean;
  onRefresh?: () => void;
}

export default function RecruitmentView({ companies, activeCompany, canEdit }: Props) {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCandModal, setShowCandModal] = useState(false);
  const [editJob, setEditJob] = useState<JobOpening | null>(null);
  const [editCand, setEditCand] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);

  const [jobForm, setJobForm] = useState<Partial<JobOpening>>({});
  const [candForm, setCandForm] = useState<Partial<Candidate>>({});

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recruitment/jobs?company=${activeCompany}`);
      const arr = await res.json();
      setJobs(Array.isArray(arr) ? arr : []);
    } catch (e) { console.error('jobs fetch', e); }
    setLoading(false);
  }, [activeCompany]);

  const loadCandidates = useCallback(async (openingId: string) => {
    try {
      const res = await fetch(`/api/recruitment/candidates?opening_id=${encodeURIComponent(openingId)}`);
      const arr = await res.json();
      setCandidates(Array.isArray(arr) ? arr : []);
    } catch (e) { console.error('candidates fetch', e); }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { if (selectedJobId) loadCandidates(selectedJobId); else setCandidates([]); }, [selectedJobId, loadCandidates]);

  const openJobModal = (job?: JobOpening) => {
    setEditJob(job || null);
    setJobForm(job ? { ...job } : { title: '', company: activeCompany === 'GROUP' ? companies[0]?.id : activeCompany, openings: 1, employment_type: 'FULL_TIME', status: 'OPEN' });
    setShowJobModal(true);
  };

  const saveJob = async () => {
    if (!jobForm.title || !jobForm.company) return;
    const res = await fetch('/api/recruitment/jobs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editJob, ...jobForm, openings: Number(jobForm.openings) || 1 })
    });
    if (res.ok) { setShowJobModal(false); loadJobs(); }
  };

  const removeJob = async (id: string) => {
    if (!confirm('Delete this opening AND all its candidates?')) return;
    const res = await fetch(`/api/recruitment/jobs/${id}`, { method: 'DELETE' });
    if (res.ok) { if (selectedJobId === id) setSelectedJobId(null); loadJobs(); }
  };

  const openCandModal = (cand?: Candidate) => {
    setEditCand(cand || null);
    setCandForm(cand ? { ...cand } : { opening_id: selectedJobId || '', name: '', stage: 'APPLIED', source: 'DIRECT' });
    setShowCandModal(true);
  };

  const saveCand = async () => {
    if (!candForm.name || !candForm.opening_id) return;
    const res = await fetch('/api/recruitment/candidates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editCand, ...candForm, rating: candForm.rating ? Number(candForm.rating) : undefined })
    });
    if (res.ok) { setShowCandModal(false); if (selectedJobId) loadCandidates(selectedJobId); loadJobs(); }
  };

  const moveStage = async (cand: Candidate, stage: string) => {
    await fetch('/api/recruitment/candidates', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cand, stage })
    });
    if (selectedJobId) loadCandidates(selectedJobId);
  };

  const removeCand = async (id: string) => {
    if (!confirm('Remove this candidate?')) return;
    const res = await fetch(`/api/recruitment/candidates/${id}`, { method: 'DELETE' });
    if (res.ok && selectedJobId) loadCandidates(selectedJobId);
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="space-y-4">
      {/* Openings list */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Briefcase size={16} className="text-emerald-600" /> Job Openings
            <span className="text-[10px] font-bold text-slate-400">({jobs.length})</span>
          </h3>
          {canEdit && (
            <button onClick={() => openJobModal()} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5">
              <Plus size={13} /> New Opening
            </button>
          )}
        </div>
        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading openings…</p>
        ) : jobs.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No job openings yet. {canEdit ? 'Create the first one!' : ''}</p>
        ) : (
          <div className="space-y-2">
            {jobs.map(j => (
              <div key={j.id} onClick={() => setSelectedJobId(j.id === selectedJobId ? null : j.id)}
                className={`border rounded-xl p-3 cursor-pointer transition ${selectedJobId === j.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">{j.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${j.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : j.status === 'ON_HOLD' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{j.status}</span>
                      <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-600">{j.company}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 flex-wrap">
                      {j.department && <span>{j.department}</span>}
                      {j.location && <span className="flex items-center gap-0.5"><MapPin size={9} />{j.location}</span>}
                      {j.closing_date && <span className="flex items-center gap-0.5"><Calendar size={9} />{j.closing_date}</span>}
                      <span>{j.openings || 1} position(s) · {j.employment_type?.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-center">
                      <div className="text-sm font-black text-slate-700">{j.candidate_count || 0}</div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">Cands</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-black text-emerald-600">{j.hired_count || 0}</div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">Hired</div>
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); openJobModal(j); }} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"><Edit2 size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); removeJob(j.id!); }} className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500"><Trash2 size={12} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Candidate pipeline for selected opening */}
      {selectedJobId && selectedJob && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Users size={16} className="text-emerald-600" /> Pipeline: {selectedJob.title}
            </h3>
            {canEdit && (
              <button onClick={() => openCandModal()} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1.5">
                <Plus size={13} /> Add Candidate
              </button>
            )}
          </div>
          {candidates.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No candidates in this pipeline yet.</p>
          ) : (
            <div className="space-y-2">
              {candidates.map(c => (
                <div key={c.id} className="border border-slate-200 rounded-xl p-3 flex items-start justify-between gap-2 hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">{c.name}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${STAGE_COLORS[c.stage || 'APPLIED']}`}>{c.stage}</span>
                      {c.rating ? <span className="text-[10px] font-bold text-amber-600">{'★'.repeat(c.rating)}{'☆'.repeat(5 - c.rating)}</span> : null}
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-slate-500 flex-wrap">
                      {c.email && <span>{c.email}</span>}
                      {c.phone && <span>{c.phone}</span>}
                      {c.source && <span className="flex items-center gap-0.5"><Building size={9} />{c.source}</span>}
                    </div>
                    {c.notes && <p className="text-[10px] text-slate-400 mt-1">{c.notes}</p>}
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                      <select value={c.stage} onChange={(e) => moveStage(c, e.target.value)}
                        className="border rounded-lg text-[10px] px-1.5 py-1 font-bold bg-white cursor-pointer">
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button onClick={() => openCandModal(c)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"><Edit2 size={12} /></button>
                      <button onClick={() => removeCand(c.id!)} className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-500"><Trash2 size={12} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Job modal */}
      {showJobModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={() => setShowJobModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">{editJob ? 'Edit Job Opening' : 'New Job Opening'}</h3>
              <button onClick={() => setShowJobModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <input placeholder="Job Title *" value={jobForm.title || ''} onChange={e => setJobForm({ ...jobForm, title: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <select value={jobForm.company || ''} onChange={e => setJobForm({ ...jobForm, company: e.target.value })} className="border rounded-lg px-2 py-2 text-xs">
                {companies.map(c => <option key={c.id} value={c.id}>{c.id}</option>)}
              </select>
              <input placeholder="Department" value={jobForm.department || ''} onChange={e => setJobForm({ ...jobForm, department: e.target.value })} className="border rounded-lg px-3 py-2 text-xs" />
              <input placeholder="Location" value={jobForm.location || ''} onChange={e => setJobForm({ ...jobForm, location: e.target.value })} className="border rounded-lg px-3 py-2 text-xs" />
              <input type="number" min={1} placeholder="Openings" value={jobForm.openings ?? 1} onChange={e => setJobForm({ ...jobForm, openings: Number(e.target.value) })} className="border rounded-lg px-3 py-2 text-xs" />
              <select value={jobForm.employment_type || 'FULL_TIME'} onChange={e => setJobForm({ ...jobForm, employment_type: e.target.value })} className="border rounded-lg px-2 py-2 text-xs">
                {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
              <select value={jobForm.status || 'OPEN'} onChange={e => setJobForm({ ...jobForm, status: e.target.value })} className="border rounded-lg px-2 py-2 text-xs">
                {['OPEN', 'ON_HOLD', 'CLOSED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <input type="date" value={jobForm.closing_date || ''} onChange={e => setJobForm({ ...jobForm, closing_date: e.target.value })} className="border rounded-lg px-3 py-2 text-xs" />
            </div>
            <textarea placeholder="Description" value={jobForm.description || ''} onChange={e => setJobForm({ ...jobForm, description: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-xs h-20" />
            <button onClick={saveJob} className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700">Save Opening</button>
          </div>
        </div>
      )}

      {/* Candidate modal */}
      {showCandModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCandModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">{editCand ? 'Edit Candidate' : 'Add Candidate'}</h3>
              <button onClick={() => setShowCandModal(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Candidate Name *" value={candForm.name || ''} onChange={e => setCandForm({ ...candForm, name: e.target.value })} className="border rounded-lg px-3 py-2 text-xs col-span-2" />
              <input placeholder="Email" value={candForm.email || ''} onChange={e => setCandForm({ ...candForm, email: e.target.value })} className="border rounded-lg px-3 py-2 text-xs" />
              <input placeholder="Phone" value={candForm.phone || ''} onChange={e => setCandForm({ ...candForm, phone: e.target.value })} className="border rounded-lg px-3 py-2 text-xs" />
              <select value={candForm.source || 'DIRECT'} onChange={e => setCandForm({ ...candForm, source: e.target.value })} className="border rounded-lg px-2 py-2 text-xs">
                {['DIRECT', 'REFERRAL', 'PORTAL', 'CAMPUS', 'AGENCY'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={candForm.stage || 'APPLIED'} onChange={e => setCandForm({ ...candForm, stage: e.target.value })} className="border rounded-lg px-2 py-2 text-xs">
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="number" min={1} max={5} placeholder="Rating (1-5)" value={candForm.rating ?? ''} onChange={e => setCandForm({ ...candForm, rating: e.target.value ? Number(e.target.value) : undefined })} className="border rounded-lg px-3 py-2 text-xs" />
              <input placeholder="Resume link" value={candForm.resume_link || ''} onChange={e => setCandForm({ ...candForm, resume_link: e.target.value })} className="border rounded-lg px-3 py-2 text-xs" />
            </div>
            <textarea placeholder="Notes" value={candForm.notes || ''} onChange={e => setCandForm({ ...candForm, notes: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-xs h-16" />
            <button onClick={saveCand} className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700">Save Candidate</button>
          </div>
        </div>
      )}
    </div>
  );
}
