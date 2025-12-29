import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@maverick/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: jobById, error: idError } = await supabase
    .from("job_run")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (idError) {
    return NextResponse.json({ error: "job_lookup_failed" }, { status: 500 });
  }

  if (jobById) {
    return NextResponse.json(jobById);
  }

  const { data: jobByBullmq, error: bullmqError } = await supabase
    .from("job_run")
    .select("*")
    .eq("bullmq_job_id", id)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (bullmqError) {
    return NextResponse.json({ error: "job_lookup_failed" }, { status: 500 });
  }

  if (!jobByBullmq) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(jobByBullmq);
}
