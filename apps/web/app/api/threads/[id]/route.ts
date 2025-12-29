import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@maverick/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseAdminClient();

  const { id } = await params;

  const { data: thread, error: threadError } = await supabase
    .from("thread")
    .select("id,title,author,url,created_utc,raw_json")
    .eq("id", id)
    .single();

  if (threadError || !thread) {
    return NextResponse.json({ error: "thread_not_found" }, { status: 404 });
  }

  const { data: extraction } = await supabase
    .from("extraction")
    .select(
      "provider,model,prompt_version,schema_version,status,extracted_json,created_at"
    )
    .eq("thread_id", params.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: comments } = await supabase
    .from("comment")
    .select("author,body,score,created_utc,reddit_id,parent_reddit_id")
    .eq("thread_id", params.id)
    .order("score", { ascending: false, nullsFirst: false })
    .limit(20);

  return NextResponse.json({
    thread,
    comments: comments ?? [],
    extraction: extraction ?? null,
  });
}
