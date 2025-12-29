import { NextResponse } from "next/server";
import { enqueueIngestThread, ingestThreadSchema, queueNames, jobNames } from "@maverick/jobs";
import { createSupabaseAdminClient } from "@maverick/db";
import { getClientKey, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { allowed, remaining, resetAt } = rateLimit(getClientKey(request), {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 30),
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: {
          "x-ratelimit-remaining": String(remaining),
          "x-ratelimit-reset": String(resetAt),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = ingestThreadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const job = await enqueueIngestThread(parsed.data);
  const supabase = createSupabaseAdminClient();
  const { data: jobRun, error } = await supabase
    .from("job_run")
    .insert({
      bullmq_job_id: String(job.id),
      queue: queueNames.ingest,
      type: jobNames.ingestThread,
      status: "queued",
      progress: 0,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "job_run_insert_failed" }, { status: 500 });
  }

  return NextResponse.json(
    { jobId: job.id, jobRunId: jobRun?.id, status: "queued" },
    {
      headers: {
        "x-ratelimit-remaining": String(remaining),
        "x-ratelimit-reset": String(resetAt),
      },
    }
  );
}
