alter table public.extraction
  add column if not exists extracted_json jsonb,
  add column if not exists schema_version text;

create unique index if not exists extraction_unique_idx
  on public.extraction (
    thread_id,
    schema_version,
    prompt_version,
    provider,
    model
  );
