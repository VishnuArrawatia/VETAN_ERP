export interface Company {
  id: string;
  name: string;
  short: string;
}

export interface Unit {
  id: string;
  name: string;
  companyId: string;
}

export interface ContractorRec {
  id: string;
  name: string;
  pf: boolean;
  esic: boolean;
  commissionPerDay: number;
  gstRate: number;
  tdsRate: number;
}

export interface WorkerRec {
  id: string;
  code: string;
  name: string;
  unitId: string;
  companyId: string;
  contractor: string;
  department: string;
  gender: 'M' | 'F';
  doj: string;
  uan: string;
  bank: string;
  ac: string;
  ifsc: string;
  mode: 'Company' | 'Contractor';
  rateBasic: number;
  rateHra: number;
  rateOther: number;
  rateDay: number;
  ctc: number;
  minWage: number;
  pf: boolean;
  esic: boolean;
  active: boolean;
}

export interface AttendanceRec {
  id: string;
  monthKey: string;
  workerId: string;
  present: number;
  absent: number;
  weeklyOff: number;
  paidHoliday: number;
  leave: number;
  lwp: number;
  otHours: number;
}

export interface LeaveRec {
  id: string;
  monthKey: string;
  workerId: string;
  opening: number;
  earned: number;
  taken: number;
  balance: number;
}

export interface Settings {
  pfEmp: number;
  pfEr: number;
  esicEmp: number;
  esicEr: number;
  bonusRate: number;
}

export interface AppState {
  companies: Company[];
  units: Unit[];
  workers: WorkerRec[];
  attendance: AttendanceRec[];
  leave: LeaveRec[];
  contractors: ContractorRec[];
  settings: Settings;
}