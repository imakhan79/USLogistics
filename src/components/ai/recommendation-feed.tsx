"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateRecommendationStatus } from "@/app/(app)/dashboard/actions";
import type { AiRecommendation } from "@/lib/types/database";

const FILTERS = ["pending", "approved", "dismissed", "all"] as const;

export function RecommendationFeed({ recommendations }: { recommendations: AiRecommendation[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [isPending, startTransition] = useTransition();
  const [overrides, setOverrides] = useState<Record<string, "approved" | "dismissed">>({});

  const visible = recommendations
    .map((r) => (overrides[r.id] ? { ...r, status: overrides[r.id] } : r))
    .filter((r) => filter === "all" || r.status === filter);

  function act(id: string, status: "approved" | "dismissed") {
    setOverrides((prev) => ({ ...prev, [id]: status }));
    startTransition(() => updateRecommendationStatus(id, status));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Recommendation Feed</CardTitle>
          <CardDescription>Every AI action across your fleet</CardDescription>
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                filter === f ? "border-accent-teal bg-accent-teal/15 text-accent-teal" : "border-border text-muted-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {visible.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Nothing in this filter.</p>
        )}
        {visible.map((rec) => (
          <div key={rec.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="accent">{rec.action_type.replace("_", " ")}</Badge>
                <Badge variant={rec.status === "approved" ? "success" : rec.status === "dismissed" ? "neutral" : "warning"}>
                  {rec.status}
                </Badge>
              </div>
              {rec.confidence_score != null && (
                <span className="text-xs text-muted-foreground">{Math.round(rec.confidence_score * 100)}% confidence</span>
              )}
            </div>
            <p className="mt-2 text-sm">{rec.recommendation_text}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {rec.estimated_cost != null && <span>Est. cost ${rec.estimated_cost.toLocaleString()}</span>}
              {rec.estimated_delay_minutes != null && <span>Est. delay {rec.estimated_delay_minutes}m</span>}
              <span>{new Date(rec.created_at).toLocaleString("en-US")}</span>
            </div>
            {rec.status === "pending" && (
              <div className="mt-2 flex gap-2">
                <Button size="sm" disabled={isPending} onClick={() => act(rec.id, "approved")}>
                  Approve
                </Button>
                <Button size="sm" variant="ghost" disabled={isPending} onClick={() => act(rec.id, "dismissed")}>
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
