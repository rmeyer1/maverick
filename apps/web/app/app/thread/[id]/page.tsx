"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

const pollIntervalMs = 2000;

type ThreadData = {
  id: string;
  title: string | null;
  author: string | null;
  url: string | null;
  created_utc: string | null;
  raw_json: Record<string, unknown> | null;
};

type CommentData = {
  author: string | null;
  body: string | null;
  score: number | null;
  created_utc: string | null;
  reddit_id: string;
  parent_reddit_id: string | null;
};

type ExtractionData = {
  provider: string | null;
  model: string | null;
  schema_version: string | null;
  prompt_version: string | null;
  status: string | null;
  extracted_json: any;
};

type ThreadResponse = {
  thread: ThreadData;
  comments: CommentData[];
  extraction: ExtractionData | null;
};

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const threadId = params?.id ?? "";
  const [data, setData] = useState<ThreadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const extraction = data?.extraction?.extracted_json ?? null;

  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout>;

    async function fetchThread() {
      try {
        if (!threadId) {
          throw new Error("Missing thread id in route.");
        }
        const response = await fetch(`/api/threads/${threadId}`);
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload?.error ?? "Failed to load thread");
        }
        const payload = (await response.json()) as ThreadResponse;
        if (!isMounted) return;
        setData(payload);
        setError(null);
        setLoading(false);

        if (!payload.extraction?.extracted_json) {
          timer = setTimeout(fetchThread, pollIntervalMs);
        }
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setLoading(false);
      }
    }

    fetchThread();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, [threadId]);

  const buyingIntent = extraction?.buying_intent ?? null;
  const painPoints = extraction?.pain_points ?? [];
  const entities = extraction?.entities ?? null;

  const intentLevelLabel = useMemo(() => {
    if (!buyingIntent?.level) return "Unknown";
    return String(buyingIntent.level).toUpperCase();
  }, [buyingIntent]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-zinc-600">Loading thread...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Thread</p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
          {data.thread.title ?? "Untitled thread"}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
          <span>Author: {data.thread.author ?? "unknown"}</span>
          <span>•</span>
          <span className="flex min-w-0 items-center gap-1">
            URL:
            {data.thread.url ? (
              <a
                href={data.thread.url}
                target="_blank"
                rel="noreferrer"
                className="truncate text-zinc-600 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-900"
                title={data.thread.url}
              >
                {data.thread.url}
              </a>
            ) : (
              <span>n/a</span>
            )}
          </span>
        </div>
      </header>

      {!extraction ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-zinc-600">Extraction in progress...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Summary</h3>
            <p className="text-sm text-zinc-700">{extraction.summary}</p>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Buying intent
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-zinc-200">
                  <div
                    className="h-2 rounded-full bg-zinc-900"
                    style={{
                      width:
                        buyingIntent?.level === "high"
                          ? "100%"
                          : buyingIntent?.level === "medium"
                          ? "66%"
                          : buyingIntent?.level === "low"
                          ? "33%"
                          : "10%",
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-zinc-700">
                  {intentLevelLabel}
                </span>
              </div>
              {buyingIntent?.signals?.length ? (
                <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-zinc-600">
                  {buyingIntent.signals.map((signal: string) => (
                    <li key={signal}>{signal}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Pain Points</h3>
            <div className="space-y-4">
              {painPoints.map((point: any, index: number) => (
                <div key={`${point.problem}-${index}`} className="rounded-2xl border border-zinc-200 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-zinc-900">{point.problem}</h4>
                    <span className="text-xs uppercase text-zinc-400">{point.severity}</span>
                  </div>
                  {point.evidence?.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-zinc-600">
                      {point.evidence.map((quote: string) => (
                        <li key={quote}>“{quote}”</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Entities</h3>
            <div className="grid gap-3 text-sm text-zinc-700">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Companies</p>
                <p>{entities?.companies?.join(", ") || "None"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Products</p>
                <p>{entities?.products?.join(", ") || "None"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Competitors</p>
                <p>{entities?.competitors?.join(", ") || "None"}</p>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Requested solutions</h3>
            <ul className="list-disc space-y-1 pl-4 text-sm text-zinc-700">
              {(extraction.requested_solutions ?? []).map((item: string) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3 className="pt-4 text-lg font-semibold">Market tags</h3>
            <div className="flex flex-wrap gap-2">
              {(extraction.market_tags ?? []).map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        </div>
      )}

      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Top comments</h3>
        <div className="mt-4 space-y-3">
          {data.comments.map((comment) => (
            <div key={comment.reddit_id} className="rounded-2xl border border-zinc-100 p-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>{comment.author ?? "unknown"}</span>
                <span>Score: {comment.score ?? 0}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-700">{comment.body ?? "[removed]"}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
