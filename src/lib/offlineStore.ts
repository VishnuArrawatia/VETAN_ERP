/**
 * Offline/static payroll snapshot for Vercel (no Express /api).
 * Priority: Supabase live store → localStorage → repo snapshot JSON
 */

import {
  bootstrapSupabaseFromLocal,
  pullStoreFromSupabase,
  pushStoreToSupabase
} from './supabaseData';

export type OfflineStore = {
  employees?: any[];
  attendance?: any[];
  payroll_runs?: any[];
  payslips?: any[];
  leave_applications?: any[];
  ff_settlements?: any[];
  loans?: any[];
  departments?: any[];
  companies?: any[];
  salary_revisions?: any[];
  audit_logs?: any[];
  attendance_corrections?: any[];
  compoff_requests?: any[];
  users?: any[];
  gate_passes?: any[];
  [key: string]: any;
};

let memoryStore: OfflineStore | null = null;
let loadPromise: Promise<OfflineStore> | null = null;

function looksLikeJson(text: string): boolean {
  const t = text.trim();
  return t.startsWith('{') || t.startsWith('[');
}

function normalizeCompanyNames(store: OfflineStore): OfflineStore {
  const companies = (store.companies || []).map((c) => {
    const id = String(c?.id || '');
    const name = String(c?.name || '');
    if (/flare/i.test(id) && /flare\s+technologies/i.test(name)) {
      return { ...c, name: 'Flare Luminaires Pvt. Ltd.' };
    }
    return c;
  });
  return { ...store, companies };
}

function persistLocal(store: OfflineStore) {
  memoryStore = store;
  try {
    localStorage.setItem('vetan_erp_auto_save_backup', JSON.stringify(store));
    localStorage.setItem(
      'vetan_erp_auto_save_backup_stats',
      JSON.stringify({
        employeesCount: store.employees?.length || 0,
        savedAt: new Date().toISOString()
      })
    );
  } catch {
    // ignore quota errors
  }
}

export async function loadOfflineStore(): Promise<OfflineStore> {
  if (memoryStore) return memoryStore;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // 1) Supabase live (permanent cloud DB)
    try {
      const remote = await pullStoreFromSupabase();
      if (remote && Array.isArray(remote.employees) && remote.employees.length > 0) {
        const normalized = normalizeCompanyNames(remote);
        persistLocal(normalized);
        // Ensure monthly backup exists
        void bootstrapSupabaseFromLocal(normalized);
        return normalized;
      }
    } catch (e) {
      console.warn('[Store] Supabase pull skipped:', e);
    }

    // 2) Browser auto-save backup
    let localStore: OfflineStore | null = null;
    try {
      const backupStr = localStorage.getItem('vetan_erp_auto_save_backup');
      if (backupStr && looksLikeJson(backupStr)) {
        const parsed = JSON.parse(backupStr);
        if (parsed?.employees?.length) {
          localStore = normalizeCompanyNames(parsed);
        }
      }
    } catch {
      // ignore
    }

    // 3) Repo snapshot shipped with the app
    if (!localStore) {
      const res = await fetch('/data/payroll_store.json', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Could not load offline payroll store');
      }
      localStore = normalizeCompanyNames(await res.json());
    }

    persistLocal(localStore);

    // First-time upload to Supabase so data is not only in this browser
    void bootstrapSupabaseFromLocal(localStore);

    return localStore;
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

/** Try live /api first; if missing (Vercel HTML/empty), use offline/Supabase snapshot mapper. */
export async function fetchJsonWithOfflineFallback<T = any>(
  apiUrl: string,
  offlinePick: (store: OfflineStore) => T
): Promise<T> {
  try {
    const res = await fetch(apiUrl);
    const text = await res.text();
    if (res.ok && looksLikeJson(text)) {
      return JSON.parse(text) as T;
    }
  } catch {
    // fall through
  }
  const store = await loadOfflineStore();
  return offlinePick(store);
}

export function filterEmployeesByCompany(employees: any[], companyParam?: string) {
  if (!companyParam || companyParam === 'ALL' || companyParam === 'GROUP' || companyParam === 'COMBINED') {
    return employees;
  }
  return employees.filter((e) => e.company === companyParam);
}

/** Persist an updated company into local + Supabase. */
export async function upsertOfflineCompany(company: Record<string, any>): Promise<any[]> {
  const store = await loadOfflineStore();
  const companies = [...(store.companies || [])];
  const idx = companies.findIndex((c) => String(c.id).toLowerCase() === String(company.id).toLowerCase());
  if (idx >= 0) {
    companies[idx] = { ...companies[idx], ...company };
  } else {
    companies.push(company);
  }
  const next = { ...store, companies };
  persistLocal(next);
  void pushStoreToSupabase(next);
  return companies;
}

/** Persist any patched store (employees/attendance/etc.) to local + Supabase. */
export async function saveStoreEverywhere(store: OfflineStore): Promise<void> {
  const normalized = normalizeCompanyNames(store);
  persistLocal(normalized);
  await pushStoreToSupabase(normalized);
}
