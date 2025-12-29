import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeRedditThread } from "@maverick/shared";

const bodySchema = z.object({
  url: z.string().url(),
});

const allowedHosts = new Set([
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "new.reddit.com",
  "redd.it",
]);

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

  const url = new URL(parsed.data.url);
  if (!allowedHosts.has(url.hostname)) {
    return NextResponse.json({ error: "invalid_host" }, { status: 400 });
  }

  const jsonUrl = buildJsonUrl(url);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Number(process.env.REDDIT_FETCH_TIMEOUT_MS ?? 8000)
    );

    const response = await fetch(jsonUrl, {
      headers: {
        "User-Agent": "maverick/0.1",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: "reddit_fetch_failed", status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    const normalized = normalizeRedditThread(data);

    return NextResponse.json(normalized);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "reddit_fetch_error", message },
      { status: 502 }
    );
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
