create extension if not exists "pgcrypto";

create table if not exists public.job_run (
  id uuid primary key default gen_random_uuid(),
  bullmq_job_id text,
  queue text,
  type text,
  status text not null default 'queued' check (status in ('queued', 'active', 'completed', 'failed')),
  progress integer,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.job_run
  add column if not exists bullmq_job_id text,
  add column if not exists queue text,
  add column if not exists type text,
  add column if not exists progress integer,
  add column if not exists error text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

alter table public.job_run
  drop constraint if exists job_run_status_check;

alter table public.job_run
  add constraint job_run_status_check
  check (status in ('queued', 'active', 'completed', 'failed'));

create unique index if not exists job_run_bullmq_job_id_idx
  on public.job_run (bullmq_job_id);

create index if not exists job_run_status_idx
  on public.job_run (status);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger job_run_set_updated_at
before update on public.job_run
for each row
execute function public.set_updated_at();

alter table public.job_run enable row level security;

create policy "job_run_select_authenticated" on public.job_run
  for select to authenticated using (true);
create policy "job_run_insert_authenticated" on public.job_run
  for insert to authenticated with check (true);
create policy "job_run_update_authenticated" on public.job_run
  for update to authenticated using (true) with check (true);
