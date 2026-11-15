-- Daybook database design (Supabase / Postgres).
--
-- This file mirrors the LIVE database (checked 2026-11-15) so the app can be rebuilt on a fresh
-- Supabase project: open the project's SQL Editor and run this file once on an empty database.
-- Keep it in step with any future changes (add a dated note at the bottom).
--
-- Every table is locked per user: row-level security means a signed-in user can only
-- see and change their own rows (user_id = auth.uid()). Deleting a user deletes their rows.

-- One row per trading day: the day's profit/loss (negative = loss) and, optionally, the lot size traded.
create table public.pnl_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account text not null default 'Main Account',
  entry_date date not null,
  amount numeric not null,
  lot_size numeric check (lot_size is null or lot_size > 0), -- display only, never used in sums
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, account, entry_date)
);

-- One row per Sunday: the broker commission paid that day for the Monday-Friday week before it.
create table public.pnl_commissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account text not null default 'Main Account',
  entry_date date not null check (extract(dow from entry_date) = 0), -- must be a Sunday
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, account, entry_date)
);

-- One row per user (and account): settings such as the broker's commission percentage.
create table public.pnl_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  account text not null default 'Main Account',
  commission_pct numeric not null default 30 check (commission_pct >= 0 and commission_pct <= 100),
  updated_at timestamptz not null default now(),
  unique (user_id, account)
);

-- Row-level security: own rows only.
alter table public.pnl_entries enable row level security;
alter table public.pnl_commissions enable row level security;
alter table public.pnl_settings enable row level security;

create policy "own rows: select" on public.pnl_entries for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows: insert" on public.pnl_entries for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own rows: update" on public.pnl_entries for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows: delete" on public.pnl_entries for delete to authenticated using (user_id = (select auth.uid()));

create policy "own rows: select" on public.pnl_commissions for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows: insert" on public.pnl_commissions for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own rows: update" on public.pnl_commissions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows: delete" on public.pnl_commissions for delete to authenticated using (user_id = (select auth.uid()));

create policy "own rows: select" on public.pnl_settings for select to authenticated using (user_id = (select auth.uid()));
create policy "own rows: insert" on public.pnl_settings for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own rows: update" on public.pnl_settings for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own rows: delete" on public.pnl_settings for delete to authenticated using (user_id = (select auth.uid()));

-- History
-- 2026-11-12  pnl_entries created (trades).
-- 2026-11-13  pnl_commissions and pnl_settings added; pnl_entries.lot_size added.
