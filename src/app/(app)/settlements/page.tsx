import { createClient } from "@/lib/supabase/server";
import { SettlementsView } from "@/components/settlements/settlements-view";

export default async function SettlementsPage() {
  const supabase = await createClient();

  const [{ data: settlements }, { data: drivers }] = await Promise.all([
    supabase.from("settlements").select("*, driver:drivers(name)").order("created_at", { ascending: false }),
    supabase.from("drivers").select("id, name, pay_type, pay_rate").order("name"),
  ]);

  return <SettlementsView settlements={(settlements ?? []) as never} drivers={drivers ?? []} />;
}
