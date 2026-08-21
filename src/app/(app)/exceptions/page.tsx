import { createClient } from "@/lib/supabase/server";
import { ExceptionCenter } from "@/components/exceptions/exception-center";

export default async function ExceptionsPage() {
  const supabase = await createClient();

  const [{ data: exceptions }, { data: recommendations }] = await Promise.all([
    supabase
      .from("exceptions")
      .select("*, load:loads(load_number, origin_summary, destination_summary)")
      .eq("status", "open")
      .order("detected_at", { ascending: false }),
    supabase.from("ai_recommendations").select("*").eq("status", "pending"),
  ]);

  return (
    <ExceptionCenter
      exceptions={(exceptions ?? []) as never}
      recommendations={recommendations ?? []}
    />
  );
}
