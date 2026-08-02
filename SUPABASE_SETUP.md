# Supabase Permanent Data Setup (April 2026+)

Yeh steps ek baar karo. Uske baad VETAN ERP data Supabase cloud pe safe rahega — sirf browser/laptop pe nahi.

## Step 1 — SQL schema chalao

1. [supabase.com](https://supabase.com) kholo
2. Project **VETAN_ERP** kholo
3. Left side **SQL Editor** pe click karo
4. **New query** pe click karo
5. Repo file `supabase/schema.sql` ka **poora** content copy-paste karo
6. **Run** dabao
7. Success message aana chahiye

## Step 2 — Vercel key check

Vercel → Project → Settings → Environment Variables:

- `VITE_SUPABASE_ANON_KEY` = Supabase **Publishable** key (`sb_publishable_...`)

URL code me already set hai.

## Step 3 — Deploy / Merge PR

Code merge + Vercel Ready hone ke baad:

1. VETAN ERP me login (`vishnu` / `Varrawatia`)
2. Left menu → **Database Health** (ya similar)
3. **Upload / Sync to Supabase** dabao
4. Status me employees count dikhna chahiye

## Step 4 — Verify in Supabase

Supabase → **Table Editor**:

- `vetan_erp_store` → row `live` (poora ERP JSON)
- `vetan_erp_backups` → monthly/manual backups

## Safety model

| Layer | Kaam |
|---|---|
| `vetan_erp_store` | Live permanent database |
| `vetan_erp_backups` | Monthly + manual copies |
| Browser localStorage | Fast local cache |
| Repo JSON snapshot | First install fallback |

## Later (company portal / VS Code)

- Supabase hi source of truth rahega
- Naya laptop / VS Code / company portal same Supabase project se connect kar sakte ho
- Data delete nahi hoga bas browser clear karne se

## Note

Abhi RLS policies open hain (frontend anon key ke liye). Baad me Auth roles se tight karenge.
