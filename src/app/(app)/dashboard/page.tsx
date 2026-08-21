import { createClient } from "@/lib/supabase/server";
import { OwnerDashboard } from "@/components/dashboard/owner-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { DispatcherDashboard } from "@/components/dashboard/dispatcher-dashboard";
import { DriverDashboard } from "@/components/dashboard/driver-dashboard";
import { ViewerDashboard } from "@/components/dashboard/viewer-dashboard";
import type { RevenueMarginPoint } from "@/components/dashboard/revenue-margin-chart";
import type { DashboardData } from "@/components/dashboard/dashboard-data";
import type { Load, LoadStop } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

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
  const availableTrucksCount = (trucks ?? []).filter((t) => t.status === "available").length;

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

  const data: DashboardData = {
    allLoads,
    activeLoads,
    atRiskLoads,
    availableTrucksCount,
    revenueToday,
    marginPct,
    chartData,
    mapStops,
    exceptions: (exceptions ?? []) as DashboardData["exceptions"],
    recommendations: recommendations ?? [],
  };

  switch (profile?.role) {
    case "admin":
      return <AdminDashboard data={data} />;
    case "dispatcher":
      return <DispatcherDashboard data={data} />;
    case "driver":
      return <DriverDashboard data={data} />;
    case "viewer":
      return <ViewerDashboard data={data} />;
    case "owner":
    default:
      return <OwnerDashboard data={data} />;
  }
}
