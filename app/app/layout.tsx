import { redirect } from "next/navigation";
import { getUserServer } from "@/lib/supabase/session";
import UserMenu from "@/components/user-menu";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserServer();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">
              Maverick
            </p>
            <h1 className="text-lg font-semibold text-zinc-900">Dashboard</h1>
          </div>
          <UserMenu email={user.email} />
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
