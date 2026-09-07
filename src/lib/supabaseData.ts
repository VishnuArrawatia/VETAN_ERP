import { supabase } from './supabase';
import { mergeStores } from './storeMerge';

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

export type PushResult = { ok: boolean; error?: string; conflict?: boolean; merged?: ErpStorePayload };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Save the full ERP store to the Supabase live row using COMPARE-AND-SWAP:
 *
 * 1. Read the current remote row (payload + updated_at).
 * 2. If the remote already has data, UNION-MERGE it with the local store instead
 *    of overwriting — records that exist only on the remote (loans, payslips,
 *    HODs, another machine's edits) can never be wiped by this browser.
 * 3. Write with `.eq('updated_at', <version we read>)`. If 0 rows matched,
 *    another writer moved the version → refetch, re-merge, and retry.
 */
export async function pushStoreToSupabase(store: ErpStorePayload): Promise<PushResult> {
  if (!hasAnonKey()) {
    return { ok: false, error: 'Missing VITE_SUPABASE_ANON_KEY' };
  }
  const MAX_ATTEMPTS = 3;
  let lastError = 'Supabase push failed';

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      // 1) Read current remote version.
      const { data: row, error: readErr } = await supabase
        .from('vetan_erp_store')
        .select('payload, updated_at')
        .eq('id', LIVE_ID)
        .maybeSingle();
      if (readErr) {
        lastError = readErr.message;
        if (attempt < MAX_ATTEMPTS) { await sleep(600 * attempt); continue; }
        return { ok: false, error: readErr.message };
      }

      const remotePayload = row?.payload as ErpStorePayload | undefined;
      const remoteUpdatedAt = row?.updated_at || '';
      const remoteEmpty =
        !remotePayload || typeof remotePayload !== 'object' || employeeCount(remotePayload) === 0;

      let payload = store;
      if (!remoteEmpty) {
        // Union-merge: keep every record the remote has that we don't know about.
        // Same-ID conflicts prefer our copy ('base' = the store being pushed),
        // unless the remote copy carries a strictly newer embedded timestamp.
        payload = mergeStores(store, remotePayload, 'base');
      }

      const newUpdatedAt = new Date().toISOString();

      // 2) Write.
      if (remoteEmpty) {
        // First bootstrap — no version to guard against.
        const { error } = await supabase.from('vetan_erp_store').upsert(
          { id: LIVE_ID, payload, updated_at: newUpdatedAt },
          { onConflict: 'id' }
        );
        if (error) {
          lastError = error.message;
          if (attempt < MAX_ATTEMPTS) { await sleep(600 * attempt); continue; }
          return { ok: false, error: error.message };
        }
        return { ok: true, merged: payload };
      }

      const { data: updated, error: updErr } = await supabase
        .from('vetan_erp_store')
        .update({ payload, updated_at: newUpdatedAt })
        .eq('id', LIVE_ID)
        .eq('updated_at', remoteUpdatedAt)
        .select('id');

      if (updErr) {
        lastError = updErr.message;
        if (attempt < MAX_ATTEMPTS) { await sleep(600 * attempt); continue; }
        return { ok: false, error: updErr.message };
      }
      if (Array.isArray(updated) && updated.length === 0) {
        // CAS conflict — another writer moved the version. Re-read + re-merge + retry.
        lastError = `Concurrent update conflict (attempt ${attempt}/${MAX_ATTEMPTS})`;
        console.warn(`[Supabase] push conflict attempt ${attempt}, re-merging...`);
        if (attempt < MAX_ATTEMPTS) { await sleep(700 * attempt); continue; }
        return { ok: false, error: lastError, conflict: true };
      }
      return { ok: true, merged: payload };
    } catch (e: any) {
      lastError = e?.message || String(e);
      if (attempt < MAX_ATTEMPTS) { await sleep(600 * attempt); continue; }
      return { ok: false, error: lastError };
    }
  }
  return { ok: false, error: lastError };
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
