create extension if not exists "pgcrypto";

create table if not exists public.subreddit (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  title text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.thread (
  id uuid primary key default gen_random_uuid(),
  subreddit_id uuid not null references public.subreddit(id) on delete cascade,
  reddit_id text not null unique,
  title text,
  author text,
  url text,
  score integer,
  num_comments integer,
  created_utc timestamptz,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.comment (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.thread(id) on delete cascade,
  reddit_id text not null unique,
  parent_reddit_id text,
  author text,
  body text,
  score integer,
  created_utc timestamptz,
  raw_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.extraction (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.thread(id) on delete cascade,
  provider text,
  model text,
  prompt_version text,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  output jsonb,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists public.job_run (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  started_at timestamptz,
  finished_at timestamptz,
  metadata jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists thread_subreddit_created_utc_idx on public.thread (subreddit_id, created_utc);
create index if not exists comment_thread_score_idx on public.comment (thread_id, score);
create index if not exists extraction_thread_idx on public.extraction (thread_id);

alter table public.subreddit enable row level security;
alter table public.thread enable row level security;
alter table public.comment enable row level security;
alter table public.extraction enable row level security;
alter table public.job_run enable row level security;

create policy "subreddit_select_authenticated" on public.subreddit
  for select to authenticated using (true);
create policy "subreddit_insert_authenticated" on public.subreddit
  for insert to authenticated with check (true);
create policy "subreddit_update_authenticated" on public.subreddit
  for update to authenticated using (true) with check (true);
create policy "subreddit_delete_authenticated" on public.subreddit
  for delete to authenticated using (true);

create policy "thread_select_authenticated" on public.thread
  for select to authenticated using (true);
create policy "thread_insert_authenticated" on public.thread
  for insert to authenticated with check (true);
create policy "thread_update_authenticated" on public.thread
  for update to authenticated using (true) with check (true);
create policy "thread_delete_authenticated" on public.thread
  for delete to authenticated using (true);

create policy "comment_select_authenticated" on public.comment
  for select to authenticated using (true);
create policy "comment_insert_authenticated" on public.comment
  for insert to authenticated with check (true);
create policy "comment_update_authenticated" on public.comment
  for update to authenticated using (true) with check (true);
create policy "comment_delete_authenticated" on public.comment
  for delete to authenticated using (true);

create policy "extraction_select_authenticated" on public.extraction
  for select to authenticated using (true);
create policy "extraction_insert_authenticated" on public.extraction
  for insert to authenticated with check (true);
create policy "extraction_update_authenticated" on public.extraction
  for update to authenticated using (true) with check (true);
create policy "extraction_delete_authenticated" on public.extraction
  for delete to authenticated using (true);

create policy "job_run_select_authenticated" on public.job_run
  for select to authenticated using (true);
create policy "job_run_insert_authenticated" on public.job_run
  for insert to authenticated with check (true);
create policy "job_run_update_authenticated" on public.job_run
  for update to authenticated using (true) with check (true);
create policy "job_run_delete_authenticated" on public.job_run
  for delete to authenticated using (true);
