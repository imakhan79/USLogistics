"use client";

import { Bell, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GlobalSearch } from "@/components/layout/global-search";
import { UserMenu } from "@/components/layout/user-menu";
import type { Profile, Tenant } from "@/lib/types/database";

export function Topbar({ profile, tenant }: { profile: Profile | null; tenant: Tenant | null }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="flex h-16 items-center gap-4 border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      <GlobalSearch />

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
        {tenant?.name ?? "Loading tenant…"}
      </div>

      <button
        aria-label="Toggle theme"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-lg text-muted-foreground transition-colors hover:bg-accent"
      >
        <AnimatePresence mode="wait" initial={false}>
          {mounted && theme === "dark" ? (
            <motion.span
              key="sun"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex"
            >
              <Sun className="h-4 w-4" />
            </motion.span>
          ) : (
            <motion.span
              key="moon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex"
            >
              <Moon className="h-4 w-4" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <button
        aria-label="Notifications"
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent"
      >
        <Bell className="h-4 w-4" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
      </button>

      <UserMenu profile={profile} />
    </header>
  );
}
