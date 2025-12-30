import { redirect } from "next/navigation";
import { getUserServer } from "@/lib/supabase/session";
import UserMenu from "@/components/user-menu";
import MobileBottomNav from "@/components/mobile-bottom-nav";

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
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400 sm:text-xs">
              Maverick
            </p>
            <h1 className="text-base font-semibold text-zinc-900 sm:text-lg">
              Dashboard
            </h1>
          </div>
          <UserMenu email={user.email} />
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24 sm:px-6 sm:py-10 sm:pb-10">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
