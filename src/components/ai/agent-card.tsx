"use client";

import { useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { setAgentEnabled, setAgentAutonomyLevel } from "@/app/(app)/ai/actions";
import type { AiAgent } from "@/lib/types/database";

const LEVEL_LABEL: Record<number, string> = {
  0: "Human only",
  1: "AI insight",
  2: "AI recommendation",
  3: "Executes after approval",
};

export function AgentCard({ agent }: { agent: AiAgent }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Card>
      <CardContent className="space-y-3 pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">{agent.name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{agent.description}</p>
          </div>
          <button
            role="switch"
            aria-checked={agent.enabled}
            disabled={isPending}
            onClick={() => startTransition(() => setAgentEnabled(agent.id, !agent.enabled))}
            className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${agent.enabled ? "bg-accent-teal" : "bg-muted"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${agent.enabled ? "translate-x-4" : "translate-x-0.5"}`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant={agent.enabled ? "accent" : "neutral"}>{LEVEL_LABEL[agent.autonomy_level]}</Badge>
          <select
            value={agent.autonomy_level}
            disabled={isPending || !agent.enabled}
            onChange={(e) =>
              startTransition(() => setAgentAutonomyLevel(agent.id, Number(e.target.value) as 0 | 1 | 2 | 3))
            }
            className="h-7 rounded-md border border-border bg-background px-1.5 text-xs outline-none disabled:opacity-50"
          >
            {[0, 1, 2, 3].map((lvl) => (
              <option key={lvl} value={lvl}>
                Level {lvl}
              </option>
            ))}
          </select>
        </div>
      </CardContent>
    </Card>
  );
}
