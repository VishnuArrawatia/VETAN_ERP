-- VETAN ERP permanent store on Supabase
-- Keep records from April 2026 onward (and forever).
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run

-- Live ERP database (full JSON snapshot matching the app store)
create table if not exists public.vetan_erp_store (
  id text primary key default 'live',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Point-in-time backups (monthly / manual) so data is never only in one browser
create table if not exists public.vetan_erp_backups (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  payload jsonb not null,
  employee_count integer,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists vetan_erp_backups_created_at_idx
  on public.vetan_erp_backups (created_at desc);

create index if not exists vetan_erp_backups_label_idx
  on public.vetan_erp_backups (label);

-- Seed empty live row if missing
insert into public.vetan_erp_store (id, payload)
values ('live', '{}'::jsonb)
on conflict (id) do nothing;

-- Frontend (Vercel) uses the Publishable/anon key today.
-- These policies allow the app to read/write. Tighten later with Auth roles.
alter table public.vetan_erp_store enable row level security;
alter table public.vetan_erp_backups enable row level security;

drop policy if exists vetan_erp_store_all on public.vetan_erp_store;
create policy vetan_erp_store_all
  on public.vetan_erp_store
  for all
  using (true)
  with check (true);

drop policy if exists vetan_erp_backups_all on public.vetan_erp_backups;
create policy vetan_erp_backups_all
  on public.vetan_erp_backups
  for all
  using (true)
  with check (true);
