/**
 * Offline/static payroll snapshot for Vercel (no Express /api).
 * Source of truth in repo: payroll_persisted_store.json
 */

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

export async function loadOfflineStore(): Promise<OfflineStore> {
  if (memoryStore) return memoryStore;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    // Prefer browser auto-save backup if present (newer local edits)
    try {
      const backupStr = localStorage.getItem('vetan_erp_auto_save_backup');
      if (backupStr && looksLikeJson(backupStr)) {
        const parsed = JSON.parse(backupStr);
        if (parsed?.employees?.length) {
          memoryStore = normalizeCompanyNames(parsed);
          return memoryStore;
        }
      }
    } catch {
      // ignore
    }

    const res = await fetch('/data/payroll_store.json', { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Could not load offline payroll store');
    }
    memoryStore = normalizeCompanyNames(await res.json());
    return memoryStore!;
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

/** Try live /api first; if missing (Vercel HTML/empty), use offline snapshot mapper. */
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

/** Persist an updated company into the offline snapshot (Vercel has no /api write). */
export async function upsertOfflineCompany(company: Record<string, any>): Promise<any[]> {
  const store = await loadOfflineStore();
  const companies = [...(store.companies || [])];
  const idx = companies.findIndex((c) => String(c.id).toLowerCase() === String(company.id).toLowerCase());
  if (idx >= 0) {
    companies[idx] = { ...companies[idx], ...company };
  } else {
    companies.push(company);
  }
  memoryStore = { ...store, companies };
  try {
    localStorage.setItem('vetan_erp_auto_save_backup', JSON.stringify(memoryStore));
    localStorage.setItem(
      'vetan_erp_auto_save_backup_stats',
      JSON.stringify({
        employeesCount: memoryStore.employees?.length || 0,
        savedAt: new Date().toISOString()
      })
    );
  } catch {
    // ignore quota errors
  }
  return companies;
}
