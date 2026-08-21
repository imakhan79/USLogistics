import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueMarginChart } from "@/components/dashboard/revenue-margin-chart";
import { ExceptionQueue } from "@/components/dashboard/exception-queue";
import { AiRecommendations } from "@/components/dashboard/ai-recommendations";
import { OpsMapLoader } from "@/components/dashboard/ops-map-loader";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { DashboardData } from "@/components/dashboard/dashboard-data";

export function OwnerDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground">Company-wide view of every load, carrier, and dollar in motion</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Active Loads" value={String(data.activeLoads.length)} changePct={12} changeDirection="up" />
        <KpiCard
          label="At Risk Loads"
          value={String(data.atRiskLoads.length)}
          changePct={4}
          changeDirection="down"
          goodDirection="down"
        />
        <KpiCard label="Revenue Today" value={formatCurrency(data.revenueToday)} changePct={18} changeDirection="up" />
        <KpiCard label="Margin" value={formatPercent(data.marginPct)} changePct={2.3} changeDirection="up" />
        <KpiCard
          label="Available Trucks"
          value={String(data.availableTrucksCount)}
          changePct={3}
          changeDirection="down"
          goodDirection="up"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueMarginChart data={data.chartData} />
        <ExceptionQueue exceptions={data.exceptions} />
        <OpsMapLoader stops={data.mapStops} />
        <AiRecommendations initial={data.recommendations} />
      </div>
    </div>
  );
}
