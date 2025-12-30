import { NextResponse } from "next/server";
import {
  aggregateTrendsSchema,
  enqueueAggregateTrends,
  jobNames,
  queueNames,
} from "@maverick/jobs";
import { createSupabaseAdminClient } from "@maverick/db";

function extractSecret(request: Request) {
  const bearer = request.headers.get("authorization");
  if (bearer?.toLowerCase().startsWith("bearer ")) {
    return bearer.slice("bearer ".length).trim();
  }
  return request.headers.get("x-cron-secret");
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "cron_secret_not_configured" }, { status: 500 });
  }

  const provided = extractSecret(request);
  if (!provided || provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // no body provided
  }

  const parsed = aggregateTrendsSchema.safeParse({
    ...(typeof body === "object" && body ? body : {}),
    triggeredBy: "cron:nightly",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const job = await enqueueAggregateTrends(parsed.data);
  const supabase = createSupabaseAdminClient();
  const { data: jobRun, error } = await supabase
    .from("job_run")
    .insert({
      bullmq_job_id: String(job.id),
      queue: queueNames.aggregate,
      type: jobNames.aggregateTrends,
      status: "queued",
      progress: 0,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "job_run_insert_failed" }, { status: 500 });
  }

  return NextResponse.json({ jobId: job.id, jobRunId: jobRun?.id, status: "queued" });
}
