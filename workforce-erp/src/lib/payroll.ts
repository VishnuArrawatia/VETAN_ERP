import { AppState, WorkerRec, AttendanceRec } from '../types';

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
  net: number;
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
    const otPay = Math.round((att?.otHours || 0) * (w.rateDay / 8) * 100) / 100;
    const basic = Math.round(w.rateBasic * payDays * 100) / 100;
    const hra = Math.round(w.rateHra * payDays * 100) / 100;
    const other = Math.round(w.rateOther * payDays * 100) / 100;
    const gross = Math.round((basic + hra + other + otPay) * 100) / 100;
    const pf = w.pf
      ? Math.round(w.rateBasic * payDays * s.settings.pfEmp * 100) / 100
      : 0;
    const esic = w.esic
      ? Math.round(gross * s.settings.esicEmp * 100) / 100
      : 0;
    const net = Math.round((gross - pf - esic) * 100) / 100;
    rows.push({ worker: w, att, payDays, otPay, basic, hra, other, gross, pf, esic, net });
  }
  return rows;
}

export function totals(rows: PayRow[]) {
  return rows.reduce(
    (acc, r) => {
      acc.payDays += r.payDays;
      acc.gross += r.gross;
      acc.basic += r.basic;
      acc.pf += r.pf;
      acc.esic += r.esic;
      acc.net += r.net;
      return acc;
    },
    { payDays: 0, gross: 0, basic: 0, pf: 0, esic: 0, net: 0 }
  );
}