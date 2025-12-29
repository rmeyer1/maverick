drop index if exists job_run_bullmq_job_id_idx;

create unique index if not exists job_run_bullmq_queue_idx
  on public.job_run (queue, bullmq_job_id);
