import { AppState, WorkerRec, AttendanceRec } from '../types';
import { effRates } from './store';

export interface PayRow {
  worker: WorkerRec;
  att: AttendanceRec | null;
  payDays: number;
  otPay: number;
  basic: number;
  hra: number;
  other: number;
  gross: number;
  pf: number;
  esic: number;
  loanDeduction: number;
  advanceDeduction: number;
  recovery: number;
  net: number;
}

/** PF wage base for a worker's monthly basic wages — respects the configurable PF ceiling
 *  (settings.pfCeiling). 0/undefined ceiling = no cap (existing behaviour). */
export function pfBase(basicWages: number, s: AppState): number {
  const ceil = (s.settings as any)?.pfCeiling || 0;
  return ceil > 0 ? Math.min(basicWages, ceil) : basicWages;
}

/** ESIC applicability — worker flag AND unit/location config (Sakar Unit III = true in seed).
 *  Never derived from worker name. */
export function esicApplicable(s: AppState, w: WorkerRec): boolean {
  if (!w.esic) return false;
  const u = s.units.find((x) => x.id === w.unitId);
  return u?.esic !== false; // undefined unit flag → worker flag governs (existing behaviour)
}

export function calcPayroll(
  s: AppState,
  monthKey: string,
  unitId?: string
): PayRow[] {
  const rows: PayRow[] = [];
  for (const w of s.workers) {
    if (!w.active) continue;
    if (unitId && w.unitId !== unitId) continue;
    const att =
      s.attendance.find(
        (a) => a.workerId === w.id && a.monthKey === monthKey
      ) || null;
    const payDays =
      (att?.present || 0) + (att?.paidHoliday || 0) + (att?.leave || 0);
    const rt = effRates(s, w, monthKey);
    const otPay = Math.round((att?.otHours || 0) * (rt.rateDay / 8) * 100) / 100;
    const basic = Math.round(rt.rateBasic * payDays * 100) / 100;
    const hra = Math.round(rt.rateHra * payDays * 100) / 100;
    const other = Math.round(rt.rateOther * payDays * 100) / 100;
    const gross = Math.round((basic + hra + other + otPay) * 100) / 100;
    const pf = w.pf
      ? Math.round(pfBase(rt.rateBasic * payDays, s) * s.settings.pfEmp * 100) / 100
      : 0;
    const esic = esicApplicable(s, w)
      ? Math.round(gross * s.settings.esicEmp * 100) / 100
      : 0;
    const loan = (s.loans || []).find(
      (l) => l.workerId === w.id && l.monthKey === monthKey
    );
    const loanDeduction = loan?.loanDeduction || 0;
    const advanceDeduction = loan?.advanceDeduction || 0;
    const recovery = Math.round((loanDeduction + advanceDeduction) * 100) / 100;
    const net = Math.round((gross - pf - esic - recovery) * 100) / 100;
    rows.push({ worker: w, att, payDays, otPay, basic, hra, other, gross, pf, esic, loanDeduction, advanceDeduction, recovery, net });
  }
  return rows;
}

export function totals(rows: PayRow[]) {
  return rows.reduce(
    (acc: any, r) => {
      acc.payDays += r.payDays;
      acc.gross += r.gross;
      acc.basic += r.basic;
      acc.pf += r.pf;
      acc.esic += r.esic;
      acc.recovery += r.recovery;
      acc.net += r.net;
      return acc;
    },
    { payDays: 0, gross: 0, basic: 0, pf: 0, esic: 0, recovery: 0, net: 0 }
  );
}