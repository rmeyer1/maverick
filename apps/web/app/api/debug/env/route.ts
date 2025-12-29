import { NextResponse } from "next/server";

export async function GET() {
  const redact = (value?: string) => {
    if (!value) return null;
    if (value.length <= 8) return "[set]";
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  };

  return NextResponse.json({
    SUPABASE_URL: process.env.SUPABASE_URL ?? null,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: redact(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    SUPABASE_SERVICE_ROLE_KEY: redact(process.env.SUPABASE_SERVICE_ROLE_KEY),
    REDIS_URL: redact(process.env.REDIS_URL),
    BULLMQ_PREFIX: process.env.BULLMQ_PREFIX ?? null,
  });
}
