"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateExceptionStatus(
  exceptionId: string,
  status: "acknowledged" | "resolved" | "dismissed",
) {
  const supabase = await createClient();
  await supabase
    .from("exceptions")
    .update({ status, resolved_at: status === "resolved" ? new Date().toISOString() : null })
    .eq("id", exceptionId);
  revalidatePath("/dashboard");
}

export async function updateRecommendationStatus(
  recommendationId: string,
  status: "approved" | "dismissed",
) {
  const supabase = await createClient();
  await supabase.from("ai_recommendations").update({ status }).eq("id", recommendationId);
  revalidatePath("/dashboard");
}
