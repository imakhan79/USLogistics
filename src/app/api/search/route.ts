import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ results: [] });

  const like = `%${q}%`;

  const [loads, carriers, customers] = await Promise.all([
    supabase.from("loads").select("id, load_number, origin_summary, destination_summary").or(`load_number.ilike.${like},origin_summary.ilike.${like},destination_summary.ilike.${like}`).limit(5),
    supabase.from("carriers").select("id, name").ilike("name", like).limit(5),
    supabase.from("customers").select("id, name").ilike("name", like).limit(5),
  ]);

  const results = [
    ...(loads.data ?? []).map((l) => ({
      type: "load",
      id: l.id,
      label: l.load_number,
      sublabel: `${l.origin_summary} → ${l.destination_summary}`,
      href: `/loads/${l.id}`,
    })),
    ...(carriers.data ?? []).map((c) => ({ type: "carrier", id: c.id, label: c.name, sublabel: "Carrier", href: "/carriers" })),
    ...(customers.data ?? []).map((c) => ({ type: "customer", id: c.id, label: c.name, sublabel: "Customer", href: `/customers/${c.id}` })),
  ];

  return NextResponse.json({ results });
}
