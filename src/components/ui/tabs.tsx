"use client";

import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

export function Tabs({
  tabs,
  defaultTab,
  children,
}: {
  tabs: { value: string; label: string }[];
  defaultTab?: string;
  children: (active: string) => ReactNode;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.value);

  return (
    <div>
      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActive(tab.value)}
            className={cn(
              "cursor-pointer border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active === tab.value
                ? "border-accent-teal text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{children(active)}</div>
    </div>
  );
}
