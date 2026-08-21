import type { AiRecommendation, ExceptionRow, Load } from "@/lib/types/database";
import type { RevenueMarginPoint } from "@/components/dashboard/revenue-margin-chart";
import type { MapStop } from "@/components/dashboard/ops-map";

export interface DashboardExceptionRow extends ExceptionRow {
  load: Pick<Load, "load_number" | "origin_summary" | "destination_summary"> | null;
}

export interface DashboardData {
  allLoads: Load[];
  activeLoads: Load[];
  atRiskLoads: Load[];
  availableTrucksCount: number;
  revenueToday: number;
  marginPct: number;
  chartData: RevenueMarginPoint[];
  mapStops: MapStop[];
  exceptions: DashboardExceptionRow[];
  recommendations: AiRecommendation[];
}
