import { createContext, useContext, useState, type ReactNode } from 'react';
import { AppState, WorkerRec, AttendanceRec, ContractorRec, WageRevision, LoanRecoveryRec, PfChallanRec, ContractorBillRec, CommissionRateRec } from '../types';
import { seed } from '../data/seed';

const KEY = 'wf-erp-v1';

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.workers && d.workers.length) {
        // Backward-compat: older saved state may not have loans
        if (!Array.isArray(d.loans)) d.loans = [];
        if (!Array.isArray(d.pfChallans)) d.pfChallans = [];
        if (!Array.isArray(d.contractorBills)) d.contractorBills = [];
        // Backward-compat: older saved settings may not have departments
        if (!d.settings || !Array.isArray(d.settings.departments) || !d.settings.departments.length) {
          d.settings = { ...(d.settings || {}), departments: seed.settings.departments };
        }
        // Backward-compat: older saved settings may not have commissionRates
        if (!d.settings.commissionRates || !Array.isArray(d.settings.commissionRates)) {
          d.settings = { ...(d.settings || {}), commissionRates: [] };
        }
        // Backward-compat: units added to seed later (e.g. SVN Unit-I) should appear for existing users too
        if (!Array.isArray(d.units)) d.units = seed.units;
        const missingUnits = (seed.units || []).filter((u) => !d.units.some((x) => x && x.id === u.id));
        if (missingUnits.length) d.units = [...d.units, ...missingUnits];
        // workingHours default 8 if missing
        d.workers = d.workers.map((w: any) => ({ ...w, workingHours: w.workingHours ?? 8 }));
        return d as AppState;
      }
    }
  } catch (_) {}
  return seed;
}

interface Ctx {
  state: AppState;
  set: (fn: (s: AppState) => AppState) => void;
  reset: () => void;
}

const StoreCtx = createContext<Ctx>({ state: seed, set: () => {}, reset: () => {} });

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(load);
  const set = (fn: (s: AppState) => AppState) => {
    setState((prev) => {
      const n = fn(prev);
      try {
        localStorage.setItem(KEY, JSON.stringify(n));
      } catch (_) {}
      return n;
    });
  };
  const reset = () => {
    try {
      localStorage.removeItem(KEY);
    } catch (_) {}
    setState(seed);
  };
  return <StoreCtx.Provider value={{ state, set, reset }}>{children}</StoreCtx.Provider>;
}

export const useStore = () => useContext(StoreCtx);

export const unitName = (s: AppState, id: string) =>
  s.units.find((u) => u.id === id)?.name || id;
export const companyName = (s: AppState, id: string) =>
  s.companies.find((c) => c.id === id)?.name || id;
export const contractorName = (s: AppState, id: string) =>
  s.contractors.find((c) => c.id === id)?.name || id || '—';

export function upsertAttendance(
  s: AppState,
  monthKey: string,
  workerId: string,
  patch: Partial<AttendanceRec>
): AppState {
  const i = s.attendance.findIndex(
    (a) => a.monthKey === monthKey && a.workerId === workerId
  );
  const base =
    i >= 0
      ? s.attendance[i]
      : {
          id: 'att-' + monthKey + '-' + workerId,
          monthKey,
          workerId,
          present: 0,
          absent: 0,
          weeklyOff: 0,
          paidHoliday: 0,
          leave: 0,
          lwp: 0,
          otHours: 0
        };
  const upd = { ...base, ...patch };
  const next = i >= 0 ? s.attendance.map((a, j) => (j === i ? upd : a)) : [...s.attendance, upd];
  return { ...s, attendance: next };
}

export function upsertLeave(
  s: AppState,
  monthKey: string,
  workerId: string,
  patch: Partial<{ opening: number; earned: number; taken: number }>
): AppState {
  const i = s.leave.findIndex((l) => l.monthKey === monthKey && l.workerId === workerId);
  const base =
    i >= 0
      ? s.leave[i]
      : { id: 'lv-' + monthKey + '-' + workerId, monthKey, workerId, opening: 0, earned: 0, taken: 0 };
  const merged = { ...base, ...patch };
  const balance = Math.max(0, (merged.opening || 0) + (merged.earned || 0) - (merged.taken || 0));
  const upd = { ...merged, balance };
  const next = i >= 0 ? s.leave.map((l, j) => (j === i ? upd : l)) : [...s.leave, upd];
  return { ...s, leave: next };
}

export function upsertLoan(
  s: AppState,
  monthKey: string,
  workerId: string,
  patch: Partial<LoanRecoveryRec>
): AppState {
  const arr = s.loans || [];
  const i = arr.findIndex((l) => l.monthKey === monthKey && l.workerId === workerId);
  const base =
    i >= 0
      ? arr[i]
      : {
          id: 'ln-' + monthKey + '-' + workerId,
          monthKey,
          workerId,
          loanAmount: 0,
          loanDeduction: 0,
          advanceAmount: 0,
          advanceDeduction: 0,
          otherDeductions: 0,
          outstanding: 0
        };
  const upd = { ...base, ...patch };
  const next = i >= 0 ? arr.map((l, j) => (j === i ? upd : l)) : [...arr, upd];
  return { ...s, loans: next };
}

export function removeLoan(
  s: AppState,
  monthKey: string,
  workerId: string
): AppState {
  return { ...s, loans: (s.loans || []).filter((l) => !(l.monthKey === monthKey && l.workerId === workerId)) };
}

