alter table public.extraction
  add column if not exists schema_version text;
