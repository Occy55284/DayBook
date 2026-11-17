-- Add Rejected status and rejection tracking columns
alter table public.gmc_requests
  drop constraint if exists gmc_requests_status_check;

alter table public.gmc_requests
  add constraint gmc_requests_status_check
  check (status in ('Submitted','Delivered','Approved','Rejected'));

alter table public.gmc_requests
  add column if not exists rejected_by text,
  add column if not exists rejected_at timestamptz;
