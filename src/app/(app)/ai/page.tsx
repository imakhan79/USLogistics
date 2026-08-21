import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AgentCard } from "@/components/ai/agent-card";
import { Copilot } from "@/components/ai/copilot";
import { RecommendationFeed } from "@/components/ai/recommendation-feed";
import type { AiAgent, AiRecommendation } from "@/lib/types/database";

export default async function AiCommandCenterPage() {
  const supabase = await createClient();

  const [{ data: agents }, { data: recommendations }] = await Promise.all([
    supabase.from("ai_agents").select("*").order("name"),
    supabase.from("ai_recommendations").select("*").order("created_at", { ascending: false }).limit(50),
  ]);

  const allRecs = (recommendations ?? []) as AiRecommendation[];
  const pending = allRecs.filter((r) => r.status === "pending").length;
  const approved = allRecs.filter((r) => r.status === "approved").length;
  const avgConfidence =
    allRecs.filter((r) => r.confidence_score != null).reduce((sum, r) => sum + Number(r.confidence_score), 0) /
    (allRecs.filter((r) => r.confidence_score != null).length || 1);
  const activeAgents = (agents ?? []).filter((a) => a.enabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">AI Command Center</h1>
        <p className="text-sm text-muted-foreground">Agent roster, live recommendations, and the AI Copilot</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Active Agents" value={`${activeAgents} / ${agents?.length ?? 0}`} changePct={0} changeDirection="up" />
        <KpiCard label="Pending Actions" value={String(pending)} changePct={0} changeDirection="down" goodDirection="down" />
        <KpiCard label="Approved Actions" value={String(approved)} changePct={0} changeDirection="up" />
        <KpiCard label="Avg. Confidence" value={`${Math.round(avgConfidence * 100)}%`} changePct={0} changeDirection="up" />
      </div>

      <Copilot />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Agent Roster</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Every agent tops out at Level 3 (executes only after a human approves) — no agent in this build takes
          financial or dispatch action on its own.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(agents ?? []).map((agent) => (
            <AgentCard key={agent.id} agent={agent as AiAgent} />
          ))}
        </div>
      </div>

      <RecommendationFeed recommendations={allRecs} />
    </div>
  );
}
