import { createContext, useContext, useState } from 'react';
import { AppState, WorkerRec, AttendanceRec, ContractorRec } from '../types';
import { seed } from '../data/seed';

const KEY = 'wf-erp-v1';

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.workers && d.workers.length) return d as AppState;
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

export function addWorker(s: AppState, w: WorkerRec): AppState {
  return { ...s, workers: [...s.workers, w] };
}

export function updateWorker(s: AppState, id: string, patch: Partial<WorkerRec>): AppState {
  return { ...s, workers: s.workers.map((w) => (w.id === id ? { ...w, ...patch } : w)) };
}