"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Loader2 } from "lucide-react";
import { updateRecommendationStatus } from "@/app/(app)/dashboard/actions";
import type { AiRecommendation } from "@/lib/types/database";

export function AiRecommendations({
  initial,
  readOnly = false,
  autoFetch = true,
}: {
  initial: AiRecommendation[];
  readOnly?: boolean;
  autoFetch?: boolean;
}) {
  const [recs, setRecs] = useState<AiRecommendation[]>(initial);
  const [loading, setLoading] = useState(autoFetch && initial.length === 0);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!autoFetch || initial.length > 0) return;
    fetch("/api/ai/recommendations", { method: "POST" })
      .then((r) => r.json())
      .then((data) => setRecs(data.recommendations ?? []))
      .catch(() => setRecs([]))
      .finally(() => setLoading(false));
  }, [initial.length, autoFetch]);

  function act(id: string, status: "approved" | "dismissed") {
    setRecs((prev) => prev.filter((r) => r.id !== id));
    startTransition(() => updateRecommendationStatus(id, status));
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-1.5">
            <Bot className="h-4 w-4 text-accent-teal" /> AI Recommendations
          </CardTitle>
          <CardDescription>Gemini-generated actions for at-risk loads</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing operations…
          </div>
        )}
        {!loading && recs.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No recommendations right now.</p>
        )}
        {recs.map((rec) => (
          <div key={rec.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="accent">{rec.action_type.replace("_", " ")}</Badge>
              {rec.confidence_score != null && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(rec.confidence_score * 100)}% confidence
                </span>
              )}
            </div>
            <p className="mt-2 text-sm">{rec.recommendation_text}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {rec.estimated_cost != null && <span>Est. cost ${rec.estimated_cost.toLocaleString()}</span>}
              {rec.estimated_delay_minutes != null && <span>Est. delay {rec.estimated_delay_minutes}m</span>}
            </div>
            {!readOnly && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" disabled={isPending} onClick={() => act(rec.id, "approved")}>
                  Assign
                </Button>
                <Button size="sm" variant="outline" disabled={isPending} onClick={() => act(rec.id, "approved")}>
                  Review
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
