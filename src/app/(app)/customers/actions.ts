"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { OpportunityStage } from "@/lib/types/database";

export async function updateOpportunityStage(id: string, stage: OpportunityStage) {
  const supabase = await createClient();
  await supabase
    .from("opportunities")
    .update({ stage, probability_pct: STAGE_DEFAULT_PROBABILITY[stage] })
    .eq("id", id);
  revalidatePath("/customers");
}

const STAGE_DEFAULT_PROBABILITY: Record<OpportunityStage, number> = {
  lead: 15,
  qualified: 35,
  quoting: 55,
  negotiation: 70,
  won: 100,
  lost: 0,
};

export async function createOpportunity(input: {
  customerId: string | null;
  name: string;
  estimatedValue: number;
  expectedCloseDate: string | null;
  notes: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return { error: "no tenant" };

  const { error } = await supabase.from("opportunities").insert({
    tenant_id: profile.tenant_id,
    customer_id: input.customerId,
    name: input.name,
    estimated_value: input.estimatedValue,
    expected_close_date: input.expectedCloseDate,
    notes: input.notes || null,
    stage: "lead",
    probability_pct: STAGE_DEFAULT_PROBABILITY.lead,
  });

  if (error) return { error: error.message };
  revalidatePath("/customers");
  return { error: null };
}

export async function addCustomerNote(customerId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return { error: "no tenant" };

  const { error } = await supabase.from("communications").insert({
    tenant_id: profile.tenant_id,
    customer_id: customerId,
    type: "note",
    subject: "Note",
    body,
    from_user_id: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath(`/customers/${customerId}`);
  return { error: null };
}
