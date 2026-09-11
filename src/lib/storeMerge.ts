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

/**
 * PHASE-2B TOMBSTONES — durable deletion metadata.
 *
 * The union merge above intentionally never hard-deletes (deletions in this ERP
 * are soft). That is data-safe for records that still exist, but it has a fatal
 * flaw for records that were genuinely REMOVED: a stale instance holding a copy
 * of the deleted record re-adds it during the OCC conflict/RMW merge — the
 * "delete resurrection" bug.
 *
 * A tombstone is a small entry recording WHEN a record was deleted. When a
 * merge would re-introduce a record whose tombstone is NEWER than the record's
 * own timestamp, the tombstone wins and the record stays deleted. A record
 * legitimately re-created AFTER the deletion carries a newer timestamp and is
 * allowed back in — no permanent blacklist, no destructive migration.
 *
 * Tombstones live in the store payload itself (data.tombstones) and therefore
 * persist through the EXISTING authoritative persistence machinery — no second
 * architecture. Legacy payloads without tombstones keep working untouched.
 */
export const TOMBSTONE_KEYS = ['tombstones'] as const;

export type Tombstones = Record<string, Record<string, { deleted_at: string }>>;

export function getTombstones(store: any): Tombstones {
  const t = (store && typeof store === 'object' ? (store as any).tombstones : null);
  return t && typeof t === 'object' ? t : {};
}

/**
 * True when the merge must SUPPRESS this record: a tombstone exists for its
 * collection+key and is newer than the record's own timestamp. A record
 * re-created after the deletion (recordTime > deleted_at) is NOT suppressed.
 * Untimed records use the exact reference equality "same object that was
 * tombstoned cannot re-enter" — legacy copies without timestamps from a stale
 * store are suppressed only when the tombstone postdates the store's version
 * timestamp (storeTs), which is the last time we know that copy was valid.
 */
export function isTombstoned(
  tombstones: Tombstones,
  collection: string,
  item: any,
  storeTs?: number | null
): boolean {
  if (!item || typeof item !== 'object') return false;
  const coll = tombstones[collection];
  if (!coll) return false;
  const key = recordKey(item);
  if (!key) return false;
  const entry = coll[key];
  if (!entry || !entry.deleted_at) return false;
  const delT = Date.parse(entry.deleted_at);
  if (Number.isNaN(delT)) return false;
  const recT = recordTime(item);
  if (recT !== null) return recT <= delT; // record not newer than its deletion
  if (storeTs !== null && storeTs !== undefined && !Number.isNaN(storeTs)) {
    return delT >= storeTs; // tombstone postdates the stale store's validity
  }
  return false; // cannot prove staleness — never silently drop data
}

/** Record a deletion in the store's tombstone map (mutates + returns store). */
export function addTombstone(store: any, collection: string, item: any): void {
  if (!store || typeof store !== 'object' || !item) return;
  const key = recordKey(item);
  if (!key) return;
  if (!store.tombstones || typeof store.tombstones !== 'object') store.tombstones = {};
  if (!store.tombstones[collection] || typeof store.tombstones[collection] !== 'object') store.tombstones[collection] = {};
  store.tombstones[collection][key] = { deleted_at: new Date().toISOString() };
}

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
 *
 * PHASE-2B: records whose tombstone is newer than the record itself are
 * SUPPRESSED on either side, so a stale copy of a deleted record cannot
 * resurrect through the union. Tombstones themselves (the `tombstones` key)
 * are merged by mergeStores so deletions made on ANY instance survive.
 */
