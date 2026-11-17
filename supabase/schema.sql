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
  monthly_target numeric check (monthly_target is null or monthly_target > 0), -- profit goal per calendar month (pounds); empty = no target
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

-- ---------------------------------------------------------------------------------------------
-- Invite-only sign-up (added 2026-11-15).
-- Public sign-up is switched OFF in the Supabase dashboard. People join with a one-time invite code
-- through the Edge Function supabase/functions/signup-with-invite, which creates the account itself.
-- ---------------------------------------------------------------------------------------------

-- Who runs Daybook: only these users can create invite codes.
-- To make yourself the admin, once, after you have signed up (run in the SQL Editor):
--   insert into public.app_admins (user_id) select id from auth.users where email = 'you@example.com';
create table public.app_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.app_admins enable row level security;
create policy "admins can see themselves" on public.app_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- One-time invite codes (like K7QM-X2PA-9WTD) with an expiry; they can be revoked.
create table public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  note text check (note is null or char_length(note) <= 80),
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz
);
create index invites_created_by_idx on public.invites (created_by);
create index invites_used_by_idx on public.invites (used_by);
alter table public.invites enable row level security;
create policy "admins see invites" on public.invites
  for select to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = (select auth.uid())));
create policy "admins create invites" on public.invites
  for insert to authenticated
  with check (exists (select 1 from public.app_admins a where a.user_id = (select auth.uid())));
create policy "admins revoke invites" on public.invites
  for update to authenticated
  using (exists (select 1 from public.app_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.app_admins a where a.user_id = (select auth.uid())));
-- An admin may only change revoked_at (they cannot "un-use" a code).
revoke update on public.invites from authenticated, anon;
grant update (revoked_at) on public.invites to authenticated;

-- A log of bad code attempts, so guessing can be slowed down. Only the sign-up function (service role) uses it,
-- so it deliberately has no policies (Supabase's advisor shows an info note about that; it is intended).
create table public.invite_attempts (
  id bigint generated always as identity primary key,
  at timestamptz not null default now()
);
alter table public.invite_attempts enable row level security;
create index invite_attempts_at_idx on public.invite_attempts (at);

-- Makes a new invite code. Runs with the caller's own rights, so only admins can use it.
create or replace function public.create_invite(p_note text default null, p_days integer default 7)
returns text
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no look-alikes: I, L, O, 0, 1
  bytes bytea;
  raw text;
  v_code text;
  i integer;
begin
  if not exists (select 1 from public.app_admins where user_id = (select auth.uid())) then
    raise exception 'Only an admin can create invite codes' using errcode = '42501';
  end if;
  if p_days is null or p_days < 1 or p_days > 90 then
    p_days := 7;
  end if;
  loop
    bytes := gen_random_bytes(12);
    raw := '';
    for i in 0..11 loop
      raw := raw || substr(alphabet, 1 + (get_byte(bytes, i) % 31), 1);
    end loop;
    v_code := substr(raw, 1, 4) || '-' || substr(raw, 5, 4) || '-' || substr(raw, 9, 4);
    begin
      insert into public.invites (code, note, created_by, expires_at)
      values (v_code, nullif(btrim(p_note), ''), (select auth.uid()), now() + make_interval(days => p_days));
      return v_code;
    exception when unique_violation then
      null; -- astronomically unlikely: just try another code
    end;
  end loop;
end;
$$;
revoke all on function public.create_invite(text, integer) from public, anon;
grant execute on function public.create_invite(text, integer) to authenticated;

-- History
-- 2026-11-12  pnl_entries created (trades).
-- 2026-11-13  pnl_commissions and pnl_settings added; pnl_entries.lot_size added.
-- 2026-11-15  invite-only sign-up: app_admins, invites, invite_attempts, create_invite().
-- 2026-11-17  pnl_settings.monthly_target added (nullable). For an existing database run:
--             alter table public.pnl_settings add column if not exists monthly_target numeric
--               check (monthly_target is null or monthly_target > 0);
