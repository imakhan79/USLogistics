import type { Load } from "@/lib/types/database";

// Baseline carrier cost per mile by equipment type. Placeholder market rates —
// swap for a real rate index / historical carrier-cost feed when available.
const COST_PER_MILE: Record<string, number> = {
  "Dry Van": 1.75,
  Reefer: 2.05,
  Flatbed: 1.95,
  "Step Deck": 2.1,
  "Power Only": 1.6,
};
const DEFAULT_COST_PER_MILE = 1.85;
const FUEL_PER_MILE = 0.45;
const DEFAULT_TARGET_MARGIN_PCT = 20;
const MINIMUM_MARGIN_PCT = 10;

export interface QuoteEstimateInput {
  originSummary: string;
  destinationSummary: string;
  equipmentType: string;
  miles: number;
  deadheadMiles: number;
  accessorialCost: number;
  otherCost: number;
  targetMarginPct?: number;
}

export interface LaneHistoryPoint {
  loadNumber: string;
  revenue: number;
  marginPct: number;
}

export interface QuoteEstimate {
  carrierCostEstimate: number;
  fuelCostEstimate: number;
  deadheadCostEstimate: number;
  accessorialCostEstimate: number;
  otherCostEstimate: number;
  totalCostEstimate: number;
  recommendedRate: number;
  minimumRate: number;
  expectedMargin: number;
  riskScore: number;
  laneHistory: LaneHistoryPoint[];
}

export function findLaneHistory(loads: Load[], originSummary: string, destinationSummary: string): LaneHistoryPoint[] {
  const norm = (s: string) => s.trim().toLowerCase();
  return loads
    .filter((l) => norm(l.origin_summary ?? "") === norm(originSummary) && norm(l.destination_summary ?? "") === norm(destinationSummary))
    .map((l) => ({
      loadNumber: l.load_number,
      revenue: Number(l.revenue),
      marginPct: Number(l.revenue) > 0 ? (Number(l.margin) / Number(l.revenue)) * 100 : 0,
    }));
}

export function calculateQuoteEstimate(input: QuoteEstimateInput, laneHistory: LaneHistoryPoint[]): QuoteEstimate {
  const costPerMile = COST_PER_MILE[input.equipmentType] ?? DEFAULT_COST_PER_MILE;
  const targetMarginPct = input.targetMarginPct ?? DEFAULT_TARGET_MARGIN_PCT;

  const carrierCostEstimate = round2(input.miles * costPerMile);
  const fuelCostEstimate = round2(input.miles * FUEL_PER_MILE);
  const deadheadCostEstimate = round2(input.deadheadMiles * costPerMile);
  const accessorialCostEstimate = round2(input.accessorialCost);
  const otherCostEstimate = round2(input.otherCost);
  const totalCost = carrierCostEstimate + fuelCostEstimate + deadheadCostEstimate + accessorialCostEstimate + otherCostEstimate;

  // Blend the cost-plus-margin rate with the historical lane average, when we have data,
  // so a lane we've actually hauled before pulls the recommendation toward reality.
  const costPlusRate = totalCost / (1 - targetMarginPct / 100);
  const laneAvgRevenue = laneHistory.length > 0 ? laneHistory.reduce((s, l) => s + l.revenue, 0) / laneHistory.length : null;
  const recommendedRate = round2(laneAvgRevenue != null ? costPlusRate * 0.6 + laneAvgRevenue * 0.4 : costPlusRate);
  const minimumRate = round2(totalCost / (1 - MINIMUM_MARGIN_PCT / 100));
  const expectedMargin = round2(recommendedRate - totalCost);

  // Risk rises with thinner data on the lane and with a longer deadhead relative to the haul.
  let riskScore = laneHistory.length === 0 ? 55 : laneHistory.length < 3 ? 35 : 15;
  const deadheadRatio = input.miles > 0 ? input.deadheadMiles / input.miles : 0;
  riskScore += Math.min(25, Math.round(deadheadRatio * 100));
  riskScore = Math.max(0, Math.min(100, riskScore));

  return {
    carrierCostEstimate,
    fuelCostEstimate,
    deadheadCostEstimate,
    accessorialCostEstimate,
    otherCostEstimate,
    totalCostEstimate: round2(totalCost),
    recommendedRate,
    minimumRate,
    expectedMargin,
    riskScore,
    laneHistory,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
