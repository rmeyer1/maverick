"use client";

import { useState, type PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface UserMenuProps {
  email?: string | null;
}

export default function UserMenu({ email }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 shadow-sm"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        {email ?? "Account"}
      </button>
      {open ? (
        <MenuPanel>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">
            Signed in
          </p>
          <p className="text-sm text-zinc-700">{email ?? "Unknown"}</p>
          <button
            className="mt-4 w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
            onClick={handleSignOut}
            type="button"
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out..." : "Sign out"}
          </button>
        </MenuPanel>
      ) : null}
    </div>
  );
}

function MenuPanel({ children }: PropsWithChildren) {
  return (
    <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg">
      {children}
    </div>
  );
}
