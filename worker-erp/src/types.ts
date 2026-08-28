export interface Worker {
  sl: number;
  worker_code: string;
  name: string;
  unit: string;
  type: string;
  source: string;
  department: string;
  designation?: string;
  gender: string;
  dob: string;
  doj: string;
  working_hour: string;
  category?: string;
  pf_flag: string;
  esic_flag: string;
  uan: string;
  esic_no: string;
  aadhar_no: string;
  disbursement_route: string;
  bank_name: number;
  bank_ac_no: number;
  ifsc: number;
  basic_rate_day: number;
  hra_rate_day: number;
  other_allow_rate_day: number;
  total_wage_day: number;
  pf_contribution: number;
  bonus: number;
  ctc: number;
  min_wage_day: number;
  transport_mode: string;
  transport_by: string;
  location_source: string;
  vehicle_group?: string;
  active_status: string;
  wage_vs_minwage: number;
  pay_group: string;
  critical_work?: string;
  dol?: string;
  doj_group?: string;
  old_code?: string;
  experience?: string;
  exprc_group?: string;
  age?: string;
  age_slab?: string;
  department_group?: string;
}

export interface AttendanceRecord {
  proper_code: string;
  month_key: string;
  duplicate_flag: string;
  master_missing: string;
  payroll_missing: string;
  month_days: number;
  pay_days: number;
  check_flag: string;
  month: number;
  worker_code: string;
  name: string;
  present: number;
  absent: number;
  weekly_off: number;
  paid_holiday: number;
  leave: number;
  lwp: number;
  ot_hours: number;
  id: string;
}

export interface Contractor {
  name: string;
  unit: string;
  pf_applicable: string;
  esic_applicable: string;
  commission_per_day: number;
  gst_rate: number;
  tds_rate: number;
}

export type SubTab = 'dashboard' | 'workers' | 'attendance' | 'contractors' | 'reports';
