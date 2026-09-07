/**
 * Shared store reconciliation (used by BOTH server/db.ts and client supabaseData.ts).
 *
 * Guarantee: no matter which writer is saving, records that exist on only ONE side
 * must never disappear. When two writers both edited the SAME record, we keep the
 * version carrying the later embedded timestamp (updated_at / modified_at /
 * created_at) and fall back to the caller-chosen "prefer" side for untimed records.
 *
 * This intentionally never hard-deletes: deletions in this ERP are soft
 * (status = SEPARATED), so unioning collections is always data-safe.
 */

export type StoreMergePrefer = 'base' | 'incoming';

export function recordTime(item: any): number | null {
  if (!item || typeof item !== 'object') return null;
  let best: number | null = null;
  for (const field of ['updated_at', 'modified_at', 'updatedAt', 'modifiedAt', 'created_at', 'createdAt']) {
    const v = item[field];
    if (v == null || v === '') continue;
    const t = typeof v === 'number' ? v : Date.parse(String(v));
    if (!Number.isNaN(t) && (best === null || t > best)) best = t;
  }
  return best;
}

function stableStringify(value: any): string {
  if (value === null || value === undefined) return String(value);
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const out: string[] = [];
  for (const key of Object.keys(value).sort()) {
    const v = value[key];
    if (v === undefined) continue;
    out.push(`${JSON.stringify(key)}:${stableStringify(v)}`);
  }
  return `{${out.join(',')}}`;
}

/** Deterministic record key: id-ish field, else content hash for keyless rows. */
export function recordKey(item: any): string {
  if (item === null || item === undefined) return '';
  if (typeof item === 'string') return `s:${item}`;
  if (typeof item !== 'object') return `${typeof item}:${String(item)}`;
  for (const field of ['id', 'username', 'code', 'key', 'name']) {
    const v = item[field];
    if (v !== undefined && v !== null && v !== '') return `${field}:${String(v)}`;
  }
  return `json:${stableStringify(item)}`;
}

/**
 * Union two record arrays by key.
 * Base items are added first; an incoming item only ever conflicts with an item
 * already placed from base. Same-key conflicts: later embedded timestamp wins;
 * ties (or untimed records) fall back to `prefer`.
 */
export function mergeRecordArrays(base: any[], incoming: any[], prefer: StoreMergePrefer): any[] {
  const resultMap = new Map<string, any>();
  const order: string[] = [];

  const add = (item: any, source: StoreMergePrefer) => {
    if (item === null || item === undefined) return;
    const key = recordKey(item);
    if (!key) return;
    const existing = resultMap.get(key);
    if (existing === undefined) {
      resultMap.set(key, item);
      order.push(key);
      return;
    }
    if (existing === item) return;
    // Only `incoming` items can conflict (base fills the map first).
    if (source !== 'incoming') return;
    const t1 = recordTime(existing);
    const t2 = recordTime(item);
    if (t1 !== null && t2 !== null && t1 !== t2) {
      if (t2 > t1) resultMap.set(key, item); // incoming record is newer
      return;
    }
    // ONE-SIDED TIMESTAMP RULE: when only ONE side carries an embedded timestamp,
    // the stamped side is treated as newer. Unstamped records are pre-stamping
    // copies — a record the user explicitly edited (and we stamped) must never
    // lose to an unstale, never-edited copy. This is the core guard that stops
    // employee-profile edits from silently reverting.
    if (t1 === null && t2 !== null) {
      resultMap.set(key, item); // incoming is explicitly stamped → newer
      return;
    }
    if (t1 !== null && t2 === null) {
      return; // existing is explicitly stamped → keep it
    }
    if (prefer === 'incoming') resultMap.set(key, item);
  };

  for (const it of base ?? []) add(it, 'base');
  for (const it of incoming ?? []) add(it, 'incoming');

  return order.map((k) => resultMap.get(k));
}

function pickScalar(base: any, incoming: any, prefer: StoreMergePrefer): any {
  if (base === undefined) return incoming;
  if (incoming === undefined) return base;
  const bJson = typeof base === 'object' ? stableStringify(base) : null;
  const iJson = typeof incoming === 'object' ? stableStringify(incoming) : null;
  if (bJson !== null || iJson !== null) {
    if (bJson === iJson) return base;
    const t1 = recordTime(base);
    const t2 = recordTime(incoming);
    if (t1 !== null && t2 !== null && t1 !== t2) return t2 > t1 ? incoming : base;
    // One-sided timestamp: the stamped side always wins (see mergeRecordArrays).
    if (t1 === null && t2 !== null) return incoming;
    if (t1 !== null && t2 === null) return base;
    return prefer === 'incoming' ? incoming : base;
  }
  return prefer === 'incoming' ? incoming : base;
}

/**
 * Merge two full ERP store payloads.
 * - Array values (record collections) are unioned by record key.
 * - Scalar / object values (settings etc.) use the `prefer` side on conflict.
 * - Keys present on only one side are always kept.
 */
export function mergeStores(base: any, incoming: any, prefer: StoreMergePrefer = 'incoming'): any {
  if (!base || typeof base !== 'object') return incoming ? { ...incoming } : {};
  if (!incoming || typeof incoming !== 'object') return { ...base };

  const keys = new Set<string>([...Object.keys(base), ...Object.keys(incoming)]);
  const merged: Record<string, any> = {};

  for (const key of keys) {
    const b = base[key];
    const i = incoming[key];
    if (Array.isArray(b) || Array.isArray(i)) {
      merged[key] = mergeRecordArrays(Array.isArray(b) ? b : [], Array.isArray(i) ? i : [], prefer);
    } else {
      merged[key] = pickScalar(b, i, prefer);
    }
  }
  return merged;
}
