"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { updateExceptionStatus, updateRecommendationStatus } from "@/app/(app)/dashboard/actions";
import type { AiRecommendation, ExceptionRow, Load } from "@/lib/types/database";

type EnrichedException = ExceptionRow & {
  load: Pick<Load, "load_number" | "origin_summary" | "destination_summary"> | null;
};

const CATEGORY_LABEL: Record<string, string> = {
  carrier_cancellation: "Carrier cancellation",
  late_pickup: "Late pickup risk",
  low_margin: "Low margin",
  missing_documents: "Missing documents",
  other: "Other",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "financial", label: "Financial" },
  { key: "documents", label: "Documents" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function matchesFilter(exc: EnrichedException, filter: FilterKey) {
  if (filter === "all") return true;
  if (filter === "critical") return exc.severity === "critical";
  if (filter === "financial") return exc.category === "low_margin";
  if (filter === "documents") return exc.category === "missing_documents";
  return true;
}

export function ExceptionCenter({
  exceptions,
  recommendations,
}: {
  exceptions: EnrichedException[];
  recommendations: AiRecommendation[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = useMemo(
    () => exceptions.filter((e) => !dismissed.has(e.id) && matchesFilter(e, filter)),
    [exceptions, filter, dismissed],
  );

  function act(id: string, status: "acknowledged" | "resolved" | "dismissed") {
    setDismissed((prev) => new Set(prev).add(id));
    startTransition(() => updateExceptionStatus(id, status));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Exception Center</h1>
        <p className="text-sm text-muted-foreground">{visible.length} exceptions need review</p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key ? "border-accent-teal bg-accent-teal/15 text-accent-teal" : "border-border text-muted-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {visible.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No exceptions in this filter. Fleet is running clean.
            </CardContent>
          </Card>
        )}
        {visible.map((exc) => {
          const rec = recommendations.find((r) => r.exception_id === exc.id || r.load_id === exc.load_id);
          return (
            <Card key={exc.id}>
              <CardContent className="pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={exc.severity === "critical" ? "danger" : "warning"}>
                        {exc.severity === "critical" ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {exc.severity === "critical" ? "Critical" : "Warning"}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground">{exc.load?.load_number ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">
                        · detected {new Date(exc.detected_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold">{CATEGORY_LABEL[exc.category]}</p>
                    <p className="text-sm text-muted-foreground">{exc.issue_summary}</p>
                    {exc.load && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {exc.load.origin_summary} → {exc.load.destination_summary}
                      </p>
                    )}

                    {rec && (
                      <div className="mt-3 rounded-lg border border-accent-teal/30 bg-accent-teal/5 p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-accent-teal">AI Recommendation</span>
                          {rec.confidence_score != null && (
                            <span className="text-xs text-muted-foreground">{Math.round(rec.confidence_score * 100)}% confidence</span>
                          )}
                        </div>
                        <p className="mt-1 text-sm">{rec.recommendation_text}</p>
                        <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                          {rec.estimated_cost != null && <span>Est. cost ${rec.estimated_cost.toLocaleString()}</span>}
                          {rec.estimated_delay_minutes != null && <span>Est. delay {rec.estimated_delay_minutes}m</span>}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" disabled={isPending} onClick={() => startTransition(() => updateRecommendationStatus(rec.id, "approved"))}>
                            Approve
                          </Button>
                          <Button size="sm" variant="ghost" disabled={isPending} onClick={() => startTransition(() => updateRecommendationStatus(rec.id, "dismissed"))}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <Button size="sm" variant="outline" disabled={isPending} onClick={() => act(exc.id, "resolved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" disabled={isPending} onClick={() => act(exc.id, "dismissed")}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
