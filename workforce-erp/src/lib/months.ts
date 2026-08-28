export interface MonthOption {
  key: string;
  label: string;
  days: number;
}

export const MONTHS: MonthOption[] = [
  { key: '2026-04', label: 'Apr 2026', days: 30 },
  { key: '2026-05', label: 'May 2026', days: 31 },
  { key: '2026-06', label: 'Jun 2026', days: 30 },
  { key: '2026-07', label: 'Jul 2026', days: 31 },
  { key: '2026-08', label: 'Aug 2026', days: 31 },
  { key: '2026-09', label: 'Sep 2026', days: 30 },
  { key: '2026-10', label: 'Oct 2026', days: 31 },
  { key: '2026-11', label: 'Nov 2026', days: 30 },
  { key: '2026-12', label: 'Dec 2026', days: 31 },
  { key: '2027-01', label: 'Jan 2027', days: 31 },
  { key: '2027-02', label: 'Feb 2027', days: 28 },
  { key: '2027-03', label: 'Mar 2027', days: 31 }
];

export function monthLabel(key: string): string {
  return MONTHS.find((m) => m.key === key)?.label ?? key;
}

export function monthDays(key: string): number {
  return MONTHS.find((m) => m.key === key)?.days ?? 30;
}

export const fmtINR = (n: number) =>
  n.toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const fmtINR2 = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });