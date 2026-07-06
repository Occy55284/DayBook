create table if not exists public.gmc_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  request_date date not null,
  requestor_name text not null,
  room_list text not null,
  room_count integer not null default 0,
  refreshment_total numeric(10,2) not null default 0,
  lunch_required boolean not null default false,
  lunch_details text,
  lunch_time time,
  lunch_cost numeric(10,2) not null default 0,
  notes text,
  status text not null default 'Submitted' check (status in ('Submitted','Delivered','Approved','Rejected')),
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_at timestamptz,
  total_cost numeric(10,2) generated always as (refreshment_total + lunch_cost) stored
);

alter table public.gmc_requests enable row level security;

-- For V1/simple internal use. Tighten this later once auth roles are added.
create policy "Allow all operations for anon during V1 pilot"
on public.gmc_requests
for all
using (true)
with check (true);
