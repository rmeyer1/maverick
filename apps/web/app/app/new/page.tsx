"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const providerOptions = (process.env.NEXT_PUBLIC_LLM_PROVIDERS ?? "openai,gemini,xai,deepseek")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const modelOptions = (process.env.NEXT_PUBLIC_LLM_MODELS ?? "default")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

type NormalizedThreadResponse = {
  thread: { reddit_id: string };
};

type JobStatus = {
  status: string;
  error?: string | null;
};

export default function NewThreadPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [provider, setProvider] = useState(providerOptions[0] ?? "openai");
  const [model, setModel] = useState(modelOptions[0] ?? "default");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [extractJobId, setExtractJobId] = useState<string | null>(null);

  const isBusy = status !== "idle" && status !== "done";

  const statusLabel = useMemo(() => {
    switch (status) {
      case "validating":
        return "Validating URL";
      case "ingesting":
        return "Ingesting thread";
      case "waiting_for_thread":
        return "Waiting for thread";
      case "extracting":
        return "Extracting insights";
      case "done":
        return "Complete";
      default:
        return "Idle";
    }
  }, [status]);

  async function pollJob(id: string) {
    for (;;) {
      const response = await fetch(`/api/jobs/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch job status");
      }
      const data = (await response.json()) as JobStatus;
      if (data.status === "completed") {
        return data;
      }
      if (data.status === "failed") {
        throw new Error(data.error ?? "Job failed");
      }
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  async function lookupThread(redditId: string) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await fetch("/api/threads/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redditId }),
      });

      if (response.ok) {
        const data = (await response.json()) as { threadId: string };
        if (data.threadId) {
          return data.threadId;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    throw new Error("Thread not found after ingestion");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus("validating");

    try {
      const validateResponse = await fetch("/api/reddit/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!validateResponse.ok) {
        const errorPayload = await validateResponse.json();
        throw new Error(errorPayload?.error ?? "Invalid Reddit URL");
      }

      const normalized = (await validateResponse.json()) as NormalizedThreadResponse;
      const redditId = normalized.thread.reddit_id;
      if (!redditId) {
        throw new Error("Unable to resolve Reddit thread ID");
      }

      setStatus("ingesting");
      const ingestResponse = await fetch("/api/jobs/ingest-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadUrl: url }),
      });

      if (!ingestResponse.ok) {
        const errorPayload = await ingestResponse.json();
        throw new Error(errorPayload?.error ?? "Failed to enqueue ingest job");
      }

      const ingestPayload = await ingestResponse.json();
      const ingestJobId = String(ingestPayload.jobId);
      setJobId(ingestJobId);

      await pollJob(ingestJobId);

      setStatus("waiting_for_thread");
      const threadId = await lookupThread(redditId);

      setStatus("extracting");
      const extractResponse = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId, provider, model }),
      });

      if (!extractResponse.ok) {
        const errorPayload = await extractResponse.json();
        throw new Error(errorPayload?.error ?? "Failed to enqueue extract job");
      }

      const extractPayload = await extractResponse.json();
      const extractJobId = String(extractPayload.jobId);
      setExtractJobId(extractJobId);

      await pollJob(extractJobId);
      setStatus("done");
      router.push(`/app/thread/${threadId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setStatus("idle");
    }
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
          New Analysis
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
          Paste a Reddit thread to extract signals
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          We will ingest the thread, run extraction, and route you to the results page.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <label className="text-sm font-medium text-zinc-700" htmlFor="thread-url">
            Reddit URL
          </label>
          <input
            id="thread-url"
            type="url"
            required
            placeholder="https://www.reddit.com/r/..."
            className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:border-zinc-400 focus:outline-none"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <label className="text-sm font-medium text-zinc-700">Provider</label>
            <select
              className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
            >
              {providerOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <label className="text-sm font-medium text-zinc-700">Model</label>
            <select
              className="mt-2 w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm"
              value={model}
              onChange={(event) => setModel(event.target.value)}
            >
              {modelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-600">Status</span>
            <span className="text-sm font-medium text-zinc-900">{statusLabel}</span>
          </div>
          {jobId ? (
            <p className="text-xs text-zinc-500">Ingest job: {jobId}</p>
          ) : null}
          {extractJobId ? (
            <p className="text-xs text-zinc-500">Extract job: {extractJobId}</p>
          ) : null}
          <button
            type="submit"
            disabled={isBusy}
            className="mt-2 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            {isBusy ? "Working..." : "Run extraction"}
          </button>
        </div>
      </form>
    </div>
  );
}
