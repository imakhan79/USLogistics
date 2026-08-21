import { createClient } from "@/lib/supabase/server";
import { QuoteBuilder } from "@/components/quotes/quote-builder";

export default async function NewQuotePage() {
  const supabase = await createClient();
  const { data: customers } = await supabase.from("customers").select("id, name").order("name");

  return <QuoteBuilder customers={customers ?? []} />;
}
