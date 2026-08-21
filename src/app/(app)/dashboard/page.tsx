import { createClient } from "@/lib/supabase/server";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RevenueMarginChart, type RevenueMarginPoint } from "@/components/dashboard/revenue-margin-chart";
import { ExceptionQueue } from "@/components/dashboard/exception-queue";
import { AiRecommendations } from "@/components/dashboard/ai-recommendations";
import { OpsMapLoader } from "@/components/dashboard/ops-map-loader";
import { formatCurrency, formatPercent } from "@/lib/utils";
import type { Load, ExceptionRow, LoadStop, AiRecommendation } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: loads }, { data: exceptions }, { data: stops }, { data: trucks }, { data: recommendations }] =
    await Promise.all([
      supabase.from("loads").select("*").order("created_at", { ascending: false }),
      supabase
        .from("exceptions")
        .select("*, load:loads(load_number, origin_summary, destination_summary)")
        .eq("status", "open")
        .order("detected_at", { ascending: false }),
      supabase.from("load_stops").select("*").not("lat", "is", null),
      supabase.from("trucks").select("*"),
      supabase.from("ai_recommendations").select("*").eq("status", "pending").order("created_at", { ascending: false }),
    ]);

  const allLoads = (loads ?? []) as Load[];
  const activeLoads = allLoads.filter((l) => !["delivered", "cancelled"].includes(l.status));
  const atRiskLoads = allLoads.filter((l) => l.risk_level !== "ok");
  const availableTrucks = (trucks ?? []).filter((t) => t.status === "available");

  const today = new Date().toDateString();
  const revenueToday = allLoads
    .filter((l) => new Date(l.created_at).toDateString() === today)
    .reduce((sum, l) => sum + Number(l.revenue), 0);

  const totalRevenue = allLoads.reduce((sum, l) => sum + Number(l.revenue), 0);
  const totalMargin = allLoads.reduce((sum, l) => sum + Number(l.margin), 0);
  const marginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

  const byDay = new Map<string, { revenue: number; margin: number }>();
  for (const l of allLoads) {
    const day = new Date(l.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const entry = byDay.get(day) ?? { revenue: 0, margin: 0 };
    entry.revenue += Number(l.revenue);
    entry.margin += Number(l.margin);
    byDay.set(day, entry);
  }
  const chartData: RevenueMarginPoint[] = Array.from(byDay.entries())
    .map(([date, v]) => ({ date, ...v }))
    .slice(-14);

  const mapStops = (stops ?? [])
    .filter((s): s is LoadStop & { lat: number; lng: number } => s.lat != null && s.lng != null)
    .map((s) => {
      const load = allLoads.find((l) => l.id === s.load_id);
      return {
        id: s.id,
        lat: s.lat,
        lng: s.lng,
        label: `${load?.load_number ?? "Load"} — ${s.city ?? ""}`,
        status: (load?.risk_level ?? "ok") as "ok" | "warning" | "critical",
        type: s.stop_type,
      };
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground">Real-time view of your freight operations</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard label="Active Loads" value={String(activeLoads.length)} changePct={12} changeDirection="up" />
        <KpiCard
          label="At Risk Loads"
          value={String(atRiskLoads.length)}
          changePct={4}
          changeDirection="down"
          goodDirection="down"
        />
        <KpiCard label="Revenue Today" value={formatCurrency(revenueToday)} changePct={18} changeDirection="up" />
        <KpiCard label="Margin" value={formatPercent(marginPct)} changePct={2.3} changeDirection="up" />
        <KpiCard
          label="Available Trucks"
          value={String(availableTrucks.length)}
          changePct={3}
          changeDirection="down"
          goodDirection="up"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RevenueMarginChart data={chartData} />
        <ExceptionQueue exceptions={(exceptions ?? []) as never} />
        <OpsMapLoader stops={mapStops} />
        <AiRecommendations initial={(recommendations ?? []) as AiRecommendation[]} />
      </div>
    </div>
  );
}
