import { createClient } from "@/lib/supabase/server";
import { DispatchBoard } from "@/components/dispatch/dispatch-board";

export default async function DispatchPage() {
  const supabase = await createClient();

  const [{ data: loads }, { data: customers }] = await Promise.all([
    supabase
      .from("loads")
      .select("*, customer:customers(name), carrier:carriers(name), driver:drivers(name)")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
    supabase.from("customers").select("id, name").order("name"),
  ]);

  return (
    <DispatchBoard
      loads={(loads ?? []) as never}
      customers={customers ?? []}
    />
  );
}
