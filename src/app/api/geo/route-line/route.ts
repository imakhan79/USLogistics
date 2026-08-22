import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getRouteGeometry } from "@/lib/geo/geoapify";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { stops } = (await req.json()) as { stops?: { lat: number; lng: number }[] };
  if (!stops || stops.length < 2) {
    return NextResponse.json({ error: "at least 2 stops with lat/lng are required" }, { status: 400 });
  }

  try {
    const path = await getRouteGeometry(stops.map((s) => ({ lat: s.lat, lon: s.lng })));
    return NextResponse.json({ path });
  } catch (err) {
    console.error("Geoapify route geometry lookup failed:", err);
    const message = err instanceof Error ? err.message : "route lookup failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
