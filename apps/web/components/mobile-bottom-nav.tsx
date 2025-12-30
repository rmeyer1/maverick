"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/app", icon: "●" },
  { label: "Trends", href: "/app/trends", icon: "↗" },
  { label: "Analyze", href: "/app/new", icon: "＋" },
  { label: "History", href: "/app/history", icon: "⟳" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/app"
              ? pathname === "/app"
              : pathname?.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition ${
                isActive
                  ? "text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                  isActive ? "bg-zinc-900 text-white" : "bg-zinc-100"
                }`}
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
