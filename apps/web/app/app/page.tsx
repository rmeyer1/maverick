import { getUserServer } from "@/lib/supabase/session";

export default async function AppPage() {
  const user = await getUserServer();

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-semibold text-zinc-900">
          Welcome back{user?.email ? `, ${user.email}` : ""}.
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          This is the protected workspace. Add your next steps for ingestion and
          extraction here.
        </p>
      </header>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Ingestion</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Queue Reddit threads for analysis and monitor job progress.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">Extraction</h3>
          <p className="mt-2 text-sm text-zinc-600">
            Review structured signals and surface trends across subreddits.
          </p>
        </div>
      </section>
    </div>
  );
}
