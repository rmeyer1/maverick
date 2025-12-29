import { Worker } from "bullmq";
import {
  getBullmqPrefix,
  getRedisConnectionOptions,
  jobNames,
  parseAggregateTrendsPayload,
  parseExtractThreadPayload,
  parseIngestThreadPayload,
  queueNames,
} from "@maverick/jobs";
import { createSupabaseAdminClient } from "@maverick/db";

const connection = getRedisConnectionOptions();
const prefix = getBullmqPrefix();

const ingestConcurrency = Number(process.env.WORKER_CONCURRENCY_INGEST ?? 2);
const extractConcurrency = Number(process.env.WORKER_CONCURRENCY_EXTRACT ?? 1);
const aggregateConcurrency = Number(
  process.env.WORKER_CONCURRENCY_AGGREGATE ?? 1
);

function logStart(queue: string, jobId: string) {
  console.log(`[worker] start ${queue} job=${jobId}`);
}

function logComplete(queue: string, jobId: string, ms: number) {
  console.log(`[worker] done ${queue} job=${jobId} durationMs=${ms}`);
}

function logFailure(queue: string, jobId: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[worker] fail ${queue} job=${jobId} error=${message}`);
}

const ingestWorker = new Worker(
  queueNames.ingest,
  async (job) => {
    const start = Date.now();
    logStart(queueNames.ingest, job.id ?? "unknown");

    const payload = parseIngestThreadPayload(job.data);

    console.log(
      `[worker] ingest payload url=${payload.threadUrl} requestedBy=${payload.requestedBy ?? "n/a"}`
    );

    // TODO: fetch Reddit thread JSON and persist to Supabase.
    logComplete(queueNames.ingest, job.id ?? "unknown", Date.now() - start);
  },
  {
    connection,
    prefix,
    concurrency: ingestConcurrency,
  }
);

const extractWorker = new Worker(
  queueNames.extract,
  async (job) => {
    const start = Date.now();
    logStart(queueNames.extract, job.id ?? "unknown");

    const payload = parseExtractThreadPayload(job.data);

    console.log(
      `[worker] extract payload threadId=${payload.threadId} provider=${payload.provider ?? "n/a"}`
    );

    // TODO: load thread + comments, call LLM, persist extraction.
    logComplete(queueNames.extract, job.id ?? "unknown", Date.now() - start);
  },
  {
    connection,
    prefix,
    concurrency: extractConcurrency,
  }
);

const aggregateWorker = new Worker(
  queueNames.aggregate,
  async (job) => {
    const start = Date.now();
    logStart(queueNames.aggregate, job.id ?? "unknown");

    const payload = parseAggregateTrendsPayload(job.data);

    console.log(
      `[worker] aggregate payload windowDays=${payload.windowDays ?? "default"}`
    );

    // TODO: compute trend snapshots and persist results.
    logComplete(queueNames.aggregate, job.id ?? "unknown", Date.now() - start);
  },
  {
    connection,
    prefix,
    concurrency: aggregateConcurrency,
  }
);

async function updateJobRun(jobId: string, data: Record<string, unknown>) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("job_run").update(data).eq("bullmq_job_id", jobId);
}

[ingestWorker, extractWorker, aggregateWorker].forEach((worker) => {
  worker.on("active", async (job) => {
    if (!job?.id) return;
    await updateJobRun(String(job.id), { status: "active", progress: 0 });
  });

  worker.on("completed", async (job) => {
    if (!job?.id) return;
    await updateJobRun(String(job.id), { status: "completed", progress: 100 });
  });

  worker.on("failed", async (job, err) => {
    logFailure(worker.name, job?.id ?? "unknown", err);
    if (!job?.id) return;
    const message = err instanceof Error ? err.message : String(err);
    await updateJobRun(String(job.id), { status: "failed", error: message });
  });
});

async function shutdown(signal: string) {
  console.log(`[worker] received ${signal}, shutting down...`);
  await Promise.all([
    ingestWorker.close(),
    extractWorker.close(),
    aggregateWorker.close(),
  ]);
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

console.log(
  `[worker] ready prefix=${prefix} ingest=${ingestConcurrency} extract=${extractConcurrency} aggregate=${aggregateConcurrency}`
);
