-- VETAN ERP — BACKUP TABLE CLEANUP (free-tier space recovery)
--
-- KAISE CHALAYE:
-- 1. https://supabase.com/dashboard → project VETAN_ERP → SQL Editor
-- 2. New Query → ye poora file paste karo
-- 3. Pehle DIAGNOSTIC queries run karo (section A) — numbers dekho
-- 4. Phir CLEANUP (section B) run karo
-- 5. Verify (section C)
--
-- SAFETY: sirf 'auto-<date>' label wale backups delete hote hain.
-- Manual backups (pre-restore/purge wale) SAFE rehte hain.
-- Recent 7 din ke auto-backups bhi SAFE rehte hain.

-- ============================================================
-- SECTION A — DIAGNOSTIC (pehle ye chalao, output dekho)
-- ============================================================

-- A1. Backup table kitni badi hai?
SELECT count(*) AS total_backups,
       pg_size_pretty(sum(length(payload::text))::bigint) AS payload_text_size,
       pg_size_pretty(pg_total_relation_size('public.vetan_erp_backups')) AS table_size_on_disk,
       min(created_at)::date AS oldest,
       max(created_at)::date AS newest
FROM public.vetan_erp_backups;

-- A2. Month-wise backup count + size
SELECT date_trunc('month', created_at)::date AS month,
       count(*) AS backups,
       sum(CASE WHEN label LIKE 'auto-%' THEN 1 ELSE 0 END) AS auto_backups,
       pg_size_pretty(sum(length(payload::text))::bigint) AS size
FROM public.vetan_erp_backups
GROUP BY 1 ORDER BY 1;

-- A3. Live store ka size (bloat included)
SELECT pg_size_pretty(pg_total_relation_size('public.vetan_erp_store')) AS store_table_size;

-- A4. Poore database ka size (500 MB limit ka yahi hai)
SELECT pg_database_size(current_database()) AS bytes,
       pg_size_pretty(pg_database_size(current_database())) AS db_size;

-- ============================================================
-- SECTION B — CLEANUP (diagnostics dekhne ke BAAD chalao)
-- 7 din se purane auto-backups delete — manual backups safe
-- ============================================================

BEGIN;

CREATE TEMP TABLE _deleted_backups AS
SELECT id, label, created_at FROM public.vetan_erp_backups
WHERE label LIKE 'auto-%'
  AND created_at < now() - interval '7 days';

DELETE FROM public.vetan_erp_backups b
USING _deleted_backups d
WHERE b.id = d.id;

SELECT count(*) AS deleted_count,
       min(created_at)::date AS deleted_from,
       max(created_at)::date AS deleted_to
FROM _deleted_backups;

COMMIT;

-- ============================================================
-- SECTION C — SPACE RECLAIM (cleanup ke baad)
-- ============================================================

-- C1. Table bloat reclaim (brief lock hota hai, seconds me ho jata hai)
VACUUM (FULL, ANALYZE) public.vetan_erp_backups;
VACUUM (FULL, ANALYZE) public.vetan_erp_store;

-- C2. Verify — ab total DB size check karo
SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size_after;

-- ============================================================
-- EXPECTED RESULT:
--   Deleted: ~15-20 rows (Sep-07 ke baad ke auto-backups)
--   Space: ~100 MB+ free (backup table ~5.7 MB/row + bloat)
--   DB size 500 MB limit se door aa jayega
--
-- NOTE (egress ke liye): egress 5 GB/month limit code-level fix
-- maangta hai — backup retention code me add karna + 5.7 MB blob
-- ko normalized tables pe migrate karna (SQL already ready:
-- execute_in_sql_editor.sql + 002_rls_policies.sql). Buffy ke
-- saath bolo to code fix kar dega.
-- ============================================================
