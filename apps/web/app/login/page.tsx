"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f4f4f5,_#e4e4e7)] px-6 py-16" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const nextPath = useMemo(
    () => searchParams.get("next") ?? "/app",
    [searchParams]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXT_PUBLIC_VERCEL_URL ??
      window.location.origin;
    const normalizedBaseUrl = baseUrl.startsWith("http")
      ? baseUrl
      : `https://${baseUrl}`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${normalizedBaseUrl}/auth/callback?next=${encodeURIComponent(
          nextPath
        )}`,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("sent");
    setMessage("Magic link sent. Check your inbox to continue.");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f4f4f5,_#e4e4e7)] px-6 py-16">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
            Maverick
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-900">
            Sign in to your workspace
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            We use magic links for quick access. Enter your email and follow the
            link to continue.
          </p>
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Email
            <input
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-zinc-900 shadow-sm"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          <button
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Sending..." : "Send magic link"}
          </button>
        </form>
        {message ? (
          <p
            className={`text-sm ${
              status === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
