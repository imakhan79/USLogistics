import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateLoadRecommendations } from "@/lib/ai/gemini";
import type { Load, ExceptionRow } from "@/lib/types/database";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ recommendations: [] });
  }

  const [{ data: atRiskLoads }, { data: openExceptions }] = await Promise.all([
    supabase
      .from("loads")
      .select("*")
      .in("risk_level", ["warning", "critical"])
      .order("risk_score", { ascending: false })
      .limit(6),
    supabase.from("exceptions").select("*").eq("status", "open").limit(6),
  ]);

  const { recommendations, model } = await generateLoadRecommendations(
    (atRiskLoads ?? []) as Load[],
    (openExceptions ?? []) as ExceptionRow[],
  );

  if (recommendations.length === 0) {
    return NextResponse.json({ recommendations: [] });
  }

  const rows = recommendations.map((rec) => ({
    tenant_id: profile.tenant_id,
    load_id: atRiskLoads?.[0]?.id ?? null,
    recommendation_text: rec.recommendation_text,
    action_type: rec.action_type,
    estimated_cost: rec.estimated_cost,
    estimated_delay_minutes: rec.estimated_delay_minutes,
    confidence_score: rec.confidence_score,
    model,
    status: "pending" as const,
  }));

  const { data: inserted, error } = await supabase.from("ai_recommendations").insert(rows).select("*");

  if (error) {
    return NextResponse.json({ recommendations: [] });
  }

  return NextResponse.json({ recommendations: inserted });
}
