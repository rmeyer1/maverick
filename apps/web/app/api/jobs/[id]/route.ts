import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@maverick/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const supabase = createSupabaseAdminClient();

  const { data: jobByBullmq, error: bullmqError } = await supabase
    .from("job_run")
    .select("*")
    .eq("bullmq_job_id", id)
    .maybeSingle();

  if (bullmqError) {
    return NextResponse.json({ error: "job_lookup_failed" }, { status: 500 });
  }

  if (jobByBullmq) {
    return NextResponse.json(jobByBullmq);
  }

  const { data: jobById, error: idError } = await supabase
    .from("job_run")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (idError) {
    return NextResponse.json({ error: "job_lookup_failed" }, { status: 500 });
  }

  if (!jobById) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(jobById);
}