export function mergeRecordArrays(base: any[], incoming: any[], prefer: StoreMergePrefer, opts?: { tombstones?: Tombstones; collection?: string; baseTs?: number | null; incomingTs?: number | null }): any[] {
  const tombstones = opts?.tombstones || {};
  const collection = opts?.collection || '';
  const resultMap = new Map<string, any>();
  const order: string[] = [];

  const add = (item: any, source: StoreMergePrefer) => {
    if (item === null || item === undefined) return;
    const key = recordKey(item);
    if (!key) return;
    const existing = resultMap.get(key);
    if (existing === undefined) {
      // PHASE-2B: tombstone suppression for one-sided records. A tombstoned
      // record that exists on only ONE side must not (re-)enter the result.
      if (collection) {
        const storeTs = source === 'base' ? opts?.baseTs : opts?.incomingTs;
        if (isTombstoned(tombstones, collection, item, storeTs)) return;
      }
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

  // PHASE-2B final pass: a tombstone newer than the surviving record removes it
  // even when the record existed on BOTH sides (the conflict resolution above
  // cannot see tombstones). Hints give untimed records a freshness bound.
  if (collection) {
    const laterTs = [opts?.baseTs, opts?.incomingTs].filter((x): x is number => x !== null && x !== undefined && !Number.isNaN(x));
    const boundTs = laterTs.length ? Math.max(...laterTs) : null;
    for (const k of order) {
      if (isTombstoned(tombstones, collection, resultMap.get(k), boundTs)) {
        resultMap.delete(k);
      }
    }
  }

  return order.map((k) => resultMap.get(k)).filter((x) => x !== undefined);
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
 * - PHASE-2B: `tombstones` maps are unioned by key with the NEWEST deleted_at
 *   winning, and tombstoned records are suppressed from the merged arrays —
 *   a stale full-blob writer can no longer resurrect deleted records.
 */
export function mergeStores(base: any, incoming: any, prefer: StoreMergePrefer = 'incoming', tsHints?: { baseTs?: number | null; incomingTs?: number | null }): any {
  if (!base || typeof base !== 'object') return incoming ? { ...incoming } : {};
  if (!incoming || typeof incoming !== 'object') return { ...base };

  // PHASE-2B: tombstones must union FIRST so suppression below sees the
  // complete deletion picture from BOTH sides.
  const tb: Tombstones = {};
  const tBase = getTombstones(base);
  const tInc = getTombstones(incoming);
  const colls = new Set<string>([...Object.keys(tBase), ...Object.keys(tInc)]);
  for (const coll of colls) {
    tb[coll] = {};
    const bColl = tBase[coll] || {};
    const iColl = tInc[coll] || {};
    for (const k of new Set<string>([...Object.keys(bColl), ...Object.keys(iColl)])) {
      const b = bColl[k], i = iColl[k];
      if (b && i) {
        const bt = Date.parse(b.deleted_at || ''), it = Date.parse(i.deleted_at || '');
        tb[coll][k] = (!Number.isNaN(it) && (Number.isNaN(bt) || it >= bt)) ? i : b;
      } else tb[coll][k] = (b || i) as { deleted_at: string };
    }
  }
  // Store version timestamps: when a tombstone exists on one side only, the
  // other side's store-level updated_at (if any) bounds how fresh its copies
  // of the record can possibly be (see isTombstoned one-sided rule).
  const baseStoreTs = tsHints?.baseTs !== undefined ? tsHints.baseTs : (Date.parse((base as any)?.updated_at || '') || null);
  const incStoreTs = tsHints?.incomingTs !== undefined ? tsHints.incomingTs : (Date.parse((incoming as any)?.updated_at || '') || null);
  const opts = { tombstones: tb, baseTs: baseStoreTs, incomingTs: incStoreTs };

  const keys = new Set<string>([...Object.keys(base), ...Object.keys(incoming)]);
  const merged: Record<string, any> = {};

  for (const key of keys) {
    const b = base[key];
    const i = incoming[key];
    if (key === 'tombstones') {
      merged[key] = tb;
      continue;
    }
    if (Array.isArray(b) || Array.isArray(i)) {
      merged[key] = mergeRecordArrays(Array.isArray(b) ? b : [], Array.isArray(i) ? i : [], prefer, { ...opts, collection: key });
    } else {
      merged[key] = pickScalar(b, i, prefer);
    }
  }
  return merged;
}
