"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { useTransition } from "react";
import { updateExceptionStatus } from "@/app/(app)/dashboard/actions";
import type { ExceptionRow, Load } from "@/lib/types/database";

const CATEGORY_LABEL: Record<string, string> = {
  carrier_cancellation: "Carrier cancellation",
  late_pickup: "Late pickup risk",
  low_margin: "Low margin",
  missing_documents: "Missing documents",
  other: "Other",
};

export function ExceptionQueue({
  exceptions,
  readOnly = false,
  limit,
}: {
  exceptions: (ExceptionRow & { load: Pick<Load, "load_number" | "origin_summary" | "destination_summary"> | null })[];
  readOnly?: boolean;
  limit?: number;
}) {
  const visible = limit ? exceptions.slice(0, limit) : exceptions;
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exception Queue</CardTitle>
        <CardDescription>{exceptions.length} open exceptions requiring attention</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {visible.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">No open exceptions. Fleet is running clean.</p>
        )}
        {visible.map((exc) => (
          <div
            key={exc.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"
          >
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
                <span className="truncate text-xs font-medium text-muted-foreground">
                  {exc.load?.load_number ?? "—"}
                </span>
              </div>
              <p className="mt-1.5 text-sm font-medium">{CATEGORY_LABEL[exc.category]}</p>
              <p className="truncate text-xs text-muted-foreground">{exc.issue_summary}</p>
              {exc.load && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {exc.load.origin_summary} → {exc.load.destination_summary}
                </p>
              )}
            </div>
            {!readOnly && (
              <div className="flex shrink-0 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => startTransition(() => updateExceptionStatus(exc.id, "acknowledged"))}
                >
                  Ack
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  onClick={() => startTransition(() => updateExceptionStatus(exc.id, "dismissed"))}
                >
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
