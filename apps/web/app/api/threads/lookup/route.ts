import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@maverick/db";

const bodySchema = z.object({
  redditId: z.string(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("thread")
    .select("id")
    .eq("reddit_id", parsed.data.redditId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "thread_lookup_failed" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ threadId: data.id });
}
