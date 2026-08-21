import { createClient } from "@/lib/supabase/server";
import { CustomersView } from "@/components/customers/customers-view";

export default async function CustomersPage() {
  const supabase = await createClient();

  const [{ data: customers }, { data: opportunities }] = await Promise.all([
    supabase.from("customers").select("*, loads:loads(revenue)").order("name"),
    supabase
      .from("opportunities")
      .select("*, customer:customers(id, name)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <CustomersView
      customers={(customers ?? []) as never}
      opportunities={(opportunities ?? []) as never}
    />
  );
}
