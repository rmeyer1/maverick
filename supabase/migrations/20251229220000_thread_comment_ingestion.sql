alter table public.thread
  add column if not exists fetched_at timestamptz,
  add column if not exists ingested_by_user_id uuid references auth.users(id);

alter table public.comment
  add column if not exists fetched_at timestamptz,
  add column if not exists ingested_by_user_id uuid references auth.users(id),
  add column if not exists depth integer;

create index if not exists comment_thread_parent_idx on public.comment (thread_id, parent_reddit_id);
