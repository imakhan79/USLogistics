import { KpiCard } from "@/components/dashboard/kpi-card";
import { ExceptionQueue } from "@/components/dashboard/exception-queue";
import { AiRecommendations } from "@/components/dashboard/ai-recommendations";
import { OpsMapLoader } from "@/components/dashboard/ops-map-loader";
import type { DashboardData } from "@/components/dashboard/dashboard-data";

export function DispatcherDashboard({ data }: { data: DashboardData }) {
  const uncoveredLoads = data.activeLoads.filter((l) => !l.carrier_id).length;
  const inTransit = data.allLoads.filter((l) => l.status === "in_transit").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dispatch Overview</h1>
        <p className="text-sm text-muted-foreground">What needs your attention right now</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Active Loads" value={String(data.activeLoads.length)} changePct={12} changeDirection="up" />
        <KpiCard
          label="Uncovered Loads"
          value={String(uncoveredLoads)}
          changePct={uncoveredLoads > 0 ? 8 : 0}
          changeDirection={uncoveredLoads > 0 ? "up" : "down"}
          goodDirection="down"
        />
        <KpiCard label="In Transit" value={String(inTransit)} changePct={5} changeDirection="up" />
        <KpiCard
          label="Available Trucks"
          value={String(data.availableTrucksCount)}
          changePct={3}
          changeDirection="down"
          goodDirection="up"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExceptionQueue exceptions={data.exceptions} />
        <AiRecommendations initial={data.recommendations} />
      </div>

      <OpsMapLoader stops={data.mapStops} />
    </div>
  );
}
