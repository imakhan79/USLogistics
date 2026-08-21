"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateQuoteEstimate, findLaneHistory, type QuoteEstimateInput } from "@/lib/quoting/rate-engine";
import { explainQuoteRate } from "@/lib/ai/gemini";
import type { Load, QuoteStatus } from "@/lib/types/database";

export async function getRateRecommendation(input: QuoteEstimateInput) {
  const supabase = await createClient();
  const { data: loads } = await supabase.from("loads").select("*");
  const laneHistory = findLaneHistory((loads ?? []) as Load[], input.originSummary, input.destinationSummary);
  const estimate = calculateQuoteEstimate(input, laneHistory);

  const { rationale, model } = await explainQuoteRate({
    originSummary: input.originSummary,
    destinationSummary: input.destinationSummary,
    equipmentType: input.equipmentType,
    miles: input.miles,
    deadheadMiles: input.deadheadMiles,
    totalCostEstimate: estimate.totalCostEstimate,
    recommendedRate: estimate.recommendedRate,
    minimumRate: estimate.minimumRate,
    expectedMargin: estimate.expectedMargin,
    riskScore: estimate.riskScore,
    laneHistoryCount: laneHistory.length,
  });

  return { estimate, rationale, model };
}

export async function createQuote(input: {
  customerId: string | null;
  originSummary: string;
  destinationSummary: string;
  equipmentType: string;
  commodity: string;
  weightLbs: number | null;
  miles: number;
  deadheadMiles: number;
  accessorialCost: number;
  otherCost: number;
  targetMarginPct: number;
  carrierCostEstimate: number;
  fuelCostEstimate: number;
  deadheadCostEstimate: number;
  recommendedRate: number;
  minimumRate: number;
  riskScore: number;
  aiRationale: string;
  aiModel: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return { error: "no tenant" };

  const { count } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", profile.tenant_id);

  const quoteNumber = `Q-${1000 + (count ?? 0) + 1}`;

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      tenant_id: profile.tenant_id,
      quote_number: quoteNumber,
      customer_id: input.customerId,
      origin_summary: input.originSummary,
      destination_summary: input.destinationSummary,
      equipment_type: input.equipmentType,
      commodity: input.commodity,
      weight_lbs: input.weightLbs,
      miles: input.miles,
      deadhead_miles: input.deadheadMiles,
      carrier_cost_estimate: input.carrierCostEstimate,
      fuel_cost_estimate: input.fuelCostEstimate,
      deadhead_cost_estimate: input.deadheadCostEstimate,
      accessorial_cost_estimate: input.accessorialCost,
      other_cost_estimate: input.otherCost,
      target_margin_pct: input.targetMarginPct,
      recommended_rate: input.recommendedRate,
      minimum_rate: input.minimumRate,
      risk_score: input.riskScore,
      ai_rationale: input.aiRationale,
      ai_model: input.aiModel,
      status: "quoted",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/quotes");
  redirect(`/quotes/${data.id}`);
}

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus) {
  const supabase = await createClient();
  await supabase.from("quotes").update({ status }).eq("id", quoteId);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${quoteId}`);
}

export async function convertQuoteToLoad(quoteId: string) {
  const supabase = await createClient();
  const { data: quote } = await supabase.from("quotes").select("*").eq("id", quoteId).single();
  if (!quote) return { error: "quote not found" };

  const { count } = await supabase
    .from("loads")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", quote.tenant_id);

  const loadNumber = `LD-${1000 + (count ?? 0) + 1}`;

  const { data: load, error } = await supabase
    .from("loads")
    .insert({
      tenant_id: quote.tenant_id,
      load_number: loadNumber,
      customer_id: quote.customer_id,
      origin_summary: quote.origin_summary,
      destination_summary: quote.destination_summary,
      equipment_type: quote.equipment_type,
      commodity: quote.commodity,
      weight_lbs: quote.weight_lbs,
      revenue: quote.recommended_rate,
      carrier_cost: quote.carrier_cost_estimate + quote.deadhead_cost_estimate,
      risk_score: quote.risk_score,
      risk_level: quote.risk_score >= 50 ? "warning" : "ok",
      status: "booked",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("quotes").update({ status: "converted", converted_load_id: load.id }).eq("id", quoteId);

  revalidatePath("/quotes");
  revalidatePath("/dispatch");
  revalidatePath("/loads");
  redirect(`/loads/${load.id}`);
}
