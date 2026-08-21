"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, Building2, Users, Loader2 } from "lucide-react";

interface SearchResult {
  type: "load" | "carrier" | "customer";
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

const ICON = { load: Package, carrier: Building2, customer: Users };

export function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResults(data.results ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function go(result: SearchResult) {
    router.push(result.href);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} className="relative max-w-md flex-1">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search loads, carriers, customers…"
          className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {results.length === 0 && !loading && (
            <p className="p-3 text-sm text-muted-foreground">No matches for &quot;{query}&quot;</p>
          )}
          {results.map((r) => {
            const Icon = ICON[r.type];
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => go(r)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-accent"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{r.sublabel}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
