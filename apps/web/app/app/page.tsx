import Link from "next/link";
import { getUserServer } from "@/lib/supabase/session";

export default async function AppPage() {
  const user = await getUserServer();

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="space-y-3 sm:space-y-6">
        <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Signal Summary
              </p>
              <h2 className="text-lg font-semibold text-zinc-900">
                Market signals are moving.
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Weekly pulse for Reddit demand, intent, and momentum.
              </p>
            </div>
            <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-500">
              7-day view
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-3 text-center sm:p-4">
              <p className="text-2xl font-bold text-zinc-900">12</p>
              <p className="text-xs text-zinc-500">Rising pains</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-3 text-center sm:p-4">
              <p className="text-2xl font-bold text-zinc-900">7</p>
              <p className="text-xs text-zinc-500">Intent spikes</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-3 text-center sm:p-4">
              <p className="text-2xl font-bold text-zinc-900">18</p>
              <p className="text-xs text-zinc-500">Entities rising</p>
            </div>
          </div>
        </div>

        <Link
          href="/app/new"
          className="flex w-full items-center justify-between rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
        >
          <span>Analyze thread</span>
          <span className="text-base">→</span>
        </Link>

        <div className="grid gap-2 sm:grid-cols-3 sm:gap-4">
          {[
            {
              label: "Trends",
              detail: "What’s rising",
              href: "/app/trends",
            },
            {
              label: "History",
              detail: "Past runs",
              href: "/app/history",
            },
            {
              label: "Jobs",
              detail: "Queue status",
              href: "/app/jobs",
            },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
            >
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.detail}</p>
              </div>
              <span className="text-base text-zinc-400 transition group-hover:text-zinc-700">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:gap-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Rising problems</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Emerging pain points with fast-growing comment velocity.
              </p>
            </div>
            <span className="text-base text-zinc-400">›</span>
          </div>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            <p>• “Pricing confusion” up 22%</p>
            <p>• “Setup friction” up 18%</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">High buying intent</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Threads showing strong intent to purchase or switch tools.
              </p>
            </div>
            <span className="text-base text-zinc-400">›</span>
          </div>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            <p>• “Looking for X alternatives” (5 threads)</p>
            <p>• “Budget approved this week” (3 threads)</p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Recent activity</h3>
              <p className="mt-1 text-sm text-zinc-600">
                Latest runs, failures, and active extractions.
              </p>
            </div>
            <span className="text-base text-zinc-400">›</span>
          </div>
          <div className="mt-3 space-y-2 text-sm text-zinc-700">
            <p>• Thread analysis completed · 2m ago</p>
            <p>• 1 job queued · waiting on worker</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-lg font-semibold">Market signals</h3>
        <p className="mt-2 text-sm text-zinc-600">
          Review structured insights and monitor momentum by theme.
        </p>
      </section>

      <p className="text-xs text-zinc-500">
        Signed in as {user?.email ?? "guest"}.
      </p>
    </div>
  );
}
