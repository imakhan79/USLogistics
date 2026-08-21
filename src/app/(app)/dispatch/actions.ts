"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { LoadStatus } from "@/lib/types/database";

export async function updateLoadStatus(loadId: string, status: LoadStatus) {
  const supabase = await createClient();
  const { data: current } = await supabase.from("loads").select("status, tenant_id").eq("id", loadId).single();
  if (!current) return;

  await supabase.from("loads").update({ status }).eq("id", loadId);
  await supabase.from("load_status_history").insert({
    tenant_id: current.tenant_id,
    load_id: loadId,
    from_status: current.status,
    to_status: status,
  });
  revalidatePath("/dispatch");
  revalidatePath(`/loads/${loadId}`);
}

export async function createLoad(input: {
  loadNumber: string;
  customerId: string | null;
  originSummary: string;
  destinationSummary: string;
  equipmentType: string;
  commodity: string;
  revenue: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data: profile } = await supabase.from("profiles").select("tenant_id").eq("id", user.id).single();
  if (!profile) return { error: "no tenant" };

  const { error } = await supabase.from("loads").insert({
    tenant_id: profile.tenant_id,
    load_number: input.loadNumber,
    customer_id: input.customerId,
    origin_summary: input.originSummary,
    destination_summary: input.destinationSummary,
    equipment_type: input.equipmentType,
    commodity: input.commodity,
    revenue: input.revenue,
    status: "booked",
  });

  if (error) return { error: error.message };

  revalidatePath("/dispatch");
  return { error: null };
}
