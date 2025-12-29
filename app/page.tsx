export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f5f5f4,_#e7e5e4)] text-zinc-900">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-16">
        <div className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">
            Maverick
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Reddit market radar, from ingestion to trend insight.
          </h1>
          <p className="max-w-2xl text-lg text-zinc-600">
            This starter has Next.js App Router, Tailwind CSS, and Supabase
            helpers wired so we can ship quickly.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/50 bg-white/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Health check</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Hit <span className="font-medium">/health</span> to verify the
              API is live.
            </p>
          </div>
          <div className="rounded-2xl border border-white/50 bg-white/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Supabase ready</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Configure your env vars and the Supabase client will initialize
              cleanly for browser and server.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
