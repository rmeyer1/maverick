import { NextResponse } from "next/server";
import { enqueueIngestThread, ingestThreadSchema } from "@maverick/jobs";
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

  return NextResponse.json(
    { jobId: job.id, status: "queued" },
    {
      headers: {
        "x-ratelimit-remaining": String(remaining),
        "x-ratelimit-reset": String(resetAt),
      },
    }
  );
}
