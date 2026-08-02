import { supabase } from './supabase';

type ErpStorePayload = {
  employees?: any[];
  [key: string]: any;
};

const LIVE_ID = 'live';
const BOOTSTRAP_FLAG = 'vetan_supabase_bootstrapped_v1';

function hasAnonKey(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_ANON_KEY);
}

function employeeCount(store: ErpStorePayload | null | undefined): number {
  return Array.isArray(store?.employees) ? store!.employees!.length : 0;
}

/** Pull the live ERP store from Supabase. Returns null if empty/unavailable. */
export async function pullStoreFromSupabase(): Promise<ErpStorePayload | null> {
  if (!hasAnonKey()) return null;
  try {
    const { data, error } = await supabase
      .from('vetan_erp_store')
      .select('payload, updated_at')
      .eq('id', LIVE_ID)
      .maybeSingle();

    if (error) {
      console.warn('[Supabase] pull failed:', error.message);
      return null;
    }
    const payload = data?.payload as ErpStorePayload | undefined;
    if (!payload || employeeCount(payload) === 0) return null;
    return payload;
  } catch (e) {
    console.warn('[Supabase] pull exception:', e);
    return null;
  }
}

/** Save the full ERP store to Supabase live row. */
export async function pushStoreToSupabase(store: ErpStorePayload): Promise<{ ok: boolean; error?: string }> {
  if (!hasAnonKey()) {
    return { ok: false, error: 'Missing VITE_SUPABASE_ANON_KEY' };
  }
  try {
    const { error } = await supabase.from('vetan_erp_store').upsert(
      {
        id: LIVE_ID,
        payload: store,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.warn('[Supabase] push failed:', error.message);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

/** Create a dated backup row (for April 2026+ archive safety). */
export async function createSupabaseBackup(
  store: ErpStorePayload,
  label: string,
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!hasAnonKey()) {
    return { ok: false, error: 'Missing VITE_SUPABASE_ANON_KEY' };
  }
  try {
    const { error } = await supabase.from('vetan_erp_backups').insert({
      label,
      payload: store,
      employee_count: employeeCount(store),
      note: note || null
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}

/**
 * If Supabase live store is empty, upload local/snapshot data once.
 * Also ensures a monthly backup label exists (YYYY-MM).
 */
export async function bootstrapSupabaseFromLocal(store: ErpStorePayload): Promise<{
  bootstrapped: boolean;
  backedUp: boolean;
  message: string;
}> {
  if (!hasAnonKey()) {
    return { bootstrapped: false, backedUp: false, message: 'Supabase key missing on Vercel' };
  }
  if (employeeCount(store) === 0) {
    return { bootstrapped: false, backedUp: false, message: 'Local store empty' };
  }

  const remote = await pullStoreFromSupabase();
  let bootstrapped = false;

  if (!remote) {
    const push = await pushStoreToSupabase(store);
    bootstrapped = push.ok;
    if (push.ok) {
      try {
        localStorage.setItem(BOOTSTRAP_FLAG, new Date().toISOString());
      } catch {
        // ignore
      }
    } else {
      return {
        bootstrapped: false,
        backedUp: false,
        message: push.error || 'Failed to upload store to Supabase'
      };
    }
  } else {
    // Keep Supabase as source of truth when it already has data
    bootstrapped = false;
  }

  const monthLabel = new Date().toISOString().slice(0, 7); // YYYY-MM
  let backedUp = false;
  try {
    const { data: existing } = await supabase
      .from('vetan_erp_backups')
      .select('id')
      .eq('label', monthLabel)
      .limit(1);

    if (!existing || existing.length === 0) {
      const source = remote && employeeCount(remote) > 0 ? remote : store;
      const res = await createSupabaseBackup(
        source,
        monthLabel,
        'Auto monthly backup (records from April 2026 onward)'
      );
      backedUp = res.ok;
    } else {
      backedUp = true;
    }
  } catch {
    backedUp = false;
  }

  return {
    bootstrapped,
    backedUp,
    message: bootstrapped
      ? 'First-time data uploaded to Supabase'
      : 'Supabase live store ready'
  };
}

export async function supabaseSyncStatus(): Promise<{
  configured: boolean;
  liveEmployees: number;
  lastUpdated: string | null;
}> {
  if (!hasAnonKey()) {
    return { configured: false, liveEmployees: 0, lastUpdated: null };
  }
  try {
    const { data, error } = await supabase
      .from('vetan_erp_store')
      .select('payload, updated_at')
      .eq('id', LIVE_ID)
      .maybeSingle();
    if (error || !data) {
      return { configured: true, liveEmployees: 0, lastUpdated: null };
    }
    return {
      configured: true,
      liveEmployees: employeeCount(data.payload as ErpStorePayload),
      lastUpdated: data.updated_at || null
    };
  } catch {
    return { configured: true, liveEmployees: 0, lastUpdated: null };
  }
}
