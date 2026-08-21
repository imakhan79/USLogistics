"use client";

import { Search, Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { Profile, Tenant } from "@/lib/types/database";

export function Topbar({ profile, tenant }: { profile: Profile | null; tenant: Tenant | null }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-background px-6">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground max-w-md">
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search loads, carriers, customers…</span>
        <kbd className="ml-auto hidden rounded border border-border bg-background px-1.5 py-0.5 text-[10px] sm:inline">
          ⌘K
        </kbd>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {tenant?.name ?? "Loading tenant…"}
      </div>

      <button
        aria-label="Toggle theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
      >
        {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <button
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
      </button>

      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-teal text-xs font-semibold text-primary-dark">
        {(profile?.full_name ?? "U").slice(0, 1).toUpperCase()}
      </div>
    </header>
  );
}
