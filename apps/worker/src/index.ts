import { readFile } from "node:fs/promises";
import path from "node:path";
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
import { createSupabaseAdminClient, saveThreadWithComments } from "@maverick/db";
import {
  extractionPromptVersion,
  extractionSchemaVersion,
  extractionSchemaV1,
  normalizeRedditThread,
  validateExtractionV1,
} from "@maverick/shared";
import { generateJson } from "@maverick/llm";

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

let promptTemplateCache: string | null = null;

async function loadPromptTemplate() {
  if (promptTemplateCache) return promptTemplateCache;
  const repoRoot = path.resolve(process.cwd(), "..", "..");
  const promptPath = path.join(repoRoot, "prompts", "extract.v1.md");
  promptTemplateCache = await readFile(promptPath, "utf-8");
  return promptTemplateCache;
}

function buildExtractionPrompt(thread: Record<string, unknown>, comments: unknown[]) {
  return loadPromptTemplate().then((template) =>
    template
      .replace("{{thread_json}}", JSON.stringify(thread, null, 2))
      .replace("{{comments_json}}", JSON.stringify(comments, null, 2))
  );
}

function getTopCommentLimit() {
  return Number(process.env.EXTRACT_TOP_COMMENTS ?? 20);
}

function getDefaultProvider() {
  return process.env.LLM_PROVIDER_DEFAULT ?? "openai";
}

function getDefaultModel() {
  return process.env.LLM_MODEL_DEFAULT ?? "default";
}

function getTemperature() {
  const value = Number(process.env.LLM_TEMPERATURE ?? 0.2);
  return Number.isNaN(value) ? 0.2 : value;
}

const allowedHosts = new Set([
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "new.reddit.com",
  "redd.it",
]);

async function fetchRedditThread(url: string) {
  const parsed = new URL(url);
  if (!allowedHosts.has(parsed.hostname)) {
    throw new Error(`Unsupported reddit host: ${parsed.hostname}`);
  }

  const jsonUrl = buildJsonUrl(parsed);
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    Number(process.env.REDDIT_FETCH_TIMEOUT_MS ?? 8000)
  );

  try {
    const response = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "maverick-worker/0.1",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Reddit fetch failed with status ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function buildJsonUrl(url: URL) {
  if (url.hostname === "redd.it") {
    const id = url.pathname.replace("/", "").trim();
    return `https://www.reddit.com/comments/${id}.json`;
  }

  if (url.pathname.endsWith(".json")) {
    return url.toString();
  }

  return `${url.origin}${url.pathname}.json`;
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

    const raw = await fetchRedditThread(payload.threadUrl);
    const normalized = normalizeRedditThread(raw);

    const result = await saveThreadWithComments(
      normalized.thread,
      normalized.comments,
      {
        ingestedByUserId: payload.requestedBy ?? null,
        fetchedAt: new Date(),
      }
    );

    console.log(
      `[worker] ingest saved threadId=${result.threadId} comments=${result.commentCount}`
    );
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

    const supabase = createSupabaseAdminClient();
    const provider = payload.provider ?? getDefaultProvider();
    const model = payload.model ?? getDefaultModel();

    const { data: thread, error: threadError } = await supabase
      .from("thread")
      .select("id,title,author,url,created_utc,raw_json")
      .eq("id", payload.threadId)
      .single();

    if (threadError || !thread) {
      throw threadError ?? new Error("Thread not found for extraction.");
    }

    const { data: comments, error: commentError } = await supabase
      .from("comment")
      .select("author,body,score,created_utc,reddit_id,parent_reddit_id")
      .eq("thread_id", payload.threadId)
      .order("score", { ascending: false, nullsFirst: false })
      .limit(getTopCommentLimit());

    if (commentError) {
      throw commentError;
    }

    const existingExtraction = await supabase
      .from("extraction")
      .select("id")
      .eq("thread_id", payload.threadId)
      .eq("schema_version", extractionSchemaVersion)
      .eq("prompt_version", extractionPromptVersion)
      .eq("provider", provider)
      .eq("model", model)
      .maybeSingle();

    if (existingExtraction.data?.id) {
      console.log(
        `[worker] extraction exists threadId=${payload.threadId} extractionId=${existingExtraction.data.id}`
      );
      logComplete(queueNames.extract, job.id ?? "unknown", Date.now() - start);
      return;
    }

    const prompt = await buildExtractionPrompt(
      {
        title: thread.title,
        author: thread.author,
        url: thread.url,
        created_utc: thread.created_utc,
        selftext:
          typeof (thread.raw_json as Record<string, unknown> | null)?.selftext ===
          "string"
            ? (thread.raw_json as Record<string, unknown>).selftext
            : null,
      },
      (comments ?? []).map((comment) => ({
        author: comment.author,
        body: comment.body,
        score: comment.score,
        created_utc: comment.created_utc,
        reddit_id: comment.reddit_id,
        parent_reddit_id: comment.parent_reddit_id,
      }))
    );

    const llmResponse = await generateJson({
      provider,
      model,
      prompt,
      schema: extractionSchemaV1,
      temperature: getTemperature(),
    });

    const validated = validateExtractionV1(llmResponse.data);

    const { error: extractionError } = await supabase
      .from("extraction")
      .upsert(
        {
          thread_id: payload.threadId,
          provider,
          model,
          prompt_version: extractionPromptVersion,
          schema_version: extractionSchemaVersion,
          status: "succeeded",
          output: validated,
          extracted_json: validated,
        },
        { onConflict: "thread_id,schema_version,prompt_version,provider,model" }
      );

    if (extractionError) {
      throw extractionError;
    }

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

async function updateJobRun(
  jobId: string,
  queue: string,
  data: Record<string, unknown>
) {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("job_run")
    .update(data)
    .eq("bullmq_job_id", jobId)
    .eq("queue", queue);
}

[ingestWorker, extractWorker, aggregateWorker].forEach((worker) => {
  worker.on("active", async (job) => {
    if (!job?.id) return;
    await updateJobRun(String(job.id), worker.name, {
      status: "active",
      progress: 0,
    });
  });

  worker.on("completed", async (job) => {
    if (!job?.id) return;
    await updateJobRun(String(job.id), worker.name, {
      status: "completed",
      progress: 100,
    });
  });

  worker.on("failed", async (job, err) => {
    logFailure(worker.name, job?.id ?? "unknown", err);
    if (!job?.id) return;
    const message = err instanceof Error ? err.message : String(err);
    await updateJobRun(String(job.id), worker.name, {
      status: "failed",
      error: message,
    });
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
