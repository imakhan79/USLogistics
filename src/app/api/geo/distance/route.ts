import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateDistanceMiles } from "@/lib/geo/geoapify";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { origin, destination } = (await req.json()) as { origin?: string; destination?: string };
  if (!origin?.trim() || !destination?.trim()) {
    return NextResponse.json({ error: "origin and destination are required" }, { status: 400 });
  }

  try {
    const miles = await calculateDistanceMiles(origin, destination);
    return NextResponse.json({ miles });
  } catch (err) {
    console.error("Geoapify distance lookup failed:", err, (err as { cause?: unknown })?.cause);
    const message = err instanceof Error ? err.message : "distance calculation failed";
    const cause = err instanceof Error && err.cause ? ` (${String(err.cause)})` : "";
    return NextResponse.json({ error: message + cause }, { status: 502 });
  }
}
