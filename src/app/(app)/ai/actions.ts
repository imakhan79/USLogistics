"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function setAgentEnabled(agentId: string, enabled: boolean) {
  const supabase = await createClient();
  await supabase.from("ai_agents").update({ enabled }).eq("id", agentId);
  revalidatePath("/ai");
}

export async function setAgentAutonomyLevel(agentId: string, level: 0 | 1 | 2 | 3) {
  const supabase = await createClient();
  await supabase.from("ai_agents").update({ autonomy_level: level }).eq("id", agentId);
  revalidatePath("/ai");
}