export function upsertPfChallan(s: AppState, challan: PfChallanRec): AppState {
  const arr = s.pfChallans || [];
  const i = arr.findIndex((c) => c.monthKey === challan.monthKey && c.contractorId === challan.contractorId);
  const next = i >= 0 ? arr.map((c, j) => (j === i ? challan : c)) : [...arr, challan];
  return { ...s, pfChallans: next };
}

export function removePfChallan(s: AppState, challanId: string): AppState {
  return { ...s, pfChallans: (s.pfChallans || []).filter((c) => c.id !== challanId) };
}

export function upsertContractorBill(s: AppState, bill: ContractorBillRec): AppState {
  const arr = s.contractorBills || [];
  const i = arr.findIndex((b) => b.monthKey === bill.monthKey && b.contractorId === bill.contractorId);
  const next = i >= 0 ? arr.map((b, j) => (j === i ? bill : b)) : [...arr, bill];
  return { ...s, contractorBills: next };
}

export function addWorker(s: AppState, w: WorkerRec): AppState {
  return { ...s, workers: [...s.workers, w] };
}

export function updateWorker(s: AppState, id: string, patch: Partial<WorkerRec>): AppState {
  return { ...s, workers: s.workers.map((w) => (w.id === id ? { ...w, ...patch } : w)) };
}

/** Rates applied to a worker for a given month: most recent revision effective on/before that month, else the worker's current/original rates. */
export function effRates(
  s: AppState,
  w: WorkerRec,
  monthKey: string
): { rateBasic: number; rateHra: number; rateOther: number; rateDay: number } {
  const revs = (w.revisions || [])
    .filter((r) => r.effectiveFrom <= monthKey)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  const r = revs[0];
  return r
    ? { rateBasic: r.rateBasic, rateHra: r.rateHra, rateOther: r.rateOther, rateDay: r.rateDay }
    : { rateBasic: w.rateBasic, rateHra: w.rateHra, rateOther: w.rateOther, rateDay: w.rateDay };
}

/** Record a wage revision effective from a given month and update the worker's current rates (forward-looking). Past payroll months are never touched because they use effRates() by month. */
export function addWageRevision(
  s: AppState,
  workerId: string,
  rev: Omit<WageRevision, 'id' | 'workerId' | 'createdAt' | 'rateDay'>): AppState {
  const now = new Date().toISOString();
  const entry: WageRevision = {
    id: 'wr' + Date.now(),
    workerId,
    createdAt: now,
    ...rev,
    rateDay: rev.rateBasic + rev.rateHra + rev.rateOther
  };
  return {
    ...s,
    workers: s.workers.map((w) => {
      if (w.id !== workerId) return w;
      const revisions = [...(w.revisions || []), entry];
      return {
        ...w,
        revisions,
        rateBasic: entry.rateBasic,
        rateHra: entry.rateHra,
        rateOther: entry.rateOther,
        rateDay: entry.rateDay
      };
    })
  };
}
/* ─── Contractor Commission Rates (effective-date based) ─── */

export const DEFAULT_COMMISSION = { rate12: 20, rate11: 20, rate8: 20 };

/** Normalized scope of a commission entry — old saved entries without unitId are treated as 'all'. */
const commissionScope = (r: CommissionRateRec): string => r.unitId || 'all';

/** Latest commission-rate entry effective on/before `monthKey`.
 *  If `unitId` is given, a unit-specific entry wins over the 'all' (common) entry. */
export function commissionEntry(s: AppState, monthKey: string, unitId?: string): CommissionRateRec | null {
  const list = (s.settings?.commissionRates || []).filter((r) => r.effectiveFrom <= monthKey);
  const pick = (arr: CommissionRateRec[]): CommissionRateRec | null =>
    arr
      .slice()
      .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) || b.createdAt.localeCompare(a.createdAt))[0] || null;
  if (unitId && unitId !== 'all') {
    const unitSpecific = pick(list.filter((r) => commissionScope(r) === unitId));
    if (unitSpecific) return unitSpecific;
  }
  return pick(list.filter((r) => commissionScope(r) === 'all'));
}

/** Commission rates (12h / 11h / 8h tiers per payday) effective for a given month and unit/location. */
export function commissionRate(s: AppState, monthKey: string, unitId?: string) {
  const e = commissionEntry(s, monthKey, unitId);
  return e
    ? { rate12: e.rate12, rate11: e.rate11, rate8: e.rate8, effectiveFrom: e.effectiveFrom }
    : { ...DEFAULT_COMMISSION, effectiveFrom: '' };
}

/** Add a new commission-rate revision effective from a given month (for a unit or 'all').
 *  Replaces any existing entry for the same unit + effective month (duplicate control). */
export function addCommissionRate(
  s: AppState,
  entry: Omit<CommissionRateRec, 'id' | 'createdAt'>
): AppState {
  const rec: CommissionRateRec = {
    ...entry,
    unitId: entry.unitId || 'all',
    id: 'cm' + Date.now(),
    createdAt: new Date().toISOString()
  };
  const rest = (s.settings?.commissionRates || []).filter(
    (r) => !(commissionScope(r) === commissionScope(rec) && r.effectiveFrom === rec.effectiveFrom)
  );
  return {
    ...s,
    settings: {
      ...s.settings,
      commissionRates: [...rest, rec]
    }
  };
}

export function removeCommissionRate(s: AppState, id: string): AppState {
  return {
    ...s,
    settings: {
      ...s.settings,
      commissionRates: (s.settings?.commissionRates || []).filter((r) => r.id !== id)
    }
  };
}