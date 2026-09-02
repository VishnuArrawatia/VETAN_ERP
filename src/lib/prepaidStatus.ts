import { EmployeeAsset } from '../types';

export const PREPAID_SIM_TYPE = 'PREPAID_SIM';

export type PrepaidLiveStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'SURRENDERED' | 'NOT_ISSUED';

const EXPIRING_DAYS = 7;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function daysUntilValidity(validityDate: string | undefined, today: Date = new Date()): number | null {
  if (!validityDate) return null;
  const v = new Date(`${validityDate}T00:00:00`);
  if (Number.isNaN(v.getTime())) return null;
  const diff = startOfDay(v).getTime() - startOfDay(today).getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export function computePrepaidStatus(asset: Partial<EmployeeAsset> | null | undefined, today: Date = new Date()): PrepaidLiveStatus {
  if (!asset) return 'NOT_ISSUED';
  if (asset.status === 'RETURNED' || (asset.return_date && String(asset.return_date).trim() !== '')) {
    return 'SURRENDERED';
  }
  const days = daysUntilValidity(asset.validity_date, today);
  if (days === null) return 'ACTIVE';
  if (days < 0) return 'EXPIRED';
  if (days <= EXPIRING_DAYS) return 'EXPIRING';
  return 'ACTIVE';
}

export function prepaidStatusLabel(status: PrepaidLiveStatus): string {
  switch (status) {
    case 'ACTIVE': return 'Active';
    case 'EXPIRING': return 'Expiring soon';
    case 'EXPIRED': return 'Expired / recharge pending';
    case 'SURRENDERED': return 'Surrendered';
    case 'NOT_ISSUED': return 'Not issued';
  }
}

export function packPrepaidMeta(asset: Partial<EmployeeAsset>): string {
  return JSON.stringify({
    operator: asset.operator || '',
    mobile_number: asset.mobile_number || '',
    plan_name: asset.plan_name || '',
    plan_amount: Number(asset.plan_amount || 0),
    last_recharge_date: asset.last_recharge_date || '',
    validity_date: asset.validity_date || '',
    monthly_recovery: Number(asset.monthly_recovery || 0),
    company: asset.company || '',
    remarks: asset.remarks || ''
  });
}

export function hydratePrepaidAsset(raw: any): EmployeeAsset {
  let meta: Record<string, any> = {};
  if (raw?.prepaid_meta) {
    if (typeof raw.prepaid_meta === 'string') {
      try { meta = JSON.parse(raw.prepaid_meta) || {}; } catch { meta = {}; }
    } else if (typeof raw.prepaid_meta === 'object') {
      meta = raw.prepaid_meta;
    }
  }
  return {
    id: raw.id,
    employee_id: raw.employee_id,
    employee_name: raw.employee_name,
    asset_name: raw.asset_name || meta.plan_name || 'Corporate Prepaid SIM',
    serial_number: raw.serial_number || meta.mobile_number || '',
    type: raw.type || PREPAID_SIM_TYPE,
    issue_date: raw.issue_date || '',
    return_date: raw.return_date || undefined,
    status: raw.status || 'ISSUED',
    condition: raw.condition || 'Good',
    operator: raw.operator || meta.operator || '',
    mobile_number: raw.mobile_number || meta.mobile_number || raw.serial_number || '',
    plan_name: raw.plan_name || meta.plan_name || '',
    plan_amount: Number(raw.plan_amount ?? meta.plan_amount ?? 0),
    last_recharge_date: raw.last_recharge_date || meta.last_recharge_date || '',
    validity_date: raw.validity_date || meta.validity_date || '',
    monthly_recovery: Number(raw.monthly_recovery ?? meta.monthly_recovery ?? 0),
    company: raw.company || meta.company || '',
    remarks: raw.remarks || meta.remarks || '',
    prepaid_meta: typeof raw.prepaid_meta === 'string' ? raw.prepaid_meta : packPrepaidMeta({ ...meta, ...raw })
  };
}

export function isPrepaidSim(asset: Partial<EmployeeAsset> | null | undefined): boolean {
  if (!asset) return false;
  return (asset.type || '') === PREPAID_SIM_TYPE || Boolean(asset.mobile_number || asset.validity_date || asset.operator);
}
